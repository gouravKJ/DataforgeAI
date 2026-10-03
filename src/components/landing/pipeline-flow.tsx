"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  FileText,
  Workflow,
  Database,
  Cpu,
  Table2,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const PIPELINE_NODES = [
  {
    id: "requirement",
    title: "Requirement",
    subtitle: "plain-English request",
    icon: FileText,
    badgeColor: "bg-[#F7CE78]",
  },
  {
    id: "workflow",
    title: "Workflow",
    subtitle: "AI-designed pipeline",
    icon: Workflow,
    badgeColor: "bg-[#9794F7]",
  },
  {
    id: "sources",
    title: "Sources",
    subtitle: "permitted connectors",
    icon: Database,
    badgeColor: "bg-[#A1E0DE]",
  },
  {
    id: "processing",
    title: "Processing",
    subtitle: "clean · validate · resolve",
    icon: Cpu,
    badgeColor: "bg-[#F7CE78]",
  },
  {
    id: "dataset",
    title: "Dataset",
    subtitle: "verified & scored",
    icon: Table2,
    badgeColor: "bg-[#9794F7]",
  },
];

export function PipelineFlow() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(1);

  // GSAP SCROLL REVEAL
  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        containerRef.current,
        { scale: 0.95, opacity: 0.5, y: 20 },
        {
          scale: 1,
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 85%",
            end: "top 40%",
            scrub: 0.6,
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // STEP ANIMATION CYCLER
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % PIPELINE_NODES.length);
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-lg rounded-3xl border-2 border-[#1D1D1B] bg-white p-4 sm:p-6 shadow-xl text-[#1D1D1B] select-none transition-transform origin-center"
    >
      {/* HEADER WITH MOTA HERO LIGHT THEME STATUS */}
      <div className="mb-4 sm:mb-5 flex items-center justify-between border-b border-[#1D1D1B]/10 pb-3 sm:pb-4">
        <div className="text-xs sm:text-sm font-extrabold tracking-tight text-[#1D1D1B]">
          Live pipeline preview
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-mono font-bold text-[#1D1D1B] bg-[#A1E0DE] border border-[#1D1D1B]/20 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-xs">
          <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-[#1D1D1B] animate-ping" />
          <span>• running</span>
        </div>
      </div>

      {/* 5 PIPELINE STAGE NODES (MOTA HERO LIGHT THEME STYLING) */}
      <div className="space-y-2.5 sm:space-y-3 relative">
        {PIPELINE_NODES.map((node, index) => {
          const isDone = index < activeStep;
          const isCurrent = index === activeStep;

          return (
            <div key={node.id} className="relative z-10">
              <motion.div
                animate={{
                  borderColor: isCurrent
                    ? "#1D1D1B"
                    : "rgba(29, 29, 27, 0.15)",
                  backgroundColor: isCurrent
                    ? "#F8F8F5"
                    : "rgba(255, 255, 255, 1)",
                  boxShadow: isCurrent
                    ? "0 4px 12px rgba(29, 29, 27, 0.08)"
                    : "none",
                }}
                className={cn(
                  "flex items-center justify-between rounded-2xl border p-2.5 sm:p-3.5 transition-all shadow-xs"
                )}
              >
                {/* LEFT ICON & TITLE */}
                <div className="flex items-center gap-2.5 sm:gap-3.5">
                  <div
                    className={cn(
                      "flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl border transition-colors",
                      isDone
                        ? "border-[#1D1D1B] bg-[#1D1D1B] text-white"
                        : isCurrent
                        ? "border-[#1D1D1B] bg-[#6E40FF] text-white"
                        : "border-[#1D1D1B]/15 bg-[#F8F8F5] text-[#1D1D1B]/50"
                    )}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                    ) : (
                      <node.icon className="h-4 w-4 sm:h-4.5 sm:w-4.5 stroke-[2]" />
                    )}
                  </div>

                  <div className="flex flex-col text-left">
                    <span className="text-xs sm:text-sm font-extrabold text-[#1D1D1B] tracking-tight">
                      {node.title}
                    </span>
                    <span className="text-[10px] sm:text-xs font-mono text-[#1D1D1B]/60 font-medium">
                      {node.subtitle}
                    </span>
                  </div>
                </div>

                {/* RIGHT STATUS INDICATOR */}
                <div>
                  {isDone ? (
                    <span className="font-mono text-[10px] sm:text-xs font-extrabold text-[#1D1D1B] bg-[#A1E0DE] border border-[#1D1D1B]/20 px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full">
                      ok
                    </span>
                  ) : isCurrent ? (
                    <div className="w-14 sm:w-20 h-2 bg-[#1D1D1B]/10 rounded-full overflow-hidden border border-[#1D1D1B]/10">
                      <div className="h-full bg-[#6E40FF] rounded-full w-3/4 animate-pulse" />
                    </div>
                  ) : null}
                </div>
              </motion.div>

              {/* VERTICAL GUIDE CONNECTOR LINE */}
              {index < PIPELINE_NODES.length - 1 && (
                <div className="ml-[21px] sm:ml-[25px] my-0.5 h-1.5 sm:h-2 w-0.5 bg-[#1D1D1B]/20" />
              )}
            </div>
          );
        })}
      </div>

      {/* BOTTOM QUERY CODE BOX */}
      <div className="mt-4 sm:mt-5 rounded-2xl border border-[#1D1D1B]/20 bg-[#F8F8F5] p-3 sm:p-4 font-mono text-[11px] sm:text-xs leading-relaxed text-left space-y-1.5 shadow-inner">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-[#6E40FF] font-extrabold">query</span>
          <span className="text-[#1D1D1B]/50 font-bold">→</span>
          <span className="text-[#1D1D1B] font-bold">
            &quot;Find Indian SaaS companies hiring Node.js developers&quot;
          </span>
          <span className="text-[#1D1D1B]/50 font-bold">→</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="bg-[#A1E0DE] text-[#1D1D1B] border border-[#1D1D1B]/20 px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded font-extrabold text-[10px] sm:text-[11px]">
            128 verified records
          </span>
        </div>
      </div>
    </div>
  );
}
