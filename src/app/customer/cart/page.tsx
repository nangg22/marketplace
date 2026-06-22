'use client'; // Wajib karena membaca state Zustand

import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useCartStore } from '@/lib/store';

export default function CartPage() {
  // Mengambil data dari global state Zustand
  const cartItems = useCartStore((state) => state.items);
  const removeFromCart = useCartStore((state) => state.removeFromCart);

  const totalHarga = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  const formatRupiah = (price: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
  };

  return (
    <div className="bg-gray-50 min-h-screen text-gray-900">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-6">Keranjang Belanja</h1>

        {cartItems.length === 0 ? (
          <div className="bg-white p-10 text-center rounded-xl border border-gray-200">
            <p className="text-gray-500 mb-4">Keranjang Anda masih kosong.</p>
            <Link href="/" className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700">
              Mulai Belanja
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-200 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold">{item.name}</h3>
                    <p className="text-sm text-gray-500">🏢 {item.storeName}</p>
                    <p className="text-emerald-600 font-bold mt-1">{formatRupiah(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm">Jumlah: {item.quantity}</span>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 h-fit sticky top-24">
              <h2 className="font-bold text-lg mb-4 border-b pb-2">Ringkasan Belanja</h2>
              <div className="flex justify-between mb-4">
                <span className="text-gray-600">Total Harga</span>
                <span className="font-bold">{formatRupiah(totalHarga)}</span>
              </div>
              
              <Link href="/customer/checkout">
                <button className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition">
                  Checkout & Bayar
                </button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}