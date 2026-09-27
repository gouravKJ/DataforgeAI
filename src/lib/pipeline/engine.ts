import { db } from "@/lib/db";
import { safeJsonParse, sleep } from "@/lib/utils";
import type { ParsedRequirement, WorkflowPlan, PlanNode } from "@/lib/ai/types";
import { generateDemoCompanies, generateDemoDuplicates, type DemoCompany } from "@/lib/pipeline/demo-factory";
import { aiGenerate } from "@/lib/ai/provider";

/**
 * DataForge collection pipeline engine.
 *
 * Stages: queue → discover sources → collect → extract → clean → validate →
 *         entity resolution → deduplicate → verify → quality score → finalize dataset.
 *
 * Everything runs in-process against the durable DB-backed job record so the UI
 * (SSE) can show live node-by-node progress. No fabricated provenance: fields that
 * come from the demo factory are labeled DEMO, never "accessed from a real source".
 */

export type NodeRuntime = {
  id: string;
  title: string;
  kind: PlanNode["kind"];
  status: "PENDING" | "RUNNING" | "DONE" | "ERROR" | "SKIPPED";
  recordsProcessed: number;
  durationMs: number;
  errors: number;
  sourceCount: number;
  detail: string;
};

export type FieldMeta = {
  provenance: "SOURCE" | "AI_GENERATED" | "USER" | "DEMO";
  confidence: number;
  sources: { sourceKey: string; sourceName: string; confidence: number }[];
  verified: boolean;
  history: { at: string; action: string; note: string }[];
};

export type CollectedRecord = {
  externalKey: string;
  data: Record<string, unknown>;
  fieldMeta: Record<string, FieldMeta>;
  sourceKey: string;
  sourceName: string;
  sourceConfidence: number;
};

const STAGE_MS = 420; // per-node simulated processing floor (visible but fast)

function fieldMetaFor(
  provenance: FieldMeta["provenance"],
  sourceKey: string,
  sourceName: string,
  confidence: number,
  note: string
): FieldMeta {
  return {
    provenance,
    confidence: Number(confidence.toFixed(3)),
    sources: [{ sourceKey, sourceName, confidence: Number(confidence.toFixed(3)) }],
    verified: false,
    history: [{ at: new Date().toISOString(), action: "collected", note }],
  };
}

export async function runPipeline(jobId: string): Promise<void> {
  const job = await db.job.findUnique({ where: { id: jobId } });
  if (!job) return;
  const dataset = job.datasetId
    ? await db.dataset.findUnique({ where: { id: job.datasetId } })
    : null;
  if (!dataset) {
    await failJob(jobId, "Dataset not found for job");
    return;
  }

  const req = safeJsonParse<ParsedRequirement>(dataset.schemaJson, null as unknown as ParsedRequirement);
  const plan = safeJsonParse<WorkflowPlan>(dataset.planJson, null as unknown as WorkflowPlan);
  const nodes: PlanNode[] = plan?.nodes ?? [];

  const runtime: Record<string, NodeRuntime> = {};
  for (const n of nodes) {
    runtime[n.id] = {
      id: n.id, title: n.title, kind: n.kind, status: "PENDING",
      recordsProcessed: 0, durationMs: 0, errors: 0, sourceCount: 0, detail: "",
    };
  }

  const stats: Record<string, any> = {
    collected: 0,
    cleaned: 0,
    validated: 0,
    duplicatesFound: 0,
    conflictsDetected: 0,
    entitiesMerged: 0,
    qualityScored: 0,
    sourcesUsed: [] as string[],
  };

  let currentNode: string | null = null;

  async function persistNode(nodeId: string) {
    const r = runtime[nodeId]!;
    await db.job.update({
      where: { id: jobId },
      data: {
        nodesJson: JSON.stringify(Object.values(runtime)),
        statsJson: JSON.stringify(stats),
      },
    });
    void r;
  }

  async function log(level: "info" | "warn" | "error" | "success", stage: string, message: string, data?: Record<string, unknown>) {
    await db.jobEvent.create({
      data: {
        jobId,
        level,
        stage,
        message,
        dataJson: JSON.stringify(data ?? {}),
      },
    });
  }

  async function beginNode(nodeId: string) {
    currentNode = nodeId;
    const r = runtime[nodeId]!;
    r.status = "RUNNING";
    await db.job.update({
      where: { id: jobId },        data: { currentStage: r.title, nodesJson: JSON.stringify(Object.values(runtime)), status: "RUNNING", startedAt: job?.startedAt ?? new Date() },
    });
    await log("info", r.title, `${r.title} started`);
  }

  async function endNode(nodeId: string, detail: string) {
    const r = runtime[nodeId]!;
    r.status = "DONE";
    r.detail = detail;
    await persistNode(nodeId);
    await log("success", r.title, `${r.title} complete — ${detail}`);
  }

  try {
    // ── requirement node ────────────────────────────────────────────────
    const reqNode = nodes.find((n) => n.kind === "REQUIREMENT");
    if (reqNode) {
      await beginNode(reqNode.id);
      const t0 = Date.now();
      runtime[reqNode.id]!.recordsProcessed = 1;
      runtime[reqNode.id]!.detail = `${req.count} ${req.domain}, ${req.filters.length} filters`;
      runtime[reqNode.id]!.durationMs = Date.now() - t0 + 80;
      await endNode(reqNode.id, runtime[reqNode.id]!.detail);
    }

    // ── source discovery ────────────────────────────────────────────────
    const srcNode = nodes.find((n) => n.kind === "SOURCE_DISCOVERY");
    let enabledSources: { key: string; name: string; demo: boolean; reliability: number }[] = [];
    if (srcNode) {
      await beginNode(srcNode.id);
      const t0 = Date.now();
      const orgSources = await db.organizationSource.findMany({ where: { orgId: job.orgId, enabled: true } });
      enabledSources = orgSources.map((s) => ({ key: s.key, name: s.name, demo: s.demo, reliability: s.reliability }));
      // Only demo registry connectors participate in simulated collection; file/database
      // connectors require run-time user URLs which the UI collects but demo runs omit.
      const usable = enabledSources.filter((s) => s.demo);
      runtime[srcNode.id]!.sourceCount = enabledSources.length;
      runtime[srcNode.id]!.recordsProcessed = usable.length;
      stats.sourcesUsed = enabledSources.map((s) => s.name);
      runtime[srcNode.id]!.detail = `${enabledSources.length} enabled source(s), ${usable.length} usable for this run`;
      runtime[srcNode.id]!.durationMs = Date.now() - t0 + STAGE_MS;
      await endNode(srcNode.id, runtime[srcNode.id]!.detail);
    }

    // ── collection + extraction (demo factory, labeled) ─────────────────
    const discoveryNode = nodes.find((n) => n.kind === "DISCOVERY");
    let collected: CollectedRecord[] = [];
    if (discoveryNode) {
      await beginNode(discoveryNode.id);
      const t0 = Date.now();
      const target = Math.max(10, Math.min(req.count, 400));
      const companies = generateDemoCompanies(req, target);
      const dupes = generateDemoDuplicates(companies);
      const all = [...companies, ...dupes];
      collected = all.map((c: DemoCompany) => toCollected(c));
      runtime[discoveryNode.id]!.recordsProcessed = collected.length;
      runtime[discoveryNode.id]!.detail = `${collected.length} raw records from ${usableCount(enabledSources)} source(s)`;
      runtime[discoveryNode.id]!.durationMs = Date.now() - t0 + STAGE_MS * 2;
      await endNode(discoveryNode.id, runtime[discoveryNode.id]!.detail);
    }

    // ── extraction (AI enrichment: description polish + email/linkedin) ─
    const extractionNode = nodes.find((n) => n.kind === "EXTRACTION");
    if (extractionNode) {
      await beginNode(extractionNode.id);
      const t0 = Date.now();
      let enriched = 0;
      for (const rec of collected) {
        const desc = rec.data.description as string | undefined;
        if (!desc || desc.length < 30) {
          rec.data.description = `${rec.data.name} — profile captured via demo registry. Enrichment pending human review.`;
          rec.fieldMeta.description = fieldMetaFor("AI_GENERATED", rec.sourceKey, rec.sourceName, 0.42, "AI-generated placeholder, flagged for review");
          enriched++;
        }
      }
      runtime[extractionNode.id]!.recordsProcessed = collected.length;
      runtime[extractionNode.id]!.detail = `${enriched} record(s) AI-enriched (labeled AI_GENERATED)`;
      runtime[extractionNode.id]!.durationMs = Date.now() - t0 + STAGE_MS;
      await endNode(extractionNode.id, runtime[extractionNode.id]!.detail);
    }

    // ── cleaning ────────────────────────────────────────────────────────
    const cleanNode = nodes.find((n) => n.kind === "CLEANING");
    if (cleanNode) {
      await beginNode(cleanNode.id);
      const t0 = Date.now();
      let fixes = 0;
      for (const rec of collected) {
        const w = rec.data.website as string | undefined;
        if (w && (w !== w.trim() || /HTTPS/.test(w))) {
          rec.data.website = `https://${w.toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "").trim()}`;
          fixes++;
        }
        for (const k of Object.keys(rec.data)) {
          const v = rec.data[k];
          if (typeof v === "string") rec.data[k] = v.replace(/\s+/g, " ").trim();
        }
      }
      stats.cleaned = collected.length;
      runtime[cleanNode.id]!.recordsProcessed = collected.length;
      runtime[cleanNode.id]!.detail = `${fixes} formatting fix(es), whitespace normalized`;
      runtime[cleanNode.id]!.durationMs = Date.now() - t0 + STAGE_MS;
      await endNode(cleanNode.id, runtime[cleanNode.id]!.detail);
    }

    // ── entity resolution ───────────────────────────────────────────────
    const entityNode = nodes.find((n) => n.kind === "ENTITY_RESOLUTION");
    let entityGroups: CollectedRecord[][] = [];
    if (entityNode) {
      await beginNode(entityNode.id);
      const t0 = Date.now();
      entityGroups = resolveEntities(collected);
      const mergedCount = collected.length - entityGroups.length;
      stats.entitiesMerged = mergedCount;
      runtime[entityNode.id]!.recordsProcessed = collected.length;
      runtime[entityNode.id]!.detail = `${entityGroups.length} unique entities from ${collected.length} raw records (${mergedCount} merges)`;
      runtime[entityNode.id]!.durationMs = Date.now() - t0 + STAGE_MS;
      await endNode(entityNode.id, runtime[entityNode.id]!.detail);
    } else {
      entityGroups = collected.map((c) => [c]);
    }

    // ── deduplication (conflict-aware survivorship) ─────────────────────
    const dedupNode = nodes.find((n) => n.kind === "DEDUPLICATION");
    let survivors: CollectedRecord[] = [];
    if (dedupNode) {
      await beginNode(dedupNode.id);
      const t0 = Date.now();
      const result = deduplicate(entityGroups);
      survivors = result.survivors;
      stats.duplicatesFound = collected.length - survivors.length;
      stats.conflictsDetected = result.conflicts.length;
      runtime[dedupNode.id]!.recordsProcessed = collected.length;
      runtime[dedupNode.id]!.detail = `${stats.duplicatesFound} duplicate(s) collapsed, ${result.conflicts.length} conflict(s) flagged for review`;
      runtime[dedupNode.id]!.durationMs = Date.now() - t0 + STAGE_MS;
      await endNode(dedupNode.id, runtime[dedupNode.id]!.detail);
      if (result.conflicts.length) {
        await log("warn", "Deduplication", `${result.conflicts.length} conflicting field value(s) — routed to human review, not silently resolved`);
      }
    } else {
      survivors = entityGroups.map((g) => g[0]!);
    }

    // ── validation ──────────────────────────────────────────────────────
    const validationNode = nodes.find((n) => n.kind === "VALIDATION");
    let validationRate = 1;
    if (validationNode) {
      await beginNode(validationNode.id);
      const t0 = Date.now();
      const results = validateRecords(survivors, req);
      const passed = results.filter((r) => r.passed).length;
      validationRate = survivors.length ? passed / survivors.length : 1;
      stats.validated = passed;
      runtime[validationNode.id]!.recordsProcessed = survivors.length;
      runtime[validationNode.id]!.detail = `${passed}/${survivors.length} records passed (${(validationRate * 100).toFixed(1)}%)`;
      runtime[validationNode.id]!.durationMs = Date.now() - t0 + STAGE_MS;
      await endNode(validationNode.id, runtime[validationNode.id]!.detail);
      const failed = results.filter((r) => !r.passed);
      if (failed.length) {
        await log("warn", "Validation", `${failed.length} record(s) failed validation (missing required fields)`);
      }
    }

    // ── quality scoring ─────────────────────────────────────────────────
    const qualityNode = nodes.find((n) => n.kind === "QUALITY_SCORING");
    if (qualityNode) {
      await beginNode(qualityNode.id);
      const t0 = Date.now();
      for (const rec of survivors) {
        rec.data.__quality = scoreRecord(rec);
      }
      stats.qualityScored = survivors.length;
      runtime[qualityNode.id]!.recordsProcessed = survivors.length;
      runtime[qualityNode.id]!.detail = `composite score computed (completeness × provenance × consistency)`;
      runtime[qualityNode.id]!.durationMs = Date.now() - t0 + STAGE_MS;
      await endNode(qualityNode.id, runtime[qualityNode.id]!.detail);
    } else {
      for (const rec of survivors) rec.data.__quality = scoreRecord(rec);
    }

    // ── persist dataset ─────────────────────────────────────────────────
    const datasetNode = nodes.find((n) => n.kind === "DATASET");
    if (datasetNode) {
      await beginNode(datasetNode.id);
      const t0 = Date.now();

      await db.record.deleteMany({ where: { datasetId: dataset.id } });

      const byQuality = [...survivors].sort((a, b) => (b.data.__quality as number) - (a.data.__quality as number));
      for (const rec of byQuality) {
        const quality = rec.data.__quality as number;
        const { __quality, __conflicts, ...data } = rec.data;
        const created = await db.record.create({
          data: {
            datasetId: dataset.id,
            externalKey: rec.externalKey,
            dataJson: JSON.stringify(data),
            fieldMetaJson: JSON.stringify(rec.fieldMeta),
            qualityScore: quality,
            status: quality < 0.5 ? "FLAGGED" : "ACTIVE",
            conflict: !!__conflicts && __conflicts !== "[]",
            conflictJson: typeof __conflicts === "string" ? __conflicts : JSON.stringify(__conflicts ?? []),
            embeddingJson: JSON.stringify(embedRecordData(data)),
          },
        });

        // Field provenance rows (lineage + record drawer), bounded per record
        const metaEntries = Object.entries(rec.fieldMeta).slice(0, 14);
        for (const [field, meta] of metaEntries) {
          await db.fieldProvenance.create({
            data: {
              recordId: created.id,
              field,
              value: String(data[field] ?? ""),
              sourceId: meta.sources[0]?.sourceKey ?? "unknown",
              sourceName: meta.sources[0]?.sourceName ?? "unknown",
              confidence: meta.confidence,
              method: meta.provenance,
              verified: meta.verified,
            },
          });
        }

        // conflicts are never silently resolved — route them to human review
        if (created.conflict) {
          await db.review.create({
            data: {
              orgId: dataset.orgId,
              recordId: created.id,
              status: "PENDING",
              originalJson: created.conflictJson,
            },
          });
        }
      }

      runtime[datasetNode.id]!.recordsProcessed = survivors.length;
      runtime[datasetNode.id]!.detail = `${survivors.length} records delivered`;
      runtime[datasetNode.id]!.durationMs = Date.now() - t0 + STAGE_MS;
      await endNode(datasetNode.id, runtime[datasetNode.id]!.detail);
    }

    // ── finalize job + dataset aggregates ───────────────────────────────
    const avgQuality = survivors.length
      ? survivors.reduce((s, r) => s + (r.data.__quality as number), 0) / survivors.length
      : 0;
    await db.dataset.update({
      where: { id: dataset.id },
      data: {
        recordCount: survivors.length,
        avgQuality: Number(avgQuality.toFixed(4)),
      },
    });
    await db.job.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        progress: 100,
        finishedAt: new Date(),
        statsJson: JSON.stringify(stats),
        nodesJson: JSON.stringify(Object.values(runtime)),
      },
    });
    await log("success", "Pipeline", `Dataset ready: ${survivors.length} records, avg quality ${(avgQuality * 100).toFixed(1)}%`);
  } catch (err: any) {
    console.error("[pipeline]", err);
    await failJob(jobId, err?.message ?? "Pipeline error");
  }
}

async function failJob(jobId: string, message: string) {
  await db.job.update({
    where: { id: jobId },
    data: { status: "FAILED", error: message.slice(0, 500), finishedAt: new Date() },
  });
  await db.jobEvent.create({
    data: { jobId, level: "error", stage: "Pipeline", message: message.slice(0, 500) },
  });
}

// ── entity resolution: normalize keys, group by canonical identity ─────
function entityKey(name: string, website: string): string {
  const n = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const w = website.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0]!.replace(/\.(com|io|ai|dev|co|demo|demo-site\.com)$/, "");
  return `${n}|${w}`;
}

export function resolveEntities(records: CollectedRecord[]): CollectedRecord[][] {
  const groups = new Map<string, CollectedRecord[]>();
  for (const rec of records) {
    const key = entityKey(rec.data.name as string, rec.data.website as string);
    const arr = groups.get(key) ?? [];
    arr.push(rec);
    groups.set(key, arr);
  }
  return [...groups.values()];
}

// ── dedup + conflict-aware survivorship ────────────────────────────────
type DedupResult = {
  survivors: CollectedRecord[];
  conflicts: { externalKey: string; field: string; values: { sourceName: string; value: unknown }[] }[];
};

export function deduplicate(groups: CollectedRecord[][]): DedupResult {
  const survivors: CollectedRecord[] = [];
  const conflicts: DedupResult["conflicts"] = [];

  for (const group of groups) {
    if (group.length === 1) {
      survivors.push(group[0]!);
      continue;
    }
    // survivorship: highest source confidence wins per field; disagreements → conflict list
    const sorted = [...group].sort(
      (a, b) => b.sourceConfidence - a.sourceConfidence
    );
    const primary = sorted[0]!;
    const merged: CollectedRecord = {
      ...primary,
      fieldMeta: { ...primary.fieldMeta },
    };

    // internal factory fields must never surface as user-facing conflicts
    const INTERNAL_FIELDS = new Set(["sourceKey", "sourceName", "sourceConfidence"]);
    for (const other of sorted.slice(1)) {
      for (const field of Object.keys(other.data)) {
        if (field.startsWith("__") || INTERNAL_FIELDS.has(field)) continue;
        const a = primary.data[field];
        const b = other.data[field];
        const same = (a === b) || (a == null && b == null);
        if (!same && a != null && b != null) {
          conflicts.push({
            externalKey: merged.externalKey,
            field,
            values: [
              { sourceName: primary.sourceName, value: a },
              { sourceName: other.sourceName, value: b },
            ],
          });
          // keep primary value but record both sources on the field meta
          const meta = merged.fieldMeta[field];
          if (meta) {
            meta.sources.push({ sourceKey: other.sourceKey, sourceName: other.sourceName, confidence: other.sourceConfidence });
            meta.history.push({ at: new Date().toISOString(), action: "conflict", note: `Disagrees with ${other.sourceName}` });
            meta.confidence = Math.min(meta.confidence, 0.65); // uncertainty surfaced, never hidden
          }
        }
      }
    }
    merged.data.__conflicts = JSON.stringify(conflicts.filter((c) => c.externalKey === merged.externalKey));
    survivors.push(merged);
  }

  return { survivors, conflicts };
}

// ── validation ─────────────────────────────────────────────────────────
export function validateRecords(records: CollectedRecord[], req: ParsedRequirement) {
  return records.map((rec) => {
    const issues: string[] = [];
    for (const f of req.fields) {
      if (!f.required) continue;
      const v = rec.data[f.key];
      if (v == null || v === "") issues.push(`missing ${f.key}`);
    }
    const website = rec.data.website as string | undefined;
    if (website && !/^https?:\/\/.+\..+/.test(website)) issues.push("invalid website URL");
    const email = rec.data.email as string | undefined;
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) issues.push("invalid email format");
    const founded = rec.data.foundedYear as number | undefined;
    const currentYear = new Date().getFullYear();
    if (founded && (founded < 1900 || founded > currentYear)) issues.push("implausible foundedYear");
    return { externalKey: rec.externalKey, passed: issues.length === 0, issues };
  });
}

// ── quality scoring ────────────────────────────────────────────────────
export function scoreRecord(rec: CollectedRecord): number {
  const fields = Object.entries(rec.data).filter(([k]) => !k.startsWith("__"));
  if (!fields.length) return 0;
  let completeness = 0;
  let provenance = 0;
  for (const [k, v] of fields) {
    const present = v != null && v !== "";
    completeness += present ? 1 : 0;
    const meta = rec.fieldMeta[k];
    if (meta) {
      const provWeight = meta.provenance === "SOURCE" ? 1 : meta.provenance === "AI_GENERATED" ? 0.45 : meta.provenance === "DEMO" ? 0.75 : 0.6;
      provenance += provWeight * (meta.verified ? 1.1 : 1) * (0.5 + meta.confidence / 2);
    } else {
      provenance += 0.5;
    }
  }
  const completenessScore = completeness / fields.length;
  const provenanceScore = provenance / fields.length;
  const conflictPenalty = rec.data.__conflicts && (rec.data.__conflicts as string) !== "[]" ? 0.08 : 0;
  return Number(Math.max(0, Math.min(1, 0.55 * completenessScore + 0.35 * provenanceScore + 0.1 * (1 - conflictPenalty))).toFixed(4));
}

// ── embeddings for semantic search ─────────────────────────────────────
function embedRecordData(data: Record<string, unknown>): number[] {
  const parts = [data.name, data.industry, data.location, data.description, data.jobTitle, data.fundingStage];
  const text = parts.filter(Boolean).map(String).join(" ");
  // import lazily to avoid cycles
  const { embedText } = require("@/lib/ai/embeddings") as typeof import("@/lib/ai/embeddings");
  return embedText(text);
}

// ── demo factory → collected record ────────────────────────────────────
function toCollected(c: DemoCompany): CollectedRecord {
  const sourceKey = c.sourceKey ?? "demo-companies-api";
  const sourceName = c.sourceName ?? "DataForge Demo Registry";
  const meta: Record<string, FieldMeta> = {};
  const note = "collected from demo registry (synthetic, labeled DEMO)";
  for (const [k, v] of Object.entries(c)) {
    if (["sourceKey", "sourceName", "sourceConfidence"].includes(k)) continue;
    if (v == null || v === "") continue;
    meta[k] = fieldMetaFor("DEMO", sourceKey, sourceName, c.sourceConfidence, note);
  }
  // email/linkedin/description are AI-enrichment slots even in demo data
  if (meta.email) meta.email = fieldMetaFor("AI_GENERATED", sourceKey, sourceName, 0.5, "AI-generated guess (demo)");
  if (meta.linkedin) meta.linkedin = fieldMetaFor("AI_GENERATED", sourceKey, sourceName, 0.5, "AI-generated guess (demo)");
  return {
    externalKey: `${c.name}|${c.website}`.toLowerCase(),
    data: { ...c } as Record<string, unknown>,
    fieldMeta: meta,
    sourceKey,
    sourceName,
    sourceConfidence: c.sourceConfidence,
  };
}

function usableCount(sources: { demo: boolean }[]) {
  return sources.filter((s) => s.demo).length;
}
