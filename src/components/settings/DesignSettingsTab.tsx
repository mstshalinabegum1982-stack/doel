import React from 'react';
import { cn } from '../../lib/utils';

interface DesignSettingsTabProps {
  themeColor: string;
  setThemeColor: (val: string) => void;
  titleColor: string;
  setTitleColor: (val: string) => void;
  storeNameColor: string;
  setStoreNameColor: (val: string) => void;
  descriptionColor: string;
  setDescriptionColor: (val: string) => void;
  priceColor: string;
  setPriceColor: (val: string) => void;
  discountColor: string;
  setDiscountColor: (val: string) => void;
  buttonColor: string;
  setButtonColor: (val: string) => void;
  buttonTextColor: string;
  setButtonTextColor: (val: string) => void;
  headerBg: 'black' | 'white';
  setHeaderBg: (val: 'black' | 'white') => void;
  bodyBg: 'black' | 'white';
  setBodyBg: (val: 'black' | 'white') => void;
  footerBg: 'black' | 'white';
  setFooterBg: (val: 'black' | 'white') => void;
}

export const DesignSettingsTab: React.FC<DesignSettingsTabProps> = ({
  themeColor,
  setThemeColor,
  titleColor,
  setTitleColor,
  storeNameColor,
  setStoreNameColor,
  descriptionColor,
  setDescriptionColor,
  priceColor,
  setPriceColor,
  discountColor,
  setDiscountColor,
  buttonColor,
  setButtonColor,
  buttonTextColor,
  setButtonTextColor,
  headerBg,
  setHeaderBg,
  bodyBg,
  setBodyBg,
  footerBg,
  setFooterBg,
}) => {
  const presets = [
    { name: 'Classic Indigo', theme: '#6366f1', text: '#ffffff', desc: '#d1d5db', price: '#6366f1', discount: '#ef4444', button: '#6366f1', buttonText: '#ffffff' },
    { name: 'Glamour Pink', theme: '#ec4899', text: '#ffffff', desc: '#fce7f3', price: '#ec4899', discount: '#e11d48', button: '#ec4899', buttonText: '#ffffff' },
    { name: 'Dragon Cyan', theme: '#2dd4bf', text: '#ffffff', desc: '#d1d5db', price: '#2dd4bf', discount: '#ef4444', button: '#2dd4bf', buttonText: '#000000' },
    { name: 'Royal Gold', theme: '#fbbf24', text: '#ffffff', desc: '#e5e7eb', price: '#fbbf24', discount: '#f43f5e', button: '#fbbf24', buttonText: '#000000' },
    { name: 'Crimson Red', theme: '#f43f5e', text: '#ffffff', desc: '#d1d5db', price: '#f43f5e', discount: '#e5e7eb', button: '#f43f5e', buttonText: '#ffffff' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-black uppercase tracking-wider text-white">Store Theme & Colors Customizer</h2>
        <p className="text-xs text-gray-400 mt-1">Select from beautiful quick presets or set exact custom hex color schemes</p>
      </div>

      <div className="pt-4 border-t border-white/5 space-y-6">
        
        {/* Visual Preset Selection */}
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-dragon-cyan block">Choose Quick Theme Preset</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {presets.map(preset => (
              <button
                key={preset.name}
                onClick={() => {
                  setThemeColor(preset.theme);
                  setTitleColor(preset.text);
                  setStoreNameColor(preset.text);
                  setDescriptionColor(preset.desc);
                  setPriceColor(preset.price);
                  setDiscountColor(preset.discount);
                  setButtonColor(preset.button);
                  setButtonTextColor(preset.buttonText);
                }}
                type="button"
                className={cn(
                  "p-4 bg-white/2 hover:bg-white/5 border rounded-2xl text-left transition-all cursor-pointer",
                  themeColor === preset.theme ? "border-dragon-cyan/40 bg-dragon-cyan/5" : "border-white/5"
                )}
              >
                <div className="w-6 h-6 rounded-full mb-2 flex items-center justify-center border border-white/10" style={{ backgroundColor: preset.theme }}>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: preset.buttonText }} />
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-wider text-white truncate">{preset.name}</h4>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-white">Custom Color Palette</h3>

            <div className="flex items-center justify-between p-3.5 bg-white/2 rounded-2xl border border-white/5">
              <span className="text-xs font-bold text-gray-300">Theme Accent Color</span>
              <input 
                type="color" 
                value={themeColor} 
                onChange={(e) => {
                  setThemeColor(e.target.value);
                  setButtonColor(e.target.value);
                  setPriceColor(e.target.value);
                }}
                className="w-10 h-10 border-0 bg-transparent rounded-xl cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-white/2 rounded-2xl border border-white/5">
              <span className="text-xs font-bold text-gray-300">Main Title Text Color</span>
              <input 
                type="color" 
                value={titleColor} 
                onChange={(e) => setTitleColor(e.target.value)}
                className="w-10 h-10 border-0 bg-transparent rounded-xl cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-white/2 rounded-2xl border border-white/5">
              <div>
                <span className="text-xs font-bold text-gray-300 block">Header Store Name Color (স্টোর নেমের কালার)</span>
                <span className="text-[9px] text-gray-500 font-medium block">Color of store name in header when logo is not uploaded</span>
              </div>
              <input 
                type="color" 
                value={storeNameColor} 
                onChange={(e) => setStoreNameColor(e.target.value)}
                className="w-10 h-10 border-0 bg-transparent rounded-xl cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-white/2 rounded-2xl border border-white/5">
              <span className="text-xs font-bold text-gray-300">Body & Details Text Color</span>
              <input 
                type="color" 
                value={descriptionColor} 
                onChange={(e) => setDescriptionColor(e.target.value)}
                className="w-10 h-10 border-0 bg-transparent rounded-xl cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-white">E-Commerce Pricing Colors</h3>

            <div className="flex items-center justify-between p-3.5 bg-white/2 rounded-2xl border border-white/5">
              <span className="text-xs font-bold text-gray-300">Showcase Price Color</span>
              <input 
                type="color" 
                value={priceColor} 
                onChange={(e) => setPriceColor(e.target.value)}
                className="w-10 h-10 border-0 bg-transparent rounded-xl cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-white/2 rounded-2xl border border-white/5">
              <span className="text-xs font-bold text-gray-300">Discount & Strikethrough Color</span>
              <input 
                type="color" 
                value={discountColor} 
                onChange={(e) => setDiscountColor(e.target.value)}
                className="w-10 h-10 border-0 bg-transparent rounded-xl cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-white/2 rounded-2xl border border-white/5">
              <span className="text-xs font-bold text-gray-300">Confirm Order Button Background</span>
              <input 
                type="color" 
                value={buttonColor} 
                onChange={(e) => setButtonColor(e.target.value)}
                className="w-10 h-10 border-0 bg-transparent rounded-xl cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-white/2 rounded-2xl border border-white/5">
              <span className="text-xs font-bold text-gray-300">Confirm Order Button Text Color</span>
              <input 
                type="color" 
                value={buttonTextColor} 
                onChange={(e) => setButtonTextColor(e.target.value)}
                className="w-10 h-10 border-0 bg-transparent rounded-xl cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Header, Body, & Footer Background Customization for Pro Sites */}
        <div className="space-y-4 pt-6 border-t border-white/5 mt-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-white">Page Backgrounds & Color Modes</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Header bg select */}
            <div className="p-4 bg-white/2 rounded-2xl border border-white/5 space-y-3">
              <span className="block text-xs font-bold text-gray-300">Header Background</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setHeaderBg('black')}
                  className={cn(
                    "py-2 px-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                    headerBg === 'black' ? "bg-black text-white border-white/30" : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                  )}
                >
                  Solid Black
                </button>
                <button
                  type="button"
                  onClick={() => setHeaderBg('white')}
                  className={cn(
                    "py-2 px-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                    headerBg === 'white' ? "bg-white text-black border-black/30" : "bg-white/5 border-white/10 text-gray-400 hover:text-black"
                  )}
                >
                  Solid White
                </button>
              </div>
            </div>

            {/* Body bg select */}
            <div className="p-4 bg-white/2 rounded-2xl border border-white/5 space-y-3">
              <span className="block text-xs font-bold text-gray-300">Body Background</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBodyBg('black')}
                  className={cn(
                    "py-2 px-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                    bodyBg === 'black' ? "bg-black text-white border-white/30" : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                  )}
                >
                  Solid Black
                </button>
                <button
                  type="button"
                  onClick={() => setBodyBg('white')}
                  className={cn(
                    "py-2 px-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                    bodyBg === 'white' ? "bg-white text-black border-black/30" : "bg-white/5 border-white/10 text-gray-400 hover:text-black"
                  )}
                >
                  Solid White
                </button>
              </div>
            </div>

            {/* Footer bg select */}
            <div className="p-4 bg-white/2 rounded-2xl border border-white/5 space-y-3">
              <span className="block text-xs font-bold text-gray-300">Footer Background</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFooterBg('black')}
                  className={cn(
                    "py-2 px-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                    footerBg === 'black' ? "bg-black text-white border-white/30" : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                  )}
                >
                  Solid Black
                </button>
                <button
                  type="button"
                  onClick={() => setFooterBg('white')}
                  className={cn(
                    "py-2 px-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                    footerBg === 'white' ? "bg-white text-black border-black/30" : "bg-white/5 border-white/10 text-gray-400 hover:text-black"
                  )}
                >
                  Solid White
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
