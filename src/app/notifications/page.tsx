import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getNotifications, getUnreadCount, markAllAsRead, markAsRead, getNotificationHref } from '@/lib/notifications';
import { revalidatePath } from 'next/cache';

export const metadata: Metadata = {
  title: 'Notifikasi | LakuLagi',
  description: 'Lihat semua aktivitas dan notifikasi terbaru di LakuLagi.',
};

type PageFilter = 'all' | 'unread' | 'orders' | 'messages';

const NOTIF_COLORS: Record<string, string> = {
  new_order: 'bg-[var(--neo-secondary)] text-white',
  order_paid: 'bg-[var(--neo-green)] text-[var(--neo-black)]',
  order_processing: 'bg-[var(--neo-accent)] text-[var(--neo-black)]',
  order_shipped: 'bg-[var(--neo-primary)] text-white',
  order_delivered: 'bg-[var(--neo-green)] text-[var(--neo-black)]',
  refund_requested: 'bg-[var(--neo-pink)] text-white',
  new_message: 'bg-[var(--neo-black)] text-[var(--neo-accent)]',
};

const NOTIF_EMOJI: Record<string, string> = {
  new_order: '🛒',
  order_paid: '💰',
  order_processing: '📦',
  order_shipped: '🚚',
  order_delivered: '✅',
  refund_requested: '🔄',
  new_message: '💬',
};

function formatTime(date: Date | string) {
  const now = new Date();
  const notifDate = new Date(date);
  const diffMs = now.getTime() - notifDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;

  return notifDate.toLocaleDateString('id-ID');
}

function matchesFilter(type: string, isRead: boolean, filter: PageFilter) {
  if (filter === 'unread') return !isRead;
  if (filter === 'orders') return type !== 'new_message';
  if (filter === 'messages') return type === 'new_message';
  return true;
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ filter?: string }>;
}) {
  const resolvedSearchParams = (await searchParams) || {};
  const filter = (resolvedSearchParams.filter as PageFilter) || 'all';

  const session = await getServerSession(authOptions);
  if (!session) redirect('/login?callbackUrl=/notifications');

  const userId = session.user.id;
  const role = session.user.role;

  const [notifications, unreadCount] = await Promise.all([
    getNotifications(userId, 50),
    getUnreadCount(userId),
  ]);

  const filteredNotifications = notifications.filter((notif) =>
    matchesFilter(notif.type, notif.isRead, filter)
  );

  async function markAllReadAction() {
    'use server';

    await markAllAsRead(userId);
    revalidatePath('/notifications');
    revalidatePath('/seller/dashboard');
    revalidatePath('/seller/orders');
  }

  async function openNotificationAction(formData: FormData) {
    'use server';

    const notificationId = formData.get('notificationId') as string;
    const href = formData.get('href') as string;
    const isRead = formData.get('isRead') === 'true';

    if (!isRead) {
      await markAsRead(notificationId, userId);
    }

    revalidatePath('/notifications');
    redirect(href || '/notifications');
  }

  const tabs: { key: PageFilter; label: string }[] = [
    { key: 'all', label: 'Semua' },
    { key: 'unread', label: 'Belum Dibaca' },
    { key: 'orders', label: 'Pesanan' },
    { key: 'messages', label: 'Pesan' },
  ];

  return (
    <div className="min-h-screen bg-[var(--neo-bg)] flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-2xl mx-auto w-full px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 animate-slide-up">
          <h1 className="text-2xl font-extrabold flex items-center gap-2">
            <span className="bg-[var(--neo-black)] text-[var(--neo-accent)] p-2 rounded-xl text-sm rotate-[-2deg]">🔔</span>
            Notifikasi
            {unreadCount > 0 && (
              <span className="neo-badge bg-[var(--neo-pink)] text-white text-xs px-2">
                {unreadCount} baru
              </span>
            )}
          </h1>
          {unreadCount > 0 && (
            <form action={markAllReadAction}>
              <button className="neo-btn neo-btn-outline text-xs py-1.5 px-3 opacity-60 hover:opacity-100">
                ✓ Tandai Semua Dibaca
              </button>
            </form>
          )}
        </div>

        {/* Tab filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1 animate-slide-up stagger-1">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={tab.key === 'all' ? '/notifications' : `/notifications?filter=${tab.key}`}
              className={`neo-btn text-xs py-1.5 px-4 flex-shrink-0 ${
                filter === tab.key ? 'neo-btn-primary' : 'neo-btn-outline'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {/* Daftar Notifikasi */}
        <div className="flex flex-col gap-3 animate-slide-up stagger-2">
          {filteredNotifications.map((notif, i) => (
            <form
              key={notif.id}
              action={openNotificationAction}
              className={`neo-card stagger-${Math.min(i + 1, 12)}`}
            >
              <input type="hidden" name="notificationId" value={notif.id} />
              <input type="hidden" name="href" value={getNotificationHref(notif, role)} />
              <input type="hidden" name="isRead" value={String(notif.isRead)} />
              <button
                type="submit"
                className={`w-full flex items-start gap-4 p-4 text-left hover:translate-y-[-2px] transition-transform duration-150 ${
                !notif.isRead ? 'border-l-[6px] border-l-[var(--neo-primary)]' : ''
              }`}
              >
              {/* Icon */}
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl border-[3px] border-[var(--neo-black)] shadow-[2px_2px_0px_var(--neo-black)] flex-shrink-0 ${NOTIF_COLORS[notif.type] || 'bg-[var(--neo-gray)] text-[var(--neo-black)]'}`}>
                {NOTIF_EMOJI[notif.type] || '🔔'}
              </div>

              {/* Konten */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug mb-0.5 ${!notif.isRead ? 'font-extrabold' : 'font-semibold opacity-80'}`}>
                  {notif.title}
                </p>
                <p className="text-xs opacity-60 font-medium line-clamp-2">{notif.message}</p>
                <p className="text-[10px] opacity-40 font-bold mt-1">{formatTime(notif.createdAt)}</p>
              </div>

              {/* Unread dot */}
              {!notif.isRead && (
                <div className="w-2.5 h-2.5 rounded-full bg-[var(--neo-primary)] border-[2px] border-[var(--neo-black)] flex-shrink-0 mt-1" />
              )}
              </button>
            </form>
          ))}
        </div>

        {/* Empty state (tersembunyi jika ada notif) */}
        {filteredNotifications.length === 0 && (
          <div className="neo-card p-12 text-center mt-4">
            <div className="text-5xl mb-3 animate-float">🌿</div>
            <h3 className="font-extrabold text-lg mb-2">Belum Ada Notifikasi</h3>
            <p className="text-sm opacity-60 font-medium">
              Aktivitas terbaru seperti pesanan masuk, update pengiriman, dan pesan chat akan tampil di sini.
            </p>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
