import { Prisma } from "@prisma/client";
import { prisma, type Db, type Tx } from "@/lib/db";
import { conflict } from "@/lib/api";


export type StockIssue = "UNAVAILABLE" | "OUT_OF_STOCK" | "INSUFFICIENT_STOCK";

/** Classify a cart/order line against live stock. null = OK. */
export function stockIssue(
  line: { quantity: number },
  variant: { stock: number; isAvailable: boolean; product: { isPublished: boolean } }
): StockIssue | null {
  if (!variant.isAvailable || !variant.product.isPublished) return "UNAVAILABLE";
  if (variant.stock <= 0) return "OUT_OF_STOCK";
  if (line.quantity > variant.stock) return "INSUFFICIENT_STOCK";
  return null;
}

/**
 * Atomically decrement stock for every line of an order in ONE statement. Each row is only
 * updated when `stock >= qty`, so concurrent buyers can never drive stock negative.
 * All-or-nothing: if any line can't be fulfilled this throws AppError(409) and the caller
 * rolls back (transaction or savepoint). Must run inside a transaction.
 */
export async function commitStockForOrder(tx: Tx, orderId: string) {
  const items = await tx.orderItem.findMany({ where: { orderId }, select: { variantId: true, quantity: true, sku: true } });
  const missing = items.find((i) => !i.variantId);
  if (missing) throw conflict(`${missing.sku} is no longer available`, "STOCK_CONFLICT");
  if (!items.length) return;

  // Sum per variant in case the same variant appears twice.
  const qty = new Map<string, number>();
  for (const i of items) qty.set(i.variantId!, (qty.get(i.variantId!) ?? 0) + i.quantity);

  const rows = [...qty].map(([id, q]) => Prisma.sql`(${id}, ${q}::int)`);
  const updated = await tx.$queryRaw<{ id: string }[]>`
    UPDATE "ProductVariant" AS v
    SET stock = v.stock - x.qty, "updatedAt" = NOW()
    FROM (VALUES ${Prisma.join(rows)}) AS x(id, qty)
    WHERE v.id = x.id AND v.stock >= x.qty
    RETURNING v.id`;
  if (updated.length !== qty.size) throw conflict("Not enough stock for one or more items", "STOCK_CONFLICT");
}

/** Return stock for a cancelled order whose stock had been committed (one statement). */
export async function restoreStockForOrder(db: Db, orderId: string) {
  const items = await db.orderItem.findMany({ where: { orderId }, select: { variantId: true, quantity: true } });
  const rows = items
    .filter((i) => i.variantId) // variant deleted since; nothing to restore
    .map((i) => Prisma.sql`(${i.variantId}, ${i.quantity}::int)`);
  if (!rows.length) return;
  await db.$executeRaw`
    UPDATE "ProductVariant" AS v
    SET stock = v.stock + x.qty, "updatedAt" = NOW()
    FROM (SELECT id, SUM(qty)::int AS qty FROM (VALUES ${Prisma.join(rows)}) AS t(id, qty) GROUP BY id) AS x
    WHERE v.id = x.id`;
}

export async function lowStockCount(threshold = 3) {
  return prisma.productVariant.count({ where: { stock: { lte: threshold }, isAvailable: true } });
}

/** Variants at or below the threshold, lowest first (for the admin dashboard alert). */
export async function lowStockVariants(threshold = 3, take = 8) {
  const rows = await prisma.productVariant.findMany({
    where: { stock: { lte: threshold }, isAvailable: true },
    orderBy: [{ stock: "asc" }, { updatedAt: "desc" }],
    take,
    select: { id: true, sku: true, size: true, color: true, stock: true, product: { select: { id: true, name: true } } },
  });
  return rows;
}
