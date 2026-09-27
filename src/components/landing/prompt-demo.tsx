"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowRight, CornerDownRight } from "lucide-react";

const EXAMPLE = "Find Indian SaaS companies founded after 2021 that are hiring Node.js developers.";

const INTERPRETATION = [
  { label: "Location", value: "India" },
  { label: "Industry", value: "SaaS" },
  { label: "Founded", value: "after 2021" },
  { label: "Hiring", value: "Node.js" },
];

const PLAN = [
  "Source Discovery",
  "Company Discovery",
  "Job Verification",
  "Entity Matching",
  "Deduplication",
  "Validation",
  "Quality Scoring",
  "Final Dataset",
];

export function PromptDemo() {
  const [stage, setStage] = useState(0);

  // lightweight cycler: prompt → interpretation → plan
  useEffect(() => {
    const t = setInterval(() => setStage((s) => (s + 1) % 3), 2600);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
      <div>
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Try it mentally</div>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">One sentence in. A pipeline out.</h2>
        <div className="mt-6 rounded-xl border border-primary/25 bg-primary/5 p-4">
          <div className="flex items-start gap-2.5">
            <CornerDownRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="font-mono text-sm leading-relaxed">&quot;{EXAMPLE}&quot;</p>
          </div>
        </div>
        <motion.div
          key={stage}
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 1 }}
          className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"
        >
          <ArrowRight className="h-3.5 w-3.5 text-primary" />
          {stage === 0 ? "AI extracts entities, filters and output fields…" : stage === 1 ? "AI designs an 8-stage collection pipeline…" : "You review the schema, then run."}
        </motion.div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="glass rounded-xl p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">AI interpretation</div>
          <div className="mt-3 space-y-2">
            {INTERPRETATION.map((it) => (
              <div key={it.label} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{it.label}</span>
                <span className="rounded border border-border bg-background/60 px-1.5 py-0.5 font-mono text-[11px]">{it.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Generated workflow</div>
          <div className="mt-3 space-y-1.5">
            {PLAN.map((p, i) => (
              <div key={p} className="flex items-center gap-2 text-xs">
                <span className="w-4 text-right font-mono text-[10px] text-muted-foreground">{i + 1}</span>
                <span className={i === 0 || i === PLAN.length - 1 ? "text-primary" : ""}>{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
