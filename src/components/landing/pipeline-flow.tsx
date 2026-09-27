"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { FileText, Workflow, Database, Cpu, Table2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const NODES = [
  { id: "req", label: "Requirement", icon: FileText, sub: "plain-English request" },
  { id: "plan", label: "Workflow", icon: Workflow, sub: "AI-designed pipeline" },
  { id: "sources", label: "Sources", icon: Database, sub: "permitted connectors" },
  { id: "process", label: "Processing", icon: Cpu, sub: "clean · validate · resolve" },
  { id: "dataset", label: "Dataset", icon: Table2, sub: "verified & scored" },
];

export function PipelineFlow() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % (NODES.length + 1)), 1400);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="glass glow-ring relative w-full max-w-lg rounded-2xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Live pipeline preview</span>
        <span className="flex items-center gap-1.5 text-[11px] text-success">
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-success" /> running
        </span>
      </div>
      <div className="space-y-2">
        {NODES.map((n, i) => {
          const state = i < active ? "done" : i === active ? "running" : "pending";
          return (
            <div key={n.id} className="relative">
              <motion.div
                animate={{
                  borderColor: state === "running" ? "hsl(191 91% 55% / 0.5)" : "hsl(220 12% 15%)",
                  backgroundColor: state === "pending" ? "hsl(240 9% 6.5% / 0.6)" : "hsl(240 9% 9% / 0.8)",
                }}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3.5 py-2.5",
                  state === "running" && "shadow-[0_0_18px_rgba(20,184,232,0.15)]"
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-md border",
                    state === "done" ? "border-success/30 bg-success/10 text-success" :
                    state === "running" ? "border-primary/40 bg-primary/10 text-primary" :
                    "border-border bg-muted/40 text-muted-foreground"
                  )}
                >
                  {state === "done" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <n.icon className="h-3.5 w-3.5" />}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium">{n.label}</div>
                  <div className="text-[10px] text-muted-foreground">{n.sub}</div>
                </div>
                {state === "running" ? (
                  <div className="h-1 w-16 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full bg-primary"
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      style={{ width: "60%" }}
                    />
                  </div>
                ) : null}
                {state === "done" ? <span className="font-mono text-[10px] text-success">ok</span> : null}
              </motion.div>
              {i < NODES.length - 1 ? (
                <div className="ml-[26px] h-2.5 w-px bg-gradient-to-b from-primary/40 to-transparent" />
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="mt-4 rounded-lg border border-border bg-background/50 p-3 font-mono text-[10px] leading-relaxed text-muted-foreground">
        <span className="text-primary">query</span> → &quot;Find Indian SaaS companies hiring
        Node.js developers&quot; → <span className="text-success">128 verified records</span>
      </div>
    </div>
  );
}
