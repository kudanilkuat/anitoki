'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getUsers } from '@/lib/api';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';

function MemberBadge({ isAdmin, isPremium }) {
  if (isAdmin) return (
    <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400">
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
      </svg>
      ADMIN
    </span>
  );
  if (isPremium) return (
    <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-400">
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
      PREMIUM
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-bg-elevated border border-border text-text-muted">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-2.5 h-2.5">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
      MEMBER
    </span>
  );
}

function UserCard({ user }) {
  const name     = user.displayName || 'Pengguna';
  const initials = name.slice(0, 2).toUpperCase();
  const handle   = `@${name.toLowerCase().replace(/\s+/g, '')}`;
  const total    = user.stats?.total || 0;

  const gradients = [
    'from-pink-600 to-pink-900',
    'from-purple-600 to-purple-900',
    'from-teal-600 to-teal-900',
    'from-indigo-600 to-indigo-900',
    'from-sky-600 to-sky-900',
  ];
  const grad = gradients[name.charCodeAt(0) % gradients.length];

  return (
    <Link
      href={`/user/${user.googleId}`}
      className="group flex items-center gap-3 bg-bg-card border border-border rounded-2xl p-3 hover:border-accent-red/40 hover:bg-bg-elevated transition-all duration-200"
    >
      {}
      <div className="flex-shrink-0 relative">
        <div className="w-12 h-12 rounded-xl overflow-hidden border border-border group-hover:border-accent-red/50 transition-colors">
          {user.photoURL ? (
            <img src={user.photoURL} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${grad} flex items-center justify-center`}>
              <span className="font-display text-sm text-white">{initials}</span>
            </div>
          )}
        </div>
        {}
        {(user.isAdmin || user.isPremium) && (
          <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-bg-card flex items-center justify-center ${user.isAdmin ? 'bg-red-500' : 'bg-yellow-500'}`}>
            <svg viewBox="0 0 24 24" fill="white" className="w-2 h-2">
              {user.isAdmin
                ? <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                : <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              }
            </svg>
          </div>
        )}
      </div>

      {}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-text-primary font-bold text-sm line-clamp-1">{name}</span>
          <MemberBadge isAdmin={user.isAdmin} isPremium={user.isPremium} />
        </div>
        <p className="text-text-muted text-[11px] font-semibold mt-0.5">{handle}</p>
        {user.bio && (
          <p className="text-text-muted text-[11px] mt-1 line-clamp-1 italic">"{user.bio}"</p>
        )}
      </div>

      {}
      <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
        <div className="flex items-center gap-1 text-accent-red">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
          </svg>
          <span className="text-xs font-bold">{total}</span>
        </div>
        <div className="flex gap-1.5 text-[10px] text-text-muted">
          <span className="text-green-400 font-semibold">{user.stats?.finished || 0}✓</span>
          <span>·</span>
          <span>{user.stats?.reading || 0} baca</span>
        </div>
        {}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className="w-4 h-4 text-text-muted group-hover:text-accent-red group-hover:translate-x-0.5 transition-all duration-200">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
    </Link>
  );
}

function UserSkeleton() {
  return (
    <div className="space-y-3 px-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 bg-bg-card border border-border rounded-2xl p-3 animate-pulse">
          <div className="w-12 h-12 rounded-xl bg-bg-elevated flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-bg-elevated rounded w-1/3" />
            <div className="h-2.5 bg-bg-elevated rounded w-1/4" />
          </div>
          <div className="w-8 h-8 bg-bg-elevated rounded-lg flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

export default function UserList() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch]         = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [pagination, setPagination] = useState(null);
  const [page, setPage]             = useState(1);
  const debounceRef                 = useRef(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !user.isAdmin) {
      router.replace('/');
    }
  }, [user, authLoading]);

  if (authLoading || !user?.isAdmin) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-accent-red/30 border-t-accent-red rounded-full animate-spin" />
      </div>
    );
  }

  const load = useCallback(async (q, p, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const res = await getUsers({ q, page: p, limit: 20 });
      const raw = Array.isArray(res.data) ? res.data : [];

      const seen = new Set();
      const data = raw.filter(u => {
        if (!u.googleId || seen.has(u.googleId)) return false;
        seen.add(u.googleId);
        return true;
      });

      setUsers(prev => append ? [...prev, ...data] : data);
      setPagination(res.pagination || null);
    } catch (err) {
      console.error('[UserList] fetch error:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    load('', 1, false);
  }, []);

  const handleSearchChange = (val) => {
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
      load(val, 1, false);
    }, 400);
  };

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    load(search, next, true);
  };

  const hasMore = pagination && page < pagination.totalPages;

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />

      <main className="pt-14 pb-safe max-w-2xl mx-auto">

        {}
        <div className="px-4 pt-5 pb-4">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h1 className="font-display text-2xl text-text-primary tracking-widest">PENGGUNA</h1>
              <p className="text-text-muted text-xs mt-0.5">
                {pagination ? `${pagination.totalItems} pengguna terdaftar` : 'Memuat...'}
              </p>
            </div>
            {}
            <div className="w-10 h-10 bg-bg-card border border-border rounded-xl flex items-center justify-center mb-0.5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-accent-red">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                <path d="M16 3.13a4 4 0 010 7.75"/>
              </svg>
            </div>
          </div>

          {}
          <div className="flex items-center gap-2 bg-bg-card border border-border rounded-xl px-3 py-2.5 focus-within:border-accent-red/50 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-text-muted flex-shrink-0">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Cari pengguna..."
              className="flex-1 bg-transparent text-text-primary text-sm placeholder-text-muted outline-none"
            />
            {searchInput && (
              <button
                onClick={() => handleSearchChange('')}
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {}
        {loading && <UserSkeleton />}

        {}
        {!loading && users.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center px-4">
            <div className="w-16 h-16 bg-bg-elevated rounded-full flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-text-muted">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                <path d="M16 3.13a4 4 0 010 7.75"/>
              </svg>
            </div>
            <p className="font-display text-xl text-text-secondary tracking-wider">
              {search ? `TIDAK ADA HASIL` : 'BELUM ADA PENGGUNA'}
            </p>
            <p className="text-text-muted text-sm max-w-xs">
              {search
                ? `Tidak ditemukan pengguna dengan nama "${search}".`
                : 'Belum ada pengguna yang terdaftar.'}
            </p>
            {search && (
              <button
                onClick={() => handleSearchChange('')}
                className="mt-1 px-5 py-2.5 bg-accent-red text-white font-bold rounded-xl text-sm hover:bg-accent-redDark transition-colors"
              >
                Reset Pencarian
              </button>
            )}
          </div>
        )}

        {}
        {!loading && users.length > 0 && (
          <div className="px-4 space-y-3">
            {users.map(user => (
              <UserCard key={user.googleId} user={user} />
            ))}

            {}
            {hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="w-full py-3 rounded-2xl border border-border text-text-muted text-sm font-semibold hover:border-accent-red/40 hover:text-text-secondary transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loadingMore ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
                      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75"/>
                    </svg>
                    Memuat...
                  </>
                ) : (
                  <>
                    Muat Lebih Banyak
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </>
                )}
              </button>
            )}

            {}
            {!hasMore && users.length > 0 && (
              <p className="text-center text-text-muted text-xs py-2">
                Menampilkan {users.length} dari {pagination?.totalItems || users.length} pengguna
              </p>
            )}
          </div>
        )}

        <div className="h-6" />
      </main>
    </div>
  );
}
