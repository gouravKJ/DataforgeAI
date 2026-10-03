"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal,
  Database,
  Filter,
  CheckCircle2,
  Sparkles,
  Sparkle,
} from "lucide-react";

interface PromptScenario {
  id: string;
  tabLabel: string;
  query: string;
  interpretation: { label: string; val: string }[];
  sources: string[];
}

const SCENARIOS: PromptScenario[] = [
  {
    id: "saas",
    tabLabel: "SaaS Hiring",
    query: "Find Indian SaaS companies founded after 2021 that are hiring Node.js developers.",
    interpretation: [
      { label: "Location", val: "India" },
      { label: "Industry", val: "SaaS" },
      { label: "Founded", val: "after 2021" },
      { label: "Hiring", val: "Node.js" },
    ],
    sources: [
      "Official APIs & Registries",
      "Public Corporate Data",
      "Permitted Web Connectors",
    ],
  },
  {
    id: "fintech",
    tabLabel: "Fintech Founders",
    query: "Extract seed-stage fintech founders in London with active GitHub repositories.",
    interpretation: [
      { label: "Location", val: "London, UK" },
      { label: "Industry", val: "Fintech" },
      { label: "Stage", val: "Seed" },
      { label: "Signals", val: "Active GitHub" },
    ],
    sources: [
      "Companies House UK",
      "GitHub Public API",
      "LinkedIn Permitted Profiles",
    ],
  },
  {
    id: "health",
    tabLabel: "AI Healthcare",
    query: "Collect verified list of AI healthcare startups in California with over 10 employees.",
    interpretation: [
      { label: "Location", val: "California, US" },
      { label: "Domain", val: "AI Healthcare" },
      { label: "Company Size", val: ">10 Employees" },
      { label: "Status", val: "Verified Active" },
    ],
    sources: [
      "SEC Edgar Filings",
      "Crunchbase Open Data",
      "Clinical Trials Registry",
    ],
  },
];

export function PromptDemo() {
  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const [isAutoCycling, setIsAutoCycling] = useState(true);

  // AUTO CYCLE SCENARIOS EVERY 5 SECONDS UNLESS USER INTERACTS
  useEffect(() => {
    if (!isAutoCycling) return;
    const interval = setInterval(() => {
      setActiveTabIdx((prev) => (prev + 1) % SCENARIOS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isAutoCycling]);

  const currentScenario = SCENARIOS[activeTabIdx];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="grid gap-8 lg:grid-cols-12 items-center text-[#1D1D1B] select-none px-2 sm:px-0"
    >
      {/* LEFT COLUMN */}
      <div className="lg:col-span-5 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-4">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#1D1D1B] bg-[#F7CE78] px-4 py-1.5 rounded-full border border-[#1D1D1B]/20 w-max shadow-xs flex items-center gap-2">
            <Sparkle className="h-3.5 w-3.5 fill-[#1D1D1B]" />
            TRY IT MENTALLY
          </span>
        </div>

        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-[#1D1D1B] leading-[1.15]">
          One sentence in. <br />
          <span className="bg-[#9794F7] px-3.5 py-0.5 rounded-2xl inline-block mt-1 shadow-xs">
            A pipeline out.
          </span>
        </h2>

        <p className="mt-4 text-xs sm:text-sm text-[#1D1D1B]/75 font-medium leading-relaxed max-w-md">
          Describe what you need in plain English. DataForge AI extracts intent, entities, filters, and permitted output fields automatically.
        </p>

        {/* INTERACTIVE PROMPT TAB SWITCHERS */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono font-bold text-[#1D1D1B]/60 mr-1 w-full sm:w-auto">
            SELECT SAMPLE PROMPT:
          </span>
          {SCENARIOS.map((scenario, idx) => {
            const isActive = idx === activeTabIdx;
            return (
              <button
                key={scenario.id}
                onClick={() => {
                  setActiveTabIdx(idx);
                  setIsAutoCycling(false);
                }}
                className={`relative px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all border shadow-xs ${
                  isActive
                    ? "bg-[#1D1D1B] text-white border-[#1D1D1B] scale-105"
                    : "bg-white text-[#1D1D1B] border-[#1D1D1B]/20 hover:border-[#1D1D1B]"
                }`}
              >
                {scenario.tabLabel}
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute -bottom-1 left-2 right-2 h-0.5 bg-[#6E40FF] rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT COLUMN - ANIMATED MOTA LIGHT CONSOLE FORM UI */}
      <div className="lg:col-span-7">
        <div className="rounded-3xl border-2 border-[#1D1D1B] bg-white p-4 sm:p-6 shadow-2xl overflow-hidden relative">
          {/* CONSOLE HEADER */}
          <div className="flex items-center justify-between border-b border-[#1D1D1B]/15 pb-3.5 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1D1D1B] text-white shadow-xs">
                <Terminal className="h-4 w-4" />
              </div>
              <span className="font-mono text-xs font-extrabold text-[#1D1D1B] uppercase tracking-wider">
                NATURAL_LANGUAGE_PARSER
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-extrabold bg-[#A1E0DE] text-[#1D1D1B] px-3 py-1 rounded-full border border-[#1D1D1B]/20 shadow-xs flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#1D1D1B] animate-pulse" />
                ACTIVE
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {/* ANIMATED INPUT QUERY DISPLAY */}
            <div className="rounded-2xl border border-[#1D1D1B]/20 bg-[#F8F8F5] p-3.5 sm:p-4.5 font-mono text-xs text-[#1D1D1B] flex items-start gap-3 shadow-inner relative overflow-hidden min-h-[72px] sm:min-h-[80px]">
              <span className="text-[#6E40FF] font-extrabold text-sm shrink-0">&gt;</span>
              
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentScenario.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="leading-relaxed font-bold text-xs sm:text-sm text-[#1D1D1B] pr-4"
                >
                  &quot;{currentScenario.query}&quot;
                  <span className="inline-block w-2 h-4 bg-[#6E40FF] ml-1.5 animate-pulse translate-y-0.5" />
                </motion.p>
              </AnimatePresence>
            </div>

            {/* ANIMATED FILTERS & SOURCES GRID */}
            <div className="grid gap-3.5 sm:grid-cols-2">
              {/* AI INTERPRETATION CARD */}
              <div className="rounded-2xl border border-[#1D1D1B]/15 bg-[#FFFDF3] p-4 shadow-sm hover:border-[#1D1D1B] transition-colors">
                <div className="flex items-center justify-between border-b border-[#1D1D1B]/10 pb-2 mb-3">
                  <div className="flex items-center gap-1.5 font-mono text-xs font-extrabold text-[#1D1D1B] uppercase tracking-wider">
                    <Filter className="h-3.5 w-3.5 text-[#6E40FF]" />
                    <span>AI Interpretation</span>
                  </div>
                  <Sparkles className="h-3.5 w-3.5 text-[#F7CE78]" />
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentScenario.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="space-y-2"
                  >
                    {currentScenario.interpretation.map((e, idx) => (
                      <motion.div
                        key={e.label}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05, ease: "easeOut" }}
                        className="flex justify-between items-center text-xs"
                      >
                        <span className="text-[#1D1D1B]/65 font-medium">{e.label}:</span>
                        <span className="font-mono font-extrabold text-[#1D1D1B] bg-white border border-[#1D1D1B]/15 px-2 py-0.5 rounded-md text-[11px] shadow-2xs">
                          {e.val}
                        </span>
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* CONNECTORS & SOURCES CARD */}
              <div className="rounded-2xl border border-[#1D1D1B]/15 bg-[#F5F4FE] p-4 shadow-sm hover:border-[#1D1D1B] transition-colors">
                <div className="flex items-center justify-between border-b border-[#1D1D1B]/10 pb-2 mb-3">
                  <div className="flex items-center gap-1.5 font-mono text-xs font-extrabold text-[#1D1D1B] uppercase tracking-wider">
                    <Database className="h-3.5 w-3.5 text-[#6E40FF]" />
                    <span>Connectors & Sources</span>
                  </div>
                  <span className="font-mono text-[9px] font-extrabold bg-[#9794F7] text-[#1D1D1B] px-2 py-0.5 rounded-full border border-[#1D1D1B]/10">
                    PERMITTED
                  </span>
                </div>

                <AnimatePresence mode="wait">
                  <motion.ul
                    key={currentScenario.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="space-y-2 text-xs"
                  >
                    {currentScenario.sources.map((src, idx) => (
                      <motion.li
                        key={src}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05, ease: "easeOut" }}
                        className="flex items-center gap-2 text-[#1D1D1B] font-bold bg-white border border-[#1D1D1B]/15 px-2.5 py-1 rounded-xl shadow-2xs"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#6E40FF] shrink-0" />
                        <span className="font-mono text-[11px] font-extrabold truncate">{src}</span>
                      </motion.li>
                    ))}
                  </motion.ul>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
