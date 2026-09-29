'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { slugify } from '@/lib/slug';

// ─── Empty states ────────────────────────────────────────────────────────────
const emptyAnimeForm = {
  title: '',
  nativeTitle: '',
  slug: '',
  coverImage: '',
  type: 'Anime',
  rating: 0,
  views: 0,
  status: '',
  airDate: '',
  producer: '',
  studio: '',
  duration: '',
  totalEpisode: 0,
  synopsis: '',
  genres: '',
  sourceUrl: '',
};

const emptyEpisodeMeta = { title: '', slug: '', airDate: '' };

const emptyEpisodeDoc = {
  title: '',
  episodeSlug: '',
  episodeIndex: '',
  airDate: '',
  prevSlug: '',
  nextSlug: '',
  servers: [{ name: 'Server 1', url: '' }],
};

// ─── Small helpers ────────────────────────────────────────────────────────────
const inputCls = 'w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent-red/60 transition-colors min-w-0';
const labelCls = 'block text-xs text-text-muted mb-1';

function Field({ label, children }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('anime');

  // ── Anime list state ──────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [animeList, setAnimeList] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });

  // ── Anime form state ──────────────────────────────────────────────────────
  const [selectedSlug, setSelectedSlug] = useState('');
  const [form, setForm] = useState(emptyAnimeForm);
  const [episodeMetas, setEpisodeMetas] = useState([emptyEpisodeMeta]);
  const [saving, setSaving] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [formMsg, setFormMsg] = useState('');
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

  // ── Episode doc editor state ──────────────────────────────────────────────
  const [episodeDocs, setEpisodeDocs] = useState([]);         // all Episode docs for selected anime
  const [epDocsLoading, setEpDocsLoading] = useState(false);
  const [selectedEpSlug, setSelectedEpSlug] = useState('');  // which Episode doc is being edited
  const [epForm, setEpForm] = useState(emptyEpisodeDoc);
  const [epSaving, setEpSaving] = useState(false);
  const [epMsg, setEpMsg] = useState('');
  const [epIsNew, setEpIsNew] = useState(false);
  const [epScrapeUrl, setEpScrapeUrl] = useState('');
  const [epScraping, setEpScraping] = useState(false);

  // ── Users state ───────────────────────────────────────────────────────────
  const [usersPage, setUsersPage] = useState(1);
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersPagination, setUsersPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });

  // ── Comments state ────────────────────────────────────────────────────────
  const [commentsPage, setCommentsPage] = useState(1);
  const [commentsList, setCommentsList] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsSearch, setCommentsSearch] = useState('');
  const [commentsPagination, setCommentsPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });

  const isAdmin = useMemo(() => !!user?.isAdmin, [user]);

  // ── Load on tab / page change ─────────────────────────────────────────────
  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab === 'anime') loadAnimeList(page, appliedSearch);
    if (activeTab === 'users') loadUsersList(usersPage, usersSearch);
    if (activeTab === 'comments') loadCommentsList(commentsPage, commentsSearch);
  }, [isAdmin, activeTab, page, appliedSearch, usersPage, commentsPage]);

  // ── API loaders ───────────────────────────────────────────────────────────
  const loadAnimeList = async (pageValue = 1, searchValue = '') => {
    if (!user?.uid) return;
    setListLoading(true);
    const qs = new URLSearchParams({ page: String(pageValue), limit: '10' });
    if (searchValue.trim()) qs.set('q', searchValue.trim());
    try {
      const res = await fetch(`/api/admin/anime?${qs}`, { headers: { 'x-admin-uid': user.uid }, cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setAnimeList(data.data || []);
        setPagination(data.pagination || { currentPage: pageValue, totalPages: 1, totalItems: 0 });
      } else setFormMsg(data.message || 'Gagal memuat data');
    } catch { setFormMsg('Gagal memuat data'); }
    setListLoading(false);
  };

  const loadAnimeDetail = async (slug) => {
    if (!user?.uid || !slug) return;
    setDetailLoading(true);
    setFormMsg('');
    try {
      const res = await fetch(`/api/admin/anime/${slug}`, { headers: { 'x-admin-uid': user.uid }, cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.data) {
        const m = data.data;
        setSelectedSlug(m.slug);
        setForm({
          title: m.title || '',
          nativeTitle: m.nativeTitle || '',
          slug: m.slug || '',
          coverImage: m.coverImage || '',
          type: m.type || 'Anime',
          rating: m.rating || 0,
          views: m.views || 0,
          status: m.status || '',
          airDate: m.airDate || '',
          producer: m.producer || '',
          studio: m.studio || '',
          duration: m.duration || '',
          totalEpisode: m.totalEpisode || 0,
          synopsis: m.synopsis || '',
          genres: Array.isArray(m.genres) ? m.genres.join(', ') : '',
          sourceUrl: m.sourceUrl || '',
        });
        const getEpNum = (e) => parseInt((e.title || e.slug || '').replace(/\D+/g, ''), 10) || 0;
        const sortedMetas = m.episodes && m.episodes.length
          ? [...m.episodes].sort((a, b) => getEpNum(a) - getEpNum(b)).map(e => ({ title: e.title || '', slug: e.slug || '', airDate: e.airDate || '' }))
          : [emptyEpisodeMeta];
        setEpisodeMetas(sortedMetas);
        // Also load episode docs
        loadEpisodeDocs(m.slug);
      } else setFormMsg(data.message || 'Gagal memuat detail');
    } catch { setFormMsg('Gagal memuat detail'); }
    setDetailLoading(false);
  };

  const loadEpisodeDocs = async (animeSlug) => {
    if (!user?.uid || !animeSlug) return;
    setEpDocsLoading(true);
    setSelectedEpSlug('');
    setEpForm(emptyEpisodeDoc);
    setEpMsg('');
    try {
      const res = await fetch(`/api/admin/episodes/${animeSlug}`, { headers: { 'x-admin-uid': user.uid }, cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        const docs = data.data || [];
        docs.sort((a, b) => (a.episodeIndex ?? 0) - (b.episodeIndex ?? 0));
        setEpisodeDocs(docs);
      }
    } catch { /* silent */ }
    setEpDocsLoading(false);
  };

  const loadEpisodeDoc = async (animeSlug, epSlug) => {
    if (!user?.uid) return;
    setEpMsg('');
    try {
      const res = await fetch(`/api/admin/episodes/${animeSlug}/${epSlug}`, { headers: { 'x-admin-uid': user.uid }, cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.data) {
        const ep = data.data;

        let autoAirDate = ep.airDate || '';

        // Use episodeDocs (sorted by episodeIndex) for accurate prev/next
        setEpisodeDocs(currentDocs => {
          const sorted = [...currentDocs].sort((a, b) => (a.episodeIndex ?? 0) - (b.episodeIndex ?? 0));
          const currentIndex = sorted.findIndex(d => d.episodeSlug === ep.episodeSlug);

          const autoPrev = currentIndex > 0 ? sorted[currentIndex - 1].episodeSlug : '';
          const autoNext = currentIndex !== -1 && currentIndex < sorted.length - 1 ? sorted[currentIndex + 1].episodeSlug : '';
          const autoIndex = ep.episodeIndex ?? (currentIndex !== -1 ? currentIndex + 1 : '');

          // airDate from episodeMetas if available
          setEpisodeMetas(currentMetas => {
            const metaIdx = currentMetas.findIndex(m => m.slug === ep.episodeSlug);
            if (metaIdx !== -1) autoAirDate = currentMetas[metaIdx].airDate || autoAirDate;
            return currentMetas;
          });

          setSelectedEpSlug(ep.episodeSlug);
          setEpIsNew(false);
          setEpForm({
            title: ep.title || '',
            episodeSlug: ep.episodeSlug || '',
            episodeIndex: autoIndex,
            airDate: autoAirDate,
            prevSlug: autoPrev,
            nextSlug: autoNext,
            servers: ep.servers && ep.servers.length ? ep.servers : [{ name: 'Server 1', url: '' }],
          });

          return currentDocs;
        });
      }
    } catch { /* silent */ }
  };

  const loadUsersList = async (pageValue = 1, searchValue = '') => {
    if (!user?.uid) return;
    setUsersLoading(true);
    const qs = new URLSearchParams({ page: String(pageValue), limit: '20' });
    if (searchValue.trim()) qs.set('q', searchValue.trim());
    try {
      const res = await fetch(`/api/admin/users?${qs}`, { headers: { 'x-admin-uid': user.uid }, cache: 'no-store' });
      const data = await res.json();
      if (data.success) { setUsersList(data.data || []); setUsersPagination(data.pagination || {}); }
    } catch { /* silent */ }
    setUsersLoading(false);
  };

  const loadCommentsList = async (pageValue = 1, searchValue = '') => {
    if (!user?.uid) return;
    setCommentsLoading(true);
    const qs = new URLSearchParams({ page: String(pageValue), limit: '20' });
    if (searchValue.trim()) qs.set('q', searchValue.trim());
    try {
      const res = await fetch(`/api/admin/comments?${qs}`, { headers: { 'x-admin-uid': user.uid }, cache: 'no-store' });
      const data = await res.json();
      if (data.success) { setCommentsList(data.data || []); setCommentsPagination(data.pagination || {}); }
    } catch { /* silent */ }
    setCommentsLoading(false);
  };

  // ── Anime form handlers ───────────────────────────────────────────────────
  const handleFormChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleEpMetaChange = (idx, field, value) =>
    setEpisodeMetas(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e));

  const addEpMetaRow = () => setEpisodeMetas(prev => [...prev, emptyEpisodeMeta]);
  const removeEpMetaRow = (idx) => setEpisodeMetas(prev => prev.filter((_, i) => i !== idx));

  const resetAnimeForm = () => {
    setSelectedSlug('');
    setForm(emptyAnimeForm);
    setEpisodeMetas([emptyEpisodeMeta]);
    setFormMsg('');
    setEpisodeDocs([]);
    setSelectedEpSlug('');
    setEpForm(emptyEpisodeDoc);
    setEpMsg('');
  };

  const handleScrape = async () => {
    if (!scrapeUrl) return;
    setIsScraping(true);
    setFormMsg('');
    try {
      const res = await fetch('/api/admin/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-uid': user.uid },
        body: JSON.stringify({ url: scrapeUrl })
      });
      const data = await res.json();
      if (data.success) {
        const result = data.data;
        setForm(prev => ({
          ...prev,
          title: result.title || prev.title,
          nativeTitle: result.nativeTitle || prev.nativeTitle,
          coverImage: result.coverImage || prev.coverImage,
          type: result.type || prev.type,
          status: result.status || prev.status,
          airDate: result.airDate || prev.airDate,
          producer: result.producer || prev.producer,
          studio: result.studio || prev.studio,
          duration: result.duration || prev.duration,
          totalEpisode: result.totalEpisode !== undefined ? result.totalEpisode : prev.totalEpisode,
          rating: result.rating !== undefined ? result.rating : prev.rating,
          synopsis: result.synopsis || prev.synopsis,
          genres: result.genres?.length > 0 ? result.genres.join(', ') : prev.genres,
          sourceUrl: scrapeUrl
        }));

        if (result.episodes && result.episodes.length > 0) {
          // Keep existing episodes, merge new ones based on title
          setEpisodeMetas(prevMetas => {
            const newMetas = [...prevMetas];
            // Remove empty initial doc if it exists
            if (newMetas.length === 1 && !newMetas[0].title && !newMetas[0].slug) {
              newMetas.pop();
            }

            result.episodes.forEach(ep => {
              const exists = newMetas.some(m => m.title === ep.title);
              if (!exists) {
                newMetas.push({
                  title: ep.title,
                  slug: slugify(ep.title),
                  airDate: ep.airDate
                });
              }
            });
            return newMetas;
          });
        }
        setFormMsg('✓ Data berhasil diambil');
      } else {
        setFormMsg('Gagal scrape: ' + data.message);
      }
    } catch (err) {
      setFormMsg('Gagal scrape: ' + err.message);
    }
    setIsScraping(false);
  };

  const handleDeleteAnime = async () => {
    if (!selectedSlug) return;
    if (!confirm(`Hapus anime "${form.title || selectedSlug}" beserta seluruh episode-nya?`)) return;

    setSaving(true);
    setFormMsg('');

    try {
      const res = await fetch(`/api/admin/anime/${selectedSlug}`, {
        method: 'DELETE',
        headers: { 'x-admin-uid': user.uid }
      });
      const data = await res.json();
      if (data.success) {
        setFormMsg('✓ Anime berhasil dihapus');
        setTimeout(() => resetAnimeForm(), 1000);
        loadAnimeList(page, appliedSearch);
      } else {
        setFormMsg(data.message || 'Gagal menghapus anime');
      }
    } catch {
      setFormMsg('Gagal menghapus anime');
    }
    setSaving(false);
  };

  const handleSubmitAnime = async (e) => {
    e.preventDefault();
    if (!user?.uid) return;
    setSaving(true);
    setFormMsg('');

    const payload = {
      ...form,
      rating: Number(form.rating) || 0,
      views: Number(form.views) || 0,
      slug: form.slug || slugify(form.title),
      genres: (form.genres || '').split(',').map(g => g.trim()).filter(Boolean),
      episodes: episodeMetas
        .filter(e => e.title || e.slug)
        .map(e => ({ title: e.title || '', slug: e.slug || slugify(e.title), airDate: e.airDate || '' })),
    };

    const endpoint = selectedSlug ? `/api/admin/anime/${selectedSlug}` : '/api/admin/anime';
    const method = selectedSlug ? 'PUT' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-admin-uid': user.uid },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        const nextSlug = data.data?.slug || payload.slug;
        setFormMsg(selectedSlug ? '✓ Anime berhasil diperbarui' : '✓ Anime baru berhasil ditambahkan');
        setSelectedSlug(nextSlug);
        loadAnimeList(page, appliedSearch);
        loadEpisodeDocs(nextSlug);
      } else setFormMsg(data.message || 'Gagal menyimpan');
    } catch { setFormMsg('Gagal menyimpan'); }
    setSaving(false);
  };

  // ── Episode doc handlers ──────────────────────────────────────────────────
  const handleEpFormChange = (field, value) => {
    setEpForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'episodeSlug' || field === 'title') {
        const slugToCheck = field === 'episodeSlug' ? value : next.episodeSlug;
        const currentIndex = episodeMetas.findIndex(m => m.slug === slugToCheck);
        if (currentIndex !== -1) {
          if (field === 'episodeSlug') {
            next.title = episodeMetas[currentIndex].title || next.title;
          }
          next.airDate = episodeMetas[currentIndex].airDate || next.airDate;
          next.episodeIndex = currentIndex + 1;
          next.prevSlug = currentIndex > 0 ? episodeMetas[currentIndex - 1].slug : '';
          next.nextSlug = currentIndex < episodeMetas.length - 1 ? episodeMetas[currentIndex + 1].slug : '';
        }
      }
      return next;
    });
  };

  const handleServerChange = (idx, field, value) =>
    setEpForm(prev => ({ ...prev, servers: prev.servers.map((s, i) => i === idx ? { ...s, [field]: value } : s) }));

  const addServer = () => setEpForm(prev => ({ ...prev, servers: [...prev.servers, { name: `Server ${prev.servers.length + 1}`, url: '' }] }));
  const removeServer = (idx) => setEpForm(prev => ({ ...prev, servers: prev.servers.filter((_, i) => i !== idx) }));

  const startNewEpisodeDoc = () => {
    setSelectedEpSlug('');
    setEpIsNew(true);
    setEpMsg('');
    setEpForm(emptyEpisodeDoc);
  };

  const handleScrapeEpisode = async () => {
    if (!epScrapeUrl) return;
    setEpScraping(true);
    setEpMsg('');
    try {
      const res = await fetch('/api/admin/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-uid': user.uid },
        body: JSON.stringify({ url: epScrapeUrl })
      });
      const data = await res.json();
      if (data.success && data.type === 'episode') {
        const result = data.data;

        // Use the title to figure out which episode in metadata this matches
        const possibleSlug = slugify(result.episodeTitle);

        let autoPrev = '';
        let autoNext = '';
        let autoAirDate = result.airDate || '';
        let autoIndex = 0;

        // Find best match in metadata (by exact title, or by looking for "Episode X")
        let currentIndex = episodeMetas.findIndex(m => m.slug === possibleSlug || m.title === result.episodeTitle);

        if (currentIndex === -1) {
          // Try matching just the episode number if the title is something like "Anime Name Episode 3 Subtitle Indonesia"
          const match = result.episodeTitle.match(/Episode\s*(\d+)/i);
          if (match && match[1]) {
            const epNum = match[1];
            currentIndex = episodeMetas.findIndex(m =>
              m.title.toLowerCase().trim() === `episode ${epNum}` ||
              m.title.toLowerCase().trim() === `ep ${epNum}` ||
              m.title.toLowerCase().trim() === `eps ${epNum}`
            );
          }
        }

        let finalTitle = result.episodeTitle;
        let finalSlug = possibleSlug;

        if (currentIndex !== -1) {
          autoAirDate = episodeMetas[currentIndex].airDate || autoAirDate;
          autoIndex = currentIndex + 1;

          // Metadata items are usually sorted with Ep 1 at bottom, or Ep 1 at top. Let's make sure prev/next are logical
          // Usually Nekopoi arrays are recent first, so index 0 is newest. Let's strictly rely on array order.
          // Wait, the metadata list in DB `episodeMetas` could be any order.
          // In Nekopoi we reversed the array to be ascending [Ep 1, Ep 2, Ep 3].
          // So usually index - 1 is Prev (Ep 1), index + 1 is Next (Ep 3).
          autoPrev = currentIndex > 0 ? episodeMetas[currentIndex - 1].slug : '';
          autoNext = currentIndex < episodeMetas.length - 1 ? episodeMetas[currentIndex + 1].slug : '';

          // Override with the much cleaner title from metadata if we found a match
          finalTitle = episodeMetas[currentIndex].title;
          finalSlug = episodeMetas[currentIndex].slug;
        }

        setEpForm(prev => {
          const next = {
            ...prev,
            title: finalTitle || prev.title,
            episodeSlug: finalSlug || prev.episodeSlug,
            episodeIndex: autoIndex || prev.episodeIndex,
            airDate: autoAirDate || prev.airDate,
            prevSlug: autoPrev || prev.prevSlug,
            nextSlug: autoNext || prev.nextSlug,
            servers: result.servers?.length > 0 ? result.servers : prev.servers
          };

          // Re-evaluate next/prev dynamically just in case currentIndex logic failed, but we still have an explicit title match
          if (currentIndex !== -1 && finalSlug) {
            // Ensure they strictly grab from the current `episodeMetas` array context
            next.prevSlug = currentIndex > 0 ? episodeMetas[currentIndex - 1].slug : '';
            next.nextSlug = currentIndex < episodeMetas.length - 1 ? episodeMetas[currentIndex + 1].slug : '';
          }

          return next;
        });
        setEpMsg('✓ Data episode berhasil diambil');
      } else {
        setEpMsg('Gagal scrape: ' + (data.message || 'URL bukan episode'));
      }
    } catch (err) {
      setEpMsg('Gagal scrape: ' + err.message);
    }
    setEpScraping(false);
  };

  const handleSubmitEpisodeDoc = async (e) => {
    e.preventDefault();
    if (!user?.uid || !selectedSlug) return;
    setEpSaving(true);
    setEpMsg('');

    const payload = {
      title: epForm.title,
      episodeSlug: epForm.episodeSlug || slugify(epForm.title),
      episodeIndex: Number(epForm.episodeIndex) || 0,
      airDate: epForm.airDate || '',
      prevSlug: epForm.prevSlug || '',
      nextSlug: epForm.nextSlug || '',
      servers: epForm.servers.filter(s => s.url),
    };

    const isEditing = !epIsNew && selectedEpSlug;
    const endpoint = isEditing
      ? `/api/admin/episodes/${selectedSlug}/${selectedEpSlug}`
      : `/api/admin/episodes/${selectedSlug}`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-admin-uid': user.uid },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setEpMsg(isEditing ? '✓ Episode diperbarui' : '✓ Episode ditambahkan');
        setEpIsNew(false);
        setSelectedEpSlug(data.data?.episodeSlug || payload.episodeSlug);
        loadEpisodeDocs(selectedSlug);
      } else setEpMsg(data.message || 'Gagal menyimpan episode');
    } catch { setEpMsg('Gagal menyimpan episode'); }
    setEpSaving(false);
  };

  const handleDeleteEpisodeDoc = async (epSlug) => {
    if (!confirm(`Hapus episode "${epSlug}"?`)) return;
    if (!user?.uid || !selectedSlug) return;
    try {
      const res = await fetch(`/api/admin/episodes/${selectedSlug}/${epSlug}`, {
        method: 'DELETE',
        headers: { 'x-admin-uid': user.uid },
      });
      const data = await res.json();
      if (data.success) {
        if (selectedEpSlug === epSlug) { setSelectedEpSlug(''); setEpForm(emptyEpisodeDoc); }
        loadEpisodeDocs(selectedSlug);
        setEpMsg('✓ Episode dihapus');
      } else setEpMsg(data.message || 'Gagal hapus');
    } catch { setEpMsg('Gagal hapus'); }
  };

  // ── Users / comments handlers ─────────────────────────────────────────────
  const handleDeleteUser = async (userId) => {
    if (!confirm('Yakin ingin MENGHAPUS user ini beserta SELURUH komentarnya?')) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE', headers: { 'x-admin-uid': user.uid } });
      const data = await res.json();
      if (data.success) loadUsersList(usersPage, usersSearch);
      else alert('Gagal: ' + data.message);
    } catch { alert('Error menghapus user'); }
  };

  const handleUpdateUser = async (userId, updateFields) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-uid': user.uid },
        body: JSON.stringify(updateFields),
      });
      const data = await res.json();
      if (data.success) loadUsersList(usersPage, usersSearch);
      else alert('Gagal update: ' + data.message);
    } catch { alert('Error update user'); }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Yakin ingin MENGHAPUS komentar ini?')) return;
    try {
      const res = await fetch(`/api/admin/comments/${commentId}`, { method: 'DELETE', headers: { 'x-admin-uid': user.uid } });
      const data = await res.json();
      if (data.success) loadCommentsList(commentsPage, commentsSearch);
      else alert('Gagal: ' + data.message);
    } catch { alert('Error menghapus komentar'); }
  };

  // ── Guards ────────────────────────────────────────────────────────────────
  if (loading) return <div className="min-h-screen bg-bg-primary flex items-center justify-center text-white">Memuat...</div>;
  if (!user) return <div className="min-h-screen bg-bg-primary flex items-center justify-center text-white">Silakan login.</div>;
  if (!isAdmin) return <div className="min-h-screen bg-bg-primary flex items-center justify-center text-accent-red font-bold">Akses Ditolak. Hanya Admin.</div>;

  const tabIcon = { anime: 'movie', users: 'group', comments: 'forum' };
  const tabLabel = { anime: 'Anime', users: 'Users', comments: 'Komentar' };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-bg-primary flex">
      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <aside className="fixed left-0 top-0 h-full w-[260px] bg-bg-card border-r border-border flex flex-col py-6 z-50 hidden md:flex">
        {/* Logo */}
        <div className="px-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-red/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-accent-red text-lg">admin_panel_settings</span>
            </div>
            <div>
              <div className="font-bold text-white text-sm leading-none">Anitoki</div>
              <div className="text-text-muted text-[10px] uppercase tracking-widest">Admin Panel</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 space-y-0.5">
          {['anime', 'users', 'comments'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-r-full text-sm transition-colors cursor-pointer active:scale-95 text-left ${activeTab === tab
                ? 'text-accent-red bg-accent-red/10 border-l-4 border-accent-red'
                : 'text-text-secondary hover:bg-bg-elevated hover:text-white border-l-4 border-transparent'
                }`}
            >
              <span className="material-symbols-outlined text-[18px]">{tabIcon[tab]}</span>
              {tabLabel[tab]}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-2 mt-auto pt-4 border-t border-border space-y-0.5">
          <a href="/" className="flex items-center gap-3 px-4 py-3 text-text-secondary hover:bg-bg-elevated hover:text-white transition-colors rounded-r-full text-sm cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">home</span>
            Ke Beranda
          </a>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="flex-1 md:ml-[260px] flex flex-col min-h-screen">

        {/* ── Topbar ──────────────────────────────────────────────────────── */}
        <header className="fixed top-0 right-0 w-full md:w-[calc(100%-260px)] h-14 bg-bg-primary/80 backdrop-blur-md flex items-center justify-between px-4 md:px-6 border-b border-border z-40">
          <div className="flex items-center gap-3">
            {/* Mobile tab switcher */}
            <div className="flex gap-1 md:hidden">
              {['anime', 'users', 'comments'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${activeTab === tab ? 'bg-accent-red text-white' : 'bg-bg-elevated border border-border text-gray-400'}`}
                >
                  {tabLabel[tab]}
                </button>
              ))}
            </div>
            <div className="hidden md:block">
              <h1 className="text-sm font-bold text-white">{tabLabel[activeTab]}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user?.photoURL && (
              <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full border border-border object-cover" />
            )}
            <div className="hidden sm:block text-right">
              <div className="text-xs font-semibold text-white leading-none">{user?.displayName || 'Admin'}</div>
              <div className="text-[10px] text-text-muted">Administrator</div>
            </div>
          </div>
        </header>

        {/* ── Page content ────────────────────────────────────────────────── */}
        <main className="mt-14 p-4 md:p-6 flex-1 overflow-x-hidden">

          {/* ── ANIME TAB ─────────────────────────────────────────────────── */}
          {activeTab === 'anime' && (
            <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] xl:grid-cols-[260px_1fr_360px] gap-4">

              {/* Column 1 — Anime list */}
              <section className="bg-bg-card border border-border rounded-xl p-4 space-y-3 flex flex-col">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-white text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-accent-red text-[16px]">movie</span>
                    Data Anime
                  </h2>
                  <span className="text-xs text-text-muted bg-bg-elevated border border-border rounded-full px-2 py-0.5">{pagination.totalItems}</span>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); setPage(1); setAppliedSearch(searchTerm); }} className="flex gap-2">
                  <input
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Cari judul..."
                    className="flex-1 bg-bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent-red/60 transition-colors"
                  />
                  <button type="submit" className="px-3 py-2 bg-accent-red text-white text-sm rounded-lg hover:brightness-110 transition">Cari</button>
                </form>

                <button
                  type="button"
                  onClick={resetAnimeForm}
                  className="w-full text-xs py-2 px-3 rounded-lg border border-dashed border-border text-text-muted hover:border-accent-red hover:text-white transition-colors flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  Tambah Anime Baru
                </button>

                <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[40vh] lg:max-h-[500px] pr-1">
                  {listLoading && <div className="text-text-muted text-sm py-4 text-center animate-pulse">Memuat...</div>}
                  {!listLoading && animeList.length === 0 && <div className="text-text-muted text-sm py-4 text-center">Belum ada data.</div>}
                  {animeList.map(anime => (
                    <button
                      key={anime.slug}
                      type="button"
                      onClick={() => loadAnimeDetail(anime.slug)}
                      className={`w-full text-left bg-bg-elevated border rounded-xl px-3 py-2.5 hover:border-accent-red/60 transition-colors ${selectedSlug === anime.slug ? 'border-accent-red bg-accent-red/5' : 'border-border'}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm text-white truncate">{anime.title}</span>
                        <span className="text-[10px] text-text-muted flex-shrink-0 bg-bg-primary border border-border rounded-full px-1.5 py-0.5">{anime.episodeCount} ep</span>
                      </div>
                      <div className="text-xs text-text-muted mt-0.5">{anime.type} · {anime.status || '—'}</div>
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-text-muted pt-1">
                  <button type="button" onClick={() => page > 1 && setPage(p => p - 1)} disabled={page <= 1} className="px-3 py-1.5 rounded-lg bg-bg-elevated border border-border disabled:opacity-40 hover:border-accent-red/40 transition">Prev</button>
                  <span className="tabular-nums">{pagination.currentPage} / {pagination.totalPages}</span>
                  <button type="button" onClick={() => page < pagination.totalPages && setPage(p => p + 1)} disabled={page >= pagination.totalPages} className="px-3 py-1.5 rounded-lg bg-bg-elevated border border-border disabled:opacity-40 hover:border-accent-red/40 transition">Next</button>
                </div>
              </section>

              {/* Column 2 — Anime form */}
              <section className="bg-bg-card border border-border rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-accent-red text-[18px]">{selectedSlug ? 'edit' : 'add_circle'}</span>
                    {selectedSlug ? `Edit: ${form.title || selectedSlug}` : 'Tambah Anime'}
                  </h2>
                  {detailLoading && <span className="text-xs text-text-muted animate-pulse">Memuat detail...</span>}
                </div>

                {formMsg && (
                  <div className={`text-sm rounded-lg px-3 py-2 border flex items-center gap-2 ${formMsg.startsWith('✓') ? 'bg-green-900/30 border-green-700/40 text-green-300' : 'bg-bg-elevated border-border text-white'}`}>
                    <span className="material-symbols-outlined text-[16px]">{formMsg.startsWith('✓') ? 'check_circle' : 'info'}</span>
                    {formMsg}
                  </div>
                )}

                <div className="flex gap-2 items-center bg-bg-elevated p-3 border border-border rounded-xl">
                  <input
                    value={scrapeUrl}
                    onChange={e => setScrapeUrl(e.target.value)}
                    placeholder="URL Nekopoi / Otakudesu (contoh: https://otakudesu.blog/anime/...)"
                    className={`${inputCls} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={handleScrape}
                    disabled={isScraping || !scrapeUrl}
                    className="px-4 py-2 bg-pink-600 text-white font-semibold rounded-lg text-sm disabled:opacity-50 whitespace-nowrap hover:brightness-110 transition"
                  >
                    {isScraping ? 'Mengambil...' : 'Generate dari URL'}
                  </button>
                </div>

                <form onSubmit={handleSubmitAnime} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Field label="Judul *">
                      <input value={form.title} onChange={e => handleFormChange('title', e.target.value)} placeholder="Judul anime" required className={inputCls} />
                    </Field>
                    <Field label="Judul Native (JP)">
                      <input value={form.nativeTitle} onChange={e => handleFormChange('nativeTitle', e.target.value)} placeholder="例：進撃の巨人" className={inputCls} />
                    </Field>
                    <Field label="Slug (auto jika kosong)">
                      <input value={form.slug} onChange={e => handleFormChange('slug', e.target.value)} placeholder="slug-otomatis" className={inputCls} />
                    </Field>
                    <Field label="URL Cover">
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            value={form.coverImage}
                            onChange={e => handleFormChange('coverImage', e.target.value)}
                            placeholder="https://..."
                            className={`${inputCls} flex-1`}
                          />
                          <label className={`px-3 py-2 rounded-lg border border-border text-xs font-semibold cursor-pointer whitespace-nowrap transition
                            ${coverUploading ? 'opacity-50 cursor-not-allowed bg-bg-elevated text-text-secondary' : 'bg-bg-elevated text-white hover:border-pink-500'}`}>
                            {coverUploading ? 'Upload...' : '📁 Upload'}
                            <input
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                              disabled={coverUploading}
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setCoverUploading(true);
                                try {
                                  const fd = new FormData();
                                  fd.append('file', file);
                                  const res = await fetch('/api/admin/upload', {
                                    method: 'POST',
                                    headers: { 'x-admin-uid': user?.uid || '' },
                                    body: fd,
                                  });
                                  const data = await res.json();
                                  if (data.url) {
                                    handleFormChange('coverImage', data.url);
                                  } else {
                                    alert('Upload gagal: ' + (data.error || 'Unknown error'));
                                  }
                                } catch (err) {
                                  alert('Upload error: ' + err.message);
                                } finally {
                                  setCoverUploading(false);
                                  e.target.value = '';
                                }
                              }}
                            />
                          </label>
                        </div>
                        {form.coverImage && (
                          <div className="relative w-20 h-28 rounded-lg overflow-hidden border border-border bg-bg-elevated">
                            <img
                              src={form.coverImage}
                              alt="Cover preview"
                              className="w-full h-full object-cover"
                              onError={e => { e.target.style.display = 'none'; }}
                            />
                          </div>
                        )}
                      </div>
                    </Field>
                    <Field label="Tipe">
                      <select value={form.type} onChange={e => handleFormChange('type', e.target.value)} className={inputCls}>
                        {['Anime', 'TV', 'OVA', 'Movie', 'Series', 'Special'].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </Field>
                    <Field label="Status">
                      <select value={form.status} onChange={e => handleFormChange('status', e.target.value)} className={inputCls}>
                        <option value="">— Pilih status —</option>
                        {['Ongoing', 'Completed'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </Field>
                    <Field label="Tanggal Tayang">
                      <input value={form.airDate} onChange={e => handleFormChange('airDate', e.target.value)} placeholder="Oct 30, 2020" className={inputCls} />
                    </Field>
                    <Field label="Produser">
                      <input value={form.producer} onChange={e => handleFormChange('producer', e.target.value)} placeholder="Kodansha, Crunchyroll" className={inputCls} />
                    </Field>
                    <Field label="Studio">
                      <input value={form.studio} onChange={e => handleFormChange('studio', e.target.value)} placeholder="BUG FILMS" className={inputCls} />
                    </Field>
                    <Field label="Durasi per Episode">
                      <input value={form.duration} onChange={e => handleFormChange('duration', e.target.value)} placeholder="23 Menit" className={inputCls} />
                    </Field>
                    <Field label="Total Episode">
                      <input type="number" min="0" value={form.totalEpisode} onChange={e => handleFormChange('totalEpisode', e.target.value)} placeholder="0" className={inputCls} />
                    </Field>
                    <Field label="Rating">
                      <input type="number" step="0.01" min="0" max="10" value={form.rating} onChange={e => handleFormChange('rating', e.target.value)} placeholder="0.00" className={inputCls} />
                    </Field>
                    <Field label="Views">
                      <input type="number" min="0" value={form.views} onChange={e => handleFormChange('views', e.target.value)} placeholder="0" className={inputCls} />
                    </Field>
                    <Field label="Source URL (opsional, unik)">
                      <input value={form.sourceUrl} onChange={e => handleFormChange('sourceUrl', e.target.value)} placeholder="https://source.com/..." className={inputCls} />
                    </Field>
                  </div>

                  <Field label="Genre (pisahkan koma)">
                    <input value={form.genres} onChange={e => handleFormChange('genres', e.target.value)} placeholder="Action, Romance, Comedy" className={inputCls} />
                  </Field>

                  <Field label="Sinopsis">
                    <textarea value={form.synopsis} onChange={e => handleFormChange('synopsis', e.target.value)} placeholder="Deskripsi singkat..." className={`${inputCls} min-h-[90px] resize-y`} />
                  </Field>

                  {/* Episode metadata list */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px] text-text-muted">list</span>
                        Daftar Episode (metadata)
                      </h3>
                      <button type="button" onClick={addEpMetaRow} className="text-xs px-3 py-1.5 bg-bg-elevated border border-border rounded-lg text-white hover:border-accent-red transition flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">add</span>Episode
                      </button>
                    </div>
                    <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                      {episodeMetas.map((ep, idx) => (
                        <div key={idx} className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-start bg-bg-elevated border border-border rounded-lg p-2.5">
                          <input
                            value={ep.title}
                            onChange={e => handleEpMetaChange(idx, 'title', e.target.value)}
                            placeholder="Episode 1"
                            className="min-w-0 bg-bg-primary border border-border rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-accent-red/60 transition-colors"
                          />
                          <input
                            value={ep.slug}
                            onChange={e => handleEpMetaChange(idx, 'slug', e.target.value)}
                            placeholder="episode-1"
                            className="hidden sm:block min-w-0 bg-bg-primary border border-border rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-accent-red/60 transition-colors"
                          />
                          <input
                            value={ep.airDate}
                            onChange={e => handleEpMetaChange(idx, 'airDate', e.target.value)}
                            placeholder="Tgl tayang"
                            className="hidden sm:block min-w-0 bg-bg-primary border border-border rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-accent-red/60 transition-colors"
                          />
                          <button type="button" onClick={() => removeEpMetaRow(idx)} className="text-xs px-2 py-1.5 bg-accent-red/20 text-accent-red rounded-lg hover:bg-accent-red/40 transition">✕</button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
                    {selectedSlug ? (
                      <button type="button" onClick={handleDeleteAnime} disabled={saving} className="px-4 py-2 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded-lg text-sm hover:bg-accent-red/20 transition flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">delete</span>Hapus
                      </button>
                    ) : <div />}

                    <div className="flex gap-2">
                      <button type="button" onClick={resetAnimeForm} disabled={saving} className="px-4 py-2 bg-bg-elevated border border-border rounded-lg text-white text-sm hover:border-accent-red/40 transition">Reset</button>
                      <button type="submit" disabled={saving} className="px-5 py-2 bg-accent-red text-white font-semibold rounded-lg text-sm disabled:opacity-50 hover:brightness-110 transition flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">{saving ? 'hourglass_empty' : 'save'}</span>
                        {saving ? 'Menyimpan...' : selectedSlug ? 'Update' : 'Tambah'}
                      </button>
                    </div>
                  </div>
                </form>
              </section>

              {/* Column 3 — Episode doc editor */}
              <section className="bg-bg-card border border-border rounded-xl p-4 space-y-3 flex flex-col">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-white text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-accent-red text-[16px]">play_circle</span>
                    {selectedSlug ? 'Episode Docs' : 'Pilih anime dulu'}
                  </h2>
                  {selectedSlug && (
                    <button type="button" onClick={startNewEpisodeDoc} className="text-xs px-3 py-1.5 bg-bg-elevated border border-border rounded-lg text-white hover:border-accent-red transition flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">add</span>Baru
                    </button>
                  )}
                </div>

                {!selectedSlug && (
                  <p className="text-xs text-text-muted py-8 text-center">Klik anime di kiri untuk mengelola episode docs (server embed URL).</p>
                )}

                {selectedSlug && (
                  <>
                    {/* Episode doc list */}
                    <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1">
                      {epDocsLoading && <div className="text-text-muted text-xs py-2 text-center animate-pulse">Memuat...</div>}
                      {!epDocsLoading && episodeDocs.length === 0 && (
                        <div className="text-text-muted text-xs py-4 text-center">Belum ada episode doc.</div>
                      )}
                      {episodeDocs.map(ep => (
                        <div
                          key={ep.episodeSlug}
                          className={`flex items-center gap-2 rounded-lg px-2.5 py-2 border transition cursor-pointer ${selectedEpSlug === ep.episodeSlug && !epIsNew ? 'border-accent-red bg-accent-red/5' : 'border-border bg-bg-elevated hover:border-accent-red/40'}`}
                          onClick={() => loadEpisodeDoc(selectedSlug, ep.episodeSlug)}
                        >
                          <span className="material-symbols-outlined text-[14px] text-text-muted flex-shrink-0">play_arrow</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-white truncate">{ep.title || ep.episodeSlug}</div>
                            <div className="text-[10px] text-text-muted">{ep.servers?.length || 0} server</div>
                          </div>
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); handleDeleteEpisodeDoc(ep.episodeSlug); }}
                            className="flex-shrink-0 text-[10px] px-1.5 py-1 rounded bg-accent-red/10 text-accent-red hover:bg-accent-red/30 transition"
                          >✕</button>
                        </div>
                      ))}
                    </div>

                    {/* Episode doc form */}
                    {(epIsNew || selectedEpSlug) && (
                      <form onSubmit={handleSubmitEpisodeDoc} className="space-y-3 border-t border-border pt-3 flex-1 overflow-y-auto">
                        <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[13px] text-accent-red">{epIsNew ? 'add_circle' : 'edit'}</span>
                          {epIsNew ? 'Tambah Episode Doc Baru' : `Edit: ${selectedEpSlug}`}
                        </h3>

                        <div className="flex gap-2 items-center">
                          <input
                            value={epScrapeUrl}
                            onChange={e => setEpScrapeUrl(e.target.value)}
                            placeholder="URL NekoPoi Episode (opsional)"
                            className={`${inputCls} flex-1 text-xs`}
                          />
                          <button
                            type="button"
                            onClick={handleScrapeEpisode}
                            disabled={epScraping || !epScrapeUrl}
                            className="px-3 py-2 bg-pink-600 text-white font-semibold rounded-lg text-xs disabled:opacity-50 whitespace-nowrap hover:brightness-110 transition"
                          >
                            {epScraping ? '...' : 'Generate'}
                          </button>
                        </div>

                        {epMsg && (
                          <div className={`text-xs rounded-lg px-2.5 py-1.5 border flex items-center gap-1.5 ${epMsg.startsWith('✓') ? 'bg-green-900/30 border-green-700/40 text-green-300' : 'bg-bg-elevated border-border text-white'}`}>
                            <span className="material-symbols-outlined text-[13px]">{epMsg.startsWith('✓') ? 'check_circle' : 'info'}</span>
                            {epMsg}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className={labelCls}>Judul Episode</label>
                            <input value={epForm.title} onChange={e => handleEpFormChange('title', e.target.value)} placeholder="Episode 1" className={`${inputCls} text-xs`} />
                          </div>
                          <div>
                            <label className={labelCls}>Episode Slug</label>
                            <input value={epForm.episodeSlug} onChange={e => handleEpFormChange('episodeSlug', e.target.value)} placeholder="episode-1" className={`${inputCls} text-xs`} />
                          </div>
                          <div>
                            <label className={labelCls}>Index (urutan)</label>
                            <input type="number" value={epForm.episodeIndex} onChange={e => handleEpFormChange('episodeIndex', e.target.value)} placeholder="1" className={`${inputCls} text-xs`} />
                          </div>
                          <div>
                            <label className={labelCls}>Tgl Tayang</label>
                            <input value={epForm.airDate} onChange={e => handleEpFormChange('airDate', e.target.value)} placeholder="Jan 1, 2024" className={`${inputCls} text-xs`} />
                          </div>
                          <div>
                            <label className={labelCls}>Prev Slug</label>
                            <input value={epForm.prevSlug} onChange={e => handleEpFormChange('prevSlug', e.target.value)} placeholder="episode-sebelumnya" className={`${inputCls} text-xs`} />
                          </div>
                          <div>
                            <label className={labelCls}>Next Slug</label>
                            <input value={epForm.nextSlug} onChange={e => handleEpFormChange('nextSlug', e.target.value)} placeholder="episode-berikutnya" className={`${inputCls} text-xs`} />
                          </div>
                        </div>

                        {/* Servers */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className={`${labelCls} mb-0 flex items-center gap-1`}>
                              <span className="material-symbols-outlined text-[12px]">dns</span>Server Embed
                            </label>
                            <button type="button" onClick={addServer} className="text-[10px] px-2 py-1 bg-bg-elevated border border-border rounded text-white hover:border-accent-red transition flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-[11px]">add</span>Server
                            </button>
                          </div>
                          {epForm.servers.map((s, idx) => (
                            <div key={idx} className="flex gap-2 items-center min-w-0">
                              <input
                                value={s.name}
                                onChange={e => handleServerChange(idx, 'name', e.target.value)}
                                placeholder="Server 1"
                                className="w-20 sm:w-28 flex-shrink-0 bg-bg-elevated border border-border rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-accent-red/60 transition-colors"
                              />
                              <input
                                value={s.url}
                                onChange={e => handleServerChange(idx, 'url', e.target.value)}
                                placeholder="https://embed.example.com/..."
                                className="flex-1 min-w-0 bg-bg-elevated border border-border rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-accent-red/60 transition-colors"
                              />
                              <button type="button" onClick={() => removeServer(idx)} className="flex-shrink-0 text-xs px-1.5 py-1 bg-accent-red/10 text-accent-red rounded hover:bg-accent-red/30 transition">✕</button>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button type="button" onClick={() => { setSelectedEpSlug(''); setEpIsNew(false); setEpForm(emptyEpisodeDoc); setEpMsg(''); }} className="flex-1 py-2 bg-bg-elevated border border-border rounded-lg text-white text-xs hover:border-accent-red/40 transition">Batal</button>
                          <button type="submit" disabled={epSaving} className="flex-1 py-2 bg-accent-red text-white font-semibold rounded-lg text-xs disabled:opacity-50 hover:brightness-110 transition">
                            {epSaving ? 'Menyimpan...' : epIsNew ? 'Tambah' : 'Update'}
                          </button>
                        </div>
                      </form>
                    )}
                  </>
                )}
              </section>
            </div>
          )}

          {/* ── USERS TAB ─────────────────────────────────────────────────── */}
          {activeTab === 'users' && (
            <section className="bg-bg-card border border-border rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-accent-red text-[18px]">group</span>
                  Kelola Users
                </h2>
                <span className="text-xs text-text-muted bg-bg-elevated border border-border rounded-full px-2.5 py-0.5">{usersPagination.totalItems} users</span>
              </div>
              <form onSubmit={e => { e.preventDefault(); setUsersPage(1); loadUsersList(1, usersSearch); }} className="flex gap-2">
                <input value={usersSearch} onChange={e => setUsersSearch(e.target.value)} placeholder="Cari nama atau email..." className="flex-1 bg-bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent-red/60 transition-colors" />
                <button type="submit" className="px-3 py-2 bg-accent-red text-white text-sm rounded-lg hover:brightness-110 transition">Cari</button>
              </form>

              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left text-sm text-gray-300 min-w-[560px]">
                  <thead className="text-xs text-gray-500 uppercase bg-bg-elevated">
                    <tr>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3 whitespace-nowrap">Role</th>
                      <th className="px-4 py-3">Coins</th>
                      <th className="px-4 py-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {usersLoading && <tr><td colSpan="4" className="text-center py-6 text-text-muted animate-pulse">Memuat...</td></tr>}
                    {!usersLoading && usersList.length === 0 && <tr><td colSpan="4" className="text-center py-6 text-text-muted">Tidak ada data</td></tr>}
                    {usersList.map(u => (
                      <tr key={u._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-bold text-white truncate max-w-[180px]">{u.displayName}</div>
                          <div className="text-xs text-gray-500 truncate max-w-[180px]">{u.email}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {u.isAdmin
                            ? <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-semibold"><span className="material-symbols-outlined text-[11px]">shield</span>Admin</span>
                            : u.isPremium
                              ? <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-400 font-semibold"><span className="material-symbols-outlined text-[11px]">star</span>Premium</span>
                              : <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-bg-elevated text-text-muted">Member</span>
                          }
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-xs text-yellow-400">
                            <span className="material-symbols-outlined text-[12px]">monetization_on</span>
                            {u.coins || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5 flex-wrap">
                            <button onClick={() => handleUpdateUser(u._id, { isPremium: !u.isPremium })} className="text-xs px-2 py-1 bg-pink-500/10 text-pink-400 rounded-lg border border-pink-500/20 hover:bg-pink-500/20 transition whitespace-nowrap">
                              {u.isPremium ? 'Cabut Premium' : '+ Premium'}
                            </button>
                            <button onClick={() => handleUpdateUser(u._id, { isAdmin: !u.isAdmin })} className="text-xs px-2 py-1 bg-yellow-500/10 text-yellow-400 rounded-lg border border-yellow-500/20 hover:bg-yellow-500/20 transition whitespace-nowrap">
                              {u.isAdmin ? 'Cabut Admin' : '+ Admin'}
                            </button>
                            <button onClick={() => handleDeleteUser(u._id)} className="text-xs px-2 py-1 bg-accent-red/10 text-accent-red rounded-lg border border-accent-red/20 hover:bg-accent-red/20 transition">Hapus</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between text-xs text-text-muted">
                <button type="button" onClick={() => usersPage > 1 && setUsersPage(p => p - 1)} disabled={usersPage <= 1} className="px-3 py-2 rounded-lg bg-bg-elevated border border-border disabled:opacity-40 hover:border-accent-red/40 transition">Prev</button>
                <span className="tabular-nums">Hal {usersPagination.currentPage} / {usersPagination.totalPages}</span>
                <button type="button" onClick={() => usersPage < usersPagination.totalPages && setUsersPage(p => p + 1)} disabled={usersPage >= usersPagination.totalPages} className="px-3 py-2 rounded-lg bg-bg-elevated border border-border disabled:opacity-40 hover:border-accent-red/40 transition">Next</button>
              </div>
            </section>
          )}

          {/* ── COMMENTS TAB ──────────────────────────────────────────────── */}
          {activeTab === 'comments' && (
            <section className="space-y-4">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary-stitch text-[20px]">forum</span>
                    Kelola Komentar
                  </h2>
                  <p className="text-on-surface-variant text-xs mt-0.5">{commentsPagination.totalItems} total komentar</p>
                </div>
                <form onSubmit={e => { e.preventDefault(); setCommentsPage(1); loadCommentsList(1, commentsSearch); }} className="flex gap-2">
                  <input
                    value={commentsSearch}
                    onChange={e => setCommentsSearch(e.target.value)}
                    placeholder="Cari komentar, user, slug..."
                    className="flex-1 md:w-72 bg-surface-container border border-border-subtle/50 rounded-lg px-3 py-2 text-sm text-on-surface outline-none focus:border-primary-stitch/60 transition-colors placeholder-on-surface-variant/50"
                  />
                  <button type="submit" className="px-4 py-2 bg-primary-container text-on-primary text-sm rounded-lg hover:brightness-110 transition flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px]">search</span>
                    Cari
                  </button>
                </form>
              </div>

              {/* Comment list */}
              <div className="bg-surface-elevated border border-border-subtle/50 rounded-xl overflow-hidden">
                {/* Table header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-border-subtle/50 bg-surface-container/50">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Komentar</span>
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Aksi</span>
                </div>

                <div className="divide-y divide-border-subtle/30">
                  {commentsLoading && (
                    <div className="text-center py-10 text-on-surface-variant animate-pulse flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">hourglass_empty</span>
                      Memuat...
                    </div>
                  )}
                  {!commentsLoading && commentsList.length === 0 && (
                    <div className="text-center py-12 text-on-surface-variant flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-4xl opacity-30">chat_bubble</span>
                      <span className="text-sm">Tidak ada komentar</span>
                    </div>
                  )}
                  {commentsList.map(c => (
                    <div key={c._id} className="p-5 hover:bg-surface-variant/20 transition-colors group flex gap-4">
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-surface-container border border-border-subtle flex-shrink-0 overflow-hidden">
                        {c.photoURL ? (
                          <img src={c.photoURL} alt={c.displayName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary-container/30 text-on-surface font-bold text-sm">
                            {c.displayName?.[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1 gap-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-on-surface text-sm">{c.displayName}</span>
                            {c.isAdmin && (
                              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-status-expired/20 text-status-expired border border-status-expired/30">Admin</span>
                            )}
                            {c.isPremium && !c.isAdmin && (
                              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-status-pending/20 text-status-pending border border-status-pending/30">Premium</span>
                            )}
                            <span className="text-on-surface-variant text-xs flex items-center gap-1">
                              <span className="material-symbols-outlined text-[11px]">schedule</span>
                              {new Date(c.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          {/* Link to anime */}
                          <a
                            href={`/anime/${c.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container border border-border-subtle/50 text-on-surface-variant text-[11px] hover:border-primary-stitch/40 hover:text-primary-stitch transition-colors flex-shrink-0"
                          >
                            <span className="material-symbols-outlined text-[11px]">open_in_new</span>
                            {c.slug}
                          </a>
                        </div>

                        <p className="text-sm text-on-surface/80 line-clamp-2 leading-relaxed mb-3">{c.text}</p>

                        {/* Actions */}
                        <div className="flex items-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleDeleteComment(c._id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-status-expired/10 text-status-expired hover:bg-status-expired hover:text-surface-deep transition-colors text-xs font-semibold"
                          >
                            <span className="material-symbols-outlined text-[13px]">delete</span>
                            Hapus
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {commentsPagination.totalPages > 1 && (
                  <div className="border-t border-border-subtle/50 px-5 py-3 flex items-center justify-between bg-surface-container/30">
                    <span className="text-xs text-on-surface-variant tabular-nums">
                      Hal {commentsPagination.currentPage} / {commentsPagination.totalPages}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => commentsPage > 1 && setCommentsPage(p => p - 1)}
                        disabled={commentsPage <= 1}
                        className="px-3 py-1.5 rounded-lg bg-surface-elevated border border-border-subtle/50 text-on-surface-variant text-xs font-semibold disabled:opacity-40 hover:border-primary-stitch/40 hover:text-primary-stitch transition"
                      >
                        Prev
                      </button>
                      <button
                        type="button"
                        onClick={() => commentsPage < commentsPagination.totalPages && setCommentsPage(p => p + 1)}
                        disabled={commentsPage >= commentsPagination.totalPages}
                        className="px-3 py-1.5 rounded-lg bg-surface-elevated border border-border-subtle/50 text-on-surface-variant text-xs font-semibold disabled:opacity-40 hover:border-primary-stitch/40 hover:text-primary-stitch transition"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

        </main>
      </div>
    </div>
  );
}
