import React, { useState } from 'react';
import { Check, Code2, Minus, Plus, ShieldCheck, Star, X } from 'lucide-react';
import { Category, Product } from '../types/pharmacy';
import { buildProductJsonLd } from '../utils/exporters';
import { formatNumber, formatToman, getFinalPrice, getStockStatus } from '../utils/formatters';

interface ProductDetailModalProps {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  categories,
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'specs' | 'usage' | 'seo'>('specs');

  if (!product) return null;

  const category = categories.find((c) => c.id === product.categoryId);
  const finalPrice = getFinalPrice(product.price, product.discountPercent);
  const savings = product.price - finalPrice;
  const stockStatus = getStockStatus(product.stock, product.minStockThreshold);
  const schemaJson = buildProductJsonLd(product, category?.nameFa || 'داروخانه');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Top Modal Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4">
          <div className="text-xs text-slate-500 flex items-center gap-2 truncate">
            <span>{category?.nameFa}</span>
            <span aria-hidden="true">/</span>
            <span className="text-slate-800 font-medium">{product.subcategory}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{product.sku}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contiguous Purchase Module */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Image Left/Right */}
          <div className="md:col-span-5">
            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
              <img
                src={product.image}
                alt={product.nameFa}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs border border-slate-200 rounded-xl p-3.5 bg-slate-50">
              <div>
                <span className="text-slate-500 block">شماره بچ (Batch)</span>
                <span className="font-mono font-semibold text-slate-900">{product.batchNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 block">تاریخ انقضا</span>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {product.expiryJalali}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">بارکد اصالت (EAN)</span>
                <span className="font-mono text-slate-800 tabular-nums">{product.barcode}</span>
              </div>
              <div>
                <span className="text-slate-500 block">شکل و بسته‌بندی</span>
                <span className="font-medium text-slate-800">
                  {product.dosageForm} · {product.packageSize}
                </span>
              </div>
            </div>
          </div>

          {/* Purchase Info */}
          <div className="md:col-span-7 flex flex-col justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-emerald-800">{product.brand}</span>
                <span aria-hidden="true">·</span>
                <span>ساخت {product.originCountry}</span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 text-slate-700 tabular-nums">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {product.rating.toFixed(1)} ({formatNumber(product.reviewCount)} نظر)
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                {product.nameFa}
              </h2>
              <p className="text-xs font-mono text-slate-500">{product.nameEn}</p>
              <p className="text-sm text-slate-600 leading-relaxed pt-1">{product.shortDesc}</p>
            </div>

            {/* Pricing & Add to Cart Box */}
            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  {product.discountPercent > 0 && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                      <span className="line-through tabular-nums">
                        {formatToman(product.price)} تومان
                      </span>
                      <span className="text-emerald-800 font-semibold tabular-nums">
                        سود شما: {formatToman(savings)} تومان ({formatNumber(product.discountPercent)}٪)
                      </span>
                    </div>
                  )}
                  <div className="text-2xl font-bold text-slate-900 tabular-nums">
                    {formatToman(finalPrice)}{' '}
                    <span className="text-sm font-normal text-slate-600">تومان</span>
                  </div>
                </div>

                <div className="text-left">
                  <span
                    className={`text-xs font-semibold ${
                      stockStatus.tone === 'healthy'
                        ? 'text-emerald-800'
                        : stockStatus.tone === 'low'
                        ? 'text-amber-700'
                        : 'text-rose-700'
                    }`}
                  >
                    {stockStatus.label}
                  </span>
                  {product.stock > 0 && (
                    <div className="text-[11px] text-slate-500 tabular-nums mt-0.5">
                      موجودی انبار: {formatNumber(product.stock)} عدد
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="inline-flex items-center justify-between border border-slate-300 bg-white rounded-lg h-11 px-2">
                  <button
                    type="button"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-40 cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center text-sm font-bold tabular-nums">
                    {formatNumber(quantity)}
                  </span>
                  <button
                    type="button"
                    disabled={quantity >= product.stock}
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-40 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  disabled={product.stock <= 0}
                  onClick={() => {
                    onAddToCart(product, quantity);
                    onClose();
                  }}
                  className="flex-1 h-11 px-6 bg-emerald-800 hover:bg-emerald-900 disabled:bg-slate-300 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  {product.stock > 0 ? 'افزودن به سبد خرید' : 'ناموجود در انبار'}
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-600 pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>تضمین اصالت کالا با هولوگرام سازمان غذا و دارو و نگهداری در زنجیره دمای استاندارد</span>
              </div>
            </div>
          </div>
        </div>

        {/* Clinical & SEO Tabs */}
        <div className="px-6 pb-6">
          <div className="border-b border-slate-200 flex items-center gap-6 text-sm">
            <button
              type="button"
              onClick={() => setActiveTab('specs')}
              className={`py-3 border-b-2 font-medium transition-colors cursor-pointer ${
                activeTab === 'specs'
                  ? 'border-emerald-700 text-emerald-800 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              ترکیبات موثره و کاربرد
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('usage')}
              className={`py-3 border-b-2 font-medium transition-colors cursor-pointer ${
                activeTab === 'usage'
                  ? 'border-emerald-700 text-emerald-800 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              نحوه مصرف و هشدارهای داروساز
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('seo')}
              className={`py-3 border-b-2 font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'seo'
                  ? 'border-emerald-700 text-emerald-800 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>اسکیما و متادیتای سئو</span>
            </button>
          </div>

          <div className="pt-5">
            {activeTab === 'specs' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="border border-slate-200 rounded-xl p-4">
                  <div className="text-xs text-slate-500 mb-1">ترکیب فعال و دوز</div>
                  <div className="font-mono text-xs sm:text-sm text-slate-900 font-medium" dir="ltr">
                    {product.activeIngredient}
                  </div>
                </div>
                <div className="border border-slate-200 rounded-xl p-4">
                  <div className="text-xs text-slate-500 mb-1">موارد مصرف و فواید</div>
                  <ul className="space-y-1 text-slate-800 text-xs">
                    {product.concerns.map((c) => (
                      <li key={c} className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'usage' && (
              <div className="space-y-4 text-sm">
                <div className="border border-slate-200 rounded-xl p-4">
                  <div className="text-xs font-bold text-slate-800 mb-1">دستورالعمل مصرف</div>
                  <p className="text-slate-700 leading-relaxed">{product.usageInstructions}</p>
                </div>
                <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-4">
                  <div className="text-xs font-bold text-amber-900 mb-1">موارد احتیاط و هشدارها</div>
                  <p className="text-amber-900/90 leading-relaxed">{product.warnings}</p>
                </div>
              </div>
            )}

            {activeTab === 'seo' && (
              <div className="space-y-4">
                <div className="border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
                  <div>
                    <span className="text-slate-500">URL استاندارد (Canonical): </span>
                    <span className="font-mono text-emerald-800" dir="ltr">
                      {product.seo.canonicalUrl}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">عنوان سئو (Meta Title): </span>
                    <span className="font-semibold text-slate-900">{product.seo.metaTitle}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">توضیحات متا: </span>
                    <span className="text-slate-700">{product.seo.metaDescription}</span>
                  </div>
                </div>
                <pre
                  dir="ltr"
                  className="bg-slate-950 text-emerald-300 p-4 rounded-xl text-[11px] font-mono overflow-x-auto leading-relaxed"
                >
                  {JSON.stringify(schemaJson, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
