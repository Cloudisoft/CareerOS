import "server-only";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword, generateToken, hashToken } from "@/lib/auth/crypto";
import { sendEmail, emailVerificationEmail } from "@/lib/email";
import type { SignupInput, LoginInput } from "@/lib/validations/auth";
import type { User } from "@prisma/client";

export class AppAuthError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;

export async function signupUser(input: SignupInput): Promise<User> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AppAuthError("An account with this email already exists.", "EMAIL_TAKEN");
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      phone: input.phone || null,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.accountType,
      ...(input.accountType === "CANDIDATE"
        ? { candidateProfile: { create: {} } }
        : { employerProfile: { create: {} } }),
    },
  });

  await issueVerificationEmail(user);

  return user;
}

export async function issueVerificationEmail(user: User) {
  const token = generateToken();
  await prisma.verificationToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
    },
  });

  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/verify-email?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: "Verify your Career OS account",
    html: emailVerificationEmail(user.firstName, verifyUrl),
    text: `Verify your email: ${verifyUrl}`,
  });
}

export async function verifyEmailToken(token: string): Promise<User> {
  const record = await prisma.verificationToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw new AppAuthError("This verification link is invalid or has expired.", "INVALID_TOKEN");
  }

  await prisma.$transaction([
    prisma.verificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.user.update({ where: { id: record.userId }, data: { emailVerified: new Date() } }),
  ]);

  return record.user;
}

export async function authenticateUser(input: LoginInput): Promise<User> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new AppAuthError("Invalid email or password.", "INVALID_CREDENTIALS");
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    throw new AppAuthError("Invalid email or password.", "INVALID_CREDENTIALS");
  }

  if (user.status !== "ACTIVE") {
    throw new AppAuthError("This account is not active. Contact support.", "ACCOUNT_INACTIVE");
  }

  return user;
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  // Always behave the same whether the user exists, to avoid leaking which emails are registered.
  if (!user) return;

  const token = generateToken();
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + RESET_TTL_MS),
    },
  });

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/reset-password?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: "Reset your Career OS password",
    html: `<div style="font-family:sans-serif"><p>Reset your password:</p><a href="${resetUrl}">${resetUrl}</a><p>This link expires in 1 hour.</p></div>`,
    text: `Reset your password: ${resetUrl} (expires in 1 hour)`,
  });
}

export async function resetPasswordWithToken(token: string, newPassword: string) {
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw new AppAuthError("This reset link is invalid or has expired.", "INVALID_TOKEN");
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    // Invalidate all existing sessions on password change.
    prisma.session.deleteMany({ where: { userId: record.userId } }),
  ]);
}
