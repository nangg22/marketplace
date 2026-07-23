import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { refundRequests, orders } from "@/lib/schema";
import { and, eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Harus login" }, { status: 401 });
    }

    const { orderId, reason, evidenceUrl } = await req.json();

    if (!orderId || !reason || reason.length < 20) {
      return NextResponse.json({ error: "Data tidak valid. Alasan harus minimal 20 karakter." }, { status: 400 });
    }

    // pastikan order ini benar milik buyer & sudah completed
    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.customerId, session.user.id)))
      .limit(1);

    if (!order) return NextResponse.json({ error: "Order tidak ditemukan atau bukan milik Anda" }, { status: 404 });
    if (order.status !== "completed") {
      return NextResponse.json({ error: "Order belum bisa diretur (status bukan completed)" }, { status: 400 });
    }

    // Cek apakah sudah ada refund request
    const existing = await db.select().from(refundRequests).where(eq(refundRequests.orderId, orderId)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: "Pengajuan retur untuk order ini sudah ada" }, { status: 400 });
    }

    const [refund] = await db
      .insert(refundRequests)
      .values({ 
        orderId, 
        buyerId: session.user.id, 
        reason, 
        evidenceUrl: evidenceUrl || null 
      })
      .returning();

    return NextResponse.json(refund, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
