'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faTimes, faUndoAlt, faSearch } from '@fortawesome/free-solid-svg-icons';

const TYPES = [
    { value: '', label: 'All Types' },
    { value: 'TV', label: 'TV' },
    { value: 'Movie', label: 'Movie' },
    { value: 'OVA', label: 'OVA' },
    { value: 'ONA', label: 'ONA' },
    { value: 'Special', label: 'Special' },
];

const STATUSES = [
    { value: '', label: 'All Statuses' },
    { value: 'Ongoing', label: 'Ongoing' },
    { value: 'Completed', label: 'Completed' },
];

const ORDERS = [
    { value: 'latest', label: 'Terbaru' },
    { value: 'popular', label: 'Populer' },
    { value: 'az', label: 'A-Z' },
    { value: 'za', label: 'Z-A' },
];

export default function AdvanceSearch({ onClose }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [localFilter, setLocalFilter] = useState({
        type: searchParams.get('type') || '',
        status: searchParams.get('status') || '',
        genre: searchParams.get('genre') || '',
        order: searchParams.get('order') || 'latest',
    });

    const [genres, setGenres] = useState([]);

    useEffect(() => {
        fetch('/api/genres')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const genresData = Array.isArray(data.data) ? data.data : data.data?.genres || [];
                    setGenres(genresData);
                }
            })
            .catch(err => console.error('Gagal fetch genres:', err));
    }, []);

    const handleSelect = (key, value) => {
        setLocalFilter(prev => ({ ...prev, [key]: value }));
    };

    const applyFilter = () => {
        const p = new URLSearchParams();
        if (localFilter.type) p.set('type', localFilter.type);
        if (localFilter.status) p.set('status', localFilter.status);
        if (localFilter.genre) p.set('genre', localFilter.genre);
        if (localFilter.order) p.set('order', localFilter.order);
        router.push(`/anime?${p.toString()}`);
        if (onClose) onClose();
    };

    const clearFilter = () => {
        setLocalFilter({ type: '', status: '', genre: '', order: 'latest' });
    };

    const selectClass = "w-full bg-surface-container border border-border-subtle rounded-lg py-2 px-3 text-xs text-on-surface appearance-none focus:outline-none focus:border-primary-stitch transition-colors cursor-pointer";
    const chevron = (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M6 9l6 6 6-6" /></svg>
        </div>
    );

    return (
        <div className="w-full bg-surface-elevated border-b border-border-subtle shadow-xl">
            <div className="max-w-[1200px] mx-auto px-4 py-4 md:px-6">
                <div className="flex items-center justify-between mb-4 border-b border-border-subtle/40 pb-2">
                    <h2 className="flex items-center gap-2 text-sm font-bold text-on-surface uppercase tracking-wider">
                        <span className="w-6 h-6 rounded-full bg-primary-container/20 flex items-center justify-center text-primary-stitch">
                            <FontAwesomeIcon icon={faFilter} className="text-[12px]" />
                        </span>
                        ADVANCE <span className="text-primary-stitch">SEARCH</span>
                    </h2>
                    {onClose && (
                        <button onClick={onClose} className="text-[10px] font-bold text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1 uppercase tracking-widest">
                            CLOSE <FontAwesomeIcon icon={faTimes} className="ml-1 text-[14px]" />
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4">
                    {/* Genre */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">Genre</label>
                        <div className="relative">
                            <select value={localFilter.genre} onChange={e => handleSelect('genre', e.target.value)} className={selectClass}>
                                <option value="">All Genres</option>
                                {genres.map(g => (
                                    <option key={g.name} value={g.name}>{g.name}</option>
                                ))}
                            </select>
                            {chevron}
                        </div>
                    </div>

                    {/* Status */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">Status</label>
                        <div className="relative">
                            <select value={localFilter.status} onChange={e => handleSelect('status', e.target.value)} className={selectClass}>
                                {STATUSES.map(s => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                            {chevron}
                        </div>
                    </div>

                    {/* Type */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">Type</label>
                        <div className="relative">
                            <select value={localFilter.type} onChange={e => handleSelect('type', e.target.value)} className={selectClass}>
                                {TYPES.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                            {chevron}
                        </div>
                    </div>

                    {/* Sort */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">Sort By</label>
                        <div className="relative">
                            <select value={localFilter.order} onChange={e => handleSelect('order', e.target.value)} className={selectClass}>
                                {ORDERS.map(o => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                            {chevron}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <button
                        onClick={clearFilter}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-container border border-border-subtle text-xs font-bold text-on-surface-variant hover:text-on-surface hover:border-border-subtle transition-colors"
                    >
                        <FontAwesomeIcon icon={faUndoAlt} className="text-[14px]" /> RESET
                    </button>
                    <button
                        onClick={applyFilter}
                        className="flex items-center gap-1.5 px-6 py-2 rounded-lg bg-primary-container text-on-primary text-xs font-bold hover:brightness-110 shadow-md shadow-primary-container/20 transition-all hover:scale-105"
                    >
                        <FontAwesomeIcon icon={faSearch} className="text-[14px]" /> Apply Filter
                    </button>
                </div>
            </div>
        </div>
    );
}
