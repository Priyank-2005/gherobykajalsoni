import { z } from "zod";
import { handle, ok, parseBody } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { verifyClientPayment } from "@/lib/services/payment.service";

// Field names match what Razorpay Checkout passes to its success handler.
const schema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export const POST = handle(async (request: Request) => {
  const { user } = await requireAuth();
  const body = await parseBody(request, schema);
  return ok(
    await verifyClientPayment(user.id, {
      razorpayOrderId: body.razorpay_order_id,
      razorpayPaymentId: body.razorpay_payment_id,
      razorpaySignature: body.razorpay_signature,
    })
  );
});
