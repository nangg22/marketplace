'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useCartStore } from '@/lib/store';
import { useSession, signOut } from 'next-auth/react';

const Navbar = () => {
  const cartItems = useCartStore((state) => state.items);
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
  const { data: session, status } = useSession();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const user = session?.user;

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Menu links berdasarkan role
  const roleMenus = {
    customer: [
      { href: '/profile', icon: '👤', label: 'Profil & Biodata' },
      { href: '/customer/orders', icon: '🧾', label: 'Riwayat Pesanan' },
      { href: '/customer/cart', icon: '🛒', label: 'Keranjang' },
    ],
    seller: [
      { href: '/seller/dashboard', icon: '📊', label: 'Dashboard' },
      { href: '/seller/products', icon: '📦', label: 'Produk Saya' },
      { href: '/seller/products/create', icon: '➕', label: 'Tambah Produk' },
      { href: '/seller/orders', icon: '🧾', label: 'Pesanan Masuk' },
      { href: '/profile', icon: '👤', label: 'Edit Profil' },
    ],
    admin: [
      { href: '/admin/dashboard', icon: '⚙️', label: 'Admin Dashboard' },
      { href: '/admin/users', icon: '👥', label: 'Kelola User' },
      { href: '/admin/products', icon: '📦', label: 'Kelola Produk' },
      { href: '/admin/transactions', icon: '🧾', label: 'Transaksi' },
      { href: '/profile', icon: '👤', label: 'Edit Profil' },
    ],
  };

  const currentMenus = user?.role ? (roleMenus[user.role] || []) : [];

  const roleBadgeStyle = {
    customer: 'bg-[#FF6B35] text-white',
    seller: 'bg-[#7B4AE2] text-white',
    admin: 'bg-[#1A1A2E] text-[#FFD23F]',
  };

  return (
    <nav className="bg-[var(--neo-white)] border-b-[4px] border-[var(--neo-black)] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* ===== LOGO ===== */}
          <Link href="/" className="flex-shrink-0 flex items-center group" onClick={() => { setMobileOpen(false); setDropdownOpen(false); }}>
            <span className="text-xl sm:text-2xl font-extrabold tracking-tight">
              <span className="inline-block bg-[var(--neo-primary)] text-white px-2 py-0.5 border-[3px] border-[var(--neo-black)] rounded-lg shadow-[var(--neo-shadow-sm)] group-hover:rotate-[-2deg] transition-transform duration-200">
                Mall
              </span>
              <span className="text-[var(--neo-black)] ml-1 group-hover:rotate-[2deg] inline-block transition-transform duration-200">
                Pedia
              </span>
            </span>
          </Link>

          {/* ===== SEARCH — desktop ===== */}
          <form action="/search" method="GET" className="flex-1 max-w-xl mx-4 hidden md:block">
            <div className="relative">
              <input
                type="text"
                name="q"
                placeholder="🔍 Cari barang keren..."
                className="neo-input pr-12 h-10 text-sm"
              />
              <button
                type="submit"
                className="absolute right-1 top-1 bottom-1 px-3 bg-[var(--neo-accent)] border-[2px] border-[var(--neo-black)] rounded-lg font-bold text-sm hover:bg-[var(--neo-primary)] hover:text-white transition-colors"
              >
                Cari
              </button>
            </div>
          </form>

          {/* ===== RIGHT DESKTOP ===== */}
          <div className="hidden md:flex items-center gap-2">
            {/* Cart */}
            <Link href="/customer/cart" className="relative neo-btn neo-btn-outline py-2 px-3">
              <span className="text-lg">🛒</span>
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 neo-badge bg-[var(--neo-pink)] text-white text-xs min-w-[18px] h-[18px]">
                  {totalItems}
                </span>
              )}
            </Link>

            <div className="h-7 w-[2px] bg-[var(--neo-black)] opacity-20" />

            {status === 'loading' ? (
              <div className="w-9 h-9 rounded-xl bg-[var(--neo-gray)] border-[2px] border-[var(--neo-black)] animate-pulse" />
            ) : session ? (
              /* ===== USER DROPDOWN ===== */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 neo-btn neo-btn-outline py-1.5 px-3 hover:bg-[var(--neo-gray)]"
                >
                  {/* Avatar */}
                  <div className={`w-7 h-7 rounded-lg border-[2px] border-[var(--neo-black)] flex items-center justify-center font-extrabold text-sm flex-shrink-0 ${roleBadgeStyle[user?.role] || 'bg-[var(--neo-gray)]'}`}>
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex flex-col text-left max-w-[80px]">
                    <span className="text-xs font-extrabold leading-tight truncate">{user?.name}</span>
                    <span className="text-[10px] opacity-50 font-bold capitalize leading-none">{user?.role}</span>
                  </div>
                  <span className={`text-xs transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}>▼</span>
                </button>

                {/* Dropdown panel */}
                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white border-[3px] border-[var(--neo-black)] rounded-2xl shadow-[var(--neo-shadow-lg)] overflow-hidden z-50 animate-slide-up">
                    {/* Header */}
                    <div className={`px-4 py-3 border-b-[3px] border-[var(--neo-black)] ${roleBadgeStyle[user?.role] || 'bg-[var(--neo-gray)]'}`}>
                      <p className="font-extrabold text-sm leading-tight">{user?.name}</p>
                      <p className="text-xs opacity-80 truncate">{user?.email}</p>
                    </div>

                    {/* Menu items */}
                    <nav className="py-1">
                      {currentMenus.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold hover:bg-[var(--neo-gray)] transition-colors"
                        >
                          <span className="text-base w-5 text-center">{item.icon}</span>
                          {item.label}
                        </Link>
                      ))}
                    </nav>

                    {/* Logout */}
                    <div className="border-t-[2px] border-dashed border-[var(--neo-black)]/20 p-2">
                      <button
                        onClick={() => { signOut({ callbackUrl: '/' }); setDropdownOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-[var(--neo-pink)] hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <span className="text-base w-5 text-center">🚪</span>
                        Keluar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <button className="neo-btn neo-btn-accent font-extrabold text-sm">
                    ✨ Masuk
                  </button>
                </Link>
                <Link href="/register">
                  <button className="neo-btn neo-btn-outline font-bold text-sm">
                    Daftar
                  </button>
                </Link>
              </div>
            )}
          </div>

          {/* ===== MOBILE RIGHT: cart + hamburger ===== */}
          <div className="flex md:hidden items-center gap-2">
            <Link href="/customer/cart" className="relative neo-btn neo-btn-outline py-1.5 px-2.5">
              <span className="text-base">🛒</span>
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 neo-badge bg-[var(--neo-pink)] text-white text-[10px] min-w-[16px] h-[16px]">
                  {totalItems}
                </span>
              )}
            </Link>

            {session ? (
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className={`w-9 h-9 rounded-xl border-[3px] border-[var(--neo-black)] flex items-center justify-center font-extrabold text-base shadow-[2px_2px_0px_var(--neo-black)] ${roleBadgeStyle[user?.role] || 'bg-[var(--neo-gray)]'}`}
                aria-label="Menu"
              >
                {mobileOpen ? '✕' : user?.name?.charAt(0)?.toUpperCase()}
              </button>
            ) : (
              <Link href="/login">
                <button className="neo-btn neo-btn-accent text-xs font-extrabold py-1.5 px-3">
                  Masuk
                </button>
              </Link>
            )}
          </div>
        </div>

        {/* ===== MOBILE SEARCH ===== */}
        <div className="md:hidden pb-2">
          <form action="/search" method="GET">
            <div className="relative">
              <input
                type="text"
                name="q"
                placeholder="🔍 Cari barang..."
                className="neo-input pr-16 h-9 text-sm"
              />
              <button
                type="submit"
                className="absolute right-1 top-1 bottom-1 px-3 bg-[var(--neo-accent)] border-[2px] border-[var(--neo-black)] rounded-lg font-bold text-xs"
              >
                Cari
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ===== MOBILE DROPDOWN MENU ===== */}
      {mobileOpen && session && (
        <div className="md:hidden border-t-[3px] border-[var(--neo-black)] bg-[var(--neo-white)]">
          {/* User info header */}
          <div className={`px-4 py-3 flex items-center gap-3 border-b-[2px] border-dashed border-[var(--neo-black)]/20 ${roleBadgeStyle[user?.role] || 'bg-[var(--neo-gray)]'}`}>
            <div className="w-10 h-10 rounded-xl border-[3px] border-white/50 bg-white/20 flex items-center justify-center font-extrabold text-xl flex-shrink-0">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <p className="font-extrabold text-sm leading-tight">{user?.name}</p>
              <p className="text-xs opacity-80 font-medium capitalize">{user?.role} · {user?.email}</p>
            </div>
          </div>

          {/* Menu items */}
          <nav className="px-3 py-3 space-y-1">
            {currentMenus.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm hover:bg-[var(--neo-gray)] border-[2px] border-transparent hover:border-[var(--neo-black)] transition-all"
              >
                <span className="text-lg w-6 text-center">{item.icon}</span>
                {item.label}
              </Link>
            ))}

            <button
              onClick={() => { signOut({ callbackUrl: '/' }); setMobileOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-[var(--neo-pink)] hover:bg-red-50 border-[2px] border-transparent hover:border-red-200 transition-all"
            >
              <span className="text-lg w-6 text-center">🚪</span>
              Keluar
            </button>
          </nav>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
