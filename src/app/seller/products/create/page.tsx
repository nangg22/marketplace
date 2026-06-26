import { db } from '@/lib/db';
import { products } from '@/lib/schema';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default function CreateProductPage() {
  async function handleCreate(formData: FormData) {
    'use server';
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const sellerId = (session.user as any).id;
    const name = formData.get('name') as string;
    const price = parseInt(formData.get('price') as string);
    const description = formData.get('description') as string;
    const imageUrl = formData.get('imageUrl') as string;

    await db.insert(products).values({
      sellerId,
      name,
      price,
      description,
      imageUrl: imageUrl || 'https://via.placeholder.com/300?text=No+Image', // Default image jika kosong
    });

    redirect('/seller/products');
  }

  return (
    <div className="bg-[var(--neo-bg)] min-h-screen text-[var(--neo-black)] flex flex-col">
      <Navbar />
      
      <main className="flex-grow max-w-3xl mx-auto px-4 py-10 w-full relative">
        {/* Dekorasi Latar */}
        <div className="absolute top-10 right-0 text-5xl animate-float opacity-30 select-none hidden md:block">✨</div>
        <div className="absolute bottom-20 left-0 text-4xl animate-float opacity-30 select-none hidden md:block" style={{ animationDelay: '0.8s' }}>📦</div>

        <div className="mb-6 animate-slide-up">
          <Link href="/seller/products" className="neo-link text-sm font-bold opacity-60 hover:opacity-100">
            ← Kembali ke Dashboard
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-8 animate-slide-up stagger-1">
          <span className="bg-[var(--neo-secondary)] text-white px-3 py-1 border-[3px] border-[var(--neo-black)] rounded-xl shadow-[var(--neo-shadow-sm)] text-2xl font-extrabold rotate-[-2deg]">
            ➕
          </span>
          <h1 className="text-3xl font-extrabold">Tambah Produk Baru</h1>
        </div>

        <div className="neo-card p-8 animate-slide-up stagger-2">
          <form action={handleCreate} className="space-y-6">
            <div>
              <label className="block text-sm font-extrabold mb-1.5 flex justify-between">
                <span>📌 Nama Produk</span>
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                className="neo-input"
                placeholder="Contoh: Sepatu Sneakers Neobrutalis"
              />
            </div>

            <div>
              <label className="block text-sm font-extrabold mb-1.5 flex justify-between">
                <span>💰 Harga (Rp)</span>
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold opacity-50">Rp</span>
                <input
                  type="number"
                  name="price"
                  required
                  min="0"
                  className="neo-input pl-10"
                  placeholder="250000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-extrabold mb-1.5">
                📝 Deskripsi
              </label>
              <textarea
                name="description"
                rows={4}
                className="neo-input resize-none"
                placeholder="Jelaskan produk Anda sedetail mungkin..."
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-extrabold mb-1.5">
                🖼️ URL Gambar (Opsional)
              </label>
              <input
                type="url"
                name="imageUrl"
                className="neo-input"
                placeholder="https://example.com/image.jpg"
              />
              <p className="text-xs font-semibold opacity-50 mt-1">
                Kosongkan jika Anda belum memiliki gambar. Kami akan menggunakan gambar *placeholder*.
              </p>
            </div>

            <div className="pt-4 border-t-[3px] border-dashed border-[var(--neo-black)] border-opacity-20 flex gap-4">
              <Link href="/seller/products" className="w-1/3">
                <button type="button" className="neo-btn neo-btn-outline w-full py-3.5">
                  Batal
                </button>
              </Link>
              <button type="submit" className="neo-btn neo-btn-primary flex-1 py-3.5 font-extrabold hover-wiggle">
                🚀 Terbitkan Produk
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}