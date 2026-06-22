import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  async function handleRegister(formData: FormData) {
    'use server';
    
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as 'customer' | 'seller';

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      await db.insert(users).values({
        name,
        email,
        password: hashedPassword,
        role,
      });
    } catch (error) {
      console.error("Gagal mendaftar. Email mungkin sudah dipakai.");
    }

    redirect('/login'); 
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--neo-bg)] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 neo-grid-pattern" />
      <div className="absolute top-10 right-16 text-5xl animate-float select-none opacity-60 hidden lg:block">🎉</div>
      <div className="absolute top-24 left-20 text-4xl animate-float select-none opacity-50 hidden lg:block" style={{ animationDelay: '0.8s' }}>🚀</div>
      <div className="absolute bottom-20 right-1/4 text-3xl animate-float select-none opacity-40 hidden lg:block" style={{ animationDelay: '1.5s' }}>💎</div>
      <div className="absolute bottom-16 left-16 text-4xl animate-spin-slow select-none opacity-30 hidden lg:block">✦</div>

      <div className="relative max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8 animate-bounce-in">
          <Link href="/" className="inline-block">
            <span className="text-3xl font-extrabold tracking-tight">
              <span className="inline-block bg-[var(--neo-primary)] text-white px-3 py-1 border-[3px] border-[var(--neo-black)] rounded-xl shadow-[var(--neo-shadow-sm)] hover:rotate-[-2deg] transition-transform duration-200">
                Mall
              </span>
              <span className="text-[var(--neo-black)] ml-1">Pedia</span>
            </span>
          </Link>
        </div>

        {/* Sticker */}
        <div className="flex justify-center mb-4 animate-slide-up">
          <span className="neo-sticker bg-[var(--neo-green)] text-[var(--neo-black)] text-sm">
            🆓 Gratis, Tanpa Biaya!
          </span>
        </div>

        {/* Card Register */}
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

          <form action={handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-[var(--neo-black)] mb-1.5">
                👤 Nama Lengkap
              </label>
              <input
                name="name"
                type="text"
                required
                id="register-name"
                className="neo-input"
                placeholder="Nama kamu"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--neo-black)] mb-1.5">
                📧 Email
              </label>
              <input
                name="email"
                type="email"
                required
                id="register-email"
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
                id="register-password"
                className="neo-input"
                placeholder="Minimal 6 karakter"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--neo-black)] mb-1.5">
                🎭 Daftar Sebagai
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  htmlFor="role-customer"
                  className="cursor-pointer"
                >
                  <input
                    type="radio"
                    name="role"
                    id="role-customer"
                    value="customer"
                    defaultChecked
                    className="peer hidden"
                  />
                  <div className="neo-card p-3 text-center text-sm font-bold peer-checked:bg-[var(--neo-primary)] peer-checked:text-white peer-checked:shadow-[var(--neo-shadow)] transition-all duration-200 hover:translate-y-[-2px]">
                    <div className="text-2xl mb-1">🛒</div>
                    <div>Pembeli</div>
                  </div>
                </label>
                <label
                  htmlFor="role-seller"
                  className="cursor-pointer"
                >
                  <input
                    type="radio"
                    name="role"
                    id="role-seller"
                    value="seller"
                    className="peer hidden"
                  />
                  <div className="neo-card p-3 text-center text-sm font-bold peer-checked:bg-[var(--neo-secondary)] peer-checked:text-white peer-checked:shadow-[var(--neo-shadow)] transition-all duration-200 hover:translate-y-[-2px]">
                    <div className="text-2xl mb-1">🏪</div>
                    <div>Penjual</div>
                  </div>
                </label>
              </div>
            </div>

            <button
              type="submit"
              id="register-submit-btn"
              className="neo-btn neo-btn-primary w-full text-base py-3.5 font-extrabold"
            >
              🚀 Daftar Sekarang
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-[2px] bg-[var(--neo-black)] opacity-10" />
            <span className="text-xs font-bold text-[var(--neo-black)] opacity-40">ATAU</span>
            <div className="flex-1 h-[2px] bg-[var(--neo-black)] opacity-10" />
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm font-medium text-[var(--neo-black)] opacity-60 mb-3">
              Sudah punya akun?
            </p>
            <Link href="/login" id="login-link">
              <span className="neo-btn neo-btn-accent text-sm font-extrabold w-full inline-flex">
                🔑 Masuk ke Akun
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
    </div>
  );
}