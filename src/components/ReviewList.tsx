import StarRating from "./StarRating";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  reviewText: string | null;
  isVerifiedPurchase: boolean;
  createdAt: string;
  userName: string;
}

export default function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <p className="text-sm text-gray-500">Belum ada review untuk produk ini.</p>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((r) => (
        <div key={r.id} className="border-b border-gray-100 pb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-sm">{r.userName}</span>
            {r.isVerifiedPurchase && (
              <span className="text-xs text-green-600 font-medium">
                ✅ Pembelian Terverifikasi
              </span>
            )}
          </div>
          <StarRating value={r.rating} readOnly size={16} />
          {r.title && (
            <p className="mt-2 text-sm font-semibold text-gray-800">{r.title}</p>
          )}
          {r.reviewText && (
            <p className="mt-1 text-sm text-gray-700">{r.reviewText}</p>
          )}
          <span className="text-xs text-gray-400 mt-1 block">
            {new Date(r.createdAt).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
      ))}
    </div>
  );
}