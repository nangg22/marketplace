import { db } from '@/lib/db';
import { products, users, productImages } from '@/lib/schema';
import { eq, asc } from 'drizzle-orm';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import AddToCartButton from './AddToCartButton';
import ReviewForm from '@/components/ReviewForm';
import ReviewList from '@/components/ReviewList';
import StarRating from '@/components/StarRating';
import ProductGallery from '@/components/ProductGallery';
import type { Metadata } from 'next';

async function getProduct(id: string) {
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
    return { title: "Produk tidak ditemukan | MallPedia" };
  }

  const description = product.description
    ? product.description.slice(0, 155)
    : `Beli ${product.name} dengan harga terbaik di MallPedia.`;

  return {
    title: `${product.name} | MallPedia`,
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

  // Fetch product + nama seller
  const product = await getProduct(productId);
  
  // Fetch multiple images dari db
  const imagesRecord = await db
    .select({ url: productImages.url })
    .from(productImages)
    .where(eq(productImages.productId, productId))
    .orderBy(asc(productImages.order));
    
  let displayImages = imagesRecord;
  if (imagesRecord.length === 0 && product?.imageUrl) {
    // Fallback: jika tak ada data di product_images, gunakan imageUrl produk
    displayImages = [{ url: product.imageUrl }];
  }

  // Fetch reviews + rata-rata rating
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
    // Gagal fetch reviews, lanjut tampil produk tanpa review
  }

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
      <ProductJsonLd product={product} averageRating={averageRating} reviewCount={totalReviews} />
      <Navbar />
      
      <main className="flex-grow max-w-6xl mx-auto px-4 py-10 w-full relative">
        <div className="mb-6 animate-slide-up">
          <Link href="/products" className="neo-link text-sm font-bold opacity-60 hover:opacity-100">
            ← Kembali ke Semua Produk
          </Link>
        </div>

        <div className="bg-white border-[4px] border-[var(--neo-black)] rounded-2xl overflow-hidden shadow-[var(--neo-shadow-lg)] flex flex-col md:flex-row animate-slide-up stagger-1">
          {/* Bagian Gambar */}
          <div className="w-full md:w-1/2 bg-[var(--neo-gray)] border-b-[4px] md:border-b-0 md:border-r-[4px] border-[var(--neo-black)] p-8 flex flex-col relative min-h-[300px]">
            {/* Dekorasi Badge */}
            <div className="absolute top-4 left-4 z-10">
              <span className="neo-sticker bg-[var(--neo-accent)] text-sm rotate-[-3deg]">
                ✨ Original
              </span>
            </div>
            
            <ProductGallery images={displayImages} />
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
              <p className="text-sm font-medium opacity-70">Pengiriman gratis ke seluruh pulau jawa.</p>
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
        {/* Section Rating & Review */}
        <div className="mt-12 animate-slide-up stagger-3">
          <h2 className="text-2xl font-extrabold mb-6 flex items-center gap-3">
            ⭐ Rating &amp; Review
          </h2>

          {/* Ringkasan Rating */}
          <div className="neo-card p-6 mb-6 flex items-center gap-4">
            <span className="text-5xl font-extrabold">{averageRating}</span>
            <div>
              <StarRating value={Number(averageRating)} readOnly size={24} />
              <p className="text-sm text-gray-500 mt-1">dari {totalReviews} review</p>
            </div>
          </div>

          {/* Form Review */}
          <div className="mb-6">
            <ReviewForm productId={productId} />
          </div>

          {/* Daftar Review */}
          <div className="neo-card p-6">
            <ReviewList reviews={reviewsData} />
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
