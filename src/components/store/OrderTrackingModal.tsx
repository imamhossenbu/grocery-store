'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  Clock,
  MapPin,
  Package,
  RefreshCw,
  Search,
  Truck,
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { formatBDT } from '@/lib/supabase-db';
import { OrderStatus } from '@/types/store';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrderId?: string;
}

const STEPS: { status: OrderStatus; label: string; desc: string }[] = [
  { status: 'Pending', label: 'Order Placed', desc: 'Received and awaiting store confirmation' },
  { status: 'Confirmed', label: 'Order Confirmed', desc: 'Verified and queued for fresh sorting' },
  { status: 'Packed', label: 'Packed & Chilled', desc: 'Quality inspected and safely packed' },
  { status: 'Out for delivery', label: 'Out for Delivery', desc: 'Rider is on the way to your address' },
  { status: 'Delivered', label: 'Delivered', desc: 'Cash collected & groceries received' },
];

export function OrderTrackingModal({
  isOpen,
  onClose,
  initialOrderId = '',
}: OrderTrackingModalProps) {
  const { orders, refreshStore } = useStore();
  const [searchId, setSearchId] = useState(initialOrderId);
  const [syncing, setSyncing] = useState(false);

  if (!isOpen) return null;

  const order = orders.find(
    (o) => o.id.toLowerCase() === searchId.trim().toLowerCase()
  );

  const handleSync = async () => {
    setSyncing(true);
    await refreshStore();
    setTimeout(() => setSyncing(false), 500);
  };

  const getStepIndex = (status: OrderStatus) => {
    if (status === 'Cancelled') return -1;
    return STEPS.findIndex((s) => s.status === status);
  };

  const currentStepIndex = order ? getStepIndex(order.status) : -1;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Track Your Order"
      subtitle="Check live status of your Cash on Delivery grocery delivery."
      size="xl"
    >
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#5a7165] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Enter Order ID (e.g. FB-240901)"
              className="w-full rounded-xl border border-[#cfe3d6] pl-10 pr-4 py-2.5 text-sm uppercase font-mono tracking-wider focus:border-[#1a663b] focus:outline-none"
            />
          </div>
          <Button variant="secondary" size="md" onClick={handleSync}>
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            Sync
          </Button>
        </div>

        {/* Not Found */}
        {searchId.trim() && !order && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center text-xs text-amber-800">
            <AlertCircle className="w-6 h-6 mx-auto mb-2 text-amber-600" />
            <p className="font-bold">Order &quot;{searchId}&quot; not found</p>
            <p className="mt-1 text-amber-700">
              Please double check the ID. You can also view sample orders like{' '}
              <button
                onClick={() => setSearchId('FB-240901')}
                className="underline font-bold"
              >
                FB-240901
              </button>{' '}
              or{' '}
              <button
                onClick={() => setSearchId('FB-240902')}
                className="underline font-bold"
              >
                FB-240902
              </button>
              .
            </p>
          </div>
        )}

        {/* Found Order Details */}
        {order && (
          <div className="space-y-6">
            {/* Header pill */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#f0f7f2] border border-[#cfe3d6] p-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#5a7165]">
                  Order Status
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-base font-bold text-[#112a1d]">
                    {order.id}
                  </span>
                  <span
                    className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                      order.status === 'Cancelled'
                        ? 'bg-red-100 text-red-700'
                        : order.status === 'Delivered'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#5a7165]">
                  Payable on Delivery
                </span>
                <span className="block text-lg font-extrabold text-[#1a663b]">
                  {formatBDT(order.total)}
                </span>
              </div>
            </div>

            {/* Stepper Timeline */}
            {order.status === 'Cancelled' ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-xs font-bold text-red-700">
                This order was cancelled. Please contact our support team at 7 AM – 11 PM.
              </div>
            ) : (
              <div className="py-2">
                <div className="relative">
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                    {STEPS.map((step, idx) => {
                      const isCompleted = idx <= currentStepIndex;
                      const isCurrent = idx === currentStepIndex;

                      return (
                        <div
                          key={step.status}
                          className={`flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2 rounded-2xl p-3 border transition ${
                            isCurrent
                              ? 'border-[#1a663b] bg-[#e8f5ee]'
                              : isCompleted
                              ? 'border-[#cfe3d6] bg-white'
                              : 'border-dashed border-gray-200 bg-gray-50 opacity-60'
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full grid place-items-center text-xs font-bold shrink-0 ${
                              isCompleted
                                ? 'bg-[#1a663b] text-white'
                                : 'bg-gray-200 text-gray-500'
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              idx + 1
                            )}
                          </div>
                          <div>
                            <span className="block text-xs font-bold text-[#112a1d]">
                              {step.label}
                            </span>
                            <span className="text-[10px] text-[#5a7165] hidden sm:block">
                              {step.desc}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Delivery Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="rounded-2xl border border-[#e2efe6] bg-[#fbfdfc] p-4 space-y-2">
                <span className="font-bold text-[#112a1d] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#1a663b]" />
                  Delivery Destination
                </span>
                <p className="text-[#5a7165]">
                  <strong className="text-[#112a1d]">
                    {order.customer.name}
                  </strong>{' '}
                  ({order.customer.phone})
                </p>
                <p className="text-[#5a7165]">
                  {order.customer.address}, {order.customer.area},{' '}
                  {order.customer.city}
                </p>
                {order.customer.notes && (
                  <p className="italic text-[#789384]">
                    Note: {order.customer.notes}
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-[#e2efe6] bg-[#fbfdfc] p-4 space-y-2">
                <span className="font-bold text-[#112a1d] flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#1a663b]" />
                  Time & Slot
                </span>
                <p className="text-[#5a7165]">
                  Slot: <strong className="text-[#112a1d]">{order.customer.deliverySlot}</strong>
                </p>
                <p className="text-[#5a7165]">
                  Ordered on:{' '}
                  {new Date(order.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                <p className="text-[#5a7165] inline-flex items-center gap-1">
                  <Banknote className="w-3.5 h-3.5 text-[#1a663b]" />
                  Cash on Delivery
                </p>
              </div>
            </div>

            {/* Items in order */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-[#5a7165] mb-2">
                Basket Items ({order.items.length})
              </h5>
              <div className="rounded-2xl border border-[#e2efe6] divide-y divide-[#eef4f0] overflow-hidden bg-white">
                {order.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-9 h-9 rounded-lg object-cover bg-[#f0f7f2]"
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
          </div>
        )}
      </div>
    </Modal>
  );
}

