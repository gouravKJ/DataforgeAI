"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Spinner } from "@/components/ui/skeleton";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", organizationName: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      router.push("/onboarding");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid-bg absolute inset-0" />
      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-semibold tracking-tight">Create your workspace</h1>
          <p className="mt-1 text-xs text-muted-foreground">Start forging datasets in minutes.</p>
        </div>
        <form onSubmit={submit} className="glass space-y-4 rounded-xl p-6">
          <Field label="Your name">
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ada Lovelace" />
          </Field>
          <Field label="Organization name">
            <Input required value={form.organizationName} onChange={(e) => setForm({ ...form, organizationName: e.target.value })} placeholder="Acme Intelligence" />
          </Field>
          <Field label="Work email">
            <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" />
          </Field>
          <Field label="Password" hint="Minimum 8 characters.">
            <Input type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
          </Field>
          {error ? <p className="rounded-md border border-danger/25 bg-danger/10 px-3 py-2 text-xs text-danger">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Spinner /> : null} Create account
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Already have an account? <Link href="/login" className="text-foreground hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
