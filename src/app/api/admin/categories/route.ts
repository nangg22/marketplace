import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { categories } from "@/lib/schema";
import { asc, eq } from "drizzle-orm";
import { logAdminAction } from "@/lib/audit-log";
import { AUDIT_ACTIONS } from "@/lib/audit-actions";

async function assertAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as any).role !== "admin") return null;
  return session;
}

export async function GET() {
  const list = await db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name));
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const session = await assertAdmin();
  if (!session) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });

  const body = await req.json();
  const { name, slug, iconUrl, sortOrder } = body;

  if (!name || name.length < 2) {
    return NextResponse.json({ error: "Nama kategori minimal 2 karakter" }, { status: 400 });
  }
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: "Slug hanya boleh huruf kecil, angka, dan strip" }, { status: 400 });
  }

  const [created] = await db.insert(categories).values({
    name,
    slug,
    iconUrl: iconUrl || null,
    sortOrder: sortOrder ?? 0,
  }).returning();

  await logAdminAction({
    actorId: (session.user as any).id,
    action: AUDIT_ACTIONS.CATEGORY_CREATED,
    entityType: "category",
    entityId: created.id,
    after: created as any,
  });

  return NextResponse.json(created, { status: 201 });
}
