import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FAQAccordion from "@/components/FAQAccordion";

export const metadata: Metadata = {
  title: "FAQ | MallPedia",
};

export default function FAQPage() {
  return (
    <div className="bg-[var(--neo-bg)] min-h-screen text-[var(--neo-black)] flex flex-col">
      <Navbar />
      <main className="flex-grow max-w-4xl mx-auto py-12 px-4 w-full">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold mb-4 inline-block bg-[var(--neo-primary)] px-3 py-1 border-[3px] border-[var(--neo-black)] shadow-[var(--neo-shadow-sm)] rotate-[-1deg]">
            Frequently Asked Questions
          </h1>
          <p className="font-semibold text-gray-700 text-lg">Punya pertanyaan? Mungkin jawabannya ada di bawah ini!</p>
        </div>
        
        <FAQAccordion />
      </main>
      <Footer />
    </div>
  );
}
