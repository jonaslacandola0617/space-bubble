import type { Metadata, Viewport } from "next";
import { Manrope, Nunito_Sans } from "next/font/google";
import type { ReactNode } from "react";
import { getSiteUrl, siteDescription, siteName, siteTitle } from "@/lib/site";
import "./globals.css";
import "@/styles/space.css";
import "@/styles/ui.css";
import "@/styles/readability.css";

const calmSans = Nunito_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-calm-sans",
});

const calmDisplay = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-calm-display",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: siteTitle,
    template: "%s | Space Bubble",
  },
  description: siteDescription,
  applicationName: siteName,
  keywords: [
    "couples communication",
    "relationship communication",
    "shared thoughts",
    "couples check-in",
    "communication app",
    "relationship check-in",
    "emotional check-in",
    "Space Bubble",
  ],
  category: "lifestyle",
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName,
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Space Bubble — a quiet shared space for calmer conversations",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/opengraph-image"],
  },
  appleWebApp: {
    capable: true,
    title: siteName,
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "dark",
  themeColor: "#070711",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: siteName,
    url: getSiteUrl(),
    description: siteDescription,
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web",
    isAccessibleForFree: true,
    featureList: [
      "Private shared thought bubbles",
      "Couples energy check-ins",
      "Realtime shared updates",
      "Conversation readiness signals",
    ],
  };

  return (
    <html lang="en" className={`${calmSans.variable} ${calmDisplay.variable}`}>
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </body>
    </html>
  );
}
