'use server';

import { requireRole } from '@/lib/auth-guard';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '@/lib/notifications';
import { revalidatePath } from 'next/cache';

export async function fetchNotifications() {
  const auth = await requireRole(['seller', 'customer']) as any;
  if (!auth.ok) return { success: false, error: 'Unauthorized' };

  const userId = auth.session?.user?.id;
  const notifications = await getNotifications(userId, 20);
  const unreadCount = await getUnreadCount(userId);

  return { success: true, notifications, unreadCount };
}

export async function markNotificationAsRead(notificationId: string) {
  const auth = await requireRole(['seller', 'customer']) as any;
  if (!auth.ok) return { success: false, error: 'Unauthorized' };

  await markAsRead(notificationId);
  revalidatePath('/seller/dashboard');
  revalidatePath('/seller/orders');

  return { success: true };
}

export async function markAllNotificationsAsRead() {
  const auth = await requireRole(['seller', 'customer']) as any;
  if (!auth.ok) return { success: false, error: 'Unauthorized' };

  const userId = auth.session?.user?.id;
  await markAllAsRead(userId);
  revalidatePath('/seller/dashboard');
  revalidatePath('/seller/orders');

  return { success: true };
}
