import { ok } from "@/lib/api";
import { adminRoute } from "@/lib/admin-api";
import { prisma } from "@/lib/db";

/** Find variants by product name, SKU or barcode (for the stock adjustment picker). */
export const GET = adminRoute(async (request: Request) => {
  const q = new URL(request.url).searchParams.get("q")?.trim().slice(0, 100) ?? "";
  if (q.length < 2) return ok({ variants: [] });
  const variants = await prisma.productVariant.findMany({
    where: {
      OR: [
        { barcode: q },
        { sku: { contains: q, mode: "insensitive" } },
        { product: { name: { contains: q, mode: "insensitive" } } },
        { supplierCodes: { some: { code: q } } },
      ],
    },
    take: 15,
    orderBy: [{ product: { name: "asc" } }, { createdAt: "asc" }],
    select: { id: true, sku: true, barcode: true, size: true, color: true, stock: true, product: { select: { name: true } } },
  });
  return ok({ variants: variants.map((v) => ({ id: v.id, sku: v.sku, barcode: v.barcode, label: [v.product.name, v.size, v.color].filter(Boolean).join(" · "), stock: v.stock })) });
});
