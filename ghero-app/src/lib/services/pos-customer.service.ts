import { prisma, type Db } from "@/lib/db";
import { toNumber } from "@/lib/money";
import { PAID_STATUSES } from "./user.service";

/**
 * Shop customers are found by mobile number. One User per phone/email across the shop and the
 * website: a shop customer who later signs up online with the same phone is merged
 * (see user.service updateProfile), so both histories show together.
 */

export async function findCustomerByPhone(phone: string) {
  const user = await prisma.user.findUnique({
    where: { phone },
    select: { id: true, name: true, email: true, phone: true, createdAt: true },
  });
  if (!user) return null;
  const [paid, recent] = await Promise.all([
    prisma.order.groupBy({
      by: ["channel"],
      where: { userId: user.id, status: { in: [...PAID_STATUSES] } },
      _count: true,
      _sum: { total: true },
      _max: { createdAt: true },
    }),
    prisma.order.findMany({
      where: { userId: user.id, status: { in: [...PAID_STATUSES] } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, orderNumber: true, channel: true, total: true, createdAt: true, items: { select: { productName: true, quantity: true } } },
    }),
  ]);
  const by = (c: "ONLINE" | "POS") => paid.find((p) => p.channel === c);
  const last = paid.map((p) => p._max.createdAt).filter((d): d is Date => Boolean(d)).sort((a, b) => b.getTime() - a.getTime())[0];
  return {
    ...user,
    createdAt: user.createdAt.toISOString(),
    shopOrders: by("POS")?._count ?? 0,
    onlineOrders: by("ONLINE")?._count ?? 0,
    totalSpent: paid.reduce((s, p) => s + toNumber(p._sum.total), 0),
    lastPurchaseAt: last?.toISOString() ?? null,
    recent: recent.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      channel: o.channel,
      total: toNumber(o.total),
      createdAt: o.createdAt.toISOString(),
      items: o.items.map((i) => `${i.productName}${i.quantity > 1 ? ` × ${i.quantity}` : ""}`).join(", "),
    })),
  };
}

/**
 * Find or create the customer for a shop bill. Matching: phone first, then email.
 * Missing name / email / phone are filled in, but existing details are never overwritten.
 */
export async function upsertPosCustomer(db: Db, input: { phone: string; name?: string | null; email?: string | null }) {
  const name = input.name?.trim() || null;
  const email = input.email?.trim().toLowerCase() || null;
  const select = { id: true, name: true, email: true, phone: true } as const;

  let user = await db.user.findUnique({ where: { phone: input.phone }, select });
  if (!user && email) {
    const byEmail = await db.user.findUnique({ where: { email }, select });
    if (byEmail) {
      user = byEmail.phone ? byEmail : await db.user.update({ where: { id: byEmail.id }, data: { phone: input.phone }, select });
    }
  }
  if (!user) return db.user.create({ data: { phone: input.phone, name, email }, select });

  const patch: { name?: string; email?: string } = {};
  if (!user.name && name) patch.name = name;
  if (!user.email && email && !(await db.user.findUnique({ where: { email }, select: { id: true } }))) patch.email = email;
  return Object.keys(patch).length ? db.user.update({ where: { id: user.id }, data: patch, select }) : user;
}
