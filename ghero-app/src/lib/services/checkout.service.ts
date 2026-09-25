import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { badRequest, conflict, forbidden } from "@/lib/api";
import { toPaise, fromPaise } from "@/lib/money";
import { generateOrderNumber } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";
import type { CheckoutInput } from "@/lib/validations/checkout";
import { getUserCart, priceCart } from "./cart.service";
import { createAddress, getAddress } from "./address.service";

/**
 * Create a PENDING_PAYMENT order from the signed-in user's cart.
 *
 * - Prices, coupon and shipping are recomputed server-side from the DB (priceCart).
 * - Stock is validated here; it is decremented atomically when payment is captured
 *   (payment.service -> inventory.commitStockForOrder), per the "reduce inventory on
 *   confirmation" requirement. The cart is cleared at that point too, so a failed
 *   payment leaves the bag intact.
 * - Idempotent per `idempotencyKey`: double-clicks / retries return the same order.
 */
export async function createOrderFromCart(user: SessionUser, input: CheckoutInput) {
  const existing = await prisma.order.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    select: { id: true, orderNumber: true, total: true, userId: true, status: true },
  });
  if (existing) {
    if (existing.userId !== user.id) throw forbidden();
    return { id: existing.id, orderNumber: existing.orderNumber, total: fromPaise(toPaise(existing.total)), status: existing.status };
  }

  const cart = await getUserCart(user.id);
  const priced = await priceCart(cart, user.id);
  if (!cart || priced.items.length === 0) throw badRequest("Your bag is empty", "EMPTY_CART");
  if (priced.hasIssues) {
    throw conflict("Some items in your bag are out of stock or unavailable. Please review your bag.", "CART_ISSUES");
  }
  if (priced.summary.couponError) {
    throw badRequest(`${priced.summary.couponError}. Please remove the coupon to continue.`, "COUPON_INVALID");
  }

  const address = input.addressId
    ? await getAddress(user.id, input.addressId)
    : input.address!;

  if (!input.addressId && input.saveAddress) {
    // Best-effort: a full address book shouldn't block the order.
    await createAddress(user.id, { ...input.address!, isDefault: false }).catch(() => undefined);
  }

  const lines = cart.items.map((item) => ({
    variantId: item.variantId,
    productId: item.variant.productId,
    productName: item.variant.product.name,
    productSlug: item.variant.product.slug,
    sku: item.variant.sku,
    size: item.variant.size,
    color: item.variant.color,
    quantity: item.quantity,
    unitPrice: item.variant.price,
    unitMrp: item.variant.mrp,
    imageUrl: item.variant.product.images[0]?.url ?? null,
  }));

  const s = priced.summary;
  const data = {
    userId: user.id,
    idempotencyKey: input.idempotencyKey,
    subtotal: s.subtotal,
    discount: s.savings,
    couponId: s.couponCode ? cart.couponId : null,
    couponCode: s.couponCode,
    couponDiscount: s.couponDiscount,
    shippingFee: s.shippingFee,
    total: s.total,
    shippingName: address.fullName,
    shippingPhone: address.phone,
    shippingEmail: user.email,
    shippingAddress1: address.addressLine1,
    shippingAddress2: address.addressLine2 ?? null,
    shippingArea: address.area,
    shippingCity: address.city,
    shippingState: address.state,
    shippingPincode: address.pincode,
    shippingCountry: address.country ?? "India",
    items: { create: lines },
  };

  // Order numbers are random; retry on the (rare) collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const order = await prisma.order.create({
        data: { ...data, orderNumber: generateOrderNumber() },
        select: { id: true, orderNumber: true, total: true, status: true },
      });
      return { ...order, total: fromPaise(toPaise(order.total)) };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const target = String(error.meta?.target ?? "");
        if (target.includes("idempotencyKey")) {
          // Concurrent duplicate submit won the race; return that order.
          return createOrderFromCart(user, input);
        }
        continue;
      }
      throw error;
    }
  }
  throw new Error("Could not allocate an order number");
}
