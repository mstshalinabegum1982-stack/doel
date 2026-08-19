import React, { memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Forward, X, User } from 'lucide-react';
import { UserProfile } from '../../types';

interface SmartForwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOrderIds: string[];
  forwardConfirmUser: UserProfile | null;
  setForwardConfirmUser: (user: UserProfile | null) => void;
  handleForwardOrders: (user: UserProfile) => void;
  searchUserQuery: string;
  setSearchUserQuery: (query: string) => void;
  usersLoading: boolean;
  usersList: UserProfile[];
}

export const SmartForwardModal = memo(function SmartForwardModal({
  isOpen,
  onClose,
  selectedOrderIds,
  forwardConfirmUser,
  setForwardConfirmUser,
  handleForwardOrders,
  searchUserQuery,
  setSearchUserQuery,
  usersLoading,
  usersList
}: SmartForwardModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-md bg-dragon-black border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden font-sans"
        >
          <button 
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 text-gray-500 hover:text-white transition-all cursor-pointer z-10"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-dragon-cyan/20 text-dragon-cyan flex items-center justify-center">
              <Forward size={20} />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Smart Forward System</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                {selectedOrderIds.length} Share orders on Messenger
              </p>
            </div>
          </div>

          {forwardConfirmUser ? (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-dragon-cyan/15 text-dragon-cyan flex items-center justify-center mx-auto mb-2 animate-bounce">
                <Forward size={32} />
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider">Confirm Forward</h4>
                <p className="text-xs text-gray-400 mt-2 font-medium leading-relaxed">
                  Are you sure you want to forward <span className="text-dragon-cyan font-bold">{selectedOrderIds.length}</span> selected orders to <span className="text-white font-bold">{forwardConfirmUser.name || forwardConfirmUser.phone || 'this user'}</span>'s inbox?
                </p>
              </div>
              
              <div className="flex gap-3 justify-center">
                <button 
                  type="button"
                  onClick={() => setForwardConfirmUser(null)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  No, Cancel
                </button>
                <button 
                  type="button"
                  onClick={() => handleForwardOrders(forwardConfirmUser)}
                  className="px-6 py-2.5 bg-dragon-cyan text-dragon-black hover:brightness-110 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all shadow-md shadow-dragon-cyan/20 cursor-pointer"
                >
                  Yes, Send
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="relative mb-4">
                <input 
                  type="text"
                  placeholder="Search by name or mobile number..."
                  value={searchUserQuery}
                  onChange={(e) => setSearchUserQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-4 pr-10 outline-none focus:border-dragon-cyan/50 text-xs text-white"
                />
                <User size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" />
              </div>

              <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-2 pr-1">
                {usersLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-3">
                    <div className="w-6 h-6 border-2 border-dragon-cyan border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Loading users...</p>
                  </div>
                ) : usersList.filter(u => 
                  (u.name || '').toLowerCase().includes(searchUserQuery.toLowerCase()) || 
                  (u.phone || '').includes(searchUserQuery)
                ).length === 0 ? (
                  <div className="py-12 text-center text-gray-600 font-medium text-xs italic">
                    No users found.
                  </div>
                ) : (
                  usersList
                    .filter(u => 
                      (u.name || '').toLowerCase().includes(searchUserQuery.toLowerCase()) || 
                      (u.phone || '').includes(searchUserQuery)
                    )
                    .map((targetUser, idx) => (
                      <div 
                        key={`user-${targetUser.uid}-${idx}`} 
                        onClick={() => setForwardConfirmUser(targetUser)}
                        className="flex items-center justify-between p-3 bg-white/5 hover:bg-dragon-cyan/10 border border-white/5 hover:border-dragon-cyan/20 rounded-2xl cursor-pointer transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center text-gray-400 font-bold uppercase shrink-0">
                            {targetUser.name ? targetUser.name.substring(0, 2) : 'U'}
                          </div>
                          <div className="min-w-0 text-left">
                            <h4 className="text-xs font-black text-white truncate uppercase tracking-tight group-hover:text-dragon-cyan transition-colors">{targetUser.name || 'Anonymous User'}</h4>
                            <p className="text-[10px] text-gray-500 font-mono tracking-wider">{targetUser.phone}</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-dragon-cyan bg-dragon-cyan/10 px-2.5 py-1.5 rounded-xl border border-dragon-cyan/20 group-hover:bg-dragon-cyan group-hover:text-dragon-black transition-all">
                          Send
                        </span>
                      </div>
                    ))
                )}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
});
