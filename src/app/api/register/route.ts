import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, sellerOnboarding } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, role } = body;

    // Validasi server-side
    if (!name?.trim() || name.trim().length < 2) {
      return NextResponse.json({ error: 'Nama minimal 2 karakter.' }, { status: 400 });
    }
    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: 'Format email tidak valid.' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password minimal 6 karakter.' }, { status: 400 });
    }
    if (password.length > 128) {
      return NextResponse.json({ error: 'Password maksimal 128 karakter.' }, { status: 400 });
    }
    if (!['customer', 'seller'].includes(role)) {
      return NextResponse.json({ error: 'Role tidak valid.' }, { status: 400 });
    }

    // Cek email sudah terdaftar
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.trim().toLowerCase()))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar. Silakan gunakan email lain atau masuk.' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [newUser] = await db.insert(users).values({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role,
    }).returning({ id: users.id });

    if (role === 'seller') {
      await db.insert(sellerOnboarding).values({
        userId: newUser.id,
      });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan server. Coba lagi.' },
      { status: 500 }
    );
  }
}
