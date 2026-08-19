import React, { useState, useEffect, useContext, useRef } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  getDocs, 
  doc, 
  getDoc, 
  limit, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  setDoc 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, getCachedUserProfile, setCachedUserProfile } from '../lib/firebase';
import { getCachedDoc } from '../utils/firestoreCache';
import { listenUnreadBadges, listenUserPresence } from '../services/rtdbEphemeralService';
import { AuthContext } from '../authContext';
import { PageContainer } from '../components/Navigation';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, 
  UserPlus, 
  MessageCircle, 
  Sparkles, 
  Hash, 
  Type, 
  FileText, 
  X, 
  Image as ImageIcon, 
  Copy, 
  Zap, 
  Heart, 
  MessageSquare, 
  Users, 
  Check, 
  CheckCheck, 
  ShoppingBag, 
  Eye, 
  AlertTriangle, 
  ArrowUpRight, 
  Loader2, 
  UserCheck,
  UserMinus,
  Star,
  Bookmark,
  Home,
  Bell,
  Trash2,
  CornerUpLeft,
  Maximize2,
  Minimize2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ArrowLeft,
  Wallet,
  Clock,
  ArrowDownLeft,
  CheckCircle,
  AlertCircle,
  Settings,
  Sliders,
  Save,
  Layers,
  Plus,
  User,
  Lock,
  Truck
} from 'lucide-react';
import { UserProfile, ChatThread, InventoryItem } from '../types';
import { formatDate, cn, parseCallLog } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import CallMuteModal from '../components/CallMuteModal';
import { CallLogModal, CallLogView } from '../components/CallLogModal';
import SocialFeed from '../components/SocialFeed';
import { SiteMessengerTab } from '../components/SiteMessengerTab';
import {
  PRODUCT_CATEGORIES,
  POST_BACKGROUND_THEMES,
  POST_TEXT_COLORS,
  PostThemeVectorOverlay,
  renderTextWithHashtags,
  ExpandablePostText
} from '../components/social/PostThemeUtils';
import { DeleteConfirmModal } from '../components/messenger/DeleteConfirmModal';
import { FollowersModal, FollowingModal } from '../components/messenger/FollowersFollowingModals';
import { UserRow, ChatRow } from '../components/messenger/MessengerRows';
import { MagicDrawerModal } from '../components/messenger/MagicDrawerModal';

export {
  PRODUCT_CATEGORIES,
  POST_BACKGROUND_THEMES,
  POST_TEXT_COLORS,
  PostThemeVectorOverlay,
  renderTextWithHashtags,
  ExpandablePostText
};

export default function Messenger() {
  const { user } = useContext(AuthContext);
  const [chats, setChats] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Social Networking (Followers & Following) States
  const [followingList, setFollowingList] = useState<any[]>([]);
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [showFollowersModal, setShowFollowersModal] = useState<boolean>(false);
  const [showFollowingModal, setShowFollowingModal] = useState<boolean>(false);
  const [inspectedFollowingCount, setInspectedFollowingCount] = useState<number>(0);
  const [inspectedFollowersCount, setInspectedFollowersCount] = useState<number>(0);

  const [communityPosts, setCommunityPosts] = useState<any[]>([]);

  const [profilesCache, setProfilesCache] = useState<Record<string, UserProfile>>(() => {
    try {
      const cached = localStorage.getItem('dragon_realtime_users');
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  });
  const [now, setNow] = useState(Date.now());

  const mappedChats = React.useMemo(() => {
    return chats.map(c => {
      const otherId = c.participants?.find((p: string) => p !== user?.uid);
      const otherUser = otherId ? profilesCache[otherId] : undefined;
      return {
        ...c,
        otherUser
      };
    });
  }, [chats, profilesCache, user?.uid]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 15000);
    return () => clearInterval(timer);
  }, []);



  const [rtdbUnreadMap, setRtdbUnreadMap] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user?.uid) return;
    const unsubUnread = listenUnreadBadges(user.uid, (unreadMap) => {
      setRtdbUnreadMap(unreadMap || {});
    });
    return () => unsubUnread();
  }, [user?.uid]);

  const isUserOnline = (profile?: UserProfile) => {
    if (!profile) return false;
    if (!profile.lastActive) return false;
    const thresholdMs = 240 * 1000; // 4 minutes
    const lastActiveTime = new Date(profile.lastActive).getTime();
    const diffMs = now - lastActiveTime;
    return diffMs < thresholdMs;
  };

  // Call Muting & Call Log States
  const [selectedMuteUser, setSelectedMuteUser] = useState<UserProfile | null>(null);
  const [isMuteModalOpen, setIsMuteModalOpen] = useState(false);
  const [showCallLogModal, setShowCallLogModal] = useState(false);

  useEffect(() => {
    const handleMuteEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.targetUser) {
        setSelectedMuteUser(customEvent.detail.targetUser);
        setIsMuteModalOpen(true);
      }
    };

    window.addEventListener('open-mute-call-modal', handleMuteEvent);
    return () => {
      window.removeEventListener('open-mute-call-modal', handleMuteEvent);
    };
  }, []);

  // Active Main Tab State
  const [activeMainTab, setActiveMainTab] = useState<'inbox' | 'incoming_withdrawals' | 'outgoing_withdrawals' | 'site_messenger' | 'social' | 'call_logs'>('inbox');

  // Securely and cost-effectively listen to user profiles for active chat participants & community post authors
  useEffect(() => {
    if (!user) return;

    const chatOtherIds = chats
      .map(c => c.participants?.find((p: string) => p !== user.uid))
      .filter((id): id is string => !!id);

    const postAuthorIds = communityPosts
      .map(p => p.userId)
      .filter((id): id is string => !!id && id !== user.uid);

    const uniqueOtherIds = Array.from(new Set([...chatOtherIds, ...postAuthorIds]));

    const unsubs: (() => void)[] = [];

    uniqueOtherIds.forEach((id: any) => {
      const stringId = id as string;
      const unsub = onSnapshot(doc(db, 'users', stringId), (snap) => {
        if (snap.exists()) {
          setProfilesCache(prev => {
            const updated = {
              ...prev,
              [stringId]: { uid: snap.id, ...snap.data() } as UserProfile
            };
            try {
              localStorage.setItem('dragon_realtime_users', JSON.stringify(updated));
            } catch {}
            return updated;
          });
        }
      }, (err) => {
        console.warn(`Failed to listen to profile ${stringId}:`, err);
      });
      unsubs.push(unsub);
    });

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [chats, communityPosts, user]);

  // Dragon Site Messenger States
  const [siteChats, setSiteChats] = useState<any[]>(() => {
    try {
      const cached = localStorage.getItem('dragon_site_chats');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  // States for Incoming and Outgoing Withdrawals
  const [showIncomingWithdrawModal, setShowIncomingWithdrawModal] = useState(false);
  const [withdrawMessages, setWithdrawMessages] = useState<any[]>([]);
  const [outgoingWithdrawMessages, setOutgoingWithdrawMessages] = useState<any[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, any>>({});
  const [approvingMsgId, setApprovingMsgId] = useState<string | null>(null);
  const [trxIdInput, setTrxIdInput] = useState<string>('');

  // AI Magic States (from previous design)
  const [showMagicDrawer, setShowMagicDrawer] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicImage, setMagicImage] = useState<string | null>(null);
  const [magicResult, setMagicResult] = useState<{
    title: string;
    details: string;
    hashtags: string;
    keywords: string;
  } | null>(null);
  const [lastMagicAction, setLastMagicAction] = useState<number>(Date.now());

  // Dragon Social States
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const isGlobalBotActive = currentUserProfile?.globalBotActive !== false;
  const [receivedRequests, setReceivedRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);

  // Post Creator States
  const [newPostText, setNewPostText] = useState('');
  const [newPostRole, setNewPostRole] = useState<'supplier' | 'seller'>('supplier');
  const [newPostCategory, setNewPostCategory] = useState('clothing');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [newPostBgTheme, setNewPostBgTheme] = useState<string>('none');
  const [newPostTextColor, setNewPostTextColor] = useState<string>('#FFFFFF');
  const [newPostShowCatalog, setNewPostShowCatalog] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [moderationWarning, setModerationWarning] = useState<string | null>(null);

  // Social Filtering States
  const [socialFilterRole, setSocialFilterRole] = useState<'all' | 'supplier' | 'seller'>('all');
  const [socialFilterCategory, setSocialFilterCategory] = useState<'all' | string>('all');
  const [feedViewFilter, setFeedViewFilter] = useState<'all' | 'my-posts' | 'favorites'>('all');
  const [favoritePostIds, setFavoritePostIds] = useState<string[]>([]);
  const [favoritedIdsOnEnterTab, setFavoritedIdsOnEnterTab] = useState<string[]>([]);
  const [socialSubTab, setSocialSubTab] = useState<'home' | 'favorites' | 'my_posts' | 'notifications' | 'settings'>('home');

  useEffect(() => {
    if (socialSubTab === 'favorites') {
      if (favoritedIdsOnEnterTab.length === 0 && favoritePostIds.length > 0) {
        setFavoritedIdsOnEnterTab(favoritePostIds);
      }
    } else {
      setFavoritedIdsOnEnterTab([]);
    }
  }, [socialSubTab, favoritePostIds, favoritedIdsOnEnterTab.length]);
  const [socialSearchQuery, setSocialSearchQuery] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search');
    if (searchParam) {
      setSocialSearchQuery(searchParam);
      setSocialSubTab('home');
    }
  }, [location.search]);
  const [settingsFilterRole, setSettingsFilterRole] = useState<'all' | 'supplier' | 'seller'>(() => {
    const saved = localStorage.getItem('social_settings_filter_role');
    return (saved as 'all' | 'supplier' | 'seller') || 'all';
  });
  const [settingsFilterCategories, setSettingsFilterCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('social_settings_filter_categories');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return ['clothing', 'electronics', 'beauty', 'home', 'baby', 'fitness', 'food', 'bags', 'accessories', 'other'];
  });
  const [settingsSavedSuccess, setSettingsSavedSuccess] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingPostText, setEditingPostText] = useState('');
  const [editingPostRole, setEditingPostRole] = useState<'supplier' | 'seller'>('supplier');
  const [editingPostCategory, setEditingPostCategory] = useState('clothing');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [socialNotifications, setSocialNotifications] = useState<any[]>([]);
  const [focusedPostId, setFocusedPostId] = useState<string | null>(null);

  // Delete Post Confirmation State
  const [deleteConfirmPostId, setDeleteConfirmPostId] = useState<string | null>(null);
  const [isDeletingPost, setIsDeletingPost] = useState(false);

  // Custom Site Chat Delete Confirmation States
  const [deleteConfirmSiteChatId, setDeleteConfirmSiteChatId] = useState<string | null>(null);
  const [isDeletingSiteChat, setIsDeletingSiteChat] = useState(false);

  // Highlighting specific user comment from notifications
  const [highlightedUserId, setHighlightedUserId] = useState<string | null>(null);

  // Comment States
  const [activePostComments, setActivePostComments] = useState<Record<string, any[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [commentModerationErrors, setCommentModerationErrors] = useState<Record<string, string>>({});
  const [commentLoading, setCommentLoading] = useState<Record<string, boolean>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [replyingTo, setReplyingTo] = useState<Record<string, { commentId: string; userName: string } | null>>({});

  // Dynamic Catalog View Modal
  const [viewingCatalogUserId, setViewingCatalogUserId] = useState<string | null>(null);
  const [viewingCatalogUserName, setViewingCatalogUserName] = useState<string | null>(null);
  const [viewingCatalogItems, setViewingCatalogItems] = useState<InventoryItem[]>([]);
  const [isViewingCatalogLocked, setIsViewingCatalogLocked] = useState<boolean>(false);
  const [viewingCatalogUserDoc, setViewingCatalogUserDoc] = useState<any | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [syncingItemId, setSyncingItemId] = useState<string | null>(null);
  const [catalogPage, setCatalogPage] = useState(1);
  const [merchantCategories, setMerchantCategories] = useState<{ id: string; name: string }[]>([]);
  const [productToSync, setProductToSync] = useState<InventoryItem | null>(null);
  const [showSyncCategoryModal, setShowSyncCategoryModal] = useState(false);
  const [syncSelectedCategory, setSyncSelectedCategory] = useState<string>('');

  // User Profile Inspection Modal States
  const [selectedUserForProfileModal, setSelectedUserForProfileModal] = useState<{ uid: string; name: string; profileImage: string | null } | null>(null);
  const [selectedUserProfileData, setSelectedUserProfileData] = useState<any | null>(null);
  const [loadingSelectedUserProfile, setLoadingSelectedUserProfile] = useState(false);

  useEffect(() => {
    if (!selectedUserForProfileModal) {
      setSelectedUserProfileData(null);
      return;
    }
    setLoadingSelectedUserProfile(true);
    const unsub = onSnapshot(doc(db, 'users', selectedUserForProfileModal.uid), (snap) => {
      if (snap.exists()) {
        setSelectedUserProfileData(snap.data());
      } else {
        setSelectedUserProfileData(null);
      }
      setLoadingSelectedUserProfile(false);
    }, (err) => {
      console.error("Error listening to inspected user profile:", err);
      setLoadingSelectedUserProfile(false);
    });

    return () => unsub();
  }, [selectedUserForProfileModal]);

  // Real-time listener for viewing catalog user doc (store name, cover photo, delivery rates)
  useEffect(() => {
    if (!viewingCatalogUserId) {
      setViewingCatalogUserDoc(null);
      return;
    }
    const unsub = onSnapshot(doc(db, 'users', viewingCatalogUserId), (snap) => {
      if (snap.exists()) {
        setViewingCatalogUserDoc(snap.data());
      }
    }, (err) => {
      console.warn("Error listening to viewing catalog user doc:", err);
    });
    return () => unsub();
  }, [viewingCatalogUserId]);

  // Subscribe to current user's follower/following lists (limited to 100 entries)
  useEffect(() => {
    if (!user) return;
    const followingQ = query(
      collection(db, 'social_relationships'),
      where('followerId', '==', user.uid),
      limit(100)
    );
    const unsubFollowing = onSnapshot(followingQ, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setFollowingList(list);
    }, (err) => {
      console.error("Error fetching following list:", err);
    });

    const followersQ = query(
      collection(db, 'social_relationships'),
      where('followingId', '==', user.uid),
      limit(100)
    );
    const unsubFollowers = onSnapshot(followersQ, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setFollowersList(list);
    }, (err) => {
      console.error("Error fetching followers list:", err);
    });

    return () => {
      unsubFollowing();
      unsubFollowers();
    };
  }, [user]);

  // Subscribe to inspected user's follower/following counts
  useEffect(() => {
    if (!selectedUserForProfileModal) {
      setInspectedFollowingCount(0);
      setInspectedFollowersCount(0);
      return;
    }
    const targetUid = selectedUserForProfileModal.uid;

    const followingQ = query(
      collection(db, 'social_relationships'),
      where('followerId', '==', targetUid)
    );
    const unsubFollowing = onSnapshot(followingQ, (snap) => {
      setInspectedFollowingCount(snap.size);
    }, (err) => {
      console.error("Error loading inspected user following count:", err);
    });

    const followersQ = query(
      collection(db, 'social_relationships'),
      where('followingId', '==', targetUid)
    );
    const unsubFollowers = onSnapshot(followersQ, (snap) => {
      setInspectedFollowersCount(snap.size);
    }, (err) => {
      console.error("Error loading inspected user followers count:", err);
    });

    return () => {
      unsubFollowing();
      unsubFollowers();
    };
  }, [selectedUserForProfileModal]);

  // Toggle follow/unfollow status for a target user
  const handleFollowToggle = async (targetUser: { uid: string; name: string; profileImage: string | null }) => {
    if (!user) return;
    const relationshipId = `${user.uid}_${targetUser.uid}`;
    const relationshipRef = doc(db, 'social_relationships', relationshipId);

    const isFollowing = followingList.some(f => f.followingId === targetUser.uid);

    try {
      if (isFollowing) {
        // Unfollow
        await deleteDoc(relationshipRef);
      } else {
        // Follow
        await setDoc(relationshipRef, {
          followerId: user.uid,
          followerName: currentUserProfile?.name || currentUserProfile?.storeName || currentUserProfile?.businessName || user.displayName || 'User',
          followerImage: currentUserProfile?.profileImage || null,
          followingId: targetUser.uid,
          followingName: targetUser.name,
          followingImage: targetUser.profileImage || null,
          createdAt: new Date().toISOString()
        });

        // Send a dynamic social notification to target user
        try {
          await addDoc(collection(db, 'social_notifications'), {
            postOwnerId: targetUser.uid,
            triggerUserId: user.uid,
            triggerUserName: currentUserProfile?.name || currentUserProfile?.storeName || currentUserProfile?.businessName || user.displayName || 'User',
            triggerUserProfileImage: currentUserProfile?.profileImage || '',
            type: 'follow',
            postId: '',
            text: 'started following you.',
            read: false,
            createdAt: new Date().toISOString()
          });
        } catch (notifErr) {
          console.warn("Failed to create follow notification:", notifErr);
        }
      }
    } catch (err) {
      console.error("Error toggling follow status:", err);
    }
  };

  // Load applicant and recipient profiles dynamically on demand to map names in withdrawal panels safely without listing the entire database
  useEffect(() => {
    if (!user || (withdrawMessages.length === 0 && outgoingWithdrawMessages.length === 0)) return;

    const fetchApplicantProfiles = async () => {
      const idsToFetch = new Set<string>();

      // Collect sender IDs from incoming requests
      withdrawMessages.forEach((m: any) => {
        if (m.senderId) idsToFetch.add(m.senderId);
      });

      // Collect recipient IDs from outgoing requests
      outgoingWithdrawMessages.forEach((m: any) => {
        const chatThread = chats.find(c => c.id === m.chatId) || siteChats.find(c => c.id === m.chatId);
        const recipientId = chatThread?.participants?.find((p: string) => p !== user.uid);
        if (recipientId) {
          idsToFetch.add(recipientId);
        }
      });

      const uniqueIds = Array.from(idsToFetch);

      // We only fetch profile IDs that we haven't resolved yet
      const missingIds = uniqueIds.filter(id => !usersMap[id]);
      if (missingIds.length === 0) return;

      const newProfiles: Record<string, any> = {};
      for (const id of missingIds) {
        try {
          const uDoc = await getDoc(doc(db, 'users', id));
          if (uDoc.exists()) {
            newProfiles[id] = { uid: uDoc.id, ...uDoc.data() };
          }
        } catch (err) {
          console.warn(`Failed to fetch profile for ID ${id}:`, err);
        }
      }

      if (Object.keys(newProfiles).length > 0) {
        setUsersMap(prev => ({ ...prev, ...newProfiles }));
      }
    };

    fetchApplicantProfiles();
  }, [withdrawMessages, outgoingWithdrawMessages, chats, siteChats, user]);

  // Secure reactive real-time listener for current user's participant chats' withdrawal requests (both incoming and outgoing)
  useEffect(() => {
    if (!user?.uid || (activeMainTab !== 'incoming_withdrawals' && activeMainTab !== 'outgoing_withdrawals')) return;

    const qChats = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );

    const activeSubscriptions: Record<string, () => void> = {};
    const chatMessagesMap: Record<string, any[]> = {};

    const updateCombinedMessages = () => {
      const allMsgs = Object.values(chatMessagesMap).flat();

      // De-duplicate messages by id to be absolutely robust against duplicate key warnings
      const uniqueMsgs = Array.from(
        new Map(allMsgs.map((m: any) => [m.id || Math.random().toString(), m])).values()
      );

      // Incoming requests: Sender is NOT current user
      const incoming = uniqueMsgs.filter((msg: any) => msg.senderId !== user.uid);
      incoming.sort((a: any, b: any) => {
        const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tB - tA;
      });
      setWithdrawMessages(incoming);

      // Outgoing requests: Sender IS current user
      const outgoing = uniqueMsgs.filter((msg: any) => msg.senderId === user.uid);
      outgoing.sort((a: any, b: any) => {
        const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tB - tA;
      });
      setOutgoingWithdrawMessages(outgoing);
    };

    const unsubscribeChats = onSnapshot(qChats, (snap) => {
      const currentChatIds = snap.docs.map(doc => doc.id);

      Object.keys(activeSubscriptions).forEach(id => {
        if (!currentChatIds.includes(id)) {
          if (activeSubscriptions[id]) activeSubscriptions[id]();
          delete activeSubscriptions[id];
          delete chatMessagesMap[id];
        }
      });

      currentChatIds.forEach(chatId => {
        if (!activeSubscriptions[chatId]) {
          const qMessages = query(
            collection(db, 'chats', chatId, 'messages'),
            where('type', '==', 'payment_request')
          );

          activeSubscriptions[chatId] = onSnapshot(qMessages, (msgSnap) => {
            chatMessagesMap[chatId] = msgSnap.docs.map(doc => ({
              ...doc.data(),
              id: doc.id,
              chatId
            }));
            updateCombinedMessages();
          }, (err) => {
            console.warn(`Failed reading messages for chat ${chatId}:`, err);
          });
        }
      });

      updateCombinedMessages();
    }, (err) => {
      console.error("Failed loading chat list in Messenger incoming withdrawals:", err);
    });

    return () => {
      unsubscribeChats();
      Object.values(activeSubscriptions).forEach(unsub => unsub());
    };
  }, [user?.uid, activeMainTab]);

  // Compute dynamic stats
  const withdrawStats = React.useMemo(() => {
    let totalRequested = 0;
    const applicantIds = new Set<string>();
    
    withdrawMessages.forEach((msg: any) => {
      const amt = Number(msg.paymentData?.amount || 0);
      totalRequested += amt;
      if (msg.senderId) {
        applicantIds.add(msg.senderId);
      }
    });

    return {
      totalAmount: totalRequested,
      totalCount: withdrawMessages.length,
      totalApplicants: applicantIds.size
    };
  }, [withdrawMessages]);

  const outgoingWithdrawStats = React.useMemo(() => {
    let totalRequested = 0;
    const recipientIds = new Set<string>();
    
    outgoingWithdrawMessages.forEach((msg: any) => {
      const amt = Number(msg.paymentData?.amount || 0);
      totalRequested += amt;
      
      const chatThread = chats.find(c => c.id === msg.chatId) || siteChats.find(c => c.id === msg.chatId);
      const otherId = chatThread?.participants?.find((p: string) => p !== user?.uid);
      if (otherId) {
        recipientIds.add(otherId);
      }
    });

    return {
      totalAmount: totalRequested,
      totalCount: outgoingWithdrawMessages.length,
      totalRecipients: recipientIds.size
    };
  }, [outgoingWithdrawMessages, chats, siteChats, user?.uid]);

  // Approval function
  const handleApprovePayment = async (targetChatId: string, messageId: string) => {
    if (!trxIdInput.trim()) {
      alert("Please provide the Transaction ID (TRX ID) to complete withdrawal!");
      return;
    }
    try {
      const msgRef = doc(db, `chats/${targetChatId}/messages`, messageId);
      await updateDoc(msgRef, {
        'paymentData.status': 'paid',
        'paymentData.trxId': trxIdInput.trim(),
        updatedAt: new Date().toISOString()
      });
      setApprovingMsgId(null);
      setTrxIdInput('');
      alert("Transaction approved successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to approve! Please try again.");
    }
  };

  // Date format helper
  const formatBanglaDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return isoString;
    }
  };

  const handleResetMagic = () => {
    setMagicImage(null);
    setMagicResult(null);
    setMagicLoading(false);
    setLastMagicAction(Date.now());
  };

  // Auto-reset logic for content generator
  useEffect(() => {
    if (!magicImage && !magicResult) return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastMagicAction > 5 * 60 * 1000) {
        handleResetMagic();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [magicImage, magicResult, lastMagicAction]);

  // Sync favorites when user loads or community posts change
  useEffect(() => {
    if (user) {
      try {
        const saved = localStorage.getItem(`dragon_favs_${user.uid}`);
        let localFavs = [];
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              localFavs = parsed;
            }
          } catch (e) {}
        }
        
        // Also get any posts where the user is in the post's favorites list
        const dbFavs = communityPosts
          .filter(p => Array.isArray(p.favorites) && p.favorites.includes(user.uid))
          .map(p => p.id);
        
        // Merge them uniquely
        const uniqueFavs = Array.from(new Set([...localFavs, ...dbFavs]));
        // Filter out any accidental user UIDs from previous corruption
        const cleanUniqueFavs = uniqueFavs.filter(id => id !== user.uid);
        setFavoritePostIds(cleanUniqueFavs);
      } catch (err) {
        console.error("Error reading favorites:", err);
      }
    } else {
      setFavoritePostIds([]);
    }
  }, [user, communityPosts]);

  useEffect(() => {
    if (!user) return;
    const qCats = query(collection(db, 'merchant_categories'), where('userId', '==', user.uid));
    const unsubCats = onSnapshot(qCats, (snap) => {
      const rawCats = snap.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data() as { name: string }
      }));
      const uniqueCats = Array.from(new Map(rawCats.map(c => [c.id, c])).values());
      setMerchantCategories(uniqueCats);
    }, (err) => {
      console.warn("Error fetching categories in Messenger:", err);
    });
    return () => unsubCats();
  }, [user]);

  const handleMagicFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLastMagicAction(Date.now());
      const reader = new FileReader();
      reader.onloadend = () => {
        setMagicImage(reader.result as string);
        setMagicResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateMagicContent = async () => {
    if (!magicImage) {
      alert('Please upload a product photo first!');
      return;
    }
    setMagicLoading(true);
    setLastMagicAction(Date.now());

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: "Analyze this product image and generate e-commerce content. Return JSON format with fields: title (attractive title in Bengali), details (detailed product description in Bengali), hashtags (relevant trending hashtags), keywords (SEO keywords). Ensure the response is ONLY the JSON object.",
          images: [magicImage],
          responseMimeType: "application/json"
        })
      });

      if (!response.ok) {
        let errorMessage = `AI request failed with status ${response.status}`;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } else {
          const text = await response.text();
          if (text.includes("UNAVAILABLE") || text.includes("high demand")) {
            errorMessage = "DOELpro AI is currently busy. Please wait a moment.";
          }
        }
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid format received from AI.");
      }

      const data = await response.json();
      setMagicResult(data);
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      alert(error.message || "Failed to generate content. Please try again.");
    } finally {
      setMagicLoading(false);
    }
  };

  // Load active profile with local cache strategy
  useEffect(() => {
    if (!user) return;
    const cachedProfile = getCachedUserProfile(user.uid);
    if (cachedProfile) {
      setCurrentUserProfile(cachedProfile as UserProfile);
    }

    const unsubProfile = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        const pData = { uid: snap.id, ...snap.data() } as UserProfile;
        setCurrentUserProfile(pData);
        setCachedUserProfile(user.uid, pData);
      }
    }, (err) => {
      console.warn("Error subscribing to profile details:", err);
    });
    return () => unsubProfile();
  }, [user]);

  // 1. Fetch user B2B threads (Limited to 30 active threads)
  useEffect(() => {
    if (!user || activeMainTab !== 'inbox') return;

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      limit(30)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const threads: ChatThread[] = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        } as ChatThread));
        
        // Sort threads in memory by updatedAt Safely
        threads.sort((a, b) => {
          const tA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const tB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return tB - tA;
        });

        const uniqueThreads = Array.from(new Map(threads.map(t => [t.id, t])).values());
        setChats(uniqueThreads);
        setLoading(false);
      } catch (err) {
        console.error("Failed to parse chats snapshot updates:", err);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'chats');
    });

    return () => {
      unsubscribe();
    };
  }, [user, activeMainTab]);

  // 2. Social Sync (Realtime Posts, Comments & Requests)
  useEffect(() => {
    if (!user || activeMainTab !== 'social') return;

    // Sub to Posts (limited to 30 most recent posts)
    const postsQ = query(collection(db, 'community_posts'), orderBy('createdAt', 'desc'), limit(30));
    const unsubPosts = onSnapshot(postsQ, (snap) => {
      const rawPosts = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      const uniquePosts = Array.from(new Map(rawPosts.map(p => [p.id, p])).values());
      setCommunityPosts(uniquePosts);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'community_posts');
    });

    // Sub to Comments (targeted ONLY to active posts on the feed to prevent platform-wide read spikes)
    let unsubComments: (() => void) | null = null;
    const activePostIds = communityPosts.map(p => p.id).filter(Boolean);
    if (activePostIds.length > 0) {
      const commentsQ = query(
        collection(db, 'community_comments'),
        where('postId', 'in', activePostIds.slice(0, 30)),
        limit(100)
      );
      unsubComments = onSnapshot(commentsQ, (snap) => {
        const rawComments = snap.docs.map(d => ({ id: d.id, ...d.data() } as any)).reverse();
        const uniqueComments = Array.from(new Map(rawComments.map(c => [c.id, c])).values());
        const grouped: Record<string, any[]> = {};
        uniqueComments.forEach(comm => {
          if (!grouped[comm.postId]) grouped[comm.postId] = [];
          grouped[comm.postId].push(comm);
        });
        setActivePostComments(grouped);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'community_comments');
      });
    }

    // Sub to Received Requests
    const receivedQ = query(collection(db, 'collab_requests'), where('receiverId', '==', user.uid));
    const unsubReceived = onSnapshot(receivedQ, (snap) => {
      const rawReceived = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      const uniqueReceived = Array.from(new Map(rawReceived.map(r => [r.id, r])).values());
      setReceivedRequests(uniqueReceived);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'collab_requests');
    });

    // Sub to Sent Requests
    const sentQ = query(collection(db, 'collab_requests'), where('senderId', '==', user.uid));
    const unsubSent = onSnapshot(sentQ, (snap) => {
      const rawSent = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      const uniqueSent = Array.from(new Map(rawSent.map(r => [r.id, r])).values());
      setSentRequests(uniqueSent);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'collab_requests');
    });

    // Sub to Notifications (limited to 30 most recent)
    const notificationsQ = query(collection(db, 'social_notifications'), where('postOwnerId', '==', user.uid), limit(30));
    const unsubNotifications = onSnapshot(notificationsQ, (snap) => {
      const rawNotifs = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      const uniqueNotifs = Array.from(new Map(rawNotifs.map(n => [n.id, n])).values());
      uniqueNotifs.sort((a, b) => {
        const dateA = a.createdAt || '';
        const dateB = b.createdAt || '';
        return dateB.localeCompare(dateA);
      });
      setSocialNotifications(uniqueNotifs);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'social_notifications');
    });

    return () => {
      unsubPosts();
      if (unsubComments) unsubComments();
      unsubReceived();
      unsubSent();
      unsubNotifications();
    };
  }, [user, activeMainTab, communityPosts.length]);

  // Mark notifications as read when the sub-tab is opened
  useEffect(() => {
    if (socialSubTab === 'notifications' && socialNotifications.some(n => !n.read)) {
      handleMarkNotificationsRead();
    }
  }, [socialSubTab, socialNotifications]);

  // Search user handler
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    
    setSearchAttempted(true);
    try {
      const trimmedQuery = searchQuery.trim();
      const q = query(collection(db, 'users'), where('phone', '==', trimmedQuery), limit(20));
      const snap = await getDocs(q);
      const results = snap.docs
        .map(d => ({ uid: d.id, ...d.data() } as UserProfile))
        .filter(u => u.uid !== user?.uid);
      setSearchResults(results);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
    }
  };

  // AI B2B Moderation Engine
  const moderateText = async (text: string): Promise<{ isDirectSelling: boolean, warning: string }> => {
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Analyze this user B2B community content: "${text}".
Rule constraint: Direct retail product sales advertisements to retail customers are forbidden here (e.g. "Buy this product for 200 BDT, buy now, inbox me order").
Allow B2B communication searches (e.g., supplier looking for seller, seller wanting to sell, dropshipping hire, hiring suppliers, rental offers, joint ventures, e.g., "Need seller", "I want to resell", "Looking for supplier").
Determine if the message targets retail purchase/selling advertisements directly instead of B2B.
Return strict JSON format with fields:
- "isDirectSelling": boolean (true if it tries to list a retail sale directly, false if B2B collaboration setup).
- "warning": string (Constructive detailed Bengali warnings explaining why direct retail selling is not allowed, or empty if false/approved).`,
          responseMimeType: "application/json"
        })
      });
      if (response.ok) {
        const data = await response.json();
        return {
          isDirectSelling: !!data.isDirectSelling,
          warning: data.warning || 'Direct product selling is disabled in this social page'
        };
      }
    } catch (err) {
      console.error("AI Moderation failed. Bypassed for resiliency.", err);
    }
    return { isDirectSelling: false, warning: '' };
  };

  // Social Forum Interaction handlers
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim() && !newPostImage) {
      alert("Please write some content or attach an image to publish card!");
      return;
    }
    setIsPosting(true);
    setModerationWarning(null);

    // AI Check only if there is text content
    if (newPostText.trim()) {
      try {
        const moderation = await moderateText(newPostText);
        if (moderation.isDirectSelling) {
          setModerationWarning(moderation.warning || "Sorry! This community feed is intended exclusively for B2B supplier-seller collaboration. Direct retail selling is forbidden here.");
          setIsPosting(false);
          return;
        }
      } catch (err) {
        console.error("AI Moderation failed. Bypassed for resiliency.", err);
      }
    }

    try {
      await addDoc(collection(db, 'community_posts'), {
        userId: user?.uid,
        userName: currentUserProfile?.name || user?.email?.split('@')[0] || 'User',
        userProfileImage: currentUserProfile?.profileImage || '',
        userPhone: currentUserProfile?.phone || '',
        userCountry: currentUserProfile?.country || 'Bangladesh',
        role: newPostRole,
        category: newPostCategory,
        text: newPostText,
        bgTheme: newPostBgTheme !== 'none' ? newPostBgTheme : '',
        textColor: newPostBgTheme !== 'none' ? newPostTextColor : '#FFFFFF',
        image: newPostImage || '',
        showCatalog: false,
        createdAt: new Date().toISOString(),
        likesCount: 0,
        likes: []
      });

      setNewPostText('');
      setNewPostImage(null);
      setNewPostBgTheme('none');
      setNewPostTextColor('#FFFFFF');
      setNewPostShowCatalog(false);
      setNewPostCategory('clothing');
    } catch (err) {
      console.error("Error creating post:", err);
      alert("Failed to publish your post. Please check your network and try again.");
    } finally {
      setIsPosting(false);
    }
  };

  const createSocialNotification = async (
    postId: string, 
    postOwnerId: string, 
    type: 'like' | 'comment' | 'favorite', 
    postExcerpt: string
  ) => {
    if (!user || !postOwnerId || postOwnerId === user.uid) return;
    try {
      await addDoc(collection(db, 'social_notifications'), {
        postId,
        postOwnerId,
        triggerUserId: user.uid,
        triggerUserName: currentUserProfile?.name || user.email?.split('@')[0] || 'User',
        triggerUserProfileImage: currentUserProfile?.profileImage || '',
        type,
        postExcerpt: postExcerpt ? (postExcerpt.length > 40 ? postExcerpt.substring(0, 40) + '...' : postExcerpt) : 'Post',
        createdAt: new Date().toISOString(),
        read: false
      });
    } catch (err) {
      console.error("Error creating social notification:", err);
    }
  };

  const handleMarkNotificationsRead = async () => {
    const unread = socialNotifications.filter(n => !n.read);
    if (unread.length === 0) return;
    try {
      const batchPromises = unread.map(async (notif) => {
        const notifRef = doc(db, 'social_notifications', notif.id);
        await updateDoc(notifRef, { read: true });
      });
      await Promise.all(batchPromises);
    } catch (err) {
      console.error("Error marking notifications as read:", err);
    }
  };

  const handleToggleLike = async (post: any) => {
    if (!user) return;
    try {
      const postRef = doc(db, 'community_posts', post.id);
      const currentLikes = Array.isArray(post.likes) ? post.likes : [];
      const hasLiked = currentLikes.includes(user.uid);
      const newLikes = hasLiked 
        ? currentLikes.filter((uid: string) => uid !== user.uid)
        : [...currentLikes, user.uid];
      
      await updateDoc(postRef, {
        likes: newLikes,
        likesCount: newLikes.length
      });

      if (!hasLiked) {
        await createSocialNotification(post.id, post.userId, 'like', post.text);
      }
    } catch (err) {
      console.error("Error liking post:", err);
    }
  };

  const handleToggleFavorite = async (postId: string) => {
    if (!user) return;
    try {
      const postRef = doc(db, 'community_posts', postId);
      const post = communityPosts.find(p => p.id === postId);
      if (!post) return;
      const currentFavorites = Array.isArray(post.favorites) ? post.favorites : [];
      const isFav = currentFavorites.includes(user.uid);
      const newFavorites = isFav 
        ? currentFavorites.filter((uid: string) => uid !== user.uid)
        : [...currentFavorites, user.uid];

      await updateDoc(postRef, {
        favorites: newFavorites,
        favoritesCount: newFavorites.length
      });

      // Correctly maintain local list of Post IDs favorited by this user
      setFavoritePostIds(prev => {
        const alreadyFav = prev.includes(postId);
        const nextFavs = alreadyFav ? prev.filter(id => id !== postId) : [...prev, postId];
        localStorage.setItem(`dragon_favs_${user.uid}`, JSON.stringify(nextFavs));
        return nextFavs;
      });

      if (!isFav) {
        await createSocialNotification(postId, post.userId, 'favorite', post.text);
      }
    } catch (err) {
      console.error("Error setting favorites in Firestore:", err);
    }
  };

  const handleStartEditPost = (post: any) => {
    setEditingPostId(post.id);
    setEditingPostText(post.text || '');
    setEditingPostRole(post.role || 'supplier');
    setEditingPostCategory(post.category || 'clothing');
  };

  const handleSaveEditPost = async () => {
    if (!editingPostId || !editingPostText.trim()) return;
    setIsSavingEdit(true);
    try {
      const postRef = doc(db, 'community_posts', editingPostId);
      await updateDoc(postRef, {
        text: editingPostText,
        role: editingPostRole,
        category: editingPostCategory
      });
      alert('Post updated successfully!');
      setEditingPostId(null);
    } catch (err) {
      console.error("Error editing post:", err);
      alert('Failed to update post. Please try again.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeletePost = (postId: string) => {
    // Open custom pop-up dialog
    setDeleteConfirmPostId(postId);
  };

  const handleConfirmDeletePost = async () => {
    if (!deleteConfirmPostId) return;
    setIsDeletingPost(true);
    try {
      await deleteDoc(doc(db, 'community_posts', deleteConfirmPostId));
      alert('Post deleted successfully!');
      setDeleteConfirmPostId(null);
    } catch (err) {
      console.error("Error deleting post:", err);
      alert('Failed to delete post. Please check permissions.');
    } finally {
      setIsDeletingPost(false);
    }
  };

  const handleSendComment = async (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text || !user) return;

    setCommentLoading(prev => ({ ...prev, [postId]: true }));
    setCommentModerationErrors(prev => ({ ...prev, [postId]: '' }));

    // AI check
    const moderation = await moderateText(text);
    if (moderation.isDirectSelling) {
      setCommentModerationErrors(prev => ({ 
        ...prev, 
        [postId]: moderation.warning || "Sorry, direct product selling or retail advertising is forbidden in comments." 
      }));
      setCommentLoading(prev => ({ ...prev, [postId]: false }));
      return;
    }

    const replyTarget = replyingTo[postId];
    const parentId = replyTarget ? replyTarget.commentId : null;

    try {
      await addDoc(collection(db, 'community_comments'), {
        postId,
        userId: user.uid,
        userName: currentUserProfile?.name || user.email?.split('@')[0] || 'User',
        userProfileImage: currentUserProfile?.profileImage || '',
        text: replyTarget ? `@${replyTarget.userName} ${text}` : text,
        parentId: parentId,
        createdAt: new Date().toISOString()
      });

      // Send social notification to owner of the post
      const post = communityPosts.find(p => p.id === postId);
      if (post) {
        await createSocialNotification(postId, post.userId, 'comment', text);
      }

      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      setReplyingTo(prev => ({ ...prev, [postId]: null }));
    } catch (err) {
      console.error("Error sending comment:", err);
    } finally {
      setCommentLoading(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleSendCollabRequest = async (post: any) => {
    if (!user) return;
    if (post.userId === user.uid) return;
    
    const existingReq = sentRequests.find(r => r.postId === post.id);
    if (existingReq) return;

    try {
      await addDoc(collection(db, 'collab_requests'), {
        postId: post.id,
        postText: post.text,
        senderId: user.uid,
        senderName: currentUserProfile?.name || user.email?.split('@')[0] || 'User',
        senderImage: currentUserProfile?.profileImage || '',
        senderPhone: currentUserProfile?.phone || '',
        receiverId: post.userId,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      alert('Collaboration request sent successfully!');
    } catch (err) {
      console.error("Error sending collab request:", err);
      alert('Failed to send request.');
    }
  };

  const handleSendDirectRequest = async (targetUser: any) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'collab_requests'), {
        postId: 'direct',
        postText: 'Direct message request from profile',
        senderId: user.uid,
        senderName: currentUserProfile?.name || user.email?.split('@')[0] || 'User',
        senderImage: currentUserProfile?.profileImage || '',
        senderPhone: currentUserProfile?.phone || '',
        receiverId: targetUser.uid,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      // Send a notification to the target user
      await addDoc(collection(db, 'social_notifications'), {
        id: crypto.randomUUID(),
        postId: 'direct',
        postOwnerId: targetUser.uid, // the target user
        triggerUserId: user.uid,
        triggerUserName: currentUserProfile?.name || user.email?.split('@')[0] || 'User',
        triggerUserProfileImage: currentUserProfile?.profileImage || '',
        type: 'collab_request',
        text: 'has sent you a direct message & collaboration request.',
        read: false,
        createdAt: new Date().toISOString()
      });

      alert('Message request sent! The chat button will activate once approved.');
    } catch (err) {
      console.error("Error sending direct request:", err);
      alert('Failed to send request.');
    }
  };

  const handleAcceptCollabRequest = async (req: any) => {
    try {
      await updateDoc(doc(db, 'collab_requests', req.id), {
        status: 'accepted'
      });

      const sortedParticipants = [user!.uid, req.senderId].sort();
      const chatId = sortedParticipants.join('_');
      
      const chatRef = doc(db, 'chats', chatId);
      await setDoc(chatRef, {
        participants: sortedParticipants,
        lastMessage: "Your collaboration request was accepted successfully!",
        lastMessageAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });

      await addDoc(collection(db, `chats/${chatId}/messages`), {
        id: crypto.randomUUID(),
        chatId: chatId,
        senderId: 'system',
        text: `🤝 Collaboration request accepted! Seller (${req.senderName}) and supplier can now chat directly.`,
        type: 'text',
        createdAt: new Date().toISOString()
      });

      // Send notification back to the sender
      await addDoc(collection(db, 'social_notifications'), {
        id: crypto.randomUUID(),
        postId: req.postId || 'direct',
        postOwnerId: req.senderId, // notify the original sender
        triggerUserId: user!.uid,
        triggerUserName: currentUserProfile?.name || user!.email?.split('@')[0] || 'User',
        triggerUserProfileImage: currentUserProfile?.profileImage || '',
        type: 'collab_request_accepted',
        text: 'has accepted your message request.',
        read: false,
        createdAt: new Date().toISOString()
      });

      alert('Request accepted successfully! You can now exchange messages in the inbox.');
      navigate(`/chat/${chatId}`);
    } catch (err) {
      console.error("Error accepting collab request:", err);
      alert('Failed to process collaboration.');
    }
  };

  const handleDeclineCollabRequest = async (req: any) => {
    try {
      await updateDoc(doc(db, 'collab_requests', req.id), {
        status: 'declined'
      });
      alert('Request rejected.');
    } catch (err) {
      console.error("Error declining collab request:", err);
    }
  };

  const handleViewCatalog = async (posterId: string, posterName: string) => {
    setViewingCatalogUserId(posterId);
    setViewingCatalogUserName(posterName);
    setCatalogPage(1);
    setLoadingCatalog(true);
    setViewingCatalogItems([]);
    setViewingCatalogUserDoc(null);
    setIsViewingCatalogLocked(false);
    try {
      // Fetch vendor details with in-memory caching
      const uData = await getCachedDoc('users', posterId);
      if (uData) {
        setViewingCatalogUserDoc(uData);
      }

      // Check catalog subscription status with in-memory caching
      const subData = await getCachedDoc('catalog_subscriptions', posterId);
      let isLocked = false;
      if (subData) {
        if (subData.paymentStatus === 'approved') {
          isLocked = false;
        } else if (subData.paymentStatus === 'trial') {
          const trialExpires = subData.trialExpiresAt ? new Date(subData.trialExpiresAt) : null;
          if (trialExpires && trialExpires < new Date()) {
            isLocked = true;
          } else {
            isLocked = false;
          }
        } else {
          isLocked = true;
        }
      } else {
        isLocked = false;
      }
      setIsViewingCatalogLocked(isLocked);

      const qCatalog = query(collection(db, 'inventory'), where('userId', '==', posterId));
      const snap = await getDocs(qCatalog);
      const items = snap.docs.map(d => {
        const docData = d.data();
        return {
          id: d.id,
          ...docData,
          buyPrice: Number(docData.sellPrice || docData.price || 0),
          landingPrice: 0,
          proPrice: 0
        } as InventoryItem;
      });
      setViewingCatalogItems(items);
    } catch (err) {
      console.error("Error fetching user catalog:", err);
    } finally {
      setLoadingCatalog(false);
    }
  };

  const handleOpenProfileModalFromCatalog = async () => {
    if (!viewingCatalogUserId) return;
    
    let imgUrl: string | null = viewingCatalogUserDoc?.profileImage || viewingCatalogUserDoc?.picture || null;
    let userName = viewingCatalogUserDoc?.name || viewingCatalogUserDoc?.businessName || viewingCatalogUserName || 'User';
    
    if (!viewingCatalogUserDoc) {
      try {
        const uData = await getCachedDoc('users', viewingCatalogUserId);
        if (uData) {
          imgUrl = uData.profileImage || uData.picture || null;
          userName = uData.name || uData.businessName || userName;
        }
      } catch (err) {
        console.error("Error fetching user profile for modal from catalog:", err);
      }
    }
    
    setSelectedUserForProfileModal({
      uid: viewingCatalogUserId,
      name: userName,
      profileImage: imgUrl
    });
  };

  const handleSyncProduct = async (item: InventoryItem, selectedCategory: string) => {
    if (!user) return;
    setSyncingItemId(item.id);
    try {
      const { id, ...dataToSave } = item;
      
      await addDoc(collection(db, 'inventory'), {
        ...dataToSave,
        userId: user.uid,
        name: `${item.name} (Synced)`,
        category: selectedCategory || '',
        buyPrice: Number(item.sellPrice) || 0, // Supplier's sellPrice becomes Seller's buyPrice
        sellPrice: 0, // Seller's sellPrice is empty/0 initially
        landingPrice: 0,
        proPrice: 0,
        supplierId: viewingCatalogUserId || '',
        supplierName: viewingCatalogUserName || '',
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
      alert('Product added to your inventory successfully! Your wholesale purchase price is set to ৳' + (item.sellPrice || 0));
    } catch (err) {
      console.error("Sync error:", err);
      alert('Failed to sync product.');
    } finally {
      setSyncingItemId(null);
    }
  };

  return (
    <PageContainer 
      title={activeMainTab === 'social' ? undefined : "MESSAGES"} 
      rightAction={
        activeMainTab === 'social' ? null : (
          <div className="flex items-center gap-2">
            {/* Call Log History Vector Icon Button */}
            <button 
              type="button"
              onClick={() => setActiveMainTab(activeMainTab === 'call_logs' ? 'inbox' : 'call_logs')} 
              className={cn(
                "p-2.5 rounded-xl transition-all flex items-center justify-center cursor-pointer relative shadow-lg border",
                activeMainTab === 'call_logs'
                  ? "bg-dragon-cyan text-dragon-black border-dragon-cyan font-bold"
                  : "bg-dragon-cyan/10 hover:bg-dragon-cyan/25 border-dragon-cyan/30 text-dragon-cyan hover:text-white"
              )}
              title="Call Log History / কল ইতিহাস"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.25 2.52.77-1.28-3.52-2.09V8z"/>
              </svg>
            </button>

            <button 
              type="button"
              onClick={() => setActiveMainTab('outgoing_withdrawals')} 
              className="p-2.5 bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/30 rounded-xl text-amber-500 hover:text-white transition-all flex items-center justify-center cursor-pointer relative shadow-lg"
              title="Outgoing Withdrawals"
            >
              <ArrowUpRight size={20} />
              {outgoingWithdrawMessages.filter(msg => msg.paymentData?.status !== 'paid').length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[#df3d3d] border border-black rounded-full flex items-center justify-center text-[9px] font-black text-white px-1 font-mono">
                  {outgoingWithdrawMessages.filter(msg => msg.paymentData?.status !== 'paid').length}
                </span>
              )}
            </button>

            <button 
              type="button"
              onClick={() => setActiveMainTab('incoming_withdrawals')} 
              className="p-2.5 bg-dragon-emerald/10 hover:bg-dragon-emerald/25 border border-dragon-emerald/30 rounded-xl text-dragon-emerald hover:text-white transition-all flex items-center justify-center cursor-pointer relative shadow-lg"
              title="Incoming Withdrawals"
            >
              <ArrowDownLeft size={20} />
              {withdrawMessages.filter(msg => msg.paymentData?.status !== 'paid').length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[#df3d3d] border border-black rounded-full flex items-center justify-center text-[9px] font-black text-white px-1 font-mono">
                  {withdrawMessages.filter(msg => msg.paymentData?.status !== 'paid').length}
                </span>
              )}
            </button>
          </div>
        )
      }
    >
      <div className="space-y-4">
        {/* AI Magic Drawer (Product description content generator) */}
        <MagicDrawerModal
          showMagicDrawer={showMagicDrawer}
          setShowMagicDrawer={setShowMagicDrawer}
          magicResult={magicResult}
          setMagicResult={setMagicResult}
          magicLoading={magicLoading}
          magicImage={magicImage}
          setMagicImage={setMagicImage}
          handleResetMagic={handleResetMagic}
          handleMagicFile={handleMagicFile}
          handleGenerateMagicContent={handleGenerateMagicContent}
          setLastMagicAction={setLastMagicAction}
        />

        {/* Tab Switcher - Only shown when NOT in Social Feed mode */}
        {activeMainTab !== 'social' && (
          <div className="flex flex-wrap md:flex-nowrap gap-1.5 md:gap-2 p-1.5 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl shrink-0">
            <button
              onClick={() => setActiveMainTab('inbox')}
              className={cn(
                "flex-1 min-w-[70px] py-2.5 text-[10px] md:text-xs font-black uppercase tracking-wider rounded-lg md:rounded-xl transition-all flex items-center justify-center gap-1.5",
                activeMainTab === 'inbox' ? "bg-dragon-cyan text-dragon-black shadow-lg" : "text-gray-400 hover:text-white"
              )}
            >
              <MessageCircle size={14} />
              Inbox ({mappedChats.length})
            </button>

            <button
              onClick={() => setActiveMainTab('site_messenger')}
              className={cn(
                "flex-1 min-w-[100px] py-2.5 text-[10px] md:text-xs font-black uppercase tracking-wider rounded-lg md:rounded-xl transition-all flex items-center justify-center gap-1.5",
                activeMainTab === 'site_messenger' ? "bg-dragon-cyan text-dragon-black shadow-lg" : "text-gray-400 hover:text-white"
              )}
            >
              <Zap size={14} className={cn(activeMainTab === 'site_messenger' && "animate-pulse")} />
              Site Messenger ({siteChats.length})
            </button>
            
            <button
              onClick={() => setActiveMainTab('social')}
              className={cn(
                "flex-1 min-w-[70px] py-2.5 text-[10px] md:text-xs font-black uppercase tracking-wider rounded-lg md:rounded-xl transition-all flex items-center justify-center gap-1.5",
                (activeMainTab as string) === 'social' ? "bg-dragon-cyan text-dragon-black shadow-lg" : "text-gray-400 hover:text-white"
              )}
            >
              <Users size={14} />
              Social Feed
            </button>
          </div>
        )}

        {activeMainTab === 'inbox' ? (
          /* STANDARD CHAT INBOX VIEW */
          <div className="space-y-4">
            <div className="space-y-2">
              <form onSubmit={handleSearch} className="relative group flex gap-2">
                <div className="relative flex-1 group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-dragon-cyan transition-colors" size={16} />
                  <input
                    type="text"
                    placeholder="Search name, or enter friend's phone to request..."
                    value={searchQuery}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSearchQuery(val);
                      if (!val) {
                        setSearchResults([]);
                        setSearchAttempted(false);
                      }
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 outline-none focus:border-dragon-cyan/50 focus:bg-white/10 transition-all font-light text-[11px]"
                  />
                </div>
                {searchQuery && (
                  <button
                    type="submit"
                    className="bg-dragon-cyan hover:bg-dragon-cyan/80 text-dragon-black font-black text-[9px] uppercase tracking-wider px-3 py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer"
                  >
                    Search Phone
                  </button>
                )}
              </form>
            </div>

            {searchResults.length > 0 ? (
              <div className="space-y-4 p-3 bg-white/5 rounded-2xl border border-white/5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-dragon-cyan flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-dragon-cyan animate-ping" />
                  Search Results
                </h3>
                {searchResults.map((result, idx) => {
                  const rtProfile = profilesCache[result.uid] || result;
                  const isOnline = isUserOnline(rtProfile);
                  return (
                    <UserRow 
                      key={`search-${result.uid}-${idx}`} 
                      user={rtProfile} 
                      isOnline={isOnline}
                      onClick={() => {
                        setSelectedUserForProfileModal({
                          uid: rtProfile.uid,
                          name: rtProfile.name || rtProfile.storeName || 'User',
                          profileImage: rtProfile.profileImage || null
                        });
                      }} 
                      actionIcon={
                        <div className="flex items-center gap-1 bg-dragon-cyan/10 hover:bg-dragon-cyan text-dragon-cyan hover:text-dragon-black px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all">
                          <span>View Profile</span>
                        </div>
                      } 
                    />
                  );
                })}
              </div>
            ) : (
              searchAttempted && searchQuery && (
                <div className="p-4 text-center bg-white/5 border border-white/5 rounded-2xl">
                  <p className="text-[11px] text-gray-400">
                    No users found with phone: <span className="text-dragon-cyan font-mono">{searchQuery}</span>
                  </p>
                  <p className="text-[9px] text-gray-600 mt-1">Make sure the number is exact and matches your friend's profile.</p>
                </div>
              )
            )}

            <div className="space-y-px">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 px-2">Recent Threads</h3>
              {loading ? (
                <div className="py-20 flex justify-center">
                  <div className="w-8 h-8 border-2 border-dragon-cyan border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : mappedChats.filter(c => {
                  const otherId = c.participants?.find((p: string) => p !== user?.uid);
                  const isMutual = otherId && 
                    followingList.some(f => f.followingId === otherId) && 
                    followersList.some(f => f.followerId === otherId);
                  if (!isMutual) return false;

                  const nameMatch = c.otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    c.otherUser?.storeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    c.otherUser?.businessName?.toLowerCase().includes(searchQuery.toLowerCase());
                  const phoneMatch = c.otherUser?.phone?.includes(searchQuery);
                  return nameMatch || phoneMatch;
                }).length === 0 ? (
                <div className="py-20 text-center glass-card border-dashed">
                  <MessageCircle size={48} className="mx-auto text-gray-700 mb-4" />
                  <p className="text-gray-500">No active mutual follow connections.</p>
                </div>
              ) : (
                mappedChats
                  .filter(c => {
                    const otherId = c.participants?.find((p: string) => p !== user?.uid);
                    const isMutual = otherId && 
                      followingList.some(f => f.followingId === otherId) && 
                      followersList.some(f => f.followerId === otherId);
                    if (!isMutual) return false;

                    const nameMatch = c.otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                      c.otherUser?.storeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                      c.otherUser?.businessName?.toLowerCase().includes(searchQuery.toLowerCase());
                    const phoneMatch = c.otherUser?.phone?.includes(searchQuery);
                    return nameMatch || phoneMatch;
                  })
                  .map((chat, idx) => {
                    const isOnline = isUserOnline(chat.otherUser);
                    return (
                      <ChatRow 
                        key={`chat-${chat.id || ''}-${idx}`} 
                        chat={chat} 
                        isOnline={isOnline}
                        onClick={() => navigate(`/chat/${chat.id}`, { state: { otherUser: chat.otherUser } })} 
                      />
                    );
                  })
              )}
            </div>
          </div>
        ) : activeMainTab === 'outgoing_withdrawals' ? (
          /* OUTGOING WITHDRAWALS PAGE */
          <div className="space-y-6 pb-24 font-display">
            {/* Header */}
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <h3 className="text-sm sm:text-base font-black text-dragon-cyan uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 bg-dragon-cyan rounded-full shrink-0 animate-pulse" />
                Outgoing Withdrawals Report
              </h3>
            </div>

            {/* Statistics Panel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              <div className="bg-gradient-to-br from-dragon-cyan/10 to-indigo-500/5 p-4 rounded-2xl border border-dragon-cyan/15">
                <div className="text-[9px] font-black text-dragon-cyan uppercase tracking-widest mb-1.5">Total Requested Amount</div>
                <div className="text-xl font-black text-white leading-none">
                  ৳{outgoingWithdrawStats.totalAmount.toLocaleString()}
                </div>
              </div>

              <div className="bg-gradient-to-br from-dragon-emerald/10 to-indigo-500/5 p-4 rounded-2xl border border-dragon-emerald/15">
                <div className="text-[9px] font-black text-dragon-emerald uppercase tracking-widest mb-1.5">Recipient Count</div>
                <div className="text-xl font-black text-white leading-none">
                  {outgoingWithdrawStats.totalRecipients} Recipient(s)
                </div>
              </div>

              <div className="bg-[#0f101d] p-4 rounded-2xl border border-white/5 sm:col-span-2 md:col-span-1">
                <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Total Application Count</div>
                <div className="text-xl font-black text-white leading-none">
                  {outgoingWithdrawStats.totalCount} Request(s)
                </div>
              </div>
            </div>

            {/* Listing Table */}
            <div className="bg-[#08090d] border border-white/10 rounded-3xl p-5 sm:p-6 overflow-hidden">
              <div className="overflow-x-auto min-h-[300px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[9px] font-black text-gray-400 uppercase tracking-widest bg-white/[0.01]">
                      <th className="py-2.5 px-3">View Chat</th>
                      <th className="py-2.5 px-3">Date & Time</th>
                      <th className="py-2.5 px-3">Recipient Name</th>
                      <th className="py-2.5 px-3">Account Details / Method</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {outgoingWithdrawMessages.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-16 text-xs text-gray-500 font-bold uppercase tracking-wider">
                          No withdrawal requests sent.
                        </td>
                      </tr>
                    ) : (
                      outgoingWithdrawMessages.map((w, idx) => {
                        // Find recipient info (other participant in this chat)
                        const chatThread = chats.find(c => c.id === w.chatId) || siteChats.find(c => c.id === w.chatId);
                        const otherId = chatThread?.participants?.find((p: string) => p !== user?.uid);
                        const userProfile = otherId ? usersMap[otherId] : null;
                        const displayName = userProfile?.name || userProfile?.businessName || 'Unknown Recipient';
                        const isPaid = w.paymentData?.status === 'paid';

                        return (
                          <React.Fragment key={`outgoing-withdrawal-${w.id || idx}-${idx}`}>
                            <tr className="hover:bg-white/[0.015] transition-colors text-xs border-b border-white/[0.02]">
                              {/* View Chat Column */}
                              <td className="py-3 px-3 w-28">
                                <button
                                  type="button"
                                  onClick={() => navigate(`/chat/${w.chatId}`, { state: { otherUser: userProfile } })}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-dragon-cyan/10 hover:bg-dragon-cyan text-dragon-cyan hover:text-dragon-black border border-dragon-cyan/20 hover:border-dragon-cyan rounded-xl text-[9px] font-extrabold uppercase transition-all duration-150 cursor-pointer shadow-sm whitespace-nowrap"
                                >
                                  <MessageSquare size={10} /> View Chat
                                </button>
                              </td>

                              {/* Time Column */}
                              <td className="py-3 px-3 whitespace-nowrap font-mono text-gray-400">
                                {formatBanglaDate(w.createdAt)}
                              </td>

                              {/* Recipient Name Column */}
                              <td className="py-3 px-3">
                                <div className="font-bold text-white tracking-wide">
                                  {displayName}
                                </div>
                                {otherId && (
                                  <div className="text-[8.5px] text-gray-500 font-mono tracking-wider">ID: {otherId.substring(0, 8)}...</div>
                                )}
                              </td>

                              {/* Account Details Column */}
                              <td className="py-3 px-3 text-gray-300">
                                <div className="font-black text-white font-display text-[10px] uppercase">
                                  {w.paymentData?.bankName || 'bKash'}
                                </div>
                                <div className="text-[10px] font-mono text-dragon-cyan font-bold leading-relaxed">{w.paymentData?.accountNumber || '---'}</div>
                                {w.paymentData?.accountName && (
                                  <div className="text-[9px] text-gray-500 italic mt-0.5">({w.paymentData.accountName})</div>
                                )}
                              </td>

                              {/* Amount Column */}
                              <td className="py-3 px-3 text-right font-black text-white font-mono whitespace-nowrap text-sm">
                                ৳{Number(w.paymentData?.amount || 0).toLocaleString()}
                              </td>

                              {/* Status Column */}
                              <td className="py-3 px-3 text-center">
                                <div className="flex flex-col items-center justify-center gap-1.5">
                                  {isPaid ? (
                                    <div className="flex flex-col items-center gap-1">
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-dragon-emerald/10 text-dragon-emerald rounded-full text-[9px] font-black uppercase tracking-wider border border-dragon-emerald/20">
                                        <CheckCircle size={10} /> Approved
                                      </span>
                                      {w.paymentData?.trxId && (
                                        <span className="text-[8.5px] font-mono text-gray-500 mt-0.5">
                                          TRX: <strong className="text-dragon-emerald">{w.paymentData.trxId}</strong>
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center gap-1">
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-500/10 text-amber-500 rounded-full text-[9px] font-black uppercase tracking-wider border border-amber-500/20">
                                        <Clock size={10} /> Pending
                                      </span>
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          if (confirm(`Are you sure you want to cancel and delete this pending withdrawal request of ৳${w.paymentData?.amount || 0}?`)) {
                                            try {
                                              await updateDoc(doc(db, `chats/${w.chatId}/messages`, w.id), {
                                                type: 'deleted',
                                                text: 'Withdrawal request cancelled',
                                                updatedAt: new Date().toISOString()
                                              });
                                              alert('Pending withdrawal request cancelled successfully.');
                                            } catch (err) {
                                              console.error('Failed to cancel request:', err);
                                              alert('Failed to cancel request.');
                                            }
                                          }
                                        }}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 hover:border-red-500 rounded-lg text-[8.5px] font-extrabold uppercase transition-all cursor-pointer mt-0.5"
                                        title="Cancel Pending Request"
                                      >
                                        <Trash2 size={9} /> Cancel Request
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : activeMainTab === 'incoming_withdrawals' ? (
          /* INCOMING WITHDRAWALS PAGE */
          <div className="space-y-6 pb-24 font-display">
            {/* Header */}
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <h3 className="text-sm sm:text-base font-black text-dragon-cyan uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 bg-dragon-cyan rounded-full shrink-0 animate-pulse" />
                Incoming Withdrawals Report
              </h3>
            </div>

            {/* Statistics Panel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              <div className="bg-gradient-to-br from-dragon-cyan/10 to-indigo-500/5 p-4 rounded-2xl border border-dragon-cyan/15">
                <div className="text-[9px] font-black text-dragon-cyan uppercase tracking-widest mb-1.5">Total Requested Amount</div>
                <div className="text-xl font-black text-white leading-none">
                  ৳{withdrawStats.totalAmount.toLocaleString()}
                </div>
              </div>

              <div className="bg-gradient-to-br from-dragon-emerald/10 to-indigo-500/5 p-4 rounded-2xl border border-dragon-emerald/15">
                <div className="text-[9px] font-black text-dragon-emerald uppercase tracking-widest mb-1.5">Applicant Count</div>
                <div className="text-xl font-black text-white leading-none">
                  {withdrawStats.totalApplicants} Applicant(s)
                </div>
              </div>

              <div className="bg-[#0f101d] p-4 rounded-2xl border border-white/5 sm:col-span-2 md:col-span-1">
                <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Total Request Count</div>
                <div className="text-xl font-black text-white leading-none">
                  {withdrawStats.totalCount} Request(s)
                </div>
              </div>
            </div>

            {/* Listing Table */}
            <div className="bg-[#08090d] border border-white/10 rounded-3xl p-5 sm:p-6 overflow-hidden">
              <div className="overflow-x-auto min-h-[300px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[9px] font-black text-gray-400 uppercase tracking-widest bg-white/[0.01]">
                      <th className="py-2.5 px-3">View Chat</th>
                      <th className="py-2.5 px-3">Date & Time</th>
                      <th className="py-2.5 px-3">Applicant Name</th>
                      <th className="py-2.5 px-3">Account Details / Method</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3 text-center">Status / Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {withdrawMessages.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-16 text-xs text-gray-500 font-bold uppercase tracking-wider">
                          No incoming withdrawal requests found.
                        </td>
                      </tr>
                    ) : (
                      withdrawMessages.map((w, idx) => {
                        const userProfile = usersMap[w.senderId];
                        const displayName = userProfile?.name || userProfile?.businessName || 'Unknown User';
                        const isPaid = w.paymentData?.status === 'paid';

                        return (
                          <React.Fragment key={`incoming-withdrawal-${w.id || idx}-${idx}`}>
                            <tr className="hover:bg-white/[0.015] transition-colors text-xs border-b border-white/[0.02]">
                              {/* View Chat Column */}
                              <td className="py-3 px-3 w-28">
                                <button
                                  type="button"
                                  onClick={() => navigate(`/chat/${w.chatId}`, { state: { otherUser: userProfile } })}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-dragon-cyan/10 hover:bg-dragon-cyan text-dragon-cyan hover:text-dragon-black border border-dragon-cyan/20 hover:border-dragon-cyan rounded-xl text-[9px] font-extrabold uppercase transition-all duration-150 cursor-pointer shadow-sm whitespace-nowrap"
                                >
                                  <MessageSquare size={10} /> View Chat
                                </button>
                              </td>

                              {/* Time Column */}
                              <td className="py-3 px-3 whitespace-nowrap font-mono text-gray-400">
                                {formatBanglaDate(w.createdAt)}
                              </td>

                              {/* User Name Column */}
                              <td className="py-3 px-3">
                                <div className="font-bold text-white tracking-wide">
                                  {displayName}
                                </div>
                                <div className="text-[8.5px] text-gray-500 font-mono tracking-wider">ID: {w.senderId?.substring(0, 8)}...</div>
                              </td>

                              {/* Account Details Column */}
                              <td className="py-3 px-3 text-gray-300">
                                <div className="font-black text-white font-display text-[10px] uppercase">
                                  {w.paymentData?.bankName || 'bKash'}
                                </div>
                                <div className="text-[10px] font-mono text-dragon-cyan font-bold leading-relaxed">{w.paymentData?.accountNumber || '---'}</div>
                                {w.paymentData?.accountName && (
                                  <div className="text-[9px] text-gray-500 italic mt-0.5">({w.paymentData.accountName})</div>
                                )}
                              </td>

                              {/* Amount Column */}
                              <td className="py-3 px-3 text-right font-black text-white font-mono whitespace-nowrap text-sm">
                                ৳{Number(w.paymentData?.amount || 0).toLocaleString()}
                              </td>

                              {/* Status / Approve Button Column */}
                              <td className="py-3 px-3 text-center">
                                <div className="flex flex-col items-center justify-center gap-1.5">
                                  {isPaid ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-dragon-emerald/10 text-dragon-emerald rounded-full text-[9px] font-black uppercase tracking-wider border border-dragon-emerald/20">
                                      <CheckCircle size={10} /> Success
                                    </span>
                                  ) : (
                                    <div className="flex flex-col items-center gap-1.5">
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-500/10 text-amber-500 rounded-full text-[9px] font-black uppercase tracking-wider border border-amber-500/20">
                                        <Clock size={10} /> Pending
                                      </span>
                                      {approvingMsgId !== w.id && (
                                        <button 
                                          type="button"
                                          onClick={() => {
                                            setApprovingMsgId(w.id || null);
                                            setTrxIdInput('');
                                          }}
                                          className="px-2 py-1 bg-dragon-emerald/10 hover:bg-dragon-emerald hover:text-dragon-black text-[9px] font-black uppercase rounded-lg border border-dragon-emerald/20 transition-all cursor-pointer whitespace-nowrap animate-pulse"
                                        >
                                          Approve
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>

                            {/* Approve Trx ID panel row */}
                            {approvingMsgId === w.id && (
                              <tr className="bg-dragon-emerald/5 border-l-2 border-dragon-emerald">
                                <td colSpan={6} className="p-3">
                                  <div className="flex flex-col sm:flex-row items-center gap-3 justify-between bg-black/60 p-3 rounded-xl border border-dragon-emerald/25">
                                    <div className="text-[10px] text-dragon-emerald font-black uppercase tracking-wider flex items-center gap-1.5">
                                      <AlertCircle size={12} className="animate-bounce shrink-0" /> Approve Withdrawal Request
                                    </div>
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                      <input 
                                        type="text"
                                        placeholder="Enter Transaction ID (TRX ID)"
                                        value={trxIdInput}
                                        onChange={(e) => setTrxIdInput(e.target.value)}
                                        className="bg-black border border-white/10 rounded-lg py-1.5 px-3 text-xs outline-none text-white w-full sm:w-52 placeholder-gray-600 focus:border-dragon-emerald/50 font-mono"
                                      />
                                      <button 
                                        type="button"
                                        onClick={() => handleApprovePayment(w.chatId, w.id)}
                                        className="px-4 py-2 bg-dragon-emerald text-dragon-black font-black text-[10px] uppercase rounded-lg shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap font-display text-xs"
                                      >
                                        Confirm
                                      </button>
                                      <button 
                                        type="button"
                                        onClick={() => setApprovingMsgId(null)}
                                        className="px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-400 font-bold text-[10px] uppercase rounded-lg border border-white/10 cursor-pointer whitespace-nowrap"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}

                            {/* TRX ID info row if approved */}
                            {isPaid && w.paymentData?.trxId && (
                              <tr className="bg-white/[0.003]">
                                <td colSpan={6} className="py-1 px-4 text-[9.5px] font-mono text-gray-500 text-left border-b border-white/[0.01]">
                                  <span className="text-gray-400 uppercase font-black tracking-wider text-[8px] mr-2">TRX ID:</span> 
                                  <span className="text-dragon-emerald">{w.paymentData.trxId}</span>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : activeMainTab === 'call_logs' ? (
          /* CALL LOG HISTORY REPORT PAGE VIEW */
          <CallLogView
            currentUser={user || { uid: '' }}
            chats={[...chats, ...siteChats]}
            profilesCache={profilesCache}
            isPageMode={true}
            onInitiateCall={(type, targetUser) => {
              if (targetUser) {
                navigate(`/chat/${targetUser.uid}?call=${type}`);
              }
            }}
            onBack={() => setActiveMainTab('inbox')}
          />
        ) : activeMainTab === 'site_messenger' ? (
          <SiteMessengerTab
            user={user}
            db={db}
            currentUserProfile={currentUserProfile}
            activeMainTab={activeMainTab}
            siteChats={siteChats}
            onSiteChatsChange={setSiteChats}
          />
        ) : (
          <SocialFeed
            onBackToInbox={() => setActiveMainTab('inbox')}
            user={user}
            db={db}
            navigate={navigate}
            location={location}
            followersList={followersList}
            setShowFollowersModal={setShowFollowersModal}
            setShowFollowingModal={setShowFollowingModal}
            inspectedFollowingCount={inspectedFollowingCount}
            inspectedFollowersCount={inspectedFollowersCount}
            communityPosts={communityPosts}
            profilesCache={profilesCache}
            currentUserProfile={currentUserProfile}
            receivedRequests={receivedRequests}
            sentRequests={sentRequests}
            newPostText={newPostText}
            setNewPostText={setNewPostText}
            newPostRole={newPostRole}
            setNewPostRole={setNewPostRole}
            setNewPostCategory={setNewPostCategory}
            newPostCategory={newPostCategory}
            setIsCategoryDropdownOpen={setIsCategoryDropdownOpen}
            isCategoryDropdownOpen={isCategoryDropdownOpen}
            setNewPostImage={setNewPostImage}
            newPostImage={newPostImage}
            setNewPostBgTheme={setNewPostBgTheme}
            newPostBgTheme={newPostBgTheme}
            newPostTextColor={newPostTextColor}
            setNewPostTextColor={setNewPostTextColor}
            isPosting={isPosting}
            setModerationWarning={setModerationWarning}
            moderationWarning={moderationWarning}
            socialFilterRole={socialFilterRole}
            setSocialFilterRole={setSocialFilterRole}
            socialFilterCategory={socialFilterCategory}
            setSocialFilterCategory={setSocialFilterCategory}
            favoritePostIds={favoritePostIds}
            setFavoritePostIds={setFavoritePostIds}
            favoritedIdsOnEnterTab={favoritedIdsOnEnterTab}
            socialSubTab={socialSubTab}
            setSocialSubTab={setSocialSubTab}
            setSocialSearchQuery={setSocialSearchQuery}
            socialSearchQuery={socialSearchQuery}
            setSettingsFilterRole={setSettingsFilterRole}
            settingsFilterRole={settingsFilterRole}
            settingsFilterCategories={settingsFilterCategories}
            setSettingsFilterCategories={setSettingsFilterCategories}
            settingsSavedSuccess={settingsSavedSuccess}
            setSettingsSavedSuccess={setSettingsSavedSuccess}
            setEditingPostId={setEditingPostId}
            editingPostId={editingPostId}
            editingPostText={editingPostText}
            setEditingPostText={setEditingPostText}
            editingPostRole={editingPostRole}
            setEditingPostRole={setEditingPostRole}
            editingPostCategory={editingPostCategory}
            setEditingPostCategory={setEditingPostCategory}
            isSavingEdit={isSavingEdit}
            socialNotifications={socialNotifications}
            setFocusedPostId={setFocusedPostId}
            focusedPostId={focusedPostId}
            highlightedUserId={highlightedUserId}
            setHighlightedUserId={setHighlightedUserId}
            activePostComments={activePostComments}
            setCommentInputs={setCommentInputs}
            commentInputs={commentInputs}
            commentModerationErrors={commentModerationErrors}
            setCommentModerationErrors={setCommentModerationErrors}
            commentLoading={commentLoading}
            setExpandedComments={setExpandedComments}
            expandedComments={expandedComments}
            setReplyingTo={setReplyingTo}
            replyingTo={replyingTo}
            viewingCatalogUserId={viewingCatalogUserId}
            setViewingCatalogUserId={setViewingCatalogUserId}
            viewingCatalogUserName={viewingCatalogUserName}
            setViewingCatalogUserName={setViewingCatalogUserName}
            viewingCatalogItems={viewingCatalogItems}
            setViewingCatalogItems={setViewingCatalogItems}
            isViewingCatalogLocked={isViewingCatalogLocked}
            viewingCatalogUserDoc={viewingCatalogUserDoc}
            loadingCatalog={loadingCatalog}
            catalogPage={catalogPage}
            setCatalogPage={setCatalogPage}
            merchantCategories={merchantCategories}
            setProductToSync={setProductToSync}
            productToSync={productToSync}
            setShowSyncCategoryModal={setShowSyncCategoryModal}
            showSyncCategoryModal={showSyncCategoryModal}
            setSyncSelectedCategory={setSyncSelectedCategory}
            syncSelectedCategory={syncSelectedCategory}
            setSelectedUserForProfileModal={setSelectedUserForProfileModal}
            selectedUserForProfileModal={selectedUserForProfileModal}
            selectedUserProfileData={selectedUserProfileData}
            handleFollowToggle={handleFollowToggle}
            handleCreatePost={handleCreatePost}
            handleToggleLike={handleToggleLike}
            handleToggleFavorite={handleToggleFavorite}
            handleStartEditPost={handleStartEditPost}
            handleSaveEditPost={handleSaveEditPost}
            handleDeletePost={handleDeletePost}
            handleSendComment={handleSendComment}
            handleSendCollabRequest={handleSendCollabRequest}
            handleAcceptCollabRequest={handleAcceptCollabRequest}
            handleDeclineCollabRequest={handleDeclineCollabRequest}
            handleOpenProfileModalFromCatalog={handleOpenProfileModalFromCatalog}
            handleSyncProduct={handleSyncProduct}
            handleViewCatalog={handleViewCatalog}
            followingList={followingList}
            setFollowingList={setFollowingList}
            setFollowersList={setFollowersList}
          />
        )}

      {/* DELETE POST CONFIRMATION POPUP MODAL */}
      <DeleteConfirmModal
        deleteConfirmPostId={deleteConfirmPostId}
        isDeletingPost={isDeletingPost}
        onClose={() => setDeleteConfirmPostId(null)}
        onConfirm={handleConfirmDeletePost}
      />

      {/* MY FOLLOWERS MODAL (TIKTOK STYLE) */}
      <FollowersModal
        showFollowersModal={showFollowersModal}
        followersList={followersList}
        followingList={followingList}
        onClose={() => setShowFollowersModal(false)}
        onSelectUser={(follower) =>
          setSelectedUserForProfileModal({
            uid: follower.followerId,
            name: follower.followerName,
            profileImage: follower.followerImage || null,
          })
        }
        onFollowToggle={handleFollowToggle}
      />

      {/* MY FOLLOWING MODAL (TIKTOK STYLE) */}
      <FollowingModal
        showFollowingModal={showFollowingModal}
        followingList={followingList}
        onClose={() => setShowFollowingModal(false)}
        onSelectUser={(following) =>
          setSelectedUserForProfileModal({
            uid: following.followingId,
            name: following.followingName,
            profileImage: following.followingImage || null,
          })
        }
        onFollowToggle={handleFollowToggle}
      />

      </div>

      <CallMuteModal 
        isOpen={isMuteModalOpen}
        onClose={() => setIsMuteModalOpen(false)}
        targetUser={selectedMuteUser}
        currentUserUid={user?.uid || ''}
      />

      <CallLogModal 
        isOpen={showCallLogModal}
        onClose={() => setShowCallLogModal(false)}
        currentUser={user || { uid: '' }}
        chats={[...chats, ...siteChats]}
        profilesCache={profilesCache}
        onInitiateCall={(type, targetUser) => {
          setShowCallLogModal(false);
          if (targetUser) {
            navigate(`/chat/${targetUser.uid}?call=${type}`);
          }
        }}
      />
    </PageContainer>
  );
}
