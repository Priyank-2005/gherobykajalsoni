import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { unauthorized } from "@/lib/api";

// Compared against when the email doesn't exist, so response time doesn't reveal which emails exist.
const DUMMY_HASH = "$2b$12$VUqyUp7pYPw.W4yx2ANqaOmEN4KzxQzgKleAT47T.dVB.wTg6f7DG";

/**
 * Email + password check for registering a POS device. Allowed: the owner (ADMIN) and active
 * managers who were given a password. Same error for every failure.
 */
export async function verifyDeviceCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, passwordHash: true, staffProfile: { select: { isActive: true } } },
  });
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  const allowed = user?.role === "ADMIN" || (user?.role === "MANAGER" && user.staffProfile?.isActive);
  if (!user || !ok || !user.passwordHash || !allowed) throw unauthorized("Incorrect email or password, or this account can't set up POS devices");
  return { id: user.id };
}
