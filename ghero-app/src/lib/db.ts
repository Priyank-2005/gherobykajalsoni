import { Prisma, PrismaClient } from "@prisma/client";

// Connection-level failures a serverless Postgres (Neon) produces when it scales to zero or
// recycles pooled connections: can't reach / timed out / server closed the connection / pool timeout.
const RETRYABLE_CODES = new Set(["P1001", "P1002", "P1017", "P2024"]);
// Only reads are retried automatically; a write might have committed before the connection dropped.
const READ_OPERATIONS = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
]);

function isRetryable(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) return RETRYABLE_CODES.has(error.code);
  if (error instanceof Prisma.PrismaClientInitializationError) return RETRYABLE_CODES.has(error.errorCode ?? "");
  return false;
}

function createClient() {
  const client = new PrismaClient({
    // The DB may be a remote region (e.g. Neon us-east-1 from India, ~250ms/round-trip);
    // the 5s default is too tight for multi-step order/payment transactions.
    transactionOptions: { maxWait: 10_000, timeout: 20_000 },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  return client.$extends({
    query: {
      async $allOperations({ operation, args, query }) {
        try {
          return await query(args);
        } catch (error) {
          if (!READ_OPERATIONS.has(operation) || !isRetryable(error)) throw error;
          // One retry after a short pause: covers a dropped pooled connection or a DB waking up.
          await new Promise((r) => setTimeout(r, 500));
          return query(args);
        }
      },
    },
  });
}

type Client = ReturnType<typeof createClient>;

/** Transaction client handed to `prisma.$transaction(async (tx) => ...)`. */
export type Tx = Omit<Client, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;
/** Either the root client or a transaction client (for helpers usable in both). */
export type Db = Client | Tx;

const globalForPrisma = globalThis as unknown as { prisma: Client | undefined };

/**
 * Prisma client singleton.
 * In development, we store the client on globalThis to prevent
 * multiple instances during hot-reloading.
 */
export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
