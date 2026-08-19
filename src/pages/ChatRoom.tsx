import React, { useState, useEffect, useLayoutEffect, useMemo, useContext, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  doc, 
  getDoc, 
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  where,
  limit
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, getCachedUserProfile, setCachedUserProfile } from '../lib/firebase';
import { getCachedDoc } from '../utils/firestoreCache';
import { AuthContext } from '../authContext';
import { AudioCallContext } from '../audioCallContext';
import { ArrowLeft, ArrowRight, Tag, Send, Plus, Image as ImageIcon, ShoppingBag, MapPin, Phone, Video, User, CheckCircle, Package, Truck, Edit, Download, Copy, Trash2, AlertCircle, Reply, X, Facebook, Instagram, Linkedin, Youtube, Globe, ExternalLink, Zap, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Wallet, Clock, ArrowUpRight, ArrowDownLeft, Mic, Square, Play, Pause, FileText, Loader2, ChevronLeft, ChevronRight, Settings, MessageSquare, Lock, Star, ShieldCheck, Sparkles, Search, Check, CheckCheck } from 'lucide-react';
import { Message, UserProfile, Order, InventoryItem } from '../types';
import { formatDate, cn, generateId, parseCallLog } from '../lib/utils';
import { 
  listenUserPresence, 
  listenTypingStatus, 
  setTypingStatus, 
  clearUnreadInRTDB, 
  markUnreadInRTDB 
} from '../services/rtdbEphemeralService';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
import { compressImage } from '../utils/imageCompressor';
import ChatReportPopup from '../components/ChatReportPopup';
import CallMuteModal from '../components/CallMuteModal';
import WithdrawalHistoryPanel from '../components/WithdrawalHistoryPanel';
import { CallLogModal } from '../components/CallLogModal';
import { getCheckoutFormFields, getAggregatedAddress, COUNTRIES, getCurrencySymbol } from '../utils/countriesData';
import { renderTextWithHashtags, ExpandablePostText, POST_BACKGROUND_THEMES, PostThemeVectorOverlay } from '../components/social/PostThemeUtils';
import { SmartPasteModal } from '../components/SmartPasteModal';
import { resolveChatId, getPresenceStatus as getPresenceStatusHelper, getCleanReplyPreview } from '../utils/chatUtils';
import { getOrderFinances } from '../utils/orderUtils';
import ChatHeader from '../components/chatroom/ChatHeader';
import ChatInputBar from '../components/chatroom/ChatInputBar';
import ChatMessageItem from '../components/chatroom/ChatMessageItem';
import CreateOrderPopup from '../components/chatroom/CreateOrderPopup';
import ProfileDrawer from '../components/chatroom/ProfileDrawer';

export default function ChatRoom() {
  const { chatId } = useParams();
  const { user, profile } = useContext(AuthContext);
  const { startCall } = useContext(AudioCallContext);
  const navigate = useNavigate();
  const location = useLocation();
  const targetOrderId = location.state?.targetOrderId;

  const { activeChatId, otherId } = React.useMemo(() => {
    return resolveChatId(chatId, user?.uid);
  }, [chatId, user?.uid]);

  const [currentUserFollowsOther, setCurrentUserFollowsOther] = useState<boolean | null>(null);
  const [otherUserFollowsCurrentUser, setOtherUserFollowsCurrentUser] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user?.uid || !otherId) return;

    // Is current user following otherId?
    const q1 = query(
      collection(db, 'social_relationships'),
      where('followerId', '==', user.uid),
      where('followingId', '==', otherId)
    );
    const unsub1 = onSnapshot(q1, (snap) => {
      setCurrentUserFollowsOther(!snap.empty);
    }, (err) => {
      console.error("Error checking following relationship:", err);
    });

    // Is otherId following current user?
    const q2 = query(
      collection(db, 'social_relationships'),
      where('followerId', '==', otherId),
      where('followingId', '==', user.uid)
    );
    const unsub2 = onSnapshot(q2, (snap) => {
      setOtherUserFollowsCurrentUser(!snap.empty);
    }, (err) => {
      console.error("Error checking followers relationship:", err);
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [user?.uid, otherId]);

  const handleInitiateCall = (type: 'audio' | 'video' = 'audio') => {
    if (!otherUser) return;
    startCall(otherUser.uid, otherUser.name || 'Anonymous Customer', otherUser.profileImage || '', type, type === 'video' ? '720p' : '720p');
  };
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');

  const [chatSmartPaste, setChatSmartPaste] = useState<{
    isOpen: boolean;
    pastedText: string;
    initialTargetField: string;
  }>({
    isOpen: false,
    pastedText: '',
    initialTargetField: 'address'
  });

  const handleChatInputPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData('text') || '';
    if (text.trim().length > 5 && (text.includes(' ') || text.includes('\n') || text.includes('\r'))) {
      e.preventDefault();
      setChatSmartPaste({
        isOpen: true,
        pastedText: text,
        initialTargetField: 'address'
      });
    }
  };

  const handleChatSmartPasteApply = (data: { name: string; phone: string; address: string }) => {
    const combined = [
      data.name ? `Name: ${data.name}` : '',
      data.phone ? `Phone: ${data.phone}` : '',
      data.address ? `Address: ${data.address}` : ''
    ].filter(Boolean).join('\n');
    setInputText(prev => prev ? `${prev}\n${combined}` : combined);
  };
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (replyingTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyingTo]);
  const initialOtherUser = React.useMemo(() => {
    const stateUser = location.state?.otherUser;
    if (stateUser && chatId && user?.uid) {
      const otherId = chatId.startsWith('new_') 
        ? chatId.replace('new_', '') 
        : chatId.split('_').find(id => id !== user.uid);
      if (stateUser.uid === otherId) {
        return stateUser;
      }
    }
    return null;
  }, [location.state?.otherUser, chatId, user?.uid]);

  const [otherUser, setOtherUser] = useState<UserProfile | null>(initialOtherUser);
  const [showProfile, setShowProfile] = useState(false);
  const [isMuteModalOpen, setIsMuteModalOpen] = useState(false);

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const getPresenceStatus = () => getPresenceStatusHelper(otherUser, now);

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressActive = useRef(false);
  const statusUpdatedRef = useRef<Set<string>>(new Set());

  const handleHeaderPressStart = () => {
    isLongPressActive.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressActive.current = true;
      setIsMuteModalOpen(true);
    }, 2000);
  };

  const handleHeaderPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleHeaderClick = () => {
    if (isLongPressActive.current) return;
    setShowProfile(true);
  };

  const [otherUserCatalog, setOtherUserCatalog] = useState<InventoryItem[]>([]);
  const [isCatalogLocked, setIsCatalogLocked] = useState<boolean>(false);
  const [syncingItemId, setSyncingItemId] = useState<string | null>(null);
  const [showOrderPopup, setShowOrderPopup] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [activeMapOrder, setActiveMapOrder] = useState<any | null>(null);
  const [showFinanceDrawer, setShowFinanceDrawer] = useState(false);
  const [paymentAccounts, setPaymentAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);

  // RTDB Ephemeral States
  const [rtdbPresence, setRtdbPresence] = useState<{ isOnline: boolean; lastSeen?: any } | null>(null);
  const [isOtherTyping, setIsOtherTyping] = useState<boolean>(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // RTDB User Presence Listener
  useEffect(() => {
    if (!otherUser?.uid) return;
    const unsubPres = listenUserPresence(otherUser.uid, (presence) => {
      setRtdbPresence(presence);
    });
    return () => unsubPres();
  }, [otherUser?.uid]);

  // RTDB Typing Indicator Listener
  useEffect(() => {
    if (!chatId || !otherUser?.uid) return;
    const { activeChatId: actualChatId } = resolveChatId(chatId, user?.uid);

    const unsubTyping = listenTypingStatus(actualChatId, otherUser.uid, (typing) => {
      setIsOtherTyping(typing);
    });

    return () => unsubTyping();
  }, [chatId, otherUser?.uid, user?.uid]);

  const [showReportPopup, setShowReportPopup] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showCallLogModal, setShowCallLogModal] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Lazy load payment accounts ONLY when withdrawal modal is open
  useEffect(() => {
    if (!user?.uid || !showWithdrawModal) return;
    const colRef = collection(db, 'users', user.uid, 'payment_accounts');
    const unsubscribe = onSnapshot(colRef, (colSnap) => {
      const list = colSnap.docs
        .map(d => ({ id: d.id, ...d.data() } as any))
        .filter(acc => acc.id !== 'active_config' && acc.bankName && acc.accountNumber);
      setPaymentAccounts(list);
      
      // Select the first account automatically if nothing is selected or if selected account is no longer in the list
      if (list.length > 0) {
        setSelectedAccountId(prev => {
          const exists = list.some(acc => acc.id === prev);
          return exists ? prev : list[0].id;
        });
      } else {
        setSelectedAccountId('');
      }
    }, (err) => {
      console.error("Error loading payment accounts in ChatRoom:", err);
    });
    return () => unsubscribe();
  }, [user?.uid, showWithdrawModal]);

  const activeAccount = paymentAccounts.find(acc => acc.id === selectedAccountId) || null;

  const pendingWithdrawalMsg = useMemo(() => {
    return messages.find((m: any) => 
      m.type === 'payment_request' && 
      m.senderId === user?.uid && 
      m.paymentData?.status !== 'paid'
    );
  }, [messages, user?.uid]);

  const hasPendingWithdrawal = !!pendingWithdrawalMsg;

  const [financeSummary, setFinanceSummary] = useState({
    myProfit: 0,
    myPending: 0,
    owedToOther: 0,
    otherPendingProfit: 0,
    myLoss: 0,
    owedLoss: 0,
    totalOrders: 0
  });
  const [allDbOrders, setAllDbOrders] = useState<Order[]>(() => {
    try {
      const cached = localStorage.getItem('dragon_all_db_orders');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Voice Message Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      
      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (!MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = MediaRecorder.isTypeSupported('audio/ogg') ? 'audio/ogg' : '';
        }
      }

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: mimeType,
        audioBitsPerSecond: 24000
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());

        if (audioChunksRef.current.length === 0) return;

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
        
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          await sendVoiceMessage(base64Audio, recordingDuration);
        };
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          if (prev >= 60) {
            stopRecording(true);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      console.error('Failed to start recording:', err);
      alert('Error accessing microphone. Please check your browser permissions and connection.');
    }
  };

  const stopRecording = (shouldSend: boolean = true) => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      if (!shouldSend) {
        audioChunksRef.current = [];
      }
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const sendVoiceMessage = async (base64Audio: string, duration: number) => {
    if (!user || !chatId) return;
    if (currentUserFollowsOther === false || otherUserFollowsCurrentUser === false) {
      alert("You must follow each other back to exchange messages.");
      return;
    }

    const { activeChatId: actualChatId } = resolveChatId(chatId, user.uid);

    const isRecipientOnline = otherUser && getPresenceStatus().isOnline;
    const initialStatus = isRecipientOnline ? 'delivered' : 'sent';
    const nowIso = new Date().toISOString();

    const voiceMsgData: any = {
      id: crypto.randomUUID(),
      chatId: actualChatId,
      senderId: user.uid,
      text: `🎤 Voice Message (${duration}s)`,
      type: 'voice',
      voiceUrl: base64Audio,
      voiceDuration: duration,
      status: initialStatus,
      ...(initialStatus === 'delivered' ? { deliveredAt: nowIso } : {}),
      createdAt: nowIso
    };

    if (replyingTo) {
      voiceMsgData.replyToId = replyingTo.id;
      voiceMsgData.replyToText = getCleanReplyPreview(replyingTo, user?.uid);
    }

    setReplyingTo(null);

    // Optimistic local update
    setMessages(prev => {
      if (prev.some(m => m.id === voiceMsgData.id)) return prev;
      return [...prev, voiceMsgData];
    });

    try {
      await setDoc(doc(db, 'chats', actualChatId), {
        participants: actualChatId.split('_'),
        lastMessage: '🎤 Voice Message',
        lastMessageAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });

      await addDoc(collection(db, `chats/${actualChatId}/messages`), voiceMsgData);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `chats/${actualChatId}`);
    }
  };

  // Highlight and scroll to target order
  useEffect(() => {
    if (targetOrderId && messages.length > 0) {
      const targetMessage = messages.find(m => m.orderId === targetOrderId || m.id === targetOrderId);
      if (targetMessage) {
        const timer = setTimeout(() => {
          const element = document.getElementById(`msg-${targetMessage.id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'auto', block: 'center' });
          }
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [targetOrderId, messages.length]);

  // Prefill order from router state if passed (e.g. from Community B2B Catalog overlay)
  useEffect(() => {
    if (location.state?.prefillProduct) {
      const item = location.state.prefillProduct;
      setEditingOrder({
        id: '',
        productName: item.name || '',
        sellPrice: Number(item.sellPrice || item.price) || 0,
        buyPrice: Number(item.sellPrice || item.price || 0),
        quantity: 1,
        productImage: item.image || '',
        productImages: item.image ? [item.image] : [],
        size: item.size || '',
        color: item.color || '',
        weight: item.weight || '',
        customerName: '',
        customerPhone: '',
        customerAddress: '',
        deliveryCharge: 60,
      } as any);
      setShowOrderPopup(true);
      
      // Clear location state securely to prevent reopening on reload
      const stateCopy = { ...location.state };
      delete stateCopy.prefillProduct;
      navigate(location.pathname, { replace: true, state: stateCopy });
    }
  }, [location.state, navigate, location.pathname]);

  // Auto-scroll to bottom logic
  const hasInitialScrolled = useRef(false);
  const chatOpenedAt = useRef(Date.now());
  const isUserScrolledUp = useRef(false);

  const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    }
  };

  // Monitor scroll position to detect if user manually scrolled up
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      isUserScrolledUp.current = distanceFromBottom > 250;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    // ResizeObserver watches container and children height shifts (images loading, cards expanding)
    const resizeObserver = new ResizeObserver(() => {
      if (!isUserScrolledUp.current && !targetOrderId) {
        scrollToBottom('auto');
      }
    });

    if (container.firstElementChild) {
      resizeObserver.observe(container.firstElementChild);
    }
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [chatId, targetOrderId]);

  // Synchronously set scroll position before paint to render at bottom instantly
  useLayoutEffect(() => {
    if (chatContainerRef.current && !targetOrderId && messages.length > 0) {
      scrollToBottom('auto');
    }
  }, [messages.length, chatId, targetOrderId]);

  // Immediate and multi-stage sequence scroll on data load and updates
  useEffect(() => {
    if (!targetOrderId && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      const lastMsgTime = lastMsg?.createdAt ? new Date(lastMsg.createdAt).getTime() : 0;
      const isNewLiveMessage = lastMsgTime > chatOpenedAt.current - 2000;

      if (!hasInitialScrolled.current) {
        scrollToBottom('auto');
        const timers = [
          setTimeout(() => scrollToBottom('auto'), 0),
          setTimeout(() => scrollToBottom('auto'), 50),
          setTimeout(() => scrollToBottom('auto'), 150),
          setTimeout(() => scrollToBottom('auto'), 300),
          setTimeout(() => scrollToBottom('auto'), 600),
          setTimeout(() => {
            scrollToBottom('auto');
            hasInitialScrolled.current = true;
          }, 1000)
        ];
        return () => timers.forEach(clearTimeout);
      } else if (!isUserScrolledUp.current) {
        const behavior = isNewLiveMessage ? 'smooth' : 'auto';
        scrollToBottom(behavior);
        const timer = setTimeout(() => scrollToBottom(behavior), 50);
        return () => clearTimeout(timer);
      }
    }
  }, [messages.length, targetOrderId, chatId]);

  // Handle target order scrolling
  useEffect(() => {
    if (targetOrderId && messages.length > 0) {
      const targetMessage = messages.find(m => m.orderId === targetOrderId || m.id === targetOrderId);
      if (targetMessage) {
        const timer = setTimeout(() => {
          const element = document.getElementById(`msg-${targetMessage.id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'auto', block: 'center' });
            hasInitialScrolled.current = true;
          }
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [targetOrderId, messages.length]);

  // Reset scroll tracker when chat room changes
  useEffect(() => {
    hasInitialScrolled.current = false;
    isUserScrolledUp.current = false;
    chatOpenedAt.current = Date.now();
  }, [chatId]);

  useEffect(() => {
    if (!chatId || !user) return;

    const { activeChatId: actualChatId } = resolveChatId(chatId, user.uid);

    const stateUser = location.state?.otherUser;
    const currentOtherId = actualChatId.split('_').find(id => id !== user.uid);
    if (stateUser && stateUser.uid === currentOtherId) {
      setOtherUser(stateUser);
    } else {
      setOtherUser(null);
    }

    let unsubOtherUser: (() => void) | null = null;
    const otherId = actualChatId.split('_').find(id => id !== user.uid);
    if (otherId) {
      // Check local cache first to render immediately without waiting for network
      const cachedOtherUser = getCachedUserProfile(otherId);
      if (cachedOtherUser) {
        setOtherUser(cachedOtherUser as UserProfile);
      }

      unsubOtherUser = onSnapshot(doc(db, 'users', otherId), (docSnap) => {
        if (docSnap.exists()) {
          const profileData = { uid: otherId, ...docSnap.data() } as UserProfile;
          setOtherUser(profileData);
          setCachedUserProfile(otherId, profileData);
        }
      }, (err) => {
        console.warn("Failed to listen to other user profile:", err);
      });
    }

    // Limit messages query to 50 most recent messages (descending) to drastically reduce read costs
    const q = query(
      collection(db, `chats/${actualChatId}/messages`),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    // Load cached messages immediately on enter to prevent layout shift or empty loading screen
    try {
      const cached = localStorage.getItem(`dragon_messages_${actualChatId}`);
      if (cached) {
        setMessages(JSON.parse(cached));
      } else {
        setMessages([]);
      }
    } catch {
      // Fail-safe silently in sandboxed/iframe environments
    }

    // Persistent set to prevent duplicate status update writes across renders/snapshots
    if (!statusUpdatedRef.current) {
      statusUpdatedRef.current = new Set<string>();
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Map and reverse descending results back to chronological ascending order
      const rawMsgs = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Message)).reverse();
      // De-duplicate messages by id to guarantee zero duplicate keys
      const uniqueMsgs = Array.from(
        new Map(rawMsgs.map(m => [m.id || Math.random().toString(), m])).values()
      );
      setMessages(uniqueMsgs);

      // Automated Facebook Messenger Status Handling:
      // 1. Unseen messages received by current user inside ChatRoom are marked as 'seen'
      // 2. Sent messages from current user are marked as 'delivered' if recipient is online
      const isRecipientOnline = otherUser && getPresenceStatus().isOnline;
      const nowIso = new Date().toISOString();

      if (user?.uid && uniqueMsgs.some(m => m.senderId !== user.uid)) {
        clearUnreadInRTDB(user.uid, actualChatId);
      }

      uniqueMsgs.forEach(async (m) => {
        if (!m.id || !user) return;
        if (m.senderId !== user.uid) {
          if (m.status !== 'seen' && !statusUpdatedRef.current.has(`seen_${m.id}`)) {
            statusUpdatedRef.current.add(`seen_${m.id}`);
            try {
              await updateDoc(doc(db, `chats/${actualChatId}/messages`, m.id), {
                status: 'seen',
                seenAt: nowIso
              });
            } catch (_) {}
          }
        } else {
          if (m.status === 'sent' && isRecipientOnline && !statusUpdatedRef.current.has(`deliv_${m.id}`)) {
            statusUpdatedRef.current.add(`deliv_${m.id}`);
            try {
              await updateDoc(doc(db, `chats/${actualChatId}/messages`, m.id), {
                status: 'delivered',
                deliveredAt: nowIso
              });
            } catch (_) {}
          }
        }
      });

      try {
        localStorage.setItem(`dragon_messages_${actualChatId}`, JSON.stringify(uniqueMsgs));
      } catch {
        // Fail-safe silently in sandboxed/iframe environments
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `chats/${actualChatId}/messages`);
    });

    let unsubOrders: (() => void) | null = null;
    if (otherId && user) {
      const ordersQ = query(
        collection(db, 'orders'),
        where('participants', 'array-contains', user.uid),
        limit(50)
      );

      unsubOrders = onSnapshot(ordersQ, (snapshot) => {
        const allOrders = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order));
        setAllDbOrders(allOrders);
        try {
          localStorage.setItem('dragon_all_db_orders', JSON.stringify(allOrders));
        } catch {
          // Fail-safe silently in sandboxed/iframe environments
        }
      });
    }

    return () => {
      unsubscribe();
      if (unsubOtherUser) unsubOtherUser();
      if (unsubOrders) unsubOrders();
    };
  }, [chatId, user?.uid]);

  useEffect(() => {
    if (!user?.uid || !chatId) return;
    
    let actualChatId = chatId;
    if (chatId.startsWith('new_')) {
      const otherId = chatId.replace('new_', '');
      actualChatId = [user.uid, otherId].sort().join('_');
    }

    const otherId = actualChatId.split('_').find(id => id !== user.uid);
    if (!otherId) return;

    const relatedOrders = allDbOrders.filter(o => 
      o.status !== 'deleted' && (
        (o.senderId === user.uid && o.receiverId === otherId) || 
        (o.senderId === otherId && o.receiverId === user.uid)
      )
    );

    let myProfit = 0;
    let myPending = 0;
    let owedToOther = 0;
    let otherPendingProfit = 0;
    let myLoss = 0;
    let owedLoss = 0;

    relatedOrders.forEach(order => {
      const finances = getOrderFinances(order);
      const profit = finances.profit;
      const delCost = Number(order.deliveryCharge) || 0;
      
      if (order.senderId === user.uid) {
        if (['paid', 'paid_delivery', 'delivered'].includes(order.status)) {
          myProfit += profit;
        } else if (order.status === 'fraud_return') {
          myProfit -= delCost;
          myLoss += delCost;
        } else if (['pending', 'confirmed', 'shipping'].includes(order.status)) {
          myPending += profit;
        }
      } else {
        if (['paid', 'paid_delivery', 'delivered'].includes(order.status)) {
          owedToOther += profit;
        } else if (order.status === 'fraud_return') {
          owedToOther -= delCost;
          owedLoss += delCost;
        } else if (['pending', 'confirmed', 'shipping'].includes(order.status)) {
          otherPendingProfit += profit;
        }
      }
    });

    // Subtract paid/success withdrawals
    let totalPaidWithdrawalsByMe = 0;
    let totalPaidWithdrawalsByOther = 0;

    messages.forEach(msg => {
      if (msg.type === 'payment_request' && msg.paymentData?.status === 'paid') {
        const amount = Number(msg.paymentData?.amount || 0);
        if (msg.senderId === user.uid) {
          totalPaidWithdrawalsByMe += amount;
        } else {
          totalPaidWithdrawalsByOther += amount;
        }
      }
    });

    setFinanceSummary({
      myProfit: myProfit - totalPaidWithdrawalsByMe,
      myPending,
      owedToOther: owedToOther - totalPaidWithdrawalsByOther,
      otherPendingProfit,
      myLoss,
      owedLoss,
      totalOrders: relatedOrders.length
    });
  }, [allDbOrders, messages, user?.uid, chatId]);

  // Optimized Catalog check using in-memory cached subscription doc
  useEffect(() => {
    if (!otherUser?.uid) return;
    
    getCachedDoc('catalog_subscriptions', otherUser.uid).then((subData) => {
      if (subData) {
        if (subData.paymentStatus === 'approved') {
          setIsCatalogLocked(false);
        } else if (subData.paymentStatus === 'trial') {
          const trialExpires = subData.trialExpiresAt ? new Date(subData.trialExpiresAt) : null;
          if (trialExpires && trialExpires < new Date()) {
            setIsCatalogLocked(true);
          } else {
            setIsCatalogLocked(false);
          }
        } else {
          setIsCatalogLocked(true);
        }
      } else {
        setIsCatalogLocked(false);
      }
    }).catch(() => {
      setIsCatalogLocked(false);
    });
  }, [otherUser?.uid]);

  // Lazy fetch catalog inventory ONLY when user opens Profile/Catalog Drawer
  useEffect(() => {
    if (!otherUser?.uid || !showProfile) return;

    let isMounted = true;
    const fetchCatalog = async () => {
      try {
        const q = query(
          collection(db, 'inventory'), 
          where('userId', '==', otherUser.uid)
        );
        const snap = await getDocs(q);
        if (!isMounted) return;
        const mapped = snap.docs.map(d => {
          const docData = d.data();
          return {
            id: d.id,
            ...docData,
            buyPrice: Number(docData.sellPrice || docData.price || 0),
            landingPrice: 0,
            proPrice: 0
          } as InventoryItem;
        });
        const filtered = mapped.filter(item => item.isPublic === true);
        setOtherUserCatalog(filtered);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'inventory');
      }
    };

    fetchCatalog();
    return () => { isMounted = false; };
  }, [otherUser?.uid, showProfile]);

  const handleSyncProduct = async (item: InventoryItem) => {
    if (!user) return;
    setSyncingItemId(item.id);
    try {
      const { id, ...dataToSave } = item;
      
      await addDoc(collection(db, 'inventory'), {
        ...dataToSave,
        userId: user.uid,
        name: `${item.name} (Synced)`,
        category: '',
        buyPrice: Number(item.sellPrice) || 0, // Supplier's sellPrice becomes Seller's buyPrice
        sellPrice: 0, // Seller's sellPrice is empty/0 initially
        landingPrice: 0,
        proPrice: 0,
        supplierId: otherUser?.uid || '',
        supplierName: otherUser?.name || '',
        isPublic: false, // Ensure synced products are not automatically added to user's public catalog
        dragonBotEnabled: false,
        automationEnabled: false,
        igAutomationEnabled: false,
        tgAutomationEnabled: false,
        wechatAutomationEnabled: false,
        viberAutomationEnabled: false,
        lineAutomationEnabled: false,
        tiktokAutomationEnabled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      alert('Product successfully added to your inventory! Your buy price is set to ৳' + (item.sellPrice || 0));
    } catch (err) {
      console.error("Sync error:", err);
      alert('Failed to sync product.');
    } finally {
      setSyncingItemId(null);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (currentUserFollowsOther === false || otherUserFollowsCurrentUser === false) {
      alert("You must follow each other back to exchange messages.");
      return;
    }
    if (!inputText.trim() || !user || !chatId) return;

    let actualChatId = chatId;
    if (chatId.startsWith('new_')) {
      const otherId = chatId.replace('new_', '');
      actualChatId = [user.uid, otherId].sort().join('_');
    }

    const sanitizedText = inputText.trim().substring(0, 5000);
    
    // Enhanced security check for malicious patterns
    const maliciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+=/i, // Event handlers like onclick, onerror
      /data:text\/html/i,
      /vbscript:/i,
      /expression\(/i
    ];

    if (maliciousPatterns.some(pattern => pattern.test(sanitizedText))) {
      alert('Security Warning: Harmful content detected. Please use plain text only.');
      return;
    }

    const isRecipientOnline = otherUser && getPresenceStatus().isOnline;
    const initialStatus = isRecipientOnline ? 'delivered' : 'sent';
    const nowIso = new Date().toISOString();

    const msgData: any = {
      id: crypto.randomUUID(),
      chatId: actualChatId,
      senderId: user.uid,
      text: sanitizedText,
      type: 'text',
      status: initialStatus,
      ...(initialStatus === 'delivered' ? { deliveredAt: nowIso } : {}),
      createdAt: nowIso
    };

    if (replyingTo) {
      msgData.replyToId = replyingTo.id;
      msgData.replyToText = getCleanReplyPreview(replyingTo, user?.uid);
    }

    setInputText('');
    setReplyingTo(null);

    // RTDB Ephemeral state updates
    if (otherUser?.uid) {
      markUnreadInRTDB(otherUser.uid, actualChatId);
    }
    setTypingStatus(actualChatId, user.uid, false);

    // Optimistic local update for zero delay
    setMessages(prev => {
      if (prev.some(m => m.id === msgData.id)) return prev;
      return [...prev, msgData];
    });

    try {
      await setDoc(doc(db, 'chats', actualChatId), {
        participants: actualChatId.split('_'),
        lastMessage: sanitizedText,
        lastMessageAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });

      await addDoc(collection(db, `chats/${actualChatId}/messages`), msgData);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `chats/${actualChatId}`);
    }
  };

  const handleWithdrawRequest = async (withdrawData: any) => {
    if (!user || !chatId) return;

    let actualChatId = chatId;
    if (chatId.startsWith('new_')) {
      const otherId = chatId.replace('new_', '');
      actualChatId = [user.uid, otherId].sort().join('_');
    }

    try {
      const isRecipientOnline = otherUser && getPresenceStatus().isOnline;
      const initialStatus = isRecipientOnline ? 'delivered' : 'sent';
      const nowIso = new Date().toISOString();

      await addDoc(collection(db, `chats/${actualChatId}/messages`), {
        id: crypto.randomUUID(),
        chatId: actualChatId,
        senderId: user.uid,
        type: 'payment_request',
        text: `💰 Payment Request: ৳${withdrawData.amount}`,
        paymentData: {
          ...withdrawData,
          status: 'pending'
        },
        status: initialStatus,
        ...(initialStatus === 'delivered' ? { deliveredAt: nowIso } : {}),
        createdAt: nowIso
      });
      setShowFinanceDrawer(false);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'messages');
    }
  };

  const handlePayRequest = async (messageId: string, trxId: string) => {
    if (!chatId) return;
    let actualChatId = chatId;
    if (chatId.startsWith('new_')) {
      const otherId = chatId.replace('new_', '');
      actualChatId = [user.uid, otherId].sort().join('_');
    }

    try {
      const msgRef = doc(db, `chats/${actualChatId}/messages`, messageId);
      const msgSnap = await getDoc(msgRef);
      if (msgSnap.exists()) {
        const data = msgSnap.data();
        const currentPaymentData = data?.paymentData || {};
        await updateDoc(msgRef, {
          paymentData: {
            ...currentPaymentData,
            status: 'paid',
            trxId: trxId.trim()
          },
          updatedAt: new Date().toISOString()
        });
        alert("Withdrawal payment completed successfully and TRX ID has been updated!");
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'messages');
    }
  };

  const handleCreateOrder = async (orderData: Partial<Order>) => {
    if (!user || !otherUser || !chatId) return;

    let actualChatId = chatId;
    if (chatId.startsWith('new_')) {
      const otherId = chatId.replace('new_', '');
      actualChatId = [user.uid, otherId].sort().join('_');
    }

    if (editingOrder && editingOrder.id) {
      try {
        await updateDoc(doc(db, 'orders', editingOrder.id), {
          ...orderData,
          updatedAt: new Date().toISOString()
        });
        setEditingOrder(null);
        setShowOrderPopup(false);
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `orders/${editingOrder.id}`);
      }
      return;
    }

    const newOrder: Order = {
      id: generateId(),
      participants: [user.uid, otherUser.uid],
      senderId: user.uid,
      receiverId: otherUser.uid,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(orderData as any)
    };

    try {
      await setDoc(doc(db, 'orders', newOrder.id), newOrder);

      const isRecipientOnline = otherUser && getPresenceStatus().isOnline;
      const initialStatus = isRecipientOnline ? 'delivered' : 'sent';
      const nowIso = new Date().toISOString();

      await addDoc(collection(db, `chats/${actualChatId}/messages`), {
        id: crypto.randomUUID(),
        chatId: actualChatId,
        senderId: user.uid,
        type: 'order',
        orderId: newOrder.id,
        text: `📦 Order Created: ${newOrder.productName}`,
        status: initialStatus,
        ...(initialStatus === 'delivered' ? { deliveredAt: nowIso } : {}),
        createdAt: nowIso
      });

      setShowOrderPopup(false);
      setEditingOrder(null);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'orders');
    }
  };

  return (
    <div className="fixed inset-0 h-[100dvh] flex flex-col bg-white dark:bg-[#18191a] text-[#050505] dark:text-[#e4e6eb] overflow-hidden transition-colors">
      <ChatHeader
        otherUser={otherUser}
        isOtherTyping={isOtherTyping}
        rtdbPresence={rtdbPresence}
        presenceStatus={getPresenceStatus()}
        onNavigateBack={() => navigate('/messenger')}
        onHeaderClick={handleHeaderClick}
        onHeaderPressStart={handleHeaderPressStart}
        onHeaderPressEnd={handleHeaderPressEnd}
        onInitiateCall={handleInitiateCall}
        onOpenWithdrawModal={() => setShowWithdrawModal(true)}
        onOpenReportPopup={() => setShowReportPopup(true)}
        onOpenProfile={() => setShowProfile(true)}
      />

      <div className="bg-[#f0f2f5] dark:bg-[#242526] border-b border-[#e4e6eb] dark:border-[#3a3b3c] no-print transition-colors">
         <button onClick={() => setShowFinanceDrawer(!showFinanceDrawer)} className="w-full py-1.5 flex flex-col items-center justify-center gap-0.5 transition-all hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#65676b] dark:text-[#b0b3b8]">
               {showFinanceDrawer ? 'Hide Financial Summary' : 'Show Financial Summary'}
               {showFinanceDrawer ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </div>
         </button>
         <AnimatePresence>
           {showFinanceDrawer && (
             <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto overflow-hidden">
                <div className="p-3 bg-cyan-50 dark:bg-dragon-cyan/5 border border-cyan-200 dark:border-dragon-cyan/20 rounded-2xl shadow-xs">
                   <div className="flex items-center gap-2 mb-2 text-cyan-600 dark:text-dragon-cyan">
                      <Wallet size={12} /> <span className="text-[10px] font-black uppercase tracking-widest">My Profit</span>
                   </div>
                   <div className="text-xl font-black text-slate-900 dark:text-white">৳{financeSummary.myProfit}</div>
                   <div className="text-[9.5px] font-semibold text-slate-600 dark:text-gray-400 mt-1">Profit from my sent orders <span className="text-[8px] text-slate-500 dark:text-gray-500 block font-normal">(Selling Price - Buying Price × Quantity)</span></div>
                   <div className="text-[8px] font-bold text-slate-500 dark:text-gray-500 uppercase mt-2">Pending: ৳{financeSummary.myPending}</div>
                </div>
                <div className="p-3 bg-rose-50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/20 rounded-2xl shadow-xs">
                    <div className="flex items-center gap-2 mb-2 text-rose-500">
                       <TrendingDown size={12} /> <span className="text-[10px] font-black uppercase tracking-widest">My Loss</span>
                    </div>
                    <div className="text-xl font-black text-rose-600 dark:text-rose-400">৳{financeSummary.myLoss}</div>
                    <div className="text-[9.5px] font-semibold text-slate-600 dark:text-gray-400 mt-1">Fraud customer delivery charge loss <span className="text-[8px] text-slate-500 dark:text-gray-400 block font-normal">(deducted from my total profit)</span></div>
                    <div className="text-[8px] font-bold text-slate-500 dark:text-gray-500 uppercase mt-2">Owed Loss: ৳{financeSummary.owedLoss}</div>
                 </div>

                 <div className="p-3 bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 rounded-2xl shadow-xs">
                   <div className="flex items-center gap-2 mb-2 text-red-500">
                      <AlertCircle size={12} /> <span className="text-[10px] font-black uppercase tracking-widest">You Pay</span>
                   </div>
                   <div className="text-xl font-black text-slate-900 dark:text-white">৳{financeSummary.owedToOther}</div>
                   <div className="text-[9.5px] font-semibold text-slate-600 dark:text-gray-400 mt-1">Profit from other party's sent orders <span className="text-[8px] text-slate-500 dark:text-gray-500 block font-normal">(Selling Price - Buying Price × Quantity)</span></div>
                   <div className="text-[8px] font-bold text-slate-500 dark:text-gray-500 uppercase mt-2">Incoming Pending: ৳{financeSummary.otherPendingProfit}</div>
                </div>
                
                <div className="col-span-1 sm:col-span-3 p-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl space-y-4 mt-2 shadow-xs">
                   <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="text-[10px] font-black text-cyan-600 dark:text-dragon-cyan uppercase tracking-widest animate-pulse">Withdrawal</h4>
                        <button
                          type="button"
                          onClick={() => setShowReportPopup(true)}
                          className="px-2.5 py-1 bg-cyan-50 hover:bg-cyan-100 dark:bg-dragon-cyan/10 dark:hover:bg-dragon-cyan/20 border border-cyan-200 dark:border-dragon-cyan/30 rounded-lg text-[9px] font-black text-cyan-700 dark:text-dragon-cyan uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <FileText size={11} /> মিনি রিপোর্ট
                        </button>
                      </div>
                      <span className="text-[8px] text-slate-500 dark:text-gray-500 font-bold uppercase">Profit: ৳{financeSummary.myProfit}</span>
                   </div>

                    {/* Select Payment Method */}
                    <div className="bg-slate-50 dark:bg-white/[0.02] p-4 rounded-xl border border-slate-200 dark:border-white/5 space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/5 pb-1.5">
                        <h5 className="text-[9px] font-black text-cyan-600 dark:text-dragon-cyan uppercase tracking-widest">1. Select Payment Method</h5>
                        <button
                          type="button"
                          onClick={() => setShowWithdrawModal(true)}
                          className="text-[8.5px] font-bold text-cyan-600 dark:text-dragon-cyan hover:underline hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Settings size={10} /> Method Settings
                        </button>
                      </div>

                      {paymentAccounts.length > 0 ? (
                        <div className="space-y-3">
                          <div className="relative">
                            <select
                              value={selectedAccountId}
                              onChange={(e) => setSelectedAccountId(e.target.value)}
                              className="w-full px-3.5 py-3 bg-white dark:bg-[#0c0d16] border border-slate-200 dark:border-white/10 hover:border-cyan-500 dark:hover:border-dragon-cyan/30 text-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none focus:border-cyan-500 dark:focus:border-dragon-cyan/50 transition-all appearance-none cursor-pointer"
                            >
                              {paymentAccounts.map((acc) => (
                                <option key={acc.id} value={acc.id} className="bg-white text-slate-900 dark:bg-[#0f111a] dark:text-white text-xs">
                                  {acc.bankName} - {acc.accountNumber} ({acc.accountName || 'N/A'})
                                </option>
                              ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400 dark:text-gray-400">
                              <ChevronDown size={14} />
                            </div>
                          </div>

                          {activeAccount && (
                            <div className="bg-white dark:bg-[#0a0c14] border border-cyan-500/20 dark:border-dragon-cyan/20 rounded-xl p-3.5 space-y-1 text-xs leading-relaxed shadow-xs">
                              <div className="text-[8.5px] font-black text-cyan-600 dark:text-dragon-cyan uppercase tracking-wider mb-1">Selected Account</div>
                              <div className="flex flex-wrap items-center gap-y-1 text-slate-900 dark:text-white font-mono">
                                <div>
                                  <span className="text-slate-500 dark:text-gray-400 font-bold text-[10px]">Method:</span> <span className="font-black text-cyan-700 dark:text-dragon-cyan px-1.5 py-0.5 rounded bg-cyan-500/10 dark:bg-dragon-cyan/10">{activeAccount.bankName}</span>
                                </div>
                                <span className="mx-2 text-slate-300 dark:text-white/10 hidden sm:inline">|</span>
                                <div>
                                  <span className="text-slate-500 dark:text-gray-400 font-bold text-[10px]">Name:</span> <span className="font-bold text-slate-900 dark:text-white pr-2">{activeAccount.accountName || 'N/A'}</span>
                                </div>
                                <span className="mx-2 text-slate-300 dark:text-white/10 hidden sm:inline">|</span>
                                <div>
                                  <span className="text-slate-500 dark:text-gray-400 font-bold text-[10px]">Number:</span> <span className="font-black text-slate-900 dark:text-white">{activeAccount.accountNumber}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-amber-50 dark:bg-yellow-500/5 border border-amber-200 dark:border-yellow-500/10 rounded-xl p-3.5 text-center space-y-2">
                          <p className="text-[10px] font-semibold text-amber-800 dark:text-yellow-500 leading-relaxed">
                            Please set up at least one payment method account from the settings tab in the withdrawal history panel before requesting a withdrawal.
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowWithdrawModal(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 dark:bg-yellow-500/10 dark:hover:bg-yellow-500/20 text-amber-800 dark:text-yellow-400 border border-amber-300 dark:border-yellow-500/20 hover:border-amber-400 dark:hover:border-yellow-500/35 rounded-lg text-[9px] font-black uppercase transition-all duration-200 cursor-pointer"
                          >
                            <Settings size={10} /> Add Method
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-50 dark:bg-white/[0.02] p-4 rounded-xl border border-slate-200 dark:border-white/5 space-y-3">
                      <h5 className="text-[9px] font-black text-emerald-600 dark:text-dragon-emerald uppercase tracking-widest border-b border-slate-200 dark:border-white/5 pb-1">2. Withdraw Money</h5>
                      
                      {hasPendingWithdrawal ? (
                        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3.5 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold text-xs">
                              <Clock size={14} className="animate-spin-slow shrink-0" />
                              <span>Active Pending Request: ৳{pendingWithdrawalMsg?.paymentData?.amount || 0}</span>
                            </div>
                            <span className="text-[9px] font-mono text-amber-800 dark:text-amber-500/80 uppercase px-2 py-0.5 rounded bg-amber-200/60 dark:bg-amber-500/10">Pending</span>
                          </div>
                          <p className="text-[10px] text-slate-700 dark:text-gray-300 leading-relaxed">
                            You currently have a pending withdrawal request. You cannot submit a second request while one is pending. You can delete or cancel your existing request below to send a new request.
                          </p>
                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm(`Are you sure you want to cancel and delete your pending withdrawal request of ৳${pendingWithdrawalMsg?.paymentData?.amount || 0}?`)) {
                                let actualChatId = chatId || '';
                                if (actualChatId.startsWith('new_')) {
                                  const otherId = actualChatId.replace('new_', '');
                                  actualChatId = [user?.uid || '', otherId].sort().join('_');
                                }
                                try {
                                  await updateDoc(doc(db, `chats/${actualChatId}/messages`, pendingWithdrawalMsg.id), {
                                    type: 'deleted',
                                    text: 'Withdrawal request cancelled',
                                    updatedAt: new Date().toISOString()
                                  });
                                  alert('Pending withdrawal request cancelled and deleted successfully.');
                                } catch (err) {
                                  console.error('Failed to cancel request:', err);
                                  alert('Failed to cancel request.');
                                }
                              }
                            }}
                            className="w-full py-2 bg-rose-50 hover:bg-rose-100 dark:bg-red-500/15 dark:hover:bg-red-500/25 text-rose-600 hover:text-rose-700 dark:text-red-400 dark:hover:text-red-300 border border-rose-200 dark:border-red-500/25 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Trash2 size={12} /> Delete / Cancel Pending Request
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                           <SimpleInput 
                             label="Amount" 
                             type="number" 
                             placeholder="Enter amount to withdraw"
                             value={withdrawAmount || ''} 
                             onChange={(v: any) => setWithdrawAmount(parseFloat(v) || 0)} 
                           />

                           {withdrawAmount > financeSummary.myProfit && (
                             <div className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-rose-50 dark:bg-red-500/10 border border-rose-200 dark:border-red-500/20 p-2.5 rounded-xl flex items-center gap-1.5">
                               <AlertCircle size={13} className="shrink-0 text-red-500 dark:text-red-400" />
                               <span>
                                 Requested amount (৳{withdrawAmount}) exceeds your available delivered profit balance of ৳{financeSummary.myProfit}.
                               </span>
                             </div>
                           )}

                           <button 
                             type="button"
                             onClick={async (e) => {
                               e.preventDefault();
                               if (!activeAccount) {
                                 alert('Please select or add a payment method first!');
                                 return;
                               }
                               if (!withdrawAmount || withdrawAmount <= 0) {
                                 alert('Please enter a valid withdrawal amount!');
                                 return;
                               }
                               if (withdrawAmount > financeSummary.myProfit) {
                                 alert(`Withdrawal amount (৳${withdrawAmount}) cannot exceed your available delivered profit balance of ৳${financeSummary.myProfit}!`);
                                 return;
                               }
                               if (hasPendingWithdrawal) {
                                 alert('You already have an active pending withdrawal request. Please cancel or process your pending request before submitting a new one!');
                                 return;
                               }
                               await handleWithdrawRequest({
                                 amount: withdrawAmount,
                                 accountName: activeAccount.accountName,
                                 accountNumber: activeAccount.accountNumber,
                                 bankName: activeAccount.bankName
                               });
                               setWithdrawAmount(0);
                               alert('Withdrawal request sent successfully!');
                             }} 
                             disabled={!withdrawAmount || withdrawAmount <= 0 || !activeAccount || withdrawAmount > financeSummary.myProfit || hasPendingWithdrawal}
                             className="w-full py-3.5 bg-emerald-600 dark:bg-dragon-emerald text-white dark:text-dragon-black shadow-lg shadow-emerald-600/20 dark:shadow-dragon-emerald/20 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] disabled:opacity-35 flex items-center justify-center gap-2 transition-all hover:bg-emerald-700 dark:hover:bg-dragon-emerald/90 cursor-pointer"
                           >
                             Withdraw <ArrowUpRight size={14} />
                           </button>
                        </div>
                      )}
                    </div>
                    {}
                </div>
             </motion.div>
           )}
         </AnimatePresence>
      </div>

      {showWithdrawModal ? (
        <WithdrawalHistoryPanel 
          onClose={() => setShowWithdrawModal(false)}
          currentUser={user || { uid: '' }}
          otherUser={otherUser}
          messages={messages}
          myProfit={financeSummary.myProfit}
          onPayRequest={handlePayRequest}
        />
      ) : (
        <>
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-2 sm:px-4 py-3 space-y-1.5 sm:space-y-2 bg-white dark:bg-[#18191a]">
            {messages.map((msg, idx) => {
              const prevMsg = messages[idx - 1];
              const isNewDay = !prevMsg || 
                new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();

              return (
                <React.Fragment key={`chatroom-msg-${msg.id || ''}-${idx}`}>
                  {isNewDay && (
                    <div className="flex justify-center my-4 select-none">
                      <div className="px-3 py-1 bg-[#f0f2f5] dark:bg-[#242526] text-[#65676b] dark:text-[#b0b3b8] rounded-full text-[11px] font-semibold tracking-tight shadow-xs">
                        {new Date(msg.createdAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </div>
                    </div>
                  )}
                  <ChatMessageItem 
                    id={`msg-${msg.id}`}
                    message={msg} 
                    orderData={msg.orderId ? (allDbOrders.find(o => o.id === msg.orderId) || (msg as any).orderData) : (msg as any).orderData}
                    isOwn={msg.senderId === user?.uid} 
                    isTarget={Boolean(targetOrderId && msg.orderId === targetOrderId)}
                    setActiveMapOrder={setActiveMapOrder}
                    otherUserCountry={otherUser?.country}
                    otherUserAvatar={otherUser?.profileImage || (otherUser as any)?.photoURL || (otherUser as any)?.avatar || ''}
                    otherUserName={otherUser?.name || otherUser?.email || 'User'}
                    showAvatar={!Boolean(messages[idx + 1] && messages[idx + 1].senderId === msg.senderId)}
                    onReply={(m: any) => setReplyingTo(m)}
                    onPayRequest={handlePayRequest}
                    onPreviewImage={setPreviewImageUrl}
                    onEditOrder={(order) => {
                      setEditingOrder(order);
                      setShowOrderPopup(true);
                    }}
                    onDeleteMessage={async (m) => {
                      if (!chatId || !user) return;
                      let actualChatId = chatId;
                      if (chatId.startsWith('new_')) {
                        const otherId = chatId.replace('new_', '');
                        actualChatId = [user.uid, otherId].sort().join('_');
                      }
                      try {
                        // Check if it's an order and if it can be deleted
                        if (m.type === 'order' && m.orderId) {
                          const orderDoc = await getDoc(doc(db, 'orders', m.orderId));
                          if (orderDoc.exists()) {
                            const orderData = orderDoc.data() as Order;
                            if (orderData.status !== 'pending') {
                              alert(`You cannot delete this order because it is already ${orderData.status.toUpperCase()}.`);
                              return;
                            }
                            // Delete order from orders collection entirely
                            await deleteDoc(doc(db, 'orders', m.orderId));
                          }
                        }

                        // Delete or mark message as deleted in chat history
                        await updateDoc(doc(db, `chats/${actualChatId}/messages`, m.id), {
                          type: 'deleted',
                          text: 'Message deleted',
                          updatedAt: new Date().toISOString()
                        });
                      } catch (e) {
                        handleFirestoreError(e, OperationType.UPDATE, 'messages');
                      }
                    }}
                    onUpdateStatus={async (id, status, details) => {
                      try {
                        await updateDoc(doc(db, 'orders', id), { 
                          status, 
                          updatedAt: new Date().toISOString(),
                          ...(details ? { courierDetails: details } : {}) 
                        });
                      } catch (e) {
                        handleFirestoreError(e, OperationType.UPDATE, `orders/${id}`);
                      }
                    }}
                  />
                </React.Fragment>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <ChatInputBar
            inputText={inputText}
            setInputText={setInputText}
            isRecording={isRecording}
            recordingDuration={recordingDuration}
            replyingTo={replyingTo}
            setReplyingTo={setReplyingTo}
            isLocked={currentUserFollowsOther === false || otherUserFollowsCurrentUser === false}
            inputRef={inputRef}
            onSendMessage={handleSendMessage}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            onOpenOrderPopup={() => setShowOrderPopup(true)}
            onChatInputPaste={handleChatInputPaste}
            onSetTypingStatus={(isTyping: boolean) => {
              if (user?.uid && chatId) {
                let actualChatId = chatId;
                if (chatId.startsWith('new_')) {
                  const otherId = chatId.replace('new_', '');
                  actualChatId = [user.uid, otherId].sort().join('_');
                }
                setTypingStatus(actualChatId, user.uid, isTyping);
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                if (isTyping) {
                  typingTimeoutRef.current = setTimeout(() => {
                    setTypingStatus(actualChatId, user.uid, false);
                  }, 2500);
                }
              }
            }}
          />
        </>
      )}

      <AnimatePresence>
        {showProfile && (
          <ProfileDrawer 
            user={otherUser} 
            catalog={otherUserCatalog} 
            isLocked={isCatalogLocked}
            onClose={() => setShowProfile(false)} 
            onSync={handleSyncProduct} 
            syncingId={syncingItemId} 
            onPreviewImage={setPreviewImageUrl}
            onCreateOrder={handleCreateOrder}
            onOpenOrderForm={(item: any) => {
              setEditingOrder({
                productName: item.name || '',
                sellPrice: Number(item.sellPrice || item.price) || 0,
                buyPrice: Number(item.sellPrice || item.price || 0),
                quantity: 1,
                productImage: item.image || '',
                productImages: item.image ? [item.image] : [],
                size: item.size || '',
                color: item.color || '',
                weight: item.weight || '',
                customerName: '',
                customerPhone: '',
                customerAddress: '',
                deliveryCharge: 60,
              } as any);
              setShowOrderPopup(true);
              setShowProfile(false);
            }}
          />
        )}
        {showOrderPopup && (
          <CreateOrderPopup 
            onClose={() => { setShowOrderPopup(false); setEditingOrder(null); }} 
            onSubmit={handleCreateOrder} 
            initialData={editingOrder}
            onPreviewImage={setPreviewImageUrl}
          />
        )}
        <ChatReportPopup 
          isOpen={showReportPopup}
          onClose={() => setShowReportPopup(false)}
          currentUser={user || { uid: '' }}
          otherUser={otherUser}
          allOrders={allDbOrders}
        />

        <CallMuteModal 
          isOpen={isMuteModalOpen}
          onClose={() => setIsMuteModalOpen(false)}
          targetUser={otherUser}
          currentUserUid={user?.uid || ''}
        />

        <CallLogModal 
          isOpen={showCallLogModal}
          onClose={() => setShowCallLogModal(false)}
          currentUser={user || { uid: '' }}
          otherUser={otherUser}
          messages={messages}
          onInitiateCall={(type) => handleInitiateCall(type)}
        />

        <SmartPasteModal
          isOpen={chatSmartPaste.isOpen}
          onClose={() => setChatSmartPaste(prev => ({ ...prev, isOpen: false }))}
          pastedText={chatSmartPaste.pastedText}
          initialTargetField={chatSmartPaste.initialTargetField}
          onApply={handleChatSmartPasteApply}
          country={profile?.country || 'Bangladesh'}
        />

        <AnimatePresence>
          {previewImageUrl && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewImageUrl(null)}
              className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
            >
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewImageUrl(null);
                }}
                className="absolute top-4 right-4 p-2.5 bg-black/60 hover:bg-black/80 text-white border border-white/10 rounded-full transition-all cursor-pointer z-[10000] flex items-center justify-center"
              >
                <X size={20} />
              </button>
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                onClick={(e) => e.stopPropagation()}
                className="relative max-w-[95vw] max-h-[85vh] md:max-w-4xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#0b0c10]"
              >
                <img 
                  src={previewImageUrl} 
                  alt="Order Item Preview" 
                  className="max-w-full max-h-[80vh] object-contain block mx-auto"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>


      </AnimatePresence>
    </div>
  );
}

function SimpleInput({ label, value, onChange, placeholder, type = 'text' }: any) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-gray-400 uppercase">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none text-sm text-white font-mono" />
    </div>
  );
}
