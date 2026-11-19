import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Category, Product } from '../types/pharmacy';
import { formatNumber } from '../utils/formatters';

interface CategoriesDirectoryProps {
  categories: Category[];
  products: Product[];
  onSelectCategory: (categoryId: string, subcategory?: string) => void;
}

export const CategoriesDirectory: React.FC<CategoriesDirectoryProps> = ({
  categories,
  products,
  onSelectCategory,
}) => {
  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          دایرکتوری کامل دسته‌بندی‌ها و گروه‌های دارویی
        </h1>
        <p className="text-sm text-slate-600 mt-2">
          ساختار درختی سئو شده شامل {formatNumber(categories.length)} دسته اصلی و بیش از ۳۲ زیردسته تخصصی برای دسترسی سریع به محصولات.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((cat) => {
          const catProducts = products.filter((p) => p.categoryId === cat.id);
          return (
            <div
              key={cat.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col sm:flex-row"
            >
              <div className="sm:w-44 shrink-0 bg-slate-100">
                <img
                  src={cat.image}
                  alt={cat.nameFa}
                  referrerPolicy="no-referrer"
                  className="w-full h-44 sm:h-full object-cover"
                />
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-lg font-bold text-slate-900">{cat.nameFa}</h2>
                    <span className="text-xs text-slate-500 tabular-nums font-mono">
                      /{cat.slug}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {cat.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                    {cat.subcategories.map((sub) => {
                      const subCount = catProducts.filter((p) => p.subcategory === sub).length;
                      return (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => onSelectCategory(cat.id, sub)}
                          className="text-xs px-2.5 py-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200 rounded-md transition-colors cursor-pointer"
                        >
                          {sub} ({formatNumber(subCount)})
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-500 tabular-nums">
                    مجموع {formatNumber(catProducts.length)} قلم کالا
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectCategory(cat.id)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-900 cursor-pointer"
                  >
                    <span>مشاهده همه محصولات دسته</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
