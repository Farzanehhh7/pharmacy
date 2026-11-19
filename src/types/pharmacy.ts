export type DosageForm =
  | 'کپسول'
  | 'قرص'
  | 'سرم'
  | 'کرم'
  | 'شربت'
  | 'پودر'
  | 'قطره'
  | 'ژل'
  | 'شامپو'
  | 'دستگاه'
  | 'دمنوش';

export interface ProductSEO {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  canonicalUrl: string;
  noIndex?: boolean;
}

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  nameFa: string;
  nameEn: string;
  brand: string;
  categoryId: string;
  subcategory: string;
  dosageForm: DosageForm;
  originCountry: string;
  packageSize: string;
  activeIngredient: string;
  concerns: string[];
  price: number; // Toman (regular consumer price)
  costPrice: number; // Toman (wholesale cost for margin analytics)
  discountPercent: number;
  stock: number;
  minStockThreshold: number;
  batchNumber: string;
  expiryDate: string; // ISO YYYY-MM-DD
  expiryJalali: string;
  rating: number;
  reviewCount: number;
  salesCount30d: number;
  isFeatured: boolean;
  image: string;
  shortDesc: string;
  usageInstructions: string;
  warnings: string;
  seo: ProductSEO;
}

export interface Category {
  id: string;
  nameFa: string;
  nameEn: string;
  slug: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  image: string;
  subcategories: string[];
}

export interface InventoryLog {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  type: 'in' | 'out' | 'adjustment' | 'sale';
  quantityDelta: number;
  previousStock: number;
  newStock: number;
  batchNumber: string;
  reason: string;
  operator: string;
  timestamp: string;
}

export interface PaymentGateway {
  id: string;
  nameFa: string;
  nameEn: string;
  providerCode: 'zarinpal' | 'mellat' | 'saman' | 'idpay' | 'cod';
  isActive: boolean;
  isSandbox: boolean;
  merchantId: string;
  terminalId: string;
  commissionPercent: number;
  settlementCycle: string;
  description: string;
}

export interface OrderItem {
  productId: string;
  sku: string;
  nameFa: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  city: string;
  address: string;
  postalCode: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  totalProfit: number;
  gatewayId: string;
  gatewayName: string;
  transactionRef: string;
  status: 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}

export interface DailySalesPoint {
  date: string;
  labelFa: string;
  revenue: number;
  profit: number;
  orders: number;
}

export interface StoreFilters {
  query: string;
  categoryId: string;
  subcategory: string;
  brands: string[];
  dosageForms: DosageForm[];
  originCountries: string[];
  minPrice: number;
  maxPrice: number;
  onlyInStock: boolean;
  onlyDiscounted: boolean;
  minRating: number;
  sortBy: 'bestseller' | 'price_asc' | 'price_desc' | 'discount' | 'rating';
}

export interface MegaMenuFilterTarget {
  categoryId?: string;
  subcategory?: string;
  brand?: string;
  dosageForm?: DosageForm;
  query?: string;
  onlyDiscounted?: boolean;
  sortBy?: StoreFilters['sortBy'];
}

export interface MegaMenuLink {
  label: string;
  badge?: string;
  filter: MegaMenuFilterTarget;
}

export interface MegaMenuGroup {
  title: string;
  filter: MegaMenuFilterTarget;
  links: MegaMenuLink[];
}

export interface MegaMenuCategory {
  id: string;
  label: string;
  featuredTitle: string;
  featuredSubtitle: string;
  featuredImage: string;
  filter: MegaMenuFilterTarget;
  groups: MegaMenuGroup[];
  quickTags: { label: string; filter: MegaMenuFilterTarget }[];
}

export interface MagazineArticle {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string[];
  authorName: string;
  authorRole: string;
  readTime: string;
  publishedDate: string;
  image: string;
  views: number;
  likes: number;
  relatedCategoryId: string;
}

export interface PopularBrand {
  name: string;
  nameFa: string;
  country: string;
  tagline: string;
}

