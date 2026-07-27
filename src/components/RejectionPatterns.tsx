"use client";

import { useState } from "react";

export default function RejectionPatterns() {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function analyze() {
    setLoading(true);
    const res = await fetch("/api/analytics/rejection-patterns", { method: "POST" });
    const data = await res.json();
    setSummary(data.summary);
    setLoading(false);
  }

  return (
    <div className="glass-card p-6 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-secondary uppercase tracking-wide">Rejection patterns</h2>
        <button
          onClick={analyze}
          disabled={loading}
          className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1.5 text-xs font-medium disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </div>
      {summary ? (
        <p className="text-sm text-secondary leading-relaxed">{summary}</p>
      ) : (
        <p className="text-xs text-muted">
          Run this once you have a few rejected applications with interview notes logged — it looks for recurring
          themes in why you were turned down.
        </p>
      )}
    </div>
  );
}
