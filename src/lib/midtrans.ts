// NOTE: Ini adalah konfigurasi placeholder untuk Midtrans
// Untuk implementasi sungguhan, Anda perlu meng-install 'midtrans-client'
// npm install midtrans-client

/*
import midtransClient from 'midtrans-client';

export const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
});

export const coreApi = new midtransClient.CoreApi({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
});
*/

export const midtransConfig = {
  isMock: true,
  message: 'Ini adalah simulasi, untuk transaksi sungguhan hubungkan ke akun Midtrans Anda.',
};
