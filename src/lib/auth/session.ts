import "server-only";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { generateToken, hashToken } from "@/lib/auth/crypto";
import { SESSION_COOKIE, VIEW_AS_COOKIE } from "@/lib/auth/constants";
import { allowedRolesFor } from "@/lib/auth/multi-role";
import type { User } from "@prisma/client";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function createSession(userId: string) {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

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
    expires: expiresAt,
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
  cookieStore.delete(VIEW_AS_COOKIE);
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

  // Full-access accounts can view the app as another of their allowed roles.
  // The choice is re-checked against the admin-granted list on every request,
  // so revoking access takes effect immediately.
  const viewAs = cookieStore.get(VIEW_AS_COOKIE)?.value as User["role"] | undefined;
  if (viewAs && viewAs !== session.user.role) {
    const allowed = await allowedRolesFor(session.user);
    if (allowed.includes(viewAs)) return { ...session.user, role: viewAs };
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
