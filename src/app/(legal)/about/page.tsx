import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tentang Kami | LakuLagi",
  description: "Kenali lebih dekat LakuLagi, marketplace preloved yang menghubungkan penjual dan pembeli di seluruh Indonesia.",
};

const STATS = [
  { value: "10.000+", label: "Pengguna Aktif", emoji: "👥" },
  { value: "50.000+", label: "Barang Terjual", emoji: "📦" },
  { value: "6", label: "Komunitas Aktif", emoji: "🏘️" },
  { value: "100%", label: "Transaksi Aman", emoji: "🛡️" },
];

const TEAM = [
  {
    name: "Danang Prajadinata",
    role: "Founder & Full-Stack Developer",
    desc: "Membangun LakuLagi dari nol sebagai proyek tugas akhir — dari desain UI, database, hingga sistem pembayaran.",
    emoji: "👨‍💻",
    color: "bg-[#7B4AE2]",
  },
];

const VALUES = [
  {
    emoji: "♻️",
    title: "Berkelanjutan",
    desc: "Barang bekas yang masih layak pakai seharusnya tidak berakhir di tempat sampah. LakuLagi hadir untuk memperpanjang umur produk dan mengurangi pemborosan.",
  },
  {
    emoji: "🤝",
    title: "Kepercayaan",
    desc: "Setiap transaksi dijamin aman. Sistem escrow, verifikasi penjual, dan proteksi pembeli memastikan kamu belanja dengan tenang.",
  },
  {
    emoji: "🌍",
    title: "Komunitas",
    desc: "Lebih dari sekadar jual beli — LakuLagi adalah komunitas yang saling terhubung, berbagi inspirasi, dan berinteraksi satu sama lain.",
  },
];

export default function AboutPage() {
  return (
    <div className="bg-[var(--neo-bg)] min-h-screen text-[var(--neo-black)] flex flex-col">
      <Navbar />

      <main className="flex-grow">

        {/* === HERO === */}
        <section className="bg-[var(--neo-black)] border-b-[4px] border-[var(--neo-black)] py-16 px-4 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, #FFD23F 2px, transparent 2px)', backgroundSize: '24px 24px' }} />
          <div className="relative max-w-3xl mx-auto text-center">
            <div className="inline-block bg-[var(--neo-accent)] text-[var(--neo-black)] text-sm font-extrabold px-4 py-2 border-[3px] border-[var(--neo-accent)] rounded-xl shadow-[3px_3px_0px_var(--neo-accent)] mb-6 animate-bounce-in">
              🇮🇩 Dibuat dengan ❤️ di Indonesia
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight animate-slide-up">
              Barang Bekas,{' '}
              <span className="text-[var(--neo-accent)]">Nilai Baru</span>
            </h1>
            <p className="text-white/75 font-semibold text-lg max-w-xl mx-auto mb-8 animate-slide-up stagger-2">
              LakuLagi adalah marketplace preloved yang menghubungkan jutaan penjual dan pembeli Indonesia
              dalam satu platform yang aman, nyaman, dan menyenangkan.
            </p>
            <div className="flex flex-wrap gap-3 justify-center animate-slide-up stagger-3">
              <Link href="/products" className="neo-btn neo-btn-accent font-extrabold px-6 py-3">
                🛍️ Mulai Belanja
              </Link>
              <Link href="/become-seller" className="neo-btn neo-btn-outline bg-transparent text-white border-white/40 hover:border-white px-6 py-3">
                🏪 Jadi Penjual
              </Link>
            </div>
          </div>
        </section>

        {/* === STATS === */}
        <section className="bg-[var(--neo-accent)] border-b-[4px] border-[var(--neo-black)] py-8 px-4">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="neo-card bg-white p-5 text-center hover-lift">
                <div className="text-3xl mb-2">{stat.emoji}</div>
                <div className="text-2xl font-extrabold">{stat.value}</div>
                <div className="text-xs font-bold opacity-60 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* === MISI === */}
        <section className="py-14 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-extrabold mb-3">
                Kenapa{' '}
                <span className="inline-block bg-[var(--neo-primary)] text-white px-3 py-0.5 border-[3px] border-[var(--neo-black)] rounded-xl shadow-[var(--neo-shadow-sm)]">
                  LakuLagi?
                </span>
              </h2>
              <p className="font-semibold opacity-60 max-w-xl mx-auto">
                Kami percaya bahwa setiap barang punya kesempatan kedua — dan itu dimulai dari kamu.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {VALUES.map((v) => (
                <div key={v.title} className="neo-card p-6 hover-lift">
                  <div className="text-5xl mb-4">{v.emoji}</div>
                  <h3 className="font-extrabold text-xl mb-2">{v.title}</h3>
                  <p className="text-sm font-medium opacity-70 leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* === CERITA DIBALIK LAKULAGI === */}
        <section className="bg-white border-y-[4px] border-[var(--neo-black)] py-14 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-extrabold mb-8 text-center">Cerita di Balik LakuLagi</h2>
            <div className="neo-card p-6 sm:p-8 bg-[var(--neo-bg)]">
              <p className="font-semibold text-base leading-relaxed mb-4">
                LakuLagi lahir dari keresahan sederhana: <strong>mengapa barang bekas berkualitas 
                harus susah dijual?</strong>
              </p>
              <p className="font-medium text-sm leading-relaxed opacity-75 mb-4">
                Proyek ini dibangun sebagai Tugas Akhir dengan tujuan membuktikan bahwa platform 
                e-commerce modern bisa dibangun menggunakan teknologi web terkini — Next.js, 
                TypeScript, PostgreSQL serverless, dan desain neobrutalism yang ekspresif.
              </p>
              <p className="font-medium text-sm leading-relaxed opacity-75">
                Dalam proses pengembangannya, LakuLagi dilengkapi fitur-fitur nyata: sistem 
                pembayaran QRIS, chat antar pengguna, komunitas diskusi, manajemen toko seller, 
                dan panel admin lengkap — semua dibangun dari nol oleh satu developer.
              </p>
            </div>
          </div>
        </section>

        {/* === TIM === */}
        <section className="py-14 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-extrabold mb-10">Tim Pengembang</h2>
            <div className="flex justify-center">
              {TEAM.map((member) => (
                <div key={member.name} className="neo-card p-8 max-w-sm w-full hover-lift">
                  <div className={`w-20 h-20 ${member.color} rounded-2xl border-[4px] border-[var(--neo-black)] shadow-[var(--neo-shadow)] flex items-center justify-center text-4xl mx-auto mb-5`}>
                    {member.emoji}
                  </div>
                  <h3 className="font-extrabold text-xl mb-1">{member.name}</h3>
                  <p className="text-sm font-bold text-[var(--neo-primary)] mb-3">{member.role}</p>
                  <p className="text-sm font-medium opacity-70 leading-relaxed">{member.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* === CTA === */}
        <section className="bg-[var(--neo-black)] py-14 px-4 border-t-[4px] border-[var(--neo-black)]">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-extrabold text-white mb-4">
              Siap Bergabung dengan{' '}
              <span className="text-[var(--neo-accent)]">LakuLagi</span>?
            </h2>
            <p className="text-white/70 font-semibold mb-8">
              Daftar sekarang dan mulai perjalananmu di komunitas preloved terbesar Indonesia.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/register" className="neo-btn neo-btn-accent font-extrabold px-8 py-3 text-lg">
                🚀 Daftar Gratis
              </Link>
              <Link href="/products" className="neo-btn neo-btn-outline bg-transparent text-white border-white/40 hover:border-white px-8 py-3 text-lg">
                Lihat Produk
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
