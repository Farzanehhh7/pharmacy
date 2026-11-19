import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  LayoutDashboard,
  Menu,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag,
  X,
} from 'lucide-react';
import { MEGA_MENU_CATEGORIES } from '../data/catalog';
import {
  Category,
  MegaMenuCategory,
  MegaMenuFilterTarget,
  Product,
} from '../types/pharmacy';
import { formatNumber, formatToman, getFinalPrice } from '../utils/formatters';

export type AppView = 'landing' | 'catalog' | 'categories' | 'seo' | 'admin';

interface HeaderProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  onApplyMegaFilter: (target: MegaMenuFilterTarget) => void;
  onSelectProduct: (product: Product) => void;
  onSearchSubmit: (query: string) => void;
  products: Product[];
  categories: Category[];
  cartCount: number;
  onOpenCart: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onNavigate,
  onApplyMegaFilter,
  onSelectProduct,
  onSearchSubmit,
  products,
  categories,
  cartCount,
  onOpenCart,
}) => {
  const [promoVisible, setPromoVisible] = useState(true);
  const [activeMegaId, setActiveMegaId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpandedId, setMobileExpandedId] = useState<string | null>('cosmetics-menu');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const headerWrapperRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);

  const activeMega: MegaMenuCategory | undefined = useMemo(
    () => MEGA_MENU_CATEGORIES.find((m) => m.id === activeMegaId),
    [activeMegaId]
  );

  // Live instant search suggestions (products, categories, brands)
  const searchSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;

    const matchedCategories = categories
      .filter(
        (c) =>
          c.nameFa.toLowerCase().includes(q) ||
          c.subcategories.some((s) => s.toLowerCase().includes(q))
      )
      .slice(0, 3);

    const matchedBrands = Array.from(new Set(products.map((p) => p.brand)))
      .filter((b) => b.toLowerCase().includes(q))
      .slice(0, 3);

    const matchedProducts = products
      .filter((p) =>
        [p.nameFa, p.nameEn, p.brand, p.sku, p.activeIngredient, p.subcategory]
          .join(' ')
          .toLowerCase()
          .includes(q)
      )
      .slice(0, 5);

    return { matchedCategories, matchedBrands, matchedProducts };
  }, [searchQuery, products, categories]);

  // Close mega menu or search dropdown on Escape or outside click
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveMegaId(null);
        setSearchFocused(false);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (headerWrapperRef.current && !headerWrapperRef.current.contains(e.target as Node)) {
        setActiveMegaId(null);
        setSearchFocused(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const cancelCloseTimer = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleCloseMega = () => {
    cancelCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setActiveMegaId(null);
    }, 160);
  };

  const handleOpenMega = (id: string) => {
    cancelCloseTimer();
    setActiveMegaId(id);
  };

  const handlePickFilter = (target: MegaMenuFilterTarget) => {
    setActiveMegaId(null);
    setMobileMenuOpen(false);
    setSearchFocused(false);
    onApplyMegaFilter(target);
  };

  const handleSearchFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchFocused(false);
    setActiveMegaId(null);
    onSearchSubmit(searchQuery.trim());
  };

  return (
    <div ref={headerWrapperRef} className="sticky top-0 z-40">
      {/* Slim Dismissible Pharmacy Announcement Bar */}
      {promoVisible && (
        <div className="bg-[#f1f8ed] border-b border-[#d5ebc8] text-[#3c6f22]">
          <div className="max-w-[1360px] mx-auto px-4 sm:px-6 h-9 flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3 truncate">
              <span className="inline-flex items-center gap-1.5 font-semibold shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-[#61b537]" />
                <span>ارسال رایگان برای سفارش‌های بالای ۱,۵۰۰,۰۰۰ تومان</span>
              </span>
              <span className="hidden md:inline text-[#7aa860]" aria-hidden="true">
                |
              </span>
              <span className="hidden md:inline text-[#4c7934]">
                تضمین اصالت کالا با کد رهگیری سازمان غذا و دارو (تی‌تک)
              </span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => handlePickFilter({ onlyDiscounted: true, sortBy: 'discount' })}
                className="inline-flex items-center gap-1 font-semibold text-[#e92050] hover:underline cursor-pointer"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>پیشنهادات طلایی</span>
              </button>
              <button
                type="button"
                onClick={() => setPromoVisible(false)}
                aria-label="بستن نوار اطلاعیه"
                className="p-1 text-[#4c7934] hover:text-slate-900 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Sticky White Header */}
      <header
        className="bg-white border-b border-slate-200 shadow-[0_2px_10px_rgba(15,23,42,0.04)]"
        onMouseLeave={scheduleCloseMega}
      >
        {/* Row 1: Logo + Live Search + Admin & Cart Actions */}
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4 lg:gap-6">
          {/* Brand Emblem + Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="منوی دسته‌بندی‌ها"
              className="lg:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMegaId(null);
                onNavigate('landing');
              }}
              className="flex items-center gap-2.5 text-right cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#61b537] flex items-center justify-center text-white shadow-sm group-hover:bg-[#49862B] transition-colors">
                <span className="text-xl font-black leading-none">+</span>
              </div>
              <div>
                <div className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 leading-none">
                  داروستان
                </div>
                <div className="text-[11px] text-[#49862B] font-medium mt-1">
                  داروخانه آنلاین و انبار هوشمند
                </div>
              </div>
            </button>
          </div>

          {/* Instant Live Autocomplete Search Bar */}
          <div className="hidden md:block flex-1 max-w-2xl relative">
            <form onSubmit={handleSearchFormSubmit} className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setSearchFocused(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchFocused(true);
                }}
                placeholder="جستجو در بین محصولات، برندها، ویتامین‌ها، ضدآفتاب یا ترکیب موثره..."
                className="w-full h-11 pr-10 pl-24 bg-[#f5f5f5] border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#61b537] transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="پاک کردن عبارت"
                  className="absolute left-20 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                className="absolute left-1.5 top-1.5 bottom-1.5 px-3.5 bg-[#61b537] hover:bg-[#49862B] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                جستجو
              </button>
            </form>

            {/* Live Search Dropdown */}
            {searchFocused && searchSuggestions && (
              <div className="absolute right-0 left-0 top-[calc(100%+6px)] bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-[440px] overflow-y-auto">
                {searchSuggestions.matchedCategories.length === 0 &&
                searchSuggestions.matchedBrands.length === 0 &&
                searchSuggestions.matchedProducts.length === 0 ? (
                  <div className="p-5 text-center text-xs text-slate-500">
                    موردی با عبارت «{searchQuery}» یافت نشد. کلید Enter را بزنید یا دسته‌بندی‌ها را بررسی کنید.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {searchSuggestions.matchedCategories.length > 0 && (
                      <div className="p-3 bg-slate-50/70">
                        <div className="text-[11px] font-semibold text-slate-500 mb-2">
                          دسته‌بندی‌های مرتبط
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {searchSuggestions.matchedCategories.map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => handlePickFilter({ categoryId: cat.id })}
                              className="px-2.5 py-1 bg-white border border-slate-200 hover:border-[#61b537] rounded-md text-xs text-slate-700 hover:text-[#49862B] cursor-pointer"
                            >
                              {cat.nameFa}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {searchSuggestions.matchedBrands.length > 0 && (
                      <div className="p-3">
                        <div className="text-[11px] font-semibold text-slate-500 mb-2">
                          برندهای منطبق
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {searchSuggestions.matchedBrands.map((brand) => (
                            <button
                              key={brand}
                              type="button"
                              onClick={() => handlePickFilter({ brand })}
                              className="px-2.5 py-1 bg-[#f1f8ed] text-[#49862B] rounded-md text-xs font-medium hover:bg-[#e2f2d9] cursor-pointer"
                            >
                              برند {brand}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {searchSuggestions.matchedProducts.length > 0 && (
                      <div className="p-2">
                        <div className="text-[11px] font-semibold text-slate-500 px-2 py-1">
                          محصولات پیشنهادی
                        </div>
                        {searchSuggestions.matchedProducts.map((p) => {
                          const finalPrice = getFinalPrice(p.price, p.discountPercent);
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setSearchFocused(false);
                                onSelectProduct(p);
                              }}
                              className="w-full flex items-center justify-between gap-3 px-2.5 py-2 hover:bg-slate-50 rounded-lg text-right cursor-pointer"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <img
                                  src={p.image}
                                  alt={p.nameFa}
                                  className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                                />
                                <div className="min-w-0">
                                  <div className="text-xs font-semibold text-slate-900 truncate">
                                    {p.nameFa}
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    {p.brand} · {p.packageSize}
                                  </div>
                                </div>
                              </div>
                              <div className="text-xs font-bold text-[#49862B] tabular-nums shrink-0">
                                {formatToman(finalPrice)} ت
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Utility Buttons: Admin + Cart */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setActiveMegaId(null);
                onNavigate('admin');
              }}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeView === 'admin'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-300 hover:border-[#61b537] hover:text-[#49862B]'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>پنل مدیریت</span>
            </button>

            <button
              type="button"
              onClick={onOpenCart}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#61b537] hover:bg-[#49862B] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>سبد خرید</span>
              <span className="tabular-nums font-mono text-xs bg-black/20 px-1.5 py-0.5 rounded-md">
                {formatNumber(cartCount)}
              </span>
            </button>
          </div>
        </div>

        {/* Row 2: Darukade-style Category Navigation Bar (Hover & Click Mega-Menu) */}
        <div className="hidden lg:block border-t border-slate-100 bg-white">
          <div className="max-w-[1360px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
            <nav className="flex items-center gap-1 text-[13px] font-semibold text-slate-700">
              {MEGA_MENU_CATEGORIES.map((menu) => {
                const isOpen = activeMegaId === menu.id;
                return (
                  <div
                    key={menu.id}
                    onMouseEnter={() => handleOpenMega(menu.id)}
                    className="relative"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setActiveMegaId((prev) => (prev === menu.id ? null : menu.id))
                      }
                      aria-expanded={isOpen}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                        isOpen
                          ? 'text-[#49862B] border-[#61b537] bg-[#f1f8ed]/60'
                          : 'border-transparent hover:text-[#49862B] hover:border-[#61b537]/50'
                      }`}
                    >
                      <span>{menu.label}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-150 ${
                          isOpen ? 'rotate-180 text-[#61b537]' : 'text-slate-400'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}

              <span className="h-4 w-px bg-slate-200 mx-1" aria-hidden="true" />

              <button
                type="button"
                onMouseEnter={() => setActiveMegaId(null)}
                onClick={() => {
                  setActiveMegaId(null);
                  onNavigate('catalog');
                }}
                className={`px-3 py-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  activeView === 'catalog'
                    ? 'text-[#49862B] border-[#61b537]'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                همه محصولات و فیلترها
              </button>

              <button
                type="button"
                onMouseEnter={() => setActiveMegaId(null)}
                onClick={() => {
                  setActiveMegaId(null);
                  onNavigate('categories');
                }}
                className={`px-3 py-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  activeView === 'categories'
                    ? 'text-[#49862B] border-[#61b537]'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                نقشه دسته‌بندی‌ها
              </button>

              <button
                type="button"
                onMouseEnter={() => setActiveMegaId(null)}
                onClick={() => {
                  setActiveMegaId(null);
                  onNavigate('seo');
                }}
                className={`px-3 py-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  activeView === 'seo'
                    ? 'text-[#49862B] border-[#61b537]'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                سئو و انتقال به وردپرس
              </button>
            </nav>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
              <ShieldCheck className="w-4 h-4 text-[#61b537]" />
              <span>مشاوره رایگان داروساز: ۶۱۹۱۲-۰۲۱</span>
            </div>
          </div>
        </div>

        {/* Full-Width Interactive Darukade Mega-Menu Panel */}
        {activeMega && (
          <div
            onMouseEnter={cancelCloseTimer}
            className="hidden lg:block absolute right-0 left-0 top-full bg-white border-b border-slate-200 shadow-2xl z-50"
          >
            <div className="max-w-[1360px] mx-auto px-6 py-6 grid grid-cols-12 gap-6">
              {/* Columns for Subcategory Groups */}
              <div className="col-span-9 flex flex-col justify-between gap-5">
                <div className="grid grid-cols-3 gap-6">
                  {activeMega.groups.map((group) => (
                    <div key={group.title} className="space-y-2.5">
                      <button
                        type="button"
                        onClick={() => handlePickFilter(group.filter)}
                        className="flex items-center justify-between w-full text-right pb-2 border-b border-slate-200 text-sm font-bold text-[#49862B] hover:text-[#61b537] transition-colors cursor-pointer group"
                      >
                        <span>{group.title}</span>
                        <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-[#61b537]" />
                      </button>

                      <ul className="space-y-1.5">
                        {group.links.map((link) => (
                          <li key={link.label}>
                            <button
                              type="button"
                              onClick={() => handlePickFilter(link.filter)}
                              className="w-full text-right py-1 px-2 -mx-2 rounded-md text-xs text-slate-700 hover:bg-[#f1f8ed] hover:text-[#49862B] transition-colors flex items-center justify-between gap-2 cursor-pointer"
                            >
                              <span>{link.label}</span>
                              {link.badge && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#f1f8ed] text-[#49862B] shrink-0">
                                  {link.badge}
                                </span>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* Quick Filter Shortcuts Strip inside Mega-Menu */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-500">دسترسی سریع:</span>
                    {activeMega.quickTags.map((tag) => (
                      <button
                        key={tag.label}
                        type="button"
                        onClick={() => handlePickFilter(tag.filter)}
                        className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-[#61b537] text-slate-700 hover:text-white rounded-md transition-colors cursor-pointer"
                      >
                        {tag.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePickFilter(activeMega.filter)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#61b537] hover:text-[#49862B] whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>مشاهده همه محصولات {activeMega.label}</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Right/Opposite Featured Category Visual Card */}
              <div className="col-span-3">
                <button
                  type="button"
                  onClick={() => handlePickFilter(activeMega.filter)}
                  className="w-full h-full text-right rounded-xl overflow-hidden border border-slate-200 bg-[#f1f8ed] hover:border-[#61b537] transition-all flex flex-col cursor-pointer group"
                >
                  <div className="aspect-[16/10] w-full overflow-hidden bg-slate-100">
                    <img
                      src={activeMega.featuredImage}
                      alt={activeMega.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-[#49862B] mb-1">
                        {activeMega.label}
                      </div>
                      <div className="text-sm font-bold text-slate-900 leading-snug">
                        {activeMega.featuredTitle}
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                        {activeMega.featuredSubtitle}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#8b37b5]">
                      <span>انتخاب و خرید سریع</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Menu + Category Accordion Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white max-h-[80vh] overflow-y-auto px-4 py-4 space-y-4">
            {/* Mobile Search */}
            <form onSubmit={handleSearchFormSubmit} className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی محصول، برند یا ترکیب موثره..."
                className="w-full h-10 pr-9 pl-20 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
              <button
                type="submit"
                className="absolute left-1 top-1 bottom-1 px-3 bg-[#61b537] text-white text-xs font-semibold rounded-md"
              >
                جستجو
              </button>
            </form>

            {/* Mobile Accordion Categories */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-slate-500 px-1">
                دسته‌بندی‌های داروخانه
              </div>
              {MEGA_MENU_CATEGORIES.map((menu) => {
                const expanded = mobileExpandedId === menu.id;
                return (
                  <div key={menu.id} className="border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setMobileExpandedId(expanded ? null : menu.id)}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 text-xs font-bold text-slate-900 cursor-pointer"
                    >
                      <span>{menu.label}</span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          expanded ? 'rotate-180 text-[#61b537]' : ''
                        }`}
                      />
                    </button>
                    {expanded && (
                      <div className="p-3 space-y-3 bg-white">
                        {menu.groups.map((grp) => (
                          <div key={grp.title} className="space-y-1">
                            <button
                              type="button"
                              onClick={() => handlePickFilter(grp.filter)}
                              className="text-xs font-bold text-[#49862B] block text-right cursor-pointer"
                            >
                              {grp.title}
                            </button>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {grp.links.map((l) => (
                                <button
                                  key={l.label}
                                  type="button"
                                  onClick={() => handlePickFilter(l.filter)}
                                  className="text-[11px] px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-700 cursor-pointer"
                                >
                                  {l.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Mobile Primary Page Links */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  onNavigate('catalog');
                  setMobileMenuOpen(false);
                }}
                className="py-2.5 px-3 bg-slate-100 rounded-lg text-slate-800 cursor-pointer"
              >
                همه محصولات ({formatNumber(products.length)})
              </button>
              <button
                type="button"
                onClick={() => {
                  onNavigate('categories');
                  setMobileMenuOpen(false);
                }}
                className="py-2.5 px-3 bg-slate-100 rounded-lg text-slate-800 cursor-pointer"
              >
                نقشه دسته‌بندی‌ها
              </button>
              <button
                type="button"
                onClick={() => {
                  onNavigate('seo');
                  setMobileMenuOpen(false);
                }}
                className="py-2.5 px-3 bg-slate-100 rounded-lg text-slate-800 cursor-pointer"
              >
                سئو و وردپرس
              </button>
              <button
                type="button"
                onClick={() => {
                  onNavigate('admin');
                  setMobileMenuOpen(false);
                }}
                className="py-2.5 px-3 bg-[#f1f8ed] text-[#49862B] rounded-lg cursor-pointer"
              >
                پنل مدیریت و انبار
              </button>
            </div>
          </div>
        )}
      </header>
    </div>
  );
};
