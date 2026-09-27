import Link from "next/link";
import {
  ArrowRight, Sparkles, Database, Workflow, ShieldCheck, GitBranch, Search,
  History, Download, Layers, Boxes, Network, CheckCircle2, Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PipelineFlow } from "@/components/landing/pipeline-flow";
import { PromptDemo } from "@/components/landing/prompt-demo";

const FEATURES = [
  { icon: Sparkles, title: "Natural Language Data Requests", desc: "Describe what you need in plain English. The AI extracts intent, entities, filters, and output fields." },
  { icon: Workflow, title: "AI Workflow Planning", desc: "Every request gets a purpose-built pipeline: discovery, verification, resolution, scoring — visibly, not magically." },
  { icon: Database, title: "Multi-Source Collection", desc: "Official APIs, public datasets, permitted sites, and your own CSV/JSON/RSS/database connectors." },
  { icon: Layers, title: "Intelligent Extraction", desc: "Structured fields pulled from raw pages with per-field confidence and provenance." },
  { icon: CheckCircle2, title: "Data Cleaning", desc: "Normalization, formatting repairs, and type enforcement before anything reaches your dataset." },
  { icon: Network, title: "Entity Resolution", desc: "Records describing the same real-world entity are matched and merged — not double-counted." },
  { icon: Copy, title: "Deduplication", desc: "Conflicting values are flagged for human review, never silently resolved." },
  { icon: GitBranch, title: "Source Traceability", desc: "Every field carries its source, confidence, and processing history." },
  { icon: ShieldCheck, title: "Data Quality Scoring", desc: "Completeness × provenance × consistency, computed transparently per record." },
  { icon: Search, title: "Semantic Search", desc: "Ask questions across all your datasets in natural language." },
  { icon: History, title: "Dataset History", desc: "Full lineage from requirement to record, every job reproducible." },
  { icon: Download, title: "Export & API", desc: "CSV and JSON exports with a provenance manifest, ready for your stack." },
];

const STEPS = [
  { k: "ASK", d: "One sentence describing the data you need." },
  { k: "PLAN", d: "AI designs the pipeline and picks permitted sources." },
  { k: "COLLECT", d: "Connectors gather raw records, honestly labeled." },
  { k: "VERIFY", d: "Cleaning, validation, dedup, conflict review, quality scoring." },
  { k: "DELIVER", d: "Interactive dataset with lineage, search, and exports." },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo />
            <span className="text-sm font-semibold tracking-tight">DataForge AI</span>
            <Badge tone="demo" className="ml-1 hidden sm:inline-flex">HACKATHON BUILD</Badge>
          </div>
          <nav className="hidden items-center gap-6 text-xs text-muted-foreground md:flex">
            <a href="#product" className="hover:text-foreground">Product</a>
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#principles" className="hover:text-foreground">Principles</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link href="/register"><Button size="sm">Build a Dataset<ArrowRight className="h-3.5 w-3.5" /></Button></Link>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="relative">
        <div className="grid-bg absolute inset-0" />
        <div className="container relative grid gap-10 py-20 lg:grid-cols-2 lg:py-28">
          <div className="flex flex-col justify-center">
            <div className="mb-5 flex items-center gap-2">
              <Badge tone="info"><Sparkles className="h-3 w-3" /> AI Data Intelligence Platform</Badge>
            </div>
            <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
              Turn Any Data Requirement Into a <span className="text-gradient">Working Intelligence Pipeline</span>
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
              Describe what you need in plain English. DataForge AI plans, collects, validates, and delivers
              a clean, source-backed dataset — with every field traceable to its source.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/register">
                <Button size="lg">Build a Dataset<ArrowRight className="h-4 w-4" /></Button>
              </Link>
              <Link href="/login?demo=1">
                <Button size="lg" variant="outline">Explore Demo</Button>
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-success" /> Source transparency</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-success" /> Never fabricates data</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-success" /> Human review for conflicts</span>
            </div>
          </div>
          <div className="flex items-center">
            <PipelineFlow />
          </div>
        </div>
      </section>

      {/* prompt demo strip */}
      <section className="border-y border-border/60 bg-card/30 py-14">
        <div className="container">
          <PromptDemo />
        </div>
      </section>

      {/* from question to dataset */}
      <section id="how" className="py-20">
        <div className="container">
          <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">From Question to Dataset</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted-foreground">
            Five stages, fully observable. Nothing happens in a black box.
          </p>
          <div className="mt-12 grid gap-4 md:grid-cols-5">
            {STEPS.map((s, i) => (
              <div key={s.k} className="glass glass-hover relative rounded-xl p-4">
                <div className="text-[11px] font-mono text-primary">{`0${i + 1}`}</div>
                <div className="mt-2 text-sm font-semibold">{s.k}</div>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{s.d}</p>
                {i < STEPS.length - 1 ? (
                  <ArrowRight className="absolute -right-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-muted-foreground/40 md:block" />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* features */}
      <section id="product" className="border-t border-border/60 py-20">
        <div className="container">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">An operating system for data intelligence</h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Not a chatbot bolted to a table — a pipeline engine with provenance, review workflows, and quality scoring at its core.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="glass glass-hover rounded-xl p-5">
                <f.icon className="h-4.5 w-4.5 text-primary" />
                <h3 className="mt-3 text-sm font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* principles */}
      <section id="principles" className="border-t border-border/60 py-20">
        <div className="container grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Trust is the product</h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
              An intelligence dataset is worthless if you can&apos;t trust it. DataForge is built on explicit
              epistemic rules:
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Never fabricate collected data",
                "Never claim a source was accessed when it wasn't",
                "Never silently resolve conflicting information",
                "Never hide uncertainty — confidence is shown, always",
                "Label everything: AI-generated, source-derived, user-provided, human-verified, demo",
              ].map((p) => (
                <li key={p} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span className="text-muted-foreground">{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="glass rounded-xl p-6">
            <div className="text-xs font-medium text-muted-foreground">Example field provenance</div>
            <div className="mt-4 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between rounded-lg border border-border bg-background/60 px-3 py-2">
                <span>website</span>
                <Badge tone="info">SOURCE · 0.94</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-background/60 px-3 py-2">
                <span>email</span>
                <Badge tone="ai">AI-GENERATED · 0.50</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-background/60 px-3 py-2">
                <span>employeeCount</span>
                <Badge tone="warning">CONFLICT · IN REVIEW</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-background/60 px-3 py-2">
                <span>foundedYear</span>
                <Badge tone="success">HUMAN-VERIFIED</Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* final CTA */}
      <section className="border-t border-border/60 py-24">
        <div className="container text-center">
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight">
            From one sentence to a verified, source-backed dataset.
          </h2>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/register"><Button size="lg">Build a Dataset<ArrowRight className="h-4 w-4" /></Button></Link>
            <Link href="/login?demo=1"><Button size="lg" variant="outline">Explore the Demo</Button></Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-8">
        <div className="container flex flex-col items-center justify-between gap-3 text-xs text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2"><Logo size={16} /> DataForge AI</div>
          <div>Describe the Data. We Build the Intelligence.</div>
        </div>
      </footer>
    </div>
  );
}

function Logo({ size = 22 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center rounded-md bg-primary/15" style={{ width: size, height: size }}>
      <Boxes className="text-primary" style={{ width: size * 0.62, height: size * 0.62 }} />
    </div>
  );
}
