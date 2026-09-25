import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { handleWebhookEvent } from "@/lib/services/payment.service";

/**
 * Razorpay webhook (configure in Dashboard -> Webhooks with RAZORPAY_WEBHOOK_SECRET).
 * Events: payment.captured, order.paid, payment.failed. Processing is idempotent, so
 * Razorpay's at-least-once retries are safe. A non-2xx response makes Razorpay retry,
 * so errors are only returned for failures worth retrying.
 */
export async function POST(request: Request) {
  const rawBody = await request.text(); // the signature covers the exact raw bytes
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: Parameters<typeof handleWebhookEvent>[0];
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const result = await handleWebhookEvent(event);
    return NextResponse.json({ received: true, ...result });
  } catch (error) {
    console.error("[webhook] processing failed:", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
