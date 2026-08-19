import React from 'react';
import { Sparkles, CreditCard, Zap, Settings, UploadCloud, X, Truck, Plus, Trash2, ShoppingBag, Eye, Search } from 'lucide-react';
import { MyCatalogTimer } from './Timers';
import { CatalogSubscription, CustomDeliveryCharge, UserProfile } from './types';

interface MyCatalogTabProps {
  catalogSub: CatalogSubscription | null;
  storeName: string;
  setStoreName: (name: string) => void;
  coverImage: string;
  setCoverImage: (url: string) => void;
  handleCoverPhotoUpload: (file: File) => void;
  currencySymbol: string;
  userProfile: UserProfile | null;
  deliveryLabelInside: string;
  setDeliveryLabelInside: (val: string) => void;
  deliveryChargeInside: number;
  setDeliveryChargeInside: (val: number) => void;
  deliveryLabelOutside: string;
  setDeliveryLabelOutside: (val: string) => void;
  deliveryChargeOutside: number;
  setDeliveryChargeOutside: (val: number) => void;
  getDefaultDeliveryConfig: (country: string) => { deliveryChargeInside: number; deliveryChargeOutside: number };
  customDeliveryCharges: CustomDeliveryCharge[];
  setCustomDeliveryCharges: (charges: CustomDeliveryCharge[]) => void;
  newAreaName: string;
  setNewAreaName: (val: string) => void;
  newAreaCharge: string;
  setNewAreaCharge: (val: string) => void;
  newSubAreasInput: string;
  setNewSubAreasInput: (val: string) => void;
  inlineSubAreaText: Record<number, string>;
  setInlineSubAreaText: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  handleSaveStoreBranding: () => void;
  savingBranding: boolean;
  filteredInventory: any[];
  catalogSearch: string;
  setCatalogSearch: (val: string) => void;
  setShowCatalogPreviewModal: (val: boolean) => void;
  setShowCatalogActivationModal: (val: boolean) => void;
  setCatalogSenderNumber: (val: string) => void;
  setCatalogTrxId: (val: string) => void;
  setProductForMyCatalogSelection: (item: any) => void;
  setMyCatalogPriceInput: (val: string) => void;
  handleRemoveProductFromCatalog: (item: any) => Promise<void>;
  triggerSuccess: (title: string, message: string) => void;
  user: any;
  db: any;
}

export const MyCatalogTab: React.FC<MyCatalogTabProps> = ({
  catalogSub,
  storeName,
  setStoreName,
  coverImage,
  setCoverImage,
  handleCoverPhotoUpload,
  currencySymbol,
  userProfile,
  deliveryLabelInside,
  setDeliveryLabelInside,
  deliveryChargeInside,
  setDeliveryChargeInside,
  deliveryLabelOutside,
  setDeliveryLabelOutside,
  deliveryChargeOutside,
  setDeliveryChargeOutside,
  getDefaultDeliveryConfig,
  customDeliveryCharges,
  setCustomDeliveryCharges,
  newAreaName,
  setNewAreaName,
  newAreaCharge,
  setNewAreaCharge,
  newSubAreasInput,
  setNewSubAreasInput,
  inlineSubAreaText,
  setInlineSubAreaText,
  handleSaveStoreBranding,
  savingBranding,
  filteredInventory,
  catalogSearch,
  setCatalogSearch,
  setShowCatalogPreviewModal,
  setShowCatalogActivationModal,
  setCatalogSenderNumber,
  setCatalogTrxId,
  setProductForMyCatalogSelection,
  setMyCatalogPriceInput,
  handleRemoveProductFromCatalog,
  triggerSuccess,
  user,
}) => {
  const publicCatalogItems = filteredInventory.filter(item => item.isPublic === true);

  return (
    <div className="space-y-6">
      {/* Informative Header card */}
      <div className="p-6 bg-gradient-to-r from-dragon-cyan/15 to-dragon-purple/15 rounded-3xl border border-white/5 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-dragon-cyan animate-pulse" />
            <span className="text-[10px] font-black tracking-widest text-dragon-cyan uppercase">Public Catalog Setup</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-black text-white uppercase tracking-tight mb-2">My Catalog</h1>
          <p className="text-gray-400 text-xs max-w-2xl leading-relaxed font-bold">
            Setup the products from your inventory that you want to make available for buyers to purchase directly in chat.
          </p>
        </div>
        <div className="absolute top-1/2 right-10 -translate-y-1/2 w-[220px] h-[220px] bg-dragon-cyan/5 blur-[50px] rounded-full pointer-events-none" />
      </div>

      {/* Stacked Layout: Store Settings and Inventory Products List */}
      <div className="space-y-6 max-w-4xl mx-auto">
        
        {/* My Catalog Billing/Subscription Panel */}
        {(publicCatalogItems.length > 0 || catalogSub) && (
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-4 animate-fade-in text-left">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/5">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard size={15} className="text-dragon-cyan" />
                  Catalog Subscription & Payment System
                </h3>
                <p className="text-[10px] text-gray-400 font-bold mt-1">
                  Check payment status to keep your public catalog active and show the product menu to buyers.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-gray-500 font-mono">STATUS:</span>
                <MyCatalogTimer sub={catalogSub} onActivate={() => setShowCatalogActivationModal(true)} />
              </div>
            </div>

            {/* Status description details */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-black/30 p-4 rounded-2xl border border-white/5">
              <div className="space-y-1">
                <p className="text-xs font-bold text-white">
                  {catalogSub?.paymentStatus === "approved" && "Your subscription is active! Catalog is live."}
                  {catalogSub?.paymentStatus === "pending" && "Your payment is being verified. It will be activated shortly."}
                  {catalogSub?.paymentStatus === "trial" && (
                    new Date(catalogSub.trialExpiresAt) > new Date() 
                      ? "You are using a 7-day free trial. The catalog will be locked after the trial."
                      : "Your 7-day free trial for the catalog has expired!"
                  )}
                  {!catalogSub && "Catalog products added, but subscription has not started yet."}
                </p>
                <p className="text-[10px] text-gray-455 font-medium">
                  {catalogSub?.paymentStatus === "approved" && `Expires on: ${new Date(catalogSub.activeUntil).toLocaleDateString()}`}
                  {catalogSub?.paymentStatus === "pending" && "Payment Transaction ID: " + (catalogSub.paymentTrxId || "N/A")}
                  {catalogSub?.paymentStatus === "trial" && `Free trial expires on: ${new Date(catalogSub.trialExpiresAt).toLocaleString()}`}
                </p>
              </div>

              {(catalogSub?.paymentStatus === 'trial' || catalogSub?.paymentStatus === 'none' || !catalogSub || (catalogSub?.paymentStatus === 'approved' && new Date(catalogSub.activeUntil) < new Date())) && (
                <button
                  onClick={() => {
                    setCatalogSenderNumber('');
                    setCatalogTrxId('');
                    setShowCatalogActivationModal(true);
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-dragon-cyan to-dragon-purple hover:opacity-90 text-dragon-black font-black uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Zap size={12} /> Upgrade Plan
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Store Branding & Cover Photo Settings */}
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-5 animate-fade-in">
          <div className="pb-3 border-b border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Settings size={15} className="text-dragon-cyan" />
                Store Branding & Cover Photo Settings
              </h3>
              <p className="text-[10px] text-gray-400 font-bold mt-1">Configure your store's brand identity for inbox and social media</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            {/* Store Name Input */}
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-450 block font-mono">
                Store Name
              </label>
              <input 
                type="text"
                placeholder="Enter your store name..."
                value={storeName}
                onChange={e => setStoreName(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 px-4 text-xs font-semibold text-white focus:outline-none focus:border-dragon-cyan transition-all"
              />
            </div>

            {/* Cover Photo Upload */}
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-450 block font-mono">
                Store Cover Photo
              </label>
              
              {coverImage ? (
                <div className="relative rounded-2xl overflow-hidden aspect-[16/5] bg-zinc-950 border border-white/10 group">
                  <img 
                    src={coverImage} 
                    className="w-full h-full object-cover" 
                    alt="Cover preview" 
                    referrerPolicy="no-referrer"
                  />
                  <button
                    type="button"
                    onClick={() => setCoverImage('')}
                    className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-red-500 text-white rounded-lg transition-colors cursor-pointer group-hover:scale-105"
                    title="Remove Cover Photo"
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center aspect-[16/5] w-full rounded-2xl border border-dashed border-white/10 bg-black/20 hover:bg-white/[0.005] hover:border-dragon-cyan/35 transition-all cursor-pointer p-4 group">
                  <UploadCloud size={20} className="text-gray-500 group-hover:text-dragon-cyan transition-colors mb-1" />
                  <span className="text-[9px] text-gray-400 font-extrabold group-hover:text-white transition-colors uppercase select-none">Upload New Cover</span>
                  <span className="text-[8px] text-gray-650 mt-0.5 uppercase select-none font-mono">Wider format (e.g. 1200x400)</span>
                  <input 
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        handleCoverPhotoUpload(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Delivery Charges Section */}
          <div className="border-t border-white/5 pt-5 space-y-4 text-left">
            <div className="flex items-center gap-2">
              <Truck size={16} className="text-dragon-cyan" />
              <h4 className="text-xs font-black uppercase tracking-widest text-white">Delivery Charges Setup</h4>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Inside Dhaka / Area 1 Config */}
              <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl space-y-3">
                <div className="text-[10px] font-black uppercase tracking-wider text-dragon-cyan block font-mono">
                  Area 1 ({userProfile?.country === 'Bangladesh' ? 'e.g. Inside Dhaka' : 'e.g. Local Delivery'})
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Area Name / Label</label>
                  <input 
                    type="text" 
                    value={deliveryLabelInside}
                    onChange={(e) => setDeliveryLabelInside(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-xl py-2 px-3 text-xs font-semibold text-white focus:outline-none focus:border-dragon-cyan transition-all"
                    placeholder={userProfile?.country === 'Bangladesh' ? "Dhaka inside" : "Local Delivery"}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Delivery Charge (Charge {currencySymbol})</label>
                  <input 
                    type="number" 
                    value={deliveryChargeInside}
                    onChange={(e) => setDeliveryChargeInside(Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/5 rounded-xl py-2 px-3 text-xs font-semibold text-white focus:outline-none focus:border-dragon-cyan transition-all"
                    placeholder={String(getDefaultDeliveryConfig(userProfile?.country || 'Bangladesh').deliveryChargeInside)}
                  />
                </div>
              </div>

              {/* Outside Dhaka / Area 2 Config */}
              <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl space-y-3">
                <div className="text-[10px] font-black uppercase tracking-wider text-[#1ca] block font-mono">
                  Area 2 ({userProfile?.country === 'Bangladesh' ? 'e.g. Outside Dhaka' : 'e.g. Outside City/State'})
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Area Name / Label</label>
                  <input 
                    type="text" 
                    value={deliveryLabelOutside}
                    onChange={(e) => setDeliveryLabelOutside(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-xl py-2 px-3 text-xs font-semibold text-white focus:outline-none focus:border-dragon-cyan transition-all"
                    placeholder={userProfile?.country === 'Bangladesh' ? "Dhaka outside" : "Outside City/State"}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Delivery Charge (Charge {currencySymbol})</label>
                  <input 
                    type="number" 
                    value={deliveryChargeOutside}
                    onChange={(e) => setDeliveryChargeOutside(Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/5 rounded-xl py-2 px-3 text-xs font-semibold text-white focus:outline-none focus:border-dragon-cyan transition-all"
                    placeholder={String(getDefaultDeliveryConfig(userProfile?.country || 'Bangladesh').deliveryChargeOutside)}
                  />
                </div>
              </div>
            </div>

            {/* Custom Area & Subarea Setup */}
            <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl space-y-4 mt-2">
              <div>
                <h5 className="text-[11px] font-black uppercase tracking-wider text-dragon-cyan">Custom Area & Sub-areas Delivery Charge</h5>
                <p className="text-[9px] text-gray-400 font-bold">Configure specific area names, delivery charges, and sub-areas.</p>
              </div>

              {/* Add Custom Area Form */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Area Name</label>
                  <input 
                    type="text" 
                    value={newAreaName}
                    onChange={(e) => setNewAreaName(e.target.value)}
                    placeholder="e.g. Mirpur" 
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-dragon-cyan transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Delivery Charge ({currencySymbol})</label>
                  <input 
                    type="number" 
                    value={newAreaCharge}
                    onChange={(e) => setNewAreaCharge(e.target.value)}
                    placeholder="e.g. 80" 
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-dragon-cyan transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Sub-areas (separate with commas)</label>
                  <input 
                    type="text" 
                    value={newSubAreasInput}
                    onChange={(e) => setNewSubAreasInput(e.target.value)}
                    placeholder="e.g. Mirpur 10, Mirpur 11" 
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-dragon-cyan transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const trimmedName = newAreaName.trim();
                    const parsedCharge = Number(newAreaCharge);
                    if (!trimmedName) return triggerSuccess('Area Required', 'Please enter an area name.');
                    if (isNaN(parsedCharge) || parsedCharge < 0) return triggerSuccess('Invalid Charge', 'Please enter a valid charge amount.');
                    
                    if (customDeliveryCharges.some(c => c.area.toLowerCase() === trimmedName.toLowerCase())) {
                      return triggerSuccess('Area Exists', 'This area is already added.');
                    }

                    const subAreasList = newSubAreasInput
                      .split(',')
                      .map(s => s.trim())
                      .filter(s => s.length > 0);

                    const updatedList = [
                      ...customDeliveryCharges, 
                      { area: trimmedName, charge: parsedCharge, subAreas: subAreasList }
                    ];
                    setCustomDeliveryCharges(updatedList);
                    setNewAreaName('');
                    setNewAreaCharge('');
                    setNewSubAreasInput('');
                  }}
                  className="px-4 py-2 bg-dragon-cyan/25 hover:bg-dragon-cyan text-dragon-black hover:text-dragon-black border border-dragon-cyan/35 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                >
                  <Plus size={12} strokeWidth={3} /> Add Area
                </button>
              </div>

              {/* Display Custom Areas list */}
              {customDeliveryCharges.length > 0 && (
                <div className="space-y-2 border-t border-white/5 pt-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Configured Custom Areas:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {customDeliveryCharges.map((item, id) => (
                      <div key={`custom-charge-${id}`} className="p-3 bg-black/40 border border-white/5 rounded-xl flex flex-col justify-between gap-2 text-left relative group">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-xs font-extrabold text-white">{item.area}</div>
                            <div className="text-[10px] font-black text-dragon-cyan font-mono mt-0.5">Delivery Charge: {currencySymbol}{item.charge}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = customDeliveryCharges.filter((_, idx2) => idx2 !== id);
                              setCustomDeliveryCharges(updated);
                            }}
                            className="p-1 hover:bg-rose-500/10 text-gray-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                            title="Remove"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>

                        {/* Sub areas list */}
                        <div className="space-y-1.5 pt-1.5 border-t border-white/5">
                          <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 block">Sub-areas:</span>
                          <div className="flex flex-wrap gap-1">
                            {(item.subAreas || []).length === 0 ? (
                              <span className="text-[8px] text-gray-600 font-bold italic">No sub-areas</span>
                            ) : (
                              item.subAreas?.map((sub, sIdx) => (
                                <span key={`sub-area-badge-${sIdx}`} className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider bg-white/5 border border-white/5 text-gray-300 px-1.5 py-0.5 rounded-md">
                                  {sub}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updatedSubAreas = (item.subAreas || []).filter((_, sIdx2) => sIdx2 !== sIdx);
                                      const updatedList = [...customDeliveryCharges];
                                      updatedList[id] = { ...item, subAreas: updatedSubAreas };
                                      setCustomDeliveryCharges(updatedList);
                                    }}
                                    className="hover:text-red-400 ml-0.5"
                                  >
                                    ✕
                                  </button>
                                </span>
                              ))
                            )}
                          </div>

                          {/* Inline sub-area add input */}
                          <div className="flex gap-1 items-center mt-1 pt-1">
                            <input 
                              type="text"
                              placeholder="New sub-area..."
                              value={inlineSubAreaText[id] || ''}
                              onChange={(e) => setInlineSubAreaText({ ...inlineSubAreaText, [id]: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const val = (inlineSubAreaText[id] || '').trim();
                                  if (!val) return;
                                  const existingSub = item.subAreas || [];
                                  if (existingSub.map(s => s.toLowerCase()).includes(val.toLowerCase())) {
                                    return triggerSuccess('Sub-area Exists', 'This sub-area already exists.');
                                  }
                                  const updatedList = [...customDeliveryCharges];
                                  updatedList[id] = { ...item, subAreas: [...existingSub, val] };
                                  setCustomDeliveryCharges(updatedList);
                                  setInlineSubAreaText({ ...inlineSubAreaText, [id]: '' });
                                }
                              }}
                              className="flex-1 bg-black/60 border border-white/5 rounded-lg px-2 py-1 text-[9px] text-white focus:outline-none focus:border-dragon-cyan"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const val = (inlineSubAreaText[id] || '').trim();
                                if (!val) return;
                                const existingSub = item.subAreas || [];
                                if (existingSub.map(s => s.toLowerCase()).includes(val.toLowerCase())) {
                                  return triggerSuccess('Sub-area Exists', 'This sub-area already exists.');
                                }
                                const updatedList = [...customDeliveryCharges];
                                updatedList[id] = { ...item, subAreas: [...existingSub, val] };
                                setCustomDeliveryCharges(updatedList);
                                setInlineSubAreaText({ ...inlineSubAreaText, [id]: '' });
                              }}
                              className="p-1 px-1.5 bg-dragon-cyan/20 text-dragon-cyan border border-dragon-cyan/35 text-[8px] font-black rounded-lg hover:bg-dragon-cyan hover:text-black transition-all cursor-pointer"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Save Branding Action Button */}
          <div className="flex justify-end pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={handleSaveStoreBranding}
              disabled={savingBranding}
              className="px-6 py-3 bg-dragon-cyan hover:bg-white text-dragon-black disabled:opacity-50 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-dragon-cyan/10 active:scale-95 flex items-center justify-center gap-2 min-h-[40px] cursor-pointer"
            >
              {savingBranding ? "Saving..." : "Save Branding"}
            </button>
          </div>
        </div>

        {/* Inventory Products Selector Panel (Table) */}
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-4">
          <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Inventory Products</h3>
              <p className="text-[10px] text-gray-500 font-bold mt-1">Select products to add to your public catalog</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2.5 py-1 bg-white/5 text-gray-300 border border-white/5 rounded-xl font-mono">
                Total Found: {filteredInventory.length}
              </span>
              <button
                type="button"
                onClick={() => setShowCatalogPreviewModal(true)}
                className="px-3.5 py-1.5 bg-dragon-cyan text-dragon-black hover:bg-white hover:text-dragon-black text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-dragon-cyan/15 active:scale-95 font-sans"
              >
                <Eye size={13} strokeWidth={3} /> View Catalog
              </button>
            </div>
          </div>

          {/* Configurator Search input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
            <input 
              type="text"
              placeholder="Search inventory products..."
              value={catalogSearch}
              onChange={e => setCatalogSearch(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 pl-10 pr-4 text-xs font-semibold text-white focus:outline-none focus:border-dragon-cyan transition-all"
            />
            {catalogSearch && (
              <button onClick={() => setCatalogSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-white">✕</button>
            )}
          </div>

          {/* List of configuration products */}
          <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
            {filteredInventory.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                <ShoppingBag size={32} className="mx-auto text-gray-700 mb-2" />
                <p className="text-xs font-bold text-gray-500 uppercase">No inventory products</p>
                <p className="text-[9px] text-gray-600 mt-1">Go to the Inventory page first to add products.</p>
              </div>
            ) : (
              filteredInventory.map((item: any, idx) => {
                const isInCatalog = item.isPublic === true;
                return (
                  <div 
                    key={`showcase-inv-${item.id}-${idx}`}
                    className={`p-3 bg-[#0a0c10] border rounded-2xl flex items-center justify-between transition-all hover:bg-white/[0.01] ${
                      isInCatalog ? 'border-dragon-cyan/20 bg-dragon-cyan/[0.01]' : 'border-white/5'
                    }`}
                  >
                    <div className="flex gap-3 items-center min-w-0 flex-1">
                      <img 
                        src={item.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80'} 
                        className="w-11 h-11 rounded-xl object-cover bg-white/5 shrink-0" 
                        alt="" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-extrabold text-white text-xs truncate max-w-xs sm:max-w-md md:max-w-lg">{item.name}</h4>
                        <div className="flex gap-2 items-center text-[10px] text-gray-500 mt-0.5 font-mono">
                          <span className="text-dragon-cyan font-bold">৳{item.sellPrice || 0}</span>
                          {item.category && <span className="bg-white/5 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider text-gray-400">{item.category}</span>}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={async () => {
                        if (isInCatalog) {
                          await handleRemoveProductFromCatalog(item);
                        } else {
                          setProductForMyCatalogSelection(item);
                          setMyCatalogPriceInput(item.sellPrice ? String(item.sellPrice) : '');
                        }
                      }}
                      className={`p-2 px-3.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 border leading-none ${
                        isInCatalog 
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/25 hover:bg-rose-500 hover:text-white' 
                          : 'bg-dragon-cyan/10 text-dragon-cyan border-dragon-cyan/25 hover:bg-dragon-cyan hover:text-black'
                      }`}
                    >
                      {isInCatalog ? 'Remove' : 'Add'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
