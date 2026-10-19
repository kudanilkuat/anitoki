const getBase = () => {
  if (typeof window !== 'undefined') {
    return '/api';
  }

  const isDev = process.env.NODE_ENV === 'development';
  const siteUrl = isDev
    ? 'http://localhost:3000'
    : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
  return `${siteUrl.replace(/\/+$/, '')}/api`;
};

export function normalizeAnime(m) {
  if (!m) return null;
  const rating = parseFloat(m.rating) || 0;
  const episodes = Array.isArray(m.episodes) ? m.episodes : [];
  const latestEpisode = episodes[0] || null;
  const genres = Array.isArray(m.genres) ? m.genres.map(g => (g || '').trim()).filter(Boolean) : [];

  return {
    ...m,
    coverImage: m.coverImage || '',
    bannerImage: m.bannerImage || '',
    englishTitle: m.englishTitle || '',
    romajiTitle: m.romajiTitle || '',
    type: m.type || '',
    status: m.status || '',
    synopsis: m.synopsis || '',
    genres,
    tags: genres,
    rating,
    airDate: m.airDate || '',
    producer: m.producer || '',
    duration: m.duration || '',
    episode_count: m.episode_count ?? episodes.length,
    last_episode: m.last_episode || latestEpisode?.title || '',
    last_episode_slug: m.last_episode_slug || latestEpisode?.slug || '',
    last_update: m.lastUpdated || m.updatedAt || null,
  };
}

// Keep backward-compat alias
export const normalizeManga = normalizeAnime;

export function normalizeAnimeList(list = []) {
  return list.map(normalizeAnime);
}

// Keep backward-compat alias
export const normalizeMangaList = normalizeAnimeList;

async function fetchAPI(endpoint, options = {}) {
  const base = getBase();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  try {
    const res = await fetch(`${base}${cleanEndpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'API Error');

    return json;
  } catch (err) {
    console.error(`[API] ${endpoint}:`, err.message);
    return { success: false, data: null, pagination: null, error: err.message };
  }
}

export async function getHomeData() {
  const res = await fetchAPI('/home');
  if (!res.success || !res.data) return res;

  return {
    ...res,
    data: {
      recents: normalizeAnimeList(res.data.recents || []),
      trending: normalizeAnimeList(res.data.trending || []),
      ongoing: normalizeAnimeList(res.data.ongoing || []),
      completed: normalizeAnimeList(res.data.completed || []),
    },
  };
}

export async function getAnimeList(params = {}) {
  const { q, genre, type, status, order, page = 1, limit = 24 } = params;

  const qs = new URLSearchParams();
  qs.set('page', String(page));
  qs.set('limit', String(limit));

  if (q?.trim()) qs.set('q', q.trim());
  if (genre && genre !== 'all') qs.set('genre', genre);
  if (type && type !== 'all') qs.set('type', type);
  if (status && status !== 'all') qs.set('status', status);
  if (order && order !== 'latest') qs.set('order', order);

  const endpoint = `/anime-list?${qs.toString()}`;

  const res = await fetchAPI(endpoint, { cache: 'no-store' });
  if (!res.success || !res.data) return res;

  return {
    ...res,
    data: normalizeAnimeList(Array.isArray(res.data) ? res.data : []),
  };
}

// Keep backward-compat alias
export const getMangaList = getAnimeList;

export async function getAnimeDetail(slug) {
  const res = await fetchAPI(`/anime/${encodeURIComponent(slug)}`);
  if (!res.success || !res.data) return res;

  const info = normalizeAnime(res.data.info);

  const rawEpisodes = Array.isArray(res.data.episodes)
    ? res.data.episodes
    : (Array.isArray(info?.episodes) ? info.episodes : []);

  // Sort by numeric part in title/slug (e.g. "Episode 1", "episode-2")
  const episodes = [...rawEpisodes].sort((a, b) => {
    const numA = parseInt((a.title || a.slug || '').replace(/\D+/g, ''), 10) || 0;
    const numB = parseInt((b.title || b.slug || '').replace(/\D+/g, ''), 10) || 0;
    return numB - numA; // desc: latest first (same as default display)
  });

  return {
    ...res,
    data: {
      info,
      episodes,
      recommendations: normalizeAnimeList(res.data.recommendations || []),
    },
  };
}

// Keep backward-compat alias
export const getMangaDetail = getAnimeDetail;

export async function getEpisode(slug, episodeSlug) {
  const res = await fetchAPI(
    `/episode/${encodeURIComponent(slug)}/${encodeURIComponent(episodeSlug)}`
  );
  if (!res.success || !res.data) return res;

  return {
    ...res,
    data: {
      chapter: res.data.chapter,
      manga: normalizeAnime(res.data.manga),
      navigation: res.data.navigation || { next: null, prev: null },
    },
  };
}

// Keep backward-compat alias
export const getChapter = getEpisode;

export async function getGenres() {
  return fetchAPI('/genres', { cache: 'no-store' });
}

export async function syncUser(userData) {
  return fetchAPI('/users/sync', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

export async function getUser(googleId) {
  return fetchAPI(`/users/${googleId}`);
}

export async function getUserLibrary(googleId) {
  return fetchAPI(`/users/${googleId}/library`);
}

export async function addToLibrary(googleId, { slug, mangaData }) {
  return fetchAPI(`/users/${googleId}/library`, {
    method: 'POST',
    body: JSON.stringify({ slug, mangaData }),
  });
}

export async function removeFromLibrary(googleId, slug) {
  return fetchAPI(`/users/${googleId}/library/${encodeURIComponent(slug)}`, {
    method: 'DELETE',
  });
}

export async function getUserHistory(googleId) {
  return fetchAPI(`/users/${googleId}/history`, { cache: 'no-store' });
}

export async function addToHistory(googleId, historyData) {
  return fetchAPI(`/users/${googleId}/history`, {
    method: 'POST',
    body: JSON.stringify(historyData),
  });
}

export async function removeFromHistory(googleId, slug) {
  return fetchAPI(`/users/${googleId}/history/${encodeURIComponent(slug)}`, {
    method: 'DELETE',
  });
}

export async function clearHistory(googleId, type = null) {
  const qs = type ? `?type=${encodeURIComponent(type)}` : '';
  return fetchAPI(`/users/${googleId}/history${qs}`, { method: 'DELETE' });
}

export async function getUserNotifications(googleId) {
  return fetchAPI(`/users/${googleId}/notifications`);
}

export async function markNotificationsRead(googleId) {
  return fetchAPI(`/users/${googleId}/notifications/read`, {
    method: 'PUT',
  });
}

export async function getPublicProfile(googleId) {
  return fetchAPI(`/users/${googleId}/public-profile`);
}

export async function updateBio(googleId, bio) {
  return fetchAPI(`/users/${googleId}/bio`, {
    method: 'PATCH',
    body: JSON.stringify({ bio }),
  });
}

export async function getAllAnimeSlugs() {
  const res = await fetchAPI(`/anime-list?page=1&limit=1000`);
  if (!res.success || !res.data) return [];
  return normalizeAnimeList(Array.isArray(res.data) ? res.data : []);
}

// Keep backward-compat alias
export const getAllMangaSlugs = getAllAnimeSlugs;

// AniList Integration Helpers
export async function getAniListStatus(uid) {
  if (!uid) return { success: false, connected: false };
  return fetchAPI(`/users/${uid}/anilist`);
}

export async function getAniListAuthUrl(uid, returnTo = '/') {
  const qs = new URLSearchParams({ uid, returnTo }).toString();
  return fetchAPI(`/auth/anilist/url?${qs}`);
}

export async function syncAniListProgress(data) {
  return fetchAPI('/anilist/sync', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAniListSettings(uid, settings) {
  return fetchAPI(`/users/${uid}/anilist`, {
    method: 'PATCH',
    body: JSON.stringify(settings),
  });
}

