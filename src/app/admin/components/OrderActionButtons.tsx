'use client';

import { useState, useTransition } from 'react';
import { updateOrderStatus, deleteOrder } from '@/app/admin/actions';

const STATUS_OPTIONS = [
  { value: 'pending', label: '⏳ Pending', color: 'bg-[var(--neo-accent)] text-[var(--neo-black)]' },
  { value: 'paid', label: '✅ Lunas', color: 'bg-[var(--neo-green)] text-[var(--neo-black)]' },
  { value: 'processing', label: '🔄 Diproses', color: 'bg-[var(--neo-blue)] text-white' },
  { value: 'shipped', label: '🚚 Dikirim', color: 'bg-[var(--neo-secondary)] text-white' },
  { value: 'completed', label: '🎉 Selesai', color: 'bg-[var(--neo-primary)] text-white' },
  { value: 'cancelled', label: '❌ Dibatalkan', color: 'bg-[var(--neo-pink)] text-white' },
  { value: 'refunded', label: '↩️ Refund', color: 'bg-gray-400 text-white' },
];

interface Props {
  orderId: string;
  currentStatus: string;
}

export default function OrderActionButtons({ orderId, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);

  const handleUpdate = () => {
    if (selectedStatus === currentStatus) return setShowModal(false);
    startTransition(async () => {
      await updateOrderStatus(orderId, selectedStatus);
      setShowModal(false);
    });
  };

  const handleDelete = () => {
    if (!confirm('⚠️ Hapus transaksi ini permanen? Data tidak bisa dikembalikan!')) return;
    startTransition(async () => { await deleteOrder(orderId); });
  };

  const currentStatusObj = STATUS_OPTIONS.find(s => s.value === currentStatus);

  return (
    <>
      <div className="flex gap-1.5 justify-center flex-wrap">
        <button
          onClick={() => setShowModal(true)}
          disabled={isPending}
          className="neo-btn bg-[var(--neo-secondary)] text-white border-[var(--neo-black)] px-2.5 py-1 text-xs font-bold disabled:opacity-50"
        >
          🔄 Status
        </button>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="neo-btn bg-[var(--neo-pink)] text-white border-[var(--neo-black)] px-2.5 py-1 text-xs font-bold disabled:opacity-50"
        >
          🗑️
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="neo-card max-w-sm w-full p-6 animate-bounce-in">
            <h3 className="font-extrabold text-lg mb-1">🔄 Ubah Status Pesanan</h3>
            <p className="text-sm opacity-70 mb-4">ID: <span className="font-mono">{orderId.substring(0, 12)}...</span></p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSelectedStatus(s.value)}
                  className={`neo-btn py-2 text-xs font-extrabold border-[var(--neo-black)] ${
                    selectedStatus === s.value ? s.color + ' scale-[1.03]' : 'bg-white text-[var(--neo-black)]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="neo-btn neo-btn-outline flex-1 py-2">Batal</button>
              <button onClick={handleUpdate} disabled={isPending} className="neo-btn neo-btn-primary flex-1 py-2 font-extrabold disabled:opacity-50">
                {isPending ? '⏳...' : '💾 Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
