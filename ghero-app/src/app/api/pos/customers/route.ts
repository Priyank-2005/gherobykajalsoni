import { badRequest, ok } from "@/lib/api";
import { posRoute } from "@/lib/pos-api";
import { addressSchema } from "@/lib/validations/address";
import { findCustomerByPhone } from "@/lib/services/pos-customer.service";

/** Look up a customer by mobile number (shop + online history). */
export const GET = posRoute("CASHIER", async (_session, request: Request) => {
  const parsed = addressSchema.shape.phone.safeParse(new URL(request.url).searchParams.get("phone") ?? "");
  if (!parsed.success) throw badRequest("Enter a valid 10-digit mobile number");
  return ok({ customer: await findCustomerByPhone(parsed.data) });
});
