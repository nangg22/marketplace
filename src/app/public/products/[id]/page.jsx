// src/app/(public)/products/[id]/page.jsx
import Navbar from '@/components/Navbar';
import Image from 'next/image';
import Link from 'next/link';

const dummyProducts = [
  { id: '1', name: 'Laptop Gaming ROG Strix G15', price: 18500000, storeName: 'ASUS Official Store', imageUrl: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?q=80&w=500', stock: 5, desc: 'Laptop gaming monster dengan spesifikasi rata kanan. Cocok untuk gamers kompetitif dan konten kreator profesional.' },
  { id: '2', name: 'Mechanical Keyboard VortexSeries GT', price: 850000, storeName: 'Vortex Gaming Tech', imageUrl: 'https://images.unsplash.com/photo-1595225405474-ec3c0d8329b3?q=80&w=500', stock: 12, desc: 'Keyboard mechanical hotswappable dengan RGB yang memanjakan mata dan switch yang renyah di telinga.' },
];

export default async function ProductDetailPage({ params }) {
  const { id } = await params;

  // Cari produk yang cocok dengan ID di URL
  const product = dummyProducts.find((p) => p.id === id);

  if (!product) {
    return <div className="text-center py-20 font-bold">Produk Tidak Ditemukan!</div>;
  }

  const formatRupiah = (price) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 shadow-sm">

          {/* FOTO PRODUK (Kiri) */}
          <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>

          {/* DETAIL PRODUK (Kanan) */}
          <div className="flex flex-col justify-between">
            <div>
              <span className="inline-block px-3 py-1 bg-primary/10 text-primary font-medium text-xs rounded-full mb-3">
                🏢 {product.storeName}
              </span>
              <h1 className="text-2xl font-bold text-dark mb-2">{product.name}</h1>
              <p className="text-3xl font-extrabold text-primary mb-6">{formatRupiah(product.price)}</p>

              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-sm font-semibold text-dark mb-2">Deskripsi Produk:</h3>
                <p className="text-sm text-neutral leading-relaxed">{product.desc}</p>
              </div>
            </div>

            {/* SEKSI AKSI & STOK */}
            <div className="border-t border-gray-100 pt-6 mt-6">
              <div className="flex items-center justify-between mb-4 text-sm text-neutral">
                <span>Stok yang tersedia:</span>
                <span className="font-bold text-dark">{product.stock} pcs</span>
              </div>

              <Link href="/customer/cart">
                <button className="w-full bg-secondary hover:bg-amber-600 text-white font-bold py-3 px-4 rounded-xl transition shadow-md shadow-amber-500/10">
                  🛒 Tambah ke Keranjang
                </button>
              </Link>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}