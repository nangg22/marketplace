import { db } from "@/lib/db";
import { notifications } from "@/lib/schema";
import { eq, and, desc, sql } from "drizzle-orm";

type NotificationType = 
  | "new_order" 
  | "order_paid" 
  | "order_processing" 
  | "order_shipped" 
  | "order_delivered"
  | "refund_requested";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  orderId?: string;
}

// Buat notifikasi baru
export async function createNotification(params: CreateNotificationParams) {
  await db.insert(notifications).values({
    userId: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    orderId: params.orderId,
    isRead: false,
  });
}

// Ambil notifikasi untuk user tertentu (dengan limit)
export async function getNotifications(userId: string, limit: number = 20) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

// Ambil jumlah notifikasi yang belum dibaca
export async function getUnreadCount(userId: string) {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  
  return result[0]?.count ?? 0;
}

// Tandai satu notifikasi sudah dibaca
export async function markAsRead(notificationId: string) {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.id, notificationId));
}

// Tandai semua notifikasi user sudah dibaca
export async function markAllAsRead(userId: string) {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
}

// Notifikasi untuk seller saat ada order baru
export async function notifySellerNewOrder(orderId: string, sellerId: string, customerName: string, totalAmount: number) {
  const formatRupiah = (price: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);

  await createNotification({
    userId: sellerId,
    type: "new_order",
    title: "Pesanan Baru Masuk!",
    message: `${customerName} memesan produk Anda sebesar ${formatRupiah(totalAmount)}. Segera proses pesanan ini.`,
    orderId,
  });
}
