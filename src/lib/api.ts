import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { canWrite, isAdmin, requireUser, type SessionUser } from "@/lib/auth";

export type Handler = (ctx: {
  user: SessionUser;
  req: Request;
  params: any;
}) => Promise<Response> | Response;

export function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function apiError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

/**
 * Wraps an authenticated handler. `ctx` is the raw Next.js route context so
 * dynamic routes can pass `{ params }` through (params is a Promise in Next 15).
 */
export async function handle(fn: Handler, req: Request, ctx?: { params: Promise<any> }) {
  try {
    const user = await requireUser();
    const params = ctx ? await ctx.params : undefined;
    return await fn({ user, req, params });
  } catch (err: any) {
    if (err?.status === 401) return apiError("Authentication required", 401);
    if (err?.status === 403) return apiError(err.message, 403);
    if (err instanceof ZodError) {
      return apiError("Invalid input", 422, { issues: err.flatten().fieldErrors });
    }
    console.error("[api]", err);
    return apiError(err?.message || "Internal server error", 500);
  }
}

export function requireRole(user: SessionUser, mode: "read" | "write" | "admin") {
  if (mode === "admin" && !isAdmin(user.role)) {
    throw Object.assign(new Error("Admin role required"), { status: 403 });
  }
  if (mode === "write" && !canWrite(user.role)) {
    throw Object.assign(new Error("Your role does not permit this action"), { status: 403 });
  }
}
