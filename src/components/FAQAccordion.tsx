"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQ_ITEMS = [
  { q: "Bagaimana cara berbelanja di MallPedia?", a: "Pilih produk, tambahkan ke keranjang, lalu checkout dan pilih metode pembayaran." },
  { q: "Apakah pembayaran aman?", a: "Ya, semua pembayaran diproses melalui sistem yang aman dan terpantau." },
  { q: "Bagaimana jika barang tidak sesuai?", a: "Kamu bisa mengajukan retur melalui halaman detail pesanan dalam 7 hari setelah barang diterima." },
  { q: "Bagaimana cara jadi penjual?", a: "Daftar sebagai seller melalui halaman registrasi, lalu ikuti panduan onboarding di dashboard." },
];

export default function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {FAQ_ITEMS.map((item, i) => (
        <div key={i} className="neo-card p-4 hover-lift cursor-pointer transition-all bg-[var(--neo-white)]" onClick={() => setOpenIndex(openIndex === i ? null : i)}>
          <div className="flex w-full justify-between items-center text-left font-extrabold text-lg select-none">
            {item.q}
            <ChevronDown
              size={24}
              className={`transition-transform duration-300 ${openIndex === i ? "rotate-180" : ""}`}
            />
          </div>
          <div className={`grid transition-all duration-300 ${openIndex === i ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0"}`}>
            <p className="text-sm font-semibold text-gray-700 overflow-hidden">{item.a}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
