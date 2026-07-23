import { NextResponse } from 'next/server';

/**
 * GET /api/payment/test
 * Test status simulasi pembayaran
 */
export async function GET() {
  return NextResponse.json({
    status: 'SUCCESS',
    mode: 'simulated',
    message: 'Pembayaran menggunakan mode simulasi (tanpa payment gateway nyata)',
    timestamp: new Date().toISOString(),
  });
}
