'use client';

import { useState, useTransition } from 'react';
import { suspendProduct, unsuspendProduct, deleteProduct } from '@/app/admin/actions';

interface Props {
  productId: string;
  productName: string;
  isSuspended: boolean;
}

export default function ProductActionButtons({ productId, productName, isSuspended }: Props) {
  const [isPending, startTransition] = useTransition();
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');

  const handleSuspend = () => {
    if (!suspendReason.trim()) return alert('Tulis alasan penangguhan terlebih dahulu!');
    startTransition(async () => {
      await suspendProduct(productId, suspendReason);
      setShowSuspendModal(false);
      setSuspendReason('');
    });
  };

  const handleUnsuspend = () => {
    if (!confirm(`Aktifkan kembali produk "${productName}"?`)) return;
    startTransition(async () => { await unsuspendProduct(productId); });
  };

  const handleDelete = () => {
    if (!confirm(`⚠️ HAPUS PERMANEN produk "${productName}"? Tidak bisa dibatalkan!`)) return;
    startTransition(async () => { await deleteProduct(productId); });
  };

  return (
    <>
      <div className="flex gap-1.5 justify-center flex-wrap">
        {isSuspended ? (
          <button
            onClick={handleUnsuspend}
            disabled={isPending}
            className="neo-btn bg-[var(--neo-green)] text-[var(--neo-black)] border-[var(--neo-black)] px-2.5 py-1 text-xs font-bold disabled:opacity-50"
          >
            ✅ Aktifkan
          </button>
        ) : (
          <button
            onClick={() => setShowSuspendModal(true)}
            disabled={isPending}
            className="neo-btn bg-[var(--neo-accent)] text-[var(--neo-black)] border-[var(--neo-black)] px-2.5 py-1 text-xs font-bold disabled:opacity-50"
          >
            ⏸️ Suspend
          </button>
        )}

        <button
          onClick={handleDelete}
          disabled={isPending}
          className="neo-btn bg-[var(--neo-pink)] text-white border-[var(--neo-black)] px-2.5 py-1 text-xs font-bold disabled:opacity-50"
        >
          🗑️ Hapus
        </button>
      </div>

      {showSuspendModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="neo-card max-w-sm w-full p-6 animate-bounce-in">
            <h3 className="font-extrabold text-lg mb-1">⏸️ Suspend Produk</h3>
            <p className="text-sm opacity-70 mb-4">Produk <strong>{productName}</strong> akan disembunyikan dari publik.</p>
            <textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Alasan penangguhan (wajib diisi)..."
              className="neo-input resize-none mb-4"
              rows={3}
            />
            <div className="flex gap-3">
              <button onClick={() => setShowSuspendModal(false)} className="neo-btn neo-btn-outline flex-1 py-2">Batal</button>
              <button onClick={handleSuspend} disabled={isPending} className="neo-btn bg-[var(--neo-pink)] text-white border-[var(--neo-black)] flex-1 py-2 font-extrabold disabled:opacity-50">
                {isPending ? '⏳...' : '⏸️ Suspend'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
