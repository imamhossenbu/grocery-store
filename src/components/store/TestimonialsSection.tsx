import React from 'react';
import { Star } from 'lucide-react';
import { SectionHeader } from '@/components/ui/SectionHeader';

const REVIEWS = [
  {
    name: 'Nusrat Jahan',
    role: 'Homemaker, Dhanmondi',
    text: 'The Rajshahi Himsagar mangoes and Sirajganj milk arrived super fresh at 8 AM. It saves me an early morning trip to the bazaar on busy school days.',
    rating: 5,
  },
  {
    name: 'Tanvir Hasan',
    role: 'University Student, Mirpur',
    text: 'Student-friendly prices and the WELCOME50 coupon saved me money. Paying Cash on Delivery at my doorstep is hassle-free.',
    rating: 5,
  },
  {
    name: 'Farhana Akter',
    role: 'Software Engineer, Gulshan-2',
    text: 'I order after office and select the evening delivery slot. The Palong Shak and Bogura Mishti Doi were top notch and authentic.',
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20 bg-[#f0f7f2] border-t border-[#dfece3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Customer Love"
          title="Loved by Bangladeshi Households"
          subtitle="Real feedback from families and professionals enjoying our farm-fresh grocery service."
          align="center"
        />

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {REVIEWS.map((rev, idx) => (
            <div
              key={idx}
              className="flex flex-col justify-between rounded-3xl border border-[#dfece3] bg-white p-7 shadow-soft transition hover:-translate-y-1 hover:shadow-card"
            >
              <div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: rev.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-[#f5b82e] text-[#f5b82e]"
                    />
                  ))}
                </div>
                <blockquote className="mt-4 font-display text-base text-[#112a1d] leading-relaxed italic">
                  &ldquo;{rev.text}&rdquo;
                </blockquote>
              </div>

              <div className="mt-6 flex items-center gap-3 pt-4 border-t border-[#f0f7f2]">
                <div className="grid place-items-center w-10 h-10 rounded-full bg-emerald-gradient text-white font-bold text-sm">
                  {rev.name[0]}
                </div>
                <div>
                  <span className="text-sm font-bold text-[#112a1d] block leading-snug">
                    {rev.name}
                  </span>
                  <span className="text-xs text-[#5a7165] block">
                    {rev.role}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
