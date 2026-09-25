import { handle, ok, parseBody } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { addressSchema } from "@/lib/validations/address";
import { createAddress, listAddresses } from "@/lib/services/address.service";

export const GET = handle(async () => {
  const { user } = await requireAuth();
  return ok({ addresses: await listAddresses(user.id) });
});

export const POST = handle(async (request: Request) => {
  const { user } = await requireAuth();
  const input = await parseBody(request, addressSchema);
  return ok({ address: await createAddress(user.id, input) }, { status: 201 });
});
