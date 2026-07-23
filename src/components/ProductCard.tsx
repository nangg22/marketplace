'use client';

import Link from 'next/link';
import { useCartStore } from '@/lib/store';

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  sellerName?: string | null;
}

export default function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const addToCart = useCartStore((state) => state.addToCart);

  const formatRupiah = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      storeName: product.sellerName || 'Toko Penjual',
    });
    // Toast ringan tanpa alert()
    const msg = document.createElement('div');
    msg.textContent = `✅ "${product.name}" masuk keranjang!`;
    msg.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#1A1A2E] text-[#FFD23F] font-extrabold text-sm px-5 py-3 rounded-xl border-[3px] border-[#FFD23F] shadow-lg z-[200] animate-bounce-in';
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 2500);
  };

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
              <span className="text-2xl sm:text-3xl">📦</span>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">No Image</span>
            </div>
          )}

          <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2">
            <span className="neo-sticker bg-[var(--neo-accent)] text-[var(--neo-black)] text-[8px] sm:text-[10px] py-0.5 px-1.5 sm:px-2">
              🔥 Baru
            </span>
          </div>
        </div>

        <div className="p-2 sm:p-3 md:p-4 flex flex-col flex-grow bg-white">
          {/* Judul */}
          <h3 className="text-xs sm:text-sm font-bold text-[var(--neo-black)] line-clamp-2 mb-1.5 sm:mb-2 group-hover:text-[var(--neo-primary)] transition-colors duration-200 leading-tight">
            {product.name}
          </h3>

          {/* Harga */}
          <div className="mb-1.5 sm:mb-2">
            <span className="inline-block bg-[var(--neo-accent)] text-[var(--neo-black)] font-extrabold text-[11px] sm:text-sm md:text-base px-1.5 sm:px-2 py-0.5 border-[2px] border-[var(--neo-black)] rounded-lg shadow-[1px_1px_0px_var(--neo-black)] rotate-[-1deg]">
              {formatRupiah(product.price)}
            </span>
          </div>

          {/* Nama Seller */}
          <div className="flex items-center gap-1 sm:gap-1.5 border-t-[2px] border-dashed border-[var(--neo-black)] border-opacity-20 pt-1.5 sm:pt-2 text-[10px] sm:text-xs font-semibold text-[var(--neo-black)] opacity-60 mb-2 sm:mb-3">
            <span className="text-xs sm:text-sm">🏪</span>
            <span className="truncate">{product.sellerName || 'Toko Penjual'}</span>
          </div>

          {/* Tombol Add to Cart */}
          <div className="mt-auto">
            <button
              onClick={handleAddToCart}
              id={`add-to-cart-${product.id}`}
              className="neo-btn neo-btn-primary w-full text-[10px] sm:text-xs md:text-sm py-1.5 sm:py-2 active:scale-95 transition-transform"
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
