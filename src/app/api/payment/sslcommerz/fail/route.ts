import { handleFailOrCancelCallback } from '@/lib/payments/callbacks';

/** SSLCommerz fail_url: browser POST when the payment failed. Cancels the pending order and restores stock. */
export async function POST(request: Request) {
  return handleFailOrCancelCallback(request, 'failed');
}

// No GET handler on purpose: a state-changing GET could be triggered by any link or image.
