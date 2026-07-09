import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductsCard from '@/components/ProductCard';
import { db } from '@/lib/db';
import { products, users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function HomePage() {
  // Join produk dengan nama seller
  const realProducts = await db
    .select({
      id: products.id,
      name: products.name,
      price: products.price,
      imageUrl: products.imageUrl,
      sellerName: users.name,
    })
    .from(products)
    .leftJoin(users, eq(products.sellerId, users.id))
    .where(eq(products.isSuspended, false));

  // Cek session untuk tombol "Mulai Jualan"
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  // Tombol Mulai Jualan:
  // - Jika sudah login sebagai Penjual → langsung ke produk penjual
  // - Selain itu (belum login / login sebagai Pembeli) → ke halaman login tab Penjual
  const mulaiJualanHref = role === 'seller' ? '/seller/products' : '/login?tab=seller';
  const mulaiJualanLabel = role === 'seller' ? '🏪 Kelola Toko' : '🔐 Mulai Jualan';

  return (
    <div className="flex flex-col min-h-screen bg-[var(--neo-bg)]">
      <Navbar />

      <main className="flex-grow">
        {/* === HERO BANNER === */}
        <section className="relative overflow-hidden bg-[var(--neo-secondary)] border-b-[4px] border-[var(--neo-black)]">
          <div className="absolute inset-0 neo-dots-pattern" />

          <div className="absolute top-6 left-10 text-4xl animate-float opacity-80 select-none hidden lg:block">⭐</div>
          <div className="absolute top-12 right-16 text-3xl animate-float opacity-70 select-none hidden lg:block" style={{ animationDelay: '1s' }}>🎯</div>
          <div className="absolute bottom-8 left-1/4 text-2xl animate-float opacity-60 select-none hidden lg:block" style={{ animationDelay: '0.5s' }}>💎</div>
          <div className="absolute bottom-6 right-1/3 text-3xl animate-spin-slow opacity-50 select-none hidden lg:block">✦</div>

          <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-20 text-center">
            <div className="flex justify-center mb-6 animate-bounce-in">
              <span className="neo-sticker bg-[var(--neo-accent)] text-[var(--neo-black)] text-sm rotate-[-3deg]">
                🎉 Tugas Akhir — Live Demo
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 leading-tight animate-slide-up">
              Selamat Datang di{' '}
              <span className="inline-block bg-[var(--neo-primary)] px-3 py-1 border-[3px] border-[var(--neo-black)] rounded-xl shadow-[var(--neo-shadow)] rotate-[1deg] hover:rotate-[-1deg] transition-transform duration-300">
                MallPedia
              </span>
            </h1>

            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-8 animate-slide-up stagger-2 font-medium">
              Temukan <span className="text-[var(--neo-accent)] font-bold">ribuan produk pilihan</span> dari penjual terpercaya.
              <br />
              Harga termurah, gratis ongkir, dan garansi uang kembali — belanja tanpa ragu! 🔥
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap justify-center gap-4 animate-slide-up stagger-3">
              <a href="#etalase" className="neo-btn neo-btn-accent text-base px-8 py-3 font-extrabold">
                🛍️ Lihat Produk
              </a>
              {/* ✅ Dinamis berdasarkan role */}
              <a href={mulaiJualanHref} className="neo-btn neo-btn-outline text-base px-8 py-3 font-extrabold">
                {mulaiJualanLabel}
              </a>
            </div>
          </div>
        </section>

        {/* === MARQUEE RUNNING TEXT === */}
        <div className="bg-[var(--neo-accent)] border-b-[3px] border-[var(--neo-black)] overflow-hidden py-2">
          <div className="animate-marquee whitespace-nowrap flex">
            {[...Array(2)].map((_, i) => (
              <span key={i} className="text-sm font-extrabold text-[var(--neo-black)] tracking-wide mx-8">
                ⭐ GRATIS ONGKIR &nbsp;&nbsp; 🔥 FLASH SALE &nbsp;&nbsp; 💎 PRODUK ORIGINAL &nbsp;&nbsp; 🎁 CASHBACK 50% &nbsp;&nbsp; 🚀 PENGIRIMAN CEPAT &nbsp;&nbsp; ✨ DISKON SPESIAL &nbsp;&nbsp;
                ⭐ GRATIS ONGKIR &nbsp;&nbsp; 🔥 FLASH SALE &nbsp;&nbsp; 💎 PRODUK ORIGINAL &nbsp;&nbsp; 🎁 CASHBACK 50% &nbsp;&nbsp; 🚀 PENGIRIMAN CEPAT &nbsp;&nbsp; ✨ DISKON SPESIAL &nbsp;&nbsp;
              </span>
            ))}
          </div>
        </div>

        {/* === ETALASE PRODUK === */}
        <section id="etalase" className="relative py-12 md:py-16">
          <div className="absolute inset-0 neo-grid-pattern" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              href="/products"
              className="group inline-block cursor-pointer"
              aria-label="Buka halaman semua produk">
              <div className="flex items-center gap-4 transition-transform duration-200 group-hover:scale-[1.03]">
                <div className="border-[3px] border-[var(--neo-black)] bg-[var(--neo-primary)] rounded-xl p-3 shadow-[var(--neo-shadow-sm)] rotate-[-4deg] group-hover:rotate-0 transition-transform duration-200">
                  🛍️
                </div>
                <div>
                  <h2 className="text-3xl font-extrabold group-hover:underline">
                    Etalase Produk
                  </h2>
                  <p className="text-sm font-semibold text-[var(--neo-black)] opacity-50">
                    {realProducts.length} produk tersedia
                  </p>
                </div>
              </div>
            </Link>

            <div className="flex gap-2 flex-wrap mt-4 mb-2">
              <Link href="/products" className="neo-btn neo-btn-primary text-xs py-1.5 px-3">🔥 Semua</Link>
              <Link href="/products?category=Elektronik" className="neo-btn neo-btn-outline text-xs py-1.5 px-3">📱 Elektronik</Link>
              <Link href="/products?category=Fashion+Pria" className="neo-btn neo-btn-outline text-xs py-1.5 px-3">👔 Fashion Pria</Link>
              <Link href="/products?category=Fashion+Wanita" className="neo-btn neo-btn-outline text-xs py-1.5 px-3">👗 Fashion Wanita</Link>
              <Link href="/products?category=Rumah+Tangga" className="neo-btn neo-btn-outline text-xs py-1.5 px-3">🏠 Rumah Tangga</Link>
              <Link href="/products?sort=cheapest" className="neo-btn neo-btn-outline text-xs py-1.5 px-3">💰 Termurah</Link>
            </div>

            <div className="neo-zigzag mb-8" />

            {realProducts.length === 0 ? (
              <div className="neo-card text-center py-16 px-6">
                <div className="text-6xl mb-4 animate-float">🛒</div>
                <h3 className="text-xl font-extrabold text-[var(--neo-black)] mb-2">Belum Ada Produk</h3>
                <p className="text-sm font-medium text-[var(--neo-black)] opacity-50 mb-6">
                  Silakan tambahkan dari dashboard penjual.
                </p>
                <a href="/seller/products" className="neo-btn neo-btn-secondary">➕ Tambah Produk</a>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                {realProducts.map((product, i) => (
                  <ProductsCard key={product.id} product={product} index={i} />
                ))}
              </div>
            )}
          </div>
        </section>
        <Footer />
      </main>
    </div>
  );
}