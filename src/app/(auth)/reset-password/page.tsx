"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Spinner } from "@/components/ui/skeleton";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed");
      router.push("/login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="New password" hint="Minimum 8 characters.">
        <Input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      {error ? <p className="rounded-md border border-danger/25 bg-danger/10 px-3 py-2 text-xs text-danger">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={loading || !token}>
        {loading ? <Spinner /> : null} Set new password
      </Button>
      {!token ? <p className="text-xs text-danger">Missing reset token.</p> : null}
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid-bg absolute inset-0" />
      <div className="relative w-full max-w-md">
        <h1 className="mb-6 text-center text-xl font-semibold tracking-tight">Choose a new password</h1>
        <div className="glass rounded-xl p-6">
          <Suspense fallback={null}>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
