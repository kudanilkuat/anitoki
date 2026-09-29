'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { getUserHistory, removeFromHistory, clearHistory } from '@/lib/api';
import Navbar from '@/components/Navbar';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'Baru saja';
  if (m < 60) return `${m} menit lalu`;
  if (h < 24) return `${h} jam lalu`;
  if (d < 30) return `${d} hari lalu`;
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function typeBadgeClass(type) {
  const t = type?.toLowerCase();
  if (t === 'movie') return 'bg-status-pending/20 border-status-pending/40 text-status-pending';
  if (t === 'ova') return 'bg-purple-900/50 border-purple-700 text-purple-300';
  if (t === 'ona') return 'bg-primary-container/20 border-primary-stitch/30 text-primary-stitch';
  if (t === 'special') return 'bg-status-ongoing/10 border-status-ongoing/30 text-status-ongoing';
  return 'bg-primary-container/20 border-primary-stitch/30 text-primary-stitch';
}

function HistorySkeleton() {
  return (
    <div className="space-y-3 px-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex gap-3 bg-surface-elevated border border-border-subtle/30 rounded-2xl p-3 animate-pulse">
          <div className="flex-none w-16 h-22 rounded-xl bg-surface-container" style={{ height: 88 }} />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-3 bg-surface-container rounded w-3/4" />
            <div className="h-2.5 bg-surface-container rounded w-1/2" />
            <div className="h-2 bg-surface-container rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-surface-elevated border border-border-subtle rounded-2xl p-5 animate-slide-up">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-red-400">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-on-surface text-base">Hapus Riwayat?</h3>
            <p className="text-on-surface-variant text-xs mt-0.5">{message}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-border-subtle text-on-surface-variant text-sm font-semibold hover:border-status-expired/50 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors"
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

function HistoryItem({ item, onRemove, removing }) {
  const coverImage = item.thumb || '';

  return (
    <div className="flex gap-3 bg-surface-elevated border border-border-subtle/30 rounded-2xl p-3 hover:border-primary-stitch/30 transition-colors group">
      <Link href={`/anime/${item.slug}`} className="flex-none">
        <div className="relative rounded-xl overflow-hidden bg-surface-container" style={{ width: 64, height: 88 }}>
          {coverImage ? (
            <Image
              src={coverImage}
              alt={item.title || ''}
              fill
              className="object-cover"
              sizes="64px"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-on-surface-variant">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M8 7h8M8 12h8M8 17h5" />
              </svg>
            </div>
          )}
        </div>
      </Link>

      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          <Link href={`/anime/${item.slug}`}>
            <h3 className="font-bold text-on-surface text-sm line-clamp-2 leading-tight hover:text-primary-stitch transition-colors">
              {item.title}
            </h3>
          </Link>

          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {item.type && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase border ${typeBadgeClass(item.type)}`}>
                {item.type}
              </span>
            )}
            {item.lastChapterTitle && (
              <span className="text-on-surface-variant text-[10px] truncate max-w-[140px]">
                {item.lastChapterTitle}
              </span>
            )}
          </div>

          <p className="text-on-surface-variant text-[10px] mt-1 flex items-center gap-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3 flex-shrink-0">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {timeAgo(item.lastRead)}
          </p>
        </div>

        <div className="flex items-center gap-2 mt-2">
          {item.lastChapterSlug && (
            <Link
              href={`/episode/${item.slug}/${item.lastChapterSlug}`}
              className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-primary-container text-on-primary hover:brightness-110 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Lanjut Nonton
            </Link>
          )}
          <Link
            href={`/anime/${item.slug}`}
            className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-border-subtle text-on-surface-variant hover:border-primary-stitch/40 hover:text-on-surface transition-colors"
          >
            Detail
          </Link>

          <button
            onClick={() => onRemove(item.slug)}
            disabled={removing === item.slug}
            aria-label="Hapus dari riwayat"
            className="ml-auto w-7 h-7 flex items-center justify-center rounded-lg border border-border-subtle text-on-surface-variant hover:border-status-expired hover:text-status-expired transition-colors disabled:opacity-40"
          >
            {removing === item.slug ? (
              <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HistoryList() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);
  const [clearingAll, setClearingAll] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/login'); return; }
    fetchHistory();
  }, [user, authLoading]);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUserHistory(user.uid);
      const raw = Array.isArray(res.data) ? res.data : [];

      const seen = new Map();
      for (const item of raw) {
        const key = item.slug;
        if (!key) continue;
        const existing = seen.get(key);
        if (!existing) {
          seen.set(key, item);
        } else {
          const existingTime = existing.lastRead ? new Date(existing.lastRead).getTime() : 0;
          const itemTime = item.lastRead ? new Date(item.lastRead).getTime() : 0;
          if (itemTime > existingTime) seen.set(key, item);
        }
      }

      const deduped = [...seen.values()].sort((a, b) => {
        const ta = a.lastRead ? new Date(a.lastRead).getTime() : 0;
        const tb = b.lastRead ? new Date(b.lastRead).getTime() : 0;
        return tb - ta;
      });

      setHistory(deduped);
    } catch (err) {
      console.error('[History] fetch error:', err);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  const handleRemove = async (slug) => {
    setRemoving(slug);
    try {
      await removeFromHistory(user.uid, slug);
      setHistory(prev => prev.filter(h => h.slug !== slug));
    } catch (err) {
      console.error('[History] remove error:', err);
    } finally {
      setRemoving(null);
    }
  };

  const handleClearAll = async () => {
    setConfirm(null);
    setClearingAll(true);
    try {
      await clearHistory(user.uid);
      setHistory([]);
    } catch (err) {
      console.error('[History] clear error:', err);
    } finally {
      setClearingAll(false);
    }
  };

  const filtered = search.trim()
    ? history.filter(h =>
      h.title?.toLowerCase().includes(search.toLowerCase()) ||
      h.lastChapterTitle?.toLowerCase().includes(search.toLowerCase())
    )
    : history;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-surface-deep">
        <Navbar />
        <main className="pt-24 pb-safe max-w-6xl mx-auto px-4 md:px-6">
          <div className="py-4 md:py-6 mb-6 relative rounded-2xl overflow-hidden border border-border-subtle/30 bg-surface-elevated shadow-2xl shadow-black/20 flex flex-col gap-4">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-container/10 via-primary-stitch/5 to-transparent pointer-events-none" />
            <div className="relative z-10 px-4 md:px-8 flex items-center gap-4">
              <div className="h-6 w-32 bg-surface-container rounded animate-pulse" />
              <div className="h-6 w-20 bg-surface-container rounded animate-pulse" />
            </div>
          </div>
          <HistorySkeleton />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-deep">
      <Navbar />

      {confirm?.type === 'all' && (
        <ConfirmDialog
          message="Semua riwayat tonton akan dihapus permanen."
          onConfirm={handleClearAll}
          onCancel={() => setConfirm(null)}
        />
      )}

      <main className="pt-24 pb-safe max-w-6xl mx-auto px-4 md:px-6">

        {/* HERO BANNER */}
        <div className="py-4 md:py-6 mb-6 relative rounded-2xl overflow-hidden border border-border-subtle/30 bg-surface-elevated shadow-2xl shadow-black/20 flex flex-col gap-4">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-container/10 via-primary-stitch/5 to-transparent pointer-events-none" />

          <div className="relative z-10 px-4 md:px-8 w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-row items-center gap-4">
              <h1 className="font-display text-lg md:text-xl text-on-surface tracking-widest leading-tight uppercase shrink-0">
                RIWAYAT
              </h1>
              <span className="text-on-surface-variant text-xs font-medium px-2 py-1 bg-surface-container rounded-lg whitespace-nowrap">
                {history.length} ditonton
              </span>
            </div>

            <div className="flex flex-row items-center gap-2 w-full md:w-auto">
              {history.length > 3 && (
                <div className="flex items-center gap-2 bg-surface-container border border-border-subtle rounded-lg px-3 py-1.5 w-full md:w-48 focus-within:border-primary-stitch/50 transition-colors">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-on-surface-variant flex-shrink-0">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Cari..."
                    className="flex-1 bg-transparent text-on-surface text-xs placeholder-on-surface-variant outline-none w-full"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="text-on-surface-variant hover:text-on-surface">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>
              )}

              {history.length > 0 && (
                <button
                  onClick={() => setConfirm({ type: 'all' })}
                  disabled={clearingAll}
                  className="flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-40 whitespace-nowrap shrink-0"
                >
                  {clearingAll ? (
                    <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                    </svg>
                  )}
                  <span className="hidden sm:inline">Hapus Semua</span>
                  <span className="inline sm:hidden">Hapus</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {history.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center px-4">
            <div className="w-16 h-16 bg-surface-elevated rounded-full flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-on-surface-variant">
                <circle cx="12" cy="12" r="10" />
                <polygon points="10 8 16 12 10 16 10 8" />
              </svg>
            </div>
            <p className="font-display text-xl text-on-surface-variant tracking-wider">BELUM ADA RIWAYAT</p>
            <p className="text-on-surface-variant text-sm max-w-xs">
              Mulai nonton anime, riwayatmu akan muncul di sini secara otomatis.
            </p>
            <Link
              href="/anime"
              className="mt-2 px-6 py-3 bg-primary-container text-on-primary font-bold rounded-xl text-sm hover:brightness-110 transition-colors"
            >
              Jelajahi Anime
            </Link>
          </div>
        )}

        {history.length > 0 && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
            <div className="w-12 h-12 bg-surface-elevated rounded-full flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-on-surface-variant">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <p className="text-on-surface font-semibold">Tidak ditemukan</p>
            <p className="text-on-surface-variant text-sm">Coba kata kunci lain.</p>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map(item => (
              <HistoryItem
                key={item.slug}
                item={item}
                onRemove={handleRemove}
                removing={removing}
              />
            ))}
          </div>
        )}

        <div className="h-6" />
      </main>
    </div>
  );
}
