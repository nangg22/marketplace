import { db } from '@/lib/db';
import { orders, orderItems, products, orderStatusHistory } from '@/lib/schema';
import { eq, asc } from 'drizzle-orm';
import { redirect, notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const STATUS_FLOW: { key: string; label: string; icon: string; color: string }[] = [
  { key: 'pending', label: 'Menunggu Pembayaran', icon: '⏳', color: 'var(--neo-accent)' },
  { key: 'paid', label: 'Pembayaran Dikonfirmasi', icon: '✅', color: 'var(--neo-green)' },
  { key: 'processing', label: 'Pesanan Diproses', icon: '🔄', color: 'var(--neo-blue)' },
  { key: 'shipped', label: 'Dikirim', icon: '🚚', color: 'var(--neo-secondary)' },
  { key: 'completed', label: 'Selesai', icon: '🎉', color: 'var(--neo-primary)' },
];

const COD_EXTRA_STEP = { key: 'confirmed_cod', label: 'COD Dikonfirmasi', icon: '📦', color: 'var(--neo-accent)' };

const formatRupiah = (price: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

const formatDateTime = (date: Date | string) =>
  new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

const formatTime = (date: Date | string) =>
  new Date(date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

const formatDateOnly = (date: Date | string) =>
  new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

export default async function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const orderId = resolvedParams.id;

  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const customerId = (session.user as any).id;
  const userRole = (session.user as any).role;

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) notFound();

  if (userRole !== 'admin' && order.customerId !== customerId) notFound();

  const items = await db.select({
    quantity: orderItems.quantity,
    priceAtPurchase: orderItems.priceAtPurchase,
    productName: products.name,
    productImage: products.imageUrl,
  })
    .from(orderItems)
    .leftJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, orderId));

  const history = await db.select()
    .from(orderStatusHistory)
    .where(eq(orderStatusHistory.orderId, orderId))
    .orderBy(asc(orderStatusHistory.createdAt));

  const historyStatuses = new Set(history.map(h => h.status));

  // Build the status steps based on payment method
  const steps: { key: string; label: string; icon: string; color: string }[] = order.paymentMethod === 'cod'
    ? [
        { key: 'pending_cod', label: 'Pesanan Dibuat', icon: '📋', color: 'var(--neo-gray)' },
        COD_EXTRA_STEP,
        ...STATUS_FLOW.slice(2), // processing, shipped, completed
      ]
    : [
        { key: 'pending', label: 'Pesanan Dibuat', icon: '📋', color: 'var(--neo-gray)' },
        ...STATUS_FLOW.slice(1), // paid, processing, shipped, completed
      ];

  // Determine which steps are reached
  const currentStepIndex = steps.findIndex(s => s.key === order.status);
  const isTerminal = ['cancelled', 'refunded'].includes(order.status);

  return (
    <div className="bg-[var(--neo-bg)] min-h-screen text-[var(--neo-black)] flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-4xl mx-auto px-4 py-10 w-full">
        {/* Back Link */}
        <div className="mb-6 animate-slide-up">
          <Link href={`/customer/orders/${orderId}`} className="inline-flex items-center gap-2 neo-link text-sm font-bold opacity-60 hover:opacity-100 transition-opacity">
            <span className="inline-flex items-center justify-center w-7 h-7 bg-[var(--neo-white)] border-2 border-[var(--neo-black)] rounded-lg shadow-[2px_2px_0px_var(--neo-black)] text-xs font-extrabold">←</span>
            Kembali ke Detail Pesanan
          </Link>
        </div>

        {/* Header Card */}
        <div className="neo-card p-6 md:p-8 mb-8 animate-slide-up stagger-1 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-[var(--neo-secondary)] text-white text-xs font-bold px-4 py-2 border-b-[3px] border-l-[3px] border-[var(--neo-black)] rounded-bl-xl">
            Tracking
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-3 mb-2">
                📍 Lacak Pesanan
              </h1>
              <p className="font-mono text-xs opacity-50 bg-[var(--neo-gray)] inline-block px-3 py-1 border border-[var(--neo-black)]/10 rounded-lg">
                #{orderId.slice(0, 12)}...
              </p>
            </div>
            <div className="flex flex-col items-start md:items-end gap-2">
              {(() => {
                const statusColors: Record<string, string> = {
                  pending: 'bg-[var(--neo-accent)]',
                  paid: 'bg-[var(--neo-green)]',
                  processing: 'bg-[var(--neo-blue)] text-white',
                  shipped: 'bg-[var(--neo-secondary)] text-white',
                  completed: 'bg-[var(--neo-primary)] text-white',
                  cancelled: 'bg-[var(--neo-pink)] text-white',
                  pending_cod: 'bg-[var(--neo-accent)]',
                  confirmed_cod: 'bg-[var(--neo-green)]',
                  refunded: 'bg-gray-300',
                };
                const statusLabels: Record<string, string> = {
                  pending: '⏳ Menunggu Pembayaran',
                  paid: '✅ Lunas',
                  processing: '🔄 Diproses',
                  shipped: '🚚 Dikirim',
                  completed: '🎉 Selesai',
                  cancelled: '❌ Dibatalkan',
                  pending_cod: '📦 COD Pending',
                  confirmed_cod: '📦 COD Dikonfirmasi',
                  refunded: '↩️ Refund',
                };
                const label = statusLabels[order.status] || order.status;
                const color = statusColors[order.status] || 'bg-gray-200';
                return (
                  <span className={`neo-sticker text-sm px-4 py-1 rotate-[-2deg] ${color}`}>
                    {label}
                  </span>
                );
              })()}
              <p className="text-xs font-bold opacity-50">{formatDateTime(order.createdAt)}</p>
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[var(--neo-gray)] p-3 border-2 border-[var(--neo-black)] rounded-lg shadow-[2px_2px_0px_var(--neo-black)]">
              <p className="text-[10px] font-bold opacity-50 uppercase tracking-wide">Metode Bayar</p>
              <p className="font-extrabold text-sm mt-1">{order.paymentMethod === 'cod' ? '📦 COD' : order.paymentMethod === 'qris' ? '📱 QRIS' : '💳 Kartu'}</p>
            </div>
            <div className="bg-[var(--neo-gray)] p-3 border-2 border-[var(--neo-black)] rounded-lg shadow-[2px_2px_0px_var(--neo-black)]">
              <p className="text-[10px] font-bold opacity-50 uppercase tracking-wide">Total</p>
              <p className="font-extrabold text-sm mt-1 text-[var(--neo-primary)]">{formatRupiah(order.totalAmount)}</p>
            </div>
            <div className="bg-[var(--neo-gray)] p-3 border-2 border-[var(--neo-black)] rounded-lg shadow-[2px_2px_0px_var(--neo-black)]">
              <p className="text-[10px] font-bold opacity-50 uppercase tracking-wide">Item</p>
              <p className="font-extrabold text-sm mt-1">{items.length} Produk</p>
            </div>
            <div className="bg-[var(--neo-gray)] p-3 border-2 border-[var(--neo-black)] rounded-lg shadow-[2px_2px_0px_var(--neo-black)]">
              <p className="text-[10px] font-bold opacity-50 uppercase tracking-wide">Ongkir</p>
              <p className="font-extrabold text-sm mt-1 text-[var(--neo-green)]">Gratis 🔥</p>
            </div>
          </div>
        </div>

        {/* Timeline Visual - Neobrutalism Style */}
        <div className="neo-card p-6 md:p-8 mb-8 animate-slide-up stagger-2">
          <h2 className="font-extrabold text-xl mb-8 flex items-center gap-2">
            🕒 Progress Pesanan
          </h2>

          {isTerminal ? (
            /* Cancelled/Refunded State */
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-[var(--neo-pink)] border-[3px] border-[var(--neo-black)] rounded-full shadow-[4px_4px_0px_var(--neo-black)] mb-4">
                <span className="text-4xl">{order.status === 'cancelled' ? '❌' : '↩️'}</span>
              </div>
              <h3 className="font-extrabold text-xl mb-2">
                {order.status === 'cancelled' ? 'Pesanan Dibatalkan' : 'Pesanan Direfund'}
              </h3>
              <p className="text-sm opacity-60 font-semibold">
                {order.status === 'cancelled'
                  ? 'Pesanan ini telah dibatalkan dan stok telah dikembalikan.'
                  : 'Pesanan ini telah direfund oleh penjual.'}
              </p>
            </div>
          ) : (
            /* Normal Timeline */
            <div className="relative">
              {steps.map((step, i) => {
                const isActive = i <= currentStepIndex;
                const isCurrent = step.key === order.status;
                const historyRecord = history.find(h => h.status === step.key);
                const isLast = i === steps.length - 1;

                return (
                  <div key={step.key} className="flex gap-4 relative">
                    {/* Left: Icon + Line */}
                    <div className="flex flex-col items-center flex-shrink-0">
                      {/* Circle */}
                      <div
                        className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-xl border-[3px] border-[var(--neo-black)] transition-all duration-300 ${
                          isActive
                            ? 'shadow-[3px_3px_0px_var(--neo-black)]'
                            : 'bg-[var(--neo-gray)] shadow-none opacity-40'
                        }`}
                        style={{
                          backgroundColor: isActive ? step.color || 'var(--neo-green)' : undefined,
                        }}
                      >
                        {isActive ? (
                          <span className="text-xl">{step.icon}</span>
                        ) : (
                          <div className="w-3 h-3 bg-gray-300 rounded-full" />
                        )}
                        {isCurrent && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--neo-black)] rounded-full border-2 border-white animate-pulse" />
                        )}
                      </div>

                      {/* Connector Line */}
                      {!isLast && (
                        <div
                          className={`w-[3px] min-h-[60px] flex-shrink-0 ${
                            isActive && i < currentStepIndex
                              ? 'bg-[var(--neo-black)]'
                              : 'bg-gray-200 border-l-[3px] border-dashed border-gray-300'
                          }`}
                          style={{ marginTop: '-2px', marginBottom: '-2px' }}
                        />
                      )}
                    </div>

                    {/* Right: Content */}
                    <div className={`pb-8 flex-1 ${isLast ? 'pb-0' : ''}`}>
                      <div
                        className={`inline-block p-4 rounded-xl border-[3px] border-[var(--neo-black)] w-full transition-all ${
                          isCurrent
                            ? 'bg-[var(--neo-accent)]/20 shadow-[4px_4px_0px_var(--neo-black)]'
                            : isActive
                              ? 'bg-[var(--neo-green)]/10 shadow-[2px_2px_0px_var(--neo-black)]'
                              : 'bg-[var(--neo-gray)] opacity-40 shadow-none'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className={`font-extrabold text-sm ${isActive ? 'text-[var(--neo-black)]' : 'text-gray-400'}`}>
                              {step.label}
                            </p>
                            {historyRecord && (
                              <p className="text-xs font-semibold opacity-60 mt-1">
                                {formatDateTime(historyRecord.createdAt)}
                              </p>
                            )}
                          </div>
                          {isCurrent && (
                            <span className="bg-[var(--neo-primary)] text-white text-[10px] font-extrabold px-3 py-1 border-2 border-[var(--neo-black)] rounded-full shadow-[2px_2px_0px_var(--neo-black)] uppercase tracking-wider flex-shrink-0">
                              Aktif
                            </span>
                          )}
                          {isActive && !isCurrent && historyRecord && (
                            <span className="text-[var(--neo-green)] text-lg flex-shrink-0">✓</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Shipping Info */}
        <div className="neo-card p-6 md:p-8 mb-8 animate-slide-up stagger-3">
          <h2 className="font-extrabold text-xl mb-4 flex items-center gap-2">
            📍 Alamat Pengiriman
          </h2>
          <div className="bg-[var(--neo-gray)] p-4 border-[2px] border-[var(--neo-black)] rounded-lg shadow-[2px_2px_0px_var(--neo-black)]">
            <p className="font-extrabold text-lg mb-1">
              {order.shippingRecipientName || order.customerName}
            </p>
            {(order.shippingPhone) && (
              <p className="text-sm font-medium opacity-80 mb-1">
                📞 {order.shippingPhone}
              </p>
            )}
            {order.shippingAddress && (
              <p className="text-sm font-medium opacity-80">
                {order.shippingAddress}{order.shippingCity ? `, ${order.shippingCity}` : ''}{order.shippingProvince ? `, ${order.shippingProvince}` : ''}{order.shippingPostalCode ? ` ${order.shippingPostalCode}` : ''}
              </p>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="neo-card p-6 md:p-8 mb-8 animate-slide-up stagger-4">
          <h2 className="font-extrabold text-xl mb-6 flex items-center gap-2">
            📦 Barang yang Dibeli
          </h2>
          <div className="space-y-4">
            {items.map((item, i) => (
              <div key={i} className="flex gap-4 items-center p-3 bg-[var(--neo-gray)] border-2 border-[var(--neo-black)] rounded-lg shadow-[2px_2px_0px_var(--neo-black)]">
                <div className="w-16 h-16 bg-white border-2 border-[var(--neo-black)] rounded-lg overflow-hidden flex-shrink-0">
                  {item.productImage && item.productImage !== 'https://via.placeholder.com/300?text=No+Image' ? (
                    <img src={item.productImage} alt={item.productName || 'Produk'} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold opacity-40">N/A</div>
                  )}
                </div>
                <div className="flex-grow min-w-0">
                  <p className="font-extrabold text-sm line-clamp-1">{item.productName || 'Produk dihapus'}</p>
                  <p className="text-xs font-bold opacity-60 mt-1">
                    {formatRupiah(item.priceAtPurchase)} × {item.quantity}
                  </p>
                </div>
                <div className="font-extrabold text-sm text-[var(--neo-primary)] flex-shrink-0">
                  {formatRupiah(item.priceAtPurchase * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          <div className="neo-zigzag opacity-10 my-6" />

          <div className="flex justify-between items-center">
            <span className="font-extrabold text-lg">Total Pembayaran</span>
            <span className="font-extrabold text-xl bg-[var(--neo-primary)] text-white px-4 py-2 border-[3px] border-[var(--neo-black)] rounded-xl shadow-[3px_3px_0px_var(--neo-black)] rotate-[-2deg]">
              {formatRupiah(order.totalAmount)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 animate-slide-up stagger-5">
          {order.status === 'pending' && ['qris', 'credit'].includes(order.paymentMethod) && (
            <Link href={`/api/payment/simulate?order_id=${order.id}&amount=${order.totalAmount}`} className="flex-1">
              <button className="neo-btn neo-btn-primary w-full py-4 text-lg hover-wiggle">
                💳 Bayar Sekarang
              </button>
            </Link>
          )}
          <Link href="/products" className="flex-1">
            <button className="neo-btn neo-btn-outline w-full py-3">
              🛍️ Lanjut Belanja
            </button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
