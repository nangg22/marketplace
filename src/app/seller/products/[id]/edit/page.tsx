import { db } from '@/lib/db';
import { products, categories } from '@/lib/schema';
import { eq, asc, and } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { requireRole } from '@/lib/auth-guard';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(['seller']);
  if (!auth.ok) {
    redirect(auth.status === 401 ? '/login' : '/');
  }
  const sellerId = (auth.session?.user as any).id;

  const resolvedParams = await params;
  const productId = resolvedParams.id;

  const result = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  const product = result[0];

  // Pastikan produk ada dan milik seller ini
  if (!product || product.sellerId !== sellerId) redirect('/seller/products');

  const productCategories = await db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.sortOrder), asc(categories.name));

  async function handleEdit(formData: FormData) {
    'use server';
    const name = (formData.get('name') as string)?.trim();
    const price = parseInt(formData.get('price') as string);
    const stock = parseInt(formData.get('stock') as string);
    const description = formData.get('description') as string;
    const imageUrl = formData.get('imageUrl') as string;
    const category = (formData.get('category') as string) || 'Lainnya';
    const isAvailable = formData.get('isAvailable') === 'on';
    const isNegotiable = formData.get('isNegotiable') === 'on';
    const condition = (formData.get('condition') as 'baru' | 'like_new' | 'minus_ringan' | 'minus_berat') || 'baru';

    // Validasi server-side
    if (!name || name.length < 3) throw new Error('Nama produk minimal 3 karakter.');
    if (!Number.isFinite(price) || price < 100) throw new Error('Harga minimal Rp 100.');
    if (price > 500_000_000) throw new Error('Harga maksimal Rp 500.000.000.');
    if (!Number.isFinite(stock) || stock < 0) throw new Error('Stok tidak boleh negatif.');
    if (stock > 10_000) throw new Error('Stok maksimal 10.000.');

    const actionAuth = await requireRole(['seller']);
    if (!actionAuth.ok) return;
    const currentSellerId = (actionAuth.session?.user as any).id;

    await db.update(products)
      .set({ name, price, stock, description, imageUrl, category, isAvailable, isNegotiable, condition })
      .where(and(eq(products.id, productId), eq(products.sellerId, currentSellerId)));

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

            {/* Kondisi Barang */}
            <div className="neo-card p-4">
              <label className="block text-sm font-extrabold mb-3">🔍 Kondisi Barang</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'baru', label: '✨ Baru', desc: 'Belum pernah dipakai' },
                  { value: 'like_new', label: '💎 Like New', desc: 'Mulus 99%' },
                  { value: 'minus_ringan', label: '⚠️ Minus Ringan', desc: 'Ada cacat kecil' },
                  { value: 'minus_berat', label: '💀 Minus Berat', desc: 'Perlu perbaikan' },
                ].map((c) => (
                  <label key={c.value} className="flex flex-col gap-1 p-3 rounded-xl border-[2px] border-[var(--neo-black)] bg-white cursor-pointer hover:bg-[var(--neo-gray)] transition-colors">
                    <div className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name="condition" 
                        value={c.value} 
                        defaultChecked={product.condition === c.value || (!product.condition && c.value === 'baru')}
                        className="w-4 h-4 text-[var(--neo-primary)] focus:ring-[var(--neo-black)] border-[2px] border-[var(--neo-black)]" 
                      />
                      <span className="font-extrabold text-sm">{c.label}</span>
                    </div>
                    <span className="text-[10px] font-medium opacity-60 ml-6">{c.desc}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Nego Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl border-[3px] border-[var(--neo-black)] bg-[var(--neo-pink)] text-white">
              <div>
                <p className="font-extrabold text-sm">🤝 Harga Bisa Nego?</p>
                <p className="text-xs opacity-80 font-medium mt-0.5">Aktifkan agar pembeli bisa tawar harga</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isNegotiable"
                  defaultChecked={product.isNegotiable ?? false}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-[var(--neo-black)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--neo-accent)] border-[2px] border-white shadow-[2px_2px_0px_var(--neo-black)]"></div>
              </label>
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