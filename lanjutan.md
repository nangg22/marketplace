# Implementasi Fitur: Multiple Image Upload, Filter Harga, & SEO Meta Tag — MallPedia

Stack: Next.js 16 (App Router), TypeScript, Drizzle ORM, Neon PostgreSQL, UploadThing, Tailwind CSS.

---

# BAGIAN 1 — Multiple Image Upload

## 1.1 Skema Database

Ubah pendekatan dari 1 kolom `imageUrl` di tabel `products` menjadi tabel terpisah `productImages`, supaya jumlah gambar tidak dibatasi dan lebih rapi.

```typescript
// db/schema.ts
import { pgTable, uuid, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { products } from "./schema";

export const productImages = pgTable("product_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  isPrimary: boolean("is_primary").default(false).notNull(),
  order: integer("order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

Migrasi:
```bash
npx drizzle-kit generate
npx drizzle-kit push
```

> Kalau produk lama masih pakai kolom `imageUrl` tunggal, buat migration script kecil untuk memindahkan data lama ke `productImages` sebagai `isPrimary: true` supaya tidak ada produk yang tiba-tiba tanpa gambar.

## 1.2 Update Uploader (UploadThing)

`lib/uploadthing.ts` (core config) — pastikan endpoint menerima multiple files:

```typescript
import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  productImageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 5 } })
    .middleware(async () => {
      // taruh auth check di sini (pastikan user adalah seller)
      return {};
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
```

Kunci utamanya: `maxFileCount: 5` (atau sesuai kebutuhan).

## 1.3 Komponen Upload di Form Produk

```tsx
// components/ProductImageUploader.tsx
"use client";

import { UploadDropzone } from "@/lib/uploadthing-components"; // hasil generateUploadDropzone
import { useState } from "react";
import Image from "next/image";
import { X, Star } from "lucide-react";

interface ImageItem {
  url: string;
  isPrimary: boolean;
}

export default function ProductImageUploader({
  images,
  onChange,
}: {
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
}) {
  function handleUploadComplete(res: { url: string }[]) {
    const newImages = res.map((f, i) => ({
      url: f.url,
      isPrimary: images.length === 0 && i === 0,
    }));
    onChange([...images, ...newImages]);
  }

  function removeImage(url: string) {
    onChange(images.filter((img) => img.url !== url));
  }

  function setPrimary(url: string) {
    onChange(images.map((img) => ({ ...img, isPrimary: img.url === url })));
  }

  return (
    <div className="space-y-3">
      <UploadDropzone
        endpoint="productImageUploader"
        onClientUploadComplete={handleUploadComplete}
        onUploadError={(err) => alert(`Gagal upload: ${err.message}`)}
      />
      <div className="grid grid-cols-4 gap-2">
        {images.map((img) => (
          <div key={img.url} className="relative group">
            <Image
              src={img.url}
              alt="preview"
              width={100}
              height={100}
              className={`rounded-md object-cover w-full h-24 border-2 ${
                img.isPrimary ? "border-black" : "border-transparent"
              }`}
            />
            <button
              type="button"
              onClick={() => setPrimary(img.url)}
              className="absolute top-1 left-1 bg-white/80 rounded-full p-1"
              title="Jadikan foto utama"
            >
              <Star size={14} fill={img.isPrimary ? "#facc15" : "none"} />
            </button>
            <button
              type="button"
              onClick={() => removeImage(img.url)}
              className="absolute top-1 right-1 bg-white/80 rounded-full p-1"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 1.4 Galeri di Halaman Detail Produk

```tsx
// components/ProductGallery.tsx
"use client";

import { useState } from "react";
import Image from "next/image";

export default function ProductGallery({ images }: { images: { url: string }[] }) {
  const [active, setActive] = useState(images[0]?.url);

  if (images.length === 0) {
    return <div className="bg-gray-100 rounded-lg aspect-square" />;
  }

  return (
    <div>
      <div className="rounded-lg overflow-hidden border border-gray-200 mb-3">
        <Image
          src={active}
          alt="Produk"
          width={600}
          height={600}
          className="w-full aspect-square object-cover"
        />
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {images.map((img) => (
          <button
            key={img.url}
            onClick={() => setActive(img.url)}
            className={`shrink-0 rounded-md overflow-hidden border-2 ${
              active === img.url ? "border-black" : "border-gray-200"
            }`}
          >
            <Image src={img.url} alt="thumbnail" width={64} height={64} className="object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
```

---

# BAGIAN 2 — Filter Harga (Range)

## 2.1 Query Param di Halaman Listing

```tsx
// app/products/page.tsx
import { db } from "@/db";
import { products } from "@/db/schema";
import { and, gte, lte, eq } from "drizzle-orm";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { minPrice?: string; maxPrice?: string; category?: string };
}) {
  const { minPrice, maxPrice, category } = searchParams;

  const conditions = [];
  if (minPrice) conditions.push(gte(products.price, Number(minPrice)));
  if (maxPrice) conditions.push(lte(products.price, Number(maxPrice)));
  if (category) conditions.push(eq(products.category, category));

  const filteredProducts = await db
    .select()
    .from(products)
    .where(conditions.length ? and(...conditions) : undefined);

  return (
    <div className="flex gap-6">
      <PriceFilter />
      <ProductGrid products={filteredProducts} />
    </div>
  );
}
```

## 2.2 Komponen Filter (Client, update URL)

```tsx
// components/PriceFilter.tsx
"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";

const PRESETS = [
  { label: "Di bawah Rp50rb", min: 0, max: 50000 },
  { label: "Rp50rb - Rp150rb", min: 50000, max: 150000 },
  { label: "Rp150rb - Rp500rb", min: 150000, max: 500000 },
  { label: "Di atas Rp500rb", min: 500000, max: undefined },
];

export default function PriceFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [min, setMin] = useState(searchParams.get("minPrice") ?? "");
  const [max, setMax] = useState(searchParams.get("maxPrice") ?? "");

  function applyFilter(newMin?: string, newMax?: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (newMin) params.set("minPrice", newMin); else params.delete("minPrice");
    if (newMax) params.set("maxPrice", newMax); else params.delete("maxPrice");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="w-56 shrink-0">
      <p className="font-medium text-sm mb-2">Rentang Harga</p>
      <div className="space-y-1 mb-3">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => applyFilter(String(p.min), p.max ? String(p.max) : "")}
            className="block w-full text-left text-sm text-gray-600 hover:text-black py-1"
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          placeholder="Min"
          value={min}
          onChange={(e) => setMin(e.target.value)}
          className="w-full rounded-md border border-gray-300 p-1.5 text-sm"
        />
        <span className="text-gray-400">-</span>
        <input
          type="number"
          placeholder="Max"
          value={max}
          onChange={(e) => setMax(e.target.value)}
          className="w-full rounded-md border border-gray-300 p-1.5 text-sm"
        />
      </div>
      <button
        onClick={() => applyFilter(min, max)}
        className="mt-2 w-full rounded-md bg-black text-white text-sm py-1.5"
      >
        Terapkan
      </button>
    </div>
  );
}
```

Karena pakai `searchParams` di URL (bukan cuma state lokal), filter ini otomatis **shareable/bookmarkable** dan tetap jalan meski di-refresh — poin plus untuk dijelaskan di laporan (UX & SEO friendly).

---

# BAGIAN 3 — Meta Tag SEO per Halaman Produk

Next.js App Router punya `generateMetadata()` yang jalan di server, jadi search engine bisa baca title/description spesifik per produk (bukan cuma judul situs generik).

## 3.1 Dynamic Metadata

```tsx
// app/products/[id]/page.tsx
import type { Metadata } from "next";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";

async function getProduct(id: string) {
  const [product] = await db.select().from(products).where(eq(products.id, id));
  return product;
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const product = await getProduct(params.id);

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
      images: product.primaryImageUrl ? [product.primaryImageUrl] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: product.primaryImageUrl ? [product.primaryImageUrl] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);
  // ...render halaman seperti biasa
}
```

## 3.2 JSON-LD Structured Data (Rich Snippet di Google)

Tambahkan langsung di halaman detail produk (server component, tidak butuh `"use client"`):

```tsx
function ProductJsonLd({ product, averageRating, reviewCount }: {
  product: { name: string; description: string; price: number; primaryImageUrl: string };
  averageRating: string;
  reviewCount: number;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.primaryImageUrl,
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

// Panggil di dalam page.tsx:
// <ProductJsonLd product={product} averageRating={average} reviewCount={total} />
```

Ini yang bikin hasil pencarian Google produk kamu bisa muncul dengan bintang rating & harga langsung di snippet — bukan cuma judul & deskripsi biasa.

## 3.3 Sitemap Dinamis (bonus, sekalian biar SEO makin lengkap)

```typescript
// app/sitemap.ts
import { MetadataRoute } from "next";
import { db } from "@/db";
import { products } from "@/db/schema";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const allProducts = await db.select({ id: products.id, updatedAt: products.updatedAt }).from(products);

  const productUrls = allProducts.map((p) => ({
    url: `https://marketplace-1vxs.vercel.app/products/${p.id}`,
    lastModified: p.updatedAt,
  }));

  return [
    { url: "https://marketplace-1vxs.vercel.app", lastModified: new Date() },
    ...productUrls,
  ];
}
```

Next.js otomatis serve ini di `/sitemap.xml`.

---

# Ringkasan Urutan Kerja

1. Migrasi tabel `productImages`, migrasikan data gambar lama.
2. Update form upload produk pakai `ProductImageUploader`.
3. Ganti tampilan gambar tunggal di detail produk jadi `ProductGallery`.
4. Tambah `PriceFilter` di halaman listing + logic query di server component.
5. Tambah `generateMetadata()` + JSON-LD di halaman detail produk.
6. Tambah `app/sitemap.ts`.

Sesuaikan nama kolom (`price`, `category`, `primaryImageUrl`, dll) dengan skema asli project kamu sebelum di-paste.