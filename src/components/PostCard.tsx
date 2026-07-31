"use client";

import Link from "next/link";
import { toggleLike } from "@/app/explore/actions";
import { useState } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

export default function PostCard({ post }: { post: any }) {
  const [liked, setLiked] = useState(post.hasLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    
    // Optimistic UI update
    setLiked(!liked);
    setLikesCount(liked ? likesCount - 1 : likesCount + 1);

    const res = await toggleLike(post.id);
    if (!res.success) {
      // Revert on error
      setLiked(liked);
      setLikesCount(likesCount);
    }
    
    setIsLiking(false);
  };

  return (
    <Link href={`/explore/${post.id}`} className="block mb-4 break-inside-avoid">
    <div className="neo-card p-0 overflow-hidden shadow-[4px_4px_0px_var(--neo-black)] flex flex-col group cursor-pointer hover:-translate-y-1 hover:shadow-[6px_6px_0px_var(--neo-black)] transition-all">
      {/* Gambar Postingan */}
      {post.imageUrl && (
        <div className="relative w-full">
          {/* We use standard img for masonry to avoid forced aspect ratios if not strict */}
          <img 
            src={post.imageUrl} 
            alt="Post image" 
            className="w-full h-auto object-cover border-b-[3px] border-[var(--neo-black)]"
            loading="lazy"
          />
        </div>
      )}

      {/* Konten Postingan */}
      <div className="p-4 flex-grow flex flex-col">
        <p className="text-sm font-bold text-[var(--neo-black)] mb-3 leading-snug line-clamp-4">
          {post.content}
        </p>

        {/* Tag Produk (jika ada) */}
        {post.productId && (
          <Link href={`/products/${post.productId}`} className="mb-3">
            <div className="bg-[var(--neo-white)] border-[2px] border-[var(--neo-black)] rounded-lg p-2 flex items-center gap-2 hover:bg-[var(--neo-gray)] transition-colors">
              {post.productImage ? (
                <div className="w-10 h-10 rounded border border-[var(--neo-black)] overflow-hidden flex-shrink-0 relative">
                  <Image src={post.productImage} alt={post.productName} fill className="object-cover" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded border border-[var(--neo-black)] bg-[var(--neo-gray)] flex items-center justify-center text-xs flex-shrink-0">
                  📦
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-extrabold truncate text-[var(--neo-black)]">{post.productName}</p>
                <p className="text-[10px] font-bold text-[var(--neo-pink)] mt-0.5">
                  Rp {post.productPrice.toLocaleString("id-ID")}
                </p>
              </div>
              <div className="bg-[var(--neo-accent)] p-1 rounded border border-[var(--neo-black)] text-[10px]">
                🛒
              </div>
            </div>
          </Link>
        )}

        <div className="mt-auto pt-3 border-t-2 border-dashed border-[var(--neo-black)]/10 flex items-center justify-between">
          {/* Profil Singkat */}
          <Link href={`/profile/${post.userId}`} className="flex items-center gap-2 group-hover:opacity-80">
            <div className="w-6 h-6 rounded-full border border-[var(--neo-black)] bg-[var(--neo-primary)] flex items-center justify-center overflow-hidden flex-shrink-0">
              {post.userAvatar ? (
                <img src={post.userAvatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] font-bold text-white uppercase">{post.userName.charAt(0)}</span>
              )}
            </div>
            <span className="text-xs font-bold text-[var(--neo-black)] truncate max-w-[80px]">
              {post.userName}
            </span>
          </Link>

          {/* Interaksi */}
          <div className="flex items-center gap-3">
            <button 
              onClick={(e) => { e.preventDefault(); handleLike(); }}
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
          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: id })}
        </p>
      </div>
    </div>
    </Link>
  );
}
