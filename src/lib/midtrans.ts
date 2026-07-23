// ===== SIMULASI PEMBAYARAN =====
// File ini sebelumnya menggunakan Midtrans SDK.
// Sekarang diganti dengan simulasi pembayaran (mock).
// Tidak ada integrasi payment gateway yang sebenarnya.

export interface SimulatedPaymentResponse {
  redirect_url: string;
  token: string;
}

/**
 * Simulasi pembayaran — mengembalikan redirect URL ke halaman simulasi
 * yang akan auto-complete pembayaran.
 */
export function createSimulatedTransaction(
  orderId: string,
  grossAmount: number
): SimulatedPaymentResponse {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return {
    redirect_url: `${baseUrl}/api/payment/simulate?order_id=${orderId}&amount=${grossAmount}`,
    token: `SIMULATED_${orderId}`,
  };
}

/**
 * Simulasi verifikasi pembayaran — selalu berhasil.
 */
export function verifySimulatedPayment(_orderId: string): boolean {
  return true;
}
