import { db } from "@/lib/db";
import { runPipeline } from "@/lib/pipeline/engine";
import { safeJsonParse } from "@/lib/utils";

/**
 * Durable DB-backed job queue.
 *
 * Production note: swap runPipeline for a BullMQ worker (Redis) behind the same
 * enqueue/subscribe API — the rest of the app only depends on job rows + SSE.
 */

type Listener = (jobId: string) => void;

const globalForQueue = globalThis as unknown as {
  __dfListeners: Set<Listener> | undefined;
  __dfWorkerRunning: boolean | undefined;
};

const listeners: Set<Listener> = (globalForQueue.__dfListeners ??= new Set());
const tickListeners = new Set<() => void>();

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Notify SSE streams to push the latest job snapshot. */
export function notifyJobUpdate(jobId: string) {
  for (const l of listeners) {
    try {
      l(jobId);
    } catch {
      // listener errors must never break the pipeline
    }
  }
}

export async function enqueueJob(jobId: string) {
  notifyJobUpdate(jobId);
  setImmediate(() => void pump());
}

async function pump() {
  if (globalForQueue.__dfWorkerRunning) return;
  globalForQueue.__dfWorkerRunning = true;
  try {
    for (;;) {
      const job = await db.job.findFirst({
        where: { status: "QUEUED" },
        orderBy: { createdAt: "asc" },
      });
      if (!job) break;
      await db.job.update({ where: { id: job.id }, data: { status: "RUNNING" } });
      try {
        await runPipeline(job.id);
      } finally {
        notifyJobUpdate(job.id);
      }
    }
    // safety net: fail long-stuck running jobs (e.g. after a server restart)
    const stuck = await db.job.findMany({
      where: { status: "RUNNING", updatedAt: { lt: new Date(Date.now() - 10 * 60 * 1000) } },
    });
    for (const s of stuck) {
      await db.job.update({ where: { id: s.id }, data: { status: "FAILED", error: "Timed out", finishedAt: new Date() } });
      notifyJobUpdate(s.id);
    }
  } finally {
    globalForQueue.__dfWorkerRunning = false;
  }
}

/** Serialize job snapshot for SSE payload. */
export async function jobSnapshot(jobId: string) {
  const job = await db.job.findUnique({
    where: { id: jobId },
    include: { events: { orderBy: { createdAt: "asc" }, take: 200 } },
  });
  if (!job) return null;
  return {
    id: job.id,
    status: job.status,
    currentStage: job.currentStage,
    progress: job.progress,
    nodes: safeJsonParse(job.nodesJson, []),
    stats: safeJsonParse(job.statsJson, {}),
    error: job.error,
    events: job.events.map((e) => ({
      id: e.id,
      level: e.level,
      stage: e.stage,
      message: e.message,
      at: e.createdAt,
    })),
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
  };
}
