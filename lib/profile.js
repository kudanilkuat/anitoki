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

const profileCache = new Map(); // { userId: { data, expiresAt } }

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

export async function updatePublicProfile(googleId, userData = {}) {
  if (!googleId) return;
  try {
    await apiFetch('/users/sync', {
      method: 'POST',
      body: JSON.stringify({
        googleId,
        email:       userData.email       || '',
        displayName: userData.displayName || '',
        photoURL:    userData.photoURL    || '',
      }),
    });
  } catch (err) {

    console.warn('[Profile] sync error:', err.message);
  }
}

export async function getPublicProfile(userId) {
  if (!userId) return null;
  const now = Date.now();
  const cached = profileCache.get(userId);
  if (cached && cached.expiresAt > now) return cached.data;
  try {
    const data = await apiFetch(`/users/${userId}/public-profile`);
    profileCache.set(userId, { data, expiresAt: now + 30_000 }); // cache 30 detik
    return data;
  } catch (err) {
    console.error('[Profile] getPublicProfile error:', err.message);
    return null;
  }
}

export async function updateBio(userId, bio) {
  if (!userId) return;
  await apiFetch(`/users/${userId}/bio`, {
    method: 'PATCH',
    body: JSON.stringify({ bio }),
  });
}

export async function updateUserProfile(userId, { displayName, photoURL, bio } = {}) {
  if (!userId) throw new Error('userId diperlukan');
  return apiFetch(`/users/${userId}/profile`, {
    method: 'PATCH',
    body: JSON.stringify({
      ...(displayName !== undefined && { displayName }),
      ...(photoURL    !== undefined && { photoURL }),
      ...(bio         !== undefined && { bio }),
    }),
  });
}

export async function updateProfileStats() {}

export function calcUserLevel(totalMinutes = 0) {
  return Math.floor(Math.max(0, totalMinutes) / 60) + 1;
}

export function getUserShortId(uid) {
  if (!uid) return '#0000000';
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = (hash << 5) - hash + uid.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);
  const sixDigit = String(positiveHash % 10000000).padStart(7, '0');
  return `#${sixDigit}`;
}
