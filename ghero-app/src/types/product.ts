/**
 * Public-facing product types (safe to send to the client). All money values are rupees.
 */

export interface CategoryRef {
  id: string;
  name: string;
  slug: string;
}

export type SubcategoryInfo = CategoryRef;

export interface CategoryWithSubcategories extends CategoryRef {
  image: string | null;
  subcategories: SubcategoryInfo[];
}

/** Shape rendered by <ProductCard>. */
export interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  category: CategoryRef;
  subcategory: SubcategoryInfo | null;
  images: string[];
  basePrice: number;
  baseMrp: number;
  discount: number; // percentage
  isBestseller: boolean;
  isNewArrival: boolean;
  inStock: boolean;
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
}

export interface ProductVideoInfo {
  id: string;
  url: string;
  thumbnail: string | null;
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
  category: CategoryRef;
  subcategory: SubcategoryInfo | null;
  variants: ProductVariantInfo[];
  images: ProductImageInfo[];
  videos: ProductVideoInfo[];
  isBestseller: boolean;
  isNewArrival: boolean;
}

export const PRODUCT_SORT_OPTIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "newest", label: "Newest First" },
  { value: "price_low_to_high", label: "Price: Low to High" },
  { value: "price_high_to_low", label: "Price: High to Low" },
  { value: "bestseller", label: "Bestsellers" },
  { value: "discount", label: "Discount" },
] as const;

export type ProductSortOption = (typeof PRODUCT_SORT_OPTIONS)[number]["value"];

export interface ProductFilters {
  category?: string; // slug
  subcategory?: string; // slug, scoped to `category`
  minPrice?: number;
  maxPrice?: number;
  sizes?: string[];
  colors?: string[];
  inStock?: boolean;
  minDiscount?: number; // percentage
  search?: string;
}

export interface ProductFacets {
  categories: { slug: string; name: string; count: number }[];
  /** Subcategories of the selected category (empty when no category is selected). */
  subcategories: { slug: string; name: string; count: number }[];
  sizes: string[];
  colors: { name: string; hex: string }[];
  priceRange: { min: number; max: number };
}

export interface ProductListResponse {
  products: ProductCardData[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  facets: ProductFacets;
}
