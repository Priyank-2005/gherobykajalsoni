import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { unauthorized } from "@/lib/api";

// Compared against when the email doesn't exist, so response time doesn't reveal
// which emails are admin accounts.
const DUMMY_HASH = "$2b$12$VUqyUp7pYPw.W4yx2ANqaOmEN4KzxQzgKleAT47T.dVB.wTg6f7DG"; // hash of a random, discarded value

/** Email + password sign-in for ADMIN accounts only. Same error for every failure. */
export async function verifyAdminCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, phone: true, role: true, passwordHash: true },
  });
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok || user.role !== "ADMIN" || !user.passwordHash) {
    throw unauthorized("Incorrect email or password");
  }
  return { id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role };
}
