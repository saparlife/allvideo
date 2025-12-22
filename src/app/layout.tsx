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
  title: "UnlimVideo - Video Hosting with Unlimited Bandwidth",
  description: "Stop paying for video views. Video hosting with truly unlimited bandwidth. No overages, no surprises. Save thousands compared to Vimeo.",
  keywords: ["video hosting", "unlimited bandwidth", "HLS streaming", "video CDN", "vimeo alternative"],
  openGraph: {
    title: "UnlimVideo - Stop Paying for Video Views",
    description: "Video hosting with truly unlimited bandwidth. No overages, no surprises.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
