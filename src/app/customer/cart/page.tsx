'use client';

import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useCartStore } from '@/lib/store';

export default function CartPage() {
  const cartItems = useCartStore((state) => state.items);
  const removeFromCart = useCartStore((state) => state.removeFromCart);

  const totalHarga = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  const formatRupiah = (price: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
  };

  return (
    <div className="bg-[var(--neo-bg)] min-h-screen text-[var(--neo-black)] flex flex-col">
      <Navbar />
      
      <main className="flex-grow max-w-5xl mx-auto px-4 py-10 w-full relative">
        {/* Dekorasi Latar */}
        <div className="absolute top-10 right-0 text-5xl animate-float opacity-30 select-none hidden lg:block">🛒</div>
        <div className="absolute bottom-20 left-0 text-4xl animate-float opacity-30 select-none hidden lg:block" style={{ animationDelay: '0.5s' }}>💸</div>

        <div className="flex items-center gap-3 mb-8 animate-slide-up">
          <span className="bg-[var(--neo-primary)] text-white px-3 py-1 border-[3px] border-[var(--neo-black)] rounded-xl shadow-[var(--neo-shadow-sm)] text-2xl font-extrabold rotate-[-2deg]">
            🛒
          </span>
          <h1 className="text-3xl font-extrabold">Keranjang Belanja</h1>
        </div>

        {cartItems.length === 0 ? (
          <div className="neo-card p-12 text-center animate-slide-up stagger-1">
            <div className="text-6xl mb-6 animate-bounce-in">🪹</div>
            <h2 className="text-2xl font-extrabold mb-3">Keranjang Masih Kosong!</h2>
            <p className="opacity-70 mb-8 font-medium">Yuk cari barang keren idamanmu sekarang.</p>
            <Link href="/">
              <button className="neo-btn neo-btn-primary text-lg px-8 py-3 hover-wiggle">
                🛍️ Mulai Belanja
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Daftar Item */}
            <div className="lg:col-span-2 space-y-5 animate-slide-up stagger-1">
              {cartItems.map((item, index) => (
                <div key={item.id} className={`neo-card p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 stagger-${Math.min(index + 1, 12)}`}>
                  <div className="flex-grow">
                    <h3 className="font-bold text-lg mb-1 line-clamp-1">{item.name}</h3>
                    <p className="text-xs font-bold opacity-60 mb-3 border-b-[2px] border-dashed border-[var(--neo-black)] border-opacity-20 pb-2 inline-block">
                      🏪 {item.storeName}
                    </p>
                    <div className="bg-[var(--neo-accent)] border-[2px] border-[var(--neo-black)] rounded-lg px-2 py-1 inline-block font-extrabold shadow-[2px_2px_0px_var(--neo-black)] rotate-[-1deg]">
                      {formatRupiah(item.price)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end mt-2 sm:mt-0 pt-4 sm:pt-0 border-t-[2px] border-[var(--neo-black)] sm:border-none border-opacity-10">
                    <span className="neo-badge bg-[var(--neo-gray)] text-[var(--neo-black)] px-3 py-1 font-bold">
                      x{item.quantity}
                    </span>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="neo-btn neo-btn-outline bg-red-100 hover:bg-[var(--neo-pink)] hover:text-white border-[2px] py-1.5 px-3 text-sm transition-colors"
                    >
                      🗑️ Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Ringkasan */}
            <div className="animate-slide-up stagger-2">
              <div className="neo-card p-6 sticky top-24">
                <h2 className="font-extrabold text-xl mb-4 flex items-center gap-2">
                  <span className="text-2xl">🧾</span> Ringkasan
                </h2>
                
                <div className="neo-zigzag mb-4 opacity-10" />

                <div className="flex justify-between items-center mb-6 font-bold">
                  <span className="opacity-70">Total Harga</span>
                  <span className="text-lg bg-[var(--neo-green)] text-[var(--neo-black)] px-2 py-0.5 border-[2px] border-[var(--neo-black)] rounded shadow-[1px_1px_0px_var(--neo-black)] rotate-[1deg]">
                    {formatRupiah(totalHarga)}
                  </span>
                </div>
                
                <Link href="/customer/checkout" className="block">
                  <button className="neo-btn neo-btn-primary w-full py-3.5 text-base">
                    🚀 Checkout & Bayar
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}