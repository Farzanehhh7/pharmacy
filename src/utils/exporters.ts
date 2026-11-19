import { Category, Order, Product } from '../types/pharmacy';
import { getFinalPrice, getProfitMarginPercent } from './formatters';

function escapeCsvCell(value: string | number | boolean): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function escapeXml(str: string): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateWooCommerceCsv(products: Product[], categories: Category[]): string {
  const catMap = new Map(categories.map((c) => [c.id, c.nameFa]));
  const headers = [
    'ID',
    'Type',
    'SKU',
    'Name',
    'Published',
    'Is featured?',
    'Visibility in catalog',
    'Short description',
    'Description',
    'In stock?',
    'Stock',
    'Low stock amount',
    'Regular price',
    'Sale price',
    'Categories',
    'Tags',
    'Images',
    'Attribute 1 name',
    'Attribute 1 value(s)',
    'Attribute 2 name',
    'Attribute 2 value(s)',
    'Meta: _yoast_wpseo_title',
    'Meta: _yoast_wpseo_metadesc',
    'Meta: _yoast_wpseo_focuskw',
    'Meta: _darustan_batch_no',
    'Meta: _darustan_expiry_date',
  ];

  const rows = products.map((p, index) => {
    const catName = catMap.get(p.categoryId) || 'سایر';
    const categoryHierarchy = `${catName} > ${p.subcategory}`;
    const salePrice = p.discountPercent > 0 ? getFinalPrice(p.price, p.discountPercent) : '';
    const fullDescription = `${p.shortDesc}\n\nترکیب موثره: ${p.activeIngredient}\nنحوه مصرف: ${p.usageInstructions}\nهشدارها: ${p.warnings}`;

    return [
      index + 101,
      'simple',
      p.sku,
      p.nameFa,
      1,
      p.isFeatured ? 1 : 0,
      'visible',
      p.shortDesc,
      fullDescription,
      p.stock > 0 ? 1 : 0,
      p.stock,
      p.minStockThreshold,
      p.price,
      salePrice,
      categoryHierarchy,
      p.concerns.join(', '),
      p.image,
      'برند',
      p.brand,
      'شکل دارویی',
      p.dosageForm,
      p.seo.metaTitle,
      p.seo.metaDescription,
      p.seo.focusKeyword,
      p.batchNumber,
      p.expiryDate,
    ].map(escapeCsvCell);
  });

  // UTF-8 BOM ensures Persian characters render properly in Excel & WooCommerce CSV Importer
  return '\uFEFF' + [headers.map(escapeCsvCell).join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function generateWordPressWxrXml(
  products: Product[],
  categories: Category[],
  siteUrl = 'https://darustan.ir'
): string {
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const itemsXml = products
    .map((p, idx) => {
      const cat = catMap.get(p.categoryId);
      const salePrice = p.discountPercent > 0 ? getFinalPrice(p.price, p.discountPercent) : p.price;
      return `
  <item>
    <title>${escapeXml(p.nameFa)}</title>
    <link>${escapeXml(`${siteUrl}/product/${p.seo.slug}`)}</link>
    <pubDate>Tue, 17 Nov 2026 08:00:00 +0000</pubDate>
    <dc:creator><![CDATA[darustan_admin]]></dc:creator>
    <guid isPermaLink="false">${escapeXml(`${siteUrl}/?post_type=product&p=${idx + 1000}`)}</guid>
    <description></description>
    <content:encoded><![CDATA[<p>${p.shortDesc}</p><p><strong>ترکیب موثره:</strong> ${p.activeIngredient}</p><p><strong>نحوه مصرف:</strong> ${p.usageInstructions}</p>]]></content:encoded>
    <excerpt:encoded><![CDATA[${p.shortDesc}]]></excerpt:encoded>
    <wp:post_id>${idx + 1000}</wp:post_id>
    <wp:post_date><![CDATA[2026-11-17 08:00:00]]></wp:post_date>
    <wp:post_name><![CDATA[${p.seo.slug}]]></wp:post_name>
    <wp:status><![CDATA[publish]]></wp:status>
    <wp:post_type><![CDATA[product]]></wp:post_type>
    <category domain="product_cat" nicename="${escapeXml(cat?.slug || 'general')}"><![CDATA[${cat?.nameFa || 'عمومی'}]]></category>
    <wp:postmeta><wp:meta_key><![CDATA[_sku]]></wp:meta_key><wp:meta_value><![CDATA[${p.sku}]]></wp:meta_value></wp:postmeta>
    <wp:postmeta><wp:meta_key><![CDATA[_regular_price]]></wp:meta_key><wp:meta_value><![CDATA[${p.price}]]></wp:meta_value></wp:postmeta>
    <wp:postmeta><wp:meta_key><![CDATA[_price]]></wp:meta_key><wp:meta_value><![CDATA[${salePrice}]]></wp:meta_value></wp:postmeta>
    <wp:postmeta><wp:meta_key><![CDATA[_stock]]></wp:meta_key><wp:meta_value><![CDATA[${p.stock}]]></wp:meta_value></wp:postmeta>
    <wp:postmeta><wp:meta_key><![CDATA[_yoast_wpseo_title]]></wp:meta_key><wp:meta_value><![CDATA[${p.seo.metaTitle}]]></wp:meta_value></wp:postmeta>
    <wp:postmeta><wp:meta_key><![CDATA[_yoast_wpseo_metadesc]]></wp:meta_key><wp:meta_value><![CDATA[${p.seo.metaDescription}]]></wp:meta_value></wp:postmeta>
  </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0"
  xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:wp="http://wordpress.org/export/1.2/"
>
<channel>
  <title>داروستان | خروجی استاندارد وردپرس و ووکامرس</title>
  <link>${escapeXml(siteUrl)}</link>
  <description>خروجی محصولات و دسته‌بندی‌های داروخانه آنلاین برای ایمپورت در وردپرس</description>
  <pubDate>Tue, 17 Nov 2026 08:00:00 +0000</pubDate>
  <language>fa-IR</language>
  <wp:wxr_version>1.2</wp:wxr_version>
  <wp:base_site_url>${escapeXml(siteUrl)}</wp:base_site_url>
  <wp:base_blog_url>${escapeXml(siteUrl)}</wp:base_blog_url>
${itemsXml}
</channel>
</rss>`;
}

export function generateSitemapXml(
  products: Product[],
  categories: Category[],
  baseUrl = 'https://darustan.ir'
): string {
  const staticUrls = [
    { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'daily' },
    { loc: `${baseUrl}/shop`, priority: '0.9', changefreq: 'daily' },
  ];

  const categoryUrls = categories.map((c) => ({
    loc: `${baseUrl}/category/${c.slug}`,
    priority: '0.8',
    changefreq: 'weekly',
  }));

  const productUrls = products
    .filter((p) => !p.seo.noIndex)
    .map((p) => ({
      loc: `${baseUrl}/product/${p.seo.slug}`,
      priority: '0.7',
      changefreq: 'daily',
    }));

  const allUrls = [...staticUrls, ...categoryUrls, ...productUrls];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>2026-11-17</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;
}

export function generateHtaccessRedirects(products: Product[], categories: Category[]): string {
  const lines = [
    '# قوانین ریدایرکت ۳۰۱ برای انتقال بدون افت سئو به وردپرس و ووکامرس',
    'RewriteEngine On',
    '',
    '# ریدایرکت دسته‌بندی‌ها به ساختار product-category ووکامرس',
    ...categories.map((c) => `Redirect 301 /category/${c.slug} /product-category/${c.slug}/`),
    '',
    '# ریدایرکت محصولات به ساختار استاندارد پرمالینک ووکامرس',
    ...products.slice(0, 15).map((p) => `Redirect 301 /p/${p.sku.toLowerCase()} /product/${p.seo.slug}/`),
  ];
  return lines.join('\n');
}

export function generateSalesReportCsv(products: Product[], orders: Order[]): string {
  const headers = [
    'SKU',
    'نام محصول',
    'برند',
    'تعداد فروش ۳۰ روزه',
    'قیمت مصرف کننده (تومان)',
    'قیمت نهایی با تخفیف (تومان)',
    'قیمت خرید (تومان)',
    'حاشیه سود (%)',
    'موجودی فعلی',
    'تاریخ انقضا',
  ];

  const productRows = products.map((p) => {
    const finalPrice = getFinalPrice(p.price, p.discountPercent);
    const margin = getProfitMarginPercent(p.price, p.discountPercent, p.costPrice);
    return [
      p.sku,
      p.nameFa,
      p.brand,
      p.salesCount30d,
      p.price,
      finalPrice,
      p.costPrice,
      `${margin}%`,
      p.stock,
      p.expiryJalali,
    ].map(escapeCsvCell);
  });

  const orderSummary = [
    '',
    'گزارش سفارشات اخیر',
    '',
    'شماره سفارش',
    'مشتری',
    'درگاه پرداخت',
    'مبلغ کل (تومان)',
    'سود خالص (تومان)',
    'وضعیت',
    'کد رهگیری',
  ].map(escapeCsvCell);

  const orderRows = orders.map((o) =>
    [
      o.orderNumber,
      o.customerName,
      o.gatewayName,
      o.totalAmount,
      o.totalProfit,
      o.status,
      o.transactionRef,
      o.city,
      o.createdAt,
      '',
    ].map(escapeCsvCell)
  );

  return (
    '\uFEFF' +
    [
      headers.map(escapeCsvCell).join(','),
      ...productRows.map((r) => r.join(',')),
      '',
      orderSummary.join(','),
      ...orderRows.map((r) => r.join(',')),
    ].join('\n')
  );
}

export function buildProductJsonLd(product: Product, categoryName: string): Record<string, unknown> {
  const finalPrice = getFinalPrice(product.price, product.discountPercent);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.nameFa,
    alternateName: product.nameEn,
    sku: product.sku,
    gtin13: product.barcode,
    category: `${categoryName} / ${product.subcategory}`,
    brand: {
      '@type': 'Brand',
      name: product.brand,
    },
    description: product.seo.metaDescription || product.shortDesc,
    offers: {
      '@type': 'Offer',
      url: product.seo.canonicalUrl,
      priceCurrency: 'IRR',
      price: finalPrice * 10,
      availability:
        product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
    },
  };
}
