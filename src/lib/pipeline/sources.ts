import { db } from "@/lib/db";
import type { OrganizationSource } from "@prisma/client";

/**
 * Source registry.
 *
 * Product principle: NEVER imply a source was accessed when it was not.
 * - `demo: true` connectors generate clearly-labeled DEMO data (origin-labeled on every field).
 * - Real file connectors (CSV/JSON/RSS) fetch only user-provided URLs at run time.
 * - No scraping of third-party sites is performed without explicit per-run user authorization.
 */

export type SourceCatalogEntry = {
  key: string;
  name: string;
  type: "API" | "PUBLIC_DATASET" | "PERMITTED_WEB" | "CSV" | "JSON" | "RSS" | "DATABASE" | "DEMO";
  baseUrl: string;
  reliability: number;
  rateLimit: string;
  expectedFields: string[];
  termsNote: string;
  demo: boolean;
};

export const SOURCE_CATALOG: SourceCatalogEntry[] = [
  {
    key: "demo-companies-api",
    name: "DataForge Demo Registry (simulated company API)",
    type: "DEMO",
    baseUrl: "internal://demo/companies",
    reliability: 0.85,
    rateLimit: "n/a (in-process)",
    expectedFields: ["name", "website", "location", "industry", "foundedYear", "employeeCount"],
    termsNote: "Synthetic demo data clearly labeled as DEMO on every field. No real companies.",
    demo: true,
  },
  {
    key: "demo-jobs-api",
    name: "DataForge Demo Job Board (simulated jobs API)",
    type: "DEMO",
    baseUrl: "internal://demo/jobs",
    reliability: 0.8,
    rateLimit: "n/a (in-process)",
    expectedFields: ["name", "hiringStatus", "jobTitle", "jobUrl"],
    termsNote: "Synthetic demo hiring signals. No real job postings are fetched.",
    demo: true,
  },
  {
    key: "demo-funding-api",
    name: "DataForge Demo Funding Ledger (simulated funding API)",
    type: "DEMO",
    baseUrl: "internal://demo/funding",
    reliability: 0.75,
    rateLimit: "n/a (in-process)",
    expectedFields: ["name", "fundingStage", "foundedYear"],
    termsNote: "Synthetic demo funding rounds. No real funding data.",
    demo: true,
  },
  {
    key: "user-csv",
    name: "User-provided CSV",
    type: "CSV",
    baseUrl: "",
    reliability: 0.95,
    rateLimit: "n/a (direct file)",
    expectedFields: ["mapped from CSV headers"],
    termsNote: "Reads only URLs supplied by your organization at run time.",
    demo: false,
  },
  {
    key: "user-json",
    name: "User-provided JSON endpoint",
    type: "JSON",
    baseUrl: "",
    reliability: 0.9,
    rateLimit: "configured per endpoint",
    expectedFields: ["mapped from JSON structure"],
    termsNote: "Reads only URLs supplied by your organization at run time.",
    demo: false,
  },
  {
    key: "user-rss",
    name: "RSS / Atom feed",
    type: "RSS",
    baseUrl: "",
    reliability: 0.85,
    rateLimit: "configured per feed",
    expectedFields: ["title", "link", "pubDate", "description"],
    termsNote: "Reads only feeds supplied by your organization at run time.",
    demo: false,
  },
  {
    key: "postgres-connector",
    name: "PostgreSQL connector",
    type: "DATABASE",
    baseUrl: "",
    reliability: 0.99,
    rateLimit: "n/a (direct connection)",
    expectedFields: ["mapped from SQL columns"],
    termsNote: "Connects only to credentials supplied by your organization.",
    demo: false,
  },
];

/** Upsert the catalog for an org (used at org creation and seed). */
export async function ensureOrgSources(orgId: string) {
  for (const entry of SOURCE_CATALOG) {
    await db.organizationSource.upsert({
      where: { orgId_key: { orgId, key: entry.key } },
      create: {
        orgId,
        key: entry.key,
        name: entry.name,
        type: entry.type,
        baseUrl: entry.baseUrl,
        reliability: entry.reliability,
        rateLimit: entry.rateLimit,
        expectedFieldsJson: JSON.stringify(entry.expectedFields),
        termsNote: entry.termsNote,
        demo: entry.demo,
        availability: "AVAILABLE",
        lastCheckedAt: new Date(),
        lastResult: "checked at registration",
      },
      update: {},
    });
  }
}

/** Deterministic availability pulse so the UI can show "last checked" honestly. */
export function sourceAvailability(orgSources: OrganizationSource[]) {
  return orgSources.map((s) => ({
    id: s.id,
    key: s.key,
    name: s.name,
    type: s.type,
    enabled: s.enabled,
    availability: s.availability,
    reliability: s.reliability,
    rateLimit: s.rateLimit,
    expectedFields: safeJsonParseArray(s.expectedFieldsJson),
    termsNote: s.termsNote,
    demo: s.demo,
    lastCheckedAt: s.lastCheckedAt,
    lastResult: s.lastResult,
  }));
}

function safeJsonParseArray(json: string): string[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
