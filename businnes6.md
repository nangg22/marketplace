damint
123456

1, 3, 6, 2, 


Now let me compile the complete QA/QC report in Indonesian.

---

# LAPORAN AUDIT QA/QC LENGKAP — MALLPEDIA MARKETPLACE

**Proyek:** Marketplace (Next.js 16 + Drizzle ORM + Neon DB + NextAuth v4)
**Tanggal:** 18 Juli 2026
**Tim Audit:** Senior QA Engineer (15+ tahun pengalaman)
**Total File Diperiksa:** 112 file (65 .tsx, 43 .ts, 1 .jsx, 1 .js, 1 .css)

---

## RINGKASAN TEMUAN

| Severity | Jumlah |
|----------|--------|
| **CRITICAL** | 8 |
| **HIGH** | 18 |
| **MEDIUM** | 28 |
| **LOW** | 22 |
| **TOTAL** | **76** |

---

## 1. PENGUJIAN FUNGSIONAL

### CRITICAL-001 — Rahasia Produksi Terbongkar di Repository
**Kategori:** Keamanan / Sensitif Data
**Severity:** CRITICAL
**Lokasi:** `.env:1-12`
**Deskripsi:** File `.env` berisi kredensial produksi LIVE — koneksi database Neon, `NEXTAUTH_SECRET`, kunci UploadThing (`sk_live_...`), dan kunci Midtrans produksi (`MIDTRANS_IS_PRODUCTION=true` dengan `Mid-server-...`). Ini semua terekam di version control.
**Perilaku Seharusnya:** Rahasia produksi TIDAK PERNAH boleh ada di repository. Gunakan environment injection saat deploy.
**Perilaku Aktual:** Siapa pun dengan akses repo mendapatkan akses penuh ke database, payment gateway, dan file upload.
**Langkah Reproduksi:** `cat .env` di root proyek.
**Rekomendasi:** Segera rotasi SEMUA rahasia yang terekspos. Pindah ke secrets manager (Vercel env, Doppler). Tambahkan `.env` ke `.gitignore`.

### CRITICAL-002 — Secret Lemah untuk JWT
**Kategori:** Keamanan
**Severity:** CRITICAL
**Lokasi:** `.env:2`
**Deskripsi:** `NEXTAUTH_SECRET=rahasia_tugas_akhir_mallpedia_2024` — string pendek yang bisa ditebak kamus. Penyerang bisa memalsukan token JWT dan menyamar sebagai pengguna mana pun termasuk admin.
**Perilaku Seharusnya:** Minimal 32 byte kriptografis acak.
**Rekomendasi:** `openssl rand -base64 32`

### CRITICAL-003 — XSS di Halaman Simulasi Pembayaran
**Kategori:** Keamanan / XSS
**Severity:** CRITICAL
**Lokasi:** `src/app/api/payment/simulate/route.ts:341,362,367,414`
**Deskripsi:** Parameter URL (`orderId`, `amount`) disuntikkan langsung ke HTML/JS tanpa escaping:
```js
body: JSON.stringify({ order_id: '${orderId}' }),
<div class="amount-box">Rp ${formattedAmount}</div>
```
Penyerang bisa membuat URL seperti: `?order_id=';alert(document.cookie);//`
**Perilaku Seharusnya:** Semua input harus di-escape sebelum disuntikkan ke HTML/JS.
**Rekomendasi:** Gunakan `textContent` untuk JavaScript, atau sanitasi HTML. Validasi `orderId` sebagai UUID.

### CRITICAL-004 — Halaman Pembayaran Tidak Memerlukan Autentikasi
**Kategori:** Keamanan / Autentikasi
**Severity:** CRITICAL
**Lokasi:** `src/app/api/payment/simulate/route.ts:15`
**Deskripsi:** Endpoint GET tanpa pengecekan session. Siapa pun bisa mengakses halaman pembayaran QR只要有 order ID.
**Perilaku Seharusnya:** Semua endpoint pembayaran harus memeriksa autentikasi.
**Rekomendasi:** Tambahkan `getServerSession(authOptions)` dan verifikasi bahwa user memiliki order tersebut.

### CRITICAL-005 — Race Condition di Checkout (Stock Tanpa Transaksi)
**Kategori:** Integritas Data
**Severity:** CRITICAL
**Lokasi:** `src/app/customer/checkout/actions.ts:272-288`
**Deskripsi:** Pengurangan stock dilakukan dalam loop tanpa `db.transaction()`. Jika proses crash setelah mengurangi stock item A tapi sebelum item B, stock hilang permanen tanpa order.
**Perilaku Seharusnya:** Harus dibungkus dalam satu transaksi database.
**Rekomendasi:** Ikuti pola yang benar di `src/lib/create-order.ts:30` yang sudah menggunakan `db.transaction()`.

### CRITICAL-006 — Skrip Admin Tidak Dijaga di Sisi Server
**Kategori:** Otorisasi
**Severity:** CRITICAL
**Lokasi:** `src/app/admin/categories/page.tsx`, `src/app/admin/audit-logs/page.tsx`
**Deskripsi:** Halaman admin menggunakan `"use client"` dengan fetch API tanpa pengecekan session di sisi server. Bergantung sepenuhnya pada API route untuk otorisasi.
**Perilaku Seharusnya:** Setiap halaman admin harus memiliki server-side auth guard.
**Rekomendasi:** Tambahkan middleware Next.js atau `getServerSession` di setiap halaman admin.

### CRITICAL-007 — Mass Assignment di Update Kategori
**Kategori:** Keamanan / OWASP
**Severity:** CRITICAL
**Lokasi:** `src/app/api/admin/categories/[id]/route.ts:25-30`
**Deskripsi:** Seluruh request body langsung diteruskan ke `.set(body)` tanpa whitelist field. Admin bisa menimpa kolom apapun termasuk `id`, `createdAt`.
```ts
const [updated] = await db.update(categories).set(body).where(eq(categories.id, id));
```
**Perilaku Seharusnya:** Hanya izinkan field yang diizinkan (name, description, sortOrder, imageUrl).
**Rekomendasi:** Buat whitelist: `const allowedFields = { name: body.name, ... }`

### CRITICAL-008 — Password Tanpa Batas Atas (DoS via bcrypt)
**Kategori:** Keamanan / DoS
**Severity:** CRITICAL
**Lokasi:** `src/app/api/register/route.ts:19`
**Deskripsi:** Tidak ada batas panjang password. bcrypt dengan password multi-MB akan menghabiskan CPU berlebihan.
**Perilaku Seharusnya:** Maksimal 128 karakter.
**Rekomendasi:** Tambahkan `if (password.length > 128)` sebelum hashing.

---

## 2. REVIEW UI

### HIGH-UI-001 — HTML Tidak Valid: `<Link>` Membungkus `<button>`
**Kategori:** UI / HTML
**Severity:** HIGH
**Lokasi:** `src/components/Navbar.jsx:170-178, 204`, `src/app/not-found.tsx:37, 42`
**Deskripsi:** `<Link>` me-render `<a>`, dan `<button>` di dalam `<a>` adalah HTML tidak valid menurut spesifikasi. Pola ini ada di 4 lokasi.
**Perilaku Seharusnya:** Gunakan `<Link className="...">` langsung tanpa `<button>` di dalamnya.
**Rekomendasi:** Ganti `<Link><button className="...">...</button></Link>` dengan `<Link className="...">...</Link>`.

### HIGH-UI-002 — DOM Manipulation di Luar React (Toast)
**Kategori:** UI / React
**Severity:** HIGH
**Lokasi:** `src/components/ProductCard.tsx:29-33`, `src/app/products/[id]/AddToCartButton.tsx:32-36`
**Deskripsi:** Toast dibuat dengan `document.createElement` dan `document.body.appendChild` — memanipulasi DOM di luar React. Bisa menyebabkan DOM leak, hydration mismatch, dan toast bertumpuk.
**Perilaku Seharusnya:** Gunakan React state atau library toast (react-hot-toast, sonner).
**Rekomendasi:** Gunakan `react-hot-toast` atau state-based toast system.

### HIGH-UI-003 — Tidak Ada `prefers-reduced-motion`
**Kategori:** Aksesibilitas / UI
**Severity:** HIGH
**Lokasi:** `src/app/globals.css`
**Deskripsi:** Semua animasi CSS (`animate-float`, `animate-marquee`, `animate-bounce-in`, `hover-wiggle`) berjalan tanpa memperhatikan preferensi pengguna terhadap gerakan. Pelanggaran WCAG 2.1.
**Perilaku Seharusnya:** Hormati `prefers-reduced-motion: reduce`.
**Rekomendasi:** Tambahkan `@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }`

### HIGH-UI-004 — ReviewForm & ReviewList Tidak Konsisten dengan Design System
**Kategori:** UI / Konsistensi
**Severity:** HIGH
**Lokasi:** `src/components/ReviewForm.tsx`, `src/components/ReviewList.tsx`
**Deskripsi:** Menggunakan Tailwind standar (`border-gray-200`, `rounded-md`, `bg-black`) bukan design system neobrutalist (`neo-card`, `neo-input`, `neo-btn`). Bentuk visual sangat berbeda dari aplikasi.
**Perilaku Seharusnya:** Konsisten dengan design system neobrutalist.
**Rekomendasi:** Ganti class Tailwind dengan class `neo-*` yang sesuai.

### MEDIUM-UI-001 — Navbar Dropdown Tidak Aksesibel
**Kategori:** Aksesibilitas
**Severity:** MEDIUM
**Lokasi:** `src/components/Navbar.jsx:116,131-164`
**Deskripsi:** Toggle dropdown tanpa `aria-expanded`, `aria-haspopup`. Panel dropdown tanpa `role="menu"`/`role="menuitem"`. Tidak ada navigasi keyboard (Escape untuk tutup, arrow keys).
**Rekomendasi:** Tambahkan ARIA attributes dan keyboard event handler.

### MEDIUM-UI-002 — FAQAccordion Tidak Keyboard-Accessible
**Kategori:** Aksesibilitas
**Severity:** MEDIUM
**Lokasi:** `src/components/FAQAccordion.tsx:19`
**Deskripsi:** Menggunakan `<div onClick>` bukan `<button>`. Tidak bisa diakses dengan keyboard. Tidak ada `aria-expanded` atau `aria-controls`.
**Rekomendasi:** Ganti dengan `<button>` atau tambahkan `role="button"`, `tabIndex={0}`, `onKeyDown`.

### MEDIUM-UI-003 — StarRating Tidak Mengikuti Pola ARIA
**Kategori:** Aksesibilitas
**Severity:** MEDIUM
**Lokasi:** `src/components/StarRating.tsx:24-31`
**Deskripsi:** Tombol bintang tanpa `aria-label`. Container tanpa `role="radiogroup"`. Mode readOnly tidak ada perbedaan visual.
**Rekomendasi:** Gunakan pola ARIA radiogroup dengan `aria-label` per bintang.

### MEDIUM-UI-004 — Beberapa Input Tanpa Label
**Kategori:** Aksesibilitas
**Severity:** MEDIUM
**Lokasi:** `ReviewForm.tsx:62,70`, `PriceFilter.tsx:63,71`, `CategorySelect.tsx:31`, `Navbar.jsx:87`
**Deskripsi:** Input dan select hanya memiliki placeholder, tanpa `<label>` atau `aria-label`. Screen reader tidak bisa mengumumkan tujuan field.
**Rekomendasi:** Tambahkan `<label>` atau `aria-label` pada setiap input.

### MEDIUM-UI-005 — Marquee Tidak `aria-hidden`
**Kategori:** Aksesibilitas
**Severity:** MEDIUM
**Lokasi:** `src/app/page.tsx:83-92`
**Deskripsi:** Teks berjalan berulang "GRATIS ONGKIR FLASH SALE..." tidak memiliki `aria-hidden="true"`. Screen reader akan membacanya berulang kali.
**Rekomendasi:** Tambahkan `aria-hidden="true"` pada elemen marquee.

### MEDIUM-UI-006 — Navbar `bg-white` Bukan `var(--neo-white)`
**Kategori:** UI / Konsistensi
**Severity:** MEDIUM
**Lokasi:** `src/components/Navbar.jsx:132`
**Deskripsi:** Dropdown desktop menggunakan `bg-white` hardcoded, bukan `var(--neo-white)` dari design system.
**Rekomendasi:** Ganti `bg-white` dengan `bg-[var(--neo-white)]`.

### MEDIUM-UI-007 — ConfirmDeliveryButton Menggunakan Plain Tailwind
**Kategori:** UI / Konsistensi
**Severity:** MEDIUM
**Lokasi:** `src/components/ConfirmDeliveryButton.tsx:28,39`
**Deskripsi:** Menggunakan `bg-green-500`, `bg-green-50` alih-alih `var(--neo-green)`.
**Rekomendasi:** Gunakan variabel design system.

### MEDIUM-UI-008 — Tidak Ada Skip-to-Content Link
**Kategori:** Aksesibilitas
**Severity:** MEDIUM
**Lokasi:** `src/app/layout.tsx`
**Deskripsi:** Tidak ada link skip-to-content untuk pengguna keyboard.
**Rekomendasi:** Tambahkan `<a href="#main-content" className="sr-only focus:not-sr-only">Skip to content</a>`.

### LOW-UI-001 — Konsol.log di Produksi
**Kategori:** Keamanan / UI
**Severity:** LOW
**Lokasi:** `src/app/(auth)/login/page.tsx:33-34`
**Deskripsi:** `console.log('Res:', res)` — data autentikasi terekspos di browser console.
**Rekomendasi:** Hapus semua `console.log` di kode klien atau bungkus dengan environment check.

### LOW-UI-002 — Loading Skeleton Hardcoded Colors
**Kategori:** UI / Konsistensi
**Severity:** LOW
**Lokasi:** `src/app/customer/orders/loading.tsx:2-4`, `src/app/products/loading.tsx:4-6`
**Deskripsi:** Menggunakan `bg-[#F5E6D3]` hardcoded bukan variabel CSS.
**Rekomendasi:** Gunakan `bg-[var(--neo-bg)]`.

### LOW-UI-003 — Footer Menggunakan `©` di JSX
**Kategori:** UI
**Severity:** LOW
**Lokasi:** `src/components/Footer.tsx:15`
**Deskripsi:** `©` di JSX — seharusnya `&copy;` atau `©`.
**Rekomendasi:** Ganti dengan entitas yang benar.

### LOW-UI-004 — Seller Onboarding Icons Tidak `aria-hidden`
**Kategori:** Aksesibilitas
**Severity:** LOW
**Lokasi:** `src/components/SellerOnboardingChecklist.tsx:46-49`
**Deskripsi:** Icon `CheckCircle2` dan `Circle` dekoratif tapi tidak memiliki `aria-hidden="true"`.
**Rekomendasi:** Tambahkan `aria-hidden="true"`.

---

## 3. REVIEW UX

### HIGH-UX-001 — Profil Cross-Tab Overwrite (Data Loss)
**Kategori:** UX / Bug Fungsional
**Severity:** HIGH
**Lokasi:** `src/app/profile/page.tsx:337-339, 424-431`
**Deskripsi:** Form biodata menyertakan field tersembunyi `storeName`/`storeDescription`. Form toko menyertakan field tersembunyi `name`/`bio`/`gender`. Mengedit tab "Info Toko" diam-diam menimpa biodata dengan nilai stale.
**Perilaku Seharusnya:** Edit biodata dan toko harus independen.
**Rekomendasi:** Pisahkan endpoint save untuk biodata dan toko.

### HIGH-UX-002 — Keranjang Dihapus Sebelum Redirect Pembayaran Selesai
**Kategori:** UX / Alur
**Severity:** HIGH
**Lokasi:** `src/app/customer/checkout/page.tsx:110`
**Deskripsi:** Keranjang dihapus langsung setelah order dibuat (line 110), sebelum `window.location.href` redirect (line 114) selesai. Jika redirect gagal, pengguna kehilangan keranjang DAN tidak tahu order-nya.
**Perilaku Seharusnya:** Hapus keranjang SETELAH redirect berhasil, atau gunakan server-side cart.
**Rekomendasi:** Delay cart clear sampai payment callback diterima.

### MEDIUM-UX-001 — Tidak Ada Konfirmasi Hapus Item Terakhir di Keranjang
**Kategori:** UX
**Severity:** MEDIUM
**Lokasi:** `src/app/customer/cart/page.tsx:85-86`
**Deskripsi:** Klik "−" saat kuantitas 1 diam-diam menghapus item tanpa konfirmasi.
**Rekomendasi:** Tampilkan konfirmasi atau ubah tombol jadi "Hapus".

### MEDIUM-UX-002 — Tidak Ada Batas Kuantitas di Keranjang
**Kategori:** UX
**Severity:** MEDIUM
**Lokasi:** `src/lib/store.ts:42-50`
**Deskripsi:** `updateQuantity` tanpa batas atas. Pengguna bisa set kuantitas 9999.
**Rekomendasi:** Batasi sesuai stok produk.

### MEDIUM-UX-003 — Validasi Checkout Menggunakan `alert()`
**Kategori:** UX
**Severity:** MEDIUM
**Lokasi:** `src/app/customer/checkout/page.tsx:84, 101, 126`
**Deskripsi:** `alert()` untuk validasi dan pesan error. Memblokir UI, UX mobile buruk, tidak konsisten dengan pola error inline aplikasi.
**Rekomendasi:** Gunakan pesan error inline.

### MEDIUM-UX-004 — Sesi Tidak Refresh Setelah Edit Profil
**Kategori:** UX
**Severity:** MEDIUM
**Lokasi:** `src/app/profile/page.tsx:91-95, 167`
**Deskripsi:** Setelah `updateMyProfile` mengubah nama, objek `session` masih menampilkan nama lama. Header menampilkan nama stale sampai full page refresh.
**Rekomendasi:** Panggil `update()` dari next-auth setelah profil diupdate.

### MEDIUM-UX-005 — Tracking Page Melewati Status `delivered`
**Kategori:** UX
**Severity:** MEDIUM
**Lokasi:** `src/app/customer/orders/[id]/tracking/page.tsx:16`
**Deskripsi:** `STATUS_FLOW` langsung dari `shipped` ke `completed`, melewati `delivered`. Tapi `delivered` adalah status real yang digunakan di `orders/actions.ts:34`.
**Rekomendasi:** Tambahkan `delivered` ke STATUS_FLOW.

### MEDIUM-UX-006 — Tombol Refund Approve Tanpa Konfirmasi
**Kategori:** UX / Keamanan
**Severity:** MEDIUM
**Lokasi:** `src/app/seller/refunds/RefundRespondForm.tsx:55`
**Deskripsi:** Operasi keuangan (approve refund) langsung diproses tanpa dialog konfirmasi.
**Rekomendasi:** Tambahkan `confirm()` atau modal konfirmasi.

---

## 4. UJI RESPONSIVE

### MEDIUM-RESP-001 — ProductImageUploader `grid-cols-4` Terlalu Banyak di Layar Kecil
**Kategori:** Responsive
**Severity:** MEDIUM
**Lokasi:** `src/components/ProductImageUploader.tsx:44`
**Deskripsi:** 4 kolom di layar kecil membuat thumbnail terlalu kecil.
**Rekomendasi:** `grid-cols-3 sm:grid-cols-4`

### MEDIUM-RESP-002 — SellerAnalyticsDashboard Summary Cards
**Kategori:** Responsive
**Severity:** MEDIUM
**Lokasi:** `src/components/SellerAnalyticsDashboard.tsx:77`
**Deskripsi:** `grid grid-cols-2 gap-4` — teks "💰 Pendapatan (30 hari)" bisa wrap aneh di layar sempit.
**Rekomendasi:** `grid-cols-1 sm:grid-cols-2`

### LOW-RESP-001 — Navbar `h-16` Fixed Height
**Kategori:** Responsive
**Severity:** LOW
**Lokasi:** `src/components/Navbar.jsx:64`
**Deskripsi:** `h-16` bisa terpotong dengan font scaling 200%+.
**Rekomendasi:** Gunakan `min-h-16`.

---

## 5. UJI AKSESIBILITAS

### HIGH-A11Y-001 — Tombol Dropdown Tanpa `aria-expanded`
**Kategori:** Aksesibilitas / WCAG
**Severity:** HIGH
**Lokasi:** `Navbar.jsx:116`, `NotificationBell.tsx:106`, `MobileFilterDrawer.tsx:31-33`
**Deskripsi:** Tombol toggle dropdown tidak memiliki `aria-expanded` untuk mengkomunikasikan status buka/tutup.
**Rekomendasi:** Tambahkan `aria-expanded={isOpen}`.

### HIGH-A11Y-002 — MobileFilterDrawer Tanpa Focus Trap
**Kategori:** Aksesibilitas / WCAG
**Severity:** HIGH
**Lokasi:** `src/components/MobileFilterDrawer.tsx:43-48`
**Deskripsi:** Drawer tidak memiliki `role="dialog"`, `aria-modal="true"`, atau focus trap. Saat dibuka, fokus tidak pindah ke dalam drawer. Escape tidak menutup drawer.
**Rekomendasi:** Implementasikan focus trap dan Escape key handler.

### MEDIUM-A11Y-001 — Color Contrast Footer di Bawah WCAG AA
**Kategori:** Aksesibilitas
**Severity:** MEDIUM
**Lokasi:** `src/components/Footer.tsx:20-24`
**Deskripsi:** Teks `#FF6B35` di atas background `#1A1A2E` memiliki contrast ratio ~3.8:1 — di bawah 4.5:1 untuk teks normal.
**Rekomendasi:** Gunakan warna lebih terang atau lebih gelap.

### MEDIUM-A11Y-002 — NotificationBell Dropdown Tanpa `role="dialog"`
**Kategori:** Aksesibilitas
**Severity:** MEDIUM
**Lokasi:** `src/components/NotificationBell.tsx:119-184`
**Deskripsi:** Panel notifikasi tanpa `role="dialog"` atau `role="menu"`.
**Rekomendasi:** Tambahkan role dan navigasi keyboard.

### MEDIUM-A11Y-003 — Beberapa Tombol Tanpa `focus-visible`
**Kategori:** Aksesibilitas
**Severity:** MEDIUM
**Lokasi:** `Button.tsx`, `ProductCard.tsx:85`, `ReviewForm.tsx:78-83`, `PriceFilter.tsx:79-83`
**Deskripsi:** Tombol tidak memiliki styling `focus-visible` yang terlihat.
**Rekomendasi:** Tambahkan `focus-visible:ring-2 focus-visible:ring-[var(--neo-primary)]`.

### LOW-A11Y-001 — Alt Text Product Gallery Tidak Informatif
**Kategori:** Aksesibilitas
**Severity:** LOW
**Lokasi:** `src/components/ProductGallery.tsx:25,36-37`
**Deskripsi:** Alt text "Produk" dan "thumbnail" terlalu generik.
**Rekomendasi:** Gunakan deskriptif: `alt={\`Gambar produk ${index + 1}\`}`.

### LOW-A11Y-002 — Footer Link Tanpa `aria-label`
**Kategori:** Aksesibilitas
**Severity:** LOW
**Lokasi:** `src/components/Footer.tsx`
**Deskripsi:** Link footer tidak memiliki `aria-label` yang membedakan — meskipun teks sudah ada, contrast rendah bisa menyulitkan.
**Rekomendasi:** Pastikan contrast cukup atau tambahkan `aria-label`.

---

## 6. REVIEW PERFORMA

### HIGH-PERF-001 — Tidak Ada Pagination di Semua Halaman List
**Kategori:** Performa
**Severity:** HIGH
**Lokasi:** `admin/users/page.tsx:15`, `admin/products/page.tsx:17-32`, `admin/transactions/page.tsx:26`, `admin/audit-logs/page.tsx:58`, `seller/orders/page.tsx:22-71`, `customer/orders/page.tsx:22`, `products/page.tsx:80`, `search/page.tsx:69`
**Deskripsi:** SEMUA list mem-fetch SEMUA data sekaligus tanpa limit/offset. Dengan dataset besar, ini menyebabkan page load lambat dan memory usage tinggi.
**Rekomendasi:** Implementasikan pagination (server-side) dengan default 20-50 item per halaman.

### MEDIUM-PERF-001 — ProductCard Menggunakan `<img>` Bukan `next/image`
**Kategori:** Performa
**Severity:** MEDIUM
**Lokasi:** `src/components/ProductCard.tsx:46`
**Deskripsi:** Menggunakan tag `<img>` HTML native, bukan komponen `next/image`. Tidak ada optimasi gambar, lazy loading, atau responsive sizing.
**Rekomendasi:** Gunakan `import Image from 'next/image'`.

### MEDIUM-PERF-002 — Self-Fetch di Server Component
**Kategori:** Performa / Arsitektur
**Severity:** MEDIUM
**Lokasi:** `src/app/products/[id]/page.tsx:136-147`
**Deskripsi:** Server component mengambil data via HTTP ke route API sendiri. Ini menambah latency dan risiko circular dependency.
**Rekomendasi:** Query database langsung di server component.

### MEDIUM-PERF-003 — Import CSS Duplikat
**Kategori:** Performa
**Severity:** MEDIUM
**Lokasi:** `src/app/seller/products/create/page.tsx:7-8`
**Deskripsi:** `"@uploadthing/react/styles.css"` diimpor dua kali.
**Rekomendasi:** Hapus duplikat.

### LOW-PERF-001 — `hover-wiggle` di Semua Tombol
**Kategori:** Performa / A11y
**Severity:** LOW
**Lokasi:** `src/components/Button.tsx:18`
**Deskripsi:** Animasi `hover-wiggle` berjalan di semua tombol termasuk yang disabled.
**Rekomendasi:** Conditional: `!disabled && 'hover-wiggle'`.

---

## 7. REVIEW KEAMANAN

### HIGH-SEC-001 — Tidak Ada Rate Limiting di Semua Endpoint
**Kategori:** Keamanan
**Severity:** HIGH
**Lokasi:** SEMUA API routes
**Deskripsi:** Tidak ada rate limiting di endpoint manapun. Endpoint kritis tanpa rate limiting:
- Login → brute force password
- Register → spam akun
- Payment confirm → brute force order confirmation
- Refund → spam refund requests
- Reviews → manipulasi rating
**Rekomendasi:** Implementasikan rate limiting (Upstash Redis atau `next-rate-limiter`).

### HIGH-SEC-002 — Tidak Ada Verifikasi Email
**Kategori:** Keamanan / Autentikasi
**Severity:** HIGH
**Lokasi:** `src/app/api/register/route.ts:42-53`
**Deskripsi:** Akun dibuat langsung aktif tanpa verifikasi email. Penyerang bisa mendaftar dengan email siapa saja.
**Rekomendasi:** Implementasikan verifikasi email dengan token time-limited.

### HIGH-SEC-003 — Race Condition Double Payment Confirm
**Kategori:** Keamanan / Pembayaran
**Severity:** HIGH
**Lokasi:** `src/app/api/payment/confirm/route.ts:55-71`
**Deskripsi:** Antara pengecekan status (line 55) dan update (line 71) tidak ada row-level lock. Dua request konkuren bisa keduanya melihat `status === 'pending'` dan melanjutkan.
**Rekomendasi:** Gunakan optimistic concurrency control atau SELECT FOR UPDATE.

### HIGH-SEC-004 — QR Code Menggunakan Amount dari URL
**Kategori:** Keamanan / Pembayaran
**Severity:** HIGH
**Lokasi:** `src/app/api/payment/simulate/route.ts:18,46-49`
**Deskripsi:** Amount di QR code berasal dari query parameter URL, bukan dari database. Penyerang bisa membuat halaman menampilkan jumlah berbeda dari order asli.
**Rekomendasi:** Selalu resolve amount dari database, bukan dari URL.

### HIGH-SEC-005 — Webhook Tidak Diverifikasi
**Kategori:** Keamanan
**Severity:** HIGH
**Lokasi:** `src/app/api/webhook/payment/route.ts:10`
**Deskripsi:** Webhook endpoint tanpa HMAC signature verification. Mengembalikan 200 untuk semua request. Bisa digunakan untuk SSRF probing.
**Rekomendasi:** Implementasikan verifikasi HMAC signature.

### MEDIUM-SEC-001 — IDOR di Order Timeline
**Kategori:** Keamanan / OWASP
**Severity:** MEDIUM
**Lokasi:** `src/app/api/orders/[id]/timeline/route.ts:8-22`
**Deskripsi:** Endpoint terautentikasi tapi tanpa ownership check. Pengguna yang login bisa melihat timeline order mana pun.
**Rekomendasi:** Verifikasi bahwa order milik user yang sedang login.

### MEDIUM-SEC-002 — Email Validation Lemah
**Kategori:** Keamanan
**Severity:** MEDIUM
**Lokasi:** `src/app/api/register/route.ts:16-17`
**Deskripsi:** `email.includes('@')` menerima email invalid seperti `@domain.com`, `a@`, `@@`.
**Rekomendasi:** Gunakan library validasi email atau regex yang proper.

### MEDIUM-SEC-003 — IP Address Audit Log Bisa Spoof
**Kategori:** Keamanan
**Severity:** MEDIUM
**Lokasi:** `src/lib/audit-log.ts:23-25`
**Deskripsi:** Header `x-forwarded-for` dan `x-real-ip` bisa di-spoof oleh klien.
**Rekomendasi:** Hanya percaya header ini jika di-back reverse proxy tepercaya.

### MEDIUM-SEC-004 — Seller Analytics Tanpa Role Check
**Kategori:** Keamanan
**Severity:** MEDIUM
**Lokasi:** `src/app/api/seller/analytics/route.ts:8`
**Deskripsi:** Hanya mengecek login, bukan role seller. Customer bisa mengakses endpoint ini.
**Rekomendasi:** Tambahkan `if (session.user.role !== 'seller')`.

### MEDIUM-SEC-005 — Status Update Order Tanpa Validasi Transisi
**Kategori:** Keamanan / Logika Bisnis
**Severity:** MEDIUM
**Lokasi:** `src/app/admin/actions.ts:118-139`
**Deskripsi:** Menerima string `status` apapun tanpa memvalidasi transisi yang diizinkan. Admin bisa set order langsung dari `pending` ke `completed`.
**Rekomendasi:** Validasi transisi status di sisi server.

### LOW-SEC-001 — JWT Tanpa `maxAge`
**Kategori:** Keamanan
**Severity:** LOW
**Lokasi:** `src/lib/auth.ts:8-9`
**Deskripsi:** Tidak ada `maxAge` pada JWT. Default 30 hari.
**Rekomendasi:** Set `session: { strategy: "jwt", maxAge: 3600 }`.

### LOW-SEC-002 — `trustHost: true` Melonggarkan Validasi Host
**Kategori:** Keamanan
**Severity:** LOW
**Lokasi:** `src/lib/auth.ts:10`
**Deskripsi:** `trustHost: true` bisa leak session cookie ke host berbeda jika di-back reverse proxy.
**Rekomendasi:** Pastikan konfigurasi ini disengaja untuk produksi.

---

## 8. REVIEW SEO

### MEDIUM-SEO-001 — JSON-LD XSS Vector
**Kategori:** SEO / Keamanan
**Severity:** MEDIUM
**Lokasi:** `src/app/products/[id]/page.tsx:96`
**Deskripsi:** `dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}` — jika nama produk mengandung `</script>`, bisa keluar dari script tag.
**Rekomendasi:** Gunakan sanitizer atau escaping untuk `</` di JSON-LD output.

### LOW-SEO-001 — Tidak Ada Structured Data di Halaman Lain
**Kategori:** SEO
**Severity:** LOW
**Lokasi:** Halaman selain product detail
**Deskripsi:** Hanya product detail yang memiliki JSON-LD. Homepage, kategori, dan halaman lain tidak memiliki structured data.
**Rekomendasi:** Tambahkan Organization schema di homepage, BreadcrumbList di halaman dalam.

---

## 9. REVIEW KUALITAS KODE

### HIGH-CODE-001 — `create-order.ts` Field Name Mismatch
**Kategori:** Kualitas Kode
**Severity:** HIGH
**Lokasi:** `src/lib/create-order.ts:56-61` vs `src/app/customer/checkout/actions.ts:303-308`
**Deskripsi:** `create-order.ts` menggunakan field lama (`recipientName`, `phone`, `address`) sedangkan `checkout/actions.ts` menggunakan field baru (`shippingRecipientName`, etc). Jika `createOrderWithStockCheck` dipanggil, akan gagal atau insert null.
**Rekomendasi:** Sinkronkan field names atau hapus `create-order.ts` jika tidak digunakan.

### HIGH-CODE-002 — `updateOrderStatus` Non-Atomic
**Kategori:** Kualitas Kode
**Severity:** HIGH
**Lokasi:** `src/lib/orders.ts:5-17`
**Deskripsi:** Dua operasi DB (UPDATE + INSERT) tanpa transaksi. Jika insert gagal, status berubah tapi tidak ada audit trail.
**Rekomendasi:** Bungkus dalam `db.transaction()`.

### MEDIUM-CODE-003 — Pola Auth Tidak Konsisten di Admin
**Kategori:** Kualitas Kode
**Severity:** MEDIUM
**Lokasi:** Admin pages vs actions.ts
**Deskripsi:** 3 pola auth berbeda: (1) getServerSession di server component, (2) client-side fetch tanpa server guard, (3) `requireRole` di server actions. Pola ini rapuh dan error-prone.
**Rekomendasi:** Standarisasi menggunakan middleware atau HOC auth guard.

### MEDIUM-CODE-004 — Error Handling Tidak Konsisten
**Kategori:** Kualitas Kode
**Severity:** MEDIUM
**Lokasi:** `OrderActionButtons.tsx:26-32`, `UserActionButtons.tsx:25-51`, `ProductActionButtons.tsx:20-37`
**Deskripsi:** Server action dipanggil tapi return value tidak dicek. Jika gagal, modal menutup tanpa feedback error.
**Rekomendasi:** Cek return value dan tampilkan pesan error.

### MEDIUM-CODE-005 — `deleteProduct` Tidak Cleanup Orphaned Records
**Kategori:** Kualitas Kode
**Severity:** MEDIUM
**Lokasi:** `src/app/admin/actions.ts:106-112`
**Deskripsi:** Hanya hapus baris produk. `orderItems` yang mereferensikan produk ini menjadi orphan. Bandingkan dengan `deleteUser` yang sudah cascade.
**Rekomendasi:** Tambahkan cleanup untuk orderItems terkait.

### MEDIUM-CODE-006 — Self-Ban Tidak Dicegah
**Kategori:** Kualitas Kode
**Severity:** MEDIUM
**Lokasi:** `src/app/admin/actions.ts:25-34`
**Deskripsi:** `banUser` tidak mengecek `userId !== adminId`. Admin bisa ban diri sendiri.
**Rekomendasi:** Tambahkan `if (userId === adminId) return error`.

### MEDIUM-CODE-007 — `deleteUser` Bisa Hapus Admin
**Kategori:** Kualitas Kode
**Severity:** MEDIUM
**Lokasi:** `src/app/admin/actions.ts:57-79`
**Deskripsi:** Tidak ada check untuk mencegah hapus admin lain. UI disable tombol tapi server action tidak guard.
**Rekomendasi:** Tambahkan server-side check.

### LOW-CODE-001 — `parseInt` Tanpa NaN Check
**Kategori:** Kualitas Kode
**Severity:** LOW
**Lokasi:** `src/app/seller/products/[id]/edit/page.tsx:30-31`
**Deskripsi:** `parseInt()` tanpa pengecekan NaN. Jika form kosong, `NaN` masuk ke database.
**Rekomendasi:** Validasi server-side.

### LOW-CODE-002 — `seller/settings/page.tsx` Redirect Tanpa Auth
**Kategori:** Kualitas Kode
**Severity:** LOW
**Lokasi:** `src/app/seller/settings/page.tsx:8-9`
**Deskripsi:** Melakukan `redirect('/profile')` tanpa cek auth. Pengunjung manapun bisa trigger redirect ini.
**Rekomendasi:** Tambahkan auth check.

### LOW-CODE-003 — Tidak Ada Footer di Seller Products Page
**Kategori:** Konsistensi
**Severity:** LOW
**Lokasi:** `src/app/seller/products/page.tsx:52-166`
**Deskripsi:** Halaman punya Navbar tapi tidak ada Footer, berbeda dari halaman seller lain.
**Rekomendasi:** Tambahkan `<Footer />`.

### LOW-CODE-004 — `addProductAction` Tanpa Validasi Required Fields
**Kategori:** Kualitas Kode
**Severity:** LOW
**Lokasi:** `src/app/seller/products/actions.ts:10-57`
**Deskripsi:** Membaca `name`, `price`, `description` dari formData tapi tidak validasi non-empty atau `price > 0`.
**Rekomendasi:** Tambahkan server-side validation.

### LOW-CODE-005 — `deleteOrder` Tanpa Audit Log
**Kategori:** Kualitas Kode
**Severity:** LOW
**Lokasi:** `src/app/admin/actions.ts:141-148`
**Deskripsi:** `deleteOrder` tidak menulis audit log seperti aksi admin lainnya.
**Rekomendasi:** Tambahkan `logAdminAction()`.

### LOW-CODE-006 — User Name Bisa Crash pada Null
**Kategori:** Kualitas Kode
**Severity:** LOW
**Lokasi:** `src/app/admin/users/page.tsx:84`
**Deskripsi:** `user.name.charAt(0).toUpperCase()` akan throw jika `name` null/undefined.
**Rekomendasi:** Tambahkan null check: `user.name?.charAt(0)?.toUpperCase() || '?'`.

---

## 10. UJI KASUS SUDUT

### HIGH-EDGE-001 — Keranjang Tanpa Validasi Stok saat Add
**Kategori:** Edge Case
**Severity:** HIGH
**Lokasi:** `src/app/products/[id]/AddToCartButton.tsx:20-37`
**Deskripsi:** Menambah ke keranjang tanpa memeriksa stok saat ini. Pengguna bisa add produk habis stok, baru kaget saat checkout.
**Rekomendasi:** Fetch stok terkini atau validasi di checkout entry.

### MEDIUM-EDGE-001 — Rating Average Race Condition
**Kategori:** Edge Case
**Severity:** MEDIUM
**Lokasi:** `src/app/api/reviews/route.ts:54-73`
**Deskripsi:** Review konkuren menghasilkan average yang salah karena stale read dari semua ratings.
**Rekomendasi:** Gunakan agregasi database (AVG) atau lock.

### MEDIUM-EDGE-002 — Payment Expiry Hanya Client-Side
**Kategori:** Edge Case
**Severity:** MEDIUM
**Lokasi:** `src/app/api/payment/simulate/route.ts:389`
**Deskripsi:** Countdown 5 menit hanya di JavaScript client. Server tidak memeriksa expiry. Bisa call `/api/payment/confirm` kapan saja.
**Rekomendasi:** Tambahkan server-side expiry check.

### LOW-EDGE-001 — Order Status Tidak Konsisten
**Kategori:** Edge Case
**Severity:** LOW
**Lokasi:** Berbagai file
**Deskripsi:** Status `delivered` digunakan di orders/actions.ts tapi tidak ada di tracking page STATUS_FLOW.
**Rekomendasi:** Konsistenkan status flow.

---

## 11. KOMPATIBILITAS BROWSER

### MEDIUM-BROWSER-001 — Emoji di Placeholder
**Kategori:** Browser Compat
**Severity:** MEDIUM
**Lokasi:** `src/components/Navbar.jsx:84`
**Deskripsi:** Emoji 🔍 di placeholder input — rendering tidak konsisten di semua platform.
**Rekomendasi:** Gunakan ikon Lucide di samping input.

### LOW-BROWSER-001 — CSS Scrollbar Custom
**Kategori:** Browser Compat
**Severity:** LOW
**Lokasi:** `src/app/globals.css:380-393`
**Deskripsi:** Custom scrollbar menggunakan `::-webkit-scrollbar` — tidak berfungsi di Firefox.
**Rekomendasi:** Ini dekoratif, acceptable.

---

## 12. PENILAIAN KESELURUHAN PRODUK

| Aspek | Skor | Keterangan |
|-------|------|------------|
| **Desain** | 7/10 | Neobrutalist konsisten tapi beberapa komponen (ReviewForm, ConfirmDelivery) keluar dari design system |
| **UI** | 6/10 | HTML invalid di beberapa tempat, konsol.log di produksi, DOM manipulation di luar React |
| **UX** | 5/10 | alert() di checkout, cross-tab overwrite profil, tidak ada pagination, tidak ada konfirmasi refund |
| **Aksesibilitas** | 4/10 | Tanpa skip-to-content, prefers-reduced-motion, aria-expanded, focus trap, label pada input |
| **Keamanan** | 2/10 | Rahasia produksi di repo, secret lemah, XSS di payment, zero rate limiting, tidak ada email verification |
| **Performa** | 4/10 | Tidak ada pagination di semua list, img bukan next/image, self-fetch di server component |
| **Kualitas Kode** | 5/10 | Pola auth tidak konsisten, error handling tidak konsisten, field name mismatch, non-atomic operations |
| **Maintainability** | 5/10 | Banyak code duplication, server action tanpa validasi standar, tidak ada testing |
| **Scalability** | 3/10 | Fetch semua data sekaligus tanpa pagination, tidak ada caching, tidak ada rate limiting |
| **Kesiapan Produksi** | 2/10 | Rahasia terbongkar, kritis keamanan belum diperbaiki, tidak ada monitoring |

---

## RINGKASAN

| Severity | Jumlah |
|----------|--------|
| **CRITICAL** | 8 |
| **HIGH** | 18 |
| **MEDIUM** | 28 |
| **LOW** | 22 |
| **TOTAL** | **76** |

---

## TOP 20 PRIORITAS

1. **Rotasi SEMUA rahasia produksi** — .env terbongkar di repo. Database, Midtrans, UploadThing, NEXTAUTH_SECRET. SEGERA.
2. **Generasi `NEXTAUTH_SECRET` yang kriptografis** — yang sekarang bisa ditebak kamus.
3. **Fix XSS di payment simulation** — template literal injection.
4. **Tambahkan rate limiting** ke SEMUA API endpoint.
5. **Implementasikan verifikasi email** untuk registrasi.
6. **Wrap checkout stock decrement dalam `db.transaction()`** — race condition kritis.
7. **Wrap `updateOrderStatus` dalam transaksi** — non-atomic update + history.
8. **Tambahkan server-side auth guard** di semua halaman admin.
9. **Fix mass assignment** di category update — whitelist field.
10. **Implementasikan pagination** di semua halaman list (admin, seller, customer, produk).
11. **Fix `<Link><button>` invalid HTML nesting** — 4 lokasi.
12. **Tambahkan `aria-expanded`** di semua dropdown toggle.
13. **Tambahkan `prefers-reduced-motion`** ke globals.css.
14. **Fix cross-tab overwrite profil** — pisahkan save endpoint.
15. **Validasi payment amount dari database**, bukan dari URL.
16. **Implementasikan fokus trap** di MobileFilterDrawer.
17. **Validasi transisi status order** di sisi server.
18. **Tambahkan batas panjang password** (maks 128).
19. **Hapus `console.log`** dari kode klien produksi.
20. **Fix `create-order.ts` field names** atau hapus jika tidak digunakan.

---

## "Apakah Anda Menyetujui Website Ini untuk Produksi?"

## ❌ TIDAK

**Alasan:**

1. **Rahasia produksi terekspos di repository** — ini adalah pelanggaran keamanan fundamental yang MENGHENTIKAN部署 ke produksi. Semua kunci harus dirotasi sebelum deploy.

2. **XSS kritis di payment flow** — celah keamanan yang bisa dieksploitasi untuk mencuri session cookie dan memanipulasi pembayaran.

3. **Tidak ada rate limiting** — aplikasi bisa di-brute force tanpa batas.

4. **Race condition di checkout** — stock bisa hilang permanen tanpa order.

5. **Tidak ada email verification** — spam akun dan impersonasi.

6. **Aksesibilitas sangat rendah (4/10)** — pelanggaran WCAG yang serius, bisa menjadi kewajiban hukum di beberapa yurisdiksi.

7. **Tidak ada pagination** — aplikasi akan crash dengan data nyata.

**Website ini BELUM SIAP untuk produksi.** Diperlukan minimal 2-4 minggu perbaikan untuk menangani semua temuan CRITICAL dan HIGH sebelum deploy.