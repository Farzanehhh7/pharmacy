import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Baby,
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  Dumbbell,
  Eye,
  FileCode2,
  Heart,
  Pill,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Sun,
  Tag,
  Truck,
  X,
} from 'lucide-react';
import {
  BANNER_SIDE_OFFER,
  BANNER_SKINCARE,
  BANNER_SPORTS,
  HERO_IMAGE,
  IMG_BABY,
  IMG_MEDICAL,
  IMG_SKINCARE,
  IMG_SPORTS,
  IMG_VITAMINS,
  MAGAZINE_ARTICLES,
  POPULAR_BRANDS,
} from '../data/catalog';
import {
  Category,
  MagazineArticle,
  MegaMenuFilterTarget,
  Product,
} from '../types/pharmacy';
import { formatNumber, formatToman, getFinalPrice } from '../utils/formatters';
import { ProductCard } from './ProductCard';

interface LandingPageProps {
  products: Product[];
  categories: Category[];
  onApplyMegaFilter: (target: MegaMenuFilterTarget) => void;
  onSelectCategory: (categoryId: string) => void;
  onExploreCatalog: () => void;
  onOpenAdmin: () => void;
  onOpenSeo: () => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

interface HeroSlide {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  image: string;
  filter: MegaMenuFilterTarget;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'slide-1',
    eyebrow: 'داروخانه آنلاین داروستان · تضمین اصالت کالا',
    title: 'مرجع تخصصی مکمل‌های دارویی، پوست و زیبایی با مشاوره داروساز',
    subtitle:
      'بیش از ۳۶ قلم کالای استاندارد با کنترل تاریخ انقضا، شماره بچ ثبت‌شده و ارسال اکسپرس زنجیره سرد.',
    ctaLabel: 'مشاهده کاتالوگ و تخفیف‌ها',
    image: HERO_IMAGE,
    filter: { onlyDiscounted: true, sortBy: 'discount' },
  },
  {
    id: 'slide-2',
    eyebrow: 'جشنواره مراقبت پوست و ضدآفتاب',
    title: 'ضدآفتاب‌های فلوئید لاروش‌پوزای، بایودرما و سرم‌های ویتامین C',
    subtitle:
      'محصولات اصل درماتولوژی با فیلتر Mexoryl 400، مناسب پوست‌های چرب، حساس و مستعد لک.',
    ctaLabel: 'خرید محصولات مراقبت پوست',
    image: BANNER_SKINCARE,
    filter: { categoryId: 'skincare' },
  },
  {
    id: 'slide-3',
    eyebrow: 'تغذیه ورزشی و بدنسازی دارای هولوگرام تی‌تک',
    title: 'پروتئین وی گلد استاندارد، گینر، کراتین و آمینواسیدهای ریکاوری',
    subtitle:
      'تضمین اصالت سازمان غذا و دارو و نگهداری در دمای کنترل‌شده انبار مرکزی داروستان.',
    ctaLabel: 'مشاهده مکمل‌های ورزشی',
    image: BANNER_SPORTS,
    filter: { categoryId: 'sports' },
  },
];

const QUICK_ACCESS_SHORTCUTS: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  accentBg: string;
  accentText: string;
  filter: MegaMenuFilterTarget;
}[] = [
  {
    label: 'پیشنهادات طلایی',
    icon: Tag,
    accentBg: 'bg-rose-50 border-rose-200',
    accentText: 'text-[#e92050]',
    filter: { onlyDiscounted: true, sortBy: 'discount' },
  },
  {
    label: 'ضدآفتاب و پوست',
    icon: Sun,
    accentBg: 'bg-amber-50 border-amber-200',
    accentText: 'text-amber-600',
    filter: { categoryId: 'skincare', subcategory: 'ضدآفتاب تخصصی' },
  },
  {
    label: 'ویتامین و ایمنی',
    icon: Pill,
    accentBg: 'bg-[#f1f8ed] border-[#d5ebc8]',
    accentText: 'text-[#61b537]',
    filter: { categoryId: 'vitamins' },
  },
  {
    label: 'مکمل ورزشی',
    icon: Dumbbell,
    accentBg: 'bg-slate-100 border-slate-200',
    accentText: 'text-slate-800',
    filter: { categoryId: 'sports' },
  },
  {
    label: 'کلاژن و ضدریزش مو',
    icon: Sparkles,
    accentBg: 'bg-purple-50 border-purple-200',
    accentText: 'text-[#8b37b5]',
    filter: { categoryId: 'haircare' },
  },
  {
    label: 'مادر و نوزاد',
    icon: Baby,
    accentBg: 'bg-sky-50 border-sky-200',
    accentText: 'text-sky-600',
    filter: { categoryId: 'mother-baby' },
  },
  {
    label: 'تجهیزات پزشکی',
    icon: Stethoscope,
    accentBg: 'bg-emerald-50 border-emerald-200',
    accentText: 'text-emerald-700',
    filter: { categoryId: 'medical-devices' },
  },
  {
    label: 'داروی گیاهی',
    icon: Heart,
    accentBg: 'bg-lime-50 border-lime-200',
    accentText: 'text-lime-700',
    filter: { categoryId: 'herbal' },
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  products,
  categories,
  onApplyMegaFilter,
  onSelectCategory,
  onExploreCatalog,
  onOpenAdmin,
  onOpenSeo,
  onSelectProduct,
  onAddToCart,
}) => {
  const [heroSlideIdx, setHeroSlideIdx] = useState(0);
  const [sideOfferIdx, setSideOfferIdx] = useState(0);
  const [goldenTab, setGoldenTab] = useState<string>('all');
  const [bestsellerTab, setBestsellerTab] = useState<string>('all');
  const [activeArticle, setActiveArticle] = useState<MagazineArticle | null>(null);

  const flashOffers = useMemo(
    () =>
      products
        .filter((p) => p.stock > 0 && p.discountPercent >= 12)
        .sort((a, b) => b.discountPercent - a.discountPercent)
        .slice(0, 6),
    [products]
  );

  const currentHero = HERO_SLIDES[heroSlideIdx % HERO_SLIDES.length];
  const currentSideOffer = flashOffers[sideOfferIdx % Math.max(1, flashOffers.length)] || products[0];

  const goldenShelfProducts = useMemo(() => {
    const discounted = products
      .filter((p) => p.stock > 0 && p.discountPercent > 0)
      .filter((p) => (goldenTab === 'all' ? true : p.categoryId === goldenTab))
      .sort((a, b) => b.discountPercent - a.discountPercent);
    return discounted.slice(0, 4);
  }, [products, goldenTab]);

  const bestsellerShelfProducts = useMemo(() => {
    return products
      .filter((p) => (bestsellerTab === 'all' ? true : p.categoryId === bestsellerTab))
      .sort((a, b) => b.salesCount30d - a.salesCount30d)
      .slice(0, 8);
  }, [products, bestsellerTab]);

  const groupedShowcaseIds = ['vitamins', 'skincare', 'sports', 'mother-baby'];

  return (
    <div className="space-y-12 pb-12 bg-[#FAFAFA]">
      {/* 1. Darukade Dual Hero Slider Bento (Main 9-col + Side Offer 3-col on lg) */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6 pt-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Main Interactive Hero Slider */}
          <div className="lg:col-span-9 relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 min-h-[300px] sm:min-h-[370px] flex flex-col justify-end">
            <img
              src={currentHero.image}
              alt={currentHero.title}
              className="absolute inset-0 w-full h-full object-cover opacity-85 transition-opacity duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-slate-950/15" />

            <div className="relative z-10 p-6 sm:p-8 lg:p-10 max-w-2xl space-y-3 text-white">
              <span className="inline-block text-[11px] font-semibold bg-[#61b537] text-white px-3 py-1 rounded-md">
                {currentHero.eyebrow}
              </span>
              <h1 className="text-xl sm:text-3xl font-extrabold leading-snug [text-wrap:balance]">
                {currentHero.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-xl">
                {currentHero.subtitle}
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onApplyMegaFilter(currentHero.filter)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#61b537] hover:bg-[#49862B] text-white text-xs sm:text-sm font-bold rounded-xl transition-colors cursor-pointer"
                >
                  <span>{currentHero.ctaLabel}</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onExploreCatalog}
                  className="px-4 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-xs text-white text-xs sm:text-sm font-semibold rounded-xl border border-white/25 transition-colors cursor-pointer"
                >
                  مشاهده {formatNumber(products.length)} محصول
                </button>
              </div>
            </div>

            {/* Slide Prev / Next Arrows */}
            <div className="absolute left-4 bottom-4 z-10 flex items-center gap-2">
              <button
                type="button"
                aria-label="اسلاید قبلی"
                onClick={() =>
                  setHeroSlideIdx((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)
                }
                className="w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-900 flex items-center justify-center shadow-md cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1.5 px-2">
                {HERO_SLIDES.map((s, idx) => (
                  <button
                    key={s.id}
                    type="button"
                    aria-label={`انتخاب اسلاید ${idx + 1}`}
                    onClick={() => setHeroSlideIdx(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      idx === heroSlideIdx ? 'w-6 bg-[#61b537]' : 'w-2 bg-white/60'
                    }`}
                  />
                ))}
              </div>
              <button
                type="button"
                aria-label="اسلاید بعدی"
                onClick={() => setHeroSlideIdx((prev) => (prev + 1) % HERO_SLIDES.length)}
                className="w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-900 flex items-center justify-center shadow-md cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Side Flash Offer Slider Card (Darukade Special Side Card) */}
          {currentSideOffer && (
            <div className="lg:col-span-3 bg-white border-2 border-[#61b537]/60 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-xs font-extrabold text-[#e92050] flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  <span>پیشنهاد لحظه‌ای امروز</span>
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="پیشنهاد قبلی"
                    onClick={() =>
                      setSideOfferIdx(
                        (prev) => (prev - 1 + flashOffers.length) % Math.max(1, flashOffers.length)
                      )
                    }
                    className="p-1 rounded-md hover:bg-slate-100 text-slate-600 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="پیشنهاد بعدی"
                    onClick={() =>
                      setSideOfferIdx((prev) => (prev + 1) % Math.max(1, flashOffers.length))
                    }
                    className="p-1 rounded-md hover:bg-slate-100 text-slate-600 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div
                onClick={() => onSelectProduct(currentSideOffer)}
                className="cursor-pointer space-y-2.5 flex-1 flex flex-col justify-center"
              >
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
                  <img
                    src={currentSideOffer.image}
                    alt={currentSideOffer.nameFa}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2 right-2 bg-[#e92050] text-white text-[11px] font-bold px-2 py-0.5 rounded tabular-nums">
                    {formatNumber(currentSideOffer.discountPercent)}٪ تخفیف
                  </span>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-[#49862B]">
                    {currentSideOffer.brand} · {currentSideOffer.packageSize}
                  </div>
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 mt-0.5 leading-snug">
                    {currentSideOffer.nameFa}
                  </h2>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <div>
                  <div className="text-[11px] text-[#e92050] line-through tabular-nums">
                    {formatToman(currentSideOffer.price)}
                  </div>
                  <div className="text-sm font-extrabold text-slate-900 tabular-nums">
                    {formatToman(
                      getFinalPrice(currentSideOffer.price, currentSideOffer.discountPercent)
                    )}{' '}
                    <span className="text-[10px] font-medium text-slate-500">تومان</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onAddToCart(currentSideOffer)}
                  className="px-3 py-2 bg-[#8b37b5] hover:bg-[#6F2C91] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  خرید سریع
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 2. Darukade Circular Quick-Access Category Strip */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 sm:gap-4">
          {QUICK_ACCESS_SHORTCUTS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => onApplyMegaFilter(item.filter)}
                className="group flex flex-col items-center text-center gap-2 p-2 rounded-xl hover:bg-white hover:shadow-xs transition-all cursor-pointer"
              >
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border ${item.accentBg} flex items-center justify-center group-hover:scale-105 transition-transform`}
                >
                  <Icon className={`w-6 h-6 ${item.accentText}`} />
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-700 group-hover:text-[#49862B] leading-tight">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. 4-Column Campaign Promo Tiles */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: 'ضدآفتاب و روتین پوست شفاف',
              sub: 'لاروش‌پوزای، بایودرما و ویشی',
              img: BANNER_SKINCARE,
              catId: 'skincare',
            },
            {
              title: 'پروتئین وی و کراتین اورجینال',
              sub: 'دارای تاییدیه سازمان غذا و دارو',
              img: IMG_SPORTS,
              catId: 'sports',
            },
            {
              title: 'مکمل‌های زیبایی، مو و کلاژن',
              sub: 'یوروویتال، هلث‌اید و دوپل هرتز',
              img: IMG_VITAMINS,
              catId: 'vitamins',
            },
            {
              title: 'مراقبت کودک و تجهیزات پزشکی',
              sub: 'موستلا، امرن ژاپن و بیورر آلمان',
              img: IMG_BABY,
              catId: 'mother-baby',
            },
          ].map((tile) => (
            <button
              key={tile.title}
              type="button"
              onClick={() => onSelectCategory(tile.catId)}
              className="group relative h-40 rounded-2xl overflow-hidden border border-slate-200 text-right cursor-pointer"
            >
              <img
                src={tile.img}
                alt={tile.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/35 to-transparent" />
              <div className="relative z-10 h-full p-4 flex flex-col justify-end text-white">
                <div className="text-sm font-extrabold leading-snug">{tile.title}</div>
                <div className="text-[11px] text-slate-200 mt-0.5 flex items-center justify-between">
                  <span>{tile.sub}</span>
                  <ArrowLeft className="w-3.5 h-3.5 text-[#61b537]" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 4. Darukade «پیشنهادات طلایی» Showcase Shelf (Neutral Backdrop + Vertical Banner + Tabbed Grid) */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6">
        <div className="bg-[#f5f5f5] border border-slate-200 rounded-2xl p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Right Vertical Campaign Poster */}
            <div className="lg:col-span-3 bg-gradient-to-b from-[#49862B] to-[#34651d] rounded-2xl overflow-hidden text-white flex flex-col justify-between p-5">
              <div className="space-y-2">
                <span className="inline-block text-[11px] font-bold bg-white/15 px-2.5 py-1 rounded">
                  تخفیف‌های شگفت‌انگیز داروستان
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold leading-snug">
                  پیشنهادات طلایی هفته
                </h2>
                <p className="text-xs text-emerald-100 leading-relaxed">
                  بیشترین درصد تخفیف مصوب داروخانه روی مکمل‌ها و محصولات درماتولوژی منتخب.
                </p>
              </div>

              <div className="my-4 rounded-xl overflow-hidden border border-white/20 aspect-[4/3]">
                <img
                  src={BANNER_SIDE_OFFER}
                  alt="پیشنهادات طلایی داروستان"
                  className="w-full h-full object-cover"
                />
              </div>

              <button
                type="button"
                onClick={() => onApplyMegaFilter({ onlyDiscounted: true, sortBy: 'discount' })}
                className="w-full py-2.5 bg-white text-[#49862B] hover:bg-[#f1f8ed] text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>مشاهده همه پرتخفیف‌ها</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Left Tabs + 4-Product Grid */}
            <div className="lg:col-span-9 flex flex-col justify-between gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { id: 'all', label: 'همه گروه‌ها' },
                    { id: 'vitamins', label: 'ویتامین و کلاژن' },
                    { id: 'skincare', label: 'پوست و ضدآفتاب' },
                    { id: 'sports', label: 'مکمل ورزشی' },
                    { id: 'haircare', label: 'ضدریزش مو' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setGoldenTab(tab.id)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        goldenTab === tab.id
                          ? 'bg-[#61b537] text-white'
                          : 'bg-white text-slate-700 border border-slate-200 hover:border-[#61b537]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {goldenShelfProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onSelect={onSelectProduct}
                    onAddToCart={onAddToCart}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Darukade «محبوب‌ترین برندها» Clickable Strip */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
              محبوب‌ترین برندهای داروخانه
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              با انتخاب هر برند مستقیماً به محصولات تاییدشده آن برند هدایت شوید
            </p>
          </div>
          <button
            type="button"
            onClick={onExploreCatalog}
            className="text-xs font-bold text-[#61b537] hover:text-[#49862B] inline-flex items-center gap-1 cursor-pointer"
          >
            <span>همه برندها</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {POPULAR_BRANDS.map((brand) => (
            <button
              key={brand.name}
              type="button"
              onClick={() => onApplyMegaFilter({ brand: brand.name })}
              className="group bg-white border border-slate-200 hover:border-[#61b537] rounded-xl p-3.5 text-center transition-all hover:shadow-sm cursor-pointer flex flex-col items-center justify-between gap-1.5"
            >
              <div className="w-11 h-11 rounded-full bg-[#f1f8ed] text-[#49862B] font-mono font-bold text-xs flex items-center justify-center border border-[#d5ebc8] group-hover:bg-[#61b537] group-hover:text-white transition-colors">
                {brand.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="text-xs font-extrabold text-slate-900">{brand.nameFa}</div>
              <div className="text-[10px] font-mono text-slate-400 truncate max-w-full">
                {brand.name}
              </div>
              <div className="text-[10px] text-slate-500 line-clamp-1">{brand.country}</div>
            </button>
          ))}
        </div>
      </section>

      {/* 6. Darukade «جدیدترین گروه محصولات» Categorized Product Grid Showcase */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-b from-[#f1f8ed] to-white border border-[#d5ebc8] rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                گروه‌های تخصصی و پرفروش داروخانه
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                دسترسی یک‌کلیکی به محصولات منتخب در گروه‌های درمانی مختلف
              </p>
            </div>
            <button
              type="button"
              onClick={onExploreCatalog}
              className="text-xs font-bold text-[#49862B] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>جستجوی پیشرفته و فیلترها</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {groupedShowcaseIds.map((catId) => {
              const cat = categories.find((c) => c.id === catId);
              if (!cat) return null;
              const catProducts = products.filter((p) => p.categoryId === cat.id).slice(0, 4);
              return (
                <div
                  key={cat.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <h3 className="text-sm font-extrabold text-slate-900">{cat.nameFa}</h3>
                    <button
                      type="button"
                      onClick={() => onSelectCategory(cat.id)}
                      className="text-[11px] font-bold text-[#61b537] hover:text-[#49862B] cursor-pointer shrink-0"
                    >
                      مشاهده همه
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {catProducts.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onSelectProduct(item)}
                        className="group text-right p-2 rounded-lg border border-slate-100 hover:border-[#61b537] bg-slate-50/50 hover:bg-white transition-all cursor-pointer"
                      >
                        <div className="aspect-square rounded-md overflow-hidden bg-white mb-1.5">
                          <img
                            src={item.image}
                            alt={item.nameFa}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="text-[11px] font-semibold text-slate-800 line-clamp-1">
                          {item.nameFa}
                        </div>
                        <div className="text-[11px] font-bold text-[#49862B] tabular-nums mt-0.5">
                          {formatToman(getFinalPrice(item.price, item.discountPercent))} ت
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. Darukade «پرفروش‌ترین محصولات» Interactive Tabbed Shelf */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              پرفروش‌ترین محصولات منتخب داروساز
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              مکمل‌ها و فرآورده‌های دارای بالاترین امتیاز خریداران در ۳۰ روز گذشته
            </p>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'all', label: 'همه محصولات' },
              { id: 'vitamins', label: 'مکمل غذایی' },
              { id: 'skincare', label: 'مراقبت پوست' },
              { id: 'sports', label: 'مکمل ورزشی' },
              { id: 'mother-baby', label: 'مادر و کودک' },
              { id: 'medical-devices', label: 'تجهیزات پزشکی' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setBestsellerTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  bestsellerTab === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-[#61b537]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {bestsellerShelfProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      </section>

      {/* 8. Darukade «خواندنی‌ها» Scientific Health Magazine Section */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#8b37b5]" />
              <span>خواندنی‌ها · مجله علمی داروستان</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              مقالات تخصصی تالیف‌شده توسط تیم داروسازان برای بهبود سئوی ارگانیک و راهنمای مصرف علمی
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenSeo}
            className="text-xs font-bold text-[#8b37b5] hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <span>بررسی ساختار سئو</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {MAGAZINE_ARTICLES.map((article) => (
            <article
              key={article.id}
              onClick={() => setActiveArticle(article)}
              className="group bg-white border border-slate-200 hover:border-[#8b37b5] rounded-xl overflow-hidden flex flex-col justify-between transition-all hover:shadow-md cursor-pointer"
            >
              <div>
                <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-2.5 right-2.5 bg-[#8b37b5] text-white text-[10px] font-bold px-2.5 py-1 rounded">
                    {article.category}
                  </span>
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-[#8b37b5] transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {article.summary}
                  </p>
                </div>
              </div>

              <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700 truncate">{article.authorName}</span>
                <div className="flex items-center gap-2.5 shrink-0 tabular-nums">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {article.readTime}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {formatNumber(article.views)}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 9. Platform ERP, Smart Inventory & WordPress Migration Banner */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6">
        <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
            <div className="max-w-2xl">
              <h2 className="text-xl sm:text-2xl font-extrabold [text-wrap:balance]">
                زیرساخت یکپارچه انبارداری هوشمند، قیمت‌گذاری، درگاه شتابی و خروجی وردپرس
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                مدیریت کامل موجودی بچ‌ها، قیمت‌گذاری گروهی، اتصال به درگاه‌های زرین‌پال/ملت/سامان و
                تولید فایل استاندارد WooCommerce CSV & WXR در پنل مدیریت.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenAdmin}
              className="px-5 py-3 bg-[#61b537] hover:bg-[#49862B] text-white text-xs sm:text-sm font-bold rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              ورود به پنل مدیریت داروخانه
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/50">
              <ShieldCheck className="w-5 h-5 text-[#61b537] mb-2.5" />
              <h3 className="text-sm font-bold mb-1">انبارداری هوشمند و بچ‌نامبر</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                هشدار انقضای نزدیک، نقطه سفارش مجدد خودکار و ثبت لاگ ورود و خروج هر SKU.
              </p>
            </div>
            <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/50">
              <BarChart3 className="w-5 h-5 text-[#61b537] mb-2.5" />
              <h3 className="text-sm font-bold mb-1">تحلیل فروش و حاشیه سود</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                گزارش درآمد روزانه، سود خالص واقعی بر اساس قیمت خرید و خروجی CSV حسابداری.
              </p>
            </div>
            <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/50">
              <Truck className="w-5 h-5 text-[#61b537] mb-2.5" />
              <h3 className="text-sm font-bold mb-1">درگاه‌های پرداخت شتابی</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                تنظیم زرین‌پال، به‌پرداخت ملت، سامان سپ، آیدی‌پی و پرداخت در محل متصل به سبد خرید.
              </p>
            </div>
            <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/50">
              <FileCode2 className="w-5 h-5 text-[#61b537] mb-2.5" />
              <h3 className="text-sm font-bold mb-1">سئو و انتقال به وردپرس</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                اسکیما JSON-LD، متای Yoast SEO، نقشه سایت XML و قوانین ریدایرکت ۳۰۱ بدون افت سئو.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Magazine Article Reader Modal */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="relative h-56 bg-slate-100">
              <img
                src={activeArticle.image}
                alt={activeArticle.title}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                aria-label="بستن مقاله"
                className="absolute top-3 left-3 w-9 h-9 rounded-full bg-white/95 text-slate-800 flex items-center justify-center shadow cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="absolute bottom-3 right-3 bg-[#8b37b5] text-white text-xs font-bold px-3 py-1 rounded-md">
                {activeArticle.category}
              </span>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 border-b border-slate-100 pb-3">
                <div>
                  <span className="font-bold text-slate-900">{activeArticle.authorName}</span> ·{' '}
                  <span>{activeArticle.authorRole}</span>
                </div>
                <div className="tabular-nums">
                  {activeArticle.publishedDate} · {activeArticle.readTime}
                </div>
              </div>

              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
                {activeArticle.title}
              </h3>

              <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
                {activeArticle.content.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const catId = activeArticle.relatedCategoryId;
                    setActiveArticle(null);
                    onSelectCategory(catId);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#61b537] hover:bg-[#49862B] text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  <span>مشاهده محصولات مرتبط این مقاله</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveArticle(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  بستن
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
