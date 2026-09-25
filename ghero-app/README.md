# Ghero — Premium Traditional Clothing E-commerce Platform

A production-ready e-commerce platform for **Ghero by Kajal Soni**, a premium traditional Indian clothing brand.

**Domain**: [gherobykajalsoni.com](https://gherobykajalsoni.com)  
**Instagram**: [@ghero_0](https://www.instagram.com/ghero_0/)

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js (App Router), TypeScript, Tailwind CSS, Framer Motion |
| **Backend** | Next.js API Routes / Server Actions, TypeScript |
| **Database** | PostgreSQL, Prisma ORM |
| **Payments** | Razorpay (Online only) |
| **Media** | Cloudinary |
| **Email** | Google SMTP (Nodemailer) |
| **WhatsApp** | Meta Cloud API (Optional, feature-flagged) |

## Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL database (local or hosted: Neon, Supabase, Railway)
- Cloudinary account
- Razorpay account
- Gmail account with App Password for SMTP

## Getting Started

### 1. Clone the repository

```bash
git clone <repo-url>
cd ghero-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in all required values. See [Environment Variables](#environment-variables) below.

### 4. Set up the database

```bash
# Apply migrations (creates tables in the database from GHERO_DATABASE_URL / DIRECT_URL)
npm run db:migrate

# Load the catalog (6 categories, 19 subcategories, sample products), homepage content,
# sample coupons (WELCOME10, FLAT500) and the admin user from ADMIN_EMAIL. Safe to re-run.
npm run db:seed
```

**Admin panel:** open `/admin` and sign in with `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env` (email + password, no OTP). To change the password, edit `ADMIN_PASSWORD` (12+ characters) and run `npm run db:seed` again.

Customers sign in with a one-time email code. Until SMTP is configured, codes are printed in the dev-server console instead of being emailed.

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GHERO_DATABASE_URL` | PostgreSQL connection string (pooled). Deliberately not `DATABASE_URL`, so a machine-wide variable can't override it | ✅ |
| `DIRECT_URL` | Direct (non-pooled) connection used by Prisma Migrate | ✅ |
| `NEXT_PUBLIC_APP_URL` | Application URL (e.g., `http://localhost:3000`) | ✅ |
| `NEXT_PUBLIC_APP_NAME` | Brand name displayed on the site | ✅ |
| `SESSION_SECRET` | Secret for signing session cookies | ✅ |
| `RAZORPAY_KEY_ID` | Razorpay Key ID | ✅ |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret | ✅ |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay Webhook Secret | ✅ |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay Key ID (client-side) | ✅ |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | ✅ |
| `CLOUDINARY_API_KEY` | Cloudinary API key | ✅ |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | ✅ |
| `SMTP_HOST` | SMTP server host | ✅ |
| `SMTP_PORT` | SMTP server port | ✅ |
| `SMTP_USER` | SMTP username (Gmail address) | ✅ |
| `SMTP_PASSWORD` | SMTP password (Gmail App Password) | ✅ |
| `SMTP_FROM` | From address for emails | ✅ |
| `WHATSAPP_ENABLED` | Enable WhatsApp notifications (`true`/`false`) | ❌ |
| `WHATSAPP_PROVIDER` | WhatsApp provider (`meta`) | ❌ |
| `WHATSAPP_API_URL` | WhatsApp API base URL | ❌ |
| `WHATSAPP_ACCESS_TOKEN` | WhatsApp access token | ❌ |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp phone number ID | ❌ |
| `ADMIN_EMAIL` | Email for initial admin account | ✅ |

## Integration Setup

### Razorpay

1. Create an account at [razorpay.com](https://razorpay.com)
2. Get your **Key ID** and **Key Secret** from Dashboard → Settings → API Keys
3. For webhooks: Dashboard → Settings → Webhooks → Add Webhook
   - URL: `https://yourdomain.com/api/payment/webhook`
   - Events: `payment.captured`, `payment.failed`

### Cloudinary

1. Create an account at [cloudinary.com](https://cloudinary.com)
2. Get **Cloud Name**, **API Key**, and **API Secret** from the Dashboard

### Gmail SMTP

1. Enable 2-Step Verification on your Google account
2. Generate an App Password: Google Account → Security → App Passwords
3. Use the generated password as `SMTP_PASSWORD`

### WhatsApp (Optional)

1. Create a Meta Business account
2. Set up WhatsApp Business API through Meta Business Manager
3. Get Access Token and Phone Number ID
4. Create message templates in Meta Business Manager
5. Set `WHATSAPP_ENABLED=true` in `.env`

## Notes for local development

- **Remote database latency.** With the Neon database in `us-east-1`, every query is roughly a 220 ms round-trip from India. For production, create the database in `ap-south-1` (Mumbai) and deploy the app in the same region.
- **Open the dev site at `http://localhost:3000`**, not `127.0.0.1`. Next.js 16 blocks dev assets from other origins, so the page won't hydrate.
- **Without Razorpay keys** checkout still creates the order and shows a "payment not switched on yet" notice; customers can pay later from their order page.
- **API reference:** see [`docs/API_CONTRACTS.md`](../docs/API_CONTRACTS.md).

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (storefront)/       # Public storefront routes
│   ├── (admin)/            # Admin panel routes
│   └── api/                # API routes
├── components/
│   ├── ui/                 # Reusable UI primitives
│   ├── storefront/         # Storefront components
│   ├── admin/              # Admin components
│   └── shared/             # Shared components
├── lib/
│   ├── services/           # Business logic services
│   ├── validations/        # Zod validation schemas
│   ├── db.ts               # Prisma client
│   ├── auth.ts             # Auth utilities
│   ├── cloudinary.ts       # Cloudinary config
│   ├── razorpay.ts         # Razorpay config
│   ├── email.ts            # Email config
│   ├── whatsapp.ts         # WhatsApp service
│   ├── rate-limit.ts       # Rate limiting
│   └── utils.ts            # Utility functions
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript types
└── middleware.ts           # Next.js middleware
```

## Prisma Commands

```bash
# Generate Prisma client after schema changes
npx prisma generate

# Create a new migration
npx prisma migrate dev --name <migration-name>

# Apply migrations to production
npx prisma migrate deploy

# Open Prisma Studio (database GUI)
npx prisma studio

# Reset database (drops all data)
npx prisma migrate reset

# Seed database
npx prisma db seed
```

## Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Documentation

| Document | Description |
|----------|-------------|
| [PROJECT_REQUIREMENTS.md](../PROJECT_REQUIREMENTS.md) | Complete system requirements |
| [PROJECT_CHECKLIST.md](../PROJECT_CHECKLIST.md) | Implementation progress checklist |
| [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) | System architecture |
| [docs/DATABASE_SCHEMA.md](../docs/DATABASE_SCHEMA.md) | Database schema & ERD |
| [docs/API_CONTRACTS.md](../docs/API_CONTRACTS.md) | API documentation |
| [docs/AUTH_ARCHITECTURE.md](../docs/AUTH_ARCHITECTURE.md) | Authentication design |
| [docs/PAYMENT_ARCHITECTURE.md](../docs/PAYMENT_ARCHITECTURE.md) | Payment integration |
| [docs/EMAIL_WHATSAPP_ARCHITECTURE.md](../docs/EMAIL_WHATSAPP_ARCHITECTURE.md) | Notification system |

## License

Private — All rights reserved.
