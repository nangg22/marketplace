'use client';

import { useState, useEffect } from 'react';
import { toggleWishlist, checkWishlistStatus } from '@/app/wishlist/actions';
import { useSession } from 'next-auth/react';

interface WishlistButtonProps {
  productId: string;
  initialIsWishlisted?: boolean;
}

export default function WishlistButton({ productId, initialIsWishlisted = false }: WishlistButtonProps) {
  const { data: session } = useSession();
  const [isWishlisted, setIsWishlisted] = useState(initialIsWishlisted);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (session?.user && !hasChecked) {
      checkWishlistStatus(productId).then((res) => {
        setIsWishlisted(res.isWishlisted);
        setHasChecked(true);
      });
    }
  }, [productId, session, hasChecked]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.user) {
      alert('Silakan login untuk menambahkan ke wishlist!');
      return;
    }

    setIsLoading(true);
    // Optimistic UI update
    setIsWishlisted(!isWishlisted);

    try {
      const result = await toggleWishlist(productId);
      if (result.success) {
        setIsWishlisted(result.isWishlisted ?? false);
      } else {
        // Revert on fail
        setIsWishlisted(!isWishlisted);
        alert(result.error || result.message);
      }
    } catch (err) {
      setIsWishlisted(!isWishlisted);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`absolute top-1.5 sm:top-2 right-1.5 sm:right-2 p-1.5 sm:p-2 rounded-full border-[2px] border-[var(--neo-black)] shadow-[2px_2px_0px_var(--neo-black)] transition-transform hover:scale-110 active:scale-95 ${
        isWishlisted ? 'bg-[var(--neo-pink)] text-white' : 'bg-white text-[var(--neo-black)]'
      }`}
      title="Favorit"
    >
      <span className="text-xs sm:text-sm">{isWishlisted ? '❤️' : '🤍'}</span>
    </button>
  );
}
