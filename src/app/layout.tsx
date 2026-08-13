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

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "name": "AeroTrade",
      "url": "https://aerotrade.app",
      "description": "Real-time market macro indexes tracker and risk appetite dashboard. Monitor S&P 500, NASDAQ, DOW, FTSE, and NIKKEI indexes alongside proprietary macro indicators.",
      "publisher": {
        "@type": "Organization",
        "name": "AeroTrade",
        "url": "https://aerotrade.app",
        "logo": {
          "@type": "ImageObject",
          "url": "https://aerotrade.app/favicon.ico"
        }
      }
    },
    {
      "@type": "WebPage",
      "name": "AeroTrade — Market Macro Indexes Tracker & Risk Appetite Dashboard",
      "description": "Track market macro indexes, risk appetite, and global exchange activity in real time. Interactive heatmaps, CAPE ratio, TACO index, real yield curves, and more.",
      "isPartOf": {
        "@type": "WebSite",
        "name": "AeroTrade"
      }
    }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <Script
          id="json-ld"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
