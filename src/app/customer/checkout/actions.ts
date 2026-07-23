'use server';

import { db } from '@/lib/db';
import { orders, orderItems, products, users } from '@/lib/schema';
import { requireRole } from '@/lib/auth-guard';
import { eq, inArray, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { notifySellerNewOrder } from '@/lib/notifications';

type CartItemInput = {
  id: string;
  quantity: number;
};

type PaymentMethod = 'qris' | 'credit' | 'cod';

type AddressInput = {
  recipientName: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
};

function isValidPaymentMethod(
  paymentMethod: string
): paymentMethod is PaymentMethod {
  return ['qris', 'credit', 'cod'].includes(paymentMethod);
}

export async function getMyShippingAddress() {
  const auth: any = await requireRole(['customer']);

  if (!auth.ok) {
    return {
      success: false,
      error: auth.message,
    };
  }

  const customerId = (auth.session?.user as any)?.id;

  if (!customerId) {
    return {
      success: false,
      error: 'Data customer tidak ditemukan.',
    };
  }

  const [customer] = await db
    .select({
      recipientName: users.recipientName,
      phone: users.phone,
      address: users.address,
      city: users.city,
      province: users.province,
      postalCode: users.postalCode,
    })
    .from(users)
    .where(eq(users.id, customerId))
    .limit(1);

  return {
    success: true,
    address: {
      recipientName: customer?.recipientName || '',
      phone: customer?.phone || '',
      address: customer?.address || '',
      city: customer?.city || '',
      province: customer?.province || '',
      postalCode: customer?.postalCode || '',
    },
  };
}

export async function saveShippingAddress(data: AddressInput) {
  const auth: any = await requireRole(['customer']);

  if (!auth.ok) {
    return {
      success: false,
      error: auth.message,
    };
  }

  const customerId = (auth.session?.user as any)?.id;

  if (!customerId) {
    return {
      success: false,
      error: 'Data customer tidak ditemukan.',
    };
  }

  const cleanData = {
    recipientName: data.recipientName.trim(),
    phone: data.phone.trim(),
    address: data.address.trim(),
    city: data.city.trim(),
    province: data.province.trim(),
    postalCode: data.postalCode.trim(),
  };

  if (Object.values(cleanData).some((value) => value.length === 0)) {
    return {
      success: false,
      error: 'Semua data alamat wajib diisi.',
    };
  }

  await db
    .update(users)
    .set(cleanData)
    .where(eq(users.id, customerId));

  revalidatePath('/customer/checkout');

  return {
    success: true,
    address: cleanData,
  };
}

export async function createOrder(
  items: CartItemInput[],
  paymentMethod: PaymentMethod
) {
  const auth: any = await requireRole(['customer']);

  if (!auth.ok) {
    return {
      success: false,
      error: auth.message,
      status: auth.status,
    };
  }

  const customerId = (auth.session?.user as any)?.id;
  const customerName =
    (auth.session?.user as any)?.name || 'Pelanggan MallPedia';

  if (!customerId) {
    return {
      success: false,
      error: 'Data customer tidak ditemukan.',
      status: 401,
    };
  }

  if (!isValidPaymentMethod(paymentMethod)) {
    return {
      success: false,
      error: 'Metode pembayaran tidak valid.',
      status: 400,
    };
  }

  if (items.length === 0) {
    return {
      success: false,
      error: 'Keranjang belanja masih kosong.',
      status: 400,
    };
  }

  // Ambil alamat customer yang sudah disimpan
  const [customer] = await db
    .select({
      recipientName: users.recipientName,
      phone: users.phone,
      address: users.address,
      city: users.city,
      province: users.province,
      postalCode: users.postalCode,
    })
    .from(users)
    .where(eq(users.id, customerId))
    .limit(1);

  const addressComplete =
    customer?.recipientName &&
    customer?.phone &&
    customer?.address &&
    customer?.city &&
    customer?.province &&
    customer?.postalCode;

  if (!addressComplete) {
    return {
      success: false,
      error: 'Lengkapi alamat pengiriman sebelum checkout.',
      status: 400,
    };
  }

  const productIds = [...new Set(items.map((item) => item.id))];

  const dbProducts = await db
    .select({
      id: products.id,
      price: products.price,
    })
    .from(products)
    .where(inArray(products.id, productIds));

  const productMap = new Map(
    dbProducts.map((product) => [product.id, product.price])
  );

  let serverTotalAmount = 0;

  const verifiedItems: {
    id: string;
    quantity: number;
    price: number;
  }[] = [];

  for (const item of items) {
    const dbPrice = productMap.get(item.id);

    if (dbPrice === undefined) {
      return {
        success: false,
        error: 'Ada produk yang sudah tidak tersedia.',
        status: 404,
      };
    }

    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      return {
        success: false,
        error: 'Jumlah produk tidak valid.',
        status: 400,
      };
    }

    serverTotalAmount += dbPrice * item.quantity;

    verifiedItems.push({
      id: item.id,
      quantity: item.quantity,
      price: dbPrice,
    });
  }

  // Cek stok tersedia untuk setiap produk
  const dbProductsWithStock = await db
    .select({
      id: products.id,
      stock: products.stock,
    })
    .from(products)
    .where(inArray(products.id, productIds));

  const stockMap = new Map(
    dbProductsWithStock.map((p) => [p.id, p.stock])
  );

  for (const item of verifiedItems) {
    const currentStock = stockMap.get(item.id);
    if (currentStock === undefined || currentStock < item.quantity) {
      return {
        success: false,
        error: `Stok tidak mencukupi untuk produk yang dipilih. Stok tersisa: ${currentStock ?? 0}`,
        status: 400,
      };
    }
  }

  // Status awal: pending_cod untuk COD, pending untuk metode lain
  const initialStatus = paymentMethod === 'cod' ? 'pending_cod' : 'pending';

  // Wrap stock decrement + order creation dalam satu transaksi
  const result = await db.transaction(async (tx) => {
    // Kurangi stok secara atomic untuk setiap produk
    for (const item of verifiedItems) {
      const stockResult = await tx
        .update(products)
        .set({ stock: sql`${products.stock} - ${item.quantity}` })
        .where(
          sql`${products.id} = ${item.id} AND ${products.stock} >= ${item.quantity}`
        )
        .returning({ id: products.id });

      if (stockResult.length === 0) {
        throw new Error('STOCK_CHANGED');
      }
    }

    const [newOrder] = await tx
      .insert(orders)
      .values({
        customerId,
        customerName,
        totalAmount: serverTotalAmount,
        status: initialStatus,
        paymentMethod,

        shippingRecipientName: customer.recipientName,
        shippingPhone: customer.phone,
        shippingAddress: customer.address,
        shippingCity: customer.city,
        shippingProvince: customer.province,
        shippingPostalCode: customer.postalCode,
      })
      .returning();

    if (!newOrder) {
      throw new Error('ORDER_FAILED');
    }

    const itemsToInsert = verifiedItems.map((item) => ({
      orderId: newOrder.id,
      productId: item.id,
      quantity: item.quantity,
      priceAtPurchase: item.price,
    }));

    await tx.insert(orderItems).values(itemsToInsert);

    return newOrder;
  });

  if (!result) {
    return {
      success: false,
      error: 'Stok produk berubah saat proses checkout. Silakan coba lagi.',
      status: 400,
    };
  }

  const newOrder = result;

  // === KIRIM NOTIFIKASI KE SELLER ===
  // Ambil sellerId dari setiap produk yang dipesan
  const productsWithSeller = await db
    .select({ id: products.id, sellerId: products.sellerId })
    .from(products)
    .where(inArray(products.id, productIds));

  // Group by sellerId untuk kirim notifikasi ke masing-masing seller
  const sellerProductMap = new Map<string, string[]>();
  for (const p of productsWithSeller) {
    const existing = sellerProductMap.get(p.sellerId) || [];
    sellerProductMap.set(p.sellerId, [...existing, p.id]);
  }

  // Kirim notifikasi ke setiap seller
  for (const [sellerId, sellerProductIds] of sellerProductMap) {
    // Hitung total yang dibeli produk seller ini
    const sellerTotal = verifiedItems
      .filter((item) => sellerProductIds.includes(item.id))
      .reduce((sum, item) => sum + item.price * item.quantity, 0);

    await notifySellerNewOrder(
      newOrder.id,
      sellerId,
      customerName,
      sellerTotal
    );
  }

  // === SIMULASI PEMBAYARAN ===
  // Untuk QRIS dan Kartu: redirect ke halaman simulasi yang akan auto-complete
  if (['qris', 'credit'].includes(paymentMethod)) {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const redirectUrl = `${baseUrl}/api/payment/simulate?order_id=${newOrder.id}&amount=${serverTotalAmount}`;

    return {
      success: true,
      orderId: newOrder.id,
      paymentMethod,
      redirect_url: redirectUrl,
    };
  }

  // === COD: Tidak perlu redirect ===
  return {
    success: true,
    orderId: newOrder.id,
    paymentMethod,
    redirect_url: null,
  };
}
