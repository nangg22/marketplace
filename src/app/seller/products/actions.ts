'use server';

import { db } from '@/lib/db';
import { products, users } from '@/lib/schema';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export async function addProductAction(formData: FormData, imageUrl: string) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || (session.user as any).role !== 'seller') return;

  const name = formData.get('name') as string;
  const price = Number(formData.get('price'));
  const description = formData.get('description') as string;

  const currentUser = await db.select().from(users).where(eq(users.email, session.user.email as string)).limit(1);
  const sellerId = currentUser[0].id;

  // Menyimpan data produk beserta URL gambar dari UploadThing
  await db.insert(products).values({ 
    name, 
    price, 
    description, 
    sellerId, 
    imageUrl // <-- Data gambar masuk ke database
  });
  
  redirect('/seller/products');
}