import { handle } from "./api";
import { requireAdmin } from "./auth";

/**
 * Wrap an admin route handler: requires an ADMIN session before the handler runs,
 * so no admin route can forget the check. Errors map to JSON like `handle()`.
 */
export function adminRoute<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return handle(async (...args: A) => {
    await requireAdmin();
    return fn(...args);
  });
}

/** Parse a positive integer query param with a fallback. */
export function intParam(value: string | null, fallback: number, max = 1000) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 ? Math.min(n, max) : fallback;
}
