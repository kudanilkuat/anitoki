'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { slugify } from '@/lib/slug';

// ─── Empty states ────────────────────────────────────────────────────────────
const emptyAnimeForm = {
  title: '',
  nativeTitle: '',
  englishTitle: '',
  romajiTitle: '',
  slug: '',
  coverImage: '',
  bannerImage: '',
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
  synopsisEn: '',
  genres: '',
  sourceUrl: '',
  anilistId: '',
  malId: '',
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

// ─── Styling constants ───────────────────────────────────────────────────────
const inputCls = 'w-full bg-surface-container border border-border-subtle/50 rounded-xl px-3.5 py-2.5 text-sm text-on-surface placeholder-on-surface-variant/40 outline-none focus:border-primary-stitch focus:ring-1 focus:ring-primary-stitch/30 transition-all min-w-0';
const labelCls = 'block text-xs font-semibold text-on-surface-variant mb-1.5';

function Field({ label, required, children, className = '' }) {
  return (
    <div className={className}>
      <label className={labelCls}>
        {label}
        {required && <span className="text-status-expired ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('anime'); // 'anime' | 'users' | 'comments'
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Anime state ───────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [animeList, setAnimeList] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [animeFilterStatus, setAnimeFilterStatus] = useState('all'); // 'all' | 'Ongoing' | 'Completed'

  // ── Anime editor state ────────────────────────────────────────────────────
  const [animeSubTab, setAnimeSubTab] = useState('info'); // 'info' | 'episodes' | 'metadata'
  const [selectedSlug, setSelectedSlug] = useState('');
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'editor' (for mobile screens)
  const [form, setForm] = useState(emptyAnimeForm);
  const [episodeMetas, setEpisodeMetas] = useState([emptyEpisodeMeta]);
  const [saving, setSaving] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [formMsg, setFormMsg] = useState('');
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [isSyncingAnilist, setIsSyncingAnilist] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

  // ── Episode doc editor state ──────────────────────────────────────────────
  const [episodeDocs, setEpisodeDocs] = useState([]);
  const [epDocsLoading, setEpDocsLoading] = useState(false);
  const [selectedEpSlug, setSelectedEpSlug] = useState('');
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
  const [commentsStatus, setCommentsStatus] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [commentsCounts, setCommentsCounts] = useState({ all: 0, pending: 0, approved: 0, rejected: 0 });
  const [commentsPagination, setCommentsPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [moderatingId, setModeratingId] = useState(null);

  const isAdmin = useMemo(() => !!user?.isAdmin, [user]);

  // ── Load on tab / page change ─────────────────────────────────────────────
  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab === 'anime') loadAnimeList(page, appliedSearch);
    if (activeTab === 'users') loadUsersList(usersPage, usersSearch);
    if (activeTab === 'comments') loadCommentsList(commentsPage, commentsSearch, commentsStatus);
  }, [isAdmin, activeTab, page, appliedSearch, usersPage, commentsPage, commentsStatus]);

  // ── API loaders ───────────────────────────────────────────────────────────
  const loadAnimeList = async (pageValue = 1, searchValue = '') => {
    if (!user?.uid) return;
    setListLoading(true);
    const qs = new URLSearchParams({ page: String(pageValue), limit: '15' });
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
    setMobileView('editor');
    try {
      const res = await fetch(`/api/admin/anime/${slug}`, { headers: { 'x-admin-uid': user.uid }, cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.data) {
        const m = data.data;
        setSelectedSlug(m.slug);
        setForm({
          title: m.title || '',
          nativeTitle: m.nativeTitle || '',
          englishTitle: m.englishTitle || '',
          romajiTitle: m.romajiTitle || '',
          slug: m.slug || '',
          coverImage: m.coverImage || '',
          bannerImage: m.bannerImage || '',
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
          synopsisEn: m.synopsisEn || '',
          genres: Array.isArray(m.genres) ? m.genres.join(', ') : '',
          sourceUrl: m.sourceUrl || '',
          anilistId: m.anilistId || '',
          malId: m.malId || '',
        });
        const getEpNum = (e) => parseInt((e.title || e.slug || '').replace(/\D+/g, ''), 10) || 0;
        const sortedMetas = m.episodes && m.episodes.length
          ? [...m.episodes].sort((a, b) => getEpNum(a) - getEpNum(b)).map(e => ({ title: e.title || '', slug: e.slug || '', airDate: e.airDate || '' }))
          : [emptyEpisodeMeta];
        setEpisodeMetas(sortedMetas);
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

        setEpisodeDocs(currentDocs => {
          const sorted = [...currentDocs].sort((a, b) => (a.episodeIndex ?? 0) - (b.episodeIndex ?? 0));
          const currentIndex = sorted.findIndex(d => d.episodeSlug === ep.episodeSlug);
          const autoPrev = currentIndex > 0 ? sorted[currentIndex - 1].episodeSlug : '';
          const autoNext = currentIndex !== -1 && currentIndex < sorted.length - 1 ? sorted[currentIndex + 1].episodeSlug : '';
          const autoIndex = ep.episodeIndex ?? (currentIndex !== -1 ? currentIndex + 1 : '');

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

  const loadCommentsList = async (pageValue = 1, searchValue = '', statusValue = commentsStatus) => {
    if (!user?.uid) return;
    setCommentsLoading(true);
    const qs = new URLSearchParams({ page: String(pageValue), limit: '20' });
    if (searchValue.trim()) qs.set('q', searchValue.trim());
    if (statusValue && statusValue !== 'all') qs.set('status', statusValue);
    try {
      const res = await fetch(`/api/admin/comments?${qs}`, { headers: { 'x-admin-uid': user.uid }, cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setCommentsList(data.data || []);
        setCommentsPagination(data.pagination || {});
        if (data.counts) setCommentsCounts(data.counts);
      }
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
    setAnimeSubTab('info');
    setMobileView('editor');
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
          englishTitle: result.englishTitle || prev.englishTitle,
          romajiTitle: result.romajiTitle || prev.romajiTitle,
          coverImage: result.coverImage || prev.coverImage,
          bannerImage: result.bannerImage || prev.bannerImage,
          type: result.type || prev.type,
          status: result.status || prev.status,
          airDate: result.airDate || prev.airDate,
          producer: result.producer || prev.producer,
          studio: result.studio || prev.studio,
          duration: result.duration || prev.duration,
          totalEpisode: result.totalEpisode !== undefined ? result.totalEpisode : prev.totalEpisode,
          rating: result.rating !== undefined ? result.rating : prev.rating,
          synopsis: result.synopsis || prev.synopsis,
          synopsisEn: result.synopsisEn || prev.synopsisEn,
          genres: result.genres?.length > 0 ? (Array.isArray(result.genres) ? result.genres.join(', ') : result.genres) : prev.genres,
          anilistId: result.anilistId || prev.anilistId,
          malId: result.malId || prev.malId,
          sourceUrl: scrapeUrl
        }));

        if (result.episodes && result.episodes.length > 0) {
          setEpisodeMetas(prevMetas => {
            const newMetas = [...prevMetas];
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
        setFormMsg('✓ Data anime berhasil diambil secara otomatis & diperkaya dengan AniList!');
      } else {
        setFormMsg('Gagal scrape: ' + data.message);
      }
    } catch (err) {
      setFormMsg('Gagal scrape: ' + err.message);
    }
    setIsScraping(false);
  };

  const handleSyncAnilist = async () => {
    if (!form.title && !form.slug && !selectedSlug) {
      setFormMsg('Masukkan judul anime atau pilih anime terlebih dahulu');
      return;
    }
    setIsSyncingAnilist(true);
    setFormMsg('');
    try {
      const slugToSync = selectedSlug || form.slug;
      if (slugToSync) {
        const res = await fetch('/api/admin/anime/sync-anilist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-uid': user.uid },
          body: JSON.stringify({ slug: slugToSync, overwriteCover: false })
        });
        const data = await res.json();
        if (data.success && data.data) {
          const u = data.data;
          setForm(prev => ({
            ...prev,
            title: u.title || prev.title,
            nativeTitle: u.nativeTitle || prev.nativeTitle,
            englishTitle: u.englishTitle || prev.englishTitle,
            romajiTitle: u.romajiTitle || prev.romajiTitle,
            slug: u.slug || prev.slug,
            coverImage: u.coverImage || prev.coverImage,
            bannerImage: u.bannerImage || prev.bannerImage,
            type: u.type || prev.type,
            rating: u.rating !== undefined ? u.rating : prev.rating,
            status: u.status || prev.status,
            airDate: u.airDate || prev.airDate,
            producer: u.producer || prev.producer,
            studio: u.studio || prev.studio,
            duration: u.duration || prev.duration,
            totalEpisode: u.totalEpisode !== undefined ? u.totalEpisode : prev.totalEpisode,
            synopsis: u.synopsis || prev.synopsis,
            synopsisEn: u.synopsisEn || prev.synopsisEn,
            genres: Array.isArray(u.genres) ? u.genres.join(', ') : (u.genres || prev.genres),
            anilistId: u.anilistId || prev.anilistId,
            malId: u.malId || prev.malId,
          }));
          setFormMsg(`✓ ${data.message}`);
          loadAnimeList(page, appliedSearch);
        } else {
          setFormMsg('Gagal sync AniList: ' + (data.message || 'Tidak ditemukan'));
        }
      } else {
        // Query preview by title
        const res = await fetch(`/api/admin/anime/sync-anilist?q=${encodeURIComponent(form.title)}`, {
          headers: { 'x-admin-uid': user.uid }
        });
        const data = await res.json();
        if (data.success && data.data?.length > 0) {
          const top = data.data[0];
          setForm(prev => ({
            ...prev,
            nativeTitle: top.title?.native || prev.nativeTitle,
            englishTitle: top.title?.english || prev.englishTitle,
            romajiTitle: top.title?.romaji || prev.romajiTitle,
            bannerImage: top.bannerImage || prev.bannerImage,
            coverImage: prev.coverImage || top.coverImage?.extraLarge || top.coverImage?.large || '',
            rating: top.averageScore ? parseFloat((top.averageScore / 10).toFixed(2)) : prev.rating,
            type: top.format === 'TV' || top.format === 'TV_SHORT' ? 'TV' : (top.format === 'MOVIE' ? 'Movie' : (top.format === 'OVA' ? 'OVA' : prev.type)),
            genres: top.genres?.length > 0 ? top.genres.join(', ') : prev.genres,
            duration: top.duration ? `${top.duration} Menit` : prev.duration,
            totalEpisode: top.episodes || prev.totalEpisode,
            anilistId: top.id,
            malId: top.idMal || '',
          }));
          setFormMsg(`✓ Berhasil mengambil data AniList: "${top.title?.romaji || top.title?.english}"!`);
        } else {
          setFormMsg('Tidak ada kecocokan anime di AniList untuk judul tersebut');
        }
      }
    } catch (err) {
      setFormMsg('Gagal sync AniList: ' + err.message);
    }
    setIsSyncingAnilist(false);
  };

  const handleDeleteAnime = async () => {
    if (!selectedSlug) return;
    if (!confirm(`Hapus anime "${form.title || selectedSlug}" beserta seluruh data episode-nya?`)) return;

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
        setFormMsg(selectedSlug ? '✓ Anime berhasil diperbarui!' : '✓ Anime baru berhasil ditambahkan!');
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
        if (result.episodeTitle) {
          result.episodeTitle = result.episodeTitle
            .replace(/\[\s*NEW\s+Release\s*\]/gi, '')
            .replace(/\[\s*4K\s*\]/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
        }
        const possibleSlug = slugify(result.episodeTitle);
        let autoPrev = '';
        let autoNext = '';
        let autoAirDate = result.airDate || '';
        let autoIndex = 0;

        let currentIndex = episodeMetas.findIndex(m => m.slug === possibleSlug || m.title === result.episodeTitle);
        if (currentIndex === -1) {
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
          autoPrev = currentIndex > 0 ? episodeMetas[currentIndex - 1].slug : '';
          autoNext = currentIndex < episodeMetas.length - 1 ? episodeMetas[currentIndex + 1].slug : '';
          finalTitle = episodeMetas[currentIndex].title;
          finalSlug = episodeMetas[currentIndex].slug;
        }

        setEpForm(prev => ({
          ...prev,
          title: finalTitle || prev.title,
          episodeSlug: finalSlug || prev.episodeSlug,
          episodeIndex: autoIndex || prev.episodeIndex,
          airDate: autoAirDate || prev.airDate,
          prevSlug: autoPrev || prev.prevSlug,
          nextSlug: autoNext || prev.nextSlug,
          servers: result.servers?.length > 0 ? result.servers : prev.servers
        }));
        setEpMsg('✓ Data episode berhasil diekstrak!');
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
        setEpMsg(isEditing ? '✓ Episode diperbarui!' : '✓ Episode ditambahkan!');
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

  // ── Users handlers ────────────────────────────────────────────────────────
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

  // ── Comments handlers ─────────────────────────────────────────────────────
  const handleDeleteComment = async (commentId) => {
    if (!confirm('Yakin ingin MENGHAPUS komentar ini?')) return;
    try {
      const res = await fetch(`/api/admin/comments/${commentId}`, { method: 'DELETE', headers: { 'x-admin-uid': user.uid } });
      const data = await res.json();
      if (data.success) loadCommentsList(commentsPage, commentsSearch, commentsStatus);
      else alert('Gagal: ' + data.message);
    } catch { alert('Error menghapus komentar'); }
  };

  const handleUpdateCommentStatus = async (commentId, newStatus) => {
    if (!user?.uid || moderatingId) return;
    setModeratingId(commentId);
    try {
      const res = await fetch(`/api/admin/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-uid': user.uid,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setCommentsList(prev => prev.map(c => c._id === commentId ? { ...c, status: newStatus } : c));
        loadCommentsList(commentsPage, commentsSearch, commentsStatus);
      } else {
        alert('Gagal update status: ' + data.message);
      }
    } catch {
      alert('Error saat mengubah status komentar');
    } finally {
      setModeratingId(null);
    }
  };

  // Filtered anime list for client-side quick filter
  const filteredAnimeList = useMemo(() => {
    if (animeFilterStatus === 'all') return animeList;
    return animeList.filter(a => a.status?.toLowerCase() === animeFilterStatus.toLowerCase());
  }, [animeList, animeFilterStatus]);

  // ── Guards ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-surface-deep flex flex-col items-center justify-center text-on-surface gap-3">
        <div className="w-10 h-10 border-4 border-primary-stitch border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold animate-pulse">Memuat Admin Panel Anitoki...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-surface-deep flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-surface-elevated border border-border-subtle p-8 rounded-2xl text-center shadow-2xl">
          <span className="material-symbols-outlined text-status-expired text-5xl mb-3">lock</span>
          <h2 className="text-xl font-bold text-on-surface mb-2">Autentikasi Diperlukan</h2>
          <p className="text-sm text-on-surface-variant mb-6">Silakan login dengan akun administrator untuk mengakses panel ini.</p>
          <a href="/login" className="inline-block px-6 py-2.5 bg-primary-container text-on-primary font-bold rounded-xl hover:brightness-110 transition shadow-lg shadow-primary-container/20">
            Login Sekarang
          </a>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-surface-deep flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-surface-elevated border border-status-expired/30 p-8 rounded-2xl text-center shadow-2xl">
          <span className="material-symbols-outlined text-status-expired text-5xl mb-3">shield_person</span>
          <h2 className="text-xl font-bold text-on-surface mb-2">Akses Ditolak</h2>
          <p className="text-sm text-on-surface-variant mb-6">Akun Anda ({user.email}) tidak memiliki hak akses administrator.</p>
          <a href="/" className="inline-block px-6 py-2.5 bg-surface-container border border-border-subtle text-on-surface font-bold rounded-xl hover:bg-surface-bright transition">
            Kembali ke Beranda
          </a>
        </div>
      </div>
    );
  }

  const tabIcon = { anime: 'movie', users: 'group', comments: 'forum' };
  const tabLabel = { anime: 'Kelola Anime', users: 'Pengguna', comments: 'Moderasi Komentar' };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-surface-deep text-on-surface flex flex-col">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <aside className={`fixed top-0 left-0 h-full w-[260px] bg-surface-elevated/95 backdrop-blur-md border-r border-border-subtle/50 flex flex-col py-5 z-50 transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        {/* Brand Header */}
        <div className="px-6 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-container to-primary-stitch flex items-center justify-center shadow-md shadow-primary-container/20">
              <span className="material-symbols-outlined text-on-primary text-xl">admin_panel_settings</span>
            </div>
            <div>
              <div className="font-display font-black text-white text-base tracking-wide flex items-center gap-1.5">
                <span>ANITOKI</span>
                <span className="text-[10px] bg-primary-stitch/20 text-primary-stitch px-1.5 py-0.2 rounded font-bold">PRO</span>
              </div>
              <div className="text-on-surface-variant text-[10px] uppercase font-bold tracking-wider">Admin Studio</div>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-on-surface-variant hover:text-white p-1"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="px-3 mb-2">
          <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-wider px-3">Menu Utama</span>
        </div>
        <nav className="flex-1 px-3 space-y-1.5">
          {[
            { key: 'anime', label: 'Kelola Anime', icon: 'movie' },
            { key: 'users', label: 'Pengguna', icon: 'group', count: usersPagination.totalItems },
            { key: 'comments', label: 'Moderasi Komentar', icon: 'forum', count: commentsCounts.pending, isPendingBadge: commentsCounts.pending > 0 },
          ].map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-primary-container text-on-primary shadow-lg shadow-primary-container/20 font-bold'
                    : 'text-on-surface-variant hover:bg-surface-bright/40 hover:text-on-surface'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[19px]">{tab.icon}</span>
                  <span>{tab.label}</span>
                </div>
                {tab.count !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : tab.isPendingBadge
                        ? 'bg-status-pending text-surface-deep animate-pulse font-black'
                        : 'bg-surface-container text-on-surface-variant'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Bottom / Quick Link */}
        <div className="px-3 pt-4 border-t border-border-subtle/40 space-y-2 mt-auto">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3.5 py-2.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-bright/40 rounded-xl text-xs font-semibold transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[17px]">open_in_new</span>
              <span>Buka Website</span>
            </div>
            <span className="text-[10px] font-mono opacity-60">anitoki</span>
          </a>

          <div className="p-3 bg-surface-container/60 border border-border-subtle/40 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-container/20 border border-border-subtle flex-shrink-0">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-xs text-primary-stitch">
                  {user?.displayName?.[0] || 'A'}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-on-surface truncate">{user?.displayName || 'Admin'}</div>
              <div className="text-[10px] text-status-active font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-status-active animate-pulse" />
                Super Admin
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ──────────────────────────────────────────────── */}
      <div className="flex-1 md:ml-[260px] flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 h-16 bg-surface-deep/80 backdrop-blur-md border-b border-border-subtle/50 flex items-center justify-between px-4 md:px-8 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-1 text-on-surface-variant hover:text-white rounded-xl bg-surface-elevated md:hidden border border-border-subtle/50"
            >
              <span className="material-symbols-outlined text-[20px]">menu</span>
            </button>
            <div>
              <div className="text-[10px] text-on-surface-variant/80 font-bold uppercase tracking-wider">Admin Dashboard</div>
              <h1 className="text-base md:text-lg font-display font-black text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-stitch text-[20px]">{tabIcon[activeTab]}</span>
                {tabLabel[activeTab]}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {activeTab === 'comments' && commentsCounts.pending > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-status-pending/10 border border-status-pending/30 rounded-full text-status-pending text-xs font-bold animate-pulse">
                <span className="material-symbols-outlined text-[14px]">hourglass_top</span>
                <span>{commentsCounts.pending} Komentar Perlu Moderasi</span>
              </div>
            )}
            <button
              onClick={resetAnimeForm}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary-container text-on-primary text-xs font-bold hover:brightness-110 shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-[15px]">add</span>
              Tambah Anime
            </button>
          </div>
        </header>

        {/* Main Body */}
        <main className="p-4 md:p-6 lg:p-8 flex-1 max-w-[1600px] w-full mx-auto">
          {/* ════════════════════════════════════════════════════════════════════ */}
          {/* ── TAB 1: KELOLA ANIME ─────────────────────────────────────────── */}
          {/* ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'anime' && (
            <div className="grid grid-cols-1 lg:grid-cols-[330px_1fr] xl:grid-cols-[360px_1fr] gap-6 items-start">
              
              {/* ── Column 1: Anime List Panel ─────────────────────────────── */}
              <div className={`bg-surface-elevated border border-border-subtle/50 rounded-2xl p-4 shadow-sm flex flex-col gap-3.5 sticky top-20 ${
                mobileView === 'editor' ? 'hidden lg:flex' : 'flex'
              }`}>
                {/* List Header */}
                <div className="flex items-center justify-between pb-2 border-b border-border-subtle/40">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-on-surface">Koleksi Anime</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-surface-container text-primary-stitch font-bold">
                      {pagination.totalItems}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={resetAnimeForm}
                    className="text-xs px-2.5 py-1 bg-primary-container/20 text-primary-stitch hover:bg-primary-container hover:text-on-primary border border-primary-stitch/30 rounded-lg font-bold transition flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[13px]">add</span>
                    Baru
                  </button>
                </div>

                {/* Search Box */}
                <form onSubmit={(e) => { e.preventDefault(); setPage(1); setAppliedSearch(searchTerm); }} className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="material-symbols-outlined text-on-surface-variant/50 text-[16px] absolute left-3 top-2.5">search</span>
                    <input
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      placeholder="Cari judul anime..."
                      className="w-full bg-surface-container border border-border-subtle/50 rounded-xl pl-9 pr-3 py-2 text-xs text-on-surface placeholder-on-surface-variant/40 outline-none focus:border-primary-stitch"
                    />
                  </div>
                  <button type="submit" className="px-3 py-2 bg-surface-container hover:bg-surface-bright text-on-surface text-xs font-bold rounded-xl border border-border-subtle/50 transition">
                    Cari
                  </button>
                </form>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5">
                  {['all', 'Ongoing', 'Completed'].map(status => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setAnimeFilterStatus(status)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        animeFilterStatus === status
                          ? 'bg-primary-stitch/20 text-primary-stitch border border-primary-stitch/40'
                          : 'bg-surface-container/60 text-on-surface-variant hover:text-on-surface border border-transparent'
                      }`}
                    >
                      {status === 'all' ? 'Semua' : status}
                    </button>
                  ))}
                </div>

                {/* Scrollable Anime List Items */}
                <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-320px)] pr-1 custom-scrollbar">
                  {listLoading && (
                    <div className="text-on-surface-variant text-xs py-8 text-center animate-pulse flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-sm">hourglass_empty</span>
                      Memuat daftar anime...
                    </div>
                  )}
                  {!listLoading && filteredAnimeList.length === 0 && (
                    <div className="text-on-surface-variant text-xs py-10 text-center flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-3xl opacity-30">movie_off</span>
                      <span>Tidak ada anime ditemukan.</span>
                    </div>
                  )}
                  {!listLoading && filteredAnimeList.map(anime => {
                    const isSelected = selectedSlug === anime.slug;
                    return (
                      <button
                        key={anime.slug}
                        type="button"
                        onClick={() => loadAnimeDetail(anime.slug)}
                        className={`w-full text-left rounded-xl p-2.5 transition-all flex gap-3 items-center group border ${
                          isSelected
                            ? 'bg-primary-container/15 border-primary-stitch shadow-sm ring-1 ring-primary-stitch/30'
                            : 'bg-surface-container/40 border-border-subtle/40 hover:border-border-subtle hover:bg-surface-bright/30'
                        }`}
                      >
                        {/* Cover Thumbnail */}
                        <div className="w-10 h-14 rounded-lg overflow-hidden bg-surface-bright flex-shrink-0 border border-border-subtle/40 relative">
                          {anime.coverImage ? (
                            <img src={anime.coverImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-on-surface-variant text-xs">
                              <span className="material-symbols-outlined text-[16px]">image</span>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-xs text-on-surface truncate group-hover:text-primary-stitch transition-colors">
                            {anime.title}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                              anime.status?.toLowerCase() === 'ongoing'
                                ? 'bg-status-active/20 text-status-active'
                                : 'bg-status-pending/20 text-status-pending'
                            }`}>
                              {anime.status || 'Anime'}
                            </span>
                            <span className="text-[10px] text-on-surface-variant bg-surface-container px-1.5 py-0.2 rounded border border-border-subtle/40">
                              {anime.episodeCount || 0} Ep
                            </span>
                          </div>
                        </div>

                        <span className={`material-symbols-outlined text-[16px] transition-transform ${
                          isSelected ? 'text-primary-stitch translate-x-0.5' : 'text-on-surface-variant/30 group-hover:text-on-surface-variant'
                        }`}>
                          chevron_right
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between text-xs text-on-surface-variant pt-2 border-t border-border-subtle/40">
                  <button
                    type="button"
                    onClick={() => page > 1 && setPage(p => p - 1)}
                    disabled={page <= 1}
                    className="px-3 py-1.5 rounded-lg bg-surface-container border border-border-subtle/50 disabled:opacity-30 hover:border-primary-stitch/40 transition font-bold"
                  >
                    Prev
                  </button>
                  <span className="tabular-nums text-[11px] font-mono">
                    {pagination.currentPage} / {pagination.totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => page < pagination.totalPages && setPage(p => p + 1)}
                    disabled={page >= pagination.totalPages}
                    className="px-3 py-1.5 rounded-lg bg-surface-container border border-border-subtle/50 disabled:opacity-30 hover:border-primary-stitch/40 transition font-bold"
                  >
                    Next
                  </button>
                </div>
              </div>

              {/* ── Column 2: Anime Studio / Editor ────────────────────────── */}
              <div className={`bg-surface-elevated border border-border-subtle/50 rounded-2xl overflow-hidden shadow-sm flex flex-col ${
                mobileView === 'list' ? 'hidden lg:flex' : 'flex'
              }`}>
                {/* Editor Header Banner */}
                <div className="p-4 md:p-6 border-b border-border-subtle/50 bg-gradient-to-b from-surface-bright/20 to-transparent">
                  {/* Mobile Back Button */}
                  <button
                    type="button"
                    onClick={() => setMobileView('list')}
                    className="lg:hidden flex items-center gap-1 text-xs font-bold text-primary-stitch mb-3"
                  >
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    Kembali ke Daftar Anime
                  </button>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {/* Cover Avatar */}
                      <div className="w-14 h-18 rounded-xl overflow-hidden bg-surface-container border border-border-subtle flex-shrink-0 shadow-md">
                        {form.coverImage ? (
                          <img src={form.coverImage} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                            <span className="material-symbols-outlined text-xl">movie</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            selectedSlug ? 'bg-primary-stitch/20 text-primary-stitch border border-primary-stitch/30' : 'bg-status-pending/20 text-status-pending'
                          }`}>
                            {selectedSlug ? 'Mode Edit' : 'Anime Baru'}
                          </span>
                          {form.type && (
                            <span className="text-[11px] text-on-surface-variant font-medium">{form.type}</span>
                          )}
                        </div>
                        <h2 className="text-lg md:text-xl font-display font-black text-on-surface mt-1 line-clamp-1">
                          {form.title || 'Judul Anime Baru'}
                        </h2>
                        <div className="text-xs text-on-surface-variant font-mono mt-0.5">
                          slug: {form.slug || 'auto-generated'}
                        </div>
                      </div>
                    </div>

                    {/* Header Quick Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {selectedSlug && (
                        <a
                          href={`/anime/${selectedSlug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 bg-surface-container hover:bg-surface-bright text-on-surface border border-border-subtle/60 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                          Lihat di Web
                        </a>
                      )}
                      {selectedSlug && (
                        <button
                          type="button"
                          onClick={handleDeleteAnime}
                          disabled={saving}
                          className="px-3 py-2 bg-status-expired/10 hover:bg-status-expired hover:text-surface-deep text-status-expired border border-status-expired/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[15px]">delete</span>
                          Hapus
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Sub Tabs Pill Navigation */}
                  <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1 border-b border-border-subtle/30">
                    {[
                      { key: 'info', label: 'Informasi & Sinopsis', icon: 'edit_note' },
                      { key: 'episodes', label: `Streaming & Servers (${episodeDocs.length})`, icon: 'play_circle' },
                      { key: 'metadata', label: `Daftar Episode Metas (${episodeMetas.length})`, icon: 'list_alt' },
                    ].map(st => {
                      const isActive = animeSubTab === st.key;
                      return (
                        <button
                          key={st.key}
                          type="button"
                          onClick={() => setAnimeSubTab(st.key)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                            isActive
                              ? 'bg-primary-container text-on-primary shadow-sm'
                              : 'bg-surface-container/60 text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">{st.icon}</span>
                          <span>{st.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Editor Content Area */}
                <div className="p-4 md:p-6 space-y-6">
                  {/* Status / Message Alert */}
                  {formMsg && (
                    <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 border ${
                      formMsg.startsWith('✓')
                        ? 'bg-status-active/10 border-status-active/30 text-status-active'
                        : 'bg-status-expired/10 border-status-expired/30 text-status-expired'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">
                          {formMsg.startsWith('✓') ? 'check_circle' : 'error'}
                        </span>
                        <span>{formMsg}</span>
                      </div>
                      <button onClick={() => setFormMsg('')} className="hover:opacity-70">✕</button>
                    </div>
                  )}

                  {/* ── SUB-TAB 1: INFORMASI & METADATA ──────────────────────── */}
                  {animeSubTab === 'info' && (
                    <form onSubmit={handleSubmitAnime} className="space-y-6">
                      {/* Auto-Scrape & AniList Tool Box */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Box 1: Otakudesu / Nekopoi Scraper */}
                        <div className="p-4 bg-surface-container/60 border border-primary-stitch/30 rounded-2xl space-y-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-primary-stitch">
                            <span className="material-symbols-outlined text-base">smart_toy</span>
                            <span>Scraper Anime (Otakudesu/Nekopoi)</span>
                          </div>
                          <p className="text-[11px] text-on-surface-variant">
                            Ambil episode dan data anime otomatis dari URL.
                          </p>
                          <div className="flex gap-2 pt-1">
                            <input
                              value={scrapeUrl}
                              onChange={e => setScrapeUrl(e.target.value)}
                              placeholder="https://otakudesu.blog/anime/..."
                              className={`${inputCls} flex-1 text-xs`}
                            />
                            <button
                              type="button"
                              onClick={handleScrape}
                              disabled={isScraping || !scrapeUrl}
                              className="px-4 py-2.5 bg-gradient-to-r from-primary-container to-primary-stitch text-on-primary font-bold rounded-xl text-xs disabled:opacity-50 whitespace-nowrap hover:brightness-110 transition shadow-sm flex items-center justify-center gap-1.5"
                            >
                              {isScraping ? 'Mengambil...' : 'Generate'}
                            </button>
                          </div>
                        </div>

                        {/* Box 2: AniList GraphQL Meta Sync */}
                        <div className="p-4 bg-surface-container/60 border border-[#02A9FF]/30 rounded-2xl space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-bold text-[#02A9FF]">
                              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M6.361 2.943 0 21.056h4.942l1.077-3.133H11.4l1.052 3.133H22.9L12.641 2.943H6.361zm2.302 4.67 2.378 6.924H7.072l1.591-6.924zM16.634 8.79v12.266h4.526V8.79h-4.526z"/></svg>
                              <span>AniList GraphQL Meta Sync</span>
                            </div>
                            {form.anilistId && (
                              <span className="text-[10px] bg-[#02A9FF]/20 text-[#02A9FF] px-2 py-0.5 rounded-full font-mono font-bold">
                                ID: {form.anilistId}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-on-surface-variant">
                            Sinkronkan skor akurat, banner HD, genre bersih, dan judul resmi dari AniList.
                          </p>
                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              onClick={handleSyncAnilist}
                              disabled={isSyncingAnilist || (!form.title && !selectedSlug)}
                              className="w-full px-4 py-2.5 bg-gradient-to-r from-[#02A9FF] to-[#0077b6] text-white font-bold rounded-xl text-xs disabled:opacity-50 hover:brightness-110 transition shadow-sm flex items-center justify-center gap-2"
                            >
                              {isSyncingAnilist ? (
                                <>
                                  <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" /><path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" className="opacity-75" /></svg>
                                  <span>Menghubungkan ke AniList...</span>
                                </>
                              ) : (
                                <>
                                  <span className="material-symbols-outlined text-sm">sync</span>
                                  <span>{selectedSlug ? 'Sinkronkan Anime Ini ke AniList' : 'Cari & Isi dari AniList'}</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Main Form Fields Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Field label="Judul Utama" required className="md:col-span-2">
                          <input
                            value={form.title}
                            onChange={e => handleFormChange('title', e.target.value)}
                            placeholder="Contoh: Solo Leveling Season 2"
                            required
                            className={inputCls}
                          />
                        </Field>

                        <Field label="Judul Native (JP)">
                          <input
                            value={form.nativeTitle}
                            onChange={e => handleFormChange('nativeTitle', e.target.value)}
                            placeholder="例：俺だけレベルアップな件"
                            className={inputCls}
                          />
                        </Field>

                        <Field label="Judul Inggris (English)">
                          <input
                            value={form.englishTitle}
                            onChange={e => handleFormChange('englishTitle', e.target.value)}
                            placeholder="Solo Leveling Season 2: Arise from the Shadow"
                            className={inputCls}
                          />
                        </Field>

                        <Field label="Custom Slug (opsional)">
                          <input
                            value={form.slug}
                            onChange={e => handleFormChange('slug', e.target.value)}
                            placeholder="solo-leveling-season-2"
                            className={inputCls}
                          />
                        </Field>

                        <Field label="Tipe Media">
                          <select
                            value={form.type}
                            onChange={e => handleFormChange('type', e.target.value)}
                            className={inputCls}
                          >
                            {['Anime', 'TV', 'OVA', 'Movie', 'Series', 'Special'].map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </Field>

                        <Field label="Status Penayangan">
                          <select
                            value={form.status}
                            onChange={e => handleFormChange('status', e.target.value)}
                            className={inputCls}
                          >
                            <option value="">— Pilih Status —</option>
                            <option value="Ongoing">Ongoing (Sedang Tayang)</option>
                            <option value="Completed">Completed (Tamat)</option>
                          </select>
                        </Field>

                        <Field label="Tanggal Rilis / Tayang">
                          <input
                            value={form.airDate}
                            onChange={e => handleFormChange('airDate', e.target.value)}
                            placeholder="Jan 6, 2024"
                            className={inputCls}
                          />
                        </Field>

                        <Field label="Studio Animasi">
                          <input
                            value={form.studio}
                            onChange={e => handleFormChange('studio', e.target.value)}
                            placeholder="A-1 Pictures, Ufotable"
                            className={inputCls}
                          />
                        </Field>

                        <Field label="Produser / Lisensi">
                          <input
                            value={form.producer}
                            onChange={e => handleFormChange('producer', e.target.value)}
                            placeholder="Aniplex, Crunchyroll"
                            className={inputCls}
                          />
                        </Field>

                        <Field label="Durasi Per Episode">
                          <input
                            value={form.duration}
                            onChange={e => handleFormChange('duration', e.target.value)}
                            placeholder="24 Menit"
                            className={inputCls}
                          />
                        </Field>

                        <Field label="Total Episode">
                          <input
                            type="number"
                            min="0"
                            value={form.totalEpisode}
                            onChange={e => handleFormChange('totalEpisode', e.target.value)}
                            placeholder="12"
                            className={inputCls}
                          />
                        </Field>

                        <Field label="Skor / Rating (0-10)">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="10"
                            value={form.rating}
                            onChange={e => handleFormChange('rating', e.target.value)}
                            placeholder="8.50"
                            className={inputCls}
                          />
                        </Field>

                        <Field label="Jumlah Views">
                          <input
                            type="number"
                            min="0"
                            value={form.views}
                            onChange={e => handleFormChange('views', e.target.value)}
                            placeholder="0"
                            className={inputCls}
                          />
                        </Field>

                        <Field label="Cover Poster Image" className="md:col-span-2 lg:col-span-3">
                          <div className="flex gap-2 items-center">
                            <input
                              value={form.coverImage}
                              onChange={e => handleFormChange('coverImage', e.target.value)}
                              placeholder="https://image-url.com/poster.jpg"
                              className={`${inputCls} flex-1`}
                            />
                            <label className={`px-4 py-2.5 rounded-xl border border-border-subtle text-xs font-bold cursor-pointer whitespace-nowrap transition flex items-center gap-1.5 ${
                              coverUploading ? 'opacity-50 cursor-not-allowed bg-surface-container' : 'bg-surface-container hover:bg-surface-bright text-on-surface'
                            }`}>
                              <span className="material-symbols-outlined text-[16px]">upload_file</span>
                              {coverUploading ? 'Mengunggah...' : 'Upload File'}
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
                                    if (data.url) handleFormChange('coverImage', data.url);
                                    else alert('Upload gagal: ' + (data.error || 'Unknown error'));
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
                        </Field>

                        <Field label="Banner / Backdrop HD URL (AniList)" className="md:col-span-2 lg:col-span-3">
                          <input
                            value={form.bannerImage}
                            onChange={e => handleFormChange('bannerImage', e.target.value)}
                            placeholder="https://s4.anilist.co/file/anilistcdn/media/anime/banner/..."
                            className={inputCls}
                          />
                        </Field>

                        <Field label="AniList ID (opsional)">
                          <input
                            type="number"
                            value={form.anilistId}
                            onChange={e => handleFormChange('anilistId', e.target.value)}
                            placeholder="Contoh: 151807"
                            className={inputCls}
                          />
                        </Field>

                        <Field label="MyAnimeList ID (opsional)">
                          <input
                            type="number"
                            value={form.malId}
                            onChange={e => handleFormChange('malId', e.target.value)}
                            placeholder="Contoh: 54595"
                            className={inputCls}
                          />
                        </Field>

                        <Field label="Genre Anime (pisahkan dengan koma)" className="md:col-span-2 lg:col-span-3">
                          <input
                            value={form.genres}
                            onChange={e => handleFormChange('genres', e.target.value)}
                            placeholder="Action, Fantasy, Adventure, Shounen"
                            className={inputCls}
                          />
                        </Field>

                        <Field label="Sinopsis Lengkap" className="md:col-span-2 lg:col-span-3">
                          <textarea
                            value={form.synopsis}
                            onChange={e => handleFormChange('synopsis', e.target.value)}
                            placeholder="Tuliskan ringkasan cerita anime..."
                            rows={4}
                            className={`${inputCls} resize-y min-h-[100px] leading-relaxed`}
                          />
                        </Field>

                        <Field label="Source URL Asli" className="md:col-span-2 lg:col-span-3">
                          <input
                            value={form.sourceUrl}
                            onChange={e => handleFormChange('sourceUrl', e.target.value)}
                            placeholder="https://otakudesu.blog/anime/..."
                            className={inputCls}
                          />
                        </Field>
                      </div>

                      {/* Sticky / Fixed Action Bottom Bar */}
                      <div className="flex items-center justify-between pt-4 border-t border-border-subtle/50">
                        <button
                          type="button"
                          onClick={resetAnimeForm}
                          disabled={saving}
                          className="px-5 py-2.5 rounded-xl bg-surface-container border border-border-subtle/50 hover:bg-surface-bright text-on-surface-variant hover:text-on-surface text-xs font-bold transition"
                        >
                          Reset Formulir
                        </button>
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-6 py-2.5 bg-primary-container text-on-primary font-bold rounded-xl text-xs hover:brightness-110 shadow-lg shadow-primary-container/20 disabled:opacity-50 transition flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-[16px]">{saving ? 'hourglass_empty' : 'save'}</span>
                          <span>{saving ? 'Menyimpan...' : selectedSlug ? 'Simpan Perubahan' : 'Buat Anime Baru'}</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* ── SUB-TAB 2: STREAMING & SERVER EPISODES ──────────────── */}
                  {animeSubTab === 'episodes' && (
                    <div className="space-y-6">
                      {!selectedSlug ? (
                        <div className="p-8 text-center bg-surface-container/30 border border-border-subtle/50 rounded-2xl flex flex-col items-center gap-3">
                          <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">movie_edit</span>
                          <h3 className="font-bold text-sm text-on-surface">Simpan Anime Terlebih Dahulu</h3>
                          <p className="text-xs text-on-surface-variant max-w-sm">
                            Untuk mengelola server streaming episode, simpan data anime ini terlebih dahulu atau pilih anime dari daftar samping.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
                          {/* Episode Docs List */}
                          <div className="bg-surface-container/40 border border-border-subtle/50 rounded-2xl p-4 space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-border-subtle/40">
                              <span className="text-xs font-bold text-on-surface">Daftar Episode Docs</span>
                              <button
                                type="button"
                                onClick={startNewEpisodeDoc}
                                className="text-xs px-2.5 py-1 bg-primary-container text-on-primary rounded-lg font-bold hover:brightness-110 transition flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-[13px]">add</span>
                                Episode
                              </button>
                            </div>

                            <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                              {epDocsLoading && (
                                <div className="text-center py-6 text-on-surface-variant text-xs animate-pulse">
                                  Memuat episode...
                                </div>
                              )}
                              {!epDocsLoading && episodeDocs.length === 0 && (
                                <div className="text-center py-8 text-on-surface-variant text-xs flex flex-col items-center gap-2">
                                  <span className="material-symbols-outlined text-2xl opacity-30">smart_display</span>
                                  <span>Belum ada episode streaming.</span>
                                </div>
                              )}
                              {!epDocsLoading && episodeDocs.map(ep => {
                                const isSelected = selectedEpSlug === ep.episodeSlug && !epIsNew;
                                return (
                                  <div
                                    key={ep.episodeSlug}
                                    onClick={() => loadEpisodeDoc(selectedSlug, ep.episodeSlug)}
                                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer group ${
                                      isSelected
                                        ? 'bg-primary-container/15 border-primary-stitch shadow-sm ring-1 ring-primary-stitch/30'
                                        : 'bg-surface-container/60 border-border-subtle/40 hover:border-border-subtle hover:bg-surface-bright/40'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <span className="material-symbols-outlined text-base text-primary-stitch">play_circle</span>
                                      <div className="min-w-0">
                                        <div className="text-xs font-bold text-on-surface truncate">{ep.title || ep.episodeSlug}</div>
                                        <div className="text-[10px] text-on-surface-variant font-mono">{ep.servers?.length || 0} server embed</div>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); handleDeleteEpisodeDoc(ep.episodeSlug); }}
                                      className="text-[11px] p-1 text-on-surface-variant hover:text-status-expired rounded-lg transition"
                                      title="Hapus episode ini"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Episode Doc Form */}
                          <div className="bg-surface-container/30 border border-border-subtle/50 rounded-2xl p-5 space-y-4">
                            <div className="flex items-center justify-between pb-2 border-b border-border-subtle/40">
                              <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary-stitch text-base">
                                  {epIsNew ? 'add_circle' : 'edit'}
                                </span>
                                {epIsNew ? 'Tambah Episode Stream Baru' : selectedEpSlug ? `Edit Episode: ${epForm.title || selectedEpSlug}` : 'Pilih Episode di Kiri'}
                              </h3>
                              {selectedEpSlug && (
                                <a
                                  href={`/episode/${selectedSlug}/${selectedEpSlug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary-stitch hover:underline flex items-center gap-1 font-semibold"
                                >
                                  <span>Test Player</span>
                                  <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                                </a>
                              )}
                            </div>

                            {epMsg && (
                              <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
                                epMsg.startsWith('✓') ? 'bg-status-active/10 border-status-active/30 text-status-active' : 'bg-status-expired/10 border-status-expired/30 text-status-expired'
                              }`}>
                                <span className="material-symbols-outlined text-sm">{epMsg.startsWith('✓') ? 'check_circle' : 'error'}</span>
                                <span>{epMsg}</span>
                              </div>
                            )}

                            {(epIsNew || selectedEpSlug) ? (
                              <form onSubmit={handleSubmitEpisodeDoc} className="space-y-4">
                                {/* Scrape Episode Box */}
                                <div className="p-3 bg-surface-container border border-border-subtle/50 rounded-xl flex gap-2 items-center">
                                  <input
                                    value={epScrapeUrl}
                                    onChange={e => setEpScrapeUrl(e.target.value)}
                                    placeholder="URL Stream / Episode Nekopoi/Otakudesu..."
                                    className={`${inputCls} text-xs flex-1`}
                                  />
                                  <button
                                    type="button"
                                    onClick={handleScrapeEpisode}
                                    disabled={epScraping || !epScrapeUrl}
                                    className="px-4 py-2 bg-primary-container text-on-primary font-bold text-xs rounded-xl hover:brightness-110 disabled:opacity-50 whitespace-nowrap transition"
                                  >
                                    {epScraping ? 'Mengekstrak...' : 'Ambil Server'}
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <Field label="Judul Episode">
                                    <input
                                      value={epForm.title}
                                      onChange={e => handleEpFormChange('title', e.target.value)}
                                      placeholder="Episode 1"
                                      className={inputCls}
                                    />
                                  </Field>
                                  <Field label="Slug Episode">
                                    <input
                                      value={epForm.episodeSlug}
                                      onChange={e => handleEpFormChange('episodeSlug', e.target.value)}
                                      placeholder="episode-1"
                                      className={inputCls}
                                    />
                                  </Field>
                                  <Field label="Urutan (Index)">
                                    <input
                                      type="number"
                                      value={epForm.episodeIndex}
                                      onChange={e => handleEpFormChange('episodeIndex', e.target.value)}
                                      placeholder="1"
                                      className={inputCls}
                                    />
                                  </Field>
                                  <Field label="Tanggal Rilis Episode">
                                    <input
                                      value={epForm.airDate}
                                      onChange={e => handleEpFormChange('airDate', e.target.value)}
                                      placeholder="Jan 6, 2024"
                                      className={inputCls}
                                    />
                                  </Field>
                                  <Field label="Prev Slug (Episode Sebelumnya)">
                                    <input
                                      value={epForm.prevSlug}
                                      onChange={e => handleEpFormChange('prevSlug', e.target.value)}
                                      placeholder="episode-sebelumnya"
                                      className={inputCls}
                                    />
                                  </Field>
                                  <Field label="Next Slug (Episode Berikutnya)">
                                    <input
                                      value={epForm.nextSlug}
                                      onChange={e => handleEpFormChange('nextSlug', e.target.value)}
                                      placeholder="episode-berikutnya"
                                      className={inputCls}
                                    />
                                  </Field>
                                </div>

                                {/* Server Embed Links */}
                                <div className="space-y-2 pt-2 border-t border-border-subtle/30">
                                  <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                                      <span className="material-symbols-outlined text-primary-stitch text-sm">dns</span>
                                      Daftar Server Streaming Embed
                                    </label>
                                    <button
                                      type="button"
                                      onClick={addServer}
                                      className="text-xs px-2.5 py-1 bg-surface-container border border-border-subtle text-on-surface hover:border-primary-stitch rounded-lg font-bold transition flex items-center gap-1"
                                    >
                                      <span className="material-symbols-outlined text-[13px]">add</span>
                                      Tambah Server
                                    </button>
                                  </div>

                                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                                    {epForm.servers.map((s, idx) => (
                                      <div key={idx} className="flex gap-2 items-center bg-surface-container/60 p-2 rounded-xl border border-border-subtle/40">
                                        <input
                                          value={s.name}
                                          onChange={e => handleServerChange(idx, 'name', e.target.value)}
                                          placeholder="Server 1"
                                          className="w-28 bg-surface-container border border-border-subtle/50 rounded-lg px-2.5 py-1.5 text-xs text-on-surface font-semibold"
                                        />
                                        <input
                                          value={s.url}
                                          onChange={e => handleServerChange(idx, 'url', e.target.value)}
                                          placeholder="https://desustream.net/..."
                                          className="flex-1 bg-surface-container border border-border-subtle/50 rounded-lg px-2.5 py-1.5 text-xs text-on-surface font-mono"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => removeServer(idx)}
                                          className="p-1 text-on-surface-variant hover:text-status-expired rounded transition"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="flex gap-2 pt-3 border-t border-border-subtle/40">
                                  <button
                                    type="button"
                                    onClick={() => { setSelectedEpSlug(''); setEpIsNew(false); setEpForm(emptyEpisodeDoc); }}
                                    className="px-4 py-2 bg-surface-container text-on-surface-variant hover:text-on-surface text-xs font-bold rounded-xl transition"
                                  >
                                    Batal
                                  </button>
                                  <button
                                    type="submit"
                                    disabled={epSaving}
                                    className="flex-1 py-2 bg-primary-container text-on-primary font-bold text-xs rounded-xl hover:brightness-110 disabled:opacity-50 transition shadow-sm"
                                  >
                                    {epSaving ? 'Menyimpan...' : epIsNew ? 'Tambahkan Episode' : 'Perbarui Episode'}
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <p className="text-xs text-on-surface-variant py-8 text-center">
                                Pilih episode dari daftar di kiri untuk melihat atau mengedit server stream-nya.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── SUB-TAB 3: METADATA EPISODES ────────────────────────── */}
                  {animeSubTab === 'metadata' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-sm text-on-surface">Daftar Metadata Episode</h3>
                          <p className="text-xs text-on-surface-variant mt-0.5">
                            Metadata ini menentukan urutan dan tombol episode di halaman detail anime.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={addEpMetaRow}
                          className="px-3 py-1.5 bg-primary-container text-on-primary rounded-xl text-xs font-bold hover:brightness-110 transition flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">add</span>
                          Tambah Baris
                        </button>
                      </div>

                      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                        {episodeMetas.map((ep, idx) => (
                          <div key={idx} className="grid grid-cols-[1fr_auto] sm:grid-cols-[1.5fr_1.5fr_1fr_auto] gap-2 items-center bg-surface-container/50 border border-border-subtle/50 rounded-xl p-2.5">
                            <input
                              value={ep.title}
                              onChange={e => handleEpMetaChange(idx, 'title', e.target.value)}
                              placeholder="Episode 1"
                              className="bg-surface-container border border-border-subtle/50 rounded-lg px-2.5 py-1.5 text-xs text-on-surface"
                            />
                            <input
                              value={ep.slug}
                              onChange={e => handleEpMetaChange(idx, 'slug', e.target.value)}
                              placeholder="episode-1"
                              className="hidden sm:block bg-surface-container border border-border-subtle/50 rounded-lg px-2.5 py-1.5 text-xs text-on-surface font-mono"
                            />
                            <input
                              value={ep.airDate}
                              onChange={e => handleEpMetaChange(idx, 'airDate', e.target.value)}
                              placeholder="Tgl Rilis"
                              className="hidden sm:block bg-surface-container border border-border-subtle/50 rounded-lg px-2.5 py-1.5 text-xs text-on-surface"
                            />
                            <button
                              type="button"
                              onClick={() => removeEpMetaRow(idx)}
                              className="p-1.5 text-on-surface-variant hover:text-status-expired rounded-lg transition"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="pt-3 border-t border-border-subtle/40 flex justify-end">
                        <button
                          type="button"
                          onClick={handleSubmitAnime}
                          disabled={saving}
                          className="px-6 py-2 bg-primary-container text-on-primary font-bold rounded-xl text-xs hover:brightness-110 shadow-sm transition"
                        >
                          {saving ? 'Menyimpan...' : 'Simpan Perubahan Metadata'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════ */}
          {/* ── TAB 2: KELOLA PENGGUNA ──────────────────────────────────────── */}
          {/* ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'users' && (
            <section className="bg-surface-elevated border border-border-subtle/50 rounded-2xl p-5 md:p-6 space-y-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary-stitch">group</span>
                    Kelola Pengguna
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {usersPagination.totalItems} total pengguna terdaftar di platform
                  </p>
                </div>
                <form onSubmit={e => { e.preventDefault(); setUsersPage(1); loadUsersList(1, usersSearch); }} className="flex gap-2">
                  <input
                    value={usersSearch}
                    onChange={e => setUsersSearch(e.target.value)}
                    placeholder="Cari nama atau email..."
                    className="flex-1 sm:w-64 bg-surface-container border border-border-subtle/50 rounded-xl px-3.5 py-2 text-xs text-on-surface outline-none focus:border-primary-stitch"
                  />
                  <button type="submit" className="px-4 py-2 bg-primary-container text-on-primary text-xs font-bold rounded-xl hover:brightness-110 transition">
                    Cari
                  </button>
                </form>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border-subtle/50">
                <table className="w-full text-left text-sm text-on-surface min-w-[600px]">
                  <thead className="text-xs uppercase bg-surface-container/60 text-on-surface-variant border-b border-border-subtle/50">
                    <tr>
                      <th className="px-4 py-3.5 font-bold">User</th>
                      <th className="px-4 py-3.5 font-bold whitespace-nowrap">Role</th>
                      <th className="px-4 py-3.5 font-bold">Koin</th>
                      <th className="px-4 py-3.5 font-bold">Aksi Kelola</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle/30">
                    {usersLoading && (
                      <tr>
                        <td colSpan="4" className="text-center py-10 text-on-surface-variant animate-pulse">
                          Memuat data pengguna...
                        </td>
                      </tr>
                    )}
                    {!usersLoading && usersList.length === 0 && (
                      <tr>
                        <td colSpan="4" className="text-center py-10 text-on-surface-variant">
                          Tidak ada pengguna ditemukan.
                        </td>
                      </tr>
                    )}
                    {!usersLoading && usersList.map(u => (
                      <tr key={u._id} className="hover:bg-surface-bright/20 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-surface-container overflow-hidden border border-border-subtle flex-shrink-0">
                              {u.photoURL ? (
                                <img src={u.photoURL} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-xs text-primary-stitch">
                                  {u.displayName?.[0] || 'U'}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-xs text-on-surface truncate">{u.displayName}</div>
                              <div className="text-[11px] text-on-surface-variant truncate font-mono">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {u.isAdmin ? (
                            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-status-expired/20 text-status-expired font-bold border border-status-expired/30">
                              <span className="material-symbols-outlined text-[12px]">shield</span>
                              Admin
                            </span>
                          ) : u.isPremium ? (
                            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-status-pending/20 text-status-pending font-bold border border-status-pending/30">
                              <span className="material-symbols-outlined text-[12px]">star</span>
                              Premium
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-medium">
                              Member
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-bold font-mono">
                            <span className="material-symbols-outlined text-[13px]">monetization_on</span>
                            {u.coins || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => handleUpdateUser(u._id, { isPremium: !u.isPremium })}
                              className="text-xs px-2.5 py-1 rounded-lg bg-status-pending/10 text-status-pending hover:bg-status-pending hover:text-surface-deep border border-status-pending/30 font-bold transition whitespace-nowrap"
                            >
                              {u.isPremium ? 'Cabut Premium' : '+ Premium'}
                            </button>
                            <button
                              onClick={() => handleUpdateUser(u._id, { isAdmin: !u.isAdmin })}
                              className="text-xs px-2.5 py-1 rounded-lg bg-status-active/10 text-status-active hover:bg-status-active hover:text-surface-deep border border-status-active/30 font-bold transition whitespace-nowrap"
                            >
                              {u.isAdmin ? 'Cabut Admin' : '+ Admin'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u._id)}
                              className="text-xs px-2.5 py-1 rounded-lg bg-status-expired/10 text-status-expired hover:bg-status-expired hover:text-surface-deep border border-status-expired/20 font-bold transition"
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between text-xs text-on-surface-variant pt-2">
                <button
                  type="button"
                  onClick={() => usersPage > 1 && setUsersPage(p => p - 1)}
                  disabled={usersPage <= 1}
                  className="px-3.5 py-1.5 rounded-xl bg-surface-container border border-border-subtle/50 disabled:opacity-40 hover:border-primary-stitch/40 transition font-bold"
                >
                  Prev
                </button>
                <span className="tabular-nums font-mono">
                  Hal {usersPagination.currentPage} / {usersPagination.totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => usersPage < usersPagination.totalPages && setUsersPage(p => p + 1)}
                  disabled={usersPage >= usersPagination.totalPages}
                  className="px-3.5 py-1.5 rounded-xl bg-surface-container border border-border-subtle/50 disabled:opacity-40 hover:border-primary-stitch/40 transition font-bold"
                >
                  Next
                </button>
              </div>
            </section>
          )}

          {/* ════════════════════════════════════════════════════════════════════ */}
          {/* ── TAB 3: MODERASI KOMENTAR ─────────────────────────────────────── */}
          {/* ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'comments' && (
            <section className="space-y-4">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary-stitch text-[20px]">forum</span>
                    Moderasi & Kelola Komentar
                  </h2>
                  <p className="text-on-surface-variant text-xs mt-0.5">
                    Kelola dan moderasi komentar agar website tetap bersih dari spam, spoiler liar, dan konten melanggar aturan.
                  </p>
                </div>
                <form onSubmit={e => { e.preventDefault(); setCommentsPage(1); loadCommentsList(1, commentsSearch, commentsStatus); }} className="flex gap-2">
                  <input
                    value={commentsSearch}
                    onChange={e => setCommentsSearch(e.target.value)}
                    placeholder="Cari komentar, user, slug..."
                    className="flex-1 md:w-72 bg-surface-container border border-border-subtle/50 rounded-xl px-3.5 py-2 text-xs text-on-surface outline-none focus:border-primary-stitch transition-colors placeholder-on-surface-variant/50"
                  />
                  <button type="submit" className="px-4 py-2 bg-primary-container text-on-primary text-xs font-bold rounded-xl hover:brightness-110 transition flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px]">search</span>
                    Cari
                  </button>
                </form>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-border-subtle/40">
                {[
                  { key: 'all', label: 'Semua Komentar', count: commentsCounts.all, icon: 'chat' },
                  { key: 'pending', label: 'Menunggu Moderasi', count: commentsCounts.pending, icon: 'hourglass_top', alert: commentsCounts.pending > 0 },
                  { key: 'approved', label: 'Disetujui', count: commentsCounts.approved, icon: 'check_circle' },
                  { key: 'rejected', label: 'Ditolak', count: commentsCounts.rejected, icon: 'cancel' },
                ].map(tab => {
                  const isActive = commentsStatus === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => {
                        setCommentsStatus(tab.key);
                        setCommentsPage(1);
                        loadCommentsList(1, commentsSearch, tab.key);
                      }}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        isActive
                          ? 'bg-primary-container text-on-primary shadow-sm'
                          : 'bg-surface-elevated/70 text-on-surface-variant hover:text-on-surface hover:bg-surface-elevated border border-border-subtle/40'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                      <span>{tab.label}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : tab.alert
                            ? 'bg-status-pending text-surface-deep font-black animate-pulse'
                            : 'bg-surface-container text-on-surface-variant'
                      }`}>
                        {tab.count ?? 0}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Comment list */}
              <div className="bg-surface-elevated border border-border-subtle/50 rounded-2xl overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-5 py-3 border-b border-border-subtle/50 bg-surface-container/50">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Komentar & Pengirim</span>
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Aksi Moderasi</span>
                </div>

                <div className="divide-y divide-border-subtle/30">
                  {commentsLoading && (
                    <div className="text-center py-12 text-on-surface-variant animate-pulse flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-[20px]">hourglass_empty</span>
                      Memuat daftar komentar...
                    </div>
                  )}
                  {!commentsLoading && commentsList.length === 0 && (
                    <div className="text-center py-14 text-on-surface-variant flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-4xl opacity-30">chat_bubble</span>
                      <span className="text-sm font-medium">Tidak ada komentar di kategori ini</span>
                    </div>
                  )}
                  {!commentsLoading && commentsList.map(c => {
                    const status = c.status || 'approved';
                    const isPending = status === 'pending';
                    const isApproved = status === 'approved';
                    const isRejected = status === 'rejected';
                    const isModding = moderatingId === c._id;

                    return (
                      <div key={c._id} className="p-5 hover:bg-surface-bright/20 transition-colors group flex flex-col sm:flex-row gap-4 justify-between items-start">
                        <div className="flex gap-4 min-w-0 flex-1">
                          {/* Avatar */}
                          <div className="w-10 h-10 rounded-full bg-surface-container border border-border-subtle flex-shrink-0 overflow-hidden mt-0.5">
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
                            <div className="flex items-start justify-between mb-1.5 gap-3 flex-wrap">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-on-surface text-sm">{c.displayName}</span>
                                {c.isAdmin && (
                                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-status-expired/20 text-status-expired border border-status-expired/30">Admin</span>
                                )}
                                {c.isPremium && !c.isAdmin && (
                                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-status-pending/20 text-status-pending border border-status-pending/30">Premium</span>
                                )}
                                
                                {/* Status badge */}
                                {isPending && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-status-pending/20 text-status-pending border border-status-pending/40 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[11px]">schedule</span>
                                    Menunggu Moderasi
                                  </span>
                                )}
                                {isApproved && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-status-active/20 text-status-active border border-status-active/40 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[11px]">check_circle</span>
                                    Disetujui
                                  </span>
                                )}
                                {isRejected && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-status-expired/20 text-status-expired border border-status-expired/40 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[11px]">cancel</span>
                                    Ditolak
                                  </span>
                                )}

                                <span className="text-on-surface-variant text-xs flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[11px]">schedule</span>
                                  {new Date(c.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>

                              <a
                                href={`/anime/${c.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container border border-border-subtle/50 text-on-surface-variant text-xs hover:border-primary-stitch/40 hover:text-primary-stitch transition-colors flex-shrink-0"
                              >
                                <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                                {c.slug}
                              </a>
                            </div>

                            <p className="text-sm text-on-surface/90 leading-relaxed break-words whitespace-pre-wrap bg-surface-container/40 p-3.5 rounded-xl border border-border-subtle/30 font-sans">
                              {c.text}
                            </p>
                          </div>
                        </div>

                        {/* Moderation Actions */}
                        <div className="flex sm:flex-col items-center gap-2 self-end sm:self-center flex-shrink-0 mt-2 sm:mt-0">
                          {!isApproved && (
                            <button
                              disabled={isModding}
                              onClick={() => handleUpdateCommentStatus(c._id, 'approved')}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-status-active/15 text-status-active hover:bg-status-active hover:text-surface-deep border border-status-active/30 transition-all text-xs font-bold disabled:opacity-50"
                              title="Setujui komentar ini"
                            >
                              <span className="material-symbols-outlined text-[14px]">check</span>
                              Setujui
                            </button>
                          )}

                          {!isRejected && (
                            <button
                              disabled={isModding}
                              onClick={() => handleUpdateCommentStatus(c._id, 'rejected')}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-status-pending/15 text-status-pending hover:bg-status-pending hover:text-surface-deep border border-status-pending/30 transition-all text-xs font-bold disabled:opacity-50"
                              title="Tolak komentar ini"
                            >
                              <span className="material-symbols-outlined text-[14px]">block</span>
                              Tolak
                            </button>
                          )}

                          <button
                            disabled={isModding}
                            onClick={() => handleDeleteComment(c._id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-status-expired/10 text-status-expired hover:bg-status-expired hover:text-surface-deep border border-status-expired/20 transition-all text-xs font-bold disabled:opacity-50"
                            title="Hapus komentar ini secara permanen"
                          >
                            <span className="material-symbols-outlined text-[14px]">delete</span>
                            Hapus
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {commentsPagination.totalPages > 1 && (
                  <div className="border-t border-border-subtle/50 px-5 py-3 flex items-center justify-between bg-surface-container/30">
                    <span className="text-xs text-on-surface-variant tabular-nums">
                      Hal {commentsPagination.currentPage} / {commentsPagination.totalPages} ({commentsPagination.totalItems} total)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const p = commentsPage - 1;
                          setCommentsPage(p);
                          loadCommentsList(p, commentsSearch, commentsStatus);
                        }}
                        disabled={commentsPage <= 1}
                        className="px-3.5 py-1.5 rounded-xl bg-surface-elevated border border-border-subtle/50 text-on-surface-variant text-xs font-semibold disabled:opacity-40 hover:border-primary-stitch/40 hover:text-primary-stitch transition"
                      >
                        Prev
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const p = commentsPage + 1;
                          setCommentsPage(p);
                          loadCommentsList(p, commentsSearch, commentsStatus);
                        }}
                        disabled={commentsPage >= commentsPagination.totalPages}
                        className="px-3.5 py-1.5 rounded-xl bg-surface-elevated border border-border-subtle/50 text-on-surface-variant text-xs font-semibold disabled:opacity-40 hover:border-primary-stitch/40 hover:text-primary-stitch transition"
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
