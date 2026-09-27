import { db } from "@/lib/db";
import { handle, requireRole } from "@/lib/api";
import { aiGenerate } from "@/lib/ai/provider";

export async function GET(req: Request) {
  return handle(async ({ user }) => {
    requireRole(user, "admin");
    const [orgCount, userCount, datasetCount, recordCount, jobCount] = await Promise.all([
      db.organization.count(),
      db.user.count(),
      db.dataset.count(),
      db.dataset.aggregate({ _sum: { recordCount: true } }),
      db.job.count(),
    ]);
    return Response.json({
      organizations: orgCount,
      users: userCount,
      datasets: datasetCount,
      records: recordCount._sum.recordCount ?? 0,
      jobs: jobCount,
      ai: {
        provider: process.env.GROQ_API_KEY ? "groq" : "local-fallback",
        model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
      },
    });
  }, req);
}

export async function POST(req: Request) {
  return handle(async ({ user }) => {
    requireRole(user, "admin");
    const body = await req.json().catch(() => ({}));
    const res = await aiGenerate({ prompt: String(body?.prompt ?? "ping"), maxTokens: 16 });
    return Response.json({ ok: true, provider: res?.provider ?? "unavailable" });
  }, req);
}
