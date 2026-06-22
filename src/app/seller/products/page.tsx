import { db } from '@/lib/db';
import { products } from '@/lib/schema';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default async function SellerProductsPage() {
  const data = await db.select().from(products);

  const formatRupiah = (price: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
  };

  return (
    <div className="bg-[var(--neo-bg)] min-h-screen flex flex-col text-[var(--neo-black)]">
      <Navbar />
      
      <main className="flex-grow max-w-5xl mx-auto px-4 py-10 w-full relative">
        {/* Dekorasi Latar */}
        <div className="absolute top-0 right-10 text-6xl animate-float opacity-30 select-none hidden lg:block">🏪</div>
        <div className="absolute bottom-20 left-10 text-5xl animate-float opacity-30 select-none hidden lg:block" style={{ animationDelay: '1s' }}>📦</div>

        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 animate-slide-up">
          <div>
            <h1 className="text-3xl font-extrabold flex items-center gap-3">
              <span className="bg-[var(--neo-secondary)] text-white px-3 py-1 border-[3px] border-[var(--neo-black)] rounded-xl shadow-[var(--neo-shadow-sm)] rotate-[-2deg]">
                Dashboard
              </span>
              Produk Saya
            </h1>
            <p className="font-semibold opacity-60 mt-2">Kelola produk toko Anda di sini.</p>
          </div>
          
          <button className="neo-btn neo-btn-primary hover-wiggle">
            <span className="text-xl">➕</span> Tambah Produk
          </button>
        </div>

        {/* List Produk */}
        {data.length === 0 ? (
          <div className="neo-card p-12 text-center animate-slide-up stagger-1">
            <div className="text-6xl mb-4 animate-bounce-in">📭</div>
            <h2 className="text-xl font-bold mb-2">Toko Anda Masih Kosong</h2>
            <p className="opacity-60 mb-6 font-medium">Belum ada produk yang dijual. Ayo tambahkan sekarang!</p>
            <button className="neo-btn neo-btn-accent">Mulai Jualan</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up stagger-1">
            {data.map((item, index) => (
              <div key={item.id} className={`neo-card flex flex-col p-5 hover-lift stagger-${Math.min(index + 1, 12)}`}>
                <div className="flex justify-between items-start mb-4">
                  <h2 className="font-bold text-lg leading-tight line-clamp-2">{item.name}</h2>
                  <span className="neo-sticker bg-[var(--neo-accent)] text-xs ml-2 rotate-[3deg]">Dijual</span>
                </div>
                
                <div className="mt-auto">
                  <div className="bg-[var(--neo-gray)] border-[2px] border-[var(--neo-black)] rounded-lg px-3 py-2 mb-4 inline-block font-extrabold text-[var(--neo-black)] shadow-[2px_2px_0px_var(--neo-black)]">
                    {formatRupiah(item.price)}
                  </div>
                  
                  <div className="flex gap-2">
                    <button className="neo-btn neo-btn-outline flex-1 py-2 text-sm">✏️ Edit</button>
                    <button className="neo-btn neo-btn-outline flex-1 py-2 text-sm bg-red-100 hover:bg-[var(--neo-pink)] hover:text-white transition-colors">🗑️ Hapus</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}