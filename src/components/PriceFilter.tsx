"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";

const PRESETS = [
  { label: "Di bawah Rp50rb", min: 0, max: 50000 },
  { label: "Rp50rb - Rp150rb", min: 50000, max: 150000 },
  { label: "Rp150rb - Rp500rb", min: 150000, max: 500000 },
  { label: "Di atas Rp500rb", min: 500000, max: undefined },
];

export default function PriceFilter({ className = "" }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [min, setMin] = useState(searchParams.get("minPrice") ?? "");
  const [max, setMax] = useState(searchParams.get("maxPrice") ?? "");

  function applyFilter(newMin?: string | number, newMax?: string | number) {
    const params = new URLSearchParams(searchParams.toString());
    if (newMin !== undefined && newMin !== "") params.set("minPrice", String(newMin));
    else params.delete("minPrice");

    if (newMax !== undefined && newMax !== "") params.set("maxPrice", String(newMax));
    else params.delete("maxPrice");

    router.push(`${pathname}?${params.toString()}`);
  }

  // Check if any filter is active (for highlighting preset buttons)
  const activePreset = PRESETS.find(
    (p) => String(p.min) === min && (p.max === undefined ? !max : String(p.max) === max)
  );

  return (
    <div className={`neo-card p-4 ${className}`}>
      <p className="font-extrabold text-sm mb-3 uppercase tracking-wider text-[var(--neo-black)] border-b-2 border-[var(--neo-black)] pb-2">
        💰 Filter Harga
      </p>
      
      <div className="space-y-1 mb-4">
        {PRESETS.map((p) => {
          const isActive = activePreset?.label === p.label;
          return (
            <button
              key={p.label}
              onClick={() => applyFilter(p.min, p.max)}
              className={`block w-full text-left text-sm font-bold py-1.5 px-2 rounded-lg transition-colors
                ${isActive
                  ? 'bg-[var(--neo-primary)] text-white'
                  : 'opacity-70 hover:opacity-100 hover:text-[var(--neo-primary)] hover:bg-[var(--neo-gray)]'
                }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>
      
      <div className="flex items-center gap-2 mb-3">
        <input
          type="number"
          placeholder="Min"
          value={min}
          onChange={(e) => setMin(e.target.value)}
          className="w-full bg-[var(--neo-bg)] border-2 border-[var(--neo-black)] p-2 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[var(--neo-primary)]"
        />
        <span className="text-[var(--neo-black)] font-bold">-</span>
        <input
          type="number"
          placeholder="Max"
          value={max}
          onChange={(e) => setMax(e.target.value)}
          className="w-full bg-[var(--neo-bg)] border-2 border-[var(--neo-black)] p-2 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[var(--neo-primary)]"
        />
      </div>
      <button
        onClick={() => applyFilter(min, max)}
        className="w-full bg-[var(--neo-primary)] text-white font-extrabold py-2 border-2 border-[var(--neo-black)] rounded-lg shadow-[2px_2px_0px_var(--neo-black)] hover:translate-y-1 hover:shadow-none transition-all text-sm"
      >
        Terapkan
      </button>
      
      {(searchParams.get("minPrice") || searchParams.get("maxPrice")) && (
        <button
          onClick={() => {
            setMin("");
            setMax("");
            applyFilter("", "");
          }}
          className="w-full mt-2 bg-[var(--neo-gray)] text-[var(--neo-black)] font-bold py-2 border-2 border-[var(--neo-black)] rounded-lg shadow-[2px_2px_0px_var(--neo-black)] hover:translate-y-1 hover:shadow-none transition-all text-sm"
        >
          Reset Filter
        </button>
      )}
    </div>
  );
}
