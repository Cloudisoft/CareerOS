import { NextRequest } from "next/server";
import { requireExtensionUser } from "@/lib/auth/extension";
import { discoverJobsForUser } from "@/lib/jobs/boards/discover";
import { rateLimit } from "@/lib/rate-limit";
import { extCatch, extError, extOk } from "@/lib/extension/response";

/** Fresh postings from public employer boards that fit this person, for the extension to queue. */
export async function GET(req: NextRequest) {
  try {
    const user = await requireExtensionUser(req);
    const limit = rateLimit(`ext-jobs:${user.id}`, 20, 60 * 60 * 1000);
    if (!limit.allowed) return extError("Job search is limited to 20 times an hour. Try again later.", 429);
    const result = await discoverJobsForUser(user.id);
    return extOk(result);
  } catch (error) {
    return extCatch(error);
  }
}
