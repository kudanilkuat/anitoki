/**
 * lib/anilist.js
 * Comprehensive integration with AniList GraphQL API (https://graphql.anilist.co)
 * Provides querying, rate-limit management, smart multi-strategy searching,
 * and meta mapping for Anitoki anime documents.
 */

const ANILIST_GRAPHQL_ENDPOINT = 'https://graphql.anilist.co';

const MEDIA_FIELDS = `
  id
  idMal
  title {
    romaji
    english
    native
  }
  isAdult
  synonyms
  format
  status
  description(asHtml: false)
  startDate {
    year
    month
    day
  }
  endDate {
    year
    month
    day
  }
  season
  seasonYear
  episodes
  duration
  countryOfOrigin
  coverImage {
    extraLarge
    large
    medium
    color
  }
  bannerImage
  genres
  tags {
    name
    rank
    isMediaSpoiler
  }
  averageScore
  meanScore
  popularity
  studios {
    edges {
      isMain
      node {
        id
        name
        isAnimationStudio
      }
    }
  }
`;

const SINGLE_MEDIA_QUERY = `
  query ($id: Int, $idMal: Int, $search: String) {
    Media(id: $id, idMal: $idMal, search: $search, type: ANIME) {
      ${MEDIA_FIELDS}
    }
  }
`;

const SEARCH_MEDIA_PAGE_QUERY = `
  query ($search: String, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        total
        currentPage
        lastPage
        hasNextPage
      }
      media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
        ${MEDIA_FIELDS}
      }
    }
  }
`;

// Helper sleep
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Strip HTML tags and markdown formatting from description
export function cleanDescription(raw) {
  if (!raw) return '';
  return raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\(Source:.*?\)/gi, '')
    .trim();
}

// Clean title for search
export function cleanSearchTitle(raw) {
  if (!raw) return '';
  return raw
    .replace(/\s*(?:Subtitle\s+Indonesia|Sub\s+Indo|BD|Batch|Complete|Ongoing|End|Tamat|Lengkap).*$/i, '')
    .replace(/\s*\[(?:1080p|720p|480p|360p|HEVC|x265|x264|H264|AAC|WEB-DL)\]/gi, '')
    .replace(/\s*\((?:19\d\d|20\d\d|\d{4})\)/g, '') // remove release year in parentheses
    .replace(/\s*:\s*/g, ': ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Executes a GraphQL request to AniList with rate limiting and automatic retries
 */
export async function fetchAniListGraphQL(query, variables = {}, retries = 3, accessToken = null) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(ANILIST_GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables }),
      });

      // Handle Unauthorized (Invalid or expired token)
      if (response.status === 401) {
        return { data: null, unauthorized: true, errors: [{ message: 'AniList token tidak valid atau kedaluwarsa' }] };
      }

      // Handle Rate Limit (HTTP 429)
      if (response.status === 429) {
        const retryAfterSec = parseInt(response.headers.get('retry-after') || '60', 10);
        console.warn(`[AniList] Rate limit reached (429). Waiting ${retryAfterSec}s before retrying...`);
        await sleep(Math.min(retryAfterSec, 60) * 1000 + 1000);
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        // If 404 Not Found from AniList GraphQL, it means no media matched
        if (response.status === 404) {
          return { data: null, notFound: true };
        }
        throw new Error(`AniList HTTP ${response.status}: ${errorText}`);
      }

      const json = await response.json();
      if (json.errors && json.errors.length > 0) {
        // If "Not Found." error in GraphQL body
        const isNotFound = json.errors.some(e => e.message?.toLowerCase().includes('not found') || e.status === 404);
        if (isNotFound) {
          return { data: null, notFound: true };
        }
        console.warn('[AniList GraphQL Warning]:', json.errors[0]?.message);
      }

      return json;
    } catch (err) {
      if (attempt === retries) {
        console.error(`[AniList Error] Failed after ${retries} attempts:`, err.message);
        throw err;
      }
      console.warn(`[AniList Warning] Attempt ${attempt} failed (${err.message}). Retrying in 2s...`);
      await sleep(2000);
    }
  }

  return { data: null };
}

/**
 * Search anime on AniList with pagination
 */
export async function searchAniList(search, page = 1, perPage = 5) {
  const cleaned = cleanSearchTitle(search);
  if (!cleaned) return [];

  const res = await fetchAniListGraphQL(SEARCH_MEDIA_PAGE_QUERY, {
    search: cleaned,
    page,
    perPage,
  });

  return res?.data?.Page?.media || [];
}

/**
 * Fetch anime by AniList ID
 */
export async function getAniListById(id) {
  if (!id) return null;
  const res = await fetchAniListGraphQL(SINGLE_MEDIA_QUERY, { id: Number(id) });
  return res?.data?.Media || null;
}

/**
 * Fetch anime by MyAnimeList ID
 */
export async function getAniListByMalId(idMal) {
  if (!idMal) return null;
  const res = await fetchAniListGraphQL(SINGLE_MEDIA_QUERY, { idMal: Number(idMal) });
  return res?.data?.Media || null;
}

/**
 * Rank AniList candidates against the target anime to prevent matching
 * low-popularity specials or spin-offs over main series.
 */
export function rankAniListCandidate(candidate, targetTitle, targetMeta = {}) {
  let score = 0;
  const cleanTarget = cleanSearchTitle(targetTitle).toLowerCase().trim();

  const romaji = (candidate.title?.romaji || '').toLowerCase().trim();
  const english = (candidate.title?.english || '').toLowerCase().trim();
  const native = (candidate.title?.native || '').toLowerCase().trim();
  const targetNative = (targetMeta.nativeTitle || '').toLowerCase().trim();
  const synonyms = (candidate.synonyms || []).map(s => (s || '').toLowerCase().trim());

  // 1. Exact match bonus
  if (romaji === cleanTarget || english === cleanTarget || synonyms.includes(cleanTarget)) {
    score += 1000;
  } else if (targetNative && native === targetNative) {
    score += 1000;
  } else if (romaji.startsWith(cleanTarget) || cleanTarget.startsWith(romaji)) {
    score += 250;
  }

  // 2. Format matching
  const targetType = (targetMeta.type || '').toUpperCase();
  const candFormat = (candidate.format || '').toUpperCase();
  const isCandHentai = candidate.isAdult || candidate.genres?.includes('Hentai');

  if (targetType === 'HENTAI') {
    if (isCandHentai) score += 300;
  } else if (targetType === 'TV' || targetType === 'SERIES' || targetType === 'BD') {
    if (candFormat === 'TV' || candFormat === 'TV_SHORT') score += 150;
    else if (candFormat === 'SPECIAL' || candFormat === 'MUSIC') score -= 200;
  } else if (targetType === 'MOVIE') {
    if (candFormat === 'MOVIE') score += 200;
    else score -= 100;
  }

  // 3. Episode count matching
  const epCount = targetMeta.episodesCount || (Array.isArray(targetMeta.episodes) ? targetMeta.episodes.length : (targetMeta.totalEpisode || 0));
  if (epCount > 1 && candidate.episodes > 1) {
    score += 50;
    if (Math.abs(epCount - candidate.episodes) <= 2) {
      score += 150;
    }
  } else if (epCount > 5 && candidate.episodes === 1) {
    // Target is multi-episode series but candidate is 1-ep special
    score -= 350;
  }

  // 4. Popularity tie-breaker
  if (candidate.popularity) {
    score += Math.min(Math.log10(candidate.popularity) * 10, 50);
  }

  return score;
}

/**
 * Smart multi-strategy search that handles light-novel titles, season tags,
 * native titles, and punctuation variations.
 */
export async function findBestAniListMatch({ title, nativeTitle, slug, anilistId, malId, type, episodes, episodesCount, totalEpisode }) {
  // Strategy 1: Direct ID
  if (anilistId) {
    const direct = await getAniListById(anilistId);
    if (direct) return direct;
  }

  if (malId) {
    const directMal = await getAniListByMalId(malId);
    if (directMal) return directMal;
  }

  const queries = [];
  const cleanedTitle = cleanSearchTitle(title);

  if (cleanedTitle) {
    queries.push(cleanedTitle);

    // If title has season formatting like "Season 2", try "2nd Season" or Roman numerals "II"
    if (/Season\s+2\b/i.test(cleanedTitle)) {
      queries.push(cleanedTitle.replace(/Season\s+2\b/i, '2nd Season'));
      queries.push(cleanedTitle.replace(/Season\s+2\b/i, 'II'));
    } else if (/Season\s+3\b/i.test(cleanedTitle)) {
      queries.push(cleanedTitle.replace(/Season\s+3\b/i, '3rd Season'));
      queries.push(cleanedTitle.replace(/Season\s+3\b/i, 'III'));
    } else if (/Season\s+4\b/i.test(cleanedTitle)) {
      queries.push(cleanedTitle.replace(/Season\s+4\b/i, '4th Season'));
      queries.push(cleanedTitle.replace(/Season\s+4\b/i, 'IV'));
    }

    // If title has colon or dash, try prefix
    if (cleanedTitle.includes(':')) {
      const prefix = cleanedTitle.split(':')[0].trim();
      if (prefix.length >= 4) queries.push(prefix);
    }

    // Long titles (common in light novel adaptations) often fail exact match because of minor word differences.
    // Try first 4-5 words.
    const words = cleanedTitle.split(' ');
    if (words.length > 5) {
      queries.push(words.slice(0, 5).join(' '));
      queries.push(words.slice(0, 4).join(' '));
    }
  }

  // Strategy with Native Title (Japanese Kanji/Kana)
  if (nativeTitle && nativeTitle.trim()) {
    queries.push(nativeTitle.trim());
    // Try stripping symbols in Japanese title
    const cleanJap = nativeTitle.replace(/[-～―：!！?？★☆]/g, ' ').replace(/\s+/g, ' ').trim();
    if (cleanJap && cleanJap !== nativeTitle.trim()) {
      queries.push(cleanJap);
    }
  }

  // Fallback with Slug
  if (slug) {
    const fromSlug = slug.replace(/-/g, ' ').trim();
    if (fromSlug && !queries.includes(fromSlug)) {
      queries.push(fromSlug);
    }
  }

  // Remove duplicates while keeping order
  const uniqueQueries = [...new Set(queries.filter(Boolean))];

  for (const q of uniqueQueries) {
    const list = await searchAniList(q, 1, 6);
    if (list && list.length > 0) {
      const ranked = list
        .map(c => ({
          candidate: c,
          score: rankAniListCandidate(c, title || q, { type, episodes, episodesCount, totalEpisode, nativeTitle })
        }))
        .sort((a, b) => b.score - a.score);

      if (ranked[0] && ranked[0].score > 0) {
        return ranked[0].candidate;
      }
    }
    await sleep(250); // slight throttle
  }

  return null;
}

/**
 * Format AniList Start Date into readable text (e.g., "Jul 05, 2026")
 */
export function formatAniListDate(dateObj) {
  if (!dateObj || !dateObj.year) return null;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const y = dateObj.year;
  const m = dateObj.month ? months[dateObj.month - 1] : null;
  const d = dateObj.day ? String(dateObj.day).padStart(2, '0') : null;

  if (m && d) return `${m} ${d}, ${y}`;
  if (m) return `${m} ${y}`;
  return `${y}`;
}

/**
 * Map AniList format to Anitoki standard format
 */
export function mapFormat(anilistFormat) {
  switch (anilistFormat) {
    case 'TV':
    case 'TV_SHORT':
      return 'TV';
    case 'MOVIE':
      return 'Movie';
    case 'OVA':
      return 'OVA';
    case 'ONA':
      return 'ONA';
    case 'SPECIAL':
      return 'Special';
    case 'MUSIC':
      return 'Music';
    default:
      return 'Anime';
  }
}

/**
 * Map AniList status to Anitoki standard status
 */
export function mapStatus(anilistStatus) {
  switch (anilistStatus) {
    case 'FINISHED':
      return 'Completed';
    case 'RELEASING':
      return 'Ongoing';
    case 'NOT_YET_RELEASED':
      return 'Upcoming';
    case 'CANCELLED':
      return 'Cancelled';
    case 'HIATUS':
      return 'Hiatus';
    default:
      return 'Completed';
  }
}

/**
 * Map AniList Media object to Anitoki Anime schema fields cleanly
 */
export function mapAniListToAnime(media, currentAnime = {}, options = {}) {
  if (!media) return null;

  const {
    preserveIndonesianSynopsis = true,
    overwriteCover = false,
  } = options;

  // Rating: AniList averageScore is 0-100. Anitoki uses standard 1-10 scale.
  let rating = currentAnime.rating || 0;
  if (media.averageScore) {
    rating = parseFloat((media.averageScore / 10).toFixed(2));
  } else if (media.meanScore) {
    rating = parseFloat((media.meanScore / 10).toFixed(2));
  }

  // Studios and Producers
  let studio = currentAnime.studio || '';
  const producerList = [];

  if (media.studios?.edges?.length > 0) {
    const mainStudios = media.studios.edges
      .filter(e => e.isMain || e.node?.isAnimationStudio)
      .map(e => e.node?.name)
      .filter(Boolean);

    const producers = media.studios.edges
      .filter(e => !e.isMain && !e.node?.isAnimationStudio)
      .map(e => e.node?.name)
      .filter(Boolean);

    if (mainStudios.length > 0) {
      studio = mainStudios.join(', ');
    }
    if (producers.length > 0) {
      producerList.push(...producers);
    }
  }

  const producer = producerList.length > 0
    ? producerList.join(', ')
    : (currentAnime.producer || '');

  // Genres: sanitize and remove empty strings
  const cleanGenres = Array.from(new Set([
    ...(media.genres || []),
    ...(Array.isArray(currentAnime.genres) ? currentAnime.genres : [])
  ]))
    .map(g => (g || '').toString().trim())
    .filter(Boolean);

  // Duration
  let duration = currentAnime.duration || '';
  if (media.duration) {
    duration = `${media.duration} Menit`;
  }

  // Cover & Banner
  const bannerImage = media.bannerImage || currentAnime.bannerImage || null;
  const aniCover = media.coverImage?.extraLarge || media.coverImage?.large || '';
  const coverImage = (overwriteCover || !currentAnime.coverImage) && aniCover
    ? aniCover
    : (currentAnime.coverImage || aniCover);

  // Air Date
  const airDate = currentAnime.airDate || formatAniListDate(media.startDate) || '';

  // Synopsis
  const synopsisEn = cleanDescription(media.description);
  let synopsis = currentAnime.synopsis || '';
  if (!synopsis || (!preserveIndonesianSynopsis && synopsisEn)) {
    synopsis = synopsisEn;
  }

  // Total Episode
  const totalEpisode = media.episodes || currentAnime.totalEpisode || 0;

  return {
    anilistId: media.id,
    malId: media.idMal || null,
    nativeTitle: media.title?.native || currentAnime.nativeTitle || '',
    englishTitle: media.title?.english || null,
    romajiTitle: media.title?.romaji || null,
    bannerImage,
    coverImage,
    rating,
    type: (currentAnime.type === 'Hentai' || media.isAdult || media.genres?.includes('Hentai')) ? 'Hentai' : mapFormat(media.format),
    status: currentAnime.status || mapStatus(media.status),
    studio,
    producer,
    duration,
    totalEpisode,
    genres: cleanGenres,
    airDate,
    synopsis,
    synopsisEn,
    season: media.season || null,
    seasonYear: media.seasonYear || null,
    color: media.coverImage?.color || null,
    lastUpdated: currentAnime.lastUpdated || new Date(),
  };
}

/**
 * Exchange OAuth2 code for an AniList Access Token
 */
export async function exchangeAniListCode(code, redirectUri) {
  const clientId = process.env.ANILIST_CLIENT_ID || process.env.NEXT_PUBLIC_ANILIST_CLIENT_ID;
  const clientSecret = process.env.ANILIST_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('ANILIST_CLIENT_ID atau ANILIST_CLIENT_SECRET belum dikonfigurasi di .env');
  }

  const res = await fetch('https://anilist.co/api/v2/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    }),
  });

  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json.message || json.error_description || json.error || 'Gagal menukarkan OAuth code AniList');
  }

  return json; // { token_type: 'Bearer', expires_in: number, access_token: string }
}

/**
 * Fetch authenticated AniList Viewer profile
 */
export async function getAniListViewer(accessToken) {
  if (!accessToken) return null;
  const query = `
    query {
      Viewer {
        id
        name
        avatar {
          large
          medium
        }
      }
    }
  `;
  const res = await fetchAniListGraphQL(query, {}, 2, accessToken);
  return res?.data?.Viewer || null;
}

/**
 * Fetch current user's entry for a specific anime
 */
export async function getMediaListEntry(accessToken, mediaId) {
  if (!accessToken || !mediaId) return null;
  const query = `
    query ($mediaId: Int) {
      MediaList (mediaId: $mediaId) {
        id
        mediaId
        status
        progress
        score
      }
    }
  `;
  const res = await fetchAniListGraphQL(query, { mediaId: Number(mediaId) }, 2, accessToken);
  return res?.data?.MediaList || null;
}

/**
 * Save / Update watch progress to AniList
 * status: CURRENT (Watching), COMPLETED, PLANNING, DROPPED, PAUSED, REPEATING
 */
export async function saveMediaProgress(accessToken, { mediaId, progress, status = 'CURRENT' }) {
  if (!accessToken) throw new Error('AniList access token tidak ditemukan');
  if (!mediaId) throw new Error('mediaId AniList diperlukan');

  const mutation = `
    mutation ($mediaId: Int, $progress: Int, $status: MediaListStatus) {
      SaveMediaListEntry (mediaId: $mediaId, progress: $progress, status: $status) {
        id
        mediaId
        status
        progress
      }
    }
  `;

  const variables = {
    mediaId: Number(mediaId),
    progress: Number(progress) || 1,
    status,
  };

  const res = await fetchAniListGraphQL(mutation, variables, 2, accessToken);

  if (res?.unauthorized) {
    throw new Error('UNAUTHORIZED_TOKEN');
  }

  if (res?.errors && res.errors.length > 0) {
    throw new Error(res.errors[0]?.message || 'Gagal menyimpan progress ke AniList');
  }

  return res?.data?.SaveMediaListEntry || null;
}

