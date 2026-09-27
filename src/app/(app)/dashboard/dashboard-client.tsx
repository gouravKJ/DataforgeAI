"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Database, Zap, Boxes, Plug, ShieldCheck, Copy, Gauge, ArrowRight, ClipboardCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge, StatusDot } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton, EmptyState, Spinner } from "@/components/ui/skeleton";
import { QualityRing } from "@/components/quality-ring";
import { formatNumber, timeAgo, cn } from "@/lib/utils";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";

type Overview = {
  metrics: {
    datasetsCreated: number;
    activeJobs: number;
    recordsCollected: number;
    sourcesUsed: number;
    validationRate: number;
    duplicateRate: number;
    avgQuality: number;
    pendingReviews: number;
  };
  recentDatasets: { id: string; name: string; recordCount: number; avgQuality: number; createdBy: string; createdAt: string; origin: string }[];
  recentJobs: { id: string; status: string; currentStage: string; dataset: { id: string; name: string } | null; createdAt: string }[];
  sourceHealth: { id: string; name: string; type: string; enabled: boolean; availability: string; demo: boolean }[];
  qualityTrend: { name: string; quality: number; records: number }[];
};

async function fetchOverview(): Promise<Overview> {
  const res = await fetch("/api/overview");
  if (!res.ok) throw new Error("Failed to load overview");
  return res.json();
}

const CHART_TOOLTIP = {
  contentStyle: {
    background: "hsl(240 9% 8%)",
    border: "1px solid hsl(220 12% 15%)",
    borderRadius: 8,
    fontSize: 12,
  },
};

export function DashboardClient() {
  const { data, isLoading } = useQuery({ queryKey: ["overview"], queryFn: fetchOverview, refetchInterval: 15_000 });

  if (isLoading || !data) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-72" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="mt-6 h-64" />
      </div>
    );
  }

  const m = data.metrics;

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Data Intelligence Command Center</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {m.activeJobs > 0
              ? `${m.activeJobs} collection job(s) running — monitoring live.`
              : "All pipelines idle. Describe a new requirement to forge a dataset."}
          </p>
        </div>
        <Link href="/build">
          <Button><Zap className="h-4 w-4" /> Build a Dataset</Button>
        </Link>
      </div>

      {/* metric strip */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        <Metric icon={Database} label="Datasets Created" value={formatNumber(m.datasetsCreated)} />
        <Metric icon={Zap} label="Active Jobs" value={formatNumber(m.activeJobs)} accent={m.activeJobs > 0} />
        <Metric icon={Boxes} label="Records Collected" value={formatNumber(m.recordsCollected)} />
        <Metric icon={Plug} label="Sources Used" value={formatNumber(m.sourcesUsed)} />
        <Metric icon={ShieldCheck} label="Validation Rate" value={`${Math.round(m.validationRate * 100)}%`} />
        <Metric icon={Copy} label="Duplicate Rate" value={`${Math.round(m.duplicateRate * 100)}%`} />
        <Metric icon={Gauge} label="Avg Data Quality" value={`${Math.round(m.avgQuality * 100)}%`} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* quality trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Data quality across datasets</CardTitle>
            <CardDescription>Average record quality score per dataset (0–100)</CardDescription>
          </CardHeader>
          <CardContent>
            {data.qualityTrend.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-xs text-muted-foreground">
                No datasets yet — build one to see the trend.
              </div>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.qualityTrend} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="q" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(191 91% 55%)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="hsl(191 91% 55%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="hsl(220 12% 15%)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(217 10% 62%)" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(217 10% 62%)" }} axisLine={false} tickLine={false} />
                    <Tooltip {...CHART_TOOLTIP} />
                    <Area type="monotone" dataKey="quality" stroke="hsl(191 91% 55%)" strokeWidth={2} fill="url(#q)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>AI recommendations</CardTitle>
            <CardDescription>Operational nudges from your workspace state</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.metrics.pendingReviews > 0 ? (
              <Rec
                icon={ClipboardCheck}
                tone="warning"
                title={`${data.metrics.pendingReviews} record review(s) pending`}
                desc="Conflicting values are waiting for human verification."
                href="/reviews"
              />
            ) : null}
            {m.avgQuality > 0 && m.avgQuality < 0.8 ? (
              <Rec
                icon={Gauge}
                tone="info"
                title="Average quality below 80%"
                desc="Review flagged records and enrich low-provenance fields before exporting."
                href="/quality"
              />
            ) : null}
            {m.datasetsCreated === 0 ? (
              <Rec
                icon={Zap}
                tone="info"
                title="Forge your first dataset"
                desc='Try: "Find Indian SaaS companies founded after 2021 that are hiring Node.js developers."'
                href="/build"
              />
            ) : null}
            {data.metrics.pendingReviews === 0 && (m.avgQuality >= 0.8 || m.datasetsCreated === 0) ? (
              <Rec icon={Plug} tone="success" title="Sources healthy" desc="All connectors passed their last availability check." href="/sources" />
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* recent datasets */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Recent datasets</CardTitle>
              <CardDescription>Newest intelligence deliveries</CardDescription>
            </div>
            <Link href="/datasets" className="text-xs text-muted-foreground hover:text-foreground">View all →</Link>
          </CardHeader>
          <CardContent>
            {data.recentDatasets.length === 0 ? (
              <EmptyState
                title="No datasets yet"
                description="Your forged datasets will appear here with quality scores and lineage."
                action={<Link href="/build"><Button size="sm">Build a Dataset</Button></Link>}
              />
            ) : (
              <div className="space-y-2">
                {data.recentDatasets.map((d) => (
                  <Link key={d.id} href={`/datasets/${d.id}`} className="flex items-center gap-3 rounded-lg border border-border bg-background/40 p-3 transition-colors hover:border-primary/30">
                    <QualityRing value={d.avgQuality} size={38} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{d.name}</span>
                        {d.origin === "DEMO" ? <Badge tone="demo">DEMO</Badge> : null}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {formatNumber(d.recordCount)} records · by {d.createdBy} · {timeAgo(d.createdAt)}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* jobs + source health */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Recent collection jobs</CardTitle>
                <CardDescription>Live pipeline executions</CardDescription>
              </div>
              <Link href="/workflows" className="text-xs text-muted-foreground hover:text-foreground">All →</Link>
            </CardHeader>
            <CardContent>
              {data.recentJobs.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">No jobs yet.</p>
              ) : (
                <div className="space-y-2">
                  {data.recentJobs.slice(0, 5).map((j) => (
                    <Link key={j.id} href={`/workflows/${j.id}`} className="flex items-center gap-2.5 rounded-lg border border-border bg-background/40 px-3 py-2 text-xs hover:border-primary/30">
                      <StatusDot status={j.status} />
                      <span className="min-w-0 flex-1 truncate">{j.dataset?.name ?? "Untitled"}</span>
                      <span className="text-[10px] text-muted-foreground">{j.currentStage}</span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Source health</CardTitle>
              <CardDescription>Connector availability</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.sourceHealth.slice(0, 6).map((s) => (
                  <div key={s.id} className="flex items-center gap-2.5 text-xs">
                    <StatusDot status={s.availability} />
                    <span className="min-w-0 flex-1 truncate">{s.name}</span>
                    {s.demo ? <Badge tone="demo" className="text-[9px]">DEMO</Badge> : null}
                    {!s.enabled ? <Badge tone="outline" className="text-[9px]">OFF</Badge> : null}
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

function Metric({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent?: boolean }) {
  return (
    <Card className={cn("p-4", accent && "border-primary/40 glow-ring")}>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-1.5 text-xl font-semibold tabular-nums">{value}</div>
    </Card>
  );
}

function Rec({ icon: Icon, tone, title, desc, href }: { icon: any; tone: "info" | "warning" | "success"; title: string; desc: string; href: string }) {
  return (
    <Link href={href} className="block rounded-lg border border-border bg-background/40 p-3 transition-colors hover:border-primary/30">
      <div className="flex items-start gap-2.5">
        <Icon className={cn("mt-0.5 h-4 w-4", tone === "warning" ? "text-warning" : tone === "success" ? "text-success" : "text-primary")} />
        <div>
          <div className="text-xs font-medium">{title}</div>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{desc}</p>
        </div>
      </div>
    </Link>
  );
}
