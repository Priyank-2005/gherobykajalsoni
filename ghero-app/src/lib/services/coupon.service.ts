import type { Coupon } from "@prisma/client";
import { prisma, type Db } from "@/lib/db";
import { badRequest, notFound } from "@/lib/api";
import { fromPaise, toNumber, toPaise } from "@/lib/money";
import { formatPrice } from "@/lib/utils";
import type { CreateCouponInput, UpdateCouponInput } from "@/lib/validations/coupon";


export interface CouponContext {
  subtotalPaise: number; // selling-price total
  mrpTotalPaise: number;
  userId?: string | null; // per-user limit only checked when known (always at checkout)
}

/**
 * Validate a coupon against the current cart and compute its discount in paise.
 * Throws AppError(400) with a customer-facing reason when not applicable.
 */
export async function evaluateCoupon(coupon: Coupon, ctx: CouponContext, db: Db = prisma): Promise<number> {
  const now = new Date();
  if (!coupon.isActive) throw badRequest("This coupon is no longer active", "COUPON_INACTIVE");
  if (coupon.startsAt && coupon.startsAt > now) throw badRequest("This coupon is not active yet", "COUPON_NOT_STARTED");
  if (coupon.expiresAt && coupon.expiresAt <= now) throw badRequest("This coupon has expired", "COUPON_EXPIRED");

  if (coupon.minCartValue && ctx.subtotalPaise < toPaise(coupon.minCartValue)) {
    throw badRequest(
      `Add items worth ${formatPrice(toNumber(coupon.minCartValue) - fromPaise(ctx.subtotalPaise))} more to use this coupon`,
      "COUPON_MIN_CART"
    );
  }

  if (coupon.maxUsage !== null) {
    const used = await db.couponUsage.count({ where: { couponId: coupon.id } });
    if (used >= coupon.maxUsage) throw badRequest("This coupon has reached its usage limit", "COUPON_EXHAUSTED");
  }

  if (ctx.userId && coupon.perUserLimit !== null) {
    const usedByUser = await db.couponUsage.count({ where: { couponId: coupon.id, userId: ctx.userId } });
    if (usedByUser >= coupon.perUserLimit) {
      throw badRequest("You've already used this coupon", "COUPON_USER_LIMIT");
    }
  }

  let discount: number;
  if (coupon.type === "PERCENTAGE") {
    const base = coupon.applyOn === "MRP" ? ctx.mrpTotalPaise : ctx.subtotalPaise;
    discount = Math.round((base * toNumber(coupon.discountValue)) / 100);
    if (coupon.maxDiscount) discount = Math.min(discount, toPaise(coupon.maxDiscount));
  } else {
    discount = toPaise(coupon.discountValue);
  }
  // Never discount below zero.
  return Math.max(0, Math.min(discount, ctx.subtotalPaise));
}

export async function findCouponByCode(code: string) {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!coupon) throw badRequest("This coupon code is not valid", "COUPON_NOT_FOUND");
  return coupon;
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

function toDates(input: { startsAt?: string | null; expiresAt?: string | null }) {
  return {
    ...(input.startsAt !== undefined ? { startsAt: input.startsAt ? new Date(input.startsAt) : null } : {}),
    ...(input.expiresAt !== undefined ? { expiresAt: input.expiresAt ? new Date(input.expiresAt) : null } : {}),
  };
}

export async function adminListCoupons() {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { usages: true } } },
  });
  return coupons.map(({ _count, ...c }) => ({ ...c, usageCount: _count.usages }));
}

export async function createCoupon(input: CreateCouponInput) {
  return prisma.coupon.create({ data: { ...input, ...toDates(input) } });
}

export async function updateCoupon(id: string, input: UpdateCouponInput) {
  if (input.type === "PERCENTAGE" || input.discountValue !== undefined) {
    const current = await prisma.coupon.findUnique({ where: { id } });
    if (!current) throw notFound("Coupon not found");
    const type = input.type ?? current.type;
    const value = input.discountValue ?? toNumber(current.discountValue);
    if (type === "PERCENTAGE" && (value < 1 || value > 100)) {
      throw badRequest("Percentage discount must be between 1 and 100");
    }
  }
  return prisma.coupon.update({ where: { id }, data: { ...input, ...toDates(input) } });
}

/** Coupons that have been redeemed are deactivated instead of deleted, to keep usage history. */
export async function deleteCoupon(id: string) {
  const used = await prisma.couponUsage.count({ where: { couponId: id } });
  if (used > 0) {
    await prisma.coupon.update({ where: { id }, data: { isActive: false } });
    return { deleted: false, deactivated: true };
  }
  await prisma.coupon.delete({ where: { id } });
  return { deleted: true, deactivated: false };
}
