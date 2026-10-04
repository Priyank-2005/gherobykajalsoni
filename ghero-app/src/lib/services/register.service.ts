import { prisma, type Db } from "@/lib/db";
import { badRequest, conflict } from "@/lib/api";
import { fromPaise, toNumber, toPaise } from "@/lib/money";

/**
 * The shop's cash drawer, one "day" at a time. Billing needs an open day. Closing compares
 * the cash that should be in the drawer (opening cash + cash taken on bills that weren't
 * cancelled) with the cash counted, and records any difference.
 */

// Serialises open/close so two devices can't open two days at once.
const REGISTER_LOCK = 4_242_001;

export async function getOpenRegister(db: Db = prisma) {
  return db.registerSession.findFirst({
    where: { closedAt: null },
    orderBy: { openedAt: "desc" },
    include: { openedBy: { select: { name: true, email: true } } },
  });
}

export async function openRegister(userId: string, openingCash: number) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${REGISTER_LOCK})`;
    if (await getOpenRegister(tx)) throw conflict("The day is already open", "REGISTER_OPEN");
    return tx.registerSession.create({ data: { openedById: userId, openingCash: fromPaise(toPaise(openingCash)) } });
  });
}

/** Totals for a register session (bills not cancelled). Money in rupees. */
export async function registerSummary(sessionId: string, db: Db = prisma) {
  const session = await db.registerSession.findUnique({ where: { id: sessionId } });
  if (!session) throw badRequest("Register session not found");
  const [payments, bills, cancelled] = await Promise.all([
    db.orderPayment.groupBy({
      by: ["method"],
      where: { order: { registerSessionId: sessionId, status: { not: "CANCELLED" } } },
      _sum: { amount: true },
      _count: true,
    }),
    db.order.aggregate({
      where: { registerSessionId: sessionId, status: { not: "CANCELLED" } },
      _count: true,
      _sum: { total: true, manualDiscount: true, couponDiscount: true },
    }),
    db.order.count({ where: { registerSessionId: sessionId, status: "CANCELLED" } }),
  ]);
  const byMethod = (m: "CASH" | "UPI" | "CARD") => toNumber(payments.find((p) => p.method === m)?._sum.amount);
  const cash = byMethod("CASH");
  const openingCash = toNumber(session.openingCash);
  return {
    id: session.id,
    openedAt: session.openedAt.toISOString(),
    closedAt: session.closedAt?.toISOString() ?? null,
    openingCash,
    billCount: bills._count,
    cancelledCount: cancelled,
    sales: toNumber(bills._sum.total),
    discounts: toNumber(bills._sum.manualDiscount) + toNumber(bills._sum.couponDiscount),
    cash,
    upi: byMethod("UPI"),
    card: byMethod("CARD"),
    expectedCash: fromPaise(toPaise(openingCash) + toPaise(cash)),
    countedCash: session.countedCash === null ? null : toNumber(session.countedCash),
    difference: session.difference === null ? null : toNumber(session.difference),
    note: session.note,
  };
}

export async function closeRegister(userId: string, countedCash: number, note?: string | null) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${REGISTER_LOCK})`;
    const open = await getOpenRegister(tx);
    if (!open) throw conflict("The day isn't open", "REGISTER_CLOSED");
    const summary = await registerSummary(open.id, tx);
    const difference = fromPaise(toPaise(countedCash) - toPaise(summary.expectedCash));
    if (difference !== 0 && !note?.trim()) throw badRequest("The counted cash doesn't match. Add a note explaining the difference.", "NOTE_REQUIRED");
    await tx.registerSession.update({
      where: { id: open.id },
      data: { closedAt: new Date(), closedById: userId, expectedCash: summary.expectedCash, countedCash: fromPaise(toPaise(countedCash)), difference, note: note?.trim() || null },
    });
    return { ...summary, closedAt: new Date().toISOString(), countedCash, difference, note: note?.trim() || null };
  });
}

/** Recent days (closed and open) for the register screen / admin. */
export async function listRegisterSessions(take = 10) {
  const rows = await prisma.registerSession.findMany({
    orderBy: { openedAt: "desc" },
    take,
    include: { openedBy: { select: { name: true } }, closedBy: { select: { name: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    openedAt: r.openedAt.toISOString(),
    closedAt: r.closedAt?.toISOString() ?? null,
    openedBy: r.openedBy.name,
    closedBy: r.closedBy?.name ?? null,
    openingCash: toNumber(r.openingCash),
    expectedCash: r.expectedCash === null ? null : toNumber(r.expectedCash),
    countedCash: r.countedCash === null ? null : toNumber(r.countedCash),
    difference: r.difference === null ? null : toNumber(r.difference),
    note: r.note,
  }));
}
