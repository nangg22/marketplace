'use server';

import { db } from '@/lib/db';
import { orders, orderItems, products } from '@/lib/schema';
import { requireRole } from '@/lib/auth-guard';
import { eq, and, inArray } from 'drizzle-orm';
import { updateOrderStatus } from '@/lib/orders';
import { revalidatePath } from 'next/cache';
import { createNotification } from '@/lib/notifications';

// Buyer konfirmasi barang sudah diterima
export async function confirmDelivery(orderId: string) {
  const auth = await requireRole(['customer']) as any;
  if (!auth.ok) return { success: false, error: 'Unauthorized' };

  const customerId = auth.session?.user?.id;

  // Pastikan order ini milik customer ini
  const [order] = await db
    .select({ status: orders.status, customerId: orders.customerId, paymentMethod: orders.paymentMethod })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order) return { success: false, error: 'Pesanan tidak ditemukan.' };
  if (order.customerId !== customerId) return { success: false, error: 'Forbidden: bukan pesanan Anda' };

  // Hanya bisa konfirmasi jika status shipped
  if (order.status !== 'shipped') {
    return { success: false, error: 'Pesanan belum dikirim atau sudah dikonfirmasi.' };
  }

  // Update status ke delivered
  await updateOrderStatus(orderId, 'delivered', 'Barang dikonfirmasi diterima oleh pembeli');

  // Kirim notifikasi ke seller
  // Cari seller yang produknya ada di order ini
  const orderWithItems = await db
    .select({ orderId: orderItems.orderId, productId: orderItems.productId })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  const productIds = orderWithItems.map((item) => item.productId);
  
  if (productIds.length > 0) {
    const sellerProducts = await db
      .select({ sellerId: products.sellerId })
      .from(products)
      .where(inArray(products.id, productIds));

    // Kirim notifikasi ke setiap seller unik
    const uniqueSellerIds = [...new Set(sellerProducts.map((p) => p.sellerId))];
    for (const sellerId of uniqueSellerIds) {
      const isCod = order.paymentMethod === 'cod';
      await createNotification({
        userId: sellerId,
        type: 'order_delivered',
        title: isCod ? 'Barang Diterima - Konfirmasi Pembayaran' : 'Barang Diterima Pembeli',
        message: isCod
          ? 'Pembeli sudah mengkonfirmasi menerima barang. Silakan konfirmasi pembayaran COD diterima.'
          : 'Pembeli sudah mengkonfirmasi menerima barang dengan baik.',
        orderId,
      });
    }
  }

  revalidatePath('/customer/orders');
  revalidatePath('/customer/orders/' + orderId);
  revalidatePath('/seller/orders');
  revalidatePath('/seller/dashboard');

  return { success: true };
}
