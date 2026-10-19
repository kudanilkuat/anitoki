'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTags, faHouse, faGrip, faBookmark, faClockRotateLeft, faUsers, faBell } from '@fortawesome/free-solid-svg-icons';
import LiveSearch from '@/components/LiveSearch';
import AdvanceSearch from '@/components/AdvanceSearch';

function HomeIcon({ active }) {
  return <FontAwesomeIcon icon={faHouse} className="w-6 h-6 text-[1.25rem]" style={{ opacity: active ? 1 : 0.7 }} />;
}

function GridIcon({ active }) {
  return <FontAwesomeIcon icon={faGrip} className="w-6 h-6 text-[1.25rem]" style={{ opacity: active ? 1 : 0.7 }} />;
}

function BookmarkIcon({ active }) {
  return <FontAwesomeIcon icon={faBookmark} className="w-6 h-6 text-[1.25rem]" style={{ opacity: active ? 1 : 0.7 }} />;
}

function HistoryIcon({ active }) {
  return <FontAwesomeIcon icon={faClockRotateLeft} className="w-6 h-6 text-[1.25rem]" style={{ opacity: active ? 1 : 0.7 }} />;
}

function UsersIcon({ active }) {
  return <FontAwesomeIcon icon={faUsers} className="w-6 h-6 text-[1.25rem]" style={{ opacity: active ? 1 : 0.7 }} />;
}

function GenreIcon({ active }) {
  return <FontAwesomeIcon icon={faTags} className="w-6 h-6 text-[1.25rem]" style={{ opacity: active ? 1 : 0.6 }} />;
}

function BellIcon() {
  return <FontAwesomeIcon icon={faBell} className="w-5 h-5 text-[1.1rem]" />;
}

function UserMenu({ user, logout }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    setOpen(false);
    router.push('/');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface text-sm font-bold bg-surface-elevated border border-border-subtle/40"
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt="avatar" className="w-full h-full object-cover rounded-full" />
        ) : (
          <span>{user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}</span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-50 w-52 bg-surface-elevated border border-border-subtle rounded-2xl shadow-2xl shadow-black/50 overflow-hidden animate-slide-up">
            <div className="px-4 py-3 border-b border-border-subtle">
              <p className="font-bold text-on-surface text-sm truncate">
                {user.displayName || 'Pengguna'}
              </p>
              <p className="text-on-surface-variant text-xs truncate">{user.email}</p>
            </div>
            <Link href={`/user/${user.uid}`} onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-variant hover:text-on-surface transition-colors text-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              Profil
            </Link>
            <Link href="/bookmarks" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-variant hover:text-on-surface transition-colors text-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" /></svg>
              Bookmark
            </Link>
            <Link href="/history" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-variant hover:text-on-surface transition-colors text-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" /></svg>
              Riwayat
            </Link>
            <Link href="/changelog" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-variant hover:text-on-surface transition-colors text-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
              Changelog
            </Link>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-900/20 transition-colors text-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
              Keluar
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [advanceSearchOpen, setAdvanceSearchOpen] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const fetchedUidRef = useRef(null);

  useEffect(() => {
    if (!user?.uid) return;
    if (fetchedUidRef.current === user.uid) return; // sudah fetch untuk user ini
    fetchedUidRef.current = user.uid;
    fetch(`/api/users/${user.uid}/notifications`)
      .then(res => res.json())
      .then(data => { if (data.success) setNotifications(data.data); })
      .catch(err => console.error('Gagal load notif:', err));
  }, [user?.uid]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async () => {
    if (!user?.uid || unreadCount === 0) return;
    try {
      await fetch(`/api/users/${user.uid}/notifications/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) { console.error(err); }
  };

  if (pathname.startsWith('/read/')) return null;
  if (pathname.startsWith('/login')) return null;

  const NAV_ITEMS = [
    { href: '/', icon: HomeIcon, label: 'Home' },
    { href: '/anime', icon: GridIcon, label: 'Anime' },
    { href: '/genres', icon: GenreIcon, label: 'Genre' },
    { href: '/bookmarks', icon: BookmarkIcon, label: 'Simpan' },
    { href: '/history', icon: HistoryIcon, label: 'Riwayat' },
  ];

  const openLiveSearch = () => { setAdvanceSearchOpen(false); setSearchOpen(true); };
  const openAdvSearch = () => { setSearchOpen(false); setAdvanceSearchOpen(!advanceSearchOpen); };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface-container border-b border-border-subtle/40 shadow-lg">
        <div className="max-w-[1100px] mx-auto flex items-center justify-between px-4 h-14">
          {/* KIRI: Logo & Nav */}
          <div className="flex items-center gap-6 flex-shrink-0">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-display text-xl font-black text-white tracking-wider flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-container rounded flex items-center justify-center shadow-lg shadow-primary-container/20">
                  <span className="text-lg font-black italic">{process.env.NEXT_PUBLIC_SITE_BRAND || 'KO'}</span>
                </div>
                {process.env.NEXT_PUBLIC_SITE_NAME || 'ANIMESTREAM'}
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1 h-full">
              <Link href="/" className={`text-sm font-semibold flex items-center gap-1.5 px-3 transition-colors h-14 relative ${pathname === '/' ? 'text-primary-stitch after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-primary-stitch after:rounded-full' : 'text-on-surface-variant hover:text-on-surface'}`}>
                <HomeIcon active={pathname === '/'} /> Home
              </Link>
              <Link href="/anime" className={`text-sm font-semibold flex items-center gap-1.5 px-3 transition-colors h-14 relative ${pathname === '/anime' ? 'text-primary-stitch after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-primary-stitch after:rounded-full' : 'text-on-surface-variant hover:text-on-surface'}`}>
                <GridIcon active={pathname === '/anime'} /> Browse
              </Link>
              <Link href="/anime?order=popular" className="text-sm font-semibold flex items-center gap-1.5 px-3 text-on-surface-variant hover:text-on-surface transition-colors h-14 relative">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                Popular
              </Link>
              <Link href="/bookmarks" className={`text-sm font-semibold flex items-center gap-1.5 px-3 transition-colors h-14 relative ${pathname === '/bookmarks' ? 'text-primary-stitch after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-primary-stitch after:rounded-full' : 'text-on-surface-variant hover:text-on-surface'}`}>
                <BookmarkIcon active={pathname === '/bookmarks'} /> Library
              </Link>
              <Link href="/download" className={`text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all border my-auto ${pathname === '/download' || pathname === '/app' ? 'bg-primary-container text-on-primary border-transparent shadow-sm' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20'}`}>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1.0001s.4482-1.0001.9993-1.0001c.552 0 1.0001.4486 1.0001 1.0001s-.4481 1.0001-1.0001 1.0001m-11.046 0c-.5511 0-.9993-.4486-.9993-1.0001s.4482-1.0001.9993-1.0001c.552 0 1.0001.4486 1.0001 1.0001s-.4481 1.0001-1.0001 1.0001m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.4116 13.8533 8.125 12 8.125s-3.5902.2866-5.1368.8247L4.8409 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.152 1.5676l1.9973 3.4592C2.6889 12.138.3582 16.1415 0 20.875h24c-.3582-4.7335-2.6889-8.737-6.1185-11.5536" />
                </svg>
                <span>App</span>
              </Link>
            </nav>
          </div>

          {/* TENGAH: Search Bar (Desktop) */}
          <div className="hidden md:flex items-center gap-2 flex-1 min-w-0 max-w-sm mx-6">
            <div className="relative flex-1 cursor-pointer group" onClick={openLiveSearch}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-on-surface transition-colors"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input
                type="text"
                placeholder="Cari anime..."
                className="w-full bg-surface-elevated border border-border-subtle rounded-lg py-2 pl-9 pr-4 text-sm text-on-surface focus:outline-none cursor-pointer transition-colors hover:border-border-subtle"
                readOnly
              />
            </div>
            <button
              onClick={openAdvSearch}
              title="Advanced Search"
              className={`flex-none w-9 h-9 flex items-center justify-center rounded-lg border transition-colors ${advanceSearchOpen ? 'bg-primary-container/20 border-primary-stitch/40 text-primary-stitch' : 'bg-surface-elevated border-border-subtle text-on-surface-variant hover:text-primary-stitch hover:border-primary-stitch/30'}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
            </button>
          </div>

          {/* KANAN: Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Mobile search & filter */}
            <button onClick={openLiveSearch} className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-surface-elevated border border-border-subtle text-on-surface-variant hover:text-on-surface transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            </button>
            <button onClick={openAdvSearch} className={`md:hidden w-9 h-9 flex items-center justify-center rounded-xl border transition-colors ${advanceSearchOpen ? 'bg-primary-container/20 border-primary-stitch/30 text-primary-stitch' : 'bg-surface-elevated border-border-subtle text-on-surface-variant hover:text-primary-stitch'}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
            </button>

            {user && (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotif(!showNotif);
                    if (!showNotif) handleMarkAsRead();
                  }}
                  className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-surface-elevated border border-border-subtle text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <BellIcon />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotif && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotif(false)} />
                    <div className="absolute right-0 top-11 z-50 w-72 md:w-80 bg-surface-elevated border border-border-subtle rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
                      <div className="px-4 py-3 border-b border-border-subtle bg-surface-container">
                        <h3 className="font-bold text-on-surface text-sm">Announcements</h3>
                      </div>
                      <div className="max-h-[60vh] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-on-surface-variant text-xs">Belum ada pengumuman.</div>
                        ) : (
                          notifications.map((notif, i) => (
                            <div key={i} className={`p-4 border-b border-border-subtle/40 hover:bg-surface-variant/20 transition-colors ${!notif.isRead ? 'bg-primary-stitch/10' : ''}`}>
                              <p className="text-xs font-bold text-on-surface mb-1">{notif.title}</p>
                              <p className="text-[11px] text-on-surface-variant leading-relaxed">{notif.message}</p>
                              <p className="text-[9px] text-on-surface-variant/60 mt-2">{new Date(notif.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {user ? (
              <UserMenu user={user} logout={logout} />
            ) : (
              <Link href="/login" className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-container text-on-primary text-xs font-bold hover:brightness-110 transition-colors">
                Masuk
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Advance Search Panel — slide down di bawah header */}
      {advanceSearchOpen && (
        <div className="fixed top-14 left-0 right-0 z-40 animate-slide-down">
          <AdvanceSearch onClose={() => setAdvanceSearchOpen(false)} />
        </div>
      )}

      {searchOpen && (
        <LiveSearch onClose={() => setSearchOpen(false)} />
      )}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-down {
          animation: slideDown 0.25s ease-out forwards;
        }
      `}</style>

      {/* Bottom Nav mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-container/95 backdrop-blur-md border-t border-border-subtle">
        <div className="max-w-2xl mx-auto flex items-center justify-around h-16" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            const needsAuth = href === '/bookmarks';
            return (
              <Link key={href} href={needsAuth && !user ? '/login' : href} className={`flex flex-col items-center gap-0.5 min-w-[56px] py-1 transition-colors duration-200 relative ${active ? 'text-primary-stitch' : 'text-on-surface-variant hover:text-on-surface'}`}>
                <Icon active={active} />
                <span className={`text-[10px] font-semibold ${active ? 'text-primary-stitch' : 'text-on-surface-variant'}`}>{label}</span>
                {needsAuth && !user && <span className="absolute top-0.5 right-2 w-1.5 h-1.5 rounded-full bg-primary-stitch" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
