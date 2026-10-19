'use client';

import { useState, useEffect } from 'react';
import { getAniListStatus, getAniListAuthUrl, updateAniListSettings } from '@/lib/api';

function AniListIcon({ className = 'w-5 h-5' }) {
    return (
        <svg viewBox="0 0 500 500" fill="currentColor" className={className} aria-hidden="true">
            <path d="M 235.8 0 L 140.6 200 L 19.4 454.4 C 6.7 481.1 26.2 512 55.7 512 L 235.8 512 L 235.8 355.2 L 157.9 355.2 L 235.8 190.9 L 235.8 0 Z" />
            <path d="M 264.2 0 L 264.2 190.9 L 342.1 355.2 L 264.2 355.2 L 264.2 512 L 444.3 512 C 473.8 512 493.3 481.1 480.6 454.4 L 359.4 200 L 264.2 0 Z" opacity="0.85" />
            <rect x="290" y="380" width="180" height="90" rx="45" fill="currentColor" />
        </svg>
    );
}

export default function AniListProfileCard({ userUid }) {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (!userUid) {
            setLoading(false);
            return;
        }

        let isMounted = true;
        async function fetchStatus() {
            try {
                const res = await getAniListStatus(userUid);
                if (isMounted && res.success) {
                    setStatus(res);
                }
            } catch (err) {
                console.error('Failed to load AniList status:', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchStatus();
        return () => { isMounted = false; };
    }, [userUid]);

    const handleConnect = async () => {
        try {
            const returnTo = typeof window !== 'undefined' ? window.location.pathname : '/';
            const res = await getAniListAuthUrl(userUid, returnTo);
            if (res.success && res.url) {
                window.location.href = res.url;
            } else {
                alert(res.message || 'Gagal memulai koneksi AniList');
            }
        } catch (err) {
            alert('Terjadi kesalahan: ' + err.message);
        }
    };

    const handleToggleAutoSync = async () => {
        if (!status?.anilist || updating) return;
        const current = status.anilist.autoSync !== false;
        const next = !current;

        setUpdating(true);
        setStatus(prev => ({
            ...prev,
            anilist: { ...prev.anilist, autoSync: next }
        }));

        try {
            await updateAniListSettings(userUid, { autoSync: next });
        } catch (err) {
            console.error('Failed to update AniList autoSync:', err);
        } finally {
            setUpdating(false);
        }
    };

    const handleDisconnect = async () => {
        if (!confirm('Apakah kamu yakin ingin memutuskan hubungan akun AniList?')) return;
        setUpdating(true);
        try {
            await updateAniListSettings(userUid, { disconnect: true });
            setStatus({ connected: false, anilist: null });
        } catch (err) {
            alert('Gagal memutuskan koneksi: ' + err.message);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-surface-elevated border border-border-subtle/30 rounded-2xl p-5 animate-pulse flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-container" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-surface-container rounded w-1/3" />
                    <div className="h-3 bg-surface-container rounded w-2/3" />
                </div>
            </div>
        );
    }

    const isConnected = !!status?.connected;
    const { userName, avatar, autoSync = true, connectedAt } = status?.anilist || {};

    return (
        <div className="relative bg-surface-elevated border border-border-subtle/30 rounded-2xl overflow-hidden shadow-lg shadow-black/20 p-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle/25">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#02A9FF]/15 text-[#02A9FF] flex items-center justify-center border border-[#02A9FF]/30">
                        <AniListIcon className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="font-display text-sm font-bold text-on-surface">Sinkronisasi AniList</h3>
                        <p className="text-[11px] text-on-surface-variant">Update otomatis episode yang ditonton</p>
                    </div>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isConnected
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-surface-container text-on-surface-variant border-border-subtle/40'
                    }`}>
                    {isConnected ? '✓ Terhubung' : 'Belum Terhubung'}
                </span>
            </div>

            {/* Body */}
            {isConnected ? (
                <div className="mt-4 flex flex-col gap-3.5">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container/40 border border-border-subtle/20">
                        <div className="flex items-center gap-3 min-w-0">
                            {avatar ? (
                                <img src={avatar} alt={userName} className="w-10 h-10 rounded-full object-cover border-2 border-[#02A9FF]/40" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-[#02A9FF]/20 flex items-center justify-center text-[#02A9FF]">
                                    <AniListIcon className="w-5 h-5" />
                                </div>
                            )}
                            <div className="flex flex-col min-w-0">
                                <a
                                    href={`https://anilist.co/user/${userName}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-bold text-on-surface hover:text-[#02A9FF] transition-colors truncate"
                                >
                                    @{userName}
                                </a>
                                <span className="text-[10px] text-on-surface-variant">
                                    {connectedAt ? `Terhubung sejak ${new Date(connectedAt).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}` : 'Akun Aktif'}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={handleDisconnect}
                            disabled={updating}
                            className="text-xs text-status-expired hover:text-red-300 font-semibold px-2.5 py-1 rounded-lg hover:bg-status-expired/10 transition-colors disabled:opacity-50"
                        >
                            Putuskan
                        </button>
                    </div>

                    {/* Auto-sync Option */}
                    <div className="flex items-center justify-between px-1">
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-on-surface">Auto-sync saat menonton</span>
                            <span className="text-[11px] text-on-surface-variant">Otomatis update progres episode ke AniList</span>
                        </div>
                        <button
                            onClick={handleToggleAutoSync}
                            disabled={updating}
                            className={`w-11 h-6 rounded-full transition-colors relative ${autoSync !== false ? 'bg-[#02A9FF]' : 'bg-surface-container'}`}
                        >
                            <span
                                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${autoSync !== false ? 'right-1' : 'left-1'}`}
                            />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-xs text-on-surface-variant leading-relaxed max-w-sm">
                        Hubungkan akun AniList kamu agar progres tontonan setiap episode anime langsung tercatat di profil AniList secara otomatis.
                    </p>
                    <button
                        onClick={handleConnect}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#02A9FF] hover:brightness-110 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-[#02A9FF]/20 flex-shrink-0"
                    >
                        <AniListIcon className="w-4 h-4" />
                        <span>Hubungkan AniList</span>
                    </button>
                </div>
            )}
        </div>
    );
}
