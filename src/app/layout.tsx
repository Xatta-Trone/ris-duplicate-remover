import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RIS Duplicate Remover",
  description:
    "A tool to remove duplicate entries from RIS reference files based on titles. Upload multiple RIS files and get a cleaned version without duplicates.",
  keywords: [
    "RIS",
    "reference manager",
    "duplicate removal",
    "bibliography",
    "citation",
    "research",
    "academic",
    "literature",
    "file processing",
    "metadata",
  ],
  authors: [
    {
      name: "RIS Duplicate Remover",
      url: "https://github.com/Xatta-Trone/ris-duplicate-remover",
    },
  ],
  creator: "RIS Duplicate Remover",
  publisher: "RIS Duplicate Remover",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    title: "RIS Duplicate Remover",
    description: "Remove duplicate entries from RIS reference files based on titles",
    siteName: "RIS Duplicate Remover",
  },
  twitter: {
    card: "summary_large_image",
    title: "RIS Duplicate Remover",
    description: "Remove duplicate entries from RIS reference files based on titles",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
