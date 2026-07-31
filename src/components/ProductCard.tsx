'use client';

import Link from 'next/link';
import { useCartStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import FollowButton from '@/components/FollowButton';
import WishlistButton from '@/components/WishlistButton';

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  sellerName?: string | null;
  sellerId?: string | null;
  condition?: string | null;
  isNegotiable?: boolean | null;
  stock?: number | null;
}

export default function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const addToCart = useCartStore((state) => state.addToCart);
  const router = useRouter();

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

          <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 flex flex-col gap-1">
            {product.condition && (
               <span className={`neo-sticker text-[8px] sm:text-[10px] py-0.5 px-1.5 sm:px-2 border-[2px] border-[var(--neo-black)] shadow-[2px_2px_0px_var(--neo-black)] ${
                 product.condition === 'baru' ? 'bg-[var(--neo-accent)] text-[var(--neo-black)]' :
                 product.condition === 'like_new' ? 'bg-[#7B4AE2] text-white' : 'bg-[#FF6B35] text-white'
               }`}>
                 {product.condition === 'baru' ? '✨ Baru' :
                  product.condition === 'like_new' ? '💎 Like New' :
                  product.condition === 'minus_ringan' ? '⚠️ Minus Ringan' :
                  product.condition === 'minus_berat' ? '💀 Minus Berat' : '🔥 Preloved'}
               </span>
            )}
            {product.isNegotiable && (
               <span className="neo-sticker bg-[var(--neo-pink)] text-white text-[8px] sm:text-[10px] py-0.5 px-1.5 sm:px-2 border-[2px] border-[var(--neo-black)] w-fit shadow-[2px_2px_0px_var(--neo-black)]">
                 🤝 Nego
               </span>
            )}
          </div>
          <WishlistButton productId={product.id} />
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

          {/* Nama Seller (Sosial) */}
          <div className="flex items-center justify-between border-t-[2px] border-dashed border-[var(--neo-black)] border-opacity-20 pt-1.5 sm:pt-2 text-[10px] sm:text-xs font-bold text-[var(--neo-black)] opacity-80 mb-2 sm:mb-3">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (product.sellerId) router.push(`/profile/${product.sellerId}`);
              }}
              className="flex items-center gap-1.5 overflow-hidden pr-2 hover:opacity-70 transition-opacity text-left"
            >
               <div className="w-5 h-5 rounded-md bg-[var(--neo-gray)] border-[2px] border-[var(--neo-black)] flex items-center justify-center text-[10px] flex-shrink-0">
                 {product.sellerName?.charAt(0).toUpperCase() || '👤'}
               </div>
               <span className="truncate hover:underline">{product.sellerName || 'Anonim'}</span>
            </button>
            {product.sellerId && (
              <FollowButton targetUserId={product.sellerId} small={true} />
            )}
          </div>

          {/* Stok */}
          {typeof product.stock === 'number' && (
            <div className="mb-2">
              {product.stock === 0 ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-white bg-red-500 border-[2px] border-[var(--neo-black)] rounded-md px-2 py-0.5 shadow-[1px_1px_0px_var(--neo-black)]">
                  ❌ Habis
                </span>
              ) : product.stock <= 3 ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-white bg-orange-500 border-[2px] border-[var(--neo-black)] rounded-md px-2 py-0.5 shadow-[1px_1px_0px_var(--neo-black)] animate-pulse">
                  🔥 Sisa {product.stock}
                </span>
              ) : product.stock <= 10 ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[var(--neo-black)] bg-[var(--neo-accent)] border-[2px] border-[var(--neo-black)] rounded-md px-2 py-0.5 shadow-[1px_1px_0px_var(--neo-black)]">
                  ⚡ Stok {product.stock}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--neo-black)] opacity-50">
                  📦 Stok {product.stock}
                </span>
              )}
            </div>
          )}

          {/* Tombol Add to Cart */}
          <div className="mt-auto">
            <button
              onClick={handleAddToCart}
              id={`add-to-cart-${product.id}`}
              disabled={product.stock === 0}
              className="neo-btn neo-btn-primary w-full text-[10px] sm:text-xs md:text-sm py-1.5 sm:py-2 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {product.stock === 0 ? (
                '❌ Stok Habis'
              ) : (
                <><span className="group-hover:animate-wiggle inline-block">🛒</span> + Keranjang</>
              )}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
