import React, { useState, useEffect, useContext, useMemo } from 'react';
import { 
  X, 
  ShoppingBag, 
  Search, 
  Tag, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Lock, 
  User, 
  Plus, 
  Check, 
  Globe, 
  Facebook, 
  Instagram, 
  Youtube, 
  Linkedin, 
  ExternalLink, 
  MessageSquare, 
  Zap, 
  Star 
} from 'lucide-react';
import { collection, query, where, orderBy, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AuthContext } from '../../authContext';
import { getCheckoutFormFields, getAggregatedAddress, getCurrencySymbol } from '../../utils/countriesData';
import { renderTextWithHashtags, ExpandablePostText, POST_BACKGROUND_THEMES, PostThemeVectorOverlay } from '../social/PostThemeUtils';
import { SmartPasteModal } from '../SmartPasteModal';
import { AnimatePresence, motion } from 'framer-motion';

export function ProfileDrawer({ user, catalog, isLocked, onClose, onSync, syncingId, onPreviewImage, onCreateOrder, onOpenOrderForm }: any) {
  const [activeSubTab, setActiveSubTab] = React.useState<'catalog' | 'cart' | 'checkout' | 'success'>('catalog');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [cart, setCart] = React.useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = React.useState<any | null>(null);
  const [selectedProductQty, setSelectedProductQty] = React.useState(1);
  const [selectedProductSpecs, setSelectedProductSpecs] = React.useState<{ color: string; size: string; weight: string }[]>([]);
  const [catalogPage, setCatalogPage] = React.useState(1);

  // Automatically initialize specs when selectedProduct is set
  React.useEffect(() => {
    if (selectedProduct) {
      setSelectedProductQty(1);
      const defaultColor = selectedProduct.color?.split(',')[0]?.trim() || '';
      const defaultSize = selectedProduct.size?.split(',')[0]?.trim() || '';
      const defaultWeight = selectedProduct.weight?.split(',')[0]?.trim() || '';
      setSelectedProductSpecs([{ color: defaultColor, size: defaultSize, weight: defaultWeight }]);
    } else {
      setSelectedProductQty(1);
      setSelectedProductSpecs([]);
    }
  }, [selectedProduct]);

  // Adjust specs array size dynamically based on selectedProductQty
  React.useEffect(() => {
    if (!selectedProduct) return;
    setSelectedProductSpecs(prev => {
      const nextSpecs = [...prev];
      if (selectedProductQty > nextSpecs.length) {
        const defaultColor = selectedProduct.color?.split(',')[0]?.trim() || '';
        const defaultSize = selectedProduct.size?.split(',')[0]?.trim() || '';
        const defaultWeight = selectedProduct.weight?.split(',')[0]?.trim() || '';
        while (nextSpecs.length < selectedProductQty) {
          nextSpecs.push({ color: defaultColor, size: defaultSize, weight: defaultWeight });
        }
      } else if (selectedProductQty < nextSpecs.length) {
        nextSpecs.splice(selectedProductQty);
      }
      return nextSpecs;
    });
  }, [selectedProductQty, selectedProduct]);

  // User Social Profile modal fields
  const [showSocialProfileModal, setShowSocialProfileModal] = React.useState(false);
  const [socialPosts, setSocialPosts] = React.useState<any[]>([]);
  const [loadingSocialPosts, setLoadingSocialPosts] = React.useState(false);

  const handleOpenSocialProfile = async () => {
    setShowSocialProfileModal(true);
    if (!user?.uid) return;
    setLoadingSocialPosts(true);
    try {
      const q = query(
        collection(db, 'community_posts'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const posts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSocialPosts(posts);
    } catch (err) {
      console.error("Error loading user social posts:", err);
    } finally {
      setLoadingSocialPosts(false);
    }
  };

  // Dynamic country checkout fields
  const { profile } = React.useContext(AuthContext);
  const sellerCountry = user?.country || profile?.country || 'Bangladesh';
  const checkoutFields = getCheckoutFormFields(sellerCountry);

  const [checkoutData, setCheckoutData] = React.useState<any>(() => {
    const initial: any = {};
    checkoutFields.forEach(f => {
      initial[f.key] = '';
    });
    return initial;
  });

  const [smartPaste, setSmartPaste] = React.useState<{
    isOpen: boolean;
    pastedText: string;
    initialTargetField: string;
  }>({
    isOpen: false,
    pastedText: '',
    initialTargetField: 'name'
  });

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>, fieldKey: string) => {
    const text = e.clipboardData.getData('text') || '';
    if (text.trim().length > 5 && (text.includes(' ') || text.includes('\n') || text.includes('\r'))) {
      e.preventDefault();
      setSmartPaste({
        isOpen: true,
        pastedText: text,
        initialTargetField: fieldKey
      });
    }
  };

  const handleSmartPasteApply = (data: { name: string; phone: string; address: string }) => {
    setCheckoutData((prev: any) => {
      const updated = { ...prev };
      if (data.name) updated['name'] = data.name;
      if (data.phone) updated['phone'] = data.phone;
      if (data.address) updated['address'] = data.address;
      return updated;
    });
  };

  // Merchant Categories
  const [merchantCategories, setMerchantCategories] = React.useState<{ id: string; name: string; imageUrl?: string }[]>([]);

  React.useEffect(() => {
    if (!user?.uid) return;
    const qCats = query(collection(db, 'merchant_categories'), where('userId', '==', user.uid));
    const unsubCats = onSnapshot(qCats, (snap) => {
      const rawCats = snap.docs.map(docSnap => ({
        id: docSnap.id,
        ...(docSnap.data() as any)
      }));
      setMerchantCategories(rawCats);
    }, (err) => {
      console.warn("Error fetching merchant categories in ProfileDrawer:", err);
    });
    return () => unsubCats();
  }, [user?.uid]);

  // Combined store categories
  const storeCategories = React.useMemo(() => {
    const catsMap = new Map<string, { id: string; name: string; imageUrl?: string }>();
    merchantCategories.forEach(c => {
      if (c.name) catsMap.set(c.name.toLowerCase().trim(), c);
    });
    catalog.forEach((item: any) => {
      if (item.category && !catsMap.has(item.category.toLowerCase().trim())) {
        catsMap.set(item.category.toLowerCase().trim(), { id: item.category, name: item.category });
      }
    });
    return Array.from(catsMap.values());
  }, [merchantCategories, catalog]);

  const currencySymbol = getCurrencySymbol(sellerCountry);

  const filteredCatalog = React.useMemo(() => {
    return catalog.filter((item: any) => {
      const matchesSearch = !searchQuery.trim() || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (item.skuCode && item.skuCode.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || 
        (selectedCategory === 'uncategorized' ? (!item.category || !storeCategories.some(c => c.name === item.category)) : (item.category === selectedCategory));
      return matchesSearch && matchesCategory;
    });
  }, [catalog, searchQuery, selectedCategory, storeCategories]);

  // Pagination logic: 10 items per page
  const itemsPerPage = 10;
  const totalCatalogPages = Math.ceil(filteredCatalog.length / itemsPerPage) || 1;
  const paginatedCatalog = React.useMemo(() => {
    const start = (catalogPage - 1) * itemsPerPage;
    return filteredCatalog.slice(start, start + itemsPerPage);
  }, [filteredCatalog, catalogPage]);

  // Reset page to 1 when category or search changes
  React.useEffect(() => {
    setCatalogPage(1);
  }, [searchQuery, selectedCategory]);

  const cartTotal = React.useMemo(() => {
    return cart.reduce((acc, item) => acc + (Number(item.sellPrice) || 0) * item.quantity, 0);
  }, [cart]);

  const addToCart = (product: any, qty: number = 1, specs: { color: string; size: string; weight: string }[] = []) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { 
          ...i, 
          quantity: i.quantity + qty,
          specs: [...(i.specs || []), ...specs]
        } : i);
      }
      return [...prev, { 
        ...product, 
        quantity: qty,
        specs: specs.length > 0 ? specs : [{
          color: product.color?.split(',')[0]?.trim() || '',
          size: product.size?.split(',')[0]?.trim() || '',
          weight: product.weight?.split(',')[0]?.trim() || ''
        }]
      }];
    });
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = Math.max(1, i.quantity + delta);
        let nextSpecs = [...(i.specs || [])];
        if (newQty > nextSpecs.length) {
          const defaultColor = i.color?.split(',')[0]?.trim() || '';
          const defaultSize = i.size?.split(',')[0]?.trim() || '';
          const defaultWeight = i.weight?.split(',')[0]?.trim() || '';
          while (nextSpecs.length < newQty) {
            nextSpecs.push({ color: defaultColor, size: defaultSize, weight: defaultWeight });
          }
        } else if (newQty < nextSpecs.length) {
          nextSpecs.splice(newQty);
        }
        return { ...i, quantity: newQty, specs: nextSpecs };
      }
      return i;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const handleCheckoutSubmit = () => {
    const missing = checkoutFields.find(f => f.required && !checkoutData[f.key]);
    if (missing) {
      alert(`Please fill in ${missing.labelEn} correctly.`);
      return;
    }

    const nameVal = checkoutData['name'] || '';
    const phoneVal = checkoutData['phone'] || '';
    const aggregatedAddress = getAggregatedAddress(sellerCountry, checkoutData);

    const firstItem = cart[0] || {};
    const deliveryFee = Number((user as any)?.deliveryCharge || (profile as any)?.deliveryCharge) || (sellerCountry === 'Bangladesh' ? 60 : 0);

    const orderPayload = {
      productName: cart.length > 1 ? `${cart.length} Products Cart Order` : (firstItem.name || 'Unnamed Product'),
      buyPrice: cart.reduce((acc, i) => acc + (Number(i.buyPrice) || 0) * i.quantity, 0),
      sellPrice: cartTotal,
      deliveryCharge: deliveryFee,
      quantity: cart.reduce((acc, i) => acc + i.quantity, 0),
      customerName: nameVal,
      customerPhone: phoneVal,
      customerAddress: aggregatedAddress,
      productImage: firstItem.imageUrl || firstItem.image || '',
      productImages: cart.map(i => i.imageUrl || i.image).filter(Boolean),
      skuCode: firstItem.skuCode || '',
      color: firstItem.color || '',
      size: firstItem.size || '',
      weight: firstItem.weight || '',
      items: cart.map(i => ({
        id: i.id,
        name: i.name,
        buyPrice: Number(i.buyPrice) || 0,
        sellPrice: Number(i.sellPrice) || 0,
        quantity: i.quantity,
        image: i.imageUrl || i.image || '',
        specs: i.specs || []
      }))
    };

    onCreateOrder(orderPayload);
    setCart([]);
    setActiveSubTab('success');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-xl bg-white dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] border-l border-slate-200 dark:border-white/10 h-full flex flex-col shadow-2xl relative animate-in slide-in-from-right duration-300">
        
        {/* Catalog Banner Header */}
        <div className="relative border-b border-slate-200 dark:border-white/10 overflow-hidden shrink-0">
          {user?.coverImage ? (
            <div className="h-28 sm:h-36 w-full relative">
              <img src={user.coverImage} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#18191a] via-white/40 dark:via-[#18191a]/40 to-transparent" />
            </div>
          ) : (
            <div className="h-20 sm:h-24 w-full bg-gradient-to-r from-cyan-500/20 dark:from-dragon-cyan/20 via-indigo-500/10 to-purple-500/20" />
          )}

          {/* Header Profile Badge Box */}
          <div className="header-profile-card flex items-center gap-2.5 sm:gap-3.5 relative z-10 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-white/95 dark:bg-[#0d101d]/90 backdrop-blur-md border border-slate-200 dark:border-white/20 shadow-xl text-slate-900 dark:text-white max-w-[55%] sm:max-w-none">
            <div className="relative shrink-0 cursor-pointer" onClick={handleOpenSocialProfile}>
              <img src={user?.profileImage || undefined} className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover border-2 border-cyan-500 dark:border-dragon-cyan shadow-md" alt="" referrerPolicy="no-referrer" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate cursor-pointer hover:underline" onClick={handleOpenSocialProfile}>
                  {user?.storeName || user?.name || 'Catalog Merchant'}
                </h3>
                {user?.isVerified && (
                  <span className="p-0.5 rounded-full bg-cyan-500/20 dark:bg-dragon-cyan/20 text-cyan-600 dark:text-dragon-cyan" title="Verified Merchant">
                    <Zap size={10} fill="currentColor" />
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-gray-400 truncate flex items-center gap-1 font-mono">
                <span>@{user?.username || 'merchant'}</span>
                <span>•</span>
                <span className="text-cyan-600 dark:text-dragon-cyan font-bold">{catalog.length} Products</span>
              </p>
            </div>
          </div>

          <div className="p-3 sm:p-4 pt-2 flex justify-between items-center relative z-10">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveSubTab('catalog')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeSubTab === 'catalog' ? 'bg-cyan-600 text-white dark:bg-dragon-cyan dark:text-dragon-black shadow-lg shadow-cyan-600/20 dark:shadow-dragon-cyan/20' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'}`}
              >
                Catalog ({catalog.length})
              </button>
              <button
                onClick={() => setActiveSubTab('cart')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all relative ${activeSubTab === 'cart' || activeSubTab === 'checkout' ? 'bg-cyan-600 text-white dark:bg-dragon-cyan dark:text-dragon-black shadow-lg shadow-cyan-600/20 dark:shadow-dragon-cyan/20' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'}`}
              >
                Cart ({cart.reduce((a, b) => a + b.quantity, 0)})
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Profile Button next to Cart */}
              <button
                onClick={handleOpenSocialProfile}
                className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-cyan-50 dark:hover:bg-dragon-cyan/20 hover:border-cyan-400 dark:hover:border-dragon-cyan/40 text-slate-700 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-dragon-cyan transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                title="View Social Profile"
              >
                <User size={15} />
                <span className="hidden xs:inline">Profile</span>
              </button>

              <button 
                onClick={onClose} 
                className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Catalog Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeSubTab === 'catalog' && (
            <>
              {/* Search & Categories Bar */}
              <div className="space-y-2.5">
                <div className="relative">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search catalog products or SKU..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-dragon-cyan/50 transition-colors"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Categories Tabs */}
                {storeCategories.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${selectedCategory === 'all' ? 'bg-dragon-cyan/20 text-dragon-cyan border border-dragon-cyan/30' : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'}`}
                    >
                      All ({catalog.length})
                    </button>
                    {storeCategories.map((cat) => {
                      const count = catalog.filter((i: any) => i.category === cat.name).length;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.name)}
                          className={`px-3 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${selectedCategory === cat.name ? 'bg-dragon-cyan/20 text-dragon-cyan border border-dragon-cyan/30' : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'}`}
                        >
                          {cat.imageUrl && (
                            <img src={cat.imageUrl} className="w-3.5 h-3.5 rounded object-cover" alt="" />
                          )}
                          <span>{cat.name}</span>
                          <span className="text-[9px] opacity-60 font-mono">({count})</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Products Grid */}
              {paginatedCatalog.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-gray-500">
                    <ShoppingBag size={24} />
                  </div>
                  <p className="text-xs text-gray-400 font-medium">No products found matching your search.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {paginatedCatalog.map((product: any) => {
                    const inCartItem = cart.find(i => i.id === product.id);
                    return (
                      <div 
                        key={product.id}
                        className="p-3 bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl space-y-2.5 flex flex-col justify-between transition-all group"
                      >
                        <div className="space-y-2">
                          <div 
                            className="w-full h-32 sm:h-36 bg-black/40 rounded-xl overflow-hidden relative cursor-pointer group-hover:scale-[1.02] transition-transform"
                            onClick={() => onPreviewImage?.(product.imageUrl || product.image || null)}
                          >
                            <img src={product.imageUrl || product.image || undefined} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                            {product.category && (
                              <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 backdrop-blur-md rounded-md text-[9px] font-bold text-dragon-cyan uppercase tracking-wider">
                                {product.category}
                              </span>
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-xs line-clamp-1 group-hover:text-dragon-cyan transition-colors">
                              {product.name}
                            </h4>
                            <div className="flex items-baseline justify-between mt-1">
                              <span className="text-sm font-black text-dragon-cyan font-mono">
                                {currencySymbol}{product.sellPrice}
                              </span>
                              {product.skuCode && (
                                <span className="text-[9px] text-gray-500 font-mono">
                                  SKU: {product.skuCode}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 pt-1 border-t border-white/5">
                          {inCartItem ? (
                            <div className="flex items-center justify-between w-full bg-dragon-cyan/10 border border-dragon-cyan/30 rounded-xl p-1">
                              <button 
                                onClick={() => updateCartQty(product.id, -1)}
                                className="w-6 h-6 rounded-lg bg-dragon-cyan/20 hover:bg-dragon-cyan/30 text-dragon-cyan font-black text-xs flex items-center justify-center transition-colors"
                              >
                                -
                              </button>
                              <span className="text-xs font-black text-white font-mono">{inCartItem.quantity}</span>
                              <button 
                                onClick={() => updateCartQty(product.id, 1)}
                                className="w-6 h-6 rounded-lg bg-dragon-cyan/20 hover:bg-dragon-cyan/30 text-dragon-cyan font-black text-xs flex items-center justify-center transition-colors"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setSelectedProduct(product)}
                              className="w-full py-2 bg-dragon-cyan/15 hover:bg-dragon-cyan hover:text-dragon-black border border-dragon-cyan/30 text-dragon-cyan font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                            >
                              <Plus size={14} /> Add to Cart
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination controls */}
              {totalCatalogPages > 1 && (
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-[10px] text-gray-500 font-mono">
                    Page {catalogPage} of {totalCatalogPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={catalogPage === 1}
                      onClick={() => setCatalogPage(prev => Math.max(1, prev - 1))}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none text-white transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      disabled={catalogPage === totalCatalogPages}
                      onClick={() => setCatalogPage(prev => Math.min(totalCatalogPages, prev + 1))}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none text-white transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {activeSubTab === 'cart' && (
            <div className="space-y-4">
              <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center justify-between border-b border-white/5 pb-2">
                <span>Shopping Cart ({cart.length})</span>
                {cart.length > 0 && (
                  <button onClick={() => setCart([])} className="text-xs text-rose-400 hover:underline font-normal normal-case">
                    Clear All
                  </button>
                )}
              </h3>

              {cart.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <p className="text-xs text-gray-400">Your shopping cart is empty.</p>
                  <button
                    onClick={() => setActiveSubTab('catalog')}
                    className="px-4 py-2 bg-dragon-cyan text-dragon-black font-bold text-xs rounded-xl"
                  >
                    Browse Catalog
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-2.5">
                    {cart.map((item) => (
                      <div key={item.id} className="p-3 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <img src={item.imageUrl || item.image || undefined} className="w-12 h-12 rounded-xl object-cover bg-black/40 shrink-0" alt="" referrerPolicy="no-referrer" />
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-white text-xs truncate">{item.name}</h4>
                            <span className="text-xs font-black text-dragon-cyan font-mono">{currencySymbol}{item.sellPrice}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-black/40 rounded-xl p-1 border border-white/10">
                            <button onClick={() => updateCartQty(item.id, -1)} className="w-6 h-6 rounded bg-white/10 text-white font-bold text-xs flex items-center justify-center">-</button>
                            <span className="px-2 text-xs font-bold text-white font-mono">{item.quantity}</span>
                            <button onClick={() => updateCartQty(item.id, 1)} className="w-6 h-6 rounded bg-white/10 text-white font-bold text-xs flex items-center justify-center">+</button>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} className="p-1.5 text-rose-400 hover:text-rose-300">
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold text-gray-400">
                      <span>Subtotal</span>
                      <span className="text-white font-mono">{currencySymbol}{cartTotal}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-black text-white pt-2 border-t border-white/5">
                      <span>Total Amount</span>
                      <span className="text-dragon-cyan font-mono text-base">{currencySymbol}{cartTotal}</span>
                    </div>

                    <button
                      onClick={() => setActiveSubTab('checkout')}
                      className="w-full py-3 bg-dragon-cyan text-dragon-black font-black text-xs uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-dragon-cyan/20"
                    >
                      Proceed to Checkout
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {activeSubTab === 'checkout' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="font-bold text-white text-sm uppercase tracking-wider">
                  Checkout Details ({sellerCountry})
                </h3>
                <button
                  type="button"
                  onClick={() => setSmartPaste({ isOpen: true, pastedText: '', initialTargetField: 'name' })}
                  className="px-2.5 py-1 bg-dragon-cyan/15 border border-dragon-cyan/30 rounded-xl text-[10px] font-black text-dragon-cyan uppercase flex items-center gap-1"
                >
                  <Sparkles size={11} /> Smart Paste
                </button>
              </div>

              <div className="space-y-3">
                {checkoutFields.map((field) => {
                  if (field.type === 'select') {
                    return (
                      <div key={field.key} className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-400 block">
                          {field.labelEn} {field.required && <span className="text-rose-500">*</span>}
                        </label>
                        <select
                          required={field.required}
                          value={checkoutData[field.key] || ''}
                          onChange={(e) => setCheckoutData((prev: any) => ({ ...prev, [field.key]: e.target.value }))}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-dragon-cyan cursor-pointer"
                        >
                          <option value="" className="bg-[#09090d] text-gray-400">Choose...</option>
                          {field.options?.map((opt) => (
                            <option key={opt.value} value={opt.value} className="bg-[#09090d] text-white">
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  }

                  if (field.type === 'textarea') {
                    return (
                      <div key={field.key} className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-400 block">
                          {field.labelEn} {field.required && <span className="text-rose-500">*</span>}
                        </label>
                        <textarea
                          required={field.required}
                          placeholder={field.placeholderEn}
                          rows={2}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-dragon-cyan resize-none"
                          value={checkoutData[field.key] || ''}
                          onChange={(e) => setCheckoutData((prev: any) => ({ ...prev, [field.key]: e.target.value }))}
                          onPaste={(e) => handlePaste(e, field.key)}
                        />
                      </div>
                    );
                  }

                  return (
                    <div key={field.key} className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 block">
                        {field.labelEn} {field.required && <span className="text-rose-500">*</span>}
                      </label>
                      <input
                        required={field.required}
                        type={field.type}
                        placeholder={field.placeholderEn}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-dragon-cyan"
                        value={checkoutData[field.key] || ''}
                        onChange={(e) => setCheckoutData((prev: any) => ({ ...prev, [field.key]: e.target.value }))}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('cart')}
                  className="flex-1 py-3 bg-white/5 text-gray-400 font-bold text-xs rounded-xl"
                >
                  Back to Cart
                </button>
                <button
                  type="button"
                  onClick={handleCheckoutSubmit}
                  className="flex-[2] py-3 bg-dragon-cyan text-dragon-black font-black text-xs uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-dragon-cyan/20"
                >
                  Place Order ({currencySymbol}{cartTotal})
                </button>
              </div>
            </div>
          )}

          {activeSubTab === 'success' && (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 bg-dragon-emerald/20 border border-dragon-emerald/40 text-dragon-emerald rounded-full flex items-center justify-center mx-auto animate-bounce">
                <Check size={32} />
              </div>
              <h3 className="text-lg font-black text-white">Order Sent Successfully!</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                Your order cart has been sent directly to the chat conversation. The seller will review and confirm your order shortly.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-dragon-cyan text-dragon-black font-black text-xs uppercase tracking-widest rounded-xl"
              >
                Return to Chat
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Product Spec Selection Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-dragon-black border border-white/10 p-5 rounded-3xl w-full max-w-md space-y-4 relative">
            <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <X size={18} />
            </button>
            <h3 className="font-bold text-white text-sm">Select Product Quantity</h3>
            <div className="flex items-center gap-3">
              <img src={selectedProduct.imageUrl || selectedProduct.image || undefined} className="w-16 h-16 rounded-xl object-cover" alt="" referrerPolicy="no-referrer" />
              <div>
                <h4 className="font-bold text-white text-xs">{selectedProduct.name}</h4>
                <p className="text-dragon-cyan font-black font-mono text-sm">{currencySymbol}{selectedProduct.sellPrice}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400">Quantity</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedProductQty(prev => Math.max(1, prev - 1))} className="w-8 h-8 rounded-lg bg-white/10 text-white font-bold text-sm">-</button>
                <span className="font-mono text-sm font-bold text-white">{selectedProductQty}</span>
                <button onClick={() => setSelectedProductQty(prev => prev + 1)} className="w-8 h-8 rounded-lg bg-white/10 text-white font-bold text-sm">+</button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setSelectedProduct(null)} className="flex-1 py-2.5 bg-white/5 text-gray-400 font-bold text-xs rounded-xl">Cancel</button>
              <button 
                onClick={() => {
                  addToCart(selectedProduct, selectedProductQty, selectedProductSpecs);
                  setSelectedProduct(null);
                }} 
                className="flex-1 py-2.5 bg-dragon-cyan text-dragon-black font-black text-xs uppercase tracking-wider rounded-xl"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Social Profile Modal */}
      <AnimatePresence>
        {showSocialProfileModal && (
          <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-dragon-black border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative my-auto">
              {/* Header Cover Banner */}
              <div className="h-28 sm:h-32 w-full bg-gradient-to-r from-dragon-cyan/20 via-indigo-500/20 to-purple-500/20 relative">
                {user?.coverImage && (
                  <img src={user.coverImage} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                )}
                <button 
                  onClick={() => setShowSocialProfileModal(false)}
                  className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Profile Main Info */}
              <div className="p-4 sm:p-5 relative -mt-10 space-y-4">
                <div className="flex items-end justify-between">
                  <img 
                    src={user?.profileImage || undefined} 
                    className="w-20 h-20 rounded-2xl border-4 border-dragon-black object-cover shadow-xl bg-white/10" 
                    alt="" 
                    referrerPolicy="no-referrer"
                  />
                  <button 
                    onClick={() => setShowSocialProfileModal(false)}
                    className="px-4 py-2 bg-dragon-cyan text-dragon-black font-black text-xs rounded-xl uppercase tracking-wider"
                  >
                    Done
                  </button>
                </div>

                <div>
                  <h2 className="font-bold text-white text-base sm:text-lg flex items-center gap-1.5">
                    {user?.name || user?.storeName || 'User Profile'}
                    {user?.isVerified && <Zap size={14} className="text-dragon-cyan" fill="currentColor" />}
                  </h2>
                  <p className="text-xs text-gray-400 font-mono">@{user?.username || 'user'}</p>
                </div>

                {user?.bio && (
                  <p className="text-xs text-gray-300 leading-relaxed bg-white/5 p-3 rounded-2xl border border-white/5">
                    {user.bio}
                  </p>
                )}

                {/* Social Links */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {user?.socialLinks?.facebook && (
                    <a href={user.socialLinks.facebook} target="_blank" rel="noreferrer" className="p-2 bg-white/5 border border-white/10 rounded-xl text-blue-400 hover:scale-105 transition-transform">
                      <Facebook size={16} />
                    </a>
                  )}
                  {user?.socialLinks?.instagram && (
                    <a href={user.socialLinks.instagram} target="_blank" rel="noreferrer" className="p-2 bg-white/5 border border-white/10 rounded-xl text-pink-400 hover:scale-105 transition-transform">
                      <Instagram size={16} />
                    </a>
                  )}
                  {user?.socialLinks?.youtube && (
                    <a href={user.socialLinks.youtube} target="_blank" rel="noreferrer" className="p-2 bg-white/5 border border-white/10 rounded-xl text-red-500 hover:scale-105 transition-transform">
                      <Youtube size={16} />
                    </a>
                  )}
                  {user?.socialLinks?.website && (
                    <a href={user.socialLinks.website} target="_blank" rel="noreferrer" className="p-2 bg-white/5 border border-white/10 rounded-xl text-dragon-cyan hover:scale-105 transition-transform">
                      <Globe size={16} />
                    </a>
                  )}
                </div>

                {/* Posts Section */}
                <div className="border-t border-white/5 pt-4 space-y-3">
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                    <MessageSquare size={14} className="text-dragon-cyan" /> User Posts ({socialPosts.length})
                  </h4>

                  {loadingSocialPosts ? (
                    <div className="text-center py-6 text-xs text-gray-500">Loading user posts...</div>
                  ) : socialPosts.length === 0 ? (
                    <div className="text-center py-6 text-xs text-gray-500">No community posts published yet.</div>
                  ) : (
                    <div className="space-y-3 max-h-[250px] overflow-y-auto no-scrollbar pr-1">
                      {socialPosts.map((post) => (
                        <div key={post.id} className="p-3 bg-white/5 border border-white/5 rounded-2xl space-y-2">
                          <ExpandablePostText text={post.content || ''} />
                          {post.image && (
                            <img src={post.image} className="w-full h-32 object-cover rounded-xl mt-2" alt="" referrerPolicy="no-referrer" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <SmartPasteModal
        isOpen={smartPaste.isOpen}
        onClose={() => setSmartPaste(prev => ({ ...prev, isOpen: false }))}
        pastedText={smartPaste.pastedText}
        initialTargetField={smartPaste.initialTargetField}
        onApply={handleSmartPasteApply}
        country={sellerCountry}
      />
    </div>
  );
}

export default ProfileDrawer;
