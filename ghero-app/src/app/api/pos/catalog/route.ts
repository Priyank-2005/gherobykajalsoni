import { ok } from "@/lib/api";
import { posRoute } from "@/lib/pos-api";
import { posCatalog } from "@/lib/services/stock.service";

/** All variants with barcodes; the POS caches this so scans resolve instantly. */
export const GET = posRoute("CASHIER", async () => ok({ variants: await posCatalog(), fetchedAt: new Date().toISOString() }));
