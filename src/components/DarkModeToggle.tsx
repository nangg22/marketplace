'use client';

import { useEffect, useState } from 'react';

export default function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Baca preferensi tersimpan
    const saved = localStorage.getItem('lakulagi-theme');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else if (saved === 'light') {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    } else {
      // Gunakan preferensi sistem
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
        setIsDark(true);
      }
    }
  }, []);

  const toggle = () => {
    const newDark = !isDark;
    setIsDark(newDark);

    if (newDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('lakulagi-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('lakulagi-theme', 'light');
    }
  };

  // Hindari hydration mismatch
  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-xl border-[2px] border-[var(--neo-black)] bg-[var(--neo-gray)] animate-pulse" />
    );
  }

  return (
    <button
      onClick={toggle}
      className="neo-btn neo-btn-outline py-2 px-2.5 font-bold text-lg hover:scale-110 transition-transform"
      aria-label={isDark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
      title={isDark ? 'Mode Terang' : 'Mode Gelap'}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}
