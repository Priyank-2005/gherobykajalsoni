# API Contracts

## Error Response Format
All errors follow:
```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {} // optional validation errors
}
```

**HTTP Status Codes:**
- 200: Success
- 201: Created
- 400: Bad Request (validation error)
- 401: Unauthorized (not authenticated)
- 403: Forbidden (not authorized)
- 404: Not Found
- 409: Conflict (duplicate)
- 429: Too Many Requests (rate limited)
- 500: Internal Server Error

---

## Public APIs (No auth required)

### GET `/api/products`
- **Query params:** page, limit, category, minPrice, maxPrice, size, color, availability, discount, sort, search
- **Response:** `{ products: Product[], total: number, page: number, totalPages: number }`

### GET `/api/products/[slug]`
- **Response:** `{ product: ProductDetail }` (includes variants, images, videos, category)

### GET `/api/categories`
- **Response:** `{ categories: Category[] }`

### GET `/api/categories/[slug]`
- **Response:** `{ category: CategoryWithProducts }`

### GET `/api/search`
- **Query params:** q, page, limit
- **Response:** `{ results: Product[], total: number, suggestions?: string[] }`

### GET `/api/homepage`
- **Response:** `{ hero: Hero[], newArrivals: Product[], bestsellers: Product[], categories: HomepageCategory[], reels: HomepageReel[], testimonials: Testimonial[] }`

---

## Auth APIs

### POST `/api/auth/send-otp`
- **Body:** `{ email: string }`
- **Response:** `{ message: string, expiresIn: number }`
- **Rate limit:** 5 per email/hour, 10 per IP/hour

### POST `/api/auth/verify-otp`
- **Body:** `{ email: string, otp: string }`
- **Response:** `{ user: UserPublic, isNewUser: boolean }`
- **Note:** Sets session cookie

### POST `/api/auth/logout`
- **Response:** `{ message: string }`
- **Note:** Clears session cookie

### GET `/api/auth/session`
- **Response:** `{ user: UserPublic | null, isAuthenticated: boolean }`

---

## Cart APIs (Session-based)

### GET `/api/cart`
- **Response:** `{ cart: CartWithItems, summary: CartSummary }`

### POST `/api/cart/add`
- **Body:** `{ variantId: string, quantity: number }`
- **Response:** `{ cart: CartWithItems, summary: CartSummary }`

### PUT `/api/cart/update`
- **Body:** `{ itemId: string, quantity: number }`
- **Response:** `{ cart: CartWithItems, summary: CartSummary }`

### DELETE `/api/cart/remove`
- **Body:** `{ itemId: string }`
- **Response:** `{ cart: CartWithItems, summary: CartSummary }`

### POST `/api/cart/coupon`
- **Body:** `{ code: string }`
- **Response:** `{ cart: CartWithItems, summary: CartSummary, coupon: CouponApplied }`

### DELETE `/api/cart/coupon`
- **Response:** `{ cart: CartWithItems, summary: CartSummary }`

---

## Checkout & Payment APIs (Auth required)

### POST `/api/checkout`
- **Body:** `{ addressId?: string, address?: AddressInput }`
- **Response:** `{ order: Order }`
- **Note:** Creates order with PENDING_PAYMENT status

### POST `/api/payment/create-order`
- **Body:** `{ orderId: string }`
- **Response:** `{ razorpayOrderId: string, amount: number, currency: string, key: string }`

### POST `/api/payment/verify`
- **Body:** `{ razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string }`
- **Response:** `{ order: Order, message: string }`

### POST `/api/payment/webhook`
- **Body:** Razorpay webhook payload
- **Headers:** `x-razorpay-signature`
- **Response:** `{ status: 'ok' }`

---

## User APIs (Auth required)

### GET `/api/user/profile`
- **Response:** `{ user: UserProfile }`

### PUT `/api/user/profile`
- **Body:** `{ name?: string, phone?: string }`
- **Response:** `{ user: UserProfile }`

### GET `/api/orders`
- **Query params:** page, limit
- **Response:** `{ orders: OrderSummary[], total: number, page: number }`

### GET `/api/orders/[id]`
- **Response:** `{ order: OrderDetail }`

### GET `/api/addresses`
- **Response:** `{ addresses: Address[] }`

### POST `/api/addresses`
- **Body:** `AddressInput`
- **Response:** `{ address: Address }`

### PUT `/api/addresses/[id]`
- **Body:** `Partial<AddressInput>`
- **Response:** `{ address: Address }`

### DELETE `/api/addresses/[id]`
- **Response:** `{ message: string }`

---

## Admin APIs (Admin auth required)

### GET `/api/admin/dashboard`
- **Response:** `{ totalOrders, totalRevenue, paidOrders, pendingOrders, shippedOrders, deliveredOrders, totalCustomers, totalProducts, lowStockProducts, recentOrders, recentCustomers }`

### Products CRUD
- **GET `/api/admin/products`** (list with search, filter, pagination)
- **POST `/api/admin/products`** (create)
- **GET `/api/admin/products/[id]`** (detail)
- **PUT `/api/admin/products/[id]`** (update)
- **DELETE `/api/admin/products/[id]`** (archive)

### Variants
- **POST `/api/admin/products/[id]/variants`** (add)
- **PUT `/api/admin/products/[id]/variants/[variantId]`** (update)
- **DELETE `/api/admin/products/[id]/variants/[variantId]`** (delete)

### Orders
- **GET `/api/admin/orders`** (list with search, filter, sort)
- **GET `/api/admin/orders/[id]`** (detail)
- **PUT `/api/admin/orders/[id]/status`** (update status)
  - **Body:** `{ status: OrderStatus, trackingUrl?: string }`
  - **Validation:** SHIPPED requires trackingUrl
- **GET `/api/admin/orders/[id]/invoice`** (generate invoice data)

### Customers
- **GET `/api/admin/customers`** (list)
- **GET `/api/admin/customers/[id]`** (detail with orders)

### Coupons
- **GET `/api/admin/coupons`** (list)
- **POST `/api/admin/coupons`** (create)
- **GET `/api/admin/coupons/[id]`** (detail)
- **PUT `/api/admin/coupons/[id]`** (update)
- **DELETE `/api/admin/coupons/[id]`** (deactivate)

### Categories
- **GET `/api/admin/categories`** (list)
- **POST `/api/admin/categories`** (create)
- **GET `/api/admin/categories/[id]`** (detail)
- **PUT `/api/admin/categories/[id]`** (update)
- **DELETE `/api/admin/categories/[id]`** (delete if no products)

### Homepage CMS
- **GET `/api/admin/homepage`** (get all sections)
- **PUT `/api/admin/homepage/hero`** (update hero)
- **PUT `/api/admin/homepage/categories`** (update categories)
- **PUT `/api/admin/homepage/reels`** (update reels)
- **PUT `/api/admin/homepage/testimonials`** (update testimonials)
- **PUT `/api/admin/homepage/config`** (update new arrivals/bestseller config)

### Media
- **POST `/api/admin/media/upload`** (upload to Cloudinary)
  - **Body:** FormData with file
  - **Response:** `{ url: string, publicId: string, width: number, height: number }`
- **DELETE `/api/admin/media/[publicId]`** (delete from Cloudinary)
