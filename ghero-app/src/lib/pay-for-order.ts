"use client";

import { api } from "./api-client";
import { openRazorpay, type PaymentOrder } from "./razorpay-client";

export type PayResult = "paid" | "processing" | "cancelled";

/**
 * Pay for an existing PENDING_PAYMENT order: create/reuse the Razorpay order, open Checkout,
 * then have the server verify it. Throws ApiError (e.g. 503 when payments aren't configured).
 */
export async function payForOrder(orderId: string): Promise<PayResult> {
  const paymentOrder = await api<PaymentOrder>("/api/payment/create-order", { body: { orderId } });
  const success = await openRazorpay(paymentOrder);
  if (!success) return "cancelled";
  const verified = await api<{ status: "PAID" | "PROCESSING_PAYMENT" }>("/api/payment/verify", { body: success });
  return verified.status === "PAID" ? "paid" : "processing";
}
