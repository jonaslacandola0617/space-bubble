import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "@/styles/space.css";
import "@/styles/ui.css";

export const metadata: Metadata = {
  title: "Space Bubble",
  description: "Shared bubble workspace.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
