import { handle, ok, parseBody } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { ownerPinSchema } from "@/lib/validations/pos";
import { setOwnerPin } from "@/lib/services/staff.service";

/** The owner sets their own POS PIN (for quick unlock and approving discounts). */
export const PUT = handle(async (request: Request) => {
  const session = await requireAdmin();
  const { pin } = await parseBody(request, ownerPinSchema);
  await setOwnerPin(session.user.id, pin);
  return ok({ success: true });
});
