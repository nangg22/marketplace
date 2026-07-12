import { db } from '@/lib/db';
import { refundRequests, orders, users, orderItems, products } from '@/lib/schema';
import { requireRole } from '@/lib/auth-guard';
import { redirect } from 'next/navigation';
import { eq, desc, inArray } from 'drizzle-orm';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import RefundRespondForm from './RefundRespondForm';

export default async function SellerRefundsPage() {
  const auth = await requireRole(['seller']);
  if (!auth.ok) {
    redirect(auth.status === 401 ? '/login' : '/');
  }

  const sellerId = (auth.session?.user as any).id;

  // 1. Ambil produk milik seller ini
  const myProducts = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.sellerId, sellerId));
    
  const myProductIds = myProducts.map((p) => p.id);

  let refundData: any[] = [];

  if (myProductIds.length > 0) {
    // 2. Ambil orderItems yang mengandung produk seller ini
    const relevantItems = await db
      .select({ orderId: orderItems.orderId })
      .from(orderItems)
      .where(inArray(orderItems.productId, myProductIds));
      
    const relevantOrderIds = [...new Set(relevantItems.map((i) => i.orderId))];

    if (relevantOrderIds.length > 0) {
      // 3. Ambil refund requests untuk order tersebut
      const requests = await db
        .select({
          id: refundRequests.id,
          orderId: refundRequests.orderId,
          reason: refundRequests.reason,
          status: refundRequests.status,
          sellerResponse: refundRequests.sellerResponse,
          createdAt: refundRequests.createdAt,
          buyerName: users.name,
          orderAmount: orders.totalAmount
        })
        .from(refundRequests)
        .innerJoin(orders, eq(refundRequests.orderId, orders.id))
        .innerJoin(users, eq(refundRequests.buyerId, users.id))
        .where(inArray(refundRequests.orderId, relevantOrderIds))
        .orderBy(desc(refundRequests.createdAt));
        
      refundData = requests;
    }
  }

  const formatRupiah = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

  return (
    <div className="bg-[var(--neo-bg)] min-h-screen text-[var(--neo-black)] flex flex-col">
      <Navbar />
      <main className="flex-grow max-w-5xl mx-auto px-4 py-10 w-full">
        <div className="flex items-center gap-4 mb-4 animate-slide-up">
          <Link href="/seller/dashboard" className="neo-link text-sm font-bold opacity-60 hover:opacity-100">
            ← Dashboard
          </Link>
        </div>
        
        <h1 className="text-3xl font-extrabold flex items-center gap-3 mb-8 animate-slide-up stagger-1">
          <span className="bg-[var(--neo-pink)] text-white px-3 py-1 border-[3px] border-[var(--neo-black)] rounded-xl shadow-[var(--neo-shadow-sm)] rotate-[-2deg]">
            ↩️
          </span>
          Pengajuan Retur / Refund
        </h1>

        {refundData.length === 0 ? (
          <div className="neo-card p-12 text-center animate-slide-up stagger-2">
            <div className="text-5xl mb-4">✨</div>
            <h2 className="text-xl font-extrabold">Tidak ada pengajuan retur</h2>
            <p className="opacity-60">Produk Anda memuaskan pelanggan!</p>
          </div>
        ) : (
          <div className="space-y-6 animate-slide-up stagger-2">
            {refundData.map((refund) => (
              <div key={refund.id} className="neo-card p-6 relative overflow-hidden">
                <div className={`absolute top-0 right-0 px-4 py-1 text-xs font-extrabold uppercase border-b-[2px] border-l-[2px] border-[var(--neo-black)] rounded-bl-lg ${
                  refund.status === 'requested' ? 'bg-yellow-300' :
                  refund.status === 'approved' ? 'bg-[var(--neo-green)]' :
                  refund.status === 'rejected' ? 'bg-[var(--neo-pink)] text-white' :
                  'bg-gray-200'
                }`}>
                  {refund.status}
                </div>
                
                <h3 className="font-extrabold text-lg mb-1">Pesanan dari {refund.buyerName}</h3>
                <p className="font-mono text-xs opacity-60 mb-4">ID Order: {refund.orderId}</p>
                
                <div className="bg-[var(--neo-accent)] p-4 rounded-lg border-[2px] border-dashed border-[var(--neo-black)]/30 mb-4">
                  <p className="text-xs font-bold opacity-50 mb-1">Alasan Retur ({formatDate(refund.createdAt)}):</p>
                  <p className="font-semibold text-sm">{refund.reason}</p>
                </div>
                
                {refund.sellerResponse ? (
                  <div className="bg-white p-4 rounded-lg border-[2px] border-dashed border-[var(--neo-black)]/30 mb-4">
                    <p className="text-xs font-bold opacity-50 mb-1">Tanggapan Anda:</p>
                    <p className="font-semibold text-sm">{refund.sellerResponse}</p>
                  </div>
                ) : (
                  <RefundRespondForm refundId={refund.id} currentStatus={refund.status} />
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
