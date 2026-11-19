import React, { useState } from 'react';
import { Check, Copy, Download, FileCode2, Globe, Save } from 'lucide-react';
import { Category, Product, ProductSEO } from '../../types/pharmacy';
import {
  buildProductJsonLd,
  generateHtaccessRedirects,
  generateSitemapXml,
  generateWooCommerceCsv,
  generateWordPressWxrXml,
} from '../../utils/exporters';
import { downloadTextFile, formatNumber } from '../../utils/formatters';

interface SeoWordPressTabProps {
  mode: 'seo' | 'wordpress';
  products: Product[];
  categories: Category[];
  onUpdateProductSeo: (productId: string, seo: ProductSEO) => void;
}

export const SeoWordPressTab: React.FC<SeoWordPressTabProps> = ({
  mode,
  products,
  categories,
  onUpdateProductSeo,
}) => {
  const [selectedId, setSelectedId] = useState(products[0]?.id || '');
  const selectedProduct = products.find((p) => p.id === selectedId) || products[0];
  const [draftSeo, setDraftSeo] = useState<ProductSEO | null>(
    selectedProduct ? { ...selectedProduct.seo } : null
  );
  const [savedMsg, setSavedMsg] = useState('');
  const [copiedHtaccess, setCopiedHtaccess] = useState(false);

  const handleSelectProduct = (id: string) => {
    setSelectedId(id);
    const found = products.find((p) => p.id === id);
    if (found) setDraftSeo({ ...found.seo });
  };

  const handleSaveSeo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !draftSeo) return;
    onUpdateProductSeo(selectedProduct.id, draftSeo);
    setSavedMsg('تنظیمات سئو و متادیتای محصول ذخیره و در اسکیما بروزرسانی شد.');
    setTimeout(() => setSavedMsg(''), 4000);
  };

  const htaccessRules = generateHtaccessRedirects(products, categories);

  if (mode === 'wordpress') {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-900">
            مرکز انتقال و مهاجرت به وردپرس و ووکامرس (WordPress / WooCommerce)
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
            تمامی داده‌های محصولات، دسته‌بندی‌های سلسله‌مراتبی، موجودی انبار، کدهای SKU، قیمت‌های
            عادی و تخفیف‌خورده به همراه متادیتای سئو (Yoast SEO) بدون نیاز به ورود دستی داده، آماده
            ایمپورت مستقیم در پیشخوان وردپرس است.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4">
              <div>
                <div className="text-xs font-mono text-emerald-800 font-semibold">مرحله ۱ · ووکامرس</div>
                <h3 className="text-sm font-bold text-slate-900 mt-1">
                  فایل رسمی WooCommerce CSV
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  دارای کدگذاری UTF-8 BOM برای پشتیبانی کامل از فارسی و نگاشت خودکار ستون‌های
                  قیمت، موجودی، بچ و متای Yoast.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  downloadTextFile(
                    'darustan-woocommerce-import.csv',
                    generateWooCommerceCsv(products, categories),
                    'text/csv;charset=utf-8'
                  )
                }
                className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>دانلود CSV ({formatNumber(products.length)} محصول)</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4">
              <div>
                <div className="text-xs font-mono text-slate-600 font-semibold">مرحله ۲ · وردپرس</div>
                <h3 className="text-sm font-bold text-slate-900 mt-1">
                  فایل استاندارد WordPress WXR (XML)
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  قابل بارگذاری مستقیم در مسیر ابزارها &gt; درون‌ریزی &gt; وردپرس شامل ساختار پست‌تایپ
                  product و دسته‌بندی‌ها.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  downloadTextFile(
                    'darustan-wordpress-wxr.xml',
                    generateWordPressWxrXml(products, categories),
                    'application/xml;charset=utf-8'
                  )
                }
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileCode2 className="w-4 h-4" />
                <span>دانلود خروجی WXR XML</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4">
              <div>
                <div className="text-xs font-mono text-slate-600 font-semibold">مرحله ۳ · حفظ سئو</div>
                <h3 className="text-sm font-bold text-slate-900 mt-1">
                  نقشه سایت و ریدایرکت ۳۰۱
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  جلوگیری از خطای 404 گوگل هنگام انتقال دامنه با دانلود Sitemap فعلی و قوانین
                  ریدایرکت ۳۰۱.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  downloadTextFile(
                    'sitemap.xml',
                    generateSitemapXml(products, categories),
                    'application/xml;charset=utf-8'
                  )
                }
                className="w-full py-2.5 px-4 border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>دانلود Sitemap.xml</span>
              </button>
            </div>
          </div>
        </div>

        {/* .htaccess 301 Redirect Preview */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                قوانین ریدایرکت ۳۰۱ خودکار برای فایل .htaccess وردپرس
              </h3>
              <p className="text-xs text-slate-500">
                جهت انتقال اعتبار سئوی لینک‌های فعلی به پرمالینک‌های ووکامرس
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(htaccessRules);
                setCopiedHtaccess(true);
                setTimeout(() => setCopiedHtaccess(false), 2500);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              {copiedHtaccess ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedHtaccess ? 'کپی شد' : 'کپی کدها'}</span>
            </button>
          </div>
          <pre
            dir="ltr"
            className="bg-slate-950 text-slate-200 p-4 rounded-xl text-[11px] font-mono overflow-x-auto max-h-60 leading-relaxed"
          >
            {htaccessRules}
          </pre>
        </div>
      </div>
    );
  }

  // SEO Studio Mode
  const activeCategory = categories.find((c) => c.id === selectedProduct?.categoryId);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">استودیو ویرایش سئو، اسلاگ و اسکیما</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            بهینه‌سازی عنوان متا، توضیحات گوگل، کلمه کلیدی کانونی و لینک Canonical برای هر محصول
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedId}
            onChange={(e) => handleSelectProduct(e.target.value)}
            className="h-10 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs max-w-[280px]"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.sku} — {p.nameFa}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedProduct && draftSeo && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleSaveSeo}
            className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4 text-xs"
          >
            {savedMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg">
                {savedMsg}
              </div>
            )}

            <div>
              <div className="flex justify-between mb-1">
                <label className="font-semibold text-slate-800">عنوان سئو (Meta Title)</label>
                <span
                  className={`font-mono tabular-nums ${
                    draftSeo.metaTitle.length > 65 ? 'text-amber-700' : 'text-emerald-800'
                  }`}
                >
                  {formatNumber(draftSeo.metaTitle.length)} / ۶۵ کاراکتر
                </span>
              </div>
              <input
                type="text"
                required
                value={draftSeo.metaTitle}
                onChange={(e) => setDraftSeo({ ...draftSeo, metaTitle: e.target.value })}
                className="w-full h-10 px-3 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="font-semibold text-slate-800">توضیحات متا (Meta Description)</label>
                <span
                  className={`font-mono tabular-nums ${
                    draftSeo.metaDescription.length > 160 ? 'text-amber-700' : 'text-emerald-800'
                  }`}
                >
                  {formatNumber(draftSeo.metaDescription.length)} / ۱۶۰ کاراکتر
                </span>
              </div>
              <textarea
                rows={3}
                required
                value={draftSeo.metaDescription}
                onChange={(e) => setDraftSeo({ ...draftSeo, metaDescription: e.target.value })}
                className="w-full p-3 border border-slate-300 rounded-lg resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">اسلاگ URL (Slug)</label>
                <input
                  type="text"
                  dir="ltr"
                  required
                  value={draftSeo.slug}
                  onChange={(e) => setDraftSeo({ ...draftSeo, slug: e.target.value })}
                  className="w-full h-10 px-3 border border-slate-300 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-800 mb-1">کلمه کلیدی کانونی</label>
                <input
                  type="text"
                  value={draftSeo.focusKeyword}
                  onChange={(e) => setDraftSeo({ ...draftSeo, focusKeyword: e.target.value })}
                  className="w-full h-10 px-3 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">آدرس کانونیکال (Canonical URL)</label>
              <input
                type="url"
                dir="ltr"
                value={draftSeo.canonicalUrl}
                onChange={(e) => setDraftSeo({ ...draftSeo, canonicalUrl: e.target.value })}
                className="w-full h-10 px-3 border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="inline-flex items-center gap-2 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(draftSeo.noIndex)}
                  onChange={(e) => setDraftSeo({ ...draftSeo, noIndex: e.target.checked })}
                  className="accent-rose-700 cursor-pointer"
                />
                <span>عدم ایندکس توسط گوگل (noindex)</span>
              </label>

              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-lg cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>ذخیره تنظیمات سئو</span>
              </button>
            </div>
          </form>

          {/* Live Google SERP & JSON-LD */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2">
                <Globe className="w-4 h-4 text-emerald-800" />
                <span>پیش‌نمایش اسنیپت گوگل</span>
              </div>
              <div className="text-[11px] font-mono text-slate-500 truncate" dir="ltr">
                https://darustan.ir/product/{draftSeo.slug}
              </div>
              <div className="text-base font-semibold text-blue-800 leading-snug">
                {draftSeo.metaTitle}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{draftSeo.metaDescription}</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
              <div className="text-xs font-bold text-slate-800">اسکیما JSON-LD خروجی صفحه</div>
              <pre
                dir="ltr"
                className="bg-slate-950 text-emerald-300 p-3.5 rounded-lg text-[10px] font-mono overflow-x-auto max-h-56"
              >
                {JSON.stringify(
                  buildProductJsonLd(
                    { ...selectedProduct, seo: draftSeo },
                    activeCategory?.nameFa || 'داروخانه'
                  ),
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
