import { db } from '@/lib/db';
import { products } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import DeleteButton from '@/components/DeleteButton';
import Image from 'next/image';

import { requireRole } from '@/lib/auth-guard';

export default async function SellerProductsPage() {
  const auth = await requireRole(['seller']);

  if (!auth.ok) {
    if (auth.status === 401) {
      redirect('/login');
    } else {
      redirect('/'); // Redirect if not seller
    }
  }

  const sellerId = (auth.session?.user as any).id;

  const data = await db.select().from(products).where(eq(products.sellerId, sellerId));

  async function handleDelete(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;

    const actionAuth = await requireRole(['seller']);
    if (!actionAuth.ok) return;

    const currentSellerId = (actionAuth.session?.user as any).id;

    await db.delete(products).where(
      and(eq(products.id, id), eq(products.sellerId, currentSellerId))
    );
    redirect('/seller/products');
  }

  const formatRupiah = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="bg-[var(--neo-bg)] min-h-screen flex flex-col text-[var(--neo-black)]">
      <Navbar />

      <main className="flex-grow max-w-5xl mx-auto px-4 py-10 w-full relative">
        <div className="absolute top-0 right-10 text-6xl animate-float opacity-30 select-none hidden lg:block">🏪</div>
        <div className="absolute bottom-20 left-10 text-5xl animate-float opacity-30 select-none hidden lg:block" style={{ animationDelay: '1s' }}>📦</div>

        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 animate-slide-up">
          <div>
            <h1 className="text-3xl font-extrabold flex items-center gap-3">
              <span className="bg-[var(--neo-secondary)] text-white px-3 py-1 border-[3px] border-[var(--neo-black)] rounded-xl shadow-[var(--neo-shadow-sm)] rotate-[-2deg]">
                Dashboard
              </span>
              Produk Saya
            </h1>
            <p className="font-semibold opacity-60 mt-2">
              {data.length} produk terdaftar
            </p>
          </div>

          <Link href="/seller/products/create">
            <button className="neo-btn neo-btn-primary hover-wiggle">
              <span className="text-xl">➕</span> Tambah Produk
            </button>
          </Link>
        </div>

        {data.length === 0 ? (
          <div className="neo-card p-12 text-center animate-slide-up stagger-1">
            <div className="text-6xl mb-4 animate-bounce-in">📭</div>
            <h2 className="text-xl font-bold mb-2">Toko Anda Masih Kosong</h2>
            <p className="opacity-60 mb-6 font-medium">Belum ada produk yang dijual. Ayo tambahkan sekarang!</p>
            <Link href="/seller/products/create">
              <button className="neo-btn neo-btn-accent">Mulai Jualan</button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up stagger-1">
            {data.map((item, index) => (
              <div key={item.id} className={`neo-card flex flex-col overflow-hidden hover-lift stagger-${Math.min(index + 1, 12)}`}>

                {/* ✅ Thumbnail Produk */}
                <div className="relative w-full h-48 bg-[var(--neo-gray)] border-b-[3px] border-[var(--neo-black)]">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    // Placeholder kalau belum ada gambar
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 opacity-40">
                      <span className="text-4xl">📦</span>
                      <span className="text-xs font-semibold">Belum ada foto</span>
                    </div>
                  )}

                  {/* Badge status aktif/nonaktif */}
                  <div className="absolute top-2 left-2">
                    {item.isAvailable ? (
                      <span className="neo-sticker bg-green-400 text-xs text-white px-2 py-1">
                        ✅ Aktif
                      </span>
                    ) : (
                      <span className="neo-sticker bg-gray-400 text-xs text-white px-2 py-1">
                        ⏸️ Nonaktif
                      </span>
                    )}
                  </div>
                </div>

                {/* Konten Card */}
                <div className="flex flex-col flex-grow p-5">
                  <h2 className="font-bold text-lg leading-tight line-clamp-2 mb-3">
                    {item.name}
                  </h2>

                  {/* Harga */}
                  <div className="bg-[var(--neo-gray)] border-[2px] border-[var(--neo-black)] rounded-lg px-3 py-2 mb-3 inline-block font-extrabold text-[var(--neo-black)] shadow-[2px_2px_0px_var(--neo-black)]">
                    {formatRupiah(item.price)}
                  </div>

                  {/* ✅ Info stok + rating */}
                  <div className="flex items-center gap-3 mb-4 text-sm font-semibold opacity-70">
                    <span>📦 Stok: {item.stock}</span>
                    {item.ratingCount > 0 && (
                      <span>⭐ {item.rating.toFixed(1)} ({item.ratingCount})</span>
                    )}
                  </div>

                  {/* Tombol Aksi */}
                  <div className="flex gap-2 mt-auto">
                    <Link href={`/seller/products/${item.id}/edit`} className="flex-1">
                      <button className="neo-btn neo-btn-outline w-full py-2 text-sm">✏️ Edit</button>
                    </Link>
                    <div className="flex-1">
                      <DeleteButton
                        productId={item.id}
                        productName={item.name}
                        action={handleDelete}
                      />
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}