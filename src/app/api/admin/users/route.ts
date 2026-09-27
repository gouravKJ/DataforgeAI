import { z } from "zod";
import { db } from "@/lib/db";
import { handle, requireRole } from "@/lib/api";

export async function GET(req: Request) {
  return handle(async ({ user }) => {
    requireRole(user, "admin");
    const users = await db.user.findMany({
      where: { orgId: user.orgId },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, email: true, role: true, createdAt: true, lastLoginAt: true },
    });
    return Response.json({ users });
  }, req);
}

const patchSchema = z.object({ userId: z.string(), role: z.enum(["ADMIN", "ANALYST", "VIEWER"]) });

export async function PATCH(req: Request) {
  return handle(async ({ user }) => {
    requireRole(user, "admin");
    const { userId, role } = patchSchema.parse(await req.json());
    const target = await db.user.findFirst({ where: { id: userId, orgId: user.orgId } });
    if (!target) return Response.json({ error: "User not found" }, { status: 404 });
    await db.user.update({ where: { id: userId }, data: { role } });
    return Response.json({ ok: true });
  }, req);
}
