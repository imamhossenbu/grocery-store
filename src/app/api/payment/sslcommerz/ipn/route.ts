import { handleIpn } from '@/lib/payments/callbacks';

/**
 * SSLCommerz IPN (Instant Payment Notification): server-to-server POST.
 * Must be reachable from the internet (not localhost). Replies in plain text.
 */
export async function POST(request: Request) {
  return handleIpn(request);
}
