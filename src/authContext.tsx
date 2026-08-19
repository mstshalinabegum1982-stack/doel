import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { initUserPresence } from './services/rtdbEphemeralService';
import { UserProfile } from './types';
import { checkIsAdmin } from './lib/adminConfig';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubSnapshot: (() => void) | null = null;
    let unsubPresence: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          localStorage.setItem('is_admin_device', 'true');
        } catch (e) {}
        // Initialize Realtime Database Presence tracking (isOnline, lastSeen, onDisconnect)
        unsubPresence = initUserPresence(user.uid);
      } else {
        if (unsubPresence) {
          unsubPresence();
          unsubPresence = null;
        }
      }
      if (unsubSnapshot) {
        unsubSnapshot();
        unsubSnapshot = null;
      }

      if (user) {
        const docRef = doc(db, 'users', user.uid);
        
        // Setup real-time listener for profile
        unsubSnapshot = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile({ uid: user.uid, ...docSnap.data() } as UserProfile);
          } else {
            const freshProfile = {
              uid: user.uid,
              name: user.displayName || user.email?.split('@')[0] || 'Admin User',
              email: user.email || '',
              country: 'Bangladesh',
              phone: '01700000000', // standard non-empty phone to meet Firestore registration validation rules
              createdAt: new Date().toISOString(),
              isAdmin: checkIsAdmin(user, null),
              avatar: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`
            };
            import('firebase/firestore').then(({ setDoc }) => {
              const { uid, ...writePayload } = freshProfile;
              setDoc(docRef, writePayload).catch(err => {
                console.warn("Failed to auto-create missing user document under users collection:", err);
              });
            });
            setProfile(freshProfile as UserProfile);
          }
          setLoading(false);
        }, (err) => {
          console.warn("Failed to listen to profile snapshot:", err);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubSnapshot) unsubSnapshot();
    };
  }, []);

  const lastActiveUpdateRef = React.useRef<number>(0);

  useEffect(() => {
    if (!user) return;

    const updatePresence = async () => {
      if (document.hidden) return; // Skip background tabs
      const now = Date.now();
      // Throttle: only update Firestore if at least 15 minutes (900,000 ms) have elapsed
      if (now - lastActiveUpdateRef.current < 900000) {
        return;
      }
      try {
        const { updateDoc } = await import('firebase/firestore');
        const docRef = doc(db, 'users', user.uid);
        await updateDoc(docRef, {
          lastActive: new Date().toISOString()
        });
        lastActiveUpdateRef.current = now;
      } catch (err) {
        console.warn("Failed to update user presence heartbeat:", err);
      }
    };

    // Run immediately on user login
    updatePresence();

    const interval = setInterval(updatePresence, 60000); // Check status every 60 seconds

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updatePresence();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  return { user, profile, loading };
}

export const AuthContext = React.createContext<{
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}>({ user: null, profile: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const authVal = useAuth();
  return <AuthContext.Provider value={authVal}>{children}</AuthContext.Provider>;
}
