import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MoreVertical, 
  Layout, 
  ShoppingBag, 
  Globe, 
  Plus, 
  ChevronRight,
  Sparkles,
  Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StoreHeaderNavProps {
  activeTab: 'mysite' | 'mycatalog' | 'customdomain';
  setActiveTab: (tab: 'mysite' | 'mycatalog' | 'customdomain') => void;
}

export const StoreHeaderNav: React.FC<StoreHeaderNavProps> = ({
  activeTab,
  setActiveTab
}) => {
  const navigate = useNavigate();
  const [showThreeDotMenu, setShowThreeDotMenu] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  const tabs = [
    { id: 'mysite' as const, label: 'My Site', icon: Layout },
    { id: 'mycatalog' as const, label: 'My Catalog', icon: ShoppingBag },
    { id: 'customdomain' as const, label: 'Custom Domain', icon: Globe }
  ];

  return (
    <nav className="sticky top-0 left-0 w-full z-50 backdrop-blur-md bg-white/95 dark:bg-[#08090f]/90 border-b border-slate-200 dark:border-white/10 no-print transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-3 sm:py-4 flex items-center justify-between gap-3">
        {/* Left Side: Brand Logo & Mobile Menu */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Custom Three Dot Dropdown Menu */}
          <div className="relative">
            <button 
              type="button"
              onClick={() => setShowThreeDotMenu(!showThreeDotMenu)}
              className="p-2 bg-white dark:bg-white/5 hover:bg-pink-50 dark:hover:bg-white/10 text-slate-900 dark:text-white rounded-xl transition-all cursor-pointer border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-sm"
              id="my-site-threedot-btn"
              title="Menu Options"
            >
              <MoreVertical size={18} />
            </button>
            
            <AnimatePresence>
              {showThreeDotMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowThreeDotMenu(false)} 
                  />
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-[#10131f] backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-2xl p-2 z-50 shadow-2xl space-y-1 overflow-hidden"
                  >
                    <div className="px-3 py-2 text-[9px] font-black tracking-widest text-pink-600 dark:text-gray-400 uppercase border-b border-slate-100 dark:border-white/5 mb-1">
                      Store Navigation
                    </div>
                    
                    <button 
                      type="button"
                      onClick={() => {
                        setActiveTab('mysite');
                        setShowThreeDotMenu(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        activeTab === 'mysite' 
                          ? "bg-pink-600 text-white shadow-sm" 
                          : "text-slate-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-white/5"
                      }`}
                    >
                      <Layout size={14} />
                      My Site
                    </button>

                    <button 
                      type="button"
                      onClick={() => {
                        setActiveTab('mycatalog');
                        setShowThreeDotMenu(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        activeTab === 'mycatalog' 
                          ? "bg-pink-600 text-white shadow-sm" 
                          : "text-slate-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-white/5"
                      }`}
                    >
                      <ShoppingBag size={14} className={activeTab === 'mycatalog' ? 'text-white' : 'text-dragon-cyan'} />
                      My Catalog
                    </button>

                    <button 
                      type="button"
                      onClick={() => {
                        setActiveTab('customdomain');
                        setShowThreeDotMenu(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        activeTab === 'customdomain' 
                          ? "bg-pink-600 text-white shadow-sm" 
                          : "text-slate-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-white/5"
                      }`}
                    >
                      <Globe size={14} className={activeTab === 'customdomain' ? 'text-white' : 'text-dragon-cyan'} />
                      Custom Domain Setup
                    </button>
                    
                    <div className="border-t border-slate-100 dark:border-white/5 my-1" />

                    <button 
                      type="button"
                      onClick={() => {
                        setShowThreeDotMenu(false);
                        navigate('/landing-pages');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-white/5 rounded-xl transition-all cursor-pointer"
                    >
                      <Globe size={14} className="text-pink-600" />
                      Landing Page Editor
                    </button>
                    
                    <button 
                      type="button"
                      onClick={() => {
                        setShowThreeDotMenu(false);
                        navigate('/pro-website-settings/new');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-white/5 rounded-xl transition-all cursor-pointer"
                    >
                      <ShoppingBag size={14} className="text-dragon-cyan" />
                      Create Pro Website
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div 
            onClick={() => setActiveTab('mysite')}
            className="text-lg sm:text-xl font-display font-black tracking-tight text-slate-900 dark:text-white cursor-pointer select-none"
          >
            DOEL<span className="text-pink-600 dark:text-dragon-cyan">pro</span>
          </div>
        </div>

        {/* Center: Desktop Clean Tab Navigation */}
        <div className="hidden md:flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                  isActive 
                    ? "bg-white dark:bg-[#161a29] text-pink-600 dark:text-dragon-cyan shadow-sm border border-slate-200 dark:border-white/10" 
                    : "text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Icon size={14} className={isActive ? "text-pink-600 dark:text-dragon-cyan" : "opacity-70"} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Side: Quick Action & New Site Creation */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden lg:flex items-center gap-2">
            <button 
              type="button"
              onClick={() => navigate('/landing-pages')}
              className="px-3.5 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-pink-50 text-slate-700 dark:text-gray-300 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm hover:text-pink-600"
            >
              <Globe size={13} className="text-pink-600" />
              <span>Landing Pages</span>
            </button>

            <button 
              type="button"
              onClick={() => navigate('/pro-website-settings/new')}
              className="px-3.5 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-pink-50 text-slate-700 dark:text-gray-300 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm hover:text-dragon-cyan"
            >
              <ShoppingBag size={13} className="text-dragon-cyan" />
              <span>Pro Websites</span>
            </button>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCreateMenu(!showCreateMenu)}
              className="px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-pink-500/20 active:scale-95 flex items-center gap-2 cursor-pointer border border-pink-400/30 shrink-0"
              id="create-new-site-header-btn"
            >
              <Plus size={15} strokeWidth={3} />
              <span className="hidden sm:inline">New Site / Page</span>
              <span className="sm:hidden">New</span>
            </button>

            <AnimatePresence>
              {showCreateMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowCreateMenu(false)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-[#10131f] border border-slate-200 dark:border-white/10 rounded-2xl p-2 z-50 shadow-2xl space-y-1 overflow-hidden"
                  >
                    <div className="px-3 py-2 text-[9px] font-black tracking-widest text-slate-400 uppercase border-b border-slate-100 dark:border-white/5">
                      Select Site Type
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateMenu(false);
                        navigate('/landing-pages');
                      }}
                      className="w-full p-3 flex items-start gap-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-left group cursor-pointer"
                    >
                      <div className="p-2 rounded-lg bg-pink-50 dark:bg-pink-500/10 text-pink-600 border border-pink-200 dark:border-pink-500/20 group-hover:scale-110 transition-transform shrink-0">
                        <Globe size={16} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider truncate">Landing Page</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-medium line-clamp-1">Single high-converting product page</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateMenu(false);
                        navigate('/pro-website-settings/new');
                      }}
                      className="w-full p-3 flex items-start gap-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-left group cursor-pointer"
                    >
                      <div className="p-2 rounded-lg bg-cyan-50 dark:bg-dragon-cyan/10 text-cyan-600 dark:text-dragon-cyan border border-cyan-200 dark:border-dragon-cyan/20 group-hover:scale-110 transition-transform shrink-0">
                        <ShoppingBag size={16} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider truncate">Pro E-Commerce Site</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-medium line-clamp-1">Full multi-product storefront with cart</p>
                      </div>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </nav>
  );
};
