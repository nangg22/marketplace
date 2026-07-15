import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { orders } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { updateOrderStatus } from '@/lib/orders';
import { restoreStockOnCancel } from '@/lib/cancel-order';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Menerima webhook dari Midtrans:", body);

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status
    } = body;

    // 1. Validasi input dasar
    if (!order_id || !status_code || !gross_amount || !signature_key || !transaction_status) {
      return NextResponse.json({ status: 'error', message: 'Missing required fields' }, { status: 400 });
    }

    // 2. Verifikasi Signature Key Midtrans
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
       console.error("MIDTRANS_SERVER_KEY tidak dikonfigurasi - webhook ditolak");
       return NextResponse.json({ status: 'error', message: 'Payment gateway not configured' }, { status: 503 });
    }

    // Hitung signature: SHA512(order_id + status_code + gross_amount + server_key)
    const hash = crypto.createHash('sha512');
    const calculatedSignature = hash.update(order_id + status_code + gross_amount + serverKey).digest('hex');

    if (calculatedSignature !== signature_key) {
        console.error(`Invalid Signature for order ${order_id}`);
        return NextResponse.json({ status: 'error', message: 'Invalid Signature' }, { status: 403 });
    }

    // 3. Verifikasi order ada di database
    const [order] = await db
      .select({ id: orders.id, status: orders.status })
      .from(orders)
      .where(eq(orders.id, order_id))
      .limit(1);

    if (!order) {
      console.error(`Order ${order_id} not found`);
      return NextResponse.json({ status: 'error', message: 'Order not found' }, { status: 404 });
    }

    // 4. Cegah double-processing jika order sudah final
    if (order.status === 'completed' || order.status === 'cancelled' || order.status === 'refunded') {
      console.log(`Order ${order_id} already in final status: ${order.status}, skipping`);
      return NextResponse.json({ status: 'success', message: 'Order already processed' }, { status: 200 });
    }

    // 5. Tentukan status baru untuk database berdasarkan respons Midtrans
    let newStatus = 'pending';

    if (transaction_status == 'capture') {
        if (fraud_status == 'accept') {
            newStatus = 'paid';
        }
    } else if (transaction_status == 'settlement') {
        newStatus = 'paid';
    } else if (
        transaction_status == 'cancel' ||
        transaction_status == 'deny' ||
        transaction_status == 'expire'
    ) {
        newStatus = 'failed';
    } else if (transaction_status == 'pending') {
        newStatus = 'pending';
    }

    // 6. Jika pembayaran gagal (cancel/deny/expire), kembalikan stok
    if (newStatus === 'failed') {
      // Hanya kembalikan stok jika order belum shipped/delivered
      if (order.status !== 'shipped' && order.status !== 'delivered') {
        await restoreStockOnCancel(order_id);
      }
    }

    // 7. Update status pesanan di database
    await updateOrderStatus(order_id, newStatus, 'Webhook Midtrans');
    console.log(`Order ${order_id} updated to ${newStatus}`);

    return NextResponse.json({ status: 'success', message: 'Webhook processed' }, { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
  }
}
