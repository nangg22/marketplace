import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function proxy(request) {
  const { pathname } = request.nextUrl;
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
    // Jika login tapi bukan seller, tendang ke beranda
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
      // Redirect ke halaman sesuai role
      const role = token.role;
      if (role === 'seller') return NextResponse.redirect(new URL('/seller/dashboard', request.url));
      if (role === 'admin') return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

// Tentukan path mana saja yang harus dicek oleh middleware
export const config = {
  matcher: [
    '/customer/:path*',
    '/seller/:path*',
    '/admin/:path*',
    '/login',
    '/register',
  ],
};