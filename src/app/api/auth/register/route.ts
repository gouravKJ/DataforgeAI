import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth";
import { ensureOrgSources } from "@/lib/pipeline/sources";
import { slugify } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  organizationName: z.string().min(2).max(80),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const email = body.email.toLowerCase().trim();

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return Response.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    let slug = slugify(body.organizationName) || "org";
    const slugTaken = await db.organization.findUnique({ where: { slug } });
    if (slugTaken) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

    const org = await db.organization.create({
      data: { name: body.organizationName.trim(), slug },
    });
    await ensureOrgSources(org.id);

    const user = await db.user.create({
      data: {
        email,
        name: body.name.trim(),
        passwordHash: await hashPassword(body.password),
        role: "ADMIN",
        orgId: org.id,
      },
    });

    await createSession(user.id);
    return Response.json({ ok: true, onboarded: false });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: "Invalid input", issues: err.flatten().fieldErrors }, { status: 422 });
    }
    console.error("[register]", err);
    return Response.json({ error: "Registration failed" }, { status: 500 });
  }
}
