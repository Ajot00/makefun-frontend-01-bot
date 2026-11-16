export const FRESH_MS = 60_000;
const responseCache = new Map();
const activeRequests = new Map();
export const requestStats = { requests: 0, cached: 0, notModified: 0, updated: '' };

function persist(cacheKey, record) {
  const packed = JSON.stringify(record);
  if (packed.length < 3_000_000) {
    try { localStorage.setItem(cacheKey, packed); } catch { /* Large public lists stay in memory. */ }
  }
}

async function fetchWithRetry(url, cacheKey, previous) {
  const headers = previous?.etag ? { 'If-None-Match': previous.etag } : {};
  let response;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      requestStats.requests++;
      response = await fetch(url, { headers });
      if (response.status < 500 || attempt === 4) break;
    } catch (error) {
      if (attempt === 4) throw error;
    }
    await new Promise(resolve => setTimeout(resolve, 350 * (attempt + 1)));
  }
  if (response.status === 304 && previous) {
    requestStats.notModified++;
    previous.savedAt = Date.now();
    persist(cacheKey, previous);
    requestStats.updated = new Date().toISOString().slice(11, 19);
    return previous.data;
  }
  if (!response.ok) throw new Error(`make.fun answered ${response.status}`);
  const data = await response.json();
  const record = { data, etag: response.headers.get('ETag'), savedAt: Date.now() };
  responseCache.set(cacheKey, record);
  persist(cacheKey, record);
  requestStats.updated = new Date().toISOString().slice(11, 19);
  return data;
}

export function cacheWithEtag(path, { refresh = false } = {}) {
  const url = `https://make.fun/api${path}`;
  const cacheKey = `lightboard:${url}`;
  const memory = responseCache.get(cacheKey);
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(cacheKey) || 'null'); } catch { saved = null; }
  const previous = memory || saved;
  if (previous && !refresh) {
    requestStats.cached++;
    if (Date.now() - previous.savedAt >= FRESH_MS) fetchWithRetry(url, cacheKey, previous).catch(() => {});
    else if (!memory) responseCache.set(cacheKey, previous);
    return Promise.resolve(previous.data);
  }
  if (activeRequests.has(cacheKey)) return activeRequests.get(cacheKey);
  const pending = fetchWithRetry(url, cacheKey, previous).finally(() => activeRequests.delete(cacheKey));
  activeRequests.set(cacheKey, pending);
  return pending;
}

export async function getBounties(status) {
  const items = [], seen = new Set();
  let cursor = '';
  do {
    const page = await cacheWithEtag(`/competitions?status=${encodeURIComponent(status)}&activity=times&limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);
    items.push(...(page.items || []));
    cursor = page.next_cursor || '';
    if (cursor && seen.has(cursor)) break;
    if (cursor) seen.add(cursor);
  } while (cursor);
  return { items };
}
export const getBounty = slug => cacheWithEtag(`/competitions/${encodeURIComponent(slug)}?submissions=summary`);
export const getRecentSubmissions = (slug, cursor = '') => cacheWithEtag(`/competitions/${encodeURIComponent(slug)}/submissions?limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);
export const getLeaderboard = slug => cacheWithEtag(`/competitions/${encodeURIComponent(slug)}/leaderboard?phase=dev&view=overall&rows=all&ties=ids`);
export const getProfile = handle => cacheWithEtag(`/profiles/${encodeURIComponent(handle)}`);
