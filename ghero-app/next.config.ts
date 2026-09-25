import type { NextConfig } from "next";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Product / category / CMS media uploaded via the admin (scoped to our Cloudinary account when configured).
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: cloudName && !cloudName.startsWith("your-") ? `/${cloudName}/**` : "/**",
      },
      // Stock imagery used on the About page.
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
