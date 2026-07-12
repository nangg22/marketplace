'use server';

import { db } from '@/lib/db';
import { users, sellerOnboarding } from '@/lib/schema';
import { requireRole } from '@/lib/auth-guard';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getPaymentInfo() {
  const auth = await requireRole(['seller']) as any;
  if (!auth.ok) return { success: false, error: auth.message };

  const userId = auth.session?.user?.id;
  const [user] = await db
    .select({
      bankName: users.bankName,
      bankAccountNumber: users.bankAccountNumber,
      bankAccountName: users.bankAccountName,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return { success: true, payment: user || null };
}

export async function savePaymentInfo(data: {
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
}) {
  const auth = await requireRole(['seller']) as any;
  if (!auth.ok) return { success: false, error: auth.message };

  const userId = auth.session?.user?.id;

  if (!data.bankName?.trim()) return { success: false, error: 'Nama bank wajib diisi.' };
  if (!data.bankAccountNumber?.trim()) return { success: false, error: 'Nomor rekening wajib diisi.' };
  if (!data.bankAccountName?.trim()) return { success: false, error: 'Nama pemilik rekening wajib diisi.' };

  await db.update(users)
    .set({
      bankName: data.bankName.trim(),
      bankAccountNumber: data.bankAccountNumber.trim(),
      bankAccountName: data.bankAccountName.trim(),
    })
    .where(eq(users.id, userId));

  // Update onboarding: hasPaymentSetup = true
  await db.update(sellerOnboarding)
    .set({ hasPaymentSetup: true })
    .where(eq(sellerOnboarding.userId, userId));

  revalidatePath('/seller/payment');
  revalidatePath('/seller/dashboard');

  return { success: true };
}
