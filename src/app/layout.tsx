import type { Metadata, Viewport } from "next";
import { StealthModeToggle } from "@/components/StealthModeToggle";
import { AudioUnlock } from "@/components/AudioUnlock";
import "./globals.css";

export const metadata: Metadata = {
  title: "Secret Club",
  description: "Tactile Scrapbook & Bestie Journal",
  applicationName: "Secret Club",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Secret Club",
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
  themeColor: "#F472B6",
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
    <html lang="en" data-circle="bestie">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Fredoka:wght@400;500;600;700&family=Nunito:wght@500;600;700;800&family=Orbitron:wght@600;700;800&family=Rajdhani:wght@500;600;700&display=swap"
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
      <body className="antialiased">
        <AudioUnlock />
        <div className="top-chrome-actions" aria-label="Quick controls">
          <div id="top-chrome-slot" className="flex items-center gap-2" />
          <StealthModeToggle />
        </div>
        {children}
      </body>
    </html>
  );
}
