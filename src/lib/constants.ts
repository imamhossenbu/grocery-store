export const SITE_NAME = 'FreshBasket';
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
export const SUPPORT_PHONE = '+880 1711-000000';
export const SUPPORT_EMAIL = 'support@freshbasket.com.bd';

/**
 * Popular Dhaka neighbourhoods, for marketing copy only (e.g. the delivery
 * info page). Checkout and profiles use the nationwide AddressPicker
 * (src/components/address) and validate against the bangladesh-geo-data
 * dataset instead; this list no longer restricts where we deliver.
 */
export const DHAKA_AREAS = [
  'Gulshan',
  'Banani',
  'Dhanmondi',
  'Mirpur',
  'Uttara',
  'Bashundhara R/A',
  'Mohammadpur',
  'Motijheel',
  'Badda',
  'Khilgaon',
  'Old Dhaka',
  'Other Area in Dhaka',
] as const;

export const DELIVERY_SLOTS = [
  { id: 'Morning (8:00 AM – 11:00 AM)', label: 'Morning', time: '8 AM – 11 AM' },
  { id: 'Afternoon (1:00 PM – 4:00 PM)', label: 'Afternoon', time: '1 PM – 4 PM' },
  { id: 'Evening (5:00 PM – 8:00 PM)', label: 'Evening', time: '5 PM – 8 PM' },
] as const;

export const PRODUCTS_PER_PAGE = 12;

/** Shown under the hero search and in the empty header search panel. */
export const POPULAR_SEARCHES = ['Mango', 'Hilsha', 'Mishti doi', 'Mustard oil', 'Rice', 'Eggs'];
