import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
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
  title: "AeroTrade | Market Macro Indexes Tracker & Risk Appetite Dashboard",
  description: "Track market macro indexes, risk appetite, and global exchange activity in real time. Monitor GS Risk Appetite Index, sector heatmaps, and macro indicators.",
  keywords: ["market macro indexes", "risk appetite index", "macro tracker", "Goldman Sachs risk appetite", "market heatmap", "global exchanges", "real-time macro dashboard"],
  authors: [{ name: "AeroTrade" }],
  openGraph: {
    title: "AeroTrade | Market Macro Indexes Tracker",
    description: "Track market macro indexes, risk appetite, and global exchange activity in real time with AeroTrade's interactive macro dashboard.",
    type: "website",
    siteName: "AeroTrade",
  },
  twitter: {
    card: "summary_large_image",
    title: "AeroTrade | Market Macro Indexes Tracker",
    description: "Track market macro indexes, risk appetite, and global exchange activity in real time.",
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
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
