'use server';

import { db } from '@/lib/db';
import { orders, orderItems } from '@/lib/schema';

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export async function createOrder(customerName: string, items: CartItem[], totalAmount: number) {
  // 1. Simpan ke tabel orders
  const [newOrder] = await db.insert(orders).values({
    customerName,
    totalAmount,
    status: 'paid', // Simulasi langsung lunas
    createdAt: new Date().toISOString(),
  }).returning();

  // 2. Simpan setiap item ke tabel orderItems
  const itemsToInsert = items.map(item => ({
    orderId: newOrder.id,
    productId: item.id,
    quantity: item.quantity,
    priceAtPurchase: item.price,
  }));

  await db.insert(orderItems).values(itemsToInsert);

  return newOrder.id;
}
