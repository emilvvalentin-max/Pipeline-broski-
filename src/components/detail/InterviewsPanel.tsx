"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { InterviewLogJSON } from "@/lib/types";
import { formatDate } from "@/lib/dates";

const EMPTY_FORM = { date: "", round: "", interviewerNames: "", questionsAsked: "", howItWent: "", outcome: "" };

export default function InterviewsPanel({
  applicationId,
  interviewLogs,
}: {
  applicationId: string;
  interviewLogs: InterviewLogJSON[];
}) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY_FORM);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    await fetch(`/api/applications/${applicationId}/interviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setAdding(false);
    setForm(EMPTY_FORM);
    setShowForm(false);
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this interview log entry?")) return;
    await fetch(`/api/applications/${applicationId}/interviews/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-secondary uppercase tracking-wide">Interview log</h2>
        <button onClick={() => setShowForm((s) => !s)} className="text-xs text-purple-400 hover:text-purple-300">
          {showForm ? "Cancel" : "+ Add round"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl bg-white/5 p-4">
          <input
            type="date"
            required
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className="rounded-md bg-white/5 border border-white/10 px-2 py-1.5 text-xs outline-none"
          />
          <input
            placeholder="Round (e.g. First round, Case interview)"
            required
            value={form.round}
            onChange={(e) => setForm((f) => ({ ...f, round: e.target.value }))}
            className="rounded-md bg-white/5 border border-white/10 px-2 py-1.5 text-xs outline-none"
          />
          <input
            placeholder="Interviewer(s)"
            value={form.interviewerNames}
            onChange={(e) => setForm((f) => ({ ...f, interviewerNames: e.target.value }))}
            className="rounded-md bg-white/5 border border-white/10 px-2 py-1.5 text-xs outline-none sm:col-span-2"
          />
          <textarea
            placeholder="Questions asked"
            rows={2}
            value={form.questionsAsked}
            onChange={(e) => setForm((f) => ({ ...f, questionsAsked: e.target.value }))}
            className="rounded-md bg-white/5 border border-white/10 px-2 py-1.5 text-xs outline-none sm:col-span-2"
          />
          <textarea
            placeholder="How it went"
            rows={2}
            value={form.howItWent}
            onChange={(e) => setForm((f) => ({ ...f, howItWent: e.target.value }))}
            className="rounded-md bg-white/5 border border-white/10 px-2 py-1.5 text-xs outline-none sm:col-span-2"
          />
          <input
            placeholder="Outcome (e.g. Advanced, Rejected, Waiting)"
            value={form.outcome}
            onChange={(e) => setForm((f) => ({ ...f, outcome: e.target.value }))}
            className="rounded-md bg-white/5 border border-white/10 px-2 py-1.5 text-xs outline-none sm:col-span-2"
          />
          <button
            type="submit"
            disabled={adding}
            className="sm:col-span-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 py-2 text-xs font-medium disabled:opacity-50"
          >
            {adding ? "Saving..." : "Save round"}
          </button>
        </form>
      )}

      {interviewLogs.length === 0 ? (
        <p className="text-xs text-muted">No interview rounds logged yet.</p>
      ) : (
        <div className="space-y-3">
          {interviewLogs.map((log) => (
            <div key={log.id} className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {log.round} <span className="text-muted font-normal">· {formatDate(log.date)}</span>
                </p>
                <button onClick={() => remove(log.id)} className="text-xs text-red-400 hover:text-red-300">
                  Remove
                </button>
              </div>
              {log.interviewerNames && <p className="text-xs text-secondary">With: {log.interviewerNames}</p>}
              {log.questionsAsked && <p className="text-xs text-secondary">Questions: {log.questionsAsked}</p>}
              {log.howItWent && <p className="text-xs text-secondary">Notes: {log.howItWent}</p>}
              {log.outcome && <p className="text-xs text-muted">Outcome: {log.outcome}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
