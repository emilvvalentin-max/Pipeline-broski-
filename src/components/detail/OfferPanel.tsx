"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OfferJSON } from "@/lib/types";

export default function OfferPanel({ applicationId, offer }: { applicationId: string; offer: OfferJSON | null }) {
  const router = useRouter();
  const [form, setForm] = useState({
    compensation: offer?.compensation ?? "",
    benefits: offer?.benefits ?? "",
    location: offer?.location ?? "",
    growthNotes: offer?.growthNotes ?? "",
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch(`/api/applications/${applicationId}/offer`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="glass-card p-6 space-y-3">
      <h2 className="text-sm font-semibold text-secondary uppercase tracking-wide">Offer details</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          placeholder="Compensation"
          value={form.compensation}
          onChange={(e) => setForm((f) => ({ ...f, compensation: e.target.value }))}
          className="rounded-md bg-white/5 border border-white/10 px-2 py-1.5 text-xs outline-none"
        />
        <input
          placeholder="Location"
          value={form.location}
          onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
          className="rounded-md bg-white/5 border border-white/10 px-2 py-1.5 text-xs outline-none"
        />
        <textarea
          placeholder="Benefits"
          rows={2}
          value={form.benefits}
          onChange={(e) => setForm((f) => ({ ...f, benefits: e.target.value }))}
          className="rounded-md bg-white/5 border border-white/10 px-2 py-1.5 text-xs outline-none sm:col-span-2"
        />
        <textarea
          placeholder="Growth signal / notes"
          rows={2}
          value={form.growthNotes}
          onChange={(e) => setForm((f) => ({ ...f, growthNotes: e.target.value }))}
          className="rounded-md bg-white/5 border border-white/10 px-2 py-1.5 text-xs outline-none sm:col-span-2"
        />
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1.5 text-xs font-medium disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save offer details"}
      </button>
    </div>
  );
}
