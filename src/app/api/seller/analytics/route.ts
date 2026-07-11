import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSellerSummary } from "@/lib/seller-analytics";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) {
    return NextResponse.json({ error: "Harus login" }, { status: 401 });
  }

  const sellerId = (session!.user as any).id;
  const data = await getSellerSummary(sellerId);
  return NextResponse.json(data);
}
