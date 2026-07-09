import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import UserActionButtons from '@/app/admin/components/UserActionButtons';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'admin') redirect('/');

  const allUsers = await db.select().from(users);

  const customers = allUsers.filter(u => u.role === 'customer');
  const sellers = allUsers.filter(u => u.role === 'seller');
  const admins = allUsers.filter(u => u.role === 'admin');
  const banned = allUsers.filter(u => u.isBanned);

  return (
    <div className="bg-[var(--neo-bg)] min-h-screen text-[var(--neo-black)] flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 py-10 w-full">
        <div className="mb-6 animate-slide-up">
          <Link href="/admin/dashboard" className="neo-link text-sm font-bold opacity-60 hover:opacity-100">
            ← Dashboard Admin
          </Link>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 animate-slide-up stagger-1">
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <span className="bg-[var(--neo-secondary)] text-white px-3 py-1 border-[3px] border-[var(--neo-black)] rounded-xl shadow-[var(--neo-shadow-sm)] rotate-[-2deg]">
              👥
            </span>
            Kelola Pengguna
          </h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-slide-up stagger-1">
          <div className="neo-card p-4 bg-[#7B4AE2] text-[#1A1A2E]">
            <div className="text-3xl mb-1">👥</div>
            <div className="text-2xl font-extrabold">{allUsers.length}</div>
            <div className="text-xs font-bold opacity-90">Total User</div>
          </div>
          <div className="neo-card p-4 bg-[#FF6B35] text-[#1A1A2E]">
            <div className="text-3xl mb-1">🛒</div>
            <div className="text-2xl font-extrabold">{customers.length}</div>
            <div className="text-xs font-bold opacity-90">Pembeli</div>
          </div>
          <div className="neo-card p-4 bg-[#00C853] text-[#1A1A2E]">
            <div className="text-3xl mb-1">🏪</div>
            <div className="text-2xl font-extrabold">{sellers.length}</div>
            <div className="text-xs font-bold opacity-90">Penjual</div>
          </div>
          <div className="neo-card p-4 bg-[#FF4081] text-[#1A1A2E]">
            <div className="text-3xl mb-1">🚫</div>
            <div className="text-2xl font-extrabold">{banned.length}</div>
            <div className="text-xs font-bold opacity-90">Banned</div>
          </div>
        </div>

        {/* Table */}
        <div className="neo-card overflow-x-auto animate-slide-up stagger-2">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b-[3px] border-[var(--neo-black)] bg-[var(--neo-gray)]">
                <th className="text-left p-4 font-extrabold">Pengguna</th>
                <th className="text-left p-4 font-extrabold">Email</th>
                <th className="text-left p-4 font-extrabold">Role</th>
                <th className="text-left p-4 font-extrabold">Status</th>
                <th className="text-center p-4 font-extrabold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map((user) => (
                <tr key={user.id} className={`border-b-[2px] border-dashed border-[var(--neo-black)] border-opacity-10 transition-colors ${user.isBanned ? 'bg-red-50' : 'hover:bg-[var(--neo-gray)]'}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl border-[2px] border-[var(--neo-black)] bg-[var(--neo-secondary)] flex items-center justify-center text-white font-extrabold text-sm flex-shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold leading-tight">{user.name}</p>
                        <p className="text-xs font-mono opacity-50">{user.id.substring(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 opacity-80 text-sm">{user.email}</td>
                  <td className="p-4">
                    <span className={`neo-sticker text-xs px-2 py-0.5 rotate-0 ${
                      user.role === 'admin' ? 'bg-[var(--neo-pink)] text-white' :
                      user.role === 'seller' ? 'bg-[var(--neo-secondary)] text-white' :
                      'bg-[var(--neo-primary)] text-white'
                    }`}>
                      {user.role === 'admin' ? '⚙️' : user.role === 'seller' ? '🏪' : '🛒'} {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    {user.isBanned ? (
                      <div>
                        <span className="neo-sticker bg-[var(--neo-pink)] text-white text-xs px-2 py-0.5 rotate-0">🚫 Banned</span>
                        {user.banReason && (
                          <p className="text-xs opacity-60 mt-1 max-w-[180px] truncate" title={user.banReason}>
                            Alasan: {user.banReason}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="neo-sticker bg-[var(--neo-green)] text-[var(--neo-black)] text-xs px-2 py-0.5 rotate-0">✅ Aktif</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <UserActionButtons
                      userId={user.id}
                      userName={user.name}
                      currentRole={user.role}
                      isBanned={user.isBanned}
                    />
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
  