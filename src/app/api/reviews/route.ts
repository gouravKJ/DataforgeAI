import { z } from "zod";
import { db } from "@/lib/db";
import { handle, requireRole } from "@/lib/api";
import { safeJsonParse } from "@/lib/utils";

export async function GET(req: Request) {
  return handle(async ({ user }) => {
    const reviews = await db.review.findMany({
      where: { orgId: user.orgId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        record: {
          select: {
            id: true,
            dataJson: true,
            fieldMetaJson: true,
            qualityScore: true,
            dataset: { select: { id: true, name: true } },
          },
        },
        reviewedBy: { select: { name: true } },
      },
    });

    return Response.json({
      reviews: reviews.map((r) => ({
        id: r.id,
        status: r.status,
        field: r.field,
        note: r.note,
        record: {
          id: r.record.id,
          name: safeJsonParse<Record<string, unknown>>(r.record.dataJson, {}).name ?? r.record.id,
          dataset: r.record.dataset,
          qualityScore: r.record.qualityScore,
        },
        original: safeJsonParse(r.originalJson, {}),
        corrected: safeJsonParse(r.correctedJson, {}),
        reviewedBy: r.reviewedBy?.name ?? null,
        reviewedAt: r.reviewedAt,
        createdAt: r.createdAt,
      })),
    });
  }, req);
}

const actionSchema = z.object({
  reviewId: z.string(),
  action: z.enum(["APPROVE", "CORRECT", "REJECT"]),
  corrected: z.record(z.string()).optional(),
  note: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  return handle(async ({ user }) => {
    requireRole(user, "write");
    const body = actionSchema.parse(await req.json());

    const review = await db.review.findFirst({
      where: { id: body.reviewId, orgId: user.orgId },
      include: { record: { include: { dataset: true } } },
    });
    if (!review) return Response.json({ error: "Review not found" }, { status: 404 });

    if (body.action === "APPROVE") {
      await db.review.update({
        where: { id: review.id },
        data: { status: "APPROVED", reviewedById: user.id, reviewedAt: new Date(), note: body.note ?? "" },
      });
      // mark fields human-verified → boosts provenance in quality model
      const fieldMeta = safeJsonParse<Record<string, any>>(review.record.fieldMetaJson, {});
      const fieldsToVerify = review.field ? [review.field] : Object.keys(fieldMeta);
      for (const f of fieldsToVerify) {
        if (fieldMeta[f]) {
          fieldMeta[f].verified = true;
          fieldMeta[f].history = [
            ...(fieldMeta[f].history ?? []),
            { at: new Date().toISOString(), action: "human-verified", note: `Verified by ${user.name}` },
          ];
        }
      }
      await db.record.update({
        where: { id: review.recordId },
        data: { fieldMetaJson: JSON.stringify(fieldMeta), status: "ACTIVE" },
      });
    } else if (body.action === "CORRECT") {
      const corrections = body.corrected ?? {};
      const data = safeJsonParse<Record<string, unknown>>(review.record.dataJson, {});
      const fieldMeta = safeJsonParse<Record<string, any>>(review.record.fieldMetaJson, {});
      for (const [field, value] of Object.entries(corrections)) {
        data[field] = value;
        if (fieldMeta[field]) {
          fieldMeta[field].provenance = "USER";
          fieldMeta[field].confidence = 1;
          fieldMeta[field].verified = true;
          fieldMeta[field].history = [
            ...(fieldMeta[field].history ?? []),
            { at: new Date().toISOString(), action: "human-corrected", note: `Corrected by ${user.name}` },
          ];
        }
      }
      await db.record.update({
        where: { id: review.recordId },
        data: {
          dataJson: JSON.stringify(data),
          fieldMetaJson: JSON.stringify(fieldMeta),
          conflict: false,
          conflictJson: "[]",
          status: "ACTIVE",
        },
      });
      await db.review.update({
        where: { id: review.id },
        data: {
          status: "CORRECTED",
          correctedJson: JSON.stringify(corrections),
          reviewedById: user.id,
          reviewedAt: new Date(),
          note: body.note ?? "",
        },
      });
    } else {
      await db.review.update({
        where: { id: review.id },
        data: { status: "REJECTED", reviewedById: user.id, reviewedAt: new Date(), note: body.note ?? "" },
      });
      await db.record.update({
        where: { id: review.recordId },
        data: { status: "FLAGGED" },
      });
    }

    return Response.json({ ok: true });
  }, req);
}
