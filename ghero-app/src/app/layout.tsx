import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Ghero by Kajal Soni — Premium Traditional Clothing",
    template: "%s | Ghero by Kajal Soni",
  },
  description:
    "Discover exquisite traditional Indian clothing — sarees, lehengas, kurtis, suits, and more. Timeless silhouettes with contemporary elegance by Kajal Soni.",
  keywords: [
    "traditional clothing",
    "Indian fashion",
    "sarees",
    "lehengas",
    "kurtis",
    "suits",
    "anarkalis",
    "dupattas",
    "festive wear",
    "bridal wear",
    "Ghero",
    "Kajal Soni",
  ],
  authors: [{ name: "Ghero by Kajal Soni" }],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Ghero by Kajal Soni",
    title: "Ghero by Kajal Soni — Premium Traditional Clothing",
    description:
      "Discover exquisite traditional Indian clothing. Timeless silhouettes with contemporary elegance.",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
