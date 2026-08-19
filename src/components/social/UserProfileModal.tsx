import React from 'react';
import { 
  ArrowLeft, 
  MessageCircle, 
  Check, 
  UserCheck, 
  UserMinus, 
  UserPlus, 
  MessageSquare 
} from 'lucide-react';
import { formatDate, cn } from '../../lib/utils';
import { AnimatePresence } from 'framer-motion';
import { POST_BACKGROUND_THEMES, PostThemeVectorOverlay } from './PostThemeUtils';

export interface UserProfileModalProps {
  selectedUserForProfileModal: { uid: string; name: string; profileImage: string | null } | null;
  setSelectedUserForProfileModal: React.Dispatch<React.SetStateAction<{ uid: string; name: string; profileImage: string | null } | null>>;
  selectedUserProfileData: any;
  user: any;
  followingList: any[];
  followersList: any[];
  inspectedFollowersCount: number;
  inspectedFollowingCount: number;
  communityPosts: any[];
  handleFollowToggle: (targetUser: { uid: string; name: string; profileImage: string | null }) => Promise<void>;
  navigate: any;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  selectedUserForProfileModal,
  setSelectedUserForProfileModal,
  selectedUserProfileData,
  user,
  followingList,
  followersList,
  inspectedFollowersCount,
  inspectedFollowingCount,
  communityPosts,
  handleFollowToggle,
  navigate,
}) => {
  if (!selectedUserForProfileModal) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-55 bg-[#0b0c10] flex flex-col no-print overflow-y-auto animate-fade-in text-white scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {/* Header Sticky Navigation Bar */}
        <div className="sticky top-0 z-50 bg-[#0f1118]/90 backdrop-blur-md border-b border-white/5 px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedUserForProfileModal(null)}
              className="p-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft size={16} /> Go Back
            </button>
            <div className="hidden sm:block">
              <h2 className="text-sm font-black text-white leading-none">
                {selectedUserProfileData?.name || selectedUserForProfileModal.name}'s Profile
              </h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Facebook-Style Community Wall</p>
            </div>
          </div>

          {/* Direct Messenger Inbox Link from Sticky Header */}
          {selectedUserForProfileModal.uid !== user?.uid && (() => {
            const targetUid = selectedUserForProfileModal.uid;
            const isFollowingThisUser = followingList.some(f => f.followingId === targetUid);
            const isTargetFollowingUs = followersList.some(f => f.followerId === targetUid);
            const isMutual = isFollowingThisUser && isTargetFollowingUs;

            if (isMutual) {
              return (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUserForProfileModal(null);
                    navigate(`/chat/new_${targetUid}`, { state: { otherUser: selectedUserForProfileModal } });
                  }}
                  className="px-4 py-2 bg-dragon-emerald hover:bg-dragon-emerald/80 text-dragon-black font-sans font-black text-[11px] sm:text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-dragon-emerald/20 hover:scale-105 duration-150"
                >
                  <MessageCircle size={14} className="shrink-0" /> Send Message
                </button>
              );
            }
            return null;
          })()}
        </div>

        {/* Immersive Profile Hero Section */}
        <div className="relative w-full max-w-6xl mx-auto px-0 sm:px-4 shrink-0">
          <div 
            className="h-44 sm:h-64 w-full relative overflow-hidden sm:rounded-b-3xl border-b border-white/5 flex items-end justify-between p-6 bg-cover bg-center"
            style={{
              backgroundImage: selectedUserProfileData?.coverImage 
                ? `url(${selectedUserProfileData.coverImage})` 
                : "linear-gradient(to right, rgba(49, 46, 129, 0.6), rgba(88, 28, 135, 0.4), rgba(8, 79, 94, 0.5))"
            }}
          >
            {!selectedUserProfileData?.coverImage && (
              <>
                <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
                <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-dragon-cyan/10 blur-3xl" />
                <div className="absolute -bottom-12 -right-12 w-64 h-64 rounded-full bg-purple-600/15 blur-3xl" />
              </>
            )}
          </div>

          <div className="px-6 pb-6 pt-2 flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-[-40px] sm:mt-[-60px] relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 text-center sm:text-left">
              <div className="relative mx-auto sm:mx-0 shrink-0">
                {(selectedUserProfileData?.profileImage || selectedUserForProfileModal.profileImage) ? (
                  <img
                    src={selectedUserProfileData?.profileImage || selectedUserForProfileModal.profileImage || undefined}
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-[#0b0c10] bg-zinc-950 shadow-2xl"
                    alt=""
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-tr from-dragon-cyan/10 to-purple-500/10 border-4 border-[#0b0c10] flex items-center justify-center font-black text-4xl text-dragon-cyan shadow-2xl">
                    {selectedUserForProfileModal.name?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <div className="absolute bottom-1 right-1 p-2 bg-dragon-cyan text-dragon-black rounded-full shadow-lg border-2 border-[#0b0c10]" title="Verified Professional Member">
                  <Check size={14} strokeWidth={4} />
                </div>
              </div>

              <div className="space-y-1.5 pb-2">
                <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center justify-center sm:justify-start gap-2.5 font-sans">
                  {selectedUserProfileData?.storeName || selectedUserProfileData?.businessName || selectedUserProfileData?.name || selectedUserForProfileModal.name}
                </h1>
                
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-0.5">
                  {(selectedUserProfileData?.storeName || selectedUserProfileData?.businessName) && (
                    <span className="text-xs text-dragon-cyan font-black uppercase tracking-wider bg-dragon-cyan/5 px-3 py-1 rounded-full border border-dragon-cyan/10 flex items-center gap-1.5">
                      🏢 {selectedUserProfileData.storeName || selectedUserProfileData.businessName}
                    </span>
                  )}
                  
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest leading-none ring-1",
                    (selectedUserProfileData?.role || 'supplier') === 'supplier'
                      ? "bg-dragon-cyan/5 text-dragon-cyan ring-dragon-cyan/15"
                      : "bg-purple-500/5 text-purple-400 ring-purple-500/15"
                  )}>
                    {(selectedUserProfileData?.role || 'supplier') === 'supplier' ? '👑 Supplier User' : '🛒 Seller Partner'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 justify-center sm:justify-end pb-2 flex-wrap">
              {selectedUserForProfileModal.uid !== user?.uid && (() => {
                const targetUid = selectedUserForProfileModal.uid;
                const isFollowingThisUser = followingList.some(f => f.followingId === targetUid);
                const isTargetFollowingUs = followersList.some(f => f.followerId === targetUid);
                const isMutual = isFollowingThisUser && isTargetFollowingUs;

                return (
                  <div className="flex gap-2.5 flex-wrap">
                    {isFollowingThisUser ? (
                      <button
                        type="button"
                        onClick={() => handleFollowToggle(selectedUserForProfileModal)}
                        className="px-5 py-3 bg-zinc-800 hover:bg-zinc-700 text-dragon-cyan hover:text-red-400 font-sans font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all border border-dragon-cyan/20 shadow-md group shrink-0"
                      >
                        <UserCheck size={14} className="group-hover:hidden" />
                        <UserMinus size={14} className="hidden group-hover:inline text-red-400" />
                        <span className="group-hover:hidden">Following</span>
                        <span className="hidden group-hover:inline text-red-400">Unfollow</span>
                      </button>
                    ) : isTargetFollowingUs ? (
                      <button
                        type="button"
                        onClick={() => handleFollowToggle(selectedUserForProfileModal)}
                        className="px-5 py-3 bg-dragon-cyan hover:bg-dragon-cyan/80 text-dragon-black font-sans font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg shadow-dragon-cyan/20 shrink-0 animate-bounce"
                      >
                        <UserPlus size={14} /> Follow Back (Accept)
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleFollowToggle(selectedUserForProfileModal)}
                        className="px-5 py-3 bg-dragon-cyan hover:bg-dragon-cyan/80 text-dragon-black font-sans font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg shadow-dragon-cyan/20 shrink-0"
                      >
                        <UserPlus size={14} /> Follow
                      </button>
                    )}

                    {isMutual && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUserForProfileModal(null);
                          navigate(`/chat/new_${targetUid}`, { state: { otherUser: selectedUserForProfileModal } });
                        }}
                        className="px-5 py-3 bg-dragon-emerald hover:bg-dragon-emerald/80 text-dragon-black font-sans font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg shadow-dragon-emerald/20 hover:scale-105 duration-150"
                      >
                        <MessageSquare size={14} /> Send Message
                      </button>
                    )}
                  </div>
                );
              })()}

              <button
                onClick={() => setSelectedUserForProfileModal(null)}
                className="px-5 py-3 bg-zinc-900 hover:bg-zinc-800 text-gray-300 font-sans font-extrabold text-xs uppercase tracking-wider rounded-xl border border-white/5 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                Back to Feed
              </button>
            </div>
          </div>
        </div>

        {/* Structured Page Body Layout */}
        <div className="w-full max-w-6xl mx-auto px-4 pb-16 grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">
          <div className="md:col-span-4 space-y-6">
            <div className="bg-[#0f1118]/90 border border-white/5 rounded-3xl p-6 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5 border-b border-white/5 pb-2">
                👥 Network Connections
              </h3>
              <div className="grid grid-cols-2 gap-4 py-2 text-center font-sans">
                <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-2xl font-black text-white">{inspectedFollowersCount}</p>
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Followers</p>
                </div>
                <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-2xl font-black text-white">{inspectedFollowingCount}</p>
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Following</p>
                </div>
              </div>
              <p className="text-[9px] text-gray-500 text-center italic font-sans leading-relaxed">
                🔒 Only {selectedUserProfileData?.name || selectedUserForProfileModal.name} can view their active follower lists.
              </p>
            </div>

            <div className="bg-[#0f1118]/90 border border-white/5 rounded-3xl p-6 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                💡 Intro Profile
              </h3>

              <div className="space-y-3 pt-2 font-sans">
                <div className="flex items-center gap-2.5 text-xs text-gray-300">
                  <span className="text-lg">📧</span>
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase leading-none">Gmail Address</p>
                    <p className="font-semibold text-white break-all select-all mt-1">{selectedUserProfileData?.email || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-xs text-gray-300 border-t border-white/5 pt-3">
                  <span className="text-lg">📈</span>
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase leading-none">Total Activity</p>
                    <p className="font-bold text-dragon-cyan mt-1">
                      {communityPosts.filter(p => p.userId === selectedUserForProfileModal.uid).length} Posts Published
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-xs text-gray-300 border-t border-white/5 pt-3">
                  <span className="text-lg">🛡️</span>
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase leading-none">Verification Info</p>
                    <p className="font-bold text-green-400 mt-1">✓ Active Professional member</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#0f1118]/90 border border-white/5 rounded-3xl p-6">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-2">
                📝 About / Bio
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed font-sans italic">
                {selectedUserProfileData?.businessDescription || "No biography setup has been written by this user yet."}
              </p>
            </div>
          </div>

          <div className="md:col-span-8 space-y-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-dragon-cyan flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-dragon-cyan/20 ring-4 ring-dragon-cyan/5 border border-dragon-cyan/20" />
                User Activity Timeline
              </h3>
              <span className="text-[10px] text-gray-500 font-bold uppercase">
                Chronological order
              </span>
            </div>

            <div className="space-y-5">
              {(() => {
                const userPosts = communityPosts.filter(p => p.userId === selectedUserForProfileModal.uid);
                if (userPosts.length === 0) {
                  return (
                    <div className="py-16 text-center text-gray-500 text-xs italic bg-[#0f1118]/50 rounded-3xl border border-dashed border-white/5 px-6">
                      👋 This user has not shared any posts yet.
                    </div>
                  );
                }
                return userPosts.map((post, pIdx) => (
                  <div key={`modal-post-${post.id}-${pIdx}`} className="bg-[#0f1118]/90 border border-white/5 rounded-3xl overflow-hidden hover:border-white/10 transition-all shadow-xl">
                    <div className="px-5 py-4 flex items-center justify-between border-b border-white/5 bg-zinc-950/20">
                      <div className="flex items-center gap-3">
                        {selectedUserForProfileModal.profileImage ? (
                          <img src={selectedUserForProfileModal.profileImage || null} className="w-8 h-8 rounded-full object-cover border border-white/10" alt="" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-dragon-cyan/10 border border-dragon-cyan/20 flex items-center justify-center font-bold text-[10px] text-dragon-cyan">
                            {selectedUserForProfileModal.name?.[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-black text-white">{selectedUserProfileData?.name || selectedUserForProfileModal.name}</p>
                          <p className="text-[8.5px] text-gray-500 font-bold uppercase mt-0.5">{post.createdAt ? formatDate(post.createdAt) : ''}</p>
                        </div>
                      </div>

                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider",
                        post.role === 'supplier' ? 'bg-dragon-cyan/10 text-dragon-cyan border border-dragon-cyan/15' : 'bg-purple-500/10 text-purple-400 border border-purple-500/15'
                      )}>
                        {post.role === 'supplier' ? 'Supplier Offer' : 'Seller Demand'}
                      </span>
                    </div>

                    <div className={cn(!post.bgTheme ? "p-6 space-y-4" : "p-0 space-y-0")}>
                      {post.bgTheme && POST_BACKGROUND_THEMES.find(t => t.id === post.bgTheme && t.id !== 'none') ? (
                        (() => {
                          const theme = POST_BACKGROUND_THEMES.find(t => t.id === post.bgTheme);
                          return (
                            <div className={cn("px-6 py-12 border-y border-white/10 flex items-center justify-center min-h-[180px] sm:min-h-[220px] w-full relative shadow-inner text-center my-0 overflow-hidden", theme?.bgClass)}>
                              <PostThemeVectorOverlay themeId={post.bgTheme || ''} />
                              <p 
                                className="text-base sm:text-xl font-black leading-snug text-center font-sans whitespace-pre-wrap max-w-lg drop-shadow-md select-all text-white relative z-10"
                                style={{ color: post.textColor || '#FFFFFF' }}
                              >
                                {post.text}
                              </p>
                            </div>
                          );
                        })()
                      ) : (
                        post.text && (
                          <p className="text-xs sm:text-sm text-gray-200 leading-relaxed font-sans whitespace-pre-wrap select-text">
                            {post.text}
                          </p>
                        )
                      )}

                      {post.image && (
                        <div className="w-full overflow-hidden rounded-2xl border border-white/5 bg-zinc-950/80 max-h-[350px] flex items-center justify-center">
                          <img src={post.image} className="w-full h-full object-contain" alt="" referrerPolicy="no-referrer" />
                        </div>
                      )}
                    </div>

                    <div className="px-6 py-3 border-t border-white/5 bg-white/[0.01] flex items-center justify-between text-[10px] text-gray-500 font-bold">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Professional Community Post
                      </span>
                      <span className="text-[9px] text-dragon-cyan tracking-widest uppercase font-mono">
                        ACTIVE
                      </span>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};
