import { Decimal } from "@prisma/client/runtime/library";

/**
 * Public-facing product types (safe to send to client).
 */
export interface ProductCard {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  baseMrp: number;
  categoryName: string;
  categorySlug: string;
  imageUrl: string | null;
  isBestseller: boolean;
  isNewArrival: boolean;
  discount: number; // Calculated percentage
  hasVariants: boolean;
  minPrice: number;
  maxPrice: number;
}

export interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  fabric: string | null;
  careInstructions: string | null;
  sizeGuide: string | null;
  basePrice: number;
  baseMrp: number;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  variants: ProductVariantInfo[];
  images: ProductImageInfo[];
  videos: ProductVideoInfo[];
  isBestseller: boolean;
  isNewArrival: boolean;
}

export interface ProductVariantInfo {
  id: string;
  sku: string;
  size: string | null;
  color: string | null;
  colorHex: string | null;
  price: number;
  mrp: number;
  stock: number;
  isAvailable: boolean;
}

export interface ProductImageInfo {
  id: string;
  url: string;
  alt: string | null;
  displayOrder: number;
}

export interface ProductVideoInfo {
  id: string;
  url: string;
  thumbnail: string | null;
  displayOrder: number;
}

/**
 * Product listing filters.
 */
export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sizes?: string[];
  colors?: string[];
  availability?: "in_stock" | "all";
  discount?: number; // Minimum discount percentage
  search?: string;
}

export type ProductSortOption =
  | "recommended"
  | "newest"
  | "price_low_to_high"
  | "price_high_to_low"
  | "bestseller"
  | "discount";

export interface ProductListResponse {
  products: ProductCard[];
  total: number;
  page: number;
  totalPages: number;
  filters: {
    categories: { slug: string; name: string; count: number }[];
    sizes: string[];
    colors: { name: string; hex: string }[];
    priceRange: { min: number; max: number };
  };
}
