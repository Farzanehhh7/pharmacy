# Master Prompt: Online Pharmacy, Supplements & Health-Care Store (large category tree)

> English version. The **storefront and admin dashboard UI must be in Persian (Farsi, RTL)**. All code, identifiers, database names, comments, commits and documentation are in English.
> Copy everything between `BEGIN PROMPT` and `END PROMPT`. Put the two companion files in the repo before starting:
> - `docs/DATA_AND_ADMIN_SPEC.md` (the generic base spec from the dental project: DB conventions, admin, RBAC, search, state machines, SEO infrastructure)
> - `docs/PHARMACY_SPEC.md` (this project's spec: taxonomy, attributes, regulatory model, health-content rules, SEO deltas). **It overrides the base spec wherever they differ.**
> Informed by an analysis of darukade.com (home page and a product page). Where that site breaks the rules below, the rules below win.

---

## ▼▼▼ BEGIN PROMPT ▼▼▼

You are a senior software architect and full-stack engineer. Build an **online pharmacy-style store for non-prescription medicines, dietary supplements, dermo-cosmetics, personal care, mother & child, sports nutrition, herbal products and home medical supplies** at production quality, not a demo. Design for large data (50,000+ products, 1,000+ categories and sub-categories, 1,500+ brands, 5,000+ active ingredients) even if day one has ~2,000 products.

This is a **health-adjacent ("Your Money or Your Life") site**. Trust, accuracy and compliance are product features, and they are also the biggest SEO factor.

## 0. Language and source of truth

- **User-facing language: Persian (fa-IR), fully RTL**, for storefront and admin. Dates in the Jalali calendar, Persian digits, currency in Toman (switchable to Rial).
- **Everything technical is English:** code, identifiers, table/column names, API routes, comments, commits, README, docs.
- All UI strings live in i18n message files (`messages/fa.json`, `en.json` stubbed). No hardcoded UI strings. ICU plural/number formatting.
- **Read `docs/PHARMACY_SPEC.md` first, then `docs/DATA_AND_ADMIN_SPEC.md`.** Precedence: PHARMACY_SPEC > DATA_AND_ADMIN_SPEC > this prompt, except §1 (governing principles) and §13 (Do NOT list), which always win. Log every deviation and assumption in `ASSUMPTIONS.md`.

## 1. Governing principles (they override everything else)

1. **No hardcoded data in the UI.** Stock status, ratings, review counts, view counts, sales counts, discount percentages, timers and badges all come from the database.
2. **No fake urgency or fake trust.** A countdown exists only for a real, stored campaign end date. A struck-through price appears only for a real, time-bound, recorded discount. Ratings and reviews are real only. **Never show raw stock quantities ("only 3 left") or inflated "views / visits" numbers unless they are real, current, and enabled by a setting**; the default is a simple availability state.
3. **Price always has an explicit state:** fixed, range (variants), "call for price", out of stock, or coming soon. Never "0 Toman", never "0 – X".
4. **Variants are variants, not separate products.** Flavors (vanilla, chocolate, banana), pack sizes (30 / 60 / 90 capsules), strengths and colors belong to one product with variants.
5. **Everything that changes with the business is editable from the admin, not code:** categories, attributes, customer groups, campaigns, menus, banners, home sections, forbidden-claim lists, disclaimers.
6. **One system per job:** one cart, one slider library, one menu system, one timer, one chat widget, one analytics tag manager.
7. Server-authoritative pricing, stock and **purchase eligibility**: totals and "can this item be sold online" are decided on the server, never trusted from the client.
8. **SEO-first, not SEO-later.** Every page type is built on shared SEO primitives (metadata, canonical, robots rules, JSON-LD builders, breadcrumbs, URL registry) delivered in Stage 1, before any page is built. Rules: §7 and `docs/PHARMACY_SPEC.md` §12 plus base spec §17. No page ships without passing the automated SEO gates.
9. **Health content is regulated content.** No product or article may promise to cure, treat or prevent a disease unless the claim comes from an approved, stored source (label, licence, or a named pharmacist/physician reviewer). Every health claim has an owner and a review date. See §5.11 and spec §10.
10. **Regulatory class decides what can be sold.** Prescription-only and controlled products are **never purchasable online** in this system (hard server-side block, tested). Products need valid licence data before they can be published. See spec §6.
11. If something is truly ambiguous, ask at most **5 key questions** before starting. Otherwise proceed and record assumptions.

## 2. Context

- Market: Iran. Persian (RTL). Toman stored as integers. Jalali in the UI, UTC in the database.
- Customers: retail shoppers (B2C), athletes and gym users, parents, people managing long-term care needs, pharmacies/clinics/gyms/shops (B2B wholesale), and visitors who arrive from search for information first and shop second.
- Catalog character: **very wide** (cosmetics, supplements, sports nutrition, mother and child, medical supplies and devices, herbal teas and extracts, personal hygiene, OTC medicines) and **very deep** (e.g. Supplements > Sports > Gainer > product). Many products have flavor/size variants and ingredient lists. Many shoppers search by **active ingredient, concern, or brand** rather than by product name.
- Two product behaviors:
  - **Fast-moving consumables:** repeat purchases, expiry dates, batches, lot recall capability.
  - **Considered purchases:** devices (blood-pressure monitors, glucometers, orthopaedic supports) with warranty, manuals and certificates.
- **Trust layer** is part of the product: pharmacy licence, responsible pharmacist, authenticity (original-product) guarantees, storage and shipping conditions for sensitive products, licence numbers per product.
- Hosting assumption: servers inside Iran (gateways, eNamad, SMS). Every external service sits behind an abstraction and is not required for the system to boot.
- Extensibility: `vertical` field on categories/brands/products (`pharmacy`, `dental`, `medical_devices`) so other stores can be added, but **version 1 ships pharmacy only**.

## 3. Tech stack

- Next.js (latest stable, App Router) + TypeScript (strict) + Tailwind CSS (logical properties / RTL-first) + shadcn/ui
- PostgreSQL + Prisma (or Drizzle, with a stated reason)
- Redis (cache, sessions, rate limiting) + BullMQ
- Meilisearch (or Typesense, with justification) for search and facets, synced idempotently from the DB
- S3-compatible storage (MinIO); automatic WebP/AVIF variants; **raster `og:image` generation**
- Auth: SMS OTP + email/password; SMS provider abstraction
- Payments: gateway abstraction with Zarinpal and IDPay adapters; server-side Verify, idempotency
- Jalali date library (server-side conversion mandatory)
- Admin UI: TanStack Table, ECharts or Recharts (RTL-correct)
- Docker + docker-compose; CI (lint, typecheck, tests, build, SEO gates)
- Observability: structured logs, error tracking, health checks
- Third-party scripts (analytics, live chat) load through **one** consent-aware loader, deferred after interaction/idle, never blocking render

## 4. Data model (design first, then code)

Before application code, deliver: the complete Prisma schema, a Mermaid ERD, the index rationale and the API list. **Implement the base schema from `docs/DATA_AND_ADMIN_SPEC.md` §4–§6 plus the additions in `docs/PHARMACY_SPEC.md` §4–§7.** Highlights of what is specific to this store:

- **Deep category tree** (unlimited depth, materialized path, per-category attribute sets with inheritance) with the pharmacy seed taxonomy in the spec. Cross-listing allowed; one primary category per product.
- **Brands** with Persian/English names, country, manufacturer/importer entity, logo, authorized-distributor status, dedicated page.
- **Active ingredients** (`ingredients`) as first-class entities, linked to products with amount and unit, and to concerns/usage. Ingredient pages are indexable hubs.
- **Product regulatory data** (`product_regulatory`): regulatory class, health-ministry licence/IRC/UID codes, licence holder, licence expiry, authenticity-label type, GTIN, storage conditions, age restrictions, pregnancy/breastfeeding notes, warnings. Licence expiry blocks publication.
- **Dosage and usage** as structured content (how to use, who it is for, who should not use it, interaction warnings), reviewed by a named professional.
- **Variants** (flavor, size, count, strength) with own SKU, barcode, price, stock, weight, image.
- **Batches and expiry** with FEFO, near-expiry badge (configurable threshold), recall flag per batch, and hard block on selling expired stock.
- **Pricing:** base, time-bound discount, tiered quantity, per-customer-group, B2B contract, and **price history** (every discount provable).
- **Q&A with pharmacist answers** (`product_questions`, `product_answers` with responder credentials and moderation state), reviews (verified purchase), FAQ.
- **Expert review text** per product (`product_expert_reviews`: author, credentials, reviewed date).
- **Editorial magazine** (`blog_posts`) with author profiles, medical reviewer, sources/citations, last-reviewed date.
- **Landing pages** (campaign/seasonal/concern) as a controlled page type with SEO rules (spec §12.8).
- **Customers, addresses, orders, payments, shipments, invoices, returns, coupons, wishlists, compare, back-in-stock requests, unavailable-item requests, tickets, redirects, import/export jobs, audit log** as in the base spec.
- Optional, behind feature flags: prescription upload/pharmacist review flow (see §9), B2B verification, installment/cheque requests, agents/branches.
- Integers for money. Index every searchable/filterable/join column and explain it.

## 5. Storefront (all UI in Persian, RTL)

1. **Home page:** hero banners, category entry blocks, special offers (real timer), best sellers, newest, brands, concerns/needs shortcuts, magazine posts, trust section (pharmacy licence, eNamad, responsible pharmacist, address, phones, hours, authenticity promise). Content only from the database.
2. **Mega menu:** multi-level, keyboard-accessible, mobile-friendly, generated from the category tree plus curated groups (brands, concerns), not hand-written HTML.
3. **Category page:** sorting (newest, price, best selling, discount, most favorited), **dynamic faceted filters** (brand, ingredient, price, availability, flavor, size, form (capsule/tablet/powder/liquid), age group, category-specific attributes), faceted counts, filter state in the URL, breadcrumbs, a short useful intro (100–250 words, one block), and links to sub-categories and top brands.
4. **Search:** instant autocomplete; typo tolerance; Persian/Arabic normalization; search by product name (Persian/English), brand, **active ingredient**, concern, SKU, GTIN, IRC code; admin-managed synonyms (brand transliterations, drug name variants); "can't find it? request this item"; zero-result log for the admin.
5. **Product card:** fixed-size image, Persian name, English name, brand, price state, real discount percent, real availability, badges (new, near expiry), quick view, wishlist, compare, the right CTA ("Add to cart" without variants, "Choose options" with variants). **No fake stars, no raw stock counts, no inflated view counters.**
6. **Product page:** zoomable gallery (and video), variant selector (price/stock/image update), group price, tiered price, real availability, batch/expiry information, **regulatory block** (licence code, importer/manufacturer, authenticity info, storage), properties table, ingredients table (links to ingredient pages), "how to use / dosage", **warnings and contraindications**, expert review, FAQ, **Q&A with pharmacist answers**, reviews, related and alternative products, back-in-stock, compare, downloadable leaflet/certificate where available, Schema.org. Medical disclaimer block (text managed in admin).
7. **Compare (up to 4), wishlist, recently viewed.**
8. **Cart and checkout:** persistent cart, coupons, shipping calculation (with cold-chain/fragile flags when needed), guest and member checkout, online payment, server-side eligibility check (regulatory class, quantity limits per product, age restriction), "pay a pending order".
9. **Customer account:** orders and tracking, invoices, addresses, tickets, wishlist, **reorder**, back-in-stock subscriptions.
10. **Other pages:** brands (A–Z) and brand pages, **ingredient pages**, **concern/need hubs**, magazine, landing pages, return and refund policy (including rules for health products), shipping and storage policy, authenticity guarantee, licences and certificates, about/contact, pharmacist profiles.
11. **Health-content safeguards (visible and enforced):**
    - Every product/article page shows the reviewer's name and credentials where health claims are made, and a "last reviewed" date.
    - Claims checker: a configurable forbidden/restricted phrase list (disease-cure claims, "guaranteed", "miracle", weight-loss absolutes). Publishing content that matches is blocked or needs a named approver (spec §10).
    - Pharmacist answers in Q&A follow templates: general information only, no individual diagnosis, redirect to a doctor when symptoms/medication interactions are involved.
    - Standard disclaimer ("this is general information and not a substitute for medical advice") from settings; emergency/poison-control guidance in the footer or help page (admin-managed).

## 6. Admin dashboard

Build the full dashboard defined in `docs/DATA_AND_ADMIN_SPEC.md` §9–§16, plus `docs/PHARMACY_SPEC.md` §9–§11. Highlights:

- **Home dashboard:** KPIs, charts (sales trend, orders by status, top products/categories/brands/ingredients, customer growth, funnel, stock health, expiry risk, payments), action tables (recent orders, low stock, near expiry, **licences expiring soon**, **pending pharmacist Q&A**, **content awaiting medical review**, pending B2B approvals, open tickets, unavailable-item requests, failed payments, running imports).
- **Every list is a real data table:** server-side pagination/sort/filter, column chooser, saved filters, bulk actions, Excel/CSV export, row actions, empty/loading/error states.
- **Bulk import/export** (products, variants, prices, stock, categories, brands, ingredients, regulatory data) with templates, validation, row-level error preview, background processing, resume/cancel, result report.
- Categories as a drag-and-drop tree; attribute sets editable per category.
- **Compliance center:** licence registry with expiry alerts, recall management (block batch/product, notify customers), forbidden-claim lexicon, content review queue, pharmacist roster.
- RBAC (admin, warehouse, content manager, **pharmacist/medical reviewer**, support, accountant, sales manager) enforced server-side.
- Global search (Cmd/Ctrl+K), notifications, audit log of every sensitive change, queue monitor, search-index tools, backups and health.

## 7. SEO and discoverability (first-class requirement)

Full details, matrices and tests: base spec §17 and `docs/PHARMACY_SPEC.md` §12. Summary of what must be true:

**Crawlability and indexation**
- Every indexable page is server-rendered (SSR/ISR): H1, price, availability, properties/ingredients table, description, Q&A, FAQ, breadcrumbs and internal links are in the initial HTML (verify with JavaScript disabled). All links are real `<a href>`. **Tab and accordion content is in the DOM, not fetched on click.**
- One host, HTTPS only, one URL form; everything else 301s in a single hop. Flat, stable product URLs (`/product/{slug}`) so category moves never break them.
- **Indexation matrix** (base §17.2 + pharmacy §12.2): home, categories, whitelisted category+brand and category+ingredient facets, brands, ingredient pages, concern hubs, products, magazine, curated landing pages and static pages are indexable; internal search, cart, checkout, account, compare, wishlist, tokenized links, sort/filter parameter URLs, thin or expired landing pages and admin are not.
- **Pagination:** crawlable `?page=N` links; self-canonical per page; page 1 canonical to the base URL. Infinite scroll only as an enhancement.
- **Product lifecycle:** temporarily out of stock stays 200 with alternatives; discontinued → 301 to replacement (or category after grace); deleted → 410; drafts → 404; **recalled/withdrawn products stay 200 with a visible recall notice and no purchase button** (never silently removed). No soft 404s.
- `robots.txt` blocks only private/transactional paths and never CSS/JS/images; auto-split sitemap index with accurate `lastmod`, image sitemaps, only 200 + canonical + indexable URLs. Staging is `noindex` + password-protected. No geo-blocking or rate-limiting of search-engine crawlers.

**On-page**
- **Exactly one H1 per page**, built from a real keyword; logical H2/H3. No kashida/tatweel in headings or metadata.
- Unique `title` and meta description per URL from templates with fallbacks (spec §12.5); no technical junk. `og:image` is an **absolute raster image (JPG/PNG/WebP, 1200×630, or the product's own photo), never an SVG logo**; `og:url` = canonical; `og:locale` = `fa_IR`.
- Descriptive alt text from product names; descriptive file names; `width`/`height` on every image.
- Visible breadcrumbs + `BreadcrumbList`; internal linking rules (category → subcategories/top brands/top products/ingredients; product → category/brand/ingredients/related/magazine; magazine → products) and an orphan-page check.
- **Unique content:** product descriptions must be unique (similarity warning against manufacturer/leaflet text); category intros are one short block, not a dozen; brand and ingredient pages have unique intros.
- **E-E-A-T for YMYL:** named authors and medical reviewers with credentials (`author_profiles`), "reviewed by" and "last reviewed" dates, cited sources on health articles, real About/Contact pages with licence, address, phone, and visible policies.

**Structured data (generated from the same view-model as the visible page, never hardcoded)**
- Home: `Organization` (or `Pharmacy`/`Store` subtype if a physical licensed pharmacy exists) + `WebSite`; **never `Article`**; `sameAs` only valid URLs.
- Category: `BreadcrumbList` + `CollectionPage`/`ItemList`.
- Product: `Product` with `brand`, `sku`, `gtin` when present, `additionalProperty`, `Offer`/`AggregateOffer` (priceCurrency **IRR** = Toman × 10). Omit `offers` for "call for price". `priceValidUntil` only for a real campaign. **`aggregateRating`/`review` only with approved real visible reviews.** Do not add `Drug`/medical markup that is not visible on the page; if `Drug` is used for OTC medicines it must mirror visible regulatory/usage fields.
- Magazine: `BlogPosting` (or `MedicalWebPage` with `reviewedBy` when a medical reviewer is stored) + `BreadcrumbList`; author/publisher/dates.
- **Q&A:** render visibly and crawlably (paginated); **do not use `QAPage` markup for product-page Q&A**. `FAQPage` only for visible, editorially owned FAQs (no rich result expected).
- Validate JSON-LD in CI.

**Performance (Core Web Vitals, field data)**
- p75: **LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1** via real-user monitoring. Heavy third-party scripts (chat, tag manager) deferred behind one loader so they never regress these numbers.

**Analytics and webmaster tooling**
- GA4 (or Matomo) with ecommerce events through one tag manager; no Universal Analytics; Search Console + Bing verification slots; IndexNow; optional price-comparison feed (Torob/Emalls style) exposing only real in-stock prices of **sellable** products.

**Gates:** the automated SEO suite (base §17.12 + pharmacy §12.12) runs in CI and blocks merges.

## 8. Performance and scale

- p75 field targets as above; mobile Lighthouse > 90 in CI as a regression guard.
- Every image has width/height; lazy-load below the fold; `priority` for the hero.
- No duplicate libraries; code-splitting; no jQuery.
- Self-hosted, subsetted Persian font (Vazirmatn or IRANYekan), `font-display: swap`.
- Multi-layer cache, cursor pagination, cached facets; search/filter served by the search engine, not heavy SQL.
- Queues for import, email, SMS, indexing, image processing, PDF, sitemap, OG image generation.
- Seeders: 3,000 products (variants, batches, ingredients, regulatory data, realistic attributes), the full seed taxonomy, 150 brands, 300 ingredients, campaigns, customer groups, 200 magazine posts, Q&A and reviews; plus a load-test seeder for 50,000 products.

## 9. Security, privacy and compliance

- Server-side Zod validation everywhere; CSRF/XSS/SQLi protection; HTML sanitization (especially for user Q&A and reviews).
- Rate limiting on OTP, login, search, Q&A submission, import; OTP abuse protection.
- argon2, secure HttpOnly sessions, server-side RBAC, ownership checks.
- Secure uploads; **private storage for any prescription or personal health document**; those files are never publicly served or indexed.
- **Health data is sensitive:** collect the minimum, encrypt private documents at rest, restrict access by role, log access, support deletion/anonymization. Q&A and reviews must not publish personal health details (moderation + PII filter).
- Payment safety: server-side Verify, no double-pay.
- **Eligibility engine:** `regulatory_class` × `sellable_online` × age/quantity rules evaluated at add-to-cart and again at checkout and payment verification. Prescription-only and controlled items are rejected by the server, with tests.
- **Prescription flow (feature-flagged, off by default):** do not build until legal review; if enabled, prescription upload goes to a licensed-pharmacist review queue with full audit.
- Display legally required items correctly (eNamad, pharmacy/online-pharmacy licence info, return policy, privacy policy). **Make no invented legal claims; flag everything needing legal review in `ASSUMPTIONS.md`** (online sale of each product class, licence display wording, return rules for opened health products, advertising rules for supplements).
- Recall capability: a lot/batch can be flagged; affected open orders are held; affected delivered orders generate customer notifications.

## 10. UI/UX and accessibility

- Clean, calm, trustworthy health look (green/teal/white), RTL-first, optional dark mode.
- Mobile-first with a bottom navigation bar (search, categories, cart, account).
- **Never disable user zoom.**
- WCAG 2.2 AA: contrast, keyboard navigation, ARIA, visible focus, alt text, labels. Readable body text sizes for older users.
- Skeleton loading, clear empty/error states, motion respecting `prefers-reduced-motion`.
- **No dead links or unfinished sections:** social links only when a real URL is set, newsletter only with a working form, dynamic copyright year, no `#` links.
- Popups/chat bubbles must not cover content on first load, must be dismissible, and must not cause layout shift.

## 11. Working method and delivery (very important)

Work **stage by stage and wait for my approval after each stage:**

- **Stage 0:** architecture, folder structure, full ERD, Prisma schema, index rationale, API list, `ASSUMPTIONS.md`
- **Stage 1:** project setup, Docker, CI, auth (OTP), RBAC, abstractions (payments, SMS, storage, scripts loader), **and the SEO foundation**: URL scheme and `url_registry`, metadata/canonical/robots helpers, JSON-LD builders, breadcrumbs, redirect middleware (301/410), custom 404, `robots.txt`, sitemap generator, OG image generator, host/HTTPS canonicalization, and the SEO CI gates. Show the SEO tests passing on a sample template before moving on
- **Stage 2:** admin: categories (deep tree), brands, ingredients, attributes, products, variants, regulatory data, batches/expiry, pricing, campaigns
- **Stage 3:** bulk import/export, seeders, search sync and index, eligibility engine
- **Stage 4:** admin dashboard home, compliance center, reports
- **Stage 5:** storefront: home, menu, category + filters, search, product card/page, ingredient/brand pages, compare, wishlist
- **Stage 6:** cart, checkout, payment, customer account, Q&A and reviews with moderation, recall flow, optional modules (B2B, installments, agents)
- **Stage 7:** magazine, landing pages, SEO/Schema hardening, analytics, performance, full test suite, docs and deployment guide

In **every stage:**
- Complete, runnable code: no pseudo-code, no "rest is similar".
- Exact path of every file, run commands, how to test.
- Unit and integration tests for sensitive logic (pricing, stock, eligibility, payments, import, recall).
- End with an explicit list of unfinished work, assumptions and risks; update `ASSUMPTIONS.md`.
- If you did not run or test something, say so plainly.

## 12. Acceptance criteria

- Filtering in a 10,000-product category responds in < 300 ms (P95, load-test seed).
- A new category (any depth) with new attributes is added from the admin only, no code change.
- Importing 5,000 products from Excel never freezes the dashboard and gives a row-level error report.
- No product shows "0 Toman"; no badge, star, view counter, stock number or timer is hardcoded (prove with grep + tests).
- A prescription-only or recalled item cannot be added to a cart, checked out or paid, through UI, API or a replayed payment callback (automated tests).
- A product with expired licence data cannot be published; expired batches cannot be sold.
- Each page has exactly one H1; `og:description` never contains code; `og:image` is a raster absolute URL; JSON-LD validates and matches visible price/availability.
- All SEO gates pass in CI; sitemap contains only 200, canonical, indexable URLs; no redirect chains > 1 hop; real 404/410.
- Indexable pages render full content (including Q&A, ingredients, FAQ, expert review) with JavaScript disabled.
- Field Core Web Vitals (p75): LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1, with the chat widget and tag manager enabled.
- Product with variants never appears as several products.
- Health-claim checker blocks publishing of seeded forbidden-phrase fixtures.
- Mobile Lighthouse > 90, CLS < 0.1 on home, category and product pages.
- All main pages are mobile-friendly, RTL, zoomable.
- Every admin list supports server-side pagination, sorting, filtering, column chooser, export.
- All tests green in CI; `docker compose up` starts everything.

## 13. "Do NOT" list (known competitor mistakes)

- ✗ Showing "0 Toman" or meaningless ranges
- ✗ Hardcoded or inflated star ratings, **raw stock counts used as pressure**, and **inflated "visits" numbers** on cards
- ✗ A countdown to a far-off or fake date; a permanent discount over a fabricated "original" price
- ✗ Flavors/pack sizes stored as separate products
- ✗ `Article` instead of `Organization`/`WebSite` on the home page
- ✗ **A logo SVG as `og:image` on product pages** (use the product photo or a generated raster card)
- ✗ Meta/OG text with technical junk; duplicate or generic H1; kashida in headings
- ✗ Several slider/menu/cart/timer/chat libraries; **chat or tag-manager scripts blocking render**
- ✗ Universal Analytics; locked mobile zoom
- ✗ Images without dimensions or meaningful alt; `#` links; newsletter with no form; stale copyright year
- ✗ Indexable internal search, sort/filter URLs, or infinite scroll without crawlable links
- ✗ Soft 404s, redirect chains/loops, discontinued products answering 200 forever
- ✗ `aggregateRating` without real visible reviews; FAQ/Offer schema not matching visible content; `QAPage` misuse on product pages
- ✗ Client-only rendering of H1, price, ingredient/spec tables, Q&A or product links
- ✗ `robots.txt` blocking CSS/JS/images; geo-blocking crawlers
- ✗ Copying manufacturer/leaflet text verbatim across hundreds of products
- ✗ **Disease-cure or guaranteed-result claims; unnamed "expert" reviews; pharmacist answers that diagnose individuals; publishing personal health details from questions**
- ✗ **Selling prescription-only or recalled items; selling expired stock; missing licence data on published products**
- ✗ Dozens of long keyword-stuffed text blocks on category pages

## ▲▲▲ END PROMPT ▲▲▲

---

## Usage notes

1. **Tool:** use an agentic coding tool (Claude Code, Cursor) in an empty repo. Save this file as `PROMPT.md`, the base spec as `docs/DATA_AND_ADMIN_SPEC.md`, and the pharmacy spec as `docs/PHARMACY_SPEC.md`.
2. **Decide before starting:** (a) really 50,000 products, or ~2,000–5,000? If smaller, defer Meilisearch and filter with Postgres first. (b) Which product classes will you actually sell online (OTC medicines? supplements only? devices?), and do you hold the licences for them? (c) Do you need B2B, installments, agents, prescription upload in v1? (d) Do you have named pharmacists/physicians who will answer Q&A and review content?
3. **Fast MVP:** stages 0–2, then 5–6 with simple search; leave 3 and 4 for later. Do not skip the eligibility engine or the SEO foundation.
4. **Other stack (WordPress/WooCommerce, Laravel):** change §3 only; §1 and §13 stay valid for any stack.
5. **Legal review:** have the sale of each product class, licence display, returns for opened health products, and supplement advertising rules reviewed before launch. The prompt deliberately makes no legal claims.
