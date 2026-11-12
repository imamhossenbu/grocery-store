import { PAYMENT_STATUSES, type Category, type Coupon, type Order, type OrderStatus, type PaymentStatus, type Product, type Review } from '@/types/store';

type Row = Record<string, unknown>;
const num = (v: unknown) => (v === null || v === undefined || v === '' ? undefined : Number(v));
const str = (v: unknown) => (v === null || v === undefined ? undefined : String(v));

export function toCategory(r: Row): Category {
  return { id: String(r.id), name: String(r.name), blurb: String(r.blurb ?? ''), image: String(r.image ?? '') };
}

export function toProduct(r: Row): Product {
  return {
    id: String(r.id),
    name: String(r.name),
    category: String(r.category),
    unit: String(r.unit),
    price: Number(r.price),
    oldPrice: num(r.old_price),
    description: String(r.description ?? ''),
    image: String(r.image ?? ''),
    images: Array.isArray(r.images) ? (r.images as string[]) : [],
    badge: str(r.badge),
    rating: Number(r.rating ?? 0),
    reviewCount: Number(r.review_count ?? 0),
    sku: String(r.sku ?? ''),
    stock: Number(r.stock ?? 0),
    soldCount: Number(r.sold_count ?? 0),
    featured: Boolean(r.featured),
    active: r.active !== false,
    origin: str(r.origin),
    nutrition: str(r.nutrition),
    tags: Array.isArray(r.tags) ? (r.tags as string[]) : [],
    createdAt: str(r.created_at),
  };
}

export function toCoupon(r: Row): Coupon {
  return {
    code: String(r.code),
    label: String(r.label),
    discountType: r.discount_type === 'percent' ? 'percent' : 'fixed',
    value: Number(r.value),
    maxDiscount: num(r.max_discount),
    minSubtotal: Number(r.min_subtotal ?? 0),
    active: Boolean(r.active),
    expiresAt: str(r.expires_at),
  };
}

export function toOrder(r: Row): Order {
  return {
    id: String(r.id),
    createdAt: String(r.created_at),
    customer: {
      name: String(r.customer_name),
      phone: String(r.customer_phone),
      email: str(r.customer_email),
      address: String(r.customer_address),
      area: String(r.customer_area),
      city: String(r.customer_city ?? 'Dhaka'),
      deliverySlot: String(r.delivery_slot),
      notes: str(r.notes),
    },
    items: ((r.items as Row[]) ?? []).map((i) => ({
      productId: String(i.productId),
      name: String(i.name),
      unit: String(i.unit),
      price: Number(i.price),
      qty: Number(i.qty),
      image: String(i.image ?? ''),
    })),
    subtotal: Number(r.subtotal),
    discount: Number(r.discount ?? 0),
    couponCode: str(r.coupon_code),
    deliveryFee: Number(r.delivery_fee ?? 0),
    total: Number(r.total),
    paymentMethod: r.payment_method === 'sslcommerz' ? 'sslcommerz' : 'cod',
    paymentStatus: (PAYMENT_STATUSES as readonly string[]).includes(String(r.payment_status))
      ? (String(r.payment_status) as PaymentStatus)
      : 'unpaid',
    paidAt: str(r.paid_at),
    status: String(r.status) as OrderStatus,
    statusHistory: Array.isArray(r.status_history)
      ? (r.status_history as { status: OrderStatus; at: string }[])
      : [],
  };
}

export function toReview(r: Row): Review {
  return {
    id: String(r.id),
    productId: String(r.product_id),
    authorName: String(r.author_name),
    rating: Number(r.rating),
    comment: String(r.comment ?? ''),
    verifiedPurchase: Boolean(r.verified_purchase),
    createdAt: String(r.created_at),
  };
}
