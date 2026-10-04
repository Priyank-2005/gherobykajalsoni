import { v2 as cloudinary } from "cloudinary";

/**
 * Cloudinary configuration.
 * Used for all media uploads: product images, videos, banners, category images, reels.
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

/**
 * Cloudinary folder for each kind of upload. Size / type rules and image resizing are in
 * services/media.service.ts (uploads go from the browser straight to Cloudinary, signed by us).
 */
export const uploadPresets = {
  productImage: { folder: "ghero/products" },
  productVideo: { folder: "ghero/videos" },
  categoryImage: { folder: "ghero/categories" },
  heroImage: { folder: "ghero/hero" },
  heroMobileImage: { folder: "ghero/hero" },
  reelMedia: { folder: "ghero/reels" },
  testimonialImage: { folder: "ghero/testimonials" },
} as const;
