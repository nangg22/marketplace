import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan | MallPedia",
};

const SECTIONS = [
  {
    title: "1. Penggunaan Platform",
    content: "Dengan menggunakan MallPedia, Anda setuju untuk mematuhi semua syarat dan ketentuan yang berlaku. Penggunaan platform untuk tujuan ilegal dilarang keras.",
  },
  {
    title: "2. Akun Pengguna",
    content: "Anda bertanggung jawab atas kerahasiaan kata sandi akun Anda. Segala aktivitas yang terjadi di bawah akun Anda adalah tanggung jawab Anda sepenuhnya.",
  },
  {
    title: "3. Transaksi",
    content: "Pembeli dan penjual diwajibkan untuk beriktikad baik dalam setiap transaksi. MallPedia berhak membatalkan transaksi yang terindikasi penipuan.",
  },
  {
    title: "4. Perubahan Syarat",
    content: "MallPedia dapat mengubah syarat dan ketentuan ini sewaktu-waktu. Perubahan akan berlaku segera setelah dipublikasikan di platform ini.",
  },
];

export default function TermsOfServicePage() {
  return (
    <div className="bg-[var(--neo-bg)] min-h-screen text-[var(--neo-black)] flex flex-col">
      <Navbar />
      <main className="flex-grow max-w-3xl mx-auto py-12 px-4 w-full">
        <h1 className="text-4xl font-extrabold mb-6 inline-block bg-[var(--neo-accent)] px-3 py-1 border-[3px] border-[var(--neo-black)] shadow-[var(--neo-shadow-sm)] rotate-[-1deg]">
          Syarat & Ketentuan
        </h1>
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
