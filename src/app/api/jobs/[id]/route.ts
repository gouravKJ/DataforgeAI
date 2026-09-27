import { db } from "@/lib/db";
import { handle } from "@/lib/api";
import { safeJsonParse } from "@/lib/utils";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async ({ user, params }) => {
    const { id } = params;
    const job = await db.job.findFirst({
      where: { id, orgId: user.orgId },
      include: { dataset: { select: { id: true, name: true } } },
    });
    if (!job) return Response.json({ error: "Job not found" }, { status: 404 });
    const events = await db.jobEvent.findMany({
      where: { jobId: job.id },
      orderBy: { createdAt: "asc" },
      take: 300,
    });
    return Response.json({
      job: {
        id: job.id,
        type: job.type,
        status: job.status,
        currentStage: job.currentStage,
        progress: job.progress,
        nodes: safeJsonParse(job.nodesJson, []),
        stats: safeJsonParse(job.statsJson, {}),
        error: job.error,
        startedAt: job.startedAt,
        finishedAt: job.finishedAt,
        createdAt: job.createdAt,
        dataset: job.dataset,
        events: events.map((e) => ({
          id: e.id,
          level: e.level,
          stage: e.stage,
          message: e.message,
          at: e.createdAt,
        })),
      },
    });
  }, req, { params });
}
