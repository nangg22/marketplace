import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { categories, products } from "@/lib/schema";
import { eq, count } from "drizzle-orm";
import { logAdminAction } from "@/lib/audit-log";
import { AUDIT_ACTIONS } from "@/lib/audit-actions";

async function assertAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as any).role !== "admin") return null;
  return session;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await assertAdmin();
  if (!session) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });

  const { id } = await params;
  const existingArr = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  const before = existingArr[0];
  if (!before) return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });

  const body = await req.json();

  // Whitelist — hanya izinkan field yang diizinkan untuk diupdate
  const allowedFields: Record<string, any> = {};
  if (body.name !== undefined) allowedFields.name = body.name;
  if (body.slug !== undefined) allowedFields.slug = body.slug;
  if (body.description !== undefined) allowedFields.description = body.description;
  if (body.sortOrder !== undefined) allowedFields.sortOrder = body.sortOrder;
  if (body.imageUrl !== undefined) allowedFields.imageUrl = body.imageUrl;
  if (body.isActive !== undefined) allowedFields.isActive = body.isActive;
  if (body.iconUrl !== undefined) allowedFields.iconUrl = body.iconUrl;

  const [updated] = await db
    .update(categories)
    .set(allowedFields)
    .where(eq(categories.id, id))
    .returning();

  await logAdminAction({
    actorId: (session.user as any).id,
    action: AUDIT_ACTIONS.CATEGORY_UPDATED,
    entityType: "category",
    entityId: id,
    before: before as any,
    after: updated as any,
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await assertAdmin();
  if (!session) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });

  const { id } = await params;

  const countResult = await db
    .select({ productCount: count() })
    .from(products)
    .where(eq(products.categoryId, id));

  const productCount = countResult[0]?.productCount ?? 0;

  if (productCount > 0) {
    return NextResponse.json(
      { error: `Kategori masih dipakai oleh ${productCount} produk. Pindahkan produk dulu sebelum menghapus.` },
      { status: 400 }
    );
  }

  await db.delete(categories).where(eq(categories.id, id));

  await logAdminAction({
    actorId: (session.user as any).id,
    action: AUDIT_ACTIONS.CATEGORY_DELETED,
    entityType: "category",
    entityId: id,
  });

  return NextResponse.json({ success: true });
}
