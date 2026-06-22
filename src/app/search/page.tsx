import { db } from '@/lib/db';
import { products } from '@/lib/schema';
import { ilike } from 'drizzle-orm';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductsCard from '@/components/ProductCard';
import Link from 'next/link';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q: string }>;
}) {
  const resolvedParams = await searchParams;
  const q = resolvedParams.q || '';

  // Query database: jika ada kata kunci pencarian, gunakan ilike, jika kosong ambil semua
  const searchResults = q
    ? await db.select().from(products).where(ilike(products.name, `%${q}%`))
    : await db.select().from(products);

  return (
    <div className="flex flex-col min-h-screen bg-[var(--neo-bg)]">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full relative">
        <div className="mb-6 animate-slide-up">
          <Link href="/" className="neo-link text-sm font-bold opacity-60 hover:opacity-100">
            ← Kembali ke Beranda
          </Link>
        </div>

        <div className="flex items-center gap-4 mb-8 animate-slide-up stagger-1">
          <span className="bg-[var(--neo-primary)] text-white px-3 py-1 border-[3px] border-[var(--neo-black)] rounded-xl shadow-[var(--neo-shadow-sm)] text-3xl font-extrabold rotate-[2deg]">
            🔍
          </span>
          <div>
            <h1 className="text-3xl font-extrabold">Hasil Pencarian</h1>
            <p className="font-semibold opacity-70 mt-1 text-lg">
              Untuk: <span className="text-[var(--neo-primary)] underline decoration-wavy decoration-2">"{q}"</span>
            </p>
          </div>
        </div>

        {/* Form Search Ulang untuk Mobile */}
        <div className="md:hidden mb-8 animate-slide-up stagger-1">
          <form action="/search" method="GET" className="relative flex">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Cari lagi..."
              className="neo-input pr-20"
            />
            <button
              type="submit"
              className="absolute right-1 top-1 bottom-1 px-4 bg-[var(--neo-accent)] border-[2px] border-[var(--neo-black)] rounded-lg font-bold text-sm hover-wiggle"
            >
              Cari
            </button>
          </form>
        </div>

        <div className="neo-zigzag mb-8 opacity-20" />

        {searchResults.length === 0 ? (
          <div className="neo-card text-center py-16 px-6 animate-slide-up stagger-2">
            <div className="text-6xl mb-4 animate-float">🤷‍♂️</div>
            <h3 className="text-2xl font-extrabold text-[var(--neo-black)] mb-2">
              Waduh, barangnya nggak ketemu!
            </h3>
            <p className="text-base font-medium text-[var(--neo-black)] opacity-60 mb-8 max-w-md mx-auto">
              Coba cari pakai kata kunci lain atau lihat semua produk yang tersedia.
            </p>
            <Link href="/products">
              <button className="neo-btn neo-btn-secondary px-8 py-3 text-lg font-extrabold hover-wiggle">
                📦 Lihat Semua Produk
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {searchResults.map((product, i) => (
              <ProductsCard key={product.id} product={product} index={i} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
