export interface Category {
  id: string;
  name: string;
  blurb: string;
  image: string;
  iconName?: string;
  /** Parent category id; absent for a top-level category. */
  parentId?: string;
  /** Longer copy for the category page (optional). */
  description?: string;
  sortOrder?: number;
}

/** A category with the number of active products in its whole subtree. */
export interface CategoryWithCount extends Category {
  productCount: number;
  /** 0 for top-level, 1 for a subcategory, 2 for a sub-subcategory. */
  depth: number;
}

export interface CategoryNode extends CategoryWithCount {
  children: CategoryNode[];
}

export interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  oldPrice?: number;
  description: string;
  image: string;
  images?: string[];
  badge?: string;
  rating: number;
  reviewCount?: number;
  sku: string;
  stock: number;
  soldCount?: number;
  featured: boolean;
  active: boolean;
  origin?: string;
  nutrition?: string;
  tags?: string[];
  createdAt?: string;
}

export interface Coupon {
  code: string;
  label: string;
  discountType: 'percent' | 'fixed';
  value: number;
  maxDiscount?: number;
  minSubtotal: number;
  active: boolean;
  expiresAt?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  unit: string;
  price: number;
  qty: number;
  image: string;
}

export const ORDER_STATUSES = [
  'Pending',
  'Confirmed',
  'Packed',
  'Out for delivery',
  'Delivered',
  'Cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface OrderCustomer {
  name: string;
  phone: string;
  email?: string;
  address: string;
  /** Upazila / thana name (older orders: a Dhaka area). */
  area: string;
  /** District name (older orders: "Dhaka"). */
  city: string;
  /** Structured parts from the address picker; absent on older orders. */
  division?: string;
  district?: string;
  upazila?: string;
  /** Union / town area, or a neighbourhood typed under a city thana. */
  union?: string;
  landmark?: string;
  postcode?: string;
  deliverySlot: string;
  notes?: string;
}

export const PAYMENT_METHODS = ['cod', 'sslcommerz'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ['unpaid', 'pending', 'paid', 'failed', 'cancelled', 'refunded'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface Order {
  id: string;
  createdAt: string;
  customer: OrderCustomer;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paidAt?: string;
  status: OrderStatus;
  statusHistory?: { status: OrderStatus; at: string }[];
}

export interface Review {
  id: string;
  productId: string;
  authorName: string;
  rating: number;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

export interface Profile {
  fullName: string;
  phone: string;
  address: string;
  area: string;
  city: string;
  /** Address picker parts (names, not ids); absent until saved with the picker. */
  division?: string;
  district?: string;
  upazila?: string;
  union?: string;
  landmark?: string;
  postcode?: string;
}

/** What the cart, wishlist and "recently viewed" keep in localStorage. */
export interface ProductSnapshot {
  id: string;
  name: string;
  unit: string;
  price: number;
  oldPrice?: number;
  image: string;
  stock: number;
}

export interface CartItem extends ProductSnapshot {
  qty: number;
}

/** Shape of the legacy JSON store; still used for the seed catalog. */
export interface StoreDatabase {
  categories: Category[];
  products: Product[];
  coupons: Coupon[];
  orders: Order[];
  updatedAt: string;
}
