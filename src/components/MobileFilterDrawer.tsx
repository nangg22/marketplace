"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PriceFilter from "./PriceFilter";

interface MobileFilterDrawerProps {
  categories: { label: string; icon: string; value: string; slug: string }[];
  activeCategory: string;
  sort: string;
}

export default function MobileFilterDrawer({ categories, activeCategory, sort }: MobileFilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Count active filters
  const activeFilterCount = (activeCategory ? 1 : 0);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden w-full mb-4 sm:mb-6 neo-btn bg-[var(--neo-accent)] text-[var(--neo-black)] font-extrabold flex items-center justify-center gap-2 text-sm sm:text-base py-2.5 sm:py-3"
      >
        <span>⚙️</span> Filter & Kategori
        {activeFilterCount > 0 && (
          <span className="bg-[var(--neo-primary)] text-white text-xs px-2 py-0.5 rounded-full border-[2px] border-[var(--neo-black)]">
            {activeFilterCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer */}
          <div className="relative w-full max-w-[320px] h-full bg-[var(--neo-bg)] border-l-4 border-[var(--neo-black)] flex flex-col overflow-y-auto animate-slide-left">
            {/* Header */}
            <div className="p-4 border-b-4 border-[var(--neo-black)] flex justify-between items-center bg-[var(--neo-secondary)] text-white shrink-0">
              <h2 className="font-extrabold text-lg">Filter Produk</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="w-9 h-9 flex items-center justify-center bg-white text-black border-2 border-black rounded-lg font-bold hover:bg-gray-200 active:scale-95 transition-transform"
                aria-label="Tutup filter"
              >
                ✕
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
              {/* Kategori Section */}
              <div className="mb-6">
                <h3 className="font-extrabold text-xs sm:text-sm uppercase tracking-wider mb-3 pb-2 border-b-2 border-[var(--neo-black)]">
                  📂 Kategori
                </h3>
                <nav className="flex flex-col gap-1.5">
                  {categories.map((cat) => {
                    const isActive = activeCategory === cat.value;
                    return (
                      <Link
                        key={cat.value}
                        onClick={() => setIsOpen(false)}
                        href={`/products${cat.value ? `?category=${encodeURIComponent(cat.value)}` : ''}${sort !== 'newest' ? `${cat.value ? '&' : '?'}sort=${sort}` : ''}`}
                        className={`flex items-center gap-2.5 px-3 py-2.5 text-sm font-bold border-2 border-[var(--neo-black)] rounded-lg transition-colors active:scale-[0.98]
                          ${isActive
                            ? 'bg-[var(--neo-primary)] text-white shadow-[2px_2px_0px_var(--neo-black)]'
                            : 'bg-white text-[var(--neo-black)] hover:bg-[var(--neo-gray)]'
                          }`}
                      >
                        <span className="text-base">{cat.icon}</span>
                        <span>{cat.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Price Filter Section */}
              <div>
                <PriceFilter className="w-full" />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t-4 border-[var(--neo-black)] bg-white shrink-0">
              <Link
                onClick={() => setIsOpen(false)}
                href="/products"
                className="neo-btn neo-btn-primary w-full text-sm font-extrabold"
              >
                🔄 Reset Semua Filter
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
