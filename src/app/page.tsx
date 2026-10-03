"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ShieldCheck,
  Boxes,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PipelineFlow } from "@/components/landing/pipeline-flow";
import { PromptDemo } from "@/components/landing/prompt-demo";
import { OsFeatureSection } from "@/components/landing/os-feature-section";
import { HorizontalProcessFlow } from "@/components/landing/horizontal-process-flow";
import { CustomCursor } from "@/components/ui/custom-cursor";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const DYNAMIC_HERO_WORDS = [
  { text: "pipeline", bg: "bg-[#9794F7]", border: "border-[#1D1D1B]/20 text-[#1D1D1B]" },
  { text: "dataset", bg: "bg-[#F7CE78]", border: "border-[#1D1D1B]/20 text-[#1D1D1B]" },
  { text: "engine", bg: "bg-[#A1E0DE]", border: "border-[#1D1D1B]/20 text-[#1D1D1B]" },
  { text: "workflow", bg: "bg-[#6E40FF]", border: "border-[#6E40FF] text-white" },
  { text: "output", bg: "bg-[#F7CE78]", border: "border-[#1D1D1B]/20 text-[#1D1D1B]" },
];

export default function LandingPage() {
  const [heroWordIdx, setHeroWordIdx] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const heroTextRef = useRef<HTMLDivElement>(null);

  // SCROLL LISTENER FOR MOTA COLLAPSING NAVBAR DOCK
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // MOTA SCROLL-TRIGGERED 3D TEXT REVEALS
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (heroTextRef.current) {
        gsap.fromTo(
          heroTextRef.current,
          { y: 40, opacity: 0, rotateX: 15 },
          { y: 0, opacity: 1, rotateX: 0, duration: 1.1, ease: "power3.out" }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  // HERO DYNAMIC SHORT WORD & BACKGROUND COLOR CYCLER
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroWordIdx((prev) => (prev + 1) % DYNAMIC_HERO_WORDS.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const currentHeroWord = DYNAMIC_HERO_WORDS[heroWordIdx];

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    if (typeof window === "undefined") return;

    if (id === "demo") {
      const el = document.getElementById("demo");
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 70;
        window.scrollTo({ top, behavior: "smooth" });
      }
      return;
    }

    if (id === "how") {
      const st = ScrollTrigger.getById("process-flow-trigger");
      if (st) {
        window.scrollTo({ top: st.start, behavior: "smooth" });
      } else {
        const el = document.getElementById("how");
        if (el) {
          const pinSpacer = el.closest(".pin-spacer") as HTMLElement | null;
          const target = pinSpacer || el;
          const top = target.getBoundingClientRect().top + window.scrollY - 70;
          window.scrollTo({ top, behavior: "smooth" });
        }
      }
      return;
    }

    if (id === "product") {
      const st = ScrollTrigger.getById("feature-os-trigger");
      if (st) {
        window.scrollTo({ top: st.start, behavior: "smooth" });
      } else {
        const el = document.getElementById("product");
        if (el) {
          const pinSpacer = el.closest(".pin-spacer") as HTMLElement | null;
          const target = pinSpacer || el;
          const top = target.getBoundingClientRect().top + window.scrollY - 70;
          window.scrollTo({ top, behavior: "smooth" });
        }
      }
      return;
    }

    if (id === "principles") {
      const st = ScrollTrigger.getById("feature-os-trigger");
      if (st) {
        window.scrollTo({ top: st.start + 2250, behavior: "smooth" });
      } else {
        const el = document.getElementById("product");
        if (el) {
          const pinSpacer = el.closest(".pin-spacer") as HTMLElement | null;
          const target = pinSpacer || el;
          const startTop = target.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({ top: startTop + 2250, behavior: "smooth" });
        }
      }
      return;
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#F8F8F5] text-[#1D1D1B] font-sans selection:bg-[#6E40FF] selection:text-white">
      {/* CUSTOM AMBIENT GLOWING CURSOR EFFECT */}
      <CustomCursor />

      {/* MOTA STICKY FLOATING NAVBAR */}
      <div className="sticky top-2 sm:top-4 z-50 transition-all duration-500 ease-in-out px-2 sm:px-4">
        <header
          className={`mx-auto flex items-center justify-between transition-all duration-500 ease-in-out ${
            scrolled
              ? "max-w-3xl rounded-full border border-[#1D1D1B]/25 bg-[#F8F8F5]/95 backdrop-blur-2xl px-4 sm:px-5 py-2 shadow-2xl shadow-[#1D1D1B]/10 scale-95"
              : "w-full max-w-7xl rounded-2xl border border-[#1D1D1B]/10 bg-[#F8F8F5]/90 backdrop-blur-xl px-4 sm:px-6 py-3 shadow-sm"
          }`}
        >
          {/* BRAND LOGO & TITLE */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <MotaLogo isSpinning={scrolled} />
            <span
              className={`font-bold tracking-tight text-[#1D1D1B] transition-all duration-300 ${
                scrolled ? "text-sm" : "text-base sm:text-lg"
              }`}
            >
              DataForge AI
            </span>
          </div>

          {/* DESKTOP NAVIGATION LINKS WITH ACCURATE SCROLLING */}
          <nav className="hidden items-center gap-7 text-xs font-semibold text-[#1D1D1B]/80 md:flex">
            <a
              href="#demo"
              onClick={(e) => scrollToSection(e, "demo")}
              className="hover:text-[#6E40FF] transition-colors"
            >
              Try It
            </a>
            <a
              href="#how"
              onClick={(e) => scrollToSection(e, "how")}
              className="hover:text-[#6E40FF] transition-colors"
            >
              How it works
            </a>
            <a
              href="#product"
              onClick={(e) => scrollToSection(e, "product")}
              className="hover:text-[#6E40FF] transition-colors"
            >
              Architecture
            </a>
            <a
              href="#principles"
              onClick={(e) => scrollToSection(e, "principles")}
              className="hover:text-[#6E40FF] transition-colors"
            >
              Principles
            </a>
          </nav>

          {/* ACTIONS & MOBILE TOGGLE */}
          <div className="flex items-center gap-2">
            {!scrolled && (
              <Link href="/login" className="hidden sm:inline-block">
                <Button variant="ghost" size="sm" className="text-xs font-bold text-[#1D1D1B] hover:bg-[#1D1D1B]/5 rounded-full px-3.5">
                  Sign in
                </Button>
              </Link>
            )}
            <Link href="/register" className="group mota-btn-hover text-xs px-3.5 py-2 sm:px-5 sm:py-2.5">
              <div className="mota-btn-inner">
                <span className="mota-btn-text">
                  {scrolled ? "Build →" : "Build a Dataset →"}
                </span>
                <span className="mota-btn-text-hover">
                  {scrolled ? "Build →" : "Build a Dataset →"}
                </span>
              </div>
            </Link>

            {/* MOBILE MENU TRIGGER */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-[#1D1D1B] hover:bg-[#1D1D1B]/5 transition-colors"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </header>

        {/* MOBILE NAVIGATION DRAWER */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="md:hidden mt-2 mx-auto max-w-sm rounded-2xl border border-[#1D1D1B]/20 bg-white/95 backdrop-blur-xl p-4 shadow-xl flex flex-col gap-3 font-mono text-xs font-bold text-[#1D1D1B]"
            >
              <a
                href="#demo"
                onClick={(e) => {
                  scrollToSection(e, "demo");
                  setMobileMenuOpen(false);
                }}
                className="p-2.5 rounded-xl hover:bg-[#F8F8F5] transition-colors"
              >
                • Try It
              </a>
              <a
                href="#how"
                onClick={(e) => {
                  scrollToSection(e, "how");
                  setMobileMenuOpen(false);
                }}
                className="p-2.5 rounded-xl hover:bg-[#F8F8F5] transition-colors"
              >
                • How it works
              </a>
              <a
                href="#product"
                onClick={(e) => {
                  scrollToSection(e, "product");
                  setMobileMenuOpen(false);
                }}
                className="p-2.5 rounded-xl hover:bg-[#F8F8F5] transition-colors"
              >
                • Architecture
              </a>
              <a
                href="#principles"
                onClick={(e) => {
                  scrollToSection(e, "principles");
                  setMobileMenuOpen(false);
                }}
                className="p-2.5 rounded-xl hover:bg-[#F8F8F5] transition-colors"
              >
                • Core Principles
              </a>
              <div className="pt-2 border-t border-[#1D1D1B]/10 flex items-center justify-between">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-[#1D1D1B]/20"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-1.5 bg-[#6E40FF] text-white rounded-lg"
                >
                  Build a Dataset →
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MOTA HERO SECTION WITH DYNAMIC CYCLING SHORT WORD HEADING */}
      <section className="relative pt-8 pb-16 lg:pt-16 lg:pb-24 px-3 sm:px-6">
        <div className="grid-bg absolute inset-0 opacity-40" />

        <div className="container relative z-10 grid gap-8 lg:grid-cols-12 items-center max-w-7xl mx-auto">
          {/* HERO LEFT COLUMN */}
          <div ref={heroTextRef} className="lg:col-span-6 flex flex-col justify-center">
            <div className="mb-4 sm:mb-6 flex items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#1D1D1B]/20 bg-white px-3.5 py-1 text-[11px] sm:text-xs font-mono font-bold text-[#1D1D1B] shadow-xs">
                <span>AI Data Intelligence Platform</span>
              </span>
            </div>

            {/* DYNAMIC HIGHLIGHT HEADING WITH SHORT CYCLING WORDS */}
            <h1 className="text-3xl font-extrabold leading-[1.15] tracking-tight sm:text-5xl lg:text-6xl text-[#1D1D1B]">
              Turn Any Data Requirement Into a <br className="hidden sm:inline" />
              <div className="mt-2.5 sm:mt-3 flex items-center gap-2.5 h-[48px] sm:h-[68px]">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={currentHeroWord.text}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    className={`inline-block px-3.5 py-1 sm:px-5 sm:py-1.5 rounded-2xl border shadow-xs capitalize text-2xl sm:text-5xl font-extrabold ${currentHeroWord.bg} ${currentHeroWord.border}`}
                  >
                    {currentHeroWord.text}
                  </motion.span>
                </AnimatePresence>
              </div>
            </h1>

            <p className="mt-5 max-w-lg text-xs sm:text-base leading-relaxed text-[#1D1D1B]/75 font-medium">
              Describe what you need in plain English. DataForge AI plans, collects, validates, and delivers
              a clean, source-backed dataset — with every field traceable to its source.
            </p>

            <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <Link href="/register" className="group mota-btn-hover text-xs sm:text-sm px-7 py-3.5 text-center">
                <div className="mota-btn-inner">
                  <span className="mota-btn-text">Build a Dataset →</span>
                  <span className="mota-btn-text-hover">Build a Dataset →</span>
                </div>
              </Link>
              <Link href="/login?demo=1">
                <button className="w-full sm:w-auto rounded-full border border-[#1D1D1B]/20 bg-white px-6 py-3 text-xs sm:text-sm font-bold text-[#1D1D1B] hover:border-[#1D1D1B] transition-all shadow-xs">
                  Explore Demo
                </button>
              </Link>
            </div>

            {/* TRUST BADGES FROM ORIGINAL HERO */}
            <div className="mt-8 pt-5 border-t border-[#1D1D1B]/10 flex flex-wrap items-center gap-3.5 sm:gap-6 text-[11px] sm:text-xs font-mono font-bold text-[#1D1D1B]/80">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-[#6E40FF]" /> Source transparency
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-[#6E40FF]" /> Never fabricates data
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-[#6E40FF]" /> Human review for conflicts
              </span>
            </div>
          </div>

          {/* HERO RIGHT PIPELINE CONSOLE */}
          <div className="lg:col-span-6 flex items-center justify-center w-full">
            <PipelineFlow />
          </div>
        </div>
      </section>

      {/* MOTA PROMPT DEMO CONSOLE */}
      <section id="demo" className="border-y border-[#1D1D1B]/10 bg-white py-12 sm:py-16 shadow-sm px-3 sm:px-6">
        <div className="container max-w-7xl mx-auto">
          <PromptDemo />
        </div>
      </section>

      {/* GSAP SCROLLTRIGGER PINNED HORIZONTAL PROCESS FLOW CHART WITH ANIMATED CONNECTING LINES */}
      <HorizontalProcessFlow />

      {/* SEAMLESS FEATURE CARDS & PRODUCT IS TRUST CENTER COLLAPSE REVEAL SECTION */}
      <OsFeatureSection />

      {/* GSAP SCROLLTRIGGER MASKED CTA HEADING SECTION */}
      <MaskedCtaSection />

      {/* MOTA FOOTER WITH ORIGINAL TAGLINE */}
      <footer className="border-t border-[#1D1D1B]/10 py-8 sm:py-10 bg-white px-4">
        <div className="container max-w-7xl mx-auto flex flex-col items-center justify-between gap-4 text-xs font-medium text-[#1D1D1B]/70 sm:flex-row text-center sm:text-left">
          <div className="flex items-center gap-2 font-bold text-[#1D1D1B]">
            <MotaLogo size={18} /> DataForge AI
          </div>
          <div>Describe the Data. We Build the Intelligence.</div>
        </div>
      </footer>
    </div>
  );
}

function MaskedCtaSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!sectionRef.current || !textRef.current) return;

    const ctx = gsap.context(() => {
      const words = textRef.current?.querySelectorAll(".mask-word");
      if (!words || !words.length) return;

      gsap.fromTo(
        words,
        {
          color: "rgba(29, 29, 27, 0.15)",
          y: 10,
          filter: "blur(4px)",
        },
        {
          color: "#1D1D1B",
          y: 0,
          filter: "blur(0px)",
          stagger: 0.08,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 85%",
            end: "center 45%",
            scrub: 0.8,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const headlineText = "From one sentence to a verified, source-backed dataset.";

  return (
    <section
      ref={sectionRef}
      className="border-t border-[#1D1D1B]/10 py-20 sm:py-28 bg-[#F8F8F5] relative overflow-hidden select-none px-4"
    >
      <div className="grid-bg absolute inset-0 opacity-40 pointer-events-none" />

      <div className="container text-center max-w-4xl mx-auto relative z-10">
        <h2
          ref={textRef}
          className="text-2xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#1D1D1B] leading-[1.2]"
        >
          {headlineText.split(" ").map((word, i) => {
            const isHighlight = word.includes("source-backed") || word.includes("dataset");
            return (
              <span key={i} className="mask-word inline-block mr-[0.25em] transition-colors">
                {isHighlight ? (
                  <span className="underline decoration-[#6E40FF] decoration-4 underline-offset-8 text-[#1D1D1B]">
                    {word}
                  </span>
                ) : (
                  word
                )}
              </span>
            );
          })}
        </h2>

        <div className="mt-8 sm:mt-10 flex justify-center items-center gap-4">
          <Link href="/register" className="group mota-btn-hover text-xs sm:text-sm px-7 py-3.5 sm:px-9 sm:py-4">
            <div className="mota-btn-inner">
              <span className="mota-btn-text">Build a Dataset →</span>
              <span className="mota-btn-text-hover">Build a Dataset →</span>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}

function MotaLogo({ isSpinning = false, size = 24 }: { isSpinning?: boolean; size?: number }) {
  return (
    <div
      className={`relative flex items-center justify-center rounded-xl bg-[#1D1D1B] text-white shadow-xs transition-transform duration-500 ${
        isSpinning ? "rotate-180 scale-95" : ""
      }`}
      style={{ width: size + 8, height: size + 8 }}
    >
      <Boxes style={{ width: size - 8, height: size - 8 }} className="text-[#A1E0DE]" />
    </div>
  );
}
