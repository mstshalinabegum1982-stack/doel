import React from 'react';
import { 
  Globe, 
  Layout, 
  Copy, 
  Check, 
  Eye, 
  Edit3, 
  Trash2 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LandingPageData } from './types';

interface LandingPageCardProps {
  page: LandingPageData;
  index: number;
  currentOrigin: string;
  copiedId: string | null;
  deleteConfirmId: string | null;
  onCopyLink: (url: string, id: string) => void;
  onDeleteConfirm: (id: string) => void;
  onDeleteItem: (colName: 'landing-pages' | 'pro_websites', id: string) => void;
}

export const LandingPageCard: React.FC<LandingPageCardProps> = ({
  page,
  index,
  currentOrigin,
  copiedId,
  deleteConfirmId,
  onCopyLink,
  onDeleteConfirm,
  onDeleteItem
}) => {
  const navigate = useNavigate();
  const absoluteUrl = `${currentOrigin}/l/${page.id}`;

  return (
    <div 
      className="w-full bg-white dark:bg-[#121624] border border-slate-200 dark:border-white/10 rounded-[28px] p-4 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-5 lg:gap-6 items-stretch overflow-hidden group"
    >
      {/* Left Side: Mockup Image Thumbnail */}
      <div className="w-full md:w-56 lg:w-64 h-48 md:h-auto min-h-[170px] rounded-2xl overflow-hidden relative border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#0c0f1d] shrink-0 flex items-center justify-center group/thumb">
        {page.productDetails?.image || page.productDetails?.gallery?.[0] ? (
          <img 
            src={page.productDetails?.image || page.productDetails?.gallery?.[0]} 
            alt={page.storeName}
            className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-slate-50 dark:bg-[#0c0f1d] p-4 flex flex-col justify-between text-slate-800 dark:text-white relative">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-dragon-cyan flex items-center gap-1">
              <Layout size={12} /> {page.storeName || 'Store'}
            </div>
            <div className="my-auto text-center px-2">
              <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white line-clamp-1 break-words">{page.storeName || 'Landing Page'}</h4>
              <p className="text-[10px] text-slate-500 dark:text-gray-400 mt-1 line-clamp-2 break-words">{page.productDetails?.title || 'Product Offer'}</p>
            </div>
            <div className="text-[9px] text-slate-400 dark:text-slate-500 font-mono text-center uppercase tracking-widest font-bold">LANDING PAGE</div>
          </div>
        )}
      </div>

      {/* Right Side: Details & Actions */}
      <div className="flex-1 min-w-0 flex flex-col justify-between space-y-3">
        <div>
          {/* Top Header: Title & Badges */}
          <div className="flex flex-wrap justify-between items-start gap-2 mb-1.5">
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-snug break-words line-clamp-1 min-w-0 flex-1">
              {page.storeName || 'Unnamed Store'}
            </h3>
            
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-gray-300 border border-slate-200 dark:border-white/10 text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md">
                {page.theme || 'DARK'}
              </span>
              <span className="bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-gray-300 border border-slate-200 dark:border-white/10 text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md">
                {page.country || 'BANGLADESH'}
              </span>
            </div>
          </div>

          <p className="text-xs font-bold text-slate-600 dark:text-gray-400 mb-3 line-clamp-2 break-words">
            {page.productDetails?.title || 'No Product Assigned'}
          </p>

          {/* Price Display */}
          {page.productDetails && (
            <div className="flex items-baseline gap-2 text-sm font-bold text-slate-900 dark:text-white mb-3">
              <span className="text-slate-500 dark:text-gray-400 text-xs font-medium">Price:</span>
              <span className="text-pink-600 dark:text-fuchsia-400 font-extrabold text-base font-mono">
                ৳{page.productDetails.offerPrice || page.productDetails.price}
              </span>
              {page.productDetails.offerPrice && page.productDetails.offerPrice < page.productDetails.price && (
                <span className="text-xs text-slate-400 dark:text-gray-500 line-through font-normal font-mono">
                  ৳{page.productDetails.price}
                </span>
              )}
            </div>
          )}

          {/* Link Box */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-2xl px-3.5 py-2.5 mb-3 min-w-0 max-w-full">
            <Globe size={14} className="text-slate-400 shrink-0" />
            <span className="text-xs text-slate-800 dark:text-gray-300 truncate flex-1 min-w-0 font-mono select-all font-bold">
              {absoluteUrl}
            </span>
            <button 
              type="button"
              onClick={() => onCopyLink(absoluteUrl, page.id)}
              className="p-1.5 hover:bg-slate-200/60 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-slate-600 dark:text-gray-400 shrink-0"
              title="Copy Link"
            >
              {copiedId === page.id ? (
                <Check size={14} className="text-emerald-500" />
              ) : (
                <Copy size={14} />
              )}
            </button>
          </div>
        </div>

        {/* Bottom Actions Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-white/5">
          {/* Live Badge */}
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button 
              type="button"
              onClick={() => window.open(absoluteUrl, '_blank')}
              className="p-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl text-slate-700 dark:text-gray-200 hover:text-pink-600 transition-colors cursor-pointer shadow-sm"
              title="Live Preview"
            >
              <Eye size={15} />
            </button>

            <button 
              type="button"
              onClick={() => navigate('/landing-pages')}
              className="p-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl text-slate-700 dark:text-gray-200 hover:text-pink-600 transition-colors cursor-pointer shadow-sm"
              title="Edit Landing Page"
            >
              <Edit3 size={15} />
            </button>

            {deleteConfirmId === page.id ? (
              <button 
                type="button"
                onClick={() => onDeleteItem('landing-pages', page.id)}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 rounded-xl text-[10px] font-black uppercase tracking-wider text-white transition-colors cursor-pointer shadow-sm"
              >
                Confirm
              </button>
            ) : (
              <button 
                type="button"
                onClick={() => onDeleteConfirm(page.id)}
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
