import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Kebijakan Retur | MallPedia",
};

const SECTIONS = [
  {
    title: "1. Syarat Pengajuan Retur",
    content: "Barang dapat diretur jika tidak sesuai dengan pesanan (salah warna/ukuran), cacat pabrik, atau rusak saat pengiriman. Sertakan video unboxing sebagai bukti.",
  },
  {
    title: "2. Batas Waktu",
    content: "Pengajuan retur harus dilakukan maksimal 7 hari setelah status pesanan berubah menjadi 'Diterima'.",
  },
  {
    title: "3. Proses Verifikasi",
    content: "Penjual dan admin akan meninjau permintaan retur Anda. Jika disetujui, dana akan dikembalikan ke metode pembayaran awal atau ditukar dengan barang baru sesuai kesepakatan.",
  },
  {
    title: "4. Biaya Pengiriman",
    content: "Biaya pengiriman barang retur akan ditanggung oleh penjual jika terbukti ada kesalahan dari pihak penjual.",
  },
];

export default function ReturnPolicyPage() {
  return (
    <div className="bg-[var(--neo-bg)] min-h-screen text-[var(--neo-black)] flex flex-col">
      <Navbar />
      <main className="flex-grow max-w-3xl mx-auto py-12 px-4 w-full">
        <h1 className="text-4xl font-extrabold mb-6 inline-block bg-red-400 text-white px-3 py-1 border-[3px] border-[var(--neo-black)] shadow-[var(--neo-shadow-sm)] rotate-[1deg]">
          Kebijakan Retur
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
