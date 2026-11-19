import React, { useState } from 'react';
import {
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Truck,
  Award,
  Headphones,
} from 'lucide-react';
import { AppView } from './Header';
import { AdminTab } from './AdminDashboard';
import { formatNumber } from '../utils/formatters';

interface FooterProps {
  productCount: number;
  categoryCount: number;
  onNavigate: (view: AppView) => void;
  onSelectCategory: (categoryId: string) => void;
  onOpenAdminTab: (tab: AdminTab) => void;
}

export const Footer: React.FC<FooterProps> = ({
  productCount,
  categoryCount,
  onNavigate,
  onSelectCategory,
  onOpenAdminTab,
}) => {
  const [phoneInput, setPhoneInput] = useState('');
  const [subscribedMsg, setSubscribedMsg] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = phoneInput.trim();
    if (!/^09\d{9}$/.test(cleaned)) {
      setSubscribedMsg('لطفاً شماره موبایل معتبر ۱۱ رقمی (مثلاً 09123456789) وارد کنید.');
      return;
    }
    setSubscribedMsg('عضویت با موفقیت ثبت شد! کد تخفیف ۱۰٪ (DARU10) برای شما فعال گردید.');
    setPhoneInput('');
  };

  return (
    <footer className="bg-white border-t border-slate-200 mt-12">
      {/* Top Pharmacy Trust Guarantees Bar */}
      <div className="bg-[#f1f8ed]/70 border-b border-slate-200">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-6 grid grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white border border-[#d5ebc8] flex items-center justify-center text-[#61b537] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-900">تضمین اصالت تی‌تک</div>
              <div className="text-[11px] text-slate-600">دارای مجوز سازمان غذا و دارو</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white border border-[#d5ebc8] flex items-center justify-center text-[#61b537] shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-900">مشاوره علمی داروساز</div>
              <div className="text-[11px] text-slate-600">پاسخگویی تخصصی تداخلات دارویی</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white border border-[#d5ebc8] flex items-center justify-center text-[#61b537] shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-900">ارسال اکسپرس زنجیره سرد</div>
              <div className="text-[11px] text-slate-600">ارسال رایگان بالای ۱.۵ میلیون تومان</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white border border-[#d5ebc8] flex items-center justify-center text-[#61b537] shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-900">کنترل دقیق تاریخ انقضا</div>
              <div className="text-[11px] text-slate-600">ثبت شماره بچ برای تمامی اقلام</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Grid */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
        {/* About Pharmacy Column */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#61b537] flex items-center justify-center text-white font-black text-lg">
              +
            </div>
            <div>
              <div className="text-base font-extrabold text-slate-900">داروخانه آنلاین داروستان</div>
              <div className="text-[11px] text-[#49862B]">تحت نظارت فنی دکتر داروساز</div>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            داروستان مرجع تخصصی فروش مکمل‌های تغذیه‌ای، ورزشی، محصولات مراقبت پوست و مو، مادر و کودک
            و تجهیزات پزشکی است که با سامانه هوشمند انبارداری، کنترل تاریخ انقضا و معماری آماده
            مهاجرت به وردپرس/ووکامرس طراحی شده است.
          </p>
          <div className="space-y-2 text-xs text-slate-700 pt-1">
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-[#61b537] shrink-0" />
              <span className="tabular-nums">پشتیبانی و مشاوره: ۰۲۱-۶۱۹۱۲۰۰۰ (ساعت ۹ تا ۲۱)</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-[#61b537] shrink-0" />
              <span className="font-mono">support@darustan.ir</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#61b537] shrink-0 mt-0.5" />
              <span>تهران، خیابان ولیعصر، بالاتر از پارک ساعی، مرکز لجستیک دارویی داروستان</span>
            </div>
          </div>
        </div>

        {/* Links Column 1: Top Categories */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-xs font-extrabold text-slate-900">دسته‌بندی‌های تخصصی</h3>
          <ul className="space-y-2 text-xs text-slate-600">
            <li>
              <button
                type="button"
                onClick={() => onSelectCategory('vitamins')}
                className="hover:text-[#49862B] cursor-pointer"
              >
                مکمل‌های غذایی و ویتامین
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onSelectCategory('skincare')}
                className="hover:text-[#49862B] cursor-pointer"
              >
                مراقبت پوست و ضدآفتاب
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onSelectCategory('sports')}
                className="hover:text-[#49862B] cursor-pointer"
              >
                مکمل‌های ورزشی و بدنسازی
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onSelectCategory('haircare')}
                className="hover:text-[#49862B] cursor-pointer"
              >
                تقویت و ضدریزش مو
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onSelectCategory('mother-baby')}
                className="hover:text-[#49862B] cursor-pointer"
              >
                مادر، کودک و نوزاد
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onSelectCategory('medical-devices')}
                className="hover:text-[#49862B] cursor-pointer"
              >
                تجهیزات پزشکی خانگی
              </button>
            </li>
          </ul>
        </div>

        {/* Links Column 2: Management & Technical */}
        <div className="lg:col-span-3 space-y-3">
          <h3 className="text-xs font-extrabold text-slate-900">مدیریت، سئو و انتقال به وردپرس</h3>
          <ul className="space-y-2 text-xs text-slate-600">
            <li>
              <button
                type="button"
                onClick={() => onOpenAdminTab('analytics')}
                className="hover:text-[#49862B] cursor-pointer"
              >
                داشبورد تحلیل فروش و گزارش‌گیری
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onOpenAdminTab('inventory')}
                className="hover:text-[#49862B] cursor-pointer"
              >
                انبارداری هوشمند (بچ و تاریخ انقضا)
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onOpenAdminTab('pricing')}
                className="hover:text-[#49862B] cursor-pointer"
              >
                موتور قیمت‌گذاری و حاشیه سود
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onOpenAdminTab('orders')}
                className="hover:text-[#49862B] cursor-pointer"
              >
                تنظیمات درگاه‌های پرداخت شتابی
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onOpenAdminTab('wordpress')}
                className="hover:text-[#49862B] cursor-pointer"
              >
                خروجی CSV ووکامرس و XML وردپرس
              </button>
            </li>
            <li>
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#49862B]"
              >
                نقشه سایت XML و فایل robots.txt
              </a>
            </li>
          </ul>
        </div>

        {/* Club Discount Signup + Seals */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-[#f5f5f5] border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="text-xs font-extrabold text-slate-900">
              دریافت کد تخفیف اولین خرید و کمپین‌ها
            </div>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="flex gap-1.5">
                <input
                  type="tel"
                  dir="ltr"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="09123456789"
                  className="flex-1 h-9 px-3 bg-white border border-slate-300 rounded-lg text-xs font-mono text-left focus:outline-none focus:border-[#61b537]"
                />
                <button
                  type="submit"
                  className="px-3.5 h-9 bg-[#61b537] hover:bg-[#49862B] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  ثبت
                </button>
              </div>
              {subscribedMsg && (
                <div className="flex items-start gap-1.5 text-[11px] text-[#49862B] leading-snug">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{subscribedMsg}</span>
                </div>
              )}
            </form>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-600">
            <div className="border border-slate-200 rounded-lg p-2 bg-slate-50">
              <div className="font-bold text-slate-900">نماد اعتماد</div>
              <div>تایید هویت</div>
            </div>
            <div className="border border-slate-200 rounded-lg p-2 bg-slate-50">
              <div className="font-bold text-slate-900">وزارت بهداشت</div>
              <div>مجوز داروخانه</div>
            </div>
            <div className="border border-slate-200 rounded-lg p-2 bg-slate-50">
              <div className="font-bold text-slate-900">شاپرک</div>
              <div>پرداخت امن</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright Bar */}
      <div className="border-t border-slate-200 bg-slate-50">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <div>
            تمامی حقوق برای داروخانه آنلاین داروستان محفوظ است ·{' '}
            <span className="tabular-nums">
              {formatNumber(productCount)} محصول در {formatNumber(categoryCount)} گروه تخصصی
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => onNavigate('catalog')}
              className="hover:text-slate-900 cursor-pointer"
            >
              فروشگاه
            </button>
            <button
              type="button"
              onClick={() => onNavigate('seo')}
              className="hover:text-slate-900 cursor-pointer"
            >
              معماری سئو
            </button>
            <button
              type="button"
              onClick={() => onNavigate('admin')}
              className="hover:text-slate-900 cursor-pointer"
            >
              پنل مدیریت
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
