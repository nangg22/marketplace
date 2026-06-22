import { db } from '@/lib/db';
import { products } from '@/lib/schema';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default async function AdminProductsPage() {
  const allProducts = await db.select().from(products);

  const formatRupiah = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  return (
    <div className="bg-[var(--neo-bg)] min-h-screen text-[var(--neo-black)] flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-6xl mx-auto px-4 py-10 w-full relative">
        <div className="mb-6 animate-slide-up">
          <Link href="/admin/dashboard" className="neo-link text-sm font-bold opacity-60 hover:opacity-100">
            ← Kembali ke Dashboard Admin
          </Link>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 animate-slide-up stagger-1">
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <span className="bg-[var(--neo-primary)] text-white px-3 py-1 border-[3px] border-[var(--neo-black)] rounded-xl shadow-[var(--neo-shadow-sm)] rotate-[-2deg]">
              📦
            </span>
            Kelola Semua Produk
          </h1>
          <span className="neo-badge bg-[var(--neo-accent)] text-lg font-extrabold px-4 py-2">
            {allProducts.length} Produk
          </span>
        </div>

        <div className="neo-card overflow-x-auto animate-slide-up stagger-2">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b-[3px] border-[var(--neo-black)] bg-[var(--neo-gray)]">
                <th className="text-left p-4 font-extrabold">Foto</th>
                <th className="text-left p-4 font-extrabold">Nama Produk</th>
                <th className="text-left p-4 font-extrabold">Harga</th>
                <th className="text-center p-4 font-extrabold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {allProducts.map((product) => (
                <tr key={product.id} className="border-b-[2px] border-dashed border-[var(--neo-black)] border-opacity-10 hover:bg-[var(--neo-gray)] transition-colors">
                  <td className="p-4">
                    <div className="w-12 h-12 bg-white border-[2px] border-[var(--neo-black)] rounded overflow-hidden">
                      {product.imageUrl && product.imageUrl !== 'https://via.placeholder.com/300?text=No+Image' ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-xs font-bold opacity-50">N/A</div>
                      )}
                    </div>
                  </td>
                  <td className="p-4 font-bold">{product.name}</td>
                  <td className="p-4 font-extrabold text-[var(--neo-primary)]">{formatRupiah(product.price)}</td>
                  <td className="p-4 text-center">
                    <button className="neo-btn neo-btn-outline px-3 py-1 text-xs bg-red-100 text-red-600 hover:bg-[var(--neo-pink)] hover:text-white border-red-300">
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <Footer />
    </div>
  );
}
