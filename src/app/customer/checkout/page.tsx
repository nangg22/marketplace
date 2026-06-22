'use client'; // Wajib ditambahkan karena kita pakai state interaktif (klik tombol muncul popup)

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function CheckoutPage() {
  const [showQRIS, setShowQRIS] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // MOCK DATA Belanjaan
  const totalPembayaran = 2000000;
  const formatRupiah = (price: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
  };

  // Fungsi Simulasi Pembayaran Berhasil
  const handleSimulasiBayar = () => {
    setPaymentSuccess(true);
    setTimeout(() => {
      // Nanti di sini kita arahkan ke halaman riwayat pesanan
      alert("Pembayaran Berhasil! Pesanan sedang diproses penjual.");
    }, 1000);
  };

  return (
    <div className="bg-gray-50 min-h-screen text-gray-900">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-6">Checkout Pembayaran</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* KOLOM KIRI: Alamat & Metode Bayar */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Kartu Alamat */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h2 className="font-bold text-lg mb-4 border-b pb-2">📍 Alamat Pengiriman</h2>
              <p className="font-bold">John Doe (+62 812-3456-7890)</p>
              <p className="text-gray-600 text-sm mt-1">Jl. Pameran Mall No. 99, Surabaya, Jawa Timur, 60111</p>
              <button className="mt-4 text-emerald-600 text-sm font-bold border border-emerald-600 px-4 py-2 rounded-lg hover:bg-emerald-50">Ubah Alamat</button>
            </div>

            {/* Kartu Metode Pembayaran */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h2 className="font-bold text-lg mb-4 border-b pb-2">💳 Metode Pembayaran</h2>
              <div className="flex items-center gap-3 p-4 border border-emerald-500 bg-emerald-50 rounded-lg cursor-pointer">
                <div className="w-4 h-4 rounded-full bg-emerald-600 flex-shrink-0"></div>
                <span className="font-bold text-emerald-900">QRIS (Otomatis dicek)</span>
              </div>
            </div>
          </div>

          {/* KOLOM KANAN: Ringkasan & Tombol */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit sticky top-24">
            <h2 className="font-bold text-lg mb-4 border-b pb-2">Total Belanja</h2>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Total Harga (1 Barang)</span>
              <span>{formatRupiah(totalPembayaran)}</span>
            </div>
            <div className="flex justify-between mb-4 border-b pb-4">
              <span className="text-gray-600">Ongkos Kirim</span>
              <span>Gratis</span>
            </div>
            <div className="flex justify-between mb-6">
              <span className="font-bold text-lg">Total Tagihan</span>
              <span className="font-bold text-lg text-emerald-600">{formatRupiah(totalPembayaran)}</span>
            </div>
            
            <button 
              onClick={() => setShowQRIS(true)}
              className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition shadow-lg shadow-emerald-200"
            >
              Bayar Sekarang
            </button>
          </div>
        </div>
      </main>

      {/* POP-UP MODAL QRIS (Animasi Pameran) */}
      {showQRIS && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl animate-fade-in-up">
            <h3 className="font-bold text-xl mb-2">Scan QRIS</h3>
            <p className="text-gray-500 text-sm mb-6">Buka aplikasi m-banking atau e-wallet Anda.</p>
            
            {/* Simulasi Gambar QR Code */}
            <div className="bg-gray-100 p-4 rounded-xl inline-block mb-6 border-2 border-dashed border-gray-300">
              {/* Pakai placeholder gambar QR untuk sementara */}
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=SimulasiPembayaranTugasAkhir" alt="QRIS Code" className="mx-auto rounded" />
            </div>

            <p className="font-bold text-2xl text-emerald-600 mb-6">{formatRupiah(totalPembayaran)}</p>

            {/* Tombol Simulasi untuk Juri saat Demo */}
            {paymentSuccess ? (
               <div className="bg-green-100 text-green-700 p-3 rounded-lg font-bold">LUNAS! ✅</div>
            ) : (
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowQRIS(false)}
                  className="flex-1 bg-gray-200 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-300 transition"
                >
                  Batal
                </button>
                <button 
                  onClick={handleSimulasiBayar}
                  className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition"
                >
                  Simulasi Bayar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}