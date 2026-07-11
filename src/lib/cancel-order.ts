import { db } from "@/lib/db";
import { products, orderItems } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Mengembalikan stok produk ketika order dibatalkan.
 * Dipanggil di endpoint pembatalan order.
 */
export async function restoreStockOnCancel(orderId: string) {
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  for (const item of items) {
    await db
      .update(products)
      .set({ stock: sql`${products.stock} + ${item.quantity}` })
      .where(eq(products.id, item.productId));
  }
}
