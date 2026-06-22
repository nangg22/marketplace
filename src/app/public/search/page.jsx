// src/app/(public)/page.tsx
import Navbar from '@/components/Navbar';
import ProductsCard from '@/components/ProductsCard';
import Link from 'next/link';

// 1. Import koneksi database dan skema
import { db } from '@/lib/db';
import { products } from '@/lib/schema';

// Ubah function menjadi 'async' karena kita akan mengambil data dari server
export default async function HomePage() {
  
  // 2. Tarik semua data produk dari Neon Postgres
  const realProducts = await db.select().from(products);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      <main className="flex-grow">
        {/* Banner Promo */}
        <div className="bg-primary/10 py-12 mb-10 border-b border-primary/20">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-4xl font-extrabold text-dark mb-2">Pameran Tugas Akhir Mall<span className="text-primary">Pedia</span></h1>
            <p className="text-lg text-neutral max-w-2xl mx-auto">Selamat datang di marketplace mini buatan saya. Jelajahi produk sungguhan dari database secara real-time.</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-dark">Etalase Produk</h2>
          </div>

          {/* Kondisi jika database masih kosong */}
          {realProducts.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl border border-gray-200">
              <p className="text-neutral">Belum ada produk. Silakan tambahkan dari dashboard penjual.</p>
            </div>
          ) : (
            // 3. Looping data asli dari database
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