"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";

const PRICE_PRESETS = [
  { label: "Di bawah Rp50rb", min: 0, max: 50000 },
  { label: "Rp50rb - Rp150rb", min: 50000, max: 150000 },
  { label: "Rp150rb - Rp500rb", min: 150000, max: 500000 },
  { label: "Di atas Rp500rb", min: 500000, max: undefined },
];

const CONDITIONS = [
  { value: "baru", label: "✨ Baru" },
  { value: "like_new", label: "💎 Like New" },
  { value: "minus_ringan", label: "⚠️ Minus Ringan" },
  { value: "minus_berat", label: "💀 Minus Berat" },
];

export default function SidebarFilter({ className = "" }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [min, setMin] = useState(searchParams.get("minPrice") ?? "");
  const [max, setMax] = useState(searchParams.get("maxPrice") ?? "");
  
  const currentCondition = searchParams.get("condition") ?? "";
  const currentNego = searchParams.get("nego") === "true";

  function applyFilter(
    newMin: string | number | undefined, 
    newMax: string | number | undefined, 
    newCondition: string, 
    newNego: boolean
  ) {
    const params = new URLSearchParams(searchParams.toString());
    
    if (newMin !== undefined && newMin !== "") params.set("minPrice", String(newMin));
    else params.delete("minPrice");

    if (newMax !== undefined && newMax !== "") params.set("maxPrice", String(newMax));
    else params.delete("maxPrice");

    if (newCondition) params.set("condition", newCondition);
    else params.delete("condition");

    if (newNego) params.set("nego", "true");
    else params.delete("nego");

    router.push(`${pathname}?${params.toString()}`);
  }

  const handleApply = () => {
    applyFilter(min, max, currentCondition, currentNego);
  };

  const handleReset = () => {
    setMin("");
    setMax("");
    applyFilter("", "", "", false);
  };

  const activePreset = PRICE_PRESETS.find(
    (p) => String(p.min) === min && (p.max === undefined ? !max : String(p.max) === max)
  );

  return (
    <div className={`neo-card p-4 ${className}`}>
      {/* FILTER HARGA */}
      <p className="font-extrabold text-sm mb-3 uppercase tracking-wider text-[var(--neo-black)] border-b-2 border-[var(--neo-black)] pb-2">
        💰 Harga
      </p>
      
      <div className="space-y-1 mb-3">
        {PRICE_PRESETS.map((p) => {
          const isActive = activePreset?.label === p.label;
          return (
            <button
              key={p.label}
              onClick={() => {
                setMin(String(p.min));
                setMax(p.max ? String(p.max) : "");
                applyFilter(p.min, p.max, currentCondition, currentNego);
              }}
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
      
      <div className="flex items-center gap-2 mb-5">
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

      {/* FILTER KONDISI */}
      <p className="font-extrabold text-sm mb-3 uppercase tracking-wider text-[var(--neo-black)] border-b-2 border-[var(--neo-black)] pb-2">
        🏷️ Kondisi
      </p>
      <div className="space-y-1 mb-5">
        <button
          onClick={() => applyFilter(min, max, "", currentNego)}
          className={`block w-full text-left text-sm font-bold py-1.5 px-2 rounded-lg transition-colors
            ${!currentCondition ? 'bg-[var(--neo-primary)] text-white' : 'opacity-70 hover:bg-[var(--neo-gray)]'}`}
        >
          Semua Kondisi
        </button>
        {CONDITIONS.map((c) => (
          <button
            key={c.value}
            onClick={() => applyFilter(min, max, c.value, currentNego)}
            className={`block w-full text-left text-sm font-bold py-1.5 px-2 rounded-lg transition-colors
              ${currentCondition === c.value ? 'bg-[var(--neo-primary)] text-white' : 'opacity-70 hover:bg-[var(--neo-gray)]'}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* FILTER NEGO */}
      <p className="font-extrabold text-sm mb-3 uppercase tracking-wider text-[var(--neo-black)] border-b-2 border-[var(--neo-black)] pb-2">
        🤝 Negosiasi
      </p>
      <label className="flex items-center gap-2 cursor-pointer mb-5">
        <input
          type="checkbox"
          checked={currentNego}
          onChange={(e) => applyFilter(min, max, currentCondition, e.target.checked)}
          className="w-4 h-4 border-2 border-[var(--neo-black)] rounded-sm accent-[var(--neo-primary)] focus:ring-2 focus:ring-[var(--neo-primary)]"
        />
        <span className="text-sm font-bold opacity-80">Bisa Nego</span>
      </label>

      {/* ACTIONS */}
      <button
        onClick={handleApply}
        className="w-full bg-[var(--neo-primary)] text-white font-extrabold py-2 border-2 border-[var(--neo-black)] rounded-lg shadow-[2px_2px_0px_var(--neo-black)] hover:translate-y-1 hover:shadow-none transition-all text-sm"
      >
        Terapkan Filter
      </button>
      
      {(searchParams.get("minPrice") || searchParams.get("maxPrice") || currentCondition || currentNego) && (
        <button
          onClick={handleReset}
          className="w-full mt-2 bg-[var(--neo-gray)] text-[var(--neo-black)] font-bold py-2 border-2 border-[var(--neo-black)] rounded-lg shadow-[2px_2px_0px_var(--neo-black)] hover:translate-y-1 hover:shadow-none transition-all text-sm"
        >
          Reset Filter
        </button>
      )}
    </div>
  );
}
