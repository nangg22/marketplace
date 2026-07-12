import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { refundRequests, orderItems, products } from "@/lib/schema";
import { eq, inArray, and } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { updateOrderStatus } from "@/lib/orders";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user as any).role !== 'seller') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const sellerId = session.user.id;
    const { id } = await params;

    const { status, sellerResponse } = await req.json();
    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // 1. Ambil detail refund request
    const [refund] = await db.select().from(refundRequests).where(eq(refundRequests.id, id)).limit(1);
    if (!refund) {
      return NextResponse.json({ error: "Refund request not found" }, { status: 404 });
    }

    // 2. Autorisasi: Pastikan seller memiliki produk dalam order ini
    const myProducts = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.sellerId, sellerId));
    
    const myProductIds = myProducts.map((p) => p.id);
    
    if (myProductIds.length === 0) {
      return NextResponse.json({ error: "Forbidden: Not your order" }, { status: 403 });
    }

    const matchingItems = await db
      .select({ id: orderItems.id })
      .from(orderItems)
      .where(and(inArray(orderItems.productId, myProductIds), eq(orderItems.orderId, refund.orderId)));
      
    if (matchingItems.length === 0) {
      return NextResponse.json({ error: "Forbidden: Not your order" }, { status: 403 });
    }

    // 3. Update status refund
    const [updated] = await db
      .update(refundRequests)
      .set({ status, sellerResponse, updatedAt: new Date() })
      .where(eq(refundRequests.id, id))
      .returning();

    // 4. Jika "approved", ubah status order menjadi "refunded"
    if (status === "approved") {
      await updateOrderStatus(refund.orderId, "refunded", `Refund disetujui penjual. Note: ${sellerResponse}`);
      // Di sini bisa ditambahkan integrasi ke Midtrans untuk refund dana jika menggunakan payment gateway
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Respond Refund Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
