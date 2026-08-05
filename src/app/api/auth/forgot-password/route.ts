import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, passwordResetTokens } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Email tidak valid.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Cek apakah email terdaftar
    const [user] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    // Selalu return 200 (anti-enumeration)
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Generate token unik
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 jam

    // Simpan token ke DB
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token,
      expiresAt,
    });

    // Deteksi base URL
    const host = req.headers.get('host') || 'localhost:3000';
    const proto = req.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = `${proto}://${host}`;
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    // Kirim email via Resend (jika API key tersedia)
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(resendKey);

        await resend.emails.send({
          from: 'LakuLagi <noreply@lakulagi.com>',
          to: user.email,
          subject: 'Reset Password LakuLagi',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
              <div style="background: #FF6B35; padding: 16px 20px; border-radius: 12px; border: 3px solid #1A1A2E; margin-bottom: 24px;">
                <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 900;">
                  <span style="background: white; color: #FF6B35; padding: 2px 8px; border-radius: 6px; border: 2px solid #1A1A2E; margin-right: 4px;">Laku</span>Lagi
                </h1>
              </div>
              
              <h2 style="color: #1A1A2E; font-size: 20px; margin-bottom: 8px;">Reset Password Akun Kamu</h2>
              <p style="color: #555; margin-bottom: 24px;">Halo <strong>${user.name}</strong>, kami menerima permintaan reset password untuk akun kamu.</p>
              
              <a href="${resetUrl}" style="display: inline-block; background: #FF6B35; color: white; padding: 14px 28px; border-radius: 12px; border: 3px solid #1A1A2E; text-decoration: none; font-weight: 900; font-size: 16px; box-shadow: 4px 4px 0px #1A1A2E;">
                🔑 Reset Password Sekarang
              </a>
              
              <p style="color: #888; margin-top: 24px; font-size: 13px;">
                Link ini berlaku selama <strong>1 jam</strong>.<br>
                Jika kamu tidak meminta reset password, abaikan email ini.
              </p>
              
              <hr style="border: 1px dashed #ddd; margin: 24px 0;">
              <p style="color: #aaa; font-size: 12px;">
                Atau copy link ini ke browser:<br>
                <span style="color: #FF6B35;">${resetUrl}</span>
              </p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error('Email gagal dikirim:', emailErr);
        // Tetap return sukses meski email gagal (sudah ada token di DB)
      }
    } else {
      // Development: log ke console
      console.log(`[ForgotPassword] Reset URL untuk ${email}: ${resetUrl}`);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Forgot password error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan.' }, { status: 500 });
  }
}
