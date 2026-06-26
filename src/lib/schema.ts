import { pgTable, uuid, varchar, text, integer, pgEnum, timestamp, boolean, real } from 'drizzle-orm/pg-core';


// 1. Definisikan Hak Akses (Role)
export const roleEnum = pgEnum('role', ['customer', 'seller', 'admin']);

// 2. Tabel Pengguna (Akun Login)
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  role: roleEnum('role').default('customer').notNull(),

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

  stock: integer('stock').notNull().default(0),
  isAvailable: boolean('is_available').notNull().default(true),

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
export const reviews = pgTable('reviews', {
  id: uuid('id').defaultRandom().primaryKey(),

  productId: uuid('product_id')
    .references(() => products.id)
    .notNull(),

  customerId: uuid('customer_id')
    .references(() => users.id)
    .notNull(),

  rating: real('rating').notNull(),
  title: varchar('title', { length: 150 }),
  reviewText: text('review_text'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tabel Foto Review Produk
export const reviewImages = pgTable('review_images', {
  id: uuid('id').defaultRandom().primaryKey(),

  reviewId: uuid('review_id')
    .references(() => reviews.id)
    .notNull(),

  imageUrl: varchar('image_url', { length: 255 }).notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});