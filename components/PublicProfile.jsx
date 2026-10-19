'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import { getPublicBookmarks, calcBookmarkStats, READING_STATUS } from '@/lib/bookmarks';
import { getPublicProfile, updateUserProfile, calcUserLevel, getUserShortId } from '@/lib/profile';
import { useAuth } from '@/context/AuthContext';
import DonationCard from '@/components/DonationCard';
import QRModal from '@/components/QRModal';
import AniListProfileCard from '@/components/AniListProfileCard';

// ── Komponen Banner Riwayat Pembayaran Pending ──────────────────────────────
function PendingOrdersBanner({ userId, userUid }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(null);
  const [messages, setMessages] = useState({});
  const [copied, setCopied] = useState(null);
  const [qrOrder, setQrOrder] = useState(null);
  const [coins, setCoins] = useState(0); // saldo koin user

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/payments/pending-orders', {
        headers: { Authorization: `Bearer ${userUid}` },
      });
      const json = await res.json();
      if (json.success) {
        setOrders(json.data);
        setCoins(json.coins || 0);
      }
    } catch { }
    finally { setLoading(false); }
  }, [userUid]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleCheckStatus = async (orderId) => {
    setChecking(orderId);
    setMessages(prev => ({ ...prev, [orderId]: null }));
    try {
      const res = await fetch('/api/payments/check-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userUid}` },
        body: JSON.stringify({ orderId }),
      });
      const json = await res.json();
      if (json.approved) {
        setMessages(prev => ({ ...prev, [orderId]: { type: 'success', text: '✅ Dikonfirmasi! Memuat ulang...' } }));
        setTimeout(() => window.location.reload(), 1800);
      } else if (json.expired) {
        // Order expired, hapus dari list lokal
        setOrders(prev => prev.filter(o => (o.orderId || o.id) !== orderId));
        setMessages(prev => ({ ...prev, [orderId]: { type: 'error', text: 'QR kadaluarsa. Buat order baru dari halaman Premium.' } }));
      } else {
        setMessages(prev => ({ ...prev, [orderId]: { type: 'info', text: 'Pembayaran belum terkonfirmasi. Tunggu beberapa menit lalu cek lagi.' } }));
      }
    } catch (err) {
      setMessages(prev => ({ ...prev, [orderId]: { type: 'error', text: err.message } }));
    } finally {
      setChecking(null);
    }
  };

  const handleCopy = (orderId) => {
    navigator.clipboard.writeText(orderId).then(() => {
      setCopied(orderId);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const handleCancelOrder = async (orderId) => {
    setDeleting(orderId);
    setConfirmDelete(null);
    try {
      const res = await fetch('/api/payments/cancel-order', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userUid}` },
        body: JSON.stringify({ orderId }),
      });
      const json = await res.json();
      if (json.success) {
        // Hapus dari state langsung tanpa reload
        setOrders(prev => prev.filter(o => o.orderId !== orderId));
      } else {
        setMessages(prev => ({ ...prev, [orderId]: { type: 'error', text: json.error || 'Gagal menghapus order.' } }));
      }
    } catch (err) {
      setMessages(prev => ({ ...prev, [orderId]: { type: 'error', text: err.message } }));
    } finally {
      setDeleting(null);
    }
  };

  const statusLabel = (status) => {
    if (status === 'approved' || status === 'paid') return { text: 'Dibayar', cls: 'text-status-ongoing bg-status-ongoing/10 border-status-ongoing/30' };
    return { text: 'Menunggu Konfirmasi', cls: 'text-status-pending bg-status-pending/10 border-status-pending/30' };
  };

  if (loading || orders.length === 0) return null;

  return (
    <>
      <div className="space-y-5">
        {/* Riwayat Pembayaran — hanya jika ada order */}
        {orders.length > 0 && (
          <>
            <div className="flex items-center gap-2 mt-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-primary-stitch">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <h2 className="font-display text-base text-on-surface tracking-widest">RIWAYAT PEMBAYARAN</h2>
              <span className="text-on-surface-variant text-xs font-semibold">{orders.length} Order</span>
            </div>

            <div className="space-y-3">
              {orders.map((order) => {
                const { text: stLabel, cls: stCls } = statusLabel(order.status);
                const orderId = order.orderId || order.id;
                const msg = messages[orderId];

                return (
                  <div key={orderId} className="bg-surface-elevated border border-border-subtle/30 rounded-2xl overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle/30 bg-surface-container">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary-container/10 rounded-lg flex items-center justify-center">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-primary-stitch">
                            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                            <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-on-surface text-xs font-bold">{order.label || 'Paket Premium'}</p>
                          <p className="text-on-surface-variant text-[10px]">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${stCls}`}>
                          {stLabel}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      {/* Nominal */}
                      <div className="flex items-center justify-between">
                        <span className="text-on-surface-variant text-xs">Nominal</span>
                        <span className="text-on-surface font-black text-sm">
                          Rp {order.amount?.toLocaleString('id-ID')}
                        </span>
                      </div>

                      {/* Order ID */}
                      <div>
                        <p className="text-on-surface-variant text-[10px] mb-1">Kode Order:</p>
                        <div className="flex items-center gap-2 bg-surface-container rounded-lg px-3 py-2 border border-border-subtle/40">
                          <span className="font-mono text-on-surface text-xs font-bold tracking-wide flex-1 truncate">{orderId}</span>
                          <button onClick={() => handleCopy(orderId)} className="text-on-surface-variant hover:text-on-surface transition-colors shrink-0">
                            {copied === orderId ? (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5 text-green-400"><polyline points="20 6 9 17 4 12" /></svg>
                            ) : (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* === ORDER PENDING: tombol cek status === */}
                      {order.status !== 'approved' && order.status !== 'paid' && (
                        <>
                          {/* Tombol cek status */}
                          <button
                            onClick={() => handleCheckStatus(orderId)}
                            disabled={checking === orderId}
                            className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-status-ongoing hover:brightness-110 text-surface-deep text-xs font-bold disabled:opacity-50 transition-all"
                          >
                            {checking === orderId ? (
                              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5"><polyline points="20 6 9 17 4 12" /></svg>
                            )}
                            Cek Status Pembayaran
                          </button>
                          {/* Tombol Lihat QR — buka modal langsung */}
                          <button
                            onClick={() => setQrOrder(order)}
                            className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-surface-container border border-border-subtle hover:border-primary-stitch/40 text-on-surface-variant hover:text-on-surface text-xs font-semibold transition-all"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                              <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                            </svg>
                            Lihat QR / Lanjutkan Bayar
                          </button>
                        </>
                      )}

                      {/* === ORDER APPROVED/PAID: tampil sukses === */}
                      {(order.status === 'approved' || order.status === 'paid') && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-xl">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-green-400 shrink-0">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                          </svg>
                          <p className="text-green-400 text-[11px] font-semibold">Pembayaran terkonfirmasi. Premium akan aktif otomatis.</p>
                        </div>
                      )}

                      {/* Pesan status */}
                      {msg && (
                        <div className={`text-[11px] px-3 py-2 rounded-xl border text-center ${msg.type === 'success' ? 'text-status-ongoing bg-status-ongoing/10 border-status-ongoing/20'
                          : msg.type === 'info' ? 'text-primary-stitch bg-primary-container/10 border-primary-stitch/20'
                            : 'text-status-expired bg-status-expired/10 border-status-expired/20'
                          }`}>
                          {msg.text}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Modal QR Code */}
      {qrOrder && (
        <QRModal
          order={qrOrder}
          onClose={() => setQrOrder(null)}
        />
      )}
    </>
  );
}

function Badge({ count }) {
  if (count >= 1000) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-status-pending/20 border border-status-pending/50 text-status-pending">
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
      {Math.floor(count / 1000)}K+ Anime
    </span>
  );
  if (count >= 100) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-container/20 border border-primary-stitch/50 text-primary-stitch">
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M12 2L2 9l10 13 10-13L12 2zm0 3.5L19 9l-7 9-7-9 7-7.5z" /></svg>
      Kolektor
    </span>
  );
  if (count >= 50) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-container/20 border border-primary-stitch/30 text-primary-stitch">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" /></svg>
      Pembaca Aktif
    </span>
  );
  return null;
}

function StatCard({ value, label, color }) {
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[60px]">
      <span className={`font-display text-xl font-bold ${color}`}>{value}</span>
      <span className="text-on-surface-variant text-[10px] font-medium leading-tight text-center">{label}</span>
    </div>
  );
}

function AnimeCard({ bookmark: b }) {
  return (
    <Link href={`/anime/${b.slug}`} className="group flex gap-3 p-3 bg-surface-container border border-border-subtle/30 rounded-xl hover:border-primary-stitch/40 transition-colors">
      <div className="relative w-16 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-surface-elevated">
        {b.coverImage ? (
          <img src={b.coverImage} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full bg-surface-bright flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-on-surface-variant"><polygon points="5 3 19 12 5 21 5 3" /></svg>
          </div>
        )}
      </div>
      <div className="flex flex-col flex-1 py-1 overflow-hidden">
        <h3 className="text-on-surface text-sm font-bold line-clamp-1 group-hover:text-primary-stitch transition-colors">{b.title}</h3>
        <p className="text-on-surface-variant text-xs mt-1">
          {b.lastEpisode || b.lastChapter ? `Ep. ${b.lastEpisode || b.lastChapter}` : 'Anime'} • <span className="opacity-80">{b.addedAt ? new Date(b.addedAt).toLocaleDateString('id-ID') : ''}</span>
        </p>
        <div className="mt-auto">
          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${b.watchStatus === 'watching' ? 'bg-primary-container/20 text-primary-stitch' :
            b.watchStatus === 'finished' ? 'bg-status-ongoing/10 text-status-ongoing' :
              b.watchStatus === 'dropped' ? 'bg-status-expired/10 text-status-expired' :
                'bg-surface-container text-on-surface-variant'
            }`}>
            {b.watchStatus === 'watching' ? 'Sedang Ditonton' :
              b.watchStatus === 'finished' ? 'Selesai' :
                b.watchStatus === 'dropped' ? 'Dropped' : 'Mau Nonton'}
          </span>
        </div>
      </div>
    </Link>
  );
}

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'history', label: 'History' },
];

function EditProfileModal({ profile, onSave, onClose }) {
  const { uploadPhoto } = useAuth();
  const [name, setName] = useState(profile?.displayName || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [photoURL, setPhotoURL] = useState(profile?.photoURL || '');
  const [preview, setPreview] = useState(profile?.photoURL || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setError('');
    setUploading(true);

    try {
      const url = await uploadPhoto(file);
      setPhotoURL(url);
      setPreview(url);
    } catch (err) {
      setError('Gagal upload foto: ' + err.message);
      setPreview(photoURL);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (name.trim().length < 2) { setError('Nama minimal 2 karakter'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave({ displayName: name.trim(), photoURL, bio });
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan profil');
    } finally {
      setSaving(false);
    }
  };

  const initials = name?.[0]?.toUpperCase() || '?';

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center px-4" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-surface-elevated border border-border-subtle rounded-2xl overflow-hidden animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        { }
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
          <h3 className="font-bold text-on-surface text-base">Edit Profil</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          { }
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-primary-stitch/50 bg-surface-container">
                {preview ? (
                  <img src={preview} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary-container/30 to-purple-900/50 flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">{initials}</span>
                  </div>
                )}
              </div>
              { }
              {uploading && (
                <div className="absolute inset-0 rounded-2xl bg-black/60 flex items-center justify-center">
                  <svg className="animate-spin w-6 h-6 text-white" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75" />
                  </svg>
                </div>
              )}
              { }
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-primary-container border-2 border-surface-elevated flex items-center justify-center hover:brightness-110 transition-colors disabled:opacity-50"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-3.5 h-3.5">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <p className="text-on-surface-variant text-[11px]">Ketuk ikon kamera untuk ganti foto</p>
          </div>

          { }
          <div>
            <label className="block text-on-surface-variant text-xs font-semibold mb-1.5">Nama Tampilan</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={50}
              placeholder="Masukkan nama..."
              className="w-full bg-surface-container border border-border-subtle rounded-xl px-3 py-2.5 text-on-surface text-sm outline-none focus:border-primary-stitch transition-colors placeholder-on-surface-variant"
            />
            <p className="text-on-surface-variant text-[10px] mt-1 text-right">{name.length}/50</p>
          </div>

          { }
          <div>
            <label className="block text-on-surface-variant text-xs font-semibold mb-1.5">Bio</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              maxLength={100}
              rows={2}
              placeholder="Tulis sesuatu tentang dirimu..."
              className="w-full bg-surface-container border border-border-subtle rounded-xl px-3 py-2.5 text-on-surface text-sm outline-none focus:border-primary-stitch transition-colors placeholder-on-surface-variant resize-none"
            />
            <p className="text-on-surface-variant text-[10px] mt-1 text-right">{bio.length}/100</p>
          </div>

          { }
          {error && (
            <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>
          )}
        </div>

        { }
        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border-subtle text-on-surface-variant text-sm font-semibold hover:border-primary-stitch/50 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="flex-1 py-2.5 rounded-xl bg-primary-container text-on-primary text-sm font-bold hover:brightness-110 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75" />
                </svg>
                Menyimpan...
              </>
            ) : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PublicProfile({ userId }) {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const tabsRef = useRef(null);

  const isOwn = user?.uid === userId;

  useEffect(() => {
    if (!userId) return;
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const [profileData, bookmarkData] = await Promise.all([
        getPublicProfile(userId),
        getPublicBookmarks(userId),
      ]);
      setProfile(profileData);
      setBookmarks(bookmarkData);
    } catch (err) {
      console.error('[PublicProfile] load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async ({ displayName, photoURL, bio }) => {
    const updated = await updateUserProfile(userId, { displayName, photoURL, bio });
    setProfile(prev => ({ ...prev, ...updated }));
    await refreshUser({ displayName, photoURL });
  };

  const stats = calcBookmarkStats(bookmarks);
  const total = bookmarks.length;

  const filtered = bookmarks;
  const tabCount = () => total;

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-deep flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary-container/30 border-t-primary-container rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile && !loading && bookmarks.length === 0) {
    return (
      <div className="min-h-screen bg-surface-deep">
        <Navbar />
        <div className="pt-24 flex flex-col items-center gap-4 text-center px-4">
          <div className="w-16 h-16 bg-surface-elevated rounded-full flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-on-surface-variant">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <p className="font-display text-xl text-on-surface-variant tracking-wider">PENGGUNA TIDAK DITEMUKAN</p>
          <p className="text-on-surface-variant text-sm">Profil ini tidak ada atau belum pernah login.</p>
          <Link href="/" className="mt-2 px-6 py-3 bg-primary-container text-on-primary font-bold rounded-xl text-sm">Kembali ke Beranda</Link>
        </div>
      </div>
    );
  }

  const displayName = profile?.displayName || 'Pengguna';
  const handle = `@${displayName.toLowerCase().replace(/\s+/g, '')}`;

  return (
    <div className="min-h-screen bg-surface-deep">
      <Navbar />

      {showEditProfile && (
        <EditProfileModal
          profile={profile}
          onSave={handleSaveProfile}
          onClose={() => setShowEditProfile(false)}
        />
      )}

      <main className="pt-20 pb-24 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mt-4">
          {/* === KIRI: Info Profil & Dompet === */}
          <div className="lg:col-span-5 space-y-6">

            {/* Profil Card */}
            <div className="relative bg-surface-elevated border border-border-subtle/30 rounded-2xl overflow-hidden shadow-lg shadow-black/20">
              {profile?.isPremium ? (
                <div className="absolute inset-0 bg-[url('https://media.giphy.com/media/xT9KVmINRKGsIzd0YM/giphy.gif')] bg-cover bg-center opacity-20 pointer-events-none mix-blend-screen" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary-container/5 via-transparent to-purple-900/10 pointer-events-none" />
              )}
              <div className="relative p-6 flex flex-col items-center text-center">
                { }
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-surface-container shadow-xl mb-3">
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-container/50 to-purple-900/80 flex items-center justify-center">
                      <span className="text-4xl font-bold text-white">{displayName[0]?.toUpperCase()}</span>
                    </div>
                  )}
                </div>

                { }
                <h1 className="font-display text-2xl text-on-surface tracking-wide leading-none">{displayName}</h1>
                <p className="text-on-surface-variant text-sm font-semibold mt-1">{handle}</p>

                { }
                <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-surface-container text-xs font-bold text-on-surface border border-border-subtle/40">
                    {profile?.isAdmin ? 'Admin' : profile?.isPremium ? 'Premium User' : 'Member Biasa'}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-surface-container text-xs font-bold text-on-surface border border-border-subtle/40">
                    Lvl. {calcUserLevel(profile?.stats?.totalReadingMinutes || 0)}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-surface-container text-xs font-bold text-on-surface-variant border border-border-subtle/40">
                    {getUserShortId(profile?._id || profile?.googleId || userId)}
                  </span>
                </div>

                <div className="mt-4 max-w-sm w-full">
                  <p className="text-on-surface-variant text-sm italic leading-relaxed">
                    {profile?.bio ? `"${profile.bio}"` : isOwn ? 'Belum ada bio. Klik edit untuk menambahkan.' : ''}
                  </p>
                  {isOwn && (
                    <button
                      onClick={() => setShowEditProfile(true)}
                      className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container text-on-surface text-xs font-bold hover:bg-surface-bright transition-colors"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                      Edit Profil
                    </button>
                  )}
                </div>

                { }
                <div className="mt-6 w-full pt-5 border-t border-border-subtle/30 flex items-center justify-between px-2">
                  <StatCard value={profile?.stats?.totalReadingMinutes || 0} label="Menit Menonton" color="text-primary-stitch" />
                  <div className="w-px h-10 bg-border-subtle/40" />
                  <StatCard
                    value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }) : 'Mar 2026'}
                    label="Bergabung"
                    color="text-on-surface"
                  />
                </div>
              </div>
            </div>

            {/* Riwayat Pembayaran Pending — tampil saat user adalah pemilik profil */}
            {isOwn && (
              <>
                <PendingOrdersBanner userId={userId} userUid={user?.uid} />
                <AniListProfileCard userUid={user?.uid} />
              </>
            )}
          </div>

          {/* === KANAN: Premium & Bookmarks === */}
          <div className="lg:col-span-7 space-y-6">

            {/* Donasi Section */}
            {isOwn && (
              <div className="mt-0">
                <DonationCard />
              </div>
            )}

            {/* Bookmarks */}
            <div className="bg-surface-elevated border border-border-subtle/30 rounded-2xl p-5 shadow-lg shadow-black/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-base text-on-surface tracking-widest">BOOKMARKS</h2>
                <span className="text-on-surface-variant text-xs font-semibold">{total} Anime</span>
              </div>
              <div ref={tabsRef} className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-4 -mx-1 px-1">
                {TABS.map(tab => {
                  const count = tabCount(tab.key);
                  return (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-1.5 flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${activeTab === tab.key ? 'bg-primary-container text-on-primary shadow-lg shadow-primary-container/30' : 'bg-surface-elevated border border-border-subtle text-on-surface-variant hover:border-primary-stitch/40 hover:text-on-surface'}`}
                    >
                      {tab.label}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === tab.key ? 'bg-white/20 text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}>{count}</span>
                    </button>
                  );
                })}
              </div>
              {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <div className="w-14 h-14 bg-surface-container rounded-full flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7 text-on-surface-variant"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" /></svg>
                  </div>
                  <p className="text-on-surface-variant font-semibold text-sm">Tidak ada anime di sini</p>
                  {isOwn && activeTab === 'all' && (
                    <Link href="/anime" className="mt-1 px-5 py-2.5 bg-primary-container text-on-primary font-bold rounded-xl text-sm hover:brightness-110 transition-colors">Jelajahi Anime</Link>
                  )}
                </div>
              )}
              {filtered.length > 0 && (
                <div className="flex flex-col gap-3">
                  {filtered.map(b => <AnimeCard key={b.slug} bookmark={b} />)}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
