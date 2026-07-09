'use server';

import { db } from '@/lib/db';
import { users, products, orders, orderItems } from '@/lib/schema';
import { requireRole } from '@/lib/auth-guard';
import { eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// Helper: pastikan hanya admin yang bisa akses
async function assertAdmin() {
  const auth = await requireRole(['admin']);
  if (!auth.ok) throw new Error('Forbidden');
  return auth;
}

// =============================================
// USER ACTIONS
// =============================================

export async function banUser(userId: string, reason: string) {
  await assertAdmin();
  await db.update(users)
    .set({ isBanned: true, banReason: reason })
    .where(eq(users.id, userId));
  revalidatePath('/admin/users');
  return { success: true };
}

export async function unbanUser(userId: string) {
  await assertAdmin();
  await db.update(users)
    .set({ isBanned: false, banReason: null })
    .where(eq(users.id, userId));
  revalidatePath('/admin/users');
  return { success: true };
}

export async function changeUserRole(userId: string, newRole: 'customer' | 'seller' | 'admin') {
  await assertAdmin();
  await db.update(users)
    .set({ role: newRole })
    .where(eq(users.id, userId));
  revalidatePath('/admin/users');
  return { success: true };
}

export async function deleteUser(userId: string) {
  await assertAdmin();

  // Hapus dalam urutan yang benar agar tidak melanggar FK:
  // 1. Cari semua order milik user ini (sebagai customer)
  const userOrders = await db.select({ id: orders.id }).from(orders).where(eq(orders.customerId, userId));
  const orderIds = userOrders.map(o => o.id);

  // 2. Hapus orderItems dari order-order tersebut
  if (orderIds.length > 0) {
    await db.delete(orderItems).where(inArray(orderItems.orderId, orderIds));
    await db.delete(orders).where(inArray(orders.id, orderIds));
  }

  // 3. Hapus orderItems yang merujuk produk milik user ini (jika seller)
  const sellerProducts = await db.select({ id: products.id }).from(products).where(eq(products.sellerId, userId));
  if (sellerProducts.length > 0) {
    const productIds = sellerProducts.map(p => p.id);
    await db.delete(orderItems).where(inArray(orderItems.productId, productIds));
    await db.delete(products).where(inArray(products.id, productIds));
  }

  // 4. Hapus user
  await db.delete(users).where(eq(users.id, userId));
  revalidatePath('/admin/users');
  return { success: true };
}

// =============================================
// PRODUCT ACTIONS
// =============================================

export async function suspendProduct(productId: string, reason: string) {
  await assertAdmin();
  await db.update(products)
    .set({ isSuspended: true, suspendReason: reason, isAvailable: false })
    .where(eq(products.id, productId));
  revalidatePath('/admin/products');
  return { success: true };
}

export async function unsuspendProduct(productId: string) {
  await assertAdmin();
  await db.update(products)
    .set({ isSuspended: false, suspendReason: null, isAvailable: true })
    .where(eq(products.id, productId));
  revalidatePath('/admin/products');
  return { success: true };
}

export async function deleteProduct(productId: string) {
  await assertAdmin();
  await db.delete(products).where(eq(products.id, productId));
  revalidatePath('/admin/products');
  return { success: true };
}

// =============================================
// ORDER ACTIONS
// =============================================

export async function updateOrderStatus(orderId: string, status: string) {
  await assertAdmin();
  await db.update(orders)
    .set({ status })
    .where(eq(orders.id, orderId));
  revalidatePath('/admin/transactions');
  return { success: true };
}

export async function deleteOrder(orderId: string) {
  await assertAdmin();
  // Hapus orderItems dulu sebelum order (FK constraint)
  await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
  await db.delete(orders).where(eq(orders.id, orderId));
  revalidatePath('/admin/transactions');
  return { success: true };
}
