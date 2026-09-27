"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, ArrowRight, ArrowLeft, Pencil, Play, CheckCircle2, Loader2,
  Database, Workflow as WorkflowIcon, ShieldAlert, RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input, Textarea, Select, Field, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/skeleton";
import { ProvenanceBadge } from "@/components/provenance-badge";
import { cn } from "@/lib/utils";
import type { ParsedRequirement, WorkflowPlan } from "@/lib/ai/types";

const EXAMPLES = [
  "Find Indian SaaS companies founded after 2021 that are hiring Node.js developers.",
  "Find 100 Indian startups founded after 2021.",
  "Find companies hiring backend developers.",
  "Find sponsors for a college technology event.",
  "Find B2B SaaS companies in Europe with 50-500 employees.",
];

type Step = "prompt" | "interpret" | "plan" | "running";

export function BuilderClient() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("prompt");
  const [query, setQuery] = useState("");
  const [requirement, setRequirement] = useState<ParsedRequirement | null>(null);
  const [plan, setPlan] = useState<WorkflowPlan | null>(null);
  const [provider, setProvider] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  async function interpret(q: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Interpretation failed");
      setRequirement(data.parsed);
      setProvider(data.provider);
      setStep("interpret");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function generatePlan() {
    if (!requirement) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirement }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Planning failed");
      setPlan(data.plan);
      setProvider(data.provider);
      setStep("plan");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function run() {
    if (!requirement || !plan) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/datasets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, requirement, plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start job");
      router.push(`/workflows/${data.jobId}?justLaunched=1`);
    } catch (err: any) {
      setError(err.message);
      setBusy(false);
    }
  }

  function updateField(index: number, patch: Partial<ParsedRequirement["fields"][number]>) {
    if (!requirement) return;
    const fields = [...requirement.fields];
    fields[index] = { ...fields[index]!, ...patch };
    setRequirement({ ...requirement, fields });
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Natural Language Data Builder</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">Describe the data. Review the schema. Approve the plan. Run.</p>
        </div>
        <Badge tone={provider === "groq" ? "info" : provider ? "outline" : "default"}>
          <Sparkles className="h-3 w-3" /> {provider ? (provider === "groq" ? "Groq LLM" : "Local engine") : "AI ready"}
        </Badge>
      </div>

      {/* stepper */}
      <div className="mt-5 flex items-center gap-2 text-[11px]">
        {(["prompt", "interpret", "plan", "running"] as Step[]).map((s, i) => {
          const idx = ["prompt", "interpret", "plan", "running"].indexOf(step);
          const state = i < idx ? "done" : i === idx ? "current" : "todo";
          return (
            <div key={s} className="flex items-center gap-2">
              <span className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full border font-mono",
                state === "done" ? "border-success/40 bg-success/10 text-success"
                : state === "current" ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border text-muted-foreground"
              )}>
                {i + 1}
              </span>
              <span className={state === "todo" ? "text-muted-foreground" : ""}>{s === "interpret" ? "AI Interpretation" : s === "prompt" ? "Request" : s === "plan" ? "Workflow" : "Execute"}</span>
              {i < 3 ? <span className="h-px w-6 bg-border" /> : null}
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {step === "prompt" ? (
          <motion.div key="prompt" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-6">
            <Card className="border-primary/20">
              <CardContent className="p-6">
                <Textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tell us what data you need…"
                  className="min-h-[120px] border-0 bg-transparent p-0 text-base focus:ring-0"
                  autoFocus
                />
                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <span className="text-[11px] text-muted-foreground">The AI will propose a schema — you stay in control.</span>
                  <Button onClick={() => interpret(query)} disabled={busy || query.trim().length < 8}>
                    {busy ? <Spinner /> : <Sparkles className="h-4 w-4" />} Interpret Requirement
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="mt-5">
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Example prompts</div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => { setQuery(ex); interpret(ex); }}
                    className="rounded-lg border border-border bg-card/50 px-3.5 py-2.5 text-left text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    <ArrowRight className="mr-1.5 inline h-3 w-3 text-primary" />
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : null}

        {step === "interpret" && requirement ? (
          <motion.div key="interpret" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-6 space-y-4">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardTitle>AI Interpretation</CardTitle>
                  <CardDescription>Edit anything before planning — you own the spec.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setEditing(!editing)}>
                  <Pencil className="h-3.5 w-3.5" /> {editing ? "Done" : "Edit schema"}
                </Button>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <KV label="Intent" value={requirement.intent.replace(/_/g, " ")} />
                  <KV label="Entity domain" value={requirement.domain} />
                  <KV label="Location" value={requirement.location?.label ?? "—"} />
                  <KV label="Industries" value={requirement.industries.join(", ") || "—"} />
                  <KV label="Hiring skills" value={requirement.skills.join(", ") || "—"} />
                  <KV label="Funding" value={requirement.funding ? requirement.funding.stage : "—"} />
                  <KV label="Founded after" value={requirement.foundedAfter ? String(requirement.foundedAfter) : "—"} />
                  <KV label="Target records" value={String(requirement.count)} />
                </div>

                {requirement.filters.length ? (
                  <div>
                    <Label>Filters</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {requirement.filters.map((f) => (
                        <Badge key={f} tone="outline">{f}</Badge>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div>
                  <Label>Output fields ({requirement.fields.length})</Label>
                  <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/40 text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2">Field</th>
                          <th className="px-3 py-2">Type</th>
                          <th className="px-3 py-2">Required</th>
                          <th className="px-3 py-2">Provenance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {requirement.fields.map((f, i) => (
                          <tr key={f.key} className="border-t border-border/60">
                            <td className="px-3 py-1.5 font-mono">{f.key}</td>
                            <td className="px-3 py-1.5">
                              {editing ? (
                                <Select value={f.type} onChange={(e) => updateField(i, { type: e.target.value as any })} className="h-6 w-24 py-0 text-xs">
                                  {["string", "number", "url", "email", "date", "enum", "text"].map((t) => <option key={t}>{t}</option>)}
                                </Select>
                              ) : f.type}
                            </td>
                            <td className="px-3 py-1.5">
                              {editing ? (
                                <input type="checkbox" checked={f.required} onChange={(e) => updateField(i, { required: e.target.checked })} />
                              ) : f.required ? "yes" : "—"}
                            </td>
                            <td className="px-3 py-1.5"><ProvenanceBadge provenance={f.provenance} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {requirement.fields.some((f) => f.provenance === "AI_GENERATED") ? (
                    <p className="mt-2 flex items-start gap-1.5 text-[11px] text-muted-foreground">
                      <ShieldAlert className="mt-0.5 h-3 w-3 text-warning" />
                      AI-GENERATED fields are model-produced enrichment, clearly labeled in every exported record.
                    </p>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setStep("prompt")}><ArrowLeft className="h-4 w-4" /> Back</Button>
              <Button onClick={generatePlan} disabled={busy}>
                {busy ? <Spinner /> : <WorkflowIcon className="h-4 w-4" />} Generate Workflow Plan
              </Button>
            </div>
          </motion.div>
        ) : null}

        {step === "plan" && plan ? (
          <motion.div key="plan" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Plan</CardTitle>
                <CardDescription>{plan.summary}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex gap-6 text-xs text-muted-foreground">
                  <span>Est. records: <span className="text-foreground">{plan.estimatedRecords}</span></span>
                  <span>Est. duration: <span className="text-foreground">~{plan.estimatedMinutes} min</span></span>
                  <span>Stages: <span className="text-foreground">{plan.nodes.length}</span></span>
                </div>
                <div className="space-y-1.5">
                  {plan.nodes.map((n, i) => (
                    <div key={n.id} className="flex items-center gap-3 rounded-lg border border-border bg-background/40 px-3.5 py-2.5">
                      <span className="font-mono text-[10px] text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                      <div className="flex-1">
                        <div className="text-xs font-medium">{n.title}</div>
                        <div className="text-[11px] text-muted-foreground">{n.description}</div>
                      </div>
                      <Badge tone="outline">{n.kind}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setStep("interpret")}><ArrowLeft className="h-4 w-4" /> Back to schema</Button>
              <Button onClick={run} disabled={busy}>
                {busy ? <Spinner /> : <Play className="h-4 w-4" />} Run Pipeline
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {error ? (
        <p className="mt-4 rounded-md border border-danger/25 bg-danger/10 px-3 py-2 text-xs text-danger">{error}</p>
      ) : null}
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm">{value}</div>
    </div>
  );
}
