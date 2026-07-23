import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductsCard from '@/components/ProductCard';
import { db } from '@/lib/db';
import { products, users, categories } from '@/lib/schema';
import { ilike, eq, asc, desc, and, gte, lte } from 'drizzle-orm';
import Link from 'next/link';
import PriceFilter from '@/components/PriceFilter';
import MobileFilterDrawer from '@/components/MobileFilterDrawer';

// Ikon default per slug kategori
const CATEGORY_ICONS: Record<string, string> = {
  'elektronik': '📱', 'fashion-pria': '👔', 'fashion-wanita': '👗',
  'fashion-anak-bayi': '🧒', 'rumah-tangga': '🏠', 'dapur': '🍳',
  'buku': '📚', 'olahraga': '⚽', 'kecantikan': '💄',
  'mainan': '🧸', 'otomotif': '🚗', 'lainnya': '📦',
};

export function getCategoryIcon(slug: string) {
  return CATEGORY_ICONS[slug] ?? '🏷️';
}

export default async function AllProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string; q?: string; minPrice?: string; maxPrice?: string }>;
}) {
  const params = await searchParams;
  const activeCategory = params.category || '';
  const sort = params.sort || 'newest';
  const q = params.q || '';
  const minPrice = params.minPrice;
  const maxPrice = params.maxPrice;

  // Ambil kategori dari DB
  const dbCategories = await db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.sortOrder), asc(categories.name));
  const CATEGORIES = [
    { label: 'Semua', icon: '🛍️', value: '', slug: '' },
    ...dbCategories.map(c => ({ label: c.name, icon: getCategoryIcon(c.slug), value: c.name, slug: c.slug })),
  ];

  // Build query — exclude produk yang di-suspend admin
  const baseSelect = db
    .select({
      id: products.id,
      name: products.name,
      price: products.price,
      imageUrl: products.imageUrl,
      category: products.category,
      sellerName: users.name,
    })
    .from(products)
    .leftJoin(users, eq(products.sellerId, users.id));

  const conditions = [eq(products.isSuspended, false)];

  if (activeCategory) {
    conditions.push(eq(products.category, activeCategory));
  }
  if (q) {
    conditions.push(ilike(products.name, `%${q}%`));
  }
  if (minPrice) {
    conditions.push(gte(products.price, Number(minPrice)));
  }
  if (maxPrice) {
    conditions.push(lte(products.price, Number(maxPrice)));
  }

  let query = baseSelect.where(and(...conditions)).$dynamic();

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
        <section className="bg-[var(--neo-pink)] border-b-[4px] border-[var(--neo-black)] py-6 sm:py-10 relative overflow-hidden">
          <div className="absolute inset-0 neo-dots-pattern" />
          <div className="relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            {/* Search bar */}
            <form action="/products" method="GET" className="flex gap-2 max-w-xl mx-auto mb-4 sm:mb-6">
              {activeCategory && (
                <input type="hidden" name="category" value={activeCategory} />
              )}
              {q && <input type="hidden" name="q" value={q} />}
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="🔍 Cari produk..."
                className="neo-input flex-1 bg-white min-w-0"
              />
              <button type="submit" className="neo-btn neo-btn-primary px-3 sm:px-5 font-extrabold shrink-0">
                Cari
              </button>
            </form>

            <div className="text-center animate-slide-up">
              <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-[var(--neo-black)] mb-2 leading-tight">
                {q ? (
                  <>Hasil untuk: <span className="text-white bg-[var(--neo-primary)] px-1.5 sm:px-2 border-[2px] border-[var(--neo-black)] rounded">&quot;{q}&quot;</span></>
                ) : activeCategory ? (
                  <>{CATEGORIES.find(c => c.value === activeCategory)?.icon} {activeCategoryLabel}</>
                ) : (
                  <>Jelajahi <span className="text-white bg-[var(--neo-primary)] px-1.5 sm:px-2 border-[2px] border-[var(--neo-black)] rounded inline-block rotate-[-1deg]">Semua Produk</span></>
                )}
              </h1>
              <p className="text-xs sm:text-sm font-bold text-[var(--neo-black)] opacity-70">
                {allProducts.length} produk ditemukan
              </p>
            </div>
          </div>
        </section>

        {/* Main layout: sidebar + grid */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="flex gap-4 lg:gap-6 items-start">

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

              <div className="mt-6 sticky top-[380px]">
                <PriceFilter className="w-full" />
              </div>
            </aside>

            {/* ===== PRODUK AREA ===== */}
            <div className="flex-1 min-w-0">
              <MobileFilterDrawer
                categories={CATEGORIES}
                activeCategory={activeCategory}
                sort={sort}
              />

              {/* Toolbar sort */}
              <div className="flex flex-col sm:flex-row sm:flex-wrap justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2 sm:gap-3">
                <p className="text-xs sm:text-sm font-bold opacity-60">
                  Menampilkan <span className="text-[var(--neo-primary)]">{allProducts.length}</span> produk
                  {activeCategoryLabel !== 'Semua' && (
                    <> dalam <span className="text-[var(--neo-secondary)]">{activeCategoryLabel}</span></>
                  )}
                </p>
                <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                  {[
                    { value: 'newest', label: '🕐 Terbaru' },
                    { value: 'cheapest', label: '💰 Termurah' },
                    { value: 'expensive', label: '💎 Termahal' },
                  ].map((s) => (
                    <Link
                      key={s.value}
                      href={`/products?${activeCategory ? `category=${encodeURIComponent(activeCategory)}&` : ''}sort=${s.value}${q ? `&q=${encodeURIComponent(q)}` : ''}${minPrice ? `&minPrice=${minPrice}` : ''}${maxPrice ? `&maxPrice=${maxPrice}` : ''}`}
                      className={`text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 border-[2px] border-[var(--neo-black)] rounded-lg shadow-[2px_2px_0px_var(--neo-black)] transition-colors
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

              <div className="neo-zigzag mb-4 sm:mb-6 opacity-20" />

              {/* Grid produk */}
              {allProducts.length === 0 ? (
                <div className="neo-card text-center py-10 sm:py-16 px-4 sm:px-6 animate-slide-up">
                  <div className="text-5xl sm:text-6xl mb-4 animate-float">🤷‍♂️</div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-[var(--neo-black)] mb-2">
                    Produk Tidak Ditemukan
                  </h3>
                  <p className="text-xs sm:text-sm font-medium text-[var(--neo-black)] opacity-50 mb-6">
                    Coba kategori atau kata kunci lain.
                  </p>
                  <Link href="/products" className="neo-btn neo-btn-primary text-xs sm:text-sm">
                    Lihat Semua Produk
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4">
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
