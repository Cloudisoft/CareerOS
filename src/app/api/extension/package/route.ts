import { NextRequest } from "next/server";
import { requireExtensionUser } from "@/lib/auth/extension";
import { extCatch, extOk } from "@/lib/extension/response";

/**
 * Tailored, pre-approved application packages (a specific cover letter,
 * resume, and screening answers prepared for one posting) aren't built yet
 * — this always reports "no package", which the extension already treats
 * as the normal case: it falls back to filling forms from the base profile
 * returned by /sync rather than refusing to work.
 */
export async function GET(req: NextRequest) {
  try {
    await requireExtensionUser(req);
    return extOk({ tailored: false });
  } catch (error) {
    return extCatch(error);
  }
}
