"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeft, CircleStop, Database, FileText, Plug, Layers, Eraser, Network,
  Copy, ShieldCheck, Gauge, Table2, Loader2, AlertTriangle, CheckCircle2, XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge, StatusDot } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, timeAgo } from "@/lib/utils";

type NodeRuntime = {
  id: string;
  title: string;
  kind: string;
  status: "PENDING" | "RUNNING" | "DONE" | "ERROR" | "SKIPPED";
  recordsProcessed: number;
  durationMs: number;
  errors: number;
  sourceCount: number;
  detail: string;
};

type JobSnapshot = {
  id: string;
  status: string;
  currentStage: string;
  progress: number;
  nodes: NodeRuntime[];
  stats: Record<string, any>;
  error: string | null;
  events: { id: string; level: string; stage: string; message: string; at: string }[];
  startedAt: string | null;
  finishedAt: string | null;
  dataset?: { id: string; name: string } | null;
};

const NODE_ICONS: Record<string, any> = {
  REQUIREMENT: FileText,
  SOURCE_DISCOVERY: Plug,
  DISCOVERY: Layers,
  EXTRACTION: Loader2,
  CLEANING: Eraser,
  ENTITY_RESOLUTION: Network,
  DEDUPLICATION: Copy,
  VALIDATION: ShieldCheck,
  QUALITY_SCORING: Gauge,
  DATASET: Table2,
};

export function WorkflowDetailClient({ jobId }: { jobId: string }) {
  const [snap, setSnap] = useState<JobSnapshot | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [justLaunched, setJustLaunched] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  const { data: fallback, refetch } = useQuery({
    queryKey: ["job", jobId],
    queryFn: async () => {
      const res = await fetch(`/api/jobs/${jobId}`);
      if (!res.ok) throw new Error("Job not found");
      const data = await res.json();
      return data.job as JobSnapshot & { dataset: { id: string; name: string } | null };
    },
    enabled: !snap,
    refetchInterval: 4000,
  });

  const job = snap ?? fallback ?? null;

  useEffect(() => {
    const es = new EventSource(`/api/jobs/${jobId}/stream`);
    esRef.current = es;
    es.addEventListener("snapshot", (e) => {
      const data = JSON.parse((e as MessageEvent).data) as JobSnapshot;
      setSnap(data);
    });
    es.onerror = () => {
      // SSE closed (job done / proxy timeout); fall back to polling
      es.close();
    };
    return () => es.close();
  }, [jobId]);

  useEffect(() => {
    const flag = new URLSearchParams(window.location.search).get("justLaunched");
    if (flag) setJustLaunched(true);
  }, []);

  const isTerminal = job ? ["COMPLETED", "FAILED", "CANCELLED"].includes(job.status) : false;
  const active = job?.nodes.find((n) => n.status === "RUNNING");

  useEffect(() => {
    if (isTerminal) refetch();
  }, [isTerminal, refetch]);

  if (!job) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-64" />
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const selected = job.nodes.find((n) => n.id === selectedNode) ?? null;

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/workflows" className="rounded-md p-1.5 hover:bg-muted"><ArrowLeft className="h-4 w-4" /></Link>
          <div>
            <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              {job.dataset?.name ?? "Workflow"}
              <Badge tone={job.status === "COMPLETED" ? "success" : job.status === "RUNNING" ? "info" : job.status === "FAILED" ? "danger" : "warning"}>
                {job.status}
              </Badge>
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {isTerminal
                ? `Finished ${timeAgo(job.finishedAt)}`
                : job.status === "RUNNING"
                ? `Running — ${job.currentStage}`
                : "Queued"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isTerminal && job.dataset ? (
            <Link href={`/datasets/${job.dataset.id}`}><Button size="sm"><Database className="h-3.5 w-3.5" /> Open Dataset</Button></Link>
          ) : null}
          {!isTerminal && job.status !== "CANCELLED" ? <CancelButton jobId={jobId} /> : null}
        </div>
      </div>

      {justLaunched && !isTerminal ? (
        <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-xs text-primary">
          Pipeline launched. Nodes execute in sequence — inspect any node while it runs.
        </div>
      ) : null}

      {job.error ? (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-4 py-2.5 text-xs text-danger">
          <AlertTriangle className="h-3.5 w-3.5" /> {job.error}
        </div>
      ) : null}

      {/* pipeline visualization */}
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Pipeline</CardTitle>
            <CardDescription>{job.nodes.length} stages · click a node to inspect</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {job.nodes.map((n, i) => {
                const Icon = NODE_ICONS[n.kind] ?? Loader2;
                const isSel = selectedNode === n.id;
                return (
                  <div key={n.id}>
                    <button
                      onClick={() => setSelectedNode(isSel ? null : n.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left transition-colors",
                        isSel ? "border-primary/50 bg-primary/5" : "border-border bg-background/40 hover:border-muted-foreground/30"
                      )}
                    >
                      <div className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-md border",
                        n.status === "DONE" ? "border-success/30 bg-success/10 text-success"
                        : n.status === "RUNNING" ? "border-primary/40 bg-primary/10 text-primary"
                        : n.status === "ERROR" ? "border-danger/30 bg-danger/10 text-danger"
                        : "border-border bg-muted/30 text-muted-foreground"
                      )}>
                        <Icon className={cn("h-3.5 w-3.5", n.status === "RUNNING" && "animate-spin")} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">{n.title}</span>
                          {n.status === "RUNNING" ? <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-primary" /> : null}
                        </div>
                        <div className="truncate text-[11px] text-muted-foreground">{n.detail || n.kind}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-[10px] text-muted-foreground">
                          {n.recordsProcessed > 0 ? `${n.recordsProcessed} rec` : ""}
                        </div>
                        <div className="font-mono text-[10px] text-muted-foreground/60">
                          {n.durationMs > 0 ? `${(n.durationMs / 1000).toFixed(1)}s` : ""}
                        </div>
                      </div>
                    </button>
                    {i < job.nodes.length - 1 ? <div className="ml-[26px] h-2 w-px bg-border" /> : null}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {/* node inspector */}
          <Card>
            <CardHeader>
              <CardTitle>Node Inspector</CardTitle>
              <CardDescription>{selected ? selected.title : "Select a pipeline node"}</CardDescription>
            </CardHeader>
            <CardContent>
              {selected ? (
                <div className="space-y-3 text-xs">
                  <Row k="Status" v={selected.status} />
                  <Row k="Records processed" v={String(selected.recordsProcessed)} />
                  <Row k="Duration" v={`${(selected.durationMs / 1000).toFixed(2)}s`} />
                  <Row k="Errors" v={String(selected.errors)} />
                  <Row k="Sources" v={String(selected.sourceCount)} />
                  <div className="rounded-lg border border-border bg-background/40 p-3 leading-relaxed text-muted-foreground">
                    {selected.detail || "No detail yet."}
                  </div>
                </div>
              ) : (
                <p className="py-6 text-center text-xs text-muted-foreground">Click any node to see records, duration, errors, and sources.</p>
              )}
            </CardContent>
          </Card>

          {/* run stats */}
          {job.stats && Object.keys(job.stats).length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Run stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(job.stats)
                    .filter(([, v]) => typeof v === "number" || typeof v === "string")
                    .map(([k, v]) => (
                      <div key={k} className="rounded-lg border border-border bg-background/40 px-3 py-2">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div>
                        <div className="mt-0.5 font-mono">{String(v)}</div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* event log */}
          <Card>
            <CardHeader>
              <CardTitle>Event log</CardTitle>
              <CardDescription>{job.events.length} entries</CardDescription>
            </CardHeader>
            <CardContent className="max-h-72 overflow-y-auto">
              <div className="space-y-1.5">
                {job.events.map((e) => (
                  <div key={e.id} className="flex items-start gap-2 text-[11px]">
                    {e.level === "success" ? <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-success" />
                    : e.level === "warn" ? <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-warning" />
                    : e.level === "error" ? <XCircle className="mt-0.5 h-3 w-3 shrink-0 text-danger" />
                    : <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/50" />}
                    <span className="text-muted-foreground">{new Date(e.at).toLocaleTimeString()}</span>
                    <span className="min-w-0 flex-1">{e.message}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-mono">{v}</span>
    </div>
  );
}

function CancelButton({ jobId }: { jobId: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="danger"
      size="sm"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await fetch(`/api/jobs/${jobId}/cancel`, { method: "POST" });
        setBusy(false);
      }}
    >
      <CircleStop className="h-3.5 w-3.5" /> Cancel
    </Button>
  );
}
