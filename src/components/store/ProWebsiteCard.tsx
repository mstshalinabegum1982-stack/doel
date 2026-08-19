import React from 'react';
import { 
  Globe, 
  ShoppingBag, 
  Copy, 
  Check, 
  ExternalLink, 
  Edit3, 
  Trash2, 
  Plus, 
  Star, 
  MessageSquare, 
  Bot, 
  Zap 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { ProWebsiteData } from './types';
import { getCreatedTime } from './Timers';
import { ReviewsPanel } from '../ReviewsPanel';

interface ProWebsiteCardProps {
  website: ProWebsiteData;
  index: number;
  currentOrigin: string;
  copiedId: string | null;
  deleteConfirmId: string | null;
  expandedReviewsSiteId: string | null;
  onCopyLink: (url: string, id: string) => void;
  onDeleteConfirm: (id: string) => void;
  onDeleteItem: (colName: 'landing-pages' | 'pro_websites', id: string) => void;
  onToggleReviews: (id: string) => void;
  onOpenProductModal: (website: ProWebsiteData) => void;
  onOpenBotActivationModal: (website: ProWebsiteData) => void;
}

export const ProWebsiteCard: React.FC<ProWebsiteCardProps> = ({
  website,
  index,
  currentOrigin,
  copiedId,
  deleteConfirmId,
  expandedReviewsSiteId,
  onCopyLink,
  onDeleteConfirm,
  onDeleteItem,
  onToggleReviews,
  onOpenProductModal,
  onOpenBotActivationModal
}) => {
  const navigate = useNavigate();
  const absoluteUrl = `${currentOrigin}/w/${website.slug}`;
  const themeColor = website.colors?.theme || '#a855f7';

  const getBotStatusTextAndColor = (site: ProWebsiteData) => {
    if (!site.dragonBotEnabled) {
      return {
        text: 'Bot Disabled',
        colorClass: 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20',
        isActive: false,
        isPending: false,
        status: 'disabled'
      };
    }

    if (site.botPaymentStatus === 'approved') {
      const expTime = site.botExpiryTime ? new Date(site.botExpiryTime).getTime() : 0;
      if (expTime > Date.now()) {
        const dateStr = new Date(expTime).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
        return {
          text: `Premium Active (Expires: ${dateStr})`,
          colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 border-emerald-500/30 font-bold',
          isActive: true,
          isPending: false,
          status: 'premium'
        };
      }
    }

    if (site.botPaymentStatus === 'pending') {
      return {
        text: 'Verification Pending',
        colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20 border-amber-500/30 font-bold',
        isActive: false,
        isPending: true,
        status: 'pending'
      };
    }

    // Check trial remaining
    if (site.createdAt) {
      const createdTime = getCreatedTime(site);
      const trialExpiry = createdTime + 48 * 60 * 60 * 1000; // 48 hours
      const diff = trialExpiry - Date.now();
      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return {
          text: `Free Trial (${hours}h ${minutes}m left)`,
          colorClass: 'text-dragon-cyan bg-dragon-cyan/10 border-dragon-cyan/20 border-dragon-cyan/30 font-bold',
          isActive: true,
          isPending: false,
          status: 'trial',
          timeLeftStr: `${hours}h ${minutes}m`
        };
      }
    }

    return {
      text: 'Free Trial Expired',
      colorClass: 'text-rose-400 bg-rose-500/10 border-rose-500/20 border-rose-500/30 font-bold',
      isActive: false,
      isPending: false,
      status: 'expired'
    };
  };

  const botStatus = getBotStatusTextAndColor(website);

  return (
    <div 
      className={cn(
        "w-full bg-white dark:bg-[#121624] border border-slate-200 dark:border-white/10 rounded-[28px] p-4 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-5 lg:gap-6 items-stretch overflow-hidden group",
        expandedReviewsSiteId === website.id ? "border-amber-400/40 shadow-lg" : ""
      )}
    >
      {/* Left Side: Mockup Image of Pro Website */}
      <div className="w-full md:w-56 lg:w-64 h-56 md:h-auto min-h-[220px] rounded-2xl overflow-hidden relative border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#0c0f1d] shrink-0 flex items-center justify-center group/thumb">
        {website.bannerImage || website.catalog?.[0]?.image ? (
          <img 
            src={website.bannerImage || website.catalog?.[0]?.image} 
            alt={website.brandName}
            className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-slate-50 dark:bg-[#0c0f1d] p-4 flex flex-col justify-between text-slate-800 dark:text-white relative">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-dragon-cyan flex items-center gap-1">
              <ShoppingBag size={12} /> {website.brandName || 'Pro Store'}
            </div>
            <div className="my-auto text-center space-y-2 px-2">
              <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white line-clamp-1 break-words">{website.brandName || 'Pro Store'}</h4>
              <p className="text-[10px] text-slate-500 dark:text-gray-400 font-bold">Catalog Items: {website.catalog?.length || 0}</p>
            </div>
            <div className="text-[9px] text-slate-400 dark:text-slate-500 font-mono text-center uppercase tracking-widest font-bold">PRO STORE</div>
          </div>
        )}
      </div>

      {/* Right Side: Pro Site Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between space-y-3">
        <div>
          {/* Top Header: Title & Badges */}
          <div className="flex flex-wrap justify-between items-start gap-2 mb-1.5">
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-snug break-words line-clamp-1 min-w-0 flex-1">
              {website.brandName || 'Unnamed Store'}
            </h3>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 px-2.5 py-1 rounded-md text-[9px] font-extrabold uppercase text-slate-700 dark:text-gray-300">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: themeColor }} />
                THEME
              </div>
              <span className="bg-black text-[#f2f2f2] border border-black text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md">
                PRO SITE
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-2.5">
            <span className="text-xs font-bold text-slate-500 dark:text-gray-400">
              Products in Catalog: <strong className="text-slate-900 dark:text-white font-mono">{website.catalog?.length || 0}</strong>
            </span>
            <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
              ACTIVE
            </span>
          </div>

          {/* Dragon Bot Panel Box */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 space-y-2 mb-3 min-w-0">
            <div className="flex justify-between items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-gray-300 flex items-center gap-1.5 truncate min-w-0">
                <MessageSquare size={12} className="text-pink-600 shrink-0" /> 
                <span className="truncate">DRAGON BOT</span>
              </span>
              <span className="text-[9px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded-md font-extrabold uppercase shrink-0">
                {botStatus.isActive ? "ONLINE" : "STANDBY"}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 items-stretch">
              <div className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 text-[10px] font-bold text-center sm:text-left flex items-center justify-center sm:justify-start gap-1.5 truncate">
                <Bot size={13} className="text-pink-600 shrink-0" />
                <span className="truncate">{botStatus.text}</span>
              </div>

              {(!botStatus.isActive || botStatus.status === 'trial' || botStatus.status === 'expired') && (
                <button
                  type="button"
                  onClick={() => onOpenBotActivationModal(website)}
                  className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shrink-0"
                >
                  <Zap size={11} /> ACTIVATE BOT
                </button>
              )}
            </div>
          </div>

          {/* Link Box */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-2xl px-3.5 py-2.5 mb-3 min-w-0 max-w-full">
            <Globe size={14} className="text-slate-400 shrink-0" />
            <span className="text-xs text-slate-800 dark:text-gray-300 truncate flex-1 min-w-0 font-mono select-all font-bold">
              {absoluteUrl}
            </span>
            <button 
              type="button"
              onClick={() => onCopyLink(absoluteUrl, website.id)}
              className="p-1.5 hover:bg-slate-200/60 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-slate-600 dark:text-gray-400 shrink-0"
              title="Copy Link"
            >
              {copiedId === website.id ? (
                <Check size={14} className="text-emerald-500" />
              ) : (
                <Copy size={14} />
              )}
            </button>
          </div>

          {/* Action Buttons: Add Product & Reviews */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
            <button
              type="button"
              onClick={() => onOpenProductModal(website)}
              className="py-2.5 px-3 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus size={14} strokeWidth={3} /> Add Product (Inventory)
            </button>

            {website.isStarEnabled !== false && (
              <button
                type="button"
                onClick={() => onToggleReviews(website.id)}
                className={`py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border shadow-sm ${
                  expandedReviewsSiteId === website.id 
                    ? "bg-amber-500 text-white border-amber-600" 
                    : "bg-slate-800 hover:bg-slate-900 text-white border-slate-700"
                }`}
              >
                <Star size={14} fill={expandedReviewsSiteId === website.id ? "currentColor" : "none"} />
                Reviews & Replies
              </button>
            )}
          </div>

          {expandedReviewsSiteId === website.id && (
            <div className="mt-2 mb-3 p-4 rounded-2xl bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 text-left animate-in fade-in duration-300 w-full overflow-hidden">
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-200 dark:border-white/10">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">Customer Reviews & Replies</h4>
                <button
                  type="button"
                  onClick={() => onToggleReviews(website.id)}
                  className="text-[10px] text-slate-500 hover:text-slate-900 dark:hover:text-white uppercase font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
              <ReviewsPanel websiteId={website.id} />
            </div>
          )}
        </div>

        {/* Bottom Actions Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-white/5">
          <button 
            type="button"
            onClick={() => window.open(absoluteUrl, '_blank')}
            className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-3.5 py-1.5 rounded-full text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider hover:bg-emerald-100 cursor-pointer transition-colors shrink-0"
          >
            <ExternalLink size={12} /> LIVE VIEW
          </button>

          <div className="flex items-center gap-2 shrink-0">
            <button 
              type="button"
              onClick={() => navigate(`/pro-website-settings/${website.id}`)}
              className="p-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl text-slate-700 dark:text-gray-300 transition-colors cursor-pointer shadow-sm"
              title="Edit Pro Website"
            >
              <Edit3 size={15} />
            </button>

            {deleteConfirmId === website.id ? (
              <button 
                type="button"
                onClick={() => onDeleteItem('pro_websites', website.id)}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 rounded-xl text-[10px] font-black uppercase tracking-wider text-white transition-colors cursor-pointer shadow-sm"
              >
                Confirm
              </button>
            ) : (
              <button 
                type="button"
                onClick={() => onDeleteConfirm(website.id)}
                className="p-2.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors cursor-pointer shadow-sm"
                title="Delete"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
