import { handle, ok, parseBody } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { updateAddressSchema } from "@/lib/validations/address";
import { deleteAddress, updateAddress } from "@/lib/services/address.service";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = handle(async (request: Request, ctx: Ctx) => {
  const { user } = await requireAuth();
  const { id } = await ctx.params;
  const input = await parseBody(request, updateAddressSchema);
  return ok({ address: await updateAddress(user.id, id, input) });
});

export const DELETE = handle(async (_request: Request, ctx: Ctx) => {
  const { user } = await requireAuth();
  const { id } = await ctx.params;
  await deleteAddress(user.id, id);
  return ok({ success: true });
});
