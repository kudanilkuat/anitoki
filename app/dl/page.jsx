'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const COUNTDOWN = 5; // detik

export default function DownloadPage() {
    const params = useSearchParams();
    const encoded = params.get('url') || '';
    const label = params.get('label') || 'File';

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
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
            <div className="w-full max-w-md bg-[#16151d] border border-white/5 rounded-2xl p-8 flex flex-col items-center gap-6 text-center">
                <div className="w-16 h-16 rounded-full bg-pink-600/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                </div>

                <div>
                    <h1 className="text-white text-xl font-bold mb-1">Persiapkan Download</h1>
                    <p className="text-gray-400 text-sm">{label}</p>
                </div>

                {error ? (
                    <p className="text-red-400 text-sm">{error}</p>
                ) : ready ? (
                    <a
                        href={target}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl text-sm transition"
                    >
                        Download Sekarang →
                    </a>
                ) : (
                    <div className="flex flex-col items-center gap-3 w-full">
                        <div className="relative w-16 h-16">
                            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                                <circle cx="32" cy="32" r="28" stroke="#ffffff10" strokeWidth="4" fill="none" />
                                <circle
                                    cx="32" cy="32" r="28"
                                    stroke="#db2777"
                                    strokeWidth="4"
                                    fill="none"
                                    strokeDasharray={2 * Math.PI * 28}
                                    strokeDashoffset={2 * Math.PI * 28 * (seconds / COUNTDOWN)}
                                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                                />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg">{seconds}</span>
                        </div>
                        <p className="text-gray-500 text-xs">Link tersedia dalam {seconds} detik</p>
                        <button disabled className="w-full py-3 bg-white/5 text-gray-600 font-bold rounded-xl text-sm cursor-not-allowed">
                            Harap Tunggu...
                        </button>
                    </div>
                )}

                <Link href="javascript:history.back()" className="text-gray-600 hover:text-gray-400 text-xs transition">
                    ← Kembali
                </Link>
            </div>
        </div>
    );
}
