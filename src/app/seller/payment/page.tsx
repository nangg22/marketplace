import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function SellerPaymentPage() {
  return (
    <div className="bg-[var(--neo-bg)] min-h-screen text-[var(--neo-black)] flex flex-col">
      <Navbar />
      <main className="flex-grow max-w-4xl mx-auto py-12 px-4 w-full">
        <h1 className="text-4xl font-extrabold mb-6 inline-block bg-[var(--neo-secondary)] px-3 py-1 text-white border-[3px] border-[var(--neo-black)] shadow-[var(--neo-shadow-sm)] rotate-[1deg]">
          Pengaturan Rekening
        </h1>
        <div className="neo-card p-10 bg-[var(--neo-white)] text-center">
          <div className="text-5xl mb-4">💳</div>
          <h2 className="text-2xl font-extrabold mb-2">Segera Hadir!</h2>
          <p className="font-semibold text-gray-700">Halaman untuk menghubungkan rekening pencairan dana sedang dalam pengembangan.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
