import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("Seeding DataForge AI demo data…");

  const org = await db.organization.upsert({
    where: { slug: "demo" },
    create: {
      name: "DataForge Demo Org",
      slug: "demo",
      industry: "Technology",
      teamSize: "11-50",
      useCase: "lead-generation",
      onboarded: true,
    },
    update: {},
  });

  const passwordHash = await bcrypt.hash("demo1234", 10);

  const admin = await db.user.upsert({
    where: { email: "admin@demo.dataforge.ai" },
    create: { email: "admin@demo.dataforge.ai", name: "Demo Admin", passwordHash, role: "ADMIN", orgId: org.id },
    update: {},
  });
  await db.user.upsert({
    where: { email: "analyst@demo.dataforge.ai" },
    create: { email: "analyst@demo.dataforge.ai", name: "Dana Analyst", passwordHash, role: "ANALYST", orgId: org.id },
    update: {},
  });
  await db.user.upsert({
    where: { email: "viewer@demo.dataforge.ai" },
    create: { email: "viewer@demo.dataforge.ai", name: "Vic Viewer", passwordHash, role: "VIEWER", orgId: org.id },
    update: {},
  });

  // sources
  const sources = [
    ["demo-companies-api", "DataForge Demo Registry (simulated company API)", "DEMO", 0.85],
    ["demo-jobs-api", "DataForge Demo Job Board (simulated jobs API)", "DEMO", 0.8],
    ["demo-funding-api", "DataForge Demo Funding Ledger (simulated funding API)", "DEMO", 0.75],
    ["user-csv", "User-provided CSV", "CSV", 0.95],
    ["user-json", "User-provided JSON endpoint", "JSON", 0.9],
    ["user-rss", "RSS / Atom feed", "RSS", 0.85],
    ["postgres-connector", "PostgreSQL connector", "DATABASE", 0.99],
  ] as const;

  for (const [key, name, type, reliability] of sources) {
    await db.organizationSource.upsert({
      where: { orgId_key: { orgId: org.id, key } },
      create: {
        orgId: org.id,
        key,
        name,
        type,
        reliability,
        demo: String(key).startsWith("demo"),
        expectedFieldsJson: JSON.stringify(["name", "website", "location", "industry"]),
        termsNote: "Synthetic demo source — clearly labeled, never presented as real collection.",
        lastCheckedAt: new Date(),
        lastResult: "checked at seed",
      },
      update: {},
    });
  }

  // a completed demo dataset with records + conflict + review
  const existingDataset = await db.dataset.findFirst({ where: { orgId: org.id, origin: "DEMO" } });
  if (!existingDataset) {
    const requirement = {
      intent: "LEAD_GENERATION",
      domain: "companies",
      location: { label: "India", code: "IN" },
      industries: ["SaaS"],
      skills: ["NODE.JS"],
      hiring: true,
      funding: null,
      foundedAfter: 2021,
      employeeRange: null,
      count: 120,
      filters: ["location: India", "industry: SaaS", "founded after 2021", "hiring: NODE.JS"],
      fields: [
        { key: "name", label: "Name", type: "string", required: true, provenance: "SOURCE" },
        { key: "website", label: "Website", type: "url", required: true, provenance: "SOURCE" },
        { key: "location", label: "Location", type: "string", required: false, provenance: "SOURCE" },
        { key: "industry", label: "Industry", type: "string", required: false, provenance: "SOURCE" },
        { key: "foundedYear", label: "Founded", type: "number", required: false, provenance: "SOURCE" },
        { key: "employeeCount", label: "Employees", type: "number", required: false, provenance: "SOURCE" },
        { key: "hiringStatus", label: "Hiring Status", type: "enum", required: false, provenance: "SOURCE" },
        { key: "jobTitle", label: "Job Title", type: "string", required: false, provenance: "SOURCE" },
        { key: "jobUrl", label: "Job URL", type: "url", required: false, provenance: "SOURCE" },
        { key: "email", label: "Email", type: "email", required: false, provenance: "AI_GENERATED" },
        { key: "linkedin", label: "LinkedIn", type: "url", required: false, provenance: "AI_GENERATED" },
        { key: "description", label: "Description", type: "text", required: false, provenance: "AI_GENERATED" },
        { key: "sourceName", label: "Source", type: "string", required: true, provenance: "SOURCE" },
      ],
      notes: "Seeded demo requirement.",
    };

    const plan = {
      summary: "Pipeline for 120 companies records in India (SaaS).",
      estimatedRecords: 120,
      estimatedMinutes: 3,
      nodes: [
        { id: "requirement", kind: "REQUIREMENT", title: "Requirement", description: "Parsed natural-language requirement", dependsOn: [] },
        { id: "source-discovery", kind: "SOURCE_DISCOVERY", title: "Source Discovery", description: "Match requirement to available, permitted sources", dependsOn: ["requirement"] },
        { id: "discovery", kind: "DISCOVERY", title: "Company Discovery", description: "Collect candidate entities from permitted sources", dependsOn: ["source-discovery"] },
        { id: "extraction", kind: "EXTRACTION", title: "Extraction", description: "Extract structured fields and verify hiring signals", dependsOn: ["discovery"] },
        { id: "cleaning", kind: "CLEANING", title: "Cleaning", description: "Normalize whitespace, fix URL formatting", dependsOn: ["extraction"] },
        { id: "entity-matching", kind: "ENTITY_RESOLUTION", title: "Entity Matching", description: "Match records referring to the same entity", dependsOn: ["cleaning"] },
        { id: "deduplication", kind: "DEDUPLICATION", title: "Deduplication", description: "Collapse duplicates, flag conflicts", dependsOn: ["entity-matching"] },
        { id: "validation", kind: "VALIDATION", title: "Validation", description: "Type checks and required fields", dependsOn: ["deduplication"] },
        { id: "quality-scoring", kind: "QUALITY_SCORING", title: "Quality Scoring", description: "Composite quality score", dependsOn: ["validation"] },
        { id: "final-dataset", kind: "DATASET", title: "Final Dataset", description: "Reviewed, source-backed dataset", dependsOn: ["quality-scoring"] },
      ],
    };

    const dataset = await db.dataset.create({
      data: {
        orgId: org.id,
        name: "SaaS — India — Hiring",
        description: plan.summary,
        query: "Find Indian SaaS companies founded after 2021 that are hiring Node.js developers.",
        schemaJson: JSON.stringify(requirement),
        planJson: JSON.stringify(plan),
        origin: "DEMO",
        createdById: admin.id,
      },
    });

    const job = await db.job.create({
      data: {
        orgId: org.id,
        datasetId: dataset.id,
        type: "COLLECTION",
        status: "COMPLETED",
        currentStage: "Final Dataset",
        progress: 100,
        startedAt: new Date(Date.now() - 4 * 60 * 1000),
        finishedAt: new Date(Date.now() - 2 * 60 * 1000),
        statsJson: JSON.stringify({ collected: 142, cleaned: 142, validated: 138, duplicatesFound: 24, conflictsDetected: 3, entitiesMerged: 22, sourcesUsed: "DataForge Demo Registry" }),
        nodesJson: JSON.stringify(
          plan.nodes.map((n, i) => ({
            id: n.id, title: n.title, kind: n.kind, status: "DONE",
            recordsProcessed: [1, 7, 142, 142, 142, 120, 120, 118, 118, 118][i] ?? 0,
            durationMs: 300 + i * 140,
            errors: 0, sourceCount: i === 1 ? 7 : 0,
            detail: "Seeded demo run",
          }))
        ),
      },
    });

    // records via demo factory for full provenance realism
    const { generateDemoCompanies, generateDemoDuplicates } = await import("../src/lib/pipeline/demo-factory");
    const { resolveEntities, deduplicate, validateRecords, scoreRecord } = await import("../src/lib/pipeline/engine");
    const { embedText } = await import("../src/lib/ai/embeddings");

    const companies = generateDemoCompanies(requirement as any, 80);
    const dupes = generateDemoDuplicates(companies);
    const toCollected = (c: any) => ({
      externalKey: `${c.name}|${c.website}`.toLowerCase(),
      data: { ...c } as Record<string, unknown>,
      fieldMeta: Object.fromEntries(
        Object.entries(c)
          .filter(([k, v]) => !["sourceKey", "sourceName", "sourceConfidence"].includes(k) && v != null && v !== "")
          .map(([k]) => [k, {
            provenance: ["email", "linkedin", "description"].includes(k) ? "AI_GENERATED" : "DEMO",
            confidence: c.sourceConfidence,
            sources: [{ sourceKey: c.sourceKey, sourceName: c.sourceName, confidence: c.sourceConfidence }],
            verified: false,
            history: [{ at: new Date().toISOString(), action: "collected", note: "demo registry (synthetic)" }],
          }])
      ),
      sourceKey: c.sourceKey,
      sourceName: c.sourceName,
      sourceConfidence: c.sourceConfidence,
    });

    const collected = [...companies, ...dupes].map(toCollected);
    const groups = resolveEntities(collected as any);
    const { survivors } = deduplicate(groups as any);
    const validation = validateRecords(survivors as any, requirement as any);
    const scored = survivors.map((r: any) => ({ ...r, q: scoreRecord(r) }));

    for (const rec of scored) {
      const { __quality, __conflicts, ...data } = rec.data as any;
      const quality = rec.q;
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
          embeddingJson: JSON.stringify(embedText(Object.values(data).filter(Boolean).map(String).join(" "))),
        },
      });

      if (created.conflict) {
        await db.review.create({
          data: {
            orgId: org.id,
            recordId: created.id,
            status: "PENDING",
            originalJson: created.conflictJson,
          },
        });
      }
    }

    const agg = await db.record.aggregate({
      where: { datasetId: dataset.id },
      _count: true,
      _avg: { qualityScore: true },
    });
    await db.dataset.update({
      where: { id: dataset.id },
      data: { recordCount: agg._count, avgQuality: Number((agg._avg.qualityScore ?? 0).toFixed(4)) },
    });

    console.log(`Seeded dataset with ${agg._count} records.`);
  }

  console.log("Seed complete. Demo login: admin@demo.dataforge.ai / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
