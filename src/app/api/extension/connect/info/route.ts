import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { describeConnectRequest } from "@/lib/extension/service";
import { apiCatch, apiError, apiOk } from "@/lib/api-response";

/** For the approval page: which browser is asking, and the code its extension is showing. */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return apiError("Not authenticated", 401, "UNAUTHENTICATED");
    const state = req.nextUrl.searchParams.get("state") ?? "";
    if (state.length < 16 || state.length > 200) return apiError("Missing connection request", 422, "VALIDATION_ERROR");
    const info = await describeConnectRequest(state);
    if (!info) return apiError("This connection request doesn't exist.", 404, "NOT_FOUND");
    return apiOk(info);
  } catch (error) {
    return apiCatch(error);
  }
}
