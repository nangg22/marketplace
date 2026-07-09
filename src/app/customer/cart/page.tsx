'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { useCartStore } from '@/lib/store';

export default function CartPage() {
  const cartItems = useCartStore((state) => state.items);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);

  const totalHarga = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

  const formatRupiah = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  return (
    <div className="bg-[var(--neo-bg)] min-h-screen text-[var(--neo-black)] flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-5xl mx-auto px-4 py-10 w-full relative">
        <div className="absolute top-10 right-0 text-5xl animate-float opacity-20 select-none hidden lg:block">🛒</div>

        <div className="flex items-center gap-3 mb-8 animate-slide-up">
          <span className="bg-[var(--neo-primary)] text-white px-3 py-1 border-[3px] border-[var(--neo-black)] rounded-xl shadow-[var(--neo-shadow-sm)] text-2xl font-extrabold rotate-[-2deg]">
            🛒
          </span>
          <div>
            <h1 className="text-3xl font-extrabold">Keranjang Belanja</h1>
            {cartItems.length > 0 && (
              <p className="text-sm font-semibold opacity-60">{totalItems} produk dipilih</p>
            )}
          </div>
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
            <div className="lg:col-span-2 space-y-4 animate-slide-up stagger-1">
              {cartItems.map((item, index) => (
                <div
                  key={item.id}
                  className={`neo-card p-4 sm:p-5 stagger-${Math.min(index + 1, 12)}`}
                >
                  <div className="flex gap-4 items-start">
                    {/* Info produk */}
                    <div className="flex-grow min-w-0">
                      <h3 className="font-bold text-base sm:text-lg leading-tight line-clamp-2 mb-1">
                        {item.name}
                      </h3>
                      <p className="text-xs font-bold opacity-50 mb-2">🏪 {item.storeName}</p>
                      <div className="inline-block bg-[var(--neo-accent)] border-[2px] border-[var(--neo-black)] rounded-lg px-2 py-0.5 font-extrabold text-sm shadow-[1px_1px_0px_var(--neo-black)]">
                        {formatRupiah(item.price)}
                      </div>
                    </div>

                    {/* Hapus */}
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="flex-shrink-0 w-12 h-12 flex items-center justify-center border-[3px] border-[var(--neo-black)] rounded-lg bg-red-100 hover:bg-[var(--neo-pink)] hover:text-white transition-colors text-sm"
                      aria-label="Hapus"
                    >
                      🗑️
                    </button>
                  </div>

                  {/* Baris bawah: qty + subtotal */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t-[2px] border-dashed border-[var(--neo-black)]/20">
                    {/* Kontrol Quantity */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center border-[2px] border-[var(--neo-black)] rounded-lg bg-white hover:bg-[var(--neo-gray)] font-extrabold text-lg transition-colors shadow-[1px_1px_0px_var(--neo-black)]"
                      >
                        −
                      </button>
                      <span className="w-10 text-center font-extrabold text-base">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center border-[2px] border-[var(--neo-black)] rounded-lg bg-[var(--neo-primary)] text-white font-extrabold text-lg transition-colors shadow-[1px_1px_0px_var(--neo-black)] hover:opacity-90"
                      >
                        +
                      </button>
                    </div>

                    {/* Subtotal */}
                    <div className="font-extrabold text-base text-[var(--neo-primary)]">
                      {formatRupiah(item.price * item.quantity)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Ringkasan Order */}
            <div className="animate-slide-up stagger-2">
              <div className="neo-card p-6 sticky top-24">
                <h2 className="font-extrabold text-xl mb-4 flex items-center gap-2">
                  <span>🧾</span> Ringkasan
                </h2>

                <div className="neo-zigzag mb-4 opacity-10" />

                <div className="space-y-2 mb-4 text-sm font-semibold">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between opacity-70">
                      <span className="truncate max-w-[130px]">{item.name} x{item.quantity}</span>
                      <span>{formatRupiah(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t-[2px] border-dashed border-[var(--neo-black)]/20 pt-3 mb-5">
                  <div className="flex justify-between items-center font-bold">
                    <span className="opacity-70">Total</span>
                    <span className="text-lg bg-[var(--neo-green)] text-[var(--neo-black)] px-2 py-0.5 border-[2px] border-[var(--neo-black)] rounded shadow-[1px_1px_0px_var(--neo-black)]">
                      {formatRupiah(totalHarga)}
                    </span>
                  </div>
                </div>

                <Link href="/customer/checkout" className="block">
                  <button className="neo-btn neo-btn-primary w-full py-3.5 text-base font-extrabold">
                    🚀 Checkout & Bayar
                  </button>
                </Link>

                <Link href="/products" className="block mt-3">
                  <button className="neo-btn neo-btn-outline w-full py-2 text-sm">
                    ← Lanjut Belanja
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
