'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      // Selalu tampilkan pesan sukses untuk mencegah email enumeration
      setSubmitted(true);
    } catch {
      setError('Terjadi kesalahan. Coba lagi.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--neo-bg)] py-12 px-4 relative overflow-hidden">
      <div className="absolute inset-0 neo-dots-pattern" />

      <div className="relative max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8 animate-bounce-in">
          <Link href="/">
            <span className="text-3xl font-extrabold tracking-tight">
              <span className="inline-block bg-[var(--neo-primary)] text-white px-3 py-1 border-[3px] border-[var(--neo-black)] rounded-xl shadow-[var(--neo-shadow-sm)] hover:rotate-[-2deg] transition-transform duration-200">
                Laku
              </span>
              <span className="text-[var(--neo-black)] ml-1">Lagi</span>
            </span>
          </Link>
        </div>

        <div className="neo-card p-8 animate-slide-up">
          {!submitted ? (
            <>
              <div className="text-center mb-6">
                <div className="text-5xl mb-3">🔑</div>
                <h1 className="text-2xl font-extrabold text-[var(--neo-black)]">Lupa Password?</h1>
                <p className="mt-2 text-sm font-medium opacity-60">
                  Masukkan email akunmu dan kami akan kirim instruksi reset.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border-[2px] border-red-400 rounded-xl font-bold text-sm text-red-700">
                  ❌ {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-1.5">📧 Email Akun</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="nama@email.com"
                    className="neo-input"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="neo-btn neo-btn-primary w-full py-3.5 font-extrabold disabled:opacity-50"
                >
                  {loading ? '⏳ Mengirim...' : '📨 Kirim Link Reset'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="text-6xl mb-4 animate-bounce-in">📬</div>
              <h2 className="text-xl font-extrabold mb-3">Cek Email Kamu!</h2>
              <p className="text-sm font-medium opacity-70 mb-6 leading-relaxed">
                Kalau email <strong>{email}</strong> terdaftar di LakuLagi, kamu akan menerima link reset password dalam beberapa menit.
                <br /><br />
                Cek folder <strong>Spam/Junk</strong> jika tidak masuk inbox.
              </p>
              <div className="p-4 bg-[var(--neo-accent)]/20 border-[2px] border-dashed border-[var(--neo-black)]/30 rounded-xl text-sm font-bold opacity-70">
                💡 Link reset berlaku selama <strong>1 jam</strong>.
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-[2px] bg-[var(--neo-black)] opacity-10" />
            <span className="text-xs font-bold opacity-40">ATAU</span>
            <div className="flex-1 h-[2px] bg-[var(--neo-black)] opacity-10" />
          </div>

          <div className="text-center space-y-2">
            <Link href="/login" className="neo-btn neo-btn-outline w-full inline-flex justify-center text-sm font-bold">
              ← Kembali ke Login
            </Link>
            <p className="text-xs opacity-50 font-medium">
              Belum punya akun?{' '}
              <Link href="/register" className="underline font-bold">Daftar gratis</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
