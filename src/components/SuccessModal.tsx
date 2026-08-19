import React from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  title = "Success!",
  message
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          className="relative w-full max-w-sm bg-[#09090d] border border-emerald-500/30 rounded-3xl p-6 shadow-2xl shadow-emerald-500/10 text-center space-y-4"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-full transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>

          <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-inner">
            <CheckCircle2 size={36} />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-black uppercase tracking-wide text-white font-display">
              {title}
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed font-medium">
              {message}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-wider text-xs shadow-lg shadow-emerald-500/25 transition-all cursor-pointer active:scale-95"
          >
            Done
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
