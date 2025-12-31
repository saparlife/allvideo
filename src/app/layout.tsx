import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#6366f1",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://video.lovsell.com"),
  title: {
    default: "UnlimVideo - Video Hosting with Unlimited Bandwidth",
    template: "%s | UnlimVideo",
  },
  description:
    "Stop paying for video views. Video hosting with truly unlimited bandwidth. No overages, no surprises. Save up to 90% compared to Vimeo. Start free today.",
  keywords: [
    "video hosting",
    "unlimited bandwidth",
    "HLS streaming",
    "video CDN",
    "vimeo alternative",
    "video platform",
    "video streaming",
    "adaptive bitrate",
    "video transcoding",
    "embed video",
    "video API",
  ],
  authors: [{ name: "UnlimVideo" }],
  creator: "UnlimVideo",
  publisher: "UnlimVideo",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://video.lovsell.com",
    siteName: "UnlimVideo",
    title: "UnlimVideo - Video Hosting with Unlimited Bandwidth",
    description:
      "Stop paying for video views. Video hosting with truly unlimited bandwidth. No overages, no surprises. Save up to 90% compared to Vimeo.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "UnlimVideo - Unlimited Video Hosting",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "UnlimVideo - Video Hosting with Unlimited Bandwidth",
    description:
      "Stop paying for video views. Unlimited bandwidth video hosting. Save up to 90% compared to Vimeo.",
    images: ["/og-image.png"],
    creator: "@unlimvideo",
  },
  alternates: {
    canonical: "https://video.lovsell.com",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://cdn.lovsell.com" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
