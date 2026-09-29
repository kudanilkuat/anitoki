'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  toggleBookmark,
  updateWatchStatus,
  getBookmarkData,
  WATCH_STATUS,
} from '@/lib/bookmarks';
import { trackBookmarkAdd, trackBookmarkRemove } from '@/lib/analytics';

const STATUS_OPTIONS = [
  { key: WATCH_STATUS.WATCHING, label: 'Sedang Ditonton', color: 'text-pink-400' },
  { key: WATCH_STATUS.TO_WATCH, label: 'Mau Nonton', color: 'text-gray-200' },
  { key: WATCH_STATUS.FINISHED, label: 'Selesai', color: 'text-gray-200' },
  { key: WATCH_STATUS.DROPPED, label: 'Dihentikan', color: 'text-gray-200' },
];

export default function BookmarkButton({ anime }) {
  const { user } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [checked, setChecked] = useState(false);
  const [watchStatus, setWatchStatus] = useState(WATCH_STATUS.WATCHING);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!user || !anime?.slug) { setChecked(true); return; }
    let cancelled = false;
    getBookmarkData(user.uid, anime.slug)
      .then((data) => {
        if (!cancelled) {
          setSaved(!!data);
          if (data?.watchStatus) setWatchStatus(data.watchStatus);
          else if (data?.readingStatus) setWatchStatus(data.readingStatus);
          setChecked(true);
        }
      })
      .catch(() => { if (!cancelled) setChecked(true); });
    return () => { cancelled = true; };
  }, [user, anime?.slug]);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleToggle = async () => {
    if (!user) { router.push('/login'); return; }
    setLoading(true);
    try {
      const nowSaved = await toggleBookmark(user.uid, {
        slug: anime.slug,
        title: anime.title,
        coverImage: anime.coverImage || anime.thumb || '',
        type: anime.type || '',
        status: anime.status || '',
        rating: anime.rating || 0,
        lastEpisodeTitle: anime.episodes?.[0]?.title || '',
        lastEpisodeSlug: anime.episodes?.[0]?.slug || '',
      }, watchStatus);

      setSaved(nowSaved);
      if (nowSaved) {
        trackBookmarkAdd(anime);
        setPulse(true);
        setTimeout(() => setPulse(false), 600);
      } else {
        trackBookmarkRemove(anime.slug);
      }
    } catch (err) {
      console.error('[Bookmark] Toggle gagal:', err.message);
      alert(err.message || 'Gagal menyimpan bookmark. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setDropdownOpen(false);
    if (!user) return;
    setWatchStatus(newStatus);
    if (saved) {
      try {
        await updateWatchStatus(user.uid, anime.slug, newStatus);
      } catch (err) {
        console.error('[Bookmark] Update status gagal:', err.message);
      }
    }
  };

  if (!checked && user) {
    return <div className="h-12 w-40 rounded-xl bg-bg-elevated border border-border animate-pulse" />;
  }

  const currentOption = STATUS_OPTIONS.find(o => o.key === watchStatus) || STATUS_OPTIONS[0];

  return (
    <div className="flex items-stretch gap-0" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        disabled={loading}
        aria-label={saved ? 'Hapus bookmark' : 'Tambah bookmark'}
        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-l-xl border-y border-l font-bold text-[13px] transition-all duration-300 disabled:opacity-50 select-none flex-1 ${saved
          ? 'bg-pink-600/15 border-pink-500 text-pink-400'
          : 'bg-white/5 border-white/10 text-gray-300 hover:border-pink-500 hover:text-pink-400'
          } ${pulse ? 'scale-105' : 'scale-100'}`}
      >
        {loading ? 'Menyimpan...' : saved ? currentOption.label : 'Simpan'}
      </button>

      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className={`h-full px-3 rounded-r-xl border flex items-center justify-center transition-colors ${saved
            ? 'border-pink-500 bg-pink-600/15 text-pink-400 hover:bg-pink-600/25'
            : 'border-white/10 bg-white/5 text-gray-500 hover:border-pink-500 hover:text-pink-400'
            }`}
          aria-label="Pilih status tonton"
        >
          <span className={`text-[9px] transition-transform duration-200 inline-block ${dropdownOpen ? 'rotate-180' : ''}`}>
            ▲
          </span>
        </button>

        {dropdownOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
            <div className="absolute left-0 bottom-full mb-1.5 z-50 w-48 bg-[#16151d] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden animate-slide-up">
              <p className="px-3 py-2 text-[10px] text-gray-500 font-bold uppercase tracking-wider border-b border-white/5">
                {saved ? 'Status Tonton' : 'Simpan Sebagai'}
              </p>
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => {
                    handleStatusChange(opt.key);
                    if (!saved) setDropdownOpen(false);
                  }}
                  className={`w-full flex text-left items-center justify-between px-3 py-2.5 text-[13px] font-bold transition-colors hover:bg-white/5 ${watchStatus === opt.key ? opt.color : 'text-gray-400'
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
