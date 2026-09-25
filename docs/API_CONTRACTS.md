# API Contracts

This matches the implementation in `ghero-app/src/app/api`. All money values are **rupees** (numbers, 2 dp), always computed on the server.

## Conventions

**Errors.** Every error is JSON:

```json
{ "error": "Customer-facing message", "code": "ERROR_CODE", "issues": [{ "path": "address.pincode", "message": "..." }] }
```

`issues` is present only for validation errors (`code: "VALIDATION_ERROR"`).

| Status | Meaning |
| --- | --- |
| 400 | Validation error / business rule (e.g. `INSUFFICIENT_STOCK`, `COUPON_EXPIRED`, `OTP_INVALID`) |
| 401 | Not signed in (`UNAUTHORIZED`) |
| 403 | Signed in but not allowed (`FORBIDDEN`), or cross-origin mutation (`BAD_ORIGIN`) |
| 404 | Not found (also used for resources owned by someone else, to avoid leaking existence) |
| 409 | Conflict (`DUPLICATE`, `CART_ISSUES`, `STOCK_CONFLICT`, category still has products) |
| 429 | Rate limited (`RATE_LIMITED`) |
| 503 | Integration not configured (`PAYMENTS_DISABLED`, `MEDIA_DISABLED`) |

**Auth.** An HTTP-only `ghero_session` cookie (30 days; only a SHA-256 of the token is stored). Guests get an HTTP-only `ghero_cart` cookie for their bag, which is merged into the account bag on sign-in.

**CSRF.** `proxy.ts` rejects `POST/PUT/PATCH/DELETE` to `/api/*` whose `Origin` header is not this site (the webhook is exempt; it is authenticated by signature).

---

## Catalog (public)

### GET `/api/products`

Query (all optional; invalid values are ignored):

| Param | Example | Notes |
| --- | --- | --- |
| `category` | `sarees` | category slug |
| `sub` | `banarasi` | subcategory slug (with `category`) |
| `q` | `silk` | name, description, fabric, category, subcategory, SKU, colour |
| `minPrice`, `maxPrice` | `5000` | on product base price |
| `sizes` | `S,M` | comma-separated, any variant matches |
| `colors` | `Maroon,Teal` | comma-separated |
| `inStock` | `1` | only products with a sellable variant |
| `minDiscount` | `30` | % off MRP |
| `sort` | `recommended` \| `newest` \| `price_low_to_high` \| `price_high_to_low` \| `bestseller` \| `discount` | |
| `page`, `pageSize` | `2`, `12` | pageSize max 48 |

Response: `{ products: ProductCardData[], total, page, pageSize, totalPages, facets: { categories[{slug,name,count}], sizes[], colors[{name,hex}], priceRange{min,max} } }`. Facets reflect the category/sub/search scope, ignoring the attribute filters.

### GET `/api/products/[slug]`
`{ product: ProductDetail, related: ProductCardData[] }`. Only published products.

### GET `/api/categories`
`{ categories: [{ id, name, slug, image, subcategories: [{ id, name, slug }] }] }` (visible only, ordered).

### GET `/api/categories/[slug]`
`{ category: { id, name, slug, description, image, subcategories[] } }`

### GET `/api/search?q=...&suggest=1`
Autocomplete: `{ products: [{ name, slug, price, imageUrl }], categories: [{ label, href }] }` (categories include matching subcategories). Without `suggest=1` the response is the same as `/api/products` (all its filters apply).

### GET `/api/homepage`
`{ hero[], categories[], reels[], testimonials[], newArrivals[], bestsellers[] }` (visible items, in display order).

### POST `/api/contact`
Body `{ name, email, phone?, message }`. Emails the store (`STORE_CONTACT_EMAIL`, Reply-To = customer). 5 per IP per hour.

---

## Auth

### POST `/api/auth/send-otp`
Body `{ email }` → `{ isNewUser, resendAfterSeconds, expiresInSeconds }`.
Limits: 30 s cooldown and 5 codes/hour per email (DB-enforced), 20/hour per IP. Codes: 6 digits (CSPRNG), bcrypt-hashed, 5-minute expiry; sending a new code supersedes the old one.

### POST `/api/auth/verify-otp`
Body `{ email, otp, name?, phone? }` → `{ user, isNewUser }` and sets the session cookie.
Max 5 attempts per code; codes are single-use. New emails create an account (with `name`/`phone` from checkout); existing emails are recognised, never duplicated. The guest bag is merged into the account.

### POST `/api/auth/logout`
Deletes the session → `{ success: true }`.

### GET `/api/auth/session`
`{ isAuthenticated: true, user }` or `{ isAuthenticated: false, user: null }`.

---

## Cart (guest or signed in)

Every cart endpoint returns the full priced cart:

```ts
{
  items: [{ id, variantId, quantity, product{name,slug,imageUrl}, variant{sku,size,color,price,mrp,stock}, lineTotal,
            issue: null | "UNAVAILABLE" | "OUT_OF_STOCK" | "INSUFFICIENT_STOCK" }],
  summary: { itemCount, subtotal, mrpTotal, savings, couponCode, couponDiscount, couponError, shippingFee, total },
  hasIssues: boolean
}
```

Lines with an `issue` are shown but excluded from totals. `couponError` is set when an attached coupon no longer applies.

| Method | Path | Body |
| --- | --- | --- |
| GET | `/api/cart` | none |
| POST | `/api/cart/add` | `{ variantId, quantity }` (adds to the existing quantity; max 10 per line, never above stock) |
| PUT | `/api/cart/update` | `{ itemId, quantity }` |
| DELETE | `/api/cart/remove` | `{ itemId }` |
| POST | `/api/cart/coupon` | `{ code }` (validated against the current bag before attaching) |
| DELETE | `/api/cart/coupon` | none |

Coupon rules: active, within start/expiry, min cart value, total usage limit, per-user limit (checked when signed in, always at checkout). `PERCENTAGE` applies to the selling-price subtotal (`CART_VALUE`) or MRP total (`MRP`), capped by `maxDiscount`; never exceeds the subtotal.

---

## Checkout & Payment (signed in)

### POST `/api/checkout`
Body `{ idempotencyKey, addressId }` or `{ idempotencyKey, address: {fullName, phone, addressLine1, addressLine2?, area, city, state, pincode}, saveAddress? }`
→ `201 { order: { id, orderNumber, total, status: "PENDING_PAYMENT" } }`.
Re-prices the bag server-side; rejects with `409 CART_ISSUES` if anything is out of stock and `400 COUPON_INVALID` if the coupon no longer applies. The same `idempotencyKey` always returns the same order. Stock is validated here and deducted at payment capture.

### POST `/api/payment/create-order`
Body `{ orderId }` → `{ keyId, razorpayOrderId, amount (paise), currency, orderNumber, prefill }`. Reuses an open Razorpay order for retries. `503 PAYMENTS_DISABLED` until Razorpay keys are set.

### POST `/api/payment/verify`
Body = Razorpay Checkout success payload `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }` → `{ orderId, status: "PAID" | "PROCESSING_PAYMENT" }`. Verifies the signature (constant-time) **and** fetches the payment from Razorpay to confirm it is captured and the amount.

### POST `/api/payment/webhook`
Razorpay → server. Header `X-Razorpay-Signature` (HMAC-SHA256 of the raw body with `RAZORPAY_WEBHOOK_SECRET`). Handles `payment.captured`, `order.paid`, `payment.failed`. Idempotent: the PENDING→CAPTURED flip is conditional, so replays and verify/webhook races process once.
On capture, in one transaction: order → `PAID`; stock deducted atomically (never negative; if it can't be, the order is still marked PAID with a `STOCK_CONFLICT` note for the admin to refund); coupon usage recorded; purchased lines removed from the bag. Amount mismatches leave the order pending with an `AMOUNT_MISMATCH` note. The confirmation email is sent once.

---

## Account (signed in)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/user/profile` | `{ profile: { id, email, name, phone, role, createdAt, totalOrders, totalSpent } }` |
| PUT | `/api/user/profile` | `{ name?, phone? }` |
| POST | `/api/user/email` | `{ email }`: sends a code to the new address |
| POST | `/api/user/email/verify` | `{ email, otp }`: switches email after verification |
| GET | `/api/orders` | `{ orders: [{ id, orderNumber, status, paymentStatus, total, itemCount, itemsSummary, imageUrl, createdAt, trackingUrl }] }` |
| GET | `/api/orders/[id]` | `{ order: OrderDetail }` (own orders only) |
| GET | `/api/addresses` | `{ addresses[] }` (default first) |
| POST | `/api/addresses` | address fields + `isDefault?`; the first address becomes default; max 10 |
| PUT | `/api/addresses/[id]` | partial; `isDefault: true` moves the default |
| DELETE | `/api/addresses/[id]` | deleting the default promotes the newest remaining |

---

## Admin (role `ADMIN`)

All routes are wrapped by `adminRoute()` (401 if signed out, 403 if not admin).

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/admin/dashboard` | metrics (orders by status, revenue, customers, products, low stock) + recent orders/customers |
| GET | `/api/admin/categories` | all categories incl. hidden, with subcategories and product counts |
| POST | `/api/admin/categories` | `{ name, slug?, description?, displayOrder?, isVisible?, subcategories: [{ name, slug?, displayOrder?, isVisible? }] }` |
| PUT | `/api/admin/categories/[id]` | full replace incl. subcategory list: rows with `id` update, without `id` create, missing rows delete (their products keep the category, lose the subcategory). Transactional. |
| PATCH | `/api/admin/categories/[id]` | `{ image: { url, cloudinaryId } \| null }` |
| DELETE | `/api/admin/categories/[id]` | only when the category has no products (409 otherwise; hide it instead) |
| GET | `/api/admin/products?q=&categoryId=&page=&pageSize=` | list incl. unpublished |
| POST | `/api/admin/products` | `{ name, categoryId, subcategoryId?, basePrice, baseMrp, slug?, description?, fabric?, careInstructions?, sizeGuide?, isBestseller?, isNewArrival?, isPublished? }`. The subcategory must belong to the category. |
| GET/PUT/DELETE | `/api/admin/products/[id]` | detail / partial update / delete (orders keep snapshots; prefer unpublishing) |
| POST | `/api/admin/products/[id]/variants` | `{ sku, size?, color?, colorHex?, price, mrp, stock, isAvailable? }` |
| PUT/DELETE | `/api/admin/products/[id]/variants/[variantId]` | partial update / delete |
| POST | `/api/admin/products/[id]/media` | `{ kind: "image"\|"video", url, cloudinaryId, alt?, thumbnail? }` |
| PUT | `/api/admin/products/[id]/media` | `{ imageIds: [...] }` reorder (first = cover) |
| DELETE | `/api/admin/products/[id]/media/[mediaId]?kind=image\|video` | also deletes from Cloudinary |
| GET | `/api/admin/orders?status=&q=&sort=&page=&pageSize=` | `q` matches order no. / name / email / phone; `sort` = newest\|oldest\|total_desc\|total_asc |
| GET | `/api/admin/orders/[id]` | detail + customer, notes, `allowedTransitions` |
| PATCH | `/api/admin/orders/[id]` | `{ status, trackingUrl?, notes? }`. Transitions: PAID→PROCESSING/SHIPPED/CANCELLED, PROCESSING→SHIPPED/CANCELLED, SHIPPED→DELIVERED, PENDING_PAYMENT→CANCELLED. SHIPPED needs an http(s) `trackingUrl`. Cancelling a paid order restocks it. SHIPPED/DELIVERED email (and WhatsApp, if enabled) the customer. |
| GET | `/api/admin/customers?q=&page=` | with order count, total spent, last order |
| GET | `/api/admin/customers/[id]` | profile, addresses, orders |
| GET/POST | `/api/admin/coupons` | list (with usage count) / create |
| PUT/DELETE | `/api/admin/coupons/[id]` | partial update / delete (redeemed coupons are deactivated instead) |
| GET/POST | `/api/admin/homepage/[section]` | `section` = `hero` \| `categories` \| `reels` \| `testimonials` |
| PUT/DELETE | `/api/admin/homepage/[section]/[id]` | partial update / delete (+ Cloudinary cleanup) |
| POST | `/api/admin/media` | multipart `file` + `kind` (`productImage`, `productVideo`, `categoryImage`, `heroImage`, `heroMobileImage`, `reelMedia`, `testimonialImage`) → `{ media: { url, cloudinaryId, resourceType } }`. Checks MIME type, size (images 10 MB, videos 100 MB) and file magic bytes. |
