'use client'; // Wajib karena kita sekarang menggunakan interaksi tombol dan Zustand state

import Link from 'next/link';
import { useCartStore } from '@/lib/store';

// Definisikan tipe data produk (jika Anda pakai TypeScript)
export default function ProductCard({ product }: { product: any }) {
  // Panggil fungsi addToCart dari "gudang" Zustand kita
  const addToCart = useCartStore((state) => state.addToCart);

  const formatRupiah = (price: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
  };

  // Fungsi saat tombol keranjang diklik
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // KUNCI PENTING: Mencegah link ke halaman detail terpicu
    
    // Kirim data ke global state keranjang
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      storeName: 'Toko Penjual', // Sementara hardcode sampai ada tabel toko
    });

    // Beri tahu pengunjung bahwa berhasil ditambahkan
    alert(`🛒 "${product.name}" berhasil masuk keranjang!`);
  };

  return (
    <Link href={`/products/${product.id}`} className="group">
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg hover:border-emerald-500/30 transition-all duration-300 h-full flex flex-col">
        
        {/* Foto Produk */}
        <div className="relative aspect-square w-full bg-gray-50 flex items-center justify-center text-gray-400">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <span className="text-xs">No Image</span>
          )}
        </div>
        
        <div className="p-4 flex flex-col flex-grow">
          {/* Judul & Harga */}
          <h3 className="text-sm text-gray-900 line-clamp-2 mb-1 group-hover:text-emerald-600 transition">
            {product.name}
          </h3>
          <p className="text-base font-bold text-gray-900 mb-2">
            {formatRupiah(product.price)}
          </p>

          {/* Info Vendor/Toko */}
          <div className="flex items-center gap-1.5 border-t border-gray-100 pt-2 text-xs text-gray-500 mb-4">
            🏢 <span>Toko Penjual</span>
          </div>

          {/* Tombol Add to Cart (Gunakan mt-auto agar posisinya selalu rata di bawah) */}
          <div className="mt-auto">
            <button 
              onClick={handleAddToCart}
              className="w-full bg-emerald-50 text-emerald-600 border border-emerald-600 font-semibold py-2 rounded-lg hover:bg-emerald-600 hover:text-white transition"
            >
              + Keranjang
            </button>
          </div>

        </div>
      </div>
    </Link>
  );
}