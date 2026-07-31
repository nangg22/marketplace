'use client';

import { signIn, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState, Suspense } from 'react';
import Link from 'next/link';

function getSafeCallbackUrl(callbackUrl: string | null) {
  if (!callbackUrl || !callbackUrl.startsWith('/') || callbackUrl.startsWith('//')) {
    return null;
  }

  return callbackUrl;
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get('registered') === '1';
  const justUpgraded = searchParams.get('upgraded') === '1';
  const tabParam = searchParams.get('tab');
  const callbackUrl = getSafeCallbackUrl(searchParams.get('callbackUrl'));

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'customer' | 'seller'>(tabParam === 'seller' ? 'seller' : 'customer');

  const registerHref = useMemo(() => {
    const params = new URLSearchParams();
    params.set('role', activeTab);
    if (callbackUrl) params.set('callbackUrl', callbackUrl);
    return `/register?${params.toString()}`;
  }, [activeTab, callbackUrl]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (res?.error) { 
      setError('Email atau password salah! Coba lagi ya 😅');
      setLoading(false);
    } else {
      const sessionData = await getSession();
      const role = sessionData?.user?.role;

      let target = callbackUrl;
      if (!target) {
        if (role === 'seller') {
          target = '/seller/dashboard';
        } else if (role === 'admin') {
          target = '/admin/dashboard';
        } else {
          target = '/';
        }
      }

      router.push(target);
      router.refresh();
    }
  };

  return (
    <>
      <div className="relative max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8 animate-bounce-in">
          <Link href="/" className="inline-block">
            <span className="text-3xl font-extrabold tracking-tight">
              <span className="inline-block bg-[var(--neo-primary)] text-white px-3 py-1 border-[3px] border-[var(--neo-black)] rounded-xl shadow-[var(--neo-shadow-sm)] hover:rotate-[-2deg] transition-transform duration-200">
                Laku
              </span>
              <span className="text-[var(--neo-black)] ml-1">Lagi</span>
            </span>
          </Link>
        </div>

        {/* Tab Pembeli / Penjual */}
        <div className="flex gap-2 mb-4 animate-slide-up stagger-1 relative z-10">
          <button
            type="button"
            id="tab-customer"
            onClick={() => { setActiveTab('customer'); setError(''); }}
            className={`neo-btn flex-1 text-sm py-3 font-extrabold transition-all duration-200 ${
              activeTab === 'customer'
                ? 'neo-btn-primary shadow-[var(--neo-shadow)]'
                : 'neo-btn-outline opacity-70 hover:opacity-100'
            }`}
          >
            🛒 Pembeli
          </button>
          <button
            type="button"
            id="tab-seller"
            onClick={() => { setActiveTab('seller'); setError(''); }}
            className={`neo-btn flex-1 text-sm py-3 font-extrabold transition-all duration-200 ${
              activeTab === 'seller'
                ? 'neo-btn-secondary shadow-[var(--neo-shadow)]'
                : 'neo-btn-outline opacity-70 hover:opacity-100'
            }`}
          >
            🏪 Penjual
          </button>
        </div>

        {/* Card Login */}
        <div className="neo-card p-8 animate-slide-up stagger-2">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="mb-3">
              <span className={`neo-sticker text-sm ${
                activeTab === 'customer'
                  ? 'bg-[var(--neo-accent)] text-[var(--neo-black)]'
                  : 'bg-[var(--neo-secondary)] text-white'
              }`}>
                {activeTab === 'customer' ? '🛍️ Login Pembeli' : '🏪 Login Penjual'}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-[var(--neo-black)]">
              Masuk ke{' '}
              <span className={`inline-block px-2 py-0.5 border-[2px] border-[var(--neo-black)] rounded-lg ${
                activeTab === 'customer'
                  ? 'bg-[var(--neo-primary)] text-white'
                  : 'bg-[var(--neo-secondary)] text-white'
              }`}>
                LakuLagi
              </span>
            </h1>
            <p className="mt-2 text-sm font-medium text-[var(--neo-black)] opacity-60">
              {activeTab === 'customer'
                ? 'Selamat datang kembali! Yuk lanjut belanja 🚀'
                : 'Ayo kelola toko & produkmu sekarang 💪'}
            </p>
          </div>

          {/* Notif daftar sukses */}
          {justRegistered && (
            <div className="mb-4 p-3 border-[2px] border-[var(--neo-green)] rounded-xl font-bold text-sm flex items-center gap-2" style={{ backgroundColor: '#E8F5E9', color: '#1B5E20' }}>
              ✅ Akun berhasil dibuat! Silakan masuk.
            </div>
          )}

          {justUpgraded && (
            <div className="mb-4 p-3 border-[2px] border-[var(--neo-secondary)] rounded-xl font-bold text-sm flex items-center gap-2 bg-[var(--neo-secondary)]/10 text-[var(--neo-secondary)]">
              🏪 Mode penjual aktif. Masuk lagi untuk membuka dashboard penjualmu.
            </div>
          )}

          {/* Error Notification */}
          {error && (
            <div className="p-3 text-sm text-center mb-4 font-bold border-[3px] border-[var(--neo-black)] rounded-xl" style={{ backgroundColor: '#FF4081', color: '#FFFFFF', boxShadow: '3px 3px 0px #1A1A2E' }}>
              ❌ {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-[var(--neo-black)] mb-1.5">
                📧 Email
              </label>
              <input
                name="email"
                type="email"
                required
                id="login-email"
                className="neo-input"
                placeholder="nama@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--neo-black)] mb-1.5">
                🔒 Password
              </label>
              <input
                name="password"
                type="password"
                required
                id="login-password"
                className="neo-input"
                placeholder="••••••••"
              />
            </div>

            {/* Indicator Role */}
            <div className={`flex items-center gap-2 p-3 rounded-lg border-[2px] border-dashed text-sm font-bold ${
              activeTab === 'customer'
                ? 'border-[var(--neo-primary)] bg-[var(--neo-primary)]/5 text-[var(--neo-primary)]'
                : 'border-[var(--neo-secondary)] bg-[var(--neo-secondary)]/5 text-[var(--neo-secondary)]'
            }`}>
              <span className="text-lg">{activeTab === 'customer' ? '🛒' : '🏪'}</span>
              <span>Login sebagai {activeTab === 'customer' ? 'Pembeli' : 'Penjual'}</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              id="login-submit-btn"
              className={`neo-btn w-full text-base py-3.5 font-extrabold ${
                activeTab === 'customer' ? 'neo-btn-primary' : 'neo-btn-secondary'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block animate-spin-slow">⏳</span>
                  Sedang memproses...
                </span>
              ) : (
                <span>🚀 Masuk Sekarang</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-[2px] bg-[var(--neo-black)] opacity-10" />
            <span className="text-xs font-bold text-[var(--neo-black)] opacity-40">ATAU</span>
            <div className="flex-1 h-[2px] bg-[var(--neo-black)] opacity-10" />
          </div>

          {/* Register Link */}
          <div className="text-center">
            <p className="text-sm font-medium text-[var(--neo-black)] opacity-60 mb-3">
              Belum punya akun?
            </p>
            <Link href={registerHref} id="register-link">
              <span className="neo-btn neo-btn-accent text-sm font-extrabold w-full inline-flex">
                ✨ Daftar Gratis Sekarang
              </span>
            </Link>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6 animate-slide-up stagger-3">
          <Link href="/" className="neo-link text-sm font-bold text-[var(--neo-black)] opacity-60 hover:opacity-100 transition-opacity">
            ← Kembali ke Beranda
          </Link>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--neo-bg)] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 neo-dots-pattern" />
      <div className="absolute top-10 left-10 text-5xl animate-float select-none opacity-60 hidden lg:block">🛍️</div>
      <div className="absolute top-20 right-20 text-4xl animate-float select-none opacity-50 hidden lg:block" style={{ animationDelay: '1s' }}>🏪</div>
      <div className="absolute bottom-30 left-1/4 text-3xl animate-float select-none opacity-40 hidden lg:block" style={{ animationDelay: '0.5s' }}>⭐</div>
      <div className="absolute bottom-40 right-1/4 text-4xl animate-spin-slow select-none opacity-30 hidden lg:block">✦</div>
      <div className="absolute top-50 left-50 text-4xl animate-float select-none opacity-50 hidden lg:block" style={{ animationDelay: '1s' }}>🏪</div>
      <div className="absolute right-70 bottom-20 text-5xl animate-float select-none opacity-50 hidden lg:block">🛍️</div>
      <div className="absolute bottom-90 left-1/4 text-5xl animate-spin-slow select-none opacity-40 hidden lg:block">✦</div>
      <div className="absolute bottom-110 right-40 text-4xl animate-float select-none opacity-40 hidden lg:block" style={{ animationDelay: '0.5s' }}>⭐</div>
      <div className="absolute bottom-120 left-40 text-4xl animate-float select-none opacity-60 hidden lg:block" style={{ animationDelay: '0.5s' }}>🤩</div>
      <div className="absolute bottom-130 right-1/4 text-4xl animate-float select-none opacity-60 hidden lg:block" style={{ animationDelay: '0.5s' }}>💖</div>

      <Suspense fallback={<div className="text-xl font-bold animate-pulse z-10">Loading...</div>}>
        <LoginContent />
      </Suspense>
    </div>
  );
}
