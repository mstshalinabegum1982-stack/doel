import { 
  ref, 
  set, 
  onValue, 
  onDisconnect, 
  serverTimestamp, 
  push, 
  onChildAdded, 
  remove, 
  update,
  runTransaction
} from 'firebase/database';
import { rtdb } from '../lib/firebase';

/**
 * 1. USER PRESENCE STATE (isOnline, lastSeen)
 * Uses RTDB .info/connected and onDisconnect for zero-cost real-time presence tracking.
 */
export function initUserPresence(uid: string) {
  if (!uid || !rtdb) return () => {};

  try {
    const connectedRef = ref(rtdb, '.info/connected');
    const userStatusRef = ref(rtdb, `status/${uid}`);

    const unsubscribe = onValue(connectedRef, (snapshot) => {
      if (snapshot.val() === true) {
        // Set state on disconnect automatically
        onDisconnect(userStatusRef).set({
          isOnline: false,
          state: 'offline',
          lastSeen: serverTimestamp()
        }).catch(() => {});

        // Set state to online
        set(userStatusRef, {
          isOnline: true,
          state: 'online',
          lastSeen: serverTimestamp()
        }).catch(() => {});
      }
    });

    return () => {
      try {
        set(userStatusRef, {
          isOnline: false,
          state: 'offline',
          lastSeen: serverTimestamp()
        }).catch(() => {});
      } catch {}
      unsubscribe();
    };
  } catch (err) {
    console.warn("RTDB Presence init warning:", err);
    return () => {};
  }
}

export function listenUserPresence(
  uid: string, 
  callback: (presence: { isOnline: boolean; lastSeen?: any }) => void
) {
  if (!uid || !rtdb) {
    callback({ isOnline: false });
    return () => {};
  }

  try {
    const userStatusRef = ref(rtdb, `status/${uid}`);
    return onValue(userStatusRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        callback({
          isOnline: Boolean(data.isOnline),
          lastSeen: data.lastSeen || null
        });
      } else {
        callback({ isOnline: false });
      }
    });
  } catch {
    callback({ isOnline: false });
    return () => {};
  }
}

/**
 * 2. TYPING INDICATORS (isTyping: true/false)
 * Extremely high-frequency ephemeral data saved strictly in RTDB.
 */
export function setTypingStatus(chatId: string, uid: string, isTyping: boolean) {
  if (!chatId || !uid || !rtdb) return;
  try {
    const typingRef = ref(rtdb, `typing/${chatId}/${uid}`);
    if (isTyping) {
      set(typingRef, { isTyping: true, updatedAt: serverTimestamp() });
      onDisconnect(typingRef).remove();
    } else {
      remove(typingRef);
    }
  } catch (err) {
    console.warn("RTDB Typing status set error:", err);
  }
}

export function listenTypingStatus(
  chatId: string, 
  otherUid: string, 
  callback: (isTyping: boolean) => void
) {
  if (!chatId || !otherUid || !rtdb) {
    callback(false);
    return () => {};
  }

  try {
    const typingRef = ref(rtdb, `typing/${chatId}/${otherUid}`);
    return onValue(typingRef, (snapshot) => {
      const data = snapshot.val();
      callback(Boolean(data?.isTyping));
    });
  } catch {
    callback(false);
    return () => {};
  }
}

/**
 * 3. UNREAD MESSAGE COUNTER & BADGES
 * Zero-cost realtime badge updates across active chat threads.
 */
export function markUnreadInRTDB(targetUserId: string, chatId: string, count: number = 1) {
  if (!targetUserId || !chatId || !rtdb) return;
  try {
    const unreadRef = ref(rtdb, `unread/${targetUserId}/${chatId}`);
    set(unreadRef, count);
  } catch (err) {
    console.warn("RTDB unread set error:", err);
  }
}

export function clearUnreadInRTDB(userId: string, chatId: string) {
  if (!userId || !chatId || !rtdb) return;
  try {
    const unreadRef = ref(rtdb, `unread/${userId}/${chatId}`);
    remove(unreadRef);
  } catch (err) {
    console.warn("RTDB unread clear error:", err);
  }
}

export function listenUnreadBadges(
  userId: string, 
  callback: (unreadMap: Record<string, number>) => void
) {
  if (!userId || !rtdb) {
    callback({});
    return () => {};
  }

  try {
    const unreadRef = ref(rtdb, `unread/${userId}`);
    return onValue(unreadRef, (snapshot) => {
      const val = snapshot.val();
      callback(val || {});
    });
  } catch {
    callback({});
    return () => {};
  }
}

/**
 * 4. WEBRTC AUDIO/VIDEO CALL SIGNALING
 * Handles real-time WebRTC SDP offers, answers, status, and ICE candidates via RTDB sockets.
 */
export function setCallSessionRTDB(callId: string, data: any) {
  if (!callId || !rtdb) return;
  try {
    const callRef = ref(rtdb, `calls/${callId}`);
    update(callRef, { ...data, updatedAt: serverTimestamp() });
  } catch (err) {
    console.warn("RTDB call session set error:", err);
  }
}

export function listenCallSessionRTDB(callId: string, callback: (data: any) => void) {
  if (!callId || !rtdb) {
    callback(null);
    return () => {};
  }

  try {
    const callRef = ref(rtdb, `calls/${callId}`);
    return onValue(callRef, (snapshot) => {
      callback(snapshot.val());
    });
  } catch {
    callback(null);
    return () => {};
  }
}

export function sendIceCandidateRTDB(callId: string, targetRole: 'caller' | 'receiver', candidate: any) {
  if (!callId || !rtdb) return;
  try {
    const candRef = ref(rtdb, `calls/${callId}/candidates_${targetRole}`);
    push(candRef, candidate);
  } catch (err) {
    console.warn("RTDB ICE candidate push error:", err);
  }
}

export function listenIceCandidatesRTDB(callId: string, myRole: 'caller' | 'receiver', callback: (candidate: any) => void) {
  if (!callId || !rtdb) return () => {};

  try {
    const candRef = ref(rtdb, `calls/${callId}/candidates_${myRole}`);
    return onChildAdded(candRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      }
    });
  } catch {
    return () => {};
  }
}

export function removeCallSessionRTDB(callId: string) {
  if (!callId || !rtdb) return;
  try {
    const callRef = ref(rtdb, `calls/${callId}`);
    remove(callRef);
  } catch {}
}

/**
 * 5. HIGH-FREQUENCY PAGE VIEWS / TRAFFIC TRACKER (RTDB COUNTERS)
 * Avoids constant Firestore document writes on every page load.
 */
export function incrementPageViewRTDB(pageId: string) {
  if (!pageId || !rtdb) return;
  try {
    const viewCountRef = ref(rtdb, `views/${pageId}/count`);
    runTransaction(viewCountRef, (currentValue) => {
      return (currentValue || 0) + 1;
    }).catch(() => {});
  } catch (err) {
    console.warn("RTDB page view transaction error:", err);
  }
}

export function listenPageViewsRTDB(pageId: string, callback: (count: number) => void) {
  if (!pageId || !rtdb) {
    callback(0);
    return () => {};
  }
  try {
    const viewCountRef = ref(rtdb, `views/${pageId}/count`);
    return onValue(viewCountRef, (snapshot) => {
      callback(Number(snapshot.val() || 0));
    });
  } catch {
    callback(0);
    return () => {};
  }
}

/**
 * 6. LIVE GPS DELIVERY LOCATION TRACKING
 * High-frequency coordinates streaming for active orders in RTDB without Firestore billing spikes.
 */
export function updateLiveGpsRTDB(orderId: string, lat: number, lng: number, driverName?: string) {
  if (!orderId || !rtdb) return;
  try {
    const gpsRef = ref(rtdb, `live_tracking/${orderId}`);
    set(gpsRef, {
      lat,
      lng,
      driverName: driverName || 'Rider',
      updatedAt: serverTimestamp()
    }).catch(() => {});
  } catch (err) {
    console.warn("RTDB GPS update error:", err);
  }
}

export function listenLiveGpsRTDB(orderId: string, callback: (location: { lat: number; lng: number; driverName?: string } | null) => void) {
  if (!orderId || !rtdb) {
    callback(null);
    return () => {};
  }
  try {
    const gpsRef = ref(rtdb, `live_tracking/${orderId}`);
    return onValue(gpsRef, (snapshot) => {
      callback(snapshot.val());
    });
  } catch {
    callback(null);
    return () => {};
  }
}

/**
 * 7. REALTIME MERCHANT STATS & AGGREGATE COUNTERS IN RTDB
 * Lightweight aggregated metric counters (total orders, total revenue) for instant dashboard view without collection scans.
 */
export function updateMerchantStatsRTDB(merchantId: string, orderAmount: number = 0) {
  if (!merchantId || !rtdb) return;
  try {
    const statsRef = ref(rtdb, `merchant_stats/${merchantId}`);
    runTransaction(statsRef, (currentData) => {
      const stats = currentData || { totalOrders: 0, totalRevenue: 0 };
      return {
        totalOrders: (stats.totalOrders || 0) + 1,
        totalRevenue: (stats.totalRevenue || 0) + Number(orderAmount || 0),
        lastOrderAt: serverTimestamp()
      };
    }).catch(() => {});
  } catch (err) {
    console.warn("RTDB merchant stats error:", err);
  }
}

export function listenMerchantStatsRTDB(
  merchantId: string, 
  callback: (stats: { totalOrders: number; totalRevenue: number } | null) => void
) {
  if (!merchantId || !rtdb) {
    callback(null);
    return () => {};
  }
  try {
    const statsRef = ref(rtdb, `merchant_stats/${merchantId}`);
    return onValue(statsRef, (snapshot) => {
      callback(snapshot.val());
    });
  } catch {
    callback(null);
    return () => {};
  }
}

