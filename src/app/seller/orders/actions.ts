'use server';

import { db } from '@/lib/db';
import { orders, orderItems, products } from '@/lib/schema';
import { requireRole } from '@/lib/auth-guard';
import { eq, and, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { updateOrderStatus } from '@/lib/orders';
import { restoreStockOnCancel } from '@/lib/cancel-order';

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
    .where(and(inArray(orderItems.productId, myProductIds), eq(orderItems.orderId, orderId)))
    .limit(1);

  return matchingItems.length > 0;
}

export async function approveOrder(orderId: string) {
  const auth = await requireRole(['seller']) as any;
  if (!auth.ok) return { success: false, error: 'Unauthorized' };

  const sellerId = auth.session?.user?.id;

  // Pastikan order ini memang mengandung produk milik seller ini
  const isOwner = await verifySellerOwnsOrder(sellerId, orderId);
  if (!isOwner) return { success: false, error: 'Forbidden: bukan pesanan Anda' };

  // Cek status order
  const [order] = await db
    .select({ status: orders.status, paymentMethod: orders.paymentMethod })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  // Validasi status yang bisa di-approve
  const approvableStatuses = ['paid', 'pending_cod'];
  if (!order?.status || !approvableStatuses.includes(order.status)) {
    return { success: false, error: 'Status pesanan tidak bisa di-approve.' };
  }

  await updateOrderStatus(orderId, 'processing', 'Diproses oleh Penjual');

  revalidatePath('/seller/orders');
  revalidatePath('/seller/dashboard');
  return { success: true };
}

export async function confirmCodPayment(orderId: string) {
  const auth = await requireRole(['seller']) as any;
  if (!auth.ok) return { success: false, error: 'Unauthorized' };

  const sellerId = auth.session?.user?.id;

  // Pastikan order ini memang mengandung produk milik seller ini
  const isOwner = await verifySellerOwnsOrder(sellerId, orderId);
  if (!isOwner) return { success: false, error: 'Forbidden: bukan pesanan Anda' };

  // Cek status order
  const [order] = await db
    .select({ status: orders.status, paymentMethod: orders.paymentMethod })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  // Hanya bisa konfirmasi COD jika status delivered (barang sudah diterima buyer)
  if (order?.paymentMethod !== 'cod') {
    return { success: false, error: 'Bukan pesanan COD.' };
  }

  if (order?.status !== 'delivered') {
    return { success: false, error: 'Barang belum dikonfirmasi diterima oleh pembeli.' };
  }

  await updateOrderStatus(orderId, 'completed', 'Pembayaran COD diterima, pesanan selesai');

  revalidatePath('/seller/orders');
  revalidatePath('/seller/dashboard');
  revalidatePath('/customer/orders');
  return { success: true };
}

export async function cancelOrder(orderId: string) {
  const auth = await requireRole(['seller']) as any;
  if (!auth.ok) return { success: false, error: 'Unauthorized' };

  const sellerId = auth.session?.user?.id;

  const isOwner = await verifySellerOwnsOrder(sellerId, orderId);
  if (!isOwner) return { success: false, error: 'Forbidden: bukan pesanan Anda' };

  // Cek status order sebelum cancel
  const [order] = await db
    .select({ status: orders.status })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  // Jika order sudah dikirim/diterima, tidak boleh cancel
  if (order?.status === 'shipped' || order?.status === 'delivered') {
    return { success: false, error: 'Pesanan sudah dikirim/diterima, tidak bisa dibatalkan.' };
  }

  // Kembalikan stok produk
  await restoreStockOnCancel(orderId);

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
  revalidatePath('/customer/orders');
  return { success: true };
}
