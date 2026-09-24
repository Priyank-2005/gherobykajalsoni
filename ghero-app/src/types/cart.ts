/**
 * Cart types for client-side use.
 */
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
    isAvailable: boolean;
  };
}

export interface CartSummary {
  subtotal: number;
  discount: number;
  couponCode: string | null;
  couponDiscount: number;
  total: number;
  itemCount: number;
}

export interface CartResponse {
  items: CartItemInfo[];
  summary: CartSummary;
}
