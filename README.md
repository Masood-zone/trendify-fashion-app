# Fashion Trendify GH

Fashion Trendify GH is a full-stack Ghanaian fashion commerce platform built with Next.js. It combines a responsive public storefront, customer accounts, guest checkout, Paystack payments, inventory-aware order processing, content management, and an administrator portal in one application.

The storefront is designed around Ghanaian fashion and craftsmanship. Prices are stored in pesewas and presented in Ghana cedis (GHS), delivery addresses support all 16 regions of Ghana, and the application includes Ghana-focused phone handling and mobile money payment metadata.

## What is included

### Public storefront

- CMS-driven homepage with hero, benefits, category grids, collection spotlights, product carousels, heritage stories, regional trends, and newsletter sections.
- Product catalogue with search, sorting, category, audience, price, Made in Ghana, and availability filters.
- Product details with variants, size and colour selection, stock availability, size guides, product recommendations, and approved customer reviews.
- Published collections, editorial content, About, support, and newsletter subscription pages.
- Responsive desktop and mobile navigation with a persistent shopping cart count.
- Branded favicon, Apple touch icon, theme metadata, and an installable web app manifest at `/manifest.webmanifest`.

### Shopping and checkout

- Guest and authenticated customer carts.
- HTTP-only guest-cart cookie with automatic cart ownership handling.
- Quantity and stock validation for each product variant.
- Percentage, fixed-amount, and free-delivery promotion codes with scope, date, usage, and minimum-spend rules.
- Configurable delivery methods and region availability.
- Guest checkout support that can be enabled or disabled by an administrator.
- Ghana delivery fields, including region, city or town, suburb, GhanaPost GPS, landmark, alternate phone, and delivery instructions.
- Configurable tax, delivery fees, free-delivery threshold, and inventory reservation window.
- Transactional inventory reservations during order creation.
- Guest order access using a private access token, plus account-based order history for registered customers.

### Payments and order lifecycle

- Paystack transaction initialization and verification in GHS.
- Payment records for card, mobile money, and bank-transfer channels, including mobile money network and payer details where supplied.
- Server-side validation of Paystack reference, amount, and currency before an order is confirmed.
- Idempotent payment reconciliation and protection against duplicate inventory commits.
- Inventory release after failed, abandoned, or expired payment attempts.
- Order lifecycle support for pending payment, confirmed, processing, shipped, out for delivery, delivered, cancelled, and refunded orders.
- Order event timeline, tracking notes, payment status, and delivery information.
- Scheduled endpoints for pending-payment reconciliation and expired inventory reservations.

### Customer accounts

- Email-and-password registration and sign-in.
- Sign-in using a Ghanaian phone number and password when a phone is attached to the account.
- Six-digit, hashed email OTP verification with automatic sign-in after verification.
- OTP-based password recovery and session revocation after a password reset.
- Optional SMS OTP delivery through Uello Send.
- Account dashboard, profile settings, address book, wishlist, order history, and detailed order tracking.
- Reviews restricted to products from delivered customer orders.
- Review editing and removal, with edited reviews returned to the moderation queue.

### Administrator portal

The protected administrator portal is available under `/admin` and includes:

- Dashboard metrics and operational summaries.
- Product creation, editing, previewing, archiving, restoration, variants, media, tags, size guides, SEO fields, and related products.
- Categories, collections, brands, and artisan records.
- Inventory levels, low-stock monitoring, adjustments, movement history, and CSV export.
- Order search, detail views, status changes, tracking updates, and event history.
- Customer search, account detail, banning, and status management.
- Payment attempts, provider status, failure details, and manual Paystack verification.
- Promotions and discount targeting.
- Review moderation with administrator notes.
- Homepage section and editorial content management with preview support.
- Support-ticket queues and status handling.
- Date-filtered sales, payment, customer, inventory, product, category, and discount reporting.
- Verified-sales CSV export.
- Store identity, support details, social links, checkout settings, and delivery-method configuration.
- Global search across products, orders, and customers.
- Audit logs for sensitive administrator operations.

### Platform behavior

- Responsive interface using the App Router, React Server Components, and client-side query caching where interactive data is required.
- Light and dark theme support.
- Typed API payloads and shared response handling.
- Zod validation at API boundaries.
- Role-aware server-side protection for customer and administrator routes.
- PostgreSQL persistence through Prisma.
- Cloudinary-backed administrator media uploads with a 20 MB request limit.
- SMTP email delivery for verification and password-recovery codes.
- SMS OTP integration through Uello Send.

## Technology stack

| Area                 | Technology                                                    |
| -------------------- | ------------------------------------------------------------- |
| Framework            | Next.js 16 App Router and Turbopack                           |
| UI                   | React 19, TypeScript, Tailwind CSS 4, shadcn/base-ui patterns |
| Client data          | TanStack Query, Axios                                         |
| Forms and validation | React Hook Form, Zod                                          |
| Authentication       | Better Auth with admin, email OTP, and phone-number plugins   |
| Database             | PostgreSQL, Prisma ORM, Prisma PostgreSQL adapter             |
| Payments             | Paystack                                                      |
| Media                | Cloudinary                                                    |
| Email                | Nodemailer over SMTP                                          |
| SMS                  | Uello Send HTTP API                                           |
| Content editing      | Tiptap                                                        |
| Charts and reporting | Recharts and CSV exports                                      |
| Testing and quality  | Node test runner through `tsx`, ESLint, TypeScript, Prettier  |

## Application routes

| Area               | Main routes                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------- |
| Storefront         | `/`, `/shop`, `/search`, `/collections`, `/collections/[slug]`, `/products/[slug]`            |
| Shopping           | `/cart`, `/checkout/delivery`, `/checkout/review`, `/checkout/payment`, `/checkout/result`    |
| Guest order lookup | `/orders/[orderNumber]`                                                                       |
| Authentication     | `/login`, `/register`, `/verify-email`, `/forgot-password`                                    |
| Customer account   | `/account`, `/account/orders`, `/account/wishlist`, `/account/addresses`, `/account/settings` |
| Customer support   | `/support`                                                                                    |
| Administrator      | `/admin/login`, `/admin`, and protected `/admin/*` management routes                          |
| Metadata           | `/manifest.webmanifest`                                                                       |

Application APIs live under `/api` and are grouped into storefront, customer, administrator, authentication, payments, uploads, and scheduled-job routes.

## Project structure

```text
app/
  (storefront)/       Public storefront pages
  account/            Protected customer pages
  admin/              Administrator authentication and protected portal
  api/                Route handlers grouped by domain
  checkout/           Multi-step checkout pages
  generated/prisma/   Generated Prisma client; not committed
  manifest.ts         Web app manifest
components/
  admin/              Administrator screens and shared admin UI
  checkout/           Checkout workflow components
  common/             Shared application components
  customer/           Customer authentication and account screens
  storefront/         Storefront pages, shell, and product UI
  ui/                 Reusable UI primitives
lib/                  Authentication, database, API, payment, CSV, and utility code
prisma/
  migrations/         Versioned PostgreSQL migrations
  schema.prisma       Data model
  seed.ts             Administrator bootstrap script
public/               Icons and other public assets
services/             Domain services for admin, storefront, orders, inventory, and payments
tests/                Commerce and utility tests
types/                Shared TypeScript contracts
```

## Prerequisites

- Node.js 20.9 or newer.
- pnpm 11 or a compatible pnpm release.
- A PostgreSQL database.
- Cloudinary credentials for administrator media uploads.
- Paystack test or live keys for checkout payments.
- An SMTP server for customer verification and password recovery.
- Uello Send credentials only if SMS OTP delivery is required.

## Local setup

1. Enter the application directory.

   ```powershell
   cd trendify-fashion-app
   ```

2. Install dependencies. The `postinstall` script also generates the Prisma client.

   ```powershell
   pnpm.cmd install
   ```

3. Create a `.env` file in the application root and configure the required services. The file is ignored by Git.

   ```dotenv
   # PostgreSQL
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"

   # Better Auth and application URLs
   BETTER_AUTH_SECRET="replace-with-a-long-random-secret"
   BETTER_AUTH_URL="http://localhost:3000"
   NEXT_PUBLIC_API_BASE_URL="http://localhost:3000/api"

   # Cloudinary
   CLOUDINARY_CLOUD_NAME=""
   CLOUDINARY_API_KEY=""
   CLOUDINARY_API_SECRET=""

   # Paystack
   PAYSTACK_API_PUBLIC_KEY="pk_test_..."
   PAYSTACK_API_SECRET_KEY="sk_test_..."

   # SMTP
   SMTP_HOST=""
   SMTP_PORT="587"
   SMTP_SECURE="false"
   SMTP_USER=""
   SMTP_PASS=""
   SMTP_FROM="Fashion Trendify GH <no-reply@example.com>"

   # Optional Uello Send SMS delivery
   UELLOSEND_API_URL=""
   UELLOSEND_API_KEY=""
   UELLOSEND_API_SECRET=""
   UELLOSEND_SENDER_ID="TrendifyGH"

   # Protected scheduled jobs
   CRON_SECRET="replace-with-another-long-random-secret"

   # Administrator bootstrap
   ADMIN_NAME="Trendify Administrator"
   ADMIN_EMAIL="admin@example.com"
   ADMIN_PASSWORD="replace-with-a-secure-password"
   ```

4. Apply the committed database migrations.

   ```powershell
   pnpm.cmd db:migrate
   ```

5. Create or promote the initial administrator.

   ```powershell
   pnpm.cmd seed:admin
   ```

   The seed requires `ADMIN_NAME`, `ADMIN_EMAIL`, and an `ADMIN_PASSWORD` containing at least eight characters. It is safe to run repeatedly. Re-running it restores the configured user to the administrator role and unbans the account, but it deliberately preserves an existing credential password.

6. Start the development server.

   ```powershell
   pnpm.cmd dev
   ```

7. Open the application.

   - Storefront: `http://localhost:3000`
   - Administrator login: `http://localhost:3000/admin/login`

## Environment variables

| Variable                                        | Required for                 | Notes                                                                                      |
| ----------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------ |
| `DATABASE_URL`                                  | All database-backed features | PostgreSQL connection string used by Prisma and the runtime adapter.                       |
| `BETTER_AUTH_SECRET`                            | Authentication               | Use a long, random production secret.                                                      |
| `BETTER_AUTH_URL`                               | Authentication               | Public origin of the deployed application.                                                 |
| `NEXT_PUBLIC_API_BASE_URL`                      | Browser API and auth clients | Use the application origin followed by `/api`, for example `https://shop.example.com/api`. |
| `CLOUDINARY_CLOUD_NAME`                         | Admin uploads                | Cloudinary account cloud name.                                                             |
| `CLOUDINARY_API_KEY`                            | Admin uploads                | Server-side Cloudinary API key.                                                            |
| `CLOUDINARY_API_SECRET`                         | Admin uploads                | Server-side Cloudinary secret; never expose it to the browser.                             |
| `PAYSTACK_API_PUBLIC_KEY`                       | Payment initialization       | Public Paystack test or live key.                                                          |
| `PAYSTACK_API_SECRET_KEY`                       | Payment verification         | Secret Paystack key used only on the server.                                               |
| `SMTP_HOST`                                     | Email OTP                    | Required for sign-up verification and password recovery.                                   |
| `SMTP_PORT`                                     | Email OTP                    | Defaults to `587`.                                                                         |
| `SMTP_SECURE`                                   | Email OTP                    | Usually `false` for port 587 and `true` for port 465.                                      |
| `SMTP_USER` / `SMTP_PASS`                       | Email OTP                    | SMTP credentials when authentication is required.                                          |
| `SMTP_FROM`                                     | Email OTP                    | Sender identity; falls back to `SMTP_USER`.                                                |
| `UELLOSEND_API_URL`                             | SMS OTP                      | Optional unless phone OTP delivery is enabled for users.                                   |
| `UELLOSEND_API_KEY` / `UELLOSEND_API_SECRET`    | SMS OTP                      | Uello Send request credentials.                                                            |
| `UELLOSEND_SENDER_ID`                           | SMS OTP                      | Defaults to `TrendifyGH`.                                                                  |
| `CRON_SECRET`                                   | Scheduled jobs               | Bearer token protecting reconciliation and reservation-expiry endpoints.                   |
| `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Administrator seed           | Used only by `pnpm.cmd seed:admin`.                                                        |

Do not commit `.env` files or expose any server-side secret through a `NEXT_PUBLIC_*` variable.

## Database and data model

The Prisma schema models the complete commerce lifecycle, including:

- Better Auth users, sessions, accounts, and verifications.
- Brands, artisans, categories, collections, tags, size guides, products, variants, and media.
- Inventory quantities and immutable movement records.
- Guest and customer carts.
- Customer addresses and wishlists.
- Promotions, redemption history, and delivery methods.
- Orders, snapshot order items, order events, and Paystack payment attempts.
- Moderated product reviews.
- Newsletter subscribers and support tickets.
- Editorial pages, configurable homepage sections, and store settings.
- Administrator audit logs.

Money is persisted as integer pesewas to avoid floating-point currency errors. Order items also store product, variant, price, and image snapshots so historical orders remain readable when the catalogue changes.

Useful database commands:

```powershell
# Regenerate the Prisma client after a schema change
pnpm.cmd db:generate

# Apply committed migrations
pnpm.cmd db:migrate

# Bootstrap the configured administrator
pnpm.cmd seed:admin
```

The generated client is written to `app/generated/prisma` and is excluded from version control.

## Payment and inventory processing

Order creation and inventory reservation run in serializable database transactions. By default, stock is reserved for 30 minutes, although administrators can configure a window between 5 and 180 minutes.

Paystack is treated as the source of truth for settlement. Verification compares the provider reference, amount, and currency with the local payment attempt before inventory is committed and an order is confirmed. Failed or expired orders release their reserved stock.

The current integration uses return-path verification, administrator verification, and scheduled reconciliation. There is no Paystack webhook route in this repository.

### Scheduled jobs

Configure the deployment scheduler to call these endpoints with an `Authorization: Bearer <CRON_SECRET>` header:

| Endpoint                               | Purpose                                                                         |
| -------------------------------------- | ------------------------------------------------------------------------------- |
| `GET /api/cron/payment-reconciliation` | Rechecks initialized and pending Paystack payments.                             |
| `GET /api/cron/inventory-reservations` | Performs a final payment check, then cancels expired orders and releases stock. |

A five-to-ten-minute schedule is suitable for most deployments. Choose a frequency that is shorter than the configured inventory reservation window.

Example local request:

```powershell
curl.exe -H "Authorization: Bearer $env:CRON_SECRET" http://localhost:3000/api/cron/payment-reconciliation
```

## Authentication and authorization

Better Auth provides the underlying session and credential management. Customer registration requires email verification. Verification codes are six digits, stored in hashed form, and delivered through the configured SMTP server. Password resets revoke existing sessions.

There are two application roles:

| Role       | Access                                              |
| ---------- | --------------------------------------------------- |
| `CUSTOMER` | Storefront and protected `/account/*` pages.        |
| `ADMIN`    | Protected `/admin/*` portal and administrator APIs. |

Page layouts and API handlers independently enforce role access. Banned administrators are rejected by the protected administrator layout.

## Media uploads

Administrator uploads are sent to Cloudinary and recorded as `MediaAsset` rows. Supported upload purposes include products, brands, artisans, categories, collections, homepage sections, and editorial content. The upload API is administrator-only and rejects files larger than 20 MB.

## Available scripts

| Command                  | Purpose                                         |
| ------------------------ | ----------------------------------------------- |
| `pnpm.cmd dev`           | Start the Next.js development server.           |
| `pnpm.cmd build`         | Create an optimized production build.           |
| `pnpm.cmd start`         | Run a completed production build.               |
| `pnpm.cmd typecheck`     | Run TypeScript without emitting files.          |
| `pnpm.cmd lint`          | Run ESLint across the repository.               |
| `pnpm.cmd format`        | Format TypeScript and TSX files with Prettier.  |
| `pnpm.cmd test:commerce` | Run commerce calculation and utility tests.     |
| `pnpm.cmd db:generate`   | Generate the Prisma client.                     |
| `pnpm.cmd db:migrate`    | Apply committed Prisma migrations.              |
| `pnpm.cmd seed:admin`    | Create or promote the configured administrator. |

## Validation

Run the main project checks before opening a pull request or deploying:

```powershell
pnpm.cmd typecheck
pnpm.cmd lint
pnpm.cmd test:commerce
pnpm.cmd build
```

The commerce test suite currently covers tax calculation, free-delivery thresholds, safe Ghana/GHS checkout defaults, safe authentication callbacks, and Ghana phone-number normalization.

## Production deployment checklist

1. Provision PostgreSQL and set the production `DATABASE_URL`.
2. Configure production Better Auth URLs and strong secrets.
3. Use Paystack live keys only in the production environment.
4. Configure Cloudinary, SMTP, and optional Uello Send credentials.
5. Set `NEXT_PUBLIC_API_BASE_URL` to the deployed origin followed by `/api`.
6. Run `pnpm.cmd db:migrate` during deployment.
7. Run `pnpm.cmd seed:admin` once with secure bootstrap credentials, then remove the bootstrap password from routine deployment configuration where possible.
8. Configure both protected scheduled-job endpoints.
9. Verify image delivery from `res.cloudinary.com` and any configured external media hosts.
10. Complete a Paystack live-mode purchase and confirm payment reconciliation, order state, and inventory movement before launch.

## Web app manifest

The App Router generates the manifest from `app/manifest.ts`. It provides the application name, description, theme colours, standalone display mode, and 192×192 and 512×512 branded icons. Apple home-screen and favicon metadata are configured in `app/layout.tsx`.

The manifest provides browser installation metadata only. The application does not currently register a service worker and should not be described as offline-capable.

## Operational notes

- Publish products, collections, content, and homepage sections before expecting them to appear publicly.
- Configure at least one active delivery method before attempting checkout.
- Customer verification and recovery flows fail intentionally when SMTP is not configured.
- Paystack test keys should be used for local development and staging.
- The administrator seed does not overwrite an existing credential password.
- Product reviews become public only after administrator approval.
- Store support details and checkout behavior are editable from the administrator settings area.

## License

No license file is currently included. Treat this repository as private unless the project owner adds an explicit license.
