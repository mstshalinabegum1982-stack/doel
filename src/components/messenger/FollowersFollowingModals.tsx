import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface FollowersModalProps {
  show?: boolean;
  showFollowersModal?: boolean;
  onClose: () => void;
  followersList: any[];
  followingList: any[];
  onSelectUser: (user: any) => void;
  onFollowToggle: (user: any) => void;
}

export const FollowersModal: React.FC<FollowersModalProps> = ({
  show,
  showFollowersModal,
  onClose,
  followersList,
  followingList,
  onSelectUser,
  onFollowToggle,
}) => {
  const isShow = Boolean(show || showFollowersModal);

  return (
    <AnimatePresence>
      {isShow && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md no-print">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-md bg-[#0b0c10] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[85vh]"
          >
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-zinc-950/70">
              <div>
                <h3 className="font-display font-black text-xs uppercase tracking-wider text-dragon-cyan">Your Followers</h3>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                  People who follow you ({followersList.length})
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {followersList.length === 0 ? (
                <div className="py-12 text-center text-gray-500 text-xs italic">
                  👋 No followers yet. Keep publishing posts to grow your audience!
                </div>
              ) : (
                followersList.map((follower, idx) => {
                  const followerUid = follower.followerId || follower.uid;
                  const followerName = follower.followerName || follower.name;
                  const followerImg = follower.followerImage || follower.profileImage || null;
                  const isFollowingBack = followingList.some((f) => (f.followingId || f.uid) === followerUid);

                  return (
                    <div
                      key={`follower-${follower.id || followerUid || idx}-${idx}`}
                      className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-2xl hover:border-white/10 transition-all"
                    >
                      <div
                        className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                        onClick={() => {
                          onClose();
                          onSelectUser({
                            uid: followerUid,
                            name: followerName,
                            profileImage: followerImg,
                            followerId: followerUid,
                            followerName: followerName,
                            followerImage: followerImg
                          });
                        }}
                      >
                        {followerImg ? (
                          <img
                            src={followerImg}
                            className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0"
                            alt=""
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-dragon-cyan/10 border border-dragon-cyan/20 flex items-center justify-center font-bold text-xs text-dragon-cyan shrink-0">
                            {followerName?.[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                        <div className="truncate">
                          <p className="text-xs font-black text-white truncate hover:text-dragon-cyan transition-colors">
                            {followerName}
                          </p>
                          <p className="text-[8px] text-gray-500 font-mono mt-0.5">MEMBER PROFILE</p>
                        </div>
                      </div>

                      <div>
                        {!isFollowingBack ? (
                          <button
                            type="button"
                            onClick={() =>
                              onFollowToggle({
                                uid: followerUid,
                                name: followerName,
                                profileImage: followerImg,
                              })
                            }
                            className="px-3 py-1.5 bg-dragon-cyan hover:bg-dragon-cyan/80 text-dragon-black font-sans font-black text-[9px] uppercase tracking-wider rounded-lg transition-all"
                          >
                            Follow Back
                          </button>
                        ) : (
                          <span className="text-[8px] font-black uppercase tracking-wider px-2 py-1 bg-white/5 text-gray-400 rounded-lg border border-white/5">
                            Mutual Friend
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

interface FollowingModalProps {
  show?: boolean;
  showFollowingModal?: boolean;
  onClose: () => void;
  followingList: any[];
  onSelectUser: (user: any) => void;
  onFollowToggle: (user: any) => void;
}

export const FollowingModal: React.FC<FollowingModalProps> = ({
  show,
  showFollowingModal,
  onClose,
  followingList,
  onSelectUser,
  onFollowToggle,
}) => {
  const isShow = Boolean(show || showFollowingModal);

  return (
    <AnimatePresence>
      {isShow && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md no-print">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-md bg-[#0b0c10] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[85vh]"
          >
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-zinc-950/70">
              <div>
                <h3 className="font-display font-black text-xs uppercase tracking-wider text-dragon-cyan">Your Following</h3>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                  Accounts you are following ({followingList.length})
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {followingList.length === 0 ? (
                <div className="py-12 text-center text-gray-500 text-xs italic">
                  👀 You aren't following anyone yet. Explore posts to discover creators!
                </div>
              ) : (
                followingList.map((following, idx) => {
                  const followingUid = following.followingId || following.uid;
                  const followingName = following.followingName || following.name;
                  const followingImg = following.followingImage || following.profileImage || null;

                  return (
                    <div
                      key={`following-${following.id || followingUid || idx}-${idx}`}
                      className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-2xl hover:border-white/10 transition-all"
                    >
                      <div
                        className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                        onClick={() => {
                          onClose();
                          onSelectUser({
                            uid: followingUid,
                            name: followingName,
                            profileImage: followingImg,
                            followingId: followingUid,
                            followingName: followingName,
                            followingImage: followingImg
                          });
                        }}
                      >
                        {followingImg ? (
                          <img
                            src={followingImg}
                            className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0"
                            alt=""
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-dragon-cyan/10 border border-dragon-cyan/20 flex items-center justify-center font-bold text-xs text-dragon-cyan shrink-0">
                            {followingName?.[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                        <div className="truncate">
                          <p className="text-xs font-black text-white truncate hover:text-dragon-cyan transition-colors">
                            {followingName}
                          </p>
                          <p className="text-[8px] text-gray-500 font-mono mt-0.5">MEMBER PROFILE</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          onFollowToggle({
                            uid: followingUid,
                            name: followingName,
                            profileImage: followingImg,
                          })
                        }
                        className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-sans font-black text-[9px] uppercase tracking-wider rounded-lg transition-all"
                      >
                        Unfollow
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
