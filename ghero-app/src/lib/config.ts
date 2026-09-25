/**
 * Store-wide business settings. Money values are rupees.
 */
export const STORE_CONFIG = {
  /** Orders at or above this subtotal (after coupon) ship free. */
  freeShippingThreshold: 5000,
  /** Flat shipping fee below the threshold. 0 = always free (current storefront copy says free shipping). */
  shippingFlatFee: Number(process.env.SHIPPING_FLAT_FEE ?? 0),
  /** Max units of a single variant per cart line. */
  maxQuantityPerItem: 10,
  /** Max saved addresses per customer. */
  maxAddresses: 10,
} as const;
