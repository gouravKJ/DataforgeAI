import { z } from "zod";
import { db } from "@/lib/db";
import { handle, requireRole } from "@/lib/api";
import { ensureOrgSources } from "@/lib/pipeline/sources";
import type { ParsedRequirement, WorkflowPlan } from "@/lib/ai/types";

const listSchema = z.object({
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
  q: z.string().optional(),
});

const createSchema = z.object({
  query: z.string().min(8).max(2000),
  requirement: z.any(),
  plan: z.any(),
});

export async function GET(req: Request) {
  return handle(async ({ user, req }) => {
    const url = new URL(req.url);
    const { status, q } = listSchema.parse({
      status: url.searchParams.get("status") ?? undefined,
      q: url.searchParams.get("q") ?? undefined,
    });
    const datasets = await db.dataset.findMany({
      where: {
        orgId: user.orgId,
        ...(status ? { status } : {}),
        ...(q ? { OR: [{ name: { contains: q } }, { query: { contains: q } }] } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { createdBy: { select: { name: true } } },
      take: 100,
    });
    return Response.json({
      datasets: datasets.map((d) => ({
        id: d.id,
        name: d.name,
        description: d.description,
        query: d.query,
        status: d.status,
        recordCount: d.recordCount,
        avgQuality: d.avgQuality,
        origin: d.origin,
        createdBy: d.createdBy?.name ?? "—",
        createdAt: d.createdAt,
      })),
    });
  }, req);
}

export async function POST(req: Request) {
  return handle(async ({ user }) => {
    requireRole(user, "write");
    const body = createSchema.parse(await req.json());
    await ensureOrgSources(user.orgId);

    const requirement = body.requirement as ParsedRequirement;
    const plan = body.plan as WorkflowPlan;

    const dataset = await db.dataset.create({
      data: {
        orgId: user.orgId,
        name: deriveDatasetName(requirement, body.query),
        description: plan?.summary ?? "",
        query: body.query,
        schemaJson: JSON.stringify(requirement),
        planJson: JSON.stringify(plan),
        origin: "USER",
        createdById: user.id,
      },
    });

    const job = await db.job.create({
      data: {
        orgId: user.orgId,
        datasetId: dataset.id,
        type: "COLLECTION",
        status: "QUEUED",
      },
    });

    // enqueue after both rows exist
    const { enqueueJob } = await import("@/lib/pipeline/queue");
    await enqueueJob(job.id);

    return Response.json({ datasetId: dataset.id, jobId: job.id }, { status: 201 });
  }, req);
}

function deriveDatasetName(requirement: ParsedRequirement, query: string): string {
  const parts: string[] = [];
  if (requirement?.industries?.length) parts.push(requirement.industries.slice(0, 2).join(" / "));
  if (requirement?.location) parts.push(requirement.location.label);
  if (requirement?.hiring) parts.push("Hiring");
  if (parts.length === 0) parts.push(query.split(/\s+/).slice(0, 5).join(" "));
  return parts.join(" — ").slice(0, 80);
}
