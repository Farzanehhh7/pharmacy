import React, { useState } from 'react';
import { CreditCard, Save } from 'lucide-react';
import { Order, PaymentGateway } from '../../types/pharmacy';
import { formatNumber, formatToman } from '../../utils/formatters';

interface OrdersGatewaysTabProps {
  orders: Order[];
  gateways: PaymentGateway[];
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  onUpdateGateway: (gateway: PaymentGateway) => void;
}

const STATUS_LABELS: Record<Order['status'], { label: string; color: string }> = {
  paid: { label: 'پرداخت شده', color: 'text-emerald-800' },
  processing: { label: 'در حال بسته‌بندی داروساز', color: 'text-blue-800' },
  shipped: { label: 'تحویل به پیک / پست', color: 'text-amber-800' },
  delivered: { label: 'تحویل شده به مشتری', color: 'text-slate-700' },
  cancelled: { label: 'لغو شده', color: 'text-rose-700' },
};

export const OrdersGatewaysTab: React.FC<OrdersGatewaysTabProps> = ({
  orders,
  gateways,
  onUpdateOrderStatus,
  onUpdateGateway,
}) => {
  const [editingGatewayId, setEditingGatewayId] = useState<string | null>(null);
  const [merchantDraft, setMerchantDraft] = useState('');
  const [terminalDraft, setTerminalDraft] = useState('');

  const startGatewayEdit = (gw: PaymentGateway) => {
    setEditingGatewayId(gw.id);
    setMerchantDraft(gw.merchantId);
    setTerminalDraft(gw.terminalId);
  };

  const saveGatewayEdit = (gw: PaymentGateway) => {
    onUpdateGateway({
      ...gw,
      merchantId: merchantDraft.trim(),
      terminalId: terminalDraft.trim(),
    });
    setEditingGatewayId(null);
  };

  return (
    <div className="space-y-8">
      {/* Payment Gateways Configuration */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-800" />
            <span>مدیریت اتصال درگاه‌های پرداخت شتابی و پرداخت در محل</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            فعال‌سازی یا تغییر کلیدهای پذیرنده (Merchant / Terminal ID) بلافاصله در مرحله تسویه حساب سبد خرید اعمال می‌شود.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gateways.map((gw) => {
            const isEditing = editingGatewayId === gw.id;
            return (
              <div
                key={gw.id}
                className={`bg-white border rounded-xl p-5 space-y-4 ${
                  gw.isActive ? 'border-slate-200' : 'border-slate-200 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-slate-900">{gw.nameFa}</div>
                    <div className="text-[11px] font-mono text-slate-500">{gw.nameEn}</div>
                  </div>
                  <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <span className={gw.isActive ? 'text-emerald-800' : 'text-slate-500'}>
                      {gw.isActive ? 'فعال' : 'غیرفعال'}
                    </span>
                    <input
                      type="checkbox"
                      checked={gw.isActive}
                      onChange={(e) => onUpdateGateway({ ...gw, isActive: e.target.checked })}
                      className="w-4 h-4 accent-emerald-700 cursor-pointer"
                    />
                  </label>
                </div>

                <p className="text-xs text-slate-600">{gw.description}</p>

                <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-slate-500 block mb-1">Merchant ID</span>
                    {isEditing ? (
                      <input
                        type="text"
                        dir="ltr"
                        value={merchantDraft}
                        onChange={(e) => setMerchantDraft(e.target.value)}
                        className="w-full h-8 px-2 border border-slate-300 rounded font-mono text-[11px]"
                      />
                    ) : (
                      <span className="font-mono text-slate-800 block truncate" dir="ltr">
                        {gw.merchantId}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">Terminal ID</span>
                    {isEditing ? (
                      <input
                        type="text"
                        dir="ltr"
                        value={terminalDraft}
                        onChange={(e) => setTerminalDraft(e.target.value)}
                        className="w-full h-8 px-2 border border-slate-300 rounded font-mono text-[11px]"
                      />
                    ) : (
                      <span className="font-mono text-slate-800 block truncate" dir="ltr">
                        {gw.terminalId}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 text-xs">
                  <label className="inline-flex items-center gap-1.5 text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gw.isSandbox}
                      onChange={(e) => onUpdateGateway({ ...gw, isSandbox: e.target.checked })}
                      className="accent-amber-600 cursor-pointer"
                    />
                    <span>حالت تست (Sandbox)</span>
                  </label>

                  {isEditing ? (
                    <button
                      type="button"
                      onClick={() => saveGatewayEdit(gw)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-800 text-white rounded-md font-semibold cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>ذخیره کلیدها</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startGatewayEdit(gw)}
                      className="px-3 py-1.5 border border-slate-300 hover:border-slate-900 rounded-md font-medium text-slate-700 cursor-pointer"
                    >
                      تنظیمات اتصال
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Orders Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            فهرست سفارشات ثبت شده ({formatNumber(orders.length)})
          </h3>
          <span className="text-xs text-slate-500">بروزرسانی آنی با خرید از فروشگاه</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="py-3 px-4 font-semibold">شماره سفارش</th>
                <th className="py-3 px-4 font-semibold">مشتری و شهر</th>
                <th className="py-3 px-4 font-semibold">اقلام</th>
                <th className="py-3 px-4 font-semibold">درگاه پرداخت</th>
                <th className="py-3 px-4 font-semibold">کد رهگیری</th>
                <th className="py-3 px-4 font-semibold text-left">مبلغ کل</th>
                <th className="py-3 px-4 font-semibold">وضعیت پردازش</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {ord.orderNumber}
                    <div className="text-[10px] font-normal text-slate-500">{ord.createdAt}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{ord.customerName}</div>
                    <div className="text-[11px] text-slate-500">
                      {ord.city} · {ord.customerPhone}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-700 tabular-nums">
                    {formatNumber(ord.items.reduce((s, i) => s + i.quantity, 0))} عدد
                  </td>
                  <td className="py-3 px-4 text-slate-700">{ord.gatewayName}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-600 max-w-[140px] truncate" dir="ltr">
                    {ord.transactionRef}
                  </td>
                  <td className="py-3 px-4 text-left font-mono tabular-nums font-bold text-slate-900">
                    {formatToman(ord.totalAmount)} ت
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={ord.status}
                      onChange={(e) =>
                        onUpdateOrderStatus(ord.id, e.target.value as Order['status'])
                      }
                      className={`h-8 px-2 bg-slate-50 border border-slate-300 rounded text-xs font-semibold ${
                        STATUS_LABELS[ord.status].color
                      }`}
                    >
                      {Object.entries(STATUS_LABELS).map(([key, val]) => (
                        <option key={key} value={key}>
                          {val.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
