import type { Metadata, Viewport } from 'next'
import './globals.css'
import AudioManager from '@/components/shared/AudioManager'
import SkinProvider from '@/components/shared/SkinProvider'

export const metadata: Metadata = {
  title: 'Restanques — RPG Provençal',
  description: 'RPG coopératif 2 joueurs dans la Provence. Explore, combats, craft et sauve les Restanques du Mistral.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Restanques',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#e91e8c',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body data-skin="provence">
        <AudioManager />
        <SkinProvider />
        {children}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
          }
          // PWA install prompt
          window.__pwaDeferred = null;
          window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            window.__pwaDeferred = e;
            window.dispatchEvent(new Event('pwa-ready'));
          });
        `}} />
      </body>
    </html>
  )
}
