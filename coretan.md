src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.jsx                    # Login
│   │   └── register/page.jsx                 # Daftar
│   │
│   ├── (public)/
│   │   ├── page.jsx                          # Homepage
│   │   ├── search/page.jsx                   # Pencarian Produk
│   │   ├── products/page.jsx                 # Semua Produk
│   │   └── products/[id]/page.jsx            # Detail Produk
│   │
│   ├── customer/
│   │   ├── cart/page.jsx                     # Keranjang Belanja
│   │   ├── checkout/page.jsx                 # Proses Pembayaran & Tampilan QRIS
│   │   ├── orders/page.jsx                   # Riwayat Transaksi Pembeli
│   │   └── orders/[id]/page.jsx              # Detail Transaksi Pembeli
│   │
│   ├── seller/
│   │   ├── dashboard/page.jsx                  # Dashboard Penjual
│   │   ├── products/page.jsx                   # Semua Produk Milik Penjual
│   │   ├── products/create/page.jsx            # Buat Produk
│   │   ├── products/[id]/edit/page.jsx         # Edit Produk
│   │   └── orders/page.jsx                     # Riwayat Transaksi Penjual
│   │
│   ├── admin/
│   │   ├── dashboard/page.jsx                  # Dashboard Admin
│   │   ├── users/page.jsx                      # Daftar User
│   │   ├── products/page.jsx                   # Daftar Produk
│   │   └── transactions/page.jsx             # Daftar Transaksi
│   │
│   └── api/
│       ├── auth/[...nextauth]/route.js       # API Auth
│       ├── products/route.js                   # API Produk
│       ├── products/[id]/route.js              # API Produk
│       ├── seller/products/route.js            # API Seller Produk
│       ├── seller/products/[id]/route.js       # API Seller Produk
│       ├── checkout/route.js                   # API Checkout
│       └── webhook/payment/route.js            # API Webhook Pembayaran
│
├── components/
│   ├── Navbar.jsx                              # Navbar
│   ├── ProductCard.jsx                         # Kartu Produk
│   ├── Button.jsx                              # Tombol
│   └── Footer.jsx                              # Footer
│
├── lib/
│   ├── db.js                                   # Konfigurasi Database
│   ├── auth.js                                   # Konfigurasi Auth
│   └── midtrans.js                             # Konfigurasi Midtrans
│
└── middleware.js                               # Untuk membatasi akses halaman