'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">❌</div>
        <h2 className="text-xl font-extrabold mb-2">Link Tidak Valid</h2>
        <p className="text-sm opacity-60 mb-4">Token reset password tidak ditemukan.</p>
        <Link href="/forgot-password" className="neo-btn neo-btn-primary">Minta Link Baru</Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) { setError('Password minimal 6 karakter.'); return; }
    if (password !== confirm) { setError('Konfirmasi password tidak cocok.'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Gagal reset password.');
      } else {
        setSuccess(true);
        setTimeout(() => router.push('/login'), 3000);
      }
    } catch {
      setError('Terjadi kesalahan jaringan.');
    }
    setLoading(false);
  };

  return (
    <div className="neo-card p-8 animate-slide-up">
      {!success ? (
        <>
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🔐</div>
            <h1 className="text-2xl font-extrabold">Buat Password Baru</h1>
            <p className="mt-2 text-sm opacity-60">Minimal 6 karakter.</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border-[2px] border-red-400 rounded-xl font-bold text-sm text-red-700">
              ❌ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-1.5">🔒 Password Baru</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Minimal 6 karakter"
                className="neo-input"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1.5">🔒 Konfirmasi Password</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                placeholder="Ulangi password baru"
                className="neo-input"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="neo-btn neo-btn-primary w-full py-3.5 font-extrabold disabled:opacity-50"
            >
              {loading ? '⏳ Menyimpan...' : '✅ Simpan Password Baru'}
            </button>
          </form>
        </>
      ) : (
        <div className="text-center py-4">
          <div className="text-6xl mb-4 animate-bounce-in">🎉</div>
          <h2 className="text-xl font-extrabold mb-2">Password Berhasil Diubah!</h2>
          <p className="text-sm opacity-60 mb-4">Kamu akan diarahkan ke halaman login...</p>
          <Link href="/login" className="neo-btn neo-btn-primary">Masuk Sekarang</Link>
        </div>
      )}

      <div className="text-center mt-6">
        <Link href="/login" className="text-sm font-bold opacity-60 hover:opacity-100 neo-link">
          ← Kembali ke Login
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--neo-bg)] py-12 px-4 relative overflow-hidden">
      <div className="absolute inset-0 neo-dots-pattern" />
      <div className="relative max-w-md w-full">
        <div className="text-center mb-8 animate-bounce-in">
          <Link href="/">
            <span className="text-3xl font-extrabold">
              <span className="inline-block bg-[var(--neo-primary)] text-white px-3 py-1 border-[3px] border-[var(--neo-black)] rounded-xl shadow-[var(--neo-shadow-sm)]">
                Laku
              </span>
              <span className="text-[var(--neo-black)] ml-1">Lagi</span>
            </span>
          </Link>
        </div>
        <Suspense fallback={<div className="text-center py-8 text-2xl animate-float">⏳</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
