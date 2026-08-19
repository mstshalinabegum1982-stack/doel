import React from 'react';
import { 
  Upload, 
  Trash2, 
  Plus, 
  Truck, 
  Star, 
  Zap, 
  Loader2, 
  X,
  Sparkles
} from 'lucide-react';
import { COUNTRIES } from '../../utils/countriesData';

interface CategoryItem {
  id: string;
  name: string;
  image?: string;
}

interface CustomDeliveryCharge {
  area: string;
  charge: number;
}

interface GeneralSettingsTabProps {
  slug: string;
  setSlug: (val: string) => void;
  brandName: string;
  setBrandName: (val: string) => void;
  logo: string;
  setLogo: (val: string) => void;
  isUploadingLogo: boolean;
  onLogoUpload: (file: File) => void;
  defaultCountry: string;
  setDefaultCountry: (val: string) => void;
  selectedLanguage: string;
  setSelectedLanguage: (val: string) => void;
  deliveryChargeInside: number;
  setDeliveryChargeInside: (val: number) => void;
  deliveryChargeOutside: number;
  setDeliveryChargeOutside: (val: number) => void;
  deliveryLabelInside: string;
  setDeliveryLabelInside: (val: string) => void;
  deliveryLabelOutside: string;
  setDeliveryLabelOutside: (val: string) => void;
  customDeliveryCharges: CustomDeliveryCharge[];
  setCustomDeliveryCharges: React.Dispatch<React.SetStateAction<CustomDeliveryCharge[]>>;
  newProAreaName: string;
  setNewProAreaName: (val: string) => void;
  newProAreaCharge: string;
  setNewProAreaCharge: (val: string) => void;
  deliveryQtyBasedEnabled: boolean;
  setDeliveryQtyBasedEnabled: (val: boolean) => void;
  deliveryIncrementPerQty: number;
  setDeliveryIncrementPerQty: (val: number) => void;
  requireLocationTracking: boolean;
  setRequireLocationTracking: (val: boolean) => void;
  isStarEnabled: boolean;
  setIsStarEnabled: (val: boolean) => void;
  dragonBotEnabled: boolean;
  setDragonBotEnabled: (val: boolean) => void;
  categories: CategoryItem[];
  newCatName: string;
  setNewCatName: (val: string) => void;
  newCatImage: string;
  setNewCatImage: (val: string) => void;
  uploadingCatId: string | null;
  onAddCategory: () => void;
  onCategoryImageUpload: (catId: string, file: File) => void;
  onRemoveCategory: (id: string) => void;
}

export const GeneralSettingsTab: React.FC<GeneralSettingsTabProps> = ({
  slug,
  setSlug,
  brandName,
  setBrandName,
  logo,
  setLogo,
  isUploadingLogo,
  onLogoUpload,
  defaultCountry,
  setDefaultCountry,
  selectedLanguage,
  setSelectedLanguage,
  deliveryChargeInside,
  setDeliveryChargeInside,
  deliveryChargeOutside,
  setDeliveryChargeOutside,
  deliveryLabelInside,
  setDeliveryLabelInside,
  deliveryLabelOutside,
  setDeliveryLabelOutside,
  customDeliveryCharges,
  setCustomDeliveryCharges,
  newProAreaName,
  setNewProAreaName,
  newProAreaCharge,
  setNewProAreaCharge,
  deliveryQtyBasedEnabled,
  setDeliveryQtyBasedEnabled,
  deliveryIncrementPerQty,
  setDeliveryIncrementPerQty,
  requireLocationTracking,
  setRequireLocationTracking,
  isStarEnabled,
  setIsStarEnabled,
  dragonBotEnabled,
  setDragonBotEnabled,
  categories,
  newCatName,
  setNewCatName,
  newCatImage,
  setNewCatImage,
  uploadingCatId,
  onAddCategory,
  onCategoryImageUpload,
  onRemoveCategory,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-black uppercase tracking-wider text-white">General Information & Identity</h2>
        <p className="text-xs text-gray-400 mt-1">Configure your web store URL link, brand identity, country cart format, and delivery options</p>
      </div>

      <div className="pt-4 border-t border-white/5 space-y-6">
        
        {/* Slug link generator */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-dragon-cyan block">Custom Link Identifier / Slug</label>
          <div className="flex rounded-2xl bg-white/5 border border-white/10 p-1.5 focus-within:border-dragon-cyan transition-all">
            <span className="flex items-center px-3 text-xs font-bold text-gray-500 font-mono select-none">/store/</span>
            <input 
              type="text" 
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
              placeholder="e.g. dragon-gadgets"
              className="w-full bg-transparent py-2.5 pr-4 outline-none text-xs font-mono font-bold text-white placeholder-gray-600"
            />
          </div>
          <span className="text-[9px] text-gray-500 block">Your public URL: {window.location.origin}/store/{slug || 'your-store'}</span>
        </div>

        {/* Brand details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-white block">Brand / Store Name</label>
            <input 
              type="text" 
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="e.g. Dragon Official Store"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 outline-none focus:border-dragon-cyan text-xs font-semibold text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-white block">Brand Logo</label>
            <div className="flex items-center gap-3">
              <label className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border border-dashed border-white/20 hover:border-dragon-cyan cursor-pointer transition-all bg-white/5 hover:bg-white/10">
                {isUploadingLogo ? (
                  <Loader2 className="w-4 h-4 text-dragon-cyan animate-spin" />
                ) : (
                  <Upload size={14} className="text-gray-400" />
                )}
                <span className="text-xs font-bold text-gray-300">
                  {logo ? 'Change Logo Image' : 'Select Logo (PNG/JPG)'}
                </span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      onLogoUpload(e.target.files[0]);
                    }
                  }} 
                  className="hidden" 
                />
              </label>
              {logo && (
                <div className="relative w-12 h-12 rounded-xl bg-white/5 p-1 border border-white/10 shrink-0">
                  <img src={logo} alt="Logo" className="w-full h-full object-contain rounded-lg" />
                  <button 
                    type="button"
                    onClick={() => setLogo('')}
                    className="absolute -top-1.5 -right-1.5 p-1 bg-rose-500 hover:bg-rose-600 text-white rounded-full transition-all cursor-pointer shadow-lg"
                    title="Remove Logo"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Global / Country-Wise Cart Customizer */}
        <div className="p-6 bg-[#09090d] rounded-2xl border border-white/5 space-y-4">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-dragon-cyan">Country-Wise Cart & Checkout System</h3>
            <p className="text-[10px] text-gray-500 font-medium">Select your target store country. Customer checkout forms, currency symbols, and address fields will automatically adapt.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white block">Target Country (Currency & Address Format)</label>
              <select
                value={defaultCountry}
                onChange={(e) => setDefaultCountry(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 outline-none focus:border-dragon-cyan text-xs font-semibold text-white"
              >
                {COUNTRIES.map(c => (
                  <option key={c.name} value={c.name} className="bg-[#09090d] text-white">
                    {c.name} ({c.currencySymbol} {c.currency})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white block">Store Language (Customer Facing)</label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 outline-none focus:border-dragon-cyan text-xs font-semibold text-white"
              >
                <option value="bn" className="bg-[#09090d] text-white">বাংলা (Bangla)</option>
                <option value="en" className="bg-[#09090d] text-white">English (US/UK)</option>
                <option value="ar" className="bg-[#09090d] text-white">العربية (Arabic)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Delivery Charges Section with Custom Labeling & Quantity Multipliers */}
        <div className="p-6 bg-[#09090d] rounded-2xl border border-white/5 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-dragon-cyan/20 flex items-center justify-center text-dragon-cyan">
              <Truck size={16} />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-white">Delivery Charge Configuration</h3>
              <p className="text-[10px] text-gray-500 font-medium">Set custom area labels, pricing, quantity increments, and regional charge overrides.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Inside City Standard Option */}
            <div className="p-4 bg-white/2 rounded-2xl border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-dragon-cyan">Primary / Inside City Option</span>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] text-gray-400 uppercase font-black">Option Label (e.g. Inside Dhaka)</label>
                <input 
                  type="text" 
                  value={deliveryLabelInside}
                  onChange={(e) => setDeliveryLabelInside(e.target.value)}
                  placeholder="Inside Dhaka"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 outline-none focus:border-dragon-cyan text-xs text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] text-gray-400 uppercase font-black">Delivery Cost Amount</label>
                <input 
                  type="number" 
                  value={deliveryChargeInside === 0 ? '' : deliveryChargeInside}
                  onChange={(e) => setDeliveryChargeInside(Number(e.target.value) || 0)}
                  placeholder="80"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 outline-none focus:border-dragon-cyan text-xs text-white font-mono"
                />
              </div>
            </div>

            {/* Outside City Standard Option */}
            <div className="p-4 bg-white/2 rounded-2xl border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Secondary / Outside City Option</span>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] text-gray-400 uppercase font-black">Option Label (e.g. Outside Dhaka)</label>
                <input 
                  type="text" 
                  value={deliveryLabelOutside}
                  onChange={(e) => setDeliveryLabelOutside(e.target.value)}
                  placeholder="Outside Dhaka"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 outline-none focus:border-dragon-cyan text-xs text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] text-gray-400 uppercase font-black">Delivery Cost Amount</label>
                <input 
                  type="number" 
                  value={deliveryChargeOutside === 0 ? '' : deliveryChargeOutside}
                  onChange={(e) => setDeliveryChargeOutside(Number(e.target.value) || 0)}
                  placeholder="130"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 outline-none focus:border-dragon-cyan text-xs text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Custom Delivery Area Overrides List */}
          <div className="space-y-3 pt-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">
              Additional Regional Delivery Areas (Optional Overrides)
            </label>
            
            {/* Custom delivery charge adder inputs */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input 
                type="text"
                placeholder="Area Name (e.g. Chittagong Suburbs, Express 24H)"
                value={newProAreaName}
                onChange={(e) => setNewProAreaName(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-dragon-cyan"
              />
              <input 
                type="number"
                placeholder="Cost (e.g. 150)"
                value={newProAreaCharge}
                onChange={(e) => setNewProAreaCharge(e.target.value)}
                className="w-full sm:w-32 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-dragon-cyan font-mono"
              />
              <button
                type="button"
                onClick={() => {
                  if (newProAreaName.trim() && newProAreaCharge !== '') {
                    setCustomDeliveryCharges(prev => [...prev, { area: newProAreaName.trim(), charge: Number(newProAreaCharge) || 0 }]);
                    setNewProAreaName('');
                    setNewProAreaCharge('');
                  }
                }}
                className="px-4 py-2 bg-dragon-cyan/20 hover:bg-dragon-cyan/30 text-dragon-cyan rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Plus size={14} /> Add Area
              </button>
            </div>

            {/* List of custom areas */}
            {customDeliveryCharges.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {customDeliveryCharges.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white/5 border border-white/10 px-3 py-2 rounded-xl text-xs text-white">
                    <span className="font-bold truncate mr-2">{item.area}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-dragon-cyan font-bold">+{item.charge}</span>
                      <button
                        type="button"
                        onClick={() => setCustomDeliveryCharges(prev => prev.filter((_, i) => i !== idx))}
                        className="text-rose-400 hover:text-rose-300 p-1 rounded-md hover:bg-rose-500/10 cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quantity Based Increment Toggle & Settings */}
          <div className="pt-3 border-t border-white/5 space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/2 rounded-xl border border-white/5">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-gray-200 block">Quantity-Based Increment Rule</span>
                <span className="text-[9px] text-gray-500 block">Automatically add an extra charge for each additional product ordered beyond the 1st item.</span>
              </div>
              <button
                type="button"
                onClick={() => setDeliveryQtyBasedEnabled(!deliveryQtyBasedEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  deliveryQtyBasedEnabled ? 'bg-dragon-cyan animate-none' : 'bg-white/10'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${
                    deliveryQtyBasedEnabled ? 'translate-x-5 bg-black' : 'translate-x-0 bg-gray-400'
                  }`}
                />
              </button>
            </div>

            {deliveryQtyBasedEnabled && (
              <div className="p-4 bg-dragon-cyan/5 border border-dragon-cyan/20 rounded-xl space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between gap-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-dragon-cyan">Extra Cost Per Additional Quantity</label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-400">+</span>
                    <input 
                      type="number"
                      value={deliveryIncrementPerQty}
                      onChange={(e) => setDeliveryIncrementPerQty(Number(e.target.value) || 0)}
                      placeholder="20"
                      className="w-24 bg-white/10 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono text-center outline-none focus:border-dragon-cyan"
                    />
                  </div>
                </div>
                <p className="text-[9px] text-gray-400">
                  Example calculation: 1 pc = standard base charge. 2 pcs = Base + {deliveryIncrementPerQty}. 3 pcs = Base + {deliveryIncrementPerQty * 2}.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* GPS Live Location Toggle */}
        <div className="flex items-center justify-between p-4 bg-white/2 rounded-2xl border border-white/5">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-200 block">Require Precise Customer GPS Location (Customer Exact Location Pin)</span>
            <span className="text-[10px] text-gray-500 block">Enable automatic one-click GPS coordinate capture upon placing orders to eliminate false delivery addresses.</span>
          </div>
          <button
            type="button"
            onClick={() => setRequireLocationTracking(!requireLocationTracking)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              requireLocationTracking ? 'bg-dragon-cyan animate-none' : 'bg-white/10'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${
                requireLocationTracking ? 'translate-x-5 bg-black' : 'translate-x-0 bg-gray-400'
              }`}
            />
          </button>
        </div>

        {/* Star Rating & Social Proof Configuration Toggle */}
        <div className="flex items-center justify-between p-4 bg-white/2 rounded-2xl border border-white/5">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Star size={14} className="text-amber-400 fill-amber-400" />
              <span className="text-xs font-bold text-gray-200">Show 5-Star Ratings & Social Trust Proof</span>
            </div>
            <span className="text-[10px] text-gray-500 block">Showcase genuine customer review stars, ratings score, and buyer satisfaction badges on your store.</span>
          </div>
          <button
            type="button"
            onClick={() => setIsStarEnabled(!isStarEnabled)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isStarEnabled ? 'bg-dragon-cyan animate-none' : 'bg-white/10'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${
                isStarEnabled ? 'translate-x-5 bg-black' : 'translate-x-0 bg-gray-400'
              }`}
            />
          </button>
        </div>

        {/* DOEL Messenger AI Bot Assistant Toggle */}
        <div className="p-6 bg-gradient-to-br from-dragon-cyan/5 via-transparent to-transparent rounded-2xl border border-dragon-cyan/20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-dragon-cyan/20 flex items-center justify-center text-dragon-cyan">
                <Zap size={16} />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-1.5">
                  DOEL AI Smart Chatbot Assistant <Sparkles size={12} className="text-dragon-cyan animate-pulse" />
                </h3>
                <p className="text-[10px] text-gray-400 font-medium">Automatic 24/7 intelligent answering robot for visitor questions, stock availability & immediate order guidance.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDragonBotEnabled(!dragonBotEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                dragonBotEnabled ? 'bg-dragon-cyan animate-none' : 'bg-white/10'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${
                  dragonBotEnabled ? 'translate-x-5 bg-black' : 'translate-x-0 bg-gray-400'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Custom Product Categories Adder Section */}
        <div className="p-6 bg-[#09090d] rounded-2xl border border-white/5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-dragon-cyan/20 flex items-center justify-center text-dragon-cyan">
              <Plus size={16} />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-white">Product Category Configuration</h3>
              <p className="text-[10px] text-gray-500 font-medium">Create product categories for your pro website, e.g., Cooker, Blender, etc.</p>
            </div>
          </div>

          <div className="space-y-4 pt-2 border-t border-white/5">
            <p className="text-[11px] text-amber-400/90 font-medium bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl">
              💡 <strong>ছবি যুক্ত করুন:</strong> প্রতিটি ক্যাটাগরির সাথে ছবি যুক্ত করলে আপনার পাবলিশড প্রো ওয়েবসাইট-এ কাভার ফটোর নিচে রাউন্ড (Circular) আকারে সুন্দর ক্যাটাগরি ছবি ও নাম প্রদর্শিত হবে।
            </p>

            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
              {/* New Category Image Selector */}
              <div className="relative shrink-0 flex items-center justify-center">
                <label className="w-12 h-12 rounded-full border-2 border-dashed border-dragon-cyan/50 hover:border-dragon-cyan bg-white/5 hover:bg-white/10 cursor-pointer flex flex-col items-center justify-center overflow-hidden transition-all group">
                  {newCatImage ? (
                    <img src={newCatImage} alt="Category" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-dragon-cyan">
                      <Upload size={14} />
                      <span className="text-[7px] font-black uppercase mt-0.5">Photo</span>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        onCategoryImageUpload('new', e.target.files[0]);
                      }
                    }}
                  />
                </label>
                {newCatImage && (
                  <button
                    type="button"
                    onClick={() => setNewCatImage('')}
                    className="absolute -top-1 -right-1 bg-rose-600 text-white p-0.5 rounded-full hover:scale-110 cursor-pointer"
                    title="Remove Image"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>

              <input 
                type="text" 
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Enter category name (e.g., Cooker, Blender)"
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-3 px-4 outline-none focus:border-dragon-cyan text-xs font-semibold text-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onAddCategory();
                  }
                }}
              />

              <button
                type="button"
                onClick={onAddCategory}
                className="px-5 py-3 bg-dragon-cyan hover:bg-dragon-cyan/95 text-dragon-black rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0 font-sans"
              >
                <Plus size={14} /> Add Category
              </button>
            </div>

            {/* List of configured categories with circular avatars & upload buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-3">
              {categories.map((cat) => (
                <div 
                  key={cat.id} 
                  className="flex items-center justify-between gap-2 bg-white/5 border border-white/10 rounded-2xl p-2.5 text-xs text-white hover:border-white/20 transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Circular image badge */}
                    <div className="relative shrink-0">
                      <label className="w-10 h-10 rounded-full border-2 border-dragon-cyan/40 bg-black/40 overflow-hidden flex items-center justify-center cursor-pointer hover:border-dragon-cyan transition-all group">
                        {cat.image ? (
                          <img src={cat.image} alt={cat.name} className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center text-dragon-cyan font-black text-xs">
                            {cat.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {cat.id !== 'all' && (
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[8px] font-black transition-opacity">
                            <Upload size={12} />
                          </div>
                        )}
                        {cat.id !== 'all' && (
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                onCategoryImageUpload(cat.id, e.target.files[0]);
                              }
                            }}
                          />
                        )}
                      </label>
                      {uploadingCatId === cat.id && (
                        <div className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center">
                          <Loader2 size={12} className="animate-spin text-dragon-cyan" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="font-bold text-xs truncate text-white">{cat.name}</p>
                      <p className="text-[9px] text-gray-400 flex items-center gap-1">
                        {cat.image ? '📷 Image Attached' : 'No photo'}
                      </p>
                    </div>
                  </div>

                  {cat.id !== 'all' && (
                    <div className="flex items-center gap-1">
                      <label className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-dragon-cyan rounded-lg cursor-pointer transition-colors" title="Upload/Change Photo">
                        <Upload size={12} />
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              onCategoryImageUpload(cat.id, e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => onRemoveCategory(cat.id)}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg transition-colors cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Product and detail specification */}
        <div className="pt-6 border-t border-white/5 text-center py-4 bg-white/2 rounded-2xl">
          <h3 className="text-xs font-black uppercase tracking-widest text-[#2e2] mb-1">📢 Automatic Showcase Live</h3>
          <p className="text-[10px] text-gray-400">Your store's catalog products and main homepage details are automatically synchronized.</p>
        </div>

      </div>
    </div>
  );
};
