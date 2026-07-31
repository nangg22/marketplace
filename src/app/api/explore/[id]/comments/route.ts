import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { postComments, users } from '@/lib/schema';
import { eq, desc, and, gt } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;
  const after = req.nextUrl.searchParams.get('after');

  const conditions = [eq(postComments.postId, postId)];
  if (after) {
    conditions.push(gt(postComments.createdAt, new Date(after)));
  }

  const comments = await db
    .select({
      id: postComments.id,
      comment: postComments.comment,
      createdAt: postComments.createdAt,
      userId: postComments.userId,
      userName: users.name,
      userAvatar: users.avatarUrl,
    })
    .from(postComments)
    .leftJoin(users, eq(postComments.userId, users.id))
    .where(and(...conditions))
    .orderBy(desc(postComments.createdAt))
    .limit(100);

  return NextResponse.json({ comments: comments.reverse() });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Login dulu ya!' }, { status: 401 });
  }

  const { id: postId } = await params;
  const body = await req.json();
  const comment = body.comment?.trim();

  if (!comment) {
    return NextResponse.json({ error: 'Komentar tidak boleh kosong' }, { status: 400 });
  }
  if (comment.length > 500) {
    return NextResponse.json({ error: 'Komentar maksimal 500 karakter' }, { status: 400 });
  }

  const userId = (session.user as any).id;

  const [newComment] = await db
    .insert(postComments)
    .values({ postId, userId, comment })
    .returning();

  const [user] = await db
    .select({ name: users.name, avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return NextResponse.json({
    comment: { ...newComment, userName: user.name, userAvatar: user.avatarUrl },
  }, { status: 201 });
}
