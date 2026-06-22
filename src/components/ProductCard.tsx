'use client';

import Link from 'next/link';
import { useCartStore } from '@/lib/store';

export default function ProductCard({ product, index = 0 }: { product: any; index?: number }) {
  const addToCart = useCartStore((state) => state.addToCart);

  const formatRupiah = (price: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      storeName: 'Toko Penjual',
    });

    alert(`🛒 "${product.name}" berhasil masuk keranjang!`);
  };

  // Stagger delay class
  const staggerClass = `stagger-${Math.min(index + 1, 12)}`;

  return (
    <Link href={`/products/${product.id}`} className="group block" id={`product-${product.id}`}>
      <div className={`neo-card overflow-hidden h-full flex flex-col animate-slide-up ${staggerClass}`}>

        {/* Foto Produk */}
        <div className="relative aspect-square w-full bg-[var(--neo-gray)] flex items-center justify-center overflow-hidden border-b-[3px] border-[var(--neo-black)]">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-[var(--neo-black)] opacity-40">
              <span className="text-3xl">📦</span>
              <span className="text-xs font-bold uppercase tracking-wider">No Image</span>
            </div>
          )}

          {/* Badge Promo Dekoratif */}
          <div className="absolute top-2 left-2">
            <span className="neo-sticker bg-[var(--neo-accent)] text-[var(--neo-black)] text-[10px] py-0.5 px-2">
              🔥 Baru
            </span>
          </div>
        </div>

        <div className="p-4 flex flex-col flex-grow bg-white">
          {/* Judul */}
          <h3 className="text-sm font-bold text-[var(--neo-black)] line-clamp-2 mb-2 group-hover:text-[var(--neo-primary)] transition-colors duration-200">
            {product.name}
          </h3>

          {/* Harga — Badge Style */}
          <div className="mb-3">
            <span className="inline-block bg-[var(--neo-accent)] text-[var(--neo-black)] font-extrabold text-base px-2 py-0.5 border-[2px] border-[var(--neo-black)] rounded-lg shadow-[1px_1px_0px_var(--neo-black)] rotate-[-1deg]">
              {formatRupiah(product.price)}
            </span>
          </div>

          {/* Info Vendor/Toko */}
          <div className="flex items-center gap-1.5 border-t-[2px] border-dashed border-[var(--neo-black)] border-opacity-20 pt-2 text-xs font-semibold text-[var(--neo-black)] opacity-60 mb-4">
            <span>🏪</span>
            <span>Toko Penjual</span>
          </div>

          {/* Tombol Add to Cart */}
          <div className="mt-auto">
            <button
              onClick={handleAddToCart}
              id={`add-to-cart-${product.id}`}
              className="neo-btn neo-btn-primary w-full text-sm py-2.5"
            >
              <span className="group-hover:animate-wiggle inline-block">🛒</span>
              + Keranjang
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}