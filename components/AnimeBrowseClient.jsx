'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faEye } from '@fortawesome/free-solid-svg-icons';

const ID_MONTHS = {
    januari: 0, februari: 1, maret: 2, april: 3, mei: 4, juni: 5,
    juli: 6, agustus: 7, september: 8, oktober: 9, november: 10, desember: 11,
};

function formatTimeAgo(dateParam) {
    if (!dateParam) return '';
    let date;
    if (typeof dateParam === 'string') {
        const idMatch = dateParam.match(/^(\d{1,2})\s+(\w+),?\s*(\d{4})$/);
        if (idMatch) {
            const monthIdx = ID_MONTHS[idMatch[2].toLowerCase()];
            if (monthIdx !== undefined) {
                date = new Date(Date.UTC(parseInt(idMatch[3]), monthIdx, parseInt(idMatch[1])));
            }
        }
        if (!date && /^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(dateParam)) {
            const parts = dateParam.split(/[/-]/);
            date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00Z`);
        }
        if (!date) date = new Date(dateParam);
    } else {
        date = new Date(dateParam);
    }
    if (isNaN(date.getTime())) return '';
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 0) return 'Baru saja';
    let interval = seconds / 31536000;
    if (interval >= 1) return Math.floor(interval) + ' tahun lalu';
    interval = seconds / 2592000;
    if (interval >= 1) return Math.floor(interval) + ' bulan lalu';
    interval = seconds / 604800;
    if (interval >= 1) return Math.floor(interval) + ' minggu lalu';
    interval = seconds / 86400;
    if (interval >= 1) return Math.floor(interval) + ' hari lalu';
    interval = seconds / 3600;
    if (interval >= 1) return Math.floor(interval) + ' jam lalu';
    interval = seconds / 60;
    if (interval >= 1) return Math.floor(interval) + ' menit lalu';
    return 'Baru saja';
}

function TypeBadge({ type }) {
    const t = (type || '').toLowerCase();
    const map = {
        hentai: { bg: 'bg-pink-600', label: 'H' },
        ova: { bg: 'bg-purple-600', label: 'OVA' },
        movie: { bg: 'bg-yellow-600', label: 'MOV' },
        series: { bg: 'bg-pink-600', label: 'SER' },
        anime: { bg: 'bg-pink-500', label: 'ANI' },
        tv: { bg: 'bg-blue-600', label: 'TV' },
    };
    const style = map[t] || { bg: 'bg-gray-600', label: type || 'ANI' };
    return (
        <span className={`${style.bg} text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow uppercase`}>
            {style.label}
        </span>
    );
}

function StatusBadge({ status }) {
    const s = (status || '').toLowerCase();
    if (s === 'ongoing') return <span className="text-[8px] font-black text-status-ongoing bg-status-ongoing/10 px-1.5 py-0.5 rounded">ONGOING</span>;
    if (s === 'completed') return <span className="text-[8px] font-black text-on-surface-variant bg-surface-bright/30 px-1.5 py-0.5 rounded">END</span>;
    return null;
}

function AnimeGridCard({ anime }) {
    const coverImage = anime.coverImage || anime.thumb || '';
    const title = anime.title || '';
    const epList = Array.isArray(anime.episodes) ? anime.episodes.slice(0, 2) : [];

    return (
        <div className="flex flex-col group">
            <Link href={`/anime/${anime.slug}`} className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border border-border-subtle/30 mb-3 group/cover">
                {coverImage ? (
                    <Image src={coverImage} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="200px" unoptimized />
                ) : (
                    <div className="w-full h-full bg-surface-container flex items-center justify-center">
                        <span className="text-4xl opacity-20">🎬</span>
                    </div>
                )}
                <div className="absolute top-2 right-2 flex items-center bg-primary-container/90 text-on-primary px-1.5 py-0.5 rounded shadow-lg z-10 scale-[0.6] origin-top-right pointer-events-none">
                    <span className="font-black italic">{process.env.NEXT_PUBLIC_SITE_BRAND || 'KP'}</span>
                    <span className="text-[10px] font-bold ml-1 uppercase">{process.env.NEXT_PUBLIC_SITE_NAME || 'ANIMEKU'}</span>
                </div>
                <div className="absolute top-1.5 left-1.5"><TypeBadge type={anime.type} /></div>
                <div className="absolute bottom-1.5 left-1.5"><StatusBadge status={anime.status} /></div>
            </Link>

            <Link href={`/anime/${anime.slug}`} className="mb-2">
                <h3 className="font-bold text-on-surface text-[14px] text-left leading-snug line-clamp-1 group-hover:text-primary-stitch transition-colors">{title}</h3>
            </Link>

            <div className="flex flex-col gap-1.5">
                {epList.length > 0 ? epList.map((ep, idx) => (
                    <Link
                        key={idx}
                        href={`/episode/${anime.slug}/${ep.slug || ''}`}
                        className="flex justify-between items-center bg-surface-elevated hover:bg-surface-variant border border-border-subtle/40 px-2 py-1.5 rounded-lg transition-colors group/ch"
                    >
                        <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-on-surface-variant text-[10px] font-semibold group-hover/ch:text-primary-stitch transition-colors truncate max-w-[80px]">{ep.title || `Episode ${idx + 1}`}</span>
                            {idx === 0 && <span className="text-[7px] font-black text-status-ongoing">NEW</span>}
                        </div>
                        <span suppressHydrationWarning className="text-[9px] text-on-surface-variant/60 flex-shrink-0">
                            {formatTimeAgo(ep.airDate || anime.lastUpdated) || '—'}
                        </span>
                    </Link>
                )) : (
                    <Link
                        href={`/anime/${anime.slug}`}
                        className="flex justify-between items-center bg-surface-elevated hover:bg-surface-variant border border-border-subtle/40 px-2 py-1.5 rounded-lg transition-colors"
                    >
                        <span className="text-on-surface-variant text-[10px]">Lihat Episode</span>
                        <span suppressHydrationWarning className="text-[9px] text-on-surface-variant/60">{formatTimeAgo(anime.lastUpdated) || '—'}</span>
                    </Link>
                )}
            </div>
        </div>
    );
}

function AnimeListCard({ anime }) {
    const coverImage = anime.coverImage || anime.thumb || '';
    const title = anime.title || '';
    const epList = Array.isArray(anime.episodes) ? anime.episodes.slice(0, 3) : [];

    return (
        <div className="flex gap-4 group bg-surface-elevated/40 hover:bg-surface-elevated/70 border border-border-subtle/40 rounded-xl p-3 transition-colors">
            <Link href={`/anime/${anime.slug}`} className="relative flex-none w-[90px] h-[126px] rounded-lg overflow-hidden border border-border-subtle/30 group/cover">
                {coverImage ? (
                    <Image src={coverImage} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="100px" unoptimized />
                ) : (
                    <div className="w-full h-full bg-surface-container flex items-center justify-center">
                        <span className="text-2xl opacity-20">🎬</span>
                    </div>
                )}
                <div className="absolute top-1.5 left-1.5"><TypeBadge type={anime.type} /></div>
                <div className="absolute bottom-1.5 left-1.5"><StatusBadge status={anime.status} /></div>
            </Link>

            <div className="flex-1 flex flex-col justify-start py-0.5 min-w-0">
                <Link href={`/anime/${anime.slug}`}>
                    <h3 className="font-bold text-on-surface text-[14px] leading-snug mb-1 line-clamp-2 group-hover:text-primary-stitch transition-colors">{title}</h3>
                </Link>
                <div className="flex items-center gap-2 mb-3 text-[10px] text-on-surface-variant">
                    {anime.episode_count > 0 && <span>{anime.episode_count} ep</span>}
                    {anime.rating > 0 && <span className="flex items-center gap-1"><FontAwesomeIcon icon={faStar} className="text-status-pending text-[9px]" /> {Number(anime.rating).toFixed(1)}</span>}
                    {anime.views > 0 && <span className="flex items-center gap-1"><FontAwesomeIcon icon={faEye} className="text-[9px]" /> {(anime.views || 0).toLocaleString()}</span>}
                </div>

                <div className="flex flex-col gap-2">
                    {epList.length > 0 ? epList.map((ep, idx) => (
                        <Link key={idx} href={`/episode/${anime.slug}/${ep.slug || ''}`} className="flex justify-between items-center group/ch">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="text-on-surface-variant text-xs font-semibold group-hover/ch:text-primary-stitch transition-colors truncate max-w-[140px]">{ep.title || `Episode ${idx + 1}`}</span>
                                {idx === 0 && <span className="text-[8px] font-black bg-status-ongoing/20 text-status-ongoing px-1 py-0.5 rounded leading-none">NEW</span>}
                            </div>
                            <span suppressHydrationWarning className="text-[10px] text-on-surface-variant/60 flex-shrink-0">
                                {formatTimeAgo(ep.airDate || anime.lastUpdated) || '—'}
                            </span>
                        </Link>
                    )) : (
                        <Link href={`/anime/${anime.slug}`} className="text-xs text-primary-stitch hover:text-primary-stitch/80 transition-colors">
                            Lihat semua episode →
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Filter Panel ─────────────────────────────────────────────────────────────
const TYPES = [
    { value: '', label: 'Semua Tipe' },
    { value: 'TV', label: 'TV' },
    { value: 'OVA', label: 'OVA' },
    { value: 'Movie', label: 'Movie' },
    { value: 'Special', label: 'Special' },
];

const STATUSES = [
    { value: '', label: 'Semua Status' },
    { value: 'Ongoing', label: 'Ongoing' },
    { value: 'Completed', label: 'Completed' },
];

const ORDERS = [
    { value: 'latest', label: 'Terbaru' },
    { value: 'popular', label: 'Terpopuler' },
    { value: 'az', label: 'A → Z' },
    { value: 'za', label: 'Z → A' },
    { value: 'oldest', label: 'Terlama' },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AnimeBrowseClient({
    initialAnimes = [],
    initialPagination = {},
    initialFilters = {},
    genres = [],
}) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [animes, setAnimes] = useState(initialAnimes);
    const [pagination, setPagination] = useState(initialPagination);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState('grid');
    const [filterOpen, setFilterOpen] = useState(false);

    const [filters, setFilters] = useState({
        type: initialFilters.type || '',
        status: initialFilters.status || '',
        genre: initialFilters.genre || '',
        order: initialFilters.order || 'latest',
        q: initialFilters.q || '',
    });

    const fetchAnimes = useCallback(async (f, page = 1) => {
        setLoading(true);
        try {
            const p = new URLSearchParams();
            if (f.q) p.set('q', f.q);
            if (f.type) p.set('type', f.type);
            if (f.status) p.set('status', f.status);
            if (f.genre) p.set('genre', f.genre);
            if (f.order && f.order !== 'latest') p.set('order', f.order);
            p.set('page', String(page));
            p.set('limit', '24');

            const res = await fetch(`/api/anime-list?${p.toString()}`);
            const json = await res.json();
            if (json.success) {
                setAnimes(json.data || []);
                setPagination(json.pagination || {});
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    // Sync filters from URL & fetch data
    useEffect(() => {
        const newFilters = {
            type: searchParams.get('type') || '',
            status: searchParams.get('status') || '',
            genre: searchParams.get('genre') || '',
            order: searchParams.get('order') || 'latest',
            q: searchParams.get('q') || '',
        };
        const page = Number(searchParams.get('page')) || 1;
        setFilters(newFilters);
        fetchAnimes(newFilters, page);
    }, [searchParams, fetchAnimes]);

    const applyFilters = (newFilters, page = 1) => {
        const p = new URLSearchParams();
        if (newFilters.q) p.set('q', newFilters.q);
        if (newFilters.type) p.set('type', newFilters.type);
        if (newFilters.status) p.set('status', newFilters.status);
        if (newFilters.genre) p.set('genre', newFilters.genre);
        if (newFilters.order && newFilters.order !== 'latest') p.set('order', newFilters.order);
        if (page > 1) p.set('page', String(page));
        router.push(`/anime${p.toString() ? '?' + p.toString() : ''}`);
        setFilterOpen(false);
    };

    const handlePageChange = (newPage) => {
        // Update URL for bookmarkability
        const p = new URLSearchParams();
        if (filters.q) p.set('q', filters.q);
        if (filters.type) p.set('type', filters.type);
        if (filters.status) p.set('status', filters.status);
        if (filters.genre) p.set('genre', filters.genre);
        if (filters.order && filters.order !== 'latest') p.set('order', filters.order);
        if (newPage > 1) p.set('page', String(newPage));
        router.replace(`/anime${p.toString() ? '?' + p.toString() : ''}`, { scroll: false });
        // Directly fetch without waiting for searchParams change
        fetchAnimes(filters, newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const activeCount = [
        filters.type, filters.status, filters.genre,
        filters.order && filters.order !== 'latest' ? filters.order : ''
    ].filter(Boolean).length;

    const currentPage = pagination.currentPage || 1;
    const totalPages = pagination.totalPages || 1;
    const totalItems = pagination.totalItems || animes.length;

    // Label for header
    const headerLabel = filters.q
        ? `Hasil: "${filters.q}"`
        : filters.genre
            ? `Genre: ${filters.genre}`
            : filters.type
                ? filters.type
                : filters.status
                    ? filters.status
                    : 'Semua Anime';

    return (
        <div>
            {/* ── HEADER BAR ── */}
            <div className="bg-surface-elevated border border-border-subtle/50 rounded-xl shadow-sm mb-6">
                <div className="px-4 py-3 flex flex-row items-center gap-4">
                    {/* Title + count */}
                    <div className="flex-1 min-w-0">
                        <h1 className="text-sm md:text-lg font-black text-on-surface tracking-wide uppercase truncate">
                            {headerLabel}
                        </h1>
                        <p className="text-[10px] md:text-xs text-on-surface-variant mt-0.5">
                            {totalItems > 0 ? `${totalItems.toLocaleString()} anime ditemukan` : 'Tidak ada hasil'}
                        </p>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {/* View toggle */}
                        <div className="flex items-center bg-surface-container border border-border-subtle/50 rounded-lg p-1 gap-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`w-7 h-7 md:w-8 md:h-8 rounded-md flex items-center justify-center transition-colors ${viewMode === 'grid' ? 'bg-primary-container text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
                                title="Grid"
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 md:w-4 md:h-4"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`w-7 h-7 md:w-8 md:h-8 rounded-md flex items-center justify-center transition-colors ${viewMode === 'list' ? 'bg-primary-container text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
                                title="List"
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 md:w-4 md:h-4"><rect x="3" y="5" width="18" height="2" rx="1" /><rect x="3" y="11" width="18" height="2" rx="1" /><rect x="3" y="17" width="18" height="2" rx="1" /></svg>
                            </button>
                        </div>

                        {/* Filter button */}
                        <button
                            onClick={() => setFilterOpen(true)}
                            className="relative flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1.5 bg-primary-container hover:brightness-110 rounded-lg text-on-primary text-[11px] md:text-xs font-bold transition-all shadow-sm"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5 md:w-4 md:h-4">
                                <line x1="3" y1="6" x2="21" y2="6" /><line x1="6" y1="12" x2="18" y2="12" /><line x1="9" y1="18" x2="15" y2="18" />
                            </svg>
                            Filter
                            {activeCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-status-pending text-surface-deep text-[9px] font-black flex items-center justify-center shadow">
                                    {activeCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Active filter pills */}
                {activeCount > 0 && (
                    <div className="px-4 pb-3 flex flex-wrap gap-2 border-t border-border-subtle/30 pt-2">
                        {filters.type && (
                            <FilterPill label={`Tipe: ${filters.type}`} onRemove={() => applyFilters({ ...filters, type: '' })} />
                        )}
                        {filters.status && (
                            <FilterPill label={`Status: ${filters.status}`} onRemove={() => applyFilters({ ...filters, status: '' })} />
                        )}
                        {filters.genre && (
                            <FilterPill label={`Genre: ${filters.genre}`} onRemove={() => applyFilters({ ...filters, genre: '' })} />
                        )}
                        {filters.order && filters.order !== 'latest' && (
                            <FilterPill label={`Urut: ${ORDERS.find(o => o.value === filters.order)?.label || filters.order}`} onRemove={() => applyFilters({ ...filters, order: 'latest' })} />
                        )}
                        <button
                            onClick={() => applyFilters({ type: '', status: '', genre: '', order: 'latest', q: filters.q })}
                            className="text-[10px] text-on-surface-variant hover:text-status-expired transition-colors underline"
                        >
                            Hapus semua
                        </button>
                    </div>
                )}
            </div>

            {/* ── ANIME GRID/LIST ── */}
            {loading ? (
                <div className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="flex flex-col">
                            <div className="w-full aspect-[3/4] rounded-xl bg-surface-elevated animate-pulse mb-3" />
                            <div className="h-3 bg-surface-bright/30 rounded animate-pulse mb-2" />
                            <div className="h-7 bg-surface-bright/30 rounded animate-pulse mb-1.5" />
                            <div className="h-7 bg-surface-bright/30 rounded animate-pulse" />
                        </div>
                    ))}
                </div>
            ) : animes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <span className="text-5xl mb-4">😶</span>
                    <p className="text-on-surface-variant font-semibold mb-2">Tidak ada anime ditemukan</p>
                    <p className="text-on-surface-variant/60 text-sm mb-6">Coba ubah filter atau kata kunci pencarian</p>
                    <button
                        onClick={() => applyFilters({ type: '', status: '', genre: '', order: 'latest', q: '' })}
                        className="px-5 py-2 bg-primary-container hover:brightness-110 text-on-primary text-sm font-bold rounded-xl transition-all"
                    >
                        Reset Filter
                    </button>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid gap-x-4 gap-y-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
                    {animes.map((anime) => (
                        <AnimeGridCard key={anime._id || anime.slug} anime={anime} />
                    ))}
                </div>
            ) : (
                <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {animes.map((anime) => (
                        <AnimeListCard key={anime._id || anime.slug} anime={anime} />
                    ))}
                </div>
            )}

            {/* ── PAGINATION ── */}
            {totalPages > 1 && !loading && (
                <div className="flex items-center justify-center gap-1.5 mt-10 flex-wrap">
                    {/* Prev */}
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold transition-all ${currentPage > 1
                            ? 'bg-surface-elevated border-border-subtle/50 text-on-surface hover:border-primary-stitch/50 hover:text-primary-stitch'
                            : 'opacity-30 cursor-not-allowed bg-surface-elevated border-border-subtle/30 text-on-surface-variant'
                            }`}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                        <span className="hidden sm:inline">Prev</span>
                    </button>

                    {/* Page numbers */}
                    <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let p;
                            if (totalPages <= 5) {
                                p = i + 1;
                            } else if (currentPage <= 3) {
                                p = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                                p = totalPages - 4 + i;
                            } else {
                                p = currentPage - 2 + i;
                            }
                            return (
                                <button
                                    key={p}
                                    onClick={() => handlePageChange(p)}
                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${p === currentPage
                                        ? 'bg-primary-container text-on-primary shadow-sm'
                                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-elevated'
                                        }`}
                                >
                                    {p}
                                </button>
                            );
                        })}
                    </div>

                    {/* Next */}
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold transition-all ${currentPage < totalPages
                            ? 'bg-surface-elevated border-border-subtle/50 text-on-surface hover:border-primary-stitch/50 hover:text-primary-stitch'
                            : 'opacity-30 cursor-not-allowed bg-surface-elevated border-border-subtle/30 text-on-surface-variant'
                            }`}
                    >
                        <span className="hidden sm:inline">Next</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </button>
                </div>
            )}

            {/* ── FILTER DRAWER ── */}
            {filterOpen && (
                <FilterDrawer
                    filters={filters}
                    genres={genres}
                    onApply={(newFilters) => applyFilters(newFilters)}
                    onClose={() => setFilterOpen(false)}
                />
            )}
        </div>
    );
}

// ─── Filter Pill ──────────────────────────────────────────────────────────────
function FilterPill({ label, onRemove }) {
    return (
        <span className="flex items-center gap-1.5 bg-primary-container/20 text-primary-stitch text-[11px] font-semibold px-2.5 py-1 rounded-full border border-primary-stitch/30">
            {label}
            <button onClick={onRemove} className="text-primary-stitch/70 hover:text-primary-stitch transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3 h-3">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>
        </span>
    );
}

// ─── Filter Drawer ────────────────────────────────────────────────────────────
function FilterDrawer({ filters, genres, onApply, onClose }) {
    const [local, setLocal] = useState({ ...filters });

    const set = (key, value) => setLocal(prev => ({ ...prev, [key]: value }));

    const ChipBtn = ({ label, isActive, onClick }) => (
        <button
            onClick={onClick}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${isActive
                ? 'bg-pink-600 border-pink-600 text-white'
                : 'bg-transparent border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
                }`}
        >
            {label}
        </button>
    );

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed bottom-0 left-0 right-0 md:right-auto md:top-0 md:w-80 z-50 bg-surface-container border-t md:border-t-0 md:border-r border-border-subtle/50 flex flex-col max-h-[85vh] md:max-h-screen overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle/50 flex-shrink-0 bg-surface-elevated">
                    <h2 className="text-base font-black text-on-surface">Filter Anime</h2>
                    <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
                    {/* Urutan */}
                    <div>
                        <p className="text-[11px] font-black text-on-surface-variant uppercase tracking-widest mb-2">Urutan</p>
                        <div className="flex flex-wrap gap-2">
                            {ORDERS.map(o => (
                                <ChipBtn key={o.value} label={o.label} isActive={local.order === o.value} onClick={() => set('order', o.value)} />
                            ))}
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <p className="text-[11px] font-black text-on-surface-variant uppercase tracking-widest mb-2">Status</p>
                        <div className="flex flex-wrap gap-2">
                            {STATUSES.map(s => (
                                <ChipBtn key={s.value} label={s.label} isActive={local.status === s.value} onClick={() => set('status', s.value)} />
                            ))}
                        </div>
                    </div>

                    {/* Tipe */}
                    <div>
                        <p className="text-[11px] font-black text-on-surface-variant uppercase tracking-widest mb-2">Tipe</p>
                        <div className="flex flex-wrap gap-2">
                            {TYPES.map(t => (
                                <ChipBtn key={t.value} label={t.label} isActive={local.type === t.value} onClick={() => set('type', t.value)} />
                            ))}
                        </div>
                    </div>

                    {/* Genre */}
                    {genres.length > 0 && (
                        <div>
                            <p className="text-[11px] font-black text-on-surface-variant uppercase tracking-widest mb-2">Genre</p>
                            <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                                <ChipBtn label="Semua Genre" isActive={!local.genre} onClick={() => set('genre', '')} />
                                {genres.map(g => {
                                    const name = typeof g === 'string' ? g : g.name || g;
                                    return (
                                        <ChipBtn key={name} label={name} isActive={local.genre === name} onClick={() => set('genre', name)} />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-border-subtle/50 flex gap-3 flex-shrink-0 bg-surface-elevated">
                    <button
                        onClick={() => {
                            const reset = { type: '', status: '', genre: '', order: 'latest', q: local.q };
                            setLocal(reset);
                        }}
                        className="flex-1 py-2.5 rounded-xl border border-border-subtle/50 text-sm font-semibold text-on-surface-variant hover:text-on-surface hover:border-border-subtle transition-colors"
                    >
                        Reset
                    </button>
                    <button
                        onClick={() => onApply(local)}
                        className="flex-1 py-2.5 rounded-xl bg-primary-container hover:brightness-110 text-on-primary text-sm font-bold transition-all shadow-sm"
                    >
                        Terapkan
                    </button>
                </div>
            </div>
        </>
    );
}
