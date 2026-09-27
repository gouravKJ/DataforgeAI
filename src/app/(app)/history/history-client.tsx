"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { History as HistoryIcon, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, StatusDot } from "@/components/ui/badge";
import { Skeleton, EmptyState } from "@/components/ui/skeleton";
import { timeAgo } from "@/lib/utils";

type JobRow = {
  id: string;
  type: string;
  status: string;
  currentStage: string;
  dataset: { id: string; name: string } | null;
  createdAt: string;
  finishedAt: string | null;
};

export function HistoryClient() {
  const { data, isLoading } = useQuery({
    queryKey: ["jobs-all"],
    queryFn: async () => {
      const res = await fetch("/api/jobs?limit=200");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { jobs: JobRow[] };
    },
    refetchInterval: 8000,
  });

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight"><HistoryIcon className="h-5 w-5 text-primary" /> History</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">Every pipeline run, with full lineage back to its requirement.</p>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : !data || data.jobs.length === 0 ? (
          <EmptyState icon={<HistoryIcon className="h-8 w-8" />} title="No history yet" description="Run a pipeline to populate the timeline." />
        ) : (
          <div className="relative space-y-2 pl-4">
            <div className="absolute bottom-2 left-[7px] top-2 w-px bg-border" />
            {data.jobs.map((j) => (
              <div key={j.id} className="relative">
                <span className="absolute -left-4 top-1/2 -translate-y-1/2"><StatusDot status={j.status} /></span>
                <Link href={`/workflows/${j.id}`}>
                  <Card className="glass-hover flex flex-wrap items-center gap-3 p-3.5 transition-colors hover:border-primary/30">
                    <span className="text-sm font-medium">{j.dataset?.name ?? "Untitled run"}</span>
                    <Badge tone={j.status === "COMPLETED" ? "success" : j.status === "RUNNING" ? "info" : j.status === "FAILED" ? "danger" : "warning"}>{j.status}</Badge>
                    <span className="text-[11px] text-muted-foreground">{j.currentStage} · {timeAgo(j.createdAt)}</span>
                    <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground/50" />
                  </Card>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
