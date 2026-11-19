import React, { useMemo, useState } from 'react';
import { Percent, Save } from 'lucide-react';
import { Category, Product } from '../../types/pharmacy';
import {
  formatNumber,
  formatToman,
  getFinalPrice,
  getProfitMarginPercent,
} from '../../utils/formatters';

interface PricingEngineTabProps {
  products: Product[];
  categories: Category[];
  onUpdateProductPrice: (
    productId: string,
    price: number,
    costPrice: number,
    discountPercent: number
  ) => void;
  onApplyBulkPricing: (
    scopeType: 'all' | 'category' | 'brand',
    scopeValue: string,
    action: 'increase_price' | 'decrease_price' | 'set_discount',
    percent: number
  ) => void;
}

export const PricingEngineTab: React.FC<PricingEngineTabProps> = ({
  products,
  categories,
  onUpdateProductPrice,
  onApplyBulkPricing,
}) => {
  const [scopeType, setScopeType] = useState<'all' | 'category' | 'brand'>('category');
  const [scopeValue, setScopeValue] = useState<string>(categories[0]?.id || '');
  const [bulkAction, setBulkAction] = useState<
    'increase_price' | 'decrease_price' | 'set_discount'
  >('set_discount');
  const [bulkPercent, setBulkPercent] = useState<number>(15);
  const [bulkFeedback, setBulkFeedback] = useState<string>('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftPrice, setDraftPrice] = useState<number>(0);
  const [draftCost, setDraftCost] = useState<number>(0);
  const [draftDiscount, setDraftDiscount] = useState<number>(0);

  const brands = useMemo(() => Array.from(new Set(products.map((p) => p.brand))).sort(), [products]);

  const affectedProducts = useMemo(() => {
    if (scopeType === 'all') return products;
    if (scopeType === 'category') return products.filter((p) => p.categoryId === scopeValue);
    return products.filter((p) => p.brand === scopeValue);
  }, [products, scopeType, scopeValue]);

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (affectedProducts.length === 0) return;
    onApplyBulkPricing(scopeType, scopeValue, bulkAction, bulkPercent);
    setBulkFeedback(
      `قانون قیمت‌گذاری روی ${formatNumber(affectedProducts.length)} محصول اعمال شد و قیمت‌های فروشگاه بروزرسانی گردید.`
    );
    setTimeout(() => setBulkFeedback(''), 5000);
  };

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setDraftPrice(p.price);
    setDraftCost(p.costPrice);
    setDraftDiscount(p.discountPercent);
  };

  const saveEdit = (productId: string) => {
    onUpdateProductPrice(productId, draftPrice, draftCost, draftDiscount);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Bulk Pricing Rule Builder */}
      <form
        onSubmit={handleBulkSubmit}
        className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
      >
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Percent className="w-4 h-4 text-emerald-800" />
              <span>موتور قیمت‌گذاری گروهی و کمپین تخفیف</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              تغییر همزمان قیمت پایه یا درصد تخفیف بر اساس گروه کالا یا برند با محاسبه حاشیه سود
            </p>
          </div>
          <span className="text-xs font-mono text-slate-600 tabular-nums shrink-0">
            کالاهای هدف: {formatNumber(affectedProducts.length)} SKU
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">محدوده اعمال</label>
            <select
              value={scopeType}
              onChange={(e) => {
                const nextType = e.target.value as 'all' | 'category' | 'brand';
                setScopeType(nextType);
                if (nextType === 'category') setScopeValue(categories[0]?.id || '');
                if (nextType === 'brand') setScopeValue(brands[0] || '');
              }}
              className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-lg"
            >
              <option value="all">کل کاتالوگ فروشگاه</option>
              <option value="category">دسته‌بندی مشخص</option>
              <option value="brand">برند مشخص</option>
            </select>
          </div>

          {scopeType !== 'all' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {scopeType === 'category' ? 'انتخاب دسته‌بندی' : 'انتخاب برند'}
              </label>
              <select
                value={scopeValue}
                onChange={(e) => setScopeValue(e.target.value)}
                className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-lg"
              >
                {scopeType === 'category'
                  ? categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameFa}
                      </option>
                    ))
                  : brands.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
              </select>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">نوع عملیات قیمتی</label>
            <select
              value={bulkAction}
              onChange={(e) =>
                setBulkAction(
                  e.target.value as 'increase_price' | 'decrease_price' | 'set_discount'
                )
              }
              className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-lg"
            >
              <option value="set_discount">اعمال درصد تخفیف فروش</option>
              <option value="increase_price">افزایش قیمت پایه (تورم/تامین)</option>
              <option value="decrease_price">کاهش قیمت پایه</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">درصد تغییر (٪)</label>
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                max={90}
                value={bulkPercent}
                onChange={(e) => setBulkPercent(Math.max(0, Math.min(90, Number(e.target.value) || 0)))}
                className="w-24 h-10 px-3 bg-slate-50 border border-slate-300 rounded-lg font-mono tabular-nums"
              />
              <button
                type="submit"
                className="flex-1 h-10 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                اعمال گروهی
              </button>
            </div>
          </div>
        </div>

        {bulkFeedback && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-lg">
            {bulkFeedback}
          </div>
        )}
      </form>

      {/* Margin & Inline Price Matrix */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            ماتریس قیمت‌گذاری، قیمت خرید و حاشیه سود لحظه‌ای
          </h3>
          <span className="text-xs text-slate-500">تمامی مبالغ به تومان</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="py-3 px-4 font-semibold">SKU</th>
                <th className="py-3 px-4 font-semibold">نام کالا</th>
                <th className="py-3 px-4 font-semibold text-left">قیمت خرید</th>
                <th className="py-3 px-4 font-semibold text-left">قیمت مصرف‌کننده</th>
                <th className="py-3 px-4 font-semibold text-left">تخفیف (٪)</th>
                <th className="py-3 px-4 font-semibold text-left">قیمت فروش نهایی</th>
                <th className="py-3 px-4 font-semibold text-left">حاشیه سود</th>
                <th className="py-3 px-4 font-semibold text-left">ویرایش</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => {
                const isEditing = editingId === p.id;
                const activePrice = isEditing ? draftPrice : p.price;
                const activeCost = isEditing ? draftCost : p.costPrice;
                const activeDiscount = isEditing ? draftDiscount : p.discountPercent;
                const finalPrice = getFinalPrice(activePrice, activeDiscount);
                const margin = getProfitMarginPercent(activePrice, activeDiscount, activeCost);

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-4 font-mono text-slate-600">{p.sku}</td>
                    <td className="py-2.5 px-4 font-medium text-slate-900 max-w-[230px] truncate">
                      {p.nameFa}
                    </td>
                    <td className="py-2.5 px-4 text-left font-mono tabular-nums">
                      {isEditing ? (
                        <input
                          type="number"
                          value={draftCost}
                          onChange={(e) => setDraftCost(Number(e.target.value) || 0)}
                          className="w-24 h-8 px-2 border border-slate-300 rounded text-left"
                        />
                      ) : (
                        formatToman(p.costPrice)
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-left font-mono tabular-nums">
                      {isEditing ? (
                        <input
                          type="number"
                          value={draftPrice}
                          onChange={(e) => setDraftPrice(Number(e.target.value) || 0)}
                          className="w-24 h-8 px-2 border border-slate-300 rounded text-left"
                        />
                      ) : (
                        formatToman(p.price)
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-left font-mono tabular-nums">
                      {isEditing ? (
                        <input
                          type="number"
                          min={0}
                          max={90}
                          value={draftDiscount}
                          onChange={(e) =>
                            setDraftDiscount(Math.max(0, Math.min(90, Number(e.target.value) || 0)))
                          }
                          className="w-16 h-8 px-2 border border-slate-300 rounded text-left"
                        />
                      ) : (
                        `${formatNumber(p.discountPercent)}٪`
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-left font-mono tabular-nums font-bold text-slate-900">
                      {formatToman(finalPrice)}
                    </td>
                    <td
                      className={`py-2.5 px-4 text-left font-mono tabular-nums font-bold ${
                        margin < 10
                          ? 'text-rose-700'
                          : margin < 20
                          ? 'text-amber-700'
                          : 'text-emerald-800'
                      }`}
                    >
                      {margin}٪
                    </td>
                    <td className="py-2.5 px-4 text-left">
                      {isEditing ? (
                        <button
                          type="button"
                          onClick={() => saveEdit(p.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-800 text-white rounded text-[11px] font-semibold cursor-pointer"
                        >
                          <Save className="w-3 h-3" />
                          <span>ذخیره</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEdit(p)}
                          className="px-2.5 py-1 border border-slate-300 hover:border-slate-900 text-slate-700 rounded text-[11px] font-medium cursor-pointer"
                        >
                          تغییر قیمت
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
