import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MaskUp",
  description: "A background effect generator tool",
  openGraph: {
    title: "MaskUp",
    description: "A background effect generator tool",
    type: "website",
    locale: "en_US",
    url: "https://mask-up.vercel.app",
    images: [
      {
        url: "https://mask-up.vercel.app/maskup-og-image.png",
        width: 1200,
        height: 630,
        alt: "MaskUp",
      },
    ],
  },
  twitter: {
    site: "https://mask-up.vercel.app",
    card: "summary_large_image",
    creator: "@ammarjesliy",
    images: [
      {
        url: "https://mask-up.vercel.app/maskup-og-image.png",
        width: 1200,
        height: 630,
        alt: "MaskUp",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
