"use client";

import { useState } from "react";
import Image from "next/image";

export default function ProductGallery({ images }: { images: { url: string }[] }) {
  const [active, setActive] = useState(images[0]?.url || "https://via.placeholder.com/600?text=No+Image");

  if (images.length === 0) {
    return (
      <div className="bg-[var(--neo-gray)] rounded-2xl border-[4px] border-[var(--neo-black)] p-8 flex items-center justify-center min-h-[300px] aspect-square w-full relative">
        <div className="text-center opacity-40">
          <div className="text-8xl mb-4">📦</div>
          <div className="font-extrabold uppercase tracking-widest text-xl">No Image</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="rounded-2xl overflow-hidden border-[4px] border-[var(--neo-black)] mb-3 bg-white w-full aspect-square relative shadow-[4px_4px_0px_var(--neo-black)]">
        <Image
          src={active}
          alt="Produk"
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
      
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {images.map((img) => (
            <button
              key={img.url}
              onClick={() => setActive(img.url)}
              className={`shrink-0 rounded-xl overflow-hidden border-[3px] relative w-20 h-20 transition-transform ${
                active === img.url 
                  ? "border-[var(--neo-primary)] scale-105 shadow-[2px_2px_0px_var(--neo-black)]" 
                  : "border-[var(--neo-black)] opacity-70 hover:opacity-100"
              }`}
            >
              <Image 
                src={img.url} 
                alt="thumbnail" 
                fill
                sizes="80px"
                className="object-cover" 
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
