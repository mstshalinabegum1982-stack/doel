import React from 'react';
import { Facebook, Settings, Tv, MessageCircle, User } from 'lucide-react';

interface SocialSettingsTabProps {
  fbPage: string;
  setFbPage: (val: string) => void;
  tiktokPage: string;
  setTiktokPage: (val: string) => void;
  youtubeChannel: string;
  setYoutubeChannel: (val: string) => void;
  whatsapp: string;
  setWhatsapp: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  aboutText: string;
  setAboutText: (val: string) => void;
}

export const SocialSettingsTab: React.FC<SocialSettingsTabProps> = ({
  fbPage,
  setFbPage,
  tiktokPage,
  setTiktokPage,
  youtubeChannel,
  setYoutubeChannel,
  whatsapp,
  setWhatsapp,
  email,
  setEmail,
  aboutText,
  setAboutText,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-black uppercase tracking-wider text-white">Social Media & Contacts Support</h2>
        <p className="text-xs text-gray-400 mt-1">Configure dropdown links and connections for social media networks</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
        
        {/* Social inputs */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-dragon-cyan">Social Media Profile Links</h3>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-2">
              <Facebook size={12} className="text-blue-500" /> Facebook Page / Group Link
            </label>
            <input 
              type="url" 
              value={fbPage}
              onChange={(e) => setFbPage(e.target.value)}
              placeholder="https://facebook.com/yourpage"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 outline-none focus:border-dragon-cyan text-xs font-semibold text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-2">
              <Settings size={12} className="text-pink-500" /> TikTok Profile / Shop Link
            </label>
            <input 
              type="url" 
              value={tiktokPage}
              onChange={(e) => setTiktokPage(e.target.value)}
              placeholder="https://tiktok.com/@youraccount"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 outline-none focus:border-dragon-cyan text-xs font-semibold text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-2">
              <Tv size={12} className="text-red-500" /> YouTube Channel Link
            </label>
            <input 
              type="url" 
              value={youtubeChannel}
              onChange={(e) => setYoutubeChannel(e.target.value)}
              placeholder="https://youtube.com/c/yourchannel"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 outline-none focus:border-dragon-cyan text-xs font-semibold text-white"
            />
          </div>
        </div>

        {/* Contact and WhatsApp Support Dropdowns */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-dragon-cyan">Contact & Customer Support Settings</h3>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-2">
              <MessageCircle size={12} className="text-green-500" /> WhatsApp Customer Support Phone
            </label>
            <input 
              type="tel" 
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="e.g. +8801700000000"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 outline-none focus:border-dragon-cyan text-xs font-semibold text-white"
            />
            <span className="text-[9px] text-gray-500 block">Start dynamic WhatsApp conversations directly from your store page.</span>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-2">
              <User size={12} className="text-dragon-cyan" /> Email Support Address
            </label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. support@yourbrand.com"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 outline-none focus:border-dragon-cyan text-xs font-semibold text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-white block">About Brand / Shop Short Bio (Footer)</label>
            <textarea 
              rows={3}
              value={aboutText}
              onChange={(e) => setAboutText(e.target.value)}
              placeholder="We guarantee premium product quality and absolute customer satisfaction."
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 outline-none focus:border-dragon-cyan text-xs font-semibold text-white resize-none"
            />
          </div>
        </div>

      </div>
    </div>
  );
};
