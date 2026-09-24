# Ghero — Implementation Checklist

## Phase 0: Documentation & Architecture
- [x] Inspect repository
- [x] Create PROJECT_REQUIREMENTS.md
- [x] Create PROJECT_CHECKLIST.md
- [x] Define database schema (Prisma)
- [x] Define API contracts / service architecture
- [x] Define authentication/session architecture
- [x] Define payment architecture (Razorpay flow)
- [x] Define admin authorization model
- [x] Define media architecture (Cloudinary)
- [x] Define email architecture (Google SMTP)
- [x] Define WhatsApp integration abstraction
- [x] Create .env.example
- [x] Create README.md

## Phase 1: Project Foundation
- [x] Initialize Next.js project with App Router
- [x] Configure TypeScript (strict mode)
- [x] Configure Tailwind CSS
- [x] Install and configure Framer Motion
- [x] Configure ESLint & Prettier
- [x] Set up Prisma with PostgreSQL
- [x] Create initial Prisma schema
- [ ] Run initial migration
- [ ] Create seed script
- [x] Set up project directory structure
- [x] Configure fonts (heading + body)
- [x] Set up color palette / design tokens
- [x] Create base layout components
- [x] Set up environment variable management

## Phase 2: Storefront UI

### Homepage
- [x] Hero Section component
- [x] New Arrivals section
- [x] Bestsellers section
- [x] Shop by Category section
- [x] Shop by Reels section
- [x] Testimonials section
- [x] Footer component
- [x] Header/Navigation component
- [x] Mobile navigation
- [x] Responsive design for all sections

### Shop Page
- [x] Product grid layout
- [x] Category filter
- [x] Price filter
- [x] Size filter
- [x] Color filter
- [x] Availability filter
- [x] Discount filter
- [x] Sorting (recommended, newest, price low/high, bestseller, discount)
- [x] Pagination / infinite scroll
- [x] Product count display
- [x] Empty state
- [x] Loading state (skeleton)
- [ ] Responsive layout

### Category Page (/category/[slug])
- [ ] Category header
- [ ] Filtered product grid
- [ ] All shop filters applied to category
- [ ] Breadcrumbs

### Search Page (/search)
- [ ] Search input with suggestions/autocomplete
- [ ] Search results grid
- [ ] No results state
- [ ] Empty search state
- [ ] Loading state

### Product Detail Page (/product/[slug])
- [ ] Image gallery
- [ ] Video player (if available)
- [ ] Product info (name, SKU, price, MRP, discount)
- [ ] Size selection
- [ ] Color selection
- [ ] Variant selection logic
- [ ] Stock availability display
- [ ] Quantity selector
- [ ] Add to cart button
- [ ] Buy now button
- [ ] Product description
- [ ] Fabric details
- [ ] Care instructions
- [ ] Size guide
- [ ] Shipping information
- [ ] Return information
- [ ] Responsive layout

### Cart Page (/cart)
- [ ] Cart item list
- [ ] Product image, name, variant
- [ ] Quantity controls
- [ ] Remove item
- [ ] Coupon input
- [ ] Price breakdown (subtotal, discount, total)
- [ ] Proceed to checkout button
- [ ] Empty cart state
- [ ] Responsive layout

### Checkout Page (/checkout)
- [ ] Address form (Full Name, Email, Phone, Address, Apartment, Area, City, State, Pincode, Country)
- [ ] Form validation (Zod)
- [ ] Order summary
- [ ] Coupon display
- [ ] Authentication gate (OTP flow)
- [ ] Saved address selection (for logged-in users)
- [ ] Responsive layout

### Static Pages
- [ ] About page
- [ ] Contact page
- [ ] Privacy Policy page
- [ ] Terms & Conditions page
- [ ] Refund Policy page
- [ ] Shipping Policy page

### UI Components (Shared)
- [ ] Product card component
- [ ] Button component
- [ ] Input component
- [ ] Select component
- [ ] Modal/Dialog component
- [ ] Toast notification component
- [ ] Skeleton loader components
- [ ] Badge component
- [ ] Breadcrumb component
- [ ] Pagination component
- [ ] Rating/Stars component
- [ ] Price display component (MRP, discount, sale price)
- [ ] Image component (with Cloudinary/Next Image)
- [ ] Loading spinner
- [ ] Empty state component
- [ ] Error state component

## Phase 3: Database & Backend

### Database Schema
- [ ] User model
- [ ] Session model
- [ ] Address model
- [ ] Category model
- [ ] Product model
- [ ] ProductVariant model
- [ ] ProductImage model
- [ ] ProductVideo model
- [ ] Cart model
- [ ] CartItem model
- [ ] Order model
- [ ] OrderItem model
- [ ] Payment model
- [ ] Coupon model
- [ ] CouponUsage model
- [ ] HomepageHero model
- [ ] HomepageCategory model
- [ ] HomepageReel model
- [ ] Testimonial model
- [ ] EmailEvent model
- [ ] WhatsAppEvent model
- [ ] Add indexes (email, SKU, slug, order number, etc.)
- [ ] Add unique constraints
- [ ] Run migrations
- [ ] Verify schema

### Backend Services
- [ ] authService
- [ ] productService
- [ ] categoryService
- [ ] cartService
- [ ] checkoutService
- [ ] orderService
- [ ] paymentService
- [ ] couponService
- [ ] inventoryService
- [ ] emailService
- [ ] whatsappService
- [ ] mediaService
- [ ] homepageService
- [ ] userService
- [ ] addressService

### API Routes
- [ ] Auth: POST /api/auth/send-otp
- [ ] Auth: POST /api/auth/verify-otp
- [ ] Auth: POST /api/auth/logout
- [ ] Auth: GET /api/auth/session
- [ ] Products: GET /api/products
- [ ] Products: GET /api/products/[slug]
- [ ] Categories: GET /api/categories
- [ ] Categories: GET /api/categories/[slug]
- [ ] Search: GET /api/search
- [ ] Cart: GET /api/cart
- [ ] Cart: POST /api/cart/add
- [ ] Cart: PUT /api/cart/update
- [ ] Cart: DELETE /api/cart/remove
- [ ] Cart: POST /api/cart/coupon
- [ ] Cart: DELETE /api/cart/coupon
- [ ] Checkout: POST /api/checkout
- [ ] Payment: POST /api/payment/create-order
- [ ] Payment: POST /api/payment/verify
- [ ] Payment: POST /api/payment/webhook
- [ ] Orders: GET /api/orders
- [ ] Orders: GET /api/orders/[id]
- [ ] User: GET /api/user/profile
- [ ] User: PUT /api/user/profile
- [ ] Addresses: GET /api/addresses
- [ ] Addresses: POST /api/addresses
- [ ] Addresses: PUT /api/addresses/[id]
- [ ] Addresses: DELETE /api/addresses/[id]
- [ ] Homepage: GET /api/homepage
- [ ] Admin: All admin API routes (document each)

## Phase 4: Authentication & OTP
- [ ] OTP generation (server-side, secure)
- [ ] OTP storage (hashed, with expiration)
- [ ] OTP validation
- [ ] OTP rate limiting
- [ ] OTP attempt limiting
- [ ] OTP resend cooldown
- [ ] Send OTP via email
- [ ] Email verification flow
- [ ] Auto-create account from checkout info
- [ ] Recognize existing accounts
- [ ] Session creation (HTTP-only cookies)
- [ ] Session validation middleware
- [ ] Session expiration
- [ ] Logout
- [ ] Protected route middleware
- [ ] Admin route middleware

## Phase 5: Cart & Checkout
- [ ] Add to cart (with variant)
- [ ] Remove from cart
- [ ] Update quantity
- [ ] Server-side price recalculation
- [ ] Stock validation on cart operations
- [ ] Coupon application (server-side validation)
- [ ] Coupon removal
- [ ] Checkout form validation
- [ ] Address validation
- [ ] Authentication gate at checkout
- [ ] Create order from checkout
- [ ] Inventory reservation/validation

## Phase 6: Razorpay Payment
- [ ] Razorpay SDK integration
- [ ] Create Razorpay order (server-side)
- [ ] Open Razorpay checkout modal
- [ ] Server-side payment verification (signature)
- [ ] Webhook endpoint
- [ ] Webhook signature verification
- [ ] Idempotency protection (no duplicate orders)
- [ ] Handle successful payment
- [ ] Handle failed payment
- [ ] Handle cancelled payment
- [ ] Handle payment mismatch
- [ ] Transactional inventory deduction on payment success

## Phase 7: Orders & Inventory
- [ ] Order creation with immutable snapshots
- [ ] Order status workflow (PENDING → PAID → PROCESSING → SHIPPED → DELIVERED → CANCELLED)
- [ ] Order listing (user)
- [ ] Order detail (user)
- [ ] Inventory tracking (variant-level)
- [ ] Prevent negative inventory
- [ ] Concurrent purchase handling
- [ ] Order number generation

## Phase 8: Customer Account
- [ ] Login page
- [ ] Verify page (OTP input)
- [ ] Account layout
- [ ] Profile page (view/edit)
- [ ] Orders list page
- [ ] Order detail page
- [ ] Addresses page (CRUD)
- [ ] Default address
- [ ] Logout functionality

## Phase 9: Admin Panel

### Admin Authentication
- [ ] Admin login
- [ ] Admin session
- [ ] Admin middleware (server-side role check)
- [ ] Admin layout (sidebar, header)

### Dashboard
- [ ] Total orders metric
- [ ] Total revenue metric
- [ ] Paid/Pending/Shipped/Delivered order counts
- [ ] Customer count
- [ ] Product count
- [ ] Low-stock alerts
- [ ] Recent orders table
- [ ] Recent customers table

### Product Management
- [ ] Product list (with search, filter, pagination)
- [ ] Create product form
- [ ] Edit product form
- [ ] Delete/archive product
- [ ] Image upload (Cloudinary)
- [ ] Video upload (Cloudinary)
- [ ] Variant management (size, color, SKU, inventory)
- [ ] Price/MRP setting
- [ ] Category assignment
- [ ] Description/fabric/care
- [ ] Bestseller/New Arrival flags
- [ ] Publish/Unpublish toggle

### Order Management
- [ ] Order list (with search, filter, sort)
- [ ] Order detail view
- [ ] Change order status
- [ ] Tracking URL input (mandatory for SHIPPED)
- [ ] Tracking URL validation
- [ ] Print invoice
- [ ] Invoice template (print stylesheet)

### Customer Management
- [ ] Customer list (name, email, phone, orders, spending)
- [ ] Customer detail view
- [ ] Customer order history
- [ ] Customer profile info

### Coupon Management
- [ ] Coupon list
- [ ] Create coupon form
- [ ] Edit coupon
- [ ] Delete/deactivate coupon
- [ ] Coupon fields: code, type, apply-on, usage limit, per-user limit, start/expiry, min cart, max discount, active/inactive

### Category Management
- [ ] Category list
- [ ] Create category
- [ ] Edit category
- [ ] Delete category
- [ ] Category image upload
- [ ] Category slug management

## Phase 10: Homepage CMS
- [ ] Hero management (image, mobile image, heading, subheading, CTAs, visibility)
- [ ] New Arrivals config (auto/manual, count)
- [ ] Bestsellers config (auto/manual, count)
- [ ] Categories display management (image, name, link, order, visibility)
- [ ] Reels management (video/image, caption, product association, order, visibility)
- [ ] Testimonials management (name, review, rating, image, visibility)
- [ ] Homepage API to serve all CMS content

## Phase 11: Coupons
- [ ] Coupon model and migration
- [ ] Apply coupon API (server-side validation)
- [ ] Remove coupon API
- [ ] Percentage discount calculation
- [ ] Flat discount calculation
- [ ] Cart value vs MRP application logic
- [ ] Usage tracking
- [ ] Per-user usage tracking
- [ ] Expiry validation
- [ ] Minimum cart value validation
- [ ] Maximum discount cap
- [ ] Coupon code uniqueness

## Phase 12: Email Automation
- [ ] Email service (Google SMTP)
- [ ] Email template: OTP/Verification
- [ ] Email template: Order Confirmation
- [ ] Email template: Shipped (with tracking URL/CTA)
- [ ] Email template: Delivered
- [ ] EmailEvent tracking in database
- [ ] Idempotent email sending (no duplicates)
- [ ] Professional branded email design

## Phase 13: WhatsApp Integration
- [ ] WhatsAppService abstraction
- [ ] sendOTP() method
- [ ] sendOrderConfirmation() method
- [ ] sendShippingUpdate() method
- [ ] sendDeliveryUpdate() method
- [ ] sendCustomMessage() method
- [ ] Provider configuration via env vars
- [ ] Feature flag (WHATSAPP_ENABLED)
- [ ] WhatsAppEvent tracking in database
- [ ] Graceful fallback when disabled

## Phase 14: Security Hardening
- [ ] Server-side authorization on all protected routes
- [ ] Role-based access control verification
- [ ] Zod validation on all inputs
- [ ] Input sanitization
- [ ] Secure cookie configuration
- [ ] CSRF protection
- [ ] Rate limiting (OTP, auth, API)
- [ ] OTP brute-force protection
- [ ] HTTP security headers
- [ ] Content Security Policy
- [ ] Secure file upload validation (MIME, size)
- [ ] Razorpay signature verification
- [ ] Razorpay webhook verification
- [ ] Idempotency for payments
- [ ] Idempotency for notifications
- [ ] Server-side pricing validation
- [ ] Server-side coupon validation
- [ ] Server-side inventory validation
- [ ] Secret protection (no client exposure)

## Phase 15: SEO, Performance & Accessibility

### SEO
- [ ] Dynamic metadata (products, categories)
- [ ] Open Graph metadata
- [ ] Twitter/X metadata
- [ ] Canonical URLs
- [ ] Sitemap generation
- [ ] robots.txt
- [ ] Product structured data (JSON-LD)
- [ ] Breadcrumb structured data

### Performance
- [ ] Next.js Image optimization
- [ ] Cloudinary transformations
- [ ] Lazy loading
- [ ] Code splitting
- [ ] Server components optimization
- [ ] Font optimization
- [ ] Video optimization
- [ ] Caching strategy
- [ ] Database query optimization
- [ ] Bundle size analysis

### Accessibility
- [ ] Semantic HTML audit
- [ ] Keyboard navigation
- [ ] Focus states
- [ ] ARIA attributes
- [ ] Color contrast
- [ ] Alt text for images
- [ ] Accessible forms
- [ ] Accessible modals/dialogs
- [ ] Screen reader testing

## Phase 16: Testing & Production Audit

### Authentication Tests
- [ ] New email OTP flow
- [ ] Existing email OTP flow
- [ ] Invalid OTP
- [ ] Expired OTP
- [ ] Resend OTP
- [ ] OTP brute force protection
- [ ] Logout

### Cart Tests
- [ ] Add to cart
- [ ] Remove from cart
- [ ] Quantity update
- [ ] Out-of-stock handling
- [ ] Variant selection

### Coupon Tests
- [ ] Valid coupon application
- [ ] Expired coupon rejection
- [ ] Invalid coupon rejection
- [ ] Usage limit enforcement
- [ ] Minimum cart value check
- [ ] Percentage discount calculation
- [ ] Flat discount calculation

### Payment Tests
- [ ] Successful payment flow
- [ ] Failed payment handling
- [ ] Cancelled payment handling
- [ ] Duplicate webhook handling
- [ ] Invalid webhook rejection
- [ ] Payment amount mismatch

### Order Tests
- [ ] Order creation
- [ ] Confirmation email sent
- [ ] Shipping with tracking URL
- [ ] Shipping email sent
- [ ] Delivery email sent
- [ ] Duplicate notification prevention

### Admin Tests
- [ ] Customer cannot access admin
- [ ] Admin can access admin
- [ ] Unauthorized API rejection
- [ ] Product CRUD operations
- [ ] Customer management view
- [ ] Order management operations
- [ ] Homepage CMS operations

### Edge Case Tests
- [ ] Concurrent purchase of last item
- [ ] Coupon applied while cart changes
- [ ] Product deleted after cart addition
- [ ] Variant unavailable during checkout
- [ ] Payment success + browser disconnect
- [ ] Double webhook processing
- [ ] Page refresh after payment
- [ ] Repeated OTP requests
- [ ] Multiple wrong OTP attempts
- [ ] Ship without tracking URL (must fail)
- [ ] Invalid tracking URL
- [ ] Address modification after order
- [ ] Price change after order creation
- [ ] Coupon expiry during checkout

### Production Readiness
- [ ] All storefront pages functional
- [ ] Responsive design verified (desktop, tablet, mobile)
- [ ] All user flows complete
- [ ] Payment integration verified
- [ ] Email automation verified
- [ ] Admin panel fully functional
- [ ] Security audit passed
- [ ] Performance audit passed
- [ ] SEO audit passed
- [ ] Documentation updated
- [ ] PROJECT_REQUIREMENTS.md current
- [ ] PROJECT_CHECKLIST.md accurate
- [ ] README.md complete
- [ ] .env.example complete
