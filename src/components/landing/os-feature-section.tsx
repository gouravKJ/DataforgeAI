"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Sparkles,
  Workflow,
  Database,
  Layers,
  CheckCircle2,
  Network,
  Copy,
  GitBranch,
  ShieldCheck,
  Search,
  History,
  Download,
  Eye,
  UserCheck,
} from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface FeatureCardData {
  id: string;
  indexNum: string;
  title: string;
  detail: string;
  icon: React.ElementType;
  accentColor: string;
  bgColor: string;
  borderColor: string;
  iconBg: string;
  numBg: string;
}

const FEATURE_MODULES: FeatureCardData[] = [
  {
    id: "nl-requests",
    indexNum: "01",
    title: "Natural Language Requests",
    detail: "Describe what you need in plain English. The AI extracts intent, entities, filters, and output fields.",
    icon: Sparkles,
    accentColor: "#F7CE78",
    bgColor: "bg-[#FFFDF3]",
    borderColor: "border-[#F7CE78]/50",
    iconBg: "bg-[#F7CE78] text-[#1D1D1B]",
    numBg: "bg-[#F7CE78]/25 text-[#1D1D1B]",
  },
  {
    id: "workflow-planning",
    indexNum: "02",
    title: "AI Workflow Planning",
    detail: "Every request gets a purpose-built pipeline: discovery, verification, resolution, scoring — visibly, not magically.",
    icon: Workflow,
    accentColor: "#9794F7",
    bgColor: "bg-[#F5F4FE]",
    borderColor: "border-[#9794F7]/50",
    iconBg: "bg-[#9794F7] text-[#1D1D1B]",
    numBg: "bg-[#9794F7]/25 text-[#1D1D1B]",
  },
  {
    id: "multi-source",
    indexNum: "03",
    title: "Multi-Source Collection",
    detail: "Official APIs, public datasets, permitted sites, and your own CSV/JSON/RSS/database connectors.",
    icon: Database,
    accentColor: "#A1E0DE",
    bgColor: "bg-[#F0FAF9]",
    borderColor: "border-[#A1E0DE]/60",
    iconBg: "bg-[#A1E0DE] text-[#1D1D1B]",
    numBg: "bg-[#A1E0DE]/30 text-[#1D1D1B]",
  },
  {
    id: "intelligent-extract",
    indexNum: "04",
    title: "Intelligent Extraction",
    detail: "Structured fields pulled from raw pages with per-field confidence and provenance.",
    icon: Layers,
    accentColor: "#6E40FF",
    bgColor: "bg-[#F6F3FF]",
    borderColor: "border-[#6E40FF]/40",
    iconBg: "bg-[#6E40FF] text-white",
    numBg: "bg-[#6E40FF]/20 text-[#6E40FF]",
  },
  {
    id: "data-cleaning",
    indexNum: "05",
    title: "Data Cleaning",
    detail: "Normalization, formatting repairs, and type enforcement before anything reaches your dataset.",
    icon: CheckCircle2,
    accentColor: "#F7CE78",
    bgColor: "bg-[#FFFDF3]",
    borderColor: "border-[#F7CE78]/50",
    iconBg: "bg-[#F7CE78] text-[#1D1D1B]",
    numBg: "bg-[#F7CE78]/25 text-[#1D1D1B]",
  },
  {
    id: "entity-resolution",
    indexNum: "06",
    title: "Entity Resolution",
    detail: "Records describing the same real-world entity are matched and merged — not double-counted.",
    icon: Network,
    accentColor: "#9794F7",
    bgColor: "bg-[#F5F4FE]",
    borderColor: "border-[#9794F7]/50",
    iconBg: "bg-[#9794F7] text-[#1D1D1B]",
    numBg: "bg-[#9794F7]/25 text-[#1D1D1B]",
  },
  {
    id: "deduplication",
    indexNum: "07",
    title: "Deduplication",
    detail: "Conflicting values are flagged for human review, never silently resolved.",
    icon: Copy,
    accentColor: "#A1E0DE",
    bgColor: "bg-[#F0FAF9]",
    borderColor: "border-[#A1E0DE]/60",
    iconBg: "bg-[#A1E0DE] text-[#1D1D1B]",
    numBg: "bg-[#A1E0DE]/30 text-[#1D1D1B]",
  },
  {
    id: "source-traceability",
    indexNum: "08",
    title: "Source Traceability",
    detail: "Every field carries its source, confidence, and processing history.",
    icon: GitBranch,
    accentColor: "#6E40FF",
    bgColor: "bg-[#F6F3FF]",
    borderColor: "border-[#6E40FF]/40",
    iconBg: "bg-[#6E40FF] text-white",
    numBg: "bg-[#6E40FF]/20 text-[#6E40FF]",
  },
  {
    id: "quality-scoring",
    indexNum: "09",
    title: "Data Quality Scoring",
    detail: "Completeness × provenance × consistency, computed transparently per record.",
    icon: ShieldCheck,
    accentColor: "#F7CE78",
    bgColor: "bg-[#FFFDF3]",
    borderColor: "border-[#F7CE78]/50",
    iconBg: "bg-[#F7CE78] text-[#1D1D1B]",
    numBg: "bg-[#F7CE78]/25 text-[#1D1D1B]",
  },
  {
    id: "semantic-search",
    indexNum: "10",
    title: "Semantic Search",
    detail: "Ask questions across all your datasets in natural language.",
    icon: Search,
    accentColor: "#9794F7",
    bgColor: "bg-[#F5F4FE]",
    borderColor: "border-[#9794F7]/50",
    iconBg: "bg-[#9794F7] text-[#1D1D1B]",
    numBg: "bg-[#9794F7]/25 text-[#1D1D1B]",
  },
  {
    id: "dataset-history",
    indexNum: "11",
    title: "Dataset History",
    detail: "Full lineage from requirement to record, every job reproducible.",
    icon: History,
    accentColor: "#A1E0DE",
    bgColor: "bg-[#F0FAF9]",
    borderColor: "border-[#A1E0DE]/60",
    iconBg: "bg-[#A1E0DE] text-[#1D1D1B]",
    numBg: "bg-[#A1E0DE]/30 text-[#1D1D1B]",
  },
  {
    id: "export-api",
    indexNum: "12",
    title: "Export & API",
    detail: "CSV and JSON exports with a provenance manifest, ready for your stack.",
    icon: Download,
    accentColor: "#6E40FF",
    bgColor: "bg-[#F6F3FF]",
    borderColor: "border-[#6E40FF]/40",
    iconBg: "bg-[#6E40FF] text-white",
    numBg: "bg-[#6E40FF]/20 text-[#6E40FF]",
  },
];

interface CapsuleData {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  iconBg: string;
  targetX: number;
  targetY: number;
}

const TRUST_CAPSULES: CapsuleData[] = [
  {
    id: "cap-1",
    title: "No fabrication",
    subtitle: "source or null",
    icon: ShieldCheck,
    iconBg: "bg-[#F7CE78] text-[#1D1D1B]",
    targetX: -360,
    targetY: -150,
  },
  {
    id: "cap-2",
    title: "Source traceability",
    subtitle: "every request logged",
    icon: Database,
    iconBg: "bg-[#9794F7] text-[#1D1D1B]",
    targetX: 360,
    targetY: -150,
  },
  {
    id: "cap-3",
    title: "Conflict review",
    subtitle: "nothing silently merged",
    icon: GitBranch,
    iconBg: "bg-[#A1E0DE] text-[#1D1D1B]",
    targetX: -320,
    targetY: 130,
  },
  {
    id: "cap-4",
    title: "Confidence visible",
    subtitle: "uncertainty gets a number",
    icon: Eye,
    iconBg: "bg-[#6E40FF] text-white",
    targetX: 320,
    targetY: 130,
  },
  {
    id: "cap-5",
    title: "Human review",
    subtitle: "when the sources disagree",
    icon: UserCheck,
    iconBg: "bg-[#F7CE78] text-[#1D1D1B]",
    targetX: 0,
    targetY: 220,
  },
];

export function OsFeatureSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const featureHeaderRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const trustSectionRef = useRef<HTMLDivElement>(null);
  const trustBadgeRef = useRef<HTMLDivElement>(null);
  const trustWatermarkRef = useRef<HTMLDivElement>(null);
  const trustSubtitleRef = useRef<HTMLDivElement>(null);
  const capsulesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gridRef.current || !sectionRef.current || !trustSectionRef.current) return;

    const ctx = gsap.context(() => {
      const cards = gridRef.current?.querySelectorAll(".square-feature-card");
      if (!cards || !cards.length) return;

      // Ensure header starts 100% visible
      if (featureHeaderRef.current) {
        gsap.set(featureHeaderRef.current, { opacity: 1, y: 0 });
      }

      // Compute responsive scale offsets for floating capsules based on viewport width
      const winW = window.innerWidth;
      const scaleX = winW < 640 ? 0.38 : winW < 1024 ? 0.65 : 1.0;
      const scaleY = winW < 640 ? 0.45 : winW < 1024 ? 0.75 : 1.0;

      // Master Pinned Timeline: Smooth Scrub from Feature Grid -> Center Collapse -> Product is Trust Reveal
      const tl = gsap.timeline({
        scrollTrigger: {
          id: "feature-os-trigger",
          trigger: sectionRef.current,
          start: "top top",
          end: "+=2600",
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // -------------------------------------------------------------
      // PHASE 0: HEADING FADES OUT & GRID SHIFTS UP TO FILL BLANK SPACE (0.0 -> 0.15)
      // -------------------------------------------------------------
      if (featureHeaderRef.current) {
        tl.to(
          featureHeaderRef.current,
          {
            opacity: 0,
            y: -40,
            duration: 0.15,
            ease: "power2.in",
          },
          0
        );
      }

      // Smoothly shift grid UP to fill blank space left by heading
      if (gridRef.current) {
        tl.to(
          gridRef.current,
          {
            y: winW < 640 ? -30 : -65,
            duration: 0.15,
            ease: "power2.out",
          },
          0
        );
      }

      // -------------------------------------------------------------
      // PHASE 1: CARDS DISTRIBUTE OUTWARDS ONLY AFTER HEADING DISAPPEARS (0.15 -> 0.40)
      // -------------------------------------------------------------
      cards.forEach((card, i) => {
        const col = i % (winW < 640 ? 2 : 4);
        const row = Math.floor(i / (winW < 640 ? 2 : 4));

        const startX = (1.5 - col) * (winW < 640 ? 120 : 220);
        const startY = (1 - row) * (winW < 640 ? 120 : 220);

        tl.fromTo(
          card,
          {
            x: startX,
            y: startY,
            scale: 0.05,
            opacity: 0,
            rotate: i % 2 === 0 ? -25 : 25,
          },
          {
            x: 0,
            y: 0,
            scale: 1,
            opacity: 1,
            rotate: 0,
            duration: 0.25,
            ease: "power2.out",
          },
          0.15
        );
      });

      // -------------------------------------------------------------
      // PHASE 2: CARDS REST & HOLD FOR READING (0.40 -> 0.65)
      // -------------------------------------------------------------
      tl.to({}, { duration: 0.25 });

      // -------------------------------------------------------------
      // PHASE 3: CARDS COLLAPSE BACK INTO CENTER (0.65 -> 0.82)
      // -------------------------------------------------------------
      cards.forEach((card, i) => {
        const col = i % (winW < 640 ? 2 : 4);
        const row = Math.floor(i / (winW < 640 ? 2 : 4));

        const endX = (1.5 - col) * (winW < 640 ? 120 : 220);
        const endY = (1 - row) * (winW < 640 ? 120 : 220);

        tl.to(
          card,
          {
            x: endX,
            y: endY,
            scale: 0.05,
            opacity: 0,
            rotate: i % 2 === 0 ? 25 : -25,
            duration: 0.17,
            ease: "power2.in",
          },
          0.65
        );
      });

      // -------------------------------------------------------------
      // PHASE 4: "PRODUCT IS TRUST" EMERGES FROM THE EXACT SAME CENTER! (0.82 -> 1.0)
      // -------------------------------------------------------------

      // 4a. Fade in Trust Container
      tl.to(
        trustSectionRef.current,
        {
          opacity: 1,
          pointerEvents: "auto",
          duration: 0.08,
        },
        0.82
      );

      // 4b. Top Core Trust Principles Badge expands from center
      if (trustBadgeRef.current) {
        tl.fromTo(
          trustBadgeRef.current,
          { scale: 0.4, opacity: 0, y: 20 },
          { scale: 1, opacity: 1, y: 0, duration: 0.15, ease: "back.out(1.5)" },
          0.82
        );
      }

      // 4c. Giant Outlined "PRODUCT IS TRUST" text expands from center
      if (trustWatermarkRef.current) {
        tl.fromTo(
          trustWatermarkRef.current,
          { scale: 0.6, opacity: 0 },
          { scale: 1, opacity: 0.55, duration: 0.18, ease: "power2.out" },
          0.83
        );
      }

      // 4d. Subtitle text appears in center
      if (trustSubtitleRef.current) {
        tl.fromTo(
          trustSubtitleRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.15, ease: "power2.out" },
          0.85
        );
      }

      // 4e. Floating Trust Capsules EXPLODE OUTWARDS FROM CENTER (Responsively scaled)!
      if (capsulesContainerRef.current) {
        const capsuleElems = capsulesContainerRef.current.querySelectorAll(".trust-floating-capsule");

        capsuleElems.forEach((capsule, idx) => {
          const capData = TRUST_CAPSULES[idx];
          if (!capData) return;

          tl.fromTo(
            capsule,
            {
              x: 0,
              y: 0,
              scale: 0.1,
              opacity: 0,
            },
            {
              x: capData.targetX * scaleX,
              y: capData.targetY * scaleY,
              scale: winW < 640 ? 0.85 : 1,
              opacity: 1,
              duration: 0.18,
              ease: "back.out(1.4)",
            },
            0.85 + idx * 0.03
          );
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="product"
      className="relative h-screen w-full border-t border-[#1D1D1B]/10 bg-[#F8F8F5] select-none overflow-hidden flex flex-col justify-center"
    >
      <div className="grid-bg absolute inset-0 opacity-40 pointer-events-none" />

      {/* ------------------------------------------------------------- */}
      {/* PART 1: SYSTEM ARCHITECTURE 12 CARDS GRID */}
      {/* ------------------------------------------------------------- */}
      <div className="container relative z-10 w-full max-w-7xl mx-auto px-3 sm:px-4 flex flex-col items-center justify-center my-auto">
        {/* EDITORIAL HEADER FOR FEATURES */}
        <div ref={featureHeaderRef} className="flex flex-col items-center text-center mb-4 sm:mb-6 z-30 px-2">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#1D1D1B] bg-[#9794F7] px-4 py-1.5 rounded-full border border-[#1D1D1B]/20 shadow-sm mb-3">
            SYSTEM ARCHITECTURE
          </span>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#1D1D1B]">
            An operating system for{" "}
            <span className="underline decoration-[#6E40FF] decoration-4 underline-offset-8">
              data intelligence
            </span>
          </h2>

          <p className="mt-2.5 max-w-2xl text-xs sm:text-sm leading-relaxed text-[#1D1D1B]/70 font-medium text-center">
            Not a chatbot bolted to a table — a pipeline engine with provenance, review workflows,
            <br className="hidden sm:inline" /> and quality scoring at its core.
          </p>
        </div>

        {/* VIBRANT MOTA PASTEL SQUARE CARDS GRID (SHIFTS UP SMOOTHLY WHEN HEADER FADES) */}
        <div
          ref={gridRef}
          className="relative grid gap-2.5 sm:gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 max-w-6xl mx-auto w-full px-1 sm:px-2"
        >
          {FEATURE_MODULES.map((module) => {
            const Icon = module.icon;

            return (
              <div
                key={module.id}
                className={`square-feature-card group relative h-[120px] sm:h-[150px] flex flex-col justify-between rounded-2xl border ${module.borderColor} ${module.bgColor} p-3 sm:p-4 shadow-sm transition-all duration-300 hover:shadow-xl overflow-hidden`}
              >
                {/* TOP VIBRANT ACCENT BAR */}
                <div
                  className="absolute top-0 left-0 right-0 h-1 sm:h-1.5"
                  style={{ backgroundColor: module.accentColor }}
                />

                {/* CARD TOP BAR */}
                <div className="flex items-center justify-between border-b border-[#1D1D1B]/10 pb-1.5 mt-0.5">
                  <span className={`font-mono text-[9px] sm:text-xs font-extrabold tracking-tight px-2 py-0.5 rounded-full ${module.numBg}`}>
                    {module.indexNum}
                  </span>
                  <div className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg shadow-xs ${module.iconBg} transition-transform duration-300 group-hover:scale-110`}>
                    <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 stroke-[2.5]" />
                  </div>
                </div>

                {/* CARD MAIN CONTENT */}
                <div className="my-auto flex flex-col gap-0.5 sm:gap-1 px-0.5">
                  <h3 className="text-[11px] sm:text-sm font-extrabold text-[#1D1D1B] tracking-tight leading-snug group-hover:text-[#6E40FF] transition-colors line-clamp-1">
                    {module.title}
                  </h3>

                  <p className="text-[10px] sm:text-xs leading-tight sm:leading-snug text-[#1D1D1B]/75 font-medium line-clamp-2 sm:line-clamp-3">
                    {module.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* PART 2: "PRODUCT IS TRUST" FLOATING CAPSULES SECTION */}
      {/* (EMERGES FROM THE EXACT SAME CENTER WHERE CARDS COLLAPSED) */}
      {/* ------------------------------------------------------------- */}
      <div
        ref={trustSectionRef}
        id="principles"
        className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none opacity-0 px-3 sm:px-4 overflow-hidden"
      >
        {/* TOP CORE TRUST PRINCIPLES BADGE */}
        <div ref={trustBadgeRef} className="mb-3 sm:mb-6">
          <span className="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#1D1D1B] bg-[#9794F7] px-3.5 py-1 sm:px-4 sm:py-1.5 rounded-full border border-[#1D1D1B]/20 shadow-sm">
            CORE TRUST PRINCIPLES
          </span>
        </div>

        {/* GIANT OUTLINED "PRODUCT IS TRUST" WATERMARK TEXT */}
        <div
          ref={trustWatermarkRef}
          className="relative text-[9vw] sm:text-[8.5vw] font-extrabold tracking-tighter uppercase text-center leading-none pointer-events-none select-none my-2 sm:my-3"
          style={{
            WebkitTextStroke: "2px #1D1D1B",
            color: "rgba(29, 29, 27, 0.08)",
          }}
        >
          PRODUCT IS TRUST
        </div>

        {/* SUBTITLE */}
        <div ref={trustSubtitleRef} className="mt-2 sm:mt-4 max-w-xs sm:max-w-md text-center">
          <p className="text-xs sm:text-sm font-medium text-[#1D1D1B]/80 tracking-tight leading-relaxed">
            Every answer comes with the evidence needed to believe it.
          </p>
        </div>

        {/* FLOATING CAPSULES CONTAINER (ANIMATE OUTWARDS FROM EXACT CENTER) */}
        <div
          ref={capsulesContainerRef}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          {TRUST_CAPSULES.map((cap) => {
            const Icon = cap.icon;

            return (
              <div
                key={cap.id}
                className="trust-floating-capsule absolute pointer-events-auto rounded-full border border-[#1D1D1B]/20 bg-white px-3.5 py-2 sm:px-5 sm:py-3 shadow-xl flex items-center gap-2.5 sm:gap-3.5 backdrop-blur-md transition-transform duration-300 hover:scale-105 hover:border-[#1D1D1B]"
              >
                {/* ICON BADGE */}
                <div className={`flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full shadow-xs ${cap.iconBg}`}>
                  <Icon className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5 stroke-[2.5]" />
                </div>

                {/* TEXT CONTENT */}
                <div className="flex flex-col text-left">
                  <span className="text-[11px] sm:text-xs font-extrabold text-[#1D1D1B] tracking-tight leading-tight">
                    {cap.title}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-medium text-[#1D1D1B]/65 leading-tight mt-0.5 hidden sm:inline-block">
                    {cap.subtitle}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
