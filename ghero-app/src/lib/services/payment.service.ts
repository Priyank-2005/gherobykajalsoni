import { prisma } from "@/lib/db";
import { AppError, badRequest, notFound } from "@/lib/api";
import { getRazorpay, isRazorpayConfigured, verifyPaymentSignature } from "@/lib/razorpay";
import { toPaise } from "@/lib/money";
import { commitStockForOrder } from "./inventory.service";
import { notifyOrderEvent } from "./notification.service";

/**
 * Razorpay payment flow:
 *   1. createPaymentOrder  - server creates a Razorpay order for our PENDING_PAYMENT order
 *   2. client opens Razorpay Checkout with that id
 *   3. verifyClientPayment - handler signature check + server-side fetch of the payment
 *   4. webhook             - payment.captured / order.paid / payment.failed (source of truth)
 * Steps 3 and 4 both call finalizeCapturedPayment, which is idempotent: whichever arrives
 * first wins; replays are no-ops. The client's "success" callback is never trusted alone.
 */

function assertConfigured() {
  if (!isRazorpayConfigured()) {
    throw new AppError(503, "Online payments are not available right now. Please try again shortly.", "PAYMENTS_DISABLED");
  }
}

export async function createPaymentOrder(userId: string, orderId: string) {
  assertConfigured();
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { payment: true, items: { include: { variant: { select: { stock: true, isAvailable: true } } } } },
  });
  if (!order) throw notFound("Order not found");
  if (order.status !== "PENDING_PAYMENT") throw badRequest("This order has already been paid or closed", "ORDER_NOT_PAYABLE");

  // Fail fast if stock ran out since the order was placed (still re-checked atomically at capture).
  const short = order.items.find((i) => !i.variant || !i.variant.isAvailable || i.variant.stock < i.quantity);
  if (short) throw badRequest(`Sorry, ${short.productName} just sold out. Please update your bag.`, "OUT_OF_STOCK");

  const amount = toPaise(order.total);
  const keyId = process.env.RAZORPAY_KEY_ID!;
  const prefill = { name: order.shippingName, email: order.shippingEmail, contact: order.shippingPhone };

  // Reuse an open Razorpay order (retries after closing the modal) unless the amount changed or it failed.
  if (order.payment && order.payment.status === "PENDING" && toPaise(order.payment.amount) === amount) {
    return { keyId, razorpayOrderId: order.payment.razorpayOrderId, amount, currency: "INR", orderNumber: order.orderNumber, prefill };
  }

  const rzpOrder = await getRazorpay().orders.create({
    amount,
    currency: "INR",
    receipt: order.orderNumber,
    notes: { orderId: order.id, orderNumber: order.orderNumber },
  });

  await prisma.payment.upsert({
    where: { orderId: order.id },
    update: { razorpayOrderId: rzpOrder.id, razorpayPaymentId: null, razorpaySignature: null, amount: order.total, status: "PENDING" },
    create: { orderId: order.id, razorpayOrderId: rzpOrder.id, amount: order.total, currency: "INR" },
  });

  return { keyId, razorpayOrderId: rzpOrder.id, amount, currency: "INR", orderNumber: order.orderNumber, prefill };
}

/**
 * Mark a payment captured and confirm the order, exactly once.
 * The PENDING -> CAPTURED flip is a conditional update inside the transaction, so
 * concurrent verify + webhook calls can't both proceed.
 */
export async function finalizeCapturedPayment(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  amountPaise: number;
  signature?: string;
}) {
  const payment = await prisma.payment.findUnique({
    where: { razorpayOrderId: params.razorpayOrderId },
    include: { order: true },
  });
  if (!payment) throw notFound("Payment not found");
  if (payment.status === "CAPTURED") return { orderId: payment.orderId, alreadyProcessed: true };

  const order = payment.order;
  const amountMatches = params.amountPaise === toPaise(order.total);

  const result = await prisma.$transaction(async (tx) => {
    const flipped = await tx.payment.updateMany({
      where: { id: payment.id, status: { in: ["PENDING", "FAILED"] } },
      data: {
        status: "CAPTURED",
        razorpayPaymentId: params.razorpayPaymentId,
        razorpaySignature: params.signature ?? payment.razorpaySignature,
      },
    });
    if (flipped.count === 0) return { confirmed: false, alreadyProcessed: true };

    if (!amountMatches) {
      // Money arrived but not the amount we asked for: keep the order pending for manual review/refund.
      await tx.order.update({
        where: { id: order.id },
        data: { notes: `AMOUNT_MISMATCH: expected ${toPaise(order.total)} paise, captured ${params.amountPaise} paise. Review and refund.` },
      });
      return { confirmed: false, alreadyProcessed: false };
    }

    // Stock: all-or-nothing conditional decrement. If it can't be fulfilled the customer has
    // still paid, so the order is marked PAID with a note for the admin to refund/cancel.
    let stockCommitted = false;
    try {
      await tx.$executeRaw`SAVEPOINT stock_commit`;
      await commitStockForOrder(tx, order.id);
      stockCommitted = true;
    } catch (error) {
      await tx.$executeRaw`ROLLBACK TO SAVEPOINT stock_commit`;
      if (!(error instanceof AppError)) throw error;
    }

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        stockCommitted,
        ...(stockCommitted ? {} : { notes: "STOCK_CONFLICT: paid but one or more items were out of stock. Refund or restock." }),
      },
    });

    if (order.couponId) {
      await tx.couponUsage.upsert({
        where: { couponId_userId_orderId: { couponId: order.couponId, userId: order.userId, orderId: order.id } },
        update: {},
        create: { couponId: order.couponId, userId: order.userId, orderId: order.id },
      });
    }

    // Clear the purchased lines from the customer's bag (keeps anything added since).
    const cart = await tx.cart.findUnique({ where: { userId: order.userId }, select: { id: true } });
    if (cart) {
      const purchased = await tx.orderItem.findMany({ where: { orderId: order.id }, select: { variantId: true } });
      const variantIds = purchased.map((p) => p.variantId).filter((id): id is string => Boolean(id));
      await tx.cartItem.deleteMany({ where: { cartId: cart.id, variantId: { in: variantIds } } });
      await tx.cart.update({ where: { id: cart.id }, data: { couponId: null } });
    }
    return { confirmed: true, alreadyProcessed: false };
  });

  if (result.confirmed) await notifyOrderEvent("ORDER_CONFIRMATION", order.id);
  return { orderId: order.id, alreadyProcessed: result.alreadyProcessed };
}

/**
 * Client-side success callback. Signature proves the ids came from Razorpay; we then fetch
 * the payment server-side to confirm it is actually captured and for how much.
 */
export async function verifyClientPayment(
  userId: string,
  input: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }
) {
  assertConfigured();
  const payment = await prisma.payment.findUnique({
    where: { razorpayOrderId: input.razorpayOrderId },
    include: { order: { select: { userId: true, id: true } } },
  });
  if (!payment || payment.order.userId !== userId) throw notFound("Payment not found");
  if (!verifyPaymentSignature(input)) throw badRequest("Payment verification failed", "BAD_SIGNATURE");

  const rzpPayment = await getRazorpay().payments.fetch(input.razorpayPaymentId);
  if (rzpPayment.order_id !== input.razorpayOrderId) throw badRequest("Payment does not match this order", "PAYMENT_MISMATCH");

  if (rzpPayment.status === "captured") {
    await finalizeCapturedPayment({
      razorpayOrderId: input.razorpayOrderId,
      razorpayPaymentId: input.razorpayPaymentId,
      amountPaise: Number(rzpPayment.amount),
      signature: input.razorpaySignature,
    });
    return { orderId: payment.order.id, status: "PAID" as const };
  }
  // "authorized": capture pending on Razorpay's side; the webhook will confirm it.
  return { orderId: payment.order.id, status: "PROCESSING_PAYMENT" as const };
}

export async function markPaymentFailed(razorpayOrderId: string, reason?: string) {
  await prisma.payment.updateMany({
    where: { razorpayOrderId, status: "PENDING" },
    data: { status: "FAILED" },
  });
  if (reason) console.warn(`[payment] ${razorpayOrderId} failed: ${reason}`);
}

type WebhookPayment = { id: string; order_id: string; amount: number; status: string; error_description?: string };

/** Handle a verified webhook event. Unknown events are acknowledged and ignored. */
export async function handleWebhookEvent(event: { event: string; payload?: { payment?: { entity?: WebhookPayment } } }) {
  const entity = event.payload?.payment?.entity;
  if (!entity?.order_id) return { handled: false };

  const known = await prisma.payment.findUnique({ where: { razorpayOrderId: entity.order_id }, select: { id: true } });
  if (!known) return { handled: false }; // not one of ours (or from another environment)

  switch (event.event) {
    case "payment.captured":
    case "order.paid":
      await finalizeCapturedPayment({
        razorpayOrderId: entity.order_id,
        razorpayPaymentId: entity.id,
        amountPaise: Number(entity.amount),
      });
      return { handled: true };
    case "payment.failed":
      await markPaymentFailed(entity.order_id, entity.error_description);
      return { handled: true };
    default:
      return { handled: false };
  }
}
