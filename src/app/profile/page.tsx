'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { getMyProfile, updateMyProfile, updateMyEmail, changeMyPassword } from './actions';
import { getMyShippingAddress, saveShippingAddress } from '@/app/customer/checkout/actions';

type Tab = 'biodata' | 'address' | 'store' | 'security';

type Profile = {
  id: string;
  name: string;
  email: string;
  role: string;
  bio?: string | null;
  gender?: string | null;
  birthDate?: string | null;
  phone?: string | null;
  city?: string | null;
  province?: string | null;
  storeName?: string | null;
  storeDescription?: string | null;
};

export default function ProfilePage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const user = session?.user as any;

  const [activeTab, setActiveTab] = useState<Tab>('biodata');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: '', ok: true });

  const [address, setAddress] = useState({
    recipientName: '', phone: '', address: '',
    city: '', province: '', postalCode: '',
  });
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressMsg, setAddressMsg] = useState({ text: '', ok: true });

  const [emailSaving, setEmailSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [securityMsg, setSecurityMsg] = useState({ text: '', ok: true });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    async function load() {
      setLoading(true);
      const [profileRes, addressRes] = await Promise.all([
        getMyProfile(),
        getMyShippingAddress(),
      ]);
      if (profileRes.success && profileRes.profile) setProfile(profileRes.profile as Profile);
      if (addressRes.success && addressRes.address) setAddress(addressRes.address as typeof address);
      setLoading(false);
    }
    load();
  }, [status]);

  const showMsg = (text: string, ok: boolean) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg({ text: '', ok: true }), 3500);
  };

  const showAddressMsg = (text: string, ok: boolean) => {
    setAddressMsg({ text, ok });
    setTimeout(() => setAddressMsg({ text: '', ok: true }), 3500);
  };

  const showSecurityMsg = (text: string, ok: boolean) => {
    setSecurityMsg({ text, ok });
    setTimeout(() => setSecurityMsg({ text: '', ok: true }), 3500);
  };

  const handleSaveBiodata = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const f = new FormData(e.currentTarget);
    const result = await updateMyProfile({
      name: f.get('name') as string,
      bio: f.get('bio') as string,
      gender: f.get('gender') as string,
      birthDate: f.get('birthDate') as string,
      phone: f.get('phone') as string,
      city: f.get('city') as string,
      province: f.get('province') as string,
      storeName: f.get('storeName') as string,
      storeDescription: f.get('storeDescription') as string,
    });
    if (result.success) {
      showMsg('✅ Profil berhasil diperbarui!', true);
      await updateSession({ name: result.name });
      const profileRes = await getMyProfile();
      if (profileRes.success && profileRes.profile) setProfile(profileRes.profile as Profile);
    } else {
      showMsg(`❌ ${result.error}`, false);
    }
    setSaving(false);
  };

  const handleSaveAddress = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAddressSaving(true);
    const f = new FormData(e.currentTarget);
    const result = await saveShippingAddress({
      recipientName: f.get('recipientName') as string,
      phone: f.get('phone') as string,
      address: f.get('address') as string,
      city: f.get('city') as string,
      province: f.get('province') as string,
      postalCode: f.get('postalCode') as string,
    });
    if (result.success && result.address) {
      setAddress(result.address as typeof address);
      showAddressMsg('✅ Alamat berhasil disimpan!', true);
    } else {
      showAddressMsg(`❌ ${result.error}`, false);
    }
    setAddressSaving(false);
  };

  const handleChangeEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setEmailSaving(true);
    const f = new FormData(form);
    const result = await updateMyEmail({
      email: f.get('email') as string,
      currentPassword: f.get('currentPassword') as string,
    });
    if (result.success) {
      showSecurityMsg('✅ Email berhasil diperbarui!', true);
      await updateSession({ email: result.email });
      const profileRes = await getMyProfile();
      if (profileRes.success && profileRes.profile) setProfile(profileRes.profile as Profile);
      form.reset();
    } else {
      showSecurityMsg(`❌ ${result.error}`, false);
    }
    setEmailSaving(false);
  };

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setPasswordSaving(true);
    const f = new FormData(form);
    const result = await changeMyPassword({
      currentPassword: f.get('currentPassword') as string,
      newPassword: f.get('newPassword') as string,
      confirmPassword: f.get('confirmPassword') as string,
    });
    if (result.success) {
      showSecurityMsg('✅ Password berhasil diperbarui!', true);
      form.reset();
    } else {
      showSecurityMsg(`❌ ${result.error}`, false);
    }
    setPasswordSaving(false);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[var(--neo-bg)] flex items-center justify-center">
        <div className="text-4xl animate-float">⏳</div>
      </div>
    );
  }

  const roleBg: Record<string, string> = {
    customer: 'bg-[#FF6B35]',
    seller: 'bg-[#7B4AE2]',
    admin: 'bg-[#1A1A2E]',
  };
  const roleLabel: Record<string, string> = {
    customer: '🛒 Pembeli',
    seller: '🏪 Penjual',
    admin: '⚙️ Admin',
  };

  const allTabs: { key: Tab; label: string; icon: string; roles?: string[] }[] = [
    { key: 'biodata', label: 'Edit Biodata', icon: '✏️' },
    { key: 'address', label: 'Alamat', icon: '📍', roles: ['customer', 'seller'] },
    { key: 'store', label: 'Info Toko', icon: '🏪', roles: ['seller', 'admin'] },
    { key: 'security', label: 'Keamanan', icon: '🔒' },
  ];

  const visibleTabs = allTabs.filter(t => !t.roles || t.roles.includes(user?.role));

  return (
    <div className="flex flex-col min-h-screen bg-[var(--neo-bg)]">
      <Navbar />

      <main className="flex-grow max-w-5xl mx-auto px-4 py-8 w-full">

        {/* ===== HEADER PROFIL ===== */}
        <div className="neo-card p-6 mb-6 animate-slide-up">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar */}
            <div className={`w-20 h-20 rounded-2xl border-[4px] border-[var(--neo-black)] shadow-[var(--neo-shadow)] flex items-center justify-center text-4xl font-extrabold text-white flex-shrink-0 select-none ${roleBg[user?.role] || 'bg-[var(--neo-gray)]'}`}>
              {profile?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-extrabold text-[var(--neo-black)] leading-tight">
                {profile?.name}
              </h1>
              <p className="text-sm font-semibold opacity-60 truncate">{profile?.email}</p>
              {profile?.bio && (
                <p className="text-sm font-medium opacity-70 mt-1 line-clamp-2">{profile.bio}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                <span className={`neo-sticker text-white text-xs rotate-0 ${roleBg[user?.role] || 'bg-gray-400'}`}>
                  {roleLabel[user?.role] || user?.role}
                </span>
                {profile?.storeName && (
                  <span className="neo-sticker bg-[var(--neo-accent)] text-[var(--neo-black)] text-xs rotate-0">
                    🏪 {profile.storeName}
                  </span>
                )}
                {profile?.city && (
                  <span className="neo-sticker bg-[var(--neo-gray)] text-[var(--neo-black)] text-xs rotate-0">
                    📍 {profile.city}
                  </span>
                )}
              </div>
            </div>

            {/* Quick stats / links */}
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              {user?.role === 'customer' && (
                <Link href="/customer/orders" className="neo-btn neo-btn-outline text-xs py-2 px-3 font-bold">
                  🧾 Pesanan
                </Link>
              )}
              {user?.role === 'seller' && (
                <Link href="/seller/dashboard" className="neo-btn neo-btn-secondary text-xs py-2 px-3 font-bold">
                  📊 Dashboard
                </Link>
              )}
              {user?.role === 'admin' && (
                <Link href="/admin/dashboard" className="neo-btn text-xs py-2 px-3 font-bold bg-[#1A1A2E] text-[#FFD23F] border-[#FFD23F]">
                  ⚙️ Admin Panel
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-5">
          {/* ===== SIDEBAR ===== */}
          <aside className="w-full md:w-52 flex-shrink-0">
            <div className="neo-card p-0 overflow-hidden">
              <div className="bg-[var(--neo-black)] text-[var(--neo-accent)] px-4 py-3 border-b-[3px] border-[var(--neo-black)]">
                <p className="font-extrabold text-xs uppercase tracking-wider">⚙️ Pengaturan Akun</p>
              </div>
              <nav className="divide-y-[2px] divide-dashed divide-[var(--neo-black)]/10">
                {visibleTabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold text-left transition-colors
                      ${activeTab === tab.key
                        ? 'bg-[var(--neo-accent)] text-[var(--neo-black)]'
                        : 'hover:bg-[var(--neo-gray)] text-[var(--neo-black)]'
                      }`}
                  >
                    <span className="text-base">{tab.icon}</span>
                    <span className="flex-1">{tab.label}</span>
                    {activeTab === tab.key && <span>→</span>}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* ===== KONTEN ===== */}
          <div className="flex-1 animate-slide-up stagger-1">

            {/* ===== BIODATA ===== */}
            {activeTab === 'biodata' && (
              <div className="neo-card p-6 sm:p-8">
                <h2 className="text-xl font-extrabold mb-6 flex items-center gap-2">
                  <span className="bg-[#FF6B35] text-white px-2 py-0.5 border-[2px] border-[var(--neo-black)] rounded-lg text-sm">✏️</span>
                  Edit Biodata
                </h2>

                {msg.text && (
                  <div className={`mb-4 p-3 rounded-xl font-bold text-sm border-[2px] border-[var(--neo-black)] ${msg.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
                    {msg.text}
                  </div>
                )}

                <form onSubmit={handleSaveBiodata} className="space-y-5">
                  {/* Nama */}
                  <div>
                    <label className="block text-sm font-extrabold mb-1.5">
                      👤 Nama Lengkap <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="name"
                      required
                      defaultValue={profile?.name || ''}
                      placeholder="Nama lengkap kamu"
                      className="neo-input"
                    />
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-extrabold mb-1.5">📝 Bio / Deskripsi Diri</label>
                    <textarea
                      name="bio"
                      defaultValue={profile?.bio || ''}
                      placeholder="Ceritakan sedikit tentang dirimu..."
                      className="neo-input resize-none"
                      rows={3}
                    />
                  </div>

                  {/* Gender & Tanggal Lahir */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-extrabold mb-1.5">🚻 Jenis Kelamin</label>
                      <select name="gender" defaultValue={profile?.gender || ''} className="neo-input">
                        <option value="">-- Pilih --</option>
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-extrabold mb-1.5">🎂 Tanggal Lahir</label>
                      <input
                        name="birthDate"
                        type="date"
                        defaultValue={profile?.birthDate || ''}
                        className="neo-input"
                      />
                    </div>
                  </div>

                  {/* No HP & Kota */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-extrabold mb-1.5">📞 Nomor HP</label>
                      <input
                        name="phone"
                        defaultValue={profile?.phone || ''}
                        placeholder="+62 812 xxxx xxxx"
                        className="neo-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-extrabold mb-1.5">🏙️ Kota Domisili</label>
                      <input
                        name="city"
                        defaultValue={profile?.city || ''}
                        placeholder="Contoh: Surabaya"
                        className="neo-input"
                      />
                    </div>
                  </div>

                  {/* Provinsi */}
                  <div>
                    <label className="block text-sm font-extrabold mb-1.5">🗺️ Provinsi</label>
                    <input
                      name="province"
                      defaultValue={profile?.province || ''}
                      placeholder="Contoh: Jawa Timur"
                      className="neo-input"
                    />
                  </div>

                  {/* Hidden fields untuk store (seller) — isi default supaya tidak null */}
                  <input type="hidden" name="storeName" value={profile?.storeName || ''} />
                  <input type="hidden" name="storeDescription" value={profile?.storeDescription || ''} />

                  <div className="pt-3 border-t-[3px] border-dashed border-[var(--neo-black)]/20 flex gap-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="neo-btn neo-btn-primary px-8 py-3 font-extrabold disabled:opacity-50"
                    >
                      {saving ? '⏳ Menyimpan...' : '💾 Simpan Perubahan'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ===== ALAMAT ===== */}
            {activeTab === 'address' && (
              <div className="neo-card p-6 sm:p-8">
                <h2 className="text-xl font-extrabold mb-6 flex items-center gap-2">
                  <span className="bg-[#7B4AE2] text-white px-2 py-0.5 border-[2px] border-[var(--neo-black)] rounded-lg text-sm">📍</span>
                  Alamat Pengiriman
                </h2>

                {addressMsg.text && (
                  <div className={`mb-4 p-3 rounded-xl font-bold text-sm border-[2px] border-[var(--neo-black)] ${addressMsg.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
                    {addressMsg.text}
                  </div>
                )}

                <form onSubmit={handleSaveAddress} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-extrabold mb-1.5">👤 Nama Penerima</label>
                      <input name="recipientName" required defaultValue={address.recipientName} placeholder="Nama lengkap" className="neo-input" />
                    </div>
                    <div>
                      <label className="block text-sm font-extrabold mb-1.5">📞 Nomor Telepon</label>
                      <input name="phone" required defaultValue={address.phone} placeholder="+62 812 xxxx xxxx" className="neo-input" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-extrabold mb-1.5">🏠 Alamat Lengkap</label>
                    <textarea name="address" required defaultValue={address.address} placeholder="Nama jalan, nomor rumah, RT/RW..." className="neo-input resize-none" rows={3} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-extrabold mb-1.5">🏙️ Kota</label>
                      <input name="city" required defaultValue={address.city} placeholder="Surabaya" className="neo-input" />
                    </div>
                    <div>
                      <label className="block text-sm font-extrabold mb-1.5">🗺️ Provinsi</label>
                      <input name="province" required defaultValue={address.province} placeholder="Jawa Timur" className="neo-input" />
                    </div>
                    <div>
                      <label className="block text-sm font-extrabold mb-1.5">📮 Kode Pos</label>
                      <input name="postalCode" required defaultValue={address.postalCode} placeholder="60111" className="neo-input" />
                    </div>
                  </div>

                  <div className="pt-3 border-t-[3px] border-dashed border-[var(--neo-black)]/20">
                    <button type="submit" disabled={addressSaving} className="neo-btn neo-btn-primary px-8 py-3 font-extrabold disabled:opacity-50">
                      {addressSaving ? '⏳ Menyimpan...' : '💾 Simpan Alamat'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ===== INFO TOKO (SELLER) ===== */}
            {activeTab === 'store' && (
              <div className="neo-card p-6 sm:p-8">
                <h2 className="text-xl font-extrabold mb-6 flex items-center gap-2">
                  <span className="bg-[#7B4AE2] text-white px-2 py-0.5 border-[2px] border-[var(--neo-black)] rounded-lg text-sm">🏪</span>
                  Info Toko
                </h2>

                {msg.text && (
                  <div className={`mb-4 p-3 rounded-xl font-bold text-sm border-[2px] border-[var(--neo-black)] ${msg.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
                    {msg.text}
                  </div>
                )}

                <form onSubmit={handleSaveBiodata} className="space-y-5">
                  {/* Hidden biodata fields */}
                  <input type="hidden" name="name" value={profile?.name || ''} />
                  <input type="hidden" name="bio" value={profile?.bio || ''} />
                  <input type="hidden" name="gender" value={profile?.gender || ''} />
                  <input type="hidden" name="birthDate" value={profile?.birthDate || ''} />
                  <input type="hidden" name="phone" value={profile?.phone || ''} />
                  <input type="hidden" name="city" value={profile?.city || ''} />
                  <input type="hidden" name="province" value={profile?.province || ''} />

                  <div>
                    <label className="block text-sm font-extrabold mb-1.5">🏪 Nama Toko</label>
                    <input
                      name="storeName"
                      defaultValue={profile?.storeName || ''}
                      placeholder="Contoh: Toko Kosmetik Nafisyah"
                      className="neo-input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-extrabold mb-1.5">📝 Deskripsi Toko</label>
                    <textarea
                      name="storeDescription"
                      defaultValue={profile?.storeDescription || ''}
                      placeholder="Ceritakan tentang toko kamu, produk apa yang dijual, keunggulan, dll..."
                      className="neo-input resize-none"
                      rows={4}
                    />
                  </div>

                  <div className="p-4 bg-[var(--neo-accent)]/20 border-[2px] border-dashed border-[var(--neo-black)]/30 rounded-xl">
                    <p className="text-sm font-bold opacity-70">
                      💡 Nama toko akan ditampilkan di setiap produk yang kamu jual.
                    </p>
                  </div>

                  <div className="pt-3 border-t-[3px] border-dashed border-[var(--neo-black)]/20">
                    <button type="submit" disabled={saving} className="neo-btn neo-btn-secondary px-8 py-3 font-extrabold disabled:opacity-50">
                      {saving ? '⏳ Menyimpan...' : '💾 Simpan Info Toko'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ===== KEAMANAN ===== */}
            {activeTab === 'security' && (
              <div className="space-y-5">
                {securityMsg.text && (
                  <div className={`p-3 rounded-xl font-bold text-sm border-[2px] border-[var(--neo-black)] ${securityMsg.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
                    {securityMsg.text}
                  </div>
                )}

                <div className="neo-card p-6 sm:p-8">
                  <h2 className="text-xl font-extrabold mb-6 flex items-center gap-2">
                    <span className="bg-[#FF4081] text-white px-2 py-0.5 border-[2px] border-[var(--neo-black)] rounded-lg text-sm">🔒</span>
                    Keamanan Akun
                  </h2>

                  <div className="p-5 border-[3px] border-[var(--neo-black)] rounded-xl bg-white shadow-[var(--neo-shadow-sm)] flex items-center justify-between gap-4">
                    <div>
                      <p className="font-extrabold mb-0.5">🎭 Role Akun</p>
                      <p className="text-sm opacity-60 font-medium capitalize">{user?.role}</p>
                    </div>
                    <span className={`neo-sticker text-xs rotate-0 ${user?.role === 'admin' ? 'bg-[#1A1A2E] text-[#FFD23F]' : user?.role === 'seller' ? 'bg-[#7B4AE2] text-white' : 'bg-[#FF6B35] text-white'}`}>
                      {roleLabel[user?.role] || user?.role}
                    </span>
                  </div>
                </div>

                <div className="neo-card p-6 sm:p-8">
                  <h3 className="text-lg font-extrabold mb-4 flex items-center gap-2">
                    <span>📧</span> Ubah Email
                  </h3>
                  <p className="text-sm font-medium opacity-60 mb-4">
                    Email saat ini: <strong className="text-[var(--neo-black)]">{profile?.email}</strong>
                  </p>
                  <form onSubmit={handleChangeEmail} className="space-y-4">
                    <div>
                      <label className="block text-sm font-extrabold mb-1.5">Email Baru</label>
                      <input
                        name="email"
                        type="email"
                        required
                        placeholder="email.bar@example.com"
                        className="neo-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-extrabold mb-1.5">Password Saat Ini</label>
                      <input
                        name="currentPassword"
                        type="password"
                        required
                        placeholder="Konfirmasi dengan password kamu"
                        className="neo-input"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={emailSaving}
                      className="neo-btn neo-btn-outline px-6 py-2.5 font-extrabold disabled:opacity-50"
                    >
                      {emailSaving ? '⏳ Menyimpan...' : '💾 Simpan Email Baru'}
                    </button>
                  </form>
                </div>

                <div className="neo-card p-6 sm:p-8">
                  <h3 className="text-lg font-extrabold mb-4 flex items-center gap-2">
                    <span>🔑</span> Ubah Password
                  </h3>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label className="block text-sm font-extrabold mb-1.5">Password Saat Ini</label>
                      <input
                        name="currentPassword"
                        type="password"
                        required
                        placeholder="Password lama"
                        className="neo-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-extrabold mb-1.5">Password Baru</label>
                      <input
                        name="newPassword"
                        type="password"
                        required
                        minLength={6}
                        placeholder="Minimal 6 karakter"
                        className="neo-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-extrabold mb-1.5">Konfirmasi Password Baru</label>
                      <input
                        name="confirmPassword"
                        type="password"
                        required
                        minLength={6}
                        placeholder="Ulangi password baru"
                        className="neo-input"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={passwordSaving}
                      className="neo-btn neo-btn-primary px-6 py-2.5 font-extrabold disabled:opacity-50"
                    >
                      {passwordSaving ? '⏳ Menyimpan...' : '🔐 Simpan Password Baru'}
                    </button>
                  </form>
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
