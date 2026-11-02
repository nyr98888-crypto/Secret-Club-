import type { Metadata, Viewport } from "next";
import { Baloo_2, Fredoka, Nunito, Orbitron, Rajdhani } from "next/font/google";
import { StealthModeToggle } from "@/components/StealthModeToggle";
import { AudioUnlock } from "@/components/AudioUnlock";
import "./globals.css";

const bestieDisplay = Baloo_2({
  subsets: ["latin"],
  variable: "--font-bestie-display",
  weight: ["600", "700", "800"],
});

const bestieBody = Nunito({
  subsets: ["latin"],
  variable: "--font-bestie-body",
  weight: ["500", "600", "700", "800"],
});

const squadDisplay = Orbitron({
  subsets: ["latin"],
  variable: "--font-squad-display",
  weight: ["600", "700", "800"],
});

const squadBody = Rajdhani({
  subsets: ["latin"],
  variable: "--font-squad-body",
  weight: ["500", "600", "700"],
});

const toyFont = Fredoka({
  subsets: ["latin"],
  variable: "--font-toy",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Secret Club — BestieVault & SquadVault",
  description:
    "Found a private club, lock drops with a 3-key emoji passcode, and print matching Club IDs.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Secret Club",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffe6f2",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-circle="bestie">
      <body
        className={`${bestieDisplay.variable} ${bestieBody.variable} ${squadDisplay.variable} ${squadBody.variable} ${toyFont.variable} antialiased`}
      >
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
