import { z } from "zod";
import { db } from "@/lib/db";
import { handle, requireRole } from "@/lib/api";
import { safeJsonParse } from "@/lib/utils";

const updateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async ({ user, params }) => {
    const { id } = params;
    const dataset = await db.dataset.findFirst({
      where: { id, orgId: user.orgId },
      include: {
        createdBy: { select: { name: true } },
        jobs: { orderBy: { createdAt: "desc" }, take: 5, select: { id: true, status: true, createdAt: true, currentStage: true } },
      },
    });
    if (!dataset) return Response.json({ error: "Dataset not found" }, { status: 404 });

    const records = await db.record.findMany({
      where: { datasetId: dataset.id },
      orderBy: { qualityScore: "desc" },
      take: 1000,
    });

    const rows = records.map((r) => ({
      id: r.id,
      data: safeJsonParse<Record<string, unknown>>(r.dataJson, {}),
      fieldMeta: safeJsonParse(r.fieldMetaJson, {}),
      qualityScore: r.qualityScore,
      status: r.status,
      conflict: r.conflict,
      conflicts: safeJsonParse(r.conflictJson, []),
      verifiedFields: countVerified(r.fieldMetaJson),
    }));

    // aggregates for dashboard/quality views
    const sourceCounts = new Map<string, number>();
    const industryCounts = new Map<string, number>();
    let flagged = 0;
    let conflicts = 0;
    let provenanceSource = 0;
    let provenanceAi = 0;
    let provenanceDemo = 0;
    let totalFields = 0;
    for (const r of records) {
      const data = safeJsonParse<Record<string, unknown>>(r.dataJson, {});
      const src = String(data.sourceName ?? "Unknown");
      const ind = String(data.industry ?? "Unknown");
      sourceCounts.set(src, (sourceCounts.get(src) ?? 0) + 1);
      industryCounts.set(ind, (industryCounts.get(ind) ?? 0) + 1);
      if (r.status === "FLAGGED") flagged++;
      if (r.conflict) conflicts++;
      const meta = safeJsonParse<Record<string, any>>(r.fieldMetaJson, {});
      for (const m of Object.values(meta)) {
        totalFields++;
        const prov = (m as any)?.provenance;
        if (prov === "SOURCE") provenanceSource++;
        else if (prov === "AI_GENERATED") provenanceAi++;
        else if (prov === "DEMO") provenanceDemo++;
      }
    }

    return Response.json({
      dataset: {
        id: dataset.id,
        name: dataset.name,
        description: dataset.description,
        query: dataset.query,
        status: dataset.status,
        recordCount: dataset.recordCount,
        avgQuality: dataset.avgQuality,
        origin: dataset.origin,
        createdBy: dataset.createdBy?.name ?? "—",
        createdAt: dataset.createdAt,
        requirement: safeJsonParse(dataset.schemaJson, {}),
        plan: safeJsonParse(dataset.planJson, {}),
        jobs: dataset.jobs,
      },
      records: rows,
      stats: {
        sourceCounts: Object.fromEntries(sourceCounts),
        industryCounts: Object.fromEntries(industryCounts),
        flagged,
        conflicts,
        provenanceSource,
        provenanceAi,
        provenanceDemo,
        totalFields,
        validationRate: dataset.recordCount ? (dataset.recordCount - flagged) / dataset.recordCount : 1,
      },
    });
  }, req, { params });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async ({ user, params }) => {
    requireRole(user, "write");
    const { id } = await params;
    const body = updateSchema.parse(await req.json());
    const dataset = await db.dataset.findFirst({ where: { id, orgId: user.orgId } });
    if (!dataset) return Response.json({ error: "Dataset not found" }, { status: 404 });
    const updated = await db.dataset.update({ where: { id }, data: body });
    return Response.json({ ok: true, status: updated.status, name: updated.name });
  }, req, { params });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async ({ user, params }) => {
    requireRole(user, "admin");
    const { id } = params;
    const dataset = await db.dataset.findFirst({ where: { id, orgId: user.orgId } });
    if (!dataset) return Response.json({ error: "Dataset not found" }, { status: 404 });
    await db.dataset.delete({ where: { id } });
    return Response.json({ ok: true });
  }, req, { params });
}

function countVerified(fieldMetaJson: string): number {
  const meta = safeJsonParse<Record<string, any>>(fieldMetaJson, {});
  let n = 0;
  for (const m of Object.values(meta)) {
    if ((m as any)?.verified) n++;
  }
  return n;
}
