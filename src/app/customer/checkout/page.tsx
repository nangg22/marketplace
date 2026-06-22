'use client';

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

  const handleSimulasiBayar = () => {
    setPaymentSuccess(true);
    setTimeout(() => {
      alert("🎉 Pembayaran Berhasil! Pesanan sedang diproses penjual.");
      setShowQRIS(false);
    }, 1500);
  };

  return (
    <div className="bg-[var(--neo-bg)] min-h-screen text-[var(--neo-black)] flex flex-col">
      <Navbar />
      
      <main className="flex-grow max-w-5xl mx-auto px-4 py-10 w-full relative">
        <div className="flex items-center gap-3 mb-8 animate-slide-up">
          <span className="bg-[var(--neo-secondary)] text-white px-3 py-1 border-[3px] border-[var(--neo-black)] rounded-xl shadow-[var(--neo-shadow-sm)] text-2xl font-extrabold rotate-[2deg]">
            💳
          </span>
          <h1 className="text-3xl font-extrabold">Checkout Pembayaran</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* KOLOM KIRI: Alamat & Metode Bayar */}
          <div className="lg:col-span-2 space-y-8 animate-slide-up stagger-1">
            
            {/* Kartu Alamat */}
            <div className="neo-card p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[var(--neo-accent)] text-[var(--neo-black)] text-xs font-bold px-3 py-1 border-b-[3px] border-l-[3px] border-[var(--neo-black)] rounded-bl-xl">
                Utama
              </div>
              <h2 className="font-extrabold text-xl mb-4 flex items-center gap-2">
                📍 Alamat Pengiriman
              </h2>
              <div className="bg-[var(--neo-gray)] p-4 border-[2px] border-[var(--neo-black)] rounded-lg shadow-[2px_2px_0px_var(--neo-black)] mb-4">
                <p className="font-extrabold text-lg mb-1">John Doe <span className="opacity-60 text-sm font-semibold">(+62 812-3456-7890)</span></p>
                <p className="text-sm font-medium opacity-80 leading-relaxed">
                  Jl. Pameran Mall No. 99, Surabaya, Jawa Timur, 60111
                </p>
              </div>
              <button className="neo-btn neo-btn-outline py-2 text-sm font-bold">
                ✏️ Ubah Alamat
              </button>
            </div>

            {/* Kartu Metode Pembayaran */}
            <div className="neo-card p-6">
              <h2 className="font-extrabold text-xl mb-4 flex items-center gap-2">
                💳 Metode Pembayaran
              </h2>
              <div className="p-4 border-[3px] border-[var(--neo-black)] bg-[var(--neo-green)]/10 rounded-lg cursor-pointer flex items-center gap-4 hover-lift transition-transform">
                <div className="w-6 h-6 rounded-full border-[3px] border-[var(--neo-black)] bg-[var(--neo-green)] shadow-[1px_1px_0px_var(--neo-black)] flex-shrink-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-[var(--neo-black)] rounded-full"></div>
                </div>
                <div>
                  <span className="font-extrabold text-lg block">QRIS</span>
                  <span className="text-xs font-bold opacity-60">Otomatis dicek, cepat & mudah!</span>
                </div>
                <div className="ml-auto text-3xl opacity-50">📱</div>
              </div>
            </div>

          </div>

          {/* KOLOM KANAN: Ringkasan & Tombol */}
          <div className="animate-slide-up stagger-2">
            <div className="neo-card p-6 sticky top-24">
              <h2 className="font-extrabold text-xl mb-4">Ringkasan Belanja</h2>
              
              <div className="neo-zigzag mb-4 opacity-10" />

              <div className="flex justify-between mb-3 font-semibold text-sm">
                <span className="opacity-70">Total Harga (1 Barang)</span>
                <span>{formatRupiah(totalPembayaran)}</span>
              </div>
              <div className="flex justify-between mb-5 font-semibold text-sm">
                <span className="opacity-70">Ongkos Kirim</span>
                <span className="neo-badge bg-[var(--neo-accent)]">Gratis 🔥</span>
              </div>
              
              <div className="border-t-[3px] border-dashed border-[var(--neo-black)] border-opacity-20 pt-4 flex justify-between items-center mb-6">
                <span className="font-extrabold text-lg">Total Tagihan</span>
                <span className="font-extrabold text-xl bg-[var(--neo-primary)] text-white px-2 py-1 border-[2px] border-[var(--neo-black)] rounded-lg shadow-[2px_2px_0px_var(--neo-black)] rotate-[-2deg]">
                  {formatRupiah(totalPembayaran)}
                </span>
              </div>
              
              <button 
                onClick={() => setShowQRIS(true)}
                className="neo-btn neo-btn-primary w-full py-4 text-lg hover-wiggle"
              >
                💸 Bayar Sekarang
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* POP-UP MODAL QRIS */}
      {showQRIS && (
        <div className="fixed inset-0 bg-[var(--neo-black)]/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="neo-card max-w-sm w-full p-8 text-center animate-bounce-in relative">
            {/* Close Button */}
            <button 
              onClick={() => !paymentSuccess && setShowQRIS(false)}
              className="absolute top-[-15px] right-[-15px] w-10 h-10 bg-[var(--neo-pink)] text-white border-[3px] border-[var(--neo-black)] rounded-full font-bold text-xl flex items-center justify-center shadow-[2px_2px_0px_var(--neo-black)] hover:scale-110 transition-transform z-10"
            >
              ✕
            </button>

            <h3 className="font-extrabold text-2xl mb-2">Scan QRIS</h3>
            <p className="font-semibold opacity-70 text-sm mb-6">Buka aplikasi m-banking atau e-wallet Anda.</p>
            
            <div className="bg-white p-4 border-[3px] border-[var(--neo-black)] rounded-xl inline-block mb-6 shadow-[4px_4px_0px_var(--neo-primary)] rotate-[1deg] hover:rotate-0 transition-transform">
              <img 
                src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=SimulasiPembayaranTugasAkhir" 
                alt="QRIS Code" 
                className="mx-auto" 
              />
            </div>

            <div className="mb-6">
              <span className="font-extrabold text-3xl bg-[var(--neo-accent)] px-3 py-1 border-[3px] border-[var(--neo-black)] rounded-lg inline-block shadow-[2px_2px_0px_var(--neo-black)]">
                {formatRupiah(totalPembayaran)}
              </span>
            </div>

            {paymentSuccess ? (
               <div className="neo-card bg-[var(--neo-green)] text-[var(--neo-black)] p-4 font-extrabold text-xl animate-pulse-scale">
                 LUNAS! ✅
               </div>
            ) : (
              <button 
                onClick={handleSimulasiBayar}
                className="neo-btn neo-btn-secondary w-full py-3 text-lg"
              >
                ✨ Simulasi Bayar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}