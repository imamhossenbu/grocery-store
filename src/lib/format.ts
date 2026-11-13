export function formatBDT(amount: number): string {
  return `৳${Math.round(amount).toLocaleString('en-IN')}`;
}

// A fixed locale and time zone so the server and the browser print the same
// string (no hydration mismatch) and customers always see Dhaka time.
const DATE_TIME = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  timeZone: 'Asia/Dhaka',
});

const DATE_ONLY = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Dhaka',
});

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : DATE_TIME.format(d);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : DATE_ONLY.format(d);
}

/** Bangladeshi mobile numbers: 01XXXXXXXXX, optionally written with +88 / spaces / dashes. */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  const local = digits.startsWith('880') ? digits.slice(2) : digits;
  return /^01[3-9]\d{8}$/.test(local) ? local : null;
}
