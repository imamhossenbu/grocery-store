'use client';

import React, { useState } from 'react';
import {
  Banknote,
  CheckCircle2,
  Copy,
  ExternalLink,
  Package,
  ShoppingBag,
} from 'lucide-react';
import { Order } from '@/types/store';
import { formatBDT } from '@/lib/supabase-db';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface OrderSuccessModalProps {
  order: Order | null;
  onClose: () => void;
  onTrackOrder: (orderId: string) => void;
}

export function OrderSuccessModal({
  order,
  onClose,
  onTrackOrder,
}: OrderSuccessModalProps) {
  const [copied, setCopied] = useState(false);

  if (!order) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(order.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={!!order} onClose={onClose} size="lg">
      <div className="text-center py-2">
        <div className="mx-auto grid place-items-center w-16 h-16 rounded-full bg-[#e8f5ee] text-[#1a663b] mb-4">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#112a1d]">
          Order Successfully Placed!
        </h3>
        <p className="mt-1.5 text-sm text-[#5a7165]">
          Thank you for choosing FreshBasket. We are preparing your fresh farm groceries.
        </p>

        {/* Order Reference Box */}
        <div className="mt-6 inline-flex items-center gap-3 rounded-2xl bg-[#f0f7f2] border border-[#cfe3d6] px-5 py-3 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#5a7165]">
            Order ID:
          </span>
          <strong className="font-mono text-base font-bold text-[#1a663b]">
            {order.id}
          </strong>
          <button
            onClick={handleCopyId}
            className="rounded-lg p-1.5 text-[#5a7165] hover:bg-white hover:text-[#112a1d] transition cursor-pointer"
            title="Copy Order ID"
          >
            <Copy className="w-4 h-4" />
          </button>
          {copied && (
            <span className="text-xs font-bold text-emerald-700">Copied!</span>
          )}
        </div>

        {/* Order Details Grid */}
        <div className="mt-6 rounded-2xl bg-[#f7faf8] border border-[#dfece3] p-5 text-left text-xs sm:text-sm space-y-3">
          <div className="flex justify-between border-b border-[#e6f0e9] pb-2">
            <span className="text-[#5a7165]">Payment Method:</span>
            <span className="font-bold text-[#112a1d] inline-flex items-center gap-1">
              <Banknote className="w-4 h-4 text-[#1a663b]" />
              Cash on Delivery (COD)
            </span>
          </div>
          <div className="flex justify-between border-b border-[#e6f0e9] pb-2">
            <span className="text-[#5a7165]">Delivery Slot:</span>
            <span className="font-bold text-[#112a1d]">
              {order.customer.deliverySlot}
            </span>
          </div>
          <div className="flex justify-between border-b border-[#e6f0e9] pb-2">
            <span className="text-[#5a7165]">Delivery Destination:</span>
            <span className="font-bold text-[#112a1d] text-right">
              {order.customer.address}, {order.customer.area}
            </span>
          </div>
          <div className="flex justify-between text-base font-extrabold text-[#112a1d] pt-1">
            <span>Total Payable Amount:</span>
            <span className="text-[#1a663b]">{formatBDT(order.total)}</span>
          </div>
        </div>

        {/* Ordered Items Preview */}
        <div className="mt-6 text-left">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#5a7165] mb-3">
            Items in this order ({order.items.length})
          </h4>
          <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs rounded-xl bg-white border border-[#e2efe6] p-2.5"
              >
                <div className="flex items-center gap-2">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                  <div>
                    <span className="font-bold text-[#112a1d] block">
                      {item.name}
                    </span>
                    <span className="text-[#5a7165]">
                      {item.unit} × {item.qty}
                    </span>
                  </div>
                </div>
                <span className="font-extrabold text-[#1a663b]">
                  {formatBDT(item.price * item.qty)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={onClose}
          >
            <ShoppingBag className="w-4 h-4" />
            Continue Shopping
          </Button>
          <Button
            variant="forest"
            size="md"
            onClick={() => {
              onClose();
              onTrackOrder(order.id);
            }}
          >
            <Package className="w-4 h-4" />
            Track Order Status
          </Button>
        </div>
      </div>
    </Modal>
  );
}
