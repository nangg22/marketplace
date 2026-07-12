# Implementasi: Order Tracking & Retur/Refund — MallPedia

Stack: Next.js 16 (App Router), TypeScript, Drizzle ORM, Neon PostgreSQL, Midtrans.

---

# BAGIAN 1 — Order Tracking

## 1.1 Skema Status Order

Kalau kolom `status` di tabel `orders` masih bertipe text bebas, ubah jadi enum supaya konsisten:

```typescript
// db/schema.ts
import { pgTable, uuid, timestamp, pgEnum, text } from "drizzle-orm/pg-core";

export const orderStatusEnum = pgEnum("order_status", [
  "pending_payment",
  "paid",
  "processing",
  "shipped",
  "completed",
  "cancelled",
  "refunded",
]);

// Tambahkan histori perubahan status (untuk timeline)
export const orderStatusHistory = pgTable("order_status_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  status: orderStatusEnum("status").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

> Tabel `orderStatusHistory` ini kunci dari fitur tracking — tanpa ini kamu cuma bisa nampilin status *sekarang*, bukan *perjalanan* status (kapan dibayar, kapan dikirim, dst).

## 1.2 Helper untuk Update Status + Catat Histori

```typescript
// lib/orders.ts
import { db } from "@/db";
import { orders, orderStatusHistory } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function updateOrderStatus(orderId: string, status: string, note?: string) {
  await db.update(orders).set({ status, updatedAt: new Date() }).where(eq(orders.id, orderId));
  await db.insert(orderStatusHistory).values({ orderId, status: status as any, note });
}
```

Panggil helper ini di:
- Webhook Midtrans (saat pembayaran sukses → `paid`)
- Endpoint seller saat konfirmasi kirim → `shipped`
- Endpoint saat buyer konfirmasi terima → `completed`

## 1.3 API Route — Ambil Timeline Order

```typescript
// app/api/orders/[id]/timeline/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orderStatusHistory } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const history = await db
    .select()
    .from(orderStatusHistory)
    .where(eq(orderStatusHistory.orderId, params.id))
    .orderBy(asc(orderStatusHistory.createdAt));

  return NextResponse.json(history);
}
```

## 1.4 Komponen Timeline Visual

```tsx
// components/OrderTimeline.tsx
import { CheckCircle2, Circle } from "lucide-react";

const STEPS = [
  { key: "paid", label: "Pembayaran Dikonfirmasi" },
  { key: "processing", label: "Pesanan Diproses" },
  { key: "shipped", label: "Dikirim" },
  { key: "completed", label: "Selesai" },
];

interface HistoryItem {
  status: string;
  createdAt: string;
}

export default function OrderTimeline({ history }: { history: HistoryItem[] }) {
  const reachedStatuses = new Set(history.map((h) => h.status));

  return (
    <div className="space-y-4">
      {STEPS.map((step, i) => {
        const reached = reachedStatuses.has(step.key);
        const record = history.find((h) => h.status === step.key);

        return (
          <div key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              {reached ? (
                <CheckCircle2 size={22} className="text-green-600" />
              ) : (
                <Circle size={22} className="text-gray-300" />
              )}
              {i < STEPS.length - 1 && (
                <div className={`w-px h-8 ${reached ? "bg-green-600" : "bg-gray-200"}`} />
              )}
            </div>
            <div>
              <p className={`text-sm font-medium ${reached ? "text-black" : "text-gray-400"}`}>
                {step.label}
              </p>
              {record && (
                <p className="text-xs text-gray-400">
                  {new Date(record.createdAt).toLocaleString("id-ID")}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

---

# BAGIAN 2 — Sistem Retur/Refund

## 2.1 Skema Database

```typescript
// db/schema.ts
import { pgTable, uuid, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { orders, users } from "./schema";

export const refundStatusEnum = pgEnum("refund_status", [
  "requested",
  "under_review",
  "approved",
  "rejected",
  "refunded",
]);

export const refundRequests = pgTable("refund_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  buyerId: uuid("buyer_id").notNull().references(() => users.id),
  reason: text("reason").notNull(),
  evidenceUrl: text("evidence_url"), // foto bukti, via UploadThing
  status: refundStatusEnum("status").default("requested").notNull(),
  sellerResponse: text("seller_response"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

## 2.2 API Route — Ajukan Retur

```typescript
// app/api/refunds/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { refundRequests, orders } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Harus login" }, { status: 401 });

  const { orderId, reason, evidenceUrl } = await req.json();

  // pastikan order ini benar milik buyer & sudah completed
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, session.user.id)))
    .limit(1);

  if (!order) return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
  if (order.status !== "completed") {
    return NextResponse.json({ error: "Order belum bisa diretur" }, { status: 400 });
  }

  const [refund] = await db
    .insert(refundRequests)
    .values({ orderId, buyerId: session.user.id, reason, evidenceUrl })
    .returning();

  return NextResponse.json(refund, { status: 201 });
}
```

## 2.3 API Route — Seller Merespons

```typescript
// app/api/refunds/[id]/respond/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { refundRequests } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  // TODO: tambahkan auth check → pastikan yang PATCH adalah seller pemilik produk terkait

  const { status, sellerResponse } = await req.json(); // status: "approved" | "rejected"

  const [updated] = await db
    .update(refundRequests)
    .set({ status, sellerResponse, updatedAt: new Date() })
    .where(eq(refundRequests.id, params.id))
    .returning();

  // Kalau "approved", lanjut proses refund via Midtrans (transaksi refund API)
  // dan panggil updateOrderStatus(order.id, "refunded")

  return NextResponse.json(updated);
}
```

## 2.4 Form Pengajuan Retur (Buyer)

```tsx
// components/RefundRequestForm.tsx
"use client";

import { useState } from "react";

export default function RefundRequestForm({ orderId }: { orderId: string }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/refunds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, reason }),
    });
    setLoading(false);
    setDone(true);
  }

  if (done) {
    return <p className="text-sm text-green-600">Pengajuan retur berhasil dikirim, tunggu respons penjual.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        required
        minLength={20}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Jelaskan alasan retur (min. 20 karakter)..."
        className="w-full rounded-md border p-2 text-sm"
        rows={4}
      />
      <button disabled={loading} className="rounded-md bg-black text-white px-4 py-2 text-sm">
        {loading ? "Mengirim..." : "Ajukan Retur"}
      </button>
    </form>
  );
}
```

---

# Ringkasan Urutan Kerja
1. Migrasi `orderStatusHistory` + ubah `orders.status` ke enum.
2. Panggil `updateOrderStatus()` di setiap titik perubahan status (webhook Midtrans, aksi seller, konfirmasi buyer).
3. Pasang `OrderTimeline` di halaman detail pesanan buyer.
4. Migrasi `refundRequests`.
5. Tambah tombol "Ajukan Retur" di order yang sudah `completed` + `RefundRequestForm`.
6. Tambah halaman untuk seller merespons pengajuan retur.

Sesuaikan nama kolom/tabel dengan skema asli project kamu sebelum di-paste.