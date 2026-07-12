'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RefundRespondForm({ refundId, currentStatus }: { refundId: string, currentStatus: string }) {
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (currentStatus !== 'requested') return null;

  async function handleRespond(status: 'approved' | 'rejected') {
    if (status === 'rejected' && response.trim().length < 10) {
      alert('Alasan penolakan harus diisi minimal 10 karakter.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/refunds/${refundId}/respond`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, sellerResponse: response })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Terjadi kesalahan');
      }
      
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 p-4 border-[2px] border-dashed border-[var(--neo-black)]/30 rounded-lg bg-[var(--neo-white)]">
      <h4 className="font-extrabold text-sm mb-2 flex items-center gap-2">
        <span>✍️</span> Berikan Tanggapan
      </h4>
      <textarea
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        placeholder="Alasan disetujui atau ditolak..."
        className="neo-input w-full mb-3 text-sm"
        rows={3}
      />
      <div className="flex gap-3">
        <button
          disabled={loading}
          onClick={() => handleRespond('approved')}
          className="neo-btn bg-[var(--neo-green)] text-[var(--neo-black)] px-4 py-2 text-sm disabled:opacity-50"
        >
          {loading ? '⏳' : '✅ Setujui Retur'}
        </button>
        <button
          disabled={loading}
          onClick={() => handleRespond('rejected')}
          className="neo-btn bg-[var(--neo-pink)] text-white px-4 py-2 text-sm disabled:opacity-50"
        >
          {loading ? '⏳' : '❌ Tolak Retur'}
        </button>
      </div>
    </div>
  );
}
