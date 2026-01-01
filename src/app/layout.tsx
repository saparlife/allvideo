import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#6366f1",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://video.lovsell.com"),
  title: {
    default: "UnlimVideo - Watch and Share Videos",
    template: "%s | UnlimVideo",
  },
  description:
    "Discover, watch, and share videos from creators around the world. Unlimited video hosting with no bandwidth limits.",
  keywords: [
    "video hosting",
    "video platform",
    "watch videos",
    "share videos",
    "video streaming",
    "video upload",
    "creator platform",
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
    title: "UnlimVideo - Watch and Share Videos",
    description:
      "Discover, watch, and share videos from creators around the world. Unlimited video hosting with no bandwidth limits.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "UnlimVideo - Video Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "UnlimVideo - Watch and Share Videos",
    description:
      "Discover, watch, and share videos from creators around the world.",
    images: ["/og-image.png"],
    creator: "@unlimvideo",
  },
  alternates: {
    canonical: "https://video.lovsell.com",
    languages: {
      en: "https://video.lovsell.com",
      ru: "https://video.lovsell.com/ru",
    },
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.json",
  category: "technology",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <link rel="preconnect" href="https://cdn.lovsell.com" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
