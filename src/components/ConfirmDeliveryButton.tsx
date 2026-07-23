'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { confirmDelivery } from '@/app/customer/orders/actions';

interface ConfirmDeliveryButtonProps {
  orderId: string;
}

export default function ConfirmDeliveryButton({ orderId }: ConfirmDeliveryButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleConfirm = async () => {
    if (!window.confirm('Konfirmasi bahwa Anda sudah menerima barang? Pastikan barang dalam kondisi baik.')) return;
    setIsLoading(true);
    const result = await confirmDelivery(orderId);
    setIsLoading(false);
    if (result?.success) {
      router.refresh();
    } else {
      alert(result?.error || 'Gagal mengkonfirmasi penerimaan.');
    }
  };

  return (
    <div className="mt-6 p-4 bg-green-50 border-[2px] border-green-400 rounded-xl">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">📬</span>
        <div>
          <p className="font-extrabold">Barang Sudah Dikirim</p>
          <p className="text-sm font-semibold opacity-70">Jika Anda sudah menerima barang, silakan konfirmasi di bawah ini.</p>
        </div>
      </div>
      <button
        onClick={handleConfirm}
        disabled={isLoading}
        className="neo-btn bg-green-500 hover:bg-green-600 text-white border-[var(--neo-black)] text-sm py-2 px-6 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? '⏳ Memproses...' : '✅ Konfirmasi Barang Diterima'}
      </button>
    </div>
  );
}
