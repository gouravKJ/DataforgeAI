import { z } from "zod";
import { handle, requireRole } from "@/lib/api";
import { parseRequirement } from "@/lib/ai/requirement-parser";

const schema = z.object({ query: z.string().min(8).max(2000) });

export async function POST(req: Request) {
  return handle(async ({ user }) => {
    requireRole(user, "write");
    const { query } = schema.parse(await req.json());
    const { parsed, provider } = await parseRequirement(query);
    return Response.json({ parsed, provider });
  }, req);
}
