"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface ProcessStep {
  num: string;
  key: string;
  desc: string;
  pillBg: string;
}

const PROCESS_STEPS: ProcessStep[] = [
  {
    num: "01",
    key: "ASK",
    desc: "One sentence describing the data you need.",
    pillBg: "bg-[#F7CE78]",
  },
  {
    num: "02",
    key: "PLAN",
    desc: "AI designs the pipeline and picks permitted sources.",
    pillBg: "bg-[#9794F7]",
  },
  {
    num: "03",
    key: "COLLECT",
    desc: "Connectors gather raw records, honestly labeled.",
    pillBg: "bg-[#A1E0DE]",
  },
  {
    num: "04",
    key: "VERIFY",
    desc: "Cleaning, validation, dedup, conflict review, quality scoring.",
    pillBg: "bg-[#F7CE78]",
  },
  {
    num: "05",
    key: "DELIVER",
    desc: "Interactive dataset with lineage, search, and exports.",
    pillBg: "bg-[#9794F7]",
  },
];

export function HorizontalProcessFlow() {
  const triggerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (!triggerRef.current || !trackRef.current) return;

    const ctx = gsap.context(() => {
      const track = trackRef.current!;
      const totalWidth = track.scrollWidth - window.innerWidth + (window.innerWidth < 640 ? 120 : 280);

      // Master Timeline for smooth scroll scrubbing and pinning with explicit ScrollTrigger ID
      const tl = gsap.timeline({
        scrollTrigger: {
          id: "process-flow-trigger",
          trigger: triggerRef.current,
          pin: true,
          scrub: 1.2,
          start: "top top",
          end: () => `+=${totalWidth}`,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // 1. Horizontal Scroll Translation
      tl.to(track, {
        x: () => -totalWidth,
        ease: "none",
      });

      // 2. Animated SVG Connecting Line Fill
      if (pathRef.current) {
        const pathLength = pathRef.current.getTotalLength();
        gsap.set(pathRef.current, {
          strokeDasharray: pathLength,
          strokeDashoffset: pathLength,
        });

        tl.to(
          pathRef.current,
          {
            strokeDashoffset: 0,
            ease: "none",
          },
          0
        );
      }

      // 3. Card Focal Highlight Animation & Scale Parallax
      const stepCards = track.querySelectorAll(".mota-process-card");
      stepCards.forEach((card, index) => {
        const startPos = index / (stepCards.length - 1);

        // Highlight active card as scrub hits its position
        tl.to(
          card,
          {
            scale: 1.04,
            borderColor: "#1D1D1B",
            boxShadow: "0 20px 30px -10px rgba(29, 29, 27, 0.15)",
            duration: 0.2,
            ease: "power2.out",
          },
          startPos * 0.8
        ).to(
          card,
          {
            scale: 1,
            borderColor: "rgba(29, 29, 27, 0.15)",
            boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.04)",
            duration: 0.2,
            ease: "power2.in",
          },
          startPos * 0.8 + 0.25
        );
      });
    }, triggerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={triggerRef}
      id="how"
      className="relative min-h-screen w-full bg-[#F8F8F5] overflow-hidden flex flex-col justify-between py-8 sm:py-12 select-none border-t border-[#1D1D1B]/10"
    >
      <div className="grid-bg absolute inset-0 opacity-40 pointer-events-none" />

      {/* SECTION HEADER */}
      <div className="container relative z-10 text-center pt-4 sm:pt-6 px-4">
        <div className="flex items-center justify-center gap-3 mb-3">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#1D1D1B] bg-[#F7CE78] px-4 py-1.5 rounded-full border border-[#1D1D1B]/20 shadow-xs">
            HOW IT WORKS
          </span>
        </div>

        <h2 className="mt-2 text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#1D1D1B]">
          From Question to Dataset
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-[#1D1D1B]/70 font-medium max-w-xl mx-auto leading-relaxed">
          Five stages, fully observable. Nothing happens in a black box.
        </p>
      </div>

      {/* PINNED HORIZONTAL TRACK CONTAINER */}
      <div className="relative w-full my-auto flex items-center overflow-visible">
        {/* SVG ANIMATED CONNECTING LINE BEHIND CARDS */}
        <svg
          className="absolute top-1/2 left-0 w-[2400px] h-20 -translate-y-1/2 pointer-events-none z-0 overflow-visible"
          viewBox="0 0 2400 80"
          fill="none"
        >
          {/* Background track line */}
          <line
            x1="120"
            y1="40"
            x2="2280"
            y2="40"
            stroke="#1D1D1B"
            strokeOpacity="0.1"
            strokeWidth="3"
            strokeDasharray="6 6"
          />
          {/* Animated active scrub line */}
          <path
            ref={pathRef}
            d="M 120 40 L 2280 40"
            stroke="#6E40FF"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>

        {/* HORIZONTAL CARDS TRACK */}
        <div
          ref={trackRef}
          className="relative z-10 flex items-center gap-4 sm:gap-8 px-6 sm:px-12 md:px-32 min-w-max py-6 sm:py-8"
        >
          {PROCESS_STEPS.map((step) => (
            <div
              key={step.key}
              className="mota-process-card relative flex flex-col justify-start gap-3.5 sm:gap-4 w-[250px] sm:w-[320px] h-[210px] sm:h-[240px] rounded-3xl border border-[#1D1D1B]/15 bg-white p-5 sm:p-7 shadow-xs transition-all duration-300 group"
            >
              {/* TOP OVAL PILL BADGE FOR STEP NUMBER */}
              <div className="flex items-center">
                <span
                  className={`inline-flex items-center justify-center font-mono text-xs font-extrabold px-3 py-1 rounded-full text-[#1D1D1B] shadow-xs ${step.pillBg}`}
                >
                  {step.num}
                </span>
              </div>

              {/* CARD TITLE */}
              <h3 className="text-sm sm:text-base font-extrabold tracking-tight text-[#1D1D1B] uppercase group-hover:text-[#6E40FF] transition-colors">
                {step.key}
              </h3>

              {/* CARD DESCRIPTION */}
              <p className="text-xs sm:text-sm leading-relaxed text-[#1D1D1B]/70 font-medium">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
