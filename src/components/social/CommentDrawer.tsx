import React from 'react';
import { 
  X, 
  AlertTriangle, 
  Loader2 
} from 'lucide-react';
import { formatDate, cn } from '../../lib/utils';
import { motion } from 'framer-motion';

export interface CommentDrawerProps {
  postId: string;
  comments: any[];
  highlightedUserId: string | null;
  replyingTo: Record<string, { commentId: string; userName: string } | null>;
  setReplyingTo: React.Dispatch<React.SetStateAction<Record<string, { commentId: string; userName: string } | null>>>;
  commentInputs: Record<string, string>;
  setCommentInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  commentModerationErrors: Record<string, string>;
  setCommentModerationErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  commentLoading: Record<string, boolean>;
  handleSendComment: (postId: string) => Promise<void>;
  setSelectedUserForProfileModal: React.Dispatch<React.SetStateAction<{ uid: string; name: string; profileImage: string | null } | null>>;
}

export const CommentDrawer: React.FC<CommentDrawerProps> = ({
  postId,
  comments,
  highlightedUserId,
  replyingTo,
  setReplyingTo,
  commentInputs,
  setCommentInputs,
  commentModerationErrors,
  setCommentModerationErrors,
  commentLoading,
  handleSendComment,
  setSelectedUserForProfileModal,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="px-5 pb-5 pt-3 border-t border-white/5 space-y-4 bg-black/10 overflow-hidden"
    >
      {comments.length > 0 ? (
        <div className="space-y-3.5 pr-1 max-h-[300px] overflow-y-auto custom-scrollbar">
          {comments.filter(c => !c.parentId).map((comment, idx) => {
            const replies = comments.filter(r => r.parentId === comment.id);

            return (
              <div key={`comment-${comment.id}-${idx}`} className="space-y-2">
                {/* Parent Comment */}
                <div className={cn(
                  "text-xs text-secondary-300 font-sans leading-relaxed flex items-start gap-2.5 p-2 rounded-xl transition-all duration-500",
                  comment.userId === highlightedUserId 
                    ? "bg-dragon-cyan/15 border border-dragon-cyan/40 shadow-[0_0_15px_rgba(0,242,254,0.35)] scale-[1.01] animate-pulse ring-1 ring-dragon-cyan/20 text-white font-semibold" 
                    : "border border-transparent"
                )}>
                  {comment.userProfileImage ? (
                    <img 
                      src={comment.userProfileImage || null} 
                      className="w-6 h-6 rounded-lg object-cover bg-white/10 shrink-0 cursor-pointer hover:opacity-85 transition-all" 
                      alt="" 
                      referrerPolicy="no-referrer" 
                      onClick={() => setSelectedUserForProfileModal({ uid: comment.userId, name: comment.userName, profileImage: comment.userProfileImage || null })}
                    />
                  ) : (
                    <div 
                      className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-[9px] text-gray-400 shrink-0 select-none cursor-pointer hover:bg-white/10 transition-colors"
                      onClick={() => setSelectedUserForProfileModal({ uid: comment.userId, name: comment.userName, profileImage: null })}
                    >
                      {comment.userName[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span 
                        className="font-bold text-white hover:underline cursor-pointer"
                        onClick={() => setSelectedUserForProfileModal({ uid: comment.userId, name: comment.userName, profileImage: comment.userProfileImage || null })}
                      >
                        {comment.userName}
                      </span>
                      <span className="text-[7.5px] text-gray-600 font-bold uppercase">{comment.createdAt ? formatDate(comment.createdAt) : ''}</span>
                    </div>
                    <p className="text-gray-300 mt-0.5 break-all">{comment.text}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingTo(prev => ({
                            ...prev,
                            [postId]: { commentId: comment.id, userName: comment.userName }
                          }));
                        }}
                        className="text-[8px] font-black text-dragon-cyan uppercase tracking-widest hover:underline cursor-pointer"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                </div>

                {/* Replies under this Parent Comment */}
                {replies.length > 0 && (
                  <div className="pl-8 border-l border-white/5 space-y-2.5 ml-3">
                    {replies.map((reply, ridx) => (
                      <div key={`reply-${reply.id}-${ridx}`} className={cn(
                        "text-xs text-gray-400 font-sans leading-relaxed flex items-start gap-2 p-1.5 rounded-lg transition-all duration-500",
                        reply.userId === highlightedUserId 
                          ? "bg-dragon-cyan/15 border border-dragon-cyan/40 shadow-[0_0_15px_rgba(0,242,254,0.35)] scale-[1.01] animate-pulse ring-1 ring-dragon-cyan/20 text-white font-semibold" 
                          : "border border-transparent"
                      )}>
                        {reply.userProfileImage ? (
                          <img 
                            src={reply.userProfileImage || null} 
                            className="w-5 h-5 rounded-lg object-cover bg-white/10 shrink-0 cursor-pointer hover:opacity-85 transition-all" 
                            alt="" 
                            referrerPolicy="no-referrer" 
                            onClick={() => setSelectedUserForProfileModal({ uid: reply.userId, name: reply.userName, profileImage: reply.userProfileImage || null })}
                          />
                        ) : (
                          <div 
                            className="w-5 h-5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-[8px] text-gray-400 shrink-0 select-none cursor-pointer hover:bg-white/10 transition-colors"
                            onClick={() => setSelectedUserForProfileModal({ uid: reply.userId, name: reply.userName, profileImage: null })}
                          >
                            {reply.userName[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span 
                              className="font-semibold text-white hover:underline cursor-pointer"
                              onClick={() => setSelectedUserForProfileModal({ uid: reply.userId, name: reply.userName, profileImage: reply.userProfileImage || null })}
                            >
                              {reply.userName}
                            </span>
                            <span className="text-[7px] text-gray-600 font-bold uppercase">{reply.createdAt ? formatDate(reply.createdAt) : ''}</span>
                          </div>
                          <p className="text-gray-300 mt-0.5 break-all">{reply.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-[10px] text-gray-500 text-center py-2 uppercase font-black tracking-widest select-none">No comments yet. Be the first to comment!</p>
      )}

      {/* Replying Banner */}
      {replyingTo[postId] && (
        <div className="flex items-center justify-between bg-dragon-cyan/10 border border-dragon-cyan/20 px-3 py-1.5 rounded-xl text-[9px] font-bold text-dragon-cyan animate-in fade-in zoom-in-95 duration-150">
          <span>Replying to @{replyingTo[postId]?.userName}'s comment...</span>
          <button
            type="button"
            onClick={() => setReplyingTo(prev => ({ ...prev, [postId]: null }))}
            className="text-gray-400 hover:text-white"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Comments moderation error alert */}
      {commentModerationErrors[postId] && (
        <div className="text-[8px] font-black uppercase text-red-400 bg-red-500/10 p-2 rounded-lg flex items-center gap-1.5">
          <AlertTriangle size={12} />
          {commentModerationErrors[postId]}
        </div>
      )}

      {/* Input Box for posting comments */}
      <div className="flex items-center gap-3 pt-3 border-t border-white/5">
        <div className="flex-1 flex items-center bg-zinc-950/60 border border-white/10 rounded-2xl px-4 py-1.5 focus-within:border-dragon-cyan/40 transition-colors">
          <input
            type="text"
            placeholder={replyingTo[postId] ? `Reply to @${replyingTo[postId]?.userName}...` : "Write a comment..."}
            value={commentInputs[postId] || ''}
            onChange={(e) => {
              const v = e.target.value;
              setCommentInputs(prev => ({ ...prev, [postId]: v }));
              if (commentModerationErrors[postId]) {
                setCommentModerationErrors(prev => ({ ...prev, [postId]: '' }));
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendComment(postId);
            }}
            className="bg-transparent border-0 text-xs text-white placeholder-zinc-600 py-1 px-0 outline-none focus:ring-0 w-full font-sans"
          />
        </div>
        <button
          onClick={() => handleSendComment(postId)}
          disabled={commentLoading[postId] || !commentInputs[postId]?.trim()}
          className="px-4 py-2 bg-dragon-cyan/10 hover:bg-dragon-cyan hover:text-dragon-black border border-dragon-cyan/20 rounded-xl disabled:opacity-40 font-black text-[9.5px] uppercase tracking-widest shrink-0 transition-all text-dragon-cyan cursor-pointer"
        >
          {commentLoading[postId] ? <Loader2 size={12} className="animate-spin" /> : 'Comment'}
        </button>
      </div>
    </motion.div>
  );
};
