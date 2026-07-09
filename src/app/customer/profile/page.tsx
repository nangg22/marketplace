'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { getMyShippingAddress, saveShippingAddress } from '@/app/customer/checkout/actions';

type ProfileTab = 'info' | 'address' | 'security';

export default function CustomerProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<ProfileTab>('info');
  const [address, setAddress] = useState({
    recipientName: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
  });
  const [addressLoading, setAddressLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    async function load() {
      setAddressLoading(true);
      const result = await getMyShippingAddress();
      if (result.success && result.address) {
        setAddress(result.address as typeof address);
      }
      setAddressLoading(false);
    }
    if (status === 'authenticated') load();
  }, [status]);

  const handleSaveAddress = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg('');
    const formData = new FormData(e.currentTarget);
    const data = {
      recipientName: formData.get('recipientName') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
      city: formData.get('city') as string,
      province: formData.get('province') as string,
      postalCode: formData.get('postalCode') as string,
    };
    const result = await saveShippingAddress(data);
    if (result.success && result.address) {
      setAddress(result.address as typeof address);
      setSaveMsg('✅ Alamat berhasil disimpan!');
    } else {
      setSaveMsg(`❌ ${result.error}`);
    }
    setSaving(false);
    setTimeout(() => setSaveMsg(''), 3000);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[var(--neo-bg)] flex items-center justify-center">
        <div className="text-2xl animate-float">⏳</div>
      </div>
    );
  }

  const user = session?.user as any;

  const tabs: { key: ProfileTab; label: string; icon: string }[] = [
    { key: 'info', label: 'Info Akun', icon: '👤' },
    { key: 'address', label: 'Alamat Saya', icon: '📍' },
    { key: 'security', label: 'Keamanan', icon: '🔒' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[var(--neo-bg)]">
      <Navbar />

      <main className="flex-grow max-w-5xl mx-auto px-4 py-10 w-full">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 animate-slide-up">
          <div className="w-20 h-20 rounded-2xl border-[4px] border-[var(--neo-black)] bg-[var(--neo-secondary)] shadow-[var(--neo-shadow)] flex items-center justify-center text-4xl select-none">
            {user?.name?.charAt(0)?.toUpperCase() || '👤'}
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--neo-black)]">{user?.name}</h1>
            <p className="text-sm font-semibold opacity-60">{user?.email}</p>
            <span className="neo-sticker bg-[var(--neo-primary)] text-white text-xs mt-1 inline-block rotate-[-1deg]">
              🛒 Pembeli
            </span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Nav */}
          <aside className="w-full md:w-56 flex-shrink-0">
            <div className="neo-card p-0 overflow-hidden">
              <div className="bg-[var(--neo-black)] text-[var(--neo-accent)] px-4 py-3 border-b-[3px] border-[var(--neo-black)]">
                <p className="font-extrabold text-sm uppercase tracking-wider">⚙️ Pengaturan</p>
              </div>
              <nav className="divide-y-[2px] divide-dashed divide-[var(--neo-black)]/20">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold text-left transition-colors
                      ${activeTab === tab.key
                        ? 'bg-[var(--neo-accent)] text-[var(--neo-black)]'
                        : 'hover:bg-[var(--neo-gray)] text-[var(--neo-black)]'
                      }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    {tab.label}
                    {activeTab === tab.key && (
                      <span className="ml-auto">→</span>
                    )}
                  </button>
                ))}

                {/* Quick links */}
                <div className="p-3 space-y-2">
                  <Link
                    href="/customer/orders"
                    className="flex items-center gap-2 px-3 py-2.5 text-sm font-bold rounded-lg border-[2px] border-[var(--neo-black)] bg-[var(--neo-gray)] hover:bg-[var(--neo-primary)] hover:text-white transition-colors shadow-[2px_2px_0px_var(--neo-black)]"
                  >
                    🧾 Pesanan Saya
                  </Link>
                  <Link
                    href="/customer/cart"
                    className="flex items-center gap-2 px-3 py-2.5 text-sm font-bold rounded-lg border-[2px] border-[var(--neo-black)] bg-[var(--neo-gray)] hover:bg-[var(--neo-secondary)] hover:text-white transition-colors shadow-[2px_2px_0px_var(--neo-black)]"
                  >
                    🛒 Keranjang
                  </Link>
                </div>
              </nav>
            </div>
          </aside>

          {/* Content Area */}
          <div className="flex-1 animate-slide-up stagger-1">

            {/* === TAB: INFO AKUN === */}
            {activeTab === 'info' && (
              <div className="neo-card p-8">
                <h2 className="text-xl font-extrabold mb-6 flex items-center gap-2">
                  <span className="bg-[var(--neo-primary)] text-white px-2 py-0.5 border-[2px] border-[var(--neo-black)] rounded-lg">👤</span>
                  Info Akun
                </h2>

                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center p-4 border-[2px] border-dashed border-[var(--neo-black)]/30 rounded-xl">
                    <span className="text-sm font-extrabold w-36 opacity-60">Nama Lengkap</span>
                    <span className="font-bold text-[var(--neo-black)]">{user?.name}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center p-4 border-[2px] border-dashed border-[var(--neo-black)]/30 rounded-xl">
                    <span className="text-sm font-extrabold w-36 opacity-60">Email</span>
                    <span className="font-bold text-[var(--neo-black)]">{user?.email}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center p-4 border-[2px] border-dashed border-[var(--neo-black)]/30 rounded-xl">
                    <span className="text-sm font-extrabold w-36 opacity-60">Role</span>
                    <span className="neo-sticker bg-[var(--neo-primary)] text-white text-xs rotate-0">🛒 Pembeli</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center p-4 border-[2px] border-dashed border-[var(--neo-black)]/30 rounded-xl">
                    <span className="text-sm font-extrabold w-36 opacity-60">ID Akun</span>
                    <span className="font-mono text-xs opacity-60">{user?.id}</span>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-[var(--neo-accent)]/20 border-[2px] border-dashed border-[var(--neo-black)]/30 rounded-xl">
                  <p className="text-sm font-bold opacity-70">
                    💡 Untuk mengubah nama atau email, silakan hubungi admin MallPedia.
                  </p>
                </div>
              </div>
            )}

            {/* === TAB: ALAMAT === */}
            {activeTab === 'address' && (
              <div className="neo-card p-8">
                <h2 className="text-xl font-extrabold mb-6 flex items-center gap-2">
                  <span className="bg-[var(--neo-secondary)] text-white px-2 py-0.5 border-[2px] border-[var(--neo-black)] rounded-lg">📍</span>
                  Alamat Pengiriman
                </h2>

                {addressLoading ? (
                  <div className="text-center py-8 opacity-60 font-bold">⏳ Memuat...</div>
                ) : (
                  <form onSubmit={handleSaveAddress} className="space-y-4">
                    {saveMsg && (
                      <div className={`p-3 rounded-lg font-bold text-sm border-[2px] border-[var(--neo-black)] ${saveMsg.startsWith('✅') ? 'bg-[var(--neo-green)]/20' : 'bg-[var(--neo-pink)]/20'}`}>
                        {saveMsg}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-extrabold mb-1.5">👤 Nama Penerima</label>
                        <input
                          name="recipientName"
                          required
                          defaultValue={address.recipientName}
                          placeholder="Nama lengkap penerima"
                          className="neo-input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-extrabold mb-1.5">📞 Nomor Telepon</label>
                        <input
                          name="phone"
                          required
                          defaultValue={address.phone}
                          placeholder="+62 812 xxxx xxxx"
                          className="neo-input"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-extrabold mb-1.5">🏠 Alamat Lengkap</label>
                      <textarea
                        name="address"
                        required
                        defaultValue={address.address}
                        placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan..."
                        className="neo-input resize-none"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-extrabold mb-1.5">🏙️ Kota</label>
                        <input
                          name="city"
                          required
                          defaultValue={address.city}
                          placeholder="Contoh: Surabaya"
                          className="neo-input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-extrabold mb-1.5">🗺️ Provinsi</label>
                        <input
                          name="province"
                          required
                          defaultValue={address.province}
                          placeholder="Contoh: Jawa Timur"
                          className="neo-input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-extrabold mb-1.5">📮 Kode Pos</label>
                        <input
                          name="postalCode"
                          required
                          defaultValue={address.postalCode}
                          placeholder="60111"
                          className="neo-input"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t-[3px] border-dashed border-[var(--neo-black)]/20">
                      <button
                        type="submit"
                        disabled={saving}
                        className="neo-btn neo-btn-primary px-8 py-3 font-extrabold disabled:opacity-50"
                      >
                        {saving ? '⏳ Menyimpan...' : '💾 Simpan Alamat'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* === TAB: KEAMANAN === */}
            {activeTab === 'security' && (
              <div className="neo-card p-8">
                <h2 className="text-xl font-extrabold mb-6 flex items-center gap-2">
                  <span className="bg-[var(--neo-pink)] text-white px-2 py-0.5 border-[2px] border-[var(--neo-black)] rounded-lg">🔒</span>
                  Keamanan Akun
                </h2>

                <div className="space-y-4">
                  <div className="p-5 border-[3px] border-[var(--neo-black)] rounded-xl bg-white shadow-[var(--neo-shadow-sm)]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-extrabold mb-1">🔑 Password</p>
                        <p className="text-sm opacity-60 font-medium">Terakhir diubah: tidak diketahui</p>
                      </div>
                      <span className="neo-sticker bg-[var(--neo-green)] text-[var(--neo-black)] text-xs rotate-0">
                        Aktif ✅
                      </span>
                    </div>
                  </div>

                  <div className="p-5 border-[3px] border-[var(--neo-black)] rounded-xl bg-white shadow-[var(--neo-shadow-sm)]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-extrabold mb-1">📧 Email Verifikasi</p>
                        <p className="text-sm opacity-60 font-medium">{user?.email}</p>
                      </div>
                      <span className="neo-sticker bg-[var(--neo-green)] text-[var(--neo-black)] text-xs rotate-0">
                        Terverifikasi ✅
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-[var(--neo-accent)]/20 border-[2px] border-dashed border-[var(--neo-black)]/30 rounded-xl">
                    <p className="text-sm font-bold opacity-70">
                      🔐 Untuk mengubah password, silakan logout dan gunakan fitur &quot;Lupa Password&quot; atau hubungi admin MallPedia.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
