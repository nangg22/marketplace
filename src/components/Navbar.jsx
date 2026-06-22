'use client'; // Wajib ditambahkan!

import Link from 'next/link';
import { useCartStore } from '@/lib/store';

const Navbar = () => {
  // Mengambil data items dari Zustand
  const cartItems = useCartStore((state) => state.items);
  
  // Menghitung total jumlah barang
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          <Link href="/" className="flex-shrink-0 flex items-center">
            <span className="text-2xl font-bold text-emerald-600">Mall<span className="text-gray-900">Pedia</span></span>
          </Link>

          {/* ... Bagian Search Bar biarkan seperti semula ... */}
          <form action="/search" method="GET" className="flex-1 max-w-xl mx-4 hidden md:block">
            <div className="relative">
              <input 
                type="text" 
                name="q"
                placeholder="Cari barang murah..." 
                className="w-full h-10 pl-4 pr-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500"
              />
              <button type="submit" className="absolute right-3 top-2 text-gray-400">🔍</button>
            </div>
          </form>

          <div className="flex items-center gap-4">
            <Link href="/customer/cart" className="relative text-gray-600 hover:text-emerald-600 transition">
              <span className="text-2xl">🛒</span>
              {/* Angka badge ini sekarang hidup! */}
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-2 bg-amber-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </Link>
            
            <div className="h-6 w-px bg-gray-200 mx-2"></div>

            <Link href="/login">
              <button className="px-4 py-2 text-sm font-medium text-emerald-600 border border-emerald-600 rounded-lg">Masuk</button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;