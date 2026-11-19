import { useEffect, useState } from 'react';
import { AdminDashboard, AdminTab } from './components/AdminDashboard';
import { CartDrawer, CartItem } from './components/CartDrawer';
import { CatalogView, DEFAULT_FILTERS } from './components/CatalogView';
import { CategoriesDirectory } from './components/CategoriesDirectory';
import { Footer } from './components/Footer';
import { AppView, Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { ProductDetailModal } from './components/ProductDetailModal';
import { SeoShowcaseView } from './components/SeoShowcaseView';
import {
  INITIAL_CATEGORIES,
  INITIAL_DAILY_SALES,
  INITIAL_GATEWAYS,
  INITIAL_INVENTORY_LOGS,
  INITIAL_ORDERS,
  INITIAL_PRODUCTS,
} from './data/catalog';
import {
  Category,
  InventoryLog,
  MegaMenuFilterTarget,
  Order,
  PaymentGateway,
  Product,
  ProductSEO,
  StoreFilters,
} from './types/pharmacy';
import { getFinalPrice } from './utils/formatters';

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('landing');
  const [adminInitialTab, setAdminInitialTab] = useState<AdminTab>('analytics');

  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [gateways, setGateways] = useState<PaymentGateway[]>(INITIAL_GATEWAYS);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>(INITIAL_INVENTORY_LOGS);

  const [filters, setFilters] = useState<StoreFilters>(DEFAULT_FILTERS);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [toastMsg, setToastMsg] = useState('');

  // Dynamic SEO <title> & <meta description> updates per view / category
  useEffect(() => {
    const activeCat = categories.find((c) => c.id === filters.categoryId);
    let title = 'داروستان | داروخانه آنلاین مکمل‌های دارویی، مراقبت پوست و تجهیزات پزشکی';
    let desc =
      'خرید آنلاین انواع مکمل‌های غذایی و ورزشی، محصولات مراقبت پوست و تجهیزات پزشکی با تضمین اصالت و ارسال اکسپرس از داروستان.';

    if (activeView === 'catalog' && activeCat) {
      title = activeCat.metaTitle;
      desc = activeCat.metaDescription;
    } else if (activeView === 'catalog') {
      title = 'فروشگاه و جستجوی پیشرفته محصولات دارویی | داروستان';
    } else if (activeView === 'categories') {
      title = 'دسته‌بندی‌های تخصصی داروخانه آنلاین | داروستان';
    } else if (activeView === 'seo') {
      title = 'معماری سئو، اسکیما JSON-LD و مهاجرت وردپرس | داروستان';
    } else if (activeView === 'admin') {
      title = 'پنل مدیریت انبارداری هوشمند، قیمت‌گذاری و فروش | داروستان';
    }

    document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', desc);
  }, [activeView, filters.categoryId, categories]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2800);
  };

  const handleAddToCart = (product: Product, quantity = 1) => {
    if (product.stock <= 0) return;
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const nextQty = Math.min(product.stock, existing.quantity + quantity);
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: nextQty } : item
        );
      }
      return [...prev, { product, quantity: Math.min(product.stock, quantity) }];
    });
    showToast(`«${product.nameFa}» به سبد خرید اضافه شد.`);
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    setCartItems((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleAdjustStock = (
    productId: string,
    delta: number,
    reason: string,
    type: InventoryLog['type'],
    newBatch?: string
  ) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const previousStock = p.stock;
        const newStock = Math.max(0, previousStock + delta);
        const batch = newBatch || p.batchNumber;

        const logEntry: InventoryLog = {
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          productId: p.id,
          sku: p.sku,
          productName: p.nameFa,
          type,
          quantityDelta: newStock - previousStock,
          previousStock,
          newStock,
          batchNumber: batch,
          reason,
          operator: type === 'sale' ? 'سیستم فروش' : 'مدیر انبار',
          timestamp: 'هم‌اکنون',
        };
        setInventoryLogs((logs) => [logEntry, ...logs]);

        return {
          ...p,
          stock: newStock,
          batchNumber: batch,
        };
      })
    );
  };

  const handleCompleteOrder = (orderData: {
    customerName: string;
    customerPhone: string;
    city: string;
    address: string;
    postalCode: string;
    gateway: PaymentGateway;
    transactionRef: string;
    orderNumber: string;
  }): Order => {
    const items = cartItems.map((ci) => ({
      productId: ci.product.id,
      sku: ci.product.sku,
      nameFa: ci.product.nameFa,
      quantity: ci.quantity,
      unitPrice: getFinalPrice(ci.product.price, ci.product.discountPercent),
      costPrice: ci.product.costPrice,
    }));

    const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const shippingCost = subtotal >= 1500000 ? 0 : 65000;
    const totalProfit = items.reduce((s, i) => s + (i.unitPrice - i.costPrice) * i.quantity, 0);

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: orderData.orderNumber,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      city: orderData.city,
      address: orderData.address,
      postalCode: orderData.postalCode,
      items,
      subtotal,
      shippingCost,
      totalAmount: subtotal + shippingCost,
      totalProfit,
      gatewayId: orderData.gateway.id,
      gatewayName: orderData.gateway.nameFa,
      transactionRef: orderData.transactionRef,
      status: 'paid',
      createdAt: '۱۴۰۵/۰۸/۲۷ - هم‌اکنون',
    };

    items.forEach((item) => {
      handleAdjustStock(
        item.productId,
        -item.quantity,
        `کسر خودکار بابت سفارش ${orderData.orderNumber}`,
        'sale'
      );
    });

    setProducts((prev) =>
      prev.map((p) => {
        const bought = items.find((i) => i.productId === p.id);
        return bought ? { ...p, salesCount30d: p.salesCount30d + bought.quantity } : p;
      })
    );

    setOrders((prev) => [newOrder, ...prev]);
    setCartItems([]);
    return newOrder;
  };

  const handleUpdateProductPrice = (
    productId: string,
    price: number,
    costPrice: number,
    discountPercent: number
  ) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, price, costPrice, discountPercent } : p))
    );
  };

  const handleApplyBulkPricing = (
    scopeType: 'all' | 'category' | 'brand',
    scopeValue: string,
    action: 'increase_price' | 'decrease_price' | 'set_discount',
    percent: number
  ) => {
    setProducts((prev) =>
      prev.map((p) => {
        const inScope =
          scopeType === 'all' ||
          (scopeType === 'category' && p.categoryId === scopeValue) ||
          (scopeType === 'brand' && p.brand === scopeValue);
        if (!inScope) return p;

        if (action === 'set_discount') {
          return { ...p, discountPercent: percent };
        }
        const factor = action === 'increase_price' ? 1 + percent / 100 : 1 - percent / 100;
        const nextPrice = Math.max(10000, Math.round((p.price * factor) / 1000) * 1000);
        return { ...p, price: nextPrice };
      })
    );
  };

  const handleUpdateProductSeo = (productId: string, seo: ProductSEO) => {
    setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, seo } : p)));
  };

  const handleAddProduct = (product: Product) => {
    setProducts((prev) => [product, ...prev]);
    showToast(`محصول «${product.nameFa}» به کاتالوگ اضافه شد.`);
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const handleUpdateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
  };

  const handleUpdateGateway = (gateway: PaymentGateway) => {
    setGateways((prev) => prev.map((g) => (g.id === gateway.id ? gateway : g)));
  };

  const navigateToCategory = (categoryId: string, subcategory = 'all') => {
    setFilters({ ...DEFAULT_FILTERS, categoryId, subcategory });
    setActiveView('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const applyMegaFilter = (target: MegaMenuFilterTarget) => {
    setFilters({
      ...DEFAULT_FILTERS,
      categoryId: target.categoryId || 'all',
      subcategory: target.subcategory || 'all',
      brands: target.brand ? [target.brand] : [],
      dosageForms: target.dosageForm ? [target.dosageForm] : [],
      query: target.query || '',
      onlyDiscounted: Boolean(target.onlyDiscounted),
      sortBy: target.sortBy || 'bestseller',
    });
    setActiveView('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-slate-900">
      <Header
        activeView={activeView}
        onNavigate={(view) => {
          setActiveView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onApplyMegaFilter={applyMegaFilter}
        onSelectProduct={(p) => setSelectedProduct(p)}
        onSearchSubmit={(query) => {
          setFilters({ ...DEFAULT_FILTERS, query });
          setActiveView('catalog');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        products={products}
        categories={categories}
        cartCount={totalCartCount}
        onOpenCart={() => setCartOpen(true)}
      />

      <main className="flex-1">
        {activeView === 'landing' && (
          <LandingPage
            products={products}
            categories={categories}
            onApplyMegaFilter={applyMegaFilter}
            onSelectCategory={(catId) => navigateToCategory(catId)}
            onExploreCatalog={() => {
              setFilters(DEFAULT_FILTERS);
              setActiveView('catalog');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenAdmin={() => {
              setAdminInitialTab('analytics');
              setActiveView('admin');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenSeo={() => {
              setActiveView('seo');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectProduct={(p) => setSelectedProduct(p)}
            onAddToCart={(p) => handleAddToCart(p, 1)}
          />
        )}

        {activeView === 'catalog' && (
          <CatalogView
            products={products}
            categories={categories}
            filters={filters}
            onFiltersChange={setFilters}
            onSelectProduct={(p) => setSelectedProduct(p)}
            onAddToCart={(p) => handleAddToCart(p, 1)}
          />
        )}

        {activeView === 'categories' && (
          <CategoriesDirectory
            categories={categories}
            products={products}
            onSelectCategory={navigateToCategory}
          />
        )}

        {activeView === 'seo' && (
          <SeoShowcaseView
            products={products}
            categories={categories}
            onOpenAdminSeo={() => {
              setAdminInitialTab('seo');
              setActiveView('admin');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeView === 'admin' && (
          <AdminDashboard
            key={adminInitialTab}
            initialTab={adminInitialTab}
            products={products}
            categories={categories}
            orders={orders}
            gateways={gateways}
            inventoryLogs={inventoryLogs}
            dailySales={INITIAL_DAILY_SALES}
            onAdjustStock={handleAdjustStock}
            onUpdateProductPrice={handleUpdateProductPrice}
            onApplyBulkPricing={handleApplyBulkPricing}
            onAddProduct={handleAddProduct}
            onDeleteProduct={handleDeleteProduct}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onUpdateGateway={handleUpdateGateway}
            onUpdateProductSeo={handleUpdateProductSeo}
          />
        )}
      </main>

      <Footer
        productCount={products.length}
        categoryCount={categories.length}
        onNavigate={(view) => {
          setActiveView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSelectCategory={(catId) => navigateToCategory(catId)}
        onOpenAdminTab={(tab) => {
          setAdminInitialTab(tab);
          setActiveView('admin');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        categories={categories}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Slide-over Cart & Multi-Gateway Checkout Drawer */}
      <CartDrawer
        open={cartOpen}
        items={cartItems}
        gateways={gateways}
        onClose={() => setCartOpen(false)}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onCompleteOrder={handleCompleteOrder}
      />

      {/* Cart Notification Toast */}
      {toastMsg && (
        <div className="fixed bottom-5 left-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg text-xs font-medium flex items-center gap-3 border border-slate-700">
          <span>{toastMsg}</span>
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="text-[#61b537] font-bold hover:underline cursor-pointer"
          >
            مشاهده سبد
          </button>
        </div>
      )}
    </div>
  );
}
