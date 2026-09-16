import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/crypto";

/**
 * One-time, secret-gated provisioning endpoint: creates a fixed batch of
 * candidate accounts with an active ELITE subscription, and promotes a
 * fixed user to PLATFORM_ADMIN. Exists only because this project's sandbox
 * has no outbound network access to the production database — Railway's
 * runtime does, so the mutation happens here instead of a local script.
 *
 * Gated by PROVISION_SETUP_TOKEN (a random value, not real credentials)
 * rather than session auth, since it's meant to be hit once via a plain
 * link. Remove this route once it has been run successfully — it has no
 * reason to keep existing after that, and re-running it is a no-op for
 * accounts that already exist but would still re-arm their subscription.
 */

const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;

const NEW_ELITE_ACCOUNTS = [
  { email: "meghanaprakash1196@gmail.com", firstName: "Meghana", lastName: "Prakash" },
  { email: "abosedeoakanbi@gmail.com", firstName: "Abosede", lastName: "Oakanbi" },
  { email: "mushamganesh.gm@gmail.com", firstName: "Musham", lastName: "Ganesh" },
  { email: "anjumk1018@gmail.com", firstName: "Anjum", lastName: "K" },
];

const NEW_ADMIN_EMAIL = "fakhruddin@snyderstaffing.com";

export async function GET(req: NextRequest) {
  const expected = process.env.PROVISION_SETUP_TOKEN;
  const provided = req.nextUrl.searchParams.get("token");
  if (!expected || !provided || provided !== expected) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Read from an env var rather than a literal so the password never
  // appears in source/git history — set once in Railway, cleared after use.
  const newAccountPassword = process.env.PROVISION_NEW_ACCOUNT_PASSWORD;
  if (!newAccountPassword) {
    return NextResponse.json({ error: "PROVISION_NEW_ACCOUNT_PASSWORD is not set" }, { status: 500 });
  }

  const results: Record<string, string> = {};
  const errors: Record<string, string> = {};

  const passwordHash = await hashPassword(newAccountPassword);
  const currentPeriodEnd = new Date(Date.now() + SIX_MONTHS_MS);

  for (const account of NEW_ELITE_ACCOUNTS) {
    try {
      const user = await prisma.user.upsert({
        where: { email: account.email },
        create: {
          email: account.email,
          passwordHash,
          firstName: account.firstName,
          lastName: account.lastName,
          role: "CANDIDATE",
          emailVerified: new Date(),
          candidateProfile: { create: {} },
        },
        update: {},
      });

      await prisma.subscription.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          plan: "ELITE",
          status: "ACTIVE",
          currentPeriodEnd,
        },
        update: {
          plan: "ELITE",
          status: "ACTIVE",
          currentPeriodEnd,
          cancelAtPeriodEnd: false,
        },
      });

      results[account.email] = "ok";
    } catch (error) {
      errors[account.email] = error instanceof Error ? error.message : "Unknown error";
    }
  }

  try {
    const admin = await prisma.user.update({
      where: { email: NEW_ADMIN_EMAIL },
      data: { role: "PLATFORM_ADMIN" },
    });
    results[NEW_ADMIN_EMAIL] = `promoted (id ${admin.id})`;
  } catch (error) {
    errors[NEW_ADMIN_EMAIL] = error instanceof Error ? error.message : "Unknown error";
  }

  return NextResponse.json({
    eliteExpiresAt: currentPeriodEnd.toISOString(),
    results,
    errors: Object.keys(errors).length ? errors : undefined,
  });
}
