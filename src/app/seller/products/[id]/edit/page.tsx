import { db } from '@/lib/db';
import { products } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const productId = resolvedParams.id;

  // Ambil data produk dari database
  const result = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  const product = result[0];

  // Jika produk tidak ditemukan
  if (!product) {
    redirect('/seller/products');
  }

  async function handleEdit(formData: FormData) {
    'use server';
    const name = formData.get('name') as string;
    const price = parseInt(formData.get('price') as string);
    const description = formData.get('description') as string;
    const imageUrl = formData.get('imageUrl') as string;

    await db.update(products)
      .set({ name, price, description, imageUrl })
      .where(eq(products.id, productId));

    redirect('/seller/products');
  }

  return (
    <div className="bg-[var(--neo-bg)] min-h-screen text-[var(--neo-black)] flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-3xl mx-auto px-4 py-10 w-full relative">
        <div className="absolute top-10 right-0 text-5xl animate-float opacity-30 select-none hidden md:block">✏️</div>

        <div className="mb-6 animate-slide-up">
          <Link href="/seller/products" className="neo-link text-sm font-bold opacity-60 hover:opacity-100">
            ← Kembali ke Dashboard
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-8 animate-slide-up stagger-1">
          <span className="bg-[var(--neo-accent)] text-[var(--neo-black)] px-3 py-1 border-[3px] border-[var(--neo-black)] rounded-xl shadow-[var(--neo-shadow-sm)] text-2xl font-extrabold rotate-[2deg]">
            ✏️
          </span>
          <h1 className="text-3xl font-extrabold">Edit Produk</h1>
        </div>

        <div className="neo-card p-8 animate-slide-up stagger-2">
          <form action={handleEdit} className="space-y-6">
            <div>
              <label className="block text-sm font-extrabold mb-1.5 flex justify-between">
                <span>📌 Nama Produk</span>
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                defaultValue={product.name}
                className="neo-input"
                placeholder="Nama produk..."
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
                  defaultValue={product.price}
                  className="neo-input pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-extrabold mb-1.5">📝 Deskripsi</label>
              <textarea
                name="description"
                rows={4}
                defaultValue={product.description ?? ''}
                className="neo-input resize-none"
                placeholder="Deskripsi produk..."
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-extrabold mb-1.5">🖼️ URL Gambar</label>
              <input
                type="url"
                name="imageUrl"
                defaultValue={product.imageUrl ?? ''}
                className="neo-input"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="pt-4 border-t-[3px] border-dashed border-[var(--neo-black)] border-opacity-20 flex gap-4">
              <Link href="/seller/products" className="w-1/3">
                <button type="button" className="neo-btn neo-btn-outline w-full py-3.5">
                  Batal
                </button>
              </Link>
              <button type="submit" className="neo-btn neo-btn-accent flex-1 py-3.5 font-extrabold hover-wiggle">
                💾 Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
