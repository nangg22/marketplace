import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

function isSafeInternalPath(path) {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//');
}

function canAccessPath(path, role) {
  if (!isSafeInternalPath(path)) return false;
  if (path.startsWith('/admin')) return role === 'admin';
  if (path.startsWith('/seller')) return role === 'seller' || role === 'admin';
  return true;
}

// ============================
// RATE LIMITING (pakai Upstash Redis jika tersedia)
// Jika env vars tidak ada, rate limiting di-skip (graceful fallback)
// ============================
async function checkRateLimit(request, identifier, limit, window) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  // Skip jika Upstash belum dikonfigurasi
  if (!url || !token) return { allowed: true };

  try {
    const key = `ratelimit:${identifier}`;
    const now = Date.now();
    const windowMs = window * 1000;

    // Increment counter
    const response = await fetch(`${url}/multi-exec`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', key],
        ['PEXPIRE', key, windowMs],
      ]),
    });

    const data = await response.json();
    const count = data.result?.[0] ?? 0;

    return { allowed: count <= limit, count, limit };
  } catch {
    // Jika Redis error, jangan block request (fail open)
    return { allowed: true };
  }
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // ============================
  // RATE LIMITING pada endpoint sensitif
  // ============================
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  // Login: max 10 request per 60 detik per IP
  if (pathname === '/api/auth/callback/credentials') {
    const result = await checkRateLimit(request, `login:${ip}`, 10, 60);
    if (!result.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Terlalu banyak percobaan login. Coba lagi dalam 1 menit.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // Register: max 5 request per 60 detik per IP
  if (pathname === '/api/register') {
    const result = await checkRateLimit(request, `register:${ip}`, 5, 60);
    if (!result.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Terlalu banyak percobaan pendaftaran. Coba lagi dalam 1 menit.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // Forgot password: max 3 request per 300 detik per IP
  if (pathname === '/api/auth/forgot-password') {
    const result = await checkRateLimit(request, `forgot:${ip}`, 3, 300);
    if (!result.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Terlalu banyak permintaan. Coba lagi dalam 5 menit.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  // ============================
  // 1. Rute yang DILINDUNGI untuk CUSTOMER (harus login)
  // ============================
  if (pathname.startsWith('/customer')) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ============================
  // 2. Rute yang DILINDUNGI untuk SELLER (harus login + role seller)
  // ============================
  if (pathname.startsWith('/seller')) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (token.role !== 'seller' && token.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // ============================
  // 3. Rute yang DILINDUNGI untuk ADMIN (harus login + role admin)
  // ============================
  if (pathname.startsWith('/admin')) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (token.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // ============================
  // 4. Jika sudah login, jangan bisa akses halaman login/register lagi
  // ============================
  if (pathname === '/login' || pathname === '/register') {
    if (token) {
      const role = token.role;
      const callbackUrl = request.nextUrl.searchParams.get('callbackUrl');
      const wantsSellerFlow =
        request.nextUrl.searchParams.get('tab') === 'seller' ||
        request.nextUrl.searchParams.get('role') === 'seller';

      if (wantsSellerFlow && role === 'customer') {
        return NextResponse.redirect(new URL('/become-seller', request.url));
      }

      if (callbackUrl && canAccessPath(callbackUrl, role)) {
        return NextResponse.redirect(new URL(callbackUrl, request.url));
      }

      if (role === 'seller') return NextResponse.redirect(new URL('/seller/dashboard', request.url));
      if (role === 'admin') return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/auth/callback/credentials',
    '/api/register',
    '/api/auth/forgot-password',
    '/customer/:path*',
    '/seller/:path*',
    '/admin/:path*',
    '/become-seller',
    '/login',
    '/register',
  ],
};
