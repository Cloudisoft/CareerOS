import { NextRequest } from "next/server";
import { z } from "zod";
import { requireRecruiter } from "@/lib/enterprise/account";
import { subscriptionCheckout } from "@/lib/enterprise/billing";
import { apiCatch, apiOk } from "@/lib/api-response";

const schema = z.object({ plan: z.enum(["STARTER", "PROFESSIONAL"]) });

/** What the browser needs to render the PayPal subscribe button. The plan id is chosen server-side (intro or regular). */
export async function GET(req: NextRequest) {
  try {
    const ctx = await requireRecruiter();
    const { plan } = schema.parse({ plan: req.nextUrl.searchParams.get("plan") });
    return apiOk(await subscriptionCheckout(ctx, plan));
  } catch (error) {
    return apiCatch(error);
  }
}
