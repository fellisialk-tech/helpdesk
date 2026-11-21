import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Resource Booking System — Sistem Tempahan Ruang & Peralatan",
  description:
    "Sistem Tempahan Ruang & Peralatan untuk mengurus tempahan bilik perbincangan, makmal komputer, dan peralatan studio atau sukan di kampus.",
  openGraph: {
    title: "Resource Booking System — Sistem Tempahan Ruang & Peralatan",
    description:
      "Sistem Tempahan Ruang & Peralatan untuk mengurus tempahan bilik perbincangan, makmal komputer, dan peralatan studio atau sukan di kampus.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Resource Booking System — Sistem Tempahan Ruang & Peralatan",
    description:
      "Sistem Tempahan Ruang & Peralatan untuk mengurus tempahan bilik perbincangan, makmal komputer, dan peralatan kampus.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ms"
      className={`${plusJakarta.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900">
        {children}
      </body>
    </html>
  );
}
