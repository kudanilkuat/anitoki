'use client';
import { useState } from 'react';
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
    // Format: "7 Juli 2026", "10 Oktober 2024", "13 Juli,2026"
    const idMatch = dateParam.match(/^(\d{1,2})\s+(\w+),?\s*(\d{4})$/);
    if (idMatch) {
      const monthIdx = ID_MONTHS[idMatch[2].toLowerCase()];
      if (monthIdx !== undefined) {
        date = new Date(Date.UTC(parseInt(idMatch[3]), monthIdx, parseInt(idMatch[1])));
      }
    }
    // Format: dd/mm/yyyy or dd-mm-yyyy
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
  if (seconds < 0) return 'Just now';
  let interval = seconds / 31536000;
  if (interval >= 1) return Math.floor(interval) + (Math.floor(interval) > 1 ? ' years' : ' year') + ' ago';
  interval = seconds / 2592000;
  if (interval >= 1) return Math.floor(interval) + (Math.floor(interval) > 1 ? ' months' : ' month') + ' ago';
  interval = seconds / 604800;
  if (interval >= 1) return Math.floor(interval) + (Math.floor(interval) > 1 ? ' weeks' : ' week') + ' ago';
  interval = seconds / 86400;
  if (interval >= 1) return Math.floor(interval) + (Math.floor(interval) > 1 ? ' days' : ' day') + ' ago';
  interval = seconds / 3600;
  if (interval >= 1) return Math.floor(interval) + (Math.floor(interval) > 1 ? ' hours' : ' hour') + ' ago';
  interval = seconds / 60;
  if (interval >= 1) return Math.floor(interval) + (Math.floor(interval) > 1 ? ' mins' : ' min') + ' ago';
  return 'Just now';
}

// Badge for anime type
function TypeBadge({ type }) {
  const t = (type || '').toLowerCase();
  const map = {
    hentai: { bg: 'bg-status-expired', label: 'H' },
    ova: { bg: 'bg-purple-600', label: 'OVA' },
    movie: { bg: 'bg-status-pending', label: 'MOV' },
    series: { bg: 'bg-primary-container', label: 'SER' },
    anime: { bg: 'bg-primary-container', label: 'ANI' },
    tv: { bg: 'bg-primary-container', label: 'TV' },
  };
  const style = map[t] || { bg: 'bg-surface-bright', label: type || 'ANI' };
  return (
    <span className={`${style.bg} text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow uppercase`}>
      {style.label}
    </span>
  );
}

// Status badge
function StatusBadge({ status }) {
  const s = (status || '').toLowerCase();
  if (s === 'ongoing') return <span className="text-[8px] font-black text-status-ongoing bg-status-ongoing/10 px-1.5 py-0.5 rounded">ONGOING</span>;
  if (s === 'completed') return <span className="text-[8px] font-black text-on-surface-variant bg-surface-bright/40 px-1.5 py-0.5 rounded">END</span>;
  return null;
}

// Single anime card (grid mode)
function AnimeGridCard({ anime }) {
  const coverImage = anime.coverImage || anime.thumb || '';
  const title = anime.title || '';
  const epList = Array.isArray(anime.episodes) ? anime.episodes.slice(0, 2) : [];

  return (
    <div className="flex flex-col group">
      {/* Cover */}
      <Link href={`/anime/${anime.slug}`} className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border border-border-subtle/30 mb-3 group/cover">
        {coverImage ? (
          <Image src={coverImage} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="200px" unoptimized />
        ) : (
          <div className="w-full h-full bg-surface-elevated" />
        )}
        {/* Site brand watermark */}
        <div className="absolute top-2 right-2 flex items-center bg-primary-container/90 text-on-primary px-1.5 py-0.5 rounded shadow-lg z-10 scale-[0.6] origin-top-right pointer-events-none">
          <span className="font-black italic">{process.env.NEXT_PUBLIC_SITE_BRAND || 'KP'}</span>
          <span className="text-[10px] font-bold ml-1 uppercase">{process.env.NEXT_PUBLIC_SITE_NAME || 'KOMIKPEDIA'}</span>
        </div>
        {/* Type badge */}
        <div className="absolute top-1.5 left-1.5">
          <TypeBadge type={anime.type} />
        </div>
        {/* Status badge bottom */}
        <div className="absolute bottom-1.5 left-1.5">
          <StatusBadge status={anime.status} />
        </div>
      </Link>

      {/* Title */}
      <Link href={`/anime/${anime.slug}`} className="mb-2 mt-1">
        <h3 className="font-bold text-on-surface text-[14px] text-left leading-snug line-clamp-1 group-hover:text-primary-stitch transition-colors">{title}</h3>
      </Link>

      {/* Episode links */}
      <div className="flex flex-col gap-1.5">
        {epList.length > 0 ? epList.map((ep, idx) => (
          <Link
            key={idx}
            href={`/episode/${anime.slug}/${ep.slug || ''}`}
            className="flex justify-between items-center bg-surface-elevated hover:bg-surface-variant/30 border border-border-subtle/30 px-2 py-1.5 rounded transition-colors group/ch"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-on-surface-variant text-[10px] font-semibold group-hover/ch:text-primary-stitch transition-colors truncate max-w-[80px]">{ep.title || `Episode ${idx + 1}`}</span>
              {idx === 0 && <span className="text-[7px] font-black text-status-ongoing">NEW</span>}
            </div>
            <span suppressHydrationWarning className="text-[9px] text-on-surface-variant/60 flex-shrink-0">
              {formatTimeAgo(ep.airDate || anime.lastUpdated || anime.last_update) || '—'}
            </span>
          </Link>
        )) : (
          <Link
            href={`/anime/${anime.slug}`}
            className="flex justify-between items-center bg-surface-elevated hover:bg-surface-variant/30 border border-border-subtle/30 px-2 py-1.5 rounded transition-colors"
          >
            <span className="text-on-surface-variant text-[10px]">Lihat Episode</span>
            <span suppressHydrationWarning className="text-[9px] text-on-surface-variant/60">{formatTimeAgo(anime.lastUpdated) || '—'}</span>
          </Link>
        )}
      </div>
    </div>
  );
}

// Single anime card (list mode)
function AnimeListCard({ anime }) {
  const coverImage = anime.coverImage || anime.thumb || '';
  const title = anime.title || '';
  const epList = Array.isArray(anime.episodes) ? anime.episodes.slice(0, 3) : [];

  return (
    <div className="flex gap-4 group bg-surface-elevated/40 hover:bg-surface-elevated/70 border border-border-subtle/40 rounded-xl p-3 transition-colors">
      {/* Cover */}
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

      {/* Info */}
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
                {formatTimeAgo(ep.airDate || anime.lastUpdated || anime.last_update) || '—'}
              </span>
            </Link>
          )) : (
            <Link href={`/anime/${anime.slug}`} className="text-xs text-primary-stitch hover:brightness-110 transition-colors">
              Lihat semua episode →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────
export default function NewestUpdatesTabs({ recents = [], ongoing = [], completed = [] }) {
  const [activeTab, setActiveTab] = useState('episode-baru');
  const [viewMode, setViewMode] = useState('grid');

  const tabs = [
    { id: 'episode-baru', label: 'Terbaru', data: recents },
    { id: 'ongoing', label: 'Ongoing', data: ongoing },
    { id: 'completed', label: 'Completed', data: completed },
  ];

  const currentData = tabs.find(t => t.id === activeTab)?.data || [];

  return (
    <div className="mb-10">
      {/* Header & Tabs */}
      <div className="flex flex-col border-b border-border-subtle/40 pb-3 mb-6 gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h2 className="text-2xl font-black tracking-wide text-on-surface">
              Anime
            </h2>
            {/* Desktop tabs */}
            <div className="hidden md:flex gap-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`text-base font-bold transition-colors relative pb-0.5 ${activeTab === tab.id ? 'text-on-surface' : 'text-on-surface-variant hover:text-on-surface'}`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <span className="absolute -bottom-[15px] left-0 right-0 h-0.5 bg-primary-stitch" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`w-8 h-8 rounded border flex items-center justify-center transition-colors ${viewMode === 'grid' ? 'bg-surface-container border-border-subtle text-primary-stitch' : 'bg-surface-elevated border-border-subtle/40 text-on-surface-variant hover:text-on-surface'}`}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`w-8 h-8 rounded border flex items-center justify-center transition-colors ${viewMode === 'list' ? 'bg-surface-container border-border-subtle text-primary-stitch' : 'bg-surface-elevated border-border-subtle/40 text-on-surface-variant hover:text-on-surface'}`}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><rect x="3" y="5" width="18" height="2" /><rect x="3" y="11" width="18" height="2" /><rect x="3" y="17" width="18" height="2" /></svg>
            </button>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="flex md:hidden gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-sm font-bold transition-colors whitespace-nowrap ${activeTab === tab.id ? 'text-on-surface border-b-2 border-primary-stitch' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {currentData.length === 0 && (
        <div className="text-center py-16 text-on-surface-variant text-sm">Belum ada data.</div>
      )}

      {/* Grid */}
      {viewMode === 'grid' && currentData.length > 0 && (
        <div className="grid gap-x-4 gap-y-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {currentData.slice(0, activeTab === 'episode-baru' ? 30 : 24).map((anime) => (
            <AnimeGridCard key={anime._id || anime.slug} anime={anime} />
          ))}
        </div>
      )}

      {/* List */}
      {viewMode === 'list' && currentData.length > 0 && (
        <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {currentData.slice(0, activeTab === 'episode-baru' ? 30 : 24).map((anime) => (
            <AnimeListCard key={anime._id || anime.slug} anime={anime} />
          ))}
        </div>
      )}

      {/* See all link */}
      {currentData.length > 0 && (
        <div className="mt-8 text-center">
          <Link
            href={activeTab === 'ongoing' ? '/anime?status=Ongoing' : activeTab === 'completed' ? '/anime?status=Completed' : '/anime?order=latest'}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-border-subtle text-sm font-semibold text-on-surface-variant hover:text-on-surface hover:border-primary-stitch/50 transition-colors"
          >
            Lihat Semua {tabs.find(t => t.id === activeTab)?.label}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </Link>
        </div>
      )}
    </div>
  );
}
