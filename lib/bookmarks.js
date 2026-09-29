export const WATCH_STATUS = {
  WATCHING: 'watching',
  TO_WATCH: 'to_watch',
  FINISHED: 'finished',
  DROPPED: 'dropped',
};

export const WATCH_STATUS_LABEL = {
  watching: 'Sedang Ditonton',
  to_watch: 'Mau Nonton',
  finished: 'Selesai',
  dropped: 'Dihentikan',
};

// Keep old READING_STATUS as alias for backward compat with any leftover refs
export const READING_STATUS = WATCH_STATUS;

function proxyBase() {
  if (typeof window !== 'undefined') {
    return '/api';
  }
  const isDev = process.env.NODE_ENV === 'development';
  const siteUrl = isDev
    ? 'http://localhost:3000'
    : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
  return `${siteUrl.replace(/\/+$/, '')}/api`;
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${proxyBase()}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    ...options,
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || `HTTP ${res.status}`);
  }
  return json.data;
}

export async function addBookmark(userId, anime, watchStatus = WATCH_STATUS.WATCHING) {
  await apiFetch(`/users/${userId}/library`, {
    method: 'POST',
    body: JSON.stringify({
      slug: anime.slug,
      mangaData: {
        title: anime.title || '',
        coverImage: anime.coverImage || anime.thumb || '',
        type: anime.type || '',
        status: anime.status || '',
        rating: anime.rating || 0,
        readingStatus: watchStatus,
        lastChapterTitle: anime.lastEpisodeTitle || anime.last_episode || '',
        lastChapterSlug: anime.lastEpisodeSlug || anime.last_episode_slug || '',
      },
    }),
  });
}

export async function removeBookmark(userId, animeSlug) {
  await apiFetch(`/users/${userId}/library/${encodeURIComponent(animeSlug)}`, {
    method: 'DELETE',
  });
}

export async function updateWatchStatus(userId, animeSlug, watchStatus) {
  const library = await apiFetch(`/users/${userId}/library`);
  const item = library.find(b => b.slug === animeSlug);
  if (!item) return;

  await apiFetch(`/users/${userId}/library`, {
    method: 'POST',
    body: JSON.stringify({
      slug: animeSlug,
      mangaData: { ...item.mangaData, readingStatus: watchStatus },
    }),
  });
}

// Keep old name as alias
export const updateReadingStatus = updateWatchStatus;

export async function isBookmarked(userId, animeSlug) {
  if (!userId || !animeSlug) return false;
  try {
    const library = await apiFetch(`/users/${userId}/library`);
    return library.some(b => b.slug === animeSlug);
  } catch {
    return false;
  }
}

export async function getBookmarkData(userId, animeSlug) {
  if (!userId || !animeSlug) return null;
  try {
    const library = await apiFetch(`/users/${userId}/library`);
    const item = library.find(b => b.slug === animeSlug);
    if (!item) return null;
    return normalizeLibraryItem(item);
  } catch {
    return null;
  }
}

export async function getUserBookmarks(userId) {
  if (!userId) return [];
  try {
    const library = await apiFetch(`/users/${userId}/library`);
    return library.map(normalizeLibraryItem);
  } catch (err) {
    console.error('[Bookmarks] getUserBookmarks error:', err.message);
    return [];
  }
}

export async function getPublicBookmarks(userId) {
  if (!userId) return [];
  try {
    const profile = await apiFetch(`/users/${userId}/public-profile`);
    return (profile.library || []).map(normalizeLibraryItem);
  } catch (err) {
    console.error('[Bookmarks] getPublicBookmarks error:', err.message);
    return [];
  }
}

export function calcBookmarkStats(bookmarks) {
  return bookmarks.reduce(
    (acc, b) => {
      const s = b.watchStatus || WATCH_STATUS.WATCHING;
      if (s === WATCH_STATUS.WATCHING) acc.watching++;
      else if (s === WATCH_STATUS.TO_WATCH) acc.toWatch++;
      else if (s === WATCH_STATUS.FINISHED) acc.finished++;
      else if (s === WATCH_STATUS.DROPPED) acc.dropped++;
      return acc;
    },
    { watching: 0, toWatch: 0, finished: 0, dropped: 0 }
  );
}

export async function toggleBookmark(userId, anime, watchStatus = WATCH_STATUS.WATCHING) {
  const already = await isBookmarked(userId, anime.slug);
  if (already) {
    await removeBookmark(userId, anime.slug);
    return false;
  } else {
    await addBookmark(userId, anime, watchStatus);
    return true;
  }
}

function normalizeLibraryItem(item) {
  if (!item) return null;
  const d = item.mangaData || {};
  return {
    id: item.slug,
    slug: item.slug,
    title: d.title || '',
    coverImage: d.coverImage || '',
    type: d.type || '',
    status: d.status || '',
    rating: d.rating || 0,
    watchStatus: d.readingStatus || WATCH_STATUS.WATCHING,
    // keep old readingStatus alias
    readingStatus: d.readingStatus || WATCH_STATUS.WATCHING,
    lastEpisode: d.lastChapterTitle || '',
    lastEpisodeSlug: d.lastChapterSlug || '',
    // legacy aliases
    lastChapter: d.lastChapterTitle || '',
    lastChapterSlug: d.lastChapterSlug || '',
    addedAt: item.addedAt,
    mangaData: d,
  };
}
