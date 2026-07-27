"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SOURCE_LABEL, detectSourceFromUrl } from "@/lib/stages";
import BookmarkletBox from "@/components/BookmarkletBox";

type BulkResult = { url: string; status: "pending" | "done" | "error"; message?: string; applicationId?: string };

function SingleAddForm({ initialUrl, initialSource }: { initialUrl: string; initialSource: string }) {
  const router = useRouter();
  const [sourceUrl, setSourceUrl] = useState(initialUrl);
  const [rawInput, setRawInput] = useState("");
  const [source, setSource] = useState(initialSource);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sourceUrl.trim() && !rawInput.trim()) {
      setError("Paste a job URL or the listing text.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceUrl: sourceUrl.trim() || undefined,
        rawInput: rawInput.trim() || sourceUrl.trim(),
        source,
      }),
    });
    setLoading(false);
    if (res.ok) {
      const { application } = await res.json();
      router.push(`/applications/${application.id}`);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Something went wrong");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs text-secondary">Job posting URL (optional)</label>
        <input
          value={sourceUrl}
          onChange={(e) => {
            setSourceUrl(e.target.value);
            setSource(detectSourceFromUrl(e.target.value));
          }}
          placeholder="https://..."
          className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-white/25"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs text-secondary">Listing text (paste it if the URL can&apos;t be fetched)</label>
        <textarea
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          rows={8}
          placeholder="Paste the job description here..."
          className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-white/25"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs text-secondary">Source</label>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-white/25"
        >
          {Object.entries(SOURCE_LABEL).map(([value, label]) => (
            <option key={value} value={value} className="bg-[#121022]">
              {label}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 py-2.5 text-sm font-medium disabled:opacity-50"
      >
        {loading ? "Extracting & drafting..." : "Add to pipeline"}
      </button>
    </form>
  );
}

function BulkAddForm() {
  const [urlsText, setUrlsText] = useState("");
  const [results, setResults] = useState<BulkResult[] | null>(null);
  const [running, setRunning] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const urls = [...new Set(urlsText.split("\n").map((u) => u.trim()).filter(Boolean))];
    if (urls.length === 0) return;

    setRunning(true);
    setResults(urls.map((url) => ({ url, status: "pending" })));

    for (const url of urls) {
      try {
        const res = await fetch("/api/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sourceUrl: url, rawInput: url, source: detectSourceFromUrl(url) }),
        });
        const data = await res.json();
        setResults((prev) =>
          prev!.map((r) =>
            r.url === url
              ? res.ok
                ? { ...r, status: "done", applicationId: data.application.id, message: data.application.title }
                : { ...r, status: "error", message: data.error || "Failed" }
              : r
          )
        );
      } catch {
        setResults((prev) => prev!.map((r) => (r.url === url ? { ...r, status: "error", message: "Network error" } : r)));
      }
    }
    setRunning(false);
  }

  return (
    <div className="glass-card p-6 space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs text-secondary">
            One job posting URL per line (e.g. links from a Finn.no or LinkedIn saved-search alert)
          </label>
          <textarea
            value={urlsText}
            onChange={(e) => setUrlsText(e.target.value)}
            rows={8}
            placeholder={"https://www.finn.no/job/ad/...\nhttps://www.linkedin.com/jobs/view/..."}
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-white/25 font-mono"
          />
        </div>
        <button
          type="submit"
          disabled={running || !urlsText.trim()}
          className="w-full rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 py-2.5 text-sm font-medium disabled:opacity-50"
        >
          {running ? "Processing..." : "Add all to pipeline"}
        </button>
      </form>

      {results && (
        <div className="space-y-2 pt-2 border-t border-white/10">
          {results.map((r) => (
            <div key={r.url} className="flex items-center justify-between gap-3 text-xs">
              <span className="truncate text-secondary flex-1">{r.url}</span>
              {r.status === "pending" && <span className="text-muted shrink-0">Working...</span>}
              {r.status === "done" && (
                <a href={`/applications/${r.applicationId}`} className="text-emerald-400 shrink-0 hover:underline">
                  Added: {r.message}
                </a>
              )}
              {r.status === "error" && <span className="text-red-400 shrink-0">{r.message}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NewApplicationInner() {
  const params = useSearchParams();
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [prefillUrl, setPrefillUrl] = useState("");
  const [prefillSource, setPrefillSource] = useState("direct");

  useEffect(() => {
    const url = params.get("url");
    if (url) {
      setPrefillUrl(url);
      setPrefillSource(detectSourceFromUrl(url));
    }
  }, [params]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Add application</h1>
          <p className="text-sm text-secondary mt-1">
            Paste a job posting URL and/or the raw listing text. We&apos;ll extract the details, score your fit, and
            draft a tailored CV + cover letter.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-white/5 border border-white/10 p-1 shrink-0">
          <button
            onClick={() => setMode("single")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              mode === "single" ? "bg-white/10 text-white" : "text-secondary"
            }`}
          >
            Single
          </button>
          <button
            onClick={() => setMode("bulk")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              mode === "bulk" ? "bg-white/10 text-white" : "text-secondary"
            }`}
          >
            Bulk URLs
          </button>
        </div>
      </div>

      {mode === "single" ? (
        <SingleAddForm key={prefillUrl} initialUrl={prefillUrl} initialSource={prefillSource} />
      ) : (
        <BulkAddForm />
      )}

      <BookmarkletBox />
    </div>
  );
}

export default function NewApplicationPage() {
  return (
    <Suspense>
      <NewApplicationInner />
    </Suspense>
  );
}
