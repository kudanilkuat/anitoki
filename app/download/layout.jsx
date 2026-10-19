const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'Anitoki';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://anitoki.id';

export const metadata = {
    title: `Download Aplikasi ${SITE_NAME} Android APK - Nonton Anime Sub Indo Gratis`,
    description: `Unduh aplikasi ${SITE_NAME} resmi untuk smartphone Android via APKPure. Streaming ribuan episode anime subtitle Indonesia kualitas HD, bebas buffering, dan fitur download batch offline.`,
    keywords: [
        `download apk ${SITE_NAME}`,
        `aplikasi ${SITE_NAME}`,
        `${SITE_NAME} apkpure`,
        'nonton anime android apk',
        'streaming anime sub indo apk',
        'download anime batch apk',
    ],
    openGraph: {
        title: `Download Aplikasi ${SITE_NAME} Android APK - Nonton Anime Sub Indo`,
        description: `Unduh aplikasi ${SITE_NAME} resmi untuk smartphone Android. Streaming anime sub Indo lancar, bebas iklan mengganggu, dan download episode offline.`,
        url: `${SITE_URL}/download`,
        siteName: SITE_NAME,
        images: [{ url: '/app/feature_graphic.png', width: 1024, height: 500, alt: `${SITE_NAME} Mobile App` }],
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: `Download Aplikasi ${SITE_NAME} Android APK`,
        description: `Streaming anime sub Indo lancar di aplikasi Android resmi ${SITE_NAME}.`,
        images: ['/app/feature_graphic.png'],
    },
    alternates: {
        canonical: `${SITE_URL}/download`,
    },
};

export default function DownloadLayout({ children }) {
    return children;
}
