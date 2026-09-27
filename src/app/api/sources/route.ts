import { z } from "zod";
import { db } from "@/lib/db";
import { handle, requireRole } from "@/lib/api";
import { ensureOrgSources, sourceAvailability } from "@/lib/pipeline/sources";

export async function GET(req: Request) {
  return handle(async ({ user }) => {
    await ensureOrgSources(user.orgId);
    const orgSources = await db.organizationSource.findMany({
      where: { orgId: user.orgId },
      orderBy: { createdAt: "asc" },
    });
    return Response.json({ sources: sourceAvailability(orgSources) });
  }, req);
}

const patchSchema = z.object({ id: z.string(), enabled: z.boolean() });

export async function PATCH(req: Request) {
  return handle(async ({ user }) => {
    requireRole(user, "write");
    const { id, enabled } = patchSchema.parse(await req.json());
    const source = await db.organizationSource.findFirst({ where: { id, orgId: user.orgId } });
    if (!source) return Response.json({ error: "Source not found" }, { status: 404 });
    await db.organizationSource.update({ where: { id }, data: { enabled } });
    return Response.json({ ok: true });
  }, req);
}
