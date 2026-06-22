import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "MallPedia — Marketplace Neobrutalis",
  description: "Jelajahi produk terbaik dengan pengalaman belanja yang unik dan menyenangkan di MallPedia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${spaceGrotesk.variable} ${spaceGrotesk.className}`}>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
