import { db } from '@/lib/db';
import { orders, orderItems, products } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import OrderTimeline from '@/components/OrderTimeline';
import RefundRequestForm from '@/components/RefundRequestForm';
import { orderStatusHistory, refundRequests } from '@/lib/schema';
import { asc } from 'drizzle-orm';

export default async function CustomerOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const orderId = resolvedParams.id;

  // Auth check — harus login
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const customerId = (session.user as any).id;
  const userRole = (session.user as any).role;

  // Ambil data Order
  const orderResult = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  const order = orderResult[0];

  if (!order) redirect('/customer/orders');

  // Pastikan order milik user ini (kecuali admin)
  if (userRole !== 'admin' && order.customerId !== customerId) {
    redirect('/customer/orders');
  }

  // 2. Ambil detail items beserta data produk yang dibeli menggunakan inner join manual
  const items = await db.select({
    id: orderItems.id,
    quantity: orderItems.quantity,
    priceAtPurchase: orderItems.priceAtPurchase,
    productName: products.name,
    productImage: products.imageUrl,
  })
  .from(orderItems)
  .leftJoin(products, eq(orderItems.productId, products.id))
  .where(eq(orderItems.orderId, orderId));

  // Ambil data riwayat pesanan (timeline)
  const history = await db.select()
    .from(orderStatusHistory)
    .where(eq(orderStatusHistory.orderId, orderId))
    .orderBy(asc(orderStatusHistory.createdAt));

  // Ambil data pengajuan retur (jika ada)
  const refundReqs = await db.select()
    .from(refundRequests)
    .where(eq(refundRequests.orderId, orderId))
    .limit(1);
  const existingRefund = refundReqs[0];

  const formatRupiah = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

  return (
    <div className="bg-[var(--neo-bg)] min-h-screen text-[var(--neo-black)] flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-4xl mx-auto px-4 py-10 w-full relative">
        <div className="mb-6 animate-slide-up">
          <Link href="/customer/orders" className="neo-link text-sm font-bold opacity-60 hover:opacity-100">
            ← Kembali ke Riwayat Pesanan
          </Link>
        </div>

        {/* Header Pesanan */}
        <div className="neo-card p-6 md:p-10 mb-8 animate-slide-up stagger-1">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b-[3px] border-dashed border-[var(--neo-black)] border-opacity-20">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-3 mb-2">
                <span>🧾</span> Detail Invoice
              </h1>
              <p className="font-mono text-sm opacity-60">ID: {order.id}</p>
            </div>
            <div className="text-left md:text-right">
              <span className={`neo-sticker text-sm px-3 py-1 rotate-0 ${
                order.status === 'paid' ? 'bg-[var(--neo-green)]' : 'bg-[var(--neo-accent)]'
              }`}>
                {order.status === 'paid' ? '✅ Status: LUNAS' : '⏳ Status: PENDING'}
              </span>
              <p className="font-bold text-sm opacity-70 mt-3">{formatDate(order.createdAt)}</p>
            </div>
          </div>

          <div className="pt-6">
            <h3 className="font-extrabold text-lg mb-4">Informasi Pengiriman</h3>
            <div className="bg-[var(--neo-gray)] p-4 border-[2px] border-[var(--neo-black)] rounded-lg shadow-[2px_2px_0px_var(--neo-black)]">
              <p className="font-extrabold text-lg mb-1">
                {order.shippingRecipientName || order.recipientName || order.customerName}
              </p>
              {(order.shippingPhone || order.phone) && (
                <p className="text-sm font-medium opacity-80 mb-1">
                  📞 {order.shippingPhone || order.phone}
                </p>
              )}
              {(order.shippingAddress || order.address) && (
                <p className="text-sm font-medium opacity-80">
                  {order.shippingAddress || order.address}
                  {(order.shippingCity || order.city) ? `, ${order.shippingCity || order.city}` : ''}
                  {(order.shippingProvince || order.province) ? `, ${order.shippingProvince || order.province}` : ''}
                  {(order.shippingPostalCode || order.postalCode) ? ` ${order.shippingPostalCode || order.postalCode}` : ''}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Timeline Status */}
        {history.length > 0 && (
          <div className="mb-8">
            <OrderTimeline history={history.map(h => ({ status: h.status, createdAt: h.createdAt.toISOString() }))} />
          </div>
        )}

        {/* Daftar Barang */}
        <div className="neo-card p-6 md:p-10 mb-8 animate-slide-up stagger-2">
          <h3 className="font-extrabold text-xl mb-6 flex items-center gap-2">
            <span>📦</span> Barang yang Dibeli
          </h3>
          
          <div className="space-y-6">
            {items.map((item) => (
              <div key={item.id} className="flex gap-4 items-center">
                <div className="w-20 h-20 bg-white border-[2px] border-[var(--neo-black)] rounded-lg overflow-hidden flex-shrink-0 shadow-[2px_2px_0px_var(--neo-black)]">
                  {item.productImage && item.productImage !== 'https://via.placeholder.com/300?text=No+Image' ? (
                    <img src={item.productImage} alt={item.productName || 'Produk'} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-[10px] font-bold opacity-50">N/A</div>
                  )}
                </div>
                
                <div className="flex-grow">
                  <h4 className="font-extrabold line-clamp-1">{item.productName || 'Produk telah dihapus'}</h4>
                  <p className="text-sm font-bold opacity-60 mt-1">
                    {formatRupiah(item.priceAtPurchase)} <span className="text-[var(--neo-primary)] ml-1">x{item.quantity}</span>
                  </p>
                </div>
                
                <div className="font-extrabold text-lg hidden sm:block">
                  {formatRupiah(item.priceAtPurchase * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          <div className="neo-zigzag opacity-10 my-8" />

          {/* Rincian Pembayaran */}
          <div className="space-y-3 font-semibold text-sm">
            <div className="flex justify-between">
              <span className="opacity-70">Total Harga Barang</span>
              <span>{formatRupiah(order.totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">Ongkos Kirim</span>
              <span>Rp0 (Gratis)</span>
            </div>
            <div className="flex justify-between border-t-[2px] border-[var(--neo-black)] border-opacity-20 pt-4 mt-4 items-center">
              <span className="font-extrabold text-lg">Total Pembayaran</span>
              <span className="font-extrabold text-2xl bg-[var(--neo-primary)] text-white px-3 py-1 border-[2px] border-[var(--neo-black)] rounded-xl shadow-[2px_2px_0px_var(--neo-black)] rotate-[-2deg]">
                {formatRupiah(order.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Retur / Refund Section */}
        {order.status === 'completed' && !existingRefund && (
          <div className="mb-8">
            <RefundRequestForm orderId={orderId} />
          </div>
        )}
        
        {existingRefund && (
          <div className="neo-card p-6 mb-8 bg-blue-50">
            <h3 className="font-extrabold text-lg flex items-center gap-2 mb-3">
              <span>ℹ️</span> Status Pengajuan Retur
            </h3>
            <p className="text-sm font-semibold mb-2">
              Status: <span className="uppercase font-extrabold">{existingRefund.status}</span>
            </p>
            <p className="text-sm">Alasan: {existingRefund.reason}</p>
            {existingRefund.sellerResponse && (
              <div className="mt-4 p-3 bg-white border-[2px] border-dashed border-[var(--neo-black)]/30 rounded-lg">
                <p className="text-xs font-bold opacity-60 mb-1">Tanggapan Penjual:</p>
                <p className="text-sm font-semibold">{existingRefund.sellerResponse}</p>
              </div>
            )}
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
