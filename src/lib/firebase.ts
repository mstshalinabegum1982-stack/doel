import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  getFirestore,
  persistentLocalCache, 
  persistentMultipleTabManager
} from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize Firestore with forced long polling and multi-tab persistent local cache to prevent 10s timeout warnings in iframe/proxy environments
let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(
    app,
    {
      experimentalForceLongPolling: true,
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    },
    firebaseConfig.firestoreDatabaseId
  );
} catch {
  // Fallback if cache settings are already initialized or fail in iframe
  try {
    firestoreInstance = initializeFirestore(
      app,
      {
        experimentalForceLongPolling: true
      },
      firebaseConfig.firestoreDatabaseId
    );
  } catch {
    // If already initialized elsewhere, fallback to getFirestore
    firestoreInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
}

export const db = firestoreInstance;

// Initialize Firebase Realtime Database (RTDB) for Ephemeral state (Presence, Typing, Unread counters, Call signaling)
export const rtdb = getDatabase(
  app, 
  (firebaseConfig as any).databaseURL || `https://${firebaseConfig.projectId}-default-rtdb.firebaseio.com`
);

export const auth = getAuth(app);

// Global User Profile Cache helper (Memory & LocalStorage) to minimize redundant Firestore reads
const PROFILE_CACHE_KEY = 'dragon_user_profile_cache_map';

export function getCachedUserProfile(uid: string): any | null {
  if (!uid) return null;
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    if (raw) {
      const map = JSON.parse(raw);
      const entry = map[uid];
      // Cache valid for 30 minutes unless refreshed
      if (entry && Date.now() - (entry._cachedAt || 0) < 30 * 60 * 1000) {
        return entry;
      }
    }
  } catch {
    // Fail-safe silently
  }
  return null;
}

export function setCachedUserProfile(uid: string, profileData: any): void {
  if (!uid || !profileData) return;
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[uid] = { ...profileData, _cachedAt: Date.now() };
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(map));
  } catch {
    // Fail-safe silently
  }
}

// Test Firestore connection check on boot has been removed to avoid false-positive offline logs in the builder environment.

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  
  if (errInfo.error.includes('permissions') || errInfo.error.includes('denied')) {
    alert('Permission Denied: You do not have access to perform this action. Please check your account status.');
  } else {
    alert('Database Error: ' + errInfo.error);
  }

  throw new Error(JSON.stringify(errInfo));
}
