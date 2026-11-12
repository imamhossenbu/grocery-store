'use client';

import React, { useState } from 'react';
import {
  Banknote,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { formatBDT } from '@/lib/supabase-db';
import { Order } from '@/types/store';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
}

const DHAKA_AREAS = [
  'Gulshan-1 & 2',
  'Banani',
  'Dhanmondi',
  'Uttara',
  'Mirpur',
  'Mohammadpur',
  'Bashundhara R/A',
  'Baridhara',
  'Badda & Rampura',
  'Motijheel & Paltan',
  'Shyamoli & Kalyanpur',
  'Lalmatia',
  'Other Area in Dhaka',
];

const DELIVERY_SLOTS = [
  { id: 'Morning (8:00 AM – 11:00 AM)', label: 'Morning Slot: 8 AM – 11 AM' },
  { id: 'Afternoon (1:00 PM – 4:00 PM)', label: 'Afternoon Slot: 1 PM – 4 PM' },
  { id: 'Evening (5:00 PM – 8:00 PM)', label: 'Evening Slot: 5 PM – 8 PM' },
];

export function CheckoutModal({
  isOpen,
  onClose,
  onOrderSuccess,
}: CheckoutModalProps) {
  const { cartLines, subtotal, discount, deliveryFee, total, placeCashOnDeliveryOrder } =
    useStore();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    area: DHAKA_AREAS[0],
    city: 'Dhaka',
    deliverySlot: DELIVERY_SLOTS[0].id,
    notes: '',
  });

  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!formData.phone.trim() || formData.phone.length < 10) {
      setError('Please enter a valid mobile number (e.g. 01712345678).');
      return;
    }
    if (!formData.address.trim()) {
      setError('Please provide your complete delivery address.');
      return;
    }

    setLoading(true);
    try {
      const order = await placeCashOnDeliveryOrder(formData);
      if (order) {
        onClose();
        onOrderSuccess(order);
      } else {
        setError('Failed to place order. Please try again.');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Complete Your Order"
      subtitle="Pay safely with Cash on Delivery (COD) upon receiving your fresh groceries."
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-xs font-bold text-red-700">
            {error}
          </div>
        )}

        {/* Customer Information */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-[#112a1d] flex items-center gap-2">
            <User className="w-4 h-4 text-[#1a663b]" />
            Customer & Contact Details
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#5a7165] mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g. Farhana Akter"
                className="w-full rounded-xl border border-[#cfe3d6] px-4 py-2.5 text-sm focus:border-[#1a663b] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#5a7165] mb-1.5">
                Phone Number (for delivery call) *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#5a7165] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="01XXXXXXXXX"
                  className="w-full rounded-xl border border-[#cfe3d6] pl-10 pr-4 py-2.5 text-sm focus:border-[#1a663b] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5a7165] mb-1.5">
              Email Address (Optional, for invoice)
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="e.g. farhana@example.com"
              className="w-full rounded-xl border border-[#cfe3d6] px-4 py-2.5 text-sm focus:border-[#1a663b] focus:outline-none"
            />
          </div>
        </div>

        {/* Address & Slot */}
        <div className="space-y-4 pt-2 border-t border-[#e6f0e9]">
          <h4 className="text-sm font-bold text-[#112a1d] flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#1a663b]" />
            Delivery Destination & Slot
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#5a7165] mb-1.5">
                Area in Dhaka *
              </label>
              <select
                value={formData.area}
                onChange={(e) =>
                  setFormData({ ...formData, area: e.target.value })
                }
                className="w-full rounded-xl border border-[#cfe3d6] bg-white px-4 py-2.5 text-sm focus:border-[#1a663b] focus:outline-none cursor-pointer"
              >
                {DHAKA_AREAS.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#5a7165] mb-1.5">
                Preferred Delivery Slot *
              </label>
              <select
                value={formData.deliverySlot}
                onChange={(e) =>
                  setFormData({ ...formData, deliverySlot: e.target.value })
                }
                className="w-full rounded-xl border border-[#cfe3d6] bg-white px-4 py-2.5 text-sm focus:border-[#1a663b] focus:outline-none cursor-pointer"
              >
                {DELIVERY_SLOTS.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {slot.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5a7165] mb-1.5">
              Full Street Address, House & Flat No. *
            </label>
            <textarea
              required
              rows={2}
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              placeholder="e.g. House 42, Road 7/A, Flat 5B"
              className="w-full rounded-xl border border-[#cfe3d6] p-3 text-sm focus:border-[#1a663b] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5a7165] mb-1.5">
              Special Delivery Instructions (Optional)
            </label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="e.g. Please leave with security or call before arriving"
              className="w-full rounded-xl border border-[#cfe3d6] px-4 py-2 text-sm focus:border-[#1a663b] focus:outline-none"
            />
          </div>
        </div>

        {/* Payment Method Badge */}
        <div className="rounded-2xl border-2 border-[#1a663b] bg-[#eef7f2] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid place-items-center w-10 h-10 rounded-xl bg-[#1a663b] text-white">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-[#112a1d] block">
                Cash on Delivery (COD)
              </span>
              <span className="text-xs text-[#5a7165]">
                Pay with physical cash or mobile wallet to the delivery rider at your doorstep.
              </span>
            </div>
          </div>
          <CheckCircle2 className="w-5 h-5 text-[#1a663b]" />
        </div>

        {/* Order Summary & Pricing */}
        <div className="rounded-2xl bg-[#f7faf8] border border-[#e2efe6] p-4 space-y-2 text-xs text-[#5a7165]">
          <div className="flex justify-between">
            <span>Items ({cartLines.length} unique products)</span>
            <span className="font-bold text-[#112a1d]">{formatBDT(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Applied Voucher Discount</span>
              <span>-{formatBDT(discount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Delivery Fee</span>
            <span className="font-bold text-[#112a1d]">
              {deliveryFee === 0 ? 'FREE' : formatBDT(deliveryFee)}
            </span>
          </div>
          <div className="flex justify-between border-t border-[#e2efe6] pt-2 text-base font-extrabold text-[#112a1d]">
            <span>Total Payable</span>
            <span className="text-[#1a663b]">{formatBDT(total)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={loading}
          >
            Back to Basket
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="px-8"
          >
            Confirm COD Order ({formatBDT(total)})
          </Button>
        </div>
      </form>
    </Modal>
  );
}
