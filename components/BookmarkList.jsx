'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  getUserBookmarks,
  removeBookmark,
  updateWatchStatus,
  calcBookmarkStats,
  WATCH_STATUS,
} from '@/lib/bookmarks';
import Navbar from '@/components/Navbar';

const TABS = [
  { key: 'all', label: 'Semua' },
  { key: WATCH_STATUS.WATCHING, label: 'Ditonton' },
  { key: WATCH_STATUS.TO_WATCH, label: 'Mau Nonton' },
  { key: WATCH_STATUS.FINISHED, label: 'Selesai' },
  { key: WATCH_STATUS.DROPPED, label: 'Dihentikan' },
];

const STATUS_OPTIONS = [
  { key: WATCH_STATUS.WATCHING, label: 'Sedang Ditonton' },
  { key: WATCH_STATUS.TO_WATCH, label: 'Mau Nonton' },
  { key: WATCH_STATUS.FINISHED, label: 'Selesai' },
  { key: WATCH_STATUS.DROPPED, label: 'Dihentikan' },
];

export default function BookmarkList() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [statusMenu, setStatusMenu] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/login'); return; }
    fetchBookmarks();
  }, [user, authLoading]);

  const fetchBookmarks = async () => {
    setLoading(true);
    try {
      const data = await getUserBookmarks(user.uid);
      setBookmarks(data);
    } catch (err) {
      console.error('[BookmarkList] fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (animeSlug) => {
    setRemoving(animeSlug);
    try {
      await removeBookmark(user.uid, animeSlug);
      setBookmarks(prev => prev.filter(b => b.slug !== animeSlug));
    } catch (err) {
      console.error('[BookmarkList] remove error:', err);
    } finally {
      setRemoving(null);
    }
  };

  const handleStatusChange = async (animeSlug, newStatus) => {
    setStatusMenu(null);
    try {
      await updateWatchStatus(user.uid, animeSlug, newStatus);
      setBookmarks(prev =>
        prev.map(b => b.slug === animeSlug ? { ...b, watchStatus: newStatus } : b)
      );
    } catch (err) {
      console.error('[BookmarkList] update status error:', err);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-surface-deep flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary-container/30 border-t-primary-container rounded-full animate-spin" />
      </div>
    );
  }

  const stats = calcBookmarkStats(bookmarks);
  const filtered = activeTab === 'all'
    ? bookmarks
    : bookmarks.filter(b => (b.watchStatus || WATCH_STATUS.WATCHING) === activeTab);

  const tabCount = (key) => {
    if (key === 'all') return bookmarks.length;
    return bookmarks.filter(b => (b.watchStatus || WATCH_STATUS.WATCHING) === key).length;
  };

  return (
    <div className="min-h-screen bg-surface-deep">
      <Navbar />
      <main className="pt-24 pb-safe max-w-6xl mx-auto px-4 md:px-6">

        {/* HERO BANNER */}
        <div className="py-4 md:py-6 mb-6 relative rounded-2xl overflow-hidden border border-border-subtle/30 bg-surface-elevated shadow-xl flex flex-col gap-4">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-container/10 via-primary-stitch/5 to-transparent pointer-events-none" />

          <div className="relative z-10 px-4 md:px-6 w-full flex flex-col md:flex-row md:items-end justify-between gap-3">
            <div>
              <h1 className="text-lg md:text-xl font-black text-on-surface tracking-wide uppercase truncate">
                BOOKMARK
              </h1>
              <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-1 text-[10px] md:text-xs">
                <span className="text-on-surface-variant">{bookmarks.length} anime tersimpan &bull;</span>
                <span className="text-primary-stitch font-bold">{stats.watching} <span className="text-on-surface-variant font-normal">ditonton</span></span>
                <span className="text-primary-stitch font-bold">{stats.toWatch} <span className="text-on-surface-variant font-normal">mau nonton</span></span>
                <span className="text-status-ongoing font-bold">{stats.finished} <span className="text-on-surface-variant font-normal">selesai</span></span>
                <span className="text-on-surface-variant font-bold">{stats.dropped} <span className="text-on-surface-variant font-normal">dihentikan</span></span>
              </div>
            </div>
          </div>

          <div className="relative z-10 px-4 md:px-6 w-full overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 min-w-max pb-2">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] md:text-xs font-bold transition-all duration-200 ${activeTab === tab.key
                    ? 'bg-primary-container text-on-primary shadow-lg shadow-primary-container/30'
                    : 'bg-surface-container border border-border-subtle text-on-surface-variant hover:border-primary-stitch/40 hover:text-on-surface'
                    }`}
                >
                  {tab.label}
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold transition-colors ${activeTab === tab.key ? 'bg-white/20 text-on-primary' : 'bg-surface-deep text-on-surface-variant'
                    }`}>
                    {tabCount(tab.key)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center px-4">
            <div className="w-16 h-16 bg-surface-elevated rounded-full flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-on-surface-variant">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
            </div>
            <p className="font-display text-xl text-on-surface-variant tracking-wider">BELUM ADA BOOKMARK</p>
            <p className="text-on-surface-variant text-sm">Tap tombol &quot;Simpan&quot; di halaman detail anime untuk menyimpannya di sini.</p>
            <Link href="/anime" className="mt-2 px-6 py-3 bg-primary-container text-on-primary font-bold rounded-xl text-sm hover:brightness-110 transition-colors">
              Jelajahi Anime
            </Link>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((b) => {
              const statusOpt = STATUS_OPTIONS.find(o => o.key === (b.watchStatus || WATCH_STATUS.WATCHING));
              return (
                <div
                  key={b.slug}
                  className="flex gap-3 bg-surface-elevated border border-border-subtle/30 rounded-2xl p-3 hover:border-primary-stitch/40 transition-colors"
                >
                  <Link href={`/anime/${b.slug}`} className="flex-none">
                    <div className="rounded-xl overflow-hidden bg-surface-container w-[72px] h-[100px] sm:w-[84px] sm:h-[118px] relative shadow-md">
                      {b.coverImage ? (
                        <img src={b.coverImage} alt={b.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-surface-container flex items-center justify-center">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-on-surface-variant">
                            <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M8 7h8M8 12h8M8 17h5" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <Link href={`/anime/${b.slug}`}>
                        <h3 className="font-bold text-on-surface text-sm line-clamp-2 leading-tight hover:text-primary-stitch transition-colors">
                          {b.title}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {b.type && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border bg-primary-container/20 border-primary-stitch/30 text-primary-stitch">
                            {b.type}
                          </span>
                        )}
                        {b.status && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${b.status?.toLowerCase() === 'ongoing'
                            ? 'bg-status-ongoing/10 border-status-ongoing/30 text-status-ongoing'
                            : 'bg-surface-container border-border-subtle text-on-surface-variant'
                            }`}>{b.status}</span>
                        )}
                        {statusOpt && (
                          <span className="text-[10px] font-semibold text-on-surface-variant">
                            {statusOpt.label}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="min-w-0">
                        {b.lastEpisode && (
                          <p className="text-on-surface-variant text-[11px] truncate">{b.lastEpisode}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2 relative">

                        {/* Status dropdown */}
                        <button
                          onClick={() => setStatusMenu(statusMenu === b.slug ? null : b.slug)}
                          className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-border-subtle text-on-surface-variant hover:border-primary-stitch/40 hover:text-on-surface transition-colors flex items-center gap-1"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`w-2.5 h-2.5 transition-transform ${statusMenu === b.slug ? 'rotate-180' : ''}`}>
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>

                        {statusMenu === b.slug && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setStatusMenu(null)} />
                            <div className="absolute right-0 bottom-full mb-1 z-50 w-40 bg-surface-elevated border border-border-subtle rounded-xl shadow-2xl shadow-black/60 overflow-hidden animate-slide-up">
                              {STATUS_OPTIONS.map(opt => (
                                <button
                                  key={opt.key}
                                  onClick={() => handleStatusChange(b.slug, opt.key)}
                                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold hover:bg-surface-container transition-colors ${(b.watchStatus || WATCH_STATUS.WATCHING) === opt.key ? 'text-primary-stitch' : 'text-on-surface-variant'
                                    }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </>
                        )}

                        {/* Episode link */}
                        {b.lastEpisodeSlug && (
                          <Link
                            href={`/episode/${b.slug}/${b.lastEpisodeSlug}`}
                            className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-primary-container text-on-primary hover:brightness-110 transition-colors"
                          >
                            Tonton
                          </Link>
                        )}

                        {/* Remove button */}
                        <button
                          onClick={() => handleRemove(b.slug)}
                          disabled={removing === b.slug}
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-border-subtle text-on-surface-variant hover:border-status-expired hover:text-status-expired transition-colors disabled:opacity-40"
                          aria-label="Hapus bookmark"
                        >
                          {removing === b.slug ? (
                            <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                              <path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="h-6" />
      </main>
    </div>
  );
}
