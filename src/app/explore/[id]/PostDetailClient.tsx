'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { toggleLike } from '@/app/explore/actions';

interface Comment {
  id: string;
  comment: string;
  createdAt: string;
  userId: string;
  userName: string | null;
  userAvatar: string | null;
}

interface Props {
  postId: string;
  initialLikesCount: number;
  initialHasLiked: boolean;
  initialComments: Comment[];
  currentUserId: string | null;
  currentUserName: string | null;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'baru saja';
  if (mins < 60) return `${mins} mnt lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam lalu`;
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

export default function PostDetailClient({
  postId,
  initialLikesCount,
  initialHasLiked,
  initialComments,
  currentUserId,
  currentUserName,
}: Props) {
  const [liked, setLiked] = useState(initialHasLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const lastTimestampRef = useRef<string | null>(
    initialComments.length > 0
      ? initialComments[initialComments.length - 1].createdAt
      : null
  );
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Polling komentar baru setiap 3 detik
  const pollComments = useCallback(async () => {
    if (!lastTimestampRef.current) {
      // Kalau belum ada komentar, ambil semua
      const res = await fetch(`/api/explore/${postId}/comments`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.comments.length > 0) {
        setComments(data.comments);
        lastTimestampRef.current = data.comments[data.comments.length - 1].createdAt;
      }
      return;
    }

    const res = await fetch(
      `/api/explore/${postId}/comments?after=${encodeURIComponent(lastTimestampRef.current)}`
    );
    if (!res.ok) return;
    const data = await res.json();
    if (data.comments.length > 0) {
      setComments((prev) => [...prev, ...data.comments]);
      lastTimestampRef.current = data.comments[data.comments.length - 1].createdAt;
    }
  }, [postId]);

  useEffect(() => {
    const interval = setInterval(pollComments, 3000);
    return () => clearInterval(interval);
  }, [pollComments]);

  // Scroll ke komentar terbaru
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments.length]);

  const handleLike = async () => {
    setLiked((prev) => !prev);
    setLikesCount((prev) => (liked ? prev - 1 : prev + 1));
    await toggleLike(postId);
  };

  const handleSendComment = async () => {
    if (!text.trim() || sending || !currentUserId) return;
    setSending(true);
    const commentText = text.trim();
    setText('');

    const res = await fetch(`/api/explore/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment: commentText }),
    });

    if (res.ok) {
      const data = await res.json();
      setComments((prev) => [...prev, data.comment]);
      lastTimestampRef.current = data.comment.createdAt;
    } else {
      setText(commentText);
    }
    setSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendComment();
    }
  };

  return (
    <div className="animate-slide-up stagger-2">
      {/* Tombol Interaksi */}
      <div className="neo-card p-4 mb-5 flex items-center gap-5">
        <button
          onClick={handleLike}
          disabled={!currentUserId}
          className="flex items-center gap-2 font-extrabold text-base hover:scale-110 transition-transform disabled:opacity-50"
        >
          <span className={`text-2xl transition-transform ${liked ? 'scale-125' : ''}`}>
            {liked ? '❤️' : '🤍'}
          </span>
          <span>{likesCount}</span>
          <span className="text-sm font-bold opacity-60">Suka</span>
        </button>

        <div className="h-8 w-[2px] bg-[var(--neo-black)] opacity-10" />

        <div className="flex items-center gap-2 font-extrabold text-base opacity-70">
          <span className="text-2xl">💬</span>
          <span>{comments.length}</span>
          <span className="text-sm font-bold opacity-60">Komentar</span>
        </div>

        <div className="ml-auto">
          <button
            onClick={() => inputRef.current?.focus()}
            className="neo-btn neo-btn-primary text-xs py-1.5 px-4 font-extrabold"
          >
            Ikut Komentar ↓
          </button>
        </div>
      </div>

      {/* Daftar Komentar */}
      <div className="neo-card overflow-hidden mb-4">
        <div className="bg-[var(--neo-black)] text-[var(--neo-accent)] px-5 py-3 border-b-[3px] border-[var(--neo-black)] flex items-center justify-between">
          <h2 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-2">
            💬 Diskusi ({comments.length})
          </h2>
          <span className="text-xs opacity-60 flex items-center gap-1">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse inline-block" />
            Otomatis diperbarui
          </span>
        </div>

        <div className="max-h-[400px] overflow-y-auto px-4 py-4 space-y-4 bg-[var(--neo-gray)]/20">
          {comments.length === 0 ? (
            <div className="text-center py-8 opacity-50">
              <div className="text-4xl mb-2">🌱</div>
              <p className="font-bold text-sm">Belum ada komentar. Jadi yang pertama!</p>
            </div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="flex gap-3 items-start">
                {/* Avatar */}
                <Link href={`/profile/${c.userId}`} className="flex-shrink-0">
                  <div className="w-9 h-9 rounded-xl border-[2px] border-[var(--neo-black)] bg-[var(--neo-secondary)] text-white flex items-center justify-center font-extrabold text-sm overflow-hidden shadow-[2px_2px_0px_var(--neo-black)]">
                    {c.userAvatar ? (
                      <img src={c.userAvatar} alt={c.userName ?? ''} className="w-full h-full object-cover" />
                    ) : (
                      c.userName?.charAt(0).toUpperCase() || '?'
                    )}
                  </div>
                </Link>

                {/* Bubble komentar */}
                <div className="flex-1 min-w-0">
                  <div className="bg-white border-[2px] border-[var(--neo-black)] rounded-2xl rounded-tl-sm px-3.5 py-2.5 shadow-[2px_2px_0px_var(--neo-black)]">
                    <div className="flex items-center gap-2 mb-1">
                      <Link href={`/profile/${c.userId}`}>
                        <span className="text-xs font-extrabold hover:underline">
                          {c.userName || 'Anonim'}
                        </span>
                      </Link>
                      {c.userId === currentUserId && (
                        <span className="text-[9px] bg-[var(--neo-primary)] text-white px-1.5 py-0.5 rounded font-bold">
                          Kamu
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium leading-relaxed break-words text-[var(--neo-black)] whitespace-pre-wrap">
                      {c.comment}
                    </p>
                  </div>
                  <p className="text-[10px] font-bold opacity-40 mt-1 px-1">
                    {timeAgo(c.createdAt)}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input komentar */}
        <div className="border-t-[3px] border-[var(--neo-black)] bg-white p-4">
          {currentUserId ? (
            <div className="flex gap-3 items-end">
              {/* Avatar user saat ini */}
              <div className="w-9 h-9 rounded-xl border-[2px] border-[var(--neo-black)] bg-[var(--neo-primary)] text-white flex items-center justify-center font-extrabold text-sm shadow-[2px_2px_0px_var(--neo-black)] flex-shrink-0">
                {currentUserName?.charAt(0).toUpperCase() || '?'}
              </div>

              <div className="flex-1 flex gap-2 items-end">
                <textarea
                  ref={inputRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Tulis komentarmu... (Enter kirim)"
                  rows={1}
                  maxLength={500}
                  className="flex-1 neo-input resize-none text-sm py-2 min-h-[40px] max-h-[120px]"
                />
                <button
                  onClick={handleSendComment}
                  disabled={!text.trim() || sending}
                  className="neo-btn neo-btn-primary py-2 px-4 font-extrabold text-sm disabled:opacity-50 shrink-0"
                >
                  {sending ? '⏳' : '➤'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold opacity-60">Login untuk ikut berkomentar</p>
              <Link href="/login" className="neo-btn neo-btn-primary text-sm py-2 px-5 font-extrabold">
                ✨ Masuk
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
