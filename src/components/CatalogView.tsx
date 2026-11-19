import React, { useMemo, useState } from 'react';
import { Filter, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import { Category, DosageForm, Product, StoreFilters } from '../types/pharmacy';
import { formatNumber, formatToman, getFinalPrice } from '../utils/formatters';
import { ProductCard } from './ProductCard';

interface CatalogViewProps {
  products: Product[];
  categories: Category[];
  filters: StoreFilters;
  onFiltersChange: (next: StoreFilters) => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const DEFAULT_FILTERS: StoreFilters = {
  query: '',
  categoryId: 'all',
  subcategory: 'all',
  brands: [],
  dosageForms: [],
  originCountries: [],
  minPrice: 0,
  maxPrice: 10000000,
  onlyInStock: false,
  onlyDiscounted: false,
  minRating: 0,
  sortBy: 'bestseller',
};

export const CatalogView: React.FC<CatalogViewProps> = ({
  products,
  categories,
  filters,
  onFiltersChange,
  onSelectProduct,
  onAddToCart,
}) => {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const allBrands = useMemo(
    () => Array.from(new Set(products.map((p) => p.brand))).sort(),
    [products]
  );

  const allDosageForms = useMemo(
    () => Array.from(new Set(products.map((p) => p.dosageForm))) as DosageForm[],
    [products]
  );

  const allCountries = useMemo(
    () => Array.from(new Set(products.map((p) => p.originCountry))),
    [products]
  );

  const activeCategory = categories.find((c) => c.id === filters.categoryId);

  const filteredProducts = useMemo(() => {
    const q = filters.query.trim().toLowerCase();

    const list = products.filter((p) => {
      if (filters.categoryId !== 'all' && p.categoryId !== filters.categoryId) return false;
      if (filters.subcategory !== 'all' && p.subcategory !== filters.subcategory) return false;
      if (filters.brands.length > 0 && !filters.brands.includes(p.brand)) return false;
      if (filters.dosageForms.length > 0 && !filters.dosageForms.includes(p.dosageForm))
        return false;
      if (filters.originCountries.length > 0 && !filters.originCountries.includes(p.originCountry))
        return false;

      const finalPrice = getFinalPrice(p.price, p.discountPercent);
      if (finalPrice < filters.minPrice || finalPrice > filters.maxPrice) return false;
      if (filters.onlyInStock && p.stock <= 0) return false;
      if (filters.onlyDiscounted && p.discountPercent <= 0) return false;
      if (filters.minRating > 0 && p.rating < filters.minRating) return false;

      if (q) {
        const haystack = [
          p.nameFa,
          p.nameEn,
          p.brand,
          p.sku,
          p.barcode,
          p.activeIngredient,
          p.subcategory,
          ...p.concerns,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });

    list.sort((a, b) => {
      const priceA = getFinalPrice(a.price, a.discountPercent);
      const priceB = getFinalPrice(b.price, b.discountPercent);
      switch (filters.sortBy) {
        case 'price_asc':
          return priceA - priceB;
        case 'price_desc':
          return priceB - priceA;
        case 'discount':
          return b.discountPercent - a.discountPercent;
        case 'rating':
          return b.rating - a.rating;
        case 'bestseller':
        default:
          return b.salesCount30d - a.salesCount30d;
      }
    });

    return list;
  }, [products, filters]);

  const toggleArrayValue = <T extends string>(arr: T[], value: T): T[] => {
    return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
  };

  const activeFilterCount =
    (filters.query ? 1 : 0) +
    (filters.categoryId !== 'all' ? 1 : 0) +
    (filters.subcategory !== 'all' ? 1 : 0) +
    filters.brands.length +
    filters.dosageForms.length +
    filters.originCountries.length +
    (filters.onlyInStock ? 1 : 0) +
    (filters.onlyDiscounted ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.minPrice > 0 || filters.maxPrice < 10000000 ? 1 : 0);

  const FilterPanelContent = (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <Filter className="w-4 h-4 text-emerald-800" />
          <span>فیلترهای دقیق</span>
          {activeFilterCount > 0 && (
            <span className="text-xs font-mono text-emerald-800 tabular-nums">
              ({formatNumber(activeFilterCount)})
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={() => onFiltersChange(DEFAULT_FILTERS)}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-rose-700 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>پاک کردن همه</span>
          </button>
        )}
      </div>

      {/* Category & Subcategory */}
      <div className="space-y-2.5">
        <label className="block text-xs font-bold text-slate-800">گروه محصولات</label>
        <select
          value={filters.categoryId}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              categoryId: e.target.value,
              subcategory: 'all',
            })
          }
          className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-emerald-700"
        >
          <option value="all">همه دسته‌بندی‌ها ({formatNumber(products.length)})</option>
          {categories.map((c) => {
            const count = products.filter((p) => p.categoryId === c.id).length;
            return (
              <option key={c.id} value={c.id}>
                {c.nameFa} ({formatNumber(count)})
              </option>
            );
          })}
        </select>

        {activeCategory && (
          <div className="pt-1 space-y-1">
            <div className="text-[11px] font-semibold text-slate-500">زیردسته‌ها</div>
            <button
              type="button"
              onClick={() => onFiltersChange({ ...filters, subcategory: 'all' })}
              className={`block w-full text-right px-2.5 py-1.5 rounded text-xs cursor-pointer ${
                filters.subcategory === 'all'
                  ? 'bg-emerald-50 text-emerald-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              همه زیرمجموعه‌ها
            </button>
            {activeCategory.subcategories.map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => onFiltersChange({ ...filters, subcategory: sub })}
                className={`block w-full text-right px-2.5 py-1.5 rounded text-xs cursor-pointer ${
                  filters.subcategory === sub
                    ? 'bg-emerald-50 text-emerald-900 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Availability & Offers */}
      <div className="space-y-2.5 border-t border-slate-200 pt-4">
        <div className="text-xs font-bold text-slate-800">وضعیت موجودی و فروش</div>
        <label className="flex items-center justify-between gap-2 text-xs text-slate-700 cursor-pointer py-1">
          <span>فقط کالاهای موجود در انبار</span>
          <input
            type="checkbox"
            checked={filters.onlyInStock}
            onChange={(e) => onFiltersChange({ ...filters, onlyInStock: e.target.checked })}
            className="w-4 h-4 accent-emerald-700 rounded cursor-pointer"
          />
        </label>
        <label className="flex items-center justify-between gap-2 text-xs text-slate-700 cursor-pointer py-1">
          <span>فقط محصولات تخفیف‌دار</span>
          <input
            type="checkbox"
            checked={filters.onlyDiscounted}
            onChange={(e) => onFiltersChange({ ...filters, onlyDiscounted: e.target.checked })}
            className="w-4 h-4 accent-emerald-700 rounded cursor-pointer"
          />
        </label>
      </div>

      {/* Price Range */}
      <div className="space-y-2.5 border-t border-slate-200 pt-4">
        <div className="text-xs font-bold text-slate-800">محدوده قیمت (تومان)</div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[11px] text-slate-500">حداقل</span>
            <input
              type="number"
              min={0}
              step={50000}
              value={filters.minPrice}
              onChange={(e) =>
                onFiltersChange({ ...filters, minPrice: Math.max(0, Number(e.target.value) || 0) })
              }
              className="w-full h-9 px-2.5 mt-1 bg-slate-50 border border-slate-300 rounded-md text-xs font-mono tabular-nums"
            />
          </div>
          <div>
            <span className="text-[11px] text-slate-500">حداکثر</span>
            <input
              type="number"
              min={0}
              step={100000}
              value={filters.maxPrice}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  maxPrice: Math.max(0, Number(e.target.value) || 10000000),
                })
              }
              className="w-full h-9 px-2.5 mt-1 bg-slate-50 border border-slate-300 rounded-md text-xs font-mono tabular-nums"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {[
            { label: 'زیر ۵۰۰ هزار', min: 0, max: 500000 },
            { label: '۵۰۰ هزار تا ۱.۵ میلیون', min: 500000, max: 1500000 },
            { label: 'بالای ۱.۵ میلیون', min: 1500000, max: 10000000 },
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() =>
                onFiltersChange({ ...filters, minPrice: preset.min, maxPrice: preset.max })
              }
              className="text-[11px] px-2 py-1 rounded border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-700 text-slate-700 cursor-pointer"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dosage Form */}
      <div className="space-y-2 border-t border-slate-200 pt-4">
        <div className="text-xs font-bold text-slate-800">شکل دارویی / نوع محصول</div>
        <div className="grid grid-cols-2 gap-1.5">
          {allDosageForms.map((form) => {
            const active = filters.dosageForms.includes(form);
            return (
              <button
                key={form}
                type="button"
                onClick={() =>
                  onFiltersChange({
                    ...filters,
                    dosageForms: toggleArrayValue(filters.dosageForms, form),
                  })
                }
                className={`px-2.5 py-1.5 rounded-md text-xs text-right border transition-colors cursor-pointer ${
                  active
                    ? 'bg-emerald-800 text-white border-emerald-800'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                }`}
              >
                {form}
              </button>
            );
          })}
        </div>
      </div>

      {/* Brands */}
      <div className="space-y-2 border-t border-slate-200 pt-4">
        <div className="text-xs font-bold text-slate-800">برند سازنده</div>
        <div className="max-h-48 overflow-y-auto space-y-1.5 pl-1">
          {allBrands.map((brand) => (
            <label
              key={brand}
              className="flex items-center justify-between gap-2 text-xs text-slate-700 cursor-pointer py-0.5"
            >
              <span className="truncate">{brand}</span>
              <input
                type="checkbox"
                checked={filters.brands.includes(brand)}
                onChange={() =>
                  onFiltersChange({
                    ...filters,
                    brands: toggleArrayValue(filters.brands, brand),
                  })
                }
                className="w-3.5 h-3.5 accent-emerald-700 rounded cursor-pointer shrink-0"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Origin Country */}
      <div className="space-y-2 border-t border-slate-200 pt-4">
        <div className="text-xs font-bold text-slate-800">کشور مبدا</div>
        <div className="flex flex-wrap gap-1.5">
          {allCountries.map((country) => {
            const active = filters.originCountries.includes(country);
            return (
              <button
                key={country}
                type="button"
                onClick={() =>
                  onFiltersChange({
                    ...filters,
                    originCountries: toggleArrayValue(filters.originCountries, country),
                  })
                }
                className={`px-2.5 py-1 rounded-md text-xs border transition-colors cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-400'
                }`}
              >
                {country}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-8">
      {/* Top Search & Sort Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.query}
            onChange={(e) => onFiltersChange({ ...filters, query: e.target.value })}
            placeholder="جستجوی پیشرفته بر اساس نام فارسی/انگلیسی، ترکیب موثره (مثل هیالورونیک، منیزیم)، کاربرد یا SKU..."
            className="w-full h-11 pr-10 pl-10 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-700 focus:bg-white"
          />
          {filters.query && (
            <button
              type="button"
              onClick={() => onFiltersChange({ ...filters, query: '' })}
              aria-label="پاک کردن جستجو"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>فیلترها</span>
            {activeFilterCount > 0 && (
              <span className="tabular-nums">({formatNumber(activeFilterCount)})</span>
            )}
          </button>

          <div className="flex items-center gap-2">
            <label htmlFor="sort-select" className="text-xs text-slate-500 whitespace-nowrap">
              مرتب‌سازی:
            </label>
            <select
              id="sort-select"
              value={filters.sortBy}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  sortBy: e.target.value as StoreFilters['sortBy'],
                })
              }
              className="h-10 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-700"
            >
              <option value="bestseller">پرفروش‌ترین</option>
              <option value="price_asc">ارزان‌ترین</option>
              <option value="price_desc">گران‌ترین</option>
              <option value="discount">بیشترین تخفیف</option>
              <option value="rating">بالاترین امتیاز</option>
            </select>
          </div>

          <div className="text-xs text-slate-600 tabular-nums whitespace-nowrap">
            نمایش <span className="font-bold text-slate-900">{formatNumber(filteredProducts.length)}</span> از{' '}
            {formatNumber(products.length)} کالا
          </div>
        </div>
      </div>

      {/* Main Grid: Filter Sidebar + Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="hidden lg:block lg:col-span-3 bg-white border border-slate-200 rounded-xl p-5 sticky top-36">
          {FilterPanelContent}
        </aside>

        <div className="lg:col-span-9">
          {activeCategory && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="text-lg font-bold text-slate-900">{activeCategory.nameFa}</h1>
                <p className="text-xs text-slate-600 mt-0.5">{activeCategory.description}</p>
              </div>
              <span className="text-xs font-mono text-slate-500 shrink-0">
                /category/{activeCategory.slug}
              </span>
            </div>
          )}

          {filteredProducts.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-4">
              <div className="text-lg font-bold text-slate-900">
                محصولی با فیلترهای انتخابی یافت نشد
              </div>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                فیلترهای برند، محدوده قیمت یا جستجوی فعلی را تغییر دهید تا همه محصولات مرتبط نمایش داده شوند.
              </p>
              <button
                type="button"
                onClick={() => onFiltersChange(DEFAULT_FILTERS)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-medium rounded-lg cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>بازنشانی فیلترها</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={onSelectProduct}
                  onAddToCart={onAddToCart}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-white h-full overflow-y-auto p-5 z-10 shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
              <span className="text-base font-bold text-slate-900">فیلتر پیشرفته محصولات</span>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {FilterPanelContent}
            <div className="pt-6 sticky bottom-0 bg-white pb-2">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full py-3 bg-emerald-800 text-white text-sm font-semibold rounded-lg cursor-pointer"
              >
                نمایش {formatNumber(filteredProducts.length)} محصول
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
