import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Grup Komunitas | LakuLagi',
  description: 'Temukan komunitas preloved favoritmu. Jual, beli, dan diskusi bareng anggota grup di LakuLagi.',
};

// Data statis grup — nanti bisa diganti dengan data dari DB
const GROUPS = [
  {
    id: 'tech-gadget',
    emoji: '💻',
    name: 'Tech & Gadget Preloved',
    desc: 'Jual beli laptop, HP, earbuds, dan aksesoris elektronik bekas mulus. No tipu-tipu!',
    members: 2841,
    posts: 134,
    color: '#7B4AE2',
    tags: ['Laptop', 'HP', 'Gaming', 'Audio'],
  },
  {
    id: 'thrift-fashion',
    emoji: '🧥',
    name: 'Thrift Fashion Gen Z',
    desc: 'OOTD preloved berkualitas. Dari vintage sampai streetwear — semua ada di sini.',
    members: 5120,
    posts: 287,
    color: '#FF4081',
    tags: ['Vintage', 'Streetwear', 'Sneakers', 'Aksesoris'],
  },
  {
    id: 'kosan-starter',
    emoji: '🪑',
    name: 'Kosan Starter Pack',
    desc: 'Meja belajar, kipas angin, rice cooker, kasur lipat — semua kebutuhan kos serba bekas tapi oke.',
    members: 1932,
    posts: 98,
    color: '#FF6B35',
    tags: ['Furnitur', 'Elektronik', 'Dapur', 'Alat Tidur'],
  },
  {
    id: 'hobi-fandom',
    emoji: '🎸',
    name: 'Hobi & Fandom Corner',
    desc: 'Photocard K-Pop, action figure, merchandise artis, buku komik — surga collector!',
    members: 3467,
    posts: 201,
    color: '#FFD23F',
    tags: ['K-Pop', 'Anime', 'Komik', 'Merchandise'],
  },
  {
    id: 'buku-alat-tulis',
    emoji: '📚',
    name: 'Buku & Alat Tulis',
    desc: 'Buku kuliah, novel, kamus, stationery aesthetic — bekas tapi ilmunya tetap sama.',
    members: 1245,
    posts: 76,
    color: '#00C853',
    tags: ['Buku Kuliah', 'Novel', 'Stationery', 'Modul'],
  },
  {
    id: 'olahraga-outdoor',
    emoji: '⚽',
    name: 'Olahraga & Outdoor',
    desc: 'Sepatu futsal, jersey, sepeda, camping gear preloved dalam kondisi prima.',
    members: 987,
    posts: 54,
    color: '#2979FF',
    tags: ['Sepeda', 'Camping', 'Jersey', 'Sepatu Sport'],
  },
];

export default function GroupsPage() {
  return (
    <div className="min-h-screen bg-[var(--neo-bg)] flex flex-col">
      <Navbar />

      <main className="flex-grow">

        {/* === HERO === */}
        <section className="relative bg-[var(--neo-black)] border-b-[4px] border-[var(--neo-black)] py-12 overflow-hidden">
          <div className="absolute inset-0 neo-dots-pattern" style={{ opacity: 0.08 }} />
          {/* Dekorasi */}
          <div className="absolute top-6 left-12 text-5xl animate-float opacity-30 select-none hidden lg:block">👥</div>
          <div className="absolute top-10 right-20 text-4xl animate-float opacity-20 select-none hidden lg:block" style={{ animationDelay: '0.8s' }}>💬</div>
          <div className="absolute bottom-6 left-1/3 text-3xl animate-float opacity-20 select-none hidden lg:block" style={{ animationDelay: '0.4s' }}>✦</div>

          <div className="relative max-w-5xl mx-auto px-4 text-center">
            <div className="inline-block bg-[var(--neo-accent)] text-[var(--neo-black)] text-xs font-extrabold px-4 py-2 border-[3px] border-[var(--neo-black)] rounded-xl shadow-[3px_3px_0px_var(--neo-accent)] mb-5 animate-bounce-in rotate-[-1deg]">
              🔥 Fitur Baru — Grup Komunitas
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 animate-slide-up leading-tight">
              Gabung <span className="text-[var(--neo-accent)]">Komunitas</span>
              <br />Preloved Favoritmu
            </h1>
            <p className="text-white/70 font-semibold max-w-xl mx-auto mb-8 animate-slide-up stagger-2">
              Diskusi, jual, beli, dan tanya-jawab bersama orang-orang yang punya minat sama persis kayak kamu.
            </p>
            <div className="flex flex-wrap gap-3 justify-center animate-slide-up stagger-3">
              <Link href="#semua-grup" className="neo-btn neo-btn-accent text-sm py-2.5 px-6 font-extrabold">
                🔍 Jelajahi Grup
              </Link>
              <Link href="/explore/create" className="neo-btn neo-btn-outline bg-transparent text-white border-white/40 hover:border-white hover:bg-white/10 text-sm py-2.5 px-6">
                ✍️ Buat Postingan Komunitas
              </Link>
            </div>
          </div>
        </section>

        {/* === STATS BAR === */}
        <div className="bg-[var(--neo-accent)] border-b-[3px] border-[var(--neo-black)] py-3 px-4">
          <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-6 md:gap-12 text-[var(--neo-black)] font-extrabold text-sm">
            <span>👥 15,592 Anggota Aktif</span>
            <span>🏘️ {GROUPS.length} Komunitas</span>
            <span>📝 850+ Postingan Minggu Ini</span>
            <span>🤝 1,200+ Transaksi Berhasil</span>
          </div>
        </div>

        {/* === GRID GRUP === */}
        <section id="semua-grup" className="relative py-12">
          <div className="absolute inset-0 neo-grid-pattern" />
          <div className="relative max-w-5xl mx-auto px-4">
            <div className="neo-card p-4 mb-6 bg-[var(--neo-accent)]/20">
              <p className="text-sm font-bold opacity-80">
                Fitur grup saat ini berfungsi sebagai kurasi komunitas dan etalase kategori. Diskusi aktif dipusatkan di halaman Explore dan percakapan lanjut lewat fitur chat.
              </p>
            </div>

            <div className="flex items-center justify-between mb-8 border-b-[3px] border-[var(--neo-black)] pb-4">
              <h2 className="text-2xl font-extrabold flex items-center gap-2">
                <span className="bg-[var(--neo-black)] text-[var(--neo-accent)] p-2 rounded-xl text-xs rotate-[-2deg]">🏘️</span>
                Semua Komunitas
              </h2>
              <span className="text-sm font-bold opacity-50">{GROUPS.length} grup tersedia</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {GROUPS.map((group, i) => (
                <div
                  key={group.id}
                  className={`neo-card overflow-hidden flex flex-col hover:translate-y-[-4px] transition-transform duration-200 animate-slide-up stagger-${Math.min(i + 1, 12)}`}
                >
                  {/* Header warna */}
                  <div
                    className="h-20 flex items-center justify-between px-5 border-b-[3px] border-[var(--neo-black)]"
                    style={{ background: group.color }}
                  >
                    <span className="text-4xl">{group.emoji}</span>
                    <div className="text-right text-white text-xs font-extrabold opacity-80">
                      <div>{group.members.toLocaleString('id-ID')} anggota</div>
                      <div>{group.posts} postingan</div>
                    </div>
                  </div>

                  {/* Konten */}
                  <div className="p-5 flex flex-col flex-grow bg-white">
                    <h3 className="font-extrabold text-base leading-tight mb-2">{group.name}</h3>
                    <p className="text-xs font-medium opacity-60 leading-relaxed mb-4 flex-grow">{group.desc}</p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {group.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-bold px-2 py-0.5 border-[2px] border-[var(--neo-black)] rounded-md bg-[var(--neo-gray)]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* CTA */}
                    <Link
                      href={`/groups/${group.id}`}
                      className="neo-btn neo-btn-primary w-full text-sm py-2 font-extrabold"
                    >
                      Masuk Grup →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* === CARA KERJA === */}
        <section className="bg-[var(--neo-black)] border-t-[4px] border-[var(--neo-black)] py-14">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-extrabold text-white mb-10">
              Cara Kerjanya <span className="text-[var(--neo-accent)]">Simpel Banget</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { step: '01', emoji: '🔍', title: 'Pilih Grup', desc: 'Cari komunitas yang sesuai minat atau kebutuhanmu.' },
                { step: '02', emoji: '📸', title: 'Post Barangmu', desc: 'Upload foto, set harga, pilih kondisi — selesai dalam 30 detik.' },
                { step: '03', emoji: '🤝', title: 'Deal Deh!', desc: 'Pembeli tertarik? Chat langsung dan transaksi dengan aman.' },
              ].map((item) => (
                <div key={item.step} className="neo-card bg-white p-6 text-left hover-lift">
                  <div className="text-xs font-extrabold text-[var(--neo-accent)] bg-[var(--neo-black)] inline-block px-2 py-0.5 rounded-md mb-3">
                    {item.step}
                  </div>
                  <div className="text-4xl mb-3">{item.emoji}</div>
                  <h3 className="font-extrabold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm opacity-60 font-medium leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-10">
              <Link href="/seller/products/create" className="neo-btn neo-btn-accent text-base py-3 px-8 font-extrabold">
                🚀 Mulai Jual Sekarang
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
