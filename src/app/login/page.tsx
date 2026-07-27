"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode }),
    });
    setLoading(false);
    if (res.ok) {
      router.replace(params.get("from") || "/");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Something went wrong");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card w-full max-w-sm p-8 space-y-5">
      <div className="space-y-1.5 text-center">
        <div className="mx-auto h-12 w-12 rounded-2xl gradient-orb stage-interview" />
        <h1 className="text-xl font-semibold">Pipeline</h1>
        <p className="text-sm text-secondary">Enter your passcode to continue</p>
      </div>
      <input
        type="password"
        autoFocus
        value={passcode}
        onChange={(e) => setPasscode(e.target.value)}
        placeholder="Passcode"
        className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm outline-none focus:border-white/25 transition-colors"
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading || !passcode}
        className="w-full rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 py-2.5 text-sm font-medium disabled:opacity-50 transition-opacity"
      >
        {loading ? "Checking..." : "Enter"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
