import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orderStatusHistory } from "@/lib/schema";
import { eq, asc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // TODO: We could add a check to make sure the user is the customer or seller of this order, 
  // but for now we just check if they are logged in.

  const history = await db
    .select()
    .from(orderStatusHistory)
    .where(eq(orderStatusHistory.orderId, params.id))
    .orderBy(asc(orderStatusHistory.createdAt));

  return NextResponse.json(history);
}
