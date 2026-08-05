'use server';

import { db } from '@/lib/db';
import { products, users, productImages, sellerOnboarding } from '@/lib/schema';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export async function addProductAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || (session.user as any).role !== 'seller') return;

  const name = (formData.get('name') as string)?.trim();
  const price = Number(formData.get('price'));
  const description = formData.get('description') as string;
  const condition = (formData.get('condition') as 'baru' | 'like_new' | 'minus_ringan' | 'minus_berat') || 'baru';
  const isNegotiable = formData.get('isNegotiable') === 'true';
  const category = (formData.get('category') as string) || 'Lainnya';
  const stock = Number(formData.get('stock') || 1);

  // === VALIDASI SERVER-SIDE ===
  const errors: string[] = [];
  if (!name || name.length < 3) errors.push('Nama produk minimal 3 karakter.');
  if (!Number.isInteger(price) || price < 100) errors.push('Harga minimal Rp 100.');
  if (price > 500_000_000) errors.push('Harga maksimal Rp 500.000.000.');
  if (!Number.isInteger(stock) || stock < 1) errors.push('Stok minimal 1.');
  if (stock > 10_000) errors.push('Stok maksimal 10.000.');
  if (errors.length > 0) {
    throw new Error(errors.join(' '));
  }

  const currentUser = await db.select().from(users).where(eq(users.email, session.user.email as string)).limit(1);
  const sellerId = currentUser[0].id;

  const imagesRaw = formData.get('images') as string;
  let images: { url: string; isPrimary: boolean }[] = [];
  try {
    images = JSON.parse(imagesRaw);
  } catch (e) {
    // JSON parse failed, images will remain empty array
  }

  // Tentukan gambar utama
  const primaryImage = images.find(img => img.isPrimary) || images[0];
  const primaryImageUrl = primaryImage ? primaryImage.url : '';

  // Menyimpan data produk beserta URL gambar utama
  const [newProduct] = await db.insert(products).values({
    name,
    price,
    description,
    sellerId,
    imageUrl: primaryImageUrl,
    condition,
    isNegotiable,
    category,
    stock,
  }).returning();
  
  if (images.length > 0) {
    const imagesToInsert = images.map((img, i) => ({
      productId: newProduct.id,
      url: img.url,
      isPrimary: img.isPrimary,
      order: i
    }));
    await db.insert(productImages).values(imagesToInsert);
  }

  // Update status onboarding (hasFirstProduct)
  await db.update(sellerOnboarding).set({ hasFirstProduct: true }).where(eq(sellerOnboarding.userId, sellerId));
  
  redirect('/seller/products');
}