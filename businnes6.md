# Implementasi: Halaman Kebijakan & Onboarding Seller — MallPedia

Stack: Next.js 16 (App Router), TypeScript, Tailwind CSS.

---

# BAGIAN 1 — Halaman Kebijakan & Legal

Ini bukan fitur kompleks secara teknis, tapi penting untuk kredibilitas (dan sering ditanyakan dosen penguji soal aspek legal produk digital). Cukup halaman statis dulu.

## 1.1 Struktur Folder

```
app/
  (legal)/
    about/page.tsx
    privacy-policy/page.tsx
    terms-of-service/page.tsx
    return-policy/page.tsx
    faq/page.tsx
```

## 1.2 Contoh Halaman Tentang Kami

```tsx
// app/(legal)/about/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tentang Kami | MallPedia",
  description: "Kenali lebih dekat MallPedia, marketplace yang menghubungkan penjual dan pembeli di seluruh Indonesia.",
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-semibold mb-4">Tentang MallPedia</h1>
      <p className="text-gray-600 leading-relaxed mb-4">
        MallPedia adalah platform marketplace yang mempertemukan penjual dan pembeli
        secara langsung, dengan fokus pada kemudahan transaksi dan keamanan berbelanja online.
      </p>
      {/* Sesuaikan konten dengan visi/misi project kamu */}
    </div>
  );
}
```

## 1.3 Contoh Halaman Kebijakan Privasi (struktur, isi sesuaikan sendiri)

```tsx
// app/(legal)/privacy-policy/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kebijakan Privasi | MallPedia",
};

const SECTIONS = [
  {
    title: "1. Data yang Kami Kumpulkan",
    content: "Kami mengumpulkan data seperti nama, email, nomor telepon, dan alamat pengiriman saat kamu mendaftar atau melakukan transaksi.",
  },
  {
    title: "2. Penggunaan Data",
    content: "Data digunakan untuk memproses transaksi, mengirim notifikasi pesanan, dan meningkatkan pengalaman berbelanja.",
  },
  {
    title: "3. Keamanan Data",
    content: "Kami menerapkan enkripsi dan praktik keamanan standar industri untuk melindungi data pengguna.",
  },
  {
    title: "4. Hak Pengguna",
    content: "Kamu berhak meminta akses, koreksi, atau penghapusan data pribadi dengan menghubungi tim kami.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-semibold mb-6">Kebijakan Privasi</h1>
      <p className="text-sm text-gray-400 mb-6">Terakhir diperbarui: 12 Juli 2026</p>
      <div className="space-y-6">
        {SECTIONS.map((s) => (
          <div key={s.title}>
            <h2 className="font-medium mb-1">{s.title}</h2>
            <p className="text-gray-600 text-sm leading-relaxed">{s.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

> Pola yang sama (array `SECTIONS`) bisa dipakai untuk `terms-of-service` dan `return-policy` — tinggal ganti isi array-nya. Untuk kebijakan retur, hubungkan poin-poinnya dengan fitur `refundRequests` yang sudah dibuat sebelumnya biar konsisten (syarat retur, batas waktu pengajuan, dll).

## 1.4 FAQ dengan Accordion

```tsx
// components/FAQAccordion.tsx
"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQ_ITEMS = [
  { q: "Bagaimana cara berbelanja di MallPedia?", a: "Pilih produk, tambahkan ke keranjang, lalu checkout dan pilih metode pembayaran." },
  { q: "Apakah pembayaran aman?", a: "Ya, semua pembayaran diproses melalui Midtrans yang sudah tersertifikasi PCI DSS." },
  { q: "Bagaimana jika barang tidak sesuai?", a: "Kamu bisa mengajukan retur melalui halaman detail pesanan dalam 7 hari setelah barang diterima." },
  { q: "Bagaimana cara jadi penjual?", a: "Daftar sebagai seller melalui halaman registrasi, lalu ikuti panduan onboarding." },
];

export default function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="max-w-2xl mx-auto divide-y">
      {FAQ_ITEMS.map((item, i) => (
        <div key={i} className="py-4">
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="flex w-full justify-between items-center text-left font-medium"
          >
            {item.q}
            <ChevronDown
              size={18}
              className={`transition-transform ${openIndex === i ? "rotate-180" : ""}`}
            />
          </button>
          {openIndex === i && <p className="text-sm text-gray-600 mt-2">{item.a}</p>}
        </div>
      ))}
    </div>
  );
}
```

## 1.5 Tautkan di Footer

Pastikan link ke semua halaman ini ada di footer global (`components/Footer.tsx`), bukan cuma bisa diakses lewat URL langsung — ini yang sering jadi temuan penilaian karena footer MallPedia saat ini masih minim.

---

# BAGIAN 2 — Onboarding Seller

Tujuannya: seller baru tidak langsung dilempar ke dashboard kosong tanpa arahan.

## 2.1 Skema — Tandai Progress Onboarding

```typescript
// db/schema.ts
import { pgTable, uuid, boolean, timestamp } from "drizzle-orm/pg-core";
import { users } from "./schema";

export const sellerOnboarding = pgTable("seller_onboarding", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  hasStoreProfile: boolean("has_store_profile").default(false).notNull(),
  hasFirstProduct: boolean("has_first_product").default(false).notNull(),
  hasPaymentSetup: boolean("has_payment_setup").default(false).notNull(),
  completedAt: timestamp("completed_at"),
});
```

## 2.2 Komponen Checklist Onboarding

```tsx
// components/SellerOnboardingChecklist.tsx
import { CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";

interface OnboardingStatus {
  hasStoreProfile: boolean;
  hasFirstProduct: boolean;
  hasPaymentSetup: boolean;
}

export default function SellerOnboardingChecklist({ status }: { status: OnboardingStatus }) {
  const steps = [
    { key: "hasStoreProfile", label: "Lengkapi profil toko", href: "/seller/settings" },
    { key: "hasFirstProduct", label: "Upload produk pertama", href: "/seller/products/new" },
    { key: "hasPaymentSetup", label: "Hubungkan rekening pembayaran", href: "/seller/payment" },
  ] as const;

  const doneCount = steps.filter((s) => status[s.key]).length;

  if (doneCount === steps.length) return null; // sudah selesai, tidak perlu ditampilkan lagi

  return (
    <div className="rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex justify-between items-center mb-3">
        <p className="font-medium text-sm">Lengkapi Toko Kamu</p>
        <span className="text-xs text-gray-500">{doneCount}/{steps.length} selesai</span>
      </div>
      <div className="space-y-2">
        {steps.map((step) => (
          <Link
            key={step.key}
            href={step.href}
            className="flex items-center gap-2 text-sm hover:underline"
          >
            {status[step.key] ? (
              <CheckCircle2 size={16} className="text-green-600" />
            ) : (
              <Circle size={16} className="text-gray-300" />
            )}
            <span className={status[step.key] ? "text-gray-400 line-through" : ""}>
              {step.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

## 2.3 Panggil di Dashboard Seller

```tsx
// app/seller/dashboard/page.tsx
import { db } from "@/db";
import { sellerOnboarding } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SellerOnboardingChecklist from "@/components/SellerOnboardingChecklist";
import SellerDashboard from "@/components/SellerDashboard";

export default async function SellerDashboardPage() {
  const session = await getServerSession(authOptions);
  const [onboarding] = await db
    .select()
    .from(sellerOnboarding)
    .where(eq(sellerOnboarding.userId, session!.user.id));

  return (
    <div>
      {onboarding && <SellerOnboardingChecklist status={onboarding} />}
      <SellerDashboard />
    </div>
  );
}
```

## 2.4 Update Status Otomatis

Update kolom onboarding di titik-titik yang relevan, misalnya:

```typescript
// Contoh: setelah seller berhasil upload produk pertama
// di app/api/products/route.ts, setelah insert produk sukses:

import { sellerOnboarding } from "@/db/schema";
import { eq } from "drizzle-orm";

await db
  .update(sellerOnboarding)
  .set({ hasFirstProduct: true })
  .where(eq(sellerOnboarding.userId, session.user.id));
```

Lakukan pola serupa untuk `hasStoreProfile` (saat seller menyimpan profil toko) dan `hasPaymentSetup` (saat rekening pembayaran berhasil dihubungkan).

---

# Ringkasan Urutan Kerja
1. Buat halaman statis: about, privacy-policy, terms-of-service, return-policy, faq.
2. Tautkan semua halaman itu di footer global.
3. Migrasi tabel `seller_onboarding`, buat baris default (`false` semua) saat user mendaftar sebagai seller.
4. Pasang `SellerOnboardingChecklist` di dashboard seller.
5. Update kolom onboarding otomatis di titik-titik terkait (isi profil, upload produk, setup pembayaran).

Sesuaikan nama tabel/kolom dan isi konten legal dengan kebutuhan asli project kamu sebelum di-paste.