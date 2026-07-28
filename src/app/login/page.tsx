"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    const supabase = createClient();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      router.replace(params.get("from") || "/");
      router.refresh();
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      if (data.session) {
        router.replace("/");
        router.refresh();
      } else {
        setInfo("Check your email to confirm your account, then sign in.");
        setMode("login");
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card w-full max-w-sm p-8 space-y-5">
      <div className="space-y-1.5 text-center">
        <div className="mx-auto h-12 w-12 rounded-2xl gradient-orb stage-interview" />
        <h1 className="text-xl font-semibold">Pipeline</h1>
        <p className="text-sm text-secondary">
          {mode === "login" ? "Sign in to your pipeline" : "Create an account to start tracking"}
        </p>
      </div>

      <div className="space-y-3">
        <input
          type="email"
          autoFocus
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm outline-none focus:border-white/25 transition-colors"
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm outline-none focus:border-white/25 transition-colors"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {info && <p className="text-sm text-emerald-400">{info}</p>}

      <button
        type="submit"
        disabled={loading || !email || !password}
        className="w-full rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 py-2.5 text-sm font-medium disabled:opacity-50 transition-opacity"
      >
        {loading ? "Working..." : mode === "login" ? "Sign in" : "Sign up"}
      </button>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "login" ? "signup" : "login");
          setError(null);
          setInfo(null);
        }}
        className="w-full text-center text-xs text-secondary hover:text-white transition-colors"
      >
        {mode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Suspense>
        <AuthForm />
      </Suspense>
    </div>
  );
}
