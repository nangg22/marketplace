import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Kebijakan Privasi | MallPedia",
};

const SECTIONS = [
  {
    title: "1. Data yang Kami Kumpulkan",
    content: "Kami mengumpulkan data seperti nama, email, nomor telepon, dan alamat pengiriman saat kamu mendaftar atau melakukan transaksi.",
  },
  {
    title: "2. Penggunaan Data",
    content: "Data digunakan untuk memproses transaksi, mengirim notifikasi pesanan, dan meningkatkan pengalaman berbelanja.",
  },
  {
    title: "3. Keamanan Data",
    content: "Kami menerapkan enkripsi dan praktik keamanan standar industri untuk melindungi data pengguna.",
  },
  {
    title: "4. Hak Pengguna",
    content: "Kamu berhak meminta akses, koreksi, atau penghapusan data pribadi dengan menghubungi tim kami.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-[var(--neo-bg)] min-h-screen text-[var(--neo-black)] flex flex-col">
      <Navbar />
      <main className="flex-grow max-w-3xl mx-auto py-12 px-4 w-full">
        <div className="flex items-end justify-between mb-6">
          <h1 className="text-4xl font-extrabold inline-block bg-[var(--neo-secondary)] px-3 py-1 text-white border-[3px] border-[var(--neo-black)] shadow-[var(--neo-shadow-sm)] rotate-[1deg]">
            Kebijakan Privasi
          </h1>
        </div>
        <p className="font-bold bg-white inline-block px-2 py-1 border-[2px] border-black rounded mb-6 text-sm">Terakhir diperbarui: 12 Juli 2026</p>
        
        <div className="neo-card p-6 bg-[var(--neo-white)] space-y-6">
          {SECTIONS.map((s) => (
            <div key={s.title}>
              <h2 className="font-extrabold text-xl mb-2">{s.title}</h2>
              <p className="font-medium text-gray-700 leading-relaxed">{s.content}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
