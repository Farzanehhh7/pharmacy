import React, { useState } from 'react';
import { CheckCircle2, CreditCard, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { Order, PaymentGateway, Product } from '../types/pharmacy';
import { formatNumber, formatToman, getFinalPrice } from '../utils/formatters';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartDrawerProps {
  open: boolean;
  items: CartItem[];
  gateways: PaymentGateway[];
  onClose: () => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCompleteOrder: (orderData: {
    customerName: string;
    customerPhone: string;
    city: string;
    address: string;
    postalCode: string;
    gateway: PaymentGateway;
    transactionRef: string;
    orderNumber: string;
  }) => Order;
}

const FREE_SHIPPING_THRESHOLD = 1500000;
const SHIPPING_FEE = 65000;

export const CartDrawer: React.FC<CartDrawerProps> = ({
  open,
  items,
  gateways,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onCompleteOrder,
}) => {
  const activeGateways = gateways.filter((g) => g.isActive);
  const [step, setStep] = useState<'cart' | 'checkout' | 'receipt'>('cart');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [city, setCity] = useState('تهران');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [selectedGatewayId, setSelectedGatewayId] = useState<string>(
    activeGateways[0]?.id || 'gw-zarinpal'
  );
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  if (!open) return null;

  const subtotal = items.reduce(
    (sum, item) => sum + getFinalPrice(item.product.price, item.product.discountPercent) * item.quantity,
    0
  );
  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_FEE;
  const totalAmount = subtotal + shippingCost;
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  const selectedGateway =
    activeGateways.find((g) => g.id === selectedGatewayId) || activeGateways[0];

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!customerName.trim() || !customerPhone.trim() || !address.trim()) {
      setErrorMsg('لطفاً نام، شماره تماس و نشانی کامل تحویل را وارد کنید.');
      return;
    }
    if (!selectedGateway) {
      setErrorMsg('در حال حاضر هیچ درگاه پرداخت فعالی انتخاب نشده است.');
      return;
    }

    setSubmitting(true);
    const orderNumber = `DRP-1405-${Math.floor(8850 + Math.random() * 1000)}`;

    try {
      const response = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gatewayCode: selectedGateway.providerCode,
          amount: totalAmount,
          orderNumber,
        }),
      });
      const data = await response.json();
      const txRef = data.transactionRef || `TXN-${Date.now()}`;

      const created = onCompleteOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        city: city.trim(),
        address: address.trim(),
        postalCode: postalCode.trim() || '1111111111',
        gateway: selectedGateway,
        transactionRef: txRef,
        orderNumber,
      });

      setConfirmedOrder(created);
      setStep('receipt');
    } catch {
      setErrorMsg('خطا در برقراری ارتباط با درگاه پرداخت. لطفاً مجدداً تلاش کنید.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    if (step === 'receipt') {
      setStep('cart');
      setConfirmedOrder(null);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={resetAndClose} />

      <div className="relative z-10 w-full max-w-md bg-white h-full flex flex-col shadow-2xl border-r border-slate-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <ShoppingBag className="w-5 h-5 text-emerald-800" />
            <span>
              {step === 'cart'
                ? 'سبد خرید داروستان'
                : step === 'checkout'
                ? 'تکمیل سفارش و انتخاب درگاه'
                : 'رسید تایید سفارش'}
            </span>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            aria-label="بستن سبد خرید"
            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {step === 'receipt' && confirmedOrder ? (
            <div className="space-y-6 py-4">
              <div className="text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-700 mx-auto" />
                <h3 className="text-lg font-bold text-slate-900">
                  سفارش {confirmedOrder.orderNumber} با موفقیت ثبت شد
                </h3>
                <p className="text-xs text-slate-600">
                  کالاها به صورت خودکار از موجودی انبار کسر و در صف آماده‌سازی داروساز قرار گرفت.
                </p>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">نام تحویل‌گیرنده:</span>
                  <span className="font-semibold text-slate-900">{confirmedOrder.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">درگاه پرداخت:</span>
                  <span className="font-semibold text-slate-900">{confirmedOrder.gatewayName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">کد رهگیری تراکنش:</span>
                  <span className="font-mono font-bold text-emerald-800" dir="ltr">
                    {confirmedOrder.transactionRef}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
                  <span>مبلغ پرداخت شده:</span>
                  <span className="tabular-nums">{formatToman(confirmedOrder.totalAmount)} تومان</span>
                </div>
              </div>

              <button
                type="button"
                onClick={resetAndClose}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg cursor-pointer"
              >
                بازگشت به فروشگاه
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-base font-semibold text-slate-900">سبد خرید شما خالی است</div>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                از کاتالوگ محصولات داروستان مکمل‌ها و اقلام مورد نیاز خود را انتخاب و اضافه کنید.
              </p>
            </div>
          ) : step === 'cart' ? (
            <div className="space-y-4">
              {/* Free shipping bar */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                {remainingForFreeShipping > 0 ? (
                  <span>
                    تنها با افزودن{' '}
                    <strong className="tabular-nums text-emerald-800">
                      {formatToman(remainingForFreeShipping)} تومان
                    </strong>{' '}
                    دیگر، ارسال این سفارش رایگان خواهد شد.
                  </span>
                ) : (
                  <span className="font-semibold text-emerald-800">
                    سفارش شما مشمول ارسال اکسپرس رایگان است.
                  </span>
                )}
              </div>

              {items.map(({ product, quantity }) => {
                const unitPrice = getFinalPrice(product.price, product.discountPercent);
                return (
                  <div
                    key={product.id}
                    className="flex gap-3.5 pb-4 border-b border-slate-100 last:border-b-0"
                  >
                    <img
                      src={product.image}
                      alt={product.nameFa}
                      referrerPolicy="no-referrer"
                      className="w-20 h-20 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="text-xs text-slate-500">{product.brand}</div>
                        <div className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug">
                          {product.nameFa}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2">
                        <div className="inline-flex items-center border border-slate-200 rounded-md">
                          <button
                            type="button"
                            onClick={() =>
                              quantity > 1
                                ? onUpdateQuantity(product.id, quantity - 1)
                                : onRemoveItem(product.id)
                            }
                            className="p-1 text-slate-600 hover:text-slate-900 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-7 text-center text-xs font-bold tabular-nums">
                            {formatNumber(quantity)}
                          </span>
                          <button
                            type="button"
                            disabled={quantity >= product.stock}
                            onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                            className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-40 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 tabular-nums">
                            {formatToman(unitPrice * quantity)} ت
                          </span>
                          <button
                            type="button"
                            onClick={() => onRemoveItem(product.id)}
                            aria-label="حذف کالا"
                            className="text-slate-400 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <form id="checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-800">اطلاعات گیرنده سفارش</div>
                <input
                  type="text"
                  required
                  placeholder="نام و نام خانوادگی"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    type="tel"
                    required
                    placeholder="شماره موبایل (مثلاً 0912...)"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                  <input
                    type="text"
                    required
                    placeholder="شهر"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <input
                  type="text"
                  placeholder="کد پستی ۱۰ رقمی"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                />
                <textarea
                  required
                  rows={2}
                  placeholder="نشانی دقیق پستی (خیابان، کوچه، پلاک، واحد)"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs resize-none"
                />
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-200">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <CreditCard className="w-4 h-4 text-emerald-800" />
                  <span>انتخاب درگاه پرداخت (مدیریت شده از پنل ادمین)</span>
                </div>
                <div className="space-y-2">
                  {activeGateways.map((gw) => (
                    <label
                      key={gw.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedGateway?.id === gw.id
                          ? 'border-emerald-700 bg-emerald-50/50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="gateway"
                        checked={selectedGateway?.id === gw.id}
                        onChange={() => setSelectedGatewayId(gw.id)}
                        className="mt-1 accent-emerald-700 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="text-xs font-bold text-slate-900">
                          {gw.nameFa}
                          {gw.isSandbox && (
                            <span className="mr-2 text-[10px] font-mono text-amber-700">
                              (تست/Sandbox)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{gw.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer Totals & CTA */}
        {items.length > 0 && step !== 'receipt' && (
          <div className="p-5 border-t border-slate-200 bg-slate-50 space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>جمع کل کالاها</span>
                <span className="tabular-nums font-medium">{formatToman(subtotal)} تومان</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>هزینه ارسال</span>
                <span className="tabular-nums font-medium">
                  {shippingCost === 0 ? 'رایگان' : `${formatToman(shippingCost)} تومان`}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>مبلغ قابل پرداخت</span>
                <span className="tabular-nums">{formatToman(totalAmount)} تومان</span>
              </div>
            </div>

            {step === 'cart' ? (
              <button
                type="button"
                onClick={() => setStep('checkout')}
                className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                ادامه و انتخاب درگاه پرداخت
              </button>
            ) : (
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setStep('cart')}
                  className="px-4 py-3 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  بازگشت
                </button>
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={submitting}
                  className="flex-1 py-3 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  {submitting ? 'در حال تایید تراکنش...' : 'پرداخت و ثبت نهایی سفارش'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
