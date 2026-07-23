'use client';

import { useState } from 'react';

type Props = {
  orderId: string;
  paymentMethod: string;
};

export default function PayNowButton({ orderId, paymentMethod }: Props) {
  const [loading, setLoading] = useState(false);

  const handlePayNow = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payment/create-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();

      if (data.redirect_url) {
        window.location.href = data.redirect_url;
      } else {
        alert(data.error || 'Gagal memproses pembayaran. Silakan coba lagi.');
        setLoading(false);
      }
    } catch {
      alert('Terjadi kesalahan. Silakan coba lagi.');
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayNow}
      disabled={loading}
      className="neo-btn neo-btn-primary text-sm py-2 px-4 disabled:opacity-50"
    >
      {loading ? '⏳ Memproses...' : `💳 Bayar Sekarang (${paymentMethod.toUpperCase()})`}
    </button>
  );
}
