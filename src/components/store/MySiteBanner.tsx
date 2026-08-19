import React from 'react';
import { Sparkles, Layout, ShoppingBag, Search, Filter } from 'lucide-react';

interface MySiteBannerProps {
  landingPagesCount: number;
  proWebsitesCount: number;
  totalSitesCount: number;
  filterType: 'all' | 'landing' | 'pro';
  setFilterType: (type: 'all' | 'landing' | 'pro') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const MySiteBanner: React.FC<MySiteBannerProps> = ({
  landingPagesCount,
  proWebsitesCount,
  totalSitesCount,
  filterType,
  setFilterType,
  searchQuery,
  setSearchQuery
}) => {
  return (
    <div className="w-full">
      {/* Banner Card */}
      <div 
        className="w-full bg-white dark:bg-[#121624] border border-slate-200 dark:border-white/10 rounded-[32px] p-6 sm:p-8 md:p-10 mb-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm mysite-banner"
      >
        <div className="z-10 text-center md:text-left w-full md:w-auto max-w-xl min-w-0 flex-1">
          <div className="inline-flex items-center gap-2 bg-pink-50 dark:bg-dragon-cyan/10 border border-pink-200 dark:border-dragon-cyan/30 px-3.5 py-1 rounded-full text-[10px] font-black text-pink-600 dark:text-dragon-cyan uppercase tracking-widest mb-4 shadow-sm">
            <Sparkles size={11} className="text-pink-600 dark:text-dragon-cyan shrink-0" /> 
            <span>MY SITE OVERVIEW</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight mb-3 text-slate-900 dark:text-white mysite-banner-title break-words">
            My Site <span className="text-pink-600 dark:text-dragon-cyan mysite-banner-accent">Dashboard</span>
          </h1>
          <p className="text-xs sm:text-sm font-bold leading-relaxed mb-6 text-slate-600 dark:text-gray-300 break-words">
            Monitor and manage the live status, catalogs, and links of your landing pages and pro websites all in one place.
          </p>

          {/* Stat Summary Boxes */}
          <div className="flex flex-wrap gap-3 sm:gap-4 items-center justify-center md:justify-start">
            <div className="flex items-center gap-3.5 px-4 sm:px-5 py-3 sm:py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm min-w-[140px] sm:min-w-[150px]">
              <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-dragon-cyan/20 border border-pink-200 dark:border-dragon-cyan/30 flex items-center justify-center shrink-0">
                <Layout size={18} className="text-pink-600 dark:text-dragon-cyan" />
              </div>
              <div className="text-left min-w-0">
                <span className="block text-xl font-black leading-tight text-slate-900 dark:text-dragon-cyan font-mono">{landingPagesCount}</span>
                <span className="text-[10px] text-slate-500 dark:text-gray-400 font-extrabold uppercase tracking-wider truncate block">Landing Pages</span>
              </div>
            </div>

            <div className="flex items-center gap-3.5 px-4 sm:px-5 py-3 sm:py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm min-w-[140px] sm:min-w-[150px]">
              <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-dragon-cyan/20 border border-pink-200 dark:border-dragon-cyan/30 flex items-center justify-center shrink-0">
                <ShoppingBag size={18} className="text-pink-600 dark:text-dragon-cyan" />
              </div>
              <div className="text-left min-w-0">
                <span className="block text-xl font-black leading-tight text-slate-900 dark:text-dragon-cyan font-mono">{proWebsitesCount}</span>
                <span className="text-[10px] text-slate-500 dark:text-gray-400 font-extrabold uppercase tracking-wider truncate block">Pro Websites</span>
              </div>
            </div>
          </div>
        </div>

        {/* Graphic Illustration */}
        <div className="relative shrink-0 w-full max-w-[240px] sm:max-w-[280px] md:max-w-[320px] flex justify-center items-center">
          <div className="relative w-full aspect-[4/3] rounded-2xl flex items-center justify-center p-2">
            <svg viewBox="0 0 400 300" className="w-full h-auto drop-shadow-xl" fill="none">
              <path d="M70 210 C70 160, 50 140, 45 100 C65 120, 75 150, 75 210 Z" fill="#2d6a4f" />
              <path d="M75 210 C75 150, 95 130, 105 90 C85 110, 70 140, 70 210 Z" fill="#40916c" />
              <path d="M72 170 C50 170, 35 155, 20 150 C40 155, 60 165, 72 170 Z" fill="#52b788" />
              <path d="M55 210 L90 210 L82 250 L63 250 Z" fill="#6b7280" />
              <rect x="120" y="40" width="240" height="170" rx="12" fill="#c084fc" stroke="#9333ea" strokeWidth="4" />
              <rect x="130" y="50" width="220" height="150" rx="8" fill="#ffffff" />
              <rect x="130" y="50" width="220" height="24" rx="8" fill="#f5f3ff" />
              <circle cx="145" cy="62" r="3" fill="#a855f7" />
              <rect x="325" y="56" width="16" height="12" rx="6" fill="#a855f7" />
              <rect x="140" y="85" width="90" height="50" rx="6" fill="#f3e8ff" />
              <path d="M145 120 Q 160 100, 175 110 T 210 95 L 225 105" stroke="#a855f7" strokeWidth="3" fill="none" />
              <rect x="240" y="85" width="100" height="100" rx="6" fill="#faf5ff" />
              <rect x="140" y="145" width="90" height="10" rx="3" fill="#e9d5ff" />
              <rect x="140" y="160" width="60" height="8" rx="3" fill="#f3e8ff" />
              <path d="M90 210 L390 210 C400 210, 400 222, 390 222 L90 222 C80 222, 80 210, 90 210 Z" fill="#cbd5e1" />
              <path d="M210 210 L270 210 L265 216 L215 216 Z" fill="#94a3b8" />
            </svg>
          </div>
        </div>
      </div>

      {/* Segmented Filter Pills & Search Bar Section */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-8">
        <div className="flex items-center bg-white dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/10 overflow-x-auto max-w-full">
          <button 
            type="button"
            onClick={() => setFilterType('all')}
            className={`whitespace-nowrap px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === 'all' 
                ? "bg-pink-600 text-white shadow-md" 
                : "text-slate-600 dark:text-gray-300 hover:text-pink-600"
            }`}
          >
            All Sites ({totalSitesCount})
          </button>
          <button 
            type="button"
            onClick={() => setFilterType('landing')}
            className={`whitespace-nowrap px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === 'landing' 
                ? "bg-pink-600 text-white shadow-md" 
                : "text-slate-600 dark:text-gray-300 hover:text-pink-600"
            }`}
          >
            Landing Pages ({landingPagesCount})
          </button>
          <button 
            type="button"
            onClick={() => setFilterType('pro')}
            className={`whitespace-nowrap px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === 'pro' 
                ? "bg-pink-600 text-white shadow-md" 
                : "text-slate-600 dark:text-gray-300 hover:text-pink-600"
            }`}
          >
            Pro Websites ({proWebsitesCount})
          </button>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" size={16} />
            <input 
              type="text"
              placeholder="Search sites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-[#121624] border border-slate-200 dark:border-white/10 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-bold text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-pink-600 shadow-sm transition-all"
            />
          </div>
          <button 
            type="button"
            className="p-2.5 bg-white dark:bg-[#121624] border border-slate-200 dark:border-white/10 rounded-2xl text-slate-600 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-white/5 transition-all shrink-0 cursor-pointer shadow-sm"
          >
            <Filter size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
