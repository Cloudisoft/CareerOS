import { NextRequest, NextResponse } from "next/server";
import { isPayPalConfigured } from "@/lib/paypal/client";
import { verifyPayPalWebhookSignature, handlePayPalWebhookEvent, type PayPalWebhookEvent } from "@/lib/paypal/webhook";

export async function POST(req: NextRequest) {
  if (!isPayPalConfigured() || !process.env.PAYPAL_WEBHOOK_ID) {
    return NextResponse.json({ error: "Billing is not configured." }, { status: 503 });
  }

  const authAlgo = req.headers.get("paypal-auth-algo");
  const certUrl = req.headers.get("paypal-cert-url");
  const transmissionId = req.headers.get("paypal-transmission-id");
  const transmissionSig = req.headers.get("paypal-transmission-sig");
  const transmissionTime = req.headers.get("paypal-transmission-time");
  if (!authAlgo || !certUrl || !transmissionId || !transmissionSig || !transmissionTime) {
    return NextResponse.json({ error: "Missing PayPal webhook headers." }, { status: 400 });
  }

  const rawBody = await req.text();

  let verified: boolean;
  try {
    verified = await verifyPayPalWebhookSignature(
      { authAlgo, certUrl, transmissionId, transmissionSig, transmissionTime },
      rawBody
    );
  } catch (err) {
    console.error("PayPal webhook signature verification request failed:", err);
    return NextResponse.json({ error: "Signature verification failed." }, { status: 400 });
  }
  if (!verified) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    const event = JSON.parse(rawBody) as PayPalWebhookEvent;
    await handlePayPalWebhookEvent(event);
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("PayPal webhook handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }
}
