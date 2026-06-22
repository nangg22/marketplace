import { pgTable, uuid, varchar, text, integer, pgEnum } from 'drizzle-orm/pg-core';

// 1. Definisikan Hak Akses (Role)
export const roleEnum = pgEnum('role', ['customer', 'seller', 'admin']);

// 2. Tabel Pengguna (Akun Login)
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(), // Akan menyimpan password acak
  role: roleEnum('role').default('customer').notNull(),
});

// 3. Tabel Produk (Sama seperti sebelumnya)
export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  price: integer('price').notNull(),
  description: text('description'),
  imageUrl: varchar('image_url', { length: 255 }),
});

// 4. Tabel Pesanan (Orders)
export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerName: varchar('customer_name', { length: 255 }).notNull(),
  totalAmount: integer('total_amount').notNull(),
  status: varchar('status', { length: 50 }).default('pending').notNull(),
  createdAt: varchar('created_at', { length: 255 }).notNull(), // Sederhana pakai varchar date ISO
});

// 5. Tabel Item Pesanan (Order Items)
export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').references(() => orders.id).notNull(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  quantity: integer('quantity').notNull(),
  priceAtPurchase: integer('price_at_purchase').notNull(),
});