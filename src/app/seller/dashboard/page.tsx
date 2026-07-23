import { db } from '@/lib/db';
import { products, orders, orderItems } from '@/lib/schema';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { requireRole } from '@/lib/auth-guard';
import { redirect } from 'next/navigation';
import { eq, inArray } from 'drizzle-orm';
import { sellerOnboarding } from '@/lib/schema';
import SellerOnboardingChecklist from '@/components/SellerOnboardingChecklist';
import SellerAnalyticsDashboard from '@/components/SellerAnalyticsDashboard';
import { StatusBadge } from '@/app/seller/orders/OrderActionButtons';
import NotificationBell from '@/components/NotificationBell';
import { getUnreadCount } from '@/lib/notifications';

export default async function SellerDashboardPage() {
  const auth = await requireRole(['seller']);
  if (!auth.ok) {
    redirect(auth.status === 401 ? '/login' : '/');
  }

  const sellerId = (auth.session?.user as any).id;

  const [onboarding] = await db
    .select()
    .from(sellerOnboarding)
    .where(eq(sellerOnboarding.userId, sellerId));

  // Ambil jumlah notifikasi yang belum dibaca
  const unreadCount = await getUnreadCount(sellerId);

  // Hanya ambil produk milik seller ini
  const allProducts = await db.select().from(products).where(eq(products.sellerId, sellerId));
  const myProductIds = allProducts.map((p) => p.id);

  // Hanya ambil pesanan yang mengandung produk milik seller ini
  let sellerOrders: typeof orders.$inferSelect[] = [];
  if (myProductIds.length > 0) {
    // Cari orderItem yang productId-nya milik seller ini
    const relevantItems = await db
      .select({ orderId: orderItems.orderId })
      .from(orderItems)
      .where(inArray(orderItems.productId, myProductIds));

    const relevantOrderIds = [...new Set(relevantItems.map((i) => i.orderId))];

    if (relevantOrderIds.length > 0) {
      sellerOrders = await db
        .select()
        .from(orders)
        .where(inArray(orders.id, relevantOrderIds));
    }
  }

  const isRevenueGenerating = (status: string) => ['paid', 'confirmed_cod', 'processing', 'shipped', 'delivered', 'completed'].includes(status);
  
  // Pesanan yang butuh aksi seller:
  // - pending_cod: perlu di-approve
  // - paid: perlu di-approve
  // - delivered + COD: perlu konfirmasi pembayaran diterima
  const pendingActionOrders = sellerOrders.filter(
    (o) => ['pending_cod', 'paid'].includes(o.status) || 
           (o.paymentMethod === 'cod' && o.status === 'delivered')
  );

  const totalRevenue = sellerOrders
    .filter((o) => isRevenueGenerating(o.status))
    .reduce((sum, o) => sum + o.totalAmount, 0);
    
  const paidOrders = sellerOrders.filter((o) => isRevenueGenerating(o.status));

  const formatRupiah = (price: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);

  const stats = [
    {
      label: 'Total Produk',
      value: allProducts.length,
      icon: '📦',
      color: 'bg-[var(--neo-secondary)] text-[var(--neo-black)]',
      href: '/seller/products',
    },
    {
      label: 'Total Pesanan',
      value: sellerOrders.length,
      icon: '🧾',
      color: 'bg-[var(--neo-primary)] text-[var(--neo-black)]',
      href: '/seller/orders',
    },
    {
      label: 'Pesanan Lunas',
      value: paidOrders.length,
      icon: '✅',
      color: 'bg-[var(--neo-green)] text-[var(--neo-black)]',
      href: '/seller/orders',
    },
    {
      label: 'Total Pendapatan',
      value: formatRupiah(totalRevenue),
      icon: '💰',
      color: 'bg-[var(--neo-accent)] text-[var(--neo-black)]',
      href: '/seller/orders',
    },
  ];

  return (
    <div className="bg-[var(--neo-bg)] min-h-screen text-[var(--neo-black)] flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-6xl mx-auto px-4 py-10 w-full relative">
        {/* Dekorasi */}
        <div className="absolute top-10 right-10 text-6xl animate-float opacity-20 select-none hidden lg:block">🏪</div>
        <div className="absolute bottom-24 left-6 text-4xl animate-float opacity-20 select-none hidden lg:block" style={{ animationDelay: '1s' }}>📈</div>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 animate-slide-up">
          <div>
            <h1 className="text-4xl font-extrabold flex items-center gap-3">
              <span className="bg-[var(--neo-secondary)] text-white px-3 py-1 border-[3px] border-[var(--neo-black)] rounded-xl shadow-[var(--neo-shadow-sm)] rotate-[-2deg]">
                🏪
              </span>
              Dashboard Penjual
            </h1>
            <p className="font-semibold opacity-60 mt-2 text-lg">Selamat datang kembali! Cek performa tokomu di sini.</p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell initialCount={unreadCount} />
            <Link href="/seller/products/create">
              <button className="neo-btn neo-btn-primary hover-wiggle px-6">
                ➕ Tambah Produk
              </button>
            </Link>
          </div>
        </div>

        {onboarding && <SellerOnboardingChecklist status={onboarding} />}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-12 animate-slide-up stagger-1">
          {stats.map((stat, i) => (
            <Link href={stat.href} key={i}>
              <div className={`neo-card p-6 ${stat.color} hover-lift cursor-pointer stagger-${i + 1}`}>
                <div className="text-4xl mb-3">{stat.icon}</div>
                <div className="text-2xl font-extrabold mb-1 leading-tight">{stat.value}</div>
                <div className="text-sm font-bold opacity-80">{stat.label}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Notif pesanan menunggu approval */}
        {pendingActionOrders.length > 0 && (
          <div className="neo-card p-5 mb-8 bg-[var(--neo-accent)]/30 border-[3px] border-[var(--neo-accent)] animate-slide-up stagger-2 flex items-center gap-4">
            <div className="text-3xl">⚠️</div>
            <div>
              <p className="font-extrabold text-lg">Ada {pendingActionOrders.length} pesanan menunggu konfirmasi Anda!</p>
              <p className="text-sm font-semibold opacity-70">Segera approve agar pembeli bisa melanjutkan prosesnya.</p>
            </div>
            <Link href="/seller/orders" className="ml-auto shrink-0">
              <button className="neo-btn neo-btn-primary text-sm">Lihat &amp; Approve →</button>
            </Link>
          </div>
        )}

        <div className="neo-zigzag opacity-20 mb-10" />

        {/* Analitik Seller */}
        <div className="mb-10 animate-slide-up stagger-2">
          <h2 className="text-2xl font-extrabold flex items-center gap-2 mb-6">
            <span>📊</span> Analitik & Performa Toko
          </h2>
          <SellerAnalyticsDashboard />
        </div>

        <div className="neo-zigzag opacity-20 mb-10" />

        {/* Produk Terakhir */}
        <div className="mb-10 animate-slide-up stagger-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-extrabold flex items-center gap-2">
              <span>📦</span> Produk Terbaru
            </h2>
            <Link href="/seller/products">
              <button className="neo-btn neo-btn-outline text-sm py-2">Lihat Semua →</button>
            </Link>
          </div>

          {allProducts.length === 0 ? (
            <div className="neo-card p-10 text-center">
              <div className="text-5xl mb-3 animate-bounce-in">📭</div>
              <p className="font-bold opacity-60">Belum ada produk. Yuk tambahkan sekarang!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {allProducts.slice(0, 6).map((item, i) => (
                <div key={item.id} className={`neo-card p-5 flex justify-between items-center hover-lift stagger-${i + 1}`}>
                  <div>
                    <h3 className="font-extrabold line-clamp-1 mb-1">{item.name}</h3>
                    <span className="bg-[var(--neo-accent)] px-2 py-0.5 border-[2px] border-[var(--neo-black)] rounded text-sm font-extrabold shadow-[1px_1px_0px_var(--neo-black)]">
                      {formatRupiah(item.price)}
                    </span>
                  </div>
                  <Link href={`/seller/products/${item.id}/edit`}>
                    <button className="neo-btn neo-btn-outline py-1.5 px-3 text-sm ml-4 shrink-0">✏️</button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pesanan Terakhir milik seller */}
        <div className="animate-slide-up stagger-3">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-extrabold flex items-center gap-2">
              <span>🧾</span> Pesanan Terbaru
            </h2>
            <Link href="/seller/orders">
              <button className="neo-btn neo-btn-outline text-sm py-2">Lihat Semua →</button>
            </Link>
          </div>

          {sellerOrders.length === 0 ? (
            <div className="neo-card p-10 text-center">
              <div className="text-5xl mb-3 animate-bounce-in">🪹</div>
              <p className="font-bold opacity-60">Belum ada pesanan masuk untuk produk Anda.</p>
            </div>
          ) : (
            <div className="neo-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-[3px] border-[var(--neo-black)] bg-[var(--neo-gray)]">
                    <th className="text-left p-4 font-extrabold">Pelanggan</th>
                    <th className="text-left p-4 font-extrabold hidden md:table-cell">Tanggal</th>
                    <th className="text-left p-4 font-extrabold">Total</th>
                    <th className="text-left p-4 font-extrabold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sellerOrders.slice(0, 5).map((order) => (
                    <tr key={order.id} className="border-b-[2px] border-dashed border-[var(--neo-black)] border-opacity-10 hover:bg-[var(--neo-gray)] transition-colors">
                      <td className="p-4 font-bold">{order.customerName}</td>
                      <td className="p-4 opacity-60 font-medium hidden md:table-cell">
                        {new Date(order.createdAt).toLocaleDateString('id-ID')}
                      </td>
                      <td className="p-4 font-extrabold">{formatRupiah(order.totalAmount)}</td>
                      <td className="p-4">
                        <StatusBadge status={order.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
