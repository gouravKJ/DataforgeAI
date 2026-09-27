"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Send, Bot, User as UserIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Spinner } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Msg = { id: string; role: string; content: string; createdAt?: string };

const SUGGESTED = [
  "Which companies have the highest quality records?",
  "How are records distributed across sources?",
  "What industries dominate this dataset?",
  "How many records are there in total?",
];

export function CopilotClient() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [datasetId, setDatasetId] = useState<string>("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: datasets } = useQuery({
    queryKey: ["datasets"],
    queryFn: async () => {
      const res = await fetch("/api/datasets");
      return (await res.json()) as { datasets: { id: string; name: string; recordCount: number }[] };
    },
  });

  useEffect(() => {
    fetch("/api/copilot")
      .then((r) => r.json())
      .then((d) => setMessages(d.messages ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function ask(question: string) {
    if (!question.trim() || busy) return;
    setBusy(true);
    setInput("");
    const optimistic: Msg = { id: `tmp-${Date.now()}`, role: "user", content: question };
    setMessages((m) => [...m, optimistic]);
    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, datasetId: datasetId || null }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        { id: `a-${Date.now()}`, role: "assistant", content: data.answer || data.error || "No answer." },
      ]);
    } catch {
      setMessages((m) => [...m, { id: `e-${Date.now()}`, role: "assistant", content: "Something went wrong. Try again." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-3.5rem)] max-w-3xl flex-col p-6 lg:h-screen">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <Sparkles className="h-5 w-5 text-primary" /> DataForge Copilot
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">Grounded in your datasets. Cites records. Never fabricates.</p>
        </div>
        <Select value={datasetId} onChange={(e) => setDatasetId(e.target.value)} className="w-52 text-xs">
          <option value="">Latest dataset</option>
          {(datasets?.datasets ?? []).map((d) => (
            <option key={d.id} value={d.id}>{d.name} ({d.recordCount})</option>
          ))}
        </Select>
      </div>

      <Card className="mt-4 flex min-h-0 flex-1 flex-col">
        <CardContent className="min-h-0 flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Ask about your data</p>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                  Copilot answers only from your datasets — with record-level citations.
                </p>
              </div>
              <div className="grid w-full max-w-md gap-2">
                {SUGGESTED.map((s) => (
                  <button
                    key={s}
                    onClick={() => ask(s)}
                    className="rounded-lg border border-border bg-background/40 px-3.5 py-2 text-left text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((m) => (
                <div key={m.id} className={cn("flex items-start gap-2.5", m.role === "user" ? "flex-row-reverse" : "")}>
                  <div className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                    m.role === "user" ? "bg-muted" : "bg-primary/10"
                  )}>
                    {m.role === "user" ? <UserIcon className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5 text-primary" />}
                  </div>
                  <div className={cn(
                    "max-w-[80%] whitespace-pre-wrap rounded-xl px-3.5 py-2.5 text-xs leading-relaxed",
                    m.role === "user" ? "rounded-tr-sm bg-primary/15" : "rounded-tl-sm border border-border bg-background/50"
                  )}>
                    {m.content}
                  </div>
                </div>
              ))}
              {busy ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Spinner /> Copilot is analyzing dataset records…
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
        <div className="border-t border-border p-3">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
          >
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about quality, sources, segments, specific records…" />
            <Button type="submit" disabled={busy || !input.trim()}><Send className="h-4 w-4" /></Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
