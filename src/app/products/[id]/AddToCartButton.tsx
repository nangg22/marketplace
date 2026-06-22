'use client';

import { useCartStore } from '@/lib/store';

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    price: number;
    storeName?: string;
  };
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const addToCart = useCartStore((state) => state.addToCart);

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      storeName: product.storeName || 'Toko Penjual',
    });
    alert(`🛒 "${product.name}" berhasil masuk keranjang!`);
  };

  return (
    <button
      onClick={handleAddToCart}
      className="neo-btn neo-btn-primary w-full md:w-auto px-8 py-4 text-lg font-extrabold hover-wiggle"
    >
      <span className="text-2xl mr-2">🛒</span>
      Tambah ke Keranjang
    </button>
  );
}
