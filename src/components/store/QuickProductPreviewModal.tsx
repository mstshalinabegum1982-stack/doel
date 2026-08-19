import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuickProductPreviewModalProps {
  product: any | null;
  onClose: () => void;
}

export const QuickProductPreviewModal: React.FC<QuickProductPreviewModalProps> = ({
  product,
  onClose
}) => {
  return (
    <AnimatePresence>
      {product && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-sm bg-dragon-black border border-white/10 rounded-3xl p-5 overflow-hidden shadow-2xl relative space-y-4"
          >
            <button 
              type="button"
              onClick={onClose} 
              className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white cursor-pointer z-10 transition-colors"
            >
              ✕
            </button>

            <div className="relative aspect-video w-full rounded-2xl bg-white/5 overflow-hidden select-none">
              <img 
                src={product.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80'} 
                className="w-full h-full object-cover" 
                alt={product.name || ''} 
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="text-left space-y-2">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <span className="text-[7px] bg-dragon-cyan/15 border border-dragon-cyan/25 text-dragon-cyan px-2 py-0.5 rounded uppercase font-black tracking-widest block w-fit mb-1 leading-none font-bold">
                    {product.category || "General"}
                  </span>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">{product.name}</h3>
                </div>
                <span className="text-sm font-black text-dragon-cyan font-mono shrink-0">৳{product.sellPrice || 0}</span>
              </div>

              {product.details && (
                <p className="text-[10px] text-gray-400 font-sans leading-relaxed line-clamp-3 font-bold border-l-2 border-white/10 pl-2">
                  {product.details}
                </p>
              )}

              {/* Attribute info cards */}
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-white/5 text-[9px] font-bold text-gray-500 font-sans">
                {product.color && <div className="truncate">Color Options: <strong className="text-white font-medium">{product.color}</strong></div>}
                {product.size && <div className="truncate">Size: <strong className="text-white font-medium">{product.size}</strong></div>}
                {product.hasWarranty && <div className="truncate">Warranty: <strong className="text-emerald-400 font-bold">{product.warrantyDuration || "Yes"}</strong></div>}
                {product.hasReplacement && <div className="truncate">Replacement: <strong className="text-emerald-400 font-bold">{product.replacementDuration || "Yes"}</strong></div>}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3.5 bg-dragon-cyan hover:bg-dragon-cyan/90 text-dragon-black rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors"
            >
              Close Preview
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
