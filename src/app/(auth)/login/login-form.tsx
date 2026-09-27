"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/skeleton";

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
    <form onSubmit={submit} className="space-y-4">
      {params.get("demo") ? (
        <div className="flex items-center justify-between rounded-lg border border-accent/30 bg-accent/5 px-3 py-2.5 text-xs">
          <span className="text-muted-foreground">Explore with pre-seeded demo data.</span>
          <button type="button" onClick={fillDemo} className="font-medium text-accent hover:underline">
            Use demo credentials
          </button>
        </div>
      ) : null}
      <Field label="Email">
        <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" autoComplete="email" />
      </Field>
      <Field label="Password">
        <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
      </Field>
      {error ? <p className="rounded-md border border-danger/25 bg-danger/10 px-3 py-2 text-xs text-danger">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Spinner /> : null} Sign in
      </Button>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <Link href="/forgot-password" className="hover:text-foreground">Forgot password?</Link>
        <Link href="/register" className="hover:text-foreground">Create an account</Link>
      </div>
      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center">
          <span className="bg-background px-2 text-[10px] uppercase tracking-wider text-muted-foreground">or</span>
        </div>
      </div>
      <Button type="button" variant="outline" className="w-full" disabled title="Configure GOOGLE_CLIENT_ID to enable">
        Continue with Google
      </Button>
    </form>
  );
}
