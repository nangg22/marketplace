"use client";

import { useState } from "react";

export default function RefundRequestForm({ orderId }: { orderId: string }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch("/api/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, reason }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Terjadi kesalahan saat mengajukan retur");
      }
      
      setDone(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="neo-card p-4 bg-[var(--neo-green)]/20 animate-slide-up">
        <p className="text-sm font-bold text-[var(--neo-black)] flex items-center gap-2">
          <span>✅</span> Pengajuan retur berhasil dikirim, tunggu respons penjual.
        </p>
      </div>
    );
  }

  return (
    <div className="neo-card p-6 bg-white animate-slide-up">
      <h3 className="font-extrabold text-lg mb-4 flex items-center gap-2">
        <span>↩️</span> Ajukan Retur / Refund
      </h3>
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 text-sm font-bold rounded-lg border-2 border-red-800">
          ❌ {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-extrabold mb-2">Alasan Retur (Min. 20 Karakter)</label>
          <textarea
            required
            minLength={20}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Jelaskan secara detail alasan barang diretur..."
            className="neo-input w-full"
            rows={4}
          />
        </div>
        <button 
          disabled={loading} 
          className="neo-btn neo-btn-secondary w-full sm:w-auto"
        >
          {loading ? "⏳ Mengirim..." : "Ajukan Retur"}
        </button>
      </form>
    </div>
  );
}
