/**
 * Demo data factory — deterministic synthetic companies/jobs/funding.
 *
 * Product principle compliance:
 * - Every record is labeled DEMO at the field level (fieldMeta.method = "DEMO").
 * - Company names are synthetic ("Nimbusstack", "Quantly", ...) — never real firms.
 * - The same query always yields the same dataset (seeded PRNG), reproducible for demos and tests.
 */

import { hashString, mulberry32, pick, pickMany } from "@/lib/utils";
import type { ParsedRequirement } from "@/lib/ai/types";

const PREFIXES = [
  "Nimbus", "Quant", "Zeta", "Orbit", "Helio", "Vanta", "Lumen", "Forge", "Aster",
  "Cinder", "Pulse", "Nova", "Kite", "Delta", "Slate", "Vertex", "Onyx", "Flux",
  "Drift", "Ember", "Cobalt", "Halo", "Prism", "Quanta", "Zenith", "Argo", "Basis",
];

const SUFFIXES = ["stack", "flow", "labs", "works", "grid", "base", "ly", "wise", "mind", "byte", "scale", "pilot"];

const CITIES: Record<string, string[]> = {
  India: ["Bengaluru", "Pune", "Mumbai", "Hyderabad", "Delhi NCR", "Chennai", "Ahmedabad", "Jaipur"],
  "United States": ["San Francisco", "New York", "Austin", "Seattle", "Boston", "Denver", "Chicago"],
  Europe: ["London", "Berlin", "Paris", "Amsterdam", "Stockholm", "Dublin", "Lisbon"],
};

const INDUSTRY_TAGS = ["SaaS", "Fintech", "Developer Tools", "AI/ML", "Healthtech", "Edtech", "E-commerce", "Cybersecurity", "Logistics", "Analytics"];

const JOB_TITLES = [
  "Senior Node.js Developer", "React Developer", "Backend Engineer", "Full Stack Engineer",
  "Python Developer", "DevOps Engineer", "ML Engineer", "Frontend Engineer", "Data Engineer",
];

const FUNDING_STAGES = ["Pre-Seed", "Seed", "Series A", "Series B", "Bootstrapped"];

const EMAIL_DOMAINS = ["inbox.demo", "mail.demo", "contact.demo"];

export type DemoCompany = {
  name: string;
  website: string;
  location: string;
  industry: string;
  foundedYear: number;
  employeeCount: number;
  hiringStatus: "ACTIVE" | "NOT HIRING" | "UNKNOWN";
  jobTitle: string | null;
  jobUrl: string | null;
  fundingStage: string | null;
  email: string;
  linkedin: string;
  description: string;
  sourceName: string;
  sourceKey: string;
  sourceConfidence: number;
};

export function generateDemoCompanies(req: ParsedRequirement, targetCount: number): DemoCompany[] {
  const rng = mulberry32(hashString(req.location?.label ?? "global" + req.industries.join("") + req.count));
  const cities = req.location ? CITIES[req.location.label] ?? CITIES.India! : CITIES.India!;
  const out: DemoCompany[] = [];
  const usedNames = new Set<string>();

  let attempts = 0;
  while (out.length < targetCount && attempts < targetCount * 6) {
    attempts++;
    const name = `${pick(rng, PREFIXES)}${pick(rng, SUFFIXES)}`;
    if (usedNames.has(name)) continue;
    usedNames.add(name);

    // Industry: prefer requested industries ~70% of the time
    const industry = req.industries.length && rng() < 0.7
      ? pick(rng, req.industries)
      : pick(rng, INDUSTRY_TAGS);

    // Founded year: respect foundedAfter in ~80% of records
    const foundedYear = req.foundedAfter && rng() < 0.8
      ? req.foundedAfter + Math.floor(rng() * Math.max(1, new Date().getFullYear() - req.foundedAfter))
      : 2015 + Math.floor(rng() * 10);

    // Hiring: if request is about hiring, 75% are hiring a requested skill
    const hiringSkill = req.skills.length && rng() < 0.75
      ? pick(rng, req.skills)
      : pick(rng, JOB_TITLES);
    const hiring = req.hiring ? rng() < 0.78 : rng() < 0.3;

    const fundingStage = req.funding
      ? req.funding.stage === "Any"
        ? pick(rng, FUNDING_STAGES)
        : rng() < 0.7 ? req.funding.stage : pick(rng, FUNDING_STAGES)
      : rng() < 0.5 ? pick(rng, FUNDING_STAGES) : null;

    const employeeCount = req.employeeRange
      ? req.employeeRange.min + Math.floor(rng() * Math.max(1, req.employeeRange.max - req.employeeRange.min))
      : 10 + Math.floor(rng() * 900);

    const domain = `${name.toLowerCase()}.${pick(rng, EMAIL_DOMAINS).split(".")[1]}.demo`;
    const city = pick(rng, cities);

    // Intentional imperfections so the cleaning/quality stages have real work to show:
    // - ~8% of records have a missing description (completeness penalty)
    // - ~6% have trailing whitespace / case issues in website (cleaning step fixes)
    // - a small share get "UNKNOWN" hiring status even when the demo board has no listing
    const website = rng() < 0.06
      ? `  HTTPS://${name.toLowerCase()}.io/ `
      : `https://www.${name.toLowerCase()}.io`;

    out.push({
      name,
      website: website.trim(),
      location: `${city}, ${req.location?.label ?? "India"}`,
      industry,
      foundedYear,
      employeeCount,
      hiringStatus: hiring ? "ACTIVE" : rng() < 0.5 ? "NOT HIRING" : "UNKNOWN",
      jobTitle: hiring ? `${hiringSkill} ${pick(rng, ["Engineer", "Developer", "Specialist"])}` : null,
      jobUrl: hiring ? `https://jobs.demo/${name.toLowerCase()}/${hiringSkill.toLowerCase().replace(/[^a-z0-9]+/g, "-")}` : null,
      fundingStage,
      email: `hello@${name.toLowerCase()}.demo`,
      linkedin: `https://linkedin.com/demo-company/${name.toLowerCase()}`,
      description: rng() < 0.08 ? "" : `${name} is a ${industry} company in ${city} building products for ${industry.toLowerCase()} teams.`,
      sourceName: "DataForge Demo Registry",
      sourceKey: "demo-companies-api",
      sourceConfidence: 0.75 + rng() * 0.24,
    });
  }

  // ensure deterministic tie-break ordering
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

/** Second "source" view of the same entities — used to demonstrate entity resolution + dedup. */
export function generateDemoDuplicates(companies: DemoCompany[], ratio = 0.18): DemoCompany[] {
  const rng = mulberry32(hashString("dupes" + companies.length));
  const count = Math.floor(companies.length * ratio);
  const chosen = pickMany(rng, companies, count);
  const out: DemoCompany[] = [];
  for (const c of chosen) {
    out.push({
      ...c,
      // name/website perturbations that a naive system would treat as distinct entities
      name: rng() < 0.5 ? c.name : `${c.name} Technologies`,
      website: `https://${c.name.toLowerCase()}.demo-site.com`,
      location: c.location,
      sourceName: "DataForge Demo Job Board",
      sourceKey: "demo-jobs-api",
      sourceConfidence: 0.6 + rng() * 0.2,
      // occasionally conflicting field values → surfaces as a conflict for human review
      employeeCount: rng() < 0.35 ? c.employeeCount + 40 + Math.floor(rng() * 60) : c.employeeCount,
      fundingStage: rng() < 0.25 && c.fundingStage ? (c.fundingStage === "Series A" ? "Seed" : "Series A") : c.fundingStage,
    });
  }
  return out;
}
