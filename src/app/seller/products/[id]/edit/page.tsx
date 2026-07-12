import { db } from '@/lib/db';
import { products, categories } from '@/lib/schema';
import { eq, asc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const productId = resolvedParams.id;

  const result = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  const product = result[0];

  if (!product) redirect('/seller/products');

  const productCategories = await db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.sortOrder), asc(categories.name));

  async function handleEdit(formData: FormData) {
    'use server';
    const name = formData.get('name') as string;
    const price = parseInt(formData.get('price') as string);
    const stock = parseInt(formData.get('stock') as string);
    const description = formData.get('description') as string;
    const imageUrl = formData.get('imageUrl') as string;
    const category = (formData.get('category') as string) || 'Lainnya';
    // ✅ Checkbox: ada di formData = true, tidak ada = false
    const isAvailable = formData.get('isAvailable') === 'on';

    await db.update(products)
      .set({ name, price, stock, description, imageUrl, category, isAvailable })
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

            {/* Nama Produk */}
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

            {/* Harga + Stok — 2 kolom */}
            <div className="grid grid-cols-2 gap-4">
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

              {/* ✅ Field stok */}
              <div>
                <label className="block text-sm font-extrabold mb-1.5 flex justify-between">
                  <span>📦 Stok</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="stock"
                  required
                  min="0"
                  defaultValue={product.stock}
                  className="neo-input"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Deskripsi */}
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

            {/* URL Gambar */}
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

            {/* Kategori */}
            <div>
              <label className="block text-sm font-extrabold mb-1.5 flex justify-between">
                <span>📂 Kategori</span>
                <span className="text-red-500">*</span>
              </label>
              <select name="category" required className="neo-input" defaultValue={product.category}>
                {productCategories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* ✅ Toggle Aktif/Nonaktif */}
            <div className={`flex items-center justify-between p-4 rounded-xl border-[3px] border-[var(--neo-black)] ${product.isAvailable ? 'bg-green-50' : 'bg-gray-100'}`}>
              <div>
                <p className="font-extrabold text-sm">
                  {product.isAvailable ? '✅ Produk Aktif' : '⏸️ Produk Nonaktif'}
                </p>
                <p className="text-xs opacity-60 font-medium mt-0.5">
                  {product.isAvailable
                    ? 'Produk terlihat oleh pembeli'
                    : 'Produk disembunyikan dari pembeli'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isAvailable"
                  defaultChecked={product.isAvailable}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 border-[2px] border-[var(--neo-black)]"></div>
              </label>
            </div>

            {/* Tombol Aksi */}
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