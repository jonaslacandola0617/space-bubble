import type { Metadata } from "next";
import { Manrope, Nunito_Sans } from "next/font/google";
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

const calmDisplay = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-calm-display",
});

export const metadata: Metadata = {
  title: "Space Bubble",
  description: "A private shared space for thoughts, check-ins, and conversations.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${calmSans.variable} ${calmDisplay.variable}`}>
      <body>{children}</body>
    </html>
  );
}
