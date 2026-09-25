import { z } from "zod";
import { linkOrPath, mediaSrc } from "./common";

// Internal path ("/shop") or absolute http(s) URL. Blocks javascript:/data: links.
const link = linkOrPath;

const optionalLink = link.optional().nullable();
const order = z.number().int().min(0).optional();
const visible = z.boolean().optional();
const mediaUrl = mediaSrc;

export const heroSchema = z.object({
  imageUrl: mediaUrl,
  imageCloudinaryId: z.string().min(1),
  mobileImageUrl: mediaUrl.optional().nullable(),
  mobileCloudinaryId: z.string().optional().nullable(),
  heading: z.string().trim().min(1).max(150),
  subheading: z.string().trim().max(300).optional().nullable(),
  ctaText: z.string().trim().max(50).optional().nullable(),
  ctaUrl: optionalLink,
  secondaryCtaText: z.string().trim().max(50).optional().nullable(),
  secondaryCtaUrl: optionalLink,
  displayOrder: order,
  isVisible: visible,
});

export const homepageCategorySchema = z.object({
  categoryId: z.string().optional().nullable(),
  name: z.string().trim().min(1).max(100),
  imageUrl: mediaUrl,
  cloudinaryId: z.string().min(1),
  link,
  displayOrder: order,
  isVisible: visible,
});

export const reelSchema = z.object({
  mediaUrl,
  cloudinaryId: z.string().min(1),
  mediaType: z.enum(["image", "video"]),
  thumbnail: mediaUrl.optional().nullable(),
  caption: z.string().trim().max(150).optional().nullable(),
  productId: z.string().optional().nullable(),
  link: optionalLink,
  displayOrder: order,
  isVisible: visible,
});

export const testimonialSchema = z.object({
  customerName: z.string().trim().min(1).max(100),
  review: z.string().trim().min(1).max(2000),
  rating: z.number().int().min(1).max(5).optional(),
  imageUrl: mediaUrl.optional().nullable(),
  cloudinaryId: z.string().optional().nullable(),
  productName: z.string().trim().max(150).optional().nullable(),
  displayOrder: order,
  isVisible: visible,
});

export type HeroInput = z.infer<typeof heroSchema>;
export type HomepageCategoryInput = z.infer<typeof homepageCategorySchema>;
export type ReelInput = z.infer<typeof reelSchema>;
export type TestimonialInput = z.infer<typeof testimonialSchema>;
