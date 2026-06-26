import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { orders } from '@/lib/schema';
import { eq } from 'drizzle-orm';

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

    // 1. Verifikasi Signature Key Midtrans
    const serverKey = process.env.MIDTRANS_SERVER_KEY || ''; // Ambil dari env
    if (!serverKey) {
       console.warn("MIDTRANS_SERVER_KEY tidak ditemukan di env, mem-bypass verifikasi (TIDAK AMAN UNTUK PRODUKSI)");
    } else {
        const hash = crypto.createHash('sha512');
        const calculatedSignature = hash.update(order_id + status_code + gross_amount + serverKey).digest('hex');
        
        if (calculatedSignature !== signature_key) {
            console.error("Invalid Signature Key");
            return NextResponse.json({ status: 'error', message: 'Invalid Signature' }, { status: 403 });
        }
    }

    // 2. Tentukan status baru untuk database berdasarkan respons Midtrans
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

    // 3. Update status pesanan di database
    if (order_id) {
        await db.update(orders)
            .set({ status: newStatus })
            .where(eq(orders.id, order_id));
            
        console.log(`Order ${order_id} updated to ${newStatus}`);
    }

    return NextResponse.json({ status: 'success', message: 'Webhook processed' }, { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
  }
}
