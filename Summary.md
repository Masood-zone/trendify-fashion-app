# Fashion Trendify GH — Project Summary

## Overview

Fashion Trendify GH is a full-stack e-commerce platform for Ghanaian fashion and craftsmanship, built with Next.js 16. It provides a responsive public storefront, customer accounts, guest checkout, Paystack payments, inventory-aware order processing, content management, and an administrator portal in a single application.

All prices are stored in pesewas and displayed in Ghana cedis (GHS). Delivery addresses support all 16 regions of Ghana.

---

## Key Features

### Public Storefront
- CMS-driven homepage with hero, category grids, collections, carousels, and newsletter sections.
- Product catalogue with search, sorting, and filters (category, audience, price, Made in Ghana, availability).
- Product details with variants, size/colour selection, stock availability, size guides, recommendations, and approved reviews.
- Published collections, editorial content, About, support, and newsletter pages.
- Responsive desktop and mobile navigation.

### Shopping & Checkout
- Guest and authenticated customer carts with HTTP-only guest-cart cookie.
- Quantity and stock validation per product variant.
- Promotions: percentage, fixed-amount, and free-delivery codes with scope, date, usage, and minimum-spend rules.
- Configurable delivery methods and region availability.
- Guest checkout (toggleable by admin).
- Ghana delivery fields: region, city/town, suburb, GhanaPost GPS, landmark, alternate phone, delivery instructions.
- Configurable tax, delivery fees, free-delivery threshold, and inventory reservation window.
- Transactional inventory reservations during order creation.

### Payments & Order Lifecycle
- Paystack integration for card, mobile money, and bank transfers in GHS.
- Server-side validation of reference, amount, and currency before order confirmation.
- Idempotent payment reconciliation and duplicate inventory commit protection.
- Inventory release after failed, abandoned, or expired payments.
- Full order lifecycle: pending payment, confirmed, processing, shipped, out for delivery, delivered, cancelled, refunded.
- Order event timeline, tracking notes, payment status, and delivery info.
- Scheduled endpoints for payment reconciliation and expired inventory reservation cleanup.

### Customer Accounts
- Email-and-password registration and sign-in.
- Ghanaian phone number sign-in.
- Six-digit hashed email OTP verification with auto sign-in.
- OTP-based password recovery with session revocation.
- Optional SMS OTP via Uello Send.
- Dashboard, profile, address book, wishlist, order history, and order tracking.
- Reviews restricted to delivered orders; edited reviews return to moderation.

### Administrator Portal (`/admin`)
- Dashboard metrics and operational summaries.
- Product CRUD with variants, media, tags, size guides, SEO, and related products.
- Categories, collections, brands, and artisan records.
- Inventory management with low-stock monitoring, adjustments, movement history, and CSV export.
- Order search, status changes, tracking updates, and event history.
- Customer search, account details, banning, and status management.
- Payment attempts, provider status, failure details, and manual Paystack verification.
- Promotions and discount targeting.
- Review moderation with admin notes.
- Homepage section and editorial content management with preview.
- Support ticket queues and status handling.
- Date-filtered reporting (sales, payments, customers, inventory, products, categories, discounts) with CSV export.
- Store identity, support details, social links, checkout settings, and delivery-method configuration.
- Global search across products, orders, and customers.
- Audit logs for sensitive admin operations.

---

## Technology Stack

| Area                     | Technology                                        |
| ------------------------ | ------------------------------------------------- |
| Framework                | Next.js 16 App Router + Turbopack                 |
| UI                       | React 19, TypeScript, Tailwind CSS 4, shadcn/base-ui |
| Client Data              | TanStack Query, Axios                             |
| Forms & Validation       | React Hook Form, Zod                              |
| Authentication           | Better Auth (admin, email OTP, phone plugins)     |
| Database                 | PostgreSQL, Prisma ORM                            |
| Payments                 | Paystack (GHS)                                    |
| Media                    | Cloudinary                                        |
| Email                    | Nodemailer (SMTP)                                 |
| SMS                      | Uello Send HTTP API                               |
| Content Editing          | Tiptap                                            |
| Charts & Reporting       | Recharts, CSV exports                             |
| State Management         | Zustand                                           |
| Testing & Quality        | Node test runner (tsx), ESLint, TypeScript, Prettier |

---

## Application Routes

| Area               | Routes                                                                         |
| -------------------| ------------------------------------------------------------------------------ |
| Storefront         | `/`, `/shop`, `/search`, `/collections`, `/collections/[slug]`, `/products/[slug]` |
| Shopping           | `/cart`, `/checkout/delivery`, `/checkout/review`, `/checkout/payment`, `/checkout/result` |
| Guest Order Lookup | `/orders/[orderNumber]`                                                        |
| Authentication     | `/login`, `/register`, `/verify-email`, `/forgot-password`                     |
| Customer Account   | `/account`, `/account/orders`, `/account/wishlist`, `/account/addresses`, `/account/settings` |
| Customer Support   | `/support`                                                                     |
| Administrator      | `/admin/login`, `/admin`, and protected `/admin/*` routes                      |
| API                | `/api/*` (grouped by domain)                                                   |

---

## Project Structure

```
app/
  (storefront)/       Public storefront pages
  account/            Protected customer pages
  admin/              Admin auth and protected portal
  api/                Route handlers grouped by domain
  checkout/           Multi-step checkout pages
  generated/prisma/   Generated Prisma client (not committed)
components/
  admin/              Admin screens and shared admin UI
  checkout/           Checkout workflow components
  common/             Shared application components
  customer/           Customer auth and account screens
  storefront/         Storefront pages, shell, and product UI
  ui/                 Reusable UI primitives
lib/                  Auth, database, API, payment, CSV, and utilities
prisma/
  migrations/         Versioned PostgreSQL migrations
  schema.prisma       Data model
  seed.ts             Admin bootstrap script
public/               Icons and public assets
services/             Domain services (admin, storefront, orders, inventory, payments)
tests/                Commerce and utility tests
types/                Shared TypeScript contracts
```

---

## Database & Data Model

The Prisma schema models the full commerce lifecycle:
- Better Auth users, sessions, accounts, and verifications
- Brands, artisans, categories, collections, tags, size guides, products, variants, media
- Inventory quantities and immutable movement records
- Guest and customer carts
- Customer addresses and wishlists
- Promotions, redemption history, and delivery methods
- Orders, snapshot order items, order events, Paystack payment attempts
- Moderated product reviews
- Newsletter subscribers and support tickets
- Editorial pages, configurable homepage sections, and store settings
- Administrator audit logs

Money is stored as integer pesewas to avoid floating-point errors. Order items snapshot product, variant, price, and image data for historical accuracy.

---

## Authentication & Authorization

- Better Auth handles session and credential management.
- Customer registration requires email verification (6-digit hashed OTP).
- Password resets revoke existing sessions.
- Two roles: **CUSTOMER** (storefront + `/account/*`) and **ADMIN** (`/admin/*` portal + admin APIs).
- Page layouts and API handlers independently enforce role access.

---

## Payment & Inventory Processing

- Order creation and inventory reservation run in serializable database transactions.
- Default stock reservation: 30 minutes (configurable 5–180 minutes by admin).
- Paystack is the source of truth for settlement.
- Verification compares provider reference, amount, and currency before confirming.
- Failed/expired orders release reserved stock.
- No Paystack webhook; uses return-path verification, admin verification, and scheduled reconciliation.

### Scheduled Jobs

| Endpoint                               | Purpose                                             |
| -------------------------------------- | --------------------------------------------------- |
| `GET /api/cron/payment-reconciliation` | Rechecks initialized and pending Paystack payments   |
| `GET /api/cron/inventory-reservations` | Cancels expired orders and releases stock            |

---

## Local Setup

1. Install dependencies: `pnpm install`
2. Create `.env` with required credentials (PostgreSQL, Better Auth, Cloudinary, Paystack, SMTP, optional Uello Send)
3. Apply migrations: `pnpm db:migrate`
4. Seed admin: `pnpm seed:admin`
5. Start dev server: `pnpm dev`
6. Open storefront at `http://localhost:3000` and admin at `http://localhost:3000/admin/login`

---

## Available Scripts

| Command            | Purpose                                     |
| ------------------ | ------------------------------------------- |
| `pnpm dev`         | Start Next.js development server            |
| `pnpm build`       | Create production build                     |
| `pnpm start`       | Run production build                        |
| `pnpm typecheck`   | TypeScript check without emitting            |
| `pnpm lint`        | Run ESLint                                  |
| `pnpm format`      | Format files with Prettier                  |
| `pnpm test:commerce` | Run commerce calculation and utility tests |
| `pnpm db:generate` | Regenerate Prisma client                    |
| `pnpm db:migrate`  | Apply committed migrations                  |
| `pnpm seed:admin`  | Create or promote the configured admin      |
