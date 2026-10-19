'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChevronLeft, faChevronRight, faList, faExclamationCircle,
    faPlay, faStar, faDownload, faTv
} from '@fortawesome/free-solid-svg-icons';
import AdBanner from '@/components/AdBanner';
import { useAuth } from '@/context/AuthContext';
import CommentList from '@/components/CommentList';
import AniListSyncButton from '@/components/AniListSyncButton';
import AdultWarningModal from '@/components/AdultWarningModal';

/* ─── Detect URL type ─────────────────────────────────────── */
function detectUrlType(url = '') {
    const u = url.trim().toLowerCase();
    if (!u) return 'none';
    if (u.endsWith('.m3u8') || u.includes('.m3u8?')) return 'm3u8';
    if (u.endsWith('.mp4') || u.includes('.mp4?')) return 'mp4';
    if (u.endsWith('.webm')) return 'webm';
    if (u.endsWith('.ogg') || u.endsWith('.ogv')) return 'ogg';
    return 'iframe';
}

/* ─── Plyr video player (mp4 / webm / ogg) via CDN ──────── */
function NativePlayer({ url, type, title }) {
    const videoRef = useRef(null);
    const plyrRef = useRef(null);

    const mimeMap = { mp4: 'video/mp4', webm: 'video/webm', ogg: 'video/ogg' };

    useEffect(() => {
        let destroyed = false;

        async function initPlyr() {
            // Load Plyr CSS
            if (!document.getElementById('plyr-css')) {
                const link = document.createElement('link');
                link.id = 'plyr-css';
                link.rel = 'stylesheet';
                link.href = 'https://cdn.plyr.io/3.7.3/plyr.css';
                document.head.appendChild(link);
            }

            // Inject sizing override (sekali)
            if (!document.getElementById('plyr-override')) {
                const style = document.createElement('style');
                style.id = 'plyr-override';
                style.textContent = `
                    #plyr-native-wrap, #plyr-native-wrap .plyr,
                    #plyr-native-wrap .plyr__video-wrapper,
                    #plyr-native-wrap video { width: 100% !important; height: 100% !important; }
                    #plyr-native-wrap video { object-fit: contain; background: #000; }
                `;
                document.head.appendChild(style);
            }

            // Load Plyr JS
            if (!window.Plyr) {
                await new Promise((resolve, reject) => {
                    if (document.getElementById('plyr-js')) {
                        // Script sudah ada, tunggu load
                        document.getElementById('plyr-js').addEventListener('load', resolve);
                        return;
                    }
                    const script = document.createElement('script');
                    script.id = 'plyr-js';
                    script.src = 'https://cdn.plyr.io/3.7.3/plyr.polyfilled.js';
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }

            if (destroyed || !videoRef.current) return;

            const player = new window.Plyr(videoRef.current, {
                controls: [
                    'play-large', 'play', 'progress', 'current-time', 'duration',
                    'mute', 'volume', 'settings', 'fullscreen',
                ],
                settings: ['speed'],
                autoplay: true,
                resetOnEnd: false,
            });

            plyrRef.current = player;
            if (destroyed) { player.destroy(); plyrRef.current = null; return; }

            // Set source setelah player siap (pola CDN player)
            player.source = {
                type: 'video',
                title: title || '',
                sources: [{ src: url, type: mimeMap[type] || 'video/mp4' }],
            };
        }

        initPlyr().catch(() => { });

        return () => {
            destroyed = true;
            if (plyrRef.current) {
                plyrRef.current.destroy();
                plyrRef.current = null;
            }
        };
    }, [url]);

    return (
        <div className="w-full bg-black rounded-none md:rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
            <div id="plyr-native-wrap" style={{ width: '100%', height: '100%' }}>
                <video
                    ref={videoRef}
                    playsInline
                />
            </div>
        </div>
    );
}

/* ─── HLS / m3u8 player via hls.js (lazy-loaded) ─────────── */
function HlsPlayer({ url, title }) {
    const videoRef = useRef(null);
    const [hlsError, setHlsError] = useState(false);

    useEffect(() => {
        if (!url || !videoRef.current) return;
        let hls;
        const video = videoRef.current;

        async function initHls() {
            try {
                const Hls = (await import('hls.js')).default;
                if (Hls.isSupported()) {
                    hls = new Hls({ enableWorker: true, lowLatencyMode: true });
                    hls.loadSource(url);
                    hls.attachMedia(video);
                    hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => { }));
                    hls.on(Hls.Events.ERROR, (_, data) => {
                        if (data.fatal) setHlsError(true);
                    });
                } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    // Safari native HLS
                    video.src = url;
                    video.play().catch(() => { });
                } else {
                    setHlsError(true);
                }
            } catch {
                setHlsError(true);
            }
        }
        initHls();
        return () => hls?.destroy();
    }, [url]);

    if (hlsError) return (
        <div className="flex flex-col items-center justify-center w-full bg-black rounded-xl" style={{ aspectRatio: '16/9' }}>
            <FontAwesomeIcon icon={faExclamationCircle} className="text-red-500 mb-3 text-4xl" />
            <p className="text-gray-400 text-sm text-center px-4">Gagal memuat stream HLS.<br />Coba server lain.</p>
        </div>
    );

    return (
        <div className="relative w-full bg-black rounded-none md:rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
            <video
                ref={videoRef}
                controls
                playsInline
                className="w-full h-full object-contain"
                title={title}
            />
        </div>
    );
}

/* ─── Iframe embed player ─────────────────────────────────── */
function IframePlayer({ url, title, episodeKey }) {
    // Proksi URL jika berasal dari desustream atau domain terlindungi CSP frame-ancestors
    const isProtected = /desustream\.(net|info|me|com)|desuplus|desudrive/i.test(url);
    const finalUrl = isProtected ? `/api/proxy/stream?url=${encodeURIComponent(url)}` : url;

    return (
        <div className="relative w-full bg-black rounded-none md:rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
            <iframe
                key={episodeKey}
                src={finalUrl}
                title={title}
                className="absolute inset-0 w-full h-full border-0"
                allowFullScreen
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                scrolling="no"
                referrerPolicy="no-referrer"
            />
        </div>
    );
}

/* ─── Smart Player: picks correct renderer ────────────────── */
function SmartPlayer({ url, title, episodeKey, serverType }) {
    const urlType = serverType || detectUrlType(url);

    if (!url) return (
        <div className="flex flex-col items-center justify-center w-full bg-surface-elevated rounded-none md:rounded-xl border border-border-subtle/30" style={{ aspectRatio: '16/9' }}>
            <FontAwesomeIcon icon={faExclamationCircle} className="text-on-surface-variant mb-3 text-4xl" />
            <p className="text-on-surface-variant text-sm">URL server tidak tersedia.</p>
        </div>
    );

    if (urlType === 'm3u8' || urlType === 'hls') return <HlsPlayer url={url} title={title} />;
    if (['mp4', 'webm', 'ogg'].includes(urlType)) return <NativePlayer url={url} type={urlType} title={title} />;
    return <IframePlayer url={url} title={title} episodeKey={episodeKey} />;
}

/* ─── Recommendation Card ────────────────────────────────── */
function RecCard({ anime }) {
    return (
        <div className="flex flex-col group">
            <Link href={`/anime/${anime.slug}`} className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border border-border-subtle/30 mb-2">
                {anime.coverImage
                    ? <img src={anime.coverImage} alt={anime.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    : <div className="w-full h-full bg-surface-container flex items-center justify-center"><span className="text-3xl opacity-20">🎬</span></div>
                }
                {anime.type && (
                    <span className="absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-surface-deep/80 text-on-surface-variant border border-border-subtle/40">{anime.type}</span>
                )}
                {anime.status && (
                    <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary-container/80 text-on-primary">{anime.status}</span>
                )}
            </Link>
            <Link href={`/anime/${anime.slug}`}>
                <h3 className="text-[12px] font-bold text-on-surface line-clamp-2 leading-snug group-hover:text-primary-stitch transition-colors">{anime.title}</h3>
            </Link>
        </div>
    );
}

/* ─── Main Component ─────────────────────────────────────── */
export default function ReaderClient({ initialData }) {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { slug, episodeSlug } = params;

    const [data, setData] = useState(initialData);
    const [episodeList, setEpisodeList] = useState([]);
    const [loading, setLoading] = useState(!initialData);
    const [error, setError] = useState(null);

    const [activeServer, setActiveServer] = useState(0);
    const [episodeQuery, setEpisodeQuery] = useState('');

    // Sync data when initialData changes (navigation between episodes)
    useEffect(() => {
        if (initialData) {
            setData(initialData);
            setLoading(false);
            setError(null);
        }
    }, [initialData]);

    // Client-side fetch if SSR data is missing
    useEffect(() => {
        if (data) return;
        async function initPlayer() {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`${window.location.origin}/api/episode/${slug}/${episodeSlug}`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = await res.json();
                if (!json.success) throw new Error(json.message || 'Gagal memuat episode');
                setData(json.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        initPlayer();
    }, [slug, episodeSlug, data]);

    // Default ke server streaming yang paling stabil (filedon / vidhide / mega / ondesu / fallback index 0)
    useEffect(() => {
        const servers = data?.episode?.servers || data?.chapter?.servers || [];
        // Prioritaskan server embed stabil yang tidak terkena Google IP-lock
        const priority = ['filedon', 'vidhide', 'mega', 'ondesu3', 'odstream', 'blogs', 'solidfiles'];
        let bestIdx = -1;
        for (const p of priority) {
            const found = servers.findIndex(s => s.name?.toLowerCase().includes(p) || s.url?.toLowerCase().includes(p));
            if (found >= 0) {
                bestIdx = found;
                break;
            }
        }
        setActiveServer(bestIdx >= 0 ? bestIdx : 0);
    }, [episodeSlug, data]);

    // Save watch history
    useEffect(() => {
        const anime = data?.anime || data?.manga;
        const episode = data?.episode || data?.chapter;
        if (!user?.uid || !anime || !episode) return;
        fetch(`${window.location.origin}/api/users/${user.uid}/history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: anime.type || 'anime',
                slug: anime.slug,
                title: anime.title,
                thumb: anime.coverImage || '',
                lastChapterTitle: episode.title,
                lastChapterSlug: episodeSlug,
                upsert: true,
            }),
        }).catch(() => { });
    }, [user?.uid, data, episodeSlug]);

    // Load episode list for sidebar
    useEffect(() => {
        if (!slug) return;
        async function loadEpisodes() {
            try {
                const cacheKey = `episodeList_${slug}`;
                const cached = sessionStorage.getItem(cacheKey);
                if (cached) { setEpisodeList(JSON.parse(cached)); return; }
                const res = await fetch(`${window.location.origin}/api/anime/${slug}`);
                if (!res.ok) return;
                const json = await res.json();
                const episodes = json?.data?.info?.episodes || json?.data?.episodes || [];
                if (json.success && Array.isArray(episodes)) {
                    setEpisodeList(episodes);
                    try { sessionStorage.setItem(cacheKey, JSON.stringify(episodes)); } catch (_) { }
                }
            } catch { }
        }
        loadEpisodes();
    }, [slug]);

    // Keyboard navigation
    useEffect(() => {
        const handle = (e) => {
            if (e.key === 'ArrowRight' && data?.navigation?.next)
                router.push(`/episode/${slug}/${data.navigation.next}`);
            if (e.key === 'ArrowLeft' && data?.navigation?.prev)
                router.push(`/episode/${slug}/${data.navigation.prev}`);
        };
        window.addEventListener('keydown', handle);
        return () => window.removeEventListener('keydown', handle);
    }, [data, slug, router]);

    /* ── Loading / Error states ── */
    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-surface-deep">
            <div className="w-10 h-10 border-4 border-primary-container border-t-transparent rounded-full animate-spin" />
        </div>
    );
    if (error || !data) return (
        <div className="h-screen flex flex-col items-center justify-center gap-4 px-4 text-on-surface bg-surface-deep">
            <FontAwesomeIcon icon={faExclamationCircle} className="text-status-expired text-5xl" />
            <p className="text-status-expired text-center">{error || 'Gagal memuat episode'}</p>
            <button onClick={() => router.back()} className="px-5 py-2.5 bg-primary-container text-on-primary rounded-xl font-bold hover:brightness-110 transition-colors">Kembali</button>
        </div>
    );

    /* ── Destructure data ── */
    const anime = data.anime || data.manga;
    const episode = data.episode || data.chapter;
    const { navigation, recommendations = [] } = data;
    const servers = Array.isArray(episode?.servers) ? episode.servers : [];
    const downloads = Array.isArray(episode?.downloads) ? episode.downloads : [];
    const activeUrl = servers[activeServer]?.url || '';
    const animeTitle = anime?.title || '';
    const episodeTitle = episode?.title || '';
    const playerKey = `${episodeSlug}-${activeServer}`;
    const isAdult = anime?.genres?.some(g => (g || '').toLowerCase() === 'hentai') || anime?.type?.toLowerCase() === 'hentai';

    const filteredEpisodes = episodeList.filter(ep => {
        const q = episodeQuery.toLowerCase();
        return ep.title?.toLowerCase().includes(q) || ep.slug?.toLowerCase().includes(q);
    });

    return (
        <div className="min-h-screen bg-surface-deep text-on-surface relative">
            {/* Adult 18+ Warning Modal */}
            <AdultWarningModal isAdult={isAdult} animeTitle={animeTitle} />

            {/* Backdrop Banner HD Glow */}
            {(anime?.bannerImage || anime?.coverImage) && (
                <div className="absolute top-0 inset-x-0 h-[480px] overflow-hidden pointer-events-none z-0">
                    <img
                        src={anime.bannerImage || anime.coverImage}
                        alt=""
                        className={`w-full h-full object-cover ${anime.bannerImage ? 'opacity-20 blur-md' : 'opacity-10 blur-2xl'} scale-105`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-surface-deep/40 via-surface-deep/85 to-surface-deep" />
                </div>
            )}
            <div className="relative z-10 max-w-[1400px] mx-auto px-4 py-6 md:py-8 flex flex-col gap-6">

                {/* ── BREADCRUMB HEADER ── */}
                <nav className="flex items-center gap-1.5 text-xs text-on-surface-variant min-w-0">
                    <Link href="/" className="hover:text-on-surface transition shrink-0">Home</Link>
                    <span className="shrink-0 text-border-subtle">›</span>
                    <Link
                        href={`/anime/${anime?.slug || slug}`}
                        className="hover:text-on-surface transition truncate max-w-[120px] sm:max-w-[240px] md:max-w-none"
                        title={animeTitle}
                    >
                        {animeTitle}
                    </Link>
                    <span className="shrink-0 text-border-subtle">›</span>
                    <span className="text-primary-stitch font-semibold truncate shrink-0">{episodeTitle}</span>
                </nav>

                {/* ── MAIN LAYOUT GRID ── */}
                <div className="flex flex-col lg:flex-row gap-6">

                    {/* LEFT COLUMN: Player & Info */}
                    <div className="flex-1 flex flex-col min-w-0 gap-4">

                        {/* Video Player */}
                        <div className="w-full bg-surface-elevated rounded-xl overflow-hidden border border-border-subtle/30">
                            <SmartPlayer url={activeUrl} title={`${animeTitle} - ${episodeTitle}`} episodeKey={playerKey} serverType={servers[activeServer]?.type} />
                        </div>

                        {/* Ad Top */}
                        <AdBanner slot="STREAM_TOP" />

                        {/* Server Selector */}
                        {servers.length > 0 && (() => {
                            // Group servers by quality prefix (e.g. "480p - name" → quality "480p")
                            const qualities = [...new Set(servers.map(s => {
                                const m = s.name?.match(/^(\d+p)/i);
                                return m ? m[1].toUpperCase() : null;
                            }).filter(Boolean))];
                            const hasQualityGroups = qualities.length > 0;

                            return (
                                <div className="bg-surface-elevated rounded-xl p-4 md:p-5 border border-border-subtle/30 flex flex-col gap-3.5 shadow-sm">
                                    <div className="flex items-center justify-between pb-2 border-b border-border-subtle/20">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary-stitch text-xs">
                                                <FontAwesomeIcon icon={faTv} />
                                            </div>
                                            <span className="text-xs font-bold uppercase tracking-wider text-on-surface">Server Streaming</span>
                                        </div>
                                        {servers[activeServer] && (
                                            <span className="text-[11px] text-on-surface-variant font-medium">
                                                Aktif: <span className="text-primary-stitch font-semibold">{servers[activeServer]?.name || `Server ${activeServer + 1}`}</span>
                                            </span>
                                        )}
                                    </div>

                                    {hasQualityGroups ? (
                                        <div className="flex flex-col gap-2.5">
                                            {qualities.map(q => (
                                                <div
                                                    key={q}
                                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 sm:p-3 rounded-xl bg-surface-container/30 border border-border-subtle/20 hover:border-border-subtle/40 transition-colors"
                                                >
                                                    {/* Quality Badge */}
                                                    <div className="flex items-center gap-2 sm:min-w-[100px] shrink-0">
                                                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide bg-primary-container/15 text-primary-stitch border border-primary-container/30">
                                                            {q}
                                                        </span>
                                                    </div>

                                                    {/* Server Buttons */}
                                                    <div className="grid grid-cols-2 xs:grid-cols-3 sm:flex sm:flex-wrap gap-2 flex-1 sm:justify-end">
                                                        {servers.map((srv, idx) => {
                                                            const m = srv.name?.match(/^(\d+p)\s*-\s*(.+)$/i);
                                                            if (!m || m[1].toUpperCase() !== q) return null;
                                                            const isActive = activeServer === idx;
                                                            return (
                                                                <button
                                                                    key={idx}
                                                                    onClick={() => setActiveServer(idx)}
                                                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1.5 active:scale-95 ${isActive
                                                                        ? 'bg-primary-container text-on-primary shadow-md shadow-primary-container/25 font-bold border border-primary-container'
                                                                        : 'bg-surface-container hover:bg-surface-bright text-on-surface-variant hover:text-on-surface border border-border-subtle/30'
                                                                        }`}
                                                                >
                                                                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                                                                    {m[2]}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {servers.map((srv, idx) => {
                                                const isActive = activeServer === idx;
                                                return (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setActiveServer(idx)}
                                                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 active:scale-95 ${isActive
                                                            ? 'bg-primary-container text-on-primary shadow-md shadow-primary-container/25 font-bold border border-primary-container'
                                                            : 'bg-surface-container hover:bg-surface-bright text-on-surface-variant hover:text-on-surface border border-border-subtle/30'
                                                            }`}
                                                    >
                                                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                                                        {srv.name || `Server ${idx + 1}`}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        {/* Actions & Navigation */}
                        <div className="bg-surface-elevated p-3 sm:p-4 rounded-xl border border-border-subtle/30 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 shadow-sm">
                            {/* Prev Button */}
                            {navigation?.prev ? (
                                <Link
                                    href={`/episode/${slug}/${navigation.prev}`}
                                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 h-9 sm:h-[38px] px-3.5 sm:px-4 bg-surface-container hover:bg-surface-bright text-on-surface rounded-xl text-xs font-bold transition-all border border-border-subtle/40 hover:border-border-subtle active:scale-95"
                                >
                                    <FontAwesomeIcon icon={faChevronLeft} className="text-[10px]" />
                                    <span>Prev Ep</span>
                                </Link>
                            ) : (
                                <span className="flex-1 sm:flex-initial flex items-center justify-center gap-2 h-9 sm:h-[38px] px-3.5 sm:px-4 bg-surface-container/40 text-on-surface-variant/30 rounded-xl text-xs font-semibold cursor-not-allowed border border-border-subtle/10">
                                    <FontAwesomeIcon icon={faChevronLeft} className="text-[10px]" />
                                    <span>Prev Ep</span>
                                </span>
                            )}

                            {/* Center: AniList Sync & All Episodes */}
                            <div className="flex items-center gap-2 flex-wrap justify-center order-3 sm:order-none w-full sm:w-auto">
                                <AniListSyncButton
                                    animeSlug={anime?.slug || slug}
                                    anilistId={anime?.anilistId}
                                    episodeNumber={episode?.episodeIndex}
                                    episodeTitle={episodeTitle}
                                    episodeSlug={episodeSlug}
                                    totalEpisode={anime?.totalEpisode}
                                />

                                <Link
                                    href={`/anime/${anime?.slug || slug}`}
                                    className="flex items-center justify-center gap-1.5 h-9 sm:h-[38px] px-3.5 sm:px-4 bg-surface-container/80 hover:bg-surface-bright text-on-surface-variant hover:text-on-surface rounded-xl text-xs font-semibold transition-all border border-border-subtle/30 active:scale-95"
                                >
                                    <FontAwesomeIcon icon={faList} className="text-xs text-primary-stitch" />
                                    <span className="hidden xs:inline">Semua Episode</span>
                                    <span className="xs:hidden">All</span>
                                </Link>
                            </div>

                            {/* Next Button */}
                            {navigation?.next ? (
                                <Link
                                    href={`/episode/${slug}/${navigation.next}`}
                                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 h-9 sm:h-[38px] px-3.5 sm:px-4 bg-primary-container hover:brightness-110 active:scale-95 text-on-primary rounded-xl text-xs font-bold transition-all shadow-md shadow-primary-container/20 border border-primary-container"
                                >
                                    <span>Next Ep</span>
                                    <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
                                </Link>
                            ) : (
                                <span className="flex-1 sm:flex-initial flex items-center justify-center gap-2 h-9 sm:h-[38px] px-3.5 sm:px-4 bg-surface-container/40 text-on-surface-variant/30 rounded-xl text-xs font-semibold cursor-not-allowed border border-border-subtle/10">
                                    <span>Next Ep</span>
                                    <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
                                </span>
                            )}
                        </div>

                        {/* Download Links */}
                        {downloads.length > 0 && (
                            <div className="bg-surface-elevated rounded-xl p-4 md:p-5 border border-border-subtle/30 flex flex-col gap-3 shadow-sm">
                                <div className="flex items-center justify-between pb-2 border-b border-border-subtle/20">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary-stitch text-xs">
                                            <FontAwesomeIcon icon={faDownload} />
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-wider text-on-surface">Link Download</span>
                                    </div>
                                    <span className="text-[11px] text-on-surface-variant font-medium">{downloads.length} Pilihan Kualitas</span>
                                </div>

                                <div className="flex flex-col gap-2.5">
                                    {downloads.map((dl, i) => (
                                        <div
                                            key={i}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-surface-container/30 border border-border-subtle/20 hover:border-border-subtle/40 transition-colors"
                                        >
                                            {/* Quality & Size */}
                                            <div className="flex items-center gap-2 sm:min-w-[160px] shrink-0">
                                                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide bg-primary-container/15 text-primary-stitch border border-primary-container/30">
                                                    {dl.quality}
                                                </span>
                                                {dl.size && (
                                                    <span className="text-[11px] text-on-surface-variant font-medium bg-surface-bright/40 px-2 py-0.5 rounded text-gray-400">
                                                        {dl.size}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Mirror Buttons */}
                                            <div className="grid grid-cols-2 xs:grid-cols-3 sm:flex sm:flex-wrap gap-2 flex-1 sm:justify-end">
                                                {dl.links?.map((lnk, j) => (
                                                    <a
                                                        key={j}
                                                        href={lnk.url ? `/dl?url=${btoa(lnk.url)}&label=${encodeURIComponent(`${animeTitle} ${episodeTitle} - ${dl.quality} (${lnk.name})`)}` : '#'}
                                                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-center bg-surface-container hover:bg-primary-container hover:text-on-primary text-on-surface-variant transition-all duration-150 border border-border-subtle/30 hover:border-primary-container hover:shadow-md hover:shadow-primary-container/10 active:scale-95"
                                                    >
                                                        {lnk.name}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Title Metadata */}
                        <div className="bg-surface-elevated p-4 md:p-6 rounded-xl border border-border-subtle/30 flex flex-col gap-2">
                            <h1 className="text-xl md:text-2xl font-bold text-on-surface leading-tight">
                                {animeTitle} - {episodeTitle}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-on-surface-variant mt-1">
                                <span>Diperbarui pada {new Date(episode?.createdAt || Date.now()).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                            <div className="mt-3 text-xs text-on-surface-variant/60 leading-relaxed">
                                <p>Download {animeTitle} {episodeTitle}, Nonton {animeTitle} {episodeTitle}, jangan lupa mengklik tombol like dan share ya. Anime {animeTitle} selalu update di {process.env.NEXT_PUBLIC_SITE_NAME || 'Komikcast'}. Jangan lupa nonton update anime lainnya ya.</p>
                            </div>
                        </div>

                        {/* Ad Bottom */}
                        <AdBanner slot="STREAM_BOTTOM" />

                        {/* {/* Comments Section */}
                        {/* <div className="bg-[#16151d] rounded-xl border border-white/5 overflow-hidden">
                            <div className="p-4 md:p-6">
                                <CommentList slug={`${slug}-${episodeSlug}`} />
                            </div>
                        </div> */}

                        {/* Seri Serupa (Moved to below comments) */}
                        {recommendations.length > 0 && (
                            <div className="bg-surface-elevated rounded-xl border border-border-subtle/30 overflow-hidden">
                                <div className="px-4 py-3 border-b border-border-subtle/30 bg-surface-container/50">
                                    <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider">Seri Serupa</h2>
                                </div>
                                <div className="p-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                    {recommendations.slice(0, 6).map(rec => (
                                        <RecCard key={rec.slug} anime={rec} />
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>

                    {/* RIGHT SIDEBAR */}
                    <div className="w-full lg:w-[320px] xl:w-[360px] flex-shrink-0 flex flex-col gap-6">

                        {/* Info Seri */}
                        <div className="bg-surface-elevated rounded-xl border border-border-subtle/30 overflow-hidden">
                            <div className="px-4 py-3 border-b border-border-subtle/30 bg-surface-container/50">
                                <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider">Informasi Seri</h2>
                            </div>
                            <div className="p-4 flex gap-4">
                                <Link href={`/anime/${anime?.slug || slug}`} className="flex-shrink-0">
                                    <img
                                        src={anime?.coverImage || '/og-image.png'}
                                        alt={animeTitle}
                                        className="w-24 h-36 object-cover rounded-lg bg-black shadow-md"
                                    />
                                </Link>
                                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                                    <Link href={`/anime/${anime?.slug || slug}`}>
                                        <h3 className="text-sm font-bold text-on-surface line-clamp-2 hover:text-primary-stitch transition">{animeTitle}</h3>
                                    </Link>
                                    <div className="flex items-center gap-1.5 text-status-pending text-xs font-bold">
                                        <FontAwesomeIcon icon={faStar} className="text-xs" /> {anime?.rating || 'N/A'}
                                        <span className="text-on-surface-variant font-normal ml-1">Rating</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {anime?.genres?.slice(0, 3).map(g => (
                                            <span key={g} className="text-[10px] bg-surface-container border border-border-subtle/40 text-on-surface-variant px-1.5 py-0.5 rounded">
                                                {g}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex gap-2 mt-auto text-xs text-on-surface-variant">
                                        {anime?.type && <span>{anime.type}</span>}
                                        {anime?.type && anime?.status && <span>•</span>}
                                        {anime?.status && <span>{anime.status}</span>}
                                    </div>
                                </div>
                            </div>
                            {anime?.synopsis && (
                                <div className="px-4 pb-4">
                                    <p className="text-xs text-on-surface-variant line-clamp-4 leading-relaxed">{anime.synopsis}</p>
                                </div>
                            )}
                        </div>

                        {/* Daftar Episode */}
                        <div id="episode-list" className="bg-surface-elevated rounded-xl border border-border-subtle/30 flex flex-col max-h-[280px] lg:max-h-[500px]">
                            <div className="px-4 py-3 border-b border-border-subtle/30 bg-surface-container/50 flex items-center justify-between">
                                <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider">Daftar Episode</h2>
                                <span className="text-xs text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">{filteredEpisodes.length} eps</span>
                            </div>
                            <div className="p-3 border-b border-border-subtle/30">
                                <input
                                    type="text"
                                    placeholder="Cari episode..."
                                    value={episodeQuery}
                                    onChange={e => setEpisodeQuery(e.target.value)}
                                    className="w-full bg-surface-container border border-border-subtle rounded-lg py-2 px-3 text-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary-stitch transition"
                                />
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                {filteredEpisodes.length === 0 ? (
                                    <p className="text-center text-on-surface-variant text-xs py-8">Tidak ada episode</p>
                                ) : (
                                    filteredEpisodes.map(ep => {
                                        const isCurrent = ep.slug === episodeSlug;
                                        return (
                                            <Link
                                                key={ep.slug}
                                                href={`/episode/${slug}/${ep.slug}`}
                                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${isCurrent
                                                    ? 'bg-primary-container/10 border border-primary-stitch/30 text-primary-stitch'
                                                    : 'border border-transparent text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                                                    }`}
                                            >
                                                <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${isCurrent ? 'bg-primary-container text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}>
                                                    <FontAwesomeIcon icon={faPlay} className="text-[10px]" />
                                                </div>
                                                <span className="truncate">{ep.title}</span>
                                                {isCurrent && <span className="ml-auto flex-shrink-0 w-2 h-2 rounded-full bg-primary-stitch shadow-[0_0_8px_rgba(195,192,255,0.6)]" />}
                                            </Link>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
