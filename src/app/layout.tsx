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
  title: "1stream.dev - Media Storage API for Developers",
  description: "One API for all your media needs. Video, images, audio, files. Upload once, get optimized URLs. Built for developers.",
  keywords: ["media storage", "video api", "image processing", "audio streaming", "developer api", "cloudflare r2"],
  openGraph: {
    title: "1stream.dev - Media Storage API for Developers",
    description: "One API for all your media needs. Video, images, audio, files.",
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
