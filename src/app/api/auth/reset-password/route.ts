import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, hashToken } from "@/lib/auth";

const schema = z.object({ token: z.string().min(10), password: z.string().min(8).max(100) });

export async function POST(req: Request) {
  try {
    const { token, password } = schema.parse(await req.json());
    const record = await db.passwordResetToken.findUnique({ where: { token: hashToken(token) } });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return Response.json({ error: "Reset link is invalid or expired" }, { status: 400 });
    }
    await db.user.update({
      where: { id: record.userId },
      data: { passwordHash: await hashPassword(password) },
    });
    await db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
    await db.session.deleteMany({ where: { userId: record.userId } });
    return Response.json({ ok: true });
  } catch (err: any) {
    if (err instanceof z.ZodError) return Response.json({ error: "Invalid input" }, { status: 422 });
    return Response.json({ error: "Reset failed" }, { status: 500 });
  }
}
