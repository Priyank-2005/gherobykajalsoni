import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Prisma client singleton.
 * In development, we store the client on globalThis to prevent
 * multiple instances during hot-reloading.
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // The DB may be a remote region (e.g. Neon us-east-1 from India, ~250ms/round-trip);
    // the 5s default is too tight for multi-step order/payment transactions.
    transactionOptions: { maxWait: 10_000, timeout: 20_000 },
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
