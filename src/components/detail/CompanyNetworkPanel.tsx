"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CompanyNoteJSON, NetworkingContactJSON } from "@/lib/types";

const EMPTY_CONTACT = { contactName: "", relationship: "", warmOrCold: "cold", hasReachedOut: false, notes: "" };

export default function CompanyNetworkPanel({
  applicationId,
  companyNotes,
  networkingContacts,
}: {
  applicationId: string;
  companyNotes: CompanyNoteJSON | null;
  networkingContacts: NetworkingContactJSON[];
}) {
  const router = useRouter();
  const [notes, setNotes] = useState({
    culture: companyNotes?.culture ?? "",
    recentNews: companyNotes?.recentNews ?? "",
    whyThisCompany: companyNotes?.whyThisCompany ?? "",
  });
  const [savingNotes, setSavingNotes] = useState(false);
  const [contactForm, setContactForm] = useState(EMPTY_CONTACT);
  const [showContactForm, setShowContactForm] = useState(false);
  const [addingContact, setAddingContact] = useState(false);

  async function saveNotes() {
    setSavingNotes(true);
    await fetch(`/api/applications/${applicationId}/company-notes`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(notes),
    });
    setSavingNotes(false);
    router.refresh();
  }

  async function addContact(e: React.FormEvent) {
    e.preventDefault();
    setAddingContact(true);
    await fetch(`/api/applications/${applicationId}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contactForm),
    });
    setAddingContact(false);
    setContactForm(EMPTY_CONTACT);
    setShowContactForm(false);
    router.refresh();
  }

  async function toggleReachedOut(contact: NetworkingContactJSON) {
    await fetch(`/api/applications/${applicationId}/contacts/${contact.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hasReachedOut: !contact.hasReachedOut }),
    });
    router.refresh();
  }

  async function removeContact(id: string) {
    if (!confirm("Remove this contact?")) return;
    await fetch(`/api/applications/${applicationId}/contacts/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="glass-card p-6 space-y-3">
        <h2 className="text-sm font-semibold text-secondary uppercase tracking-wide">Company research</h2>
        <textarea
          placeholder="Culture, values, what it's like to work there..."
          rows={3}
          value={notes.culture}
          onChange={(e) => setNotes((n) => ({ ...n, culture: e.target.value }))}
          className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs outline-none focus:border-white/25"
        />
        <textarea
          placeholder="Recent news"
          rows={3}
          value={notes.recentNews}
          onChange={(e) => setNotes((n) => ({ ...n, recentNews: e.target.value }))}
          className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs outline-none focus:border-white/25"
        />
        <textarea
          placeholder="Why this company? (your angle for interviews)"
          rows={3}
          value={notes.whyThisCompany}
          onChange={(e) => setNotes((n) => ({ ...n, whyThisCompany: e.target.value }))}
          className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs outline-none focus:border-white/25"
        />
        <button
          onClick={saveNotes}
          disabled={savingNotes}
          className="rounded-lg bg-white/10 hover:bg-white/15 px-3 py-1.5 text-xs font-medium disabled:opacity-40"
        >
          {savingNotes ? "Saving..." : "Save notes"}
        </button>
      </div>

      <div className="glass-card p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-secondary uppercase tracking-wide">Networking</h2>
          <button
            onClick={() => setShowContactForm((s) => !s)}
            className="text-xs text-purple-400 hover:text-purple-300"
          >
            {showContactForm ? "Cancel" : "+ Add contact"}
          </button>
        </div>

        {showContactForm && (
          <form onSubmit={addContact} className="space-y-2 rounded-xl bg-white/5 p-4">
            <input
              required
              placeholder="Contact name"
              value={contactForm.contactName}
              onChange={(e) => setContactForm((f) => ({ ...f, contactName: e.target.value }))}
              className="w-full rounded-md bg-white/5 border border-white/10 px-2 py-1.5 text-xs outline-none"
            />
            <input
              placeholder="Relationship (e.g. alum, ex-colleague)"
              value={contactForm.relationship}
              onChange={(e) => setContactForm((f) => ({ ...f, relationship: e.target.value }))}
              className="w-full rounded-md bg-white/5 border border-white/10 px-2 py-1.5 text-xs outline-none"
            />
            <div className="flex items-center gap-3">
              <select
                value={contactForm.warmOrCold}
                onChange={(e) => setContactForm((f) => ({ ...f, warmOrCold: e.target.value }))}
                className="rounded-md bg-white/5 border border-white/10 px-2 py-1.5 text-xs outline-none"
              >
                <option value="warm" className="bg-[#121022]">Warm</option>
                <option value="cold" className="bg-[#121022]">Cold</option>
              </select>
              <label className="flex items-center gap-1.5 text-xs text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={contactForm.hasReachedOut}
                  onChange={(e) => setContactForm((f) => ({ ...f, hasReachedOut: e.target.checked }))}
                />
                Already reached out
              </label>
            </div>
            <textarea
              placeholder="Notes"
              rows={2}
              value={contactForm.notes}
              onChange={(e) => setContactForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full rounded-md bg-white/5 border border-white/10 px-2 py-1.5 text-xs outline-none"
            />
            <button
              type="submit"
              disabled={addingContact}
              className="w-full rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 py-1.5 text-xs font-medium disabled:opacity-50"
            >
              {addingContact ? "Saving..." : "Add contact"}
            </button>
          </form>
        )}

        {networkingContacts.length === 0 ? (
          <p className="text-xs text-muted">No contacts yet.</p>
        ) : (
          <div className="space-y-2">
            {networkingContacts.map((c) => (
              <div key={c.id} className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {c.contactName}{" "}
                    <span
                      className={`ml-1 text-[10px] rounded-full px-1.5 py-0.5 ${
                        c.warmOrCold === "warm" ? "bg-emerald-500/15 text-emerald-400" : "bg-white/10 text-secondary"
                      }`}
                    >
                      {c.warmOrCold}
                    </span>
                  </p>
                  <button onClick={() => removeContact(c.id)} className="text-xs text-red-400 hover:text-red-300">
                    Remove
                  </button>
                </div>
                {c.relationship && <p className="text-xs text-secondary">{c.relationship}</p>}
                {c.notes && <p className="text-xs text-muted">{c.notes}</p>}
                <button onClick={() => toggleReachedOut(c)} className="text-xs text-purple-400 hover:text-purple-300">
                  {c.hasReachedOut ? "✓ Reached out" : "Mark as reached out"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
