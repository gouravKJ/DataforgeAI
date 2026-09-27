import { aiGenerate, parseJsonLoose } from "@/lib/ai/provider";
import { localParseRequirement } from "@/lib/ai/local";
import type { ParsedRequirement } from "@/lib/ai/types";

const SYSTEM = `You are the requirement-understanding module of DataForge AI, a data intelligence platform.
Convert a natural-language data request into a strict JSON specification. Never invent facts about real companies; you are only structuring the user's intent.

Return ONLY JSON with this shape:
{
  "intent": "MARKET_RESEARCH" | "LEAD_GENERATION" | "TALENT_SOURCING" | "SPONSOR_PROSPECTING" | "INVESTOR_PROSPECTING",
  "domain": "companies" | "people" | "sponsors",
  "location": { "label": string, "code": string } | null,
  "industries": string[],
  "skills": string[],
  "hiring": boolean,
  "funding": { "stage": string, "context": string } | null,
  "foundedAfter": number | null,
  "employeeRange": { "min": number, "max": number } | null,
  "count": number,
  "filters": string[],
  "fields": [{ "key": string, "label": string, "type": "string"|"number"|"url"|"email"|"date"|"enum"|"text", "required": boolean, "provenance": "SOURCE"|"AI_GENERATED"|"USER"|"DEMO", "options"?: string[] }],
  "notes": string
}

Field guidance:
- Always include fields: name, website, sourceName (required). Add location/industry/foundedYear/employeeCount for companies.
- If hiring is true, include hiringStatus, jobTitle, jobUrl.
- If funding mentioned, include fundingStage.
- Add email/linkedin/description with provenance "AI_GENERATED" only if enrichment is plausible; mark clearly.
- "notes" should state assumptions in one sentence.`;

export async function parseRequirement(query: string): Promise<{ parsed: ParsedRequirement; provider: string }> {
  const res = await aiGenerate({
    system: SYSTEM,
    prompt: `Request: """${query.slice(0, 2000)}"""\n\nReturn the JSON specification now.`,
    json: true,
    temperature: 0.1,
    maxTokens: 1800,
  });

  if (res) {
    const parsed = parseJsonLoose<ParsedRequirement>(res.text);
    if (parsed && typeof parsed.intent === "string" && Array.isArray(parsed.fields) && parsed.fields.length > 0) {
      return { parsed: parsed as ParsedRequirement, provider: res.provider };
    }
    console.warn("[parser] LLM returned unusable JSON, using local parser");
  }
  return { parsed: localParseRequirement(query), provider: "local-fallback" };
}
