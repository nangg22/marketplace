# MallPedia — TestSprite Test Specification
# Halaman: /seller/products (Seller Products Dashboard)
# Generated: Juni 2026
# Stack: Next.js 16, TypeScript, Drizzle ORM, Neon PostgreSQL, NextAuth v4

---

## Project Context

```
url: http://localhost:3000
auth_required: true
role_required: seller
test_user:
  email: seller@test.com
  password: password123
  role: seller
```

---

## 1. Authentication & Authorization Tests

### TEST-AUTH-001: Redirect jika belum login
```
name: Unauthenticated user redirected from seller products
steps:
  - Clear all cookies and session
  - Navigate to /seller/products
expect:
  - URL redirected to /login
  - /seller/products not accessible
```

### TEST-AUTH-002: Redirect jika role customer
```
name: Customer role cannot access seller products
steps:
  - Login with role: customer
  - Navigate to /seller/products
expect:
  - URL redirected away from /seller/products
  - Not showing seller dashboard content
```

### TEST-AUTH-003: Seller dapat akses halaman
```
name: Seller role can access seller products page
steps:
  - Login with role: seller
  - Navigate to /seller/products
expect:
  - Page loads successfully (HTTP 200)
  - H1 contains "Produk Saya"
  - "Dashboard" badge visible
  - "Tambah Produk" button visible
```

---

## 2. Page Layout & UI Tests

### TEST-UI-001: Header section render
```
name: Page header renders correctly
steps:
  - Login as seller
  - Navigate to /seller/products
expect:
  - Navbar component visible
  - H1 heading contains "Produk Saya"
  - Subtitle shows "{n} produk terdaftar"
  - "➕ Tambah Produk" button visible and clickable
```

### TEST-UI-002: Empty state tampil ketika tidak ada produk
```
name: Empty state shown when seller has no products
precondition: Seller account has zero products
steps:
  - Login as seller with no products
  - Navigate to /seller/products
expect:
  - "📭" emoji visible
  - "Toko Anda Masih Kosong" text visible
  - "Belum ada produk yang dijual. Ayo tambahkan sekarang!" visible
  - "Mulai Jualan" button visible
  - Product grid NOT visible
```

### TEST-UI-003: Product grid tampil ketika ada produk
```
name: Product grid renders when products exist
precondition: Seller account has at least 1 product
steps:
  - Login as seller
  - Navigate to /seller/products
expect:
  - Product grid visible
  - Empty state NOT visible
  - Each card contains:
    - Product thumbnail area (h-48)
    - Product name (h2)
    - Price in Rupiah format (Rp X.XXX)
    - Stock info "📦 Stok: {n}"
    - "✏️ Edit" button
    - "🗑️ Hapus" button
```

### TEST-UI-004: Thumbnail gambar tampil
```
name: Product image thumbnail renders when imageUrl exists
precondition: Product has imageUrl set
steps:
  - Login as seller
  - Navigate to /seller/products
expect:
  - next/image element visible inside thumbnail area
  - Image src matches product imageUrl
  - Image has object-cover class
  - Placeholder "📦 Belum ada foto" NOT visible
```

### TEST-UI-005: Placeholder tampil ketika tidak ada gambar
```
name: Placeholder renders when imageUrl is null
precondition: Product has imageUrl as null
steps:
  - Login as seller
  - Navigate to /seller/products
expect:
  - "📦" emoji visible in thumbnail area
  - "Belum ada foto" text visible
  - next/image element NOT present for this card
```

### TEST-UI-006: Badge status Aktif
```
name: Active badge shows for available products
precondition: Product has isAvailable = true
steps:
  - Login as seller
  - Navigate to /seller/products
expect:
  - "✅ Aktif" badge visible on card
  - Badge has green background (bg-green-400)
  - "⏸️ Nonaktif" badge NOT visible
```

### TEST-UI-007: Badge status Nonaktif
```
name: Inactive badge shows for unavailable products
precondition: Product has isAvailable = false
steps:
  - Login as seller
  - Navigate to /seller/products
expect:
  - "⏸️ Nonaktif" badge visible on card
  - Badge has gray background (bg-gray-400)
  - "✅ Aktif" badge NOT visible
```

### TEST-UI-008: Rating hanya tampil jika ada review
```
name: Rating info only visible when ratingCount > 0
steps:
  - Login as seller
  - Navigate to /seller/products
  - Find product with ratingCount = 0
expect:
  - "⭐" rating text NOT visible for that product
  - "📦 Stok:" still visible
```

### TEST-UI-009: Format harga Rupiah benar
```
name: Price formatted correctly in Indonesian Rupiah
precondition: Product with price 150000
steps:
  - Login as seller
  - Navigate to /seller/products
expect:
  - Price displayed as "Rp 150.000" (dot as thousand separator)
  - NOT displayed as "Rp 150,000" or "150000"
```

---

## 3. Navigation Tests

### TEST-NAV-001: Tombol Tambah Produk navigasi
```
name: Add product button navigates to create page
steps:
  - Login as seller
  - Navigate to /seller/products
  - Click "➕ Tambah Produk" button
expect:
  - URL changes to /seller/products/create
  - Create product form visible
```

### TEST-NAV-002: Tombol Edit navigasi ke halaman edit
```
name: Edit button navigates to edit page with correct product id
precondition: Seller has at least 1 product with known ID
steps:
  - Login as seller
  - Navigate to /seller/products
  - Click "✏️ Edit" on first product card
expect:
  - URL changes to /seller/products/{productId}/edit
  - Edit form shows correct product data (name, price pre-filled)
```

### TEST-NAV-003: Empty state Mulai Jualan navigasi
```
name: Empty state CTA button navigates to create page
precondition: Seller has zero products
steps:
  - Login as seller with no products
  - Navigate to /seller/products
  - Click "Mulai Jualan" button
expect:
  - URL changes to /seller/products/create
```

---

## 4. Delete Functionality Tests

### TEST-DELETE-001: Klik Hapus muncul dialog konfirmasi
```
name: Delete button shows confirmation dialog
steps:
  - Login as seller
  - Navigate to /seller/products
  - Click "🗑️ Hapus" button on any product
expect:
  - Browser confirm dialog appears
  - Dialog message contains product name
  - Dialog message contains "Tindakan ini tidak bisa dibatalkan"
```

### TEST-DELETE-002: Cancel pada dialog tidak menghapus produk
```
name: Canceling confirmation dialog does not delete product
steps:
  - Login as seller
  - Navigate to /seller/products
  - Click "🗑️ Hapus" on product
  - Click "Cancel" on confirmation dialog
expect:
  - Product still visible in list
  - Product count unchanged
  - No redirect occurs
  - "🗑️ Hapus" button still shows (not "⏳ Menghapus...")
```

### TEST-DELETE-003: Konfirmasi OK menghapus produk
```
name: Confirming deletion removes product from list
steps:
  - Login as seller
  - Navigate to /seller/products
  - Note current product count
  - Click "🗑️ Hapus" on first product
  - Click "OK" on confirmation dialog
expect:
  - Button changes to "⏳ Menghapus..." during processing
  - Page redirects to /seller/products
  - Deleted product no longer visible
  - Product count decreases by 1
```

### TEST-DELETE-004: Seller tidak bisa hapus produk seller lain
```
name: Seller cannot delete another seller's product
precondition: Two seller accounts exist (sellerA and sellerB), each with products
steps:
  - Login as sellerA
  - Manually call DELETE API with productId owned by sellerB
expect:
  - API returns error or no-op
  - SellerB's product still exists in database
  - sellerA's product list unchanged
```

### TEST-DELETE-005: Tombol disabled saat proses menghapus
```
name: Delete button disabled during pending state
steps:
  - Login as seller
  - Navigate to /seller/products
  - Click "🗑️ Hapus" and confirm immediately
expect:
  - Button shows "⏳ Menghapus..."
  - Button has disabled attribute
  - Button has opacity-50 and cursor-not-allowed classes
```

---

## 5. Data Isolation Tests

### TEST-ISO-001: Seller hanya melihat produknya sendiri
```
name: Seller only sees their own products
precondition: SellerA and SellerB both have products in database
steps:
  - Login as sellerA
  - Navigate to /seller/products
expect:
  - Only sellerA's products visible
  - SellerB's products NOT visible
  - Product count matches sellerA's product count in DB
```

### TEST-ISO-002: Data produk akurat dari database
```
name: Product data matches database records
precondition: Known product with name "Test Produk", price 75000, stock 10
steps:
  - Login as seller who owns the product
  - Navigate to /seller/products
expect:
  - Card with "Test Produk" visible
  - Price shows "Rp 75.000"
  - "📦 Stok: 10" visible
```

---

## 6. Responsive Design Tests

### TEST-RESP-001: Layout mobile (375px)
```
name: Single column grid on mobile viewport
viewport: 375x812
steps:
  - Login as seller
  - Navigate to /seller/products
expect:
  - Product grid shows 1 column
  - Cards full width
  - Navbar visible and functional
  - "Tambah Produk" button accessible
```

### TEST-RESP-002: Layout tablet (768px)
```
name: Two column grid on tablet viewport
viewport: 768x1024
steps:
  - Login as seller
  - Navigate to /seller/products
expect:
  - Product grid shows 2 columns (sm:grid-cols-2)
  - Cards properly sized
```

### TEST-RESP-003: Layout desktop (1280px)
```
name: Three column grid on desktop viewport
viewport: 1280x800
steps:
  - Login as seller
  - Navigate to /seller/products
expect:
  - Product grid shows 3 columns (lg:grid-cols-3)
  - Decorative emojis visible (🏪, 📦)
  - Header row shows horizontal layout (flex-row)
```

---

## 7. Performance Tests

### TEST-PERF-001: Page load time
```
name: Page loads within acceptable time
steps:
  - Login as seller
  - Navigate to /seller/products
  - Measure Time to First Byte (TTFB)
  - Measure Largest Contentful Paint (LCP)
expect:
  - TTFB < 800ms
  - LCP < 2500ms
  - No layout shift (CLS < 0.1)
```

### TEST-PERF-002: Image loading optimized
```
name: Images use next/image optimization
precondition: Product has imageUrl set
steps:
  - Login as seller
  - Navigate to /seller/products
  - Inspect image elements
expect:
  - Images rendered via next/image component
  - Images have sizes attribute set
  - Images lazy loaded (loading="lazy" or fill prop)
  - No large unoptimized images
```

---

## 8. Error Handling Tests

### TEST-ERR-001: Database connection error
```
name: Page handles DB error gracefully
precondition: Simulate database connection failure
steps:
  - Set invalid DATABASE_URL
  - Navigate to /seller/products as seller
expect:
  - Error boundary or Next.js error page shown
  - No raw error stack trace exposed to user
  - No database credentials visible in response
```

### TEST-ERR-002: Invalid product ID pada delete
```
name: Delete with non-existent product ID fails gracefully
steps:
  - Login as seller
  - Call handleDelete with random UUID not in database
expect:
  - No server crash
  - Page remains functional
  - No error shown to user (silent no-op is acceptable)
```

---

## 9. Security Tests

### TEST-SEC-001: Unauthenticated API tidak bisa delete
```
name: Delete action requires valid session
steps:
  - Without logging in, POST to server action handleDelete with valid productId
expect:
  - Action returns early (no session check failure exposed)
  - Product NOT deleted from database
```

### TEST-SEC-002: CSRF tidak bisa bypass konfirmasi
```
name: Server action only accessible via proper form submission
steps:
  - Login as seller
  - Attempt to call handleDelete directly via fetch without proper origin
expect:
  - Next.js server action CSRF protection active
  - Request rejected or ignored
```

### TEST-SEC-003: Seller ID dari session, bukan dari client
```
name: sellerId taken from server session, not user input
steps:
  - Login as sellerA
  - Intercept delete request
  - Modify sellerId in request to sellerB's ID
expect:
  - Server uses session.user.id, ignores any client-provided sellerId
  - SellerB's products unaffected
```

---

## Test Summary

| Category | Tests | Priority |
|---|---|---|
| Authentication & Authorization | 3 | P0 |
| Page Layout & UI | 9 | P1 |
| Navigation | 3 | P1 |
| Delete Functionality | 5 | P0 |
| Data Isolation | 2 | P0 |
| Responsive Design | 3 | P2 |
| Performance | 2 | P2 |
| Error Handling | 2 | P1 |
| Security | 3 | P0 |
| **Total** | **32** | |

## Notes untuk TestSprite

- Semua test P0 harus pass sebelum deploy ke production
- TEST-DELETE-004 dan TEST-SEC-003 butuh dua seller account di seed data
- TEST-ERR-001 butuh environment variable manipulation — skip di CI/CD normal
- Image tests (TEST-UI-004, TEST-PERF-002) butuh product dengan imageUrl valid dari i.imgur.com atau UploadThing
