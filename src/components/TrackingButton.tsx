'use client';

import { useRouter } from 'next/navigation';

export default function TrackingButton({ orderId }: { orderId: string }) {
  const router = useRouter();

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        router.push(`/customer/orders/${orderId}/tracking`);
      }}
      className="inline-flex items-center gap-1 text-xs font-extrabold bg-[var(--neo-secondary)] text-white px-3 py-1.5 border-[2px] border-[var(--neo-black)] rounded-lg shadow-[2px_2px_0px_var(--neo-black)] hover:shadow-[3px_3px_0px_var(--neo-black)] hover:-translate-y-0.5 transition-all cursor-pointer"
    >
      📍 Lacak
    </button>
  );
}
