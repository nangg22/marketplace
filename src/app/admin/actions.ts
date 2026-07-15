'use server';

import { db } from '@/lib/db';
import { users, products, orders, orderItems } from '@/lib/schema';
import { requireRole } from '@/lib/auth-guard';
import { eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { updateOrderStatus as updateOrderStatusHelper } from '@/lib/orders';
import { logAdminAction } from '@/lib/audit-log';
import { AUDIT_ACTIONS } from '@/lib/audit-actions';
import { restoreStockOnCancel } from '@/lib/cancel-order';

// Helper: pastikan hanya admin yang bisa akses
async function assertAdmin() {
  const auth = await requireRole(['admin']);
  if (!auth.ok) throw new Error('Forbidden');
  const adminId = (auth.session?.user as any)?.id as string;
  return { auth, adminId };
}

// =============================================
// USER ACTIONS
// =============================================

export async function banUser(userId: string, reason: string) {
  const { adminId } = await assertAdmin();
  const before = await db.select({ isBanned: users.isBanned, banReason: users.banReason }).from(users).where(eq(users.id, userId)).limit(1);
  await db.update(users)
    .set({ isBanned: true, banReason: reason })
    .where(eq(users.id, userId));
  await logAdminAction({ actorId: adminId, action: AUDIT_ACTIONS.USER_BANNED, entityType: 'user', entityId: userId, before: before[0] as any, after: { isBanned: true, reason } });
  revalidatePath('/admin/users');
  return { success: true };
}

export async function unbanUser(userId: string) {
  const { adminId } = await assertAdmin();
  await db.update(users)
    .set({ isBanned: false, banReason: null })
    .where(eq(users.id, userId));
  await logAdminAction({ actorId: adminId, action: AUDIT_ACTIONS.USER_UNBANNED, entityType: 'user', entityId: userId, after: { isBanned: false } });
  revalidatePath('/admin/users');
  return { success: true };
}

export async function changeUserRole(userId: string, newRole: 'customer' | 'seller' | 'admin') {
  const { adminId } = await assertAdmin();
  const before = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
  await db.update(users)
    .set({ role: newRole })
    .where(eq(users.id, userId));
  await logAdminAction({ actorId: adminId, action: AUDIT_ACTIONS.USER_ROLE_CHANGED, entityType: 'user', entityId: userId, before: before[0] as any, after: { role: newRole } });
  revalidatePath('/admin/users');
  return { success: true };
}

export async function deleteUser(userId: string) {
  const { adminId } = await assertAdmin();

  const userOrders = await db.select({ id: orders.id }).from(orders).where(eq(orders.customerId, userId));
  const orderIds = userOrders.map(o => o.id);

  if (orderIds.length > 0) {
    await db.delete(orderItems).where(inArray(orderItems.orderId, orderIds));
    await db.delete(orders).where(inArray(orders.id, orderIds));
  }

  const sellerProducts = await db.select({ id: products.id }).from(products).where(eq(products.sellerId, userId));
  if (sellerProducts.length > 0) {
    const productIds = sellerProducts.map(p => p.id);
    await db.delete(orderItems).where(inArray(orderItems.productId, productIds));
    await db.delete(products).where(inArray(products.id, productIds));
  }

  await db.delete(users).where(eq(users.id, userId));
  await logAdminAction({ actorId: adminId, action: AUDIT_ACTIONS.USER_DELETED, entityType: 'user', entityId: userId });
  revalidatePath('/admin/users');
  return { success: true };
}

// =============================================
// PRODUCT ACTIONS
// =============================================

export async function suspendProduct(productId: string, reason: string) {
  const { adminId } = await assertAdmin();
  const before = await db.select({ isSuspended: products.isSuspended }).from(products).where(eq(products.id, productId)).limit(1);
  await db.update(products)
    .set({ isSuspended: true, suspendReason: reason, isAvailable: false })
    .where(eq(products.id, productId));
  await logAdminAction({ actorId: adminId, action: AUDIT_ACTIONS.PRODUCT_SUSPENDED, entityType: 'product', entityId: productId, before: before[0] as any, after: { isSuspended: true, reason } });
  revalidatePath('/admin/products');
  return { success: true };
}

export async function unsuspendProduct(productId: string) {
  const { adminId } = await assertAdmin();
  await db.update(products)
    .set({ isSuspended: false, suspendReason: null, isAvailable: true })
    .where(eq(products.id, productId));
  await logAdminAction({ actorId: adminId, action: AUDIT_ACTIONS.PRODUCT_UNSUSPENDED, entityType: 'product', entityId: productId, after: { isSuspended: false } });
  revalidatePath('/admin/products');
  return { success: true };
}

export async function deleteProduct(productId: string) {
  const { adminId } = await assertAdmin();
  await db.delete(products).where(eq(products.id, productId));
  await logAdminAction({ actorId: adminId, action: AUDIT_ACTIONS.PRODUCT_DELETED, entityType: 'product', entityId: productId });
  revalidatePath('/admin/products');
  return { success: true };
}

// =============================================
// ORDER ACTIONS
// =============================================

export async function updateOrderStatus(orderId: string, status: string) {
  const { adminId } = await assertAdmin();

  // Jika status berubah ke 'cancelled', kembalikan stok
  if (status === 'cancelled') {
    const [order] = await db
      .select({ status: orders.status })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    // Hanya kembalikan stok jika order belum shipped/delivered
    if (order?.status !== 'shipped' && order?.status !== 'delivered') {
      await restoreStockOnCancel(orderId);
    }
  }

  await updateOrderStatusHelper(orderId, status, 'Diusahakan oleh Admin');
  await logAdminAction({ actorId: adminId, action: AUDIT_ACTIONS.TRANSACTION_STATUS_UPDATED, entityType: 'order', entityId: orderId, after: { status } });
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
