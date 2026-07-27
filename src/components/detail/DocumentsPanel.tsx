"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { DocumentVersionJSON } from "@/lib/types";
import { formatDate } from "@/lib/dates";

function DocumentColumn({
  applicationId,
  type,
  label,
  versions,
}: {
  applicationId: string;
  type: "cv" | "cover_letter";
  label: string;
  versions: DocumentVersionJSON[];
}) {
  const router = useRouter();
  const latest = versions[0];
  const [selectedId, setSelectedId] = useState(latest?.id ?? null);
  const [content, setContent] = useState(latest?.content ?? "");
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const selected = versions.find((v) => v.id === selectedId) ?? latest;
  const isLatest = selectedId === latest?.id;

  function selectVersion(id: string) {
    const v = versions.find((x) => x.id === id);
    if (v) {
      setSelectedId(id);
      setContent(v.content);
    }
  }

  async function saveAsNewVersion() {
    setSaving(true);
    await fetch(`/api/applications/${applicationId}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, content }),
    });
    setSaving(false);
    router.refresh();
  }

  async function regenerate() {
    setRegenerating(true);
    const res = await fetch(`/api/applications/${applicationId}/documents`, { method: "PUT" });
    setRegenerating(false);
    if (res.ok) router.refresh();
    else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Regeneration failed");
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{label}</h3>
        <div className="flex items-center gap-2">
          {versions.length > 1 && (
            <select
              value={selectedId ?? ""}
              onChange={(e) => selectVersion(e.target.value)}
              className="rounded-md bg-white/5 border border-white/10 px-2 py-1 text-xs outline-none"
            >
              {versions.map((v) => (
                <option key={v.id} value={v.id} className="bg-[#121022]">
                  v{v.versionNumber} · {formatDate(v.createdAt)}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={14}
        placeholder={`No ${label.toLowerCase()} yet. Set a base resume in Profile, then regenerate.`}
        className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs font-mono outline-none focus:border-white/25"
      />
      <div className="flex items-center gap-2">
        <button
          onClick={saveAsNewVersion}
          disabled={saving || content === selected?.content}
          className="rounded-lg bg-white/10 hover:bg-white/15 px-3 py-1.5 text-xs font-medium disabled:opacity-40"
        >
          {saving ? "Saving..." : isLatest ? "Save edits as new version" : "Save as new version"}
        </button>
        <button
          onClick={regenerate}
          disabled={regenerating}
          className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1.5 text-xs font-medium disabled:opacity-50"
        >
          {regenerating ? "Regenerating..." : "Regenerate with AI"}
        </button>
      </div>
    </div>
  );
}

export default function DocumentsPanel({
  applicationId,
  documentVersions,
}: {
  applicationId: string;
  documentVersions: DocumentVersionJSON[];
}) {
  const { cv, coverLetter } = useMemo(
    () => ({
      cv: documentVersions.filter((v) => v.type === "cv"),
      coverLetter: documentVersions.filter((v) => v.type === "cover_letter"),
    }),
    [documentVersions]
  );

  return (
    <div className="glass-card p-6 space-y-6">
      <h2 className="text-sm font-semibold text-secondary uppercase tracking-wide">Documents</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DocumentColumn applicationId={applicationId} type="cv" label="Tailored CV" versions={cv} />
        <DocumentColumn
          applicationId={applicationId}
          type="cover_letter"
          label="Cover letter"
          versions={coverLetter}
        />
      </div>
    </div>
  );
}
