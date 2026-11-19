import React, { useState } from 'react';
import {
  BarChart3,
  Boxes,
  CreditCard,
  FileCode2,
  FolderTree,
  Globe,
  Percent,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { IMG_VITAMINS } from '../data/catalog';
import {
  Category,
  DailySalesPoint,
  DosageForm,
  InventoryLog,
  Order,
  PaymentGateway,
  Product,
  ProductSEO,
} from '../types/pharmacy';
import { formatNumber, formatToman, getFinalPrice } from '../utils/formatters';
import { OrdersGatewaysTab } from './admin/OrdersGatewaysTab';
import { PricingEngineTab } from './admin/PricingEngineTab';
import { SalesAnalyticsTab } from './admin/SalesAnalyticsTab';
import { SeoWordPressTab } from './admin/SeoWordPressTab';
import { SmartInventoryTab } from './admin/SmartInventoryTab';

export type AdminTab =
  | 'analytics'
  | 'inventory'
  | 'pricing'
  | 'catalog'
  | 'orders'
  | 'seo'
  | 'wordpress';

interface AdminDashboardProps {
  initialTab?: AdminTab;
  products: Product[];
  categories: Category[];
  orders: Order[];
  gateways: PaymentGateway[];
  inventoryLogs: InventoryLog[];
  dailySales: DailySalesPoint[];
  onAdjustStock: (
    productId: string,
    delta: number,
    reason: string,
    type: InventoryLog['type'],
    newBatch?: string
  ) => void;
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
  onAddProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  onUpdateGateway: (gateway: PaymentGateway) => void;
  onUpdateProductSeo: (productId: string, seo: ProductSEO) => void;
}

const SIDEBAR_ITEMS: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'analytics', label: 'گزارش‌گیری و تحلیل فروش', icon: BarChart3 },
  { id: 'inventory', label: 'انبارداری هوشمند و بچ', icon: Boxes },
  { id: 'pricing', label: 'قیمت‌گذاری و حاشیه سود', icon: Percent },
  { id: 'catalog', label: 'محصولات و دسته‌بندی‌ها', icon: FolderTree },
  { id: 'orders', label: 'سفارشات و درگاه پرداخت', icon: CreditCard },
  { id: 'seo', label: 'استودیو سئو و اسکیما', icon: Globe },
  { id: 'wordpress', label: 'انتقال به وردپرس (Woo)', icon: FileCode2 },
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  initialTab = 'analytics',
  products,
  categories,
  orders,
  gateways,
  inventoryLogs,
  dailySales,
  onAdjustStock,
  onUpdateProductPrice,
  onApplyBulkPricing,
  onAddProduct,
  onDeleteProduct,
  onUpdateOrderStatus,
  onUpdateGateway,
  onUpdateProductSeo,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const [addModalOpen, setAddModalOpen] = useState(false);

  // New Product Form State
  const [newNameFa, setNewNameFa] = useState('');
  const [newNameEn, setNewNameEn] = useState('');
  const [newBrand, setNewBrand] = useState('EuRho Vital');
  const [newCategoryId, setNewCategoryId] = useState(categories[0]?.id || 'vitamins');
  const [newSubcategory, setNewSubcategory] = useState(categories[0]?.subcategories[0] || '');
  const [newDosageForm, setNewDosageForm] = useState<DosageForm>('کپسول');
  const [newOrigin, setNewOrigin] = useState('آلمان');
  const [newPrice, setNewPrice] = useState(450000);
  const [newCost, setNewCost] = useState(320000);
  const [newStock, setNewStock] = useState(40);
  const [newBatch, setNewBatch] = useState('DRP-2609-NW');
  const [newIngredient, setNewIngredient] = useState('Vitamin Complex');

  const activeNav = SIDEBAR_ITEMS.find((item) => item.id === activeTab);
  const lowStockCount = products.filter((p) => p.stock <= p.minStockThreshold).length;

  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNameFa.trim()) return;
    const id = `p-${Date.now()}`;
    const sku = `DRP-NEW-${Math.floor(1000 + Math.random() * 8999)}`;
    const slug = (newNameEn || sku).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const selectedCat = categories.find((c) => c.id === newCategoryId);

    const product: Product = {
      id,
      sku,
      barcode: `6260${Math.floor(100000000 + Math.random() * 899999999)}`,
      nameFa: newNameFa.trim(),
      nameEn: newNameEn.trim() || 'Pharmacy Supplement Product',
      brand: newBrand.trim(),
      categoryId: newCategoryId,
      subcategory: newSubcategory || selectedCat?.subcategories[0] || 'عمومی',
      dosageForm: newDosageForm,
      originCountry: newOrigin,
      packageSize: '۶۰ عددی',
      activeIngredient: newIngredient.trim(),
      concerns: ['تضمین اصالت داروستان', 'فرمولاسیون تخصصی'],
      price: newPrice,
      costPrice: newCost,
      discountPercent: 0,
      stock: newStock,
      minStockThreshold: 12,
      batchNumber: newBatch.trim(),
      expiryDate: '2028-09-01',
      expiryJalali: '۱۴۰۷/۰۶/۱۱',
      rating: 4.8,
      reviewCount: 1,
      salesCount30d: 0,
      isFeatured: true,
      image: selectedCat?.image || IMG_VITAMINS,
      shortDesc: `${newNameFa.trim()} با تضمین اصالت و نظارت داروساز در داروستان.`,
      usageInstructions: 'طبق دستور پزشک یا داروساز مصرف شود.',
      warnings: 'دور از دسترس کودکان نگهداری شود.',
      seo: {
        slug,
        metaTitle: `${newNameFa.trim()} | داروستان`,
        metaDescription: `خرید آنلاین ${newNameFa.trim()} برند ${newBrand.trim()} با تضمین اصالت و تاریخ انقضا از داروستان.`,
        focusKeyword: newNameFa.trim(),
        canonicalUrl: `https://darustan.ir/product/${slug}`,
      },
    };

    onAddProduct(product);
    setAddModalOpen(false);
    setNewNameFa('');
    setNewNameEn('');
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Sidebar Navigation (256px) */}
        <aside className="w-full lg:w-64 shrink-0 bg-white border border-slate-200 rounded-xl p-3 lg:sticky lg:top-36">
          <div className="px-3 py-2 border-b border-slate-100 mb-2">
            <div className="text-sm font-bold text-slate-900">پنل مدیریت داروستان</div>
            <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
              {formatNumber(products.length)} کالا · {formatNumber(lowStockCount)} هشدار انبار
            </div>
          </div>

          <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0">
            {SIDEBAR_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    active
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Admin Workspace */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          {/* Top Breadcrumb Bar */}
          <div className="bg-white border border-slate-200 rounded-xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <span>پنل مدیریت</span>
              <span aria-hidden="true">/</span>
              <span className="font-bold text-slate-900">{activeNav?.label}</span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن محصول جدید</span>
              </button>
            </div>
          </div>

          {/* Active Workspace Content */}
          {activeTab === 'analytics' && (
            <SalesAnalyticsTab
              products={products}
              categories={categories}
              orders={orders}
              dailySales={dailySales}
            />
          )}

          {activeTab === 'inventory' && (
            <SmartInventoryTab
              products={products}
              logs={inventoryLogs}
              onAdjustStock={onAdjustStock}
            />
          )}

          {activeTab === 'pricing' && (
            <PricingEngineTab
              products={products}
              categories={categories}
              onUpdateProductPrice={onUpdateProductPrice}
              onApplyBulkPricing={onApplyBulkPricing}
            />
          )}

          {activeTab === 'orders' && (
            <OrdersGatewaysTab
              orders={orders}
              gateways={gateways}
              onUpdateOrderStatus={onUpdateOrderStatus}
              onUpdateGateway={onUpdateGateway}
            />
          )}

          {(activeTab === 'seo' || activeTab === 'wordpress') && (
            <SeoWordPressTab
              mode={activeTab}
              products={products}
              categories={categories}
              onUpdateProductSeo={onUpdateProductSeo}
            />
          )}

          {activeTab === 'catalog' && (
            <div className="space-y-6">
              {/* Categories Summary */}
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h2 className="text-sm font-bold text-slate-900 mb-3">
                  ساختار {formatNumber(categories.length)} دسته اصلی و زیردسته‌ها
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  {categories.map((cat) => {
                    const count = products.filter((p) => p.categoryId === cat.id).length;
                    return (
                      <div key={cat.id} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                        <div className="font-bold text-slate-900 flex justify-between">
                          <span className="truncate">{cat.nameFa}</span>
                          <span className="tabular-nums font-mono text-emerald-800">
                            {formatNumber(count)}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 truncate">
                          /{cat.slug}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Products Management Table */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    لیست کامل محصولات فروشگاه ({formatNumber(products.length)})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(true)}
                    className="text-xs font-semibold text-emerald-800 hover:underline cursor-pointer"
                  >
                    + ثبت کالای جدید
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="py-3 px-4 font-semibold">SKU</th>
                        <th className="py-3 px-4 font-semibold">نام محصول</th>
                        <th className="py-3 px-4 font-semibold">دسته‌بندی</th>
                        <th className="py-3 px-4 font-semibold">برند</th>
                        <th className="py-3 px-4 font-semibold text-left">قیمت نهایی</th>
                        <th className="py-3 px-4 font-semibold text-left">موجودی</th>
                        <th className="py-3 px-4 font-semibold text-left">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {products.map((p) => {
                        const cat = categories.find((c) => c.id === p.categoryId);
                        return (
                          <tr key={p.id} className="hover:bg-slate-50/80">
                            <td className="py-2.5 px-4 font-mono text-slate-600">{p.sku}</td>
                            <td className="py-2.5 px-4 font-medium text-slate-900 max-w-[260px] truncate">
                              {p.nameFa}
                            </td>
                            <td className="py-2.5 px-4 text-slate-600">{cat?.nameFa}</td>
                            <td className="py-2.5 px-4 text-slate-600">{p.brand}</td>
                            <td className="py-2.5 px-4 text-left font-mono tabular-nums font-bold">
                              {formatToman(getFinalPrice(p.price, p.discountPercent))} ت
                            </td>
                            <td className="py-2.5 px-4 text-left font-mono tabular-nums">
                              {formatNumber(p.stock)}
                            </td>
                            <td className="py-2.5 px-4 text-left">
                              <button
                                type="button"
                                onClick={() => onDeleteProduct(p.id)}
                                aria-label={`حذف ${p.nameFa}`}
                                className="p-1.5 text-slate-400 hover:text-rose-700 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add New Product Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <form
            onSubmit={handleAddProductSubmit}
            className="bg-white border border-slate-200 rounded-xl max-w-xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">افزودن محصول جدید به کاتالوگ</h3>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="p-1 text-slate-500 hover:bg-slate-100 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">نام فارسی محصول</label>
                <input
                  type="text"
                  required
                  placeholder="مثلاً کپسول کوکیوتن ۱۰۰ میلی‌گرم یوروویتال"
                  value={newNameFa}
                  onChange={(e) => setNewNameFa(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">نام انگلیسی (برای اسلاگ سئو)</label>
                <input
                  type="text"
                  dir="ltr"
                  placeholder="EuRho Vital CoQ10 100mg"
                  value={newNameEn}
                  onChange={(e) => setNewNameEn(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">دسته‌بندی اصلی</label>
                <select
                  value={newCategoryId}
                  onChange={(e) => {
                    const cid = e.target.value;
                    setNewCategoryId(cid);
                    const found = categories.find((c) => c.id === cid);
                    setNewSubcategory(found?.subcategories[0] || '');
                  }}
                  className="w-full h-10 px-3 border border-slate-300 rounded-lg"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameFa}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">زیردسته</label>
                <select
                  value={newSubcategory}
                  onChange={(e) => setNewSubcategory(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-300 rounded-lg"
                >
                  {(categories.find((c) => c.id === newCategoryId)?.subcategories || []).map(
                    (sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">برند</label>
                <input
                  type="text"
                  required
                  value={newBrand}
                  onChange={(e) => setNewBrand(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">شکل دارویی</label>
                <select
                  value={newDosageForm}
                  onChange={(e) => setNewDosageForm(e.target.value as DosageForm)}
                  className="w-full h-10 px-3 border border-slate-300 rounded-lg"
                >
                  {['کپسول', 'قرص', 'سرم', 'کرم', 'شربت', 'پودر', 'قطره', 'ژل', 'شامپو', 'دستگاه'].map(
                    (f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">قیمت مصرف‌کننده (تومان)</label>
                <input
                  type="number"
                  required
                  min={1000}
                  value={newPrice}
                  onChange={(e) => setNewPrice(Number(e.target.value) || 0)}
                  className="w-full h-10 px-3 border border-slate-300 rounded-lg font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">قیمت خرید انبار (تومان)</label>
                <input
                  type="number"
                  required
                  min={1000}
                  value={newCost}
                  onChange={(e) => setNewCost(Number(e.target.value) || 0)}
                  className="w-full h-10 px-3 border border-slate-300 rounded-lg font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">موجودی اولیه</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={newStock}
                  onChange={(e) => setNewStock(Number(e.target.value) || 0)}
                  className="w-full h-10 px-3 border border-slate-300 rounded-lg font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">کشور سازنده</label>
                <input
                  type="text"
                  value={newOrigin}
                  onChange={(e) => setNewOrigin(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">شماره بچ</label>
                <input
                  type="text"
                  value={newBatch}
                  onChange={(e) => setNewBatch(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ترکیب موثره</label>
                <input
                  type="text"
                  value={newIngredient}
                  onChange={(e) => setNewIngredient(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-300 rounded-lg font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                انتشار در فروشگاه و سئو
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
