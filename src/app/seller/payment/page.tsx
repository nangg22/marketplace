'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { getPaymentInfo, savePaymentInfo } from './actions';

const BANK_LIST = [
  'BCA', 'BNI', 'BRI', 'Mandiri', 'CIMB Niaga', 'Danamon',
  'Permata', 'BTN', 'Panin', 'Maybank', 'OCBC NISP',
  'Bank Syariah Indonesia (BSI)', 'Jenius (BTPN)', 'Jago',
  'SeaBank', 'Blu by BCA Digital', 'Lainnya',
];

export default function SellerPaymentPage() {
  const [form, setForm] = useState({
    bankName: '',
    bankAccountNumber: '',
    bankAccountName: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: '', ok: true });
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await getPaymentInfo();
      if (res.success && res.payment) {
        setForm({
          bankName: res.payment.bankName || '',
          bankAccountNumber: res.payment.bankAccountNumber || '',
          bankAccountName: res.payment.bankAccountName || '',
        });
        setIsSaved(!!res.payment.bankAccountNumber);
      }
      setLoading(false);
    }
    load();
  }, []);

  const showMsg = (text: string, ok: boolean) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg({ text: '', ok: true }), 4000);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const result = await savePaymentInfo(form);
    if (result.success) {
      showMsg('✅ Rekening berhasil disimpan! Onboarding diperbarui.', true);
      setIsSaved(true);
    } else {
      showMsg(`❌ ${result.error}`, false);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--neo-bg)] flex items-center justify-center">
        <div className="text-4xl animate-float">⏳</div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--neo-bg)] min-h-screen text-[var(--neo-black)] flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-2xl mx-auto py-12 px-4 w-full">
        {/* Back link */}
        <div className="mb-6 animate-slide-up">
          <Link href="/seller/dashboard" className="neo-link text-sm font-bold opacity-60 hover:opacity-100">
            ← Dashboard Penjual
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <h1 className="text-4xl font-extrabold flex items-center gap-3 mb-2">
            <span className="bg-[var(--neo-secondary)] text-white px-3 py-1 border-[3px] border-[var(--neo-black)] rounded-xl shadow-[var(--neo-shadow-sm)] rotate-[1deg]">
              💳
            </span>
            Pengaturan Rekening
          </h1>
          <p className="font-semibold opacity-60 text-lg">
            Informasi rekening untuk pencairan dana hasil penjualan.
          </p>
        </div>

        {/* Status badge jika sudah tersimpan */}
        {isSaved && (
          <div className="neo-card p-4 mb-6 bg-[var(--neo-green)] animate-slide-up flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-extrabold text-[var(--neo-black)]">Rekening sudah terdaftar</p>
              <p className="text-sm font-semibold opacity-70">Perbarui kapan saja jika ada perubahan.</p>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="neo-card p-6 sm:p-8 animate-slide-up stagger-1">
          <h2 className="text-xl font-extrabold mb-6 flex items-center gap-2">
            <span className="bg-[var(--neo-secondary)] text-white px-2 py-0.5 border-[2px] border-[var(--neo-black)] rounded-lg text-sm">🏦</span>
            Informasi Rekening Bank
          </h2>

          {msg.text && (
            <div className={`mb-5 p-3 rounded-xl font-bold text-sm border-[2px] border-[var(--neo-black)] ${msg.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
              {msg.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Pilih Bank */}
            <div>
              <label className="block text-sm font-extrabold mb-1.5">
                🏦 Nama Bank <span className="text-red-500">*</span>
              </label>
              <select
                value={form.bankName}
                onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))}
                required
                className="neo-input"
              >
                <option value="">-- Pilih Bank --</option>
                {BANK_LIST.map(bank => (
                  <option key={bank} value={bank}>{bank}</option>
                ))}
              </select>
            </div>

            {/* Nomor Rekening */}
            <div>
              <label className="block text-sm font-extrabold mb-1.5">
                🔢 Nomor Rekening <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={form.bankAccountNumber}
                onChange={e => setForm(f => ({ ...f, bankAccountNumber: e.target.value }))}
                placeholder="Contoh: 1234567890"
                required
                className="neo-input font-mono tracking-widest"
              />
            </div>

            {/* Nama Pemilik */}
            <div>
              <label className="block text-sm font-extrabold mb-1.5">
                👤 Nama Pemilik Rekening <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.bankAccountName}
                onChange={e => setForm(f => ({ ...f, bankAccountName: e.target.value }))}
                placeholder="Sesuai nama di buku tabungan"
                required
                className="neo-input"
              />
              <p className="text-xs font-semibold opacity-50 mt-1.5">
                ⚠️ Pastikan nama sesuai dengan rekening bank, salah nama bisa menyebabkan transfer gagal.
              </p>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-[var(--neo-accent)]/20 border-[2px] border-dashed border-[var(--neo-black)]/30 rounded-xl space-y-1">
              <p className="text-sm font-extrabold">📋 Ketentuan Pencairan:</p>
              <ul className="text-xs font-semibold opacity-70 space-y-0.5 list-disc list-inside">
                <li>Pencairan dilakukan setelah pesanan berstatus &quot;Selesai&quot;</li>
                <li>Proses transfer 1–3 hari kerja</li>
                <li>Minimum pencairan Rp 50.000</li>
                <li>Biaya administrasi transfer ditanggung MallPedia</li>
              </ul>
            </div>

            <div className="pt-3 border-t-[3px] border-dashed border-[var(--neo-black)]/20">
              <button
                type="submit"
                disabled={saving}
                className="neo-btn neo-btn-secondary px-8 py-3 font-extrabold disabled:opacity-50 w-full sm:w-auto"
              >
                {saving ? '⏳ Menyimpan...' : '💾 Simpan Rekening'}
              </button>
            </div>
          </form>
        </div>

        {/* Preview rekening tersimpan */}
        {isSaved && form.bankAccountNumber && (
          <div className="neo-card p-5 mt-6 bg-[var(--neo-white)] animate-slide-up stagger-2">
            <h3 className="font-extrabold mb-3 flex items-center gap-2">
              <span>📄</span> Rekening Terdaftar
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center py-2 border-b-[2px] border-dashed border-[var(--neo-black)]/10">
                <span className="font-bold opacity-60">Bank</span>
                <span className="font-extrabold">{form.bankName}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b-[2px] border-dashed border-[var(--neo-black)]/10">
                <span className="font-bold opacity-60">Nomor Rekening</span>
                <span className="font-extrabold font-mono tracking-wider">{form.bankAccountNumber}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-bold opacity-60">Atas Nama</span>
                <span className="font-extrabold">{form.bankAccountName}</span>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
