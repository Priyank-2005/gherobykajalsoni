import { prisma } from "@/lib/db";
import { badRequest, notFound } from "@/lib/api";
import { STORE_CONFIG } from "@/lib/config";
import type { AddressInput, UpdateAddressInput } from "@/lib/validations/address";

export async function listAddresses(userId: string) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}

export async function getAddress(userId: string, id: string) {
  const address = await prisma.address.findFirst({ where: { id, userId } });
  if (!address) throw notFound("Address not found");
  return address;
}

/** The first address a user saves becomes their default. */
export async function createAddress(userId: string, input: AddressInput) {
  const count = await prisma.address.count({ where: { userId } });
  if (count >= STORE_CONFIG.maxAddresses) {
    throw badRequest(`You can save up to ${STORE_CONFIG.maxAddresses} addresses. Please delete one first.`);
  }
  const isDefault = input.isDefault || count === 0;
  return prisma.$transaction(async (tx) => {
    if (isDefault) await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    return tx.address.create({ data: { ...input, isDefault, userId } });
  });
}

export async function updateAddress(userId: string, id: string, input: UpdateAddressInput) {
  await getAddress(userId, id);
  return prisma.$transaction(async (tx) => {
    if (input.isDefault) await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    // Unsetting the only default is ignored; there must always be one default.
    const { isDefault, ...rest } = input;
    return tx.address.update({ where: { id }, data: { ...rest, ...(isDefault ? { isDefault: true } : {}) } });
  });
}

/** Deleting the default promotes the most recent remaining address. Past orders keep their snapshot. */
export async function deleteAddress(userId: string, id: string) {
  const address = await getAddress(userId, id);
  await prisma.$transaction(async (tx) => {
    await tx.address.delete({ where: { id } });
    if (address.isDefault) {
      const next = await tx.address.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } });
      if (next) await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  });
}
