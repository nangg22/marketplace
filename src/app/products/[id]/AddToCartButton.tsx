'use client';

import { useCartStore } from '@/lib/store';
import { useRouter } from 'next/navigation';

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    price: number;
    storeName?: string;
  };
  buyNow?: boolean; // jika true: tambah ke cart lalu langsung ke checkout
}

export default function AddToCartButton({ product, buyNow = false }: AddToCartButtonProps) {
  const addToCart = useCartStore((state) => state.addToCart);
  const router = useRouter();

  const handleClick = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      storeName: product.storeName || 'Toko Penjual',
    });

    if (buyNow) {
      router.push('/customer/checkout');
    } else {
      // Toast sederhana tanpa alert()
      const msg = document.createElement('div');
      msg.textContent = `✅ "${product.name}" masuk keranjang!`;
      msg.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#1A1A2E] text-[#FFD23F] font-extrabold text-sm px-5 py-3 rounded-xl border-[3px] border-[#FFD23F] shadow-lg z-[200] animate-bounce-in';
      document.body.appendChild(msg);
      setTimeout(() => msg.remove(), 2500);
    }
  };

  if (buyNow) {
    return (
      <button
        onClick={handleClick}
        className="neo-btn neo-btn-secondary flex-1 py-4 text-lg font-extrabold hover-wiggle"
      >
        ⚡ Beli Langsung
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="neo-btn neo-btn-primary flex-1 py-4 text-lg font-extrabold hover-wiggle"
    >
      <span className="text-2xl mr-2">🛒</span>
      Tambah ke Keranjang
    </button>
  );
}
