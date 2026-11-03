import type { Metadata, Viewport } from "next";
import { StealthModeToggle } from "@/components/StealthModeToggle";
import { AudioUnlock } from "@/components/AudioUnlock";
import { VipAccessBootstrap } from "@/components/VipAccessBootstrap";
import { SITE_ORIGIN } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: "Secret Club Scrapbook ✨ | Your Private Digital Diary",
  description:
    "Create, decorate, and share your secret aesthetic scrapbook with your besties!",
  applicationName: "Secret Club Scrapbook",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Secret Club",
  },
  openGraph: {
    type: "website",
    url: SITE_ORIGIN,
    siteName: "Secret Club Scrapbook",
    title: "You're invited to my Secret Club! 🎀🍓",
    description:
      "Tap to enter the secret lockbox and decorate our scrapbook together.",
    images: [
      {
        url: "/og-preview.png",
        width: 1200,
        height: 630,
        alt: "Secret Club Scrapbook — fluffy diary cover",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "You're invited to my Secret Club! 🎀🍓",
    description:
      "Tap to enter the secret lockbox and decorate our scrapbook together.",
    images: ["/og-preview.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/icon-192.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#F37092",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-circle="bestie" className="h-screen max-h-screen overflow-hidden overflow-x-hidden">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=DynaPuff:wght@600;700&family=Fredoka:wght@400;500;600;700&family=Nunito:wght@500;600;700;800&family=Orbitron:wght@600;700;800&family=Rajdhani:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Secret Club" />
      </head>
      <body className="h-screen max-h-screen overflow-hidden overflow-x-hidden antialiased">
        <AudioUnlock />
        <VipAccessBootstrap />
        <div className="top-chrome-actions" aria-label="Quick controls">
          <div id="top-chrome-slot" className="flex items-center gap-2" />
          <StealthModeToggle />
        </div>
        {children}
      </body>
    </html>
  );
}
