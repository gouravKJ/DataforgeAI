"use client";

import { useQuery } from "@tanstack/react-query";
import { Gauge } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
  PieChart, Pie, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton, EmptyState } from "@/components/ui/skeleton";
import { QualityRing } from "@/components/quality-ring";
import { formatNumber } from "@/lib/utils";

type DatasetPayload = {
  dataset: { id: string; name: string; recordCount: number; avgQuality: number };
  records: { id: string; qualityScore: number; status: string; conflict: boolean }[];
  stats: { provenanceSource: number; provenanceAi: number; totalFields: number; validationRate: number; flagged: number; conflicts: number };
};

export function QualityClient() {
  const { data: datasets } = useQuery({
    queryKey: ["datasets"],
    queryFn: async () => {
      const res = await fetch("/api/datasets");
      return (await res.json()) as { datasets: { id: string; name: string; recordCount: number; avgQuality: number }[] };
    },
  });

  const firstId = datasets?.datasets?.[0]?.id;
  const { data, isLoading } = useQuery({
    queryKey: ["dataset-quality", firstId],
    queryFn: async () => {
      const res = await fetch(`/api/datasets/${firstId}`);
      return (await res.json()) as DatasetPayload;
    },
    enabled: !!firstId,
  });

  const buckets = [0, 0, 0, 0, 0];
  for (const r of data?.records ?? []) {
    const idx = Math.min(4, Math.floor(r.qualityScore * 5));
    buckets[idx]!++;
  }
  const bucketData = buckets.map((n, i) => ({ range: `${i * 20}-${i * 20 + 20}%`, count: n }));
  const COLORS = ["hsl(0 84% 62%)", "hsl(38 92% 56%)", "hsl(191 91% 55%)", "hsl(191 91% 55%)", "hsl(160 84% 45%)"];

  const provenanceData = data
    ? [
        { name: "Source-derived", value: data.stats.provenanceSource },
        { name: "AI-generated", value: data.stats.provenanceAi },
        { name: "Other", value: Math.max(0, data.stats.totalFields - data.stats.provenanceSource - data.stats.provenanceAi) },
      ].filter((x) => x.value > 0)
    : [];

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight"><Gauge className="h-5 w-5 text-primary" /> Data Quality</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">Transparent scoring: completeness × provenance × consistency.</p>
        </div>
        {datasets && datasets.datasets.length > 0 ? (
          <Badge tone="info">Analyzing: {datasets.datasets[0]!.name}</Badge>
        ) : null}
      </div>

      {isLoading || !data ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64" />)}</div>
      ) : data.records.length === 0 ? (
        <div className="mt-6"><EmptyState title="No records yet" description="Build a dataset to see quality analytics." /></div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Quality score distribution</CardTitle>
                <CardDescription>Records bucketed by composite score</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={bucketData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                      <CartesianGrid stroke="hsl(220 12% 15%)" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="range" tick={{ fontSize: 10, fill: "hsl(217 10% 62%)" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(217 10% 62%)" }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: "hsl(240 9% 8%)", border: "1px solid hsl(220 12% 15%)", borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {bucketData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Field provenance mix</CardTitle>
                <CardDescription>Across all dataset fields</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={provenanceData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                        {provenanceData.map((_, i) => (
                          <Cell key={i} fill={["hsl(191 91% 55%)", "hsl(267 89% 66%)", "hsl(217 10% 40%)"][i % 3]} />
                        ))}
                      </Pie>
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: "hsl(240 9% 8%)", border: "1px solid hsl(220 12% 15%)", borderRadius: 8, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Validation rate</div>
              <div className="mt-1 text-xl font-semibold">{Math.round(data.stats.validationRate * 100)}%</div>
            </Card>
            <Card className="p-4">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Flagged records</div>
              <div className="mt-1 text-xl font-semibold text-warning">{data.stats.flagged}</div>
            </Card>
            <Card className="p-4">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Conflicts in review</div>
              <div className="mt-1 text-xl font-semibold text-warning">{data.stats.conflicts}</div>
            </Card>
            <Card className="p-4">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg quality</div>
              <div className="mt-1 text-xl font-semibold">{Math.round(data.dataset.avgQuality * 100)}%</div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
