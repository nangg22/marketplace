'use client';

import { useState } from 'react';
import Link from 'next/link';
import ProductImageUploader from '@/components/ProductImageUploader';
import { addProductAction } from '../actions';
import "@uploadthing/react/styles.css";

const CONDITIONS = [
  { value: 'baru',         emoji: '✨', label: 'Baru',         desc: 'Belum pernah dipakai, masih tersegel', color: 'bg-[var(--neo-accent)] text-[var(--neo-black)]' },
  { value: 'like_new',     emoji: '💎', label: 'Like New',     desc: 'Pernah dipakai 1-2x, mulus banget',    color: 'bg-[#7B4AE2] text-white' },
  { value: 'minus_ringan', emoji: '⚠️', label: 'Minus Ringan', desc: 'Ada cacat kecil, masih layak pakai',   color: 'bg-[#FF6B35] text-white' },
  { value: 'minus_berat',  emoji: '💀', label: 'Minus Berat',  desc: 'Perlu perbaikan, dijual apa adanya',   color: 'bg-[var(--neo-black)] text-white' },
];

const CATEGORIES = [
  { value: 'Tech',    emoji: '💻', label: 'Tech & Gadget' },
  { value: 'Fashion', emoji: '🧥', label: 'Thrift Fashion' },
  { value: 'Kosan',   emoji: '🪑', label: 'Kosan Starter' },
  { value: 'Hobi',    emoji: '🎸', label: 'Hobi & Fandom' },
  { value: 'Buku',    emoji: '📚', label: 'Buku & Alat Tulis' },
  { value: 'Lainnya', emoji: '📦', label: 'Lainnya' },
];

export default function CreateProductPage() {
  const [images, setImages] = useState<{ url: string; isPrimary: boolean }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [condition, setCondition] = useState('baru');
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [category, setCategory] = useState('Lainnya');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (images.length === 0) {
      const msg = document.createElement('div');
      msg.textContent = '⚠️ Wajib upload foto produk minimal 1!';
      msg.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 bg-[var(--neo-black)] text-[var(--neo-accent)] font-extrabold text-sm px-5 py-3 rounded-xl border-[3px] border-[var(--neo-accent)] shadow-lg z-[200]';
      document.body.appendChild(msg);
      setTimeout(() => msg.remove(), 3000);
      return;
    }
    const formData = new FormData(e.currentTarget);
    formData.append('images', JSON.stringify(images));
    formData.set('condition', condition);
    formData.set('isNegotiable', String(isNegotiable));
    formData.set('category', category);
    await addProductAction(formData);
  };

  return (
    <div className="min-h-screen bg-[var(--neo-bg)]">
      {/* Header */}
      <div className="bg-[var(--neo-accent)] border-b-[4px] border-[var(--neo-black)] py-5 px-4 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-extrabold text-[var(--neo-black)] flex items-center gap-2">
            <span className="bg-[var(--neo-black)] text-[var(--neo-accent)] p-2 rounded-xl rotate-[-2deg] text-sm">📸</span>
            Post Barang Preloved
          </h1>
          <Link href="/seller/products" className="neo-btn neo-btn-outline text-sm py-1.5 px-4">
            ← Batal
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">

        {/* FOTO PRODUK */}
        <div className="neo-card p-5">
          <h2 className="font-extrabold text-lg mb-1 flex items-center gap-2">
            <span className="bg-[var(--neo-primary)] text-white rounded-lg p-1 text-xs">1</span>
            Foto Produk
          </h2>
          <p className="text-xs text-[var(--neo-black)] opacity-60 mb-4">Upload hingga 5 foto. Foto pertama jadi cover. Max 4MB.</p>
          <div className="bg-[var(--neo-gray)] border-[3px] border-dashed border-[var(--neo-black)] rounded-xl p-4 min-h-[140px]">
            <ProductImageUploader images={images} onChange={setImages} />
          </div>
        </div>

        {/* INFO DASAR */}
        <div className="neo-card p-5 flex flex-col gap-4">
          <h2 className="font-extrabold text-lg flex items-center gap-2">
            <span className="bg-[var(--neo-primary)] text-white rounded-lg p-1 text-xs">2</span>
            Info Barang
          </h2>

          <div>
            <label className="block font-bold text-sm mb-1.5 text-[var(--neo-black)]">Nama Barang <span className="text-[var(--neo-primary)]">*</span></label>
            <input
              name="name" required
              placeholder="Contoh: iPhone 12 Pro 256GB Mulus"
              className="neo-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-sm mb-1.5 text-[var(--neo-black)]">Harga (Rp) <span className="text-[var(--neo-primary)]">*</span></label>
              <input
                name="price" type="number" required min={0}
                placeholder="850000"
                className="neo-input"
              />
            </div>
            <div>
              <label className="block font-bold text-sm mb-1.5 text-[var(--neo-black)]">Stok</label>
              <input
                name="stock" type="number" min={1} defaultValue={1}
                className="neo-input"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-sm mb-1.5 text-[var(--neo-black)]">Deskripsi</label>
            <textarea
              name="description" rows={3}
              placeholder="Ceritakan kondisi barang, alasan jual, kelengkapan, dll..."
              className="neo-input resize-none"
            />
          </div>
        </div>

        {/* KONDISI */}
        <div className="neo-card p-5">
          <h2 className="font-extrabold text-lg mb-1 flex items-center gap-2">
            <span className="bg-[var(--neo-primary)] text-white rounded-lg p-1 text-xs">3</span>
            Kondisi Barang
          </h2>
          <p className="text-xs text-[var(--neo-black)] opacity-60 mb-4">Jujur soal kondisi = pembeli lebih percaya!</p>
          <div className="grid grid-cols-2 gap-3">
            {CONDITIONS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCondition(c.value)}
                className={`flex flex-col gap-1 p-4 rounded-xl border-[3px] text-left transition-all duration-150 ${
                  condition === c.value
                    ? `${c.color} border-[var(--neo-black)] shadow-[4px_4px_0px_var(--neo-black)] scale-[0.98]`
                    : 'bg-white border-[var(--neo-black)] opacity-60 hover:opacity-90'
                }`}
              >
                <span className="text-2xl">{c.emoji}</span>
                <span className="font-extrabold text-sm leading-tight">{c.label}</span>
                <span className="text-[10px] opacity-80 font-medium leading-tight">{c.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* KATEGORI */}
        <div className="neo-card p-5">
          <h2 className="font-extrabold text-lg mb-1 flex items-center gap-2">
            <span className="bg-[var(--neo-primary)] text-white rounded-lg p-1 text-xs">4</span>
            Kategori
          </h2>
          <div className="flex flex-wrap gap-2 mt-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`neo-btn text-xs py-2 px-3 flex items-center gap-1.5 ${
                  category === cat.value ? 'neo-btn-primary' : 'neo-btn-outline'
                }`}
              >
                <span>{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* NEGO */}
        <div className="neo-card p-5">
          <h2 className="font-extrabold text-lg mb-1 flex items-center gap-2">
            <span className="bg-[var(--neo-primary)] text-white rounded-lg p-1 text-xs">5</span>
            Harga Bisa Nego?
          </h2>
          <div className="flex gap-3 mt-3">
            <button
              type="button"
              onClick={() => setIsNegotiable(true)}
              className={`neo-btn flex-1 py-3 text-sm ${isNegotiable ? 'neo-btn-secondary' : 'neo-btn-outline'}`}
            >
              🤝 Boleh Nego
            </button>
            <button
              type="button"
              onClick={() => setIsNegotiable(false)}
              className={`neo-btn flex-1 py-3 text-sm ${!isNegotiable ? 'neo-btn-primary' : 'neo-btn-outline'}`}
            >
              🔒 Harga Fix
            </button>
          </div>
        </div>

        {/* SUBMIT */}
        <button
          type="submit"
          disabled={isUploading}
          className={`neo-btn w-full text-lg font-extrabold py-5 mt-2 ${
            isUploading
              ? 'neo-btn-outline opacity-50 cursor-not-allowed'
              : 'neo-btn-accent'
          }`}
        >
          {isUploading ? '⏳ Mengupload...' : '🚀 Post Sekarang!'}
        </button>
      </form>
    </div>
  );
}