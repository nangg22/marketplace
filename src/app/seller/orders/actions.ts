'use server';

import { db } from '@/lib/db';
import { orders, orderItems, products } from '@/lib/schema';
import { requireRole } from '@/lib/auth-guard';
import { eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { updateOrderStatus } from '@/lib/orders';

// Verifikasi bahwa order ini mengandung produk milik seller yang request
async function verifySellerOwnsOrder(sellerId: string, orderId: string): Promise<boolean> {
  const myProducts = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.sellerId, sellerId));

  if (myProducts.length === 0) return false;

  const myProductIds = myProducts.map((p) => p.id);

  const matchingItems = await db
    .select({ orderId: orderItems.orderId })
    .from(orderItems)
    .where(inArray(orderItems.productId, myProductIds))
    .limit(1);

  return matchingItems.some((item) => item.orderId === orderId);
}

export async function approveOrder(orderId: string) {
  const auth = await requireRole(['seller']) as any;
  if (!auth.ok) return { success: false, error: 'Unauthorized' };

  const sellerId = auth.session?.user?.id;

  // Pastikan order ini memang mengandung produk milik seller ini
  const isOwner = await verifySellerOwnsOrder(sellerId, orderId);
  if (!isOwner) return { success: false, error: 'Forbidden: bukan pesanan Anda' };

  await updateOrderStatus(orderId, 'processing', 'Diproses oleh Penjual');

  revalidatePath('/seller/orders');
  revalidatePath('/seller/dashboard');
  return { success: true };
}

export async function cancelOrder(orderId: string) {
  const auth = await requireRole(['seller']) as any;
  if (!auth.ok) return { success: false, error: 'Unauthorized' };

  const sellerId = auth.session?.user?.id;

  const isOwner = await verifySellerOwnsOrder(sellerId, orderId);
  if (!isOwner) return { success: false, error: 'Forbidden: bukan pesanan Anda' };

  await updateOrderStatus(orderId, 'cancelled', 'Dibatalkan oleh Penjual');

  revalidatePath('/seller/orders');
  revalidatePath('/seller/dashboard');
  return { success: true };
}

export async function markShipped(orderId: string) {
  const auth = await requireRole(['seller']) as any;
  if (!auth.ok) return { success: false, error: 'Unauthorized' };

  const sellerId = auth.session?.user?.id;

  const isOwner = await verifySellerOwnsOrder(sellerId, orderId);
  if (!isOwner) return { success: false, error: 'Forbidden: bukan pesanan Anda' };

  await updateOrderStatus(orderId, 'shipped', 'Dikirim oleh Penjual');

  revalidatePath('/seller/orders');
  revalidatePath('/seller/dashboard');
  return { success: true };
}
