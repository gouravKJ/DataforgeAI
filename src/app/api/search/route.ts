import { z } from "zod";
import { db } from "@/lib/db";
import { handle } from "@/lib/api";
import { safeJsonParse } from "@/lib/utils";
import { embedQueryLocal, cosine } from "@/lib/ai/embeddings";

const schema = z.object({
  q: z.string().min(2).max(300),
  datasetId: z.string().optional().nullable(),
  mode: z.enum(["semantic", "keyword"]).default("semantic"),
});

export async function POST(req: Request) {
  return handle(async ({ user }) => {
    const { q, datasetId, mode } = schema.parse(await req.json());

    const datasets = await db.dataset.findMany({
      where: { orgId: user.orgId, ...(datasetId ? { id: datasetId } : {}) },
      select: { id: true, name: true },
    });
    const datasetMap = new Map(datasets.map((d) => [d.id, d.name]));

    const records = await db.record.findMany({
      where: { datasetId: { in: datasets.map((d) => d.id) }, status: "ACTIVE" },
      take: 4000,
    });

    const queryVec = embedQueryLocal(q);
    const lowerQ = q.toLowerCase();
    const terms = lowerQ.split(/\s+/).filter(Boolean);

    const scored = records
      .map((r) => {
        const data = safeJsonParse<Record<string, unknown>>(r.dataJson, {});
        const haystack = Object.entries(data)
          .filter(([k]) => !k.startsWith("__"))
          .map(([, v]) => String(v ?? ""))
          .join(" ")
          .toLowerCase();
        const keywordScore = terms.reduce((s, t) => s + (haystack.includes(t) ? 1 : 0), 0) / Math.max(1, terms.length);
        const semanticScore = cosine(queryVec, safeJsonParse<number[]>(r.embeddingJson, []));
        const score = mode === "semantic" ? semanticScore * 0.75 + keywordScore * 0.25 : keywordScore;
        return {
          recordId: r.id,
          datasetId: r.datasetId,
          datasetName: datasetMap.get(r.datasetId) ?? "—",
          name: String(data.name ?? r.id),
          snippet: String(data.description ?? data.industry ?? "").slice(0, 160),
          location: String(data.location ?? ""),
          industry: String(data.industry ?? ""),
          qualityScore: r.qualityScore,
          score: Number(score.toFixed(4)),
        };
      })
      .filter((r) => r.score > 0.08)
      .sort((a, b) => b.score - a.score)
      .slice(0, 30);

    return Response.json({ results: scored, mode, total: scored.length });
  }, req);
}
