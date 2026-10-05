import { Prisma } from "@prisma/client";
import { prisma, type Db } from "@/lib/db";
import { AppError, badRequest, conflict, forbidden, notFound } from "@/lib/api";
import { fromPaise, toNumber, toPaise } from "@/lib/money";
import { financialYear, istRange } from "@/lib/ist";
import { atLeast, verifyApproval, type PosStaff } from "@/lib/pos-auth";
import type { CreateBillInput, QuoteBillInput } from "@/lib/validations/pos";
import type { BillQuote, BillView } from "@/types/pos";
import { evaluateCoupon, findCouponByCode } from "./coupon.service";
import { commitStockForOrder, restoreStockForOrder } from "./inventory.service";
import { upsertPosCustomer } from "./pos-customer.service";
import { getOpenRegister } from "./register.service";
import { getStoreSettings } from "./store-settings.service";

/**
 * Shop bills. A bill is an Order with channel POS and status DELIVERED (handed over at the
 * counter). Prices, discounts, limits and stock are always worked out here on the server;
 * the screen only sends what was scanned, the discounts typed in and the payments taken.
 *
 * Total = subtotal - coupon - manual discounts, rounded to the nearest rupee (roundOff).
 * Prices include all taxes (no separate GST on bills for now).
 */

type PricingInput = Pick<QuoteBillInput, "lines" | "billDiscount" | "couponCode"> & { customerPhone?: string | null };

type PricedBill = Omit<BillQuote, "lines"> & { couponId: string | null; lines: (BillQuote["lines"][number] & { productId: string; productSlug: string })[] };

async function priceBill(input: PricingInput, staff: PosStaff, db: Db = prisma): Promise<PricedBill> {
  const ids = [...new Set(input.lines.map((l) => l.variantId))];
  const variants = await db.productVariant.findMany({
    where: { id: { in: ids } },
    include: { product: { select: { name: true, slug: true, images: { orderBy: { displayOrder: "asc" }, take: 1, select: { url: true } } } } },
  });
  const byId = new Map(variants.map((v) => [v.id, v]));

  const lines = input.lines.map((l) => {
    const v = byId.get(l.variantId);
    if (!v) throw badRequest("An item on this bill no longer exists. Remove it and scan again.", "ITEM_GONE");
    const price = toPaise(v.price);
    const gross = price * l.quantity;
    const discount = toPaise(l.discount ?? 0);
    if (discount > gross) throw badRequest(`The discount on ${v.product.name} is more than its price`);
    return {
      variantId: v.id,
      productId: v.productId,
      productSlug: v.product.slug,
      name: v.product.name,
      size: v.size,
      color: v.color,
      sku: v.sku,
      barcode: v.barcode,
      imageUrl: v.product.images[0]?.url ?? null,
      pricePaise: price,
      mrpPaise: Math.max(toPaise(v.mrp), price),
      quantity: l.quantity,
      grossPaise: gross,
      discountPaise: discount,
      stock: v.stock,
    };
  });

  const subtotal = lines.reduce((s, l) => s + l.grossPaise, 0);
  const mrpSavings = lines.reduce((s, l) => s + (l.mrpPaise - l.pricePaise) * l.quantity, 0);

  let couponId: string | null = null;
  let couponDiscount = 0;
  let couponError: string | null = null;
  if (input.couponCode) {
    try {
      const coupon = await findCouponByCode(input.couponCode);
      const customer = input.customerPhone ? await db.user.findUnique({ where: { phone: input.customerPhone }, select: { id: true } }) : null;
      couponDiscount = await evaluateCoupon(
        coupon,
        { subtotalPaise: subtotal, mrpTotalPaise: lines.reduce((s, l) => s + l.mrpPaise * l.quantity, 0), userId: customer?.id ?? null },
        db
      );
      couponId = coupon.id;
    } catch (error) {
      if (!(error instanceof AppError)) throw error;
      couponError = error.message;
    }
  }

  const manual = lines.reduce((s, l) => s + l.discountPaise, 0) + toPaise(input.billDiscount ?? 0);
  if (couponDiscount + manual > subtotal) throw badRequest("Discounts can't be more than the bill amount");
  const manualPercent = subtotal ? Math.round((manual / subtotal) * 10000) / 100 : 0;
  const afterDiscount = subtotal - couponDiscount - manual;
  const total = Math.round(afterDiscount / 100) * 100;

  // Same variant on several lines: check the combined quantity.
  const wanted = new Map<string, number>();
  for (const l of lines) wanted.set(l.variantId, (wanted.get(l.variantId) ?? 0) + l.quantity);
  const stockIssues = [...wanted].flatMap(([id, qty]) => {
    const v = byId.get(id)!;
    if (qty <= v.stock) return [];
    const label = [v.product.name, v.size, v.color].filter(Boolean).join(" · ");
    return [v.stock <= 0 ? `${label} is out of stock` : `Only ${v.stock} left of ${label}`];
  });

  return {
    couponId,
    lines: lines.map((l) => ({
      variantId: l.variantId,
      productId: l.productId,
      productSlug: l.productSlug,
      name: l.name,
      size: l.size,
      color: l.color,
      sku: l.sku,
      barcode: l.barcode,
      imageUrl: l.imageUrl,
      unitPrice: fromPaise(l.pricePaise),
      unitMrp: fromPaise(l.mrpPaise),
      quantity: l.quantity,
      discount: fromPaise(l.discountPaise),
      lineTotal: fromPaise(l.grossPaise - l.discountPaise),
      stock: l.stock,
    })),
    itemCount: lines.reduce((s, l) => s + l.quantity, 0),
    subtotal: fromPaise(subtotal),
    mrpSavings: fromPaise(mrpSavings),
    couponCode: couponId ? input.couponCode!.toUpperCase() : null,
    couponDiscount: fromPaise(couponDiscount),
    couponError,
    manualDiscount: fromPaise(manual),
    manualPercent,
    maxDiscountPercent: staff.maxDiscountPercent,
    needsApproval: manualPercent > staff.maxDiscountPercent,
    roundOff: fromPaise(total - afterDiscount),
    total: fromPaise(total),
    stockIssues,
  };
}

/** Price a bill for the screen (coupon check, discount limit, stock warnings). */
export async function quoteBill(staff: PosStaff, input: QuoteBillInput): Promise<BillQuote> {
  const priced = await priceBill({ ...input, customerPhone: input.customer?.phone ?? null }, staff);
  // Drop the fields only bill creation needs (coupon id, product ids/slugs).
  const { couponId: _couponId, lines, ...quote } = priced; // eslint-disable-line @typescript-eslint/no-unused-vars
  return {
    ...quote,
    lines: lines.map((l) => ({
      variantId: l.variantId,
      name: l.name,
      size: l.size,
      color: l.color,
      sku: l.sku,
      barcode: l.barcode,
      imageUrl: l.imageUrl,
      unitPrice: l.unitPrice,
      unitMrp: l.unitMrp,
      quantity: l.quantity,
      discount: l.discount,
      lineTotal: l.lineTotal,
      stock: l.stock,
    })),
  };
}

/** "GHS/26-27/00042": gap-free per series, numbered inside the bill's transaction. */
async function nextBillNumber(db: Db, prefix: string) {
  const series = `${prefix}/${financialYear()}`;
  const [row] = await db.$queryRaw<{ lastNumber: number }[]>`
    INSERT INTO "InvoiceCounter" ("series", "lastNumber") VALUES (${series}, 1)
    ON CONFLICT ("series") DO UPDATE SET "lastNumber" = "InvoiceCounter"."lastNumber" + 1
    RETURNING "lastNumber"`;
  return `${series}/${String(row.lastNumber).padStart(5, "0")}`;
}

/**
 * Create a paid shop bill: customer, bill number, order + items + payments and the stock
 * decrement (shared with the website) all in one transaction. Idempotent per key, so a
 * double-tap or a retry after a network blip never makes two bills.
 */
export async function createBill(session: { staff: PosStaff }, input: CreateBillInput) {
  const { staff } = session;
  // Independent reads in parallel (each is a round trip to the database). A manager's approval
  // PIN is checked outside the transaction: failed attempts must be recorded even if the bill fails.
  const [existing, register, settings, approver] = await Promise.all([
    prisma.order.findUnique({ where: { idempotencyKey: input.idempotencyKey }, select: { id: true, orderNumber: true, channel: true } }),
    getOpenRegister(),
    getStoreSettings(),
    input.approval ? verifyApproval(input.approval) : Promise.resolve(null),
  ]);
  if (existing) {
    if (existing.channel !== "POS") throw conflict("Please start a new bill");
    return { id: existing.id, billNumber: existing.orderNumber, emailTo: null };
  }
  if (!register) throw conflict("Open the day (enter the opening cash) before billing", "REGISTER_CLOSED");

  let billId: string;
  let billNumber: string;
  let emailTo: string | null;
  try {
    ({ billId, billNumber, emailTo } = await prisma.$transaction(async (tx) => {
      const quote = await priceBill({ ...input, customerPhone: input.customer.phone }, staff, tx);
      if (quote.couponError) throw badRequest(quote.couponError, "COUPON_INVALID");
      if (quote.stockIssues.length) throw conflict(quote.stockIssues.join(". "), "STOCK_CONFLICT");
      if (quote.needsApproval && !approver) {
        throw new AppError(403, `This discount (${quote.manualPercent}%) is above your limit of ${staff.maxDiscountPercent}%. A manager needs to approve it.`, "APPROVAL_REQUIRED");
      }
      if (quote.needsApproval && approver && quote.manualPercent > approver.maxDiscountPercent) {
        throw forbidden(`${approver.name} can approve up to ${approver.maxDiscountPercent}%. Ask someone with a higher limit.`);
      }
      if (quote.total <= 0) throw badRequest("The bill total is zero. Remove the discount or the items.");

      const paid = input.payments.reduce((s, p) => s + toPaise(p.amount), 0);
      if (paid !== toPaise(quote.total)) {
        throw badRequest(`Payments add up to ₹${fromPaise(paid)} but the bill is ₹${quote.total}. Please check the amounts.`, "PAYMENT_MISMATCH");
      }
      for (const p of input.payments) {
        if (p.method === "CASH" && p.tendered != null && toPaise(p.tendered) < toPaise(p.amount)) {
          throw badRequest("Cash received is less than the cash amount");
        }
      }

      const customer = await upsertPosCustomer(tx, input.customer);
      const number = await nextBillNumber(tx, settings.invoicePrefix || "GHS");

      const order = await tx.order.create({
        data: {
          orderNumber: number,
          channel: "POS",
          status: "DELIVERED",
          stockCommitted: true,
          idempotencyKey: input.idempotencyKey,
          userId: customer.id,
          cashierId: staff.id,
          approvedById: approver?.id ?? null,
          registerSessionId: register.id,
          subtotal: quote.subtotal,
          discount: quote.mrpSavings,
          couponId: quote.couponId,
          couponCode: quote.couponCode,
          couponDiscount: quote.couponDiscount,
          manualDiscount: quote.manualDiscount,
          roundOff: quote.roundOff,
          shippingFee: 0,
          total: quote.total,
          // Shop bills keep the customer in the shipping snapshot and the shop as the address.
          shippingName: customer.name ?? "Walk-in customer",
          shippingPhone: customer.phone ?? input.customer.phone,
          shippingEmail: customer.email ?? "",
          shippingAddress1: settings.addressLine || settings.storeName,
          shippingArea: "In-store purchase",
          shippingCity: settings.city || "-",
          shippingState: settings.state || "-",
          shippingPincode: settings.pincode || "000000",
          items: {
            create: quote.lines.map((l) => ({
              variantId: l.variantId,
              productId: l.productId,
              productName: l.name,
              productSlug: l.productSlug,
              sku: l.sku,
              size: l.size,
              color: l.color,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              unitMrp: l.unitMrp,
              lineDiscount: l.discount,
              imageUrl: l.imageUrl,
            })),
          },
          payments: {
            create: input.payments.map((p) => ({
              method: p.method,
              amount: fromPaise(toPaise(p.amount)),
              tendered: p.method === "CASH" && p.tendered != null ? fromPaise(toPaise(p.tendered)) : null,
              reference: p.reference || null,
            })),
          },
        },
        select: { id: true },
      });

      await commitStockForOrder(tx, order.id, { reason: "POS_SALE", userId: staff.id });
      if (quote.couponId) await tx.couponUsage.create({ data: { couponId: quote.couponId, userId: customer.id, orderId: order.id } });
      // The email typed at the counter wins (the customer just asked for the bill there).
      return { billId: order.id, billNumber: number, emailTo: input.customer.email || customer.email };
    }));
  } catch (error) {
    // Two submits with the same key racing: the loser returns the winner's bill.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002" && String(error.meta?.target).includes("idempotencyKey")) {
      const winner = await prisma.order.findUnique({ where: { idempotencyKey: input.idempotencyKey }, select: { id: true, orderNumber: true } });
      if (winner) return { id: winner.id, billNumber: winner.orderNumber, emailTo: null };
    }
    throw error;
  }
  return { id: billId, billNumber, emailTo };
}

// ---------------------------------------------------------------------------
// Reading bills
// ---------------------------------------------------------------------------

const billInclude = {
  items: { orderBy: { createdAt: "asc" as const } },
  payments: { orderBy: { createdAt: "asc" as const } },
  cashier: { select: { name: true, email: true } },
  registerSession: { select: { closedAt: true } },
  user: { select: { email: true } },
} satisfies Prisma.OrderInclude;

type BillRow = Prisma.OrderGetPayload<{ include: typeof billInclude }>;

async function approverName(id: string | null) {
  if (!id) return null;
  const u = await prisma.user.findUnique({ where: { id }, select: { name: true, email: true } });
  return u?.name ?? u?.email ?? null;
}

async function toBillView(o: BillRow): Promise<BillView> {
  return {
    id: o.id,
    billNumber: o.orderNumber,
    status: o.status,
    createdAt: o.createdAt.toISOString(),
    cancelledAt: o.cancelledAt?.toISOString() ?? null,
    cancelReason: o.status === "CANCELLED" ? (o.notes?.replace(/^Cancelled: /, "") ?? null) : null,
    customer: { name: o.shippingName === "Walk-in customer" ? null : o.shippingName, phone: o.shippingPhone, email: o.shippingEmail || o.user.email || null },
    cashier: o.cashier ? (o.cashier.name ?? o.cashier.email) : null,
    approvedBy: await approverName(o.approvedById),
    items: o.items.map((i) => {
      const unitPrice = toNumber(i.unitPrice);
      const discount = toNumber(i.lineDiscount);
      return {
        id: i.id,
        name: i.productName,
        sku: i.sku,
        size: i.size,
        color: i.color,
        quantity: i.quantity,
        unitPrice,
        unitMrp: toNumber(i.unitMrp),
        discount,
        lineTotal: fromPaise(toPaise(unitPrice) * i.quantity - toPaise(discount)),
      };
    }),
    subtotal: toNumber(o.subtotal),
    mrpSavings: toNumber(o.discount),
    couponCode: o.couponCode,
    couponDiscount: toNumber(o.couponDiscount),
    manualDiscount: toNumber(o.manualDiscount),
    roundOff: toNumber(o.roundOff),
    total: toNumber(o.total),
    payments: o.payments.map((p) => ({ method: p.method, amount: toNumber(p.amount), tendered: p.tendered === null ? null : toNumber(p.tendered), reference: p.reference })),
    registerOpen: Boolean(o.registerSession && !o.registerSession.closedAt),
  };
}

export async function getBill(id: string) {
  const order = await prisma.order.findFirst({ where: { id, channel: "POS" }, include: billInclude });
  if (!order) throw notFound("Bill not found");
  return toBillView(order);
}

/** Shop bills for one IST day (newest first), optionally filtered by bill no. / phone / name. */
export async function listBills(params: { date: string; q?: string }) {
  const { start, end } = istRange(params.date);
  const q = params.q?.trim();
  const orders = await prisma.order.findMany({
    where: {
      channel: "POS",
      createdAt: { gte: start, lt: end },
      ...(q
        ? { OR: [{ orderNumber: { contains: q, mode: "insensitive" } }, { shippingPhone: { contains: q } }, { shippingName: { contains: q, mode: "insensitive" } }] }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 500,
    include: { payments: { select: { method: true, amount: true } }, items: { select: { quantity: true } }, cashier: { select: { name: true } } },
  });
  return orders.map((o) => ({
    id: o.id,
    billNumber: o.orderNumber,
    status: o.status,
    customerName: o.shippingName,
    customerPhone: o.shippingPhone,
    itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
    total: toNumber(o.total),
    methods: [...new Set(o.payments.map((p) => p.method))],
    cashier: o.cashier?.name ?? null,
    createdAt: o.createdAt.toISOString(),
  }));
}

// ---------------------------------------------------------------------------
// Cancelling a bill (mistakes only: the shop has no returns / exchanges)
// ---------------------------------------------------------------------------

/**
 * Cancel a shop bill: stock goes back (shared with the website) and the bill no longer counts
 * in sales or the drawer. Managers/owner can cancel directly; a cashier needs a manager's PIN.
 * Only allowed while the bill's day is still open, so the closed day's cash count stays right.
 */
export async function cancelBill(session: { staff: PosStaff }, id: string, reason: string, approval?: { staffId: string; pin: string }) {
  const { staff } = session;
  const order = await prisma.order.findFirst({ where: { id, channel: "POS" }, include: { registerSession: { select: { closedAt: true } } } });
  if (!order) throw notFound("Bill not found");
  if (order.status === "CANCELLED") throw conflict("This bill is already cancelled");
  if (!order.registerSession || order.registerSession.closedAt) {
    throw badRequest("This bill is from a day that's already closed, so it can't be cancelled here.");
  }

  let by = staff;
  if (!atLeast(staff.role, "MANAGER")) {
    if (!approval) throw new AppError(403, "Cancelling a bill needs a manager's PIN", "APPROVAL_REQUIRED");
    by = (await verifyApproval(approval))!;
  }

  await prisma.$transaction(async (tx) => {
    const updated = await tx.order.updateMany({
      where: { id, status: "DELIVERED" },
      data: { status: "CANCELLED", cancelledAt: new Date(), cancelledById: by.id, stockCommitted: false, notes: `Cancelled: ${reason}` },
    });
    if (updated.count === 0) throw conflict("This bill was just changed by someone else. Please refresh.");
    if (order.stockCommitted) await restoreStockForOrder(tx, id, { userId: by.id, note: `Bill ${order.orderNumber} cancelled: ${reason}` });
    // A cancelled bill shouldn't use up the customer's coupon.
    await tx.couponUsage.deleteMany({ where: { orderId: id } });
  });
  return getBill(id);
}
