import { z } from "zod";
import { db } from "@/lib/db";
import { handle, requireRole } from "@/lib/api";

const schema = z.object({
  organizationName: z.string().min(2).max(80),
  industry: z.string().min(2).max(60),
  teamSize: z.enum(["1-10", "11-50", "51-200", "201-1000", "1000+"]),
  useCase: z.enum(["lead-generation", "market-research", "talent-sourcing", "investor-research", "other"]),
});

export async function POST(req: Request) {
  return handle(async ({ user }) => {
    requireRole(user, "admin");
    const body = schema.parse(await req.json());
    await db.organization.update({
      where: { id: user.orgId },
      data: {
        name: body.organizationName,
        industry: body.industry,
        teamSize: body.teamSize,
        useCase: body.useCase,
        onboarded: true,
      },
    });
    return Response.json({ ok: true });
  }, req);
}
