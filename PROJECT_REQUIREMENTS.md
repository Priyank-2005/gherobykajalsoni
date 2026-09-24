# Ghero — Premium Traditional Clothing E-commerce Platform
System Requirements Document

## 1. Project Overview
- **Brand**: Gheरो by Kajal Soni
- **Nature**: E-commerce platform for a premium traditional Indian clothing brand.
- **Goal**: Must feel like a luxury fashion brand website — not a generic template. It is a complete production system, not a prototype.
- **Domain**: gherobykajalsoni.com
- **Instagram**: @ghero_0

## 2. Business Objectives
- Establish a robust online presence for a premium traditional clothing brand.
- Enable direct-to-consumer sales securely and efficiently.
- Provide a seamless, high-end shopping experience.
- Enable the business owner to manage products, orders, customers, and content independently.
- Scale from initial launch to serving thousands of customers seamlessly.

## 3. Target Users
- **Primary**: Women aged 20-45 interested in premium traditional Indian clothing.
- **Secondary**: Gift buyers for occasions such as weddings, festivals, and anniversaries.
- **Admin**: Business owner (Kajal Soni) and the management team.

## 4. Brand & Design Direction
- **Aesthetic**: Premium traditional fashion / elegant editorial aesthetic. Minimal in layout but rich in visual character.
- **Color Palette**: Light pastel background, warm ivory/off-white, soft blush/pink, muted rose, subtle beige, optional restrained wine/maroon accents, very subtle gold accents.
- **Typography**:
  - Headings: Elegant editorial serif/display font (Playfair Display / Cormorant Garamond / DM Serif Display).
  - Body: Sophisticated sans-serif (Inter / Manrope / Geist).
- **Avoid**: Neon colors, excessive gradients, generic SaaS appearance, dark dashboard-style, cheap animations, excessive drop shadows.

## 5. Technology Stack

### Frontend
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion (controlled animations)
- Responsive design (Desktop, Laptop, Tablet, Mobile)
- Semantic HTML / Accessibility

### Backend
- Next.js API routes / Server Actions
- TypeScript
- Service-oriented architecture

### Database
- PostgreSQL
- Prisma ORM
- Production-oriented schema with proper indexes and constraints

### Media
- Cloudinary (product images, videos, banners, category images, reels, CMS assets)
- *Constraint*: Never store large binaries in PostgreSQL.

### Payments
- Razorpay (online payment only, NO COD)
- Server-side verification mandatory

### Email
- Google SMTP
- Transactional emails: OTP, order confirmation, shipping, delivery

### WhatsApp
- Meta Cloud API (provider abstraction layer)
- Feature-flagged, optional integration

---

## 6. Frontend Requirements
The public website structure is defined as follows:
- `/` (Homepage): The main landing page, visually rich.
- `/shop`: Full product listing with filters and sorting.
- `/category/[slug]`: Products filtered by a specific category.
- `/product/[slug]`: Detailed product view.
- `/search`: Search results page.
- `/cart`: Shopping cart summary and modifications.
- `/checkout`: Secure checkout process collecting user and payment details.
- `/login`: Initial login/signup flow.
- `/verify`: OTP verification step.
- `/account`: Dashboard for logged-in users.
  - `/account/profile`: Manage user details.
  - `/account/orders`: Order history.
  - `/account/orders/[id]`: Detailed view of a specific order.
  - `/account/addresses`: Manage shipping addresses.
- `/about`: Brand story and Kajal Soni's background.
- `/contact`: Contact form and information.
- Policies: `/privacy`, `/terms`, `/refund-policy`, `/shipping-policy`.

## 7. Homepage Requirements
The homepage must contain 7 distinct, admin-manageable sections:
1. **Hero Section**: Large premium visual (image/video), editable heading, subheading, and primary CTAs.
2. **New Arrivals**: Carousel or grid of recently added products showing images, prices, and discounts.
3. **Bestsellers**: Configurable logic (automatic based on sales or manual selection by admin).
4. **Shop by Category**: Dynamic visual category cards with high-quality images.
5. **Shop by Reels**: Instagram-inspired video/image section with clickable product associations.
6. **Testimonials**: Customer reviews with ratings.
7. **Footer**: Brand information, navigation links, categories, support links, social links, and policies.

## 8. Shop & Search Requirements
- **Product Grid**: Supports dynamic filtering by category, price, size, color, availability, and discount.
- **Sorting**: Options for Recommended, Newest, Price (Low to High, High to Low), Bestseller, and Discount.
- **Pagination**: Infinite scroll or traditional pagination.
- **Search Engine**: Search across product name, SKU, category, and metadata.
- **Search UX**: Suggestions/autocomplete while typing. Clear empty/no-result states and skeleton loading states.

## 9. Product Detail Page Requirements
- **Media Gallery**: High-res image gallery with zoom capability and video support.
- **Product Info**: Name, SKU, current price, MRP (strikethrough), and discount percentage.
- **Variants**: Selectors for size, color, and other applicable variants.
- **Stock**: Real-time stock availability display.
- **Actions**: Quantity selector, "Add to Cart", and "Buy Now" (direct to checkout).
- **Details**: Accordions or tabs for fabric details, care instructions, size guide.
- **Policies**: Brief shipping and return information.

## 10. Product Variants & Inventory
- **Multi-variant Support**: Multiple sizes and colors per product.
- **SKU Management**: Different SKUs for each specific variant.
- **Inventory Tracking**: Variant-level inventory tracking.
- **Stock Validation**: Server-authoritative stock management to prevent negative inventory or overselling.
- **Updates**: Transactional stock updates upon order confirmation.

## 11. Cart Requirements
- **Modifications**: Add items, remove items, update quantities.
- **Variant Selection**: Clear display of selected variants (e.g., Size M, Red).
- **Coupons**: Input field for coupon application with real-time validation.
- **Pricing**: Backend recalculates all pricing (NEVER trust frontend numbers).
- **Summary**: Clear breakdown of subtotal, discount applied, taxes, and final amount.

## 12. Checkout Requirements
- **Flow**: Clean, distraction-free checkout flow.
- **Data Collection**: Full Name, Email, Phone, Address, Apartment/Building, Area, City, State, Pincode, Country.
- **Authentication**: Auth required at checkout (users can browse/add to cart without auth, but must authenticate to pay).
- **Validation**: Strict client-side and server-side validation using Zod.

## 13. Authentication & OTP Requirements
- **Strategy**: Email-based OTP verification (passwordless).
- **OTP Logistics**: Server-generated, time-limited (e.g., 5 mins), single-use, rate-limited, attempt-limited, secure storage (hashed in DB), resend cooldown.
- **Auto-creation**: Auto-create account from checkout info if it's a new email. Recognize existing accounts without creating duplicates.
- **Sessions**: Secure sessions with HTTP-only cookies. Session expiration and secure logout.
- **Protection**: Protected routes for `/account` and `/admin`.

## 14. User Account Requirements
- **Profile**: View and update name, email, phone (email changes require re-verification).
- **Orders**: List showing order ID, date, items summary, amount, payment status, order status, and tracking link.
- **Addresses**: Add, edit, delete, and set default shipping addresses. Order histories use immutable address snapshots.

## 15. Order System Requirements
- **Immutability**: Store historical data snapshots for customer details, products (name, SKU, variant, qty, price, MRP, discount at time of purchase), coupon used, taxes, final amount, shipping address, and payment info.
- **Lifecycle Statuses**: PENDING_PAYMENT → PAID → PROCESSING → SHIPPED → DELIVERED → CANCELLED.
- **Tracking**: Transition to SHIPPED requires a tracking URL (mandatory).
- **Notifications**: Status changes trigger transactional emails and WhatsApp notifications.

## 16. Payment Requirements (Razorpay)
- **Method**: Online payments only (NO Cash on Delivery).
- **Flow**: Create server order → Create Razorpay order → Open frontend checkout → Process Payment → Server-side webhook/verification → Confirm order → Reduce inventory transactionally → Send confirmation.
- **Webhooks**: Idempotent webhook handling.
- **Security**: Never trust frontend payment success responses. Must handle success, failure, cancellation, duplicate webhooks, and payment amount mismatch.

## 17. Coupon Requirements
- **Attributes**: Code, type (percentage or flat amount), apply on (cart value or MRP).
- **Limits**: Usage limits (total redemptions, redemptions per user).
- **Validity**: Active/inactive toggle, start date, expiry date.
- **Conditions**: Minimum cart value requirement, maximum discount cap for percentage types.
- **Validation**: Unique codes, strict server-side validation during cart calculation and checkout.

## 18. Admin Panel Requirements
- **Dashboard**: Key metrics (orders, revenue, customers, total products, low stock alerts, recent activity).
- **Product Management**: Full CRUD operations. Cloudinary integration for images/videos. Manage variants, pricing, inventory, categories, descriptions, fabrics, care instructions, bestseller/new arrival flags, and publish status.
- **Order Management**: List, search, filter, and sort orders. Full order detail view, status updates, tracking URL management, and print invoice feature.
- **Customer Management**: List customers with details, link to their profiles, order history, and total spending.
- **Coupon Management**: Full CRUD with all coupon condition fields.
- **Homepage CMS**: Manage all 7 homepage sections completely.
- **Auth**: Separate admin authentication or RBAC (Role-Based Access Control) ensuring standard CUSTOMERS cannot access the admin panel.

## 19. Invoice Requirements
- **Format**: Print-friendly invoice format (PDF or clean HTML print stylesheet).
- **Content**: Brand logo, order number, date, customer info, shipping details, products (SKU, qty, price, discounts), subtotal, total, and payment status.

## 20. Email Automation Requirements
- **Service**: Reusable email service using Google SMTP.
- **Templates**: Professional, branded HTML templates.
- **Triggers**: Account/OTP verification, Order confirmation, Shipped (with tracking URL), Delivered.
- **Reliability**: Idempotent email events to prevent duplicate emails. Track notification events in the DB.

## 21. WhatsApp Integration Requirements
- **Abstraction**: `WhatsAppService` provider abstraction with methods: `sendOTP()`, `sendOrderConfirmation()`, `sendShippingUpdate()`, `sendDeliveryUpdate()`, `sendCustomMessage()`.
- **Configuration**: Configurable via environment variables (e.g., `WHATSAPP_ENABLED`, `WHATSAPP_PROVIDER`).
- **Feature Flag**: The system must function perfectly if WhatsApp is disabled.

## 22. Media Management Requirements
- **Provider**: Cloudinary for all media.
- **Validation**: Secure backend uploads, MIME type validation, file-size validation.
- **Optimization**: Image optimization, responsive delivery, and format transformations handled by Cloudinary.
- **Storage**: Store only the Cloudinary public ID and secure URL in the database.

## 23. Security Requirements
- **Auth/Authz**: Server-side authorization, Role-Based Access Control.
- **Data Integrity**: Zod validation, input sanitization.
- **Web Security**: Secure cookies, CSRF protection, HTTP security headers, Content Security Policy (CSP).
- **Rate Limiting**: Rate limiting on OTP and authentication endpoints.
- **Uploads**: Secure file upload validation.
- **Database**: SQL injection protection (handled by Prisma). XSS protection on frontend.
- **Payments**: Razorpay signature & webhook verification. Idempotency for payments and notifications.
- **Validation**: Server-side pricing, coupon, and inventory validation.
- **Secrets**: Never expose `.env` secrets to the client.

## 24. SEO Requirements
- **Metadata**: Dynamic metadata for products and categories.
- **Social**: Open Graph, Twitter/X metadata.
- **Structure**: Canonical URLs, dynamically generated sitemap, `robots.txt`.
- **Rich Snippets**: Product structured data (JSON-LD).
- **Navigation**: Breadcrumbs on product and category pages.

## 25. Performance Requirements
- **Images**: Next.js Image component, Cloudinary transformations.
- **JS**: Lazy loading, code splitting, minimal client-side JavaScript. Heavy use of Server Components.
- **Assets**: Optimized fonts and videos.
- **Data**: Effective caching, DB indexes for fast queries, pagination for large datasets.

## 26. Accessibility Requirements
- **HTML**: Semantic HTML, proper keyboard navigation, clear focus states.
- **ARIA**: Accessible buttons, form labels, ARIA roles where necessary.
- **Visuals**: Sufficient color contrast, descriptive alt text for all images.
- **Components**: Accessible dialogs, modals, and navigation menus.

## 27. Database Schema
Expected entities and relationships (PostgreSQL + Prisma):
- `User`, `Role` (Enum: ADMIN, CUSTOMER), `Session`, `Address`
- `Product`, `ProductVariant`, `Category`, `ProductImage`, `ProductVideo`
- `Cart`, `CartItem`
- `Order`, `OrderItem`, `Payment`
- `Coupon`, `CouponUsage`
- `HomepageHero`, `HomepageCategory`, `HomepageReel`, `Testimonial`
- `EmailEvent`, `WhatsAppEvent`, `Notification`
- **Key Indexes**: `email`, `SKU`, `slug`, `order_number`, `payment_id`, `status`, `createdAt`, `coupon_code`.
- **Constraints**: Unique constraints on emails, slugs, SKUs, and order numbers.

## 28. API / Service Architecture
Service layer structure for clean architecture:
- `authService`, `productService`, `cartService`, `checkoutService`, `orderService`, `paymentService`, `couponService`, `inventoryService`, `emailService`, `whatsappService`, `mediaService`, `homepageService`.
- **Principles**: Clean boundaries, thin API controllers/actions, robust reusable services.

## 29. Environment Variables
Required `.env` structure:
- `DATABASE_URL` (PostgreSQL connection string)
- `NEXT_PUBLIC_APP_URL` (Domain URL)
- `JWT_SECRET` / `SESSION_SECRET` (For secure sessions)
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`
- `WHATSAPP_ENABLED`, `WHATSAPP_API_KEY`, `WHATSAPP_SENDER_ID`

## 30. Deployment Requirements
- **Frontend**: Vercel for Next.js App Router.
- **Database**: Managed PostgreSQL (e.g., Supabase, Neon, or Railway).
- **Media**: Cloudinary.
- **Environment**: Secure environment variable management via deployment platform.
- **Migrations**: Automated database migrations via Prisma during deployment.

## 31. Testing Requirements
Test scenarios must cover:
- **Auth**: OTP generation, validation, expiration, rate limits, session creation.
- **Cart**: Add/remove items, correct subtotal calculations.
- **Coupons**: Valid/invalid codes, usage limits, correct discount application.
- **Payment**: Razorpay order creation, signature verification, webhook processing, idempotency.
- **Orders**: Inventory reduction, correct status updates, email triggers.
- **Admin**: RBAC verification, product creation, order updates.
- **Edge Cases**: Out of stock during checkout, payment failures, negative quantity attempts.

## 32. Responsive Design Requirements
- **Breakpoints**: Desktop, Laptop, Tablet, Mobile specific adjustments.
- **Mobile Experience**: Optimized navigation (hamburger menu), sticky Add to Cart bar, full-screen search, easy-to-tap filters, horizontal swipe galleries, mobile-friendly checkout.
- **Admin Mobile**: Ensure the admin panel is usable on mobile devices where practical for quick updates.
