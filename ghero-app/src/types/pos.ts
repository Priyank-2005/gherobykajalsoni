/** Shared POS types (server responses used by client screens). Money is in rupees. */

export type PosRoleType = "CASHIER" | "MANAGER" | "OWNER";
export type PaymentMethodType = "CASH" | "UPI" | "CARD";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodType, string> = { CASH: "Cash", UPI: "UPI", CARD: "Card" };
export const POS_ROLE_LABELS: Record<PosRoleType, string> = { OWNER: "Owner", MANAGER: "Manager", CASHIER: "Cashier" };

/** One sellable size/colour, as cached on the POS device for instant scanning. */
export interface CatalogVariant {
  id: string;
  productId: string;
  barcode: string;
  codes: string[]; // supplier barcodes that also identify this variant
  sku: string;
  name: string;
  size: string | null;
  color: string | null;
  price: number;
  mrp: number;
  stock: number;
  imageUrl: string | null;
}

export interface BillQuote {
  lines: {
    variantId: string;
    name: string;
    size: string | null;
    color: string | null;
    sku: string;
    barcode: string;
    imageUrl: string | null;
    unitPrice: number;
    unitMrp: number;
    quantity: number;
    discount: number;
    lineTotal: number; // after the line discount
    stock: number;
  }[];
  itemCount: number;
  subtotal: number; // selling price x qty, before any discount
  mrpSavings: number;
  couponCode: string | null;
  couponDiscount: number;
  couponError: string | null;
  manualDiscount: number; // line discounts + bill discount
  manualPercent: number;
  maxDiscountPercent: number; // the signed-in staff member's limit
  needsApproval: boolean;
  roundOff: number;
  total: number;
  stockIssues: string[];
}

export interface BillView {
  id: string;
  billNumber: string;
  status: "DELIVERED" | "CANCELLED" | string;
  createdAt: string;
  cancelledAt: string | null;
  cancelReason: string | null;
  customer: { name: string | null; phone: string; email: string | null };
  cashier: string | null;
  approvedBy: string | null;
  items: { id: string; name: string; sku: string; size: string | null; color: string | null; quantity: number; unitPrice: number; unitMrp: number; discount: number; lineTotal: number }[];
  subtotal: number;
  mrpSavings: number;
  couponCode: string | null;
  couponDiscount: number;
  manualDiscount: number;
  roundOff: number;
  total: number;
  payments: { method: PaymentMethodType; amount: number; tendered: number | null; reference: string | null }[];
  registerOpen: boolean;
}

export interface StoreInfo {
  storeName: string;
  address: string;
  phone: string;
  email: string;
  gstin: string | null;
  billFooter: string;
}
