import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { toNumber } from "@/lib/money";
import { istDate, istRange } from "@/lib/ist";
import { PAID_STATUSES } from "./user.service";

/**
 * Sales reports for Admin -> Reports, over an inclusive range of IST days. "Sales" are orders
 * that were paid and not cancelled: online PAID → DELIVERED, shop bills (DELIVERED).
 * Prices include taxes; item revenue is after line discounts (bill-level discounts are shown
 * separately).
 */

const paid = Prisma.join(PAID_STATUSES.map((s) => Prisma.sql`${s}::"OrderStatus"`));

export async function salesReport(from: string, to: string) {
  const { start, end } = istRange(from, to);
  const inRange = { createdAt: { gte: start, lt: end } };
  const paidWhere = { ...inRange, status: { in: [...PAID_STATUSES] } };

  const [byChannel, daily, posPayments, onlinePaid, categories, staff, products, cancelled, slow, stockValue] = await Promise.all([
    prisma.order.groupBy({
      by: ["channel"],
      where: paidWhere,
      _count: true,
      _sum: { total: true, couponDiscount: true, manualDiscount: true, discount: true },
    }),
    prisma.$queryRaw<{ day: string; channel: "ONLINE" | "POS"; total: Prisma.Decimal; orders: number }[]>`
      SELECT to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') AS day,
             channel, SUM(total) AS total, COUNT(*)::int AS orders
      FROM "Order"
      WHERE "createdAt" >= ${start} AND "createdAt" < ${end} AND status IN (${paid})
      GROUP BY 1, 2 ORDER BY 1`,
    prisma.orderPayment.groupBy({ by: ["method"], where: { order: { ...paidWhere, channel: "POS" } }, _sum: { amount: true }, _count: true }),
    prisma.order.aggregate({ where: { ...paidWhere, channel: "ONLINE" }, _sum: { total: true }, _count: true }),
    prisma.$queryRaw<{ category: string | null; subcategory: string | null; qty: number; revenue: Prisma.Decimal }[]>`
      SELECT c.name AS category, s.name AS subcategory, SUM(oi.quantity)::int AS qty,
             SUM(oi."unitPrice" * oi.quantity - oi."lineDiscount") AS revenue
      FROM "OrderItem" oi
      JOIN "Order" o ON o.id = oi."orderId"
      LEFT JOIN "Product" p ON p.id = oi."productId"
      LEFT JOIN "Category" c ON c.id = p."categoryId"
      LEFT JOIN "Subcategory" s ON s.id = p."subcategoryId"
      WHERE o."createdAt" >= ${start} AND o."createdAt" < ${end} AND o.status IN (${paid})
      GROUP BY 1, 2 ORDER BY revenue DESC`,
    prisma.order.groupBy({ by: ["cashierId"], where: { ...paidWhere, channel: "POS" }, _count: true, _sum: { total: true, manualDiscount: true } }),
    prisma.$queryRaw<{ name: string; qty: number; revenue: Prisma.Decimal; shop: number; online: number }[]>`
      SELECT oi."productName" AS name, SUM(oi.quantity)::int AS qty,
             SUM(oi."unitPrice" * oi.quantity - oi."lineDiscount") AS revenue,
             SUM(CASE WHEN o.channel = 'POS' THEN oi.quantity ELSE 0 END)::int AS shop,
             SUM(CASE WHEN o.channel = 'ONLINE' THEN oi.quantity ELSE 0 END)::int AS online
      FROM "OrderItem" oi JOIN "Order" o ON o.id = oi."orderId"
      WHERE o."createdAt" >= ${start} AND o."createdAt" < ${end} AND o.status IN (${paid})
      GROUP BY 1 ORDER BY qty DESC, revenue DESC LIMIT 15`,
    prisma.order.groupBy({ by: ["channel"], where: { ...inRange, status: "CANCELLED" }, _count: true, _sum: { total: true } }),
    // In stock but not sold in the range: what's sitting on the shelf.
    prisma.$queryRaw<{ id: string; productId: string; name: string; size: string | null; color: string | null; stock: number; value: Prisma.Decimal; lastSold: Date | null }[]>`
      SELECT v.id, v."productId", p.name, v.size, v.color, v.stock, v.price * v.stock AS value,
             (SELECT MAX(o."createdAt") FROM "OrderItem" oi JOIN "Order" o ON o.id = oi."orderId"
              WHERE oi."variantId" = v.id AND o.status IN (${paid})) AS "lastSold"
      FROM "ProductVariant" v JOIN "Product" p ON p.id = v."productId"
      WHERE v.stock > 0 AND NOT EXISTS (
        SELECT 1 FROM "OrderItem" oi JOIN "Order" o ON o.id = oi."orderId"
        WHERE oi."variantId" = v.id AND o."createdAt" >= ${start} AND o."createdAt" < ${end} AND o.status IN (${paid}))
      ORDER BY value DESC LIMIT 20`,
    prisma.$queryRaw<{ units: number; value: Prisma.Decimal; mrpValue: Prisma.Decimal }[]>`
      SELECT COALESCE(SUM(stock), 0)::int AS units, COALESCE(SUM(price * stock), 0) AS value, COALESCE(SUM(mrp * stock), 0) AS "mrpValue"
      FROM "ProductVariant" WHERE stock > 0`,
  ]);

  const cashierIds = staff.map((s) => s.cashierId).filter((id): id is string => Boolean(id));
  const names = cashierIds.length ? await prisma.user.findMany({ where: { id: { in: cashierIds } }, select: { id: true, name: true, email: true } }) : [];
  const nameOf = new Map(names.map((n) => [n.id, n.name ?? n.email ?? "Staff"]));

  const channel = (c: "ONLINE" | "POS") => byChannel.find((r) => r.channel === c);
  const sum = (c: "ONLINE" | "POS") => toNumber(channel(c)?._sum.total);
  const count = (c: "ONLINE" | "POS") => channel(c)?._count ?? 0;

  // One row per day in the range (days with no sales show 0).
  const days: { day: string; online: number; shop: number; orders: number }[] = [];
  for (let t = start.getTime(); t < end.getTime(); t += 86_400_000) days.push({ day: istDate(new Date(t)), online: 0, shop: 0, orders: 0 });
  for (const d of daily) {
    const row = days.find((x) => x.day === d.day);
    if (!row) continue;
    if (d.channel === "POS") row.shop += toNumber(d.total);
    else row.online += toNumber(d.total);
    row.orders += d.orders;
  }

  const pay = (m: "CASH" | "UPI" | "CARD") => toNumber(posPayments.find((p) => p.method === m)?._sum.amount);
  return {
    from,
    to,
    totals: {
      sales: sum("ONLINE") + sum("POS"),
      orders: count("ONLINE") + count("POS"),
      online: { sales: sum("ONLINE"), orders: count("ONLINE") },
      shop: { sales: sum("POS"), bills: count("POS") },
      couponDiscounts: toNumber(channel("ONLINE")?._sum.couponDiscount) + toNumber(channel("POS")?._sum.couponDiscount),
      shopDiscounts: toNumber(channel("POS")?._sum.manualDiscount),
      mrpSavings: toNumber(channel("ONLINE")?._sum.discount) + toNumber(channel("POS")?._sum.discount),
      cancelled: {
        online: cancelled.find((c) => c.channel === "ONLINE")?._count ?? 0,
        shop: cancelled.find((c) => c.channel === "POS")?._count ?? 0,
        shopAmount: toNumber(cancelled.find((c) => c.channel === "POS")?._sum.total),
      },
    },
    daily: days,
    payments: [
      { label: "Cash (shop)", amount: pay("CASH") },
      { label: "UPI (shop)", amount: pay("UPI") },
      { label: "Card (shop)", amount: pay("CARD") },
      { label: "Razorpay (online)", amount: toNumber(onlinePaid._sum.total) },
    ],
    categories: categories.map((c) => ({ name: [c.category ?? "Deleted products", c.subcategory].filter(Boolean).join(" › "), qty: c.qty, revenue: toNumber(c.revenue) })),
    staff: staff
      .map((s) => ({ name: s.cashierId ? (nameOf.get(s.cashierId) ?? "Staff") : "Unknown", bills: s._count, sales: toNumber(s._sum.total), discounts: toNumber(s._sum.manualDiscount) }))
      .sort((a, b) => b.sales - a.sales),
    topProducts: products.map((p) => ({ name: p.name, qty: p.qty, shop: p.shop, online: p.online, revenue: toNumber(p.revenue) })),
    slowMoving: slow.map((v) => ({
      id: v.id,
      productId: v.productId,
      name: v.name,
      variant: [v.size, v.color].filter(Boolean).join(" · "),
      stock: v.stock,
      value: toNumber(v.value),
      lastSold: v.lastSold ? v.lastSold.toISOString() : null,
    })),
    stock: { units: stockValue[0]?.units ?? 0, value: toNumber(stockValue[0]?.value), mrpValue: toNumber(stockValue[0]?.mrpValue) },
  };
}

const csvCell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  // Quote, and neutralise spreadsheet formulas (a cell starting with = + - @).
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

/** Every order in the range (both channels, all statuses) as CSV for Excel / the CA. */
export async function salesCsv(from: string, to: string) {
  const { start, end } = istRange(from, to);
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: start, lt: end } },
    orderBy: { createdAt: "asc" },
    include: { payments: true, items: { select: { quantity: true } }, cashier: { select: { name: true } }, payment: { select: { status: true } } },
  });
  const header = ["Date (IST)", "Time (IST)", "Channel", "Order / bill no.", "Status", "Customer", "Phone", "Items", "Subtotal", "Coupon", "Coupon discount", "Shop discount", "Round off", "Total", "Paid by", "Cashier"];
  const time = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false });
  const lines = orders.map((o) =>
    [
      istDate(o.createdAt),
      time.format(o.createdAt),
      o.channel === "POS" ? "Shop" : "Online",
      o.orderNumber,
      o.status,
      o.shippingName,
      o.shippingPhone,
      o.items.reduce((s, i) => s + i.quantity, 0),
      toNumber(o.subtotal),
      o.couponCode ?? "",
      toNumber(o.couponDiscount),
      toNumber(o.manualDiscount),
      toNumber(o.roundOff),
      toNumber(o.total),
      o.channel === "POS" ? o.payments.map((p) => `${p.method} ${toNumber(p.amount)}`).join(" + ") : o.payment?.status === "CAPTURED" ? "Razorpay" : "",
      o.cashier?.name ?? "",
    ]
      .map(csvCell)
      .join(",")
  );
  // Byte-order mark so Excel reads the file as UTF-8.
  return "﻿" + [header.map(csvCell).join(","), ...lines].join("\r\n");
}

/** Dashboard cards: today's shop vs online sales, the open drawer, top shop items this week. */
export async function dashboardPosCards() {
  const today = istDate();
  const { start, end } = istRange(today);
  const weekStart = istRange(istDate(new Date(Date.now() - 6 * 86_400_000))).start;
  const [todayByChannel, topShop, refundNeeded] = await Promise.all([
    prisma.order.groupBy({ by: ["channel"], where: { createdAt: { gte: start, lt: end }, status: { in: [...PAID_STATUSES] } }, _count: true, _sum: { total: true } }),
    prisma.$queryRaw<{ name: string; qty: number }[]>`
      SELECT oi."productName" AS name, SUM(oi.quantity)::int AS qty
      FROM "OrderItem" oi JOIN "Order" o ON o.id = oi."orderId"
      WHERE o.channel = 'POS' AND o.status = 'DELIVERED' AND o."createdAt" >= ${weekStart}
      GROUP BY 1 ORDER BY qty DESC LIMIT 5`,
    // Paid online but the stock was gone at capture (often sold in the shop meanwhile).
    prisma.order.findMany({
      where: { channel: "ONLINE", status: "PAID", stockCommitted: false, notes: { startsWith: "STOCK_CONFLICT" } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, orderNumber: true, shippingName: true, total: true, createdAt: true },
    }),
  ]);
  const ch = (c: "ONLINE" | "POS") => todayByChannel.find((r) => r.channel === c);
  return {
    today: {
      shop: { sales: toNumber(ch("POS")?._sum.total), bills: ch("POS")?._count ?? 0 },
      online: { sales: toNumber(ch("ONLINE")?._sum.total), orders: ch("ONLINE")?._count ?? 0 },
    },
    topShop,
    refundNeeded: refundNeeded.map((o) => ({ ...o, total: toNumber(o.total), createdAt: o.createdAt.toISOString() })),
  };
}
