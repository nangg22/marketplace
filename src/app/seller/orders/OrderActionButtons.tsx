'use client';

import { useState } from 'react';
import { approveOrder, cancelOrder } from './actions';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  paid: { label: '✅ Lunas', color: 'bg-[var(--neo-green)] text-[var(--neo-black)]' },
  pending: { label: '⏳ Menunggu', color: 'bg-[var(--neo-accent)] text-[var(--neo-black)]' },
  pending_cod: { label: '🛵 COD Menunggu', color: 'bg-orange-300 text-[var(--neo-black)]' },
  awaiting_payment: { label: '🕐 Menunggu Bayar', color: 'bg-blue-300 text-[var(--neo-black)]' },
  cancelled: { label: '❌ Dibatalkan', color: 'bg-red-400 text-white' },
};

interface OrderActionButtonsProps {
  orderId: string;
  currentStatus: string;
}

export function OrderActionButtons({ orderId, currentStatus }: OrderActionButtonsProps) {
  const [isLoading, setIsLoading] = useState<'approve' | 'cancel' | null>(null);

  const handleApprove = async () => {
    setIsLoading('approve');
    await approveOrder(orderId);
    setIsLoading(null);
  };

  const handleCancel = async () => {
    if (!window.confirm('Yakin ingin membatalkan pesanan ini?')) return;
    setIsLoading('cancel');
    await cancelOrder(orderId);
    setIsLoading(null);
  };

  if (currentStatus === 'paid' || currentStatus === 'cancelled') return null;

  return (
    <div className="flex gap-2 mt-4">
      <button
        onClick={handleApprove}
        disabled={isLoading !== null}
        className="neo-btn neo-btn-primary text-sm py-2 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading === 'approve' ? '⏳ Memproses...' : '✅ Approve Pesanan'}
      </button>
      <button
        onClick={handleCancel}
        disabled={isLoading !== null}
        className="neo-btn neo-btn-outline text-sm py-2 bg-red-100 hover:bg-red-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading === 'cancel' ? '⏳ Memproses...' : '❌ Batalkan'}
      </button>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABELS[status] ?? { label: status, color: 'bg-gray-200 text-black' };
  return (
    <span className={`neo-sticker text-xs px-2 py-0.5 rotate-0 ${s.color}`}>
      {s.label}
    </span>
  );
}
