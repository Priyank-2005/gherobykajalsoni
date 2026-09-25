import { z } from "zod";

/**
 * Absolute http(s) URL. Zod 4's `.url()` accepts any WHATWG URL, including `javascript:`
 * and `data:`, so anything rendered as a link or media src must use this instead.
 */
export const httpUrl = z
  .string()
  .trim()
  .max(2000)
  .url("Please enter a valid URL")
  .refine((v) => /^https?:\/\//i.test(v), "URL must start with http:// or https://");

/** Site-relative path ("/shop", not "//evil.com") or absolute http(s) URL. */
export const linkOrPath = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => /^\/(?!\/)/.test(v) || /^https?:\/\//i.test(v), "Link must start with / or http(s)://");
