import { db } from '@/lib/db';
import { orders } from '@/lib/schema';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { desc, eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function CustomerOrdersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const customerId = (session.user as any).id;

  // Ambil data pesanan dari database sesuai dengan ID pelanggan
  const allOrders = await db.select().from(orders).where(eq(orders.customerId, customerId)).orderBy(desc(orders.id));

  const formatRupiah = (price: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-[var(--neo-bg)] min-h-screen text-[var(--neo-black)] flex flex-col">
      <Navbar />
      
      <main className="flex-grow max-w-5xl mx-auto px-4 py-10 w-full relative">
        <div className="flex items-center gap-3 mb-8 animate-slide-up">
          <span className="bg-[var(--neo-pink)] text-white px-3 py-1 border-[3px] border-[var(--neo-black)] rounded-xl shadow-[var(--neo-shadow-sm)] text-2xl font-extrabold rotate-[2deg]">
            🧾
          </span>
          <h1 className="text-3xl font-extrabold">Riwayat Pesanan</h1>
        </div>

        {allOrders.length === 0 ? (
          <div className="neo-card p-12 text-center animate-slide-up stagger-1">
            <div className="text-6xl mb-4 animate-bounce-in">🪹</div>
            <h2 className="text-xl font-extrabold mb-2">Belum ada pesanan</h2>
            <p className="opacity-60 mb-6 font-medium">Anda belum pernah melakukan transaksi apa pun.</p>
            <Link href="/products">
              <button className="neo-btn neo-btn-primary">Mulai Belanja</button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6 animate-slide-up stagger-1">
            {allOrders.map((order, i) => (
              <Link href={`/customer/orders/${order.id}`} key={order.id} className="block">
                <div className={`neo-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover-lift stagger-${Math.min(i + 1, 12)}`}>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="neo-badge bg-[var(--neo-gray)] font-bold text-xs uppercase tracking-wide">
                        {formatDate(order.createdAt)}
                      </span>
                      <span className="neo-sticker bg-[var(--neo-green)] text-[var(--neo-black)] rotate-[-2deg] text-xs px-2 py-0.5">
                        {order.status === 'paid' ? 'Lunas ✅' : 'Menunggu ⏳'}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-lg mb-1">Pesanan dari {order.customerName}</h3>
                    <p className="font-bold opacity-60 text-sm">ID: <span className="font-mono text-xs opacity-80">{order.id}</span></p>
                  </div>
                  
                  <div className="text-left md:text-right w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t-[2px] md:border-t-0 border-dashed border-[var(--neo-black)] border-opacity-20 flex flex-row md:flex-col justify-between items-center md:items-end">
                    <span className="opacity-70 text-sm font-bold mb-1">Total Belanja</span>
                    <span className="bg-[var(--neo-accent)] px-3 py-1 border-[2px] border-[var(--neo-black)] rounded-lg shadow-[2px_2px_0px_var(--neo-black)] font-extrabold text-lg rotate-[1deg]">
                      {formatRupiah(order.totalAmount)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
