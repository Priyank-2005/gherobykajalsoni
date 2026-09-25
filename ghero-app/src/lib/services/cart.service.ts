import type { Prisma } from "@prisma/client";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { AppError, badRequest, notFound } from "@/lib/api";
import { generateToken, getSession, sha256 } from "@/lib/auth";
import { STORE_CONFIG } from "@/lib/config";
import { fromPaise, toPaise } from "@/lib/money";
import { evaluateCoupon, findCouponByCode } from "./coupon.service";
import { stockIssue } from "./inventory.service";
import type { CartResponse } from "@/types/cart";

/**
 * Cart ownership:
 * - Signed-in users: one cart keyed by userId.
 * - Guests: cart keyed by sha256(token) where token lives in an HTTP-only cookie.
 * On sign-in the guest cart is merged into the user's cart (see mergeGuestCart).
 * All prices are read from the DB on every request; the client never supplies prices.
 */
export const CART_COOKIE_NAME = "ghero_cart";
const CART_COOKIE_MAX_AGE = 60 * 24 * 60 * 60; // 60 days

const cartInclude = {
  coupon: true,
  items: {
    orderBy: { createdAt: "asc" as const },
    include: {
      variant: {
        include: {
          product: {
            select: {
              name: true,
              slug: true,
              isPublished: true,
              images: { orderBy: { displayOrder: "asc" as const }, take: 1, select: { url: true } },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.CartInclude;

export type CartWithItems = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

async function findGuestCart() {
  const token = (await cookies()).get(CART_COOKIE_NAME)?.value;
  if (!token) return null;
  return prisma.cart.findUnique({ where: { sessionId: sha256(token) }, include: cartInclude });
}

/** Find the current visitor's cart without creating one. Safe in Server Components. */
export async function findCurrentCart(): Promise<CartWithItems | null> {
  const session = await getSession();
  if (session) return prisma.cart.findUnique({ where: { userId: session.user.id }, include: cartInclude });
  return findGuestCart();
}

/** Find or create the current cart. Route Handler / Server Function only (may set a cookie). */
async function getOrCreateCart(): Promise<CartWithItems> {
  const session = await getSession();
  if (session) {
    return prisma.cart.upsert({
      where: { userId: session.user.id },
      update: {},
      create: { userId: session.user.id },
      include: cartInclude,
    });
  }
  const existing = await findGuestCart();
  if (existing) return existing;

  const token = generateToken();
  const cart = await prisma.cart.create({ data: { sessionId: sha256(token) }, include: cartInclude });
  (await cookies()).set(CART_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CART_COOKIE_MAX_AGE,
  });
  return cart;
}

async function reload(cartId: string) {
  return prisma.cart.findUniqueOrThrow({ where: { id: cartId }, include: cartInclude });
}

/**
 * Price a cart from live DB values. Shared by the cart API and checkout, so the
 * total shown in the bag is exactly what the order is created with.
 */
export async function priceCart(cart: CartWithItems | null, userId?: string | null): Promise<CartResponse> {
  const lines = (cart?.items ?? []).map((item) => {
    const v = item.variant;
    const price = toPaise(v.price);
    const view = {
      id: item.id,
      variantId: item.variantId,
      quantity: item.quantity,
      product: { name: v.product.name, slug: v.product.slug, imageUrl: v.product.images[0]?.url ?? null },
      variant: {
        sku: v.sku,
        size: v.size,
        color: v.color,
        price: fromPaise(price),
        mrp: fromPaise(toPaise(v.mrp)),
        stock: v.stock,
      },
      lineTotal: fromPaise(price * item.quantity),
      issue: stockIssue(item, v),
    };
    return { view, pricePaise: price, mrpPaise: Math.max(toPaise(v.mrp), price) };
  });

  // Lines with issues are shown but excluded from totals.
  const billable = lines.filter((l) => !l.view.issue);
  const subtotalPaise = billable.reduce((s, l) => s + l.pricePaise * l.view.quantity, 0);
  const mrpTotalPaise = billable.reduce((s, l) => s + l.mrpPaise * l.view.quantity, 0);

  let couponDiscountPaise = 0;
  let couponError: string | null = null;
  if (cart?.coupon) {
    try {
      couponDiscountPaise = await evaluateCoupon(cart.coupon, { subtotalPaise, mrpTotalPaise, userId });
    } catch (error) {
      couponError = error instanceof AppError ? error.message : "Coupon could not be applied";
    }
  }

  const afterCouponPaise = subtotalPaise - couponDiscountPaise;
  const shippingPaise =
    billable.length === 0 || afterCouponPaise >= toPaise(STORE_CONFIG.freeShippingThreshold)
      ? 0
      : toPaise(STORE_CONFIG.shippingFlatFee);

  return {
    items: lines.map((l) => l.view),
    hasIssues: lines.some((l) => l.view.issue),
    summary: {
      itemCount: billable.reduce((s, l) => s + l.view.quantity, 0),
      subtotal: fromPaise(subtotalPaise),
      mrpTotal: fromPaise(mrpTotalPaise),
      savings: fromPaise(mrpTotalPaise - subtotalPaise),
      couponCode: cart?.coupon?.code ?? null,
      couponDiscount: fromPaise(couponDiscountPaise),
      couponError,
      shippingFee: fromPaise(shippingPaise),
      total: fromPaise(afterCouponPaise + shippingPaise),
    },
  };
}

export async function getCurrentCartView() {
  const session = await getSession();
  return priceCart(await findCurrentCart(), session?.user.id);
}

async function loadSellableVariant(variantId: string) {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: { select: { isPublished: true, name: true } } },
  });
  if (!variant || !variant.product.isPublished) throw notFound("This product is no longer available");
  if (!variant.isAvailable || variant.stock <= 0) throw badRequest("This item is out of stock", "OUT_OF_STOCK");
  return variant;
}

function assertQuantity(quantity: number, stock: number) {
  if (quantity > STORE_CONFIG.maxQuantityPerItem) {
    throw badRequest(`You can add up to ${STORE_CONFIG.maxQuantityPerItem} of an item`, "MAX_QUANTITY");
  }
  if (quantity > stock) {
    throw badRequest(`Only ${stock} left in stock`, "INSUFFICIENT_STOCK");
  }
}

export async function addItem(variantId: string, quantity: number) {
  const variant = await loadSellableVariant(variantId);
  const cart = await getOrCreateCart();
  const existing = cart.items.find((i) => i.variantId === variantId);
  const newQuantity = (existing?.quantity ?? 0) + quantity;
  assertQuantity(newQuantity, variant.stock);

  await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    update: { quantity: newQuantity },
    create: { cartId: cart.id, variantId, quantity: newQuantity },
  });
  const session = await getSession();
  return priceCart(await reload(cart.id), session?.user.id);
}

export async function updateItem(itemId: string, quantity: number) {
  const cart = await getOrCreateCart();
  const item = cart.items.find((i) => i.id === itemId);
  if (!item) throw notFound("Item not found in your bag");
  assertQuantity(quantity, item.variant.stock);
  await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
  const session = await getSession();
  return priceCart(await reload(cart.id), session?.user.id);
}

export async function removeItem(itemId: string) {
  const cart = await getOrCreateCart();
  // deleteMany scoped to this cart: can't remove items from someone else's cart.
  await prisma.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
  const session = await getSession();
  return priceCart(await reload(cart.id), session?.user.id);
}

export async function applyCoupon(code: string) {
  const coupon = await findCouponByCode(code);
  const cart = await getOrCreateCart();
  const session = await getSession();

  // Validate against the current bag before attaching; throws a customer-facing reason.
  const priced = await priceCart({ ...cart, coupon: null, couponId: null }, session?.user.id);
  if (priced.summary.itemCount === 0) throw badRequest("Add items to your bag before applying a coupon");
  await evaluateCoupon(coupon, {
    subtotalPaise: toPaise(priced.summary.subtotal),
    mrpTotalPaise: toPaise(priced.summary.mrpTotal),
    userId: session?.user.id,
  });

  await prisma.cart.update({ where: { id: cart.id }, data: { couponId: coupon.id } });
  return priceCart(await reload(cart.id), session?.user.id);
}

export async function removeCoupon() {
  const cart = await getOrCreateCart();
  await prisma.cart.update({ where: { id: cart.id }, data: { couponId: null } });
  const session = await getSession();
  return priceCart(await reload(cart.id), session?.user.id);
}

/**
 * Move the guest cart (cookie) into the signed-in user's cart. Quantities for the same
 * variant are summed and clamped to stock / per-item max. Called right after sign-in.
 */
export async function mergeGuestCart(userId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get(CART_COOKIE_NAME)?.value;
  if (!token) return;
  cookieStore.delete(CART_COOKIE_NAME);

  const guest = await prisma.cart.findUnique({ where: { sessionId: sha256(token) }, include: cartInclude });
  if (!guest) return;

  await prisma.$transaction(async (tx) => {
    const userCart = await tx.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
      include: { items: true },
    });
    for (const item of guest.items) {
      const current = userCart.items.find((i) => i.variantId === item.variantId)?.quantity ?? 0;
      const quantity = Math.min(current + item.quantity, STORE_CONFIG.maxQuantityPerItem, Math.max(item.variant.stock, 1));
      await tx.cartItem.upsert({
        where: { cartId_variantId: { cartId: userCart.id, variantId: item.variantId } },
        update: { quantity },
        create: { cartId: userCart.id, variantId: item.variantId, quantity },
      });
    }
    if (!userCart.couponId && guest.couponId) {
      await tx.cart.update({ where: { id: userCart.id }, data: { couponId: guest.couponId } });
    }
    await tx.cart.delete({ where: { id: guest.id } });
  });
}

/** Signed-in user's cart, for checkout. */
export async function getUserCart(userId: string) {
  return prisma.cart.findUnique({ where: { userId }, include: cartInclude });
}
