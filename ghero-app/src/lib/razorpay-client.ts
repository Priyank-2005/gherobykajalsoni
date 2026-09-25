"use client";

/** Minimal typing for Razorpay Checkout (https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/). */
export type RazorpaySuccess = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: RazorpaySuccess) => void;
  modal?: { ondismiss?: () => void };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void; on: (event: string, cb: (r: unknown) => void) => void };
  }
}

let loader: Promise<void> | null = null;

function loadCheckout() {
  loader ??= new Promise<void>((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => {
      loader = null;
      reject(new Error("Couldn't load the payment window. Please check your connection."));
    };
    document.body.appendChild(s);
  });
  return loader;
}

export type PaymentOrder = {
  keyId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  orderNumber: string;
  prefill: { name: string; email: string; contact: string };
};

/**
 * Open Razorpay Checkout. Resolves with the success payload, or null if the customer
 * closed the window. The payload must still be verified server-side.
 */
export async function openRazorpay(order: PaymentOrder): Promise<RazorpaySuccess | null> {
  await loadCheckout();
  return new Promise((resolve) => {
    const rzp = new window.Razorpay!({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      order_id: order.razorpayOrderId,
      name: "Ghero by Kajal Soni",
      description: `Order ${order.orderNumber}`,
      prefill: order.prefill,
      theme: { color: "#722F37" },
      handler: (response) => resolve(response),
      modal: { ondismiss: () => resolve(null) },
    });
    rzp.open();
  });
}
