'use client';
import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr; // return raw string if not parseable (e.g. "Oct 30, 2020")
    return d.toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric',
    });
}

export default function EpisodeList({ episodes = [], animeSlug, animeFallbackDate }) {
    const [query, setQuery] = useState('');
    const [sortAsc, setSortAsc] = useState(false);

    const getNum = (ep) =>
        parseInt((ep.title || ep.slug || '').replace(/\D+/g, ''), 10) || 0;

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        let list = episodes;
        if (q) {
            list = episodes.filter(
                (ep) =>
                    ep.title?.toLowerCase().includes(q) ||
                    ep.slug?.toLowerCase().includes(q)
            );
        }
        return [...list].sort((a, b) =>
            sortAsc ? getNum(a) - getNum(b) : getNum(b) - getNum(a)
        );
    }, [episodes, query, sortAsc]);

    const handleSearch = useCallback((e) => {
        setQuery(e.target.value);
    }, []);

    const displayed = filtered;

    return (
        <div>
            {/* Search & Sort Controls */}
            <div className="flex gap-2 mb-4">
                <div className="flex-1 relative">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    <input
                        type="search"
                        placeholder="Cari episode..."
                        value={query}
                        onChange={handleSearch}
                        className="w-full bg-surface-elevated border border-border-subtle/40 rounded-xl px-4 py-3 pl-10 text-[13px] text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-border-subtle transition-colors shadow-inner"
                    />
                    {query && (
                        <button
                            onClick={() => setQuery('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface text-sm"
                            aria-label="Hapus pencarian"
                        >
                            ✕
                        </button>
                    )}
                </div>
                <button
                    onClick={() => setSortAsc(!sortAsc)}
                    className="flex items-center gap-2 px-4 py-3 bg-surface-elevated border border-border-subtle/40 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30 transition-all text-[13px] font-semibold flex-shrink-0"
                    title={sortAsc ? 'Urut Terbaru' : 'Urut Terlama'}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-4 h-4 transition-transform ${sortAsc ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9" /></svg>
                    {sortAsc ? 'Asc' : 'Desc'}
                </button>
            </div>

            {/* Search Results Count */}
            {query && (
                <p className="text-[10px] text-on-surface-variant mb-2">
                    {filtered.length === 0
                        ? 'Episode tidak ditemukan'
                        : `${filtered.length} episode ditemukan`}
                </p>
            )}

            {/* Episode Items */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(51,65,85,0.5) transparent' }}>
                {displayed.length === 0 ? (
                    <p className="text-center text-on-surface-variant text-sm py-8">
                        Tidak ada episode.
                    </p>
                ) : (
                    displayed.map((ep, idx) => (
                        <Link
                            key={ep.slug}
                            href={`/episode/${animeSlug}/${ep.slug}`}
                            className="group flex items-center justify-between px-5 py-4 rounded-xl bg-surface-elevated border border-border-subtle/30 hover:bg-surface-variant/20 hover:border-border-subtle/60 transition-all"
                        >
                            <div className="flex items-center gap-4 min-w-0">
                                <span className="text-[11px] text-on-surface-variant/50 font-mono w-6 text-right flex-shrink-0 font-medium">
                                    {sortAsc ? idx + 1 : filtered.length - idx}
                                </span>
                                <div className="min-w-0">
                                    <p className="text-[15px] font-bold text-on-surface group-hover:text-white transition-colors truncate tracking-wide">
                                        {ep.title}
                                    </p>
                                    {(ep.airDate || animeFallbackDate) && (
                                        <p className="text-[11px] text-on-surface-variant mt-1">{formatDate(ep.airDate || animeFallbackDate)}</p>
                                    )}
                                </div>
                            </div>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-on-surface-variant/40 group-hover:text-on-surface-variant flex-shrink-0 ml-2 transition-colors">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </Link>
                    ))
                )}
            </div>

        </div>
    );
}
