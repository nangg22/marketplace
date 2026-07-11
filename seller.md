# Implementasi: Dashboard Analitik Seller & Manajemen Stok — MallPedia

Stack: Next.js 16 (App Router), TypeScript, Drizzle ORM, Neon PostgreSQL, Recharts.

---

# BAGIAN 1 — Dashboard Analitik Seller

## 1.1 Query Agregasi (tidak perlu tabel baru, cukup query dari data order yang sudah ada)

```typescript
// lib/seller-analytics.ts
import { db } from "@/db";
import { orders, orderItems, products } from "@/db/schema";
import { and, eq, gte, sql } from "drizzle-orm";

export async function getSellerSummary(sellerId: string, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  // total pendapatan & jumlah order
  const [summary] = await db
    .select({
      totalRevenue: sql<number>`coalesce(sum(${orderItems.price} * ${orderItems.quantity}), 0)`,
      totalOrders: sql<number>`count(distinct ${orders.id})`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .innerJoin(products, eq(products.id, orderItems.productId))
    .where(
      and(
        eq(products.sellerId, sellerId),
        eq(orders.status, "completed"),
        gte(orders.createdAt, since)
      )
    );

  // produk terlaris
  const topProducts = await db
    .select({
      productId: products.id,
      name: products.name,
      totalSold: sql<number>`sum(${orderItems.quantity})`,
    })
    .from(orderItems)
    .innerJoin(products, eq(products.id, orderItems.productId))
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(and(eq(products.sellerId, sellerId), eq(orders.status, "completed")))
    .groupBy(products.id, products.name)
    .orderBy(sql`sum(${orderItems.quantity}) desc`)
    .limit(5);

  // pendapatan per hari (untuk grafik)
  const dailyRevenue = await db
    .select({
      date: sql<string>`date(${orders.createdAt})`,
      revenue: sql<number>`sum(${orderItems.price} * ${orderItems.quantity})`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .innerJoin(products, eq(products.id, orderItems.productId))
    .where(
      and(eq(products.sellerId, sellerId), eq(orders.status, "completed"), gte(orders.createdAt, since))
    )
    .groupBy(sql`date(${orders.createdAt})`)
    .orderBy(sql`date(${orders.createdAt})`);

  return { summary, topProducts, dailyRevenue };
}
```

## 1.2 API Route

```typescript
// app/api/seller/analytics/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSellerSummary } from "@/lib/seller-analytics";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Harus login" }, { status: 401 });

  const data = await getSellerSummary(session.user.id);
  return NextResponse.json(data);
}
```

## 1.3 Komponen Dashboard (pakai Recharts)

```tsx
// components/SellerDashboard.tsx
"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface DashboardData {
  summary: { totalRevenue: number; totalOrders: number };
  topProducts: { productId: string; name: string; totalSold: number }[];
  dailyRevenue: { date: string; revenue: number }[];
}

export default function SellerDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/seller/analytics")
      .then((res) => res.json())
      .then(setData);
  }, []);

  if (!data) return <p className="text-sm text-gray-500">Memuat data...</p>;

  const formatRupiah = (n: number) => `Rp${n.toLocaleString("id-ID")}`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-xs text-gray-500">Pendapatan (30 hari)</p>
          <p className="text-2xl font-semibold">{formatRupiah(data.summary.totalRevenue)}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-gray-500">Total Pesanan</p>
          <p className="text-2xl font-semibold">{data.summary.totalOrders}</p>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <p className="text-sm font-medium mb-3">Grafik Pendapatan Harian</p>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data.dailyRevenue}>
            <XAxis dataKey="date" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip formatter={(v: number) => formatRupiah(v)} />
            <Line type="monotone" dataKey="revenue" stroke="#000" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-lg border p-4">
        <p className="text-sm font-medium mb-3">Produk Terlaris</p>
        <ul className="space-y-2">
          {data.topProducts.map((p, i) => (
            <li key={p.productId} className="flex justify-between text-sm">
              <span>{i + 1}. {p.name}</span>
              <span className="text-gray-500">{p.totalSold} terjual</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

---

# BAGIAN 2 — Manajemen Stok Otomatis

## 2.1 Kurangi Stok Saat Order Dibuat (dalam transaction, biar aman dari race condition)

```typescript
// lib/create-order.ts
import { db } from "@/db";
import { products, orders, orderItems } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

interface CartItem {
  productId: string;
  quantity: number;
  price: number;
}

export async function createOrderWithStockCheck(userId: string, items: CartItem[]) {
  return await db.transaction(async (tx) => {
    // 1. Cek & kurangi stok tiap produk, gagal kalau stok tidak cukup
    for (const item of items) {
      const result = await tx
        .update(products)
        .set({ stock: sql`${products.stock} - ${item.quantity}` })
        .where(
          sql`${products.id} = ${item.productId} AND ${products.stock} >= ${item.quantity}`
        )
        .returning({ id: products.id });

      if (result.length === 0) {
        throw new Error(`Stok tidak mencukupi untuk produk ${item.productId}`);
      }
    }

    // 2. Buat order
    const [order] = await tx
      .insert(orders)
      .values({ userId, status: "pending_payment" })
      .returning();

    // 3. Buat order items
    await tx.insert(orderItems).values(
      items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      }))
    );

    return order;
  });
}
```

> Query `WHERE stock >= quantity` di dalam `UPDATE` itu kuncinya — kalau dua orang checkout stok terakhir bersamaan, hanya salah satu yang berhasil (atomic di level database), bukan dicek di aplikasi yang rawan race condition.

## 2.2 Kembalikan Stok Kalau Order Dibatalkan

```typescript
// lib/cancel-order.ts
import { db } from "@/db";
import { products, orderItems } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function restoreStockOnCancel(orderId: string) {
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

  for (const item of items) {
    await db
      .update(products)
      .set({ stock: sql`${products.stock} + ${item.quantity}` })
      .where(eq(products.id, item.productId));
  }
}
```

## 2.3 Notifikasi Stok Menipis (badge di dashboard seller)

```typescript
// app/api/seller/low-stock/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { products } from "@/db/schema";
import { and, eq, lte } from "drizzle-orm";

const LOW_STOCK_THRESHOLD = 5;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ items: [] });

  const lowStock = await db
    .select()
    .from(products)
    .where(and(eq(products.sellerId, session.user.id), lte(products.stock, LOW_STOCK_THRESHOLD)));

  return NextResponse.json({ items: lowStock });
}
```

```tsx
// Tampilkan sebagai badge di sidebar dashboard seller
// contoh sederhana:
{lowStockItems.length > 0 && (
  <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
    ⚠️ {lowStockItems.length} produk stoknya menipis (≤ 5). Segera restock.
  </div>
)}
```

---

# Ringkasan Urutan Kerja
1. Tambah `lib/seller-analytics.ts` + endpoint `/api/seller/analytics`.
2. Pasang `SellerDashboard` di halaman dashboard seller.
3. Ganti logic pembuatan order dengan `createOrderWithStockCheck` (transaction-based).
4. Tambah `restoreStockOnCancel` di alur pembatalan order.
5. Tambah endpoint & badge stok menipis.

Sesuaikan nama kolom (`sellerId`, `stock`, dll) dengan skema asli project kamu sebelum di-paste.