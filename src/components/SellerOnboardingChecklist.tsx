import { CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";

interface OnboardingStatus {
  hasStoreProfile: boolean;
  hasFirstProduct: boolean;
  hasPaymentSetup: boolean;
}

export default function SellerOnboardingChecklist({ status }: { status: OnboardingStatus }) {
  const steps = [
    { key: "hasStoreProfile", label: "Lengkapi profil toko", href: "/seller/settings" },
    { key: "hasFirstProduct", label: "Upload produk pertama", href: "/seller/products/create" },
    { key: "hasPaymentSetup", label: "Hubungkan rekening pembayaran", href: "/seller/payment" },
  ] as const;

  const doneCount = steps.filter((s) => status[s.key as keyof OnboardingStatus]).length;

  if (doneCount === steps.length) return null; // sudah selesai, tidak perlu ditampilkan lagi

  return (
    <div className="neo-card p-5 mb-8 bg-[var(--neo-white)] animate-slide-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
        <div>
          <h2 className="text-xl font-extrabold flex items-center gap-2">
            <span>🚀</span> Lengkapi Toko Kamu
          </h2>
          <p className="text-sm font-semibold opacity-70 mt-1">Selesaikan 3 langkah mudah ini untuk mulai berjualan!</p>
        </div>
        <span className="neo-badge bg-[var(--neo-primary)] text-[var(--neo-black)] font-extrabold text-sm border-[2px] border-[var(--neo-black)] px-3 py-1">
          {doneCount}/{steps.length} Selesai
        </span>
      </div>
      
      <div className="space-y-3">
        {steps.map((step) => (
          <Link
            key={step.key}
            href={step.href}
            className={`flex items-center gap-3 p-3 rounded-lg border-[2px] transition-all hover-lift ${
              status[step.key as keyof OnboardingStatus]
                ? "border-transparent bg-gray-100 opacity-60"
                : "border-[var(--neo-black)] bg-[var(--neo-accent)]"
            }`}
          >
            {status[step.key as keyof OnboardingStatus] ? (
              <CheckCircle2 size={24} className="text-[var(--neo-green)] fill-white" />
            ) : (
              <Circle size={24} className="text-[var(--neo-black)] fill-white" />
            )}
            <span className={`font-bold ${status[step.key as keyof OnboardingStatus] ? "line-through" : ""}`}>
              {step.label}
            </span>
            {!status[step.key as keyof OnboardingStatus] && (
               <span className="ml-auto text-sm font-extrabold">&rarr;</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
