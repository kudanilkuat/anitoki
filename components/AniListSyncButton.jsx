'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getAniListStatus, getAniListAuthUrl, syncAniListProgress, updateAniListSettings } from '@/lib/api';

// AniList Logo SVG
function AniListIcon({ className = 'w-4 h-4' }) {
    return (
        <svg viewBox="0 0 500 500" fill="currentColor" className={className} aria-hidden="true">
            <path d="M 235.8 0 L 140.6 200 L 19.4 454.4 C 6.7 481.1 26.2 512 55.7 512 L 235.8 512 L 235.8 355.2 L 157.9 355.2 L 235.8 190.9 L 235.8 0 Z" />
            <path d="M 264.2 0 L 264.2 190.9 L 342.1 355.2 L 264.2 355.2 L 264.2 512 L 444.3 512 C 473.8 512 493.3 481.1 480.6 454.4 L 359.4 200 L 264.2 0 Z" opacity="0.85" />
            <rect x="290" y="380" width="180" height="90" rx="45" fill="currentColor" />
        </svg>
    );
}

// Helper to extract reliable episode number
function extractEpisodeNumber(num, title, slug) {
    if (typeof num === 'number' && !isNaN(num) && num > 0) return num;
    if (typeof num === 'string' && !isNaN(Number(num)) && Number(num) > 0) return Number(num);
    if (title) {
        const m = title.match(/(?:episode|ep\.?|ke-?)\s*(\d+)/i) || title.match(/\b(\d+)\b/);
        if (m && m[1]) return parseInt(m[1], 10);
    }
    if (slug) {
        const m = slug.match(/(?:episode|ep)-(\d+)/i) || slug.match(/-(\d+)$/);
        if (m && m[1]) return parseInt(m[1], 10);
    }
    return 1;
}

export default function AniListSyncButton({
    animeSlug,
    anilistId,
    episodeNumber,
    episodeTitle,
    episodeSlug,
    totalEpisode,
}) {
    const { user } = useAuth();
    const [status, setStatus] = useState(null); // { connected, anilist: { userName, avatar, autoSync } }
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState(null); // { success: boolean, progress: number, message: string }
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);
    const hasAutoSynced = useRef(false);

    const currentEp = extractEpisodeNumber(episodeNumber, episodeTitle, episodeSlug);

    // Fetch user AniList connection status
    useEffect(() => {
        if (!user?.uid) {
            setLoading(false);
            return;
        }

        let isMounted = true;
        async function fetchStatus() {
            try {
                const res = await getAniListStatus(user.uid);
                if (isMounted && res.success) {
                    setStatus(res);
                }
            } catch (err) {
                console.error('[AniList Button] status error:', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchStatus();
        return () => { isMounted = false; };
    }, [user?.uid]);

    // Handle OAuth Callback notification from URL params (?anilist_connected=true)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        if (params.get('anilist_connected') === 'true') {
            setSyncResult({ success: true, message: 'AniList terhubung!' });
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
            setTimeout(() => setSyncResult(null), 3000);
        } else if (params.get('anilist_error')) {
            setSyncResult({ success: false, message: 'Gagal menghubungkan: ' + params.get('anilist_error') });
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
            setTimeout(() => setSyncResult(null), 4000);
        }
    }, []);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowMenu(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Execute Progress Sync
    const handleSync = async (isManual = false) => {
        if (!user?.uid || !status?.connected) return;
        setSyncing(true);
        setSyncResult(null);

        try {
            const res = await syncAniListProgress({
                uid: user.uid,
                animeSlug,
                anilistId,
                episodeNumber: currentEp,
                episodeTitle,
                episodeSlug,
                status: totalEpisode && currentEp >= totalEpisode ? 'COMPLETED' : 'CURRENT',
            });

            if (res.success) {
                const syncedEp = res.progress || currentEp;
                setSyncResult({
                    success: true,
                    progress: syncedEp,
                    message: `Tersinkron Ep. ${syncedEp} ke AniList!`,
                });
            } else if (res.unauthorized) {
                setStatus(prev => ({ ...prev, connected: false }));
                setSyncResult({
                    success: false,
                    message: 'Sesi kedaluwarsa. Silakan hubungkan ulang.',
                });
            } else {
                setSyncResult({
                    success: false,
                    message: res.message || 'Gagal sinkronisasi ke AniList',
                });
            }
        } catch (err) {
            setSyncResult({
                success: false,
                message: err.message || 'Koneksi ke AniList gagal',
            });
        } finally {
            setSyncing(false);
            setTimeout(() => setSyncResult(null), 3200);
        }
    };

    // Auto-sync when episode is loaded and autoSync is enabled
    useEffect(() => {
        if (!status?.connected || !status?.anilist?.autoSync) return;
        if (hasAutoSynced.current) return;
        if (!user?.uid || !animeSlug) return;

        // Delay 3s so we don't trigger if user just glanced and clicked away
        const timer = setTimeout(() => {
            if (!hasAutoSynced.current) {
                hasAutoSynced.current = true;
                handleSync(false);
            }
        }, 3000);

        return () => clearTimeout(timer);
    }, [status?.connected, status?.anilist?.autoSync, animeSlug, episodeSlug, user?.uid]);

    // Handle Connect via OAuth
    const handleConnect = async () => {
        if (!user?.uid) {
            alert('Silakan login ke akun Anitoki terlebih dahulu untuk menghubungkan AniList.');
            return;
        }

        try {
            const returnTo = typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/';
            const res = await getAniListAuthUrl(user.uid, returnTo);
            if (res.success && res.url) {
                window.location.href = res.url;
            } else {
                alert(res.message || 'Gagal memulai otorisasi AniList');
            }
        } catch (err) {
            alert('Terjadi kesalahan: ' + err.message);
        }
    };

    // Toggle autoSync
    const handleToggleAutoSync = async () => {
        if (!user?.uid || !status?.connected) return;
        const current = status.anilist.autoSync !== false;
        const next = !current;

        setStatus(prev => ({
            ...prev,
            anilist: { ...prev.anilist, autoSync: next }
        }));

        try {
            await updateAniListSettings(user.uid, { autoSync: next });
        } catch (err) {
            console.error('Failed to toggle autoSync:', err);
        }
    };

    // Disconnect
    const handleDisconnect = async () => {
        if (!confirm('Putuskan sambungan akun AniList dari Anitoki?')) return;
        setShowMenu(false);
        try {
            await updateAniListSettings(user.uid, { disconnect: true });
            setStatus({ connected: false, anilist: null });
            setSyncResult({ success: true, message: 'Koneksi AniList diputuskan' });
            setTimeout(() => setSyncResult(null), 2500);
        } catch (err) {
            alert('Gagal memutuskan koneksi: ' + err.message);
        }
    };

    if (loading) {
        return (
            <div className="inline-flex items-center gap-1.5 h-9 sm:h-[38px] px-3.5 rounded-xl bg-surface-container/60 border border-border-subtle/30 text-xs text-on-surface-variant animate-pulse">
                <div className="w-3.5 h-3.5 rounded-full bg-border-subtle/40" />
                <span>AniList...</span>
            </div>
        );
    }

    // ── NOT CONNECTED STATE ──
    if (!status?.connected) {
        return (
            <div className="relative inline-flex items-center">
                <button
                    onClick={handleConnect}
                    title="Hubungkan akun AniList untuk otomatis mencatat tontonan"
                    className="inline-flex items-center gap-1.5 h-9 sm:h-[38px] px-3 sm:px-4 rounded-xl bg-[#02A9FF]/10 hover:bg-[#02A9FF]/20 text-[#02A9FF] border border-[#02A9FF]/30 hover:border-[#02A9FF]/60 text-xs font-bold transition-all shadow-sm active:scale-95 group"
                >
                    <AniListIcon className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                    <span>Hubungkan AniList</span>
                </button>

                {syncResult && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none whitespace-nowrap animate-fade-in">
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold shadow-xl border backdrop-blur-md ${syncResult.success ? 'bg-emerald-950/95 text-emerald-300 border-emerald-500/40' : 'bg-rose-950/95 text-rose-300 border-rose-500/40'}`}>
                            {syncResult.message}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ── CONNECTED STATE ──
    const { userName, avatar, autoSync = true } = status.anilist || {};

    return (
        <div className="relative inline-flex items-center" ref={menuRef}>
            {/* Centered Floating Notification Pill */}
            {syncResult && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 z-50 pointer-events-none whitespace-nowrap animate-fade-in flex flex-col items-center">
                    <div
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-xl backdrop-blur-md border ${
                            syncResult.success
                                ? 'bg-emerald-950/95 text-emerald-300 border-emerald-500/40 shadow-emerald-950/40'
                                : 'bg-rose-950/95 text-rose-300 border-rose-500/40 shadow-rose-950/40'
                        }`}
                    >
                        {syncResult.success ? (
                            <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <span className="text-rose-400 text-xs">⚠️</span>
                        )}
                        <span>{syncResult.message}</span>
                    </div>
                    {/* Downward pointer caret */}
                    <div
                        className={`w-2 h-2 rotate-45 border-r border-b -mt-1 ${
                            syncResult.success ? 'bg-emerald-950 border-emerald-500/40' : 'bg-rose-950 border-rose-500/40'
                        }`}
                    />
                </div>
            )}

            {/* Seamless Action Pill */}
            <div className="flex items-center h-9 sm:h-[38px] rounded-xl bg-surface-container/70 border border-[#02A9FF]/30 hover:border-[#02A9FF]/55 transition-all shadow-sm overflow-hidden">
                {/* Sync Action Button */}
                <button
                    onClick={() => handleSync(true)}
                    disabled={syncing}
                    title={syncing ? 'Menyinkronkan...' : `Klik untuk sinkronisasi Ep. ${currentEp} ke AniList`}
                    className="flex items-center gap-1.5 px-3 h-full text-xs font-bold text-on-surface hover:text-[#02A9FF] hover:bg-[#02A9FF]/10 transition-colors disabled:opacity-50"
                >
                    {syncing ? (
                        <div className="w-3.5 h-3.5 border-2 border-[#02A9FF] border-t-transparent rounded-full animate-spin shrink-0" />
                    ) : (
                        <AniListIcon className="w-3.5 h-3.5 text-[#02A9FF] shrink-0" />
                    )}

                    <span>
                        {syncing ? (
                            'Syncing...'
                        ) : syncResult?.success ? (
                            <span className="text-emerald-400">✓ Ep. {currentEp}</span>
                        ) : (
                            <span>Ep. {currentEp}</span>
                        )}
                    </span>
                </button>

                {/* Subtle Divider */}
                <div className="w-px h-4 bg-border-subtle/40" />

                {/* User avatar & dropdown toggle */}
                <button
                    onClick={() => setShowMenu(prev => !prev)}
                    className="flex items-center gap-1.5 px-2.5 h-full hover:bg-[#02A9FF]/10 text-on-surface-variant hover:text-on-surface transition-colors"
                    title="Pengaturan AniList"
                    aria-label="Pengaturan AniList"
                >
                    {avatar ? (
                        <img src={avatar} alt="" className="w-4 h-4 rounded-full object-cover border border-[#02A9FF]/50" />
                    ) : (
                        <span className="text-[10px]">👤</span>
                    )}
                    <svg
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className={`w-3 h-3 opacity-60 transition-transform ${showMenu ? 'rotate-180' : ''}`}
                    >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>

            {/* Dropdown Menu */}
            {showMenu && (
                <div className="absolute top-full right-0 mt-2 w-60 rounded-2xl bg-surface-elevated/95 backdrop-blur-md border border-border-subtle/60 p-3 shadow-2xl z-50 flex flex-col gap-2.5 animate-slide-up">
                    {/* User Info Header */}
                    <div className="flex items-center gap-2.5 pb-2 border-b border-border-subtle/30">
                        {avatar ? (
                            <img src={avatar} alt={userName} className="w-8 h-8 rounded-full object-cover border border-[#02A9FF]" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-[#02A9FF]/20 flex items-center justify-center text-[#02A9FF]">
                                <AniListIcon className="w-4 h-4" />
                            </div>
                        )}
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-on-surface truncate">@{userName}</span>
                            <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Terhubung ke AniList
                            </span>
                        </div>
                    </div>

                    {/* Auto-sync Switch */}
                    <div className="flex items-center justify-between text-xs py-1">
                        <span className="text-on-surface-variant font-medium">Auto-sync saat nonton</span>
                        <button
                            onClick={handleToggleAutoSync}
                            className={`w-9 h-5 rounded-full transition-colors relative ${autoSync !== false ? 'bg-[#02A9FF]' : 'bg-surface-container'}`}
                        >
                            <span
                                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${autoSync !== false ? 'right-0.5' : 'left-0.5'}`}
                            />
                        </button>
                    </div>

                    {/* Manual Sync Trigger */}
                    <button
                        onClick={() => {
                            setShowMenu(false);
                            handleSync(true);
                        }}
                        disabled={syncing}
                        className="w-full py-2 px-3 rounded-xl bg-primary-container/20 hover:bg-primary-container/30 text-primary-stitch text-xs font-bold transition-colors flex items-center justify-center gap-2"
                    >
                        <AniListIcon className="w-3.5 h-3.5" />
                        <span>Sync Sekarang (Ep. {currentEp})</span>
                    </button>

                    {/* Disconnect Button */}
                    <button
                        onClick={handleDisconnect}
                        className="w-full py-1.5 text-center text-xs text-status-expired hover:text-red-300 font-medium transition-colors hover:underline"
                    >
                        Putuskan Koneksi AniList
                    </button>
                </div>
            )}
        </div>
    );
}
