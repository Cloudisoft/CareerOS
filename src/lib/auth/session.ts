import "server-only";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { generateToken, hashToken } from "@/lib/auth/crypto";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import type { User } from "@prisma/client";

// The DB-tracked expiry is a sliding idle timeout, renewed on every active
// request in getSessionUser() — it's the source of truth for "logged out".
// The cookie's own expiry is just a browser-side ceiling and deliberately
// longer, since Next.js can't rewrite a cookie from a plain Server Component
// render (only from a Route Handler / Server Action), so it can't be slid
// on every request the way the DB row can.
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const IDLE_RENEW_THRESHOLD_MS = 5 * 60 * 1000; // renew once 5+ min have elapsed
const COOKIE_CEILING_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function createSession(userId: string) {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + IDLE_TIMEOUT_MS);

  const headerList = await headers();

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      userAgent: headerList.get("user-agent") ?? undefined,
      ipAddress: headerList.get("x-forwarded-for") ?? undefined,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(Date.now() + COOKIE_CEILING_MS),
    path: "/",
  });

  return token;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  if (session.user.status !== "ACTIVE" || session.user.deletedAt) {
    return null;
  }

  // Sliding idle timeout: renew once at least IDLE_RENEW_THRESHOLD_MS has
  // elapsed since the last renewal, rather than on every single call — an
  // active user's session never expires, but a quiet one still times out
  // within IDLE_TIMEOUT_MS instead of getting extended by a background poll.
  const msUntilExpiry = session.expiresAt.getTime() - Date.now();
  if (msUntilExpiry < IDLE_TIMEOUT_MS - IDLE_RENEW_THRESHOLD_MS) {
    await prisma.session
      .update({ where: { id: session.id }, data: { expiresAt: new Date(Date.now() + IDLE_TIMEOUT_MS) } })
      .catch(() => {});
  }

  return session.user;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) {
    throw new AuthError("Not authenticated");
  }
  return user;
}

export class AuthError extends Error {}
