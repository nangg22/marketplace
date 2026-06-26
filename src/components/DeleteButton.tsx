'use client';

import { useTransition } from 'react';

interface DeleteButtonProps {
  productId: string;
  productName: string;
  action: (formData: FormData) => Promise<void>;
}

export default function DeleteButton({ productId, productName, action }: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const confirmed = window.confirm(
      `Hapus produk "${productName}"?\n\nTindakan ini tidak bisa dibatalkan.`
    );
    if (!confirmed) return;

    const formData = new FormData();
    formData.set('id', productId);

    startTransition(() => {
      action(formData);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="neo-btn neo-btn-outline w-full py-2 text-sm bg-red-100 hover:bg-[var(--neo-pink)] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isPending ? '⏳ Menghapus...' : '🗑️ Hapus'}
    </button>
  );
}