import "server-only";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/auth/crypto";

export class ExtensionAuthError extends Error {
  code = "UNAUTHENTICATED";
}

/** Authenticates a Chrome extension request via its `Authorization: Bearer <token>` header. */
export async function requireExtensionUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) throw new ExtensionAuthError("This browser is not paired.");

  const session = await prisma.extensionSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    throw new ExtensionAuthError("This browser is not paired.");
  }
  if (session.user.status !== "ACTIVE" || session.user.deletedAt) {
    throw new ExtensionAuthError("This account is not active.");
  }

  await prisma.extensionSession.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() },
  });

  return session.user;
}

export class ExtensionProfileError extends Error {
  code = "NO_PROFILE";
}

/** Authenticates the request and loads the caller's CandidateProfile —
 * shared by extension routes (Auto Apply, and the interview-extension
 * companion) that need the profile row, not just the user. */
export async function requireExtensionCandidateProfile(req: NextRequest) {
  const user = await requireExtensionUser(req);
  const profile = await prisma.candidateProfile.findUnique({ where: { userId: user.id } });
  if (!profile) {
    throw new ExtensionProfileError("Finish your Career Profile in Career OS before using this feature.");
  }
  return { user, profile };
}
