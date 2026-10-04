import { Prisma, type StockReason } from "@prisma/client";
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

export type StockMeta = {
  reason: StockReason;
  orderId?: string | null;
  userId?: string | null;
  note?: string | null;
};

/**
 * Apply stock changes and write the matching StockMovement rows in ONE statement.
 * A row is only changed when the result stays >= 0, so concurrent sales can never drive
 * stock negative. Returns how many variants changed vs. how many were asked for; callers that
 * need all-or-nothing compare the two (and roll back on a mismatch).
 */
export async function applyStockDeltas(db: Db, lines: { variantId: string; delta: number }[], meta: StockMeta) {
  // Sum per variant in case the same variant appears twice.
  const byVariant = new Map<string, number>();
  for (const l of lines) byVariant.set(l.variantId, (byVariant.get(l.variantId) ?? 0) + l.delta);
  for (const [id, delta] of byVariant) if (delta === 0) byVariant.delete(id);
  if (!byVariant.size) return { changed: 0, expected: 0 };

  const rows = [...byVariant].map(([id, delta]) => Prisma.sql`(${id}, ${delta}::int)`);
  const changed = await db.$queryRaw<{ variantId: string }[]>`
    WITH x(id, delta) AS (VALUES ${Prisma.join(rows)}),
    upd AS (
      UPDATE "ProductVariant" AS v
      SET stock = v.stock + x.delta, "updatedAt" = NOW()
      FROM x
      WHERE v.id = x.id AND v.stock + x.delta >= 0
      RETURNING v.id, v.stock, v.sku, v."productId", x.delta
    )
    INSERT INTO "StockMovement" ("id", "variantId", "sku", "productName", "delta", "stockAfter", "reason", "orderId", "userId", "note", "createdAt")
    SELECT gen_random_uuid()::text, upd.id, upd.sku, p.name, upd.delta, upd.stock,
           ${meta.reason}::"StockReason", ${meta.orderId ?? null}, ${meta.userId ?? null}, ${meta.note ?? null}, NOW()
    FROM upd JOIN "Product" p ON p.id = upd."productId"
    RETURNING "variantId"`;
  return { changed: changed.length, expected: byVariant.size };
}

/**
 * Atomically decrement stock for every line of an order. All-or-nothing: if any line can't
 * be fulfilled this throws AppError(409) and the caller rolls back (transaction or savepoint).
 * Must run inside a transaction.
 */
export async function commitStockForOrder(tx: Tx, orderId: string, meta: Omit<StockMeta, "orderId"> = { reason: "ONLINE_SALE" }) {
  const items = await tx.orderItem.findMany({ where: { orderId }, select: { variantId: true, quantity: true, sku: true } });
  const missing = items.find((i) => !i.variantId);
  if (missing) throw conflict(`${missing.sku} is no longer available`, "STOCK_CONFLICT");
  if (!items.length) return;

  const result = await applyStockDeltas(tx, items.map((i) => ({ variantId: i.variantId!, delta: -i.quantity })), { ...meta, orderId });
  if (result.changed !== result.expected) throw conflict("Not enough stock for one or more items", "STOCK_CONFLICT");
}

/** Return stock for a cancelled order whose stock had been committed (one statement). */
export async function restoreStockForOrder(db: Db, orderId: string, meta: Omit<StockMeta, "orderId" | "reason"> = {}) {
  const items = await db.orderItem.findMany({ where: { orderId }, select: { variantId: true, quantity: true } });
  const lines = items
    .filter((i) => i.variantId) // variant deleted since; nothing to restore
    .map((i) => ({ variantId: i.variantId!, delta: i.quantity }));
  await applyStockDeltas(db, lines, { ...meta, reason: "CANCEL", orderId });
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
