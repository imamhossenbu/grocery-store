import type { Coupon, OrderStatus, PaymentMethod, PaymentStatus, ProductSnapshot } from '@/types/store';
import type { CheckoutInput, FieldErrors } from './validation';

/** Shapes returned by the Server Actions in src/actions/orders.ts. */

export interface CartLine {
  id: string;
  qty: number;
}

export interface CartRefreshResult {
  ok: boolean;
  products: ProductSnapshot[];
}

export type CouponResult =
  | { ok: true; coupon: Coupon; discount: number }
  | { ok: false; error: string };

export interface PlaceOrderState {
  /** 'redirect': online payment — send the browser to `gatewayUrl`. */
  status: 'idle' | 'error' | 'success' | 'redirect' | 'unavailable';
  message?: string;
  fieldErrors?: FieldErrors;
  /** Echo of what was typed so the form keeps its values after an error. */
  values?: Partial<CheckoutInput>;
  /** Product id that caused a stock/availability error, so the UI can point at it. */
  productId?: string;
  /** Set when the coupon was the problem, so the UI can offer to remove it. */
  couponProblem?: boolean;
  /** Set when online payment could not be started, so the UI can offer cash on delivery. */
  paymentProblem?: boolean;
  orderId?: string;
  accessToken?: string;
  /** SSLCommerz hosted payment page (only with status 'redirect'). */
  gatewayUrl?: string;
}

export type ResumePaymentResult = { ok: true; gatewayUrl: string } | { ok: false; error: string };

export interface TrackResult {
  id: string;
  status: OrderStatus;
  createdAt: string;
  statusHistory: { status: OrderStatus; at: string }[];
  itemCount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  area: string;
  deliverySlot: string;
  accessToken: string;
}

export interface TrackState {
  status: 'idle' | 'error' | 'found' | 'unavailable';
  message?: string;
  fieldErrors?: { id?: string; phone?: string };
  values?: { id: string; phone: string };
  result?: TrackResult;
}
