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
 * Upload options for different media types.
 */
export const uploadPresets = {
  productImage: {
    folder: "ghero/products",
    transformation: [
      { width: 1200, height: 1600, crop: "limit", quality: "auto:good" },
    ],
  },
  productVideo: {
    folder: "ghero/videos",
    resource_type: "video" as const,
  },
  categoryImage: {
    folder: "ghero/categories",
    transformation: [
      { width: 800, height: 800, crop: "fill", quality: "auto:good" },
    ],
  },
  heroImage: {
    folder: "ghero/hero",
    transformation: [
      { width: 1920, height: 1080, crop: "limit", quality: "auto:good" },
    ],
  },
  heroMobileImage: {
    folder: "ghero/hero",
    transformation: [
      { width: 768, height: 1024, crop: "limit", quality: "auto:good" },
    ],
  },
  reelMedia: {
    folder: "ghero/reels",
  },
  testimonialImage: {
    folder: "ghero/testimonials",
    transformation: [
      { width: 200, height: 200, crop: "fill", quality: "auto:good" },
    ],
  },
} as const;
