import type { Metadata } from "next";
import { Newsreader, Nunito_Sans } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import "@/styles/space.css";
import "@/styles/ui.css";
import "@/styles/readability.css";

const calmSans = Nunito_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-calm-sans",
});

const warmDisplay = Newsreader({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-warm-display",
});

export const metadata: Metadata = {
  title: "Space Bubble",
  description: "Shared bubble workspace.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${calmSans.variable} ${warmDisplay.variable}`}>
      <body>{children}</body>
    </html>
  );
}
