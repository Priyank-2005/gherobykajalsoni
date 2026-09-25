/**
 * Cart types for client-side use. Money values are rupees, computed server-side.
 */
export type CartLineIssue = "UNAVAILABLE" | "OUT_OF_STOCK" | "INSUFFICIENT_STOCK";

export interface CartItemInfo {
  id: string;
  variantId: string;
  quantity: number;
  product: {
    name: string;
    slug: string;
    imageUrl: string | null;
  };
  variant: {
    sku: string;
    size: string | null;
    color: string | null;
    price: number;
    mrp: number;
    stock: number;
  };
  lineTotal: number;
  issue: CartLineIssue | null;
}

export interface CartSummary {
  itemCount: number; // total units
  subtotal: number; // selling price total
  mrpTotal: number;
  savings: number; // MRP - selling price
  couponCode: string | null;
  couponDiscount: number;
  couponError: string | null; // coupon attached but no longer applicable
  shippingFee: number;
  total: number;
}

export interface CartResponse {
  items: CartItemInfo[];
  summary: CartSummary;
  hasIssues: boolean;
}
