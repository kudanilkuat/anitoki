'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AdBanner from '@/components/AdBanner';

const COUNTDOWN = 5; // detik

export default function DownloadPage() {
    const router = useRouter();
    const params = useSearchParams();
    const encoded = params.get('url') || '';
    const label = params.get('label') || 'File Download';

    const [seconds, setSeconds] = useState(COUNTDOWN);
    const [ready, setReady] = useState(false);
    const [target, setTarget] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!encoded) { setError('URL tidak valid.'); return; }
        try {
            const decoded = atob(encoded);
            if (!decoded.startsWith('http')) throw new Error('invalid');
            setTarget(decoded);
        } catch {
            setError('Link tidak valid atau sudah kadaluarsa.');
            return;
        }

        const interval = setInterval(() => {
            setSeconds(s => {
                if (s <= 1) {
                    clearInterval(interval);
                    setReady(true);
                    return 0;
                }
                return s - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [encoded]);

    return (
        <div className="min-h-[85vh] bg-surface-deep text-on-surface flex flex-col items-center justify-center px-4 py-8 gap-5">
            {/* Ad Banner Top */}
            <AdBanner slot="DOWNLOAD_TOP" className="w-full max-w-lg" />

            <div className="w-full max-w-lg bg-surface-elevated/90 backdrop-blur-md border border-border-subtle/50 rounded-2xl p-6 sm:p-8 flex flex-col items-center gap-6 text-center shadow-2xl relative overflow-hidden">
                {/* Decorative glow header background */}
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary-container/15 rounded-full blur-3xl pointer-events-none" />

                {/* Animated Download Icon Badge */}
                <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-primary-container/15 border border-primary-container/30 flex items-center justify-center shadow-lg shadow-primary-container/10">
                        <svg className="w-8 h-8 text-primary-stitch animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                    </div>
                </div>

                <div className="flex flex-col gap-1.5 w-full">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-on-surface">
                        Menyiapkan Tautan Unduhan
                    </h1>
                    <p className="text-xs sm:text-sm text-on-surface-variant line-clamp-2 px-2 font-medium">
                        {label}
                    </p>
                </div>

                {error ? (
                    <div className="w-full p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs sm:text-sm font-medium">
                        {error}
                    </div>
                ) : ready ? (
                    <div className="flex flex-col gap-3 w-full animate-fadeIn">
                        <a
                            href={target}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-3.5 px-6 bg-primary-container hover:brightness-110 active:scale-[0.99] text-on-primary font-bold rounded-xl text-sm transition-all duration-200 shadow-lg shadow-primary-container/25 flex items-center justify-center gap-2"
                        >
                            <span>Download Sekarang</span>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </a>
                        <p className="text-[11px] text-on-surface-variant/70">
                            Tautan unduhan langsung dibuka di tab baru.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4 w-full">
                        <div className="relative w-20 h-20 flex items-center justify-center">
                            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 72 72">
                                <circle cx="36" cy="36" r="30" stroke="currentColor" strokeWidth="4" className="text-surface-container" fill="none" />
                                <circle
                                    cx="36" cy="36" r="30"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    className="text-primary-stitch"
                                    fill="none"
                                    strokeDasharray={2 * Math.PI * 30}
                                    strokeDashoffset={2 * Math.PI * 30 * (seconds / COUNTDOWN)}
                                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                                />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-on-surface font-extrabold text-xl">{seconds}</span>
                        </div>
                        <p className="text-xs text-on-surface-variant font-medium">
                            Menyiapkan link dalam <span className="text-primary-stitch font-bold">{seconds}</span> detik...
                        </p>
                        <button disabled className="w-full py-3 bg-surface-container text-on-surface-variant/50 font-bold rounded-xl text-xs sm:text-sm cursor-not-allowed border border-border-subtle/30">
                            Harap Tunggu...
                        </button>
                    </div>
                )}

                <div className="pt-2 border-t border-border-subtle/20 w-full flex items-center justify-center">
                    <button
                        onClick={() => router.back()}
                        className="text-on-surface-variant hover:text-on-surface text-xs font-semibold transition flex items-center gap-1.5 py-1 px-3 rounded-lg hover:bg-surface-container"
                    >
                        <span>←</span> Kembali ke Halaman Episode
                    </button>
                </div>
            </div>

            {/* Ad Banner Bottom */}
            <AdBanner slot="DOWNLOAD_BOTTOM" className="w-full max-w-lg" />
        </div>
    );
}
