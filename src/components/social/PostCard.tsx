import React from 'react';
import { 
  Check, 
  FileText, 
  Trash2, 
  ArrowUpRight, 
  Heart, 
  MessageSquare, 
  Bookmark 
} from 'lucide-react';
import { formatDate, cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PRODUCT_CATEGORIES, 
  POST_BACKGROUND_THEMES, 
  PostThemeVectorOverlay, 
  ExpandablePostText 
} from './PostThemeUtils';
import { CommentDrawer } from './CommentDrawer';

export interface PostCardProps {
  post: any;
  idx?: number;
  user: any;
  currentUserProfile: any;
  profilesCache: Record<string, any>;
  sentRequests: any[];
  receivedRequests: any[];
  activePostComments: Record<string, any[]>;
  favoritePostIds: string[];
  expandedComments: Record<string, boolean>;
  setExpandedComments: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  editingPostId: string | null;
  setEditingPostId: React.Dispatch<React.SetStateAction<string | null>>;
  editingPostText: string;
  setEditingPostText: React.Dispatch<React.SetStateAction<string>>;
  editingPostRole: 'supplier' | 'seller';
  setEditingPostRole: React.Dispatch<React.SetStateAction<'supplier' | 'seller'>>;
  editingPostCategory: string;
  setEditingPostCategory: React.Dispatch<React.SetStateAction<string>>;
  isSavingEdit: boolean;
  handleToggleLike: (post: any) => Promise<void>;
  handleToggleFavorite: (postId: string) => Promise<void>;
  handleStartEditPost: (post: any) => void;
  handleSaveEditPost: () => Promise<void>;
  handleDeletePost: (postId: string) => void;
  handleSendCollabRequest: (post: any) => Promise<void>;
  handleSendComment: (postId: string) => Promise<void>;
  setSelectedUserForProfileModal: React.Dispatch<React.SetStateAction<{ uid: string; name: string; profileImage: string | null } | null>>;
  setSocialSubTab: (tab: any) => void;
  setSocialSearchQuery: (q: string) => void;
  highlightedUserId: string | null;
  replyingTo: Record<string, { commentId: string; userName: string } | null>;
  setReplyingTo: React.Dispatch<React.SetStateAction<Record<string, { commentId: string; userName: string } | null>>>;
  commentInputs: Record<string, string>;
  setCommentInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  commentModerationErrors: Record<string, string>;
  setCommentModerationErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  commentLoading: Record<string, boolean>;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  idx = 0,
  user,
  currentUserProfile,
  profilesCache,
  sentRequests,
  receivedRequests,
  activePostComments,
  favoritePostIds,
  expandedComments,
  setExpandedComments,
  editingPostId,
  setEditingPostId,
  editingPostText,
  setEditingPostText,
  editingPostRole,
  setEditingPostRole,
  editingPostCategory,
  setEditingPostCategory,
  isSavingEdit,
  handleToggleLike,
  handleToggleFavorite,
  handleStartEditPost,
  handleSaveEditPost,
  handleDeletePost,
  handleSendCollabRequest,
  handleSendComment,
  setSelectedUserForProfileModal,
  setSocialSubTab,
  setSocialSearchQuery,
  highlightedUserId,
  replyingTo,
  setReplyingTo,
  commentInputs,
  setCommentInputs,
  commentModerationErrors,
  setCommentModerationErrors,
  commentLoading,
}) => {
  const comments = activePostComments[post.id] || [];
  const hasLiked = post.likes?.includes(user?.uid);
  const isOwnPost = post.userId === user?.uid;

  const sentReq = sentRequests.find(r => r.postId === post.id);
  const receivedReq = receivedRequests.find(r => r.postId === post.id);

  const postCategoryObj = PRODUCT_CATEGORIES.find(c => c.id === post.category);
  const postCategoryLabel = postCategoryObj ? postCategoryObj.label : 'Other';
  const liveAuthorImg = (post.userId === user?.uid ? currentUserProfile?.profileImage : profilesCache[post.userId]?.profileImage) || post.userProfileImage || null;

  return (
    <motion.div 
      key={`post-${post.id}-${idx}`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0f1118]/90 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden shadow-2xl hover:shadow-cyan-950/10 transition-all duration-300 relative w-full pb-5 hover:border-white/10"
    >
      {/* Top Profile Header Bar */}
      <div className="flex justify-between items-center px-5 py-4 border-b border-white/5 bg-zinc-950/50 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <img 
            src={liveAuthorImg || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80'} 
            className="w-9 h-9 rounded-full object-cover bg-white/10 border border-white/10 shadow-inner cursor-pointer hover:opacity-85 transition-all" 
            alt="" 
            referrerPolicy="no-referrer" 
            onClick={() => setSelectedUserForProfileModal({ uid: post.userId, name: post.userName, profileImage: liveAuthorImg })}
          />
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span 
                className="font-bold text-white text-xs tracking-tight hover:underline cursor-pointer flex items-center gap-1"
                onClick={() => setSelectedUserForProfileModal({ uid: post.userId, name: post.userName, profileImage: liveAuthorImg })}
              >
                {post.userName}
                <span className="inline-flex items-center justify-center bg-dragon-cyan/20 text-dragon-cyan p-0.5 rounded-full scale-90" title="Verified Professional Member">
                  <Check size={8} strokeWidth={4} />
                </span>
              </span>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[7.5px] font-black uppercase tracking-widest leading-none ring-1",
                post.role === 'supplier' 
                  ? "bg-dragon-cyan/10 text-dragon-cyan ring-dragon-cyan/25" 
                  : "bg-purple-500/10 text-purple-400 ring-purple-500/25"
              )}>
                {post.role === 'supplier' ? 'SUPPLIER 👑' : 'SELLER 🛒'}
              </span>
              {post.category && (
                <span className="px-2 py-0.5 rounded-full text-[7px] font-bold uppercase tracking-wider leading-none bg-zinc-900 text-zinc-400 hover:text-white border border-white/5 transition-colors">
                  {postCategoryLabel}
                </span>
              )}
            </div>
            <p className="text-[7.5px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
              {post.createdAt ? formatDate(post.createdAt) : ''}
            </p>
          </div>
        </div>

        {/* Connection Badge & Actions */}
        {!isOwnPost ? (
          <div className="shrink-0">
            {sentReq ? (
              <span className={cn(
                "px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1 leading-none shadow-md",
                sentReq.status === 'accepted' ? "bg-dragon-emerald/10 text-dragon-emerald border border-dragon-emerald/20" : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
              )}>
                {sentReq.status === 'accepted' ? (
                  <>
                    <Check size={10} />
                    CONNECTED
                  </>
                ) : (
                  'PENDING'
                )}
              </span>
            ) : receivedReq ? (
              <span className={cn(
                "px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1 leading-none shadow-md",
                receivedReq.status === 'accepted' ? "bg-dragon-emerald/10 text-dragon-emerald border border-dragon-emerald/20" : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
              )}>
                {receivedReq.status === 'accepted' ? 'MUTUAL' : 'INVITED'}
              </span>
            ) : (
              <button
                onClick={() => handleSendCollabRequest(post)}
                className="px-2.5 py-1 bg-white/5 hover:bg-dragon-cyan text-gray-400 hover:text-dragon-black border border-white/10 rounded-lg font-black text-[8px] tracking-widest uppercase transition-all flex items-center gap-0.5 active:scale-95 cursor-pointer leading-none"
              >
                <ArrowUpRight size={10} />
                CONNECT
              </button>
            )}
          </div>
        ) : (
          /* Edit / Delete Buttons for Creator */
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleStartEditPost(post)}
              className="px-2.5 py-1.5 bg-white/5 hover:bg-dragon-cyan hover:text-dragon-black border border-white/5 hover:border-dragon-cyan rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer active:scale-95 duration-200"
              title="Edit Post"
            >
              <FileText size={12} />
              Edit
            </button>
            <button
              onClick={() => handleDeletePost(post.id)}
              className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 hover:border-red-500 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer text-red-500 active:scale-95 duration-200"
              title="Delete Post"
            >
              <Trash2 size={12} />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Display Edit Form or standard content */}
      {editingPostId === post.id ? (
        <div className="p-5 bg-zinc-950/40 border-y border-white/5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold uppercase tracking-wider text-dragon-cyan block">Post Category</label>
            <select 
              value={editingPostCategory}
              onChange={(e) => setEditingPostCategory(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-dragon-cyan/50 font-bold cursor-pointer"
            >
              {PRODUCT_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
              <option value="other">Other Business Idea</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold uppercase tracking-wider text-dragon-cyan block">My Business Role</label>
            <div className="flex bg-zinc-950/80 p-1 rounded-xl border border-white/5 max-w-fit">
              <button
                type="button"
                onClick={() => setEditingPostRole('supplier')}
                className={cn(
                  "px-4 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer",
                  editingPostRole === 'supplier' ? "bg-dragon-cyan text-dragon-black shadow-lg" : "text-gray-400 hover:text-white"
                )}
              >
                Supplier
              </button>
              <button
                type="button"
                onClick={() => setEditingPostRole('seller')}
                className={cn(
                  "px-4 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer",
                  editingPostRole === 'seller' ? "bg-dragon-cyan text-dragon-black shadow-lg" : "text-gray-400 hover:text-white"
                )}
              >
                Seller
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-bold uppercase tracking-wider text-dragon-cyan block">Post Description</label>
              <span className={cn("text-[9px] font-mono font-bold", editingPostText.length >= 3900 ? "text-red-400 font-black animate-pulse" : editingPostText.length >= 3500 ? "text-amber-400" : "text-gray-400")}>
                {editingPostText.length} / 4000
              </span>
            </div>
            <textarea
              value={editingPostText}
              maxLength={4000}
              onChange={(e) => setEditingPostText(e.target.value)}
              className="w-full min-h-[100px] bg-zinc-900 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder-zinc-600 outline-none focus:border-dragon-cyan/50 transition-all font-sans resize-none"
            />
          </div>

          <div className="flex justify-end gap-2.5">
            <button
              onClick={() => setEditingPostId(null)}
              disabled={isSavingEdit}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 font-bold uppercase tracking-wider text-[9px] rounded-xl transition-all border border-white/5 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEditPost}
              disabled={isSavingEdit || !editingPostText.trim()}
              className="px-4 py-2 bg-dragon-cyan hover:bg-white text-dragon-black font-bold uppercase tracking-wider text-[9px] rounded-xl transition-all shadow-lg cursor-pointer"
            >
              {isSavingEdit ? 'Saving...' : 'Update'}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Post Attached Media Content / Text tile */}
          {post.image ? (
            <>
              {post.text && (
                <div className="px-5 pb-2 pt-1">
                  <ExpandablePostText
                    text={post.text}
                    hasImage={true}
                    onHashtagClick={(tag) => {
                      setSocialSubTab('home');
                      setSocialSearchQuery(tag);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  />
                </div>
              )}
              <div className="w-full bg-zinc-950/30 overflow-hidden flex justify-center items-center border-y border-white/5 relative aspect-square sm:aspect-[4/3] max-h-[460px] group">
                <img src={post.image} className="w-full h-full object-cover select-none group-hover:scale-102 transition-transform duration-700 ease-out" alt="" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
            </>
          ) : post.bgTheme && POST_BACKGROUND_THEMES.find(t => t.id === post.bgTheme && t.id !== 'none') ? (
            (() => {
              const theme = POST_BACKGROUND_THEMES.find(t => t.id === post.bgTheme);
              return (
                <div className={cn("px-6 py-12 border-y border-white/10 flex items-center justify-center min-h-[220px] sm:min-h-[260px] w-full relative shadow-inner text-center my-0.5 overflow-hidden", theme?.bgClass)}>
                  <PostThemeVectorOverlay themeId={post.bgTheme || ''} />
                  <ExpandablePostText
                    text={post.text}
                    hasImage={false}
                    centerText={true}
                    textStyle={{ color: post.textColor || '#FFFFFF' }}
                    className="text-base sm:text-2xl font-black leading-snug text-center font-sans max-w-lg drop-shadow-md select-all relative z-10"
                    onHashtagClick={(tag) => {
                      setSocialSubTab('home');
                      setSocialSearchQuery(tag);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  />
                </div>
              );
            })()
          ) : (
            <div className="px-6 py-6 bg-gradient-to-br from-zinc-950/70 via-zinc-900/55 to-zinc-950/70 border-y border-white/5 flex flex-col justify-center min-h-[120px] w-full relative group">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-12 bg-dragon-cyan/5 rounded-full blur-2xl opacity-50 group-hover:bg-dragon-cyan/10 transition-colors duration-300 pointer-events-none"></div>
              <ExpandablePostText
                text={post.text}
                hasImage={false}
                className="text-sm font-medium text-gray-100 leading-relaxed font-sans relative z-10 select-all selection:bg-dragon-cyan selection:text-black"
                onHashtagClick={(tag) => {
                  setSocialSubTab('home');
                  setSocialSearchQuery(tag);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
          )}

          {/* Action Icons Line */}
          <div className="flex items-center justify-between px-5 pt-2 pb-1">
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={() => handleToggleLike(post)}
                className={cn(
                  "transition-all duration-200 active:scale-75 hover:scale-110 flex items-center gap-1.5 p-1 rounded-full hover:bg-white/5 cursor-pointer",
                  hasLiked ? "text-red-500" : "text-gray-400 hover:text-red-400"
                )}
                title="Like"
              >
                <Heart size={20} className={cn(hasLiked ? "fill-red-500 text-red-500" : "text-gray-400")} />
                <span className={cn("text-xs font-bold leading-none select-none", hasLiked ? "text-red-500" : "text-gray-400")}>
                  {post.likes?.length || 0}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setExpandedComments(prev => ({ ...prev, [post.id]: !prev[post.id] }));
                }}
                className={cn(
                  "flex items-center gap-1.5 transition-all duration-200 active:scale-95 hover:scale-105 p-1 rounded-full hover:bg-white/5 cursor-pointer",
                  expandedComments[post.id] ? "text-dragon-cyan" : "text-gray-400 hover:text-white"
                )}
                title="Comments"
              >
                <MessageSquare size={20} />
                <span className="text-xs font-bold leading-none select-none">
                  {comments.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleFavorite(post.id)}
                className={cn(
                  "transition-all duration-200 active:scale-75 hover:scale-110 flex items-center gap-1.5 p-1 rounded-full hover:bg-white/5 cursor-pointer",
                  favoritePostIds.includes(post.id) ? "text-yellow-400" : "text-gray-400 hover:text-yellow-400"
                )}
                title={favoritePostIds.includes(post.id) ? "Remove from favorites" : "Add to Favorites"}
              >
                <Bookmark size={20} className={cn(favoritePostIds.includes(post.id) ? "fill-yellow-400 text-yellow-400" : "text-gray-400")} />
                <span className={cn("text-xs font-bold leading-none select-none", favoritePostIds.includes(post.id) ? "text-yellow-400" : "text-gray-400")}>
                  {post.favorites?.length || 0}
                </span>
              </button>
            </div>
          </div>

          {/* Integrated Collapsible Comments Stream */}
          <AnimatePresence>
            {expandedComments[post.id] && (
              <CommentDrawer
                postId={post.id}
                comments={comments}
                highlightedUserId={highlightedUserId}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                commentInputs={commentInputs}
                setCommentInputs={setCommentInputs}
                commentModerationErrors={commentModerationErrors}
                setCommentModerationErrors={setCommentModerationErrors}
                commentLoading={commentLoading}
                handleSendComment={handleSendComment}
                setSelectedUserForProfileModal={setSelectedUserForProfileModal}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
};
