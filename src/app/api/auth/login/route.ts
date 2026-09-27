import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const email = body.email.toLowerCase().trim();
    const user = await db.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }
    await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await createSession(user.id);
    const org = await db.organization.findUnique({ where: { id: user.orgId } });
    return Response.json({ ok: true, onboarded: org?.onboarded ?? false });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: "Invalid input" }, { status: 422 });
    }
    console.error("[login]", err);
    return Response.json({ error: "Login failed" }, { status: 500 });
  }
}
