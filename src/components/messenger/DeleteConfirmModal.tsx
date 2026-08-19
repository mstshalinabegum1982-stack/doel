import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Loader2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  deleteConfirmPostId: string | null;
  onClose: () => void;
  onConfirm: () => void;
  isDeletingPost: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  deleteConfirmPostId,
  onClose,
  onConfirm,
  isDeletingPost,
}) => {
  return (
    <AnimatePresence>
      {deleteConfirmPostId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dragon-black/80 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[#0f1118]/95 border border-red-500/30 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl p-6 space-y-6"
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 rounded-full bg-red-500/15 text-red-500 animate-bounce">
                <Trash2 size={32} />
              </div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Delete Post Warning!
              </h3>
              <p className="text-xs text-gray-400 font-sans leading-relaxed">
                Are you sure you want to delete this post? This action cannot be undone and your post will be permanently deleted.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full font-sans">
              <button
                type="button"
                onClick={onClose}
                disabled={isDeletingPost}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-400 font-bold uppercase tracking-widest text-[10px] rounded-xl transition-all border border-white/5 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isDeletingPost}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-lg shadow-red-500/20 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeletingPost ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Yes, Delete'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
