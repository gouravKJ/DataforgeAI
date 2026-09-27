import { db } from "@/lib/db";
import { handle, requireRole } from "@/lib/api";
import { notifyJobUpdate } from "@/lib/pipeline/queue";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async ({ user, params }) => {
    requireRole(user, "write");
    const { id } = params;
    const job = await db.job.findFirst({ where: { id, orgId: user.orgId } });
    if (!job) return Response.json({ error: "Job not found" }, { status: 404 });
    if (job.status === "COMPLETED" || job.status === "FAILED" || job.status === "CANCELLED") {
      return Response.json({ error: `Job already ${job.status.toLowerCase()}` }, { status: 409 });
    }
    await db.job.update({
      where: { id: job.id },
      data: { status: "CANCELLED", error: "Cancelled by user", finishedAt: new Date() },
    });
    await db.jobEvent.create({
      data: { jobId: job.id, level: "warn", stage: "Pipeline", message: "Job cancelled by user" },
    });
    notifyJobUpdate(job.id);
    return Response.json({ ok: true });
  }, req, { params });
}
