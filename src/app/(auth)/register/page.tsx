'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'customer' | 'seller'>(
    roleParam === 'seller' ? 'seller' : 'customer'
  );

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = (formData.get('name') as string).trim();
    const email = (formData.get('email') as string).trim();
    const password = formData.get('password') as string;

    if (name.length < 2) { setError('Nama minimal 2 karakter.'); setLoading(false); return; }
    if (password.length < 6) { setError('Password minimal 6 karakter.'); setLoading(false); return; }

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Pendaftaran gagal. Coba lagi.'); setLoading(false); return; }
      router.push('/login?registered=1');
    } catch {
      setError('Terjadi kesalahan jaringan. Coba lagi.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--neo-bg)] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 neo-grid-pattern" />
      <div className="absolute top-10 right-16 text-5xl animate-float select-none opacity-60 hidden lg:block">🎉</div>
      <div className="absolute top-24 left-20 text-4xl animate-float select-none opacity-50 hidden lg:block" style={{ animationDelay: '0.8s' }}>🚀</div>
      <div className="absolute bottom-20 right-1/4 text-3xl animate-float select-none opacity-40 hidden lg:block" style={{ animationDelay: '1.5s' }}>💎</div>
      <div className="absolute bottom-16 left-16 text-4xl animate-spin-slow select-none opacity-30 hidden lg:block">✦</div>

      <div className="relative max-w-md w-full">
        <div className="text-center mb-8 animate-bounce-in">
          <Link href="/">
            <span className="text-3xl font-extrabold tracking-tight">
              <span className="inline-block bg-[var(--neo-primary)] text-white px-3 py-1 border-[3px] border-[var(--neo-black)] rounded-xl shadow-[var(--neo-shadow-sm)] hover:rotate-[-2deg] transition-transform duration-200">
                Mall
              </span>
              <span className="text-[var(--neo-black)] ml-1">Pedia</span>
            </span>
          </Link>
        </div>

        <div className="flex justify-center mb-4 animate-slide-up">
          <span className="neo-sticker bg-[#00C853] text-[#1A1A2E] text-sm">🆓 Gratis, Tanpa Biaya!</span>
        </div>

        <div className="neo-card p-8 animate-slide-up stagger-1">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-extrabold text-[var(--neo-black)]">
              Daftar di{' '}
              <span className="inline-block bg-[var(--neo-secondary)] text-white px-2 py-0.5 border-[2px] border-[var(--neo-black)] rounded-lg">
                MallPedia
              </span>
            </h1>
            <p className="mt-2 text-sm font-medium text-[var(--neo-black)] opacity-60">
              Mulai belanja atau berjualan dalam hitungan detik ⚡
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border-[2px] border-red-400 rounded-xl font-bold text-sm text-red-700 flex items-center gap-2">
              ❌ {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-[var(--neo-black)] mb-1.5">👤 Nama Lengkap</label>
              <input name="name" type="text" required minLength={2} className="neo-input" placeholder="Nama kamu" />
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--neo-black)] mb-1.5">📧 Email</label>
              <input name="email" type="email" required className="neo-input" placeholder="nama@email.com" />
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--neo-black)] mb-1.5">🔒 Password</label>
              <input name="password" type="password" required minLength={6} className="neo-input" placeholder="Minimal 6 karakter" />
              <p className="text-xs font-semibold opacity-50 mt-1">Minimal 6 karakter</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--neo-black)] mb-2">🎭 Daftar Sebagai</label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setRole('customer')}
                  className={`neo-card p-3 text-center text-sm font-bold transition-all duration-200 hover:translate-y-[-2px] ${role === 'customer' ? 'bg-[#FF6B35] text-white shadow-[var(--neo-shadow)]' : ''}`}>
                  <div className="text-2xl mb-1">🛒</div>
                  <div>Pembeli</div>
                </button>
                <button type="button" onClick={() => setRole('seller')}
                  className={`neo-card p-3 text-center text-sm font-bold transition-all duration-200 hover:translate-y-[-2px] ${role === 'seller' ? 'bg-[#7B4AE2] text-white shadow-[var(--neo-shadow)]' : ''}`}>
                  <div className="text-2xl mb-1">🏪</div>
                  <div>Penjual</div>
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="neo-btn neo-btn-primary w-full text-base py-3.5 font-extrabold disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? <span className="flex items-center justify-center gap-2"><span className="animate-spin-slow inline-block">⏳</span>Mendaftar...</span> : '🚀 Daftar Sekarang'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-[2px] bg-[var(--neo-black)] opacity-10" />
            <span className="text-xs font-bold text-[var(--neo-black)] opacity-40">ATAU</span>
            <div className="flex-1 h-[2px] bg-[var(--neo-black)] opacity-10" />
          </div>

          <div className="text-center">
            <p className="text-sm font-medium text-[var(--neo-black)] opacity-60 mb-3">Sudah punya akun?</p>
            <Link href="/login">
              <span className="neo-btn neo-btn-accent text-sm font-extrabold w-full inline-flex justify-center">
                🔑 Masuk ke Akun
              </span>
            </Link>
          </div>
        </div>

        <div className="text-center mt-6 animate-slide-up stagger-3">
          <Link href="/" className="neo-link text-sm font-bold text-[var(--neo-black)] opacity-60 hover:opacity-100">
            ← Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}

// Bungkus dengan Suspense karena useSearchParams butuh Suspense boundary
export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--neo-bg)]">
        <div className="text-4xl animate-float">⏳</div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
