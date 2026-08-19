import { doc, getDoc, Firestore } from 'firebase/firestore';

// In-memory cache to prevent repetitive Firestore user document reads
const userCache = new Map<string, { name: string; phone?: string; timestamp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

export async function getCachedUserName(db: Firestore, userId: string): Promise<string> {
  if (!userId || userId === 'customer_public') return '';

  const now = Date.now();
  const cached = userCache.get(userId);
  if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
    return cached.name;
  }

  try {
    const sDoc = await getDoc(doc(db, 'users', userId));
    if (sDoc.exists()) {
      const data = sDoc.data();
      const name = data?.name || data?.phone || data?.email || 'User';
      userCache.set(userId, { name, phone: data?.phone, timestamp: now });
      return name;
    }
  } catch (err) {
    console.warn(`[userCache] Error fetching user ${userId}:`, err);
  }

  return '';
}

export function primeUserCache(userId: string, name: string, phone?: string) {
  if (!userId) return;
  userCache.set(userId, { name, phone, timestamp: Date.now() });
}
