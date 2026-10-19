'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdultWarningModal({ isAdult = false, animeTitle = '' }) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [remember, setRemember] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (!isAdult) return;

        try {
            const isLocalVerified = localStorage.getItem('anitoki_age_verified') === 'true';
            const isSessionVerified = sessionStorage.getItem('anitoki_age_verified') === 'true';

            if (!isLocalVerified && !isSessionVerified) {
                setIsOpen(true);
            }
        } catch {
            setIsOpen(true);
        }
    }, [isAdult]);

    const handleConfirm = () => {
        try {
            sessionStorage.setItem('anitoki_age_verified', 'true');
            if (remember) {
                localStorage.setItem('anitoki_age_verified', 'true');
            }
        } catch (e) {
            console.error('Storage error:', e);
        }
        setIsOpen(false);
    };

    const handleCancel = () => {
        if (typeof window !== 'undefined') {
            if (window.history.length > 1) {
                router.back();
            } else {
                router.push('/');
            }
        }
    };

    if (!mounted || !isOpen || !isAdult) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in select-none">
            <div className="relative w-full max-w-md bg-surface-elevated/95 border border-rose-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-rose-950/50 flex flex-col items-center text-center animate-slide-up">
                {/* 18+ Glowing Badge Icon */}
                <div className="relative mb-4 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border-2 border-rose-500/50 flex items-center justify-center text-rose-500 shadow-lg shadow-rose-500/20">
                        <span className="font-display text-3xl font-black tracking-wider">18+</span>
                    </div>
                    <div className="absolute inset-0 rounded-2xl bg-rose-500/20 blur-xl animate-pulse pointer-events-none" />
                </div>

                {/* Title */}
                <h2 className="font-display text-xl sm:text-2xl font-bold text-on-surface tracking-wide mb-2">
                    Peringatan Konten Dewasa
                </h2>

                {/* Anime Name (if provided) */}
                {animeTitle && (
                    <p className="text-xs font-semibold text-rose-400 mb-2 truncate max-w-xs">
                        "{animeTitle}"
                    </p>
                )}

                {/* Description */}
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed mb-5">
                    Halaman ini memuat anime bertema dewasa / hentai khusus untuk penonton yang telah berusia <strong className="text-white font-bold">18 tahun ke atas</strong>.
                    Harap konfirmasi usia Anda sebelum melanjutkan.
                </p>

                {/* Remember Checkbox */}
                <label className="flex items-center gap-2 mb-6 cursor-pointer text-xs text-on-surface-variant hover:text-on-surface transition-colors">
                    <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        className="w-4 h-4 rounded border-border-subtle bg-surface-container text-rose-600 focus:ring-rose-500 focus:ring-offset-0 cursor-pointer"
                    />
                    <span>Ingat pilihan saya di perangkat ini</span>
                </label>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                    {/* Exit Button */}
                    <button
                        onClick={handleCancel}
                        className="flex-1 py-3 px-4 rounded-xl bg-surface-container hover:bg-surface-bright text-on-surface-variant hover:text-on-surface text-xs font-bold transition-all border border-border-subtle/40 active:scale-95"
                    >
                        Kembali / Keluar
                    </button>

                    {/* Confirm Button */}
                    <button
                        onClick={handleConfirm}
                        className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <span>Saya Berusia 18+</span>
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
