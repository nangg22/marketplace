'use server';

import { db } from '@/lib/db';
import { wishlists, products, users } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// Toggle Wishlist (Tambah/Hapus)
export async function toggleWishlist(productId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { success: false, error: 'Unauthorized', message: 'Silakan login terlebih dahulu' };
    }

    const userId = (session.user as any).id;

    // Cek apakah sudah ada di wishlist
    const existing = await db
      .select()
      .from(wishlists)
      .where(and(eq(wishlists.userId, userId), eq(wishlists.productId, productId)))
      .limit(1);

    if (existing.length > 0) {
      // Hapus dari wishlist
      await db
        .delete(wishlists)
        .where(eq(wishlists.id, existing[0].id));
      
      revalidatePath('/wishlist');
      revalidatePath(`/products/${productId}`);
      return { success: true, isWishlisted: false, message: 'Dihapus dari wishlist' };
    } else {
      // Tambahkan ke wishlist
      await db.insert(wishlists).values({
        userId,
        productId,
      });

      revalidatePath('/wishlist');
      revalidatePath(`/products/${productId}`);
      return { success: true, isWishlisted: true, message: 'Ditambahkan ke wishlist' };
    }
  } catch (error: any) {
    console.error('Error toggling wishlist:', error);
    return { success: false, error: error.message };
  }
}

// Cek status wishlist
export async function checkWishlistStatus(productId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { isWishlisted: false };

    const userId = (session.user as any).id;
    const existing = await db
      .select({ id: wishlists.id })
      .from(wishlists)
      .where(and(eq(wishlists.userId, userId), eq(wishlists.productId, productId)))
      .limit(1);

    return { isWishlisted: existing.length > 0 };
  } catch {
    return { isWishlisted: false };
  }
}

// Ambil semua wishlist pengguna
export async function getMyWishlists() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const userId = (session.user as any).id;

    const myWishlists = await db
      .select({
        id: wishlists.id,
        createdAt: wishlists.createdAt,
        product: {
          id: products.id,
          name: products.name,
          price: products.price,
          imageUrl: products.imageUrl,
          condition: products.condition,
          isNegotiable: products.isNegotiable,
          stock: products.stock,
          sellerName: users.name,
        }
      })
      .from(wishlists)
      .innerJoin(products, eq(wishlists.productId, products.id))
      .leftJoin(users, eq(products.sellerId, users.id))
      .where(eq(wishlists.userId, userId));

    return { success: true, wishlists: myWishlists };
  } catch (error: any) {
    console.error('Error fetching wishlists:', error);
    return { success: false, error: error.message };
  }
}
