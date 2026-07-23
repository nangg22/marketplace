'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/app/seller/notifications/actions';

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  orderId: string | null;
  isRead: boolean;
  createdAt: Date | string;
};

interface NotificationBellProps {
  initialCount?: number;
}

export default function NotificationBell({ initialCount = 0 }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const loadNotifications = async () => {
    setLoading(true);
    const result = await fetchNotifications();
    if (result.success && result.notifications && result.unreadCount !== undefined) {
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  // Refresh count setiap 30 detik
  useEffect(() => {
    const interval = setInterval(async () => {
      const result = await fetchNotifications();
      if (result.success && result.unreadCount !== undefined) {
        setUnreadCount(result.unreadCount);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id);
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
    }
    setIsOpen(false);
    if (notification.orderId) {
      router.push('/seller/orders');
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const formatTime = (date: Date | string) => {
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
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_order': return '🛒';
      case 'order_paid': return '💰';
      case 'order_processing': return '📦';
      case 'order_shipped': return '🚚';
      case 'order_delivered': return '✅';
      case 'refund_requested': return '🔄';
      default: return '🔔';
    }
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative neo-btn neo-btn-outline p-2 hover:bg-[var(--neo-gray)]"
        aria-label="Notifikasi"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[var(--neo-accent)] text-[var(--neo-black)] text-xs font-extrabold w-5 h-5 rounded-full border-2 border-[var(--neo-black)] flex items-center justify-center animate-bounce-in">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Notification Panel */}
          <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-hidden bg-[var(--neo-bg)] border-[3px] border-[var(--neo-black)] rounded-xl shadow-[var(--neo-shadow)] z-50 animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b-[2px] border-[var(--neo-black)] bg-[var(--neo-gray)]">
              <h3 className="font-extrabold text-lg">Notifikasi</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs font-bold text-[var(--neo-primary)] hover:underline"
                >
                  Tandai semua dibaca
                </button>
              )}
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-72">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="text-2xl animate-spin mb-2">⏳</div>
                  <p className="text-sm font-semibold opacity-60">Memuat notifikasi...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-2">🔔</div>
                  <p className="text-sm font-semibold opacity-60">Belum ada notifikasi</p>
                </div>
              ) : (
                <div className="divide-y-[2px] divide-dashed divide-[var(--neo-black)] divide-opacity-10">
                  {notifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`w-full text-left p-4 hover:bg-[var(--neo-gray)] transition-colors ${
                        !notif.isRead ? 'bg-[var(--neo-accent)]/10' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <span className="text-2xl shrink-0">{getNotificationIcon(notif.type)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-extrabold text-sm truncate">{notif.title}</p>
                            {!notif.isRead && (
                              <span className="w-2 h-2 bg-[var(--neo-accent)] rounded-full shrink-0" />
                            )}
                          </div>
                          <p className="text-xs font-medium opacity-60 line-clamp-2">{notif.message}</p>
                          <p className="text-xs font-semibold opacity-40 mt-1">{formatTime(notif.createdAt)}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
