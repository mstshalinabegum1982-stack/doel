import React from 'react';
import { Layers, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface SyncCategoryModalProps {
  showSyncCategoryModal: boolean;
  setShowSyncCategoryModal: React.Dispatch<React.SetStateAction<boolean>>;
  productToSync: any | null;
  setProductToSync: React.Dispatch<React.SetStateAction<any | null>>;
  syncSelectedCategory: string;
  setSyncSelectedCategory: React.Dispatch<React.SetStateAction<string>>;
  merchantCategories: { id: string; name: string }[];
  handleSyncProduct: (item: any, selectedCategory: string) => Promise<void>;
}

export const SyncCategoryModal: React.FC<SyncCategoryModalProps> = ({
  showSyncCategoryModal,
  setShowSyncCategoryModal,
  productToSync,
  setProductToSync,
  syncSelectedCategory,
  setSyncSelectedCategory,
  merchantCategories,
  handleSyncProduct,
}) => {
  if (!showSyncCategoryModal || !productToSync) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm no-print">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-sm glass-card p-6 border-dragon-cyan/20 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2 text-dragon-cyan">
              <Layers size={20} />
              <h3 className="font-display font-black text-xs uppercase tracking-wider text-white">Select Category</h3>
            </div>
            <button
              onClick={() => {
                setShowSyncCategoryModal(false);
                setProductToSync(null);
              }}
              className="p-1 px-2 border border-white/5 hover:border-white/10 rounded text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">
              Which category would you like to add "{productToSync.name}" to?
            </p>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black tracking-widest text-gray-500 uppercase">Product Category</label>
              <select
                value={syncSelectedCategory}
                onChange={(e) => setSyncSelectedCategory(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-dragon-cyan/50 text-xs text-white cursor-pointer"
              >
                <option value="" className="bg-dragon-black text-gray-500">Select Category (No Category)</option>
                {merchantCategories.map((cat) => (
                  <option key={cat.id} value={cat.name} className="bg-dragon-black text-white">{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => {
                setShowSyncCategoryModal(false);
                setProductToSync(null);
              }}
              className="flex-1 py-2.5 border border-white/10 hover:border-white/20 hover:bg-white/5 text-gray-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                handleSyncProduct(productToSync, syncSelectedCategory);
              }}
              className="flex-1 py-2.5 bg-dragon-cyan hover:bg-dragon-cyan/80 text-dragon-black rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-dragon-cyan/20"
            >
              Sync Product
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
