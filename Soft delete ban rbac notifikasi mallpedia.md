# Implementasi: Soft-Delete, Ban/Suspend dengan Alasan, RBAC Admin, & Notifikasi — MallPedia

Stack: Next.js 16 (App Router), TypeScript, Drizzle ORM, Neon PostgreSQL, NextAuth v4.

---

# BAGIAN 1 — Soft-Delete + Konfirmasi Hapus

## 1.1 Tambah Kolom `deletedAt` di Tabel yang Perlu (users, products, orders)

```typescript
// db/schema.ts
import { timestamp } from "drizzle-orm/pg-core";

// tambahkan ke tabel users, products, orders yang sudah ada:
deletedAt: timestamp("deleted_at"), // null = belum dihapus
```

## 1.2 Helper Query — Selalu Exclude Data yang Sudah Dihapus

```typescript
// lib/soft-delete.ts
import { isNull } from "drizzle-orm";
import { products, users, orders } from "@/db/schema";

// pakai di setiap query listing supaya data "terhapus" tidak muncul
export const notDeleted = {
  products: isNull(products.deletedAt),
  users: isNull(users.deletedAt),
  orders: isNull(orders.deletedAt),
};
```

Contoh pemakaian:
```typescript
import { and, eq } from "drizzle-orm";
import { notDeleted } from "@/lib/soft-delete";

const activeProducts = await db
  .select()
  .from(products)
  .where(and(eq(products.sellerId, sellerId), notDeleted.products));
```

## 1.3 API Route — Soft Delete (bukan `DELETE` beneran)

```typescript
// app/api/admin/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { logAdminAction } from "@/lib/audit-log";
import { AUDIT_ACTIONS } from "@/lib/audit-actions";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const [updated] = await db
    .update(products)
    .set({ deletedAt: new Date() })
    .where(eq(products.id, params.id))
    .returning();

  await logAdminAction({
    req,
    actorId: guard.session.user.id,
    action: AUDIT_ACTIONS.PRODUCT_DELETED,
    entityType: "product",
    entityId: params.id,
    after: { deletedAt: updated.deletedAt },
  });

  return NextResponse.json({ success: true });
}

// Endpoint pemulihan, kalau admin salah hapus
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const body = await req.json();
  if (body.action !== "restore") {
    return NextResponse.json({ error: "Aksi tidak dikenali" }, { status: 400 });
  }

  const [restored] = await db
    .update(products)
    .set({ deletedAt: null })
    .where(eq(products.id, params.id))
    .returning();

  return NextResponse.json(restored);
}
```

> Data yang di-soft-delete tetap ada di database — jadi kalau ternyata dibutuhkan lagi untuk laporan/pajak/investigasi, tinggal query langsung tanpa `notDeleted` filter, atau restore lewat endpoint di atas.

## 1.4 Modal Konfirmasi Dua Langkah (Client)

```tsx
// components/ConfirmDeleteModal.tsx
"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";

export default function ConfirmDeleteModal({
  itemName,
  onConfirm,
  onCancel,
}: {
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [confirmText, setConfirmText] = useState("");
  const canConfirm = confirmText === "HAPUS";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full">
        <div className="flex items-center gap-2 text-red-600 mb-3">
          <AlertTriangle size={20} />
          <p className="font-medium">Konfirmasi Penghapusan</p>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Kamu akan menghapus <span className="font-medium">{itemName}</span>. Data akan disembunyikan
          dari sistem tapi tetap tersimpan untuk keperluan audit. Ketik <b>HAPUS</b> untuk melanjutkan.
        </p>
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="w-full border rounded-md px-3 py-2 text-sm mb-4"
          placeholder="Ketik HAPUS"
        />
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm rounded-md border">
            Batal
          </button>
          <button
            disabled={!canConfirm}
            onClick={onConfirm}
            className="px-4 py-2 text-sm rounded-md bg-red-600 text-white disabled:opacity-40"
          >
            Hapus Permanen dari Tampilan
          </button>
        </div>
      </div>
    </div>
  );
}
```

Pola "ketik HAPUS untuk konfirmasi" ini standar di banyak dashboard admin (GitHub, Vercel, dll) — mencegah klik tidak sengaja untuk aksi berisiko tinggi.

---

# BAGIAN 2 — Alasan & Durasi Ban/Suspend

## 2.1 Tambah Kolom di Tabel `users` dan `products`

```typescript
// db/schema.ts
import { text, timestamp, boolean } from "drizzle-orm/pg-core";

// tambahkan ke tabel users:
isBanned: boolean("is_banned").default(false).notNull(),
banReason: text("ban_reason"),
bannedAt: timestamp("banned_at"),
bannedUntil: timestamp("banned_until"), // null = permanen

// tambahkan ke tabel products:
isSuspended: boolean("is_suspended").default(false).notNull(),
suspendReason: text("suspend_reason"),
suspendedAt: timestamp("suspended_at"),
```

## 2.2 API Route — Ban dengan Alasan & Durasi

```typescript
// app/api/admin/users/[id]/ban/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { logAdminAction } from "@/lib/audit-log";
import { AUDIT_ACTIONS } from "@/lib/audit-actions";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const banSchema = z.object({
  reason: z.string().min(10, "Alasan minimal 10 karakter"),
  durationDays: z.number().int().positive().optional(), // kosong = permanen
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const parsed = banSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { reason, durationDays } = parsed.data;
  const bannedUntil = durationDays
    ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
    : null;

  const [updated] = await db
    .update(users)
    .set({ isBanned: true, banReason: reason, bannedAt: new Date(), bannedUntil })
    .where(eq(users.id, params.id))
    .returning();

  await logAdminAction({
    req,
    actorId: guard.session.user.id,
    action: AUDIT_ACTIONS.USER_BANNED,
    entityType: "user",
    entityId: params.id,
    after: { reason, bannedUntil },
  });

  return NextResponse.json(updated);
}
```

## 2.3 Auto Unban Setelah Durasi Habis

Karena serverless (Vercel) tidak punya cron job persisten bawaan, cek langsung saat user login/akses:

```typescript
// lib/check-ban-status.ts
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function checkAndAutoUnban(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));

  if (user.isBanned && user.bannedUntil && new Date() > user.bannedUntil) {
    await db
      .update(users)
      .set({ isBanned: false, banReason: null, bannedUntil: null })
      .where(eq(users.id, userId));
    return { ...user, isBanned: false };
  }

  return user;
}
```

Panggil ini di `callbacks.session` pada konfigurasi NextAuth, atau di middleware saat validasi login — supaya ban sementara otomatis lepas tanpa perlu admin manual.

> Alternatif lebih robust: pakai [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs) untuk cek berkala semua user yang `bannedUntil` sudah lewat, kalau butuh solusi yang tidak bergantung pada user login duluan.

## 2.4 Tampilkan Alasan ke User yang Kena Ban/Suspend

```tsx
// contoh banner di dashboard seller kalau produknya di-suspend
{product.isSuspended && (
  <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700 mb-4">
    <p className="font-medium">Produk ini ditangguhkan</p>
    <p>Alasan: {product.suspendReason}</p>
    <p className="text-xs mt-1">Hubungi admin jika kamu merasa ini keliru.</p>
  </div>
)}
```

## 2.5 Form Admin dengan Pilihan Durasi

```tsx
// components/BanUserForm.tsx
"use client";

import { useState } from "react";

const DURATION_OPTIONS = [
  { label: "1 hari", value: 1 },
  { label: "7 hari", value: 7 },
  { label: "30 hari", value: 30 },
  { label: "Permanen", value: undefined },
];

export default function BanUserForm({ userId, onDone }: { userId: string; onDone: () => void }) {
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState<number | undefined>(7);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/admin/users/${userId}/ban`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason, durationDays: duration }),
    });
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        required
        minLength={10}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Alasan ban (min. 10 karakter)..."
        className="w-full border rounded-md p-2 text-sm"
      />
      <div className="flex gap-2">
        {DURATION_OPTIONS.map((opt) => (
          <button
            type="button"
            key={opt.label}
            onClick={() => setDuration(opt.value)}
            className={`px-3 py-1.5 text-xs rounded-md border ${
              duration === opt.value ? "bg-black text-white" : "bg-white"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <button className="rounded-md bg-red-600 text-white px-4 py-2 text-sm">Ban User</button>
    </form>
  );
}
```

---

# BAGIAN 3 — RBAC Admin (Super Admin vs Moderator)

## 3.1 Tambah Kolom Role dengan Level Lebih Detail

```typescript
// db/schema.ts
import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "customer",
  "seller",
  "moderator",   // bisa suspend/ban, tidak bisa hapus permanen atau ubah role admin lain
  "super_admin", // akses penuh
]);

// kolom role di tabel users pakai enum ini
```

## 3.2 Definisikan Permission per Role

```typescript
// lib/permissions.ts
export const PERMISSIONS = {
  customer: [],
  seller: ["product.create", "product.edit_own"],
  moderator: [
    "user.ban",
    "user.unban",
    "product.suspend",
    "product.unsuspend",
    "transaction.view",
    "review.moderate",
  ],
  super_admin: [
    "user.ban",
    "user.unban",
    "user.delete",
    "user.change_role",
    "product.suspend",
    "product.unsuspend",
    "product.delete",
    "transaction.view",
    "transaction.refund",
    "category.manage",
    "review.moderate",
    "settings.manage",
  ],
} as const;

export type Permission = (typeof PERMISSIONS)["super_admin"][number];

export function hasPermission(role: string, permission: Permission): boolean {
  const rolePermissions = PERMISSIONS[role as keyof typeof PERMISSIONS] ?? [];
  return (rolePermissions as readonly string[]).includes(permission);
}
```

## 3.3 Guard yang Bisa Cek Permission Spesifik

```typescript
// lib/require-permission.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { hasPermission, Permission } from "@/lib/permissions";

export async function requirePermission(permission: Permission) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Harus login" }, { status: 401 }) };
  }

  if (!hasPermission(session.user.role, permission)) {
    return { error: NextResponse.json({ error: "Kamu tidak punya izin untuk aksi ini" }, { status: 403 }) };
  }

  return { session };
}
```

## 3.4 Pemakaian di Endpoint

```typescript
// app/api/admin/products/[id]/route.ts (hapus permanen — hanya super_admin)
import { requirePermission } from "@/lib/require-permission";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requirePermission("product.delete"); // moderator akan ditolak di sini
  if ("error" in guard) return guard.error;

  // ...lanjut proses hapus
}
```

```typescript
// app/api/admin/products/[id]/suspend/route.ts (suspend — moderator & super_admin boleh)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requirePermission("product.suspend");
  if ("error" in guard) return guard.error;

  // ...lanjut proses suspend
}
```

## 3.5 Sembunyikan Menu di UI Sesuai Role

```tsx
// components/AdminSidebar.tsx
import { hasPermission } from "@/lib/permissions";

export default function AdminSidebar({ role }: { role: string }) {
  return (
    <nav className="space-y-1">
      <a href="/admin/dashboard">Dashboard</a>
      <a href="/admin/users">Kelola User</a>
      <a href="/admin/products">Kelola Produk</a>
      <a href="/admin/transactions">Kelola Transaksi</a>
      {hasPermission(role, "category.manage") && <a href="/admin/categories">Kelola Kategori</a>}
      {hasPermission(role, "settings.manage") && <a href="/admin/settings">Pengaturan Sistem</a>}
      {role === "super_admin" && <a href="/admin/audit-logs">Riwayat Aktivitas</a>}
    </nav>
  );
}
```

> **Catatan untuk laporan tugas akhir:** RBAC dengan pemisahan `moderator` vs `super_admin` ini konsep *least privilege* — prinsip keamanan yang juga dibahas di ISO/IEC 27002 (kontrol akses, klausul 5.15/5.18). Bisa jadi pembahasan menarik soal penerapan prinsip governance di level kode, bukan cuma kebijakan di atas kertas.

---

# BAGIAN 4 — Fitur Notifikasi (Lonceng 🔔)

Ini bisa saya bantu, cocok untuk kasus seperti: notifikasi pesanan baru (seller), status pesanan berubah (buyer), produk di-suspend, ban/unban, review baru masuk, dll.

## 4.1 Skema Database

```typescript
// db/schema.ts
import { pgTable, uuid, text, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { users } from "./schema";

export const notificationTypeEnum = pgEnum("notification_type", [
  "order_status",
  "product_suspended",
  "product_approved",
  "account_banned",
  "new_review",
  "new_message",
  "refund_update",
  "system_announcement",
]);

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  link: text("link"), // misal "/orders/xxx" biar bisa diklik langsung ke halaman terkait
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

## 4.2 Helper untuk Membuat Notifikasi

```typescript
// lib/notifications.ts
import { db } from "@/db";
import { notifications } from "@/db/schema";

export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
}: {
  userId: string;
  type: "order_status" | "product_suspended" | "product_approved" | "account_banned" | "new_review" | "new_message" | "refund_update" | "system_announcement";
  title: string;
  message: string;
  link?: string;
}) {
  await db.insert(notifications).values({ userId, type, title, message, link });
}

// untuk broadcast ke banyak user sekaligus (misal pengumuman sistem)
export async function broadcastNotification(userIds: string[], data: Omit<Parameters<typeof createNotification>[0], "userId">) {
  await db.insert(notifications).values(userIds.map((userId) => ({ userId, ...data })));
}
```

## 4.3 Trigger Notifikasi di Titik-Titik Penting

```typescript
// contoh: saat order status berubah (di lib/orders.ts yang sudah dibuat sebelumnya)
import { createNotification } from "@/lib/notifications";

export async function updateOrderStatus(orderId: string, status: string, buyerId: string) {
  // ...update status seperti biasa

  const statusMessages: Record<string, string> = {
    paid: "Pembayaran kamu telah dikonfirmasi.",
    shipped: "Pesananmu sedang dalam pengiriman.",
    completed: "Pesananmu telah selesai. Jangan lupa beri review!",
  };

  if (statusMessages[status]) {
    await createNotification({
      userId: buyerId,
      type: "order_status",
      title: "Update Pesanan",
      message: statusMessages[status],
      link: `/orders/${orderId}`,
    });
  }
}
```

```typescript
// contoh: saat admin suspend produk (di endpoint admin yang sudah ada)
import { createNotification } from "@/lib/notifications";

// setelah update produk jadi suspended:
await createNotification({
  userId: product.sellerId,
  type: "product_suspended",
  title: "Produk Ditangguhkan",
  message: `Produk "${product.name}" ditangguhkan. Alasan: ${reason}`,
  link: `/seller/products/${product.id}`,
});
```

## 4.4 API Routes

```typescript
// app/api/notifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ items: [], unreadCount: 0 });

  const items = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, session.user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(30);

  const unreadCount = items.filter((n) => !n.isRead).length;

  return NextResponse.json({ items, unreadCount });
}
```

```typescript
// app/api/notifications/[id]/read/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, params.id));
  return NextResponse.json({ success: true });
}
```

```typescript
// app/api/notifications/read-all/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Harus login" }, { status: 401 });

  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, session.user.id));
  return NextResponse.json({ success: true });
}
```

## 4.5 Komponen Lonceng Notifikasi (Client, polling)

```tsx
// components/NotificationBell.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

const TYPE_ICONS: Record<string, string> = {
  order_status: "📦",
  product_suspended: "⏸️",
  product_approved: "✅",
  account_banned: "🚫",
  new_review: "⭐",
  new_message: "💬",
  refund_update: "💸",
  system_announcement: "📢",
};

export default function NotificationBell() {
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  async function loadNotifications() {
    const res = await fetch("/api/notifications");
    const data = await res.json();
    setItems(data.items);
    setUnreadCount(data.unreadCount);
  }

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000); // polling tiap 15 detik
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "PATCH" });
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }

  async function handleClickItem(notif: Notification) {
    if (!notif.isRead) {
      await fetch(`/api/notifications/${notif.id}/read`, { method: "PATCH" });
      setItems((prev) => prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    setOpen(false);
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Baru saja";
    if (minutes < 60) return `${minutes} menit lalu`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} jam lalu`;
    return `${Math.floor(hours / 24)} hari lalu`;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-full hover:bg-gray-100">
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center p-3 border-b">
            <p className="font-medium text-sm">Notifikasi</p>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">
                Tandai semua dibaca
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Belum ada notifikasi</p>
          ) : (
            items.map((notif) => (
              <Link
                key={notif.id}
                href={notif.link ?? "#"}
                onClick={() => handleClickItem(notif)}
                className={`block p-3 border-b hover:bg-gray-50 ${!notif.isRead ? "bg-blue-50" : ""}`}
              >
                <div className="flex gap-2">
                  <span>{TYPE_ICONS[notif.type] ?? "🔔"}</span>
                  <div className="flex-1">
                  
                    <p className="text-sm font-medium">{notif.title}</p>
                    <p className="text-xs text-gray-500 line-clamp-2">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
                  </div>
                  {!notif.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1" />}
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
```

## 4.6 Pasang di Navbar

```tsx
// components/Navbar.tsx
import NotificationBell from "./NotificationBell";

// letakkan di dalam navbar, biasanya dekat avatar/profile menu:
<div className="flex items-center gap-3">
  <NotificationBell />
  {/* ...profile menu, cart icon, dll */}
</div>
```

## 4.7 Pengumuman Sistem dari Admin (Broadcast)

```tsx
// app/admin/announcements/page.tsx — form kirim pengumuman ke semua user
"use client";

import { useState } from "react";

export default function AnnouncementPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState<"all" | "sellers" | "customers">("all");

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, message, audience }),
    });
    setTitle("");
    setMessage("");
    alert("Pengumuman terkirim!");
  }

  return (
    <form onSubmit={handleSend} className="space-y-3 max-w-md">
      <h1 className="text-xl font-semibold mb-4">Kirim Pengumuman</h1>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Judul pengumuman"
        className="w-full border rounded-md p-2 text-sm"
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Isi pengumuman"
        className="w-full border rounded-md p-2 text-sm"
        rows={4}
      />
      <select value={audience} onChange={(e) => setAudience(e.target.value as any)} className="border rounded-md p-2 text-sm">
        <option value="all">Semua User</option>
        <option value="sellers">Seller Saja</option>
        <option value="customers">Customer Saja</option>
      </select>
      <button className="rounded-md bg-black text-white px-4 py-2 text-sm">Kirim</button>
    </form>
  );
}
```

```typescript
// app/api/admin/announcements/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { broadcastNotification } from "@/lib/notifications";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const { title, message, audience } = await req.json();

  const query = db.select({ id: users.id }).from(users);
  const targetUsers =
    audience === "all"
      ? await query
      : await query.where(eq(users.role, audience === "sellers" ? "seller" : "customer"));

  await broadcastNotification(
    targetUsers.map((u) => u.id),
    { type: "system_announcement", title, message }
  );

  return NextResponse.json({ success: true, sentTo: targetUsers.length });
}
```

> **Catatan performa:** untuk versi awal, polling tiap 15 detik itu cukup dan sederhana untuk diimplementasikan/dijelaskan di laporan. Kalau MallPedia berkembang jadi produk nyata dengan banyak user, ini yang pertama harus diganti ke realtime (Pusher/Supabase Realtime/WebSocket) supaya tidak membebani server dengan polling dari ribuan user sekaligus.

---

# Ringkasan Urutan Kerja

**Soft-Delete:**
1. Tambah kolom `deletedAt` di tabel yang perlu.
2. Update semua query listing pakai filter `notDeleted`.
3. Ganti `DELETE` jadi update `deletedAt`, tambah endpoint restore.
4. Pasang `ConfirmDeleteModal` di semua tombol hapus.

**Ban/Suspend dengan Alasan:**
1. Tambah kolom `banReason`, `bannedUntil`, `suspendReason` dll.
2. Update endpoint ban/suspend untuk terima `reason` + `durationDays`.
3. Tambah `checkAndAutoUnban()` di titik validasi login.
4. Tampilkan alasan di dashboard user/seller yang terkena.

**RBAC:**
1. Ubah enum role jadi `customer | seller | moderator | super_admin`.
2. Buat `lib/permissions.ts` + `requirePermission()`.
3. Ganti semua `requireAdmin()` di endpoint sensitif jadi `requirePermission()` dengan permission spesifik.
4. Sembunyikan menu sidebar sesuai role.

**Notifikasi:**
1. Migrasi tabel `notifications`.
2. Buat `lib/notifications.ts` (`createNotification`, `broadcastNotification`).
3. Panggil `createNotification()` di titik-titik penting (update status order, suspend produk, ban user, dll).
4. Pasang `NotificationBell` di navbar.
5. (Opsional) buat halaman broadcast pengumuman untuk admin.

Sesuaikan nama tabel/kolom dengan skema asli project kamu sebelum di-paste.