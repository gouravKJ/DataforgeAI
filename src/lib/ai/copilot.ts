import { aiGenerate } from "@/lib/ai/provider";
import { db } from "@/lib/db";
import { safeJsonParse } from "@/lib/utils";

type DatasetContext = {
  dataset: { id: string; name: string; query: string; recordCount: number; avgQuality: number };
  stats: Record<string, any>;
  sampleRecords: { id: string; data: Record<string, unknown>; qualityScore: number }[];
};

export async function buildDatasetContext(orgId: string, datasetId: string | null): Promise<DatasetContext | null> {
  const dataset = await db.dataset.findFirst({
    where: { id: datasetId ?? undefined, orgId },
    orderBy: { createdAt: "desc" },
    include: {
      records: {
        where: { status: "ACTIVE" },
        take: 40,
        orderBy: { qualityScore: "desc" },
      },
    },
  });
  if (!dataset) return null;

  const rows = dataset.records.map((r) => ({
    id: r.id,
    data: safeJsonParse<Record<string, unknown>>(r.dataJson, {}),
    qualityScore: r.qualityScore,
  }));

  // lightweight aggregates
  const industryCount = new Map<string, number>();
  const sourceCount = new Map<string, number>();
  for (const r of rows) {
    const ind = String(r.data.industry ?? "Unknown");
    const src = String(r.data.sourceName ?? "Unknown");
    industryCount.set(ind, (industryCount.get(ind) ?? 0) + 1);
    sourceCount.set(src, (sourceCount.get(src) ?? 0) + 1);
  }

  return {
    dataset: {
      id: dataset.id,
      name: dataset.name,
      query: dataset.query,
      recordCount: dataset.recordCount,
      avgQuality: dataset.avgQuality,
    },
    stats: {
      industries: Object.fromEntries(industryCount),
      sources: Object.fromEntries(sourceCount),
    },
    sampleRecords: rows,
  };
}

const SYSTEM = `You are DataForge Copilot, the AI analyst assistant inside a data intelligence platform.
Answer questions ONLY from the provided dataset context (aggregate stats and record samples).
Rules:
- Cite record names when making claims about specific records.
- If the answer is not derivable from the context, say exactly what additional data would be needed.
- Prefer structured, scannable answers (short bullets, bold key numbers).
- Never fabricate companies, numbers, or sources.`;

export async function answerCopilotQuestion(opts: {
  orgId: string;
  userId: string;
  datasetId: string | null;
  question: string;
  history: { role: "user" | "assistant"; content: string }[];
}): Promise<{ answer: string; provider: string }> {
  const context = await buildDatasetContext(opts.orgId, opts.datasetId);

  if (!context) {
    return {
      answer: "I don't have a dataset in scope yet. Build one first (Dashboard → Build a Dataset), then ask me about its records, quality, sources, or composition.",
      provider: "local-fallback",
    };
  }

  const contextBlock = [
    `Dataset: ${context.dataset.name} (request: "${context.dataset.query}")`,
    `Records: ${context.dataset.recordCount}, average quality ${(context.dataset.avgQuality * 100).toFixed(1)}%`,
    `Industry distribution: ${JSON.stringify(context.stats.industries)}`,
    `Source distribution: ${JSON.stringify(context.stats.sources)}`,
    `Top records by quality (name | industry | location | quality | source):`,
    ...context.sampleRecords.slice(0, 25).map(
      (r) =>
        `- ${r.data.name ?? r.id} | ${r.data.industry ?? "?"} | ${r.data.location ?? "?"} | ${(r.qualityScore * 100).toFixed(0)}% | ${r.data.sourceName ?? "?"}`
    ),
  ].join("\n");

  const transcript = opts.history
    .slice(-6)
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  const res = await aiGenerate({
    system: SYSTEM,
    prompt: `DATASET CONTEXT\n${contextBlock}\n\nCONVERSATION SO FAR\n${transcript || "(none)"}\n\nUSER QUESTION: ${opts.question}\n\nAnswer now.`,
    temperature: 0.3,
    maxTokens: 900,
  });

  if (res) return { answer: res.text, provider: res.provider };

  // Local fallback: deterministic analytics answers
  const q = opts.question.toLowerCase();
  const rows = context.sampleRecords;
  const sorted = [...rows].sort((a, b) => b.qualityScore - a.qualityScore);
  if (/quality|highest|best/.test(q)) {
    const top = sorted.slice(0, 5).map((r) => `- **${String(r.data.name)}** — ${(r.qualityScore * 100).toFixed(0)}% (source: ${String(r.data.sourceName)})`);
    return { answer: `Top records by quality:\n${top.join("\n")}`, provider: "local-fallback" };
  }
  if (/source/.test(q)) {
    const lines = Object.entries(context.stats.sources as Record<string, number>).map(([k, v]) => `- ${k}: ${v} records`);
    return { answer: `Records by source:\n${lines.join("\n")}`, provider: "local-fallback" };
  }
  if (/how many|count|total/.test(q)) {
    return { answer: `The dataset has **${context.dataset.recordCount} active records** with average quality ${(context.dataset.avgQuality * 100).toFixed(1)}%.`, provider: "local-fallback" };
  }
  const ind = Object.entries(context.stats.industries as Record<string, number>).sort((a, b) => b[1] - a[1]).slice(0, 5);
  return {
    answer: `Here's what I can tell from dataset **${context.dataset.name}**:\n- Records: ${context.dataset.recordCount}\n- Avg quality: ${(context.dataset.avgQuality * 100).toFixed(1)}%\n- Top industries: ${ind.map(([k, v]) => `${k} (${v})`).join(", ")}\n\nConnect an LLM provider key for richer analysis.`,
    provider: "local-fallback",
  };
}
