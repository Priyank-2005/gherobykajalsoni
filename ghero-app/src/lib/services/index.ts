/**
 * Ghero — Service Layer Index
 *
 * All business logic is encapsulated in service modules.
 * API routes / server actions call these services — never
 * put business logic directly in route handlers or React components.
 *
 * Services:
 * - auth.service.ts       → OTP, sessions, user creation
 * - product.service.ts    → Product CRUD, listing, filtering
 * - category.service.ts   → Category CRUD
 * - cart.service.ts       → Cart operations, pricing
 * - checkout.service.ts   → Checkout flow orchestration
 * - order.service.ts      → Order CRUD, status management
 * - payment.service.ts    → Razorpay integration
 * - coupon.service.ts     → Coupon validation, application
 * - inventory.service.ts  → Stock management
 * - email.service.ts      → Email templates, sending
 * - whatsapp.service.ts   → WhatsApp notifications
 * - media.service.ts      → Cloudinary uploads/deletes
 * - homepage.service.ts   → Homepage CMS operations
 * - user.service.ts       → User profile management
 * - address.service.ts    → Address CRUD
 */

// Services will be implemented in Phase 3+
// Each service is imported directly where needed
