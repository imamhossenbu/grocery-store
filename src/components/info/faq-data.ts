import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD, OUTSIDE_DHAKA_DELIVERY_FEE } from '@/lib/pricing';
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '@/lib/constants';

export interface FaqItem {
  q: string;
  a: string;
}

export interface FaqGroup {
  id: string;
  title: string;
  items: FaqItem[];
}

const fee = `৳${DELIVERY_FEE}`;
const outsideFee = `৳${OUTSIDE_DHAKA_DELIVERY_FEE}`;
const free = `৳${FREE_DELIVERY_THRESHOLD.toLocaleString('en-IN')}`;

/** Plain-text answers so the same copy feeds the page and the FAQPage JSON-LD. */
export const FAQ_GROUPS: FaqGroup[] = [
  {
    id: 'ordering',
    title: 'Ordering',
    items: [
      {
        q: 'Do I need an account to order?',
        a: 'No. You can check out as a guest with your name, mobile number and address. With a free account your address is filled in automatically, and every order is saved under My orders.',
      },
      {
        q: 'Is there a minimum order value?',
        a: `There is no minimum. Inside Dhaka, orders under ${free} carry a ${fee} delivery charge and delivery is free from ${free} upwards. Outside Dhaka, courier delivery is a flat ${outsideFee} per order.`,
      },
      {
        q: 'Can I change or cancel my order after placing it?',
        a: `Yes, until it is packed. Call ${SUPPORT_PHONE} with your order number (FB-XXXXXX) and we will add, remove or cancel items. Once an order is out for delivery it can no longer be changed, but you can refuse any item at the door.`,
      },
      {
        q: 'What if an item I ordered is out of stock?',
        a: 'Stock is checked the moment you place your order, so you can only order what we have. If something is damaged during packing, we call you before dispatch to offer a substitute or remove it — you are never charged for items you do not receive.',
      },
      {
        q: 'How do I use a coupon code?',
        a: 'Enter the code in your basket or at checkout and tap Apply. Each coupon shows its minimum order value. Only one coupon can be used per order.',
      },
    ],
  },
  {
    id: 'delivery',
    title: 'Delivery',
    items: [
      {
        q: 'Which areas do you deliver to?',
        a: 'We deliver across Dhaka city, including Gulshan, Banani, Dhanmondi, Mirpur, Uttara, Bashundhara R/A, Mohammadpur, Motijheel, Badda, Khilgaon and Old Dhaka. Choose “Other Area in Dhaka” at checkout if your area is not listed and we will confirm by phone.',
      },
      {
        q: 'When will my order arrive?',
        a: 'Same day, in the slot you choose: Morning (8–11 AM), Afternoon (1–4 PM) or Evening (5–8 PM). Orders for a slot that has already started or is nearly full move to the next available slot, and we let you know.',
      },
      {
        q: 'How much does delivery cost?',
        a: `Delivery is free on orders of ${free} or more. Below that, a flat ${fee} is added at checkout, wherever you are in Dhaka.`,
      },
      {
        q: 'How do I track my order?',
        a: 'Open the link in your order confirmation, use the Track order page with your order number and mobile number, or sign in and go to My orders. You will see each step: confirmed, packed, out for delivery and delivered.',
      },
      {
        q: 'What if I am not home when the rider arrives?',
        a: 'The rider calls you on arrival and waits up to 10 minutes. If we cannot reach you, we bring the order back and call to rearrange a slot — no extra charge for the first redelivery.',
      },
    ],
  },
  {
    id: 'payment',
    title: 'Payment',
    items: [
      {
        q: 'How do I pay?',
        a: 'Cash on delivery. You pay the rider when your groceries arrive, after you have had a chance to check them. Nothing is charged online.',
      },
      {
        q: 'Will the rider have change?',
        a: 'Riders carry change for up to ৳1,000. For larger notes, mention it in the order notes and we will make sure the rider is prepared.',
      },
      {
        q: 'Do you add any hidden charges?',
        a: `No. The total you see at checkout — items, any discount and the ${fee} delivery charge where it applies — is exactly what you pay at the door.`,
      },
    ],
  },
  {
    id: 'returns',
    title: 'Returns & freshness',
    items: [
      {
        q: 'What is the freshness guarantee?',
        a: 'Check everything when it arrives. If any item is not fresh, damaged or not what you ordered, hand it back to the rider and we will replace it at the door when it is on the van, or refund it in full.',
      },
      {
        q: 'I found a problem after the rider left. What now?',
        a: `Contact us within 24 hours of delivery (chilled, frozen and fresh items) or within 7 days (sealed packaged goods) with your order number and a photo. We will send a replacement with your next order or refund you — usually the same day.`,
      },
      {
        q: 'How are refunds paid?',
        a: 'Because orders are paid in cash, refunds are made by bKash or Nagad to the mobile number on your order, or as a deduction on your next order — whichever you prefer. We process them within 2 working days of approval.',
      },
    ],
  },
  {
    id: 'account',
    title: 'Account',
    items: [
      {
        q: 'I did not receive the confirmation email.',
        a: 'Check spam or promotions first. If you try to sign in before confirming, the sign-in page offers to send a fresh link. Links expire, so always use the newest email.',
      },
      {
        q: 'How do I reset my password?',
        a: 'Use “Forgot password?” on the sign-in page. We email you a link to choose a new password; it works once and expires after an hour.',
      },
      {
        q: 'Where is my wishlist saved?',
        a: 'Your wishlist and basket are saved on the device and browser you used. Prices and stock refresh every time you open them.',
      },
      {
        q: 'How do I delete my account?',
        a: `Email ${SUPPORT_EMAIL} from your registered address and ask us to delete your account. We remove your profile within 7 days and keep only the order records the law requires.`,
      },
    ],
  },
];
