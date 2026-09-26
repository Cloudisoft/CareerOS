import { NextRequest } from "next/server";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { apiCatch, apiOk } from "@/lib/api-response";
import {
  getSelectorOverrides,
  selectorOverridesSchema,
  setSelectorOverrides,
} from "@/lib/extension/selector-overrides";

/** Lets a platform admin read/patch the remote selector overrides the Chrome
 * extension polls (see src/app/api/extension/selectors). This is the
 * mechanism that keeps a DOM change on some ATS from needing a store
 * release — see extension/lib/ats.js's header comment. */

export async function GET() {
  try {
    const { user } = await requirePlatformAdmin();
    const { overrides, updatedAt } = await getSelectorOverrides();
    return apiOk({ overrides, updatedAt, updatedByYou: Boolean(user) });
  } catch (error) {
    return apiCatch(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { user } = await requirePlatformAdmin();
    const overrides = selectorOverridesSchema.parse(await req.json());
    const row = await setSelectorOverrides(overrides, user.email ?? user.id);
    return apiOk({ overrides: row.overrides, updatedAt: row.updatedAt });
  } catch (error) {
    return apiCatch(error);
  }
}
