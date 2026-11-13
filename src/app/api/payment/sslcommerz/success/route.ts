import { handleSuccessCallback } from '@/lib/payments/callbacks';

/** SSLCommerz success_url: browser POST after payment. Validated server-side before anything is marked paid. */
export async function POST(request: Request) {
  return handleSuccessCallback(request);
}

/** Some gateways/browsers follow with a GET; treat it the same way (query string fields). */
export async function GET(request: Request) {
  return handleSuccessCallback(request);
}
