import React, { useContext, useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './authContext';
import { AudioCallProvider } from './audioCallContext';
import { collection, query, where, getDocs, limit, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from './lib/firebase';
import { Phone, Package, MessageSquare, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// Code-Split Lazy Loaded Pages for drastically smaller initial bundle size & zero code duplication
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Messenger = lazy(() => import('./pages/Messenger'));
const ChatRoom = lazy(() => import('./pages/ChatRoom'));
const AIBot = lazy(() => import('./pages/AIBot'));
const Tools = lazy(() => import('./pages/Tools'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const Reports = lazy(() => import('./pages/Reports'));
const Inventory = lazy(() => import('./pages/Inventory'));
const MagicBox = lazy(() => import('./pages/MagicBox'));
const PublicProWebsite = lazy(() => import('./pages/PublicProWebsite'));
const ProWebsiteSettings = lazy(() => import('./pages/ProWebsiteSettings'));
const ProductShowcase = lazy(() => import('./pages/ProductShowcase'));
const SmartOrder = lazy(() => import('./pages/SmartOrder'));
const LandingPages = lazy(() => import('./pages/LandingPages'));
const PublishedLandingPage = lazy(() => import('./pages/PublishedLandingPage'));
const OrderTracking = lazy(() => import('./pages/OrderTracking'));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="h-screen w-full max-w-full flex items-center justify-center bg-dragon-black">
    <div className="w-12 h-12 border-4 border-dragon-cyan border-t-transparent rounded-full animate-spin"></div>
  </div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

function RootResolver() {
  const { user, loading: authLoading } = useContext(AuthContext);

  const currentHost = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
  const isDefaultPlatform = !currentHost || currentHost.endsWith('run.app') || currentHost.endsWith('localhost') || currentHost.endsWith('127.0.0.1') || currentHost.includes('web-');

  const [isCustomDomain, setIsCustomDomain] = useState<boolean>(false);
  const [resolvedSlug, setResolvedSlug] = useState<string | null>(null);
  const [resolving, setResolving] = useState<boolean>(!isDefaultPlatform);

  useEffect(() => {
    if (isDefaultPlatform) return;

    const checkDomain = async () => {
      try {
        const q = query(
          collection(db, 'pro_websites'),
          where('customDomain.domainName', '==', currentHost),
          limit(1)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          setIsCustomDomain(true);
          setResolvedSlug(snap.docs[0].data().slug);
        } else {
          setIsCustomDomain(false);
        }
      } catch (err) {
        console.error("Error looking up custom domain:", err);
        setIsCustomDomain(false);
      } finally {
        setResolving(false);
      }
    };
    checkDomain();
  }, [currentHost, isDefaultPlatform]);

  if (resolving || authLoading) {
    return (
      <div className="h-screen w-full max-w-full flex flex-col items-center justify-center bg-dragon-black gap-3 text-xs text-dragon-cyan">
        <div className="w-10 h-10 border-4 border-dragon-cyan border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isCustomDomain && resolvedSlug) {
    return <PublicProWebsite customSlug={resolvedSlug} />;
  }

  if (user) {
    return <Navigate to="/messenger" replace />;
  }

  return <Home />;
}

interface AppToast {
  id: string;
  title: string;
  description: string;
  type: 'call' | 'order' | 'message';
}

// Custom sound synthesis using Web Audio API
const playNotificationSound = (type: 'call' | 'order' | 'message') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    if (type === 'message') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'order') {
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.25);
      });
    } else if (type === 'call') {
      const duration = 1.2;
      const osc = ctx.createOscillator();
      const mod = ctx.createOscillator();
      const oscGain = ctx.createGain();
      const modGain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(850, ctx.currentTime);
      
      mod.type = 'sine';
      mod.frequency.setValueAtTime(25, ctx.currentTime);
      modGain.gain.setValueAtTime(15, ctx.currentTime);
      
      oscGain.gain.setValueAtTime(0.1, ctx.currentTime);
      oscGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      
      mod.connect(modGain);
      modGain.connect(osc.frequency);
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      
      mod.start();
      osc.start();
      mod.stop(ctx.currentTime + duration);
      osc.stop(ctx.currentTime + duration);
    }
  } catch (err) {
    console.warn("Failed to play synthesized sound:", err);
  }
};

function GlobalNotificationCenter() {
  const { user } = useContext(AuthContext);
  const [toasts, setToasts] = useState<AppToast[]>([]);

  const addToast = (toast: AppToast) => {
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    }, 5000);
  };

  useEffect(() => {
    if (!user) return;

    // --- 1. CALLS LISTENER ---
    const seenCallIds = new Set<string>();
    let isFirstCallsLoad = true;

    const qCalls = query(
      collection(db, 'calls'),
      where('receiverId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubCalls = onSnapshot(qCalls, (snap) => {
      snap.docChanges().forEach((change) => {
        const callId = change.doc.id;
        const callData = change.doc.data();
        
        if (change.type === 'added' || change.type === 'modified') {
          const status = callData.status;
          
          if (['dialing', 'ringing', 'incoming'].includes(status)) {
            if (!seenCallIds.has(callId)) {
              seenCallIds.add(callId);
              
              const createdAtMs = callData.createdAt ? new Date(callData.createdAt).getTime() : Date.now();
              const isRecent = Date.now() - createdAtMs < 30000;

              if (!isFirstCallsLoad || isRecent) {
                const callNotifEnabled = localStorage.getItem('notification_call') !== 'false';
                if (callNotifEnabled) {
                  playNotificationSound('call');
                  addToast({
                    id: `call_${callId}_${Date.now()}`,
                    title: 'Incoming Audio Call! 📞',
                    description: `${callData.callerName || 'Someone'} is calling you...`,
                    type: 'call'
                  });
                }
              }
            }
          }
        }
      });
      isFirstCallsLoad = false;
    }, (err) => {
      console.warn("Global calls listener error:", err);
    });

    // --- 2. ORDERS LISTENER ---
    const seenOrderIds = new Set<string>();
    let isFirstOrdersLoad = true;

    const qOrders = query(
      collection(db, 'orders'),
      where('receiverId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubOrders = onSnapshot(qOrders, (snap) => {
      snap.docChanges().forEach((change) => {
        const orderId = change.doc.id;
        const orderData = change.doc.data();
        
        if (change.type === 'added') {
          if (!seenOrderIds.has(orderId)) {
            seenOrderIds.add(orderId);
            
            const createdAtStr = orderData.createdAt;
            const createdAtMs = createdAtStr ? new Date(createdAtStr).getTime() : 0;
            const isRecent = Date.now() - createdAtMs < 20000;
            
            if (!isFirstOrdersLoad || isRecent) {
              const orderNotifEnabled = localStorage.getItem('notification_order') !== 'false';
              if (orderNotifEnabled) {
                playNotificationSound('order');
                addToast({
                  id: `order_${orderId}_${Date.now()}`,
                  title: 'New Order Received! 🛒',
                  description: `Order from ${orderData.customerName || 'Customer'} worth ৳${orderData.totalBill || 0}`,
                  type: 'order'
                });
              }
            }
          }
        }
      });
      isFirstOrdersLoad = false;
    }, (err) => {
      console.warn("Global orders listener error:", err);
    });

    // --- 3. MESSAGES LISTENER ---
    const qChats = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      limit(30)
    );

    const messageUnsubs: Record<string, () => void> = {};
    const seenMessageIds = new Set<string>();
    const isFirstMessagesLoad: Record<string, boolean> = {};

    const unsubChats = onSnapshot(qChats, (chatsSnap) => {
      const activeChatIds = chatsSnap.docs.map(doc => doc.id);
      
      Object.keys(messageUnsubs).forEach((chatId) => {
        if (!activeChatIds.includes(chatId)) {
          messageUnsubs[chatId]();
          delete messageUnsubs[chatId];
          delete isFirstMessagesLoad[chatId];
        }
      });

      activeChatIds.forEach((chatId) => {
        if (!messageUnsubs[chatId]) {
          isFirstMessagesLoad[chatId] = true;
          
          const qMsg = query(
            collection(db, 'chats', chatId, 'messages'),
            orderBy('createdAt', 'desc'),
            limit(1)
          );

          messageUnsubs[chatId] = onSnapshot(qMsg, (msgSnap) => {
            msgSnap.docChanges().forEach((change) => {
              const msgId = change.doc.id;
              const msgData = change.doc.data();
              
              if (change.type === 'added') {
                if (!seenMessageIds.has(msgId)) {
                  seenMessageIds.add(msgId);
                  
                  if (msgData.senderId !== user.uid) {
                    const createdAtMs = msgData.createdAt ? new Date(msgData.createdAt).getTime() : 0;
                    const isRecent = Date.now() - createdAtMs < 20000;

                    if (!isFirstMessagesLoad[chatId] || isRecent) {
                      const msgNotifEnabled = localStorage.getItem('notification_message') !== 'false';
                      if (msgNotifEnabled) {
                        playNotificationSound('message');
                        addToast({
                          id: `msg_${msgId}_${Date.now()}`,
                          title: 'New Message 💬',
                          description: msgData.text || 'Received a message',
                          type: 'message'
                        });
                      }
                    }
                  }
                }
              }
            });
            isFirstMessagesLoad[chatId] = false;
          }, (err) => {
            console.warn(`Global msg listener error for ${chatId}:`, err);
          });
        }
      });
    }, (err) => {
      console.warn("Global chats listener error:", err);
    });

    return () => {
      unsubCalls();
      unsubOrders();
      unsubChats();
      Object.values(messageUnsubs).forEach((unsub) => unsub());
    };
  }, [user]);

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          let typeColor = 'bg-sky-500/15 border-sky-500/30 text-sky-400';
          let TypeIcon = Phone;
          if (toast.type === 'order') {
            typeColor = 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400';
            TypeIcon = Package;
          } else if (toast.type === 'message') {
            typeColor = 'bg-amber-500/15 border-amber-500/30 text-amber-400';
            TypeIcon = MessageSquare;
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              className="pointer-events-auto flex items-start gap-3.5 p-4 rounded-2xl bg-dragon-black/90 backdrop-blur-md border border-white/10 shadow-2xl animate-fade-in"
            >
              <div className={`p-2.5 rounded-xl border ${typeColor}`}>
                <TypeIcon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-black uppercase tracking-wider text-white">
                  {toast.title}
                </h4>
                <p className="text-[11px] text-gray-400 mt-1 leading-relaxed line-clamp-2">
                  {toast.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="text-gray-500 hover:text-white transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }, []);

  return (
    <AuthProvider>
      <AudioCallProvider>
        <BrowserRouter>
          <Suspense fallback={
            <div className="h-screen w-full flex items-center justify-center bg-dragon-black">
              <div className="w-10 h-10 border-4 border-dragon-cyan border-t-transparent rounded-full animate-spin"></div>
            </div>
          }>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<RootResolver />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Protected Routes */}
              <Route path="/messenger" element={<ProtectedRoute><Messenger /></ProtectedRoute>} />
              <Route path="/chat/:chatId" element={<ProtectedRoute><ChatRoom /></ProtectedRoute>} />
              <Route path="/ai-bot" element={<ProtectedRoute><AIBot /></ProtectedRoute>} />
              <Route path="/tools" element={<ProtectedRoute><Tools /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
              <Route path="/magic-box" element={<ProtectedRoute><MagicBox /></ProtectedRoute>} />
              <Route path="/landing-pages" element={<ProtectedRoute><LandingPages /></ProtectedRoute>} />
              <Route path="/pro-website-settings" element={<ProtectedRoute><ProWebsiteSettings /></ProtectedRoute>} />
              <Route path="/pro-website-settings/:id" element={<ProtectedRoute><ProWebsiteSettings /></ProtectedRoute>} />
              <Route path="/l/:pageId" element={<PublishedLandingPage />} />
              <Route path="/l/:storeName/:pageId" element={<PublishedLandingPage />} />
              <Route path="/w/:slug" element={<PublicProWebsite />} />
              <Route path="/showcase" element={<ProductShowcase />} />
              <Route path="/order/:productId/:userId" element={<SmartOrder />} />
              <Route path="/tracking/:orderId" element={<OrderTracking />} />
              <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
              
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <GlobalNotificationCenter />
      </AudioCallProvider>
    </AuthProvider>
  );
}
