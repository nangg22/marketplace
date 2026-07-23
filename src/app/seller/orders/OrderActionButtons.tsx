'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { approveOrder, cancelOrder, confirmCodPayment, markShipped } from './actions';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  paid: { label: '✅ Lunas', color: 'bg-[var(--neo-green)] text-[var(--neo-black)]' },
  pending: { label: '⏳ Menunggu', color: 'bg-[var(--neo-accent)] text-[var(--neo-black)]' },
  pending_cod: { label: '🛵 COD Menunggu', color: 'bg-orange-300 text-[var(--neo-black)]' },
  confirmed_cod: { label: '💰 COD Dikonfirmasi', color: 'bg-green-300 text-[var(--neo-black)]' },
  awaiting_payment: { label: '🕐 Menunggu Bayar', color: 'bg-blue-300 text-[var(--neo-black)]' },
  cancelled: { label: '❌ Dibatalkan', color: 'bg-red-400 text-white' },
  processing: { label: '🏭 Diproses', color: 'bg-blue-200 text-[var(--neo-black)]' },
  shipped: { label: '🚚 Dikirim', color: 'bg-purple-300 text-[var(--neo-black)]' },
  delivered: { label: '📬 Diterima', color: 'bg-green-400 text-[var(--neo-black)]' },
  completed: { label: '🎉 Selesai', color: 'bg-[var(--neo-primary)] text-white' },
};

interface OrderActionButtonsProps {
  orderId: string;
  currentStatus: string;
  paymentMethod?: string;
}

export function OrderActionButtons({ orderId, currentStatus, paymentMethod }: OrderActionButtonsProps) {
  const [isLoading, setIsLoading] = useState<'approve' | 'cancel' | 'confirm_cod' | 'shipped' | null>(null);
  const router = useRouter();

  const handleApprove = async () => {
    setIsLoading('approve');
    const result = await approveOrder(orderId);
    setIsLoading(null);
    if (result?.success) {
      router.refresh();
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Yakin ingin membatalkan pesanan ini?')) return;
    setIsLoading('cancel');
    const result = await cancelOrder(orderId);
    setIsLoading(null);
    if (result?.success) {
      router.refresh();
    }
  };

  const handleShipped = async () => {
    setIsLoading('shipped');
    const result = await markShipped(orderId);
    setIsLoading(null);
    if (result?.success) {
      router.refresh();
    }
  };

  const handleConfirmCodPayment = async () => {
    if (!window.confirm('Konfirmasi bahwa pembayaran COD sudah diterima dari pembeli?')) return;
    setIsLoading('confirm_cod');
    const result = await confirmCodPayment(orderId);
    setIsLoading(null);
    if (result?.success) {
      router.refresh();
    }
  };

  // Status akhir atau status di mana seller tidak punya aksi lagi
  if (['cancelled', 'completed', 'refunded', 'failed'].includes(currentStatus)) {
    return null;
  }

  // Jika status pesanan belum dibayar oleh pembeli (non-COD)
  if (paymentMethod !== 'cod' && currentStatus === 'pending') {
    return (
      <div className="flex gap-2 mt-4">
        <button
          disabled
          className="neo-btn neo-btn-outline text-sm py-2 flex-1 opacity-50 cursor-not-allowed bg-gray-100"
        >
          ⏳ Menunggu Pembayaran
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

  // COD: Seller approve order (tanpa perlu konfirmasi pembayaran dulu)
  if (paymentMethod === 'cod' && currentStatus === 'pending_cod') {
    return (
      <div className="flex gap-2 mt-4">
        <button
          onClick={handleApprove}
          disabled={isLoading !== null}
          className="neo-btn neo-btn-primary text-sm py-2 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading === 'approve' ? '⏳ Memproses...' : '✅ Approve Pesanan COD'}
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

  // Jika pesanan butuh di-approve seller (Lunas)
  if (currentStatus === 'paid') {
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

  // Jika status pesanan sudah diproses, tampilkan tombol kirim pesanan
  if (currentStatus === 'processing') {
    return (
      <div className="flex gap-2 mt-4">
        <button
          onClick={handleShipped}
          disabled={isLoading !== null}
          className="neo-btn neo-btn-primary bg-purple-500 hover:bg-purple-600 text-white text-sm py-2 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading === 'shipped' ? '⏳ Memproses...' : '🚚 Tandai Sudah Dikirim'}
        </button>
      </div>
    );
  }

  // COD: Setelah buyer konfirmasi barang diterima, seller konfirmasi pembayaran diterima
  if (paymentMethod === 'cod' && currentStatus === 'delivered') {
    return (
      <div className="mt-4 p-4 bg-green-50 border-[2px] border-green-400 rounded-xl">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">💰</span>
          <div>
            <p className="font-extrabold">Pembeli Sudah Konfirmasi Terima Barang</p>
            <p className="text-sm font-semibold opacity-70">Konfirmasi bahwa Anda sudah menerima pembayaran COD dari pembeli.</p>
          </div>
        </div>
        <button
          onClick={handleConfirmCodPayment}
          disabled={isLoading !== null}
          className="neo-btn bg-green-500 hover:bg-green-600 text-white border-[var(--neo-black)] text-sm py-2 px-6 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading === 'confirm_cod' ? '⏳ Memproses...' : '💰 Konfirmasi Pembayaran COD Diterima'}
        </button>
      </div>
    );
  }

  // Status shipped tapi bukan COD — seller sudah tidak punya aksi
  if (currentStatus === 'shipped') {
    return null;
  }

  // Default fallback
  return null;
}

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABELS[status] ?? { label: status, color: 'bg-gray-200 text-black' };
  return (
    <span className={`neo-sticker text-xs px-2 py-0.5 rotate-0 ${s.color}`}>
      {s.label}
    </span>
  );
}
