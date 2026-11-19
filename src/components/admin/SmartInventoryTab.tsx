import React, { useMemo, useState } from 'react';
import { AlertTriangle, Minus, Plus, Search, Warehouse } from 'lucide-react';
import { InventoryLog, Product } from '../../types/pharmacy';
import { daysUntilExpiry, formatNumber, getStockStatus } from '../../utils/formatters';

interface SmartInventoryTabProps {
  products: Product[];
  logs: InventoryLog[];
  onAdjustStock: (
    productId: string,
    delta: number,
    reason: string,
    type: InventoryLog['type'],
    newBatch?: string,
    newExpiryIso?: string,
    newExpiryJalali?: string
  ) => void;
}

export const SmartInventoryTab: React.FC<SmartInventoryTabProps> = ({
  products,
  logs,
  onAdjustStock,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'low' | 'expiring'>('all');
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState<'in' | 'out'>('in');
  const [adjustQty, setAdjustQty] = useState(10);
  const [adjustBatch, setAdjustBatch] = useState('');
  const [adjustReason, setAdjustReason] = useState('ورود محموله جدید از شرکت پخش');

  const lowStockProducts = useMemo(
    () => products.filter((p) => p.stock <= p.minStockThreshold),
    [products]
  );

  const expiringSoonProducts = useMemo(
    () => products.filter((p) => daysUntilExpiry(p.expiryDate) <= 90),
    [products]
  );

  const visibleProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (filterMode === 'low' && p.stock > p.minStockThreshold) return false;
      if (filterMode === 'expiring' && daysUntilExpiry(p.expiryDate) > 90) return false;
      if (q) {
        const hay = `${p.nameFa} ${p.sku} ${p.barcode} ${p.batchNumber} ${p.brand}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [products, searchQuery, filterMode]);

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalProduct || adjustQty <= 0) return;
    const delta = adjustType === 'in' ? adjustQty : -Math.min(adjustQty, modalProduct.stock);
    onAdjustStock(
      modalProduct.id,
      delta,
      adjustReason,
      adjustType,
      adjustBatch.trim() || undefined
    );
    setModalProduct(null);
  };

  return (
    <div className="space-y-6">
      {/* Alert Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">کل واحدهای موجود در انبار</div>
          <div className="text-xl font-bold text-slate-900 mt-1 tabular-nums">
            {formatNumber(products.reduce((s, p) => s + p.stock, 0))} عدد
          </div>
          <div className="text-xs text-slate-600 mt-1.5 tabular-nums">
            در {formatNumber(products.length)} کد کالای فعال
          </div>
        </div>

        <button
          type="button"
          onClick={() => setFilterMode(filterMode === 'low' ? 'all' : 'low')}
          className={`text-right bg-white border rounded-xl p-4 transition-colors cursor-pointer ${
            filterMode === 'low' ? 'border-amber-600 bg-amber-50/40' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">هشدار کسری و نقطه سفارش</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1 tabular-nums">
            {formatNumber(lowStockProducts.length)} قلم کالا
          </div>
          <div className="text-xs text-amber-800 mt-1.5">
            کلیک برای فیلتر کالاهای کم‌موجود یا ناموجود
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFilterMode(filterMode === 'expiring' ? 'all' : 'expiring')}
          className={`text-right bg-white border rounded-xl p-4 transition-colors cursor-pointer ${
            filterMode === 'expiring' ? 'border-rose-600 bg-rose-50/40' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">هشدار انقضای نزدیک (&lt; ۹۰ روز)</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1 tabular-nums">
            {formatNumber(expiringSoonProducts.length)} بچ دارویی
          </div>
          <div className="text-xs text-rose-800 mt-1.5">
            اولویت خروج FEFO (زودتر منقضی، زودتر فروش)
          </div>
        </button>
      </div>

      {/* Controls Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو بر اساس SKU، بارکد، بچ‌نامبر یا نام کالا..."
            className="w-full h-10 pr-9 pl-3 bg-slate-50 border border-slate-300 rounded-lg text-xs"
          />
        </div>

        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
          {[
            { id: 'all', label: 'همه کالاها' },
            { id: 'low', label: `کم‌موجود (${formatNumber(lowStockProducts.length)})` },
            { id: 'expiring', label: `نزدیک انقضا (${formatNumber(expiringSoonProducts.length)})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterMode(tab.id as 'all' | 'low' | 'expiring')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                filterMode === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Smart Inventory Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="py-3 px-4 font-semibold">SKU</th>
                <th className="py-3 px-4 font-semibold">نام کالا</th>
                <th className="py-3 px-4 font-semibold">شماره بچ</th>
                <th className="py-3 px-4 font-semibold">تاریخ انقضا</th>
                <th className="py-3 px-4 font-semibold text-left">موجودی</th>
                <th className="py-3 px-4 font-semibold text-left">حد سفارش</th>
                <th className="py-3 px-4 font-semibold">وضعیت</th>
                <th className="py-3 px-4 font-semibold text-left">تغییر سریع / حواله</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleProducts.map((p) => {
                const status = getStockStatus(p.stock, p.minStockThreshold);
                const daysLeft = daysUntilExpiry(p.expiryDate);
                return (
                  <tr key={p.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-4 font-mono text-slate-600">{p.sku}</td>
                    <td className="py-2.5 px-4 font-medium text-slate-900 max-w-[240px] truncate">
                      {p.nameFa}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-600">{p.batchNumber}</td>
                    <td className="py-2.5 px-4 font-mono tabular-nums">
                      <span className={daysLeft <= 90 ? 'text-rose-700 font-bold' : 'text-slate-700'}>
                        {p.expiryJalali}
                      </span>
                      {daysLeft <= 90 && (
                        <span className="block text-[10px] text-rose-600">
                          {formatNumber(Math.max(0, daysLeft))} روز تا انقضا
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-left font-mono tabular-nums font-bold text-slate-900">
                      {formatNumber(p.stock)}
                    </td>
                    <td className="py-2.5 px-4 text-left font-mono tabular-nums text-slate-500">
                      {formatNumber(p.minStockThreshold)}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`font-semibold ${
                          status.tone === 'healthy'
                            ? 'text-emerald-800'
                            : status.tone === 'low'
                            ? 'text-amber-700'
                            : 'text-rose-700'
                        }`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          disabled={p.stock <= 0}
                          onClick={() =>
                            onAdjustStock(p.id, -1, 'کسر دستی انباردار', 'adjustment')
                          }
                          aria-label="کاهش موجودی"
                          className="p-1 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onAdjustStock(p.id, 1, 'افزایش دستی انباردار', 'adjustment')
                          }
                          aria-label="افزایش موجودی"
                          className="p-1 border border-slate-200 rounded hover:bg-slate-100 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setModalProduct(p);
                            setAdjustBatch(p.batchNumber);
                            setAdjustQty(20);
                            setAdjustType('in');
                          }}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-emerald-800 text-white rounded text-[11px] font-medium cursor-pointer whitespace-nowrap"
                        >
                          ثبت حواله
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Warehouse Movement Audit Log */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
          <Warehouse className="w-4 h-4 text-emerald-800" />
          <h3 className="text-sm font-bold text-slate-900">دفتر کل گردش و تراکنش‌های انبار</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="py-2.5 px-4 font-semibold">زمان</th>
                <th className="py-2.5 px-4 font-semibold">SKU</th>
                <th className="py-2.5 px-4 font-semibold">محصول</th>
                <th className="py-2.5 px-4 font-semibold">نوع</th>
                <th className="py-2.5 px-4 font-semibold text-left">تغییر</th>
                <th className="py-2.5 px-4 font-semibold text-left">موجودی جدید</th>
                <th className="py-2.5 px-4 font-semibold">شرح / دلیل</th>
                <th className="py-2.5 px-4 font-semibold">اپراتور</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-4 font-mono text-slate-500 tabular-nums whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-600">{log.sku}</td>
                  <td className="py-2.5 px-4 font-medium text-slate-900 max-w-[200px] truncate">
                    {log.productName}
                  </td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`font-semibold ${
                        log.quantityDelta > 0 ? 'text-emerald-800' : 'text-rose-700'
                      }`}
                    >
                      {log.type === 'in'
                        ? 'ورود'
                        : log.type === 'sale'
                        ? 'فروش'
                        : log.type === 'out'
                        ? 'خروج'
                        : 'تعدیل'}
                    </span>
                  </td>
                  <td
                    dir="ltr"
                    className={`py-2.5 px-4 text-left font-mono tabular-nums font-bold ${
                      log.quantityDelta > 0 ? 'text-emerald-800' : 'text-rose-700'
                    }`}
                  >
                    {log.quantityDelta > 0 ? `+${log.quantityDelta}` : log.quantityDelta}
                  </td>
                  <td className="py-2.5 px-4 text-left font-mono tabular-nums">
                    {formatNumber(log.newStock)}
                  </td>
                  <td className="py-2.5 px-4 text-slate-600 max-w-[240px] truncate">
                    {log.reason}
                  </td>
                  <td className="py-2.5 px-4 text-slate-500">{log.operator}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Movement Modal */}
      {modalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <form
            onSubmit={handleModalSubmit}
            className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl"
          >
            <h3 className="text-base font-bold text-slate-900">
              ثبت حواله انبار — {modalProduct.nameFa}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAdjustType('in')}
                className={`py-2 rounded-lg text-xs font-semibold border cursor-pointer ${
                  adjustType === 'in'
                    ? 'bg-emerald-800 text-white border-emerald-800'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                ورود محموله (+)
              </button>
              <button
                type="button"
                onClick={() => setAdjustType('out')}
                className={`py-2 rounded-lg text-xs font-semibold border cursor-pointer ${
                  adjustType === 'out'
                    ? 'bg-rose-700 text-white border-rose-700'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                خروج / ضایعات (-)
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">تعداد (واحد)</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full h-10 px-3 border border-slate-300 rounded-lg font-mono tabular-nums"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">شماره بچ (Batch Number)</label>
                <input
                  type="text"
                  value={adjustBatch}
                  onChange={(e) => setAdjustBatch(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-300 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">شرح سند انبار</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalProduct(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-slate-900 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                ثبت قطعی در انبار
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
