import Navbar from '@/components/Navbar';
import ProductsCard from '@/components/ProductCard';
import { db } from '@/lib/db';
import { products } from '@/lib/schema';

export default async function HomePage() {
  // Menarik semua data produk dari Neon Postgres secara real-time
  const realProducts = await db.select().from(products);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      <main className="flex-grow">
        {/* Banner Promo */}
        <div className="bg-emerald-50 py-12 mb-10 border-b border-emerald-100">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Pameran Tugas Akhir <span className="text-emerald-600">Marketplace</span></h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Jelajahi produk sungguhan dari database secara real-time.</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Etalase Produk</h2>
          </div>

          {/* Render Produk dari Database */}
          {realProducts.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-500">Belum ada produk. Silakan tambahkan dari dashboard penjual.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {realProducts.map((product) => (
                <ProductsCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}