import { getMyWishlists } from './actions';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductsCard from '@/components/ProductCard';
import Link from 'next/link';

export const metadata = {
  title: 'Barang Favorit | LakuLagi',
};

export default async function WishlistPage() {
  const result = await getMyWishlists();
  
  if (!result.success && result.error === 'Unauthorized') {
    return (
      <div className="flex flex-col min-h-screen bg-[var(--neo-bg)]">
        <Navbar />
        <main className="flex-grow flex items-center justify-center p-4">
          <div className="neo-card p-10 text-center max-w-md w-full animate-slide-up">
            <span className="text-6xl mb-4 block">🔒</span>
            <h1 className="text-2xl font-extrabold mb-3">Akses Ditolak</h1>
            <p className="font-medium opacity-70 mb-6">Silakan login untuk melihat daftar barang favorit Anda.</p>
            <Link href="/login" className="neo-btn neo-btn-primary w-full">
              Ke Halaman Login
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const wishlists = result.wishlists || [];

  return (
    <div className="flex flex-col min-h-screen bg-[var(--neo-bg)]">
      <Navbar />
      <main className="flex-grow max-w-7xl mx-auto px-4 py-8 w-full">
        <div className="flex items-center gap-3 mb-6 border-b-[3px] border-[var(--neo-black)] pb-4 animate-slide-up">
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <span className="bg-[var(--neo-black)] text-[var(--neo-accent)] p-2 rounded-xl text-lg rotate-[-3deg]">❤️</span>
            Barang Favorit
          </h1>
          <span className="text-sm font-bold opacity-50">({wishlists.length} barang)</span>
        </div>

        {wishlists.length === 0 ? (
          <div className="neo-card text-center py-16 px-6 max-w-2xl mx-auto animate-bounce-in">
            <div className="text-6xl mb-4">🤍</div>
            <h2 className="text-xl font-extrabold text-[var(--neo-black)] mb-2">Belum Ada Favorit</h2>
            <p className="text-sm font-medium text-[var(--neo-black)] opacity-50 mb-6">
              Simpan barang-barang incaranmu di sini agar tidak hilang!
            </p>
            <Link href="/products" className="neo-btn neo-btn-primary">
              Mulai Belanja
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {wishlists.map((w, i) => (
              <ProductsCard key={w.id} product={w.product as any} index={i} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
