import { cache } from "react";
import { prisma } from "@/lib/db";
import type { StoreSettingsInput } from "@/lib/validations/pos";

/** Store details printed on shop bills (single row, created with dummy values by the POS migration). */
export const getStoreSettings = cache(async () => {
  const existing = await prisma.storeSettings.findUnique({ where: { id: "store" } });
  return existing ?? prisma.storeSettings.upsert({ where: { id: "store" }, update: {}, create: { id: "store" } });
});

export async function updateStoreSettings(input: StoreSettingsInput) {
  return prisma.storeSettings.upsert({ where: { id: "store" }, update: input, create: { id: "store", ...input } });
}

/** One-line shop address for bills, e.g. "Shop 1, Market Road, Jaipur, Rajasthan 302001". */
export function formatStoreAddress(s: { addressLine: string; city: string; state: string; pincode: string }) {
  return [s.addressLine, s.city, [s.state, s.pincode].filter(Boolean).join(" ")].filter(Boolean).join(", ");
}
