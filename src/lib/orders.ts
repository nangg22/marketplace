import { db } from "@/lib/db";
import { orders, orderStatusHistory } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function updateOrderStatus(orderId: string, status: string, note?: string) {
  // Update status in orders table
  await db.update(orders)
    .set({ status })
    .where(eq(orders.id, orderId));

  // Insert into history table
  await db.insert(orderStatusHistory)
    .values({ 
      orderId, 
      status, 
      note 
    });
}
