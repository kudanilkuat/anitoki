import { Suspense } from 'react';

export const metadata = {
    title: 'Download',
    robots: { index: false, follow: false },
};

export default function DlLayout({ children }) {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
                <div className="text-gray-500 text-sm">Memuat...</div>
            </div>
        }>
            {children}
        </Suspense>
    );
}
