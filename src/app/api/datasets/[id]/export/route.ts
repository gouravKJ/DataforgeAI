import { db } from "@/lib/db";
import { handle } from "@/lib/api";
import { safeJsonParse } from "@/lib/utils";

function csvEscape(v: unknown): string {
  const s = v == null ? "" : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async ({ user, params, req }) => {
    const { id } = params;
    const format = new URL(req.url).searchParams.get("format") ?? "csv";

    const dataset = await db.dataset.findFirst({ where: { id, orgId: user.orgId } });
    if (!dataset) return Response.json({ error: "Dataset not found" }, { status: 404 });

    const records = await db.record.findMany({
      where: { datasetId: dataset.id, status: "ACTIVE" },
      orderBy: { qualityScore: "desc" },
    });

    const rows = records.map((r) => safeJsonParse<Record<string, unknown>>(r.dataJson, {}));
    const columns = [...new Set(rows.flatMap((r) => Object.keys(r)))].filter((c) => !c.startsWith("__"));

    if (format === "json") {
      return new Response(
        JSON.stringify(
          {
            dataset: { id: dataset.id, name: dataset.name, query: dataset.query, generatedAt: new Date().toISOString() },
            provenance: {
              note: "All records labeled DEMO originate from DataForge's synthetic demo registry, not real sources.",
              qualityModel: "0.55*completeness + 0.35*provenance + 0.10*(1 - conflictPenalty)",
            },
            records: rows,
          },
          null,
          2
        ),
        {
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="${slugName(dataset.name)}.json"`,
          },
        }
      );
    }

    const lines = [columns.join(",")];
    for (const row of rows) {
      lines.push(columns.map((c) => csvEscape(row[c])).join(","));
    }
    return new Response(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${slugName(dataset.name)}.csv"`,
      },
    });
  }, req, { params });
}

function slugName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "dataset";
}
