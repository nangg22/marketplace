'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { upgradeToSeller } from './actions';

export default function BecomeSellerPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login?tab=seller&callbackUrl=/become-seller');
      return;
    }

    const role = session?.user?.role;
    if (status === 'authenticated' && role === 'seller') {
      router.replace('/seller/dashboard');
    }
    if (status === 'authenticated' && role === 'admin') {
      router.replace('/admin/dashboard');
    }
  }, [router, session, status]);

  const handleUpgrade = () => {
    setError('');
    startTransition(async () => {
      const result = await upgradeToSeller();

      if (!result.success) {
        setError(result.error || 'Gagal mengaktifkan akun penjual.');
        return;
      }

      await update({ role: 'seller' });
      setIsDone(true);
      router.push('/seller/dashboard');
      router.refresh();
    });
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[var(--neo-bg)] flex items-center justify-center">
        <div className="text-4xl animate-float">⏳</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--neo-bg)] flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-4xl mx-auto w-full px-4 py-10">
        <div className="neo-card overflow-hidden animate-slide-up">
          <div className="bg-[var(--neo-secondary)] text-white border-b-[4px] border-[var(--neo-black)] px-6 py-8">
            <div className="inline-flex items-center gap-2 text-xs font-extrabold px-3 py-1 rounded-xl bg-white text-[var(--neo-black)] border-[2px] border-[var(--neo-black)] mb-4">
              🏪 Aktivasi Mode Penjual
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">
              Ubah akun pembeli kamu jadi akun penjual
            </h1>
            <p className="mt-3 font-semibold text-white/80 max-w-2xl">
              Setelah diaktifkan, kamu bisa melengkapi profil toko, menghubungkan rekening pembayaran,
              dan mulai upload produk pertama langsung dari dashboard penjual.
            </p>
          </div>

          <div className="p-6 md:p-8 bg-white">
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {[
                { icon: '🏪', title: 'Profil Toko', desc: 'Isi nama toko dan deskripsi agar calon pembeli lebih percaya.' },
                { icon: '📦', title: 'Jual Produk', desc: 'Upload produk preloved, atur harga, stok, dan kondisi barang.' },
                { icon: '💳', title: 'Atur Pembayaran', desc: 'Hubungkan rekening agar hasil penjualan siap dicairkan.' },
              ].map((item) => (
                <div key={item.title} className="neo-card p-4">
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <h2 className="font-extrabold mb-1">{item.title}</h2>
                  <p className="text-sm opacity-70 font-medium">{item.desc}</p>
                </div>
              ))}
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl border-[2px] border-red-500 bg-red-50 text-red-700 font-bold text-sm">
                ❌ {error}
              </div>
            )}

            {isDone && (
              <div className="mb-4 p-3 rounded-xl border-[2px] border-green-500 bg-green-50 text-green-700 font-bold text-sm">
                ✅ Akun berhasil diaktifkan sebagai penjual. Mengarahkan ke dashboard...
              </div>
            )}

            <div className="neo-card p-4 bg-[var(--neo-accent)]/20 mb-6">
              <p className="text-sm font-bold opacity-80">
                Aktivasi ini tidak menghapus data akunmu. Riwayat profil dan akun tetap aman, hanya peran akun yang
                diperluas agar kamu bisa mulai berjualan.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleUpgrade}
                disabled={isPending || isDone}
                className="neo-btn neo-btn-secondary px-6 py-3 font-extrabold disabled:opacity-50"
              >
                {isPending ? '⏳ Mengaktifkan akun penjual...' : '🚀 Aktifkan Akun Penjual'}
              </button>
              <Link href="/" className="neo-btn neo-btn-outline px-6 py-3 font-extrabold">
                Nanti Saja
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
