import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Youtube } from 'lucide-react';
import { ProWebsiteData } from './types';

interface ProductConfigModalProps {
  product: any | null;
  selectedWebsite: ProWebsiteData | null;
  promptCategory: string;
  setPromptCategory: (cat: string) => void;
  promptPrice: string;
  setPromptPrice: (price: string) => void;
  promptDiscount: string;
  setPromptDiscount: (discount: string) => void;
  promptVideoUrl: string;
  setPromptVideoUrl: (url: string) => void;
  onClose: () => void;
  onSave: (
    websiteId: string,
    product: any,
    categoryId: string,
    finalPrice: number,
    comparePrice: number,
    discountPct: number,
    videoUrl: string
  ) => Promise<void>;
  triggerNotification: (title: string, message: string) => void;
}

export const ProductConfigModal: React.FC<ProductConfigModalProps> = ({
  product,
  selectedWebsite,
  promptCategory,
  setPromptCategory,
  promptPrice,
  setPromptPrice,
  promptDiscount,
  setPromptDiscount,
  promptVideoUrl,
  setPromptVideoUrl,
  onClose,
  onSave,
  triggerNotification
}) => {
  if (!product || !selectedWebsite) return null;

  const websiteCats = (selectedWebsite as any).categories || [];
  const buyPrice = product.buyPrice || 0;
  const originalPrice = parseFloat(promptPrice) || 0;
  const discountPct = parseFloat(promptDiscount) || 0;
  const finalPrice = Math.round(originalPrice * (1 - discountPct / 100));
  const netProfit = finalPrice - buyPrice;

  const handleSave = async () => {
    if (!promptPrice || originalPrice <= 0) {
      triggerNotification('Invalid Price', 'Please enter a valid sales price.');
      return;
    }
    if (discountPct < 0 || discountPct > 100) {
      triggerNotification('Invalid Discount', 'Discount percentage must be between 0 and 100.');
      return;
    }
    await onSave(
      selectedWebsite.id,
      product,
      promptCategory,
      finalPrice,
      originalPrice,
      discountPct,
      promptVideoUrl
    );
    onClose();
  };

  return (
    <AnimatePresence>
      <>
        {/* Overlay Backdrop */}
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[70] transition-opacity animate-fade-in"
          onClick={onClose}
        />
        
        {/* Dialog Content */}
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#0d0f14] border border-white/10 rounded-3xl p-6 z-[80] shadow-2xl animate-scale-up text-left space-y-5">
          <div className="flex justify-between items-start pb-3 border-b border-white/5">
            <div>
              <span className="text-[10px] text-dragon-cyan font-black uppercase tracking-widest block mb-1">Product Configuration</span>
              <h4 className="text-base font-black text-white leading-tight">
                "{product.name}" Catalog Settings
              </h4>
            </div>
            <button 
              type="button"
              onClick={onClose}
              className="p-1 px-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Form fields */}
          <div className="space-y-4">
            {/* Category Selection dropdown */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">Select Category</label>
              <select
                value={promptCategory}
                onChange={(e) => setPromptCategory(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-dragon-cyan cursor-pointer font-semibold"
              >
                <option value="all" className="bg-[#0c0d12]">All Products (Default)</option>
                {websiteCats.filter((c: any) => c.id !== 'all').map((cat: any, cidx: number) => (
                  <option key={`prompt-cat-${cat.id}-${cidx}`} value={cat.id} className="bg-[#0c0d12]">
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Pricing Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">Original Retail Price (৳)</label>
                <input
                  type="number"
                  placeholder="e.g. 2000"
                  value={promptPrice}
                  onChange={(e) => setPromptPrice(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-bold outline-none focus:border-dragon-cyan"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">Discount % (Optional)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="e.g. 10"
                  value={promptDiscount}
                  onChange={(e) => setPromptDiscount(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-bold outline-none focus:border-dragon-cyan"
                />
              </div>
            </div>

            {/* YouTube video url input */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block flex items-center gap-1">
                <Youtube size={12} className="text-red-500" /> YouTube Video Link (Optional)
              </label>
              <input
                type="text"
                placeholder="https://www.youtube.com/watch?v=..."
                value={promptVideoUrl}
                onChange={(e) => setPromptVideoUrl(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-mono outline-none focus:border-dragon-cyan"
              />
            </div>

            {/* Dynamic calculation summary screen */}
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Purchase Price:</span>
                <span className="font-mono font-bold text-white">৳{buyPrice}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Original Selling Price:</span>
                <span className="font-mono font-bold text-white">৳{originalPrice}</span>
              </div>
              {discountPct > 0 && (
                <div className="flex justify-between items-center text-xs text-rose-400">
                  <span>Discount Offer ({discountPct}%):</span>
                  <span className="font-mono font-bold">-৳{Math.round(originalPrice * (discountPct / 100))}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-xs border-t border-white/5 pt-2.5">
                <span className="text-gray-200 font-black">Final Selling Price (with offer):</span>
                <span className="font-mono text-sm font-black text-dragon-cyan">৳{finalPrice}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-white/5 pt-2.5">
                <span className="text-gray-200 font-black">Your Net Profit:</span>
                <span className={`font-mono text-sm font-black p-1 px-2.5 rounded-lg ${netProfit >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  ৳{netProfit} {netProfit >= 0 ? "(Profit)" : "(Loss)"}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex gap-3 justify-end pt-3 border-t border-white/5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 bg-dragon-cyan text-black hover:bg-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-colors shadow-md shadow-dragon-cyan/10"
            >
              Save
            </button>
          </div>
        </div>
      </>
    </AnimatePresence>
  );
};
