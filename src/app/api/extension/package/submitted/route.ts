import { NextRequest } from "next/server";
import { requireExtensionUser } from "@/lib/auth/extension";
import { extensionPackageSubmittedSchema } from "@/lib/validations/autoapply";
import { extCatch, extOk } from "@/lib/extension/response";

/** Reserved for when tailored packages exist to mark; a no-op today since /package never issues one. */
export async function POST(req: NextRequest) {
  try {
    await requireExtensionUser(req);
    extensionPackageSubmittedSchema.parse(await req.json());
    return extOk({ ok: true });
  } catch (error) {
    return extCatch(error);
  }
}
