"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plug, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge, StatusDot } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton, EmptyState } from "@/components/ui/skeleton";
import { timeAgo } from "@/lib/utils";

type SourceRow = {
  id: string;
  key: string;
  name: string;
  type: string;
  enabled: boolean;
  availability: string;
  reliability: number;
  rateLimit: string;
  expectedFields: string[];
  termsNote: string;
  demo: boolean;
  lastCheckedAt: string | null;
  lastResult: string;
};

export function SourcesClient() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["sources"],
    queryFn: async () => {
      const res = await fetch("/api/sources");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { sources: SourceRow[] };
    },
  });

  async function toggle(source: SourceRow, enabled: boolean) {
    await fetch("/api/sources", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: source.id, enabled }),
    });
    qc.invalidateQueries({ queryKey: ["sources"] });
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="flex items-center gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Sources</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Permitted connectors and their live status. Availability is checked, never assumed.
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-info/20 bg-primary/5 px-3.5 py-2.5 text-[11px] text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        DataForge only accesses sources your organization has enabled, honoring their terms and rate limits.
        Demo connectors produce clearly-labeled synthetic data — they are never presented as real collection.
      </div>

      <div className="mt-5 space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : !data || data.sources.length === 0 ? (
          <EmptyState icon={<Plug className="h-8 w-8" />} title="No sources registered" />
        ) : (
          data.sources.map((s) => (
            <Card key={s.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusDot status={s.availability} />
                    <span className="text-sm font-medium">{s.name}</span>
                    <Badge tone="outline">{s.type}</Badge>
                    {s.demo ? <Badge tone="demo">DEMO DATA</Badge> : null}
                    <Badge tone={s.availability === "AVAILABLE" ? "success" : "warning"}>{s.availability}</Badge>
                  </div>
                  <div className="mt-2 grid gap-x-6 gap-y-1 text-[11px] text-muted-foreground sm:grid-cols-2">
                    <span>Reliability: <span className="font-mono text-foreground">{(s.reliability * 100).toFixed(0)}%</span></span>
                    <span>Rate limit: <span className="font-mono text-foreground">{s.rateLimit}</span></span>
                    <span>Expected fields: <span className="font-mono text-foreground">{s.expectedFields.slice(0, 4).join(", ") || "—"}</span></span>
                    <span>Last checked: <span className="font-mono text-foreground">{timeAgo(s.lastCheckedAt)}</span> · {s.lastResult}</span>
                  </div>
                  <p className="mt-2 border-t border-border/60 pt-2 text-[11px] italic text-muted-foreground">{s.termsNote}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.enabled ? "Enabled" : "Disabled"}</span>
                  <Switch checked={s.enabled} onCheckedChange={(v) => toggle(s, v)} />
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
