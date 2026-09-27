import { requireUser } from "@/lib/auth";
import { jobSnapshot, subscribe } from "@/lib/pipeline/queue";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const snapshot = await jobSnapshot(id);
    if (!snapshot) {
      return new Response("Not found", { status: 404 });
    }

    const encoder = new TextEncoder();
    let unsubscribe: (() => void) | null = null;
    let interval: ReturnType<typeof setInterval> | null = null;

    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        send("snapshot", snapshot);

        unsubscribe = subscribe((jobId) => {
          if (jobId !== id) return;
          jobSnapshot(id).then((snap) => snap && send("snapshot", snap)).catch(() => {});
        });

        // heartbeat keeps proxies from closing idle streams
        interval = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(": ping\n\n"));
          } catch {
            // stream closed
          }
        }, 15000);

        req.signal.addEventListener("abort", () => {
          unsubscribe?.();
          if (interval) clearInterval(interval);
          try {
            controller.close();
          } catch {
            // already closed
          }
        });
      },
      cancel() {
        unsubscribe?.();
        if (interval) clearInterval(interval);
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err: any) {
    if (err?.status === 401) return new Response("Unauthorized", { status: 401 });
    console.error("[sse]", err);
    return new Response("Internal error", { status: 500 });
  }
}
