"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Download, Search as SearchIcon, Sparkles, X, ExternalLink,
  GitBranch, ShieldAlert, CheckCircle2, Filter, Copy as CopyIcon, Network, Eraser, Gauge,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Skeleton, EmptyState, Spinner } from "@/components/ui/skeleton";
import { QualityRing } from "@/components/quality-ring";
import { ProvenanceBadge } from "@/components/provenance-badge";
import { cn, formatNumber, timeAgo } from "@/lib/utils";

type FieldMeta = {
  provenance: "SOURCE" | "AI_GENERATED" | "USER" | "DEMO";
  confidence: number;
  sources: { sourceKey: string; sourceName: string; confidence: number }[];
  verified: boolean;
  history: { at: string; action: string; note: string }[];
};

type DatasetPayload = {
  dataset: {
    id: string;
    name: string;
    description: string;
    query: string;
    recordCount: number;
    avgQuality: number;
    origin: string;
    createdBy: string;
    createdAt: string;
    requirement: any;
    plan: any;
    jobs: { id: string; status: string; createdAt: string; currentStage: string }[];
  };
  records: {
    id: string;
    data: Record<string, unknown>;
    fieldMeta: Record<string, FieldMeta>;
    qualityScore: number;
    status: string;
    conflict: boolean;
    conflicts: any[];
  }[];
  stats: {
    sourceCounts: Record<string, number>;
    industryCounts: Record<string, number>;
    flagged: number;
    conflicts: number;
    provenanceSource: number;
    provenanceAi: number;
    provenanceDemo: number;
    totalFields: number;
    validationRate: number;
  };
};

export function DatasetExplorerClient({ datasetId }: { datasetId: string }) {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [selected, setSelected] = useState<string | null>(null);
  const [insight, setInsight] = useState<string | null>(null);
  const [insightBusy, setInsightBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["dataset", datasetId],
    queryFn: async () => {
      const res = await fetch(`/api/datasets/${datasetId}`);
      if (!res.ok) throw new Error("Not found");
      return (await res.json()) as DatasetPayload;
    },
  });

  const columns = useMemo(() => {
    if (!data) return [];
    const keys = new Set<string>();
    for (const r of data.records) {
      for (const k of Object.keys(r.data)) {
        if (!k.startsWith("__")) keys.add(k);
      }
    }
    const preferred = ["name", "website", "location", "industry", "foundedYear", "employeeCount", "hiringStatus", "fundingStage", "sourceName"];
    return [...keys].sort((a, b) => {
      const ia = preferred.indexOf(a), ib = preferred.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const lower = q.toLowerCase();
    return data.records.filter((r) => {
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (sourceFilter !== "ALL" && String(r.data.sourceName) !== sourceFilter) return false;
      if (lower) {
        const hay = Object.values(r.data).join(" ").toLowerCase();
        if (!hay.includes(lower)) return false;
      }
      return true;
    });
  }, [data, q, statusFilter, sourceFilter]);

  const selectedRecord = data?.records.find((r) => r.id === selected) ?? null;

  async function generateInsight() {
    setInsightBusy(true);
    try {
      const res = await fetch(`/api/datasets/${datasetId}/insights`, { method: "POST" });
      const d = await res.json();
      setInsight(d.insight ?? "Could not generate insight.");
    } finally {
      setInsightBusy(false);
    }
  }

  if (isLoading || !data) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="mt-4 h-96" />
      </div>
    );
  }

  const ds = data.dataset;

  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Link href="/datasets" className="mt-1 rounded-md p-1.5 hover:bg-muted"><ArrowLeft className="h-4 w-4" /></Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{ds.name}</h1>
              {ds.origin === "DEMO" ? <Badge tone="demo">DEMO</Badge> : null}
            </div>
            <p className="mt-0.5 max-w-xl text-xs text-muted-foreground">
              &quot;{ds.query}&quot; · {formatNumber(ds.recordCount)} records · by {ds.createdBy} · {timeAgo(ds.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href={`/api/datasets/${ds.id}/export?format=csv`}><Button variant="outline" size="sm"><Download className="h-3.5 w-3.5" /> CSV</Button></a>
          <a href={`/api/datasets/${ds.id}/export?format=json`}><Button variant="outline" size="sm"><Download className="h-3.5 w-3.5" /> JSON</Button></a>
          <Button size="sm" onClick={generateInsight} disabled={insightBusy}>
            {insightBusy ? <Spinner /> : <Sparkles className="h-3.5 w-3.5" />} AI Insight
          </Button>
        </div>
      </div>

      {/* insight panel */}
      <AnimatePresence>
        {insight ? (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <Card className="mt-4 border-primary/25 bg-primary/5">
              <CardContent className="flex items-start gap-3 p-4">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1 whitespace-pre-wrap text-xs leading-relaxed">{insight}</div>
                <button onClick={() => setInsight(null)} className="rounded p-1 hover:bg-muted"><X className="h-3.5 w-3.5" /></button>
              </CardContent>
            </Card>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* stats strip */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Records" value={formatNumber(ds.recordCount)} />
        <Stat label="Avg Quality" value={`${Math.round(ds.avgQuality * 100)}%`} />
        <Stat label="Validation" value={`${Math.round(data.stats.validationRate * 100)}%`} />
        <Stat label="Conflicts" value={String(data.stats.conflicts)} warn={data.stats.conflicts > 0} />
        <Stat label="Flagged" value={String(data.stats.flagged)} warn={data.stats.flagged > 0} />
        <Stat label="Sources" value={String(Object.keys(data.stats.sourceCounts).length)} />
      </div>

      {/* filters + table */}
      <Card className="mt-5">
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Explorer</CardTitle>
            <CardDescription>{filtered.length} of {data.records.length} records shown</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter records…" className="h-8 w-48 pl-8 text-xs" />
            </div>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-8 w-28 py-0 text-xs">
              <option value="ALL">All status</option>
              <option value="ACTIVE">Active</option>
              <option value="FLAGGED">Flagged</option>
            </Select>
            <Select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="h-8 w-40 py-0 text-xs">
              <option value="ALL">All sources</option>
              {Object.keys(data.stats.sourceCounts).map((s) => <option key={s}>{s}</option>)}
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-16"><EmptyState title="No records match" description="Adjust filters or rebuild the dataset." /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-y border-border bg-muted/30 text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Quality</th>
                    {columns.slice(0, 8).map((c) => (
                      <th key={c} className="px-3 py-2 font-medium">{c}</th>
                    ))}
                    <th className="px-3 py-2 font-medium">Flags</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => setSelected(r.id)}
                      className="cursor-pointer border-b border-border/40 transition-colors hover:bg-muted/25"
                    >
                      <td className="px-3 py-2"><QualityRing value={r.qualityScore} size={30} /></td>
                      {columns.slice(0, 8).map((c) => (
                        <td key={c} className="max-w-[220px] truncate px-3 py-2">
                          {formatCell(r.data[c])}
                        </td>
                      ))}
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          {r.conflict ? <Badge tone="warning">CONFLICT</Badge> : null}
                          {r.status === "FLAGGED" ? <Badge tone="danger">FLAGGED</Badge> : null}
                          {!r.conflict && r.status === "ACTIVE" ? <Badge tone="success">OK</Badge> : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* lineage + composition */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><GitBranch className="h-3.5 w-3.5 text-primary" /> Data Lineage</CardTitle>
            <CardDescription>From requirement to dataset</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 text-xs">
              <LineageRow icon={Sparkles} label="Requirement" value={ds.query} />
              <LineageConnector />
              <LineageRow icon={Network} label="Entity resolution" value={`${ds.plan?.nodes?.length ?? "—"} pipeline stages planned`} />
              <LineageConnector />
              <LineageRow
                icon={Eraser}
                label="Cleaning & validation"
                value={`${Math.round(data.stats.validationRate * 100)}% passed validation`}
              />
              <LineageConnector />
              <LineageRow
                icon={CopyIcon}
                label="Deduplication"
                value={`${data.stats.conflicts} conflict(s) → human review`}
              />
              <LineageConnector />
              <LineageRow icon={Gauge} label="Quality scoring" value={`avg ${Math.round(ds.avgQuality * 100)}% · ${ds.recordCount} records delivered`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Filter className="h-3.5 w-3.5 text-primary" /> Composition</CardTitle>
            <CardDescription>By source and provenance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">By source</div>
              <div className="space-y-1.5">
                {Object.entries(data.stats.sourceCounts).map(([s, n]) => (
                  <div key={s} className="flex items-center gap-2 text-xs">
                    <span className="w-48 truncate text-muted-foreground">{s}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary/70" style={{ width: `${(n / ds.recordCount) * 100}%` }} />
                    </div>
                    <span className="font-mono text-[10px]">{n}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">Field provenance</div>
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge tone="info">{data.stats.provenanceSource} source-derived</Badge>
                <Badge tone="ai">{data.stats.provenanceAi} AI-generated</Badge>
                <Badge tone="demo">{data.stats.provenanceDemo} demo-labeled</Badge>
                <Badge tone="outline">{data.stats.totalFields} total fields</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* record drawer */}
      <AnimatePresence>
        {selectedRecord ? (
          <RecordDrawer
            key={selectedRecord.id}
            record={selectedRecord}
            onClose={() => setSelected(null)}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function formatCell(v: unknown): string {
  if (v == null) return "—";
  if (typeof v === "number") return String(v);
  return String(v).slice(0, 60);
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <Card className="p-3.5">
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-lg font-semibold tabular-nums", warn && "text-warning")}>{value}</div>
    </Card>
  );
}

function LineageRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-border bg-background/40 px-3 py-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
      <div className="min-w-0">
        <span className="font-medium">{label}</span>
        <span className="ml-2 text-muted-foreground">{value}</span>
      </div>
    </div>
  );
}

function LineageConnector() {
  return <div className="ml-6 h-2.5 w-px bg-border" />;
}

function RecordDrawer({ record, onClose }: { record: DatasetPayload["records"][number]; onClose: () => void }) {
  const fields = Object.entries(record.data).filter(([k]) => !k.startsWith("__"));
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.aside
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto border-l border-border bg-card"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card/95 px-5 py-4 backdrop-blur">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">{String(record.data.name ?? "Record")}</h2>
              <QualityRing value={record.qualityScore} size={30} />
            </div>
            <p className="text-[11px] text-muted-foreground">
              {record.status} · dataset record · click a field for provenance
            </p>
          </div>
          <button onClick={onClose} className="rounded p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-4 p-5">
          {record.conflict ? (
            <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-xs">
              <div className="flex items-center gap-2 font-medium text-warning">
                <ShieldAlert className="h-3.5 w-3.5" /> Conflicting field values detected
              </div>
              <p className="mt-1 text-muted-foreground">
                Multiple sources disagreed on the values below. DataForge kept the higher-confidence value and
                routes the conflict to human review — nothing was silently overwritten.
              </p>
              <div className="mt-2 space-y-1.5">
                {(record.conflicts as any[]).slice(0, 4).map((c, i) => (
                  <div key={i} className="rounded border border-border bg-background/50 px-2.5 py-1.5 font-mono text-[10px]">
                    <span className="text-warning">{c.field}</span>: {String(c.values?.[0]?.sourceName)}=&quot;{String(c.values?.[0]?.value)}&quot; vs {String(c.values?.[1]?.sourceName)}=&quot;{String(c.values?.[1]?.value)}&quot;
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Fields & provenance</div>
            <div className="space-y-2">
              {fields.map(([k, v]) => {
                const meta = record.fieldMeta[k];
                return (
                  <div key={k} className="rounded-lg border border-border bg-background/40 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] text-muted-foreground">{k}</span>
                      <ProvenanceBadge provenance={meta?.provenance ?? "SOURCE"} verified={meta?.verified} />
                    </div>
                    <div className="mt-1.5 break-words text-xs">{String(v ?? "—")}</div>
                    {meta ? (
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="rounded bg-muted px-1.5 py-0.5 font-mono">
                          confidence {(meta.confidence * 100).toFixed(0)}%
                        </span>
                        {meta.sources.map((s, i) => (
                          <span key={i} className="rounded bg-muted px-1.5 py-0.5 font-mono">{s.sourceName}</span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Processing history</div>
            <div className="space-y-1.5">
              {Object.entries(record.fieldMeta)
                .flatMap(([field, meta]) => (meta.history ?? []).map((h, i) => ({ ...h, field, key: `${field}-${i}` })))
                .sort((a, b) => a.at.localeCompare(b.at))
                .slice(0, 12)
                .map((h) => (
                  <div key={h.key} className="flex items-start gap-2 rounded border border-border/60 bg-background/30 px-2.5 py-1.5 text-[10px]">
                    <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                    <span>
                      <span className="font-mono text-primary">{h.field}</span> — {h.action}
                      {h.note ? <span className="text-muted-foreground"> · {h.note}</span> : null}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
