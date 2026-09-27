import { z } from "zod";
import { db } from "@/lib/db";
import { handle } from "@/lib/api";
import { answerCopilotQuestion } from "@/lib/ai/copilot";

const schema = z.object({
  question: z.string().min(1).max(1000),
  datasetId: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  return handle(async ({ user }) => {
    const body = schema.parse(await req.json());

    const history = await db.copilotMessage.findMany({
      where: { orgId: user.orgId },
      orderBy: { createdAt: "desc" },
      take: 8,
    });
    const hist = history.reverse().map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const { answer, provider } = await answerCopilotQuestion({
      orgId: user.orgId,
      userId: user.id,
      datasetId: body.datasetId ?? null,
      question: body.question,
      history: hist,
    });

    await db.copilotMessage.createMany({
      data: [
        { orgId: user.orgId, userId: user.id, role: "user", content: body.question, contextJson: JSON.stringify({ datasetId: body.datasetId ?? null }) },
        { orgId: user.orgId, userId: user.id, role: "assistant", content: answer, contextJson: JSON.stringify({ provider }) },
      ],
    });

    return Response.json({ answer, provider });
  }, req);
}

export async function GET(req: Request) {
  return handle(async ({ user, req }) => {
    const datasetId = new URL(req.url).searchParams.get("datasetId");
    const messages = await db.copilotMessage.findMany({
      where: { orgId: user.orgId },
      orderBy: { createdAt: "asc" },
      take: 60,
    });
    return Response.json({
      messages: messages.map((m) => ({ id: m.id, role: m.role, content: m.content, createdAt: m.createdAt })),
    });
  }, req);
}
