import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, 
  Upload, 
  Palette, 
  Tv, 
  ShieldCheck, 
  Megaphone, 
  Link2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';

export type SettingsTabType = 'general' | 'covers' | 'design' | 'social' | 'policies' | 'tracking' | 'domain';

interface SettingsSidebarNavProps {
  activeTab: SettingsTabType;
  setActiveTab: (tab: SettingsTabType) => void;
  savedSuccess: boolean;
  errorMessage: string;
}

export const SettingsSidebarNav: React.FC<SettingsSidebarNavProps> = ({
  activeTab,
  setActiveTab,
  savedSuccess,
  errorMessage,
}) => {
  const tabs = [
    { id: 'general' as SettingsTabType, label: 'General Settings', desc: 'Name, logo, and showcase specs', icon: Globe },
    { id: 'covers' as SettingsTabType, label: '4 Hero Covers', desc: 'Upload slide banners', icon: Upload },
    { id: 'design' as SettingsTabType, label: 'Colors & Design', desc: 'Configure themes & text colors', icon: Palette },
    { id: 'social' as SettingsTabType, label: 'Socials & Contacts', desc: 'Social channels and info support', icon: Tv },
    { id: 'policies' as SettingsTabType, label: 'Footer Policy Pages', desc: 'Editable policy details for customer help', icon: ShieldCheck },
    { id: 'tracking' as SettingsTabType, label: 'Pixels & GTM Tracker', desc: 'Facebook, TikTok, and GTM codes', icon: Megaphone },
    { id: 'domain' as SettingsTabType, label: 'Custom Domain', desc: 'Connect your own professional domain', icon: Link2 }
  ];

  return (
    <div className="lg:col-span-1 space-y-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => setActiveTab(tab.id)}
          className={cn(
            "w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3",
            activeTab === tab.id 
              ? "bg-dragon-cyan/10 border-dragon-cyan/30 text-white" 
              : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:border-white/10"
          )}
        >
          <div className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
            activeTab === tab.id ? "bg-dragon-cyan text-dragon-black" : "bg-white/5 text-gray-400"
          )}>
            <tab.icon size={16} />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider">{tab.label}</h3>
            <p className="text-[9px] text-gray-500 font-medium font-sans mt-0.5">{tab.desc}</p>
          </div>
        </button>
      ))}

      {/* Quick Alert Status */}
      <AnimatePresence>
        {savedSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-6 p-4 bg-dragon-emerald/10 border border-dragon-emerald/20 text-dragon-emerald rounded-2xl flex items-center gap-3"
          >
            <CheckCircle2 size={18} className="shrink-0" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-tight">Settings Saved</h4>
              <p className="text-[9px] text-gray-400 leading-normal">Your professional store configuration is updated in real-time.</p>
            </div>
          </motion.div>
        )}
        
        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center gap-3"
          >
            <AlertCircle size={18} className="shrink-0" />
            <p className="text-[10px] font-medium leading-relaxed">{errorMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
