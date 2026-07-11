import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { products } from "@/lib/schema";
import { and, eq, lte } from "drizzle-orm";

const LOW_STOCK_THRESHOLD = 5;

export async function GET() {
  const session = await getServerSession(authOptions);
  const sellerId = (session?.user as any)?.id;
  if (!sellerId) return NextResponse.json({ items: [] });

  const lowStock = await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.sellerId, sellerId),
        lte(products.stock, LOW_STOCK_THRESHOLD)
      )
    );

  return NextResponse.json({ items: lowStock });
}
