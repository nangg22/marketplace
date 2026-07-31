import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { groupMessages, users } from '@/lib/schema';
import { eq, desc, and, gt } from 'drizzle-orm';

// GET — ambil pesan grup (support ?after=id untuk polling)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: groupId } = await params;
  const after = req.nextUrl.searchParams.get('after'); // ISO timestamp untuk polling

  const conditions = [eq(groupMessages.groupId, groupId)];
  if (after) {
    conditions.push(gt(groupMessages.createdAt, new Date(after)));
  }

  const msgs = await db
    .select({
      id: groupMessages.id,
      text: groupMessages.text,
      createdAt: groupMessages.createdAt,
      userId: groupMessages.userId,
      userName: users.name,
      userAvatar: users.avatarUrl,
    })
    .from(groupMessages)
    .leftJoin(users, eq(groupMessages.userId, users.id))
    .where(and(...conditions))
    .orderBy(desc(groupMessages.createdAt))
    .limit(50);

  return NextResponse.json({ messages: msgs.reverse() });
}

// POST — kirim pesan baru
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: groupId } = await params;
  const body = await req.json();
  const text = body.text?.trim();

  if (!text || text.length === 0) {
    return NextResponse.json({ error: 'Pesan tidak boleh kosong' }, { status: 400 });
  }
  if (text.length > 500) {
    return NextResponse.json({ error: 'Pesan maksimal 500 karakter' }, { status: 400 });
  }

  const userId = (session.user as any).id;

  const [newMsg] = await db
    .insert(groupMessages)
    .values({ groupId, userId, text })
    .returning();

  const [user] = await db
    .select({ name: users.name, avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return NextResponse.json({
    message: { ...newMsg, userName: user.name, userAvatar: user.avatarUrl },
  }, { status: 201 });
}
