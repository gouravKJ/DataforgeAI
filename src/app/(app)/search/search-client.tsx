"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { SearchIcon, Search as SearchLucide, Network, Type } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton, EmptyState } from "@/components/ui/skeleton";
import { QualityRing } from "@/components/quality-ring";

type Result = {
  recordId: string;
  datasetId: string;
  datasetName: string;
  name: string;
  snippet: string;
  location: string;
  industry: string;
  qualityScore: number;
  score: number;
};

export function SearchClient() {
  const [q, setQ] = useState("");
  const [mode, setMode] = useState<"semantic" | "keyword">("semantic");
  const [submitted, setSubmitted] = useState<{ q: string; mode: string } | null>(null);

  const { data: datasets } = useQuery({
    queryKey: ["datasets"],
    queryFn: async () => {
      const res = await fetch("/api/datasets");
      return (await res.json()) as { datasets: { id: string; name: string }[] };
    },
  });

  const { data, isFetching } = useQuery({
    queryKey: ["search", submitted?.q, submitted?.mode],
    queryFn: async () => {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: submitted!.q, mode: submitted!.mode }),
      });
      if (!res.ok) throw new Error("Search failed");
      return (await res.json()) as { results: Result[]; total: number };
    },
    enabled: !!submitted,
  });

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-xl font-semibold tracking-tight">Semantic Search</h1>
      <p className="mt-0.5 text-xs text-muted-foreground">Ask across all your datasets — meaning, not just keywords.</p>

      <form
        className="mt-5 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim().length >= 2) setSubmitted({ q, mode });
        }}
      >
        <div className="relative min-w-[220px] flex-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder='e.g. "companies hiring Node.js in Bengaluru"' className="pl-9" />
        </div>
        <Select value={mode} onChange={(e) => setMode(e.target.value as any)} className="w-36">
          <option value="semantic">Semantic</option>
          <option value="keyword">Keyword</option>
        </Select>
        <Button type="submit" disabled={isFetching}>
          <SearchLucide className="h-4 w-4" /> Search
        </Button>
      </form>

      <div className="mt-6">
        {!submitted ? (
          <EmptyState
            icon={<Network className="h-8 w-8" />}
            title="Search your intelligence"
            description="Semantic mode blends hashed-embedding similarity with keyword matching; keyword mode is exact-term."
          />
        ) : isFetching ? (
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
        ) : !data || data.results.length === 0 ? (
          <EmptyState icon={<SearchLucide className="h-8 w-8" />} title="No results" description="Try different terms, or switch to keyword mode." />
        ) : (
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground">{data.total} result(s) · {submitted.mode} mode</p>
            {data.results.map((r) => (
              <Link key={r.recordId} href={`/datasets/${r.datasetId}`}>
                <Card className="glass-hover mb-2 flex items-center gap-4 p-4 transition-colors hover:border-primary/30">
                  <QualityRing value={r.qualityScore} size={38} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{r.name}</span>
                      <Badge tone="outline" className="text-[9px]">{r.datasetName}</Badge>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{r.snippet || `${r.industry} · ${r.location}`}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xs text-primary">{(r.score * 100).toFixed(0)}%</div>
                    <div className="text-[10px] text-muted-foreground">match</div>
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
