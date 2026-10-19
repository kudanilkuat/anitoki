const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'Anitoki';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://anitoki.id';

export const metadata = {
    title: `Download Aplikasi ${SITE_NAME} Android APK`,
    alternates: {
        canonical: `${SITE_URL}/download`,
    },
};

export default function AppLayout({ children }) {
    return children;
}
