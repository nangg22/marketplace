import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import BackButton from "@/components/BackButton";
import Providers from "@/components/Providers";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: {
    default: "LakuLagi — Marketplace Preloved Terpercaya",
    template: "%s | LakuLagi",
  },
  description:
    "Jual beli barang preloved berkualitas. Laptop, fashion, elektronik, buku, dan ribuan produk bekas mulus di LakuLagi.",
  keywords: ["preloved", "second hand", "jual beli bekas", "marketplace", "thrift"],
  authors: [{ name: "LakuLagi" }],
  creator: "LakuLagi",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "LakuLagi",
    title: "LakuLagi — Marketplace Preloved Terpercaya",
    description: "Jual beli barang preloved berkualitas di LakuLagi.",
  },
  twitter: {
    card: "summary",
    title: "LakuLagi — Marketplace Preloved Terpercaya",
    description: "Jual beli barang preloved berkualitas di LakuLagi.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${spaceGrotesk.variable} ${spaceGrotesk.className}`}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
      </head>
      <body className="min-h-screen flex flex-col">
        <Providers>
          {children}
          <BackButton />
        </Providers>
      </body>
    </html>
  );
}
