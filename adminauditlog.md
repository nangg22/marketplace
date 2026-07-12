# Implementasi: Audit Log Aksi Admin & Manajemen Kategori Produk — MallPedia

Stack: Next.js 16 (App Router), TypeScript, Drizzle ORM, Neon PostgreSQL, NextAuth v4.

---

# BAGIAN 1 — Audit Log Aksi Admin

Kalau kamu sudah bikin tabel `auditLogs` dari panduan sebelumnya (security-reliability-mallpedia.md), bagian ini tinggal **pakai ulang tabel yang sama** — bedanya sekarang fokus mencatat aksi-aksi di panel admin (ban user, suspend produk, refund, ubah role, dll), bukan cuma aksi seller.

## 1.1 Skema (skip kalau sudah ada dari panduan sebelumnya)

```typescript
// db/schema.ts
import { pgTable, uuid, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { users } from "./schema";

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorId: uuid("actor_id").references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  metadata: jsonb("metadata"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

## 1.2 Daftar Aksi Admin yang Wajib Dicatat

```typescript
// lib/audit-actions.ts
export const AUDIT_ACTIONS = {
  USER_BANNED: "admin.user.banned",
  USER_UNBANNED: "admin.user.unbanned",
  USER_ROLE_CHANGED: "admin.user.role_changed",
  USER_DELETED: "admin.user.deleted",
  PRODUCT_SUSPENDED: "admin.product.suspended",
  PRODUCT_UNSUSPENDED: "admin.product.unsuspended",
  PRODUCT_DELETED: "admin.product.deleted",
  TRANSACTION_STATUS_UPDATED: "admin.transaction.status_updated",
  TRANSACTION_REFUNDED: "admin.transaction.refunded",
  CATEGORY_CREATED: "admin.category.created",
  CATEGORY_UPDATED: "admin.category.updated",
  CATEGORY_DELETED: "admin.category.deleted",
} as const;
```

## 1.3 Helper Pencatatan (reusable, dipanggil dari tiap endpoint admin)

```typescript
// lib/audit-log.ts
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { NextRequest } from "next/server";

export async function logAdminAction({
  req,
  actorId,
  action,
  entityType,
  entityId,
  before,
  after,
}: {
  req: NextRequest;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}) {
  await db.insert(auditLogs).values({
    actorId,
    action,
    entityType,
    entityId,
    metadata: { before, after },
    ipAddress: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? undefined,
  });
}
```

## 1.4 Middleware Guard Khusus Admin

```typescript
// lib/require-admin.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "admin") {
    return { error: NextResponse.json({ error: "Akses ditolak" }, { status: 403 }) };
  }

  return { session };
}
```

## 1.5 Contoh Pemakaian — Ban User

```typescript
// app/api/admin/users/[id]/ban/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { logAdminAction } from "@/lib/audit-log";
import { AUDIT_ACTIONS } from "@/lib/audit-actions";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const { reason, bannedUntil } = await req.json();

  const before = await db.select().from(users).where(eq(users.id, params.id)).then((r) => r[0]);

  const [updated] = await db
    .update(users)
    .set({ isBanned: true, banReason: reason, bannedUntil: bannedUntil ?? null })
    .where(eq(users.id, params.id))
    .returning();

  await logAdminAction({
    req,
    actorId: guard.session.user.id,
    action: AUDIT_ACTIONS.USER_BANNED,
    entityType: "user",
    entityId: params.id,
    before: { isBanned: before.isBanned },
    after: { isBanned: true, reason, bannedUntil },
  });

  return NextResponse.json(updated);
}
```

Pola yang sama tinggal diulang untuk suspend produk, ubah role, refund transaksi, dll — selalu: **ambil data `before` → lakukan perubahan → catat `logAdminAction`**.

## 1.6 Halaman Riwayat Aktivitas Admin

```typescript
// app/api/admin/audit-logs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { db } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { eq, desc, and, gte, lte, like } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const { searchParams } = new URL(req.url);
  const actionFilter = searchParams.get("action");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const conditions = [];
  if (actionFilter) conditions.push(like(auditLogs.action, `%${actionFilter}%`));
  if (from) conditions.push(gte(auditLogs.createdAt, new Date(from)));
  if (to) conditions.push(lte(auditLogs.createdAt, new Date(to)));

  const logs = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      metadata: auditLogs.metadata,
      ipAddress: auditLogs.ipAddress,
      createdAt: auditLogs.createdAt,
      actorName: users.name,
      actorEmail: users.email,
    })
    .from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.actorId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(auditLogs.createdAt))
    .limit(100);

  return NextResponse.json(logs);
}
```

```tsx
// app/admin/audit-logs/page.tsx
"use client";

import { useEffect, useState } from "react";

interface LogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: { before?: any; after?: any };
  ipAddress: string | null;
  createdAt: string;
  actorName: string | null;
  actorEmail: string | null;
}

const ACTION_LABELS: Record<string, string> = {
  "admin.user.banned": "🚫 User di-ban",
  "admin.user.role_changed": "🔄 Role diubah",
  "admin.product.suspended": "⏸️ Produk di-suspend",
  "admin.transaction.refunded": "💸 Transaksi di-refund",
  "admin.category.created": "🏷️ Kategori dibuat",
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [actionFilter, setActionFilter] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (actionFilter) params.set("action", actionFilter);
    fetch(`/api/admin/audit-logs?${params}`)
      .then((res) => res.json())
      .then(setLogs);
  }, [actionFilter]);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Riwayat Aktivitas Admin</h1>

      <select
        value={actionFilter}
        onChange={(e) => setActionFilter(e.target.value)}
        className="mb-4 rounded-md border px-3 py-1.5 text-sm"
      >
        <option value="">Semua aksi</option>
        <option value="user">Aksi terkait User</option>
        <option value="product">Aksi terkait Produk</option>
        <option value="transaction">Aksi terkait Transaksi</option>
      </select>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2">Waktu</th>
            <th>Admin</th>
            <th>Aksi</th>
            <th>Target</th>
            <th>IP</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-b">
              <td className="py-2">{new Date(log.createdAt).toLocaleString("id-ID")}</td>
              <td>{log.actorName ?? log.actorEmail ?? "—"}</td>
              <td>{ACTION_LABELS[log.action] ?? log.action}</td>
              <td className="text-gray-400 text-xs">{log.entityType}/{log.entityId.slice(0, 8)}</td>
              <td className="text-gray-400 text-xs">{log.ipAddress ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

> **Relevansi ke laporan IT Governance:** halaman ini langsung jadi bukti implementasi **COBIT 2019 DSS01.03** (monitoring infrastruktur/aktivitas sistem) dan **ISO/IEC 27002:2022 Klausul 8.15 (Logging)** — bisa kamu screenshot dan bahas di bab implementasi/pembahasan sebagai studi kasus nyata, bukan cuma konsep di kertas.

---

# BAGIAN 2 — Manajemen Kategori Produk

## 2.1 Skema Database

```typescript
// db/schema.ts
import { pgTable, uuid, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  iconUrl: text("icon_url"),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

Lalu ubah kolom `category` di tabel `products` (kalau sebelumnya berupa text bebas) jadi foreign key:

```typescript
// db/schema.ts — update tabel products
import { categories } from "./schema";

// tambahkan kolom baru:
categoryId: uuid("category_id").references(() => categories.id),
```

> Migrasi data lama: kalau tabel `products.category` sekarang isinya text bebas (misal "Fashion", "Elektronik"), buat script migrasi kecil yang: (1) insert nilai unik dari kolom lama ke tabel `categories`, (2) update `products.categoryId` mengacu ke id yang baru dibuat, (3) baru hapus kolom lama setelah dicek datanya aman.

## 2.2 API Routes CRUD

```typescript
// app/api/admin/categories/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { logAdminAction } from "@/lib/audit-log";
import { AUDIT_ACTIONS } from "@/lib/audit-actions";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { asc } from "drizzle-orm";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(2).max(50),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, "Slug hanya boleh huruf kecil, angka, dan strip"),
  iconUrl: z.string().url().optional(),
  sortOrder: z.number().int().default(0),
});

export async function GET() {
  const list = await db.select().from(categories).orderBy(asc(categories.sortOrder));
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const body = await req.json();
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const [created] = await db.insert(categories).values(parsed.data).returning();

  await logAdminAction({
    req,
    actorId: guard.session.user.id,
    action: AUDIT_ACTIONS.CATEGORY_CREATED,
    entityType: "category",
    entityId: created.id,
    after: created,
  });

  return NextResponse.json(created, { status: 201 });
}
```

```typescript
// app/api/admin/categories/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { logAdminAction } from "@/lib/audit-log";
import { AUDIT_ACTIONS } from "@/lib/audit-actions";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { eq, count } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const before = await db.select().from(categories).where(eq(categories.id, params.id)).then((r) => r[0]);
  const body = await req.json();

  const [updated] = await db
    .update(categories)
    .set(body)
    .where(eq(categories.id, params.id))
    .returning();

  await logAdminAction({
    req,
    actorId: guard.session.user.id,
    action: AUDIT_ACTIONS.CATEGORY_UPDATED,
    entityType: "category",
    entityId: params.id,
    before,
    after: updated,
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const [{ productCount }] = await db
    .select({ productCount: count() })
    .from(products)
    .where(eq(products.categoryId, params.id));

  if (productCount > 0) {
    return NextResponse.json(
      { error: `Kategori masih dipakai oleh ${productCount} produk. Pindahkan produk dulu sebelum menghapus.` },
      { status: 400 }
    );
  }

  await db.delete(categories).where(eq(categories.id, params.id));

  await logAdminAction({
    req,
    actorId: guard.session.user.id,
    action: AUDIT_ACTIONS.CATEGORY_DELETED,
    entityType: "category",
    entityId: params.id,
  });

  return NextResponse.json({ success: true });
}
```

## 2.3 Halaman Admin — Kelola Kategori

```tsx
// app/admin/categories/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  function loadCategories() {
    fetch("/api/admin/categories").then((res) => res.json()).then(setCategories);
  }

  useEffect(loadCategories, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const slug = name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug, sortOrder: categories.length }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(JSON.stringify(data.error));
      return;
    }

    setName("");
    loadCategories();
  }

  async function handleDelete(id: string) {
    if (!confirm("Yakin hapus kategori ini?")) return;

    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error);
      return;
    }
    loadCategories();
  }

  async function toggleActive(id: string, isActive: boolean) {
    await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    loadCategories();
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Kelola Kategori</h1>

      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama kategori baru..."
          className="rounded-md border px-3 py-2 text-sm flex-1"
        />
        <button className="rounded-md bg-black text-white px-4 py-2 text-sm flex items-center gap-1">
          <Plus size={16} /> Tambah
        </button>
      </form>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2">Nama</th>
            <th>Slug</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.id} className="border-b">
              <td className="py-2">{c.name}</td>
              <td className="text-gray-400">{c.slug}</td>
              <td>
                <button
                  onClick={() => toggleActive(c.id, c.isActive)}
                  className={`text-xs px-2 py-1 rounded-full ${
                    c.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {c.isActive ? "Aktif" : "Nonaktif"}
                </button>
              </td>
              <td>
                <button onClick={() => handleDelete(c.id)} className="text-red-500">
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## 2.4 Pakai di Form Produk (Seller) & Filter (Buyer)

```tsx
// contoh dropdown kategori dinamis, ganti dari hardcoded array
"use client";
import { useEffect, useState } from "react";

function CategorySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.filter((c: any) => c.isActive)));
  }, []);

  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-md border px-3 py-2 text-sm">
      <option value="">Pilih kategori</option>
      {categories.map((c) => (
        <option key={c.id} value={c.id}>{c.name}</option>
      ))}
    </select>
  );
}
```

---

# Ringkasan Urutan Kerja

**Audit Log:**
1. Migrasi `audit_logs` (skip kalau sudah ada).
2. Buat `lib/audit-actions.ts`, `lib/audit-log.ts`, `lib/require-admin.ts`.
3. Tambahkan `logAdminAction()` di setiap endpoint admin (ban, suspend, refund, ubah role, hapus).
4. Buat halaman `/admin/audit-logs`.

**Kategori Produk:**
1. Migrasi tabel `categories`, tambah `categoryId` di `products`.
2. Migrasikan data kategori lama (text bebas) ke tabel baru.
3. Buat API CRUD `/api/admin/categories`.
4. Buat halaman `/admin/categories`.
5. Ganti semua dropdown kategori hardcoded (form produk, filter listing) jadi fetch dari API ini.

Sesuaikan nama tabel/kolom dengan skema asli project kamu sebelum di-paste.