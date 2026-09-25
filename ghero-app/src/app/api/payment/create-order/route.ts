import { z } from "zod";
import { handle, ok, parseBody } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { createPaymentOrder } from "@/lib/services/payment.service";

const schema = z.object({ orderId: z.string().min(1) });

export const POST = handle(async (request: Request) => {
  const { user } = await requireAuth();
  const { orderId } = await parseBody(request, schema);
  return ok(await createPaymentOrder(user.id, orderId));
});
