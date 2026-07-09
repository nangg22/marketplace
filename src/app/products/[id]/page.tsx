import { db } from '@/lib/db';
import { products, users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import AddToCartButton from './AddToCartButton';

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const productId = resolvedParams.id;

  // Fetch product + nama seller
  const result = await db
    .select({
      id: products.id,
      name: products.name,
      price: products.price,
      description: products.description,
      imageUrl: products.imageUrl,
      category: products.category,
      sellerName: users.name,
    })
    .from(products)
    .leftJoin(users, eq(products.sellerId, users.id))
    .where(eq(products.id, productId))
    .limit(1);

  const product = result[0];

  const formatRupiah = (price: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
  };

  if (!product) {
    return (
      <div className="bg-[var(--neo-bg)] min-h-screen text-[var(--neo-black)] flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center p-4">
          <div className="neo-card p-12 text-center max-w-md w-full animate-bounce-in">
            <div className="text-6xl mb-4">🕵️‍♂️</div>
            <h1 className="text-2xl font-extrabold mb-2">Produk Tidak Ditemukan</h1>
            <p className="opacity-60 mb-6 font-medium">Barang yang Anda cari mungkin sudah dihapus atau URL tidak valid.</p>
            <Link href="/products">
              <button className="neo-btn neo-btn-primary w-full">Kembali Belanja</button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-[var(--neo-bg)] min-h-screen text-[var(--neo-black)] flex flex-col">
      <Navbar />
      
      <main className="flex-grow max-w-6xl mx-auto px-4 py-10 w-full relative">
        <div className="mb-6 animate-slide-up">
          <Link href="/products" className="neo-link text-sm font-bold opacity-60 hover:opacity-100">
            ← Kembali ke Semua Produk
          </Link>
        </div>

        <div className="bg-white border-[4px] border-[var(--neo-black)] rounded-2xl overflow-hidden shadow-[var(--neo-shadow-lg)] flex flex-col md:flex-row animate-slide-up stagger-1">
          {/* Bagian Gambar */}
          <div className="w-full md:w-1/2 bg-[var(--neo-gray)] border-b-[4px] md:border-b-0 md:border-r-[4px] border-[var(--neo-black)] p-8 flex items-center justify-center relative min-h-[300px]">
            {/* Dekorasi Badge */}
            <div className="absolute top-4 left-4 z-10">
              <span className="neo-sticker bg-[var(--neo-accent)] text-sm rotate-[-3deg]">
                ✨ Original
              </span>
            </div>

            {product.imageUrl && product.imageUrl !== 'https://via.placeholder.com/300?text=No+Image' ? (
              <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="max-w-full h-auto object-contain drop-shadow-[8px_8px_0px_rgba(26,26,46,0.2)] hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="text-center opacity-40">
                <div className="text-8xl mb-4">📦</div>
                <div className="font-extrabold uppercase tracking-widest text-xl">No Image</div>
              </div>
            )}
          </div>

          {/* Bagian Info */}
          <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col">
            <div className="mb-2">
              <span className="inline-block bg-[var(--neo-pink)] text-white px-3 py-1 border-[2px] border-[var(--neo-black)] rounded-lg shadow-[2px_2px_0px_var(--neo-black)] text-xs font-bold uppercase tracking-wider rotate-[1deg]">
                🏪 {product.sellerName || 'Toko Penjual'}
              </span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
              {product.name}
            </h1>
            
            <div className="mb-8">
              <span className="inline-block bg-[var(--neo-accent)] text-[var(--neo-black)] text-3xl md:text-4xl font-extrabold px-4 py-2 border-[4px] border-[var(--neo-black)] rounded-xl shadow-[4px_4px_0px_var(--neo-black)] rotate-[-2deg]">
                {formatRupiah(product.price)}
              </span>
            </div>

            <div className="neo-zigzag opacity-10 mb-6 h-[10px]" />

            <div className="flex-grow mb-8">
              <h3 className="font-extrabold text-lg mb-2">Deskripsi Produk</h3>
              <p className="font-medium opacity-80 leading-relaxed whitespace-pre-wrap">
                {product.description || "Penjual belum menambahkan deskripsi untuk produk ini. Tapi tenang saja, barangnya pasti keren! 😎"}
              </p>
            </div>

            <div className="mt-auto flex flex-col sm:flex-row gap-4">
              <AddToCartButton
                product={{ id: product.id, name: product.name, price: product.price, storeName: product.sellerName || 'Toko Penjual' }}
              />
              <AddToCartButton
                product={{ id: product.id, name: product.name, price: product.price, storeName: product.sellerName || 'Toko Penjual' }}
                buyNow
              />
            </div>
          </div>
        </div>

        {/* Jaminan MallPedia */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 animate-slide-up stagger-2">
          <div className="neo-card p-6 flex items-start gap-4 hover-lift">
            <div className="text-4xl">🛡️</div>
            <div>
              <h4 className="font-extrabold text-lg">Garansi 100%</h4>
              <p className="text-sm font-medium opacity-70">Uang kembali jika barang tidak sesuai atau rusak.</p>
            </div>
          </div>
          <div className="neo-card p-6 flex items-start gap-4 hover-lift">
            <div className="text-4xl">🚚</div>
            <div>
              <h4 className="font-extrabold text-lg">Gratis Ongkir</h4>
              <p className="text-sm font-medium opacity-70">Pengiriman gratis ke seluruh penjuru dunia.</p>
            </div>
          </div>
          <div className="neo-card p-6 flex items-start gap-4 hover-lift">
            <div className="text-4xl">💎</div>
            <div>
              <h4 className="font-extrabold text-lg">Kualitas Premium</h4>
              <p className="text-sm font-medium opacity-70">Barang disortir langsung oleh kurator handal.</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
