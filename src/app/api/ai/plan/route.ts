import { z } from "zod";
import { handle, requireRole } from "@/lib/api";
import { planWorkflow } from "@/lib/ai/workflow-planner";
import type { ParsedRequirement } from "@/lib/ai/types";

const schema = z.object({ requirement: z.any() });

export async function POST(req: Request) {
  return handle(async ({ user }) => {
    requireRole(user, "write");
    const { requirement } = schema.parse(await req.json());
    const { plan, provider } = await planWorkflow(requirement as ParsedRequirement);
    return Response.json({ plan, provider });
  }, req);
}
