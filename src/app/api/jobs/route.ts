import { db } from "@/lib/db";
import { handle } from "@/lib/api";

export async function GET(req: Request) {
  return handle(async ({ user, req }) => {
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 200);
    const jobs = await db.job.findMany({
      where: { orgId: user.orgId, ...(status ? { status: status.toUpperCase() } : {}) },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { dataset: { select: { id: true, name: true } } },
    });
    return Response.json({
      jobs: jobs.map((j) => ({
        id: j.id,
        type: j.type,
        status: j.status,
        currentStage: j.currentStage,
        progress: j.progress,
        dataset: j.dataset,
        createdAt: j.createdAt,
        finishedAt: j.finishedAt,
      })),
    });
  }, req);
}
