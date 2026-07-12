'use server';

import { db } from '@/lib/db';
import { users, sellerOnboarding } from '@/lib/schema';
import { requireRole } from '@/lib/auth-guard';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getMyProfile() {
  const auth = await requireRole(['customer', 'seller', 'admin']) as any;
  if (!auth.ok) return { success: false, error: auth.message };

  const userId = auth.session?.user?.id;
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      bio: users.bio,
      avatarUrl: users.avatarUrl,
      gender: users.gender,
      birthDate: users.birthDate,
      storeName: users.storeName,
      storeDescription: users.storeDescription,
      phone: users.phone,
      city: users.city,
      province: users.province,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return { success: true, profile: user || null };
}

export async function updateMyProfile(data: {
  name: string;
  bio?: string;
  gender?: string;
  birthDate?: string;
  phone?: string;
  city?: string;
  province?: string;
  storeName?: string;
  storeDescription?: string;
}) {
  const auth = await requireRole(['customer', 'seller', 'admin']) as any;
  if (!auth.ok) return { success: false, error: auth.message };

  const userId = auth.session?.user?.id;

  if (!data.name?.trim()) {
    return { success: false, error: 'Nama tidak boleh kosong.' };
  }

  await db.update(users)
    .set({
      name: data.name.trim(),
      bio: data.bio?.trim() || null,
      gender: data.gender || null,
      birthDate: data.birthDate || null,
      phone: data.phone?.trim() || null,
      city: data.city?.trim() || null,
      province: data.province?.trim() || null,
      storeName: data.storeName?.trim() || null,
      storeDescription: data.storeDescription?.trim() || null,
    })
    .where(eq(users.id, userId));

  // Jika seller mengisi nama toko, update onboarding hasStoreProfile
  if ((auth.session?.user as any)?.role === 'seller' && data.storeName?.trim()) {
    await db
      .update(sellerOnboarding)
      .set({ hasStoreProfile: true })
      .where(eq(sellerOnboarding.userId, userId));
  }

  revalidatePath('/profile');
  revalidatePath('/seller/dashboard');

  return { success: true };
}
