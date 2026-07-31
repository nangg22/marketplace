import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { db } from '@/lib/db';
import { products, users } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import type { Metadata } from 'next';

const GROUPS = [
  {
    id: 'tech-gadget',
    emoji: '💻',
    name: 'Tech & Gadget Preloved',
    desc: 'Jual beli laptop, HP, earbuds, dan aksesoris elektronik bekas mulus. No tipu-tipu!',
    members: 2841,
    color: '#7B4AE2',
    category: 'Tech',
  },
  {
    id: 'thrift-fashion',
    emoji: '🧥',
    name: 'Thrift Fashion Gen Z',
    desc: 'OOTD preloved berkualitas. Dari vintage sampai streetwear — semua ada di sini.',
    members: 5120,
    color: '#FF4081',
    category: 'Fashion',
  },
  {
    id: 'kosan-starter',
    emoji: '🪑',
    name: 'Kosan Starter Pack',
    desc: 'Meja belajar, kipas angin, rice cooker, kasur lipat — semua kebutuhan kos serba bekas tapi oke.',
    members: 1932,
    color: '#FF6B35',
    category: 'Kosan',
  },
  {
    id: 'hobi-fandom',
    emoji: '🎸',
    name: 'Hobi & Fandom Corner',
    desc: 'Photocard K-Pop, action figure, merchandise artis, buku komik — surga collector!',
    members: 3467,
    color: '#FFD23F',
    category: 'Hobi',
  },
  {
    id: 'buku-alat-tulis',
    emoji: '📚',
    name: 'Buku & Alat Tulis',
    desc: 'Buku kuliah, novel, kamus, stationery aesthetic — bekas tapi ilmunya tetap sama.',
    members: 1245,
    color: '#00C853',
    category: 'Buku',
  },
  {
    id: 'olahraga-outdoor',
    emoji: '⚽',
    name: 'Olahraga & Outdoor',
    desc: 'Sepatu futsal, jersey, sepeda, camping gear preloved dalam kondisi prima.',
    members: 987,
    color: '#2979FF',
    category: 'Olahraga',
  },
];

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const group = GROUPS.find((g) => g.id === id);
  if (!group) return { title: 'Grup Tidak Ditemukan | LakuLagi' };
  return { title: `${group.name} | LakuLagi`, description: group.desc };
}

export default async function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const group = GROUPS.find((g) => g.id === id);

  // Ambil produk berdasarkan kategori grup ini agar feed terlihat hidup
  let groupProducts: Array<{
    id: string;
    name: string;
    price: number;
    imageUrl: string | null;
    condition: string | null;
    isNegotiable: boolean | null;
    sellerId: string;
    sellerName: string;
  }> = [];
  if (group) {
    const rawProducts = await db
      .select({
        id: products.id,
        name: products.name,
        price: products.price,
        imageUrl: products.imageUrl,
        condition: products.condition,
        isNegotiable: products.isNegotiable,
        sellerId: products.sellerId,
        sellerName: users.name,
      })
      .from(products)
      .leftJoin(users, eq(products.sellerId, users.id))
      .where(eq(products.category, group.category))
      .orderBy(desc(products.createdAt))
      .limit(8);

    groupProducts = rawProducts.map((p) => ({
      ...p,
      sellerName: p.sellerName || 'Anonim',
    }));
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-[var(--neo-bg)] flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center p-4">
          <div className="neo-card p-12 text-center max-w-md w-full animate-bounce-in">
            <div className="text-6xl mb-4">👻</div>
            <h1 className="text-2xl font-extrabold mb-2">Grup Tidak Ditemukan</h1>
            <p className="opacity-60 mb-6 font-medium">Komunitas ini mungkin sudah dihapus atau URL-nya salah.</p>
            <Link href="/groups" className="neo-btn neo-btn-primary w-full">← Kembali ke Daftar Grup</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--neo-bg)] flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-5xl mx-auto px-4 py-8 w-full">
        {/* === HEADER GRUP === */}
        <div className="neo-card overflow-hidden mb-8 animate-slide-up">
          {/* Cover */}
          <div
            className="h-32 md:h-48 relative border-b-[4px] border-[var(--neo-black)] flex items-center justify-center overflow-hidden"
            style={{ background: group.color }}
          >
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #000 2px, transparent 2px)', backgroundSize: '16px 16px' }}></div>
            <span className="text-[120px] opacity-20 absolute -right-6 -bottom-8 rotate-12">{group.emoji}</span>
            <span className="text-7xl relative z-10 animate-bounce-in">{group.emoji}</span>
          </div>

          {/* Info & Aksi */}
          <div className="p-6 relative">
            <div className="neo-card p-4 mb-5 bg-[var(--neo-accent)]/20">
              <p className="text-sm font-bold opacity-80">
                Grup ini sedang berjalan dalam mode preview. Kamu sudah bisa menjelajahi produk berdasarkan minat komunitas, sedangkan diskusi aktif saat ini dipusatkan di halaman Explore dan chat.
              </p>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h1 className="text-3xl font-extrabold">{group.name}</h1>
                  <span className="neo-sticker text-xs px-2 py-1 bg-white text-[var(--neo-black)] border-[2px] border-[var(--neo-black)] shadow-[2px_2px_0px_var(--neo-black)]">
                    {group.members.toLocaleString('id-ID')} Anggota
                  </span>
                </div>
                <p className="text-sm font-medium opacity-80 max-w-xl">{group.desc}</p>
              </div>
              <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                <Link href="/explore" className="neo-btn neo-btn-accent text-sm py-2 px-6 flex-1 md:flex-none text-center">
                  🌍 Lihat Diskusi
                </Link>
                <Link href="/chat" className="neo-btn neo-btn-outline text-sm py-2 px-4 flex-none" title="Buka chat">
                  💬
                </Link>
              </div>
            </div>
          </div>

          {/* Menu Tab */}
          <div className="flex border-t-[3px] border-[var(--neo-black)] overflow-x-auto scrollbar-hide">
            {['Diskusi Feed', 'Pasar (Barang Dijual)', 'Anggota', 'Tentang'].map((tab, i) => (
              <button
                key={tab}
                className={`py-3 px-6 text-sm font-extrabold whitespace-nowrap border-r-[3px] border-[var(--neo-black)] ${
                  i === 1 ? 'bg-[var(--neo-black)] text-[var(--neo-accent)]' : 'bg-white hover:bg-[var(--neo-gray)]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* === KONTEN TAB: PASAR (Barang Dijual) === */}
        <div className="animate-slide-up stagger-1">
          <div className="flex items-center justify-between mb-5 border-b-[3px] border-[var(--neo-black)] pb-3">
            <h2 className="text-xl font-extrabold flex items-center gap-2">
              <span className="bg-[var(--neo-black)] text-[var(--neo-accent)] px-2 py-1 rounded-lg text-xs">🛍️</span>
              Barang Terbaru di Grup
            </h2>
            <Link href="/seller/products/create" className="neo-btn neo-btn-primary text-xs py-1.5 px-3">
              + Jual Barang Disini
            </Link>
          </div>

          {groupProducts.length === 0 ? (
            <div className="neo-card p-12 text-center">
              <div className="text-5xl mb-3 animate-float">🪴</div>
              <h3 className="font-extrabold text-lg mb-2">Belum Ada Barang</h3>
              <p className="text-sm opacity-60 font-medium">Jadilah yang pertama menjual barang di komunitas ini!</p>
              <Link href="/seller/products/create" className="neo-btn neo-btn-accent mt-4 inline-flex">
                🚀 Post Barang Sekarang
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {groupProducts.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* === POSTINGAN KOMUNITAS (PREVIEW) === */}
        <div className="mt-12 animate-slide-up stagger-2">
          <div className="flex items-center justify-between mb-5 border-b-[3px] border-[var(--neo-black)] pb-3">
            <h2 className="text-xl font-extrabold flex items-center gap-2">
              <span className="bg-[var(--neo-primary)] text-white px-2 py-1 rounded-lg text-xs">💬</span>
              Preview Obrolan Komunitas
            </h2>
            <Link href="/explore/create" className="neo-btn neo-btn-outline text-xs py-1.5 px-3">
              Bikin Postingan
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((postNum) => (
              <div key={postNum} className="neo-card p-5 hover-lift">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full border-[2px] border-[var(--neo-black)] bg-[var(--neo-pink)] flex items-center justify-center font-bold text-white">
                    {postNum === 1 ? 'A' : 'B'}
                  </div>
                  <div>
                    <div className="font-extrabold text-sm">{postNum === 1 ? 'Andi Susanto' : 'Budi Santoso'}</div>
                    <div className="text-[10px] opacity-60 font-bold">2 jam yang lalu</div>
                  </div>
                </div>
                <p className="text-sm font-medium opacity-80 mb-4 line-clamp-3">
                  {postNum === 1
                    ? `Ada yang pernah beli ${group.category.toLowerCase()} second dari akun "Toko Amanah"? Rekomendasi dong, lagi nyari yang mulus nih. Harganya masuk akal ga ya?`
                    : `Tips buat yang mau COD barang ${group.category.toLowerCase()}: pastikan cek fisik langsung pas ketemu, jangan cuma dari foto. Kemarin hampir ketipu untung teliti!`}
                </p>
                <div className="flex gap-4 pt-3 border-t-[2px] border-dashed border-[var(--neo-black)] border-opacity-20 text-xs font-bold">
                  <button className="flex items-center gap-1 hover:text-[var(--neo-pink)]">❤️ 12 Suka</button>
                  <button className="flex items-center gap-1 hover:text-[var(--neo-primary)]">💬 4 Komentar</button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}
