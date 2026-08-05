import { db } from '@/lib/db';
import { products, users, productImages } from '@/lib/schema';
import { eq, asc, and, ne, or, desc } from 'drizzle-orm';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import AddToCartButton from './AddToCartButton';
import ReviewForm from '@/components/ReviewForm';
import ReviewList from '@/components/ReviewList';
import StarRating from '@/components/StarRating';
import ProductGallery from '@/components/ProductGallery';
import WishlistButton from '@/components/WishlistButton';
import ProductCard from '@/components/ProductCard';
import type { Metadata } from 'next';

const CONDITION_MAP: Record<string, { emoji: string; label: string; desc: string; color: string; textColor: string }> = {
  baru:         { emoji: '✨', label: 'Baru',         desc: 'Belum pernah dipakai, masih tersegel',   color: '#FFD23F', textColor: '#1A1A2E' },
  like_new:     { emoji: '💎', label: 'Like New',     desc: 'Pernah dipakai 1-2x, mulus banget',      color: '#7B4AE2', textColor: '#ffffff' },
  minus_ringan: { emoji: '⚠️', label: 'Minus Ringan', desc: 'Ada cacat kecil, masih layak pakai',    color: '#FF6B35', textColor: '#ffffff' },
  minus_berat:  { emoji: '💀', label: 'Minus Berat',  desc: 'Perlu perbaikan, dijual apa adanya',    color: '#1A1A2E', textColor: '#FFD23F' },
};

async function getProduct(id: string) {
  const result = await db
    .select({
      id: products.id,
      name: products.name,
      price: products.price,
      description: products.description,
      imageUrl: products.imageUrl,
      category: products.category,
      condition: products.condition,
      isNegotiable: products.isNegotiable,
      stock: products.stock,
      rating: products.rating,
      ratingCount: products.ratingCount,
      sellerId: products.sellerId,
      sellerName: users.name,
      sellerStoreName: users.storeName,
      sellerAvatarUrl: users.avatarUrl,
      sellerBio: users.storeDescription,
    })
    .from(products)
    .leftJoin(users, eq(products.sellerId, users.id))
    .where(eq(products.id, id))
    .limit(1);
    
  return result[0];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const product = await getProduct(resolvedParams.id);

  if (!product) {
    return { title: "Produk tidak ditemukan | LakuLagi" };
  }

  const description = product.description
    ? product.description.slice(0, 155)
    : `Beli ${product.name} dengan harga terbaik di LakuLagi.`;

  return {
    title: `${product.name} | LakuLagi`,
    description,
    openGraph: {
      title: product.name,
      description,
      images: product.imageUrl ? [product.imageUrl] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: product.imageUrl ? [product.imageUrl] : [],
    },
  };
}

function ProductJsonLd({ product, averageRating, reviewCount }: {
  product: { name: string; description: string | null; price: number; imageUrl: string | null };
  averageRating: string;
  reviewCount: number;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.imageUrl,
    offers: {
      "@type": "Offer",
      priceCurrency: "IDR",
      price: product.price,
      availability: "https://schema.org/InStock",
    },
    ...(reviewCount > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: averageRating,
        reviewCount: reviewCount,
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const productId = resolvedParams.id;

  const product = await getProduct(productId);
  
  const imagesRecord = await db
    .select({ url: productImages.url })
    .from(productImages)
    .where(eq(productImages.productId, productId))
    .orderBy(asc(productImages.order));
    
  let displayImages = imagesRecord;
  if (imagesRecord.length === 0 && product?.imageUrl) {
    displayImages = [{ url: product.imageUrl }];
  }

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  let reviewsData: Array<{
    id: string;
    rating: number;
    title: string | null;
    reviewText: string | null;
    isVerifiedPurchase: boolean;
    createdAt: string;
    userName: string;
  }> = [];
  let averageRating = '0.0';
  let totalReviews = 0;

  try {
    const reviewRes = await fetch(`${baseUrl}/api/products/${productId}/reviews`, {
      cache: 'no-store',
    });
    if (reviewRes.ok) {
      const reviewJson = await reviewRes.json();
      reviewsData = reviewJson.reviews;
      averageRating = reviewJson.average;
      totalReviews = reviewJson.total;
    }
  } catch {
    // silently continue without reviews
  }

  const formatRupiah = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  // === PRODUK TERKAIT ===
  type RelatedProduct = {
    id: string;
    name: string;
    price: number;
    imageUrl: string | null;
    condition: 'baru' | 'like_new' | 'minus_ringan' | 'minus_berat';
    isNegotiable: boolean;
    sellerId: string;
    stock: number;
    sellerName?: string | null;
  };

  let relatedFromSeller: RelatedProduct[] = [];
  let relatedFromCategory: RelatedProduct[] = [];

  if (product) {
    const [sellerProducts, categoryProducts] = await Promise.all([
      db
        .select({
          id: products.id,
          name: products.name,
          price: products.price,
          imageUrl: products.imageUrl,
          condition: products.condition,
          isNegotiable: products.isNegotiable,
          sellerId: products.sellerId,
          stock: products.stock,
        })
        .from(products)
        .where(
          and(
            eq(products.sellerId, product.sellerId),
            ne(products.id, productId),
            eq(products.isSuspended, false),
            eq(products.isAvailable, true)
          )
        )
        .orderBy(desc(products.createdAt))
        .limit(4),

      db
        .select({
          id: products.id,
          name: products.name,
          price: products.price,
          imageUrl: products.imageUrl,
          condition: products.condition,
          isNegotiable: products.isNegotiable,
          sellerId: products.sellerId,
          stock: products.stock,
        })
        .from(products)
        .where(
          and(
            eq(products.category, product.category),
            ne(products.id, productId),
            ne(products.sellerId, product.sellerId), // hindari duplikat dari seller
            eq(products.isSuspended, false),
            eq(products.isAvailable, true)
          )
        )
        .orderBy(desc(products.createdAt))
        .limit(4),
    ]);

    relatedFromSeller = sellerProducts;
    relatedFromCategory = categoryProducts;
  }

  const sellerDisplayName = product?.sellerStoreName || product?.sellerName || 'Toko Penjual';

  if (!product) {
    return (
      <div className="bg-[var(--neo-bg)] min-h-screen text-[var(--neo-black)] flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center p-4">
          <div className="neo-card p-12 text-center max-w-md w-full animate-bounce-in">
            <div className="text-6xl mb-4">🕵️‍♂️</div>
            <h1 className="text-2xl font-extrabold mb-2">Produk Tidak Ditemukan</h1>
            <p className="opacity-60 mb-6 font-medium">Barang ini mungkin sudah terjual atau URL-nya tidak valid.</p>
            <Link href="/products">
              <button className="neo-btn neo-btn-primary w-full">← Kembali Belanja</button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const conditionInfo = product.condition ? CONDITION_MAP[product.condition] : null;
  const sellerInitial = (product.sellerStoreName || product.sellerName || '?').charAt(0).toUpperCase();

  return (
    <div className="bg-[var(--neo-bg)] min-h-screen text-[var(--neo-black)] flex flex-col">
      <ProductJsonLd product={product} averageRating={averageRating} reviewCount={totalReviews} />
      <Navbar />
      
      <main className="flex-grow max-w-6xl mx-auto px-4 py-8 w-full">

        {/* Breadcrumb */}
        <div className="mb-5 animate-slide-up flex items-center gap-2 text-sm font-bold opacity-60">
          <Link href="/" className="hover:opacity-100 hover:underline">Beranda</Link>
          <span>›</span>
          <Link href="/products" className="hover:opacity-100 hover:underline">Produk</Link>
          <span>›</span>
          <span className="opacity-100 text-[var(--neo-black)] line-clamp-1">{product.name}</span>
        </div>

        {/* Main Card */}
        <div className="bg-white border-[4px] border-[var(--neo-black)] rounded-2xl overflow-hidden shadow-[6px_6px_0px_var(--neo-black)] flex flex-col md:flex-row animate-slide-up stagger-1 mb-6">

          {/* ===== KIRI: Galeri Foto ===== */}
          <div className="w-full md:w-[48%] bg-[var(--neo-gray)] border-b-[4px] md:border-b-0 md:border-r-[4px] border-[var(--neo-black)] relative min-h-[320px]">
            {/* Badge Kondisi */}
            {conditionInfo && (
              <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                <span
                  className="neo-sticker text-sm font-extrabold px-3 py-1.5 border-[3px] border-[var(--neo-black)] shadow-[3px_3px_0px_var(--neo-black)]"
                  style={{ background: conditionInfo.color, color: conditionInfo.textColor }}
                >
                  {conditionInfo.emoji} {conditionInfo.label}
                </span>
                {product.isNegotiable && (
                  <span className="neo-sticker bg-[var(--neo-pink)] text-white text-sm font-extrabold px-3 py-1.5 border-[3px] border-[var(--neo-black)] shadow-[3px_3px_0px_var(--neo-black)]">
                    🤝 Bisa Nego
                  </span>
                )}
              </div>
            )}
            <div className="p-6 h-full flex items-center">
              <ProductGallery images={displayImages} />
            </div>
          </div>

          {/* ===== KANAN: Info Produk ===== */}
          <div className="w-full md:w-[52%] p-6 md:p-8 flex flex-col">

            {/* Category + Seller tag */}
            <div className="flex flex-wrap gap-2 mb-3">
              {product.category && (
                <span className="neo-sticker bg-[var(--neo-secondary)] text-white text-xs px-2 py-1 border-[2px] border-[var(--neo-black)] shadow-[2px_2px_0px_var(--neo-black)] rotate-0">
                  📦 {product.category}
                </span>
              )}
              {totalReviews > 0 && (
                <span className="neo-sticker bg-white text-[var(--neo-black)] text-xs px-2 py-1 border-[2px] border-[var(--neo-black)] shadow-[2px_2px_0px_var(--neo-black)] rotate-0">
                  ⭐ {averageRating} ({totalReviews} review)
                </span>
              )}
            </div>

            <div className="flex justify-between items-start gap-4 mb-4">
              <h1 className="text-2xl md:text-3xl font-extrabold leading-tight">{product.name}</h1>
              <div className="relative mt-1 w-10 h-10 flex-shrink-0">
                <WishlistButton productId={product.id} />
              </div>
            </div>

            {/* Harga + stok */}
            <div className="flex items-end gap-4 mb-5">
              <span className="inline-block bg-[var(--neo-accent)] text-[var(--neo-black)] text-2xl md:text-3xl font-extrabold px-4 py-2 border-[3px] border-[var(--neo-black)] rounded-xl shadow-[4px_4px_0px_var(--neo-black)] rotate-[-1deg]">
                {formatRupiah(product.price)}
              </span>
              <div className="flex flex-col gap-1 text-xs font-bold">
                {/* Indikator stok dengan warna */}
                {product.stock === 0 ? (
                  <span className="inline-flex items-center gap-1.5 bg-red-500 text-white px-3 py-1.5 rounded-lg border-[2px] border-[var(--neo-black)] shadow-[2px_2px_0px_var(--neo-black)] font-extrabold">
                    ❌ Stok Habis
                  </span>
                ) : product.stock <= 3 ? (
                  <span className="inline-flex items-center gap-1.5 bg-orange-500 text-white px-3 py-1.5 rounded-lg border-[2px] border-[var(--neo-black)] shadow-[2px_2px_0px_var(--neo-black)] font-extrabold animate-pulse">
                    🔥 Sisa {product.stock} lagi!
                  </span>
                ) : product.stock <= 10 ? (
                  <span className="inline-flex items-center gap-1.5 bg-[var(--neo-accent)] text-[var(--neo-black)] px-3 py-1.5 rounded-lg border-[2px] border-[var(--neo-black)] shadow-[2px_2px_0px_var(--neo-black)] font-extrabold">
                    ⚡ Stok terbatas: {product.stock}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 bg-[var(--neo-green)] text-[var(--neo-black)] px-3 py-1.5 rounded-lg border-[2px] border-[var(--neo-black)] shadow-[2px_2px_0px_var(--neo-black)] font-extrabold">
                    ✅ Stok tersedia: {product.stock}
                  </span>
                )}
                {product.isNegotiable && (
                  <span className="inline-flex items-center gap-1 text-[var(--neo-pink)] font-bold">🤝 Harga bisa nego</span>
                )}
              </div>
            </div>

            {/* Kondisi detail */}
            {conditionInfo && (
              <div
                className="rounded-xl border-[3px] border-[var(--neo-black)] p-3 mb-5 flex items-center gap-3"
                style={{ background: conditionInfo.color + '22' }}
              >
                <span className="text-3xl">{conditionInfo.emoji}</span>
                <div>
                  <p className="font-extrabold text-sm">{conditionInfo.label}</p>
                  <p className="text-xs opacity-70 font-medium">{conditionInfo.desc}</p>
                </div>
              </div>
            )}

            {/* Deskripsi */}
            <div className="flex-grow mb-6">
              <h3 className="font-extrabold text-sm uppercase tracking-wider opacity-50 mb-2">Deskripsi</h3>
              <p className="font-medium opacity-80 leading-relaxed whitespace-pre-wrap text-sm">
                {product.description || "Penjual belum menambahkan deskripsi. Hubungi seller untuk info lebih lanjut! 😊"}
              </p>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              {product.stock === 0 ? (
                <div className="flex-1 neo-btn bg-gray-300 text-gray-600 border-[var(--neo-black)] cursor-not-allowed py-4 text-lg font-extrabold">
                  ❌ Stok Habis
                </div>
              ) : (
                <>
                  <AddToCartButton
                    product={{ id: product.id, name: product.name, price: product.price, storeName: product.sellerStoreName || product.sellerName || 'Toko Penjual' }}
                  />
                  <AddToCartButton
                    product={{ id: product.id, name: product.name, price: product.price, storeName: product.sellerStoreName || product.sellerName || 'Toko Penjual' }}
                    buyNow
                  />
                </>
              )}
            </div>

            {/* Seller Card */}
            <div className="border-t-[3px] border-dashed border-[var(--neo-black)] pt-5">
              <p className="text-xs font-bold uppercase opacity-40 mb-3">Dijual Oleh</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl border-[3px] border-[var(--neo-black)] bg-[var(--neo-secondary)] text-white flex items-center justify-center font-extrabold text-xl shadow-[2px_2px_0px_var(--neo-black)] flex-shrink-0">
                  {product.sellerAvatarUrl ? (
                    <img src={product.sellerAvatarUrl} alt={sellerInitial} className="w-full h-full object-cover rounded-[9px]" />
                  ) : sellerInitial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-base leading-tight truncate">
                    {product.sellerStoreName || product.sellerName || 'Toko Penjual'}
                  </p>
                  {product.sellerBio && (
                    <p className="text-xs opacity-60 font-medium line-clamp-1">{product.sellerBio}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button className="neo-btn neo-btn-outline text-xs py-1.5 px-3 w-full">
                    + Follow
                  </button>
                  <form action={async () => {
                    "use server";
                    const { getOrCreateChat } = await import('@/app/chat/actions');
                    const { redirect } = await import('next/navigation');
                    const res = await getOrCreateChat(product.sellerId, product.id);
                    if (res.success && res.chatId) redirect(`/chat/${res.chatId}`);
                  }}>
                    <button type="submit" className="neo-btn bg-[var(--neo-primary)] text-white text-xs py-1.5 px-3 w-full">
                      💬 Chat
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Jaminan Aman */}
        <div className="grid grid-cols-3 gap-4 mb-10 animate-slide-up stagger-2">
          {[
            { emoji: '🛡️', title: 'Garansi Uang Kembali', desc: 'Barang tidak sesuai? Refund otomatis.' },
            { emoji: '🤝', title: 'Penjual Terverifikasi', desc: 'Semua seller sudah melalui proses seleksi.' },
            { emoji: '🚀', title: 'Pengiriman Aman', desc: 'Dikemas bubble wrap, tiba utuh.' },
          ].map((item) => (
            <div key={item.title} className="neo-card p-4 flex flex-col items-center text-center gap-2 hover-lift">
              <span className="text-3xl">{item.emoji}</span>
              <h4 className="font-extrabold text-xs leading-tight">{item.title}</h4>
              <p className="text-[10px] font-medium opacity-60 hidden sm:block">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Rating & Review */}
        <div className="animate-slide-up stagger-3">
          <div className="flex items-center gap-3 mb-6 border-b-[3px] border-[var(--neo-black)] pb-4">
            <h2 className="text-2xl font-extrabold flex items-center gap-2">
              <span className="bg-[var(--neo-black)] text-[var(--neo-accent)] p-2 rounded-xl rotate-[-2deg] text-sm">⭐</span>
              Rating & Review
            </h2>
            <span className="text-sm font-bold opacity-50">{totalReviews} ulasan</span>
          </div>

          <div className="neo-card p-5 mb-5 flex items-center gap-5">
            <div className="text-center">
              <div className="text-5xl font-extrabold">{averageRating}</div>
              <div className="text-xs opacity-50 font-bold mt-1">dari 5.0</div>
            </div>
            <div>
              <StarRating value={Number(averageRating)} readOnly size={24} />
              <p className="text-sm font-medium opacity-60 mt-1">{totalReviews} pembeli sudah review</p>
            </div>
          </div>

          <div className="mb-6">
            <ReviewForm productId={productId} />
          </div>

          <div className="neo-card p-6">
            <ReviewList reviews={reviewsData} />
          </div>
        </div>

        {/* ===== PRODUK TERKAIT ===== */}
        {(relatedFromSeller.length > 0 || relatedFromCategory.length > 0) && (
          <div className="mt-12 animate-slide-up stagger-4">

            {/* Produk lain dari seller ini */}
            {relatedFromSeller.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center justify-between mb-5 border-b-[3px] border-[var(--neo-black)] pb-3">
                  <h2 className="text-xl font-extrabold flex items-center gap-2">
                    <span className="bg-[var(--neo-secondary)] text-white px-2 py-1 rounded-lg text-xs border-[2px] border-[var(--neo-black)]">🏪</span>
                    Produk Lain dari <span className="text-[var(--neo-secondary)]">{sellerDisplayName}</span>
                  </h2>
                  <Link
                    href={`/profile/${product.sellerId}`}
                    className="neo-btn neo-btn-outline text-xs py-1.5 px-3 font-bold"
                  >
                    Lihat Toko →
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {relatedFromSeller.map((p, i) => (
                    <ProductCard
                      key={p.id}
                      product={{ ...p, sellerName: sellerDisplayName }}
                      index={i}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Produk serupa dari kategori yang sama */}
            {relatedFromCategory.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-5 border-b-[3px] border-[var(--neo-black)] pb-3">
                  <h2 className="text-xl font-extrabold flex items-center gap-2">
                    <span className="bg-[var(--neo-primary)] text-white px-2 py-1 rounded-lg text-xs border-[2px] border-[var(--neo-black)]">✨</span>
                    Produk Serupa — {product.category}
                  </h2>
                  <Link
                    href={`/products?category=${encodeURIComponent(product.category)}`}
                    className="neo-btn neo-btn-outline text-xs py-1.5 px-3 font-bold"
                  >
                    Lihat Semua →
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {relatedFromCategory.map((p, i) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      index={i}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
