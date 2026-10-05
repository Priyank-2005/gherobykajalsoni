import type { Db } from "@/lib/db";

/**
 * Give `userId` this phone number. Phone numbers are unique (the shop finds customers by
 * phone). If a phone-only shop customer (no email, so never signed in online) holds it, that
 * record is merged into this account so shop and online history show together.
 * Returns false when another online account already has the number.
 */
export async function claimPhone(db: Db, userId: string, phone: string) {
  const holder = await db.user.findUnique({ where: { phone }, select: { id: true, email: true, role: true } });
  if (holder && holder.id !== userId) {
    if (holder.email || holder.role !== "CUSTOMER") return false;
    await db.order.updateMany({ where: { userId: holder.id }, data: { userId } });
    await db.couponUsage.updateMany({ where: { userId: holder.id }, data: { userId } });
    await db.user.delete({ where: { id: holder.id } });
  }
  await db.user.update({ where: { id: userId }, data: { phone } });
  return true;
}
