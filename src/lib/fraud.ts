import { doc, getDoc, setDoc, arrayUnion, updateDoc, increment } from 'firebase/firestore';
import { db, auth } from './firebase';

/**
 * Returns the browser's persistent device token from localStorage,
 * generating a new one if it does not already exist.
 */
export function getOrInitDeviceToken(): string {
  let token = localStorage.getItem('fraud_device_token');
  if (!token) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    token = Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    localStorage.setItem('fraud_device_token', token);
  }
  return token;
}

/**
 * Normalizes phone numbers to standard format (keeps only digits, matches last 10 digits to prevent prefix evasion).
 */
export function cleanPhoneNumber(ph: string): string {
  const nums = ph.replace(/\D/g, '');
  return nums.length >= 10 ? nums.slice(-10) : nums;
}

/**
 * Checks if the URL contains a reference tracking token (?ft=...) from a copied link.
 * If the source token was blocked, it instantly links and blocks the current browser's token.
 * Also keeps the url query parameter in sync so if the link is copied, it preserves the trace.
 */
export async function checkCopyLinkTracking(sellerId: string): Promise<void> {
  const currentToken = getOrInitDeviceToken();
  const searchParams = new URLSearchParams(window.location.search);
  const sourceToken = searchParams.get('ft');

  // Ensure 'ft' is always in the URL for copy linkage tracking
  if (!sourceToken || sourceToken !== currentToken) {
    searchParams.set('ft', currentToken);
    const newRelativePathQuery = window.location.pathname + '?' + searchParams.toString() + window.location.hash;
    window.history.replaceState(null, '', newRelativePathQuery);
  }

  // If we came from some source token, check if that source was blacklisted (either locally or globally!)
  if (sourceToken && sourceToken !== currentToken) {
    try {
      const localSourceRef = doc(db, 'fraud_blacklist', `${sellerId}_token_${sourceToken}`);
      const globalSourceRef = doc(db, 'fraud_blacklist', `global_token_${sourceToken}`);
      
      const [localSnap, globalSnap] = await Promise.all([
        getDoc(localSourceRef),
        getDoc(globalSourceRef)
      ]);

      if (localSnap.exists() || globalSnap.exists()) {
        const data = localSnap.exists() ? localSnap.data() : globalSnap.data();
        if (!data) return;

        // The source was blocked, so block this new device token as well locally and globally!
        const currentLocalRef = doc(db, 'fraud_blacklist', `${sellerId}_token_${currentToken}`);
        const currentGlobalRef = doc(db, 'fraud_blacklist', `global_token_${currentToken}`);
        
        const payload = {
          sellerId,
          type: 'token',
          value: currentToken,
          blockedAt: new Date().toISOString(),
          attemptsCount: 0,
          associatedNumbers: data.associatedNumbers || [],
          associatedTokens: arrayUnion(sourceToken),
          reason: `Auto-blocked: Copied link from blocked device ${sourceToken}`
        };

        await Promise.all([
          setDoc(currentLocalRef, payload, { merge: true }),
          setDoc(currentGlobalRef, { ...payload, sellerId: 'global' }, { merge: true })
        ]);
        
        console.warn(`[Fraud System] Browser token ${currentToken} successfully auto-blocked both locally and globally due to copied link association with ${sourceToken}`);
      }
    } catch (err) {
      console.error("Error evaluating copy-link fraud check:", err);
    }
  }
}

// In-memory cache for fast, zero-Firestore fraud check hits
const blacklistMemoryCache = new Map<string, { result: { isBlocked: boolean; blockedBy: 'phone' | 'token' | null; reason?: string } | null; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 Minutes TTL

/**
 * Checks if a customer/visitor is blacklisted by phone number or by device token.
 * Looks up BOTH local (seller specific) and global (shared among all sellers) blacklist databases.
 * Uses a 5-minute memory cache to prevent Firestore read spams.
 */
export async function checkBlacklistStatus(
  sellerId: string, 
  rawPhone: string
): Promise<{ isBlocked: boolean; blockedBy: 'phone' | 'token' | null; reason?: string } | null> {
  const isAdminDevice = !!auth.currentUser || localStorage.getItem('is_admin_device') === 'true';
  if (isAdminDevice) {
    return null; // Admin devices are never blocked
  }

  const currentToken = getOrInitDeviceToken();
  const cleaned = cleanPhoneNumber(rawPhone);
  const cacheKey = `${sellerId}_${currentToken}_${cleaned}`;

  // 0. Check in-memory TTL cache
  const cached = blacklistMemoryCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.result;
  }

  try {
    // 1. Check token status
    if (currentToken) {
      const localTokenRef = doc(db, 'fraud_blacklist', `${sellerId}_token_${currentToken}`);
      const globalTokenRef = doc(db, 'fraud_blacklist', `global_token_${currentToken}`);
      
      const [localTokenSnap, globalTokenSnap] = await Promise.all([
        getDoc(localTokenRef),
        getDoc(globalTokenRef)
      ]);

      if (localTokenSnap.exists()) {
        const res = { isBlocked: true, blockedBy: 'token' as const, reason: localTokenSnap.data().reason };
        blacklistMemoryCache.set(cacheKey, { result: res, expiresAt: Date.now() + CACHE_TTL_MS });
        return res;
      }
      if (globalTokenSnap.exists()) {
        const res = { isBlocked: true, blockedBy: 'token' as const, reason: `${globalTokenSnap.data().reason || 'Universally Blacklisted'} [Universally Blocked]` };
        blacklistMemoryCache.set(cacheKey, { result: res, expiresAt: Date.now() + CACHE_TTL_MS });
        return res;
      }
    }

    // 2. Check phone status
    if (cleaned) {
      const localPhoneRef = doc(db, 'fraud_blacklist', `${sellerId}_phone_${cleaned}`);
      const globalPhoneRef = doc(db, 'fraud_blacklist', `global_phone_${cleaned}`);
      
      const [localPhoneSnap, globalPhoneSnap] = await Promise.all([
        getDoc(localPhoneRef),
        getDoc(globalPhoneRef)
      ]);

      if (localPhoneSnap.exists()) {
        const res = { isBlocked: true, blockedBy: 'phone' as const, reason: localPhoneSnap.data().reason };
        blacklistMemoryCache.set(cacheKey, { result: res, expiresAt: Date.now() + CACHE_TTL_MS });
        return res;
      }
      if (globalPhoneSnap.exists()) {
        const res = { isBlocked: true, blockedBy: 'phone' as const, reason: `${globalPhoneSnap.data().reason || 'Universally Blacklisted'} [Universally Blocked]` };
        blacklistMemoryCache.set(cacheKey, { result: res, expiresAt: Date.now() + CACHE_TTL_MS });
        return res;
      }
    }

    // Clean device/phone
    blacklistMemoryCache.set(cacheKey, { result: null, expiresAt: Date.now() + CACHE_TTL_MS });
  } catch (err) {
    console.error("Error checking blacklist status:", err);
  }

  return null;
}

/**
 * Propagates the block on all associated credentials when a blocked customer tries to submit again with another phone number.
 * Updates both local and global logs synchronously so they are blocked universally.
 */
export async function trackBlockedAttempt(
  sellerId: string,
  rawPhone: string,
  customerName: string
): Promise<void> {
  const currentToken = getOrInitDeviceToken();
  const cleaned = cleanPhoneNumber(rawPhone);

  try {
    // 1. Register/update phone block for this second/new number (local & global)
    if (cleaned) {
      const localPhoneRef = doc(db, 'fraud_blacklist', `${sellerId}_phone_${cleaned}`);
      const globalPhoneRef = doc(db, 'fraud_blacklist', `global_phone_${cleaned}`);
      
      const payload = {
        sellerId,
        type: 'phone',
        value: cleaned,
        blockedAt: new Date().toISOString(),
        attemptsCount: 1, // Will merge and increment later
        associatedNumbers: arrayUnion(cleaned),
        associatedTokens: arrayUnion(currentToken),
        reason: `Secondary block: Attempted with new phone number under blocked device token`
      };

      await Promise.all([
        setDoc(localPhoneRef, payload, { merge: true }),
        setDoc(globalPhoneRef, { ...payload, sellerId: 'global' }, { merge: true })
      ]);
    }

    // 2. Register/update current token block, linking the newly tried phone number into its associated numbers list (local & global)
    const localTokenRef = doc(db, 'fraud_blacklist', `${sellerId}_token_${currentToken}`);
    const globalTokenRef = doc(db, 'fraud_blacklist', `global_token_${currentToken}`);
    
    const tokenPayload = {
      sellerId,
      type: 'token',
      value: currentToken,
      blockedAt: new Date().toISOString(),
      attemptsCount: 1,
      associatedNumbers: cleaned ? arrayUnion(cleaned) : [],
      associatedTokens: arrayUnion(currentToken),
      reason: `Tracking blocks: Blocked customer attempted multiple number inputs`
    };

    await Promise.all([
      setDoc(localTokenRef, tokenPayload, { merge: true }),
      setDoc(globalTokenRef, { ...tokenPayload, sellerId: 'global' }, { merge: true })
    ]);

    // Also increment attempt frequencies in local and global documents
    if (cleaned) {
      const localPhoneRef = doc(db, 'fraud_blacklist', `${sellerId}_phone_${cleaned}`);
      const globalPhoneRef = doc(db, 'fraud_blacklist', `global_phone_${cleaned}`);
      try { await updateDoc(localPhoneRef, { attemptsCount: increment(1) }); } catch (e) {}
      try { await updateDoc(globalPhoneRef, { attemptsCount: increment(1) }); } catch (e) {}
    }
    
    try { await updateDoc(localTokenRef, { attemptsCount: increment(1) }); } catch (e) {}
    try { await updateDoc(globalTokenRef, { attemptsCount: increment(1) }); } catch (e) {}

  } catch (err) {
    console.error("Error propagation of block attempt:", err);
  }
}

/**
 * Records a successful order timestamp in localStorage.
 * Keeps only timestamps from the last 1 hour.
 */
export function recordOrderSuccess(): void {
  const currentToken = getOrInitDeviceToken();
  const storageKey = `order_timestamps_${currentToken}`;
  const now = Date.now();
  
  let attempts: number[] = [];
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      attempts = JSON.parse(raw);
    }
  } catch (e) {
    attempts = [];
  }
  
  // Clean up older than 1 hour (3600000 ms)
  const oneHourAgo = now - 3600000;
  attempts = attempts.filter(ts => ts > oneHourAgo);
  attempts.push(now);
  
  localStorage.setItem(storageKey, JSON.stringify(attempts));
}

/**
 * Checks if the current device is spamming orders of the seller.
 * If abnormal speed is detected, it auto-blocks the token and returns false.
 */
export async function checkOrderRateLimit(
  sellerId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const isAdminDevice = !!auth.currentUser || localStorage.getItem('is_admin_device') === 'true';
  if (isAdminDevice) {
    return { allowed: true }; // Admin testing allows unlimited orders
  }

  const currentToken = getOrInitDeviceToken();
  const storageKey = `order_timestamps_${currentToken}`;
  
  let attempts: number[] = [];
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      attempts = JSON.parse(raw);
    }
  } catch (e) {
    attempts = [];
  }
  
  const now = Date.now();
  // Filter attempts from last 1 hour
  const oneHourAgo = now - 3600000;
  attempts = attempts.filter(ts => ts > oneHourAgo);
  
  // Clean up old entries in localstorage
  localStorage.setItem(storageKey, JSON.stringify(attempts));
  
  // Rate limiting thresholds:
  // 1. More than 3 orders in 1 minute (60000 ms)
  // 2. More than 5 orders in 10 minutes (600000 ms)
  // 3. More than 12 orders in 1 hour (3600000 ms)
  
  const inOneMinute = attempts.filter(ts => ts > (now - 60000)).length;
  const inTenMinutes = attempts.filter(ts => ts > (now - 600000)).length;
  const inOneHour = attempts.length;
  
  let reason = '';
  if (inOneMinute >= 3) {
    reason = `Abnormal high frequency: ${inOneMinute} orders in 1 minute`;
  } else if (inTenMinutes >= 5) {
    reason = `Abnormal high frequency: ${inTenMinutes} orders in 10 minutes`;
  } else if (inOneHour >= 12) {
    reason = `Abnormal high frequency: ${inOneHour} orders in 1 hour`;
  }
  
  if (reason) {
    // Spam detected! Auto-blacklist the browser token locally and globally in Firebase
    console.warn(`[Spam Guard] Blocking token due to spam behavior. Reason: ${reason}`);
    try {
      const localTokenRef = doc(db, 'fraud_blacklist', `${sellerId}_token_${currentToken}`);
      const globalTokenRef = doc(db, 'fraud_blacklist', `global_token_${currentToken}`);
      
      const tokenPayload = {
        sellerId,
        type: 'token',
        value: currentToken,
        blockedAt: new Date().toISOString(),
        attemptsCount: attempts.length,
        associatedNumbers: [],
        associatedTokens: [currentToken],
        reason: `Auto-Blocked by Spam Guard: ${reason}`
      };
      
      await Promise.all([
        setDoc(localTokenRef, tokenPayload, { merge: true }),
        setDoc(globalTokenRef, { ...tokenPayload, sellerId: 'global' }, { merge: true })
      ]);
    } catch (firebaseErr) {
      console.error("Spam Guard failed to write blacklists but still blocking order locally:", firebaseErr);
    }
    
    return { allowed: false, reason };
  }
  
  return { allowed: true };
}
