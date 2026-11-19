import React, { useState } from 'react';
import { Code2, Download, ExternalLink, FileCheck2, Globe } from 'lucide-react';
import { Category, Product } from '../types/pharmacy';
import {
  buildProductJsonLd,
  generateHtaccessRedirects,
  generateSitemapXml,
  generateWooCommerceCsv,
  generateWordPressWxrXml,
} from '../utils/exporters';
import { downloadTextFile, formatNumber } from '../utils/formatters';

interface SeoShowcaseViewProps {
  products: Product[];
  categories: Category[];
  onOpenAdminSeo: () => void;
}

export const SeoShowcaseView: React.FC<SeoShowcaseViewProps> = ({
  products,
  categories,
  onOpenAdminSeo,
}) => {
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];
  const category = categories.find((c) => c.id === selectedProduct?.categoryId);

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-10 space-y-10">
      <div className="border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            معماری سئو، اسکیما JSON-LD و آمادگی مهاجرت به وردپرس
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
            تمامی صفحات محصول و دسته‌بندی‌های داروستان با ساختار URL معنایی، متادیتای OpenGraph،
            اسکیما استاندارد داروخانه و محصول (Schema.org) و نقشه سایت XML تولید می‌شوند.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenAdminSeo}
          className="px-5 py-2.5 bg-slate-900 hover:bg-emerald-800 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          ویرایش سئو و خروجی در پنل مدیریت
        </button>
      </div>

      {/* SEO Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-slate-500">صفحات دارای Canonical & Meta</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {formatNumber(products.length + categories.length)} صفحه
          </div>
          <div className="text-xs text-emerald-800 mt-2">پوشش ۱۰۰٪ کاتالوگ</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-slate-500">نوع داده‌های ساختاریافته</div>
          <div className="text-lg font-bold text-slate-900 mt-1 font-mono">
            Pharmacy + Product
          </div>
          <div className="text-xs text-slate-600 mt-2">شامل GTIN-13، قیمت و موجودی زنده</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-slate-500">سازگاری با افزونه‌های سئو وردپرس</div>
          <div className="text-lg font-bold text-slate-900 mt-1">Yoast SEO & RankMath</div>
          <div className="text-xs text-slate-600 mt-2">نگاشت مستقیم فیلدهای متا در خروجی CSV</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-slate-500">حفظ رتبه در انتقال دامنه</div>
          <div className="text-lg font-bold text-slate-900 mt-1">ریدایرکت خودکار ۳۰۱</div>
          <div className="text-xs text-slate-600 mt-2">تولید قوانین Apache & Nginx</div>
        </div>
      </div>

      {/* Live SERP & Schema Inspector */}
      {selectedProduct && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-800" />
                <span>پیش‌نمایش زنده نتیجه گوگل (SERP)</span>
              </h2>
              <select
                value={selectedProduct.id}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs max-w-[220px]"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nameFa}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <div className="text-xs text-slate-600 font-mono truncate" dir="ltr">
                https://darustan.ir &gt; product &gt; {selectedProduct.seo.slug}
              </div>
              <div className="text-lg font-semibold text-blue-800 leading-snug">
                {selectedProduct.seo.metaTitle}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {selectedProduct.seo.metaDescription}
              </p>
              <div className="pt-2 flex items-center gap-3 text-[11px] text-slate-500 tabular-nums">
                <span>امتیاز: {selectedProduct.rating} / ۵</span>
                <span aria-hidden="true">·</span>
                <span>{formatNumber(selectedProduct.reviewCount)} بررسی</span>
                <span aria-hidden="true">·</span>
                <span>{selectedProduct.stock > 0 ? 'موجود در انبار' : 'ناموجود'}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() =>
                  downloadTextFile(
                    'sitemap.xml',
                    generateSitemapXml(products, categories),
                    'application/xml;charset=utf-8'
                  )
                }
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 bg-white hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-800 cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-800" />
                <span>دانلود Sitemap.xml</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  downloadTextFile(
                    'darustan-woocommerce-products.csv',
                    generateWooCommerceCsv(products, categories),
                    'text/csv;charset=utf-8'
                  )
                }
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>دانلود خروجی WooCommerce CSV</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-3 pt-1 text-xs">
              <button
                type="button"
                onClick={() =>
                  downloadTextFile(
                    'darustan-wordpress-export.xml',
                    generateWordPressWxrXml(products, categories),
                    'application/xml;charset=utf-8'
                  )
                }
                className="inline-flex items-center gap-1 text-slate-700 hover:text-emerald-800 font-medium cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>خروجی WXR وردپرس (XML)</span>
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={() =>
                  downloadTextFile(
                    'htaccess-301-redirects.txt',
                    generateHtaccessRedirects(products, categories),
                    'text/plain;charset=utf-8'
                  )
                }
                className="inline-flex items-center gap-1 text-slate-700 hover:text-emerald-800 font-medium cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>قوانین ریدایرکت ۳۰۱ (.htaccess)</span>
              </button>
              <span className="text-slate-300">|</span>
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-emerald-800 hover:underline font-medium"
              >
                <span>مشاهده مسیر زنده /sitemap.xml</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-800" />
              <span>داده ساختاریافته زنده Schema.org (JSON-LD)</span>
            </h2>
            <pre
              dir="ltr"
              className="bg-slate-950 text-emerald-300 p-4 rounded-xl text-[11px] font-mono overflow-x-auto max-h-[340px] leading-relaxed"
            >
              {JSON.stringify(
                buildProductJsonLd(selectedProduct, category?.nameFa || 'داروخانه'),
                null,
                2
              )}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
