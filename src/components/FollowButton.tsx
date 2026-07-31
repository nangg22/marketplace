'use client';

import { useState, useTransition } from 'react';
import { toggleFollow } from '@/app/profile/actions';

interface FollowButtonProps {
  targetUserId: string;
  initialIsFollowing?: boolean;
  className?: string;
  small?: boolean;
}

export default function FollowButton({ targetUserId, initialIsFollowing = false, className = '', small = false }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isPending, startTransition] = useTransition();

  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!targetUserId) return;

    // Optimistic UI update
    const prev = isFollowing;
    setIsFollowing(!prev);

    startTransition(async () => {
      const res = await toggleFollow(targetUserId);
      if (!res?.success) {
        // Revert on failure
        setIsFollowing(prev);
        if (res?.error) alert(res.error);
      } else {
        setIsFollowing(Boolean(res.isFollowing));
      }
    });
  };

  if (small) {
    return (
      <button
        onClick={handleFollow}
        disabled={isPending}
        className={`text-[10px] hover:underline flex-shrink-0 font-extrabold ${isFollowing ? 'text-[var(--neo-black)] opacity-60' : 'text-[var(--neo-primary)]'}`}
      >
        {isFollowing ? 'Mengikuti' : '+ Follow'}
      </button>
    );
  }

  return (
    <button
      onClick={handleFollow}
      disabled={isPending}
      className={`neo-btn text-sm py-1.5 px-4 ${isFollowing ? 'neo-btn-outline' : 'neo-btn-secondary'} ${className}`}
    >
      {isFollowing ? 'Mengikuti' : '+ Follow'}
    </button>
  );
}
