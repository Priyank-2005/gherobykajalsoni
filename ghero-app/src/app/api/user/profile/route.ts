import { handle, ok, parseBody } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { updateProfileSchema } from "@/lib/validations/user";
import { getProfile, updateProfile } from "@/lib/services/user.service";

export const GET = handle(async () => {
  const { user } = await requireAuth();
  return ok({ profile: await getProfile(user.id) });
});

/** Name and phone only. Email changes use /api/user/email (OTP re-verification). */
export const PUT = handle(async (request: Request) => {
  const { user } = await requireAuth();
  const input = await parseBody(request, updateProfileSchema);
  return ok({ user: await updateProfile(user.id, input) });
});
