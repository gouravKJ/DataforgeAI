"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardCheck, Check, X, Pencil, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Skeleton, EmptyState, Spinner } from "@/components/ui/skeleton";
import { timeAgo } from "@/lib/utils";

type ReviewRow = {
  id: string;
  status: string;
  field: string | null;
  note: string;
  record: { id: string; name: string; dataset: { id: string; name: string }; qualityScore: number };
  original: Record<string, any>;
  corrected: Record<string, any>;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

export function ReviewsClient() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<ReviewRow | null>(null);
  const [corrections, setCorrections] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["reviews"],
    queryFn: async () => {
      const res = await fetch("/api/reviews");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { reviews: ReviewRow[] };
    },
  });

  async function act(reviewId: string, action: "APPROVE" | "CORRECT" | "REJECT", corrected?: Record<string, string>) {
    setBusy(true);
    try {
      await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, action, corrected }),
      });
      qc.invalidateQueries({ queryKey: ["reviews"] });
      qc.invalidateQueries({ queryKey: ["datasets"] });
      setEditing(null);
    } finally {
      setBusy(false);
    }
  }

  const pending = data?.reviews.filter((r) => r.status === "PENDING") ?? [];
  const resolved = data?.reviews.filter((r) => r.status !== "PENDING") ?? [];

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight"><ClipboardCheck className="h-5 w-5 text-primary" /> Human Review</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Conflicting information is never silently resolved — it waits here for a human decision.
        </p>
      </div>

      {isLoading ? (
        <div className="mt-6 space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : pending.length === 0 && resolved.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<ClipboardCheck className="h-8 w-8" />}
            title="Review queue is clear"
            description="When sources disagree on a field value, the conflict appears here for verification."
          />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {pending.length > 0 ? (
            <section>
              <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Pending ({pending.length})</h2>
              <div className="space-y-2">
                {pending.map((r) => (
                  <Card key={r.id} className="border-warning/25">
                    <CardContent className="p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4 text-warning" />
                            <span className="text-sm font-medium">{String(r.record.name)}</span>
                            <Badge tone="outline" className="text-[9px]">{r.record.dataset.name}</Badge>
                          </div>
                          <div className="mt-1 space-y-1 text-xs text-muted-foreground">
                            {Object.entries(r.original).map(([k, v]: any) => (
                              <div key={k} className="font-mono text-[11px]">
                                <span className="text-warning">{k}</span>: {String(v?.values?.[0]?.value)} ({String(v?.values?.[0]?.sourceName)})
                                {" vs "}
                                {String(v?.values?.[1]?.value)} ({String(v?.values?.[1]?.sourceName)})
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button size="sm" variant="outline" disabled={busy} onClick={() => act(r.id, "APPROVE")}>
                            <Check className="h-3.5 w-3.5" /> Keep current
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setEditing(r); setCorrections({}); }}>
                            <Pencil className="h-3.5 w-3.5" /> Correct
                          </Button>
                          <Button size="sm" variant="danger" disabled={busy} onClick={() => act(r.id, "REJECT")}>
                            <X className="h-3.5 w-3.5" /> Reject record
                          </Button>
                        </div>
                      </div>

                      {editing?.id === r.id ? (
                        <div className="mt-3 space-y-2 rounded-lg border border-border bg-background/40 p-3">
                          {Object.entries(r.original).map(([k]: any) => (
                            <div key={k} className="flex items-center gap-2">
                              <span className="w-28 font-mono text-[11px] text-muted-foreground">{k}</span>
                              <Input
                                className="h-7 text-xs"
                                value={corrections[k] ?? ""}
                                onChange={(e) => setCorrections({ ...corrections, [k]: e.target.value })}
                                placeholder="Corrected value"
                              />
                            </div>
                          ))}
                          <div className="flex justify-end gap-2 pt-1">
                            <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                            <Button size="sm" disabled={busy || Object.keys(corrections).length === 0} onClick={() => act(r.id, "CORRECT", corrections)}>
                              {busy ? <Spinner /> : null} Apply corrections
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ) : null}

          {resolved.length > 0 ? (
            <section>
              <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Recently resolved</h2>
              <div className="space-y-2">
                {resolved.slice(0, 8).map((r) => (
                  <Card key={r.id} className="p-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-medium">{String(r.record.name)}</span>
                      <div className="flex items-center gap-2">
                        <Badge tone={r.status === "REJECTED" ? "danger" : r.status === "CORRECTED" ? "info" : "success"}>{r.status}</Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {r.reviewedBy ?? "—"} · {timeAgo(r.reviewedAt ?? r.createdAt)}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
