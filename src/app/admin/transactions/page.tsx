import { db } from '@/lib/db';
import { orders } from '@/lib/schema';
import { desc } from 'drizzle-orm';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import OrderActionButtons from '@/app/admin/components/OrderActionButtons';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '⏳ Pending', color: 'bg-[var(--neo-accent)] text-[var(--neo-black)]' },
  paid: { label: '✅ Lunas', color: 'bg-[var(--neo-green)] text-[var(--neo-black)]' },
  processing: { label: '🔄 Diproses', color: 'bg-blue-200 text-blue-900' },
  shipped: { label: '🚚 Dikirim', color: 'bg-[var(--neo-secondary)] text-white' },
  completed: { label: '🎉 Selesai', color: 'bg-[var(--neo-primary)] text-white' },
  cancelled: { label: '❌ Batal', color: 'bg-[var(--neo-pink)] text-white' },
  refunded: { label: '↩️ Refund', color: 'bg-gray-300 text-gray-800' },
};

export default async function AdminTransactionsPage() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'admin') redirect('/');

  const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));

  const formatRupiah = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

  const totalRevenue = allOrders.filter(o => o.status === 'paid' || o.status === 'completed').reduce((s, o) => s + o.totalAmount, 0);
  const pendingCount = allOrders.filter(o => o.status === 'pending').length;
  const paidCount = allOrders.filter(o => o.status === 'paid' || o.status === 'completed').length;
  const cancelledCount = allOrders.filter(o => o.status === 'cancelled' || o.status === 'refunded').length;

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
            <span className="bg-[var(--neo-pink)] text-white px-3 py-1 border-[3px] border-[var(--neo-black)] rounded-xl shadow-[var(--neo-shadow-sm)] rotate-[-2deg]">
              🧾
            </span>
            Kelola Transaksi
          </h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-slide-up stagger-1">
          <div className="neo-card p-4 bg-[#7B4AE2] text-white">
            <div className="text-3xl mb-1">🧾</div>
            <div className="text-2xl font-extrabold">{allOrders.length}</div>
            <div className="text-xs font-bold opacity-90">Total Transaksi</div>
          </div>
          <div className="neo-card p-4 bg-[#FFD23F] text-[#1A1A2E]">
            <div className="text-3xl mb-1">⏳</div>
            <div className="text-2xl font-extrabold">{pendingCount}</div>
            <div className="text-xs font-bold opacity-90">Pending</div>
          </div>
          <div className="neo-card p-4 bg-[#00C853] text-[#1A1A2E]">
            <div className="text-3xl mb-1">✅</div>
            <div className="text-2xl font-extrabold">{paidCount}</div>
            <div className="text-xs font-bold opacity-90">Berhasil</div>
          </div>
          <div className="neo-card p-4 bg-[#FF6B35] text-white">
            <div className="text-3xl mb-1">💰</div>
            <div className="text-lg font-extrabold leading-tight">{formatRupiah(totalRevenue)}</div>
            <div className="text-xs font-bold opacity-90">Total Revenue</div>
          </div>
        </div>

        <div className="neo-card overflow-x-auto animate-slide-up stagger-2">
          <table className="w-full text-sm min-w-[750px]">
            <thead>
              <tr className="border-b-[3px] border-[var(--neo-black)] bg-[var(--neo-gray)]">
                <th className="text-left p-4 font-extrabold">ID Pesanan</th>
                <th className="text-left p-4 font-extrabold">Tanggal</th>
                <th className="text-left p-4 font-extrabold">Pelanggan</th>
                <th className="text-left p-4 font-extrabold">Total</th>
                <th className="text-left p-4 font-extrabold">Metode</th>
                <th className="text-center p-4 font-extrabold">Status</th>
                <th className="text-center p-4 font-extrabold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {allOrders.map((order) => {
                const statusInfo = STATUS_MAP[order.status] || { label: order.status, color: 'bg-gray-200' };
                return (
                  <tr key={order.id} className="border-b-[2px] border-dashed border-[var(--neo-black)] border-opacity-10 hover:bg-[var(--neo-gray)] transition-colors">
                    <td className="p-4 font-mono text-xs opacity-70">{order.id.substring(0, 10)}...</td>
                    <td className="p-4 text-xs opacity-70 font-semibold whitespace-nowrap">{formatDate(order.createdAt)}</td>
                    <td className="p-4 font-bold">{order.customerName}</td>
                    <td className="p-4 font-extrabold text-[var(--neo-primary)]">{formatRupiah(order.totalAmount)}</td>
                    <td className="p-4">
                      <span className="text-xs font-bold uppercase bg-[var(--neo-gray)] px-2 py-1 rounded border border-[var(--neo-black)]/20">
                        {order.paymentMethod || 'qris'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`neo-sticker text-xs px-2 py-0.5 rotate-0 ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <OrderActionButtons orderId={order.id} currentStatus={order.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>

      <Footer />
    </div>
  );
}
