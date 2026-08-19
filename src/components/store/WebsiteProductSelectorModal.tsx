import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Search, ShoppingBag, Settings, Plus } from 'lucide-react';
import { ProWebsiteData } from './types';

interface WebsiteProductSelectorModalProps {
  isOpen: boolean;
  selectedWebsite: ProWebsiteData | null;
  proWebsites: ProWebsiteData[];
  inventoryItems: any[];
  inventorySearch: string;
  setInventorySearch: (search: string) => void;
  onClose: () => void;
  onOpenProductConfig: (item: any, website: ProWebsiteData) => void;
  onToggleCatalogProduct: (websiteId: string, item: any) => Promise<void>;
}

export const WebsiteProductSelectorModal: React.FC<WebsiteProductSelectorModalProps> = ({
  isOpen,
  selectedWebsite,
  proWebsites,
  inventoryItems,
  inventorySearch,
  setInventorySearch,
  onClose,
  onOpenProductConfig,
  onToggleCatalogProduct
}) => {
  if (!isOpen || !selectedWebsite) return null;

  const currentSelectedWebsite = proWebsites.find(w => w.id === selectedWebsite.id) || selectedWebsite;
  const filteredItems = inventoryItems.filter(item => {
    const q = inventorySearch.toLowerCase();
    return (item.name || '').toLowerCase().includes(q) || (item.details || '').toLowerCase().includes(q);
  });

  return (
    <AnimatePresence>
      {/* Modal Box - Full Screen Overlay */}
      <div className="fixed inset-0 bg-dragon-black z-[60] p-6 md:p-10 overflow-y-auto animate-scale-up flex flex-col">
        <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col space-y-6">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/5 shrink-0">
            <div>
              <div className="text-[10px] text-dragon-cyan font-black uppercase tracking-widest mb-1">
                Inventory Products Catalog
              </div>
              <h3 className="text-2xl font-black text-white leading-tight">
                Add Products to {currentSelectedWebsite.brandName || 'Pro Website'}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Select products from your inventory that you want to display on your website catalog and configure their price and discount.
              </p>
            </div>
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors border border-white/5"
            >
              ✕ Close
            </button>
          </div>

          {/* Search and stats bar */}
          <div className="flex flex-col sm:flex-row gap-4 items-center shrink-0">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input 
                type="text"
                placeholder="Search inventory products (by name or description)..."
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-xs font-semibold text-white focus:outline-none focus:border-dragon-cyan focus:ring-1 focus:ring-dragon-cyan transition-all"
              />
            </div>
            <div className="px-4 py-3 bg-white/2 border border-white/5 rounded-2xl text-xs text-gray-400 font-bold shrink-0">
              Total Products: <span className="text-dragon-cyan font-mono font-black">{filteredItems.length}</span>
            </div>
          </div>

          {/* Products Grid Frame */}
          <div className="grow overflow-y-auto min-h-[50vh]">
            {filteredItems.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-white/5 bg-white/[0.01] rounded-3xl my-6">
                <ShoppingBag size={48} className="mx-auto text-gray-600 mb-3" />
                <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">No inventory products found</p>
                <p className="text-xs text-gray-500 mt-1">Go to your Inventory tab first to add some products.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-2">
                {filteredItems.map((item, idx) => {
                  const isAdded = (currentSelectedWebsite.catalog || []).some((p: any) => p.id === item.id);
                  const catalogItem = (currentSelectedWebsite.catalog || []).find((p: any) => p.id === item.id);
                  return (
                    <div 
                      key={`showcase-catalog-item-${item.id}-${idx}`}
                      className={`flex flex-col p-4 rounded-3xl border transition-all justify-between gap-4 ${
                        isAdded 
                          ? "border-dragon-cyan/40 bg-dragon-cyan/[0.03] shadow-lg shadow-dragon-cyan/5" 
                          : "border-white/5 hover:border-white/10 bg-white/[0.01]"
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Image & Info */}
                        <div className="flex gap-4 items-start">
                          {item.image ? (
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              className="w-16 h-16 rounded-2xl object-cover bg-neutral-800 border border-white/10"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-2xl bg-neutral-800 border border-white/10 flex items-center justify-center">
                              <ShoppingBag size={24} className="text-gray-600" />
                            </div>
                          )}
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="text-xs font-black text-white truncate">{item.name}</div>
                            <div className="text-[10px] text-gray-500 line-clamp-1">{item.details || 'No description'}</div>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              {item.buyPrice && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold">
                                  Buy: ৳{item.buyPrice}
                                </span>
                              )}
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-dragon-cyan/10 text-dragon-cyan font-bold font-mono">
                                Sell: ৳{item.sellPrice || 0}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Catalog pricing status if added */}
                        {isAdded && catalogItem && (
                          <div className="p-2.5 bg-white/[0.02] border border-white/5 rounded-2xl text-[10px] space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Original Price:</span>
                              <span className="font-bold text-white">৳{catalogItem.comparePrice || catalogItem.price}</span>
                            </div>
                            {catalogItem.discount && catalogItem.discount > 0 ? (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Discount (%):</span>
                                  <span className="font-bold text-red-400">-{catalogItem.discount}% OFF</span>
                                </div>
                                <div className="flex justify-between border-t border-white/5 pt-1 mt-1">
                                  <span className="text-gray-400 font-bold">Catalog Price:</span>
                                  <span className="font-bold text-dragon-cyan">৳{catalogItem.price}</span>
                                </div>
                              </>
                            ) : (
                              <div className="flex justify-between border-t border-white/5 pt-1 mt-1">
                                <span className="text-gray-400 font-bold">Catalog Price:</span>
                                <span className="font-bold text-dragon-cyan">৳{catalogItem.price}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                        {isAdded ? (
                          <>
                            <button
                              type="button"
                              onClick={() => onOpenProductConfig(item, currentSelectedWebsite)}
                              className="flex-1 px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border border-indigo-500/10 cursor-pointer"
                              title="Modify price or settings"
                            >
                              <Settings size={12} className="text-indigo-400" /> Configure
                            </button>
                            <button
                              type="button"
                              onClick={() => onToggleCatalogProduct(currentSelectedWebsite.id, item)}
                              className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 border border-rose-500/10 cursor-pointer"
                              title="Remove from catalog"
                            >
                              ✕ Remove
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onOpenProductConfig(item, currentSelectedWebsite)}
                            className="w-full px-3 py-2 bg-dragon-cyan/15 hover:bg-dragon-cyan text-dragon-cyan hover:text-black rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border border-dragon-cyan/20 cursor-pointer"
                          >
                            <Plus size={12} /> Select
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Bottom Footer block */}
          <div className="mt-auto pt-4 border-t border-white/5 flex justify-end shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-dragon-cyan text-black hover:bg-white rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer transition-colors shadow-lg shadow-dragon-cyan/10 active:scale-95"
            >
              Done
            </button>
          </div>

        </div>
      </div>
    </AnimatePresence>
  );
};
