import crypto from "crypto";
import Razorpay from "razorpay";

/** True when real (non-placeholder) Razorpay keys are configured. */
export function isRazorpayConfigured() {
  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
  return Boolean(
    RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET && !RAZORPAY_KEY_ID.includes("xxxx") && !RAZORPAY_KEY_SECRET.startsWith("your-")
  );
}

let client: Razorpay | null = null;

/**
 * Lazily-created Razorpay client, so importing this module never throws when keys are
 * missing (e.g. during build or before payments are set up).
 */
export function getRazorpay(): Razorpay {
  if (!isRazorpayConfigured()) throw new Error("Razorpay is not configured");
  client ??= new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
  return client;
}

function hmacHex(secret: string, payload: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/** Constant-time comparison of two hex signatures. */
function safeEqualHex(a: string, b: string) {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Verify the checkout handler signature: HMAC-SHA256(order_id + "|" + payment_id, key_secret).
 */
export function verifyPaymentSignature({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  return safeEqualHex(hmacHex(secret, `${razorpayOrderId}|${razorpayPaymentId}`), razorpaySignature);
}

/** Verify a webhook: HMAC-SHA256(raw body, webhook secret) === X-Razorpay-Signature. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || secret.startsWith("your-")) return false;
  return safeEqualHex(hmacHex(secret, rawBody), signature);
}
