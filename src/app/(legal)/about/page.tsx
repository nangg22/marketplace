import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Tentang Kami | MallPedia",
  description: "Kenali lebih dekat MallPedia, marketplace yang menghubungkan penjual dan pembeli di seluruh Indonesia.",
};

export default function AboutPage() {
  return (
    <div className="bg-[var(--neo-bg)] min-h-screen text-[var(--neo-black)] flex flex-col">
      <Navbar />
      <main className="flex-grow max-w-3xl mx-auto py-12 px-4 w-full">
        <h1 className="text-4xl font-extrabold mb-6 inline-block bg-[var(--neo-primary)] px-3 py-1 border-[3px] border-[var(--neo-black)] shadow-[var(--neo-shadow-sm)] rotate-[-1deg]">
          Tentang MallPedia
        </h1>
        <div className="neo-card p-6 bg-[var(--neo-white)]">
          <p className="font-semibold text-lg leading-relaxed mb-4">
            MallPedia adalah platform marketplace yang mempertemukan penjual dan pembeli
            secara langsung, dengan fokus pada kemudahan transaksi dan keamanan berbelanja online.
          </p>
          <p className="font-medium text-gray-700 leading-relaxed">
            Proyek ini merupakan bentuk dedikasi kami untuk memberikan pengalaman e-commerce 
            yang segar, interaktif, dan tentunya estetik dengan gaya Neo-Brutalism. 
            Misi kami adalah mempermudah pelaku UMKM dalam menjangkau pasar digital dengan cara yang asyik!
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
