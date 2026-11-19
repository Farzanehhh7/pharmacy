# PHARMACY_SPEC.md
## Online Pharmacy & Health-Care Store: Taxonomy, Attributes, Regulatory Model, Health-Content Governance, SEO Deltas

Companion to `pharmacy-store-master-prompt_en.md`. Written in English; **all UI labels are Persian (fa)** and ship through i18n files.

**Precedence:** this file overrides `docs/DATA_AND_ADMIN_SPEC.md` (the "base spec"). Anything not mentioned here (DB conventions §1, base tables §4–§5, enums/indexes §6, search pipeline §7, state machines §8, dashboard UX §16, RBAC mechanics §14, notification mechanics §15, SEO infrastructure §17) is inherited from the base spec, **with the substitution dental → pharmacy** (vertical `pharmacy`; no dental seed taxonomy, no dental attributes, no IMED code). Log every conflict in `ASSUMPTIONS.md`.

**Contents**
1. Scope and product classes
2. Category tree (seed taxonomy)
3. Attribute dictionary and attribute sets
4. New and changed tables
5. New enums
6. Regulatory model and eligibility engine
7. Search additions
8. State machines (additions)
9. Admin information architecture (additions)
10. Health-content governance
11. Admin modules, reports, RBAC, notifications (additions)
12. SEO deltas (URL scheme, indexation, lifecycle, schema, metadata, landing pages, linking, third-party scripts, tests)
13. Import/export templates (additions)
14. Seed data requirements
15. Observations from the reference site (what to copy, what to fix)

---

## 1. Scope and product classes

| `regulatory_class` | Examples | Sellable online (v1) | Notes |
|---|---|---|---|
| `otc_drug` | non-prescription medicines, topical OTC, oral rehydration | **configurable per product** (`sellable_online`), default `false` until a licence record confirms it | needs licence data + pharmacist-approved leaflet |
| `rx_drug` | prescription-only medicines | **never** | hard block in eligibility engine; may be shown as information only if a setting allows |
| `controlled` | narcotic/psychotropic or otherwise restricted | **never** | hard block, not importable as sellable |
| `supplement` | vitamins, minerals, sports nutrition, gainers, protein, herbal supplements | yes | licence/IRC code required to publish |
| `herbal_traditional` | herbal teas, distillates, extracts, traditional products | yes | licence code required where applicable |
| `cosmetic_hygiene` | skin care, hair care, oral care, sun care, deodorants, baby care | yes | notification/licence code required where applicable |
| `medical_device_low_risk` | thermometers, BP monitors, glucometers, supports, masks, wound care | yes | device licence code, warranty, manual |
| `medical_device_regulated` | devices that need extra permission to sell | **configurable**, default `false` | flagged for legal review |
| `food_baby` | infant formula and baby food | yes | storage and age-range rules |
| `other_health` | accessories, diet foods, general wellness goods | yes | |

Rules:
- `sellable_online` is a stored boolean per product, computed as `class_allows_online AND licence_valid AND not recalled AND not archived`. The storefront and the server both use this one function (§6).
- Class defaults live in a `regulatory_class_rules` table editable only by `admin` and logged in the audit log.
- Anything marked "needs legal review" is listed in `ASSUMPTIONS.md` at the end of Stage 0.

---

## 2. Category tree (seed taxonomy)

Model: **wide top level, deep sub-levels**. Cross-listing allowed (many categories per product, one `primary_category_id`). Concerns/needs and active ingredients are **not** categories (see `concerns` and `ingredients`). Virtual collections (new, discounted, packs, brand shops) are `collections`, not categories.

Format: `Persian name — English name`. Seed to **at least 22 L1, ~150 L2, and L3 where listed**; admins can restructure freely. Add L3 for any L2 that will have more than ~60 products.

### L1-01 مکمل غذایی — Dietary Supplements
- ویتامین‌ها — Vitamins (ویتامین C، D، B کمپلکس، E، A، K، مولتی‌ویتامین، ویتامین‌های محلول)
- مواد معدنی — Minerals (آهن، کلسیم، منیزیم، زینک، سلنیوم، پتاسیم)
- اسیدهای چرب و امگا ۳ — Omega-3 & Fatty Acids
- پروبیوتیک و پری‌بیوتیک — Probiotics & Prebiotics
- آنتی‌اکسیدان‌ها — Antioxidants (کوآنزیم Q10، گلوتاتیون، رزوراترول)
- مکمل مفاصل و استخوان — Joint & Bone (گلوکزامین، کلاژن، کلسیم + D)
- مکمل قلب و عروق — Heart Health
- مکمل کبد و گوارش — Liver & Digestive
- مکمل مو، پوست و ناخن — Hair, Skin & Nails
- مکمل خواب و آرامش — Sleep & Relaxation
- مکمل چشم — Eye Health
- مکمل ایمنی — Immunity
- مکمل بارداری و شیردهی — Prenatal & Lactation
- مکمل کودکان — Children's Supplements
- مکمل سالمندان — Senior Supplements
- مکمل آقایان / بانوان — Men's / Women's Health
- مکمل رژیمی و کنترل وزن — Weight Management (no absolute claims; see §10)

### L1-02 تغذیه ورزشی — Sports Nutrition
- پروتئین — Protein (وی کنسانتره، ایزوله، هیدرولیز، کازئین، پروتئین گیاهی)
- گینر — Gainer (L3: گینر بزرگسالان، گینر نوجوانان، گینر کم‌قند)
- کراتین — Creatine
- آمینواسیدها — Amino Acids (BCAA، EAA، گلوتامین، آرژنین، بتا آلانین)
- پیش‌تمرین — Pre-Workout
- ریکاوری و ارگوژنیک — Recovery & Ergogenic
- چربی‌سوز و ال‌کارنیتین — Fat Burners & L-Carnitine (no absolute claims)
- کربوهیدرات و انرژی — Carbs & Energy (ژل، پودر، بار)
- مولتی‌ویتامین ورزشی — Athlete Multivitamins
- بار و اسنک پروتئینی — Protein Bars & Snacks
- شیکر و لوازم جانبی — Shakers & Accessories

### L1-03 دارو و فرآورده‌های بدون نسخه — OTC Medicines
- مسکن و ضد التهاب — Pain & Anti-inflammatory
- سرماخوردگی و آنفلوانزا — Cold & Flu
- گوارش و معده — Digestive (آنتی‌اسید، ضد نفخ، ملین، ضد اسهال، ORS)
- حساسیت و آنتی‌هیستامین — Allergy
- پوست (موضعی) — Topical Skin (پماد، کرم، ژل)
- چشم، گوش، بینی — Eye, Ear & Nose
- دهان و گلو — Mouth & Throat
- زخم و ضدعفونی — Wound Care & Antiseptics
(only populated products with `sellable_online` and valid licence; see §6)

### L1-04 مراقبت پوست (درمانی و آرایشی) — Skin Care (Dermo-cosmetic)
- پاک‌کننده — Cleansers (ژل، فوم، میسلار واتر، شوینده)
- مرطوب‌کننده — Moisturizers
- ضدآفتاب — Sunscreens (L3: ضدآفتاب صورت، بدن، کودک، آکنه، رنگی)
- سرم و ترمیم‌کننده — Serums & Treatments (ویتامین C، نیاسینامید، رتینول، هیالورونیک)
- ضد جوش و پوست چرب — Acne & Oily Skin
- ضد لک و روشن‌کننده — Brightening & Dark Spots
- ضد چروک و جوانساز — Anti-aging
- پوست حساس و اگزما — Sensitive Skin
- مراقبت دور چشم — Eye Contour
- ماسک صورت — Face Masks
- لایه‌بردار — Exfoliators
- مراقبت لب — Lip Care
- لوازم و دستگاه‌های پوست — Skin Tools & Devices

### L1-05 مراقبت مو — Hair Care
- شامپو — Shampoo (ضدشوره، ضدریزش، رنگ‌شده، چرب، خشک، کودک)
- نرم‌کننده و ماسک مو — Conditioner & Masks
- سرم و تقویت‌کننده مو — Serums & Treatments
- رنگ مو — Hair Color
- مکمل مو — Hair Supplements (cross-listed from L1-01)
- لوازم و برس — Brushes & Accessories

### L1-06 آرایش — Makeup
- صورت، چشم، لب، ناخن — Face, Eyes, Lips, Nails (+ لوازم آرایش)

### L1-07 بهداشت شخصی — Personal Hygiene
- بهداشت دهان و دندان — Oral Care (خمیردندان، مسواک، نخ دندان، دهان‌شویه)
- دئودورانت و ضدتعریق — Deodorants
- بهداشت بانوان — Feminine Hygiene
- بهداشت آقایان / اصلاح — Men's Grooming & Shaving
- دستمال، پد و شوینده — Wipes, Pads & Washes
- ضدعفونی دست و سطوح — Sanitizers

### L1-08 مادر و کودک — Mother & Child
- شیر خشک و غذای کودک — Infant Formula & Baby Food
- مراقبت پوست کودک — Baby Skin Care
- پوشک و بهداشت — Diapers & Hygiene
- شیردهی و بارداری — Breastfeeding & Pregnancy (پمپ شیر، پد، کرم ترک)
- مکمل کودک — Children's Supplements (cross-listed)
- اسباب‌بازی و سرگرمی ایمن — Safe Toys
- شیشه، پستانک و لوازم تغذیه — Bottles, Pacifiers & Feeding

### L1-09 تجهیزات پزشکی خانگی — Home Medical Equipment
- فشارسنج — Blood Pressure Monitors
- دیابت — Diabetes Care (گلوکومتر، نوار تست، لانست، دستگاه‌ها)
- تب‌سنج — Thermometers
- پالس‌اکسی‌متر و اکسیژن — Pulse Oximeters & Oxygen
- نبولایزر و تنفسی — Nebulizers & Respiratory
- ترازو — Scales (وزن، ترکیب بدن)
- ماساژور و گرمایی — Massagers & Heat Therapy
- تجهیزات توانبخشی — Mobility & Rehab (واکر، عصا، ویلچر)

### L1-10 ارتوپدی و طبی — Orthopaedic & Support
- کمربند، زانوبند، مچ‌بند — Back, Knee & Wrist Supports
- کفی و کفش طبی — Insoles & Medical Footwear
- جوراب واریس — Compression Stockings
- بالش و تشک طبی — Medical Pillows & Mattresses

### L1-11 پانسمان و مصرفی پزشکی — Wound Care & Medical Consumables
- پانسمان و چسب زخم — Dressings & Plasters
- دستکش و ماسک — Gloves & Masks
- سرنگ و ست مصرفی — Syringes & Sets
- ضدعفونی و الکل — Antiseptics & Alcohol
- کمک‌های اولیه — First Aid Kits

### L1-12 فرآورده‌های گیاهی و طب سنتی — Herbal & Traditional
- دمنوش و چای گیاهی — Herbal Teas
- عرقیات — Distillates
- روغن‌های گیاهی و اساسی — Herbal & Essential Oils
- قطره، کپسول و شربت گیاهی — Herbal Drops, Capsules & Syrups
- عسل و فرآورده‌های زنبور عسل — Honey & Bee Products
- گیاهان خشک و ادویه دارویی — Dried Herbs

### L1-13 تغذیه سالم و رژیمی — Healthy & Diet Foods
- محصولات کم‌قند و بدون قند — Low-sugar
- بدون گلوتن — Gluten-free
- ارگانیک و فراسودمند — Organic & Functional
- شیرین‌کننده‌ها — Sweeteners
- آجیل و خشکبار سالم — Healthy Snacks

### L1-14 مراقبت بدن — Body Care
- کرم و لوسیون بدن — Body Lotions
- شامپو بدن و صابون — Body Wash & Soap
- مراقبت دست و پا — Hand & Foot Care
- ضد ترک و سلولیت — Stretch Marks & Cellulite
- روغن ماساژ — Massage Oils

### L1-15 عطر و ادکلن — Fragrance
- زنانه، مردانه، یونیسکس، اسپری بدن — Women's, Men's, Unisex, Body Mists

### L1-16 مراقبت از سالمندان — Senior Care
- مکمل و تغذیه سالمندان، پوشک بزرگسال، تجهیزات مراقبتی — Supplements, Adult Incontinence, Care Aids

### L1-17 سلامت جنسی و باروری — Sexual & Reproductive Health
- تست بارداری و تخمک‌گذاری، پیشگیری‌های مجاز، مکمل — Pregnancy & Ovulation Tests, Permitted Contraception, Supplements
(discreet packaging flag, see §4 `products.discreet_shipping`)

### L1-18 کنترل وزن و لاغری — Weight Management
- جایگزین وعده، ترازو و متر، مکمل رژیمی — Meal Replacements, Scales, Diet Supplements (claims strictly governed, §10)

### L1-19 ویتامین و مکمل حیوانات / پت — Pet Health (optional, flag-gated)

### L1-20 لوازم جانبی سلامت — Health Accessories
- قرص‌خردکن، قرص‌دان، جعبه دارو، کیسه آب گرم — Pill Organizers, Cutters, Hot Water Bags

### L1-21 پک‌ها و ست‌ها — Kits & Bundles (bundles, not categories if possible; use `bundles`)

### L1-22 برندهای ویژه — Brand Shops (virtual; use `collections`)

Taxonomy rules:
- Each L1/L2 has an editable intro (100–250 words, one block), icon, image, default attribute set, and `seo_overrides`.
- L2/L3 with fewer than N active products (setting, default 3) are `noindex,follow` and hidden from the mega menu but kept in the tree.
- Slugs immutable after publish (redirect row on change).

---

## 3. Attribute dictionary and attribute sets

### 3.1 Additions to the attribute dictionary (`attributes`)

Each has: code, Persian label, type (`text|number|select|multi_select|boolean`), unit, `show_in_spec`, `filterable`, `comparable`, `searchable`, `schema_property` (maps to `additionalProperty`).

| code | fa label | type | notes |
|---|---|---|---|
| `dosage_form` | شکل دارویی/مصرفی | select | capsule, tablet, softgel, chewable, powder, liquid, syrup, drops, spray, cream, gel, ointment, patch, bar, gummy, sachet |
| `net_content` | محتوای خالص | number + unit | count, g, kg, ml, l |
| `servings_per_pack` | تعداد سروینگ | number | |
| `serving_size` | اندازه هر سروینگ | number + unit | |
| `flavor` | طعم | select | **variant option** |
| `pack_size` | تعداد در بسته | select | **variant option** |
| `strength` | قدرت/غلظت | text | **variant option** where relevant |
| `target_age_group` | گروه سنی | multi_select | infant, child, teen, adult, senior |
| `target_gender` | جنسیت | select | any, women, men |
| `special_population` | بارداری/شیردهی | select | allowed, ask_doctor, avoid, not_evaluated |
| `skin_type` | نوع پوست | multi_select | dry, oily, combination, sensitive, normal, acne_prone |
| `hair_type` | نوع مو | multi_select | |
| `spf` | SPF | number | |
| `pa_rating` | PA | select | |
| `vegan` / `gluten_free` / `lactose_free` / `sugar_free` / `halal_certified` | | boolean | filterable |
| `country_of_origin` | کشور سازنده | select | filterable |
| `manufacturer` / `importer` / `licence_holder` | | relation | |
| `storage_condition` | شرایط نگهداری | select | room, cool, refrigerated, protect_from_light |
| `shelf_life_months` | عمر مفید | number | |
| `device_power_source` | منبع برق | select | battery, mains, rechargeable |
| `device_measurement_range` | محدوده اندازه‌گیری | text | |
| `device_warranty_months` | گارانتی | number | |
| `contains_allergens` | آلرژن‌ها | multi_select | display only; **warnings are shown from label data, never inferred** |

### 3.2 Attribute sets (must be seeded; inheritance down the tree)

- **Supplement base:** dosage_form, net_content, servings_per_pack, serving_size, target_age_group, special_population, vegan, gluten_free, country_of_origin, storage_condition, shelf_life_months.
- **Sports nutrition:** supplement base + flavor, protein_per_serving, calories_per_serving, creatine_type (where relevant).
- **Skin care:** skin_type, net_content, spf (sunscreens), pa_rating, fragrance_free, paraben_free (only if on label), country_of_origin.
- **Hair care:** hair_type, net_content, sulfate_free (label-based), country_of_origin.
- **Mother & child:** target_age_group, net_content, country_of_origin, storage_condition.
- **Devices:** device_power_source, device_measurement_range, device_warranty_months, certificate types, country_of_origin.
- **Herbal:** dosage_form, net_content, country_of_origin, traditional_use_note (text, subject to §10).

Rule: only attributes that are real label data appear as filters. Boolean filters like `vegan` need a stored source (label or manufacturer document).

---

## 4. New and changed tables

(Use base conventions: uuid v7, timestamptz, soft delete, bigint Toman, `*_fa`/`*_en`.)

### 4.1 Catalog additions
- `ingredients`: id, slug, name_fa, name_en, inn_name, cas_number null, ingredient_group_id, intro_fa (reviewed text), reviewed_by_author_id, reviewed_at, status, `seo_overrides`.
- `ingredient_groups` (vitamin, mineral, amino acid, herbal extract…): id, name_fa, parent_id.
- `product_ingredients`: product_id, ingredient_id, amount numeric, unit, per (serving/100g/tablet), is_active_ingredient bool, display_order, daily_value_percent null.
- `concerns` (needs/conditions as consumer-facing topics, e.g. hair loss, sleep, joint support): id, slug, name_fa, intro_fa, reviewed_by_author_id, reviewed_at, status. **Concern hubs describe general information; they never claim treatment.**
- `product_concerns`, `ingredient_concerns`, `category_concerns`: join tables.
- `manufacturers`: id, name_fa, name_en, country, website, status.
- `product_regulatory` (one row per product): product_id, regulatory_class, licence_code (IRC/health-ministry code), uid null, licence_holder_id, licence_issued_at, licence_expires_at, authenticity_label_type (none, hologram, code, qr), authenticity_check_url null, device_licence_code null, storage_condition, special_population_note, pregnancy_note, age_min_months null, age_max_months null, max_qty_per_order null, requires_pharmacist_review bool, sellable_online bool (derived, indexed), legal_review_flag bool, notes_internal.
- `product_documents`: id, product_id, type (`leaflet`, `ifu`, `certificate`, `licence`, `lab_report`, `manual`, `catalog`), file_id, valid_until null, is_public.
- `product_warnings`: id, product_id, kind (`contraindication`, `interaction`, `side_effect`, `caution`, `allergen`), text_fa, source (`label`, `leaflet`, `pharmacist`), reviewed_by_author_id, reviewed_at.
- `product_usage`: product_id, how_to_use_fa, typical_dose_fa (label-based), duration_note_fa, source, reviewed_by_author_id, reviewed_at.
- `product_expert_reviews`: id, product_id, body_fa, author_profile_id, reviewed_at, status.
- Changes to `products`: `discreet_shipping bool`, `cold_chain bool`, `fragile bool`, `is_recalled bool`, `recalled_at`, `recall_note_fa`, `sellable_online bool` (denormalized), `vertical` default `pharmacy`.
- Changes to `batches`: `is_recalled bool`, `recall_reference`, `recalled_at`.
- Changes to `categories`: `intro_fa`, `intro_updated_at`, `min_products_for_index` override null.

### 4.2 Q&A and trust
- `product_questions`: id, product_id, customer_id null, display_name, body, status (`pending`,`approved`,`rejected`,`needs_pharmacist`), contains_pii_flag, created_at, moderated_by.
- `product_answers`: id, question_id, responder_author_id (pharmacist profile), body, status, answered_at, reviewed_by. Answer templates in `answer_templates`.
- `reviews`: base table plus `is_verified_purchase`; only approved reviews feed ratings and schema.
- `author_profiles` (base §17.10) extended: `profession` (pharmacist, physician, nutritionist, dermatologist, editor), `licence_number` optional, `licence_verified_at`, `bio_fa`, `photo`, `same_as` urls, `is_public`.
- `trust_assets`: pharmacy licence info, responsible pharmacist (author_profile_id), eNamad/Samandehi/ecunion/other badge records with real verification URLs, displayed only when configured.

### 4.3 Compliance
- `regulatory_class_rules`: class, sellable_online_default, requires_licence bool, requires_leaflet bool, max_qty_default.
- `forbidden_claims`: id, pattern (regex or phrase, normalized fa), severity (`block`,`needs_approval`,`warn`), applies_to (`product`,`article`,`qa`,`all`), reason, active.
- `content_reviews`: id, entity_type, entity_id, requested_by, reviewer_author_id, status (`pending`,`approved`,`changes_requested`), reviewed_at, notes.
- `recalls`: id, title, reason, scope (`product`,`batch`), product_id, batch_id null, status (`draft`,`active`,`closed`), created_by, activated_at; `recall_affected_orders` (recall_id, order_id, action_status).
- `licence_alerts` (materialized view or table for expiring licences).
- `eligibility_checks` (audit): cart_id/order_id, product_id, decision, rule_code, created_at.

### 4.4 Content and SEO
- `blog_posts` additions: `medical_reviewer_author_id`, `last_reviewed_at`, `sources` jsonb (title, publisher, url, year), `reading_minutes`, `is_health_claim_content bool`.
- `landing_pages`: id, slug, title_fa, h1_fa, body blocks, campaign_id null, status, `indexable bool`, `valid_from`, `valid_until`, `replacement_path null`, `content_updated_at`. See §12.8.
- `url_registry` additions: entity types `ingredient`, `concern`, `landing`, `facet_ingredient`.
- `seo_overrides`, `redirects` as in base.

### 4.5 Optional modules (feature flags, off by default)
- `prescriptions`, `prescription_items`, `prescription_reviews` (pharmacist queue; private storage; full audit). **Do not implement before legal sign-off.**
- B2B (`customer_groups`, `b2b_verifications`, `payment_plans`) and agents/branches as in the base spec.

---

## 5. New enums

- `regulatory_class`: `otc_drug`, `rx_drug`, `controlled`, `supplement`, `herbal_traditional`, `cosmetic_hygiene`, `medical_device_low_risk`, `medical_device_regulated`, `food_baby`, `other_health`.
- `warning_kind`, `document_type`, `qa_status`, `review_status`, `claim_severity`, `recall_status`, `author_profession`.
- `vertical`: `pharmacy`, `dental`, `medical_devices`.
- Product `kind`: `consumable`, `device`, `kit`.

---

## 6. Regulatory model and eligibility engine

### 6.1 Publication gate (checked on save and by a scheduled job)
A product can be `active` only if:
1. `product_regulatory` exists and `regulatory_class` ∈ sellable classes (or the product is info-only).
2. `licence_code` is present for classes whose rule says `requires_licence`.
3. `licence_expires_at` is null or in the future.
4. A leaflet/label document exists when the class rule requires it.
5. Required content is reviewed (§10) for classes in `needs_review_classes` (OTC, supplement health claims).
6. No forbidden-claim match with severity `block` in title, description, usage or warnings.

If a licence expires or a product becomes recalled, a job moves it to `licence_expired` / `recalled` state (see §8), keeps the page up (200) and removes purchase ability.

### 6.2 `isSellableOnline(product, variant, qty, customer, now)` — the one function
Returns `{ allowed, reasonCode, message_fa }`. Evaluated: on product page render (to choose CTA), add-to-cart, cart update, checkout start, payment initiation, and payment verification.
Checks, in order: class not `rx_drug`/`controlled` → product active → licence valid → not recalled (product or the batch that would be allocated) → stock available (FEFO excludes expired and recalled batches) → `max_qty_per_order` → age restriction (if any, via account data) → shipping constraints (cold chain/discreet flags handled by shipping rules) → optional `requires_pharmacist_review` routes the order to a review queue instead of auto-fulfilment.
Every denial writes `eligibility_checks`. Tests: replay add-to-cart via API, tamper client price, replay payment callback after recall.

### 6.3 Recall workflow
Admin creates a recall (product or batch) → status active → product/batch flagged → search index updated → page shows recall notice (fa text from template) → open orders containing it are held → delivered orders get SMS/email notice → closing a recall records the outcome. Everything is audited.

### 6.4 Expiry rules
- FEFO allocation; **never allocate batches with `expires_at < today + min_remaining_days`** (setting per class, default 60 days for supplements, 90 for baby food).
- Near-expiry badge shows only when the batch to be shipped is actually near expiry, with its real date; optional batch discount.

---

## 7. Search additions

- Index document additions: `ingredients[]` (names fa/en + synonyms), `concerns[]`, `dosage_form`, `regulatory_class`, `licence_code`, `flavors[]`, `target_age_group[]`, `sellable_online`, `is_recalled`.
- Searchable attributes (priority): title_fa, title_en, brand names, `ingredients`, SKU/GTIN/licence code, category names, concerns, tags.
- Facets: brand, category, ingredient, dosage_form, flavor, pack_size, target_age_group, skin_type, price, availability, country, boolean flags.
- Synonym groups editable in admin (examples to seed: ویتامین د / ویتامین D / vitamin d; گینر / gainer; وی / whey; ضدآفتاب / سان‌اسکرین). Brand transliterations are managed here.
- Recalled and `rx_drug` items are excluded from suggestions and results unless the setting `show_unavailable_in_search` is on (then shown with notice, never with a buy button).
- Zero-result queries logged with count, grouped, with a "create synonym / redirect / content" action.
- Persian normalization pipeline as in base §7.1.

---

## 8. State machines (additions)

### 8.9 Product regulatory state
`draft → in_review → active ⇄ temporarily_unavailable → discontinued`
Automatic branches: `active → licence_expired` (date passes), `active → recalled` (recall activated). `licence_expired → active` after a new licence record is approved; `recalled → active` only by `admin` with a closed recall and a note. `discontinued → archived` follows base §17.3.

### 8.10 Content review
`draft → pending_review → approved → published`, and `pending_review → changes_requested → draft`. Publishing health-claim content without `approved` is blocked server-side. Re-review is triggered when `last_reviewed_at` is older than the configured interval (default 12 months for health articles, 6 months for usage/warning blocks).

### 8.11 Q&A
`submitted → pending → (approved|rejected|needs_pharmacist) → answered → published`. PII detection can route to `rejected` or edit-and-approve. A question never publishes before moderation.

### 8.12 Recall
`draft → active → closed`.

### 8.13 Order additions
`paid → pharmacist_review (only if requires_pharmacist_review) → processing → …`. Orders held by a recall go to `on_hold_recall`.

---

## 9. Admin information architecture (additions)

- **Catalog:** products, variants, categories (tree), brands, **ingredients**, **ingredient groups**, **concerns**, attributes and sets, variant options, collections, bundles, tags, media.
- **Compliance:** licences (with expiry calendar), regulatory classes, recalls, forbidden claims, content review queue, pharmacist roster and credentials, answer templates, disclaimers.
- **Support and trust:** Q&A queue (pending / needs pharmacist), reviews moderation, tickets, trust assets (licence/eNamad), authenticity guarantee page.
- **Content:** magazine, landing pages, static pages, author profiles, banners, menus, home sections.
- **SEO:** health dashboard, redirects, 404 log, zero-result searches, indexable facets, sitemaps, landing-page expiry.
- Everything else as in base §9.

---

## 10. Health-content governance

### 10.1 What is allowed
- Descriptions, usage and warnings must come from the label, leaflet, licence documents or a **named, credentialed reviewer**. Store the source and reviewer for each block (`product_usage`, `product_warnings`, `product_expert_reviews`).
- No unverified claims that a product **cures, treats, prevents, or reverses** a disease; no guaranteed outcomes; no before/after promises; no comparative "better than medicine" claims; no weight-loss promises with numbers. The `forbidden_claims` list enforces this and is editable by admin and the medical reviewer.
- Supplement wording follows the approved label; "supports/contributes to" style wording is allowed only when it appears in the approved label or reviewed text.

### 10.2 Reviewers and credentials
- Each health page shows reviewer name, profession, and "last reviewed" date; reviewers have public profile pages (`/author/{slug}`) with credentials and `sameAs` links where available.
- Credential data is verified by an admin (`licence_verified_at`) before the profile is shown publicly.

### 10.3 Pharmacist Q&A
- Questions are moderated; personal health details are redacted.
- Answers are written by a pharmacist profile, use templates where possible, and follow: general information; mention label/leaflet; advise consulting a doctor or pharmacist for symptoms, pregnancy, children, chronic disease or medication interaction; no individual diagnosis; no off-label advice.
- Answers show responder name/credentials and answer date. Unanswered or rejected questions are not shown.
- Q&A text is part of the HTML (paginated server-side), but **no `QAPage` schema** on product pages.

### 10.4 Disclaimers and emergency info
Managed in settings (`disclaimer_general`, `disclaimer_product`, `emergency_info`): shown on product pages (collapsed text is still in the DOM), magazine posts and checkout for specific classes.

### 10.5 Reviews and ratings
Only approved reviews count; `is_verified_purchase` badge only when true; ratings on cards, schema and the page all read the same aggregate. No default stars, no seeded fake reviews in production.

---

## 11. Admin modules, reports, RBAC, notifications (additions)

### 11.1 New KPI cards
Active sellable products, products blocked (licence/recall), licences expiring ≤ 30/60/90 days, pending Q&A, pending content reviews, near-expiry stock value (by Toman), zero-result searches (7 days), recalled units on hand.

### 11.2 New charts
Sales by product class, top ingredients by revenue, top concerns by traffic (from analytics import), Q&A response time, content freshness (age of last review), stock by days-to-expiry, licence expiry timeline, SEO health trend.

### 11.3 New action tables
Licences expiring soon, content awaiting review, Q&A awaiting pharmacist, orders held by recall, products published without leaflet, forbidden-claim hits in drafts.

### 11.4 New reports
Regulatory register (all products with licence data and expiry), recall impact report, expiry risk by batch, content review log, pharmacist workload, ingredient sales, concern-page traffic, zero-result searches, claim-checker audit.

### 11.5 RBAC additions

| Role | Permissions added |
|---|---|
| `pharmacist` (medical reviewer) | review/approve content, answer Q&A, edit usage/warnings, view regulatory data, manage forbidden-claims suggestions (not delete), no pricing/finance |
| `compliance_officer` (optional) | manage licences, regulatory classes, recalls, forbidden claims, legal-review flags |
| `content_manager` | create content; cannot approve health-claim content |
| `admin` | all, including regulatory class rules and recall activation |

Server-side enforcement; every permission check has a test.

### 11.6 Notifications
Events: licence expiring (90/60/30 days), licence expired, recall activated, Q&A needs pharmacist, content re-review due, near-expiry stock, product auto-unpublished, forbidden-claim blocked publish, sitemap/crawl errors.

---

## 12. SEO deltas

All of base §17 applies. The following add or change.

### 12.1 URL scheme additions

| Page | URL | Notes |
|---|---|---|
| Ingredient | `/ingredient/{slug}` | indexable hub; list at `/ingredients` |
| Concern hub | `/concern/{slug}` | indexable, reviewed content only |
| Category + ingredient (whitelisted) | `/category/{slug}/ingredient/{ingredient-slug}` | only if ≥ N products |
| Landing page | `/landing/{slug}` | see §12.8 |
| Magazine | `/mag`, `/mag/{slug}`, `/mag/category/{slug}` | replaces `/blog` |
| Author / reviewer | `/author/{slug}` | E-E-A-T |
| Trust pages | `/page/licences`, `/page/authenticity`, `/page/shipping-storage`, `/page/returns` | |
Everything else (category, product, brand, pack, pages, search, account) as in base §17.1.

### 12.2 Indexation matrix additions

| Page type | Indexable | Canonical | Sitemap | Notes |
|---|---|---|---|---|
| Ingredient page | yes | self | yes | requires unique reviewed intro; ≥ 1 product, else `noindex` |
| Concern hub | yes | self | yes | needs reviewer; else `noindex` until reviewed |
| Category + ingredient facet (whitelist) | yes | self | yes | unique title/H1/intro |
| Landing page, active and `indexable` | yes | self | yes | has unique content, not a duplicate of a category |
| Landing page, expired | 301 to `replacement_path` (or category) after grace; else 410 | – | no | |
| Author/reviewer page | yes | self | yes | |
| Product, recalled | yes | self | yes | recall notice, no purchase; schema availability `OutOfStock`; no `Offer` price if the setting says so |
| Product, `licence_expired` | yes, 200 | self | yes | "not available for sale" notice + alternatives |
| Product, `rx_drug` info-only (if enabled) | yes | self | no | no price, no offers |
| Prescription upload pages, health documents | no | – | no | private, `X-Robots-Tag: noindex` |
| Q&A pagination (`?qa_page=N`) | no | product URL | no | content visible on page 1; later pages `noindex,follow` |

### 12.3 Product lifecycle additions
Base §17.3 plus: recalled → 200 with notice, no `Offer` purchase availability; licence expired → 200 with notice; both listed in the SEO health table as "unavailable but indexable" and reviewed weekly. If a recalled product is permanently withdrawn, apply discontinued rules after the grace period.

### 12.4 Structured data additions

| Page | Types | Rules |
|---|---|---|
| Home | `Organization` (+ `Pharmacy`/`Store` subtype only if a licensed physical pharmacy exists and is shown on the page) + `WebSite` | never `Article`; `contactPoint`, `sameAs` valid only |
| Product | `Product` | `additionalProperty` from attributes + licence code as `PropertyValue`; `brand`; `gtin`; images absolute; `Offer` matches visible price/availability |
| Medicines (OTC) | optional `Drug` mirror | only fields visible on the page (active ingredient, dosage form, warnings); validate in CI |
| Ingredient | `WebPage` + `BreadcrumbList` (+ `MedicalWebPage` only when reviewer stored and visible) | |
| Concern hub | `MedicalWebPage` or `WebPage` with `reviewedBy`/`lastReviewed` when stored and visible | no treatment claims |
| Magazine post | `BlogPosting` (or `MedicalWebPage`) with `author`, `reviewedBy`, `datePublished`, `dateModified`, `citation` from `sources` when present | |
| Author | `Person` with `jobTitle`, `sameAs` | |
| Q&A | none on product pages | |
| FAQ | `FAQPage` only for visible editorial FAQs | |

### 12.5 Metadata templates

| Entity | Title | Description |
|---|---|---|
| Product | `{title_fa} {brand_fa} | {site_name}` | `{short_description_fa}. {key attributes: dosage_form, net_content, origin}` (no claims, no stock/discount text unless real) |
| Category | `{category_fa}: قیمت و مشخصات | {site_name}` | `خرید {category_fa} از برندهای {top_brands}. {intro_excerpt}` |
| Category + brand / ingredient | `{category_fa} {brand_or_ingredient_fa} | {site_name}` | generated from counts and intro |
| Brand | `{brand_fa} ({brand_en}) | {site_name}` | brand intro excerpt |
| Ingredient | `{ingredient_fa}: کاربرد و محصولات | {site_name}` | reviewed intro excerpt |
| Concern | `{concern_fa}: راهنما و محصولات مرتبط | {site_name}` | reviewed intro excerpt |
| Magazine | `{title_fa} | {site_name}` | `{excerpt}` |

Rules (add to base §17.5): `og:image` must be **raster, absolute, ≥ 1200×630**; for product pages use the primary product photo (cropped/padded on a branded canvas) or generate a card from title + photo; never an SVG logo. `og:type` = `product` for products, `article` for posts. No description may contain claims blocked by the claim checker.

### 12.6 robots and headers
As base §17.6, plus `Disallow:` for any `/prescription` or private health upload routes, and `X-Robots-Tag: noindex` on all private document responses. Third-party widgets never block CSS/JS/images.

### 12.7 Sitemaps additions
Add `sitemap-ingredients.xml`, `sitemap-concerns.xml`, `sitemap-landing.xml`, `sitemap-authors.xml`, rename blog to `sitemap-mag.xml`. Only URLs that pass indexability (including content-review status for health hubs).

### 12.8 Landing pages (controlled)
- Purpose: campaign, seasonal and curated "shop" pages.
- A landing page is indexable only if: it has a unique H1, ≥ 150 words of unique intro, ≥ 8 live products, and it is not a near-duplicate of a category (similarity check). Otherwise `noindex,follow`.
- Time-bound pages carry `valid_until`; after it passes: archive, redirect (301) to `replacement_path` or category, or 410 after the grace period. Pages are never left as empty 200s.
- Landing pages link to the relevant category/brand and receive links from the home page or menu; the orphan detector covers them.
- Campaign timers on landing pages come only from `campaigns.ends_at`.

### 12.9 Internal linking and E-E-A-T
- Category → sub-categories, top brands, top ingredients, top products.
- Product → category, brand, each ingredient page, related and alternative products, 1–3 relevant magazine posts, reviewer profile.
- Ingredient/concern → products, categories, magazine posts, reviewer.
- Magazine → products and categories via `blog_post_products`/`blog_post_ingredients`.
- Footer: limited set (about, contact, policies, licences, brands, magazine, categories); no hundreds of links.
- Orphan detector includes ingredient, concern, landing and author pages.
- Content freshness: `dateModified` reflects real content changes; reviewed-date is shown separately and only changed by a reviewer action.
- About/Contact include real address, phone, hours, pharmacy licence info and responsible pharmacist when configured.

### 12.10 Third-party scripts and Core Web Vitals
- One consent-aware loader controls GTM/analytics and the live-chat widget (e.g. Goftino-style). Load after first interaction or idle (`requestIdleCallback`, fallback timeout), never in `<head>` blocking.
- Chat widget reserves no layout space that shifts content; it must not cover primary CTAs on mobile; dismissible.
- Budget: third-party JS counted in Lighthouse CI; regressions fail the build.
- Product and category templates must hit field targets (LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1) **with** these scripts enabled.
- Hero/LCP images preloaded and never lazy; carousels (home) render the first slide server-side with fixed dimensions.

### 12.11 `url_registry` additions
Entity types: `ingredient`, `concern`, `landing`, `author`, `facet_ingredient`; extra columns: `content_review_status`, `valid_until null` (landing), `unavailable_reason null` (recalled, licence_expired). Sitemap and canonical helpers read these.

### 12.12 Automated SEO test suite (adds to base §17.12; blocking in CI)
1. All base §17.12 checks apply to every new template (ingredient, concern, landing, author, magazine).
2. `og:image` on every template resolves to a **raster** image (reject `.svg`), absolute, 200, ≥ 1200×630 (or the product photo's native size ≥ 600 px).
3. Product schema `Offer` is absent for recalled, `licence_expired`, `rx_drug` info-only and call-for-price products; present and matching for others.
4. `aggregateRating`/`review` absent unless approved visible reviews exist; counts equal DB.
5. No `QAPage` JSON-LD on product pages; Q&A text is in initial HTML.
6. Ingredient and concern pages without reviewer or products are `noindex` and excluded from the sitemap.
7. Landing page rules (§12.8): indexable only with unique content and ≥ 8 products; expired pages redirect or 410 (no empty 200).
8. Health content with `is_health_claim_content` and no approved review is not published (404/draft) and not in sitemap.
9. Forbidden-claim fixtures are blocked at save and absent from rendered HTML, metadata and JSON-LD.
10. Third-party scripts do not appear in the render-blocking head; Lighthouse CI budgets pass with chat and tag manager enabled.
11. Product listing cards contain no raw stock number or view counter unless the corresponding setting is on and the value equals the DB.
12. Tab/accordion content (ingredients, usage, warnings, Q&A, FAQ) is present in the HTML with JavaScript disabled.
13. Orphan check includes new page types; breadcrumbs match schema.
14. Eligibility regression: sitemap and feeds contain no `rx_drug`/`controlled`; price-comparison feed contains only `sellable_online` + in-stock items.

### 12.13 Post-launch checklist additions
Weekly: licences expiring, recalled/unavailable indexable pages, content due for re-review, zero-result searches, Q&A backlog, crawl stats (check crawler access from Iran hosting), CWV with chat widget on, Search Console "Product" and "Merchant" reports. Monthly: review top concern/ingredient hubs for accuracy; refresh `last_reviewed_at` only after real review.

---

## 13. Import/export templates (additions)

- `products.xlsx` (upsert by `sku`): adds `regulatory_class`, `licence_code`, `licence_expires_at`, `licence_holder`, `manufacturer`, `importer`, `gtin`, `dosage_form`, `net_content`, `target_age_group`, `storage_condition`, `shelf_life_months`, `ingredients` (semicolon list `name|amount|unit`), `concerns`, `how_to_use`, `warnings`, `leaflet_url`, `discreet_shipping`, `cold_chain`.
- `ingredients.xlsx`, `concerns.xlsx`, `manufacturers.xlsx`, `product_documents.xlsx`, `licences.xlsx` (bulk licence update with expiry).
- Validation: class vs licence rules, expired licence, forbidden claims, missing leaflet, duplicate GTIN, unknown ingredient (offer to create), `rx_drug`/`controlled` rows imported as non-sellable only, row-level error report.

---

## 14. Seed data requirements

3,000 products across all L1 groups (at least 40% with variants such as flavors/sizes), ≥ 150 brands, ≥ 300 ingredients with reviewed intros (marked as seed placeholders), 30 concerns, 200 magazine posts with authors and reviewers, realistic licence codes marked `SEED-` (never look real), Q&A and reviews flagged `is_seed` and **excluded from schema, ratings and production**, 20 campaigns, 5 landing pages (including expired fixtures), recalled and licence-expired fixtures, forbidden-claim fixtures, plus a 50,000-product load seeder.

---

## 15. Observations from the reference site (darukade.com) and how this spec handles them

| Observed pattern | Keep / fix |
|---|---|
| Home page with menu, hero, category blocks, carousels, ad banners, magazine cards, footer with trust badges (samandehi, ecunion, enamad, eanjoman, pharmacy licence) and real contact data | **Keep the structure.** Trust badges come from `trust_assets` with real verification URLs only. |
| Product JSON-LD with `Product`, `Offer`, `AggregateRating`; breadcrumb with category path | **Keep, with the rules:** `aggregateRating` only from approved visible reviews; price in IRR; availability from real stock state. |
| Flavor selector (banana, chocolate, vanilla, strawberry, melon, biscuit) | **Keep as variants** of one product. |
| Properties table, expert review, dosage guidance, FAQ, long Q&A with pharmacist answers | **Keep,** with reviewer attribution, moderation, PII redaction, no `QAPage` schema, server-rendered. |
| Card fields showing `storeCount`, large "visit" numbers (e.g. 131K, 1M) and star ranks | **Do not copy.** Default is simple availability; counts only if real and enabled by setting. |
| `og:image` set to a logo SVG | **Fix:** raster product photo or generated card. |
| Several third-party scripts in `<head>` (tag manager, live chat) | **Fix:** one deferred, consent-aware loader (§12.10). |
| Brand pages, `/landing/...` pages, `/mag` articles | **Keep as page types** with the controlled rules (§12.1, §12.8). |
| Very large category tree | **Keep,** with min-product thresholds for indexing/menu, per-category intros, and facet whitelists. |
