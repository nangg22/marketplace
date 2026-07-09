import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductsCard from '@/components/ProductCard';
import { db } from '@/lib/db';
import { products, users } from '@/lib/schema';
import { ilike, eq, asc, desc, and } from 'drizzle-orm';
import Link from 'next/link';

export const CATEGORIES = [
  { label: 'Semua', icon: '🛍️', value: '' },
  { label: 'Elektronik', icon: '📱', value: 'Elektronik' },
  { label: 'Fashion Pria', icon: '👔', value: 'Fashion Pria' },
  { label: 'Fashion Wanita', icon: '👗', value: 'Fashion Wanita' },
  { label: 'Fashion Anak & Bayi', icon: '🧒', value: 'Fashion Anak & Bayi' },
  { label: 'Rumah Tangga', icon: '🏠', value: 'Rumah Tangga' },
  { label: 'Dapur', icon: '🍳', value: 'Dapur' },
  { label: 'Buku', icon: '📚', value: 'Buku' },
  { label: 'Olahraga', icon: '⚽', value: 'Olahraga' },
  { label: 'Kecantikan', icon: '💄', value: 'Kecantikan' },
  { label: 'Mainan', icon: '🧸', value: 'Mainan' },
  { label: 'Otomotif', icon: '🚗', value: 'Otomotif' },
  { label: 'Lainnya', icon: '📦', value: 'Lainnya' },
];

export default async function AllProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string; q?: string }>;
}) {
  const params = await searchParams;
  const activeCategory = params.category || '';
  const sort = params.sort || 'newest';
  const q = params.q || '';

  // Build query — exclude produk yang di-suspend admin
  const baseSelect = db
    .select({
      id: products.id,
      name: products.name,
      price: products.price,
      imageUrl: products.imageUrl,
      category: products.category,
      createdAt: products.createdAt,
      sellerName: users.name,
    })
    .from(products)
    .leftJoin(users, eq(products.sellerId, users.id));

  let query = baseSelect.where(eq(products.isSuspended, false)).$dynamic();

  if (activeCategory) {
    query = query.where(and(eq(products.isSuspended, false), eq(products.category, activeCategory)));
  }
  if (q) {
    query = query.where(and(eq(products.isSuspended, false), ilike(products.name, `%${q}%`)));
  }

  if (sort === 'cheapest') {
    query = query.orderBy(asc(products.price));
  } else if (sort === 'expensive') {
    query = query.orderBy(desc(products.price));
  } else {
    query = query.orderBy(desc(products.createdAt));
  }

  const allProducts = await query;

  const activeCategoryLabel =
    CATEGORIES.find((c) => c.value === activeCategory)?.label || 'Semua';

  return (
    <div className="flex flex-col min-h-screen bg-[var(--neo-bg)]">
      <Navbar />

      <main className="flex-grow">
        {/* Banner */}
        <section className="bg-[var(--neo-pink)] border-b-[4px] border-[var(--neo-black)] py-10 relative overflow-hidden">
          <div className="absolute inset-0 neo-dots-pattern" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Search bar mobile */}
            <form action="/products" method="GET" className="flex gap-2 max-w-xl mx-auto mb-6">
              {activeCategory && (
                <input type="hidden" name="category" value={activeCategory} />
              )}
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="🔍 Cari produk..."
                className="neo-input flex-1 bg-white"
              />
              <button type="submit" className="neo-btn neo-btn-primary px-5 font-extrabold">
                Cari
              </button>
            </form>

            <div className="text-center animate-slide-up">
              <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--neo-black)] mb-2">
                {q ? (
                  <>Hasil untuk: <span className="text-white bg-[var(--neo-primary)] px-2 border-[2px] border-[var(--neo-black)] rounded">&quot;{q}&quot;</span></>
                ) : activeCategory ? (
                  <>{CATEGORIES.find(c => c.value === activeCategory)?.icon} {activeCategoryLabel}</>
                ) : (
                  <>Jelajahi <span className="text-white bg-[var(--neo-primary)] px-2 border-[2px] border-[var(--neo-black)] rounded inline-block rotate-[-1deg]">Semua Produk</span></>
                )}
              </h1>
              <p className="text-sm font-bold text-[var(--neo-black)] opacity-70">
                {allProducts.length} produk ditemukan
              </p>
            </div>
          </div>
        </section>

        {/* Main layout: sidebar + grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-6 items-start">

            {/* ===== SIDEBAR KATEGORI ===== */}
            <aside className="hidden lg:block w-52 flex-shrink-0">
              <div className="neo-card p-0 overflow-hidden sticky top-24">
                <div className="bg-[var(--neo-secondary)] text-white px-4 py-3 border-b-[3px] border-[var(--neo-black)]">
                  <h3 className="font-extrabold text-sm uppercase tracking-wider">📂 Kategori</h3>
                </div>
                <nav className="divide-y-[2px] divide-dashed divide-[var(--neo-black)]/20">
                  {CATEGORIES.map((cat) => {
                    const isActive = activeCategory === cat.value;
                    return (
                      <Link
                        key={cat.value}
                        href={`/products${cat.value ? `?category=${encodeURIComponent(cat.value)}` : ''}${sort !== 'newest' ? `${cat.value ? '&' : '?'}sort=${sort}` : ''}`}
                        className={`flex items-center gap-2.5 px-4 py-3 text-sm font-bold transition-colors duration-150
                          ${isActive
                            ? 'bg-[var(--neo-accent)] text-[var(--neo-black)]'
                            : 'hover:bg-[var(--neo-gray)] text-[var(--neo-black)]'
                          }`}
                      >
                        <span className="text-base">{cat.icon}</span>
                        <span className="leading-tight">{cat.label}</span>
                        {isActive && (
                          <span className="ml-auto w-2 h-2 rounded-full bg-[var(--neo-black)]" />
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </aside>

            {/* ===== PRODUK AREA ===== */}
            <div className="flex-1 min-w-0">
              {/* Mobile kategori chips */}
              <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat.value}
                    href={`/products${cat.value ? `?category=${encodeURIComponent(cat.value)}` : ''}`}
                    className={`flex-shrink-0 text-xs font-bold px-3 py-1.5 border-[2px] border-[var(--neo-black)] rounded-lg shadow-[2px_2px_0px_var(--neo-black)] transition-colors
                      ${activeCategory === cat.value
                        ? 'bg-[var(--neo-accent)] text-[var(--neo-black)]'
                        : 'bg-white text-[var(--neo-black)] hover:bg-[var(--neo-gray)]'
                      }`}
                  >
                    {cat.icon} {cat.label}
                  </Link>
                ))}
              </div>

              {/* Toolbar sort */}
              <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
                <p className="text-sm font-bold opacity-60">
                  Menampilkan <span className="text-[var(--neo-primary)]">{allProducts.length}</span> produk
                  {activeCategoryLabel !== 'Semua' && (
                    <> dalam <span className="text-[var(--neo-secondary)]">{activeCategoryLabel}</span></>
                  )}
                </p>
                <div className="flex gap-2">
                  {[
                    { value: 'newest', label: '🕐 Terbaru' },
                    { value: 'cheapest', label: '💰 Termurah' },
                    { value: 'expensive', label: '💎 Termahal' },
                  ].map((s) => (
                    <Link
                      key={s.value}
                      href={`/products?${activeCategory ? `category=${encodeURIComponent(activeCategory)}&` : ''}sort=${s.value}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
                      className={`text-xs font-bold px-3 py-1.5 border-[2px] border-[var(--neo-black)] rounded-lg shadow-[2px_2px_0px_var(--neo-black)] transition-colors
                        ${sort === s.value
                          ? 'bg-[var(--neo-primary)] text-white'
                          : 'bg-white hover:bg-[var(--neo-gray)]'
                        }`}
                    >
                      {s.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="neo-zigzag mb-6 opacity-20" />

              {/* Grid produk */}
              {allProducts.length === 0 ? (
                <div className="neo-card text-center py-16 px-6 animate-slide-up">
                  <div className="text-6xl mb-4 animate-float">🤷‍♂️</div>
                  <h3 className="text-xl font-extrabold text-[var(--neo-black)] mb-2">
                    Produk Tidak Ditemukan
                  </h3>
                  <p className="text-sm font-medium text-[var(--neo-black)] opacity-50 mb-6">
                    Coba kategori atau kata kunci lain.
                  </p>
                  <Link href="/products" className="neo-btn neo-btn-primary">
                    Lihat Semua Produk
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {allProducts.map((product, i) => (
                    <ProductsCard key={product.id} product={product} index={i} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
