import { VendorProfile } from '../types';
import { getVendorsByIds } from './api';

/**
 * Batched, deduped vendor lookups. Requests made in the same tick are collected
 * into a single `?ids=` API call, and results are cached for the session so
 * scrolling and re-visits cost nothing.
 */

const cache = new Map<string, VendorProfile | null>();
const inFlight = new Map<string, Promise<VendorProfile | null>>();

let pendingIds = new Set<string>();
let pendingFlush: Promise<void> | null = null;

async function flush() {
  const ids = Array.from(pendingIds);
  pendingIds = new Set();
  pendingFlush = null;
  try {
    const rows = await getVendorsByIds(ids);
    const found = new Set<string>();
    rows.forEach((v) => { found.add(v.id); cache.set(v.id, v); });
    ids.forEach((id) => { if (!found.has(id)) cache.set(id, null); });
  } catch (err) {
    console.error('Vendor batch lookup failed:', err);
    ids.forEach((id) => cache.set(id, null));
  }
}

export function getCachedVendor(id: string): VendorProfile | null | undefined {
  return cache.get(id);
}

export function fetchVendor(id: string): Promise<VendorProfile | null> {
  if (cache.has(id)) return Promise.resolve(cache.get(id) ?? null);
  const existing = inFlight.get(id);
  if (existing) return existing;

  pendingIds.add(id);
  pendingFlush = pendingFlush ?? Promise.resolve().then(flush);

  const promise = pendingFlush.then(() => {
    inFlight.delete(id);
    return cache.get(id) ?? null;
  });
  inFlight.set(id, promise);
  return promise;
}

export function primeVendors(vendors: VendorProfile[]) {
  vendors.forEach((v) => cache.set(v.id, v));
}
