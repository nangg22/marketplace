import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { updateOrderStatus } from '@/lib/orders';
import QRCode from 'qrcode';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * GET /api/payment/simulate
 *
 * Halaman simulasi pembayaran QRIS. Menampilkan QR code yang bisa di-scan
 * oleh m-banking atau e-wallet. Setelah user klik "Konfirmasi Pembayaran",
 * order akan ditandai sebagai paid.
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('order_id');

  if (!orderId) {
    return new NextResponse('Order ID tidak valid', { status: 400 });
  }

  // Validate orderId format (UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(orderId)) {
    return new NextResponse('Order ID tidak valid', { status: 400 });
  }

  // Verifikasi order ada dan masih pending — resolve amount dari DB, bukan URL
  const [order] = await db
    .select({ id: orders.id, status: orders.status, totalAmount: orders.totalAmount, customerId: orders.customerId })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order) {
    return new NextResponse('Order tidak ditemukan', { status: 404 });
  }

  // Pastikan order milik user yang login
  const userId = (session.user as any).id;
  if (order.customerId !== userId) {
    return new NextResponse('Akses ditolak', { status: 403 });
  }

  if (order.status !== 'pending') {
    return NextResponse.redirect(
      new URL(`/customer/orders/${orderId}`, req.url)
    );
  }

  // Gunakan amount dari database, bukan dari URL
  const amount = order.totalAmount;

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const finishUrl = `${baseUrl}/customer/orders/${orderId}`;
  const confirmUrl = `${baseUrl}/api/payment/confirm`;

  // Generate QR code dari data pembayaran
  const qrPayload = JSON.stringify({
    type: 'QRIS',
    order_id: orderId,
    amount: amount,
    merchant: 'MallPedia',
    timestamp: new Date().toISOString(),
  });

  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    width: 256,
    margin: 2,
    color: {
      dark: '#1A1A2E',
      light: '#ffffff',
    },
  });

  const formattedAmount = amount.toLocaleString('id-ID');
  const safeOrderId = escapeHtml(orderId);
  const safeFinishUrl = escapeHtml(finishUrl);
  const safeConfirmUrl = escapeHtml(confirmUrl);
  const safeFormattedAmount = escapeHtml(formattedAmount);

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pembayaran QRIS - MallPedia</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');

    :root {
      --neo-bg: #F5E6D3;
      --neo-primary: #FF6B35;
      --neo-secondary: #7B4AE2;
      --neo-accent: #FFD23F;
      --neo-pink: #FF4081;
      --neo-green: #00C853;
      --neo-blue: #2979FF;
      --neo-black: #1A1A2E;
      --neo-white: #FFFFFF;
      --neo-gray: #F0F0F0;
      --neo-shadow: 4px 4px 0px #1A1A2E;
      --neo-shadow-sm: 2px 2px 0px #1A1A2E;
      --neo-radius: 12px;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', system-ui, sans-serif;
      background: var(--neo-bg);
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; padding: 20px;
    }

    .card {
      background: var(--neo-white);
      border: 3px solid var(--neo-black);
      border-radius: var(--neo-radius);
      box-shadow: 6px 6px 0px var(--neo-black);
      padding: 40px;
      text-align: center;
      max-width: 420px;
      width: 100%;
      position: relative;
      animation: bounceIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    @keyframes bounceIn {
      from { opacity: 0; transform: scale(0.9) translateY(20px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }

    .badge {
      display: inline-block;
      background: var(--neo-secondary);
      color: var(--neo-white);
      font-weight: 900;
      font-size: 11px;
      padding: 6px 16px;
      border: 3px solid var(--neo-black);
      border-radius: 999px;
      text-transform: uppercase;
      letter-spacing: 1px;
      box-shadow: 2px 2px 0px var(--neo-black);
    }

    h2 {
      font-size: 20px;
      font-weight: 900;
      color: var(--neo-black);
      margin-top: 16px;
    }

    .subtitle {
      color: #666;
      font-size: 13px;
      font-weight: 600;
      margin-top: 4px;
    }

    .qr-container {
      background: var(--neo-gray);
      border: 3px solid var(--neo-black);
      border-radius: var(--neo-radius);
      box-shadow: var(--neo-shadow-sm);
      padding: 24px;
      margin: 24px 0;
      position: relative;
      display: inline-block;
    }
    .qr-container img {
      width: 200px;
      height: 200px;
      border: 3px solid var(--neo-black);
      border-radius: 8px;
    }
    .qr-label {
      position: absolute;
      bottom: -12px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--neo-primary);
      color: var(--neo-white);
      font-weight: 800;
      font-size: 10px;
      padding: 4px 14px;
      border: 2px solid var(--neo-black);
      border-radius: 999px;
      white-space: nowrap;
      box-shadow: 2px 2px 0px var(--neo-black);
    }

    .amount-box {
      display: inline-block;
      background: var(--neo-accent);
      color: var(--neo-black);
      font-weight: 900;
      font-size: 28px;
      padding: 12px 28px;
      border: 3px solid var(--neo-black);
      border-radius: var(--neo-radius);
      box-shadow: var(--neo-shadow-sm);
      margin: 16px 0;
      transform: rotate(-1deg);
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      text-align: left;
      margin: 20px 0;
      font-size: 13px;
    }
    .info-item {
      background: var(--neo-gray);
      padding: 12px;
      border: 2px solid var(--neo-black);
      border-radius: 8px;
      box-shadow: 1px 1px 0px var(--neo-black);
    }
    .info-label {
      color: #888;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .info-value {
      color: var(--neo-black);
      font-weight: 800;
      font-size: 14px;
    }

    .btn-confirm {
      width: 100%;
      padding: 16px;
      font-size: 16px;
      font-weight: 900;
      background: var(--neo-primary);
      color: var(--neo-white);
      border: 3px solid var(--neo-black);
      border-radius: var(--neo-radius);
      cursor: pointer;
      box-shadow: 4px 4px 0px var(--neo-black);
      transition: transform 0.15s, box-shadow 0.15s;
      margin-top: 16px;
    }
    .btn-confirm:hover {
      transform: translate(-2px, -2px);
      box-shadow: 6px 6px 0px var(--neo-black);
    }
    .btn-confirm:active {
      transform: translate(2px, 2px);
      box-shadow: 0px 0px 0px var(--neo-black);
    }
    .btn-confirm:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
      box-shadow: var(--neo-shadow);
    }

    .btn-back {
      position: fixed;
      top: 20px;
      left: 20px;
      background: var(--neo-white);
      color: var(--neo-black);
      border: 3px solid var(--neo-black);
      border-radius: var(--neo-radius);
      box-shadow: 3px 3px 0px var(--neo-black);
      padding: 10px 16px;
      font-size: 14px;
      font-weight: 800;
      cursor: pointer;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 6px;
      z-index: 100;
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .btn-back:hover {
      transform: translate(-2px, -2px);
      box-shadow: 5px 5px 0px var(--neo-black);
    }
    .btn-back:active {
      transform: translate(2px, 2px);
      box-shadow: 0px 0px 0px var(--neo-black);
    }

    .btn-cancel {
      width: 100%;
      padding: 12px;
      font-size: 14px;
      font-weight: 700;
      background: var(--neo-white);
      color: #666;
      border: 3px solid var(--neo-black);
      border-radius: var(--neo-radius);
      cursor: pointer;
      box-shadow: 3px 3px 0px var(--neo-black);
      transition: transform 0.15s, box-shadow 0.15s;
      margin-top: 10px;
    }
    .btn-cancel:hover {
      transform: translate(-1px, -1px);
      box-shadow: 4px 4px 0px var(--neo-black);
    }
    .btn-cancel:active {
      transform: translate(1px, 1px);
      box-shadow: 0px 0px 0px var(--neo-black);
    }

    .timer {
      font-size: 12px;
      color: #999;
      margin-top: 14px;
      font-weight: 700;
    }
    .timer span {
      color: var(--neo-pink);
      font-weight: 900;
    }

    .success-overlay {
      display: none;
      position: absolute;
      inset: 0;
      background: var(--neo-white);
      border-radius: 12px;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 10;
      border: 3px solid var(--neo-black);
    }
    .success-overlay.show { display: flex; }
    .success-icon { font-size: 72px; margin-bottom: 16px; animation: popIn 0.5s ease; }
    .success-overlay h2 {
      color: var(--neo-black);
      font-weight: 900;
    }
    .success-overlay p {
      color: #666;
      font-weight: 600;
      font-size: 14px;
    }
    @keyframes popIn {
      0% { transform: scale(0); }
      70% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }
  </style>
</head>
<body>
  <a href="${safeFinishUrl}" class="btn-back">← Kembali</a>

  <div class="card">
    <div class="success-overlay" id="success">
      <div class="success-icon">✅</div>
      <h2 style="margin-bottom: 8px;">Pembayaran Berhasil!</h2>
      <p>Pesanan Anda telah berhasil dibayar.</p>
      <p style="margin-top: 16px; color: #999;">Mengalihkan ke halaman pesanan...</p>
    </div>

    <div class="header">
      <div class="badge">QRIS Payment</div>
      <h2>Scan QR Code untuk Bayar</h2>
      <p class="subtitle">Gunakan m-banking atau e-wallet Anda</p>
    </div>

    <div class="qr-container">
      <img src="${qrDataUrl}" alt="QR Code QRIS" />
      <div class="qr-label">📱 QRIS MallPedia</div>
    </div>

    <div class="amount-box">Rp ${safeFormattedAmount}</div>

    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Order ID</div>
        <div class="info-value">#${safeOrderId.slice(0, 8)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Metode</div>
        <div class="info-value">📱 QRIS</div>
      </div>
    </div>

    <button class="btn-confirm" id="confirmBtn" onclick="confirmPayment()">
      ✨ Konfirmasi Pembayaran
    </button>

    <button class="btn-cancel" onclick="window.location.href = '${safeFinishUrl}'">
      ✕ Batal
    </button>

    <div class="timer">
      QR Code berlaku selama <span id="countdown">05:00</span> menit
    </div>
  </div>

  <script>
    let timeLeft = 300;
    const countdownEl = document.getElementById('countdown');

    const timer = setInterval(() => {
      timeLeft--;
      const mins = Math.floor(timeLeft / 60);
      const secs = timeLeft % 60;
      countdownEl.textContent = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
      if (timeLeft <= 0) {
        clearInterval(timer);
        countdownEl.textContent = 'Kedaluwarsa';
        countdownEl.style.color = '#FF4081';
        document.getElementById('confirmBtn').disabled = true;
      }
    }, 1000);

    async function confirmPayment() {
      const btn = document.getElementById('confirmBtn');
      btn.disabled = true;
      btn.textContent = '⏳ Memproses...';

      try {
        const res = await fetch('${safeConfirmUrl}', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: '${safeOrderId}' }),
        });

        if (res.ok) {
          // Clear cart via localStorage (cart stored client-side as 'mallpedia-cart')
          try {
            localStorage.removeItem('mallpedia-cart');
          } catch (e) { /* ignore */ }
          document.getElementById('success').classList.add('show');
          setTimeout(() => {
            window.location.href = '${safeFinishUrl}';
          }, 2000);
        } else {
          const data = await res.json();
          alert(data.error || 'Gagal memproses pembayaran');
          btn.disabled = false;
          btn.textContent = '✨ Konfirmasi Pembayaran';
        }
      } catch (err) {
        alert('Terjadi kesalahan. Silakan coba lagi.');
        btn.disabled = false;
        btn.textContent = '✨ Konfirmasi Pembayaran';
      }
    }
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
