import { logEvent } from './firebase';

export const trackPageView = (pageName, pageUrl) =>
  logEvent('page_view', { page_title: pageName, page_location: pageUrl });

export const trackAnimeView = (anime) =>
  logEvent('view_item', {
    item_id: anime.slug,
    item_name: anime.title,
    item_category: anime.type || 'unknown',
    item_variant: anime.status || 'unknown',
    value: anime.rating || 0,
  });

export const trackWatchEpisode = (anime, episodeSlug) =>
  logEvent('watch_episode', {
    anime_slug: anime.slug,
    anime_title: anime.title,
    episode_slug: episodeSlug,
    anime_type: anime.type || 'unknown',
  });

export const trackWatchComplete = (anime, episodeSlug) =>
  logEvent('watch_complete', {
    anime_slug: anime.slug,
    anime_title: anime.title,
    episode_slug: episodeSlug,
  });

export const trackSearch = (keyword, resultCount = 0) =>
  logEvent('search', {
    search_term: keyword,
    result_count: resultCount,
  });

export const trackSearchClick = (keyword, animeSlug) =>
  logEvent('select_search_result', {
    search_term: keyword,
    item_id: animeSlug,
  });

export const trackBookmarkAdd = (anime) =>
  logEvent('add_to_wishlist', {
    item_id: anime.slug,
    item_name: anime.title,
  });

export const trackBookmarkRemove = (animeSlug) =>
  logEvent('remove_from_wishlist', { item_id: animeSlug });

export const trackLogin = (method) =>
  logEvent('login', { method });

export const trackSignUp = (method) =>
  logEvent('sign_up', { method });

export const trackGenreClick = (genre) =>
  logEvent('select_genre', { genre_name: genre });

export const trackFilter = (filterType, filterValue) =>
  logEvent('apply_filter', {
    filter_type: filterType,
    filter_value: filterValue,
  });

export const trackShare = (animeSlug, method) =>
  logEvent('share', { item_id: animeSlug, method });
