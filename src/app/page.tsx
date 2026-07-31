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
  const rawProducts = await db
    .select({
      id: products.id,
      name: products.name,
      price: products.price,
      imageUrl: products.imageUrl,
      condition: products.condition,
      isNegotiable: products.isNegotiable,
      sellerId: products.sellerId,
      sellerName: users.name,
      stock: products.stock,
    })
    .from(products)
    .leftJoin(users, eq(products.sellerId, users.id))
    .where(eq(products.isSuspended, false));

  const realProducts = rawProducts.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    imageUrl: p.imageUrl,
    condition: p.condition,
    isNegotiable: p.isNegotiable,
    sellerId: p.sellerId,
    sellerName: p.sellerName,
  }));

  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  const mulaiJualanHref =
    role === 'seller'
      ? '/seller/products/create'
      : role === 'customer'
        ? '/become-seller'
        : '/login?tab=seller&callbackUrl=/become-seller';

  const categories = [
    {
      href: '/products?category=Tech',
      emoji: '💻',
      name: 'Tech & Gadget',
      desc: 'Laptop, HP, tablet, aksesoris elektronik bekas berkualitas',
      color: 'bg-[var(--neo-primary)]',
      textColor: 'text-[var(--neo-black)]',
    },
    {
      href: '/products?category=Kosan',
      emoji: '🪑',
      name: 'Kosan Starter',
      desc: 'Perabot kos, meja lipat, kipas, rice cooker, dan perlengkapan harian',
      color: 'bg-[#FF6B35]',
      textColor: 'text-[var(--neo-black)]',
    },
    {
      href: '/products?category=Fashion',
      emoji: '🧥',
      name: 'Thrift Fashion',
      desc: 'Baju, celana, sepatu, dan aksesori fashion OOTD bekas berkualitas',
      color: 'bg-[#7B4AE2]',
      textColor: 'text-[var(--neo-black)]',
    },
    {
      href: '/products?category=Hobi',
      emoji: '🎸',
      name: 'Hobi & Fandom',
      desc: 'Photocard K-Pop, action figure, alat musik, dan barang koleksi',
      color: 'bg-white',
      textColor: 'text-[var(--neo-black)]',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[var(--neo-bg)]">
      <Navbar />

      <main className="flex-grow">

        {/* === HERO SECTION === */}
        <section className="bg-[var(--neo-accent)] border-b-[4px] border-[var(--neo-black)] py-12 px-4">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl animate-slide-up">
              <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--neo-black)] leading-tight mb-3">
                Jual & Beli Barang{' '}
                <span className="inline-block bg-[var(--neo-black)] text-[var(--neo-accent)] px-3 py-1 rounded-xl border-[3px] border-[var(--neo-black)] shadow-[4px_4px_0px_rgba(0,0,0,0.3)] -rotate-1">
                  Preloved
                </span>{' '}
                dengan Mudah
              </h1>
              <p className="text-[var(--neo-black)] font-semibold opacity-75 text-lg mb-6">
                Temukan ribuan barang bekas berkualitas dari komunitas terpercaya di seluruh Indonesia. Nego santai, kirim cepat! 🚀
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/products" className="neo-btn neo-btn-primary text-base px-6 py-3">
                  🛍️ Mulai Belanja
                </Link>
                <Link href={mulaiJualanHref} className="neo-btn neo-btn-outline bg-white text-base px-6 py-3">
                  📸 Jual Barangmu
                </Link>
              </div>
              <div className="flex items-center gap-6 mt-6">
                <div className="text-center">
                  <div className="text-2xl font-extrabold">{realProducts.length}+</div>
                  <div className="text-xs font-bold opacity-60">Barang Aktif</div>
                </div>
                <div className="w-px h-8 bg-[var(--neo-black)] opacity-20" />
                <div className="text-center">
                  <div className="text-2xl font-extrabold">100%</div>
                  <div className="text-xs font-bold opacity-60">Aman Transaksi</div>
                </div>
                <div className="w-px h-8 bg-[var(--neo-black)] opacity-20" />
                <div className="text-center">
                  <div className="text-2xl font-extrabold">🤝</div>
                  <div className="text-xs font-bold opacity-60">Bisa Nego</div>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 hidden md:block animate-bounce-in">
              <div className="relative w-64 h-64">
                <div className="absolute inset-0 bg-[var(--neo-primary)] border-[4px] border-[var(--neo-black)] rounded-2xl shadow-[8px_8px_0px_var(--neo-black)] rotate-6"></div>
                <div className="absolute inset-0 bg-white border-[4px] border-[var(--neo-black)] rounded-2xl shadow-[8px_8px_0px_var(--neo-black)] rotate-3"></div>
                <div className="absolute inset-0 bg-[var(--neo-accent)] border-[4px] border-[var(--neo-black)] rounded-2xl flex flex-col items-center justify-center gap-2">
                  <span className="text-6xl">♻️</span>
                  <p className="font-extrabold text-lg text-center leading-tight">Barang Bekas<br/>Jadi Berharga</p>
                  <span className="text-3xl animate-float">✨</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* === KATEGORI SECTION === */}
        <section className="py-10 px-4 bg-white border-b-[4px] border-[var(--neo-black)]">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-extrabold text-[var(--neo-black)] mb-1">Kategori Populer</h2>
                <p className="text-sm font-medium opacity-60">Pilih kategori yang kamu cari</p>
              </div>
              <Link href="/products" className="neo-btn neo-btn-outline text-sm">
                Lihat Semua →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat.href}
                  href={cat.href}
                  className={`neo-card ${cat.color} ${cat.textColor} hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_var(--neo-black)] transition-all p-5 flex flex-col gap-3`}
                >
                  <span className="text-4xl">{cat.emoji}</span>
                  <div>
                    <h3 className="font-extrabold text-xl mb-1">{cat.name}</h3>
                    <p className={`text-sm font-medium leading-snug ${cat.textColor === 'text-white' ? 'opacity-85' : 'opacity-70'}`}>
                      {cat.desc}
                    </p>
                  </div>
                  <span className={`text-xs font-bold mt-auto ${cat.textColor === 'text-white' ? 'opacity-70' : 'opacity-50'}`}>
                    Jelajahi →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* === CARA KERJA === */}
        <section className="py-10 px-4 bg-[var(--neo-bg)] border-b-[4px] border-[var(--neo-black)]">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-extrabold text-center mb-8">Cara Kerja LakuLagi</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { step: '01', emoji: '🔍', title: 'Temukan Barang', desc: 'Cari barang preloved sesuai kebutuhan dari ribuan listing yang tersedia' },
                { step: '02', emoji: '💬', title: 'Chat & Nego', desc: 'Hubungi penjual langsung, tanyakan kondisi, dan ajukan penawaran harga' },
                { step: '03', emoji: '📦', title: 'Bayar & Terima', desc: 'Bayar dengan aman, barang dikirim penjual, konfirmasi setelah diterima' },
              ].map((item) => (
                <div key={item.step} className="neo-card p-6 text-center hover:translate-y-[-2px] transition-transform">
                  <div className="w-12 h-12 bg-[var(--neo-primary)] text-white border-[3px] border-[var(--neo-black)] rounded-xl shadow-[3px_3px_0px_var(--neo-black)] flex items-center justify-center font-extrabold text-sm mx-auto mb-4">
                    {item.step}
                  </div>
                  <div className="text-4xl mb-3">{item.emoji}</div>
                  <h3 className="font-extrabold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm font-medium opacity-70 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* === FEED PRODUK TERBARU === */}
        <section id="feed" className="py-10 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6 border-b-[3px] border-[var(--neo-black)] pb-4">
              <div>
                <h2 className="text-2xl font-extrabold flex items-center gap-2">
                  <span className="bg-[var(--neo-black)] text-[var(--neo-accent)] p-2 rounded-xl text-sm">✨</span>
                  Barang Terbaru
                </h2>
                <p className="text-sm font-medium opacity-60 mt-1">Listing barang preloved terbaru dari para penjual</p>
              </div>
              <Link href="/products" className="neo-btn neo-btn-primary text-sm py-2 px-4">
                Lihat Semua
              </Link>
            </div>

            {realProducts.length === 0 ? (
              <div className="neo-card text-center py-16 px-6 max-w-2xl mx-auto">
                <div className="text-6xl mb-4 animate-float">🪴</div>
                <h3 className="text-xl font-extrabold text-[var(--neo-black)] mb-2">Belum Ada Barang</h3>
                <p className="text-sm font-medium text-[var(--neo-black)] opacity-50 mb-6">
                  Jadilah yang pertama berjualan dan bagikan barang preloved Anda ke komunitas!
                </p>
                <Link href={mulaiJualanHref} className="neo-btn neo-btn-secondary">📸 Post Barang Preloved</Link>
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
