# LakuLagi — Marketplace Preloved Terpercaya

> Platform jual beli barang preloved berbasis web yang modern, aman, dan mudah digunakan.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Neon DB](https://img.shields.io/badge/Database-Neon_PostgreSQL-green)](https://neon.tech)
[![Drizzle ORM](https://img.shields.io/badge/ORM-Drizzle-orange)](https://orm.drizzle.team)

---

## 📖 Deskripsi Proyek

**LakuLagi** adalah marketplace preloved (barang bekas berkualitas) yang dibangun sebagai Tugas Akhir. Platform ini menghubungkan penjual dan pembeli dalam satu ekosistem yang dilengkapi fitur sosial komunitas, sistem pembayaran, dan manajemen toko.

---

## ✨ Fitur Utama

### 🛒 Pembeli (Customer)
- Browse & cari produk dengan filter kategori, harga, dan kondisi barang
- Keranjang belanja persisten (tidak hilang saat refresh)
- Checkout dengan pilihan pembayaran: QRIS, Kartu, COD
- Riwayat pesanan & tracking status
- Wishlist produk favorit
- Review & rating produk
- Chat langsung dengan penjual

### 🏪 Penjual (Seller)
- Dashboard analitik penjualan
- Manajemen produk (upload foto, set harga, stok, kondisi)
- Kelola pesanan masuk & update status
- Notifikasi pesanan baru secara realtime
- Profil toko & biodata

### ⚙️ Admin
- Dashboard kontrol seluruh ekosistem
- Kelola pengguna (ban, ubah role, hapus akun)
- Moderasi produk (suspend/aktifkan)
- Manajemen transaksi (update status, refund)
- Audit log aktivitas

### 👥 Komunitas
- Halaman Explore — feed postingan komunitas
- Komentar & like pada postingan (realtime polling)
- Grup diskusi per kategori (Tech, Fashion, Kosan, Hobi, dll)
- Group chat realtime di setiap komunitas

---

## 🛠️ Tech Stack

| Teknologi | Kegunaan |
|---|---|
| **Next.js 16** | Framework React (App Router) |
| **TypeScript** | Type safety |
| **Tailwind CSS v4** | Styling (Neobrutalism design system) |
| **Drizzle ORM** | Query builder & schema management |
| **Neon PostgreSQL** | Database serverless |
| **NextAuth.js** | Autentikasi (JWT + bcrypt) |
| **UploadThing** | Upload gambar produk |
| **Zustand** | State management (cart) |
| **Midtrans** | Payment gateway (sandbox) |

---

## 🗂️ Struktur Proyek

```
src/
├── app/
│   ├── (auth)/          # Login & Register
│   ├── admin/           # Panel admin
│   ├── api/             # API routes
│   ├── customer/        # Halaman pembeli
│   ├── explore/         # Feed komunitas
│   ├── groups/          # Grup diskusi
│   ├── products/        # Katalog produk
│   ├── seller/          # Dashboard penjual
│   └── profile/         # Profil pengguna
├── components/          # Reusable UI components
└── lib/                 # Auth, DB, schema, utilities
```

---

## 🚀 Cara Menjalankan Lokal

### 1. Clone & Install
```bash
git clone https://github.com/nangg22/marketplace.git
cd marketplace
npm install
```

### 2. Setup Environment Variables
Buat file `.env` berisi:
```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
UPLOADTHING_SECRET=...
UPLOADTHING_APP_ID=...
MIDTRANS_SERVER_KEY=...
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=...
```

### 3. Jalankan
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000)

---

## 👤 Role Akun

| Role | Akses |
|---|---|
| **Customer** | Belanja, cart, checkout, orders, profil, komunitas |
| **Seller** | Semua customer + dashboard toko, produk, pesanan |
| **Admin** | Full access — kelola semua user, produk, transaksi |

> Role Admin hanya bisa diberikan melalui database atau oleh Admin lain.

---

## 📸 Desain

Menggunakan gaya **Neobrutalism** — bold borders, drop shadow keras, warna kontras tinggi, dan tipografi ekspresif. Responsive untuk mobile dan desktop.

---

## 👨‍💻 Developer

**Danang Prajadinata**  
Tugas Akhir — 2026
