import React from 'react';
import { Banknote, Heart, Leaf, Mail, MapPin, Phone } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-[#0c2317] bg-[#091e13] text-[#b9d8c5] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Col 1: Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="grid place-items-center w-10 h-10 rounded-2xl bg-emerald-gradient text-white shadow-glow">
                <Leaf className="w-5 h-5" />
              </div>
              <span className="font-display text-2xl font-bold tracking-tight text-white">
                Fresh<span className="text-[#3ed481]">Basket</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-[#9abda9]">
              Online grocery &amp; farm produce platform connecting Bangladeshi farmers and conscious households with honest prices and 100% Cash on Delivery.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#123824] px-3.5 py-1.5 text-xs text-[#ecfdf5] border border-[#1b5034]">
              <Banknote className="w-3.5 h-3.5 text-[#f5b82e]" />
              <span>Cash on Delivery Available</span>
            </div>
          </div>

          {/* Col 2: Categories */}
          <div>
            <h4 className="font-display text-base font-bold text-white mb-4">
              Fresh Aisles
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <span className="hover:text-white transition">
                  Rajshahi Orchard Fruits
                </span>
              </li>
              <li>
                <span className="hover:text-white transition">
                  Bogura Daily Vegetables
                </span>
              </li>
              <li>
                <span className="hover:text-white transition">
                  Sirajganj Full-Cream Milk &amp; Doi
                </span>
              </li>
              <li>
                <span className="hover:text-white transition">
                  Sundarbans Raw Honey &amp; Mustard Oil
                </span>
              </li>
              <li>
                <span className="hover:text-white transition">
                  Padma River Hilsha &amp; Halal Meat
                </span>
              </li>
            </ul>
          </div>

          {/* Col 3: Customer Care */}
          <div>
            <h4 className="font-display text-base font-bold text-white mb-4">
              Help &amp; Delivery
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#3ed481]" />
                <span>Dhaka Delivery Hub, Bangladesh</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#3ed481]" />
                <span>+880 1711-000000 (7 AM – 11 PM)</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#3ed481]" />
                <span>support@freshbasket.com.bd</span>
              </li>
              <li className="pt-2 text-[11px] text-[#789d87]">
                Delivery Slots: Morning, Afternoon &amp; Evening
              </li>
            </ul>
          </div>

          {/* Col 4: Promises */}
          <div>
            <h4 className="font-display text-base font-bold text-white mb-4">
              Our Fresh Promise
            </h4>
            <p className="text-xs text-[#9abda9] leading-relaxed">
              Every item is inspected at our hub before sunrise. If you are not 100% pleased with the freshness of any item, our delivery rider or support team will replace it immediately.
            </p>
            <div className="mt-4 rounded-xl bg-[#123824] p-3 border border-[#1a4a31] text-[11px] text-[#c9e4d4]">
              🚚 <strong>Free Delivery:</strong> Applied automatically on any order over ৳1,000.
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[#163f29] flex flex-wrap items-center justify-between gap-4 text-xs text-[#789d87]">
          <p>© 2026 FreshBasket Bangladesh. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Handcrafted with <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" /> for fresh living.
          </p>
        </div>
      </div>
    </footer>
  );
}
