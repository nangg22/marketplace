import { db } from "@/lib/db";
import { orders, orderItems, products } from "@/lib/schema";
import { and, eq, gte, sql } from "drizzle-orm";

export async function getSellerSummary(sellerId: string, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  // total pendapatan & jumlah order (gunakan priceAtPurchase sesuai schema)
  const [summary] = await db
    .select({
      totalRevenue: sql<number>`coalesce(sum(${orderItems.priceAtPurchase} * ${orderItems.quantity}), 0)`,
      totalOrders: sql<number>`count(distinct ${orders.id})`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .innerJoin(products, eq(products.id, orderItems.productId))
    .where(
      and(
        eq(products.sellerId, sellerId),
        eq(orders.status, "paid"), // status "paid" sesuai schema proyek
        gte(orders.createdAt, since)
      )
    );

  // produk terlaris
  const topProducts = await db
    .select({
      productId: products.id,
      name: products.name,
      totalSold: sql<number>`coalesce(sum(${orderItems.quantity}), 0)`,
    })
    .from(orderItems)
    .innerJoin(products, eq(products.id, orderItems.productId))
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(and(eq(products.sellerId, sellerId), eq(orders.status, "paid")))
    .groupBy(products.id, products.name)
    .orderBy(sql`sum(${orderItems.quantity}) desc`)
    .limit(5);

  // pendapatan per hari (untuk grafik)
  const dailyRevenue = await db
    .select({
      date: sql<string>`date(${orders.createdAt})`,
      revenue: sql<number>`sum(${orderItems.priceAtPurchase} * ${orderItems.quantity})`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .innerJoin(products, eq(products.id, orderItems.productId))
    .where(
      and(
        eq(products.sellerId, sellerId),
        eq(orders.status, "paid"),
        gte(orders.createdAt, since)
      )
    )
    .groupBy(sql`date(${orders.createdAt})`)
    .orderBy(sql`date(${orders.createdAt})`);

  return { summary, topProducts, dailyRevenue };
}
