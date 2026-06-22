import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductsCard from '@/components/ProductCard';
import { db } from '@/lib/db';
import { products } from '@/lib/schema';

export default async function AllProductsPage() {
  const allProducts = await db.select().from(products);

  return (
    <div className="flex flex-col min-h-screen bg-[var(--neo-bg)]">
      <Navbar />

      <main className="flex-grow">
        {/* Banner Halaman Produk */}
        <section className="bg-[var(--neo-pink)] border-b-[4px] border-[var(--neo-black)] py-12 relative overflow-hidden">
          <div className="absolute inset-0 neo-dots-pattern" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-slide-up">
            <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--neo-black)] mb-4">
              Jelajahi <span className="text-white bg-[var(--neo-primary)] px-2 py-0.5 border-[2px] border-[var(--neo-black)] rounded shadow-[2px_2px_0px_var(--neo-black)] rotate-[-1deg] inline-block">Semua Produk</span>
            </h1>
            <p className="text-lg font-bold text-[var(--neo-black)] opacity-80 max-w-xl mx-auto">
              Dari gadget sampai fashion, semuanya ada di sini dengan harga merakyat 💥
            </p>
          </div>
        </section>

        {/* Etalase Produk */}
        <section className="py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
              <h2 className="text-2xl font-extrabold text-[var(--neo-black)] flex items-center gap-2">
                <span>📦</span> Etalase Lengkap
              </h2>
              
              <div className="flex gap-2">
                <button className="neo-btn neo-btn-primary py-2 px-4 text-sm">Terbaru</button>
                <button className="neo-btn neo-btn-outline py-2 px-4 text-sm">Termurah</button>
                <button className="neo-btn neo-btn-outline py-2 px-4 text-sm">Termahal</button>
              </div>
            </div>

            <div className="neo-zigzag mb-8 opacity-20" />

            {allProducts.length === 0 ? (
              <div className="neo-card text-center py-16 px-6 animate-slide-up">
                <div className="text-6xl mb-4 animate-float">🛒</div>
                <h3 className="text-xl font-extrabold text-[var(--neo-black)] mb-2">
                  Belum Ada Produk
                </h3>
                <p className="text-sm font-medium text-[var(--neo-black)] opacity-50">
                  Kembali lagi nanti ya!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                {allProducts.map((product, i) => (
                  <ProductsCard key={product.id} product={product} index={i} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
