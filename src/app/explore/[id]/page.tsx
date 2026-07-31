import { db } from '@/lib/db';
import { posts, postComments, postLikes, users, products } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import PostDetailClient from './PostDetailClient';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const [post] = await db
    .select({ content: posts.content, imageUrl: posts.imageUrl })
    .from(posts)
    .where(eq(posts.id, id))
    .limit(1);

  if (!post) return { title: 'Postingan | LakuLagi' };
  return {
    title: `${post.content.slice(0, 60)}... | LakuLagi`,
    openGraph: { images: post.imageUrl ? [post.imageUrl] : [] },
  };
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: postId } = await params;
  const session = await getServerSession(authOptions);
  const currentUserId = (session?.user as any)?.id ?? null;

  // Ambil data post lengkap
  const result = await db
    .select({
      id: posts.id,
      content: posts.content,
      imageUrl: posts.imageUrl,
      createdAt: posts.createdAt,
      userId: posts.userId,
      userName: users.name,
      userAvatar: users.avatarUrl,
      productId: products.id,
      productName: products.name,
      productPrice: products.price,
      productImage: products.imageUrl,
    })
    .from(posts)
    .innerJoin(users, eq(users.id, posts.userId))
    .leftJoin(products, eq(products.id, posts.productId))
    .where(eq(posts.id, postId))
    .limit(1);

  const post = result[0];
  if (!post) notFound();

  // Likes
  const likesData = await db
    .select({ userId: postLikes.userId })
    .from(postLikes)
    .where(eq(postLikes.postId, postId));

  const likesCount = likesData.length;
  const hasLiked = currentUserId
    ? likesData.some((l) => l.userId === currentUserId)
    : false;

  // Komentar awal
  const initialComments = await db
    .select({
      id: postComments.id,
      comment: postComments.comment,
      createdAt: postComments.createdAt,
      userId: postComments.userId,
      userName: users.name,
      userAvatar: users.avatarUrl,
    })
    .from(postComments)
    .leftJoin(users, eq(postComments.userId, users.id))
    .where(eq(postComments.postId, postId))
    .orderBy(desc(postComments.createdAt))
    .limit(100);

  const formatRupiah = (price: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);

  return (
    <div className="flex flex-col min-h-screen bg-[var(--neo-bg)]">
      <Navbar />

      <main className="flex-grow max-w-2xl mx-auto px-4 py-6 w-full">
        {/* Breadcrumb */}
        <div className="mb-4 animate-slide-up">
          <Link
            href="/explore"
            className="text-sm font-bold opacity-60 hover:opacity-100 neo-link"
          >
            ← Kembali ke Explore
          </Link>
        </div>

        {/* Card Post */}
        <div className="neo-card overflow-hidden mb-6 animate-slide-up stagger-1">
          {/* Gambar */}
          {post.imageUrl && (
            <div className="w-full max-h-[480px] overflow-hidden border-b-[3px] border-[var(--neo-black)]">
              <img
                src={post.imageUrl}
                alt="Post"
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          <div className="p-5">
            {/* Header: Avatar + Nama + Waktu */}
            <div className="flex items-center gap-3 mb-4">
              <Link href={`/profile/${post.userId}`}>
                <div className="w-11 h-11 rounded-xl border-[3px] border-[var(--neo-black)] bg-[var(--neo-primary)] flex items-center justify-center font-extrabold text-white text-lg shadow-[2px_2px_0px_var(--neo-black)] overflow-hidden">
                  {post.userAvatar ? (
                    <img
                      src={post.userAvatar}
                      alt={post.userName ?? ''}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    post.userName?.charAt(0).toUpperCase()
                  )}
                </div>
              </Link>
              <div>
                <Link href={`/profile/${post.userId}`}>
                  <p className="font-extrabold text-base hover:underline">
                    {post.userName}
                  </p>
                </Link>
                <p className="text-xs font-bold opacity-50">
                  {new Date(post.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            {/* Konten */}
            <p className="text-sm sm:text-base font-medium leading-relaxed text-[var(--neo-black)] whitespace-pre-wrap mb-4">
              {post.content}
            </p>

            {/* Tag Produk */}
            {post.productId && post.productName && (
              <Link href={`/products/${post.productId}`}>
                <div className="bg-[var(--neo-gray)] border-[2px] border-[var(--neo-black)] rounded-xl p-3 flex items-center gap-3 hover:bg-[var(--neo-accent)]/20 transition-colors mb-4 shadow-[2px_2px_0px_var(--neo-black)]">
                  {post.productImage ? (
                    <img
                      src={post.productImage}
                      alt={post.productName}
                      className="w-14 h-14 rounded-lg border-[2px] border-[var(--neo-black)] object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg border-[2px] border-[var(--neo-black)] bg-white flex items-center justify-center text-2xl flex-shrink-0">
                      📦
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-sm line-clamp-1">
                      {post.productName}
                    </p>
                    <p className="text-[var(--neo-primary)] font-extrabold text-base">
                      {formatRupiah(post.productPrice ?? 0)}
                    </p>
                  </div>
                  <span className="neo-btn neo-btn-primary text-xs py-1.5 px-3 shrink-0">
                    🛒 Beli
                  </span>
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* Client Component: Like + Komentar Realtime */}
        <PostDetailClient
          postId={postId}
          initialLikesCount={likesCount}
          initialHasLiked={hasLiked}
          initialComments={initialComments.reverse().map(c => ({ ...c, createdAt: c.createdAt.toISOString() }))}
          currentUserId={currentUserId}
          currentUserName={(session?.user as any)?.name ?? null}
        />
      </main>

      <Footer />
    </div>
  );
}
