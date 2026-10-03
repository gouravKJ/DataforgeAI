"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Spinner } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      router.push(data.onboarded ? "/dashboard" : "/onboarding");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function fillDemo() {
    setEmail("admin@demo.dataforge.ai");
    setPassword("demo1234");
  }

  return (
    <form onSubmit={submit} className="space-y-4 text-[#1D1D1B]">
      {params.get("demo") ? (
        <div className="flex items-center justify-between rounded-2xl border border-[#F7CE78] bg-[#FFFDF3] px-3.5 py-3 text-xs font-medium shadow-xs">
          <span className="text-[#1D1D1B]/80 font-bold flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[#6E40FF]" /> Explore pre-seeded demo data.
          </span>
          <button
            type="button"
            onClick={fillDemo}
            className="font-mono text-[10px] font-extrabold bg-[#F7CE78] text-[#1D1D1B] px-2.5 py-1 rounded-full border border-[#1D1D1B]/20 hover:scale-105 transition-transform"
          >
            Fill Demo Login
          </button>
        </div>
      ) : null}

      <Field label="Email Address">
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          autoComplete="email"
          className="rounded-xl border border-[#1D1D1B]/20 bg-[#F8F8F5] text-[#1D1D1B] focus:border-[#6E40FF] focus:bg-white text-xs py-2.5"
        />
      </Field>

      <Field label="Password">
        <Input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          className="rounded-xl border border-[#1D1D1B]/20 bg-[#F8F8F5] text-[#1D1D1B] focus:border-[#6E40FF] focus:bg-white text-xs py-2.5"
        />
      </Field>

      {error ? (
        <p className="rounded-xl border border-rose-500/30 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full group mota-btn-hover py-3 text-xs flex justify-center items-center gap-2"
      >
        <div className="mota-btn-inner">
          <span className="mota-btn-text flex items-center gap-2">
            {loading ? <Spinner /> : null} Sign in to Dashboard →
          </span>
          <span className="mota-btn-text-hover flex items-center gap-2">
            {loading ? <Spinner /> : null} Sign in to Dashboard →
          </span>
        </div>
      </button>

      <div className="flex items-center justify-between text-xs font-bold text-[#1D1D1B]/70 pt-1">
        <Link href="/forgot-password" className="hover:text-[#6E40FF] transition-colors">
          Forgot password?
        </Link>
        <Link href="/register" className="hover:text-[#6E40FF] transition-colors">
          Create an account
        </Link>
      </div>

      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[#1D1D1B]/15" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 font-mono text-[10px] font-extrabold uppercase tracking-widest text-[#1D1D1B]/50">
            OR
          </span>
        </div>
      </div>

      <button
        type="button"
        disabled
        className="w-full rounded-full border border-[#1D1D1B]/20 bg-[#F8F8F5] py-2.5 text-xs font-bold text-[#1D1D1B]/50 cursor-not-allowed"
      >
        Continue with Google
      </button>
    </form>
  );
}
