'use server';

import { db } from '@/lib/db';
import { posts, postLikes, postComments, users, products } from '@/lib/schema';
import { requireRole } from '@/lib/auth-guard';
import { eq, desc, sql, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getExploreFeed() {
  const auth = await requireRole(['customer', 'seller', 'admin']) as any;
  const currentUserId = auth.ok ? auth.session?.user?.id : null;

  // We need to fetch posts, user who posted, tagged product, like count, comment count, and if current user liked it.
  // We'll use multiple queries or a joined query. For simplicity with drizzle, we can do a base select and subqueries for counts.
  
  const allPosts = await db
    .select({
      id: posts.id,
      content: posts.content,
      imageUrl: posts.imageUrl,
      createdAt: posts.createdAt,
      userId: users.id,
      userName: users.name,
      userAvatar: users.avatarUrl,
      productId: products.id,
      productName: products.name,
      productPrice: products.price,
      productImage: products.imageUrl,
    })
    .from(posts)
    .innerJoin(users, eq(users.id, posts.userId))
    .leftJoin(products, eq(products.id, posts.productId))
    .orderBy(desc(posts.createdAt));

  // Fetch likes and comments manually to avoid complex subqueries if not supported well
  const postIds = allPosts.map(p => p.id);
  
  if (postIds.length === 0) return [];

  // Likes count and user's like status
  const likesData = await db
    .select({
      postId: postLikes.postId,
      userId: postLikes.userId,
    })
    .from(postLikes);

  const commentsData = await db
    .select({
      postId: postComments.postId,
    })
    .from(postComments);

  return allPosts.map(post => {
    const postLikesData = likesData.filter(l => l.postId === post.id);
    const hasLiked = currentUserId ? postLikesData.some(l => l.userId === currentUserId) : false;
    const commentsCount = commentsData.filter(c => c.postId === post.id).length;

    return {
      ...post,
      likesCount: postLikesData.length,
      hasLiked,
      commentsCount,
    };
  });
}

export async function toggleLike(postId: string) {
  const auth = await requireRole(['customer', 'seller', 'admin']) as any;
  if (!auth.ok) return { success: false, error: 'Unauthorized' };
  
  const userId = auth.session.user.id;
  
  // Check if liked
  const existing = await db
    .select()
    .from(postLikes)
    .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)))
    .limit(1);

  if (existing.length > 0) {
    await db.delete(postLikes).where(eq(postLikes.id, existing[0].id));
  } else {
    await db.insert(postLikes).values({ postId, userId });
  }

  revalidatePath('/explore');
  return { success: true };
}

export async function createPost(formData: FormData) {
  const auth = await requireRole(['customer', 'seller', 'admin']) as any;
  if (!auth.ok) return { success: false, error: 'Unauthorized' };
  
  const userId = auth.session.user.id;
  
  const content = formData.get('content') as string;
  const imageUrl = formData.get('imageUrl') as string;
  const productIdStr = formData.get('productId') as string;
  
  if (!content) return { success: false, error: 'Konten tidak boleh kosong' };
  
  let productId = null;
  if (productIdStr && productIdStr !== '') {
    productId = productIdStr;
  }

  await db.insert(posts).values({
    userId,
    content,
    imageUrl: imageUrl || null,
    productId,
  });

  revalidatePath('/explore');
  return { success: true };
}

// Untuk mengambil produk milik user (buat ditag)
export async function getMyProducts() {
  const auth = await requireRole(['customer', 'seller', 'admin']) as any;
  if (!auth.ok) return { success: false, error: 'Unauthorized', products: [] };
  
  const userId = auth.session.user.id;
  
  const myProducts = await db
    .select({
      id: products.id,
      name: products.name,
      imageUrl: products.imageUrl,
    })
    .from(products)
    .where(eq(products.sellerId, userId))
    .orderBy(desc(products.createdAt));
    
  return { success: true, products: myProducts };
}
