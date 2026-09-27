import { aiGenerate } from "@/lib/ai/provider";
import { localDatasetInsights } from "@/lib/ai/local";

export async function generateDatasetInsights(input: {
  datasetName: string;
  query: string;
  rowCount: number;
  avgQuality: number;
  topIndustries: [string, number][];
  conflictCount: number;
  duplicateRate: number;
  validationRate: number;
  sources: string[];
}): Promise<{ text: string; provider: string }> {
  const res = await aiGenerate({
    system: `You are the insights module of DataForge AI. Given dataset statistics (never raw rows), produce a short executive briefing in markdown with bold mini-headers. Ground every claim in the provided stats; if numbers are missing, say what is unknown. Never fabricate.`,
    prompt: `Dataset: ${input.datasetName}\nOriginal request: "${input.query}"\nStats JSON:\n${JSON.stringify(
      {
        rowCount: input.rowCount,
        avgQuality: Number(input.avgQuality.toFixed(3)),
        topIndustries: input.topIndustries,
        conflictCount: input.conflictCount,
        duplicateRate: Number(input.duplicateRate.toFixed(3)),
        validationRate: Number(input.validationRate.toFixed(3)),
        sources: input.sources,
      },
      null,
      2
    )}\n\nWrite the briefing (max 180 words).`,
    temperature: 0.4,
    maxTokens: 600,
  });

  if (res) return { text: res.text, provider: res.provider };
  return { text: localDatasetInsights(input), provider: "local-fallback" };
}
