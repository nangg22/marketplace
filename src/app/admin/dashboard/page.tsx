import { db } from '@/lib/db';
import { products, users, orders } from '@/lib/schema';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'admin') redirect('/');

  const [allProducts, allUsers, allOrders] = await Promise.all([
    db.select().from(products),
    db.select().from(users),
    db.select().from(orders),
  ]);

  const totalRevenue = allOrders
    .filter(o => o.status === 'paid' || o.status === 'completed')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const sellers = allUsers.filter(u => u.role === 'seller');
  const customers = allUsers.filter(u => u.role === 'customer');
  const bannedUsers = allUsers.filter(u => u.isBanned);
  const suspendedProducts = allProducts.filter(p => p.isSuspended);
  const pendingOrders = allOrders.filter(o => o.status === 'pending');

  const formatRupiah = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  return (
    <div className="bg-[var(--neo-bg)] min-h-screen text-[var(--neo-black)] flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-6xl mx-auto px-4 py-10 w-full relative">
        <div className="absolute top-6 right-10 text-5xl animate-float opacity-20 hidden lg:block">⚙️</div>

        {/* Header */}
        <div className="mb-10 animate-slide-up">
          <h1 className="text-4xl font-extrabold flex items-center gap-3 mb-2">
            <span className="bg-[var(--neo-black)] text-[var(--neo-accent)] px-3 py-1 border-[3px] border-[var(--neo-accent)] rounded-xl shadow-[4px_4px_0px_var(--neo-accent)] rotate-[-1deg]">
              ⚙️
            </span>
            Admin Dashboard
          </h1>
          <p className="font-semibold opacity-60 text-lg">Pusat kontrol penuh MallPedia.</p>
        </div>

        {/* Stats utama — hardcoded class agar Tailwind tidak purge */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8 animate-slide-up stagger-1">
          <Link href="/admin/users">
            <div className="neo-card p-6 bg-[#7B4AE2] text-[#1A1A2E] hover-lift cursor-pointer">
              <div className="text-4xl mb-3">👥</div>
              <div className="text-2xl font-extrabold mb-1 leading-tight">{allUsers.length}</div>
              <div className="text-sm font-bold opacity-90">Total User</div>
            </div>
          </Link>

          <Link href="/admin/products">
            <div className="neo-card p-6 bg-[#FF6B35] text-[#1A1A2E] hover-lift cursor-pointer">
              <div className="text-4xl mb-3">📦</div>
              <div className="text-2xl font-extrabold mb-1 leading-tight">{allProducts.length}</div>
              <div className="text-sm font-bold opacity-90">Total Produk</div>
            </div>
          </Link>

          <Link href="/admin/transactions">
            <div className="neo-card p-6 bg-[#FF4081] text-[#1A1A2E] hover-lift cursor-pointer">
              <div className="text-4xl mb-3">🧾</div>
              <div className="text-2xl font-extrabold mb-1 leading-tight">{allOrders.length}</div>
              <div className="text-sm font-bold opacity-90">Total Transaksi</div>
            </div>
          </Link>

          <Link href="/admin/transactions">
            <div className="neo-card p-6 bg-[#FFD23F] text-[#1A1A2E] hover-lift cursor-pointer">
              <div className="text-4xl mb-3">💰</div>
              <div className="text-xl font-extrabold mb-1 leading-tight">{formatRupiah(totalRevenue)}</div>
              <div className="text-sm font-bold opacity-80">Total Revenue</div>
            </div>
          </Link>
        </div>

        {/* Alert: hal yang perlu diperhatikan */}
        {(bannedUsers.length > 0 || suspendedProducts.length > 0 || pendingOrders.length > 0) && (
          <div className="neo-card p-5 mb-8 bg-yellow-50 border-yellow-400 animate-slide-up stagger-2">
            <h3 className="font-extrabold text-lg mb-3 flex items-center gap-2 text-[#1A1A2E]">⚠️ Perlu Perhatian</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {bannedUsers.length > 0 && (
                <Link href="/admin/users">
                  <div className="bg-red-100 border-[2px] border-red-400 rounded-xl p-3 hover-lift">
                    <p className="font-extrabold text-red-700">🚫 {bannedUsers.length} User Banned</p>
                    <p className="text-xs font-medium text-red-600 mt-1">Klik untuk kelola</p>
                  </div>
                </Link>
              )}
              {suspendedProducts.length > 0 && (
                <Link href="/admin/products">
                  <div className="bg-orange-100 border-[2px] border-orange-400 rounded-xl p-3 hover-lift">
                    <p className="font-extrabold text-orange-700">⏸️ {suspendedProducts.length} Produk Suspend</p>
                    <p className="text-xs font-medium text-orange-600 mt-1">Klik untuk kelola</p>
                  </div>
                </Link>
              )}
              {pendingOrders.length > 0 && (
                <Link href="/admin/transactions">
                  <div className="bg-yellow-100 border-[2px] border-yellow-400 rounded-xl p-3 hover-lift">
                    <p className="font-extrabold text-yellow-800">⏳ {pendingOrders.length} Order Pending</p>
                    <p className="text-xs font-medium text-yellow-700 mt-1">Klik untuk kelola</p>
                  </div>
                </Link>
              )}
            </div>
          </div>
        )}

        <div className="neo-zigzag opacity-20 mb-8" />

        {/* Menu aksi cepat */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up stagger-3">
          <Link href="/admin/users">
            <div className="neo-card p-6 bg-[#7B4AE2] text-[#1A1A2E] hover-lift cursor-pointer flex items-start gap-4">
              <span className="text-5xl">👥</span>
              <div>
                <h3 className="font-extrabold text-xl mb-1">Kelola User</h3>
                <p className="text-sm font-semibold opacity-90">
                  {sellers.length} penjual · {customers.length} pembeli
                </p>
                <p className="text-xs opacity-70 mt-1">Ban · Ubah Role · Hapus Akun</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/products">
            <div className="neo-card p-6 bg-[#FF6B35] text-[#1A1A2E] hover-lift cursor-pointer flex items-start gap-4">
              <span className="text-5xl">📦</span>
              <div>
                <h3 className="font-extrabold text-xl mb-1">Kelola Produk</h3>
                <p className="text-sm font-semibold opacity-90">
                  {allProducts.length} produk terdaftar
                </p>
                <p className="text-xs opacity-70 mt-1">Suspend · Hapus Produk</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/transactions">
            <div className="neo-card p-6 bg-[#FF4081] text-[#1A1A2E] hover-lift cursor-pointer flex items-start gap-4">
              <span className="text-5xl">🧾</span>
              <div>
                <h3 className="font-extrabold text-xl mb-1">Kelola Transaksi</h3>
                <p className="text-sm font-semibold opacity-90">
                  {allOrders.length} transaksi · {formatRupiah(totalRevenue)}
                </p>
                <p className="text-xs opacity-70 mt-1">Update Status · Refund · Hapus</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/categories">
            <div className="neo-card p-6 bg-[var(--neo-accent)] text-[#1A1A2E] hover-lift cursor-pointer flex items-start gap-4">
              <span className="text-5xl">🏷️</span>
              <div>
                <h3 className="font-extrabold text-xl mb-1">Kelola Kategori</h3>
                <p className="text-sm font-semibold opacity-90">Tambah &amp; atur kategori produk</p>
                <p className="text-xs opacity-70 mt-1">Tambah · Edit · Aktifkan · Hapus</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/audit-logs">
            <div className="neo-card p-6 bg-[var(--neo-secondary)] text-[#1A1A2E] hover-lift cursor-pointer flex items-start gap-4">
              <span className="text-5xl">📋</span>
              <div>
                <h3 className="font-extrabold text-xl mb-1">Audit Log</h3>
                <p className="text-sm font-semibold opacity-90">Riwayat semua aksi admin</p>
                <p className="text-xs opacity-70 mt-1">Ban · Suspend · Refund · Kategori</p>
              </div>
            </div>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
