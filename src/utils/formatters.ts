export function formatToman(amount: number): string {
  return new Intl.NumberFormat('fa-IR').format(Math.round(amount));
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('fa-IR').format(num);
}

export function getFinalPrice(price: number, discountPercent: number): number {
  if (!discountPercent || discountPercent <= 0) return price;
  return Math.round((price * (100 - discountPercent)) / 100);
}

export function getProfitMarginPercent(price: number, discountPercent: number, costPrice: number): number {
  const finalPrice = getFinalPrice(price, discountPercent);
  if (finalPrice <= 0) return 0;
  return Number((((finalPrice - costPrice) / finalPrice) * 100).toFixed(1));
}

export function daysUntilExpiry(isoDate: string): number {
  const target = new Date(isoDate).getTime();
  const now = new Date('2026-11-17T00:00:00Z').getTime();
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

export function getStockStatus(stock: number, minThreshold: number): {
  label: string;
  tone: 'healthy' | 'low' | 'out';
} {
  if (stock <= 0) {
    return { label: 'ناموجود', tone: 'out' };
  }
  if (stock <= minThreshold) {
    return { label: 'نقطه سفارش مجدد', tone: 'low' };
  }
  return { label: 'موجود در انبار', tone: 'healthy' };
}

export function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
