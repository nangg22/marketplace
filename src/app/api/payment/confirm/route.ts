import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { updateOrderStatus } from '@/lib/orders';

/**
 * POST /api/payment/confirm
 *
 * Endpoint untuk konfirmasi pembayaran QRIS/Kartu Kredit.
 * Dipanggil dari halaman simulasi ketika user klik "Konfirmasi Pembayaran".
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Silakan login terlebih dahulu.' },
        { status: 401 }
      );
    }

    const customerId = (session.user as any).id;
    const { order_id } = await req.json();

    if (!order_id) {
      return NextResponse.json(
        { error: 'Order ID diperlukan.' },
        { status: 400 }
      );
    }

    // Ambil order dari database
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, order_id))
      .limit(1);

    if (!order) {
      return NextResponse.json(
        { error: 'Order tidak ditemukan.' },
        { status: 404 }
      );
    }

    // Pastikan order milik user ini
    if (order.customerId !== customerId) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    // Cek status order
    if (order.status !== 'pending') {
      return NextResponse.json(
        { error: `Order sudah dalam status "${order.status}".` },
        { status: 400 }
      );
    }

    // Cek metode pembayaran
    if (!['qris', 'credit'].includes(order.paymentMethod)) {
      return NextResponse.json(
        { error: 'Metode pembayaran ini tidak memerlukan konfirmasi online.' },
        { status: 400 }
      );
    }

    // Tandai order sebagai paid
    await updateOrderStatus(order_id, 'paid', 'Pembayaran berhasil dikonfirmasi');

    return NextResponse.json({
      success: true,
      message: 'Pembayaran berhasil.',
      clearCart: true,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Gagal memproses konfirmasi pembayaran.' },
      { status: 500 }
    );
  }
}
