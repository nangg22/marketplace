"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPost, getMyProducts } from "../actions";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function CreatePostPage() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [productId, setProductId] = useState("");
  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProducts() {
      const res = await getMyProducts();
      if (res.success && res.products) {
        setMyProducts(res.products);
      }
    }
    loadProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError("Caption tidak boleh kosong");
      return;
    }
    
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("content", content);
    if (imageUrl) formData.append("imageUrl", imageUrl);
    if (productId) formData.append("productId", productId);

    const res = await createPost(formData);
    
    if (res.success) {
      router.push("/explore");
    } else {
      setError(res.error || "Gagal membuat postingan");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--neo-bg)]">
      <Navbar />

      <main className="flex-grow max-w-2xl mx-auto px-4 py-8 w-full animate-slide-up">
        <h1 className="text-3xl font-extrabold mb-6 border-b-[4px] border-[var(--neo-black)] pb-4 flex items-center gap-3">
          <span className="bg-[var(--neo-black)] text-[var(--neo-accent)] p-2 rounded-xl text-2xl rotate-[-3deg]">✍️</span>
          Buat Postingan
        </h1>

        <form onSubmit={handleSubmit} className="neo-card flex flex-col gap-5">
          {/* Gambar URL (Bisa juga dibikin upload file, tapi untuk MVP pakai URL) */}
          <div>
            <label className="block text-sm font-extrabold mb-2 text-[var(--neo-black)]">Foto URL (Opsional)</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://contoh.com/foto.jpg"
              className="neo-input w-full"
            />
            {imageUrl && (
              <div className="mt-3 border-[3px] border-[var(--neo-black)] rounded-xl overflow-hidden max-h-64 relative">
                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Caption */}
          <div>
            <label className="block text-sm font-extrabold mb-2 text-[var(--neo-black)]">Caption Cerita / Ulasan *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Ceritain OOTD kamu hari ini, atau alasan kamu merekomendasikan barang ini..."
              rows={5}
              className="neo-input w-full resize-none"
              required
            />
          </div>

          {/* Product Tagger */}
          {myProducts.length > 0 && (
            <div>
              <label className="block text-sm font-extrabold mb-2 text-[var(--neo-black)] flex items-center gap-2">
                <span>🏷️</span> Tag Produk Jualanmu (Opsional)
              </label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="neo-input w-full bg-white"
              >
                <option value="">-- Pilih Produk untuk Di-tag --</option>
                {myProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <p className="text-xs font-bold opacity-60 mt-2">
                Orang lain bisa langsung klik dan beli produk ini dari postinganmu!
              </p>
            </div>
          )}

          {error && <div className="text-red-500 font-bold text-sm bg-red-100 p-3 rounded border-[2px] border-red-500">{error}</div>}

          <div className="pt-4 border-t-[3px] border-dashed border-[var(--neo-black)]/20 flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="neo-btn neo-btn-outline flex-1 font-bold"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="neo-btn neo-btn-primary flex-1 font-extrabold text-white"
            >
              {loading ? "Memposting..." : "Kirim Postingan"}
            </button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}
