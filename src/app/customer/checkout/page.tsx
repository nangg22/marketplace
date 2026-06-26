'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useCartStore } from '@/lib/store';
import { createOrder, getMyShippingAddress, saveShippingAddress } from './actions';
import { useRouter } from 'next/navigation';

type Address = {
  recipientName: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
};

export default function CheckoutPage() {
  const [showQRIS, setShowQRIS] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [address, setAddress] = useState<Address | null>(null);
  const [addressLoading, setAddressLoading] = useState(true);
  const [addressError, setAddressError] = useState('');

  const router = useRouter();

  const cartItems = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  const totalPembayaran = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const formatRupiah = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  useEffect(() => {
    async function loadAddress() {
      setAddressLoading(true);
      const result = await getMyShippingAddress();
      if (result.success && result.address) {
        setAddress(result.address as Address);
      }
      setAddressLoading(false);
    }
    loadAddress();
  }, []);

  const handleSaveAddress = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAddressError('');
    const formData = new FormData(e.currentTarget);
    const data: Address = {
      recipientName: formData.get('recipientName') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
      city: formData.get('city') as string,
      province: formData.get('province') as string,
      postalCode: formData.get('postalCode') as string,
    };
    const result = await saveShippingAddress(data);
    if (result.success && result.address) {
      setAddress(result.address as Address);
      setShowAddressForm(false);
    } else {
      setAddressError(result.error || 'Gagal menyimpan alamat.');
    }
  };

  const handleSimulasiBayar = async () => {
    if (!address?.recipientName) {
      alert('❌ Lengkapi alamat pengiriman terlebih dahulu!');
      setShowQRIS(false);
      setShowAddressForm(true);
      return;
    }

    setIsProcessing(true);

    try {
      const itemsForAction = cartItems.map((item) => ({
        id: item.id,
        quantity: item.quantity,
      }));

      const result = (await createOrder(itemsForAction, 'qris')) as any;

      if (!result?.success) {
        alert(`❌ ${result?.error || 'Terjadi kesalahan.'}`);
        if (result?.status === 401) {
          router.push('/login');
        }
        return;
      }

      setPaymentSuccess(true);
      clearCart();

      setTimeout(() => {
        alert('🎉 Pembayaran Berhasil! Pesanan sedang diproses.');
        setShowQRIS(false);
        router.push('/customer/orders');
      }, 1500);
    } catch (error) {
      alert('❌ Terjadi kesalahan saat memproses pembayaran.');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (cartItems.length === 0 && !paymentSuccess) {
    return (
      <div className="bg-[var(--neo-bg)] min-h-screen text-[var(--neo-black)] flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center p-4">
          <div className="neo-card p-12 text-center max-w-md w-full animate-bounce-in">
            <div className="text-6xl mb-4">🛒</div>
            <h1 className="text-2xl font-extrabold mb-2">Keranjang Kosong</h1>
            <p className="opacity-60 mb-6 font-medium">
              Anda tidak memiliki barang untuk di-checkout.
            </p>
            <Link href="/products">
              <button className="neo-btn neo-btn-primary w-full">
                Kembali Belanja
              </button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

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
          {/* KOLOM KIRI */}
          <div className="lg:col-span-2 space-y-8 animate-slide-up stagger-1">

            {/* Kartu Alamat */}
            <div className="neo-card p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[var(--neo-accent)] text-[var(--neo-black)] text-xs font-bold px-3 py-1 border-b-[3px] border-l-[3px] border-[var(--neo-black)] rounded-bl-xl">
                Pengiriman
              </div>
              <h2 className="font-extrabold text-xl mb-4 flex items-center gap-2">
                📍 Alamat Pengiriman
              </h2>

              {addressLoading ? (
                <div className="py-4 text-sm font-bold opacity-60">⏳ Memuat alamat...</div>
              ) : showAddressForm ? (
                <form onSubmit={handleSaveAddress} className="space-y-3">
                  {addressError && (
                    <div className="text-red-600 text-sm font-bold">{addressError}</div>
                  )}
                  <input name="recipientName" required placeholder="Nama penerima" defaultValue={address?.recipientName || ''} className="neo-input" />
                  <input name="phone" required placeholder="Nomor telepon" defaultValue={address?.phone || ''} className="neo-input" />
                  <textarea name="address" required placeholder="Alamat lengkap" defaultValue={address?.address || ''} className="neo-input resize-none" rows={2} />
                  <div className="grid grid-cols-2 gap-3">
                    <input name="city" required placeholder="Kota" defaultValue={address?.city || ''} className="neo-input" />
                    <input name="province" required placeholder="Provinsi" defaultValue={address?.province || ''} className="neo-input" />
                  </div>
                  <input name="postalCode" required placeholder="Kode pos" defaultValue={address?.postalCode || ''} className="neo-input" />
                  <div className="flex gap-3 pt-2">
                    <button type="submit" className="neo-btn neo-btn-primary flex-1">💾 Simpan Alamat</button>
                    {address?.recipientName && (
                      <button type="button" onClick={() => setShowAddressForm(false)} className="neo-btn neo-btn-outline">Batal</button>
                    )}
                  </div>
                </form>
              ) : address?.recipientName ? (
                <>
                  <div className="bg-[var(--neo-gray)] p-4 border-[2px] border-[var(--neo-black)] rounded-lg shadow-[2px_2px_0px_var(--neo-black)] mb-4">
                    <p className="font-extrabold text-lg mb-1">
                      {address.recipientName}{' '}
                      <span className="opacity-60 text-sm font-semibold">({address.phone})</span>
                    </p>
                    <p className="text-sm font-medium opacity-80 leading-relaxed">
                      {address.address}, {address.city}, {address.province} {address.postalCode}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="neo-btn neo-btn-outline py-2 text-sm font-bold"
                  >
                    ✏️ Ubah Alamat
                  </button>
                </>
              ) : (
                <>
                  <div className="bg-[var(--neo-accent)]/20 border-[2px] border-dashed border-[var(--neo-black)] rounded-lg p-4 mb-4 text-sm font-bold opacity-70">
                    ⚠️ Belum ada alamat pengiriman. Silakan isi terlebih dahulu.
                  </div>
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="neo-btn neo-btn-primary py-2 text-sm font-bold"
                  >
                    ➕ Tambah Alamat
                  </button>
                </>
              )}
            </div>

            {/* Daftar Barang */}
            <div className="neo-card p-6">
              <h2 className="font-extrabold text-xl mb-4 flex items-center gap-2">
                📦 Barang yang Dibeli
              </h2>
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center border-b-[2px] border-dashed border-[var(--neo-black)] border-opacity-20 pb-4 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-extrabold line-clamp-1">{item.name}</p>
                      <p className="text-sm font-bold opacity-60">
                        {formatRupiah(item.price)}{' '}
                        <span className="text-[var(--neo-primary)]">x{item.quantity}</span>
                      </p>
                    </div>
                    <div className="font-extrabold text-lg">
                      {formatRupiah(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Metode Pembayaran */}
            <div className="neo-card p-6">
              <h2 className="font-extrabold text-xl mb-4 flex items-center gap-2">
                💳 Metode Pembayaran
              </h2>
              <div className="p-4 border-[3px] border-[var(--neo-black)] bg-[var(--neo-green)]/10 rounded-lg flex items-center gap-4 hover-lift transition-transform">
                <div className="w-6 h-6 rounded-full border-[3px] border-[var(--neo-black)] bg-[var(--neo-green)] shadow-[1px_1px_0px_var(--neo-black)] flex-shrink-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-[var(--neo-black)] rounded-full"></div>
                </div>
                <div>
                  <span className="font-extrabold text-lg block">QRIS</span>
                  <span className="text-xs font-bold opacity-60">
                    Otomatis dicek, cepat &amp; mudah!
                  </span>
                </div>
                <div className="ml-auto text-3xl opacity-50">📱</div>
              </div>
            </div>
          </div>

          {/* KOLOM KANAN */}
          <div className="animate-slide-up stagger-2">
            <div className="neo-card p-6 sticky top-24">
              <h2 className="font-extrabold text-xl mb-4">Ringkasan Belanja</h2>

              <div className="neo-zigzag mb-4 opacity-10" />

              <div className="flex justify-between mb-3 font-semibold text-sm">
                <span className="opacity-70">
                  Total Harga ({cartItems.length} Barang)
                </span>
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
                disabled={!address?.recipientName}
                className="neo-btn neo-btn-primary w-full py-4 text-lg hover-wiggle disabled:opacity-50 disabled:cursor-not-allowed"
              >
                💸 Bayar Sekarang
              </button>
              {!address?.recipientName && (
                <p className="text-xs font-bold text-red-500 text-center mt-2">
                  ⚠️ Isi alamat pengiriman dulu
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* POP-UP MODAL QRIS */}
      {showQRIS && (
        <div className="fixed inset-0 bg-[var(--neo-black)]/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="neo-card max-w-sm w-full p-8 text-center animate-bounce-in relative">
            <button
              onClick={() => !paymentSuccess && !isProcessing && setShowQRIS(false)}
              className="absolute top-[-15px] right-[-15px] w-10 h-10 bg-[var(--neo-pink)] text-white border-[3px] border-[var(--neo-black)] rounded-full font-bold text-xl flex items-center justify-center shadow-[2px_2px_0px_var(--neo-black)] hover:scale-110 transition-transform z-10"
              disabled={isProcessing}
            >
              ✕
            </button>

            <h3 className="font-extrabold text-2xl mb-2">Scan QRIS</h3>
            <p className="font-semibold opacity-70 text-sm mb-6">
              Buka aplikasi m-banking atau e-wallet Anda.
            </p>

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
                disabled={isProcessing}
                className="neo-btn neo-btn-secondary w-full py-3 text-lg disabled:opacity-50"
              >
                {isProcessing ? '⏳ Memproses...' : '✨ Simulasi Bayar'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
