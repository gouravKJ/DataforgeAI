"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Database, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton, EmptyState } from "@/components/ui/skeleton";
import { QualityRing } from "@/components/quality-ring";
import { formatNumber, timeAgo } from "@/lib/utils";

type DatasetRow = {
  id: string;
  name: string;
  description: string;
  query: string;
  status: string;
  recordCount: number;
  avgQuality: number;
  origin: string;
  createdBy: string;
  createdAt: string;
};

export function DatasetsClient() {
  const { data, isLoading } = useQuery({
    queryKey: ["datasets"],
    queryFn: async () => {
      const res = await fetch("/api/datasets");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { datasets: DatasetRow[] };
    },
  });

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Datasets</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">Verified, source-backed intelligence deliverables.</p>
        </div>
        <Link href="/build"><Button><Plus className="h-4 w-4" /> Build a Dataset</Button></Link>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}</div>
        ) : !data || data.datasets.length === 0 ? (
          <EmptyState
            icon={<Database className="h-8 w-8" />}
            title="No datasets yet"
            description="Describe a data requirement and DataForge will plan, collect, clean, dedupe, and score it for you."
            action={<Link href="/build"><Button size="sm">Build a Dataset</Button></Link>}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.datasets.map((d) => (
              <Link key={d.id} href={`/datasets/${d.id}`}>
                <Card className="glass-hover h-full p-5 transition-colors hover:border-primary/30">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold">{d.name}</span>
                        {d.origin === "DEMO" ? <Badge tone="demo">DEMO</Badge> : null}
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">{d.query}</p>
                    </div>
                    <QualityRing value={d.avgQuality} />
                  </div>
                  <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{formatNumber(d.recordCount)} records</span>
                    <span>{timeAgo(d.createdAt)}</span>
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
