import { db } from '@/lib/db';
import { orders } from '@/lib/schema';
import { desc } from 'drizzle-orm';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default async function AdminTransactionsPage() {
  const allOrders = await db.select().from(orders).orderBy(desc(orders.id));

  const formatRupiah = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  const formatDate = (isoString: string) =>
    new Date(isoString).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

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
            <span className="bg-[var(--neo-pink)] text-white px-3 py-1 border-[3px] border-[var(--neo-black)] rounded-xl shadow-[var(--neo-shadow-sm)] rotate-[-2deg]">
              🧾
            </span>
            Riwayat Transaksi Global
          </h1>
          <span className="neo-badge bg-[var(--neo-accent)] text-lg font-extrabold px-4 py-2">
            {allOrders.length} Transaksi
          </span>
        </div>

        <div className="neo-card overflow-x-auto animate-slide-up stagger-2">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b-[3px] border-[var(--neo-black)] bg-[var(--neo-gray)]">
                <th className="text-left p-4 font-extrabold">ID Pesanan</th>
                <th className="text-left p-4 font-extrabold">Tanggal</th>
                <th className="text-left p-4 font-extrabold">Pelanggan</th>
                <th className="text-left p-4 font-extrabold">Total</th>
                <th className="text-center p-4 font-extrabold">Status</th>
              </tr>
            </thead>
            <tbody>
              {allOrders.map((order) => (
                <tr key={order.id} className="border-b-[2px] border-dashed border-[var(--neo-black)] border-opacity-10 hover:bg-[var(--neo-gray)] transition-colors">
                  <td className="p-4 font-mono text-xs opacity-80">{order.id.substring(0, 8)}...</td>
                  <td className="p-4 opacity-70 font-semibold">{formatDate(order.createdAt)}</td>
                  <td className="p-4 font-bold">{order.customerName}</td>
                  <td className="p-4 font-extrabold text-[var(--neo-primary)]">{formatRupiah(order.totalAmount)}</td>
                  <td className="p-4 text-center">
                    <span className={`neo-sticker text-xs px-2 py-0.5 rotate-0 ${
                      order.status === 'paid' ? 'bg-[var(--neo-green)] text-[var(--neo-black)]' : 'bg-[var(--neo-accent)] text-[var(--neo-black)]'
                    }`}>
                      {order.status === 'paid' ? '✅ Lunas' : '⏳ Pending'}
                    </span>
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
