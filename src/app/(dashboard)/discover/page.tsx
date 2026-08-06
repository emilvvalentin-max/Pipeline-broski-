"use client";

import { useCallback, useEffect, useState } from "react";

interface DiscoverJob {
  link: string;
  title: string;
  location: string;
  company: string;
  description: string | null;
  employment_type: string | null;
  seniority_level: string | null;
  hintDeadline: string | null;
  hintAccommodation: boolean | null;
}

type AddState = "idle" | "adding" | "added" | "error";

function buildRawInput(job: DiscoverJob): string {
  const lines = [
    `Title: ${job.title}`,
    `Company: ${job.company}`,
    `Location: ${job.location}`,
  ];
  if (job.employment_type) lines.push(`Employment type: ${job.employment_type}`);
  if (job.seniority_level) lines.push(`Seniority: ${job.seniority_level}`);
  lines.push("", "Description:", job.description ?? "");
  return lines.join("\n");
}

interface ImportPdfSummary {
  totalLinksFound: number;
  alreadyTracked: number;
  added: number;
  skippedErrors: number;
  skippedTimeout: number;
  errors: { url: string; message: string }[];
}

function CountPill({ label, value, tone }: { label: string; value: number; tone: "emerald" | "muted" | "red" }) {
  const toneClass =
    tone === "emerald"
      ? "bg-emerald-500/15 text-emerald-400"
      : tone === "red"
      ? "bg-red-500/15 text-red-400"
      : "bg-white/10 text-muted";
  return (
    <span className={`rounded-full text-[10px] font-medium px-2 py-0.5 ${toneClass}`}>
      {label}: {value}
    </span>
  );
}

function PdfImportBox() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ImportPdfSummary | null>(null);

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setSummary(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/discover/import-pdf", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        setSummary(data);
      } else {
        setError(data.error || "Import failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-card p-4 space-y-3">
      <div>
        <p className="text-sm font-medium">Import from PDF</p>
        <p className="text-xs text-secondary mt-0.5">
          Upload an internship tracker PDF — we&apos;ll pull every company link out of it and add the new ones to
          your pipeline.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          accept="application/pdf,.pdf"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setSummary(null);
            setError(null);
          }}
          className="flex-1 min-w-[180px] text-xs text-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
        />
        <button
          onClick={handleImport}
          disabled={!file || loading}
          className="shrink-0 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1.5 text-xs font-medium disabled:opacity-50"
        >
          {loading ? "Importing..." : "Import"}
        </button>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {summary && (
        <div className="space-y-2 pt-2 border-t border-white/10">
          <div className="flex flex-wrap items-center gap-2">
            <CountPill label="Links found" value={summary.totalLinksFound} tone="muted" />
            <CountPill label="Added" value={summary.added} tone="emerald" />
            <CountPill label="Already tracked" value={summary.alreadyTracked} tone="muted" />
            {summary.skippedErrors > 0 && <CountPill label="Errors" value={summary.skippedErrors} tone="red" />}
            {summary.skippedTimeout > 0 && <CountPill label="Skipped (time limit)" value={summary.skippedTimeout} tone="red" />}
          </div>
          {summary.errors.length > 0 && (
            <div className="space-y-1">
              {summary.errors.map((e) => (
                <div key={e.url} className="text-xs text-red-400 truncate">
                  {e.url}: {e.message}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AccommodationBadge({ value }: { value: boolean | null }) {
  if (value === true) {
    return (
      <span className="rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-medium px-2 py-0.5">
        Housing: Yes
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="rounded-full bg-white/10 text-muted text-[10px] font-medium px-2 py-0.5">
        Housing: No
      </span>
    );
  }
  return (
    <span className="rounded-full bg-white/5 text-muted text-[10px] font-medium px-2 py-0.5">
      Housing: —
    </span>
  );
}

function JobCard({ job }: { job: DiscoverJob }) {
  const [state, setState] = useState<AddState>("idle");
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    setState("adding");
    setError(null);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceUrl: job.link,
          rawInput: buildRawInput(job),
          source: "linkedin",
          skipFetch: true,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setApplicationId(data.application.id);
        setState("added");
      } else {
        setError(data.error || "Failed to add");
        setState("error");
      }
    } catch {
      setError("Network error");
      setState("error");
    }
  }

  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{job.title}</p>
          <p className="text-xs text-secondary truncate">{job.company}</p>
        </div>
        <a
          href={job.link}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 text-xs text-purple-400 hover:text-purple-300"
        >
          View ↗
        </a>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <span>{job.location}</span>
        <span>·</span>
        <span>{job.hintDeadline ? `Deadline: ${job.hintDeadline}` : "Deadline: not stated"}</span>
        <AccommodationBadge value={job.hintAccommodation} />
      </div>

      <div className="flex items-center justify-between gap-3">
        {state === "error" && <span className="text-xs text-red-400 truncate">{error}</span>}
        <span className="flex-1" />
        {state === "added" && applicationId ? (
          <a
            href={`/applications/${applicationId}`}
            className="shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-emerald-400"
          >
            Added ✓ View
          </a>
        ) : (
          <button
            onClick={handleAdd}
            disabled={state === "adding"}
            className="shrink-0 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1.5 text-xs font-medium disabled:opacity-50"
          >
            {state === "adding" ? "Adding..." : state === "error" ? "Retry" : "Add to pipeline"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  const [titleInput, setTitleInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [jobs, setJobs] = useState<DiscoverJob[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = useCallback(async (title: string, location: string, nextPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL("/api/discover", window.location.origin);
      if (title) url.searchParams.set("title", title);
      if (location) url.searchParams.set("location", location);
      url.searchParams.set("page", String(nextPage));
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setJobs(data.jobs);
        setPage(nextPage);
      } else {
        setError(data.error || "Search failed");
        setJobs([]);
      }
    } catch {
      setError("Network error");
      setJobs([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }, []);

  // Load a default page of listings on open so Discover isn't empty before you search.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- runSearch only sets state after its internal fetch resolves
    runSearch("", "", 1);
  }, [runSearch]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    runSearch(titleInput.trim(), locationInput.trim(), 1);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Discover internships</h1>
        <p className="text-sm text-secondary mt-1">
          Search European tech internships and new-grad roles, then add any listing straight to your pipeline.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-4 flex flex-wrap gap-3">
        <input
          value={titleInput}
          onChange={(e) => setTitleInput(e.target.value)}
          placeholder="Role, e.g. software engineer"
          className="flex-1 min-w-[180px] rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-white/25"
        />
        <input
          value={locationInput}
          onChange={(e) => setLocationInput(e.target.value)}
          placeholder="Location, e.g. Norway"
          className="flex-1 min-w-[180px] rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-white/25"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      <PdfImportBox />

      {error && <p className="text-sm text-red-400">{error}</p>}

      {searched && !loading && jobs.length === 0 && !error && (
        <p className="text-sm text-secondary">No listings matched — try a broader search.</p>
      )}

      <div className="space-y-3">
        {jobs.map((job) => (
          <JobCard key={job.link} job={job} />
        ))}
      </div>

      {jobs.length > 0 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => runSearch(titleInput.trim(), locationInput.trim(), page - 1)}
            disabled={loading || page <= 1}
            className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs disabled:opacity-40"
          >
            ← Previous
          </button>
          <span className="text-xs text-muted">Page {page}</span>
          <button
            onClick={() => runSearch(titleInput.trim(), locationInput.trim(), page + 1)}
            disabled={loading}
            className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
