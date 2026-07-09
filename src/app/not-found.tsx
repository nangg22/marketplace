import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--neo-bg)]">
      <Navbar />

      <main className="flex-grow flex items-center justify-center px-4 py-20">
        <div className="neo-card max-w-md w-full p-10 text-center animate-bounce-in">
          {/* Angka 404 */}
          <div className="flex justify-center gap-2 mb-6">
            <span className="text-7xl font-extrabold bg-[#FF6B35] text-white px-4 py-2 border-[4px] border-[#1A1A2E] rounded-2xl shadow-[6px_6px_0px_#1A1A2E] rotate-[-3deg] inline-block">
              4
            </span>
            <span className="text-7xl font-extrabold bg-[#FFD23F] text-[#1A1A2E] px-4 py-2 border-[4px] border-[#1A1A2E] rounded-2xl shadow-[6px_6px_0px_#1A1A2E] rotate-[2deg] inline-block animate-float">
              0
            </span>
            <span className="text-7xl font-extrabold bg-[#7B4AE2] text-white px-4 py-2 border-[4px] border-[#1A1A2E] rounded-2xl shadow-[6px_6px_0px_#1A1A2E] rotate-[-1deg] inline-block">
              4
            </span>
          </div>

          <div className="text-5xl mb-4 animate-float" style={{ animationDelay: '0.5s' }}>🕵️‍♂️</div>

          <h1 className="text-2xl font-extrabold text-[#1A1A2E] mb-2">
            Halaman Tidak Ditemukan
          </h1>
          <p className="text-sm font-medium opacity-60 mb-8 leading-relaxed">
            Halaman yang kamu cari sudah pindah, dihapus, atau mungkin tidak pernah ada.
            Jangan khawatir, yuk balik ke beranda!
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/">
              <button className="neo-btn neo-btn-primary px-6 py-3 font-extrabold w-full sm:w-auto">
                🏠 Ke Beranda
              </button>
            </Link>
            <Link href="/products">
              <button className="neo-btn neo-btn-outline px-6 py-3 font-bold w-full sm:w-auto">
                🛍️ Lihat Produk
              </button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
