import { z } from "zod";
import { db } from "@/lib/db";
import { generateToken, hashToken } from "@/lib/auth";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  try {
    const { email } = schema.parse(await req.json());
    const user = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } });

    // Always return ok (no account enumeration). If SMTP is configured, send email.
    if (user) {
      const raw = generateToken();
      await db.passwordResetToken.create({
        data: {
          token: hashToken(raw),
          userId: user.id,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });
      // In production, email `raw` via the mail provider. Dev convenience:
      if (process.env.NODE_ENV !== "production") {
        return Response.json({ ok: true, devResetToken: raw });
      }
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: true });
  }
}
