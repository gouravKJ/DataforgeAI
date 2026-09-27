"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Select, Field } from "@/components/ui/input";
import { Spinner } from "@/components/ui/skeleton";

const INDUSTRIES = ["Technology", "Finance", "Healthcare", "Education", "Retail", "Manufacturing", "Consulting", "Other"];
const TEAM_SIZES = ["1-10", "11-50", "51-200", "201-1000", "1000+"];
const USE_CASES = [
  { v: "lead-generation", l: "Lead generation" },
  { v: "market-research", l: "Market research" },
  { v: "talent-sourcing", l: "Talent sourcing" },
  { v: "investor-research", l: "Investor research" },
  { v: "other", l: "Something else" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    organizationName: "",
    industry: "Technology",
    teamSize: "1-10",
    useCase: "lead-generation",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid-bg absolute inset-0" />
      <div className="relative w-full max-w-lg">
        <div className="mb-6 text-center">
          <div className="text-xs font-medium uppercase tracking-wider text-primary">Step 1 of 1</div>
          <h1 className="mt-2 text-xl font-semibold tracking-tight">Tell us about your organization</h1>
          <p className="mt-1 text-xs text-muted-foreground">This tailors source recommendations and templates.</p>
        </div>
        <form onSubmit={submit} className="glass space-y-4 rounded-xl p-6">
          <Field label="Organization name">
            <Input required value={form.organizationName} onChange={(e) => setForm({ ...form, organizationName: e.target.value })} placeholder="Acme Intelligence" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Industry">
              <Select value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })}>
                {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
              </Select>
            </Field>
            <Field label="Team size">
              <Select value={form.teamSize} onChange={(e) => setForm({ ...form, teamSize: e.target.value })}>
                {TEAM_SIZES.map((t) => <option key={t}>{t}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Primary use case">
            <Select value={form.useCase} onChange={(e) => setForm({ ...form, useCase: e.target.value })}>
              {USE_CASES.map((u) => <option key={u.v} value={u.v}>{u.l}</option>)}
            </Select>
          </Field>
          {error ? <p className="rounded-md border border-danger/25 bg-danger/10 px-3 py-2 text-xs text-danger">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Spinner /> : null} Enter the Command Center
          </Button>
        </form>
      </div>
    </div>
  );
}
