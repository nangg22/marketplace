import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  // Fungsi Server Action untuk Mendaftar
  async function handleRegister(formData: FormData) {
    'use server'; // Berjalan di sisi server yang aman
    
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as 'customer' | 'seller';

    // 1. Mengacak Password (Enkripsi tingkat tinggi)
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      // 2. Memasukkan data ke database Neon
      await db.insert(users).values({
        name,
        email,
        password: hashedPassword,
        role,
      });
      // Jika sukses, alihkan ke halaman login
    } catch (error) {
      console.error("Gagal mendaftar. Email mungkin sudah dipakai.");
      // Catatan: Di versi yang lebih canggih, kita bisa kirim pesan error ke UI
    }

    redirect('/login'); 
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Daftar <span className="text-emerald-600">MallPedia</span>
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Buat akun untuk mulai berbelanja atau berjualan.
          </p>
        </div>

        <form action={handleRegister} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
            <input name="name" type="text" required className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500" placeholder="John Doe" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email Valid</label>
            <input name="email" type="email" required className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500" placeholder="john@example.com" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input name="password" type="password" required className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500" placeholder="Minimal 6 karakter" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Daftar Sebagai</label>
            <select name="role" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500">
              <option value="customer">🛍️ Pembeli (Customer)</option>
              <option value="seller">🏪 Penjual (Seller)</option>
            </select>
          </div>

          <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition">
            Daftar Sekarang
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Sudah punya akun?{' '}
          <Link href="/login" className="font-medium text-emerald-600 hover:text-emerald-500">
            Masuk di sini
          </Link>
        </div>
      </div>
    </div>
  );
}