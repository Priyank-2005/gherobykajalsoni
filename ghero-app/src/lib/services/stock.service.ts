import type { Prisma, StockReason } from "@prisma/client";
import { prisma } from "@/lib/db";
import { badRequest, conflict, notFound } from "@/lib/api";
import { toNumber } from "@/lib/money";
import { istRange } from "@/lib/ist";
import type { CatalogVariant } from "@/types/pos";
import { applyStockDeltas } from "./inventory.service";

/**
 * Shop-side stock tools: the catalogue the POS caches for instant scanning, scan lookups,
 * receiving new stock, manual adjustments and the stock history. Every change goes through
 * applyStockDeltas, so it is shared with the website and logged.
 */

/** Every variant with its barcodes, for the POS device cache. */
export async function posCatalog(): Promise<CatalogVariant[]> {
  const variants = await prisma.productVariant.findMany({
    orderBy: [{ product: { name: "asc" } }, { createdAt: "asc" }],
    select: {
      id: true,
      productId: true,
      barcode: true,
      sku: true,
      size: true,
      color: true,
      price: true,
      mrp: true,
      stock: true,
      supplierCodes: { select: { code: true } },
      product: { select: { name: true, images: { orderBy: { displayOrder: "asc" }, take: 1, select: { url: true } } } },
    },
  });
  return variants.map((v) => ({
    id: v.id,
    productId: v.productId,
    barcode: v.barcode,
    codes: v.supplierCodes.map((c) => c.code),
    sku: v.sku,
    name: v.product.name,
    size: v.size,
    color: v.color,
    price: toNumber(v.price),
    mrp: toNumber(v.mrp),
    stock: v.stock,
    imageUrl: v.product.images[0]?.url ?? null,
  }));
}

/** Find the variant behind a scanned / typed code: our barcode, a supplier barcode or the SKU. */
export async function findVariantByCode(code: string) {
  const c = code.trim();
  if (!c) return null;
  const variant =
    (await prisma.productVariant.findUnique({ where: { barcode: c }, select: { id: true, productId: true } })) ??
    (await prisma.variantBarcode.findUnique({ where: { code: c }, select: { variant: { select: { id: true, productId: true } } } }))?.variant ??
    (await prisma.productVariant.findUnique({ where: { sku: c.toUpperCase() }, select: { id: true, productId: true } }));
  return variant;
}

/** Stock check: the scanned item plus every size/colour of the same product, live from the DB. */
export async function stockLookup(code: string) {
  const hit = await findVariantByCode(code);
  if (!hit) throw notFound(`No product has the code "${code.trim()}"`);
  const product = await prisma.product.findUnique({
    where: { id: hit.productId },
    select: {
      id: true,
      name: true,
      isPublished: true,
      category: { select: { name: true } },
      subcategory: { select: { name: true } },
      images: { orderBy: { displayOrder: "asc" }, take: 1, select: { url: true } },
      variants: { orderBy: { createdAt: "asc" }, select: { id: true, barcode: true, sku: true, size: true, color: true, price: true, mrp: true, stock: true, isAvailable: true } },
    },
  });
  if (!product) throw notFound("Product not found");
  return {
    scannedVariantId: hit.id,
    product: {
      id: product.id,
      name: product.name,
      category: [product.category.name, product.subcategory?.name].filter(Boolean).join(" › "),
      isPublished: product.isPublished,
      imageUrl: product.images[0]?.url ?? null,
    },
    variants: product.variants.map((v) => ({ ...v, price: toNumber(v.price), mrp: toNumber(v.mrp), onWebsite: product.isPublished && v.isAvailable && v.stock > 0 })),
  };
}

/** New stock arrived: add it (shop + website) and log who received it. */
export async function receiveStock(userId: string, lines: { variantId: string; quantity: number }[], note?: string | null) {
  const ids = [...new Set(lines.map((l) => l.variantId))];
  const found = await prisma.productVariant.count({ where: { id: { in: ids } } });
  if (found !== ids.length) throw badRequest("One of the items no longer exists. Remove it and try again.");
  await prisma.$transaction(async (tx) => {
    const result = await applyStockDeltas(tx, lines.map((l) => ({ variantId: l.variantId, delta: l.quantity })), { reason: "RECEIVED", userId, note: note || null });
    if (result.changed !== result.expected) throw conflict("Stock couldn't be updated. Please try again.");
  });
  return { pieces: lines.reduce((s, l) => s + l.quantity, 0) };
}

/** Manual correction (damaged, gift, sample, lost, found …). Can't take stock below zero. */
export async function adjustStock(userId: string, input: { variantId: string; delta: number; reason: string; note?: string | null }) {
  const variant = await prisma.productVariant.findUnique({ where: { id: input.variantId }, select: { stock: true } });
  if (!variant) throw notFound("Variant not found");
  if (variant.stock + input.delta < 0) throw badRequest(`Only ${variant.stock} in stock, so you can remove at most ${variant.stock}`);
  await prisma.$transaction(async (tx) => {
    const note = [input.reason, input.note].filter(Boolean).join(": ");
    const result = await applyStockDeltas(tx, [{ variantId: input.variantId, delta: input.delta }], { reason: "ADJUSTMENT", userId, note });
    if (result.changed !== 1) throw conflict("Stock changed while you were editing. Please refresh and try again.");
  });
}

export const STOCK_REASON_LABELS: Record<StockReason, string> = {
  INITIAL: "Opening stock",
  ONLINE_SALE: "Online sale",
  POS_SALE: "Shop sale",
  RECEIVED: "Stock received",
  ADJUSTMENT: "Adjustment",
  CANCEL: "Cancelled order",
};

/** Stock history for the admin panel, newest first. */
export async function listStockMovements(params: { q?: string; reason?: StockReason; from?: string; to?: string; variantId?: string; page?: number; pageSize?: number }) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 50;
  const q = params.q?.trim();
  const range = params.from ? istRange(params.from, params.to ?? params.from) : null;
  const where: Prisma.StockMovementWhereInput = {
    ...(params.reason ? { reason: params.reason } : {}),
    ...(params.variantId ? { variantId: params.variantId } : {}),
    ...(range ? { createdAt: { gte: range.start, lt: range.end } } : {}),
    ...(q
      ? {
          OR: [
            { sku: { contains: q, mode: "insensitive" } },
            { productName: { contains: q, mode: "insensitive" } },
            { variant: { barcode: q } },
            { note: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.stockMovement.count({ where }),
    prisma.stockMovement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { user: { select: { name: true, email: true } }, variant: { select: { size: true, color: true, barcode: true, productId: true } } },
    }),
  ]);
  const orderIds = [...new Set(rows.map((r) => r.orderId).filter((id): id is string => Boolean(id)))];
  const orders = orderIds.length ? await prisma.order.findMany({ where: { id: { in: orderIds } }, select: { id: true, orderNumber: true } }) : [];
  const orderNumber = new Map(orders.map((o) => [o.id, o.orderNumber]));
  return {
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    rows: rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      productName: r.productName,
      productId: r.variant?.productId ?? null,
      sku: r.sku,
      variant: r.variant ? [r.variant.size, r.variant.color].filter(Boolean).join(" · ") : "(deleted)",
      barcode: r.variant?.barcode ?? null,
      delta: r.delta,
      stockAfter: r.stockAfter,
      reason: r.reason,
      orderId: r.orderId,
      orderNumber: r.orderId ? (orderNumber.get(r.orderId) ?? null) : null,
      by: r.user ? (r.user.name ?? r.user.email) : r.reason === "ONLINE_SALE" ? "Website" : null,
      note: r.note,
    })),
  };
}

// ---------------------------------------------------------------------------
// Supplier barcodes (admin product page)
// ---------------------------------------------------------------------------

export async function addSupplierBarcode(productId: string, variantId: string, code: string) {
  const variant = await prisma.productVariant.findFirst({ where: { id: variantId, productId }, select: { id: true } });
  if (!variant) throw notFound("Variant not found");
  const clash =
    (await prisma.productVariant.findFirst({ where: { OR: [{ barcode: code }, { sku: code.toUpperCase() }] }, select: { sku: true } })) ??
    (await prisma.variantBarcode.findUnique({ where: { code }, select: { variant: { select: { sku: true } } } }))?.variant;
  if (clash) throw conflict(`That code already identifies ${clash.sku}`);
  return prisma.variantBarcode.create({ data: { code, variantId } });
}

export async function removeSupplierBarcode(productId: string, variantId: string, barcodeId: string) {
  const deleted = await prisma.variantBarcode.deleteMany({ where: { id: barcodeId, variantId, variant: { productId } } });
  if (!deleted.count) throw notFound("Barcode not found");
}
