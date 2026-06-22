'use client';

import Link from 'next/link';
import { useCartStore } from '@/lib/store';

const Navbar = () => {
  const cartItems = useCartStore((state) => state.items);
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <nav className="bg-[var(--neo-white)] border-b-[4px] border-[var(--neo-black)] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center group">
            <span className="text-2xl font-extrabold tracking-tight">
              <span className="inline-block bg-[var(--neo-primary)] text-white px-2 py-0.5 border-[3px] border-[var(--neo-black)] rounded-lg shadow-[var(--neo-shadow-sm)] group-hover:rotate-[-2deg] group-hover:scale-105 transition-transform duration-200">
                Mall
              </span>
              <span className="text-[var(--neo-black)] ml-1 group-hover:rotate-[2deg] inline-block transition-transform duration-200">
                Pedia
              </span>
            </span>
          </Link>

          {/* Search Bar */}
          <form action="/search" method="GET" className="flex-1 max-w-xl mx-6 hidden md:block">
            <div className="relative">
              <input
                type="text"
                name="q"
                id="search-input"
                placeholder="🔍 Cari barang keren..."
                className="neo-input pr-12 h-11 text-sm"
              />
              <button
                type="submit"
                id="search-btn"
                className="absolute right-1 top-1 bottom-1 px-3 bg-[var(--neo-accent)] border-[2px] border-[var(--neo-black)] rounded-lg font-bold text-sm hover:bg-[var(--neo-primary)] hover:text-white transition-colors duration-200"
              >
                Cari
              </button>
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Cart */}
            <Link
              href="/customer/cart"
              id="cart-link"
              className="relative neo-btn neo-btn-outline py-2 px-3 hover-wiggle"
            >
              <span className="text-xl">🛒</span>
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 neo-badge bg-[var(--neo-pink)] text-white animate-pulse-scale">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Divider */}
            <div className="h-8 w-[3px] bg-[var(--neo-black)] rounded-full opacity-20 mx-1" />

            {/* Login Button */}
            <Link href="/login" id="login-link">
              <button
                id="login-btn"
                className="neo-btn neo-btn-accent font-extrabold text-sm"
              >
                ✨ Masuk
              </button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;