import { handle, ok, parseBody } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { confirmEmailChangeSchema } from "@/lib/validations/user";
import { confirmEmailChange } from "@/lib/services/user.service";

/** Step 2 of an email change: verify the code sent to the new address. */
export const POST = handle(async (request: Request) => {
  const { user } = await requireAuth();
  const { email, otp } = await parseBody(request, confirmEmailChangeSchema);
  return ok({ user: await confirmEmailChange(user.id, email, otp) });
});
