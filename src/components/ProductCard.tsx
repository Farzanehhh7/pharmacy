import React, { useState } from 'react';
import { Check, Package, Plus, Star } from 'lucide-react';
import { Product } from '../types/pharmacy';
import { formatNumber, formatToman, getFinalPrice } from '../utils/formatters';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onAddToCart,
}) => {
  const [imgError, setImgError] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const finalPrice = getFinalPrice(product.price, product.discountPercent);
  const isOutOfStock = product.stock <= 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    onAddToCart(product);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1100);
  };

  return (
    <article className="group bg-white border border-[#d4d4d4] hover:border-[#61b537] rounded-xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* Crisp Product Image Box */}
      <div
        onClick={() => onSelect(product)}
        className="relative aspect-[4/3] bg-slate-50 overflow-hidden cursor-pointer"
      >
        {!imgError ? (
          <img
            src={product.image}
            alt={product.nameFa}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 p-4 text-center">
            <Package className="w-8 h-8 mb-2 text-slate-400" />
            <span className="text-xs font-medium">{product.brand}</span>
          </div>
        )}

        {/* Top-Right Single Status or Discount Tag */}
        {isOutOfStock ? (
          <span className="absolute top-2.5 right-2.5 bg-slate-900/90 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md">
            ناموجود
          </span>
        ) : product.discountPercent > 0 ? (
          <span className="absolute top-2.5 right-2.5 bg-[#e92050] text-white text-[11px] font-bold px-2.5 py-1 rounded-md tabular-nums shadow-xs">
            {formatNumber(product.discountPercent)}٪ تخفیف
          </span>
        ) : null}

        {/* Top-Left Subtle Rating Pill */}
        <span className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-xs border border-slate-200/80 text-slate-800 text-[11px] font-semibold px-2 py-0.5 rounded-md inline-flex items-center gap-1 tabular-nums">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          {product.rating.toFixed(1)}
        </span>
      </div>

      {/* Darukade Hairline Divider + Overlapping Circular Quick-Add (+) Button */}
      <div className="relative h-px bg-slate-200">
        <button
          type="button"
          disabled={isOutOfStock}
          onClick={handleQuickAdd}
          aria-label={`افزودن ${product.nameFa} به سبد خرید`}
          title={isOutOfStock ? 'ناموجود' : 'افزودن سریع به سبد خرید'}
          className={`absolute left-3.5 -top-4 w-8 h-8 rounded-full flex items-center justify-center shadow-md border-2 border-white transition-all cursor-pointer ${
            isOutOfStock
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : justAdded
              ? 'bg-[#61b537] text-white scale-105'
              : 'bg-[#8b37b5] hover:bg-[#6F2C91] text-white hover:scale-105'
          }`}
        >
          {justAdded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>

      {/* Content */}
      <div className="p-3.5 pt-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1 truncate pl-9">
            <span className="font-semibold text-[#49862B]">{product.brand}</span>
            <span aria-hidden="true">·</span>
            <span>{product.originCountry}</span>
            <span aria-hidden="true">·</span>
            <span>{product.packageSize}</span>
          </div>

          <h3
            onClick={() => onSelect(product)}
            className="text-xs sm:text-sm font-bold text-slate-900 leading-snug line-clamp-2 min-h-[2.4rem] cursor-pointer hover:text-[#49862B] transition-colors"
          >
            {product.nameFa}
          </h3>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-end justify-between gap-2">
          <div>
            {product.discountPercent > 0 && !isOutOfStock && (
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[11px] text-[#e92050] line-through tabular-nums">
                  {formatToman(product.price)}
                </span>
              </div>
            )}
            <div className="text-sm sm:text-base font-extrabold text-slate-900 tabular-nums">
              {isOutOfStock ? (
                <span className="text-xs font-semibold text-slate-500">اتمام موجودی انبار</span>
              ) : (
                <>
                  {formatToman(finalPrice)}{' '}
                  <span className="text-[11px] font-medium text-slate-500">تومان</span>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelect(product)}
            className="text-[11px] font-semibold text-slate-600 hover:text-[#49862B] px-2 py-1 rounded bg-slate-50 hover:bg-[#f1f8ed] border border-slate-200/80 transition-colors shrink-0 cursor-pointer"
          >
            مشخصات
          </button>
        </div>
      </div>
    </article>
  );
};
