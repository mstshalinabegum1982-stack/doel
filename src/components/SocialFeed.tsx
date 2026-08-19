import React, { useState } from 'react';
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
import { formatDate, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PRODUCT_CATEGORIES,
  POST_BACKGROUND_THEMES,
  POST_TEXT_COLORS,
  PostThemeVectorOverlay,
  renderTextWithHashtags,
  ExpandablePostText
} from './social/PostThemeUtils';
import { PostCard } from './social/PostCard';
import { CreatePostModal } from './social/CreatePostModal';
import { UserProfileModal } from './social/UserProfileModal';
import { SyncCategoryModal } from './social/SyncCategoryModal';

export {
  PRODUCT_CATEGORIES,
  POST_BACKGROUND_THEMES,
  POST_TEXT_COLORS,
  PostThemeVectorOverlay,
  renderTextWithHashtags,
  ExpandablePostText
};

export interface SocialFeedProps {
  onBackToInbox?: () => void;
  user: any;
  db: any;
  navigate: any;
  location: any;
  followersList: any[];
  setShowFollowersModal: React.Dispatch<React.SetStateAction<boolean>>;
  setShowFollowingModal: React.Dispatch<React.SetStateAction<boolean>>;
  inspectedFollowingCount: number;
  inspectedFollowersCount: number;
  communityPosts: any[];
  profilesCache: Record<string, any>;
  currentUserProfile: any;
  receivedRequests: any[];
  sentRequests: any[];
  newPostText: string;
  setNewPostText: React.Dispatch<React.SetStateAction<string>>;
  newPostRole: 'supplier' | 'seller';
  setNewPostRole: React.Dispatch<React.SetStateAction<'supplier' | 'seller'>>;
  setNewPostCategory: React.Dispatch<React.SetStateAction<string>>;
  newPostCategory: string;
  setIsCategoryDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isCategoryDropdownOpen: boolean;
  setNewPostImage: React.Dispatch<React.SetStateAction<string | null>>;
  newPostImage: string | null;
  setNewPostBgTheme: React.Dispatch<React.SetStateAction<string>>;
  newPostThemeId?: string;
  newPostBgTheme: string;
  newPostTextColor: string;
  setNewPostTextColor: React.Dispatch<React.SetStateAction<string>>;
  isPosting: boolean;
  setModerationWarning: React.Dispatch<React.SetStateAction<string | null>>;
  moderationWarning: string | null;
  socialFilterRole: 'all' | 'supplier' | 'seller';
  setSocialFilterRole: React.Dispatch<React.SetStateAction<'all' | 'supplier' | 'seller'>>;
  socialFilterCategory: 'all' | string;
  setSocialFilterCategory: React.Dispatch<React.SetStateAction<'all' | string>>;
  favoritePostIds: string[];
  setFavoritePostIds: React.Dispatch<React.SetStateAction<string[]>>;
  favoritedIdsOnEnterTab: string[];
  socialSubTab: 'home' | 'favorites' | 'my_posts' | 'notifications' | 'settings';
  setSocialSubTab: React.Dispatch<React.SetStateAction<'home' | 'favorites' | 'my_posts' | 'notifications' | 'settings'>>;
  setSocialSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  socialSearchQuery: string;
  setSettingsFilterRole: React.Dispatch<React.SetStateAction<'all' | 'supplier' | 'seller'>>;
  settingsFilterRole: 'all' | 'supplier' | 'seller';
  settingsFilterCategories: string[];
  setSettingsFilterCategories: React.Dispatch<React.SetStateAction<string[]>>;
  settingsSavedSuccess: boolean;
  setSettingsSavedSuccess: React.Dispatch<React.SetStateAction<boolean>>;
  setEditingPostId: React.Dispatch<React.SetStateAction<string | null>>;
  editingPostId: string | null;
  editingPostText: string;
  setEditingPostText: React.Dispatch<React.SetStateAction<string>>;
  editingPostRole: 'supplier' | 'seller';
  setEditingPostRole: React.Dispatch<React.SetStateAction<'supplier' | 'seller'>>;
  editingPostCategory: string;
  setEditingPostCategory: React.Dispatch<React.SetStateAction<string>>;
  isSavingEdit: boolean;
  socialNotifications: any[];
  setFocusedPostId: React.Dispatch<React.SetStateAction<string | null>>;
  focusedPostId: string | null;
  highlightedUserId: string | null;
  setHighlightedUserId: React.Dispatch<React.SetStateAction<string | null>>;
  activePostComments: Record<string, any[]>;
  setCommentInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  commentInputs: Record<string, string>;
  commentModerationErrors: Record<string, string>;
  setCommentModerationErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  commentLoading: Record<string, boolean>;
  setExpandedComments: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  expandedComments: Record<string, boolean>;
  setReplyingTo: React.Dispatch<React.SetStateAction<Record<string, { commentId: string; userName: string } | null>>>;
  replyingTo: Record<string, { commentId: string; userName: string } | null>;
  viewingCatalogUserId: string | null;
  setViewingCatalogUserId: React.Dispatch<React.SetStateAction<string | null>>;
  viewingCatalogUserName: string | null;
  setViewingCatalogUserName: React.Dispatch<React.SetStateAction<string | null>>;
  viewingCatalogItems: any[];
  setViewingCatalogItems: React.Dispatch<React.SetStateAction<any[]>>;
  isViewingCatalogLocked: boolean;
  viewingCatalogUserDoc: any;
  loadingCatalog: boolean;
  catalogPage: number;
  setCatalogPage: React.Dispatch<React.SetStateAction<number>>;
  merchantCategories: { id: string; name: string }[];
  setProductToSync: React.Dispatch<React.SetStateAction<any | null>>;
  productToSync: any | null;
  setShowSyncCategoryModal: React.Dispatch<React.SetStateAction<boolean>>;
  showSyncCategoryModal: boolean;
  setSyncSelectedCategory: React.Dispatch<React.SetStateAction<string>>;
  syncSelectedCategory: string;
  setSelectedUserForProfileModal: React.Dispatch<React.SetStateAction<{ uid: string; name: string; profileImage: string | null } | null>>;
  selectedUserForProfileModal: { uid: string; name: string; profileImage: string | null } | null;
  selectedUserProfileData: any;
  handleFollowToggle: (targetUser: { uid: string; name: string; profileImage: string | null }) => Promise<void>;
  handleCreatePost: (e: React.FormEvent) => Promise<void>;
  handleToggleLike: (post: any) => Promise<void>;
  handleToggleFavorite: (postId: string) => Promise<void>;
  handleStartEditPost: (post: any) => void;
  handleSaveEditPost: () => Promise<void>;
  handleDeletePost: (postId: string) => void;
  handleSendComment: (postId: string) => Promise<void>;
  handleSendCollabRequest: (post: any) => Promise<void>;
  handleAcceptCollabRequest: (req: any) => Promise<void>;
  handleDeclineCollabRequest: (req: any) => Promise<void>;
  handleOpenProfileModalFromCatalog: () => Promise<void>;
  handleSyncProduct: (item: any, selectedCategory: string) => Promise<void>;
  handleViewCatalog: (posterId: string, posterName: string) => Promise<void>;
  followingList: any[];
  setFollowingList: React.Dispatch<React.SetStateAction<any[]>>;
  setFollowersList: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function SocialFeed(props: SocialFeedProps) {
  const {
    user,
    db,
    navigate,
    location,
    followersList,
    setShowFollowersModal,
    setShowFollowingModal,
    inspectedFollowingCount,
    inspectedFollowersCount,
    communityPosts,
    profilesCache,
    currentUserProfile,
    receivedRequests,
    sentRequests,
    newPostText,
    setNewPostText,
    newPostRole,
    setNewPostRole,
    setNewPostCategory,
    newPostCategory,
    setIsCategoryDropdownOpen,
    isCategoryDropdownOpen,
    setNewPostImage,
    newPostImage,
    setNewPostBgTheme,
    newPostThemeId,
    newPostBgTheme,
    newPostTextColor,
    setNewPostTextColor,
    isPosting,
    setModerationWarning,
    moderationWarning,
    socialFilterRole,
    setSocialFilterRole,
    socialFilterCategory,
    setSocialFilterCategory,
    favoritePostIds,
    setFavoritePostIds,
    favoritedIdsOnEnterTab,
    socialSubTab,
    setSocialSubTab,
    setSocialSearchQuery,
    socialSearchQuery,
    setSettingsFilterRole,
    settingsFilterRole,
    settingsFilterCategories,
    setSettingsFilterCategories,
    settingsSavedSuccess,
    setSettingsSavedSuccess,
    setEditingPostId,
    editingPostId,
    editingPostText,
    setEditingPostText,
    editingPostRole,
    setEditingPostRole,
    editingPostCategory,
    setEditingPostCategory,
    isSavingEdit,
    socialNotifications,
    setFocusedPostId,
    focusedPostId,
    highlightedUserId,
    setHighlightedUserId,
    activePostComments,
    setCommentInputs,
    commentInputs,
    commentModerationErrors,
    setCommentModerationErrors,
    commentLoading,
    setExpandedComments,
    expandedComments,
    setReplyingTo,
    replyingTo,
    viewingCatalogUserId,
    setViewingCatalogUserId,
    viewingCatalogUserName,
    setViewingCatalogUserName,
    viewingCatalogItems,
    setViewingCatalogItems,
    isViewingCatalogLocked,
    viewingCatalogUserDoc,
    loadingCatalog,
    catalogPage,
    setCatalogPage,
    merchantCategories,
    setProductToSync,
    productToSync,
    setShowSyncCategoryModal,
    showSyncCategoryModal,
    setSyncSelectedCategory,
    syncSelectedCategory,
    setSelectedUserForProfileModal,
    selectedUserForProfileModal,
    selectedUserProfileData,
    handleFollowToggle,
    handleCreatePost,
    handleToggleLike,
    handleToggleFavorite,
    handleStartEditPost,
    handleSaveEditPost,
    handleDeletePost,
    handleSendComment,
    handleSendCollabRequest,
    handleAcceptCollabRequest,
    handleDeclineCollabRequest,
    handleOpenProfileModalFromCatalog,
    handleSyncProduct,
    handleViewCatalog,
    onBackToInbox,
    followingList,
    setFollowingList,
    setFollowersList,
  } = props;

  return (
    <>
          <div className="pt-16 sm:pt-20 space-y-6 pb-24">
            
            {/* Dragon Social Sub Tabs & Back to Inbox Fixed Top Header Bar */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/95 border-b border-white/10 backdrop-blur-2xl shadow-2xl py-2 px-2 sm:px-6 md:px-12">
              <div className="max-w-7xl mx-auto flex items-center gap-1 sm:gap-2">
                {/* Back to Inbox Button */}
                {onBackToInbox && (
                  <button
                    type="button"
                    title="Back to Inbox (ইনবক্সে ফিরে যান)"
                    onClick={onBackToInbox}
                    className="px-2.5 py-2 sm:py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1 bg-white/10 hover:bg-dragon-cyan hover:text-dragon-black text-white shrink-0 cursor-pointer active:scale-95 border border-white/10 shadow-md"
                  >
                    <ArrowLeft size={16} />
                    <span className="font-bold text-[11px] sm:text-xs">Inbox</span>
                  </button>
                )}

                <button
                  type="button"
                  title="Home Feed (হোমফিড)"
                  onClick={() => setSocialSubTab('home')}
                  className={cn(
                    "flex-1 py-2 sm:py-2.5 text-[10px] sm:text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1 relative cursor-pointer group",
                    socialSubTab === 'home' 
                      ? "bg-dragon-cyan text-dragon-black shadow-lg shadow-dragon-cyan/20 scale-[1.02]" 
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Home size={16} strokeWidth={socialSubTab === 'home' ? 2.5 : 2} />
                  <span className="inline text-[10px] sm:text-xs">Feed</span>
                </button>

                <button
                  type="button"
                  title="Favorites (ফেভারিট)"
                  onClick={() => setSocialSubTab('favorites')}
                  className={cn(
                    "flex-1 py-2 sm:py-2.5 text-[10px] sm:text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1 relative cursor-pointer group",
                    socialSubTab === 'favorites' 
                      ? "bg-dragon-cyan text-dragon-black shadow-lg shadow-dragon-cyan/20 scale-[1.02]" 
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Bookmark size={16} strokeWidth={socialSubTab === 'favorites' ? 2.5 : 2} className={cn("shrink-0", socialSubTab === 'favorites' ? "fill-dragon-black" : "text-gray-400 group-hover:text-white")} />
                  <span className="inline text-[10px] sm:text-xs">Saved</span>
                </button>

                <button
                  type="button"
                  title="My Profile (মাই প্রোফাইল)"
                  onClick={() => setSocialSubTab('my_posts')}
                  className={cn(
                    "flex-1 py-2 sm:py-2.5 text-[10px] sm:text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1 relative cursor-pointer group",
                    socialSubTab === 'my_posts' 
                      ? "bg-dragon-cyan text-dragon-black shadow-lg shadow-dragon-cyan/20 scale-[1.02]" 
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <User size={16} strokeWidth={socialSubTab === 'my_posts' ? 2.5 : 2} />
                  <span className="inline text-[10px] sm:text-xs">Profile</span>
                </button>

                <button
                  type="button"
                  title="Notifications (নোটিফিকেশন)"
                  onClick={() => setSocialSubTab('notifications')}
                  className={cn(
                    "flex-1 py-2 sm:py-2.5 text-[10px] sm:text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1 relative cursor-pointer group",
                    socialSubTab === 'notifications' 
                      ? "bg-dragon-cyan text-dragon-black shadow-lg shadow-dragon-cyan/20 scale-[1.02]" 
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Bell size={16} strokeWidth={socialSubTab === 'notifications' ? 2.5 : 2} />
                  <span className="inline text-[10px] sm:text-xs">Alerts</span>
                  {socialNotifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1 right-0 sm:right-1 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-zinc-950 animate-bounce">
                      {socialNotifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  title="Settings (সেটিংস)"
                  onClick={() => setSocialSubTab('settings')}
                  className={cn(
                    "flex-1 py-2 sm:py-2.5 text-[10px] sm:text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1 relative cursor-pointer group",
                    socialSubTab === 'settings' 
                      ? "bg-dragon-cyan text-dragon-black shadow-lg shadow-dragon-cyan/20 scale-[1.02]" 
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Settings size={16} strokeWidth={socialSubTab === 'settings' ? 2.5 : 2} />
                  <span className="inline text-[10px] sm:text-xs">Settings</span>
                </button>
              </div>
            </div>

            {/* HIGH DENSITY COMMUNITY WALL SEARCH BAR */}
            <div className="bg-[#0f1118]/80 backdrop-blur-md border border-white/5 rounded-2xl p-3 relative group hover:border-dragon-cyan/25 transition-all duration-300">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-500 group-focus-within:text-dragon-cyan transition-colors">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  placeholder="Search posts by keywords or #hashtags (e.g. #fashion, #clothing, supplier)..."
                  value={socialSearchQuery}
                  onChange={(e) => setSocialSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-zinc-950/80 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 outline-none focus:border-dragon-cyan/50 focus:ring-1 focus:ring-dragon-cyan/20 font-sans font-bold transition-all"
                />
                {socialSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setSocialSearchQuery('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-white transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {(socialSubTab === 'home' || socialSubTab === 'favorites') ? (
              <div className="space-y-6 max-w-2xl mx-auto w-full">
                
                {/* COLLABORATION REQUESTS STATUS PANEL */}
                {receivedRequests.filter(r => r.status === 'pending').length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-5 border-amber-500/30 bg-amber-500/5 rounded-3xl space-y-3"
                  >
                    <div className="flex items-center gap-2 text-amber-400">
                      <UserCheck size={18} />
                      <h4 className="text-[11px] font-black uppercase tracking-widest">New Connection Requests ({receivedRequests.filter(r => r.status === 'pending').length})</h4>
                    </div>
                    <div className="space-y-2">
                      {receivedRequests.filter(r => r.status === 'pending').map((req, idx) => (
                        <div key={`req-${req.id}-${idx}`} className="flex flex-col md:flex-row items-start md:items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl gap-3">
                          <div className="flex items-center gap-3">
                            <img src={req.senderImage || null} className="w-8 h-8 rounded-full bg-white/10 object-cover" alt="" referrerPolicy="no-referrer" />
                            <div>
                              <p className="text-xs font-bold text-white uppercase">{req.senderName}</p>
                              <p className="text-[10px] text-gray-400 font-light truncate max-w-sm">Post: "{req.postText?.substring(0, 40)}..."</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleAcceptCollabRequest(req)}
                              className="px-3 py-1.5 bg-dragon-cyan hover:bg-dragon-cyan/90 text-dragon-black font-black text-[9px] uppercase tracking-wider rounded-lg transition-all"
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeclineCollabRequest(req)}
                              className="px-3 py-1.5 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-500 font-bold text-[9px] uppercase tracking-wider rounded-lg transition-all"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}


              {focusedPostId && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-dragon-cyan/15 border border-dragon-cyan/30 p-4 rounded-3xl flex items-center justify-between gap-3 text-xs text-dragon-cyan shadow-xl shadow-dragon-cyan/5"
                >
                  <span className="font-bold flex items-center gap-1.5 Bengali">
                    <span className="w-1.5 h-1.5 rounded-full bg-dragon-cyan animate-ping" />
                    You are viewing a specific post from a notification
                  </span>
                  <button
                    type="button"
                    onClick={() => setFocusedPostId(null)}
                    className="bg-dragon-cyan hover:bg-white text-dragon-black font-extrabold px-3.5 py-1.5 rounded-xl uppercase text-[9.5px] transition-all cursor-pointer shadow-md shrink-0"
                  >
                    View All Posts
                  </button>
                </motion.div>
              )}

              {(() => {
                const filteredPosts = communityPosts.filter(post => {
                  // Country lock filtering: Only see posts from the same country
                  const loggedInUserCountry = currentUserProfile?.country || 'Bangladesh';
                  const postAuthorCountry = post.userCountry || 'Bangladesh';
                  if (loggedInUserCountry.toLowerCase() !== postAuthorCountry.toLowerCase()) {
                    return false;
                  }

                  // Filter by focused post if present
                  if (focusedPostId && post.id !== focusedPostId) {
                    return false;
                  }
                  
                  // Filter by selected tab mode first
                  if (socialSubTab === 'favorites' && !favoritedIdsOnEnterTab.includes(post.id)) {
                    return false;
                  }
                  
                  // 1. Settings Role Filter
                  if (settingsFilterRole !== 'all' && post.role !== settingsFilterRole) {
                    return false;
                  }

                  // 2. Settings Category Filter
                  const postCategory = post.category || 'other';
                  if (!settingsFilterCategories.includes(postCategory)) {
                    return false;
                  }

                  // 3. Search query filter
                  if (socialSearchQuery.trim()) {
                    const query = socialSearchQuery.toLowerCase().trim();
                    const cleanQuery = query.startsWith('#') ? query.slice(1) : query;
                    const text = (post.text || '').toLowerCase();
                    const userName = (post.userName || '').toLowerCase();
                    const role = (post.role || '').toLowerCase();
                    
                    const categoryObj = PRODUCT_CATEGORIES.find(c => c.id === post.category);
                    const categoryLabel = categoryObj ? categoryObj.label.toLowerCase() : 'other';
                    
                    const matchesSearch = text.includes(query) || 
                                          (cleanQuery && text.includes(cleanQuery)) ||
                                          userName.includes(query) || 
                                          role.includes(query) || 
                                          categoryLabel.includes(query) ||
                                          (cleanQuery && categoryLabel.includes(cleanQuery));
                    if (!matchesSearch) {
                      return false;
                    }
                  }

                  const matchesRole = socialFilterRole === 'all' || post.role === socialFilterRole;
                  const matchesCategory = socialFilterCategory === 'all' || post.category === socialFilterCategory || (!post.category && socialFilterCategory === 'other');
                  return matchesRole && matchesCategory;
                });

                if (filteredPosts.length === 0) {
                  return (
                    <div className="py-20 text-center glass-card border-dashed">
                      <Users size={48} className="mx-auto text-gray-700 mb-4" />
                      <p className="text-gray-500 text-xs font-black uppercase tracking-widest px-4">No active B2B status posts match your filter criteria.</p>
                      {focusedPostId && (
                        <button
                          type="button"
                          onClick={() => setFocusedPostId(null)}
                          className="mt-4 px-4 py-2 bg-dragon-cyan text-dragon-black rounded-xl text-xs font-black uppercase"
                        >
                          Back to all posts
                        </button>
                      )}
                    </div>
                  );
                }

                return filteredPosts.map((post, idx) => (
                  <PostCard
                    key={`post-${post.id}-${idx}`}
                    post={post}
                    idx={idx}
                    user={user}
                    currentUserProfile={currentUserProfile}
                    profilesCache={profilesCache}
                    sentRequests={sentRequests}
                    receivedRequests={receivedRequests}
                    activePostComments={activePostComments}
                    favoritePostIds={favoritePostIds}
                    expandedComments={expandedComments}
                    setExpandedComments={setExpandedComments}
                    editingPostId={editingPostId}
                    setEditingPostId={setEditingPostId}
                    editingPostText={editingPostText}
                    setEditingPostText={setEditingPostText}
                    editingPostRole={editingPostRole}
                    setEditingPostRole={setEditingPostRole}
                    editingPostCategory={editingPostCategory}
                    setEditingPostCategory={setEditingPostCategory}
                    isSavingEdit={isSavingEdit}
                    handleToggleLike={handleToggleLike}
                    handleToggleFavorite={handleToggleFavorite}
                    handleStartEditPost={handleStartEditPost}
                    handleSaveEditPost={handleSaveEditPost}
                    handleDeletePost={handleDeletePost}
                    handleSendCollabRequest={handleSendCollabRequest}
                    handleSendComment={handleSendComment}
                    setSelectedUserForProfileModal={setSelectedUserForProfileModal}
                    setSocialSubTab={setSocialSubTab}
                    setSocialSearchQuery={setSocialSearchQuery}
                    highlightedUserId={highlightedUserId}
                    replyingTo={replyingTo}
                    setReplyingTo={setReplyingTo}
                    commentInputs={commentInputs}
                    setCommentInputs={setCommentInputs}
                    commentModerationErrors={commentModerationErrors}
                    setCommentModerationErrors={setCommentModerationErrors}
                    commentLoading={commentLoading}
                  />
                ));
              })()}
            </div>
          ) : socialSubTab === 'my_posts' ? (
            /* MY POSTS VIEW */
            <div className="space-y-4 sm:space-y-6 max-w-2xl mx-auto w-full font-sans">
              
              {/* IMMERSIVE PROFILE VIEW LIKE THE SCREENSHOT */}
              <div className="bg-[#0b0c10] border border-white/5 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl relative social-profile-card">
                
                {/* Top Action Bar */}
                <div className="p-2.5 sm:p-4 border-b border-white/5 flex justify-between items-center bg-zinc-950/70 backdrop-blur-sm">
                  <button
                    type="button"
                    onClick={() => setSocialSubTab('home')}
                    className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold font-sans flex items-center gap-1 transition-all cursor-pointer"
                  >
                    ← Go Back
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] sm:text-[9px] font-black uppercase px-2 py-0.5 bg-yellow-500/10 text-yellow-500 rounded-md border border-yellow-500/20 font-mono tracking-widest">
                      Profile View Preview
                    </span>
                  </div>
                </div>

                {/* Cover Backdrop Banner */}
                <div 
                  className="h-28 sm:h-52 w-full relative overflow-hidden bg-cover bg-center flex items-end justify-between p-3 sm:p-6 profile-cover-banner"
                  style={{
                    backgroundImage: currentUserProfile?.coverImage 
                      ? `url(${currentUserProfile.coverImage})` 
                      : "linear-gradient(to right, rgba(49, 46, 129, 0.6), rgba(88, 28, 135, 0.4), rgba(8, 79, 94, 0.5))"
                  }}
                >
                  {/* Backdrop shaders */}
                  {!currentUserProfile?.coverImage && (
                    <>
                      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
                      <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-dragon-cyan/10 blur-3xl" />
                      <div className="absolute -bottom-12 -right-12 w-64 h-64 rounded-full bg-purple-600/15 blur-3xl" />
                    </>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                </div>

                {/* Profile Avatar overlapping */}
                <div className="px-3 sm:px-6 pb-3 sm:pb-6 pt-1 flex flex-col items-center justify-center text-center -mt-12 sm:-mt-18 relative z-10 space-y-2 sm:space-y-3">
                  <div className="relative shrink-0">
                    <img 
                      src={currentUserProfile?.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80'} 
                      className="w-20 h-20 sm:w-28 sm:h-28 rounded-full object-cover bg-[#0b0c10] border-3 sm:border-4 border-[#0b0c10] shadow-2xl profile-avatar" 
                      alt="Profile Avatar"
                      referrerPolicy="no-referrer"
                    />
                    {/* Cyan check badge */}
                    <div className="absolute bottom-0.5 right-0.5 p-1 bg-dragon-cyan text-dragon-black rounded-full shadow-lg border-2 border-[#0b0c10] profile-badge-border">
                      <Check size={12} strokeWidth={4} className="sm:hidden" />
                      <Check size={14} strokeWidth={4} className="hidden sm:block" />
                    </div>
                  </div>

                  {/* Name and Title description */}
                  <div className="space-y-0.5 sm:space-y-1">
                    <h2 className="text-lg sm:text-2xl font-black text-white leading-tight font-sans">
                      {currentUserProfile?.storeName || currentUserProfile?.businessName || currentUserProfile?.name || 'User'}
                    </h2>
                    
                    <div className="flex justify-center items-center gap-1.5">
                      <span className={cn(
                        "px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider leading-none ring-1 flex items-center gap-1",
                        (currentUserProfile?.role || 'supplier') === 'supplier'
                          ? "bg-dragon-cyan/10 text-dragon-cyan ring-dragon-cyan/25"
                          : "bg-purple-500/10 text-purple-400 ring-purple-500/25"
                      )}>
                        👑 {(currentUserProfile?.role || 'supplier') === 'supplier' ? 'Supplier User' : 'Seller Partner'}
                      </span>
                    </div>
                  </div>

                  {/* Followers & Following Stats (TikTok style) */}
                  <div className="flex gap-4 sm:gap-6 justify-center py-1 text-xs sm:text-sm">
                    <button 
                      type="button"
                      onClick={() => setShowFollowersModal(true)}
                      className="group cursor-pointer flex items-center gap-1 text-gray-400 hover:text-dragon-cyan transition-colors"
                    >
                      <span className="text-white font-black group-hover:text-dragon-cyan text-sm sm:text-base transition-colors">{followersList.length}</span>
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-500">Followers</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => setShowFollowingModal(true)}
                      className="group cursor-pointer flex items-center gap-1 text-gray-400 hover:text-dragon-cyan transition-colors"
                    >
                      <span className="text-white font-black group-hover:text-dragon-cyan text-sm sm:text-base transition-colors">{followingList.length}</span>
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-500">Following</span>
                    </button>
                  </div>

                  {/* Action buttons list */}
                  <div className="flex gap-2 justify-center pt-1 w-full max-w-xs sm:max-w-md">
                    <button
                      type="button"
                      onClick={() => setSocialSubTab('home')}
                      className="w-full px-3 py-2 sm:px-4 sm:py-2.5 bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-gray-300 font-sans font-black text-[10px] sm:text-[11px] uppercase tracking-wider rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all"
                    >
                      Go to Feed
                    </button>
                  </div>
                </div>

                {/* Structured details section */}
                <div className="p-3 sm:p-6 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-4">
                  
                  {/* Card 1: Intro Profile */}
                  <div className="bg-zinc-950/60 border border-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-5 space-y-2 sm:space-y-3.5 profile-info-box">
                    <h3 className="text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5 border-b border-white/5 pb-1.5 sm:pb-2">
                      💡 Intro Profile
                    </h3>
                    <div className="space-y-2 font-sans">
                      <div className="flex items-center gap-2 text-xs text-gray-300">
                        <span className="text-sm sm:text-base shrink-0">📧</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[8.5px] sm:text-[9px] text-gray-500 font-bold uppercase leading-none">Gmail Address</p>
                          <p className="font-semibold text-white break-all mt-0.5 text-[11px] sm:text-xs">{currentUserProfile?.email || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-300 border-t border-white/5 pt-2">
                        <span className="text-sm sm:text-base shrink-0">📈</span>
                        <div>
                          <p className="text-[8.5px] sm:text-[9px] text-gray-500 font-bold uppercase leading-none">Total Activity</p>
                          <p className="font-bold text-dragon-cyan mt-0.5 text-[11px] sm:text-xs">
                            Posted {communityPosts.filter(p => p.userId === user?.uid).length} posts
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-300 border-t border-white/5 pt-2">
                        <span className="text-sm sm:text-base shrink-0">🛡️</span>
                        <div>
                          <p className="text-[8.5px] sm:text-[9px] text-gray-500 font-bold uppercase leading-none">Verification Info</p>
                          <p className="font-bold text-green-400 mt-0.5 text-[11px] sm:text-xs">✓ Active Member</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: About Bio */}
                  <div className="bg-zinc-950/60 border border-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-5 flex flex-col justify-between profile-info-box">
                    <div>
                      <h3 className="text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5 border-b border-white/5 pb-1.5 sm:pb-2">
                        📝 About Bio
                      </h3>
                      <p className="text-[11px] sm:text-xs text-gray-400 leading-normal font-sans italic mt-2">
                        {currentUserProfile?.businessDescription || "Registered active member."}
                      </p>
                    </div>
                    <p className="text-[8.5px] sm:text-[9px] text-dragon-cyan font-bold uppercase tracking-wider mt-2.5">
                      💡 Tips: Use "My Catalog" tab to edit store & cover photo.
                    </p>
                  </div>
                </div>
              </div>

              {/* TIMELINE TITLE SPLITTER */}
              <div className="flex items-center justify-between border-b border-white/5 pb-2 pt-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-dragon-cyan flex items-center gap-2 font-mono">
                  <span className="w-2 h-2 rounded-full bg-dragon-cyan animate-ping shrink-0" />
                  🟢 User Activity Timeline
                </h3>
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest font-mono">
                  CHRONOLOGICAL ORDER
                </span>
              </div>

              {/* CREATE POST BOX */}
              <form onSubmit={handleCreatePost} className="create-post-card p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl space-y-3 sm:space-y-4 relative group transition-all duration-300">
                <div className="absolute top-0 right-12 w-32 h-[1px] bg-gradient-to-r from-transparent via-dragon-cyan/40 to-transparent" />
                
                {/* Header: User Info & Role Switcher */}
                <div className="create-post-header-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
                  <div className="flex items-center gap-3">
                    <img 
                      src={currentUserProfile?.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80'} 
                      className="w-10 h-10 rounded-full bg-white/10 object-cover shrink-0 border border-dragon-cyan/30" 
                      alt="" 
                      referrerPolicy="no-referrer" 
                    />
                    <div>
                      <h4 className="text-sm font-black leading-tight font-sans">
                        {currentUserProfile?.storeName || currentUserProfile?.name || 'Create New Post'}
                      </h4>
                      <p className="text-[10px] text-gray-400 font-semibold flex items-center gap-1 mt-0.5">
                        <Sparkles size={10} className="text-dragon-cyan animate-pulse" />
                        <span>Find New Collaborative Partnerships</span>
                      </p>
                    </div>
                  </div>
                  
                  {/* Role Switcher Pill */}
                  <div className="create-post-role-pill flex items-center gap-1 p-1 rounded-2xl self-start sm:self-auto">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-2 hidden sm:inline">Role:</span>
                    <button
                      type="button"
                      onClick={() => setNewPostRole('supplier')}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer",
                        newPostRole === 'supplier' ? "create-post-role-btn-active scale-105" : "text-gray-400 hover:text-white"
                      )}
                    >
                      <span>Supplier</span> 👑
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewPostRole('seller')}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer",
                        newPostRole === 'seller' ? "create-post-role-btn-active scale-105" : "text-gray-400 hover:text-white"
                      )}
                    >
                      <span>Seller</span> 🛒
                    </button>
                  </div>
                </div>

                {/* Moderation Warning Alert */}
                {moderationWarning && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-2.5 items-start text-red-400">
                    <AlertTriangle className="shrink-0 mt-0.5" size={16} />
                    <div className="text-[10px] leading-relaxed font-bold uppercase transition-all">
                      {moderationWarning}
                    </div>
                  </div>
                )}

                {/* Main Text Input Area */}
                <div className="space-y-2">
                  {newPostBgTheme !== 'none' ? (
                    <div 
                      className={cn(
                        "social-post-bg-theme w-full rounded-2xl p-6 min-h-[180px] sm:min-h-[220px] flex items-center justify-center text-center transition-all duration-300 relative overflow-hidden shadow-2xl border border-white/20",
                        POST_BACKGROUND_THEMES.find(t => t.id === newPostBgTheme)?.bgClass
                      )}
                    >
                      <PostThemeVectorOverlay themeId={newPostBgTheme} />
                      <textarea
                        placeholder="Write your bold post text here (use #hashtags)..."
                        value={newPostText}
                        maxLength={4000}
                        onChange={(e) => {
                          setNewPostText(e.target.value);
                          if (moderationWarning) setModerationWarning(null);
                        }}
                        rows={3}
                        style={{ color: newPostTextColor || '#ffffff' }}
                        className="w-full bg-transparent border-0 outline-none resize-none text-base sm:text-2xl font-black text-center placeholder-white/70 leading-snug drop-shadow-md font-sans max-w-lg relative z-10"
                      />
                      <button
                        type="button"
                        onClick={() => setNewPostBgTheme('none')}
                        className="absolute top-3 right-3 bg-black/60 hover:bg-black text-white p-1.5 rounded-full transition-all text-[10px] font-bold flex items-center gap-1 backdrop-blur-md border border-white/20 cursor-pointer z-20"
                        title="Clear Background"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="create-post-textarea-container rounded-2xl p-4 transition-all">
                      <textarea
                        placeholder={
                          newPostRole === 'supplier'
                            ? "Write as a Supplier... (e.g. Premium wholesale clothing items in stock #fashion #wholesale)"
                            : "Write as a Seller... (e.g. Sourcing reliable suppliers for high-quality smart watches #gadgets #sourcing)"
                        }
                        value={newPostText}
                        maxLength={4000}
                        onChange={(e) => {
                          setNewPostText(e.target.value);
                          if (moderationWarning) setModerationWarning(null);
                        }}
                        rows={3}
                        className="create-post-textarea w-full bg-transparent border-0 outline-none resize-none text-sm leading-relaxed font-sans"
                      />
                    </div>
                  )}

                  {/* Character limit & Hashtags helper */}
                  <div className="flex items-center justify-between text-[11px] font-mono px-1">
                    <span className="flex items-center gap-1 text-dragon-cyan font-bold">
                      <Hash size={13} /> Use #hashtags (e.g. #fashion, #tech)
                    </span>
                    <span className={cn("font-bold font-mono transition-colors", newPostText.length >= 3900 ? "text-red-400 font-black animate-pulse" : newPostText.length >= 3500 ? "text-amber-400 font-bold" : "text-gray-400")}>
                      {newPostText.length} / 4000
                    </span>
                  </div>
                </div>

                {/* Attached Image Preview */}
                {newPostImage && (
                  <div className="relative inline-block rounded-2xl overflow-hidden border border-white/15 bg-black/50 p-1">
                    <img src={newPostImage} className="max-h-32 object-contain rounded-xl" alt="Post attachment preview" referrerPolicy="no-referrer" />
                    <button
                      type="button"
                      onClick={() => setNewPostImage(null)}
                      className="absolute top-2 right-2 p-1.5 bg-black/80 hover:bg-red-600 text-white rounded-full transition-all cursor-pointer border border-white/20 shadow-lg"
                      title="Remove image"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}

                {/* Options & Settings Section */}
                <div className="create-post-options-panel rounded-2xl p-3.5 space-y-3">
                  
                  {/* Background Themes Selector */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-dragon-cyan tracking-widest flex items-center gap-1.5">
                        🎨 Background Themes (12 Themes)
                      </span>
                      {newPostBgTheme !== 'none' && (
                        <span className="text-[9px] bg-dragon-cyan/20 text-dragon-cyan font-black px-2.5 py-0.5 rounded-full border border-dragon-cyan/30">
                          THEME ACTIVE
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
                      {POST_BACKGROUND_THEMES.map((theme) => {
                        const isSelected = newPostBgTheme === theme.id;
                        return (
                          <button
                            key={`bg-theme-btn-${theme.id}`}
                            type="button"
                            onClick={() => setNewPostBgTheme(theme.id)}
                            className={cn(
                              "w-9 h-9 sm:w-10 sm:h-10 rounded-xl shrink-0 flex items-center justify-center transition-all duration-200 relative group border-2 cursor-pointer shadow-md overflow-hidden",
                              theme.id === 'none' 
                                ? "bg-zinc-800/80 border-white/20 text-gray-300 hover:border-white" 
                                : `${theme.bgClass} text-white hover:scale-105`,
                              isSelected ? "border-dragon-cyan ring-2 ring-dragon-cyan/50 scale-105 shadow-lg" : "border-transparent opacity-80 hover:opacity-100"
                            )}
                            title={theme.name}
                          >
                            <PostThemeVectorOverlay themeId={theme.id} />
                            <span className="text-[11px] font-black uppercase tracking-tighter relative z-10 drop-shadow">Aa</span>
                            {isSelected && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-dragon-cyan rounded-full flex items-center justify-center text-dragon-black z-20 shadow-md">
                                <Check size={10} strokeWidth={3} />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Text Color Swatches (Shown when theme is selected) */}
                    {newPostBgTheme !== 'none' && (
                      <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0">Text Color:</span>
                        <div className="flex items-center gap-2 overflow-x-auto">
                          {POST_TEXT_COLORS.map((col) => {
                            const isSelected = newPostTextColor === col.color;
                            return (
                              <button
                                key={`text-col-${col.id}`}
                                type="button"
                                onClick={() => setNewPostTextColor(col.color)}
                                className={cn(
                                  "w-6 h-6 rounded-full shrink-0 border transition-all cursor-pointer relative flex items-center justify-center hover:scale-110",
                                  isSelected ? "border-dragon-cyan ring-2 ring-dragon-cyan/60 scale-110" : "border-white/30 opacity-80"
                                )}
                                style={{ backgroundColor: col.color }}
                                title={col.name}
                              >
                                {isSelected && (
                                  <div className={cn("w-2 h-2 rounded-full", col.color === '#FFFFFF' || col.color === '#FACC15' || col.color === '#00F2FE' ? "bg-black" : "bg-white")} />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Product Category & Add Photo Bar */}
                  <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    
                    {/* CUSTOM CATEGORY DROPDOWN SELECTOR */}
                    <div className="relative flex-1">
                      <button
                        type="button"
                        onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                        className="create-post-category-trigger w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer font-bold text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-[10px] font-black uppercase tracking-wider text-dragon-cyan shrink-0 flex items-center gap-1">
                            📦 Category:
                          </span>
                          <span className="truncate font-black">
                            {PRODUCT_CATEGORIES.find(c => c.id === newPostCategory)?.label || 'Select Category'}
                          </span>
                        </div>
                        <ChevronDown size={15} className={cn("transition-transform duration-200 shrink-0 text-dragon-cyan", isCategoryDropdownOpen && "rotate-180")} />
                      </button>

                      <AnimatePresence>
                        {isCategoryDropdownOpen && (
                          <>
                            {/* Overlay Backdrop to close dropdown on outside click */}
                            <div 
                              className="fixed inset-0 z-40" 
                              onClick={() => setIsCategoryDropdownOpen(false)} 
                            />
                            <motion.div
                              initial={{ opacity: 0, y: -6, scale: 0.98 }}
                              animate={{ opacity: 1, y: 4, scale: 1 }}
                              exit={{ opacity: 0, y: -6, scale: 0.98 }}
                              transition={{ duration: 0.15 }}
                              className="create-post-category-menu absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-2xl p-1.5 shadow-2xl space-y-1"
                            >
                              {PRODUCT_CATEGORIES.map(cat => {
                                const isSelected = newPostCategory === cat.id;
                                return (
                                  <button
                                    key={`cat-select-item-${cat.id}`}
                                    type="button"
                                    onClick={() => {
                                      setNewPostCategory(cat.id);
                                      setIsCategoryDropdownOpen(false);
                                    }}
                                    className={cn(
                                      "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-black transition-all text-left cursor-pointer",
                                      isSelected 
                                        ? "create-post-category-item-active" 
                                        : "create-post-category-item-hover"
                                    )}
                                  >
                                    <span className="truncate">{cat.label}</span>
                                    {isSelected && <Check size={14} className="shrink-0 text-dragon-cyan stroke-[3]" />}
                                  </button>
                                );
                              })}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Add Photo Button */}
                    <div className="shrink-0">
                      <button
                        type="button"
                        onClick={() => document.getElementById('new-post-photo')?.click()}
                        className={cn(
                          "w-full sm:w-auto flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl border transition-all cursor-pointer create-post-photo-btn",
                          newPostImage && "active"
                        )}
                      >
                        <ImageIcon size={14} />
                        {newPostImage ? 'Change Photo' : 'Add Photo'}
                      </button>
                      <input 
                        type="file" 
                        id="new-post-photo" 
                        hidden 
                        accept="image/*" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => setNewPostImage(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }} 
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Action Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isPosting}
                    className="create-post-publish-btn w-full sm:w-auto sm:min-w-[200px] px-8 py-3.5 font-black text-xs uppercase tracking-[0.15em] rounded-xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isPosting ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} className="fill-current animate-pulse" />}
                    Publish Post
                  </button>
                </div>
              </form>

              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <h3 className="text-xs font-black uppercase tracking-wider text-dragon-cyan flex items-center gap-2 font-mono">
                  <FileText size={15} className="text-dragon-cyan animate-pulse" />
                  My Posts
                </h3>
                <span className="text-[9px] bg-white/5 border border-white/10 px-2.5 py-1 rounded-full text-zinc-400 font-bold uppercase tracking-widest font-mono">
                  {communityPosts.filter(p => p.userId === user?.uid).length} Posts
                </span>
              </div>

              {(() => {
                const myPosts = communityPosts.filter(p => p.userId === user?.uid);
                if (myPosts.length === 0) {
                  return (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="py-16 text-center bg-[#0f1118]/80 border border-white/5 rounded-3xl space-y-4"
                    >
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10 text-gray-500">
                        <FileText size={28} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-extrabold uppercase tracking-widest text-zinc-300">No posts found</p>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider px-6">You have not posted anything in the community feed yet!</p>
                      </div>
                    </motion.div>
                  );
                }

                return (
                  <div className="space-y-6">
                    {myPosts.map((post, idx) => (
                      <PostCard
                        key={`my-post-${post.id}-${idx}`}
                        post={post}
                        idx={idx}
                        user={user}
                        currentUserProfile={currentUserProfile}
                        profilesCache={profilesCache}
                        sentRequests={sentRequests}
                        receivedRequests={receivedRequests}
                        activePostComments={activePostComments}
                        favoritePostIds={favoritePostIds}
                        expandedComments={expandedComments}
                        setExpandedComments={setExpandedComments}
                        editingPostId={editingPostId}
                        setEditingPostId={setEditingPostId}
                        editingPostText={editingPostText}
                        setEditingPostText={setEditingPostText}
                        editingPostRole={editingPostRole}
                        setEditingPostRole={setEditingPostRole}
                        editingPostCategory={editingPostCategory}
                        setEditingPostCategory={setEditingPostCategory}
                        isSavingEdit={isSavingEdit}
                        handleToggleLike={handleToggleLike}
                        handleToggleFavorite={handleToggleFavorite}
                        handleStartEditPost={handleStartEditPost}
                        handleSaveEditPost={handleSaveEditPost}
                        handleDeletePost={handleDeletePost}
                        handleSendCollabRequest={handleSendCollabRequest}
                        handleSendComment={handleSendComment}
                        setSelectedUserForProfileModal={setSelectedUserForProfileModal}
                        setSocialSubTab={setSocialSubTab}
                        setSocialSearchQuery={setSocialSearchQuery}
                        highlightedUserId={highlightedUserId}
                        replyingTo={replyingTo}
                        setReplyingTo={setReplyingTo}
                        commentInputs={commentInputs}
                        setCommentInputs={setCommentInputs}
                        commentModerationErrors={commentModerationErrors}
                        setCommentModerationErrors={setCommentModerationErrors}
                        commentLoading={commentLoading}
                      />
                    ))}
                  </div>
                );
              })()}
            </div>
          ) : socialSubTab === 'notifications' ? (
            /* SOCIAL NOTIFICATIONS FEED - FACEBOOK-STYLE */
            <div className="space-y-4 max-w-lg mx-auto w-full">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <h3 className="text-xs font-black uppercase tracking-wider text-dragon-cyan flex items-center gap-2">
                  <Bell size={15} className="text-dragon-cyan animate-pulse" />
                  Social Notification Center
                </h3>
                <span className="text-[9px] bg-white/5 border border-white/10 px-2.5 py-1 rounded-full text-zinc-400 font-bold uppercase tracking-widest">
                  {socialNotifications.length} Notifications
                </span>
              </div>

              {socialNotifications.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-16 text-center bg-[#0f1118]/80 border border-white/5 rounded-3xl space-y-4"
                >
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10 text-gray-500">
                    <Bell size={28} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-extrabold uppercase tracking-widest text-zinc-300">No notifications</p>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider px-6">You will see notifications here when others like, comment, or favorite your posts!</p>
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-2.5">
                  {socialNotifications.map((notification, idx) => {
                    // Icon & Accent Color
                    let iconColor = "text-dragon-cyan bg-dragon-cyan/10 border-dragon-cyan/20";
                    let iconElement = <MessageSquare size={10} />;
                    let actionText = "commented on your post.";

                    if (notification.type === 'like') {
                      iconColor = "text-red-500 bg-red-500/10 border-red-500/20";
                      iconElement = <Heart size={10} className="fill-red-500 text-red-500" />;
                      actionText = "liked your post.";
                    } else if (notification.type === 'favorite') {
                      iconColor = "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
                      iconElement = <Bookmark size={10} className="fill-yellow-400 text-yellow-400" />;
                      actionText = "added your post to favorites.";
                    } else if (notification.type === 'follow') {
                      iconColor = "text-purple-400 bg-purple-500/10 border-purple-500/20";
                      iconElement = <UserPlus size={10} />;
                      actionText = notification.text || "started following you.";
                    } else if (notification.type === 'collab_request') {
                      iconColor = "text-dragon-emerald bg-dragon-emerald/10 border-dragon-emerald/20";
                      iconElement = <UserPlus size={10} />;
                      actionText = "sent you a direct message & connection request.";
                    } else if (notification.type === 'collab_request_accepted') {
                      iconColor = "text-dragon-cyan bg-dragon-cyan/10 border-dragon-cyan/20";
                      iconElement = <UserCheck size={10} />;
                      actionText = "accepted your message request.";
                    }

                    return (
                      <motion.div
                        key={`notification-${notification.id}-${idx}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => {
                          if (notification.postId && notification.postId !== 'direct') {
                            setFocusedPostId(notification.postId);
                            setExpandedComments(prev => ({ ...prev, [notification.postId]: true }));
                            setHighlightedUserId(notification.triggerUserId);
                            setSocialSubTab('home');
                            setTimeout(() => {
                              setHighlightedUserId(null);
                            }, 12000); // 12 seconds highlight duration
                          } else {
                            // Direct connection request - can view their profile
                            setSelectedUserForProfileModal({
                              uid: notification.triggerUserId,
                              name: notification.triggerUserName || 'User',
                              profileImage: notification.triggerUserProfileImage || null
                            });
                          }
                        }}
                        className="bg-[#0f1118]/90 hover:bg-zinc-950 border border-white/5 hover:border-white/10 rounded-2xl p-4 flex items-start gap-3.5 transition-all duration-300 cursor-pointer group shadow-lg active:scale-[0.99] relative overflow-hidden"
                      >
                        {/* Image & Type Icon Overlay badge */}
                        <div className="relative shrink-0 select-none">
                          {notification.triggerUserProfileImage ? (
                            <img 
                              src={notification.triggerUserProfileImage || null} 
                              className="w-10 h-10 rounded-full object-cover border border-white/10 bg-white/5" 
                              alt=""
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-xs font-black text-dragon-cyan">
                              {notification.triggerUserName?.[0]?.toUpperCase() || 'U'}
                            </div>
                          )}
                          <div className={cn("absolute -bottom-1 -right-1 p-1 rounded-full border shadow-md", iconColor)}>
                            {iconElement}
                          </div>
                        </div>

                        {/* Details Content */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="text-xs text-zinc-100 leading-normal font-medium font-sans">
                            <span className="font-extrabold text-[#1ca] group-hover:underline transition-all">{notification.triggerUserName}</span>
                            {" "}{actionText}
                          </p>
                          
                          {/* Target post preview */}
                          {notification.postExcerpt && (
                            <p className="text-[10px] text-zinc-500 italic bg-black/40 border border-white/5 py-1.5 px-3 rounded-lg truncate max-w-full font-light font-sans">
                              "{notification.postExcerpt}"
                            </p>
                          )}

                          {/* Connection Actions Inline inside Notification List */}
                          {notification.type === 'collab_request' && (
                            <div className="flex items-center gap-2 pt-1.5" onClick={(e) => e.stopPropagation()}>
                              {(() => {
                                const req = receivedRequests.find(r => r.senderId === notification.triggerUserId && r.status === 'pending');
                                if (req) {
                                  return (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleAcceptCollabRequest(req)}
                                        className="px-2.5 py-1 bg-dragon-emerald text-dragon-black rounded-lg text-[9px] font-black uppercase tracking-wider hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeclineCollabRequest(req)}
                                        className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-wider border border-red-500/20 transition-all cursor-pointer"
                                      >
                                        Reject
                                      </button>
                                    </>
                                  );
                                } else {
                                  const reqDeclined = receivedRequests.find(r => r.senderId === notification.triggerUserId && r.status === 'declined');
                                  if (reqDeclined) {
                                    return <span className="text-[9px] text-red-400 font-bold uppercase">Declined</span>;
                                  }
                                  return <span className="text-[9px] text-dragon-emerald font-bold uppercase">Approved</span>;
                                }
                              })()}
                            </div>
                          )}

                          {/* Date timestamp */}
                          <p className="text-[7.5px] text-zinc-650 font-bold uppercase tracking-wider">
                            {notification.createdAt ? formatDate(notification.createdAt) : ''}
                          </p>
                        </div>

                        {/* Quick arrow */}
                        <div className="self-center text-zinc-700 group-hover:text-dragon-cyan transition-colors">
                          <ArrowUpRight size={15} />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* SOCIAL SETTINGS TAB - CUSTOM PREFERENCES */
            <div className="space-y-6 w-full font-sans animate-fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#1ca] flex items-center gap-2 font-mono">
                  <Settings size={15} className="animate-pulse text-[#1ca]" />
                  Social Feed Settings
                </h3>
              </div>

              {settingsSavedSuccess && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 rounded-2xl text-xs font-bold font-sans uppercase flex items-center gap-2 border-dashed"
                >
                  <CheckCircle size={16} className="text-emerald-400" />
                  Settings saved successfully!
                </motion.div>
              )}

              <div className="bg-[#0f1118]/90 border border-white/5 rounded-3xl p-6 space-y-6 shadow-2xl">
                
                {/* 1. Filter by seller / supplier role */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-wider text-dragon-cyan block font-mono">
                    1. Feed Role Filter
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    {[
                      { id: 'all', label: 'All Sellers & Suppliers' },
                      { id: 'supplier', label: 'Only Supplier posts' },
                      { id: 'seller', label: 'Only Seller posts' }
                    ].map(roleOpt => (
                      <label 
                        key={`settings-role-${roleOpt.id}`} 
                        className={cn(
                          "flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer select-none transition-all",
                          settingsFilterRole === roleOpt.id 
                            ? "bg-dragon-cyan/5 border-dragon-cyan text-white font-extrabold" 
                            : "bg-zinc-950/40 border-white/5 text-gray-400 hover:text-white hover:border-white/10"
                        )}
                      >
                        <span className="text-xs font-sans font-bold">{roleOpt.label}</span>
                        <input
                          type="radio"
                          name="settingsFilterRole"
                          checked={settingsFilterRole === roleOpt.id}
                          onChange={() => setSettingsFilterRole(roleOpt.id as 'all' | 'supplier' | 'seller')}
                          className="text-dragon-cyan bg-white/5 border-white/10 focus:ring-0 cursor-pointer"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                {/* 2. Filter by category checkboxes */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-wider text-dragon-cyan block font-mono">
                      2. Product Category Filter
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSettingsFilterCategories(['clothing', 'electronics', 'beauty', 'home', 'baby', 'fitness', 'food', 'bags', 'accessories', 'other'])}
                        className="text-[9px] font-black text-gray-500 hover:text-dragon-cyan uppercase font-mono cursor-pointer"
                      >
                        Select All
                      </button>
                      <span className="text-gray-700 text-xs font-mono">|</span>
                      <button
                        type="button"
                        onClick={() => setSettingsFilterCategories([])}
                        className="text-[9px] font-black text-gray-500 hover:text-dragon-cyan uppercase font-mono cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 p-4 bg-zinc-950/60 border border-white/5 rounded-2xl max-h-[220px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                    {PRODUCT_CATEGORIES.map(cat => {
                      const isChecked = settingsFilterCategories.includes(cat.id);
                      return (
                        <label 
                          key={`settings-cat-${cat.id}`}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all",
                            isChecked 
                              ? "bg-zinc-900 border-[#1ca]/35 text-white" 
                              : "bg-zinc-950/30 border-transparent text-gray-500 hover:text-gray-300"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSettingsFilterCategories(prev => [...prev, cat.id]);
                              } else {
                                setSettingsFilterCategories(prev => prev.filter(id => id !== cat.id));
                              }
                            }}
                            className="rounded border-white/10 text-dragon-cyan bg-white/5 focus:ring-0 mr-1 cursor-pointer"
                          />
                          <span className="text-xs font-sans font-bold">{cat.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Save Settings Action Button */}
                <div className="pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      // Save to local storage
                      localStorage.setItem('social_settings_filter_role', settingsFilterRole);
                      localStorage.setItem('social_settings_filter_categories', JSON.stringify(settingsFilterCategories));
                      setSettingsSavedSuccess(true);
                      setTimeout(() => {
                        setSettingsSavedSuccess(false);
                      }, 4000);
                    }}
                    className="w-full py-4 bg-dragon-cyan hover:bg-white text-dragon-black font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-dragon-cyan/20 active:scale-95 flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    <Save size={16} />
                    Save Settings
                  </button>
                </div>

              </div>

              {/* Navigation Back Promo Card */}
              <div className="p-4 bg-zinc-950/60 border border-white/5 rounded-3xl flex items-center justify-between text-xs font-bold text-gray-400">
                <span className="font-sans">Want to return to the feed to view changes?</span>
                <button
                  type="button"
                  onClick={() => setSocialSubTab('home')}
                  className="px-4 py-2 bg-[#1ca]/20 hover:bg-dragon-cyan hover:text-dragon-black text-white rounded-xl border border-white/5 uppercase text-[9px] font-black tracking-widest transition-all shadow-md cursor-pointer"
                >
                  Go to Feed
                </button>
              </div>
            </div>
          )}

          </div>

      {/* USER PROFILE INSPECTION FULLSCREEN OVERLAY (FACEBOOK STYLE) */}
      <UserProfileModal
        selectedUserForProfileModal={selectedUserForProfileModal}
        setSelectedUserForProfileModal={setSelectedUserForProfileModal}
        selectedUserProfileData={selectedUserProfileData}
        user={user}
        followingList={followingList}
        followersList={followersList}
        inspectedFollowersCount={inspectedFollowersCount}
        inspectedFollowingCount={inspectedFollowingCount}
        communityPosts={communityPosts}
        handleFollowToggle={handleFollowToggle}
        navigate={navigate}
      />

      {/* SYNC CATEGORY SELECTION POPUP OVERLAY */}
      <SyncCategoryModal
        showSyncCategoryModal={showSyncCategoryModal}
        setShowSyncCategoryModal={setShowSyncCategoryModal}
        productToSync={productToSync}
        setProductToSync={setProductToSync}
        syncSelectedCategory={syncSelectedCategory}
        setSyncSelectedCategory={setSyncSelectedCategory}
        merchantCategories={merchantCategories}
        handleSyncProduct={handleSyncProduct}
      />

      {/* CATALOG PREVIEW B2B MODAL OVERLAY */}
      <AnimatePresence>
        {viewingCatalogUserId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dragon-black/80 backdrop-blur-md no-print">
            {(() => {
              const itemsPerPage = 40;
              const totalItemsCount = viewingCatalogItems.length;
              const totalPages = Math.ceil(totalItemsCount / itemsPerPage) || 1;
              const displayedCatalogItems = viewingCatalogItems.slice(
                (catalogPage - 1) * itemsPerPage,
                catalogPage * itemsPerPage
              );

              return (
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-dragon-black/95 border border-white/10 w-[95vw] max-w-7xl h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl animate-[fadeIn_0.2s_ease_out]"
                >
                  {/* Header */}
                  <div 
                    className="p-6 border-b border-slate-200 dark:border-white/5 flex justify-between items-center bg-cover bg-center relative min-h-[120px] bg-slate-100 dark:bg-dragon-black"
                    style={{
                      backgroundImage: viewingCatalogUserDoc?.coverImage 
                        ? `url(${viewingCatalogUserDoc.coverImage})` 
                        : undefined
                    }}
                  >
                    <div className="header-profile-card flex items-center gap-3 relative z-10 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-black/75 backdrop-blur-md border border-slate-300 dark:border-white/20 shadow-xl text-slate-900 dark:text-white">
                      <div className="p-2.5 rounded-2xl bg-pink-100 dark:bg-dragon-cyan/20 text-pink-600 dark:text-dragon-cyan">
                        <ShoppingBag size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                          B2B Product Catalog
                          {viewingCatalogUserDoc?.storeName && (
                            <span className="text-xs text-pink-700 dark:text-dragon-cyan font-semibold px-2 py-0.5 bg-pink-100 dark:bg-dragon-cyan/10 border border-pink-300 dark:border-dragon-cyan/20 rounded-md">
                              {viewingCatalogUserDoc.storeName}
                            </span>
                          )}
                        </h3>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                          <p className="text-[10px] text-slate-700 dark:text-gray-200 font-bold uppercase tracking-widest">
                            {viewingCatalogUserDoc?.storeName || viewingCatalogUserName} Stock Inventory • Total {totalItemsCount} Products
                          </p>
                          <span className="hidden sm:inline text-slate-400 dark:text-gray-500">•</span>
                          <button
                            type="button"
                            onClick={handleOpenProfileModalFromCatalog}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white dark:bg-none dark:bg-dragon-cyan/10 dark:hover:bg-dragon-cyan dark:text-dragon-cyan dark:hover:text-dragon-black border border-pink-400/30 dark:border-dragon-cyan/20 dark:hover:border-dragon-cyan rounded-xl text-[9px] font-extrabold uppercase tracking-wider transition-all duration-150 cursor-pointer w-fit shadow-md"
                            title="View Social Profile"
                          >
                            <Users size={11} /> View Profile
                          </button>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setViewingCatalogUserId(null);
                        setViewingCatalogItems([]);
                      }}
                      className="p-2 text-gray-400 hover:text-white bg-black/50 hover:bg-black/80 rounded-xl transition-all relative z-10 cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Grid content */}
                  <div className="p-6 overflow-y-auto custom-scrollbar flex-1 flex flex-col justify-between">
                    {isViewingCatalogLocked ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white/[0.01] border border-white/5 rounded-3xl space-y-5 py-20 max-w-xl mx-auto my-auto shadow-2xl">
                        <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center animate-pulse">
                          <Lock size={32} />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-base font-black text-white uppercase tracking-wider">Catalog Locked</h3>
                          <p className="text-xs text-gray-400 leading-relaxed font-bold">
                            Sorry, this catalog is temporarily locked because the merchant's subscription or 7-day trial has expired.
                          </p>
                          <p className="text-[10px] text-amber-500 font-bold mt-2">
                            * If you are the owner of this store, please upgrade your plan in your 'My Catalog' dashboard.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Delivery Charges Box of Seller */}
                        <div className="mb-6 p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-left space-y-3">
                          <div className="flex items-center gap-1.5 border-b border-white/5 pb-2">
                            <Truck size={14} className="text-dragon-cyan animate-pulse" />
                            <h4 className="text-xs font-black uppercase tracking-wider text-white">Delivery Charges (Seller's Delivery Charges)</h4>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl">
                              <span className="text-[8px] font-black uppercase text-gray-500 tracking-wider block">{viewingCatalogUserDoc?.deliveryLabelInside || 'Inside Dhaka'}</span>
                              <span className="text-xs font-bold text-white mt-1 block">৳{typeof viewingCatalogUserDoc?.deliveryChargeInside === 'number' ? viewingCatalogUserDoc.deliveryChargeInside : 80}</span>
                            </div>
                            <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl">
                              <span className="text-[8px] font-black uppercase text-gray-500 tracking-wider block">{viewingCatalogUserDoc?.deliveryLabelOutside || 'Outside Dhaka'}</span>
                              <span className="text-xs font-bold text-white mt-1 block">৳{typeof viewingCatalogUserDoc?.deliveryChargeOutside === 'number' ? viewingCatalogUserDoc.deliveryChargeOutside : 130}</span>
                            </div>
                          </div>

                          {viewingCatalogUserDoc?.customDeliveryCharges && Array.isArray(viewingCatalogUserDoc.customDeliveryCharges) && viewingCatalogUserDoc.customDeliveryCharges.length > 0 && (
                            <div className="space-y-2 mt-2">
                              <span className="text-[8px] font-black uppercase text-gray-500 tracking-wider block">Area & Sub-area Based Charges:</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {viewingCatalogUserDoc.customDeliveryCharges.map((item: any, idx: number) => (
                                  <div key={`viewing-custom-charge-${idx}`} className="p-2.5 bg-black/40 border border-white/5 rounded-xl text-left space-y-1">
                                    <div className="flex justify-between items-center">
                                      <span className="text-xs font-bold text-white">{item.area}</span>
                                      <span className="text-[10px] font-bold text-dragon-cyan">৳{item.charge}</span>
                                    </div>
                                    {item.subAreas && item.subAreas.length > 0 && (
                                      <div className="flex flex-wrap gap-1 pt-1">
                                        {item.subAreas.map((sub: string, sIdx: number) => (
                                          <span key={`sub-idx-${sIdx}`} className="text-[8px] bg-white/5 text-gray-400 px-1.5 py-0.5 rounded font-medium">
                                            {sub}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div>
                          {loadingCatalog ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-3">
                          <Loader2 size={32} className="animate-spin text-dragon-cyan" />
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading catalog...</p>
                        </div>
                      ) : totalItemsCount === 0 ? (
                        <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-2xl">
                          <ShoppingBag size={48} className="mx-auto text-gray-700 mb-4" />
                          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">No products added in this member's catalog.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1.5 sm:gap-4">
                          {displayedCatalogItems.map((item, idx) => (
                            <div key={`viewing-item-${item.id}-${idx}`} className="p-1.5 sm:p-4 bg-white/[0.02] border border-white/5 hover:border-dragon-cyan/40 hover:shadow-[0_0_20px_rgba(0,242,254,0.12)] rounded-xl sm:rounded-2xl flex flex-col justify-between gap-2 sm:gap-4 hover:bg-white/[0.05] hover:-translate-y-1 transition-all duration-300 group animate-[fadeIn_0.3s_ease_out]">
                              <div className="space-y-1.5 sm:space-y-3">
                                <div className="relative w-full aspect-square bg-white/5 rounded-lg sm:rounded-xl overflow-hidden flex items-center justify-center border border-white/5 shadow-inner">
                                  {item.image ? (
                                    <img 
                                      src={item.image || null} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                      alt="" 
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <ShoppingBag className="text-white/20" size={24} />
                                  )}

                                  {idx % 3 === 0 && (
                                    <span className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-gradient-to-r from-dragon-cyan to-dragon-purple text-dragon-black text-[5px] sm:text-[7px] font-black uppercase tracking-widest px-1 sm:px-1.5 py-0.5 rounded shadow-lg">
                                      PREMIUM
                                    </span>
                                  )}

                                  {/* Star Rating Badge */}
                                  <div className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded-md flex items-center gap-0.5 text-amber-400 text-[6.5px] sm:text-[8.5px] font-black border border-white/5 shadow-md">
                                    <Star size={8} fill="currentColor" className="text-amber-400 shrink-0" />
                                    {(4.7 + (idx % 4) * 0.1).toFixed(1)}
                                  </div>
                                </div>
                                
                                <div className="space-y-0.5 sm:space-y-1 text-left">
                                  <h4 className="font-extrabold text-white text-[10px] sm:text-xs truncate uppercase tracking-tight group-hover:text-dragon-cyan transition-colors" title={item.name}>
                                    {item.name}
                                  </h4>
                                  <p className="text-[7.5px] sm:text-[8.5px] text-gray-500 font-bold tracking-tight uppercase line-clamp-1">{item.category || 'General'}</p>
                                  
                                  {/* Trust Badge and sales metric */}
                                  <div className="flex items-center gap-1 text-[7.5px] sm:text-[8.5px] text-gray-400 font-medium pt-0.5">
                                    <span className="text-emerald-400 font-black flex items-center gap-0.5">
                                      <CheckCircle size={8} className="text-emerald-400" /> Secure
                                    </span>
                                    <span>•</span>
                                    <span>{14 + (idx * 6)} Sold</span>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-1.5 sm:space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 border-t border-white/5 pt-1.5 sm:pt-2">
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-[10px] sm:text-xs font-black uppercase text-dragon-cyan tracking-wider font-mono">
                                      {item.sellPrice || 0} ৳
                                    </span>
                                    <span className="text-gray-500 line-through text-[8px] sm:text-[10px] font-mono">
                                      ৳{Math.round((item.sellPrice || 0) * 1.35)}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setProductToSync(item);
                                    setSyncSelectedCategory(''); // Reset selection
                                    setShowSyncCategoryModal(true);
                                  }}
                                  className="w-full py-1.5 sm:py-2 bg-dragon-cyan hover:bg-[#00e1ec] text-dragon-black font-black text-[8px] sm:text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer hover:scale-[1.02] shadow-[0_0_12px_rgba(0,242,254,0.15)]"
                                >
                                  <Plus size={10} /> Add to Inventory
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Pagination Controls */}
                    {!loadingCatalog && totalPages > 1 && (
                      <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between gap-4">
                        <button
                          onClick={() => setCatalogPage(prev => Math.max(1, prev - 1))}
                          disabled={catalogPage === 1}
                          className="px-4 py-2 text-[10px] font-black uppercase tracking-wider bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 hover:text-white text-gray-400 rounded-xl transition-all flex items-center gap-1.5 border border-white/5"
                        >
                          <ChevronLeft size={14} />
                          Previous
                        </button>
                        
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans">
                          Page <span className="text-dragon-cyan font-black">{catalogPage}</span> of <span className="text-white font-black">{totalPages}</span>
                        </span>

                        <button
                          onClick={() => setCatalogPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={catalogPage === totalPages}
                          className="px-4 py-2 text-[10px] font-black uppercase tracking-wider bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 hover:text-white text-gray-400 rounded-xl transition-all flex items-center gap-1.5 border border-white/5"
                        >
                          Next
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    )}
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })()}
          </div>
        )}
      </AnimatePresence>

    </>
  );
}
