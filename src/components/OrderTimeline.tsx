'use client';

import { CheckCircle2, Circle } from "lucide-react";

const STEPS = [
  { key: "paid", label: "Pembayaran Dikonfirmasi" },
  { key: "processing", label: "Pesanan Diproses" },
  { key: "shipped", label: "Dikirim" },
  { key: "completed", label: "Selesai" },
];

interface HistoryItem {
  status: string;
  createdAt: string;
}

export default function OrderTimeline({ history }: { history: HistoryItem[] }) {
  const reachedStatuses = new Set(history.map((h) => h.status));

  return (
    <div className="space-y-4 neo-card p-6 bg-white animate-slide-up">
      <h3 className="font-extrabold text-lg mb-4 border-b-2 border-dashed border-[var(--neo-black)]/20 pb-2 flex items-center gap-2">
        <span>🕒</span> Status Pesanan
      </h3>
      {STEPS.map((step, i) => {
        // Assume 'completed' is reached if we have it, etc. (we can also check if a later state is reached to retroactively mark this)
        let reached = reachedStatuses.has(step.key);
        const record = history.find((h) => h.status === step.key);

        return (
          <div key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              {reached ? (
                <CheckCircle2 size={24} className="text-[var(--neo-green)] fill-white border-[2px] border-black rounded-full" />
              ) : (
                <Circle size={24} className="text-gray-300" />
              )}
              {i < STEPS.length - 1 && (
                <div className={`w-1 h-10 border-l-[3px] border-dashed ${reached ? "border-[var(--neo-green)]" : "border-gray-200"}`} />
              )}
            </div>
            <div>
              <p className={`text-sm font-bold ${reached ? "text-[var(--neo-black)]" : "text-gray-400"}`}>
                {step.label}
              </p>
              {record && (
                <p className="text-xs font-semibold opacity-60">
                  {new Date(record.createdAt).toLocaleString("id-ID")}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
