import { cookies } from "next/headers";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const SESSION_COOKIE = "df_session";
const SESSION_DAYS = 30;

function appSecret() {
  return process.env.APP_SECRET || "dataforge-dev-secret";
}

export function hashToken(token: string) {
  return createHmac("sha256", appSecret()).update(token).digest("hex");
}

export function generateToken() {
  return randomBytes(32).toString("hex");
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

export async function createSession(userId: string) {
  const raw = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.session.create({
    data: { token: hashToken(raw), userId, expiresAt },
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, raw, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
  return raw;
}

export async function destroySession() {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (raw) {
    await db.session.deleteMany({ where: { token: hashToken(raw) } });
  }
  jar.delete(SESSION_COOKIE);
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "ANALYST" | "VIEWER";
  orgId: string;
  org: { id: string; name: string; slug: string; onboarded: boolean; industry: string };
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const session = await db.session.findUnique({
    where: { token: hashToken(raw) },
    include: { user: { include: { org: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  const u = session.user;
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role as SessionUser["role"],
    orgId: u.orgId,
    org: {
      id: u.org.id,
      name: u.org.name,
      slug: u.org.slug,
      onboarded: u.org.onboarded,
      industry: u.org.industry,
    },
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    const err = new Error("UNAUTHORIZED") as Error & { status?: number };
    err.status = 401;
    throw err;
  }
  return user;
}

export function canWrite(role: SessionUser["role"]) {
  return role === "ADMIN" || role === "ANALYST";
}

export function isAdmin(role: SessionUser["role"]) {
  return role === "ADMIN";
}
