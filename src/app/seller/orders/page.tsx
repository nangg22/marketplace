import { db } from '@/lib/db';
import { orders, orderItems, products } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { desc } from 'drizzle-orm';

export default async function SellerOrdersPage() {
  const allOrders = await db.select().from(orders).orderBy(desc(orders.id));

  const formatRupiah = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

  return (
    <div className="bg-[var(--neo-bg)] min-h-screen text-[var(--neo-black)] flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-6xl mx-auto px-4 py-10 w-full">
        <div className="flex items-center gap-4 mb-4 animate-slide-up">
          <Link href="/seller/dashboard" className="neo-link text-sm font-bold opacity-60 hover:opacity-100">
            ← Dashboard
          </Link>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 animate-slide-up stagger-1">
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <span className="bg-[var(--neo-primary)] text-white px-3 py-1 border-[3px] border-[var(--neo-black)] rounded-xl shadow-[var(--neo-shadow-sm)] rotate-[-2deg]">
              🧾
            </span>
            Riwayat Pesanan Masuk
          </h1>
          <span className="neo-badge bg-[var(--neo-accent)] text-lg font-extrabold px-4 py-2">
            {allOrders.length} Pesanan
          </span>
        </div>

        {allOrders.length === 0 ? (
          <div className="neo-card p-16 text-center animate-slide-up stagger-2">
            <div className="text-7xl mb-4 animate-bounce-in">🪹</div>
            <h2 className="text-2xl font-extrabold mb-2">Belum Ada Pesanan Masuk</h2>
            <p className="opacity-60 font-medium mb-6">Tunggu saja, pembeli sedang mengincar produkmu! 🔍</p>
            <Link href="/seller/products">
              <button className="neo-btn neo-btn-primary">Cek Produk Saya</button>
            </Link>
          </div>
        ) : (
          <div className="space-y-5 animate-slide-up stagger-2">
            {allOrders.map((order, i) => (
              <div key={order.id} className={`neo-card p-6 hover-lift stagger-${Math.min(i + 1, 12)}`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  {/* Info Kiri */}
                  <div className="flex-grow">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`neo-sticker text-xs px-2 py-0.5 rotate-[-1deg] ${
                        order.status === 'paid'
                          ? 'bg-[var(--neo-green)] text-[var(--neo-black)]'
                          : 'bg-[var(--neo-accent)] text-[var(--neo-black)]'
                      }`}>
                        {order.status === 'paid' ? '✅ Lunas' : '⏳ Menunggu'}
                      </span>
                      <span className="text-xs font-bold opacity-50 font-mono">{order.id.slice(0, 8)}...</span>
                    </div>
                    <h3 className="font-extrabold text-xl mb-1">{order.customerName}</h3>
                    <p className="text-sm font-semibold opacity-60">{formatDate(order.createdAt)}</p>
                  </div>

                  {/* Harga Kanan */}
                  <div className="text-left md:text-right">
                    <p className="text-sm font-bold opacity-60 mb-1">Total Pesanan</p>
                    <span className="bg-[var(--neo-accent)] px-3 py-1.5 border-[3px] border-[var(--neo-black)] rounded-xl shadow-[3px_3px_0px_var(--neo-black)] font-extrabold text-xl inline-block rotate-[1deg]">
                      {formatRupiah(order.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
