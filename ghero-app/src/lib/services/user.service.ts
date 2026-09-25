import { prisma } from "@/lib/db";
import { conflict, notFound } from "@/lib/api";
import { toNumber } from "@/lib/money";
import type { UpdateProfileInput } from "@/lib/validations/user";
import { consumeOtp, sendOtp } from "./auth.service";

/** Orders that count toward "total spent" (paid or later, not cancelled). */
export const PAID_STATUSES = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] as const;

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true },
  });
  if (!user) throw notFound("User not found");
  const agg = await prisma.order.aggregate({
    where: { userId, status: { in: [...PAID_STATUSES] } },
    _count: true,
    _sum: { total: true },
  });
  return {
    ...user,
    createdAt: user.createdAt.toISOString(),
    totalOrders: agg._count,
    totalSpent: toNumber(agg._sum.total),
  };
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  return prisma.user.update({
    where: { id: userId },
    data: input,
    select: { id: true, email: true, name: true, phone: true, role: true },
  });
}

/** Step 1 of an email change: send a code to the NEW address to prove ownership. */
export async function requestEmailChange(userId: string, newEmail: string) {
  const taken = await prisma.user.findUnique({ where: { email: newEmail }, select: { id: true } });
  if (taken && taken.id !== userId) throw conflict("That email is already linked to another account");
  if (taken) throw conflict("That's already your email address");
  return sendOtp(newEmail);
}

/** Step 2: verify the code, then switch the email. */
export async function confirmEmailChange(userId: string, newEmail: string, otp: string) {
  await consumeOtp(newEmail, otp);
  const taken = await prisma.user.findUnique({ where: { email: newEmail }, select: { id: true } });
  if (taken) throw conflict("That email is already linked to another account");
  return prisma.user.update({
    where: { id: userId },
    data: { email: newEmail },
    select: { id: true, email: true, name: true, phone: true, role: true },
  });
}
