"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ApplicationDetailJSON } from "@/lib/types";
import { STAGE_ORDER, STAGE_LABEL, STAGE_CLASS, SOURCE_LABEL } from "@/lib/stages";
import { toInputDate } from "@/lib/dates";
import type { Stage } from "@/generated/prisma/client";

function accommodationSelectValue(value: boolean | null): string {
  if (value === true) return "yes";
  if (value === false) return "no";
  return "unknown";
}

export default function HeaderPanel({ application }: { application: ApplicationDetailJSON }) {
  const router = useRouter();
  const [stage, setStage] = useState(application.stage);
  const [urgent, setUrgent] = useState(application.urgent);
  const [deadline, setDeadline] = useState(toInputDate(application.deadline));
  const [location, setLocation] = useState(application.location ?? "");
  const [accommodationProvided, setAccommodationProvided] = useState(application.accommodationProvided);
  const [deleting, setDeleting] = useState(false);

  async function patch(data: Record<string, unknown>) {
    await fetch(`/api/applications/${application.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm(`Delete "${application.title}"? This can't be undone.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/applications/${application.id}`, { method: "DELETE" });
    if (res.ok) router.push("/");
    else setDeleting(false);
  }

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`h-10 w-10 shrink-0 rounded-xl gradient-orb ${STAGE_CLASS[stage]}`} />
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight truncate">{application.title}</h1>
            <p className="text-sm text-secondary truncate">
              {application.company} · {application.role}
            </p>
          </div>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs text-red-400 hover:text-red-300 shrink-0"
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <select
          value={stage}
          onChange={(e) => {
            const next = e.target.value as Stage;
            setStage(next);
            patch({ stage: next });
          }}
          className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm outline-none focus:border-white/25"
        >
          {STAGE_ORDER.map((s) => (
            <option key={s} value={s} className="bg-[#121022]">
              {STAGE_LABEL[s]}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-1.5 text-xs text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={urgent}
            onChange={(e) => {
              setUrgent(e.target.checked);
              patch({ urgent: e.target.checked });
            }}
          />
          Urgent
        </label>

        <span className="text-xs text-muted">
          {SOURCE_LABEL[application.source] ?? application.source}
        </span>

        <label className="flex items-center gap-1.5 text-xs text-muted">
          Deadline
          <input
            type="date"
            value={deadline}
            onChange={(e) => {
              setDeadline(e.target.value);
              patch({ deadline: e.target.value || null });
            }}
            className="rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-xs outline-none focus:border-white/25"
          />
        </label>

        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          onBlur={() => patch({ location: location.trim() || null })}
          placeholder="Location"
          className="w-32 rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-xs outline-none focus:border-white/25 placeholder:text-muted"
        />

        <select
          value={accommodationSelectValue(accommodationProvided)}
          onChange={(e) => {
            const next = e.target.value === "unknown" ? null : e.target.value === "yes";
            setAccommodationProvided(next);
            patch({ accommodationProvided: next });
          }}
          className="rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-xs outline-none focus:border-white/25"
        >
          <option value="unknown" className="bg-[#121022]">Housing: —</option>
          <option value="yes" className="bg-[#121022]">Housing: Yes</option>
          <option value="no" className="bg-[#121022]">Housing: No</option>
        </select>

        {application.fitScore != null && (
          <span className="text-xs text-secondary">Fit {application.fitScore}%</span>
        )}
        {application.sourceUrl && (
          <a
            href={application.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-purple-400 hover:text-purple-300"
          >
            View listing ↗
          </a>
        )}
      </div>
    </div>
  );
}
