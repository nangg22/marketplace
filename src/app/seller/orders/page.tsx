import { db } from '@/lib/db';
import { orders, orderItems, products } from '@/lib/schema';
import { requireRole } from '@/lib/auth-guard';
import { redirect } from 'next/navigation';
import { eq, inArray, desc } from 'drizzle-orm';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { OrderActionButtons, StatusBadge } from './OrderActionButtons';
import NotificationBell from '@/components/NotificationBell';
import { getUnreadCount } from '@/lib/notifications';

export default async function SellerOrdersPage() {
  const auth = await requireRole(['seller']);
  if (!auth.ok) {
    redirect(auth.status === 401 ? '/login' : '/');
  }

  const sellerId = (auth.session?.user as any).id;

  // Ambil produk milik seller ini
  const myProducts = await db
    .select({ id: products.id, name: products.name, price: products.price })
    .from(products)
    .where(eq(products.sellerId, sellerId));

  const myProductIds = myProducts.map((p) => p.id);
  const productMap = new Map(myProducts.map((p) => [p.id, p]));

  // Ambil jumlah notifikasi yang belum dibaca
  const unreadCount = await getUnreadCount(sellerId);

  // Cari orderItem yang berisi produk si seller
  let sellerOrders: (typeof orders.$inferSelect & {
    items: { productId: string; productName: string; quantity: number; price: number }[];
  })[] = [];

  if (myProductIds.length > 0) {
    const relevantItems = await db
      .select({
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        price: orderItems.priceAtPurchase,
      })
      .from(orderItems)
      .where(inArray(orderItems.productId, myProductIds));

    const relevantOrderIds = [...new Set(relevantItems.map((i) => i.orderId))];

    if (relevantOrderIds.length > 0) {
      const rawOrders = await db
        .select()
        .from(orders)
        .where(inArray(orders.id, relevantOrderIds))
        .orderBy(desc(orders.createdAt));

      // Attach hanya item yang milik seller ini ke setiap order
      sellerOrders = rawOrders.map((order) => ({
        ...order,
        items: relevantItems
          .filter((item) => item.orderId === order.id)
          .map((item) => ({
            productId: item.productId,
            productName: productMap.get(item.productId)?.name ?? 'Produk tidak diketahui',
            quantity: item.quantity,
            price: item.price,
          })),
      }));
    }
  }

  const formatRupiah = (price: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const isPaidStatus = (status: string) => status === 'paid' || status === 'confirmed_cod' || status === 'completed';

  // Pesanan yang butuh aksi seller
  const pendingCount = sellerOrders.filter(
    (o) => ['pending_cod', 'paid'].includes(o.status) || 
           (o.paymentMethod === 'cod' && o.status === 'delivered')
  ).length;

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
          <div>
            <h1 className="text-3xl font-extrabold flex items-center gap-3">
              <span className="bg-[var(--neo-primary)] text-white px-3 py-1 border-[3px] border-[var(--neo-black)] rounded-xl shadow-[var(--neo-shadow-sm)] rotate-[-2deg]">
                🧾
              </span>
              Pesanan Masuk
            </h1>
            <p className="font-semibold opacity-60 mt-1 text-sm">
              Hanya menampilkan pesanan yang mengandung produk Anda
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <NotificationBell initialCount={unreadCount} />
            {pendingCount > 0 && (
              <span className="neo-badge bg-[var(--neo-accent)] text-sm font-extrabold px-4 py-2">
                ⚠️ {pendingCount} perlu diapprove
              </span>
            )}
            <span className="neo-badge bg-[var(--neo-secondary)] text-white text-sm font-extrabold px-4 py-2">
              {sellerOrders.length} Pesanan
            </span>
          </div>
        </div>

        {sellerOrders.length === 0 ? (
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
            {sellerOrders.map((order, i) => {
              const sellerItemsTotal = order.items.reduce(
                (sum, item) => sum + item.price * item.quantity,
                0
              );
              // Pesanan yang butuh aksi seller
              const isPending = ['pending_cod', 'paid'].includes(order.status) || 
                                (order.paymentMethod === 'cod' && order.status === 'delivered');

              return (
                <div
                  key={order.id}
                  className={`neo-card p-6 hover-lift stagger-${Math.min(i + 1, 12)} ${
                    isPending ? 'border-[var(--neo-accent)] border-[3px]' : ''
                  }`}
                >
                  {/* Header baris */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <div className="flex-grow">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <StatusBadge status={order.status} />
                        <span className="text-xs font-bold opacity-50 font-mono">
                          #{order.id.slice(0, 8)}...
                        </span>
                        {order.paymentMethod && (
                          <span className="neo-badge bg-[var(--neo-blue)] text-white text-xs">
                            {order.paymentMethod === 'qris'
                              ? '📱 QRIS'
                              : order.paymentMethod === 'credit'
                              ? '💳 Kartu'
                              : '📦 COD'}
                          </span>
                        )}
                      </div>
                      <h3 className="font-extrabold text-xl mb-0.5">{order.customerName}</h3>
                      <p className="text-sm font-semibold opacity-60">{formatDate(order.createdAt)}</p>
                    </div>

                    <div className="text-left md:text-right shrink-0">
                      <p className="text-xs font-bold opacity-50 mb-1">Nilai produk Anda</p>
                      <span className="bg-[var(--neo-accent)] px-3 py-1.5 border-[3px] border-[var(--neo-black)] rounded-xl shadow-[3px_3px_0px_var(--neo-black)] font-extrabold text-lg inline-block rotate-[1deg]">
                        {formatRupiah(sellerItemsTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Daftar produk milik seller di order ini */}
                  <div className="bg-[var(--neo-gray)] border-[2px] border-[var(--neo-black)] rounded-lg p-4 mb-3">
                    <p className="text-xs font-extrabold uppercase opacity-50 mb-3 tracking-wide">
                      📦 Produk Anda dalam pesanan ini
                    </p>
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div key={item.productId} className="flex justify-between items-center text-sm">
                          <span className="font-bold line-clamp-1 flex-1 mr-4">{item.productName}</span>
                          <span className="font-semibold opacity-60 shrink-0">
                            {formatRupiah(item.price)} × {item.quantity}
                          </span>
                          <span className="font-extrabold ml-4 shrink-0">
                            {formatRupiah(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Alamat pengiriman */}
                  {order.shippingAddress && (
                    <div className="text-xs font-semibold opacity-60 mb-3 flex items-start gap-2">
                      <span>📍</span>
                      <span>
                        {order.shippingRecipientName} ({order.shippingPhone}) —{' '}
                        {order.shippingAddress}, {order.shippingCity},{' '}
                        {order.shippingProvince} {order.shippingPostalCode}
                      </span>
                    </div>
                  )}

                  {/* Tombol Approve / Batalkan */}
                  <OrderActionButtons orderId={order.id} currentStatus={order.status} paymentMethod={order.paymentMethod} />
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
