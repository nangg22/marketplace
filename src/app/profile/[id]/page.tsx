import { db } from '@/lib/db';
import { products, users } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import FollowButton from '@/components/FollowButton';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

async function getUserById(id: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) return null;

  const result = await db
    .select({
      id: users.id,
      name: users.name,
      role: users.role,
      bio: users.bio,
      avatarUrl: users.avatarUrl,
      storeName: users.storeName,
      storeDescription: users.storeDescription,
      city: users.city,
      province: users.province,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return result[0];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const user = await getUserById(id);
  if (!user) return { title: 'Profil | LakuLagi' };
  const displayName = user.storeName || user.name;
  return {
    title: `${displayName} | LakuLagi`,
    description: user.bio || user.storeDescription || `Lihat profil dan barang preloved dari ${displayName} di LakuLagi.`,
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profileUser = await getUserById(id);

  if (!profileUser) notFound();

  const session = await getServerSession(authOptions);
  const isOwnProfile = (session?.user as any)?.id === profileUser.id;
  const currentUserId = (session?.user as any)?.id;

  // Cek status follow
  let initialIsFollowing = false;
  if (currentUserId && !isOwnProfile) {
    const { followers } = await import('@/lib/schema');
    const existing = await db.select().from(followers).where(and(eq(followers.followerId, currentUserId), eq(followers.followingId, profileUser.id))).limit(1);
    initialIsFollowing = existing.length > 0;
  }

  // Ambil semua produk aktif dari user ini (kalau seller)
  const userProducts =
    profileUser.role === 'seller'
      ? await db
          .select({
            id: products.id,
            name: products.name,
            price: products.price,
            imageUrl: products.imageUrl,
            condition: products.condition,
            isNegotiable: products.isNegotiable,
            sellerName: users.name,
          })
          .from(products)
          .leftJoin(users, eq(products.sellerId, users.id))
          .where(and(eq(products.sellerId, profileUser.id), eq(products.isSuspended, false)))
      : [];

  const displayName = profileUser.storeName || profileUser.name;
  const initial = displayName.charAt(0).toUpperCase();
  const locationText = [profileUser.city, profileUser.province].filter(Boolean).join(', ');

  const ROLE_LABEL: Record<string, { label: string; color: string; emoji: string }> = {
    seller:   { label: 'Seller Preloved', color: 'bg-[var(--neo-secondary)] text-white', emoji: '🏪' },
    customer: { label: 'Pembeli',          color: 'bg-[var(--neo-accent)] text-[var(--neo-black)]', emoji: '🛍️' },
    admin:    { label: 'Admin',            color: 'bg-[var(--neo-black)] text-[var(--neo-accent)]', emoji: '🛡️' },
  };
  const roleInfo = ROLE_LABEL[profileUser.role] ?? ROLE_LABEL.customer;

  return (
    <div className="min-h-screen bg-[var(--neo-bg)] flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-5xl mx-auto px-4 py-8 w-full">

        {/* === PROFILE HEADER CARD === */}
        <div className="neo-card overflow-hidden mb-6 animate-slide-up">
          {/* Cover banner */}
          <div className="h-32 md:h-44 bg-[var(--neo-secondary)] relative border-b-[4px] border-[var(--neo-black)]"
            style={{
              background: 'repeating-linear-gradient(135deg, #7B4AE2 0px, #7B4AE2 20px, #FF6B35 20px, #FF6B35 40px)',
            }}
          >
            {/* Dekorasi */}
            <div className="absolute top-4 right-6 text-4xl animate-float opacity-60 select-none hidden md:block">✦</div>
            <div className="absolute bottom-4 left-1/3 text-3xl animate-float opacity-40 select-none hidden md:block" style={{ animationDelay: '0.7s' }}>★</div>
          </div>

          {/* Avatar + Info */}
          <div className="px-6 pb-6 relative">
            {/* Avatar */}
            <div className="absolute -top-10 left-6 w-20 h-20 md:w-24 md:h-24 rounded-2xl border-[4px] border-[var(--neo-black)] bg-[var(--neo-primary)] text-white flex items-center justify-center text-3xl font-extrabold shadow-[4px_4px_0px_var(--neo-black)] overflow-hidden">
              {profileUser.avatarUrl ? (
                <img src={profileUser.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : initial}
            </div>

            {/* Tombol aksi (kanan atas) */}
            <div className="flex justify-end pt-3 mb-4 gap-2">
              {isOwnProfile ? (
                <Link href="/profile" className="neo-btn neo-btn-outline text-sm py-1.5 px-4">
                  ✏️ Edit Profil
                </Link>
              ) : (
                <>
                  <FollowButton targetUserId={profileUser.id} initialIsFollowing={initialIsFollowing} />
                  <form action={async () => {
                    "use server";
                    const { getOrCreateChat } = await import('@/app/chat/actions');
                    const { redirect } = await import('next/navigation');
                    const res = await getOrCreateChat(profileUser.id);
                    if (res.success && res.chatId) redirect(`/chat/${res.chatId}`);
                  }}>
                    <button type="submit" className="neo-btn neo-btn-outline text-sm py-1.5 px-4">
                      💬 Chat
                    </button>
                  </form>
                </>
              )}
            </div>

            {/* Nama + badge role */}
            <div className="mt-8 md:mt-10">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-extrabold">{displayName}</h1>
                <span className={`neo-sticker text-xs px-2 py-1 border-[2px] border-[var(--neo-black)] shadow-[2px_2px_0px_var(--neo-black)] ${roleInfo.color}`}>
                  {roleInfo.emoji} {roleInfo.label}
                </span>
              </div>
              {profileUser.storeName && profileUser.name !== profileUser.storeName && (
                <p className="text-sm opacity-50 font-semibold mb-1">oleh {profileUser.name}</p>
              )}
              {locationText && (
                <p className="text-sm opacity-60 font-medium flex items-center gap-1">
                  <span>📍</span> {locationText}
                </p>
              )}
            </div>

            {/* Bio */}
            {(profileUser.bio || profileUser.storeDescription) && (
              <p className="mt-4 text-sm font-medium leading-relaxed opacity-80 max-w-xl border-l-[4px] border-[var(--neo-primary)] pl-3">
                {profileUser.storeDescription || profileUser.bio}
              </p>
            )}

            {/* Stats baris */}
            <div className="flex gap-6 mt-5 pt-5 border-t-[2px] border-dashed border-[var(--neo-black)] border-opacity-20">
              <div className="text-center">
                <div className="text-xl font-extrabold">{userProducts.length}</div>
                <div className="text-xs opacity-50 font-bold">Barang</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-extrabold">—</div>
                <div className="text-xs opacity-50 font-bold">Follower</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-extrabold">—</div>
                <div className="text-xs opacity-50 font-bold">Terjual</div>
              </div>
            </div>
          </div>
        </div>

        {/* === BARANG DIJUAL === */}
        {profileUser.role === 'seller' && (
          <div className="animate-slide-up stagger-2">
            <div className="flex items-center justify-between mb-5 border-b-[3px] border-[var(--neo-black)] pb-3">
              <h2 className="text-xl font-extrabold flex items-center gap-2">
                <span className="bg-[var(--neo-black)] text-[var(--neo-accent)] px-2 py-1 rounded-lg text-xs">🛍️</span>
                Barang Preloved ({userProducts.length})
              </h2>
              {isOwnProfile && (
                <Link href="/seller/products/create" className="neo-btn neo-btn-primary text-xs py-1.5 px-3">
                  + Post Barang
                </Link>
              )}
            </div>

            {userProducts.length === 0 ? (
              <div className="neo-card p-12 text-center">
                <div className="text-5xl mb-3 animate-float">🪴</div>
                <h3 className="font-extrabold text-lg mb-2">Belum Ada Barang</h3>
                <p className="text-sm opacity-60 font-medium">
                  {isOwnProfile
                    ? 'Kamu belum punya listing barang. Yuk post sekarang!'
                    : 'Seller ini belum memposting barang apa pun.'}
                </p>
                {isOwnProfile && (
                  <Link href="/seller/products/create" className="neo-btn neo-btn-accent mt-4 inline-flex">
                    📸 Post Pertamamu
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {userProducts.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Non-seller: tampilan khusus */}
        {profileUser.role === 'customer' && (
          <div className="neo-card p-10 text-center animate-slide-up stagger-2">
            <div className="text-5xl mb-3">🛍️</div>
            <h3 className="font-extrabold text-lg mb-2">Pembeli Aktif</h3>
            <p className="text-sm opacity-60 font-medium">
              Pengguna ini adalah pembeli di LakuLagi.
            </p>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
