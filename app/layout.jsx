import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Suspense } from 'react';
import Script from 'next/script';
import AnalyticsProvider from '@/components/AnalyticsProvider';
import AdScript from '@/components/AdScript';
import AdBanner from '@/components/AdBanner';
import Footer from '@/components/Footer';


const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'AnimeStream';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://animeku.id';
const SITE_DESC = `Nonton anime sub indo terbaru terlengkap dengan kualitas 1080p 720p 480p 360p. Streaming anime online gratis di ${process.env.NEXT_PUBLIC_SITE_NAME || 'AnimeStream'}.`;

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - Nonton Anime Subtitle Indonesia`,
    template: `%s - ${SITE_NAME}`,
  },
  description: SITE_DESC,
  keywords: [`${SITE_NAME}`, `nonton anime ${SITE_NAME}`, `streaming anime`, `anime sub indo`, `anime online gratis`, `nonton anime online`],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} - Nonton Anime Subtitle Indonesia`,
    description: SITE_DESC,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} - Nonton Anime Subtitle Indonesia`,
    description: SITE_DESC,
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  alternates: { canonical: SITE_URL },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#080c14',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />

        {/* Preload fonts */}
        <link rel="preload" href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Nunito:wght@400;500;600;700;800&display=swap" as="style" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Nunito:wght@400;500;600;700;800&display=swap" media="print" onLoad="this.media='all'" />

        {/* Deferred FontAwesome */}
        <link rel="preload" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" as="style" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMFcV7oQPJkl9QevSCWr3W6A==" crossOrigin="anonymous" referrerPolicy="no-referrer" media="print" onLoad="this.media='all'" />

        {/* Material Symbols — admin icons */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />

        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content={SITE_NAME} />

        { }
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: SITE_NAME,
              url: SITE_URL,
              description: SITE_DESC,
              potentialAction: {
                '@type': 'SearchAction',
                target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/anime?q={search_term_string}` },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
      </head>
      <body className="bg-bg-primary text-text-primary font-body antialiased min-h-screen flex flex-col">

        <AuthProvider>
          { }
          <AdScript />

          <Suspense fallback={null}>
            <AnalyticsProvider>
              <div className="flex-1 flex flex-col">
                {children}
              </div>
            </AnalyticsProvider>
          </Suspense>

          <Footer />

          { }
          <AdBanner slot="STICKY_BOTTOM" sticky />

        </AuthProvider>
      </body>
    </html>
  );
}
