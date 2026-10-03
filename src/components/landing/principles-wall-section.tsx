"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  CheckCircle2,
  Database,
  Eye,
  GitBranch,
  Lock,
  Quote,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface TrustReviewCardData {
  id: string;
  ruleNum: string;
  authorName: string;
  authorRole: string;
  quoteText: string;
  badgeTag: string;
  accentColor: string;
  bgColor: string;
  borderColor: string;
  numBg: string;
  icon: React.ElementType;
}

interface TrustCapsuleData {
  id: string;
  label: string;
  detail: string;
  accentColor: string;
  icon: React.ElementType;
  position: string;
}

const TRUST_CAPSULES: TrustCapsuleData[] = [
  {
    id: "no-fabrication",
    label: "No fabrication",
    detail: "source or null",
    accentColor: "#F7CE78",
    icon: ShieldCheck,
    position: "md:left-[3%] md:top-[30%]",
  },
  {
    id: "source-traceability",
    label: "Source traceability",
    detail: "every request logged",
    accentColor: "#9794F7",
    icon: Database,
    position: "md:right-[2%] md:top-[24%]",
  },
  {
    id: "conflict-review",
    label: "Conflict review",
    detail: "nothing silently merged",
    accentColor: "#A1E0DE",
    icon: GitBranch,
    position: "md:left-[10%] md:bottom-[23%]",
  },
  {
    id: "confidence-visible",
    label: "Confidence visible",
    detail: "uncertainty gets a number",
    accentColor: "#6E40FF",
    icon: Eye,
    position: "md:right-[10%] md:bottom-[18%]",
  },
  {
    id: "human-review",
    label: "Human review",
    detail: "when the sources disagree",
    accentColor: "#F7CE78",
    icon: UserCheck,
    position: "md:left-1/2 md:bottom-[7%] md:-translate-x-1/2",
  },
];

const TRUST_CARDS: TrustReviewCardData[] = [
  {
    id: "trust-1",
    ruleNum: "RULE 01",
    authorName: "Zero Fabrication Rule",
    authorRole: "Data Provenance Engine",
    quoteText:
      "Never fabricate collected data. If a field cannot be retrieved from an authoritative API or permitted source, it remains null - never hallucinated.",
    badgeTag: "PROVENANCE GUARANTEE",
    accentColor: "#F7CE78",
    bgColor: "bg-[#FFFDF3]",
    borderColor: "border-[#F7CE78]/60",
    numBg: "bg-[#F7CE78] text-[#1D1D1B]",
    icon: Sparkles,
  },
  {
    id: "trust-2",
    ruleNum: "RULE 02",
    authorName: "Honest Attribution Rule",
    authorRole: "API Connector Audit",
    quoteText:
      "Never claim a source was accessed when it was not. Every HTTP request is recorded with status codes, headers, and exact timestamps in the audit log.",
    badgeTag: "SOURCE TRACEABILITY",
    accentColor: "#9794F7",
    bgColor: "bg-[#F5F4FE]",
    borderColor: "border-[#9794F7]/60",
    numBg: "bg-[#9794F7] text-[#1D1D1B]",
    icon: Database,
  },
  {
    id: "trust-3",
    ruleNum: "RULE 03",
    authorName: "Explicit Conflict Review",
    authorRole: "Entity Resolution Pipeline",
    quoteText:
      "Never silently resolve conflicting information. Conflicting values across sources are flagged for human review, never silently overwritten.",
    badgeTag: "HUMAN-IN-THE-LOOP",
    accentColor: "#A1E0DE",
    bgColor: "bg-[#F0FAF9]",
    borderColor: "border-[#A1E0DE]/70",
    numBg: "bg-[#A1E0DE] text-[#1D1D1B]",
    icon: GitBranch,
  },
  {
    id: "trust-4",
    ruleNum: "RULE 04",
    authorName: "Visible Confidence Metric",
    authorRole: "Quality Scoring Engine",
    quoteText:
      "Never hide uncertainty - confidence is shown, always. Field-level confidence scores from 0.0 to 1.0 are calculated and published transparently.",
    badgeTag: "TRANSPARENT METRICS",
    accentColor: "#6E40FF",
    bgColor: "bg-[#F6F3FF]",
    borderColor: "border-[#6E40FF]/50",
    numBg: "bg-[#6E40FF] text-white",
    icon: Eye,
  },
];

export function PrinciplesWallSection() {
  const stageRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const capsulesRef = useRef<HTMLDivElement>(null);
  const wallRef = useRef<HTMLDivElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!stageRef.current) return;

    let mediaQuery: gsap.MatchMedia | undefined;
    const ctx = gsap.context(() => {
      mediaQuery = gsap.matchMedia();

      mediaQuery.add("(min-width: 768px)", () => {
        const stage = stageRef.current;
        const headline = headlineRef.current;
        const capsuleElements = capsulesRef.current?.querySelectorAll(
          ".trust-capsule"
        );

        if (!stage || !headline || !capsuleElements?.length) return;

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: stage,
            start: "top top",
            end: "+=2000",
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        // The message grows from the center and stays present for the whole pinned passage.
        tl.fromTo(
          headline,
          { opacity: 0, scale: 0.48, y: 18 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.28,
            ease: "power3.out",
            transformOrigin: "50% 50%",
          },
          0
        );

        // Each capsule rises from below on its own beat and lands around the message.
        capsuleElements.forEach((capsule, index) => {
          tl.fromTo(
            capsule,
            {
              y: 280 + index * 18,
              opacity: 0,
              scale: 0.72,
              rotate: index % 2 === 0 ? -5 : 5,
            },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              rotate: 0,
              duration: 0.24,
              ease: "back.out(1.4)",
            },
            0.18 + index * 0.1
          );
        });

        // Hold the completed composition before the stage releases back to normal scrolling.
        tl.to({}, { duration: 0.48 });

        return () => tl.kill();
      });

      const wallCards = cardsRef.current?.querySelectorAll(".wall-review-card");
      if (wallRef.current && wallCards?.length) {
        const wallTl = gsap.timeline({
          scrollTrigger: {
            trigger: wallRef.current,
            start: "top 78%",
            toggleActions: "play none none reverse",
          },
        });

        wallTl.fromTo(
          receiptRef.current,
          { y: 80, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.65, ease: "power3.out" },
          0
        );
        wallTl.fromTo(
          wallCards,
          { y: 90, opacity: 0, scale: 0.96 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.65,
            stagger: 0.1,
            ease: "power3.out",
          },
          0.16
        );
      }
    });

    return () => {
      mediaQuery?.revert();
      ctx.revert();
    };
  }, []);

  return (
    <section
      id="principles"
      className="relative overflow-hidden border-t border-[#1D1D1B]/10 bg-[#F8F8F5]"
    >
      <div
        ref={stageRef}
        className="relative flex min-h-[100svh] items-center overflow-hidden py-16 md:h-[100svh] md:min-h-[760px] md:max-h-[960px] md:py-10"
      >
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-30" />

        <div className="container relative z-10 flex h-full flex-col items-center justify-center">
          <div className="mb-8 text-center md:mb-0">
            <span className="mb-5 inline-flex rounded-full border border-[#1D1D1B]/20 bg-[#9794F7] px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-widest text-[#1D1D1B] shadow-sm">
              EPISTEMIC GOVERNANCE
            </span>

            <h2
              ref={headlineRef}
              className="relative max-w-6xl text-5xl font-extrabold leading-none text-[#1D1D1B]/10 sm:text-7xl md:text-8xl lg:text-9xl"
            >
              <span className="block md:hidden">
                PRODUCT IS
                <br />
                TRUST
              </span>
              <span className="hidden whitespace-nowrap md:block">PRODUCT IS TRUST</span>
              <span
                aria-hidden="true"
                className="stroke-text pointer-events-none absolute inset-0 block whitespace-nowrap text-transparent opacity-70"
              >
                <span className="block md:hidden">
                  PRODUCT IS
                  <br />
                  TRUST
                </span>
                <span className="hidden whitespace-nowrap md:block">PRODUCT IS TRUST</span>
              </span>
            </h2>

            <p className="mx-auto mt-6 max-w-lg text-sm font-medium leading-relaxed text-[#1D1D1B]/70 sm:text-base">
              Every answer comes with the evidence needed to believe it.
            </p>
          </div>

          <div
            ref={capsulesRef}
            className="mt-8 grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-2 md:mt-0 md:block md:max-w-none"
          >
            {TRUST_CAPSULES.map((capsule) => {
              const Icon = capsule.icon;

              return (
                <div
                  key={capsule.id}
                  className={`trust-capsule relative flex items-center gap-3 rounded-full border-2 border-[#1D1D1B]/20 bg-white px-4 py-3 shadow-lg md:absolute ${capsule.position}`}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#1D1D1B]/15"
                    style={{ backgroundColor: capsule.accentColor }}
                  >
                    <Icon className="h-4 w-4 text-[#1D1D1B]" />
                  </span>
                  <span className="min-w-0 text-left">
                    <span className="block text-xs font-extrabold text-[#1D1D1B]">
                      {capsule.label}
                    </span>
                    <span className="block text-[10px] font-medium text-[#1D1D1B]/60">
                      {capsule.detail}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div ref={wallRef} className="relative border-t border-[#1D1D1B]/10 py-24 sm:py-28">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-20" />
        <div className="container relative z-10">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="mb-4 inline-block rounded-full border border-[#1D1D1B]/20 bg-[#F7CE78] px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-widest text-[#1D1D1B] shadow-sm">
              TRUST RECEIPTS
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-[#1D1D1B] sm:text-5xl">
              Trust, with receipts.
            </h2>
            <p className="mt-3 text-sm font-medium leading-relaxed text-[#1D1D1B]/70 sm:text-base">
              The rules are visible in the product, the audit trail, and every delivered field.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div
              ref={receiptRef}
              className="rounded-3xl border-2 border-[#1D1D1B] bg-white p-6 shadow-2xl sm:p-7"
            >
              <div className="mb-5 flex items-center justify-between border-b border-[#1D1D1B]/15 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1D1D1B] text-white shadow-sm">
                    <Lock className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block font-mono text-xs font-extrabold uppercase tracking-wider text-[#1D1D1B]">
                      Trust receipt / run 042
                    </span>
                    <span className="block text-[10px] font-medium text-[#1D1D1B]/60">
                      Every value carries its own proof
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <ReceiptRow icon={ShieldCheck} label="website" tone="yellow" value="SOURCE-DERIVED / 0.94" />
                <ReceiptRow icon={Database} label="email" tone="purple" value="AI-SUGGESTED / 0.50" />
                <ReceiptRow icon={GitBranch} label="employeeCount" tone="mint" value="CONFLICT / REVIEW" />
                <ReceiptRow icon={UserCheck} label="foundedYear" tone="royal" value="HUMAN-VERIFIED" />
              </div>

              <div className="mt-5 flex items-center gap-2 rounded-xl bg-[#1D1D1B] px-4 py-3 font-mono text-[10px] font-extrabold text-white">
                <CheckCircle2 className="h-4 w-4 text-[#A1E0DE]" />
                ALL SIGNALS VISIBLE
              </div>
            </div>

            <div ref={cardsRef} className="grid gap-5 sm:grid-cols-2">
              {TRUST_CARDS.map((card) => {
                const Icon = card.icon;

                return (
                  <article
                    key={card.id}
                    className={`wall-review-card group relative flex min-h-[260px] flex-col justify-between overflow-hidden rounded-3xl border ${card.borderColor} ${card.bgColor} p-6 shadow-md transition-[box-shadow,transform] duration-300 hover:-translate-y-1 hover:shadow-2xl`}
                  >
                    <div
                      className="absolute left-0 right-0 top-0 h-1.5"
                      style={{ backgroundColor: card.accentColor }}
                    />

                    <div className="flex items-center gap-3 border-b border-[#1D1D1B]/10 pb-3 pt-1">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm"
                        style={{ backgroundColor: card.accentColor }}
                      >
                        <Icon className="h-4 w-4 text-[#1D1D1B]" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-xs font-extrabold leading-tight tracking-tight text-[#1D1D1B]">
                          {card.authorName}
                        </span>
                        <span className="block text-[10px] font-bold text-[#1D1D1B]/60">
                          {card.authorRole}
                        </span>
                      </div>
                    </div>

                    <div className="my-auto py-5">
                      <Quote className="mb-3 h-5 w-5 text-[#1D1D1B]/30" />
                      <blockquote className="text-xs font-medium italic leading-relaxed text-[#1D1D1B]/80">
                        &quot;{card.quoteText}&quot;
                      </blockquote>
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-[#1D1D1B]/10 pt-3 font-mono text-[10px] font-extrabold text-[#1D1D1B]/70">
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 ${card.numBg}`}>
                        {card.ruleNum}
                      </span>
                      <span className="text-right tracking-wider">
                        {card.badgeTag}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReceiptRow({
  icon: Icon,
  label,
  tone,
  value,
}: {
  icon: React.ElementType;
  label: string;
  tone: "yellow" | "purple" | "mint" | "royal";
  value: string;
}) {
  const toneClasses = {
    yellow: "bg-[#FFFDF3] text-[#1D1D1B]",
    purple: "bg-[#F5F4FE] text-[#1D1D1B]",
    mint: "bg-[#F0FAF9] text-[#1D1D1B]",
    royal: "bg-[#6E40FF] text-white",
  };

  return (
    <div className={`flex items-center justify-between gap-3 rounded-2xl border border-[#1D1D1B]/15 p-3 shadow-sm ${toneClasses[tone]}`}>
      <div className="flex min-w-0 items-center gap-2">
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate font-bold">{label}</span>
      </div>
      <span className="shrink-0 text-[9px] font-extrabold tracking-tight">
        {value}
      </span>
    </div>
  );
}
