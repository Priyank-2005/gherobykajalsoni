/**
 * Order types for client-side use.
 */
export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatusType;
  total: number;
  itemCount: number;
  createdAt: string;
  trackingUrl: string | null;
}

export interface OrderDetail {
  id: string;
  orderNumber: string;
  status: OrderStatusType;
  subtotal: number;
  discount: number;
  couponCode: string | null;
  couponDiscount: number;
  total: number;
  trackingUrl: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItemInfo[];
  shipping: OrderShippingInfo;
  payment: OrderPaymentInfo | null;
}

export interface OrderItemInfo {
  id: string;
  productName: string;
  productSlug: string;
  sku: string;
  size: string | null;
  color: string | null;
  quantity: number;
  unitPrice: number;
  unitMrp: number;
  imageUrl: string | null;
}

export interface OrderShippingInfo {
  name: string;
  phone: string;
  email: string;
  address1: string;
  address2: string | null;
  area: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface OrderPaymentInfo {
  razorpayPaymentId: string | null;
  amount: number;
  currency: string;
  status: string;
}

export type OrderStatusType =
  | "PENDING_PAYMENT"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export const ORDER_STATUS_LABELS: Record<OrderStatusType, string> = {
  PENDING_PAYMENT: "Pending Payment",
  PAID: "Paid",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export const ORDER_STATUS_COLORS: Record<OrderStatusType, string> = {
  PENDING_PAYMENT: "bg-yellow-100 text-yellow-800",
  PAID: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-indigo-100 text-indigo-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};
