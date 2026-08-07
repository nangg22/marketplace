'use client';

import { useRouter, usePathname } from 'next/navigation';

export default function BackButton() {
  const router = useRouter();
  const pathname = usePathname();

  // Jangan tampilkan tombol kembali di halaman utama (homepage)
  if (pathname === '/') return null;

  return (
    <button
      onClick={() => router.back()}
      className="hidden md:flex fixed bottom-10 left-10 z-[100] neo-btn bg-[var(--neo-accent)] text-[var(--neo-black)] border-[3px] border-[var(--neo-black)] rounded-full w-14 h-14 p-0 items-center justify-center shadow-[4px_4px_0px_var(--neo-black)] hover-wiggle"
      aria-label="Kembali"
    >
      <span className="text-3xl font-extrabold translate-y-[-2px]">🔙</span>
    </button>
  );
}
