"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toggleLike } from "@/app/explore/actions";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

export default function PostCard({ post }: { post: any }) {
  const router = useRouter();
  const [liked, setLiked] = useState(post.hasLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLiking) return;
    setIsLiking(true);
    setLiked(!liked);
    setLikesCount(liked ? likesCount - 1 : likesCount + 1);
    const res = await toggleLike(post.id);
    if (!res.success) {
      setLiked(liked);
      setLikesCount(likesCount);
    }
    setIsLiking(false);
  };

  const goToProfile = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/profile/${post.userId}`);
  };

  const goToProduct = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/products/${post.productId}`);
  };

  return (
    <Link
      href={`/explore/${post.id}`}
      className="block mb-4 break-inside-avoid"
    >
      <div className="neo-card p-0 overflow-hidden shadow-[4px_4px_0px_var(--neo-black)] flex flex-col group cursor-pointer hover:-translate-y-1 hover:shadow-[6px_6px_0px_var(--neo-black)] transition-all">

        {/* Gambar */}
        {post.imageUrl && (
          <div className="relative w-full">
            <img
              src={post.imageUrl}
              alt="Post image"
              className="w-full h-auto object-cover border-b-[3px] border-[var(--neo-black)]"
              loading="lazy"
            />
          </div>
        )}

        {/* Konten */}
        <div className="p-4 flex-grow flex flex-col">
          <p className="text-sm font-bold text-[var(--neo-black)] mb-3 leading-snug line-clamp-4">
            {post.content}
          </p>

          {/* Tag Produk */}
          {post.productId && (
            <button
              onClick={goToProduct}
              className="mb-3 w-full text-left"
            >
              <div className="bg-[var(--neo-white)] border-[2px] border-[var(--neo-black)] rounded-lg p-2 flex items-center gap-2 hover:bg-[var(--neo-gray)] transition-colors">
                {post.productImage ? (
                  <div className="w-10 h-10 rounded border border-[var(--neo-black)] overflow-hidden flex-shrink-0">
                    <img
                      src={post.productImage}
                      alt={post.productName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded border border-[var(--neo-black)] bg-[var(--neo-gray)] flex items-center justify-center text-xs flex-shrink-0">
                    📦
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-extrabold truncate text-[var(--neo-black)]">
                    {post.productName}
                  </p>
                  <p className="text-[10px] font-bold text-[var(--neo-pink)] mt-0.5">
                    Rp {post.productPrice?.toLocaleString("id-ID")}
                  </p>
                </div>
                <div className="bg-[var(--neo-accent)] p-1 rounded border border-[var(--neo-black)] text-[10px]">
                  🛒
                </div>
              </div>
            </button>
          )}

          <div className="mt-auto pt-3 border-t-2 border-dashed border-[var(--neo-black)]/10 flex items-center justify-between">
            {/* Profil — pakai button bukan Link agar tidak nested <a> */}
            <button
              onClick={goToProfile}
              className="flex items-center gap-2 hover:opacity-70 transition-opacity"
            >
              <div className="w-6 h-6 rounded-full border border-[var(--neo-black)] bg-[var(--neo-primary)] flex items-center justify-center overflow-hidden flex-shrink-0">
                {post.userAvatar ? (
                  <img
                    src={post.userAvatar}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] font-bold text-white uppercase">
                    {post.userName?.charAt(0)}
                  </span>
                )}
              </div>
              <span className="text-xs font-bold text-[var(--neo-black)] truncate max-w-[80px]">
                {post.userName}
              </span>
            </button>

            {/* Interaksi */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleLike}
                className="flex items-center gap-1 text-[var(--neo-black)] hover:opacity-70 transition-opacity"
              >
                <span className={`text-sm ${liked ? "text-red-500" : ""}`}>
                  {liked ? "❤️" : "🤍"}
                </span>
                <span className="text-xs font-bold">{likesCount}</span>
              </button>
              <div className="flex items-center gap-1 text-[var(--neo-black)] opacity-60">
                <span className="text-sm">💬</span>
                <span className="text-xs font-bold">{post.commentsCount}</span>
              </div>
            </div>
          </div>

          {/* Waktu */}
          <p className="text-[9px] font-bold text-[var(--neo-black)] opacity-40 mt-2 text-right">
            {formatDistanceToNow(new Date(post.createdAt), {
              addSuffix: true,
              locale: id,
            })}
          </p>
        </div>
      </div>
    </Link>
  );
}
