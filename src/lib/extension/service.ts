import "server-only";
import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { generateToken, hashToken } from "@/lib/auth/crypto";
import type { User } from "@prisma/client";

const PAIRING_CODE_TTL_MS = 10 * 60 * 1000;
const CONNECT_REQUEST_TTL_MS = 5 * 60 * 1000;
const EXTENSION_SESSION_TTL_MS = 90 * 24 * 60 * 60 * 1000;
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I/L

export class ExtensionServiceError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

function generateCode(length = 6) {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return out;
}

/**
 * A short code derived from a connect request's state. The extension shows it in a notification when it
 * opens the approval page, and the page shows it too: approving only when they match means a link someone
 * else started (to collect a token for your account) can't be approved by mistake. Mirrors
 * connectCode() in extension/lib/careeros-api.js.
 */
export function connectCode(state: string) {
  const bytes = createHash("sha256").update(state, "utf8").digest();
  let out = "";
  for (let i = 0; i < 6; i++) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return `${out.slice(0, 3)}-${out.slice(3)}`;
}

async function issueExtensionSession(userId: string, label?: string) {
  const token = generateToken();
  await prisma.extensionSession.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      deviceLabel: label || null,
      expiresAt: new Date(Date.now() + EXTENSION_SESSION_TTL_MS),
    },
  });
  return token;
}

export async function generatePairingCode(userId: string) {
  // One live code per user at a time keeps the settings UI simple.
  await prisma.extensionPairingCode.deleteMany({ where: { userId, usedAt: null } });

  const code = generateCode();
  const record = await prisma.extensionPairingCode.create({
    data: { code, userId, expiresAt: new Date(Date.now() + PAIRING_CODE_TTL_MS) },
  });
  return { code: record.code, expiresAt: record.expiresAt };
}

export async function consumePairingCode(code: string, label?: string) {
  const record = await prisma.extensionPairingCode.findUnique({
    where: { code: code.toUpperCase() },
    include: { user: true },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw new ExtensionServiceError("That code is invalid or has expired.", "INVALID_CODE");
  }

  await prisma.extensionPairingCode.update({ where: { id: record.id }, data: { usedAt: new Date() } });
  const token = await issueExtensionSession(record.userId, label);

  return { token, email: record.user.email, name: `${record.user.firstName} ${record.user.lastName}` };
}

export async function startConnectRequest(state: string, label?: string, version?: string) {
  // Housekeeping: requests and pairing codes are short-lived; drop ones that ended over a day ago.
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await prisma.extensionConnectRequest.deleteMany({ where: { expiresAt: { lt: dayAgo } } });
  await prisma.extensionPairingCode.deleteMany({ where: { expiresAt: { lt: dayAgo } } });
  await prisma.extensionSession.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  await prisma.extensionConnectRequest.create({
    data: { state, label, version, expiresAt: new Date(Date.now() + CONNECT_REQUEST_TTL_MS) },
  });
}

export async function getConnectRequest(state: string) {
  return prisma.extensionConnectRequest.findUnique({ where: { state } });
}

/** What the approval page shows about the browser asking to connect. */
export async function describeConnectRequest(state: string) {
  const record = await prisma.extensionConnectRequest.findUnique({ where: { state } });
  if (!record) return null;
  return {
    label: record.label ?? "A browser",
    version: record.version ?? null,
    createdAt: record.createdAt.toISOString(),
    code: connectCode(state),
    valid: record.status === "PENDING" && record.expiresAt > new Date(),
  };
}

export async function approveConnectRequest(state: string, user: User) {
  const record = await prisma.extensionConnectRequest.findUnique({ where: { state } });
  if (!record || record.expiresAt < new Date() || record.status !== "PENDING") {
    throw new ExtensionServiceError("This connection request is no longer valid.", "INVALID_REQUEST");
  }

  const token = await issueExtensionSession(user.id, record.label ?? undefined);
  await prisma.extensionConnectRequest.update({
    where: { id: record.id },
    data: { status: "APPROVED", userId: user.id, pendingToken: token },
  });
}

export async function denyConnectRequest(state: string) {
  await prisma.extensionConnectRequest.updateMany({
    where: { state, status: "PENDING" },
    data: { status: "DENIED" },
  });
}

export async function pollConnectRequest(state: string) {
  const record = await prisma.extensionConnectRequest.findUnique({
    where: { state },
    include: { user: true },
  });

  if (!record) return { status: "expired" as const };
  if (record.status === "PENDING" && record.expiresAt < new Date()) {
    return { status: "expired" as const };
  }
  if (record.status === "DENIED") return { status: "denied" as const };
  if (record.status === "PENDING") return { status: "pending" as const };

  // APPROVED: hand back the raw token exactly once, then clear it. The conditional update makes this
  // atomic: of two polls racing, only the one that actually cleared the token receives it.
  if (record.pendingToken) {
    const taken = await prisma.extensionConnectRequest.updateMany({
      where: { id: record.id, pendingToken: record.pendingToken },
      data: { pendingToken: null },
    });
    if (taken.count === 1) return { status: "approved" as const, token: record.pendingToken, email: record.user?.email };
  }
  return { status: "approved" as const, email: record.user?.email };
}

export async function listExtensionSessions(userId: string) {
  return prisma.extensionSession.findMany({
    where: { userId },
    orderBy: { lastSeenAt: "desc" },
  });
}

export async function revokeExtensionSession(userId: string, sessionId: string) {
  await prisma.extensionSession.deleteMany({ where: { id: sessionId, userId } });
}

/** The extension disconnecting itself: end the session its token belongs to. */
export async function revokeExtensionToken(token: string) {
  await prisma.extensionSession.deleteMany({ where: { tokenHash: hashToken(token) } });
}
