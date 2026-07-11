# Implementasi Fitur Rating & Review — MallPedia

Panduan ini disesuaikan dengan stack yang kamu pakai: Next.js 16 (App Router), TypeScript, Drizzle ORM, Neon PostgreSQL, NextAuth v4, Zustand, Tailwind CSS.

---

## 1. Skema Database (Drizzle ORM)

Tambahkan ke file schema kamu (misal `db/schema.ts`):

```typescript
import { pgTable, uuid, integer, text, timestamp, boolean, unique } from "drizzle-orm/pg-core";
import { products } from "./schema"; // sesuaikan dengan import produk kamu
import { users } from "./schema";    // sesuaikan dengan import user/customer kamu
import { orders, orderItems } from "./schema"; // untuk verifikasi pembelian

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    orderId: uuid("order_id")
      .references(() => orders.id, { onDelete: "set null" }), // untuk verified purchase
    rating: integer("rating").notNull(), // 1-5
    comment: text("comment"),
    isVerifiedPurchase: boolean("is_verified_purchase").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    // satu user hanya boleh 1 review per produk
    uniqueUserProduct: unique().on(table.userId, table.productId),
  })
);

// Opsional: balasan dari seller
export const reviewReplies = pgTable("review_replies", {
  id: uuid("id").defaultRandom().primaryKey(),
  reviewId: uuid("review_id")
    .notNull()
    .references(() => reviews.id, { onDelete: "cascade" }),
  sellerId: uuid("seller_id").notNull(),
  reply: text("reply").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

Jalankan migrasi:
```bash
npx drizzle-kit generate
npx drizzle-kit push
```

**Catatan penting:** kolom `orderId` + `isVerifiedPurchase` memastikan hanya pembeli yang benar-benar checkout produk itu yang bisa review — ini poin plus untuk laporan tugas akhir (menunjukkan kamu paham konsep trust & fraud prevention di e-commerce).

---

## 2. API Route — Submit Review

`app/api/reviews/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // sesuaikan path config NextAuth kamu
import { db } from "@/db";
import { reviews, orderItems, orders } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Harus login untuk memberi review" }, { status: 401 });
  }

  const { productId, rating, comment } = await req.json();

  if (!productId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  // Cek apakah user pernah membeli produk ini (order dengan status selesai)
  const purchase = await db
    .select({ orderId: orders.id })
    .from(orders)
    .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
    .where(
      and(
        eq(orders.userId, session.user.id),
        eq(orderItems.productId, productId),
        eq(orders.status, "completed") // sesuaikan dengan enum status kamu
      )
    )
    .limit(1);

  const isVerified = purchase.length > 0;

  try {
    const [newReview] = await db
      .insert(reviews)
      .values({
        productId,
        userId: session.user.id,
        orderId: purchase[0]?.orderId ?? null,
        rating,
        comment,
        isVerifiedPurchase: isVerified,
      })
      .returning();

    return NextResponse.json(newReview, { status: 201 });
  } catch (err: any) {
    if (err.code === "23505") {
      return NextResponse.json(
        { error: "Kamu sudah pernah memberi review untuk produk ini" },
        { status: 409 }
      );
    }
    console.error(err);
    return NextResponse.json({ error: "Gagal menyimpan review" }, { status: 500 });
  }
}
```

## 3. API Route — Get Reviews + Rata-rata Rating

`app/api/products/[id]/reviews/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reviews, users } from "@/db/schema";
import { eq, avg, count, desc } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const productId = params.id;

  const list = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      isVerifiedPurchase: reviews.isVerifiedPurchase,
      createdAt: reviews.createdAt,
      userName: users.name,
    })
    .from(reviews)
    .innerJoin(users, eq(users.id, reviews.userId))
    .where(eq(reviews.productId, productId))
    .orderBy(desc(reviews.createdAt));

  const [summary] = await db
    .select({
      average: avg(reviews.rating),
      total: count(reviews.id),
    })
    .from(reviews)
    .where(eq(reviews.productId, productId));

  return NextResponse.json({
    reviews: list,
    average: summary?.average ? Number(summary.average).toFixed(1) : "0.0",
    total: summary?.total ?? 0,
  });
}
```

---

## 4. Komponen UI

### `components/StarRating.tsx` (bisa dipakai untuk display maupun input)

```tsx
"use client";

import { Star } from "lucide-react";
import { useState } from "react";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: number;
}

export default function StarRating({
  value,
  onChange,
  readOnly = false,
  size = 20,
}: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readOnly && setHover(star)}
          onMouseLeave={() => !readOnly && setHover(null)}
          className={readOnly ? "cursor-default" : "cursor-pointer"}
        >
          <Star
            size={size}
            fill={(hover ?? value) >= star ? "#facc15" : "none"}
            stroke={(hover ?? value) >= star ? "#facc15" : "#d1d5db"}
          />
        </button>
      ))}
    </div>
  );
}
```

### `components/ReviewForm.tsx`

```tsx
"use client";

import { useState } from "react";
import StarRating from "./StarRating";

export default function ReviewForm({
  productId,
  onSubmitted,
}: {
  productId: string;
  onSubmitted?: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Pilih rating dulu ya");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, rating, comment }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Gagal mengirim review");
      return;
    }

    setRating(0);
    setComment("");
    onSubmitted?.();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-gray-200 p-4">
      <p className="font-medium text-sm">Beri Rating & Review</p>
      <StarRating value={rating} onChange={setRating} size={24} />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Bagaimana pendapatmu soal produk ini?"
        className="w-full rounded-md border border-gray-300 p-2 text-sm"
        rows={3}
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-black px-4 py-2 text-white text-sm disabled:opacity-50"
      >
        {loading ? "Mengirim..." : "Kirim Review"}
      </button>
    </form>
  );
}
```

### `components/ReviewList.tsx`

```tsx
import StarRating from "./StarRating";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  isVerifiedPurchase: boolean;
  createdAt: string;
  userName: string;
}

export default function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return <p className="text-sm text-gray-500">Belum ada review untuk produk ini.</p>;
  }

  return (
    <div className="space-y-4">
      {reviews.map((r) => (
        <div key={r.id} className="border-b border-gray-100 pb-3">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">{r.userName}</span>
            {r.isVerifiedPurchase && (
              <span className="text-xs text-green-600">✅ Pembelian Terverifikasi</span>
            )}
          </div>
          <StarRating value={r.rating} readOnly size={16} />
          {r.comment && <p className="mt-1 text-sm text-gray-700">{r.comment}</p>}
          <span className="text-xs text-gray-400">
            {new Date(r.createdAt).toLocaleDateString("id-ID")}
          </span>
        </div>
      ))}
    </div>
  );
}
```

### Pemakaian di halaman detail produk

```tsx
// app/products/[id]/page.tsx (contoh, sesuaikan dengan struktur kamu)
import ReviewForm from "@/components/ReviewForm";
import ReviewList from "@/components/ReviewList";
import StarRating from "@/components/StarRating";

// ...setelah fetch data produk & reviews (via server component atau route handler)

<div className="mt-6">
  <div className="flex items-center gap-2 mb-4">
    <StarRating value={Number(average)} readOnly />
    <span className="text-sm text-gray-500">
      {average} ({total} review)
    </span>
  </div>
  <ReviewForm productId={product.id} />
  <div className="mt-6">
    <ReviewList reviews={reviewsData} />
  </div>
</div>
```

---

## 5. Rekomendasi Tambahan untuk Laporan Tugas Akhir

- **Verified Purchase badge** menunjukkan pemahaman soal *trust mechanism* — bisa jadi poin bahasan menarik di bab pembahasan.
- Tambahkan **rata-rata rating di card produk** (halaman etalase), bukan cuma di detail — ini meningkatkan konversi klik.
- Kalau mau lebih advance: tambah **helpful/like button** pada review (butuh tabel `review_helpful_votes` terpisah).
- Pertimbangkan **rate limiting** sederhana di API route (misal via middleware) supaya tidak ada spam review.

---

Silakan sesuaikan nama tabel/kolom (`users`, `orders`, `orderItems`) dengan skema asli project kamu — saya pakai nama umum berdasarkan konteks yang saya tahu soal MallPedia (Next.js + Drizzle + Neon).