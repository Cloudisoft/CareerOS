import { NextRequest } from "next/server";
import { requireExtensionUser } from "@/lib/auth/extension";
import { extCatch, extOk } from "@/lib/extension/response";

export async function GET(req: NextRequest) {
  try {
    const user = await requireExtensionUser(req);
    return extOk({ email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role });
  } catch (error) {
    return extCatch(error);
  }
}
