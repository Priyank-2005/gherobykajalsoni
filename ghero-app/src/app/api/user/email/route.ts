import { handle, ok, parseBody } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { requestEmailChangeSchema } from "@/lib/validations/user";
import { requestEmailChange } from "@/lib/services/user.service";

/** Step 1 of an email change: sends a code to the new address. */
export const POST = handle(async (request: Request) => {
  const { user } = await requireAuth();
  const { email } = await parseBody(request, requestEmailChangeSchema);
  return ok(await requestEmailChange(user.id, email));
});
