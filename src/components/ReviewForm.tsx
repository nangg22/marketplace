"use client";

import { useState } from "react";
import StarRating from "./StarRating";

export default function ReviewForm({
  productId,
  onSubmitted,
}: {
  productId: string;
  onSubmitted?: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Pilih rating dulu ya");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, rating, title, reviewText }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Gagal mengirim review");
      return;
    }

    setRating(0);
    setTitle("");
    setReviewText("");
    setSuccess(true);
    onSubmitted?.();
  }

  if (success) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
        ✅ Review kamu berhasil dikirim! Terima kasih.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-gray-200 p-4">
      <p className="font-medium text-sm">Beri Rating &amp; Review</p>
      <StarRating value={rating} onChange={setRating} size={24} />
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Judul review (opsional)"
        className="w-full rounded-md border border-gray-300 p-2 text-sm"
        maxLength={150}
      />
      <textarea
        value={reviewText}
        onChange={(e) => setReviewText(e.target.value)}
        placeholder="Bagaimana pendapatmu soal produk ini?"
        className="w-full rounded-md border border-gray-300 p-2 text-sm"
        rows={3}
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-black px-4 py-2 text-white text-sm disabled:opacity-50"
      >
        {loading ? "Mengirim..." : "Kirim Review"}
      </button>
    </form>
  );
}