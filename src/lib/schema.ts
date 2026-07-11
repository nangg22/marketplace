import { pgTable, uuid, varchar, text, integer, pgEnum, timestamp, boolean, real, unique } from 'drizzle-orm/pg-core';


// 1. Definisikan Hak Akses (Role)
export const roleEnum = pgEnum('role', ['customer', 'seller', 'admin']);

// 2. Tabel Pengguna (Akun Login)
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  role: roleEnum('role').default('customer').notNull(),

  // Moderasi oleh admin
  isBanned: boolean('is_banned').notNull().default(false),
  banReason: text('ban_reason'),

  // Biodata profil
  bio: text('bio'),
  avatarUrl: varchar('avatar_url', { length: 255 }),
  gender: varchar('gender', { length: 20 }),
  birthDate: varchar('birth_date', { length: 20 }),

  // Info toko (khusus seller)
  storeName: varchar('store_name', { length: 255 }),
  storeDescription: text('store_description'),

  // Data alamat pengiriman customer
  recipientName: varchar('recipient_name', { length: 255 }),
  phone: varchar('phone', { length: 30 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  province: varchar('province', { length: 100 }),
  postalCode: varchar('postal_code', { length: 10 }),
});

// 3. Tabel Produk ( )
export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),

  sellerId: uuid('seller_id')
    .references(() => users.id)
    .notNull(),

  name: varchar('name', { length: 255 }).notNull(),
  price: integer('price').notNull(),
  description: text('description'),
  imageUrl: varchar('image_url', { length: 255 }),
  category: varchar('category', { length: 100 }).notNull().default('Lainnya'),

  stock: integer('stock').notNull().default(0),
  isAvailable: boolean('is_available').notNull().default(true),

  // Moderasi oleh admin
  isSuspended: boolean('is_suspended').notNull().default(false),
  suspendReason: text('suspend_reason'),

  // Rating dan review
  rating: real('rating').default(0).notNull(),
  ratingCount: integer('rating_count').default(0).notNull(),
  reviewCount: integer('review_count').default(0).notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 4. Tabel Pesanan (Orders)
export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),

  customerId: uuid('customer_id')
    .references(() => users.id)
    .notNull(),

  customerName: varchar('customer_name', { length: 255 }).notNull(),
  totalAmount: integer('total_amount').notNull(),
  status: varchar('status', { length: 50 }).default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),

  // Alamat lengkap saat order dibuat
  recipientName: varchar('recipient_name', { length: 255 }),
  phone: varchar('phone', { length: 30 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  province: varchar('province', { length: 100 }),
  postalCode: varchar('postal_code', { length: 10 }),

  paymentMethod: varchar('payment_method', { length: 30 })
    .default('qris')
    .notNull(),

  shippingRecipientName: varchar('shipping_recipient_name', {
    length: 255,
  }),
  shippingPhone: varchar('shipping_phone', { length: 30 }),
  shippingAddress: text('shipping_address'),
  shippingCity: varchar('shipping_city', { length: 100 }),
  shippingProvince: varchar('shipping_province', { length: 100 }),
  shippingPostalCode: varchar('shipping_postal_code', { length: 10 }),
});

// 5. Tabel Item Pesanan (Order Items)
export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').references(() => orders.id).notNull(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  quantity: integer('quantity').notNull(),
  priceAtPurchase: integer('price_at_purchase').notNull(),
});

// Tabel Review Produk
export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    productId: uuid('product_id')
      .references(() => products.id, { onDelete: 'cascade' })
      .notNull(),

    customerId: uuid('customer_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),

    // Untuk fitur Verified Purchase
    orderId: uuid('order_id')
      .references(() => orders.id, { onDelete: 'set null' }),
    isVerifiedPurchase: boolean('is_verified_purchase').default(false).notNull(),

    rating: real('rating').notNull(),
    title: varchar('title', { length: 150 }),
    reviewText: text('review_text'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // Satu customer hanya boleh 1 review per produk
    uniqueCustomerProduct: unique().on(table.customerId, table.productId),
  })
);

// Tabel Foto Review Produk
export const reviewImages = pgTable('review_images', {
  id: uuid('id').defaultRandom().primaryKey(),

  reviewId: uuid('review_id')
    .references(() => reviews.id)
    .notNull(),

  imageUrl: varchar('image_url', { length: 255 }).notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});