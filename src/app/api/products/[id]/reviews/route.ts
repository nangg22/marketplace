import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reviews, users } from "@/lib/schema";
import { eq, avg, count, desc } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: productId } = await params;

  const list = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      title: reviews.title,
      reviewText: reviews.reviewText,
      isVerifiedPurchase: reviews.isVerifiedPurchase,
      createdAt: reviews.createdAt,
      userName: users.name,
    })
    .from(reviews)
    .innerJoin(users, eq(users.id, reviews.customerId))
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
