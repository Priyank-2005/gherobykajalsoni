/**
 * Simple in-memory rate limiter for API routes.
 * For production at scale, consider using Redis-based rate limiting.
 *
 * Uses a sliding window approach to track request counts per key.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (entry.resetAt < now) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface RateLimitOptions {
  /** Unique key for the rate limit (e.g., email, IP) */
  key: string;
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Time window in seconds */
  windowSeconds: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check and enforce rate limiting.
 *
 * @example
 * const result = rateLimit({ key: `otp:${email}`, limit: 5, windowSeconds: 3600 });
 * if (!result.success) {
 *   return Response.json({ error: "Too many requests" }, { status: 429 });
 * }
 */
export function rateLimit({ key, limit, windowSeconds }: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const prefixedKey = `rl:${key}`;

  const entry = rateLimitMap.get(prefixedKey);

  if (!entry || entry.resetAt < now) {
    // New window
    const resetAt = now + windowMs;
    rateLimitMap.set(prefixedKey, { count: 1, resetAt });
    return { success: true, remaining: limit - 1, resetAt };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { success: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}
