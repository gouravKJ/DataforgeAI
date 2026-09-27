"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Spinner } from "@/components/ui/skeleton";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setDevToken(data.devResetToken ?? null);
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid-bg absolute inset-0" />
      <div className="relative w-full max-w-md">
        <h1 className="mb-6 text-center text-xl font-semibold tracking-tight">Reset your password</h1>
        <div className="glass rounded-xl p-6">
          {sent ? (
            <div className="space-y-4 text-sm">
              <p className="text-muted-foreground">
                If an account exists for <span className="text-foreground">{email}</span>, a reset link is on its way.
              </p>
              {devToken ? (
                <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-xs">
                  <p className="font-medium text-warning">Development mode</p>
                  <p className="mt-1 break-all text-muted-foreground">Reset token: <span className="font-mono">{devToken}</span></p>
                  <a href={`/reset-password?token=${devToken}`} className="mt-2 inline-block font-medium text-warning hover:underline">
                    Open reset form →
                  </a>
                </div>
              ) : null}
              <Link href="/login" className="block text-xs text-muted-foreground hover:text-foreground">← Back to sign in</Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <Field label="Account email">
                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
              </Field>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Spinner /> : null} Send reset link
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                <Link href="/login" className="hover:text-foreground">← Back to sign in</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
