import { db } from "@/lib/db";
import { handle } from "@/lib/api";
import { safeJsonParse } from "@/lib/utils";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async ({ user, params }) => {
    const { id } = params;
    const record = await db.record.findFirst({
      where: { id },
      include: {
        dataset: { select: { id: true, name: true, orgId: true, query: true } },
        fieldProvenance: { orderBy: { field: "asc" } },
      },
    });
    if (!record || record.dataset.orgId !== user.orgId) {
      return Response.json({ error: "Record not found" }, { status: 404 });
    }

    return Response.json({
      record: {
        id: record.id,
        dataset: record.dataset,
        data: safeJsonParse(record.dataJson, {}),
        fieldMeta: safeJsonParse(record.fieldMetaJson, {}),
        qualityScore: record.qualityScore,
        status: record.status,
        conflict: record.conflict,
        conflicts: safeJsonParse(record.conflictJson, []),
        externalKey: record.externalKey,
        createdAt: record.createdAt,
      },
    });
  }, req, { params });
}
