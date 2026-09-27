import { aiGenerate, parseJsonLoose } from "@/lib/ai/provider";
import { localPlanWorkflow } from "@/lib/ai/local";
import type { ParsedRequirement, WorkflowPlan } from "@/lib/ai/types";

const SYSTEM = `You are the workflow-planning module of DataForge AI.
Given a structured requirement, design the data-collection pipeline as JSON.

Return ONLY JSON:
{
  "summary": string,
  "estimatedRecords": number,
  "estimatedMinutes": number,
  "nodes": [{ "id": string, "kind": "REQUIREMENT"|"SOURCE_DISCOVERY"|"DISCOVERY"|"EXTRACTION"|"ENTITY_RESOLUTION"|"DEDUPLICATION"|"VALIDATION"|"QUALITY_SCORING"|"DATASET", "title": string, "description": string, "dependsOn": string[] }]
}

Rules:
- Node ids must be kebab-case and unique; dependsOn must reference existing ids.
- Start with "requirement" then "source-discovery"; end with "final-dataset".
- Include domain-specific collection stages (e.g. Job Verification when hiring matters).`;

export async function planWorkflow(req: ParsedRequirement): Promise<{ plan: WorkflowPlan; provider: string }> {
  const res = await aiGenerate({
    system: SYSTEM,
    prompt: `Requirement JSON:\n${JSON.stringify(req, null, 2)}\n\nReturn the workflow plan JSON now.`,
    json: true,
    temperature: 0.2,
    maxTokens: 1600,
  });

  if (res) {
    const plan = parseJsonLoose<WorkflowPlan>(res.text);
    if (plan && Array.isArray(plan.nodes) && plan.nodes.length >= 4) {
      // normalize: ensure all dependsOn reference existing ids
      const ids = new Set(plan.nodes.map((n) => n.id));
      plan.nodes.forEach((n) => {
        n.dependsOn = (n.dependsOn || []).filter((d) => ids.has(d));
      });
      return { plan, provider: res.provider };
    }
    console.warn("[planner] LLM returned unusable plan, using local planner");
  }
  return { plan: localPlanWorkflow(req), provider: "local-fallback" };
}
