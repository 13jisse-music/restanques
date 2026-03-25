import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Restanques — Jeu coopératif provençal",
  description: "Explorez la Provence à deux ! Craft, match-3, combat et aventure coopérative.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/splash.png" />
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: "'Courier New', monospace", overflow: "hidden" }}>
        {children}
      </body>
    </html>
  );
}
