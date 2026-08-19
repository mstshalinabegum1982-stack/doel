import React from 'react';
import { AnimatePresence } from 'framer-motion';

interface MyCatalogPriceModalProps {
  product: any | null;
  onClose: () => void;
  myCatalogPriceInput: string;
  setMyCatalogPriceInput: (val: string) => void;
  onSave: () => Promise<void>;
}

export const MyCatalogPriceModal: React.FC<MyCatalogPriceModalProps> = ({
  product,
  onClose,
  myCatalogPriceInput,
  setMyCatalogPriceInput,
  onSave
}) => {
  if (!product) return null;

  const buyPrice = product.buyPrice || 0;
  const originalWholesalePrice = product.sellPrice || 0;
  const hasWholesalePrice = typeof product.sellPrice === 'number' && product.sellPrice > 0;

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
              <span className="text-[10px] text-dragon-cyan font-black uppercase tracking-widest block mb-1">Catalog Product Settings</span>
              <h4 className="text-base font-black text-white leading-tight">
                "{product.name}"
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
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400 font-semibold">Buying Price:</span>
                <span className="font-mono font-black text-white text-base">৳{buyPrice}</span>
              </div>
              
              {hasWholesalePrice ? (
                <div className="flex justify-between items-center text-sm border-t border-white/5 pt-4">
                  <span className="text-gray-400 font-semibold">Wholesale Price:</span>
                  <span className="font-mono font-black text-dragon-cyan text-base">৳{originalWholesalePrice}</span>
                </div>
              ) : (
                <div className="space-y-2 border-t border-white/5 pt-4">
                  <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Setup Wholesale Price</label>
                  <input
                    type="number"
                    placeholder="Enter wholesale price (৳)"
                    value={myCatalogPriceInput}
                    onChange={(e) => setMyCatalogPriceInput(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-black outline-none focus:border-dragon-cyan"
                  />
                </div>
              )}
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
              onClick={onSave}
              className="px-5 py-2.5 bg-dragon-cyan text-black hover:bg-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-colors shadow-md shadow-dragon-cyan/10"
            >
              Add to Catalog
            </button>
          </div>
        </div>
      </>
    </AnimatePresence>
  );
};
