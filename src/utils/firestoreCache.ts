import { doc, getDoc, DocumentData } from 'firebase/firestore';
import { db } from '../lib/firebase';

const memoryCache = new Map<string, { data: DocumentData | null; timestamp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

/**
 * Cached version of getDoc for static or slowly-changing documents (e.g. global settings).
 * Drastically cuts down Firestore Read counts across component re-mounts and navigation.
 */
export async function getCachedDoc(collectionName: string, docId: string, maxAgeMs = CACHE_TTL_MS): Promise<DocumentData | null> {
  const cacheKey = `${collectionName}/${docId}`;
  const cached = memoryCache.get(cacheKey);

  if (cached && (Date.now() - cached.timestamp < maxAgeMs)) {
    return cached.data;
  }

  try {
    const snap = await getDoc(doc(db, collectionName, docId));
    const data = snap.exists() ? snap.data() : null;
    memoryCache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  } catch (err) {
    console.warn(`[getCachedDoc] Failed to fetch ${cacheKey}:`, err);
    if (cached) return cached.data; // Return stale cache on network failure
    return null;
  }
}

/**
 * Invalidate a cached document key if updated locally
 */
export function invalidateCachedDoc(collectionName: string, docId: string) {
  const cacheKey = `${collectionName}/${docId}`;
  memoryCache.delete(cacheKey);
}
