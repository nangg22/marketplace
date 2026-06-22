import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default async function AdminUsersPage() {
  const allUsers = await db.select().from(users);

  return (
    <div className="bg-[var(--neo-bg)] min-h-screen text-[var(--neo-black)] flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-6xl mx-auto px-4 py-10 w-full relative">
        <div className="mb-6 animate-slide-up">
          <Link href="/admin/dashboard" className="neo-link text-sm font-bold opacity-60 hover:opacity-100">
            ← Kembali ke Dashboard Admin
          </Link>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 animate-slide-up stagger-1">
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <span className="bg-[var(--neo-secondary)] text-white px-3 py-1 border-[3px] border-[var(--neo-black)] rounded-xl shadow-[var(--neo-shadow-sm)] rotate-[-2deg]">
              👥
            </span>
            Daftar Pengguna
          </h1>
          <span className="neo-badge bg-[var(--neo-accent)] text-lg font-extrabold px-4 py-2">
            {allUsers.length} User
          </span>
        </div>

        <div className="neo-card overflow-x-auto animate-slide-up stagger-2">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b-[3px] border-[var(--neo-black)] bg-[var(--neo-gray)]">
                <th className="text-left p-4 font-extrabold">ID</th>
                <th className="text-left p-4 font-extrabold">Nama</th>
                <th className="text-left p-4 font-extrabold">Email</th>
                <th className="text-left p-4 font-extrabold">Role</th>
                <th className="text-center p-4 font-extrabold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map((user) => (
                <tr key={user.id} className="border-b-[2px] border-dashed border-[var(--neo-black)] border-opacity-10 hover:bg-[var(--neo-gray)] transition-colors">
                  <td className="p-4 font-mono text-xs opacity-60">{user.id.substring(0, 8)}...</td>
                  <td className="p-4 font-bold">{user.name}</td>
                  <td className="p-4 opacity-80">{user.email}</td>
                  <td className="p-4">
                    <span className={`neo-sticker text-xs px-2 py-0.5 rotate-[-1deg] ${
                      user.role === 'admin' ? 'bg-[var(--neo-pink)] text-white' :
                      user.role === 'seller' ? 'bg-[var(--neo-secondary)] text-white' :
                      'bg-[var(--neo-primary)] text-white'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button className="neo-btn neo-btn-outline px-3 py-1 text-xs">Edit Role</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <Footer />
    </div>
  );
}
