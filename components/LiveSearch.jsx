'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const DEBOUNCE_MS = 350;
const MAX_RESULTS = 8;

export default function LiveSearch({ onClose }) {
  const router = useRouter();
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [showEmpty, setShowEmpty] = useState(false);
  const timerRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setShowEmpty(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    setShowEmpty(false);
    clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      try {
        const res = await fetch(
          `/api/anime-list?q=${encodeURIComponent(q)}&page=1&limit=${MAX_RESULTS}`,
          { signal: abortRef.current.signal }
        );
        const json = await res.json();
        const items = Array.isArray(json?.data) ? json.data : [];
        setResults(items.slice(0, MAX_RESULTS));
        setShowEmpty(items.length === 0);
        setActiveIdx(-1);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setResults([]);
          setShowEmpty(true);
        }
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timerRef.current);
  }, [query]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      if (activeIdx >= 0 && results[activeIdx]) {
        router.push(`/anime/${results[activeIdx].slug}`);
        onClose();
      } else if (query.trim()) {
        router.push(`/anime?q=${encodeURIComponent(query.trim())}`);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [results, activeIdx, query, router, onClose]);

  useEffect(() => {
    if (activeIdx >= 0 && listRef.current) {
      const el = listRef.current.children[activeIdx];
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIdx]);

  const typeColor = (type) => {
    const t = (type || '').toLowerCase();
    if (t === 'movie') return 'bg-status-pending/20 text-status-pending';
    if (t === 'ova') return 'bg-purple-900/60 text-purple-300';
    if (t === 'ona') return 'bg-primary-container/20 text-primary-stitch';
    if (t === 'special') return 'bg-status-ongoing/10 text-status-ongoing';
    return 'bg-primary-container/20 text-primary-stitch';
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-start justify-center pt-16 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'slideDown 0.18s ease' }}
      >
        { }
        <div className="flex items-center gap-3 bg-surface-elevated border border-border-subtle rounded-2xl px-4 py-3 shadow-2xl shadow-black/60">
          {loading ? (
            <div className="w-5 h-5 border-2 border-primary-container border-t-transparent rounded-full animate-spin flex-shrink-0" />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-on-surface-variant flex-shrink-0">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          )}
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Cari judul anime..."
            className="flex-1 bg-transparent text-on-surface placeholder-on-surface-variant outline-none text-base"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus(); }}
              className="text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        { }
        {(results.length > 0 || showEmpty) && (
          <div className="mt-2 bg-surface-elevated border border-border-subtle rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
            {results.length > 0 ? (
              <>
                <div ref={listRef} className="max-h-[55vh] overflow-y-auto divide-y divide-border-subtle/30">
                  {results.map((item, idx) => (
                    <Link
                      key={item.slug}
                      href={`/anime/${item.slug}`}
                      onClick={onClose}
                      className={`flex items-center gap-3 px-3 py-2.5 transition-colors ${idx === activeIdx ? 'bg-primary-container/10' : 'hover:bg-surface-container'
                        }`}
                    >
                      { }
                      <div className="w-9 h-12 rounded-lg overflow-hidden bg-surface-container flex-shrink-0 border border-border-subtle/40">
                        {item.coverImage ? (
                          <img
                            src={item.coverImage}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full bg-surface-container" />
                        )}
                      </div>

                      { }
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${idx === activeIdx ? 'text-primary-stitch' : 'text-on-surface'}`}>
                          {item.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {item.type && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${typeColor(item.type)}`}>
                              {item.type}
                            </span>
                          )}
                          {(item.last_episode || item.last_chapter) && (
                            <span className="text-[10px] text-on-surface-variant truncate">{item.last_episode || item.last_chapter}</span>
                          )}
                          {item.status && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-auto ${item.status.toLowerCase() === 'ongoing'
                              ? 'bg-status-ongoing/10 text-status-ongoing'
                              : 'bg-surface-container text-on-surface-variant'
                              }`}>
                              {item.status}
                            </span>
                          )}
                        </div>
                      </div>

                      { }
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-4 h-4 flex-shrink-0 ${idx === activeIdx ? 'text-primary-stitch' : 'text-on-surface-variant'}`}>
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </Link>
                  ))}
                </div>

                { }
                <button
                  onClick={() => { router.push(`/anime?q=${encodeURIComponent(query.trim())}`); onClose(); }}
                  className="w-full flex items-center justify-center gap-2 py-3 text-xs text-on-surface-variant font-semibold border-t border-border-subtle hover:bg-surface-container hover:text-primary-stitch transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  Lihat semua hasil untuk &ldquo;{query}&rdquo;
                </button>
              </>
            ) : (
              <div className="py-10 flex flex-col items-center gap-2 text-on-surface-variant">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 opacity-40">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <p className="text-sm font-semibold">Tidak ada hasil untuk &ldquo;{query}&rdquo;</p>
                <p className="text-xs">Coba kata kunci lain</p>
              </div>
            )}
          </div>
        )}

        { }
        {!query && (
          <p className="text-on-surface-variant text-xs text-center mt-3">
            Ketik untuk mencari · <kbd className="bg-surface-container border border-border-subtle rounded px-1.5 py-0.5 text-[10px]">↑↓</kbd> navigasi · <kbd className="bg-surface-container border border-border-subtle rounded px-1.5 py-0.5 text-[10px]">Esc</kbd> tutup
          </p>
        )}
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
