import React from 'react';
import { Facebook, Settings, Maximize2, Eye } from 'lucide-react';

interface TrackingSettingsTabProps {
  facebookPixel: string;
  setFacebookPixel: (val: string) => void;
  tiktokPixel: string;
  setTiktokPixel: (val: string) => void;
  gtm: string;
  setGtm: (val: string) => void;
  clarity: string;
  setClarity: (val: string) => void;
}

export const TrackingSettingsTab: React.FC<TrackingSettingsTabProps> = ({
  facebookPixel,
  setFacebookPixel,
  tiktokPixel,
  setTiktokPixel,
  gtm,
  setGtm,
  clarity,
  setClarity,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-black uppercase tracking-wider text-white">Marketing Pixels & Analytics</h2>
        <p className="text-xs text-gray-400 mt-1">Configure tracking coordinates for Facebook Ads, TikTok Pixels, Google Tag Manager (GTM), and Microsoft Clarity heatmaps</p>
      </div>

      <div className="pt-4 border-t border-white/5 space-y-6">
        
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-2">
            <Facebook size={12} className="text-blue-500" /> Facebook Pixel ID
          </label>
          <input 
            type="text" 
            value={facebookPixel}
            onChange={(e) => setFacebookPixel(e.target.value)}
            placeholder="e.g. 84930104810292"
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 outline-none focus:border-dragon-cyan text-xs font-mono font-semibold text-white"
          />
          <span className="text-[9px] text-gray-500 block">Enter your Facebook Pixel ID to track page views, add to cart, and purchase conversion events accurately.</span>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-2">
            <Settings size={12} className="text-pink-500" /> TikTok Pixel ID
          </label>
          <input 
            type="text" 
            value={tiktokPixel}
            onChange={(e) => setTiktokPixel(e.target.value)}
            placeholder="e.g. CTR230491820"
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 outline-none focus:border-dragon-cyan text-xs font-mono font-semibold text-white"
          />
          <span className="text-[9px] text-gray-500 block">Optimizes TikTok advertising campaigns with real-time conversion and order tracking hooks.</span>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-2">
            <Maximize2 size={12} className="text-dragon-cyan" /> Google Tag Manager Container ID (GTM)
          </label>
          <input 
            type="text" 
            value={gtm}
            onChange={(e) => setGtm(e.target.value)}
            placeholder="e.g. GTM-XXXXXXX"
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 outline-none focus:border-dragon-cyan text-xs font-mono font-semibold text-white"
          />
          <span className="text-[9px] text-gray-500 block">Manage Google Analytics 4, custom tags, and external conversion scripts remotely via GTM.</span>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-2">
            <Eye size={12} className="text-amber-400" /> Microsoft Clarity Project ID
          </label>
          <input 
            type="text" 
            value={clarity}
            onChange={(e) => setClarity(e.target.value)}
            placeholder="e.g. jx98k12ab3"
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 outline-none focus:border-dragon-cyan text-xs font-mono font-semibold text-white"
          />
          <span className="text-[9px] text-gray-500 block">Track user session recordings, live click heatmaps, scroll depth, and customer behavior insights via Microsoft Clarity.</span>
        </div>

      </div>
    </div>
  );
};
