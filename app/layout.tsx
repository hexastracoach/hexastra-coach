import type { Metadata, Viewport } from 'next'
import './globals.css'
import I18nProvider from '@/lib/i18n/I18nProvider'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
}

const metadataBaseUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim() || 'https://hexastra.app'

export const metadata: Metadata = {
  metadataBase: new URL(metadataBaseUrl),
  title: 'HexAstra - Clarte interieure, decisions, profondeur',
  description:
    'HexAstra analyse ta situation, tes dynamiques et ton timing pour t aider a decider, comprendre et avancer avec plus de clarte.',
  keywords: ['analyse Hexastra', 'clarte interieure', 'lecture de situation', 'decision', 'IA'],
  authors: [{ name: 'HexAstra' }],
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/favicon/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon/favicon-64x64.png', sizes: '64x64', type: 'image/png' },
      { url: '/favicon/favicon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon/favicon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/favicon/favicon-180x180.png', sizes: '180x180', type: 'image/png' }],
    shortcut: '/favicon/favicon-32x32.png',
  },
  openGraph: {
    title: 'HexAstra - Clarte interieure, decisions, profondeur',
    description: 'Lecture de situation par IA - une analyse Hexastra claire, directe et utile.',
    url: 'https://hexastra.app',
    siteName: 'HexAstra',
    images: [
      {
        url: '/social/hexastra-og-image.png',
        width: 1200,
        height: 1200,
        alt: 'HexAstra - GPS interieur',
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HexAstra - Clarte interieure, decisions, profondeur',
    description: 'Lecture de situation par IA - une analyse Hexastra claire, directe et utile.',
    images: ['/social/hexastra-twitter.png'],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'HexAstra',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#F8F6F1" />
        <meta name="msapplication-TileColor" content="#F8F6F1" />
      </head>
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  )
}
