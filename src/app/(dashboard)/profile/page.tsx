"use client";

import { useEffect, useRef, useState } from "react";

export default function ProfilePage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => setText(data.baseResumeText ?? ""))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    setSaved(false);
    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ baseResumeText: text }),
    });
    setSaving(false);
    setSaved(true);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/profile/parse-docx", { method: "POST", body: formData });
    setUploading(false);
    if (res.ok) {
      const data = await res.json();
      setText(data.text);
      setSaved(false);
    } else {
      const data = await res.json().catch(() => ({}));
      setUploadError(data.error || "Couldn't read that file");
    }
    e.target.value = "";
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-secondary mt-1">
          Upload your CV as a .docx, or paste it as plain text/Markdown below. This is what fit scoring and tailored
          drafts are generated from.
        </p>
      </div>
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="rounded-lg bg-white/10 hover:bg-white/15 px-3 py-1.5 text-xs font-medium disabled:opacity-50"
          >
            {uploading ? "Reading .docx..." : "Upload .docx"}
          </button>
          <span className="text-xs text-muted">Extracts the text into the box below — review before saving.</span>
        </div>
        {uploadError && <p className="text-sm text-red-400">{uploadError}</p>}

        {loading ? (
          <p className="text-sm text-secondary">Loading...</p>
        ) : (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={20}
            placeholder="Paste your resume text here, or upload a .docx above..."
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-white/25 font-mono"
          />
        )}
        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={saving || loading}
            className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          {saved && <span className="text-xs text-emerald-400">Saved</span>}
        </div>
      </div>
    </div>
  );
}
