'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { calcUserLevel, getUserShortId } from '@/lib/profile';
import { useAuth } from '@/context/AuthContext';
const SITE_NAME_ENV = process.env.NEXT_PUBLIC_SITE_NAME || 'Komikcast';


function timeAgo(dateParam) {
  if (!dateParam) return '';
  const date = typeof dateParam === 'object' ? dateParam : new Date(dateParam);
  const todaysDate = new Date();
  const seconds = Math.round((todaysDate - date) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (seconds < 60) return `${seconds} detik lalu`;
  else if (minutes < 60) return `${minutes} menit lalu`;
  else if (hours < 24) return `${hours} jam lalu`;
  else return `${days} hari lalu`;
}

function CommentItem({ comment }) {
  const { user, text, createdAt } = comment;
  const isPremium = user?.isPremium;
  const isAdmin = user?.isAdmin;

  const RoleBadge = () => {
    if (isAdmin) {
      return (
        <span className="px-2 py-0.5 rounded-full border border-status-expired/40 text-white font-bold bg-status-expired/20 text-[10px] flex items-center gap-1">
          <span className="material-symbols-outlined" style={{ fontSize: 10 }}>shield</span>
          Admin
        </span>
      );
    }
    if (isPremium) {
      return (
        <span className="px-2 py-0.5 rounded-full border border-status-pending/40 text-white font-bold bg-status-pending/20 text-[10px] flex items-center gap-1">
          <span className="material-symbols-outlined" style={{ fontSize: 10 }}>star</span>
          Premium
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full border border-border-subtle/60 text-on-surface-variant font-bold text-[10px] bg-surface-bright/20">
        Member
      </span>
    );
  };

  const borderClass = isAdmin
    ? 'border-l-4 border-l-status-expired border-t border-r border-b border-border-subtle/30 bg-status-expired/5'
    : isPremium
      ? 'border-l-4 border-l-status-pending border-t border-r border-b border-border-subtle/30 bg-status-pending/5'
      : 'border border-border-subtle/40 hover:border-border-subtle/70 bg-surface-elevated/40';

  return (
    <div className={`relative overflow-hidden mb-4 rounded-xl transition-all duration-200 ${borderClass}`}>
      <div className="flex gap-4 p-4">
        {/* Avatar */}
        <Link href={`/user/${user?.id || user?.googleId}`} className="flex-shrink-0 mt-0.5">
          <div className={`w-10 h-10 rounded-full overflow-hidden bg-surface-container border-2 ${isAdmin ? 'border-status-expired/60' : isPremium ? 'border-status-pending/60' : 'border-border-subtle'}`}>
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary-container/30">
                <span className="text-on-surface font-bold text-sm">{user?.displayName?.[0]?.toUpperCase()}</span>
              </div>
            )}
          </div>
        </Link>

        {/* Content */}
        <div className="flex-1 w-full min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <Link
              href={`/user/${user?.id || user?.googleId}`}
              className={`font-bold text-sm transition-colors ${isAdmin ? 'text-status-expired hover:text-status-expired/80' : isPremium ? 'text-status-pending hover:text-status-pending/80' : 'text-on-surface hover:text-primary-stitch'}`}
            >
              {user?.displayName}
            </Link>
            <span className="text-border-subtle">·</span>
            <span className="text-on-surface-variant text-xs">{timeAgo(createdAt)}</span>
          </div>

          <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
            <span className="text-on-surface-variant text-[10px] font-semibold">Lvl. {calcUserLevel(user?.totalReadingMinutes || 0)}</span>
            <RoleBadge />
            <span className="text-border-subtle text-[10px] font-mono">{getUserShortId(user?.id)}</span>
          </div>

          <p className="text-sm text-on-surface/90 leading-relaxed break-words whitespace-pre-wrap">{text}</p>

          <div className="mt-3 flex items-center gap-3">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-variant/50 text-on-surface-variant hover:bg-primary-stitch/10 hover:text-primary-stitch transition-colors text-xs font-semibold">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>reply</span>
              Balas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CommentList({ slug, initialComments = [] }) {
  const { user } = useAuth();
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState('');
  const [showFab, setShowFab] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalItems, setTotalItems] = useState(0);

  const fetchComments = async (pageNum = 1, append = false) => {
    if (!slug) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/comments?slug=${encodeURIComponent(slug)}&page=${pageNum}&limit=20`);
      const json = await res.json();
      if (json.success) {
        setComments(prev => append ? [...prev, ...json.data] : json.data);
        setHasMore(pageNum < json.pagination.totalPages);
        setTotalItems(json.pagination.totalItems);
        setPage(pageNum);
      }
    } catch (err) {
      console.error('Gagal memuat komentar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    const handleScroll = () => setShowFab(window.scrollY > 500);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const loadNewComments = () => fetchComments(1);
  const loadMore = () => { if (!loading && hasMore) fetchComments(page + 1, true); };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user || sending) return;
    setSending(true);
    const optimistic = {
      id: `optimistic-${Date.now()}`,
      user: {
        id: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL,
        isPremium: user.isPremium,
        isAdmin: user.isAdmin,
        totalReadingMinutes: user.stats?.totalReadingMinutes || 0,
      },
      text: newComment.trim(),
      createdAt: new Date().toISOString(),
    };
    setComments(prev => [optimistic, ...prev]);
    setTotalItems(prev => prev + 1);
    setNewComment('');
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          userId: user.uid,
          displayName: user.displayName,
          photoURL: user.photoURL || '',
          isPremium: user.isPremium || false,
          isAdmin: user.isAdmin || false,
          totalReadingMinutes: user.stats?.totalReadingMinutes || 0,
          text: optimistic.text,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setComments(prev => prev.map(c => c.id === optimistic.id ? json.data : c));
      } else {
        setComments(prev => prev.filter(c => c.id !== optimistic.id));
        setTotalItems(prev => prev - 1);
        alert('Gagal mengirim komentar: ' + json.message);
      }
    } catch (err) {
      setComments(prev => prev.filter(c => c.id !== optimistic.id));
      setTotalItems(prev => prev - 1);
      alert('Gagal mengirim komentar. Cek koneksimu.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative mt-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-primary-stitch rounded-full" />
          <h3 className="font-display text-base text-on-surface font-black tracking-wide">
            KOMENTAR
            <span className="text-primary-stitch text-[10px] ml-2 bg-primary-stitch/10 px-2 py-0.5 rounded-full border border-primary-stitch/20">
              {totalItems}
            </span>
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowRules(!showRules)}
            className="px-2.5 py-1 bg-surface-elevated border border-border-subtle/50 hover:border-primary-stitch/40 text-on-surface-variant hover:text-primary-stitch text-[10px] font-bold rounded-lg transition-all flex items-center gap-1"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>info</span>
            {showRules ? 'Tutup' : 'Aturan'}
          </button>
          <button
            onClick={loadNewComments}
            className="px-2.5 py-1 bg-surface-elevated border border-border-subtle/50 hover:border-primary-stitch/40 text-on-surface-variant hover:text-primary-stitch text-[10px] font-bold rounded-lg transition-all flex items-center gap-1"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>refresh</span>
            Muat Ulang
          </button>
        </div>
      </div>

      {/* Rules panel */}
      {showRules && (
        <div className="mb-4 rounded-xl border border-status-pending/30 bg-status-pending/5 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 bg-status-pending/10 border-b border-status-pending/20">
            <span className="material-symbols-outlined text-status-pending" style={{ fontSize: 16 }}>warning</span>
            <span className="font-display text-[11px] font-bold text-status-pending tracking-wide">Rules Komentar {SITE_NAME_ENV}</span>
          </div>
          <div className="px-3 py-2.5 space-y-2 text-[11px]">
            {[
              { icon: '🚫', text: <><span className="text-status-expired font-bold">Dilarang Toxic, Rasis, atau menimbulkan kerusuhan!</span> Yang ikut kerusuhan bakal <span className="text-status-expired font-bold">kena ban juga!</span></> },
              { icon: '🐱', text: <span className="text-status-expired font-bold">Dilarang pakai photo profil cabul!</span> },
              { icon: '🔞', text: <span className="text-status-expired font-bold">Dilarang mengirim photo atau gif cabul/tidak senonoh!</span> },
              { icon: '🏛️', text: <span className="text-status-expired font-bold">DILARANG KOMENTAR SOAL POLITIK!!</span> },
              { icon: '📖', text: <span className="text-on-surface/80">Yang belum tau cara spoiler, tolong gunakan tag spoiler jika perlu.</span> },
              { icon: '😶', text: <><span className="text-status-expired font-bold">DILARANG SPOILER ENDING!!</span> <span className="text-on-surface/80">Hargai penonton lain.</span></> },
              { icon: '💬', text: <><span className="text-status-expired font-bold">DILARANG SPAM KOMENTAR!</span> <span className="text-on-surface/80">Yang spam emot tiap episode juga <span className="text-status-expired font-bold">kena ban!</span></span></> },
            ].map((r, i) => (
              <div key={i} className="flex gap-2">
                <span className="flex-shrink-0">{r.icon}</span>
                <p className="leading-relaxed">{r.text}</p>
              </div>
            ))}
            <div className="border-t border-status-pending/20 pt-2 space-y-1">
              <div className="flex gap-2">
                <span className="flex-shrink-0">🔖</span>
                <p className="text-on-surface/80 leading-relaxed"><span className="text-on-surface font-bold">Noted:</span> Yang melanggar <span className="text-status-expired font-bold">rules di atas akan langsung kena BAN! Tanpa peringatan!</span></p>
              </div>
              <div className="flex gap-2">
                <span className="flex-shrink-0">🔒</span>
                <p className="text-on-surface/80 leading-relaxed">Akun komentarmu akan <span className="text-status-expired font-bold">dibanned permanen</span> dan <span className="font-bold text-on-surface">tidak bisa balik lagi!!!</span></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comment input */}
      {user ? (
        <div className="mb-5 bg-surface-elevated border border-border-subtle/50 rounded-xl p-3 flex gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-surface-container border border-border-subtle mt-0.5">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary-container/30">
                <span className="text-on-surface font-bold text-xs">{user.displayName?.[0]?.toUpperCase()}</span>
              </div>
            )}
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Tulis komentar kamu di sini..."
              className="w-full bg-surface-container border border-border-subtle/50 rounded-lg px-3 py-2 text-[13px] text-on-surface placeholder-on-surface-variant/50 outline-none focus:border-primary-stitch/60 focus:ring-1 focus:ring-primary-stitch/20 resize-none transition-all"
              rows={2}
            />
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim() || sending}
              className="self-end flex items-center gap-1.5 px-4 py-1.5 bg-primary-container text-on-primary text-xs font-bold rounded-lg hover:brightness-110 disabled:opacity-40 transition-all shadow-sm"
            >
              {sending ? (
                <>
                  <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" /><path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" className="opacity-75" /></svg>
                  Mengirim...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>send</span>
                  Kirim
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-5 p-4 bg-surface-elevated border border-border-subtle/50 rounded-xl text-center">
          <p className="text-xs text-on-surface-variant mb-3">Silakan login untuk memberikan komentar.</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary-container text-on-primary text-[11px] font-bold rounded-lg hover:brightness-110 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>login</span>
            Login
          </Link>
        </div>
      )}

      {/* Comment list */}
      <div className="flex flex-col">
        {loading && comments.length === 0 ? (
          <div className="flex flex-col gap-3 py-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3 animate-pulse bg-surface-elevated/30 rounded-xl p-4">
                <div className="w-10 h-10 rounded-full bg-surface-bright flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-surface-bright rounded w-1/3" />
                  <div className="h-3 bg-surface-bright/70 rounded w-full" />
                  <div className="h-3 bg-surface-bright/70 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length > 0 ? (
          <>
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
            {hasMore && (
              <button
                onClick={loadMore}
                disabled={loading}
                className="mt-2 w-full py-2.5 rounded-xl border border-border-subtle/50 text-on-surface-variant text-xs font-bold hover:border-primary-stitch/40 hover:text-primary-stitch transition-colors disabled:opacity-50"
              >
                {loading ? 'Memuat...' : 'Muat Lebih Banyak'}
              </button>
            )}
          </>
        ) : (
          <div className="text-center py-10">
            <span className="material-symbols-outlined text-on-surface-variant/30 text-4xl block mb-2">chat_bubble</span>
            <p className="text-on-surface-variant text-sm">Belum ada komentar. Jadilah yang pertama!</p>
          </div>
        )}
      </div>

      {/* FAB scroll to top */}
      {showFab && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 w-11 h-11 bg-primary-container text-on-primary rounded-full shadow-xl flex items-center justify-center hover:brightness-110 hover:-translate-y-1 transition-all z-50 animate-fade-in"
          aria-label="Scroll to top"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_upward</span>
        </button>
      )}
    </div>
  );
}
