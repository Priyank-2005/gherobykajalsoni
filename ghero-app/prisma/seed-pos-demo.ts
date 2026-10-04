/**
 * Realistic demo data for the shop POS, so the POS, dashboard and reports can be tried out.
 *
 *   npm run db:seed-pos-demo            add the demo data (skipped if it's already there)
 *   npm run db:seed-pos-demo -- --reset remove it and add it again (fresh dates)
 *   npm run db:seed-pos-demo -- --remove remove it (do this before the shop goes live)
 *
 * What it adds (every row's id starts with "demo_", bills have an idempotency key "demo-…"):
 * - 3 jewellery products as drafts (not shown on the website), with barcodes
 * - 24 shop customers (phone, name; a few with an @example.com email)
 * - 14 days of shop bills (closed days with cash counts, today still open), mixed cash /
 *   UPI / card / split payments, a few discounts (bigger ones approved by the manager) and
 *   one cancelled bill, numbered GHS/26-27/00001 …
 * - matching stock history. Live stock numbers are NOT changed: the history starts with the
 *   pieces that were sold being received, so every count ends where it is now.
 *
 * Needs the dummy staff from `npm run db:seed-pos`. Runs against GHERO_DATABASE_URL.
 */
import { PrismaClient, Prisma, type PaymentMethod } from "@prisma/client";

const prisma = new PrismaClient();
const args = new Set(process.argv.slice(2));

// Deterministic randomness, so a reset produces the same shape of data.
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(20261004);
const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)];
const between = (a: number, b: number) => a + Math.floor(rand() * (b - a + 1));
let seq = 0;
const id = (kind: string) => `demo_${kind}_${(++seq).toString(36).padStart(5, "0")}`;

const IST_MS = 330 * 60_000;
/** UTC Date for an IST wall-clock time on `daysAgo` days before today (IST). */
function istTime(daysAgo: number, hour: number, minute: number) {
  const todayIst = new Date(Date.now() + IST_MS);
  const base = Date.UTC(todayIst.getUTCFullYear(), todayIst.getUTCMonth(), todayIst.getUTCDate() - daysAgo, hour, minute);
  return new Date(base - IST_MS);
}
function financialYear(d: Date) {
  const ist = new Date(d.getTime() + IST_MS);
  const y = ist.getUTCMonth() + 1 >= 4 ? ist.getUTCFullYear() : ist.getUTCFullYear() - 1;
  return `${String(y % 100).padStart(2, "0")}-${String((y + 1) % 100).padStart(2, "0")}`;
}
const paise = (n: Prisma.Decimal | number) => Math.round(Number(n) * 100);
const rupees = (p: number) => Math.round(p) / 100;

const CUSTOMERS: [string, string, string | null][] = [
  ["Ananya Sharma", "9829104512", "ananya.sharma@example.com"],
  ["Priya Agarwal", "9414023877", null],
  ["Sneha Jain", "9887351206", "sneha.jain@example.com"],
  ["Kavita Rathore", "9783410295", null],
  ["Meenal Khandelwal", "9928765031", null],
  ["Ritu Choudhary", "8003247719", null],
  ["Neelam Gupta", "9460518834", "neelam.g@example.com"],
  ["Pooja Saini", "7737120948", null],
  ["Divya Mathur", "9571836620", null],
  ["Shalini Mehta", "9829931457", null],
  ["Aarti Bansal", "9351472086", null],
  ["Komal Sharma", "8290615743", null],
  ["Rekha Vyas", "9414867352", null],
  ["Tanvi Goyal", "9772054618", "tanvi.goyal@example.com"],
  ["Sunita Kumawat", "9636281907", null],
  ["Ishita Singhal", "9828470351", null],
  ["Manisha Purohit", "9001326584", null],
  ["Juhi Lodha", "9950713268", null],
  ["Nidhi Bhargava", "9460907125", null],
  ["Swati Pareek", "8104527390", null],
  ["Garima Tak", "9672318845", null],
  ["Bhavna Shekhawat", "9887102476", null],
  ["Radhika Mittal", "9799265103", "radhika.m@example.com"],
  ["Payal Soni", "9413558720", null],
];

const JEWELLERY = [
  { name: "Kundan Choker Necklace Set", sub: "Imitation Jewellery", price: 2499, mrp: 3999, fabric: "Kundan, gold-plated alloy", variants: [["GH-JWL-KUN-GRN", "Emerald Green", "#1F6E43", 4], ["GH-JWL-KUN-MRN", "Maroon", "#7A1F2B", 3]] },
  { name: "Temple Jhumka Earrings", sub: "One-Gram Jewellery", price: 1299, mrp: 1899, fabric: "One-gram gold plating", variants: [["GH-JWL-JHM-GLD", "Antique Gold", "#B8913A", 12]] },
  { name: "Polki Bridal Necklace (Rental)", sub: "Rental Jewellery", price: 4999, mrp: 7999, fabric: "Polki stones, gold finish", variants: [["GH-JWL-PLK-GLD", "Gold", "#C5A55A", 2]] },
] as const;

async function removeDemo() {
  const orders = await prisma.order.findMany({ where: { idempotencyKey: { startsWith: "demo-" } }, select: { id: true } });
  const orderIds = orders.map((o) => o.id);
  await prisma.$transaction(
    async (tx) => {
      await tx.couponUsage.deleteMany({ where: { orderId: { in: orderIds } } });
      await tx.emailEvent.deleteMany({ where: { orderId: { in: orderIds } } });
      await tx.order.deleteMany({ where: { id: { in: orderIds } } });
      await tx.stockMovement.deleteMany({ where: { id: { startsWith: "demo_" } } });
      await tx.registerSession.deleteMany({ where: { id: { startsWith: "demo_" } } });
      // Customers / products only if nothing real refers to them since.
      const users = await tx.user.findMany({ where: { id: { startsWith: "demo_" } }, select: { id: true, _count: { select: { orders: true } } } });
      await tx.user.deleteMany({ where: { id: { in: users.filter((u) => u._count.orders === 0).map((u) => u.id) } } });
      await tx.product.deleteMany({ where: { id: { startsWith: "demo_" } } });
      // Bill numbers carry on from the last real bill (or start again at 1).
      for (const c of await tx.invoiceCounter.findMany()) {
        const rows = await tx.order.findMany({ where: { channel: "POS", orderNumber: { startsWith: `${c.series}/` } }, select: { orderNumber: true } });
        const last = Math.max(0, ...rows.map((r) => Number(r.orderNumber.split("/").pop()) || 0));
        if (last) await tx.invoiceCounter.update({ where: { series: c.series }, data: { lastNumber: last } });
        else await tx.invoiceCounter.delete({ where: { series: c.series } });
      }
    },
    { timeout: 120_000, maxWait: 20_000 }
  );
  console.log(`Removed demo data (${orders.length} bills).`);
}

async function addDemo() {
  if (await prisma.order.count({ where: { channel: "POS", idempotencyKey: { not: { startsWith: "demo-" } } } })) {
    throw new Error("Real shop bills exist: demo bills would mix with real bill numbers. Not adding demo data.");
  }
  const staff = await prisma.user.findMany({ where: { email: { in: ["neha.manager@example.com", "pooja.cashier@example.com", "aman.cashier@example.com"] } }, select: { id: true, email: true } });
  const by = (e: string) => staff.find((s) => s.email === e)?.id;
  const neha = by("neha.manager@example.com");
  const pooja = by("pooja.cashier@example.com");
  const aman = by("aman.cashier@example.com");
  if (!neha || !pooja || !aman) throw new Error("Run `npm run db:seed-pos` first (dummy staff are needed).");
  const settings = (await prisma.storeSettings.findUnique({ where: { id: "store" } })) ?? (await prisma.storeSettings.create({ data: { id: "store" } }));

  // --- Jewellery (drafts) -----------------------------------------------------
  const jewellery = await prisma.category.findFirst({ where: { name: "Jewellery" }, include: { subcategories: true } });
  if (jewellery) {
    for (const j of JEWELLERY) {
      const productId = id("prod");
      await prisma.product.create({
        data: {
          id: productId,
          name: j.name,
          slug: `${j.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${productId.slice(-4)}`,
          description: `${j.name} from the Ghero boutique.`,
          fabric: j.fabric,
          categoryId: jewellery.id,
          subcategoryId: jewellery.subcategories.find((s) => s.name === j.sub)?.id ?? null,
          basePrice: j.price,
          baseMrp: j.mrp,
          isPublished: false, // no photos yet: kept off the website
          variants: { create: j.variants.map(([sku, color, hex, stock]) => ({ id: id("var"), sku, size: "Free Size", color, colorHex: hex, price: j.price, mrp: j.mrp, stock })) },
        },
      });
    }
  }

  // --- Customers ----------------------------------------------------------------
  const custList: { id: string; name: string | null; email: string | null; phone: string }[] = [];
  for (const [name, phone, email] of CUSTOMERS) {
    const existing = await prisma.user.findUnique({ where: { phone }, select: { id: true, name: true, email: true } });
    const user = existing ?? (await prisma.user.create({ data: { id: id("cust"), name, phone, email }, select: { id: true, name: true, email: true } }));
    custList.push({ ...user, phone });
  }

  // --- What can be sold -------------------------------------------------------------
  const variants = await prisma.productVariant.findMany({
    include: { product: { select: { id: true, name: true, slug: true, images: { orderBy: { displayOrder: "asc" }, take: 1, select: { url: true } } } } },
  });
  // Cheaper pieces sell more often.
  const weighted = variants.flatMap((v) => Array(Number(v.price) <= 3000 ? 6 : Number(v.price) <= 8000 ? 4 : Number(v.price) <= 15000 ? 2 : 1).fill(v));

  type Bill = {
    id: string;
    at: Date;
    day: number;
    cashierId: string;
    approvedById: string | null;
    customer: (typeof custList)[number];
    lines: { v: (typeof variants)[number]; qty: number }[];
    billDiscountPct: number;
    method: "CASH" | "UPI" | "CARD" | "SPLIT";
    cancelled: boolean;
  };

  const DAYS = 14;
  const bills: Bill[] = [];
  const nowIst = new Date(Date.now() + IST_MS);
  for (let day = DAYS - 1; day >= 0; day--) {
    const weekday = new Date(Date.now() + IST_MS - day * 86_400_000).getUTCDay();
    const weekend = weekday === 0 || weekday === 6;
    let count = weekend ? between(6, 9) : between(3, 7);
    let latestMinute = 20 * 60 + 30;
    if (day === 0) {
      latestMinute = Math.min(latestMinute, nowIst.getUTCHours() * 60 + nowIst.getUTCMinutes() - 15);
      if (latestMinute < 11 * 60 + 15) count = 0;
      else count = Math.min(count, 3);
    }
    const minutes = Array.from({ length: count }, () => between(11 * 60, latestMinute)).sort((a, b) => a - b);
    for (const m of minutes) {
      const nLines = rand() < 0.65 ? 1 : rand() < 0.8 ? 2 : 3;
      const lines: Bill["lines"] = [];
      while (lines.length < nLines) {
        const v = pick(weighted);
        if (!lines.some((l) => l.v.id === v.id)) lines.push({ v, qty: rand() < 0.9 ? 1 : 2 });
      }
      const cashierId = rand() < 0.45 ? pooja : rand() < 0.6 ? aman : neha;
      const limit = cashierId === aman ? 5 : cashierId === pooja ? 10 : 25;
      const r = rand();
      const billDiscountPct = r < 0.7 ? 0 : r < 0.9 ? Math.min(limit, pick([5, 10])) : pick([15, 20]);
      const pm = rand();
      bills.push({
        id: id("bill"),
        at: istTime(day, Math.floor(m / 60), m % 60),
        day,
        cashierId,
        approvedById: billDiscountPct > limit ? neha : null,
        customer: pick(custList),
        lines,
        billDiscountPct,
        method: pm < 0.08 ? "SPLIT" : pm < 0.5 ? "CASH" : pm < 0.87 ? "UPI" : "CARD",
        cancelled: false,
      });
    }
  }
  // One bill made by mistake and cancelled by the manager.
  const toCancel = bills.find((b) => b.day === 5) ?? bills[Math.floor(bills.length / 2)];
  if (toCancel) toCancel.cancelled = true;

  // --- Registers, orders, items, payments, stock history ------------------------------
  const registers: Prisma.RegisterSessionCreateManyInput[] = [];
  const orders: Prisma.OrderCreateManyInput[] = [];
  const items: Prisma.OrderItemCreateManyInput[] = [];
  const payments: Prisma.OrderPaymentCreateManyInput[] = [];
  const counterSeries = new Map<string, number>();

  // Stock: start each sold variant's history with the pieces that were then sold, so the
  // running count ends exactly at today's live stock.
  const soldQty = new Map<string, number>();
  for (const b of bills) if (!b.cancelled) for (const l of b.lines) soldQty.set(l.v.id, (soldQty.get(l.v.id) ?? 0) + l.qty);
  const running = new Map(variants.map((v) => [v.id, v.stock + (soldQty.get(v.id) ?? 0)]));
  const movements: Prisma.StockMovementCreateManyInput[] = [];
  const firstDay = istTime(DAYS - 1, 10, 20);
  for (const v of variants) {
    const q = soldQty.get(v.id) ?? 0;
    const isDemoProduct = v.productId.startsWith("demo_");
    if (isDemoProduct) {
      movements.push({ id: id("mv"), variantId: v.id, sku: v.sku, productName: v.product.name, delta: running.get(v.id)!, stockAfter: running.get(v.id)!, reason: "INITIAL", userId: neha, createdAt: firstDay });
    } else if (q > 0) {
      movements.push({ id: id("mv"), variantId: v.id, sku: v.sku, productName: v.product.name, delta: q, stockAfter: running.get(v.id)!, reason: "RECEIVED", userId: neha, note: "Shop stock moved onto the POS", createdAt: firstDay });
    }
  }

  for (let day = DAYS - 1; day >= 0; day--) {
    const dayBills = bills.filter((b) => b.day === day);
    const registerId = id("reg");
    const opening = 2000;
    let cashTaken = 0;
    for (const b of dayBills) {
      const fy = financialYear(b.at);
      const series = `${settings.invoicePrefix || "GHS"}/${fy}`;
      const n = (counterSeries.get(series) ?? 0) + 1;
      counterSeries.set(series, n);
      const billNumber = `${series}/${String(n).padStart(5, "0")}`;

      const subtotal = b.lines.reduce((s, l) => s + paise(l.v.price) * l.qty, 0);
      const mrpSavings = b.lines.reduce((s, l) => s + Math.max(0, paise(l.v.mrp) - paise(l.v.price)) * l.qty, 0);
      const manual = Math.round((subtotal * b.billDiscountPct) / 100);
      const after = subtotal - manual;
      const total = Math.round(after / 100) * 100;
      const pays: { method: PaymentMethod; amount: number; tendered: number | null; reference: string | null }[] = [];
      if (b.method === "SPLIT") {
        const upi = Math.min(total - 100_00, Math.max(1000_00, Math.floor(total / 2 / 1000_00) * 1000_00));
        pays.push({ method: "UPI", amount: upi, tendered: null, reference: null }, { method: "CASH", amount: total - upi, tendered: Math.ceil((total - upi) / 500_00) * 500_00, reference: null });
      } else if (b.method === "CASH") {
        pays.push({ method: "CASH", amount: total, tendered: rand() < 0.5 ? total : Math.ceil(total / 500_00) * 500_00, reference: null });
      } else {
        pays.push({ method: b.method, amount: total, tendered: null, reference: b.method === "CARD" ? String(between(100000, 999999)) : null });
      }
      if (!b.cancelled) cashTaken += pays.filter((p) => p.method === "CASH").reduce((s, p) => s + p.amount, 0);

      const cancelledAt = b.cancelled ? new Date(b.at.getTime() + 12 * 60_000) : null;
      orders.push({
        id: b.id,
        orderNumber: billNumber,
        channel: "POS",
        status: b.cancelled ? "CANCELLED" : "DELIVERED",
        stockCommitted: !b.cancelled,
        idempotencyKey: `demo-${b.id}`,
        userId: b.customer.id,
        cashierId: b.cashierId,
        approvedById: b.approvedById,
        registerSessionId: registerId,
        subtotal: rupees(subtotal),
        discount: rupees(mrpSavings),
        manualDiscount: rupees(manual),
        roundOff: rupees(total - after),
        couponDiscount: 0,
        shippingFee: 0,
        total: rupees(total),
        shippingName: b.customer.name ?? "Walk-in customer",
        shippingPhone: b.customer.phone,
        shippingEmail: b.customer.email ?? "",
        shippingAddress1: settings.addressLine || settings.storeName,
        shippingArea: "In-store purchase",
        shippingCity: settings.city || "-",
        shippingState: settings.state || "-",
        shippingPincode: settings.pincode || "000000",
        notes: b.cancelled ? "Cancelled: Billed the wrong size; customer took a different one" : null,
        cancelledAt,
        cancelledById: b.cancelled ? neha : null,
        createdAt: b.at,
        updatedAt: cancelledAt ?? b.at,
      });
      for (const l of b.lines) {
        items.push({
          id: id("item"),
          orderId: b.id,
          variantId: l.v.id,
          productId: l.v.product.id,
          productName: l.v.product.name,
          productSlug: l.v.product.slug,
          sku: l.v.sku,
          size: l.v.size,
          color: l.v.color,
          quantity: l.qty,
          unitPrice: l.v.price,
          unitMrp: l.v.mrp,
          imageUrl: l.v.product.images[0]?.url ?? null,
          createdAt: b.at,
        });
        const after = running.get(l.v.id)! - l.qty;
        running.set(l.v.id, after);
        movements.push({ id: id("mv"), variantId: l.v.id, sku: l.v.sku, productName: l.v.product.name, delta: -l.qty, stockAfter: after, reason: "POS_SALE", orderId: b.id, userId: b.cashierId, createdAt: b.at });
        if (b.cancelled) {
          const back = running.get(l.v.id)! + l.qty;
          running.set(l.v.id, back);
          movements.push({ id: id("mv"), variantId: l.v.id, sku: l.v.sku, productName: l.v.product.name, delta: l.qty, stockAfter: back, reason: "CANCEL", orderId: b.id, userId: neha, note: `Bill ${billNumber} cancelled: wrong size billed`, createdAt: cancelledAt! });
        }
      }
      for (const p of pays) payments.push({ id: id("pay"), orderId: b.id, method: p.method, amount: rupees(p.amount), tendered: p.tendered === null ? null : rupees(p.tendered), reference: p.reference, createdAt: b.at });
    }

    const expected = paise(opening) + cashTaken;
    const isToday = day === 0;
    const diff = day === 9 ? -200_00 : day === 3 ? 50_00 : 0;
    registers.push({
      id: registerId,
      openedById: dayBills[0]?.cashierId ?? pooja,
      openingCash: opening,
      openedAt: istTime(day, 10, 45),
      ...(isToday
        ? {}
        : {
            closedById: neha,
            closedAt: istTime(day, 20, 50),
            expectedCash: rupees(expected),
            countedCash: rupees(expected + diff),
            difference: rupees(diff),
            note: diff < 0 ? "Paid ₹200 to the tailor for an alteration" : diff > 0 ? "₹50 extra: a customer didn't wait for change" : null,
          }),
    });
  }

  // Safety check: the history must end exactly at today's live stock.
  for (const v of variants) {
    if (running.get(v.id) !== v.stock) throw new Error(`Stock history doesn't end at the live stock for ${v.sku} (${running.get(v.id)} vs ${v.stock})`);
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.registerSession.createMany({ data: registers });
      await tx.order.createMany({ data: orders });
      await tx.orderItem.createMany({ data: items });
      await tx.orderPayment.createMany({ data: payments });
      await tx.stockMovement.createMany({ data: movements });
      for (const [series, last] of counterSeries) {
        await tx.invoiceCounter.upsert({ where: { series }, update: { lastNumber: last }, create: { series, lastNumber: last } });
      }
    },
    { timeout: 120_000, maxWait: 20_000 }
  );

  const live = orders.filter((o) => o.status !== "CANCELLED");
  console.log(
    `Demo data added: ${live.length} bills (+1 cancelled) over ${DAYS} days, ₹${live.reduce((s, o) => s + Number(o.total), 0).toLocaleString("en-IN")} sales, ` +
      `${custList.length} customers, ${movements.length} stock-history rows, ${jewellery ? JEWELLERY.length : 0} jewellery drafts. Today's day is open.`
  );
}

async function main() {
  const exists = await prisma.order.count({ where: { idempotencyKey: { startsWith: "demo-" } } });
  if (args.has("--remove") || args.has("--reset")) await removeDemo();
  if (args.has("--remove")) return;
  if (exists && !args.has("--reset")) {
    console.log("Demo data is already there. Use --reset to recreate it or --remove to delete it.");
    return;
  }
  if (await prisma.registerSession.findFirst({ where: { closedAt: null, id: { not: { startsWith: "demo_" } } } })) {
    throw new Error("A real shop day is open. Close it in the POS before adding demo data.");
  }
  await addDemo();
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
