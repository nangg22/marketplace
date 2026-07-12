import { db } from '@/lib/db';
import { products, users } from '@/lib/schema';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { eq } from 'drizzle-orm';
import ProductActionButtons from '@/app/admin/components/ProductActionButtons';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminProductsPage() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'admin') redirect('/');

  // Join produk dengan nama seller
  const allProducts = await db
    .select({
      id: products.id,
      name: products.name,
      price: products.price,
      category: products.category,
      imageUrl: products.imageUrl,
      isAvailable: products.isAvailable,
      isSuspended: products.isSuspended,
      suspendReason: products.suspendReason,
      createdAt: products.createdAt,
      sellerName: users.name,
      sellerEmail: users.email,
    })
    .from(products)
    .leftJoin(users, eq(products.sellerId, users.id));

  const formatRupiah = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  const suspended = allProducts.filter(p => p.isSuspended);
  const active = allProducts.filter(p => !p.isSuspended);

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
            <span className="bg-[var(--neo-primary)] text-white px-3 py-1 border-[3px] border-[var(--neo-black)] rounded-xl shadow-[var(--neo-shadow-sm)] rotate-[-2deg]">
              📦
            </span>
            Kelola Semua Produk
          </h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8 animate-slide-up stagger-1">
          <div className="neo-card p-4 bg-[#FF6B35] text-[#1A1A2E]">
            <div className="text-3xl mb-1">📦</div>
            <div className="text-2xl font-extrabold">{allProducts.length}</div>
            <div className="text-xs font-bold opacity-90">Total Produk</div>
          </div>
          <div className="neo-card p-4 bg-[#00C853] text-[#1A1A2E]">
            <div className="text-3xl mb-1">✅</div>
            <div className="text-2xl font-extrabold">{active.length}</div>
            <div className="text-xs font-bold opacity-90">Aktif</div>
          </div>
          <div className="neo-card p-4 bg-[#FF4081] text-[#1A1A2E]">
            <div className="text-3xl mb-1">⏸️</div>
            <div className="text-2xl font-extrabold">{suspended.length}</div>
            <div className="text-xs font-bold opacity-90">Disuspend</div>
          </div>
        </div>

        {/* Table */}
        <div className="neo-card overflow-x-auto animate-slide-up stagger-2">
          <table className="w-full text-sm min-w-[750px]">
            <thead>
              <tr className="border-b-[3px] border-[var(--neo-black)] bg-[var(--neo-gray)]">
                <th className="text-left p-4 font-extrabold">Produk</th>
                <th className="text-left p-4 font-extrabold">Penjual</th>
                <th className="text-left p-4 font-extrabold">Harga</th>
                <th className="text-left p-4 font-extrabold">Kategori</th>
                <th className="text-left p-4 font-extrabold">Status</th>
                <th className="text-center p-4 font-extrabold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {allProducts.map((product) => (
                <tr key={product.id} className={`border-b-[2px] border-dashed border-[var(--neo-black)] border-opacity-10 transition-colors ${product.isSuspended ? 'bg-orange-50' : 'hover:bg-[var(--neo-gray)]'}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white border-[2px] border-[var(--neo-black)] rounded-lg overflow-hidden flex-shrink-0">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold line-clamp-1 max-w-[180px]">{product.name}</p>
                        <p className="text-xs font-mono opacity-50">{product.id.substring(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-sm">{product.sellerName || '—'}</p>
                    <p className="text-xs opacity-60">{product.sellerEmail || ''}</p>
                  </td>
                  <td className="p-4 font-extrabold text-[var(--neo-primary)]">{formatRupiah(product.price)}</td>
                  <td className="p-4">
                    <span className="text-xs font-bold bg-[var(--neo-gray)] px-2 py-1 rounded border-[1px] border-[var(--neo-black)]/20">
                      {product.category}
                    </span>
                  </td>
                  <td className="p-4">
                    {product.isSuspended ? (
                      <div>
                        <span className="neo-sticker bg-[var(--neo-pink)] text-white text-xs px-2 py-0.5 rotate-0">⏸️ Suspend</span>
                        {product.suspendReason && (
                          <p className="text-xs opacity-60 mt-1 max-w-[150px] truncate" title={product.suspendReason}>
                            {product.suspendReason}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="neo-sticker bg-[var(--neo-green)] text-[var(--neo-black)] text-xs px-2 py-0.5 rotate-0">✅ Aktif</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <ProductActionButtons
                      productId={product.id}
                      productName={product.name}
                      isSuspended={product.isSuspended}
                    />
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
