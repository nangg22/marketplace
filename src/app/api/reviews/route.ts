import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { reviews, orderItems, orders, products } from "@/lib/schema";
import { and, eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Harus login untuk memberi review" },
      { status: 401 }
    );
  }

  const { productId, rating, title, reviewText } = await req.json();

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
        eq(orders.customerId, session.user.id),
        eq(orderItems.productId, productId),
        eq(orders.status, "completed")
      )
    )
    .limit(1);

  const isVerified = purchase.length > 0;

  try {
    const [newReview] = await db
      .insert(reviews)
      .values({
        productId,
        customerId: session.user.id,
        orderId: purchase[0]?.orderId ?? null,
        rating,
        title: title || null,
        reviewText: reviewText || null,
        isVerifiedPurchase: isVerified,
      })
      .returning();

    // Update rata-rata rating di tabel produk
    const allRatings = await db
      .select({ rating: reviews.rating })
      .from(reviews)
      .where(eq(reviews.productId, productId));

    const total = allRatings.length;
    const avg =
      total > 0
        ? allRatings.reduce((sum, r) => sum + r.rating, 0) / total
        : 0;

    await db
      .update(products)
      .set({
        rating: parseFloat(avg.toFixed(1)),
        ratingCount: total,
        reviewCount: total,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId));

    return NextResponse.json(newReview, { status: 201 });
  } catch (err: unknown) {
    const pgError = err as { code?: string };
    if (pgError.code === "23505") {
      return NextResponse.json(
        { error: "Kamu sudah pernah memberi review untuk produk ini" },
        { status: 409 }
      );
    }
    console.error(err);
    return NextResponse.json({ error: "Gagal menyimpan review" }, { status: 500 });
  }
}
