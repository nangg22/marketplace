'use server';

import { db } from '@/lib/db';
import { users, sellerOnboarding } from '@/lib/schema';
import { requireRole } from '@/lib/auth-guard';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function upgradeToSeller() {
  const auth = await requireRole(['customer']);
  if (!auth.ok) return { success: false, error: 'Anda harus login sebagai pembeli terlebih dahulu.' };

  const userId = auth.session?.user?.id;

  const [user] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return { success: false, error: 'Akun tidak ditemukan.' };
  if (user.role === 'seller') return { success: true };
  if (user.role === 'admin') return { success: false, error: 'Akun admin tidak dapat diubah melalui halaman ini.' };

  await db.update(users).set({ role: 'seller' }).where(eq(users.id, userId));

  const existingOnboarding = await db
    .select({ userId: sellerOnboarding.userId })
    .from(sellerOnboarding)
    .where(eq(sellerOnboarding.userId, userId))
    .limit(1);

  if (existingOnboarding.length === 0) {
    await db.insert(sellerOnboarding).values({ userId });
  }

  revalidatePath('/');
  revalidatePath('/profile');
  revalidatePath('/seller/dashboard');

  return { success: true };
}
