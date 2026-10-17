import { NextRequest } from "next/server";
import { requireExtensionUser } from "@/lib/auth/extension";
import { extCatch, extOk } from "@/lib/extension/response";
import { getSelectorOverrides } from "@/lib/extension/selector-overrides";

/**
 * Selector overrides the extension merges over its hardcoded ATS adapter
 * defaults (extension/lib/ats.js ADAPTERS) so a DOM change on some ATS can be
 * patched by an admin (see /api/admin/extension/selectors) without a store
 * release. The extension caches whatever this returns in chrome.storage.local
 * and always falls back to its hardcoded defaults on any failure here, so
 * this endpoint being down or slow never breaks a fill.
 */
export async function GET(req: NextRequest) {
  try {
    await requireExtensionUser(req);
    const { overrides, updatedAt } = await getSelectorOverrides();
    return extOk({ overrides, updatedAt: updatedAt ? updatedAt.toISOString() : null });
  } catch (error) {
    return extCatch(error);
  }
}
