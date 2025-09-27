import { API_BASE_URL } from '../constants/api';

async function tryFetch(url, options) {
  try {
    const res = await fetch(url, options);
    return res;
  } catch (err) {
    // rethrow to be handled by caller
    throw err;
  }
}

function replaceHost(url, newHost) {
  try {
    const u = new URL(url);
    u.hostname = newHost;
    return u.toString();
  } catch (e) {
    return url;
  }
}

export async function safeFetch(path, options) {
  const primary = `${API_BASE_URL}${path}`;
  const tried = new Set();

  const candidates = [primary];

  // Add emulator and localhost fallbacks if they differ
  if (!primary.includes('10.0.2.2')) candidates.push(replaceHost(primary, '10.0.2.2'));
  // Genymotion host mapping
  if (!primary.includes('10.0.3.2')) candidates.push(replaceHost(primary, '10.0.3.2'));
  if (!primary.includes('localhost')) candidates.push(replaceHost(primary, 'localhost'));
  if (!primary.includes('127.0.0.1')) candidates.push(replaceHost(primary, '127.0.0.1'));

  // If API_BASE_URL contains a LAN IP (192.168.x.x or 10.x.x.x), ensure it's tried explicitly
  try {
    const u = new URL(primary);
    const host = u.hostname;
    if (host && !['localhost', '127.0.0.1', '10.0.2.2', '10.0.3.2'].includes(host)) {
      candidates.push(primary); // primary already includes it, but keep ordering
    }
  } catch (e) {
    // ignore
  }

  let lastErr = null;
  for (const url of candidates) {
    if (tried.has(url)) continue;
    tried.add(url);
    console.log(`[safeFetch] Trying ${url}`);
    try {
      const res = await tryFetch(url, options);
      console.log(`[safeFetch] Success ${url} -> ${res.status}`);
      return res;
    } catch (err) {
      lastErr = err;
      console.warn(`[safeFetch] Failed ${url} -> ${err?.message || err}`);
      // On network error, try next
      if (err && err.message && err.message.includes('Network request failed')) {
        continue;
      }
      // For non-network errors, stop and rethrow
      throw err;
    }
  }
  // If we get here all candidates failed
  throw lastErr || new Error('safeFetch: all candidates failed');
}

export default safeFetch;
