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

/**
 * Image/video source that next/image can render: a site path ("/images/...") or an https URL on an
 * allowed media host (keep in sync with images.remotePatterns in next.config.ts).
 */
const MEDIA_HOSTS = ["res.cloudinary.com", "images.unsplash.com"];
export const mediaSrc = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => {
    if (/^\/(?!\/)/.test(v)) return true;
    try {
      const u = new URL(v);
      return u.protocol === "https:" && MEDIA_HOSTS.includes(u.hostname);
    } catch {
      return false;
    }
  }, "Upload the file, or use a site path like /images/...");
