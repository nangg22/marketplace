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
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'https://lakulagi.vercel.app'),
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
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "manifest", url: "/site.webmanifest" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "LakuLagi",
    title: "LakuLagi — Marketplace Preloved Terpercaya",
    description: "Jual beli barang preloved berkualitas di LakuLagi.",
    images: ["/web-app-manifest-512x512.png"],
  },
  twitter: {
    card: "summary",
    title: "LakuLagi — Marketplace Preloved Terpercaya",
    description: "Jual beli barang preloved berkualitas di LakuLagi.",
    images: ["/web-app-manifest-512x512.png"],
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
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon-96x96.png" sizes="96x96" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
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
