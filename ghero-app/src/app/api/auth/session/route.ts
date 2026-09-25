import { handle, ok } from "@/lib/api";
import { getSession } from "@/lib/auth";

export const GET = handle(async () => {
  const session = await getSession();
  return ok(session ? { isAuthenticated: true, user: session.user } : { isAuthenticated: false, user: null });
});
