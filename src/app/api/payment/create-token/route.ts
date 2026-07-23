import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders, users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/payment/create-token
 *
 * Simulasi pembayaran — langsung menandai order sebagai "paid"
 * tanpa integrasi payment gateway nyata.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customerId = (session.user as any).id;
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID diperlukan' }, { status: 400 });
    }

    // Ambil order dari database
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 });
    }

    // Pastikan order milik user ini
    if (order.customerId !== customerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Hanya bisa bayar untuk order pending dengan metode online
    if (order.status !== 'pending') {
      return NextResponse.json(
        { error: `Order sudah dalam status "${order.status}", tidak perlu dibayar ulang.` },
        { status: 400 }
      );
    }

    if (!['qris', 'credit'].includes(order.paymentMethod)) {
      return NextResponse.json(
        { error: 'Metode pembayaran ini tidak memerlukan pembayaran online.' },
        { status: 400 }
      );
    }

    // Redirect ke halaman simulasi pembayaran
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const redirectUrl = `${baseUrl}/api/payment/simulate?order_id=${order.id}&amount=${order.totalAmount}`;

    return NextResponse.json({
      redirect_url: redirectUrl,
      token: `SIMULATED_${order.id}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Gagal memproses pembayaran' },
      { status: 500 }
    );
  }
}
