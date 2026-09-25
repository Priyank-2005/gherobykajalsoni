import type { Prisma } from "@prisma/client";

/**
 * Money helpers. All arithmetic is done in integer paise to avoid float drift,
 * then converted back to rupees (2 dp) for storage / API responses.
 */
type DecimalLike = Prisma.Decimal | number | string;

export function toNumber(value: DecimalLike | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return typeof value === "number" ? value : Number(value.toString());
}

export function toPaise(value: DecimalLike): number {
  return Math.round(toNumber(value) * 100);
}

export function fromPaise(paise: number): number {
  return Math.round(paise) / 100;
}
