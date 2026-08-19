import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  Truck, 
  ShoppingBag, 
  Search, 
  Tag, 
  ArrowRight, 
  ArrowLeft 
} from 'lucide-react';
import { CustomDeliveryCharge, StoreCategory } from './types';

interface CatalogPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  coverImage: string;
  userProfile: any;
  storeName: string;
  deliveryLabelInside: string;
  deliveryLabelOutside: string;
  deliveryChargeInside: number;
  deliveryChargeOutside: number;
  customDeliveryCharges: CustomDeliveryCharge[];
  publicCatalogItems: any[];
  storeCategories: StoreCategory[];
  previewModalSearch: string;
  setPreviewModalSearch: (search: string) => void;
  previewModalCategory: string;
  setPreviewModalCategory: (category: string) => void;
}

export const CatalogPreviewModal: React.FC<CatalogPreviewModalProps> = ({
  isOpen,
  onClose,
  coverImage,
  userProfile,
  storeName,
  deliveryLabelInside,
  deliveryLabelOutside,
  deliveryChargeInside,
  deliveryChargeOutside,
  customDeliveryCharges,
  publicCatalogItems,
  storeCategories,
  previewModalSearch,
  setPreviewModalSearch,
  previewModalCategory,
  setPreviewModalCategory
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-2xl bg-[#0b0c10] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
          >
            {/* Close button inside top header */}
            <button 
              type="button"
              onClick={onClose} 
              className="absolute top-4 right-4 p-2 bg-black/70 hover:bg-red-500 rounded-full text-white cursor-pointer z-50 transition-all border border-white/10 active:scale-95 w-8 h-8 flex items-center justify-center font-bold text-xs"
            >
              ✕
            </button>

            {/* Scrollable container */}
            <div className="overflow-y-auto w-full flex-1 p-0">
              
              {/* 1. COVER PHOTO BANNER */}
              <div 
                className="h-44 sm:h-56 w-full relative overflow-hidden bg-cover bg-center flex items-end justify-between p-6"
                style={{
                  backgroundImage: coverImage 
                    ? `url(${coverImage})` 
                    : "linear-gradient(to right, rgba(49, 46, 129, 0.6), rgba(88, 28, 135, 0.4), rgba(8, 79, 94, 0.5))"
                }}
              >
                {/* Pattern overlays if custom cover photo is not set */}
                {!coverImage && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c10] via-black/45 to-transparent z-0" />
                    <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
                  </>
                )}
                
                {/* Live Status indicator */}
                <div className="absolute top-4 left-4 z-10 px-2.5 py-1 bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/25 rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400 font-mono">My Live Catalog</span>
                </div>
              </div>

              {/* 2. PROFILE OVERLAY DETAILS */}
              <div className="px-6 pb-6 pt-2 flex flex-col items-center text-center -mt-16 sm:-mt-22 relative z-10 space-y-3">
                <div className="relative shrink-0">
                  <img 
                    src={userProfile?.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80'} 
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover bg-[#0b0c10] border-4 border-[#0b0c10] shadow-2xl" 
                    alt="Store Profile Avatar"
                    referrerPolicy="no-referrer"
                  />
                  {/* Verified check badge */}
                  <div className="absolute bottom-1 right-1 p-1 bg-dragon-cyan text-dragon-black rounded-full shadow-lg border-2 border-[#0b0c10]">
                    <Check size={14} strokeWidth={4} />
                  </div>
                </div>

                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-black text-white leading-tight font-sans">
                    {storeName || userProfile?.businessName || userProfile?.name || 'My Store'}
                  </h2>
                  <p className="text-[10px] text-zinc-400 font-semibold tracking-wide font-sans">
                    {userProfile?.phone || 'No Phone Number'} • {userProfile?.email || 'N/A'}
                  </p>
                  <div className="flex justify-center items-center gap-2 pt-1">
                    <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-dragon-cyan/10 text-dragon-cyan ring-1 ring-dragon-cyan/25">
                      👑 Supplier Store
                    </span>
                  </div>
                </div>

                {userProfile?.businessDescription && (
                  <p className="text-xs text-gray-400 leading-relaxed max-w-md italic border-t border-b border-white/5 py-3 mt-1 font-sans">
                    "{userProfile.businessDescription}"
                  </p>
                )}
              </div>

              {/* DELIVERY CHARGES DISPLAY */}
              <div className="px-6 pb-2 text-left space-y-3">
                <div className="flex items-center gap-1.5 border-b border-white/5 pb-2">
                  <Truck size={14} className="text-dragon-cyan" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">
                    Delivery Charges
                  </h3>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white/[0.01] border border-white/5 rounded-2xl">
                    <span className="text-[8px] font-black uppercase text-gray-500 tracking-wider block">{deliveryLabelInside || 'Inside Dhaka'}</span>
                    <span className="text-xs font-bold text-white mt-1 block">৳{deliveryChargeInside}</span>
                  </div>
                  <div className="p-3 bg-white/[0.01] border border-white/5 rounded-2xl">
                    <span className="text-[8px] font-black uppercase text-gray-500 tracking-wider block">{deliveryLabelOutside || 'Outside Dhaka'}</span>
                    <span className="text-xs font-bold text-white mt-1 block">৳{deliveryChargeOutside}</span>
                  </div>
                </div>

                {customDeliveryCharges.length > 0 && (
                  <div className="space-y-2 mt-2">
                    <span className="text-[8px] font-black uppercase text-gray-500 tracking-wider block">Area & Sub-area Custom Charges:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {customDeliveryCharges.map((item, idx) => (
                        <div key={`preview-custom-charge-${idx}`} className="p-2.5 bg-black/40 border border-white/5 rounded-xl text-left space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-white">{item.area}</span>
                            <span className="text-[10px] font-bold text-dragon-cyan">৳{item.charge}</span>
                          </div>
                          {item.subAreas && item.subAreas.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {item.subAreas.map((sub, sIdx) => (
                                <span key={`sub-idx-${sIdx}`} className="text-[8px] bg-white/5 text-gray-400 px-1.5 py-0.5 rounded">
                                  {sub}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. PRODUCT CATALOG & CATEGORIES GRID */}
              <div className="px-6 pb-8 space-y-4 text-left">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-pink-600 dark:text-dragon-cyan flex items-center gap-1.5 font-mono">
                      <ShoppingBag size={14} /> Catalog Preview ({publicCatalogItems.length} Products)
                    </h3>
                    <p className="text-[10px] text-gray-400 font-medium">This is how buyers see your catalog in chat inbox.</p>
                  </div>
                  
                  {/* Search box for preview */}
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={13} />
                    <input
                      type="text"
                      placeholder="Search categories or products..."
                      value={previewModalSearch}
                      onChange={e => setPreviewModalSearch(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs font-semibold text-white focus:outline-none focus:border-pink-500 dark:focus:border-dragon-cyan transition-all"
                    />
                    {previewModalSearch && (
                      <button type="button" onClick={() => setPreviewModalSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-white">✕</button>
                    )}
                  </div>
                </div>

                {/* VIEW 1: Categories Grid (When category is 'all' and no search) */}
                {previewModalCategory === 'all' && !previewModalSearch ? (
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <h3 className="text-xs font-black uppercase tracking-widest text-dragon-cyan flex items-center gap-2">
                        <Tag size={15} /> Store Categories ({storeCategories.length})
                      </h3>
                      <span className="text-[10px] text-gray-400 font-medium">Click category to view products inside</span>
                    </div>

                    {storeCategories.length === 0 ? (
                      <div className="py-12 px-6 text-center glass-card border-dashed space-y-3 border-dragon-cyan/30 bg-white/[0.01]">
                        <div className="w-16 h-16 rounded-full bg-dragon-cyan/10 border-2 border-pink-500 dark:border-dragon-cyan category-circle-border flex items-center justify-center mx-auto text-pink-600 dark:text-dragon-cyan shadow-xl">
                          <Tag size={28} />
                        </div>
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">No Categories Found</h3>
                        <p className="text-xs text-gray-400">Products in this store haven't been assigned to categories yet.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3.5 pb-2">
                        {storeCategories.map(cat => {
                          const catProds = publicCatalogItems.filter((i: any) => i.category === cat.name);
                          return (
                            <div
                              key={cat.id || cat.name}
                              onClick={() => setPreviewModalCategory(cat.name)}
                              className="glass-card p-2.5 sm:p-3.5 flex flex-col items-center text-center gap-1.5 sm:gap-2 border-white/10 hover:border-dragon-cyan/50 hover:bg-white/[0.05] transition-all cursor-pointer group relative overflow-hidden shadow-lg hover:shadow-dragon-cyan/10 bg-white/[0.02] rounded-2xl"
                            >
                              {/* Circular Image with Pink/Cyan Border */}
                              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-pink-500 dark:border-dragon-cyan category-circle-border bg-white/5 flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform duration-300 relative shrink-0">
                                {cat.imageUrl ? (
                                  <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-cyan-500/20 dark:from-dragon-cyan/20 dark:via-cyan-500/20 dark:to-dragon-cyan/20 flex items-center justify-center text-pink-600 dark:text-dragon-cyan">
                                    <Tag size={24} className="sm:w-7 sm:h-7" />
                                  </div>
                                )}
                              </div>

                              <div className="space-y-0.5 w-full">
                                <h4 className="font-display font-black text-[10px] sm:text-xs text-white uppercase tracking-wider truncate group-hover:text-dragon-cyan transition-colors leading-tight">
                                  {cat.name}
                                </h4>
                                <div className="inline-flex items-center gap-1 text-[8.5px] sm:text-[9px] font-mono text-dragon-cyan bg-dragon-cyan/10 px-2 py-0.5 rounded-full border border-dragon-cyan/20 font-bold">
                                  <span>{catProds.length}</span>
                                  <span>{catProds.length === 1 ? 'Product' : 'Products'}</span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewModalCategory(cat.name);
                                }}
                                className="w-full py-1 sm:py-1.5 bg-dragon-cyan/10 group-hover:bg-dragon-cyan text-dragon-cyan group-hover:text-dragon-black text-[8px] sm:text-[9px] font-black uppercase tracking-wider rounded-lg sm:rounded-xl transition-all flex items-center justify-center gap-1 border border-dragon-cyan/30 cursor-pointer"
                              >
                                <span>View Products</span>
                                <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform sm:w-3 sm:h-3" />
                              </button>
                            </div>
                          );
                        })}

                        {/* Uncategorized Card */}
                        {(() => {
                          const uncatProds = publicCatalogItems.filter((i: any) => !i.category || !storeCategories.some(c => c.name === i.category));
                          if (uncatProds.length === 0) return null;
                          return (
                            <div
                              onClick={() => setPreviewModalCategory('Uncategorized')}
                              className="glass-card p-3.5 flex flex-col items-center text-center gap-2 border-amber-500/30 hover:border-amber-500 hover:bg-amber-500/[0.05] transition-all cursor-pointer group relative overflow-hidden shadow-lg bg-white/[0.02]"
                            >
                              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-amber-500 bg-amber-500/10 flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform duration-300 shrink-0 text-amber-400 font-black text-xl">
                                ?
                              </div>
                              <div className="space-y-0.5 w-full">
                                <h4 className="font-display font-black text-xs text-amber-400 uppercase tracking-wider truncate">
                                  Uncategorized
                                </h4>
                                <div className="inline-flex items-center gap-1 text-[9px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-bold">
                                  <span>{uncatProds.length} Products</span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewModalCategory('Uncategorized');
                                }}
                                className="w-full py-1.5 bg-amber-500/10 group-hover:bg-amber-500 text-amber-400 group-hover:text-black text-[9px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 border border-amber-500/30 cursor-pointer"
                              >
                                <span>View Products</span>
                                <ArrowRight size={11} />
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                ) : (
                  /* VIEW 2: Inside Specific Category or Searching */
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white/5 p-3 rounded-2xl border border-white/10 shadow-md">
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewModalCategory('all');
                          setPreviewModalSearch('');
                        }}
                        className="back-category-btn px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white dark:bg-none dark:bg-dragon-cyan dark:hover:bg-dragon-cyan/90 dark:text-dragon-black font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-pink-500/20 dark:shadow-dragon-cyan/20 border border-pink-400/30 dark:border-dragon-cyan/30"
                      >
                        <ArrowLeft size={16} /> Back To All Categories (সকল ক্যাটাগরি)
                      </button>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                          {previewModalCategory === 'all' ? `Search: "${previewModalSearch}"` : previewModalCategory}
                        </span>
                        <span className="text-[10px] text-pink-700 dark:text-dragon-cyan font-bold bg-pink-100 dark:bg-dragon-cyan/10 px-2.5 py-0.5 rounded-full border border-pink-300 dark:border-dragon-cyan/20">
                          {
                            publicCatalogItems.filter(item => {
                              const matchesSearch = !previewModalSearch || 
                                (item.name || '').toLowerCase().includes(previewModalSearch.toLowerCase()) ||
                                (item.details || '').toLowerCase().includes(previewModalSearch.toLowerCase()) ||
                                (item.category || '').toLowerCase().includes(previewModalSearch.toLowerCase());
                              
                              if (previewModalCategory === 'all') return matchesSearch;
                              if (previewModalCategory === 'Uncategorized') {
                                return matchesSearch && (!item.category || !storeCategories.some(c => c.name === item.category));
                              }
                              return matchesSearch && item.category === previewModalCategory;
                            }).length
                          } Products
                        </span>
                      </div>
                    </div>

                    {/* Products List Grid */}
                    {(() => {
                      const modalFilteredProducts = publicCatalogItems.filter(item => {
                        const matchesSearch = !previewModalSearch || 
                          (item.name || '').toLowerCase().includes(previewModalSearch.toLowerCase()) ||
                          (item.details || '').toLowerCase().includes(previewModalSearch.toLowerCase()) ||
                          (item.category || '').toLowerCase().includes(previewModalSearch.toLowerCase());
                        
                        if (previewModalCategory === 'all') return matchesSearch;
                        if (previewModalCategory === 'Uncategorized') {
                          return matchesSearch && (!item.category || !storeCategories.some(c => c.name === item.category));
                        }
                        return matchesSearch && item.category === previewModalCategory;
                      });

                      if (modalFilteredProducts.length === 0) {
                        return (
                          <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
                            <ShoppingBag size={36} className="mx-auto text-gray-600 mb-2" />
                            <p className="text-xs font-bold text-gray-400 uppercase">No products found in this category</p>
                            <button
                              type="button"
                              onClick={() => { setPreviewModalCategory('all'); setPreviewModalSearch(''); }}
                              className="mt-3 px-4 py-2 bg-dragon-cyan/10 text-dragon-cyan text-xs font-black uppercase tracking-wider rounded-xl border border-dragon-cyan/30 hover:bg-dragon-cyan hover:text-black transition-all cursor-pointer"
                            >
                              View All Categories
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {modalFilteredProducts.map((prod: any) => (
                            <div 
                              key={prod.id} 
                              className="bg-zinc-950/40 border border-white/5 rounded-2xl p-3 flex flex-col justify-between group hover:border-dragon-cyan/25 transition-all text-left"
                            >
                              <div className="space-y-2">
                                <div className="relative aspect-square w-full rounded-xl bg-white/5 overflow-hidden">
                                  <img 
                                    src={prod.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80'} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" 
                                    alt={prod.name}
                                    referrerPolicy="no-referrer"
                                  />
                                  {prod.category && (
                                    <span className="absolute top-1.5 left-1.5 text-[7px] bg-black/75 border border-white/10 text-dragon-cyan px-1.5 py-0.5 rounded uppercase font-black tracking-widest leading-none font-bold">
                                      {prod.category}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-white truncate group-hover:text-dragon-cyan transition-colors">{prod.name}</h4>
                                  <div className="flex items-baseline gap-1 mt-0.5">
                                    <span className="text-dragon-cyan font-black font-mono text-xs">৳{prod.sellPrice || 0}</span>
                                    <span className="text-gray-500 line-through text-[9px] font-mono">৳{Math.round((prod.sellPrice || 0) * 1.35)}</span>
                                  </div>
                                </div>
                              </div>
                              
                              {prod.details && (
                                <p className="text-[9px] text-gray-500 line-clamp-2 leading-relaxed font-sans mt-1.5">{prod.details}</p>
                              )}

                              <button
                                type="button"
                                className="order-now-btn w-full mt-2 py-1.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white dark:bg-none dark:bg-dragon-cyan dark:text-dragon-black font-black text-[9px] uppercase tracking-wider rounded-lg flex items-center justify-center gap-1 shadow-md shadow-pink-500/20 dark:shadow-dragon-cyan/15"
                              >
                                <ShoppingBag size={10} className="text-white dark:text-dragon-black" /> Order Now
                              </button>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer actions */}
            <div className="p-4 border-t border-white/5 bg-zinc-950/70 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all border border-white/5"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
