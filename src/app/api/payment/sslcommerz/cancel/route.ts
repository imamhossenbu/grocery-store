import { handleFailOrCancelCallback } from '@/lib/payments/callbacks';

/** SSLCommerz cancel_url: browser POST when the shopper cancelled on the gateway. */
export async function POST(request: Request) {
  return handleFailOrCancelCallback(request, 'cancelled');
}

// No GET handler on purpose: a state-changing GET could be triggered by any link or image.
