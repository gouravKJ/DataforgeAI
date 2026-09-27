import type {
  FieldSpec,
  ParsedRequirement,
  WorkflowPlan,
  PlanNode,
} from "@/lib/ai/types";

export const EXAMPLE_PROMPTS = [
  "Find Indian SaaS companies founded after 2021 that are hiring Node.js developers.",
  "Find 100 Indian startups founded after 2021.",
  "Find companies hiring backend developers.",
  "Find sponsors for a college technology event.",
  "Find B2B SaaS companies in Europe with 50-500 employees.",
];

const COUNTRIES = [
  "india", "usa", "united states", "america", "europe", "germany", "france",
  "uk", "united kingdom", "canada", "australia", "singapore", "brazil", "japan",
];

const SKILLS = [
  "node.js", "nodejs", "react", "python", "django", "java", "go", "golang",
  "rust", "kotlin", "swift", "flutter", "vue", "angular", "next.js", "typescript",
  "javascript", "php", "laravel", "ruby", "rails", "devops", "machine learning",
  "data science", "backend", "frontend", "full stack", "mobile", "android", "ios",
];

const INDUSTRIES = [
  "saas", "fintech", "edtech", "healthtech", "e-commerce", "ecommerce",
  "developer tools", "cybersecurity", "ai", "ml", "gaming", "logistics",
  "b2b", "b2c", "d2c", "marketplace", "climate", "crypto", "web3",
];

const FUNDING_STAGES = ["pre-seed", "seed", "series a", "series b", "series c", "angel", "bootstrapped"];

const COUNT_RE = /(\d{1,6})\s*(\+)?\s*(companies|startups|records|leads|prospects|organizations|orgs|datasets|people|candidates|sponsors|contacts|businesses|items)/i;

function tc(w: string) {
  return w.split(/\s+/).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
}

function extractLocation(text: string): ParsedRequirement["location"] {
  for (const c of COUNTRIES) {
    const re = new RegExp(`\\b${c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i");
    if (re.test(text)) {
      const label = c === "usa" || c === "united states" || c === "america" ? "United States" : c === "uk" || c === "united kingdom" ? "United Kingdom" : tc(c);
      const code = ["usa", "united states", "america"].includes(c) ? "US" : c.toUpperCase();
      return { label, code };
    }
  }
  return null;
}

function extractSkills(text: string): string[] {
  const found: string[] = [];
  for (const s of SKILLS) {
    const re = new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    if (re.test(text)) found.push(s.toUpperCase());
  }
  return [...new Set(found)];
}

function extractIndustries(text: string): string[] {
  const found: string[] = [];
  for (const s of INDUSTRIES) {
    const re = new RegExp(`\\b${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(text)) found.push(s === "ai" || s === "ml" ? "AI/ML" : tc(s));
  }
  return [...new Set(found)];
}

function extractFunding(text: string): ParsedRequirement["funding"] {
  const lower = text.toLowerCase();
  for (const stage of FUNDING_STAGES) {
    if (lower.includes(stage)) return { stage: tc(stage), context: "mentioned in request" };
  }
  if (lower.includes("raised") || lower.includes("funding") || lower.includes("funded")) {
    return { stage: "Any", context: "funding mentioned without stage" };
  }
  return null;
}

function extractCount(text: string): number | null {
  const m = text.match(COUNT_RE);
  if (m) return parseInt(m[1]!, 10);
  return null;
}

function extractFoundedAfter(text: string): number | null {
  const m = text.match(/founded\s*(?:after|since|from|post)?\s*(\d{4})/i)
    || text.match(/(?:after|since|from|post)\s*(\d{4})/i)
    || text.match(/newer than\s*(\d{4})/i);
  if (m) return parseInt(m[1]!, 10);
  if (/\b(recent|new|latest|emerging)\b/i.test(text)) return new Date().getFullYear() - 4;
  return null;
}

function extractEmployeeRange(text: string): ParsedRequirement["employeeRange"] {
  const m = text.match(/(\d+)\s*(?:-|to|–)\s*(\d+)\s*(employees|people|staff|headcount)/i);
  if (m) return { min: parseInt(m[1]!, 10), max: parseInt(m[2]!, 10) };
  if (/small (?:companies|startups|businesses)/i.test(text)) return { min: 1, max: 50 };
  return null;
}

function detectIntent(text: string): ParsedRequirement["intent"] {
  const t = text.toLowerCase();
  if (/sponsor/.test(t)) return "SPONSOR_PROSPECTING";
  if (/invest|vc|portfolio/.test(t)) return "INVESTOR_PROSPECTING";
  if (/hire|hiring|recruit|talent|candidate/.test(t)) return "TALENT_SOURCING";
  if (/lead|prospect|customer|b2b|gtm|sales/.test(t)) return "LEAD_GENERATION";
  return "MARKET_RESEARCH";
}

function detectDomain(text: string): ParsedRequirement["domain"] {
  const t = text.toLowerCase();
  if (/sponsor/.test(t)) return "sponsors";
  if (/people|candidate|person|founder(?!s)/.test(t) && !/compan/.test(t)) return "people";
  return "companies";
}

/** Heuristic requirement parser — offline twin of the LLM parser. */
export function localParseRequirement(query: string): ParsedRequirement {
  const intent = detectIntent(query);
  const domain = detectDomain(query);
  const location = extractLocation(query);
  const skills = extractSkills(query);
  const industries = extractIndustries(query);
  const funding = extractFunding(query);
  const count = extractCount(query) ?? (intent === "SPONSOR_PROSPECTING" ? 50 : 100);
  const foundedAfter = extractFoundedAfter(query);
  const employeeRange = extractEmployeeRange(query);
  const hiring = skills.length > 0;

  const filters: string[] = [];
  if (location) filters.push(`location: ${location.label}`);
  if (industries.length) filters.push(`industry: ${industries.join(", ")}`);
  if (foundedAfter) filters.push(`founded after ${foundedAfter}`);
  if (hiring) filters.push(`hiring: ${skills.join(", ")}`);
  if (funding) filters.push(`funding: ${funding.stage}`);
  if (employeeRange) filters.push(`employees: ${employeeRange.min}-${employeeRange.max}`);

  const fields: FieldSpec[] = [
    { key: "name", label: "Name", type: "string", required: true, provenance: "SOURCE" },
    { key: "website", label: "Website", type: "url", required: true, provenance: "SOURCE" },
  ];
  if (domain === "companies") {
    fields.push(
      { key: "location", label: "Location", type: "string", required: false, provenance: "SOURCE" },
      { key: "industry", label: "Industry", type: "string", required: false, provenance: "SOURCE" },
      { key: "foundedYear", label: "Founded", type: "number", required: false, provenance: "SOURCE" },
      { key: "employeeCount", label: "Employees", type: "number", required: false, provenance: "SOURCE" },
    );
  }
  if (hiring) {
    fields.push(
      { key: "hiringStatus", label: "Hiring Status", type: "enum", required: false, provenance: "SOURCE", options: ["ACTIVE", "NOT HIRING", "UNKNOWN"] },
      { key: "jobTitle", label: "Job Title", type: "string", required: false, provenance: "SOURCE" },
      { key: "jobUrl", label: "Job URL", type: "url", required: false, provenance: "SOURCE" },
    );
  }
  fields.push(
    { key: "email", label: "Email", type: "email", required: false, provenance: "AI_GENERATED" },
    { key: "linkedin", label: "LinkedIn", type: "url", required: false, provenance: "AI_GENERATED" },
    { key: "description", label: "Description", type: "text", required: false, provenance: "AI_GENERATED" },
    { key: "sourceName", label: "Source", type: "string", required: true, provenance: "SOURCE" },
  );

  return {
    intent, domain, location, industries, skills, hiring, funding,
    foundedAfter, employeeRange, count, filters, fields,
    notes: "Parsed by the deterministic local engine (LLM unavailable).",
  };
}

/** Deterministic workflow planner — offline twin of the LLM planner. */
export function localPlanWorkflow(req: ParsedRequirement): WorkflowPlan {
  const nodes: PlanNode[] = [
    {
      id: "requirement",
      kind: "REQUIREMENT",
      title: "Requirement",
      description: "Parsed natural-language requirement",
      dependsOn: [],
    },
    {
      id: "source-discovery",
      kind: "SOURCE_DISCOVERY",
      title: "Source Discovery",
      description: "Match requirement to available, permitted sources",
      dependsOn: ["requirement"],
    },
    {
      id: "discovery",
      kind: "DISCOVERY",
      title: req.domain === "people" ? "Profile Discovery" : req.domain === "sponsors" ? "Sponsor Discovery" : "Company Discovery",
      description: "Collect candidate entities from permitted sources",
      dependsOn: ["source-discovery"],
    },
    {
      id: "extraction",
      kind: "EXTRACTION",
      title: "Extraction",
      description: req.hiring ? "Extract structured fields and verify hiring signals" : "Extract structured fields from collected pages",
      dependsOn: ["discovery"],
    },
    {
      id: "cleaning",
      kind: "CLEANING",
      title: "Cleaning",
      description: "Normalize whitespace, fix URL formatting, drop empty fields",
      dependsOn: ["extraction"],
    },
    {
      id: "entity-matching",
      kind: "ENTITY_RESOLUTION",
      title: "Entity Matching",
      description: "Match records referring to the same real-world entity",
      dependsOn: ["cleaning"],
    },
    {
      id: "deduplication",
      kind: "DEDUPLICATION",
      title: "Deduplication",
      description: "Collapse duplicates, keep the most complete record",
      dependsOn: ["entity-matching"],
    },
    {
      id: "validation",
      kind: "VALIDATION",
      title: "Validation",
      description: "Type checks, required fields, format rules, cross-field consistency",
      dependsOn: ["deduplication"],
    },
    {
      id: "quality-scoring",
      kind: "QUALITY_SCORING",
      title: "Quality Scoring",
      description: "Composite completeness/consistency/provenance score",
      dependsOn: ["validation"],
    },
    {
      id: "final-dataset",
      kind: "DATASET",
      title: "Final Dataset",
      description: "Reviewed, source-backed dataset",
      dependsOn: ["quality-scoring"],
    },
  ];

  return {
    summary: `Pipeline for ${req.count} ${req.domain} records${req.location ? ` in ${req.location.label}` : ""}${req.industries.length ? ` (${req.industries.join("/")})` : ""}.`,
    estimatedRecords: req.count,
    estimatedMinutes: Math.max(2, Math.ceil(req.count / 40)),
    nodes,
  };
}

/** Deterministic insight summarizer used when LLM is unavailable. */
export function localDatasetInsights(input: {
  datasetName: string;
  query: string;
  rowCount: number;
  avgQuality: number;
  topIndustries: [string, number][];
  conflictCount: number;
  duplicateRate: number;
  validationRate: number;
  sources: string[];
}): string {
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  return [
    `**Overview** — ${input.datasetName} holds ${input.rowCount} records from ${input.sources.length} source(s): ${input.sources.join(", ")}.`,
    `**Quality** — average quality ${pct(input.avgQuality)}; validation pass rate ${pct(input.validationRate)}; duplicate rate ${pct(input.duplicateRate)}.`,
    input.topIndustries.length ? `**Composition** — largest segments: ${input.topIndustries.slice(0, 3).map(([k, v]) => `${k} (${v})`).join(", ")}.` : "",
    input.conflictCount > 0 ? `**Attention** — ${input.conflictCount} record(s) have conflicting field values awaiting human review.` : "**Conflicts** — none detected.",
    `**Suggested next step** — ${input.avgQuality < 0.8 ? "run a revalidation pass and review flagged records before exporting." : "dataset looks export-ready; consider scheduling a refresh."}`,
  ].filter(Boolean).join("\n\n");
}
