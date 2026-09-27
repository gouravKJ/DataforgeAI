"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Workflow as WorkflowIcon, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge, StatusDot } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton, EmptyState } from "@/components/ui/skeleton";
import { timeAgo } from "@/lib/utils";

type JobRow = {
  id: string;
  type: string;
  status: string;
  currentStage: string;
  progress: number;
  dataset: { id: string; name: string } | null;
  createdAt: string;
};

export function WorkflowsClient() {
  const { data, isLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const res = await fetch("/api/jobs?limit=60");
      if (!res.ok) throw new Error("Failed to load jobs");
      return (await res.json()) as { jobs: JobRow[] };
    },
    refetchInterval: 5000,
  });

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Workflows</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">Every pipeline execution, live or historical.</p>
        </div>
        <Link href="/build"><Button><Plus className="h-4 w-4" /> New Run</Button></Link>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : !data || data.jobs.length === 0 ? (
          <EmptyState
            icon={<WorkflowIcon className="h-8 w-8" />}
            title="No workflows yet"
            description="Run your first collection pipeline from the Data Builder."
            action={<Link href="/build"><Button size="sm">Build a Dataset</Button></Link>}
          />
        ) : (
          <div className="space-y-2">
            {data.jobs.map((j) => (
              <Link key={j.id} href={`/workflows/${j.id}`}>
                <Card className="glass-hover mb-2 p-4 transition-colors hover:border-primary/30">
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusDot status={j.status} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{j.dataset?.name ?? "Untitled run"}</span>
                        <Badge tone={j.status === "COMPLETED" ? "success" : j.status === "RUNNING" ? "info" : j.status === "FAILED" ? "danger" : "warning"}>{j.status}</Badge>
                      </div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        {j.type} · {j.currentStage} · started {timeAgo(j.createdAt)}
                      </div>
                    </div>
                    <div className="w-32">
                      <div className="h-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn2(j.status)}
                          style={{ width: `${j.status === "COMPLETED" ? 100 : j.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function cn2(status: string) {
  return `h-full rounded-full ${status === "COMPLETED" ? "bg-success" : status === "FAILED" ? "bg-danger" : "bg-primary"}`;
}
