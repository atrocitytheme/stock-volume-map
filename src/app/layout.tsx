import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import Script from "next/script";
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
  title: "AeroTrade | Live Stock Volume Map & Today's Volume Trends",
  description: "Track stock volume today with AeroTrade's interactive volume map. Monitor real-time market activity, sector block trades, and global exchange volumes.",
  keywords: ["stock volume", "volume map", "volume today", "stock market heatmap", "trading volume analysis", "global exchanges", "real-time stock volume"],
  authors: [{ name: "AeroTrade" }],
  openGraph: {
    title: "AeroTrade | Live Stock Volume Map",
    description: "Track stock volume today with AeroTrade's live volume map. Monitor real-time market activity and sector block trades.",
    type: "website",
    siteName: "AeroTrade",
  },
  twitter: {
    card: "summary_large_image",
    title: "AeroTrade | Live Stock Volume Map",
    description: "Track stock volume today with AeroTrade's live volume map.",
  },
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3962513051446394"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
