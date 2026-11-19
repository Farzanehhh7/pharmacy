import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { Category, DailySalesPoint, Order, Product } from '../../types/pharmacy';
import { generateSalesReportCsv } from '../../utils/exporters';
import {
  downloadTextFile,
  formatNumber,
  formatToman,
  getFinalPrice,
  getProfitMarginPercent,
} from '../../utils/formatters';

interface SalesAnalyticsTabProps {
  products: Product[];
  categories: Category[];
  orders: Order[];
  dailySales: DailySalesPoint[];
}

export const SalesAnalyticsTab: React.FC<SalesAnalyticsTabProps> = ({
  products,
  categories,
  orders,
  dailySales,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [metricMode, setMetricMode] = useState<'revenue' | 'profit'>('revenue');

  const baseRevenue = dailySales.reduce((s, d) => s + d.revenue, 0);
  const baseProfit = dailySales.reduce((s, d) => s + d.profit, 0);
  const baseOrders = dailySales.reduce((s, d) => s + d.orders, 0);

  // Include live orders placed in this session (orders beyond initial 4)
  const extraOrders = orders.slice(4);
  const liveExtraRevenue = extraOrders.reduce((s, o) => s + o.totalAmount, 0);
  const liveExtraProfit = extraOrders.reduce((s, o) => s + o.totalProfit, 0);

  const totalRevenue = baseRevenue + liveExtraRevenue;
  const totalProfit = baseProfit + liveExtraProfit;
  const totalOrdersCount = baseOrders + extraOrders.length;
  const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;
  const netMarginPct = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0';

  const maxChartVal = Math.max(
    ...dailySales.map((d) => (metricMode === 'revenue' ? d.revenue : d.profit)),
    1
  );

  // Category revenue estimation based on 30d sales
  const categoryStats = categories
    .map((cat) => {
      const catProds = products.filter((p) => p.categoryId === cat.id);
      const rev = catProds.reduce(
        (sum, p) => sum + getFinalPrice(p.price, p.discountPercent) * p.salesCount30d,
        0
      );
      const units = catProds.reduce((sum, p) => sum + p.salesCount30d, 0);
      return { id: cat.id, nameFa: cat.nameFa, revenue: rev, units };
    })
    .sort((a, b) => b.revenue - a.revenue);

  const maxCatRev = Math.max(...categoryStats.map((c) => c.revenue), 1);

  const topProducts = [...products]
    .sort((a, b) => b.salesCount30d - a.salesCount30d)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Header action row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">گزارش جامع فروش، درآمد و حاشیه سود</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            پایش عملکرد ۱۴ روز اخیر، سهم دسته‌بندی‌ها و سودآورترین کدهای کالا (SKU)
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            downloadTextFile(
              'darustan-sales-report.csv',
              generateSalesReportCsv(products, orders),
              'text/csv;charset=utf-8'
            )
          }
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>خروجی گزارش فروش (CSV)</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">مجموع فروش دوره (۱۴ روز)</div>
          <div className="text-xl font-bold text-slate-900 mt-1.5 tabular-nums">
            {formatToman(totalRevenue)}{' '}
            <span className="text-xs font-normal text-slate-500">تومان</span>
          </div>
          <div className="text-xs text-emerald-800 mt-2 tabular-nums">
            +۱۸.۴٪ نسبت به دوره قبل
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">سود ناخالص واقعی</div>
          <div className="text-xl font-bold text-slate-900 mt-1.5 tabular-nums">
            {formatToman(totalProfit)}{' '}
            <span className="text-xs font-normal text-slate-500">تومان</span>
          </div>
          <div className="text-xs text-slate-600 mt-2 tabular-nums">
            میانگین حاشیه سود: {netMarginPct}٪
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">تعداد سفارشات موفق</div>
          <div className="text-xl font-bold text-slate-900 mt-1.5 tabular-nums">
            {formatNumber(totalOrdersCount)} سفارش
          </div>
          <div className="text-xs text-slate-600 mt-2 tabular-nums">
            نرخ تکمیل سبد خرید: ۴.۳٪
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">میانگین ارزش هر سبد (AOV)</div>
          <div className="text-xl font-bold text-slate-900 mt-1.5 tabular-nums">
            {formatToman(avgOrderValue)}{' '}
            <span className="text-xs font-normal text-slate-500">تومان</span>
          </div>
          <div className="text-xs text-slate-600 mt-2 tabular-nums">
            میانگین ۲.۴ قلم در هر سفارش
          </div>
        </div>
      </div>

      {/* Chart + Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 14-day Bar Chart */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">روند روزانه فروش و سود</h3>
              <p className="text-xs text-slate-500">مقادیر بر حسب میلیون تومان</p>
            </div>
            <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setMetricMode('revenue')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  metricMode === 'revenue'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                درآمد کل
              </button>
              <button
                type="button"
                onClick={() => setMetricMode('profit')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  metricMode === 'profit'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                سود خالص
              </button>
            </div>
          </div>

          {/* Interactive SVG/Flex Bar Chart */}
          <div className="relative pt-8 pb-2">
            {hoveredIdx !== null && dailySales[hoveredIdx] && (
              <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs">
                <span className="font-semibold">{dailySales[hoveredIdx].labelFa}</span>
                <div className="flex items-center gap-4 tabular-nums">
                  <span>درآمد: {formatToman(dailySales[hoveredIdx].revenue)} ت</span>
                  <span>سود: {formatToman(dailySales[hoveredIdx].profit)} ت</span>
                  <span>{formatNumber(dailySales[hoveredIdx].orders)} سفارش</span>
                </div>
              </div>
            )}

            <div className="h-52 flex items-end gap-1.5 sm:gap-2 border-b border-slate-200 pb-2">
              {dailySales.map((point, idx) => {
                const value = metricMode === 'revenue' ? point.revenue : point.profit;
                const heightPct = Math.max(8, Math.round((value / maxChartVal) * 100));
                const isHovered = hoveredIdx === idx;
                return (
                  <div
                    key={point.date}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    className="flex-1 h-full flex flex-col justify-end items-center group cursor-pointer"
                  >
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-md transition-colors ${
                        isHovered
                          ? 'bg-emerald-700'
                          : metricMode === 'revenue'
                          ? 'bg-slate-800 group-hover:bg-emerald-700'
                          : 'bg-emerald-800 group-hover:bg-emerald-600'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 tabular-nums">
              <span>{dailySales[0]?.labelFa}</span>
              <span>{dailySales[Math.floor(dailySales.length / 2)]?.labelFa}</span>
              <span>{dailySales[dailySales.length - 1]?.labelFa}</span>
            </div>
          </div>
        </div>

        {/* Category Revenue Breakdown */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">فروش ۳۰ روزه به تفکیک گروه کالا</h3>
            <p className="text-xs text-slate-500">محاسبه شده بر اساس گردش کاتالوگ فعال</p>
          </div>
          <div className="space-y-3">
            {categoryStats.map((cat) => {
              const widthPct = Math.max(6, Math.round((cat.revenue / maxCatRev) * 100));
              return (
                <div key={cat.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800 truncate">{cat.nameFa}</span>
                    <span className="font-mono text-slate-600 tabular-nums shrink-0">
                      {formatToman(cat.revenue)} ت
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${widthPct}%` }}
                      className="h-full bg-emerald-700 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Selling SKUs Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900">پرفروش‌ترین کالاها (عملکرد ۳۰ روزه)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="py-3 px-4 font-semibold">SKU</th>
                <th className="py-3 px-4 font-semibold">نام محصول</th>
                <th className="py-3 px-4 font-semibold">برند</th>
                <th className="py-3 px-4 font-semibold text-left">فروش (عدد)</th>
                <th className="py-3 px-4 font-semibold text-left">قیمت نهایی</th>
                <th className="py-3 px-4 font-semibold text-left">حاشیه سود</th>
                <th className="py-3 px-4 font-semibold text-left">درآمد ۳۰ روزه</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topProducts.map((p) => {
                const finalPrice = getFinalPrice(p.price, p.discountPercent);
                const margin = getProfitMarginPercent(p.price, p.discountPercent, p.costPrice);
                const rev = finalPrice * p.salesCount30d;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-4 font-mono text-slate-600">{p.sku}</td>
                    <td className="py-2.5 px-4 font-medium text-slate-900 max-w-[260px] truncate">
                      {p.nameFa}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">{p.brand}</td>
                    <td className="py-2.5 px-4 text-left font-mono tabular-nums font-semibold">
                      {formatNumber(p.salesCount30d)}
                    </td>
                    <td className="py-2.5 px-4 text-left font-mono tabular-nums">
                      {formatToman(finalPrice)}
                    </td>
                    <td className="py-2.5 px-4 text-left font-mono tabular-nums text-emerald-800 font-semibold">
                      {margin}٪
                    </td>
                    <td className="py-2.5 px-4 text-left font-mono tabular-nums font-bold text-slate-900">
                      {formatToman(rev)}
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
