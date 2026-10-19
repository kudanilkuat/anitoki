'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer({ className = '' }) {
    const pathname = usePathname();
    const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Anitoki';
    const currentYear = new Date().getFullYear();

    // Sembunyikan footer di panel admin dan halaman download redirect
    if (pathname?.startsWith('/admin') || pathname?.startsWith('/dl')) {
        return null;
    }

    return (
        <footer className={`w-full border-t border-border-subtle/40 mt-16 pt-12 pb-24 md:pb-12 bg-surface-deep/80 backdrop-blur-md relative z-10 ${className}`}>
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                {/* Main Grid: Brand + 3 Otakudesu Info Cards + Quick Navigation */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10 pb-10 border-b border-border-subtle/30">
                    {/* Col 1: Brand & Description (4 cols on desktop) */}
                    <div className="md:col-span-4 flex flex-col gap-3.5">
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-black tracking-tight text-on-surface uppercase">
                                {siteName}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-container text-on-primary">
                                Sub Indo
                            </span>
                        </div>
                        <p className="text-xs text-on-surface-variant/80 leading-relaxed font-normal">
                            Streaming dan download anime subtitle Indonesia terlengkap, terupdate, dan bebas buffering. Nikmati beragam resolusi mulai dari 360p, 480p, 720p hingga 1080p dengan format MP4 dan MKV.
                        </p>
                        <div className="flex items-center gap-2 text-xs text-on-surface-variant/60 pt-1">
                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Server Aktif & Terupdate Otomatis</span>
                        </div>
                    </div>

                    {/* Col 2: About & Tips (4 cols) */}
                    <div className="md:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* About */}
                        <div className="flex flex-col">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface pb-2 border-b border-border-subtle/40 mb-2.5">
                                About
                            </h4>
                            <p className="text-xs text-on-surface-variant/75 leading-relaxed font-normal">
                                {siteName} menyediakan link nonton online dan download batch anime kualitas terbaik dengan navigasi yang mudah dan bersih.
                            </p>
                        </div>

                        {/* Tips & Info */}
                        <div className="flex flex-col">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface pb-2 border-b border-border-subtle/40 mb-2.5">
                                Tips & Info
                            </h4>
                            <p className="text-xs text-on-surface-variant/75 leading-relaxed font-normal">
                                Simpan / Bookmark halaman <span className="font-semibold text-on-surface">{siteName}</span> di browser kalian (Ctrl+D) untuk akses cepat setiap episode baru dirilis!
                            </p>
                        </div>
                    </div>

                    {/* Col 3: Quick Navigation (3 cols) */}
                    <div className="md:col-span-3 flex flex-col">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface pb-2 border-b border-border-subtle/40 mb-2.5">
                            Navigasi
                        </h4>
                        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs font-medium">
                            <Link href="/" className="text-on-surface-variant hover:text-primary-stitch transition-colors">
                                Beranda
                            </Link>
                            <Link href="/anime" className="text-on-surface-variant hover:text-primary-stitch transition-colors">
                                Daftar Anime
                            </Link>
                            <Link href="/genres" className="text-on-surface-variant hover:text-primary-stitch transition-colors">
                                Kategori
                            </Link>
                            <Link href="/bookmarks" className="text-on-surface-variant hover:text-primary-stitch transition-colors">
                                Bookmark
                            </Link>
                            <Link href="/history" className="text-on-surface-variant hover:text-primary-stitch transition-colors">
                                Riwayat
                            </Link>
                            <Link href="/changelog" className="text-on-surface-variant hover:text-primary-stitch transition-colors">
                                Changelog
                            </Link>
                            <Link href="/download" className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 transition-colors">
                                <span>App Android</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Disclaimer */}
                <div className="py-4 text-[11px] text-on-surface-variant/50 leading-relaxed text-center sm:text-left">
                    Disclaimer: {siteName} does not store any files on its server. All contents are provided by non-affiliated third parties and open sources across the internet.
                </div>

                {/* Bottom Bar: Copyright & Legal */}
                <div className="pt-4 border-t border-border-subtle/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                    <p className="text-on-surface-variant/60 text-xs">
                        © {currentYear} <span className="font-semibold text-on-surface">{siteName}</span> · All rights reserved.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-5 text-xs">
                        <Link href="/privacy-policy" className="text-on-surface-variant/70 hover:text-primary-stitch transition-colors">
                            Privacy Policy
                        </Link>
                        <span className="text-border-subtle/60">•</span>
                        <Link href="/terms" className="text-on-surface-variant/70 hover:text-primary-stitch transition-colors">
                            Terms of Service
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
