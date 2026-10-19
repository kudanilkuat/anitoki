'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Image from 'next/image';
import Link from 'next/link';

const APKPURE_URL = 'https://apkpure.com/p/id.anitoki.app';

const SCREENSHOTS = [
    {
        id: 'home',
        title: 'Beranda & Trending',
        desc: 'Carousel anime populer, update episode harian, dan navigasi cepat.',
        src: '/app/screenshot_home.png',
    },
    {
        id: 'browse',
        title: 'Jelajah & Filter',
        desc: 'Temukan anime berdasarkan puluhan genre, status, tipe, dan urutan.',
        src: '/app/screenshot_browse.png',
    },
    {
        id: 'detail',
        title: 'Detail & Episode',
        desc: 'Sinopsis lengkap, daftar episode terurut, info studio, dan rating.',
        src: '/app/screenshot_detail.png',
    },
    {
        id: 'player',
        title: 'Smart Video Player',
        desc: 'Streaming lancar dengan multi-server, kontrol fullscreen, dan ganti episode instan.',
        src: '/app/screenshot_player.png',
    },
];

const FEATURES = [
    {
        icon: (
            <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
        ),
        title: 'Streaming Ringan & Cepat',
        desc: 'Dioptimalkan untuk smartphone Android dengan konsumsi memori rendah dan pemutaran video bebas lag.',
    },
    {
        icon: (
            <svg className="w-6 h-6 text-primary-stitch" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
        ),
        title: 'Notifikasi Episode Baru',
        desc: 'Jangan sampai ketinggalan kelanjutan cerita anime favoritmu dengan pembaruan episode setiap harinya.',
    },
    {
        icon: (
            <svg className="w-6 h-6 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
        ),
        title: 'Download Batch & Resolusi Lengkap',
        desc: 'Pilihan resolusi 360p, 480p, 720p hingga 1080p dengan link mirror langsung untuk ditonton offline.',
    },
    {
        icon: (
            <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
        ),
        title: 'Sinkronisasi Library Cloud',
        desc: 'Login sekali dan seluruh bookmark serta riwayat nonton tersimpan rapi dan tersinkronisasi.',
    },
    {
        icon: (
            <svg className="w-6 h-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
        ),
        title: 'Bebas Iklan Pop-up Agresif',
        desc: 'Antarmuka aplikasi yang bersih dan nyaman sehingga Anda dapat fokus menikmati serial anime.',
    },
    {
        icon: (
            <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
        ),
        title: 'Pembaruan Otomatis (In-App)',
        desc: 'Sistem auto-update otomatis memeriksa versi terbaru saat aplikasi dibuka, tanpa perlu unduh ulang manual.',
    },
];

const INSTALL_STEPS = [
    {
        step: '01',
        title: 'Unduh File APK',
        desc: 'Klik tombol "Unduh di APKPure" di atas untuk mendapatkan paket instalasi resmi Anitoki.',
    },
    {
        step: '02',
        title: 'Buka File Hasil Unduhan',
        desc: 'Tarik bar notifikasi smartphone atau buka folder "Download" di File Manager, lalu ketuk file APK.',
    },
    {
        step: '03',
        title: 'Izinkan Instalasi Sumber Luar',
        desc: 'Jika Android meminta izin, aktifkan "Izinkan dari sumber ini" (Allow from this source) di Pengaturan.',
    },
    {
        step: '04',
        title: 'Buka & Mulai Nonton',
        desc: 'Klik "Instal", tunggu beberapa detik hingga selesai, dan nikmati ribuan anime sub Indo di Anitoki!',
    },
];

const FAQS = [
    {
        q: 'Apakah aplikasi Anitoki gratis?',
        a: 'Ya, 100% gratis! Anda bisa langsung menonton ribuan episode anime dan movie subtitle Indonesia tanpa biaya langganan.',
    },
    {
        q: 'Apakah file APK Anitoki aman diinstal di smartphone?',
        a: 'Sangat aman. Aplikasi Anitoki di-hosting resmi di APKPure yang telah melalui pemindaian antivirus dan verifikasi tanda tangan digital resmi (Official Signature Verification).',
    },
    {
        q: 'Bagaimana cara memperbarui aplikasi jika ada rilis baru?',
        a: 'Aplikasi Anitoki dilengkapi fitur In-App Auto-Update. Ketika rilis baru diluncurkan, aplikasi akan otomatis memunculkan jendela notifikasi pembaruan saat dibuka.',
    },
    {
        q: 'Apakah akun dan bookmark di website akan sama dengan di aplikasi?',
        a: 'Tentu saja! Cukup login menggunakan akun Google Anda di dalam aplikasi, seluruh riwayat dan bookmark favorit Anda akan otomatis tersinkronisasi.',
    },
    {
        q: 'Apakah aplikasi Anitoki tersedia untuk perangkat iOS (iPhone / iPad)?',
        a: 'Saat ini aplikasi native khusus dioptimalkan untuk perangkat Android. Pengguna iOS tetap dapat mengakses situs web kami dengan mulus melalui browser Safari.',
    },
];

export default function DownloadAppPage() {
    const [activeScreenshot, setActiveScreenshot] = useState(0);
    const [openFaq, setOpenFaq] = useState(null);

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    return (
        <div className="min-h-screen bg-bg-primary text-on-surface">
            <Navbar />

            <main className="mt-14 md:mt-16 overflow-hidden">
                {/* ── HERO SECTION ────────────────────────────────────────────── */}
                <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
                    {/* Ambient light glow backdrop */}
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary-container/20 blur-[130px] rounded-full pointer-events-none -z-10" />
                    <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
                        {/* Text & CTAs */}
                        <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
                            {/* Pill Badge */}
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-elevated border border-border-subtle/80 text-xs font-semibold mb-6 shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-on-surface-variant">Rilis Resmi v1.0.0</span>
                                <span className="text-border-subtle/60">•</span>
                                <span className="text-primary-stitch font-bold">Tersedia di APKPure</span>
                            </div>

                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-on-surface tracking-tight leading-[1.15] mb-6">
                                Nonton Anime Lebih Nyaman di Aplikasi{' '}
                                <span className="bg-gradient-to-r from-primary-stitch via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                                    Anitoki
                                </span>
                            </h1>

                            <p className="text-sm sm:text-base md:text-lg text-on-surface-variant/80 max-w-2xl leading-relaxed font-normal mb-8">
                                Streaming ribuan judul anime subtitle Indonesia terupdate setiap hari, notifikasi rilis instan, multi-server anti buffering, dan download batch offline tanpa iklan mengganggu.
                            </p>

                            {/* CTAs */}
                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-10">
                                {/* Primary Button: APKPure */}
                                <a
                                    href={APKPURE_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-3.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-base shadow-xl shadow-emerald-500/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group"
                                >
                                    {/* APKPure / Android Icon */}
                                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0 group-hover:rotate-6 transition-transform">
                                        <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                                            <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1.0001s.4482-1.0001.9993-1.0001c.552 0 1.0001.4486 1.0001 1.0001s-.4481 1.0001-1.0001 1.0001m-11.046 0c-.5511 0-.9993-.4486-.9993-1.0001s.4482-1.0001.9993-1.0001c.552 0 1.0001.4486 1.0001 1.0001s-.4481 1.0001-1.0001 1.0001m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.4116 13.8533 8.125 12 8.125s-3.5902.2866-5.1368.8247L4.8409 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.152 1.5676l1.9973 3.4592C2.6889 12.138.3582 16.1415 0 20.875h24c-.3582-4.7335-2.6889-8.737-6.1185-11.5536" />
                                        </svg>
                                    </div>
                                    <div className="flex flex-col text-left leading-none">
                                        <span className="text-[10px] uppercase font-semibold text-white/80 tracking-wider">Unduh via</span>
                                        <span className="text-base font-extrabold text-white mt-1">APKPure Official</span>
                                    </div>
                                    <svg className="w-5 h-5 text-white/80 group-hover:translate-x-1 transition-transform ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </a>

                                {/* Secondary Button: Panduan Install */}
                                <a
                                    href="#cara-install"
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-surface-elevated hover:bg-surface-container border border-border-subtle/80 text-on-surface font-semibold text-sm transition-all duration-200"
                                >
                                    <svg className="w-4 h-4 text-primary-stitch" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Cara Pasang APK</span>
                                </a>
                            </div>

                            {/* App Specs Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-xl">
                                <div className="p-3 rounded-xl bg-surface-elevated/70 border border-border-subtle/50 text-center">
                                    <span className="text-[10px] text-on-surface-variant/70 uppercase font-semibold block">Versi</span>
                                    <span className="text-xs font-bold text-on-surface mt-0.5 block">v1.0.0 (Latest)</span>
                                </div>
                                <div className="p-3 rounded-xl bg-surface-elevated/70 border border-border-subtle/50 text-center">
                                    <span className="text-[10px] text-on-surface-variant/70 uppercase font-semibold block">Ukuran File</span>
                                    <span className="text-xs font-bold text-on-surface mt-0.5 block">~25 MB</span>
                                </div>
                                <div className="p-3 rounded-xl bg-surface-elevated/70 border border-border-subtle/50 text-center">
                                    <span className="text-[10px] text-on-surface-variant/70 uppercase font-semibold block">Kompatibilitas</span>
                                    <span className="text-xs font-bold text-on-surface mt-0.5 block">Android 6.0+</span>
                                </div>
                                <div className="p-3 rounded-xl bg-surface-elevated/70 border border-border-subtle/50 text-center">
                                    <span className="text-[10px] text-on-surface-variant/70 uppercase font-semibold block">Lisensi</span>
                                    <span className="text-xs font-bold text-emerald-400 mt-0.5 block">100% Gratis</span>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Phone Mockup Hero */}
                        <div className="lg:col-span-5 flex justify-center relative">
                            {/* Ambient Glow behind phone */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary-container/40 via-emerald-500/20 to-transparent blur-3xl rounded-full -z-10 scale-95" />

                            <div className="relative w-[280px] sm:w-[320px] rounded-[44px] p-3 bg-gradient-to-b from-white/15 via-white/5 to-white/10 shadow-2xl border border-white/20 backdrop-blur-xl">
                                {/* Smartphone Outer Rim */}
                                <div className="relative rounded-[36px] bg-[#0d1017] overflow-hidden border border-border-subtle shadow-inner">
                                    {/* Punch hole camera */}
                                    <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-black rounded-full z-30 border border-white/10 flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 bg-blue-950/80 rounded-full" />
                                    </div>

                                    {/* Mockup screen preview */}
                                    <div className="relative aspect-[9/19] w-full bg-surface-deep">
                                        <Image
                                            src={SCREENSHOTS[activeScreenshot].src}
                                            alt={SCREENSHOTS[activeScreenshot].title}
                                            fill
                                            className="object-cover object-top transition-all duration-500"
                                            priority
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/80 via-transparent to-transparent pointer-events-none" />
                                    </div>
                                </div>

                                {/* Floating Badge 1: 1080p Full HD */}
                                <div className="absolute -left-4 top-1/4 bg-surface-elevated/90 backdrop-blur-md border border-border-subtle px-3 py-2 rounded-2xl shadow-xl flex items-center gap-2.5 animate-bounce [animation-duration:4s]">
                                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-black">
                                        HD
                                    </div>
                                    <div className="text-left">
                                        <div className="text-[11px] font-bold text-on-surface">1080p & 720p</div>
                                        <div className="text-[9px] text-on-surface-variant">Multi Resolusi</div>
                                    </div>
                                </div>

                                {/* Floating Badge 2: Anti Buffering */}
                                <div className="absolute -right-4 bottom-1/4 bg-surface-elevated/90 backdrop-blur-md border border-border-subtle px-3 py-2 rounded-2xl shadow-xl flex items-center gap-2.5 animate-bounce [animation-duration:5s]">
                                    <div className="w-7 h-7 rounded-lg bg-primary-container text-on-primary flex items-center justify-center text-xs font-black">
                                        ⚡
                                    </div>
                                    <div className="text-left">
                                        <div className="text-[11px] font-bold text-on-surface">Multi-Server</div>
                                        <div className="text-[9px] text-emerald-400 font-semibold">Anti Buffering</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── SCREENSHOT SHOWCASE ──────────────────────────────────────── */}
                <section className="py-16 md:py-24 bg-surface-deep/40 border-y border-border-subtle/30 relative">
                    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-2xl mx-auto mb-12">
                            <span className="text-xs font-bold uppercase tracking-wider text-primary-stitch">
                                Tampilan Antarmuka
                            </span>
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-on-surface mt-2 tracking-tight">
                                Desain Elegan, Ringan & Mudah Digunakan
                            </h2>
                            <p className="text-xs sm:text-sm text-on-surface-variant/80 mt-3 leading-relaxed">
                                Jelajahi tampilan nyata aplikasi Anitoki Android yang dirancang dengan navigasi intuitif dan tema gelap yang nyaman di mata.
                            </p>
                        </div>

                        {/* Interactive Selector Tabs */}
                        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-10">
                            {SCREENSHOTS.map((item, idx) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveScreenshot(idx)}
                                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 ${
                                        activeScreenshot === idx
                                            ? 'bg-primary-container text-on-primary shadow-lg shadow-primary-container/20 scale-105'
                                            : 'bg-surface-elevated border border-border-subtle/50 text-on-surface-variant hover:text-on-surface hover:border-border-subtle'
                                    }`}
                                >
                                    <span>{item.title}</span>
                                </button>
                            ))}
                        </div>

                        {/* Screenshot Cards Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {SCREENSHOTS.map((item, idx) => (
                                <div
                                    key={item.id}
                                    onClick={() => setActiveScreenshot(idx)}
                                    className={`group cursor-pointer rounded-3xl p-3 bg-surface-elevated/70 border transition-all duration-300 ${
                                        activeScreenshot === idx
                                            ? 'border-primary-stitch ring-2 ring-primary-stitch/30 shadow-2xl -translate-y-1.5'
                                            : 'border-border-subtle/40 hover:border-border-subtle hover:-translate-y-1'
                                    }`}
                                >
                                    <div className="relative aspect-[9/18] w-full rounded-2xl overflow-hidden bg-surface-deep border border-border-subtle/40 mb-3.5">
                                        <Image
                                            src={item.src}
                                            alt={item.title}
                                            fill
                                            className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>
                                    <div className="px-1.5 pb-1">
                                        <h3 className="text-sm font-bold text-on-surface group-hover:text-primary-stitch transition-colors">
                                            {item.title}
                                        </h3>
                                        <p className="text-[11px] text-on-surface-variant/75 mt-1 leading-snug">
                                            {item.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── KEY FEATURES GRID ────────────────────────────────────────── */}
                <section className="py-16 md:py-24 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-14">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                            Fitur Terbaik
                        </span>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-on-surface mt-2 tracking-tight">
                            Kenapa Wajib Nonton Pakai Aplikasi Anitoki?
                        </h2>
                        <p className="text-xs sm:text-sm text-on-surface-variant/80 mt-3 leading-relaxed">
                            Semua fitur yang Anda butuhkan untuk maraton anime tanpa gangguan, dikemas dalam satu aplikasi yang ringan.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {FEATURES.map((feat, i) => (
                            <div
                                key={i}
                                className="p-6 rounded-2xl bg-surface-elevated/60 border border-border-subtle/50 hover:border-border-subtle hover:bg-surface-elevated transition-all duration-200 group flex flex-col justify-between"
                            >
                                <div>
                                    <div className="w-12 h-12 rounded-xl bg-surface-container border border-border-subtle/60 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                        {feat.icon}
                                    </div>
                                    <h3 className="text-base font-bold text-on-surface mb-2">
                                        {feat.title}
                                    </h3>
                                    <p className="text-xs text-on-surface-variant/80 leading-relaxed font-normal">
                                        {feat.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── CARA INSTALL LANGKAH DEMI LANGKAH ───────────────────────── */}
                <section id="cara-install" className="py-16 md:py-24 bg-surface-deep/60 border-t border-border-subtle/30 scroll-mt-20">
                    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-2xl mx-auto mb-14">
                            <span className="text-xs font-bold uppercase tracking-wider text-primary-stitch">
                                Panduan Cepat
                            </span>
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-on-surface mt-2 tracking-tight">
                                Cara Mudah Memasang APK di Android
                            </h2>
                            <p className="text-xs sm:text-sm text-on-surface-variant/80 mt-3 leading-relaxed">
                                Cukup ikuti 4 langkah sederhana berikut untuk memasang aplikasi Anitoki di HP Anda dalam waktu kurang dari 1 menit.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {INSTALL_STEPS.map((step, i) => (
                                <div
                                    key={i}
                                    className="relative p-6 rounded-2xl bg-surface-elevated/80 border border-border-subtle/60 flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="text-3xl font-black text-primary-stitch/30 mb-4 font-mono">
                                            {step.step}
                                        </div>
                                        <h3 className="text-sm font-bold text-on-surface mb-2">
                                            {step.title}
                                        </h3>
                                        <p className="text-xs text-on-surface-variant/80 leading-relaxed">
                                            {step.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Direct Download Action within guide */}
                        <div className="mt-12 text-center">
                            <a
                                href={APKPURE_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary-container hover:brightness-110 text-on-primary font-bold text-sm shadow-xl shadow-primary-container/20 transition-all duration-200"
                            >
                                <span>Mulai Unduh Sekarang di APKPure</span>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </section>

                {/* ── FAQ SECTION ──────────────────────────────────────────────── */}
                <section className="py-16 md:py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <span className="text-xs font-bold uppercase tracking-wider text-primary-stitch">
                            Tanya Jawab
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-on-surface mt-2 tracking-tight">
                            Pertanyaan yang Sering Diajukan
                        </h2>
                    </div>

                    <div className="space-y-3.5">
                        {FAQS.map((faq, idx) => (
                            <div
                                key={idx}
                                className="rounded-2xl bg-surface-elevated/70 border border-border-subtle/50 overflow-hidden transition-colors"
                            >
                                <button
                                    onClick={() => toggleFaq(idx)}
                                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 text-sm font-bold text-on-surface hover:text-primary-stitch transition-colors"
                                >
                                    <span>{faq.q}</span>
                                    <svg
                                        className={`w-4 h-4 text-on-surface-variant/60 shrink-0 transition-transform duration-200 ${
                                            openFaq === idx ? 'rotate-180 text-primary-stitch' : ''
                                        }`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {openFaq === idx && (
                                    <div className="px-5 pb-5 pt-1 text-xs text-on-surface-variant/80 leading-relaxed border-t border-border-subtle/30">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── BOTTOM CALL TO ACTION ────────────────────────────────────── */}
                <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto mb-10">
                    <div className="relative rounded-3xl p-8 sm:p-12 md:p-16 overflow-hidden bg-gradient-to-r from-emerald-950/40 via-surface-elevated to-primary-container/20 border border-emerald-500/30 text-center flex flex-col items-center">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-3xl mb-6 shadow-inner">
                            📱
                        </div>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-on-surface tracking-tight max-w-xl">
                            Siap Nonton Anime Favorit Tanpa Ribet?
                        </h2>
                        <p className="text-xs sm:text-sm text-on-surface-variant/80 max-w-lg mt-3 mb-8 leading-relaxed">
                            Pasang aplikasi Anitoki sekarang di smartphone Android Anda dan nikmati kebebasan streaming ribuan anime sub Indo kapan saja.
                        </p>
                        <a
                            href={APKPURE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-base shadow-xl shadow-emerald-500/30 transition-all duration-300 hover:scale-105 active:scale-95"
                        >
                            <span>Unduh Sekarang di APKPure</span>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </a>
                    </div>
                </section>
            </main>
        </div>
    );
}
