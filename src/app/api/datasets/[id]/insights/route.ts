import { db } from "@/lib/db";
import { handle } from "@/lib/api";
import { safeJsonParse } from "@/lib/utils";
import { generateDatasetInsights } from "@/lib/ai/insights";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async ({ user, params }) => {
    const { id } = params;
    const dataset = await db.dataset.findFirst({ where: { id, orgId: user.orgId } });
    if (!dataset) return Response.json({ error: "Dataset not found" }, { status: 404 });

    const records = await db.record.findMany({
      where: { datasetId: dataset.id, status: "ACTIVE" },
      select: { dataJson: true, status: true, conflict: true },
    });

    const industryCounts = new Map<string, number>();
    const sourceCounts = new Map<string, number>();
    let conflicts = 0;
    for (const r of records) {
      const data = safeJsonParse<Record<string, unknown>>(r.dataJson, {});
      const ind = String(data.industry ?? "Unknown");
      const src = String(data.sourceName ?? "Unknown");
      industryCounts.set(ind, (industryCounts.get(ind) ?? 0) + 1);
      sourceCounts.set(src, (sourceCounts.get(src) ?? 0) + 1);
      if (r.conflict) conflicts++;
    }

    const result = await generateDatasetInsights({
      datasetName: dataset.name,
      query: dataset.query,
      rowCount: records.length,
      avgQuality: dataset.avgQuality,
      topIndustries: [...industryCounts.entries()].sort((a, b) => b[1] - a[1]),
      conflictCount: conflicts,
      duplicateRate: records.length ? conflicts / records.length : 0,
      validationRate: records.length ? (records.length - records.filter((r) => r.status === "FLAGGED").length) / records.length : 1,
      sources: [...sourceCounts.keys()],
    });

    return Response.json({ insight: result.text, provider: result.provider });
  }, req, { params });
}
