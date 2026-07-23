import { db } from "@/lib/db";
import { products, orders, orderItems } from "@/lib/schema";
import { sql } from "drizzle-orm";

interface CartItem {
  productId: string;
  quantity: number;
  priceAtPurchase: number;
}

interface CreateOrderOptions {
  customerId: string;
  customerName: string;
  totalAmount: number;
  paymentMethod?: string;
  recipientName?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  items: CartItem[];
}

/**
 * Membuat order dan mengurangi stok dalam satu database transaction.
 * Race condition-safe: stok dikurangi dengan kondisi WHERE stock >= quantity di level database.
 */
export async function createOrderWithStockCheck(opts: CreateOrderOptions) {
  return await db.transaction(async (tx) => {
    // 1. Cek & kurangi stok tiap produk — atomic, aman dari race condition
    for (const item of opts.items) {
      const result = await tx
        .update(products)
        .set({ stock: sql`${products.stock} - ${item.quantity}` })
        .where(
          sql`${products.id} = ${item.productId} AND ${products.stock} >= ${item.quantity}`
        )
        .returning({ id: products.id });

      if (result.length === 0) {
        throw new Error(`Stok tidak mencukupi untuk produk ${item.productId}`);
      }
    }

    // 2. Buat order — COD langsung pakai status "pending_cod"
    const isCod = (opts.paymentMethod ?? "qris") === "cod";
    const [order] = await tx
      .insert(orders)
      .values({
        customerId: opts.customerId,
        customerName: opts.customerName,
        totalAmount: opts.totalAmount,
        status: isCod ? "pending_cod" : "pending",
        paymentMethod: opts.paymentMethod ?? "qris",
        recipientName: opts.recipientName,
        phone: opts.phone,
        address: opts.address,
        city: opts.city,
        province: opts.province,
        postalCode: opts.postalCode,
      })
      .returning();

    // 3. Buat order items (sesuai skema: priceAtPurchase)
    await tx.insert(orderItems).values(
      opts.items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: item.priceAtPurchase,
      }))
    );

    return order;
  });
}
