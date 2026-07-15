# TrendifyGH catalogue simulation prompt

Copy everything below into a new GPT/Codex conversation that has access to this repository and an image-generation tool.

---

You are working in the `trendify-fashion-app` repository. Build a complete, coherent, development-only commerce simulation for Fashion Trendify GH. Do not merely describe the data: inspect the repository, generate the assets, implement the seed, run it, and verify it.

## Read before changing anything

1. Read every applicable `AGENTS.md` and repository instruction file.
2. Read `prisma/schema.prisma` completely. Treat its enums, relations, required fields, uniqueness constraints, money units, publication states, soft-delete fields, and inventory model as the source of truth.
3. Inspect `prisma/seed.ts`, `package.json`, Prisma configuration, environment loading, and the current seed workflow.
4. Inspect the administrator forms, their Zod validators, and the corresponding admin APIs for brands, artisans, media, categories, collections, tags, size guides, products, variants, promotions, delivery methods, store settings, content pages, and homepage sections. Populate the exact fields the administrator can manage; do not invent disconnected fields.
5. Inspect the public storefront API serializers and the fixed canonical homepage section definitions before choosing relations or content.
6. Preserve all existing administrator credentials and operational baseline records. Never print secrets or passwords.

## Safety and execution rules

- Create an idempotent seed at `prisma/seed-simulation.ts` and add a clear package command named `seed:simulation`.
- Refuse to run when `NODE_ENV` is `production` or when the database URL looks like a known production database. Require an explicit opt-in such as `ALLOW_SIMULATION_SEED=true`.
- Do not truncate tables, reset the database, run destructive migrations, delete unrelated records, or wipe existing users.
- Use stable simulation slugs, SKUs, codes, and keys. Use `upsert`, unique-key lookups, and relation synchronization so a second run updates the same simulation records without duplication.
- Wrap logically coupled writes in Prisma transactions. Report useful counts at the end, but never log guest tokens, credentials, Paystack secrets, or other sensitive values.
- Store all prices and monetary thresholds in integer pesewas. Use `GHS` and Ghana (`GH`) where the schema supports them.
- Mark purchasable catalogue records active and published according to the schema. Do not make draft, archived, deleted, or zero-stock-only products appear as the main demo catalogue.

## Original Ghanaian brand universe

Create at least three entirely original Ghanaian fashion brands. Do not imitate, reuse, or imply endorsement by a real company. Give each brand a distinct visual system, voice, Accra/Kumasi/Tamale/Cape Coast or other Ghana-based story, customer audience, craft practice, color palette, logo, short description, full story, SEO title, SEO description, social/contact data where supported, and active/published state.

Use these creative directions as a starting point, but refine them after inspecting the available fields:

1. `Nkyinkyim House` — refined contemporary clothing using structured silhouettes, subtle Adinkra geometry, woven details, and a warm cocoa/clay/ivory palette.
2. `Sankofa Steps` — modern footwear and leather goods combining practical city wear with locally finished leather, woven accents, indigo, brass, and deep forest tones.
3. `Ahenema & Loom` — jewellery, bags, and accessories inspired by ceremonial forms, beadwork, brass work, and vibrant textiles, presented in a premium modern style.

Each brand must offer 6–8 purchasable products, for a total of 18–24 products. Across the whole catalogue include dresses, shirts or tops, trousers or skirts, outerwear, sandals or shoes, bags, jewellery, and accessories. Ensure every brand has a believable assortment instead of three copies of the same catalogue.

## Product completeness

For every product populate every relevant administrator-supported field, including:

- brand and optional artisan attribution;
- original product name and stable slug;
- concise summary, rich long description, design story, material/fabric details, care instructions, origin and Made-in-Ghana status;
- audience, product type, active/publication/new-arrival/featured flags where available;
- SEO title, SEO description, keywords or tags;
- category, collection, and tag relations;
- an appropriate size guide;
- multiple coordinated variants with stable unique SKUs, option/size labels, color names and hex values, integer price in pesewas, optional compare-at price, realistic stock on hand, low-stock threshold, active status, weight or dimensions where supported;
- enough available stock for normal checkout, plus a small deliberate set of low-stock and unavailable variants so empty/conflict states can be demonstrated without making the catalogue unusable;
- primary and gallery media with useful alt text, correct sort order, and accurate `MediaAsset` plus `ProductMedia` relations;
- complementary or similar-product recommendation relations that never point to drafts, archived products, deleted products, or the product itself.

Use realistic Ghana-market pricing and coherent price differences between variants. Avoid filler such as “Lorem ipsum,” “Product 1,” generic repeated descriptions, impossible materials, duplicated SKUs, fake certifications, or unsupported cultural claims.

## Image and media generation

Use the available image-generation tool to create coordinated local assets. Do not depend on hotlinked images or temporary remote URLs.

- Create one original transparent-background brand logo per brand, plus a useful light/dark or mark variant if the schema and UI can use it.
- Create at least two clean product images per product: a consistent primary editorial/catalogue image and a complementary detail or alternate-view image. Keep each product visually consistent across its images and accurately reflect its stated colors/materials.
- Create the homepage hero, collection spotlight, heritage story, and regional-trend imagery needed by the canonical homepage slots.
- Show Ghanaian models with varied skin tones, ages, body types, and styling where people are used. Keep the work respectful, natural, premium, and commercially usable. Avoid visible third-party logos, watermarks, garbled text, copied trademarks, or stereotyped costume treatment.
- Optimize output as WebP or another repository-supported web format at sensible storefront dimensions. Save files under `public/simulation/brands`, `public/simulation/products`, and `public/simulation/homepage` with stable lowercase filenames.
- Create or upsert a `MediaAsset` row for every generated file and connect product images through `ProductMedia`. Fill MIME type, dimensions, alt text, purpose, and local public URL fields exactly as supported by the schema. If a provider-specific field is required, use an explicit stable simulation value rather than pretending the image was uploaded to a real provider.

Before generating all assets, produce one brand logo, one product primary image, and one homepage image as a visual consistency sample. Inspect them, adjust the shared art direction if needed, then generate the complete set. Do not pause for user approval unless repository instructions require it.

## Supporting catalogue and operations data

Create coherent, related supporting data rather than isolated products:

- at least 4 artisan profiles connected to appropriate products/brands;
- a navigable category hierarchy covering clothing, footwear, bags, jewellery, and accessories;
- at least 5 curated collections, including new arrivals and at least one cross-brand editorial collection;
- useful tags and product/tag links;
- clothing, footwear, jewellery, and accessory size guides with structured measurements/instructions matching the schema;
- product recommendations across compatible products;
- at least 2 valid promotions and 2 inactive/expired examples, exercising percentage, fixed-value, or free-delivery behavior supported by the schema without unrealistic stacking;
- active delivery methods covering Greater Accra and nationwide Ghana scenarios, with realistic fees, estimates, supported regions, and stable codes;
- content pages for About, Support/Help, Shipping/Delivery, Returns, Privacy, and Terms, using the exact slugs consumed by the app;
- navigation/footer configuration if it is persisted in store settings.

## Store and checkout settings

Upsert the administrator-managed default store settings. Use this simulation checkout configuration:

```json
{
  "guestCheckout": true,
  "reservationMinutes": 30,
  "taxRateBasisPoints": 1500,
  "freeDeliveryThresholdPesewas": 100000,
  "country": "GH",
  "currency": "GHS"
}
```

The 15% tax is simulation data only. Never hardcode 15% into checkout or payment logic; the application must continue reading the administrator-configured basis-point value. Tax applies to discounted merchandise, excludes delivery, and is rounded by the existing server logic.

## Fixed canonical homepage

Populate and publish exactly the canonical fixed slots already defined by the application, in their required order:

1. hero
2. benefits
3. category grid
4. collection spotlight
5. product carousel
6. heritage story
7. regional trends
8. newsletter

Use the exact stored keys/types expected by the app. Provide polished headings, supporting text, CTA labels/URLs, generated imagery, and relevant product/category/collection/item relations. Administrators may edit slot content and visibility, but the simulation seed must not introduce arbitrary section types, reorder slots, or alter layout/CSS.

## Optional customer and order demonstrations

Only create a customer when all required environment variables are explicitly supplied, for example `SIMULATION_CUSTOMER_EMAIL`, `SIMULATION_CUSTOMER_PASSWORD`, `SIMULATION_CUSTOMER_FIRST_NAME`, and `SIMULATION_CUSTOMER_LAST_NAME`. Use the repository’s Better Auth-compatible password/account workflow; do not manually store plain-text passwords. Mark the customer verified only when an explicit variable such as `SIMULATION_CUSTOMER_VERIFIED=true` is present.

When that customer exists, optionally create several representative orders through idempotent stable references:

- one confirmed/paid order with Paystack test-style payment metadata and tracking events through delivery;
- one pending-payment order with an active inventory reservation;
- one cancelled or failed-payment order with released inventory;
- one fulfilled order suitable for an approved product review.

Use only schema-valid statuses and event types. Keep payment provider references obviously simulated and never call Paystack or claim real payment success from seed code. Do not expose guest access tokens. Re-running the seed must not duplicate orders, payments, events, reservations, redemptions, or stock movements.

## Verification and handoff

After implementation:

1. Run Prisma generation if needed.
2. Run the simulation seed twice and prove the second run is idempotent by comparing counts and stable unique identifiers.
3. Verify every active product has a brand, category, at least one available variant, a primary image, complete SEO/care/material data, valid integer pricing, and unique SKUs.
4. Verify homepage slots are exactly the canonical eight, correctly ordered, published as intended, and connected to existing records/assets.
5. Verify media files exist locally for every seeded local URL.
6. Verify no existing administrator user or credential was modified.
7. Run `pnpm.cmd test:commerce`, `pnpm.cmd typecheck`, `pnpm.cmd lint`, and `pnpm.cmd build`.
8. Return a concise summary of created brands/products/assets/supporting records, the exact seed command, optional environment variables, validation results, and any honest limitations. Include clickable paths to the seed and asset manifest. Do not report success for a step you did not actually run.

---
