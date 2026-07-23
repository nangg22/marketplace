import { NextResponse } from 'next/server';

/**
 * Webhook Payment (Simulasi)
 *
 * Endpoint ini sudah tidak digunakan untuk pemrosesan pembayaran.
 * Pembayaran sekarang diproses langsung melalui /api/payment/simulate.
 * Endpoint ini dipertahankan agar tidak error jika ada request lama.
 */
export async function POST(req: Request) {
  return NextResponse.json({ status: 'success', message: 'Simulated mode - webhook ignored' }, { status: 200 });
}

export async function GET() {
  return NextResponse.json({ status: 'ok', message: 'Webhook endpoint active (simulated mode)' });
}
