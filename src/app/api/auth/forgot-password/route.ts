import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Email tidak valid.' }, { status: 400 });
    }

    // Cek apakah email terdaftar (tidak expose ke client — selalu return 200)
    const [user] = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    if (user) {
      // TODO: Implementasi pengiriman email dengan nodemailer/Resend/SendGrid
      // Langkah:
      // 1. Generate reset token (crypto.randomBytes(32).toString('hex'))
      // 2. Simpan token + expiry ke DB (tabel password_reset_tokens)
      // 3. Kirim email berisi link: /reset-password?token=xxx
      //
      // Untuk sekarang hanya log — email akan dikirim setelah integrasi email service
      console.log(`[ForgotPassword] Reset requested for: ${email} (user: ${user.id})`);
    }

    // Selalu return 200 untuk mencegah email enumeration attack
    return NextResponse.json({
      success: true,
      message: 'Jika email terdaftar, instruksi reset telah dikirim.',
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan.' }, { status: 500 });
  }
}
