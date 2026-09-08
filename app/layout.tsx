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
  title: {
    default: "VisaPic — Passport & Visa Photo Tools",
    template: "%s | VisaPic",
  },
  description:
    "Create passport and visa photos online with country presets, smart face positioning, background removal, cropping and JPG export.",
  applicationName: "VisaPic",
  keywords: [
    "passport photo maker",
    "visa photo",
    "passport photo size",
    "passport photo editor",
    "visa photo maker",
    "photo cropper",
    "image compressor",
  ],
  robots: {
    index: true,
    follow: true,
  },

  verification: {
    google: "rtodlz94CZn0IbwKXp5Gq_VPtUpwhAhqi6f9iNCQAq8",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-screen bg-white text-slate-900">{children}</body>
    </html>
  );
}