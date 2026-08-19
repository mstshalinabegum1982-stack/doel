import React, { useState, useEffect } from 'react';
import { Layout, Sparkles, Zap, ExternalLink, Edit2, Link as LinkIcon, Clock } from 'lucide-react';
import { LandingPageData } from './types';

export const getCreatedTime = (page: any) => {
  if (!page?.createdAt) return Date.now();
  if (typeof page.createdAt === 'string') {
    return new Date(page.createdAt).getTime();
  }
  if (page.createdAt.seconds) {
    return page.createdAt.seconds * 1000;
  }
  if (page.createdAt.toDate) {
    return page.createdAt.toDate().getTime();
  }
  return new Date(page.createdAt).getTime();
};

export const isPageExpired = (page: any) => {
  if (page.paymentStatus === 'approved' || page.paymentStatus === 'pending') {
    return false;
  }
  const createdTime = getCreatedTime(page);
  const trialExpiry = createdTime + 72 * 60 * 60 * 1000;
  return Date.now() > trialExpiry;
};

export const LandingPageTimer = ({ page, userCountry, onActivate }: { page: any; userCountry: string; onActivate?: () => void }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [expired, setExpired] = useState<boolean>(false);

  useEffect(() => {
    const updateTimer = () => {
      const createdTime = getCreatedTime(page);
      const trialExpiry = createdTime + 72 * 60 * 60 * 1000;
      const diff = trialExpiry - Date.now();

      if (diff <= 0) {
        setExpired(true);
        setTimeLeft('Expired');
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s left`);
        setExpired(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [page.createdAt, page.paymentStatus]);

  if (page.paymentStatus === 'approved') {
    return (
      <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest text-emerald-400">
        Approved & Active
      </span>
    );
  }

  if (page.paymentStatus === 'pending') {
    return (
      <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest text-amber-400 animate-pulse">
        Pending Verification
      </span>
    );
  }

  if (expired) {
    return (
      <span
        onClick={onActivate}
        className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest text-rose-400 cursor-pointer hover:bg-rose-500/25 active:scale-95 transition-all flex items-center gap-1 animate-pulse shadow-md border-rose-500/30"
        title="Click to Activate"
      >
        Expired <Zap size={10} className="text-rose-400 animate-bounce" />
      </span>
    );
  }

  return (
    <span className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[9px] font-mono font-black uppercase tracking-widest text-blue-400 flex items-center gap-1">
      <Clock size={10} className="animate-spin text-blue-400" /> {timeLeft}
    </span>
  );
};

export const LandingPageBotTimer = ({ page, userCountry, onActivate }: { page: any; userCountry: string; onActivate?: () => void }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [expired, setExpired] = useState<boolean>(false);

  useEffect(() => {
    const updateTimer = () => {
      const createdTime = getCreatedTime(page);
      const trialExpiry = createdTime + 48 * 60 * 60 * 1000;
      const diff = trialExpiry - Date.now();

      if (diff <= 0) {
        setExpired(true);
        setTimeLeft('Expired');
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s left`);
        setExpired(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [page.createdAt, page.botPaymentStatus, page.dragonBotEnabled]);

  if (!page.dragonBotEnabled) {
    return (
      <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest text-gray-500">
        Bot Off
      </span>
    );
  }

  if (page.botPaymentStatus === 'approved') {
    const isExpired = page.botExpiryTime ? new Date(page.botExpiryTime).getTime() < Date.now() : false;
    if (isExpired) {
      return (
        <span
          onClick={onActivate}
          className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest text-rose-400 cursor-pointer hover:bg-rose-500/25 active:scale-95 transition-all flex items-center gap-1 animate-pulse border-rose-500/30 shadow-md"
          title="Renew Bot Plan"
        >
          Bot Expired <Zap size={10} className="text-rose-400 animate-bounce" />
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest text-emerald-400">
        Bot Active {page.botExpiryTime ? `(Expires: ${new Date(page.botExpiryTime).toLocaleDateString()})` : ''}
      </span>
    );
  }

  if (page.botPaymentStatus === 'pending') {
    return (
      <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest text-amber-400 animate-pulse">
        Bot Pending
      </span>
    );
  }

  if (expired) {
    return (
      <span
        onClick={onActivate}
        className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest text-rose-400 cursor-pointer hover:bg-rose-500/25 active:scale-95 transition-all flex items-center gap-1 animate-pulse border-rose-500/30 shadow-md"
        title="Click to activate Bot Plan"
      >
        Bot Expired <Zap size={10} className="text-rose-400 animate-bounce" />
      </span>
    );
  }

  return (
    <span className="px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-[9px] font-mono font-black uppercase tracking-widest text-cyan-400 flex items-center gap-1">
      <Sparkles size={10} className="animate-spin text-cyan-400" /> Bot Trial: {timeLeft}
    </span>
  );
};

interface LandingPageCardItemProps {
  page: LandingPageData;
  userCountry: string;
  onEdit: (page: LandingPageData) => void;
  onActivate: (page: LandingPageData) => void;
  onActivateBot: (page: LandingPageData) => void;
  onCopyLink: (page: LandingPageData) => void;
}

export const LandingPageCardItem: React.FC<LandingPageCardItemProps> = ({
  page,
  userCountry,
  onEdit,
  onActivate,
  onActivateBot,
  onCopyLink
}) => {
  const storeSlug = page.storeName ? encodeURIComponent(page.storeName.trim().toLowerCase().replace(/[\s/]+/g, '-')) : 'store';

  return (
    <div className="glass-card p-6 border-white/5 bg-white/[0.02] rounded-3xl flex flex-col gap-4 group hover:border-white/10 transition-all">
      <div className="flex items-center justify-between">
        <div className="p-3 bg-dragon-cyan/10 rounded-2xl text-dragon-cyan">
          <Layout size={20} />
        </div>
        <span className="px-3 py-1 bg-white/5 rounded-full text-[8px] font-black uppercase tracking-widest text-gray-500">
          {page.theme || 'dark'} theme
        </span>
      </div>

      <div className="space-y-1">
        <h4 className="text-sm font-black uppercase tracking-widest text-white group-hover:text-dragon-cyan transition-colors">
          {page.storeName || 'Unnamed Project'}
        </h4>
        <p className="text-xs text-gray-500 font-light truncate">
          {page.productDetails?.title || 'No product title specified'}
        </p>
      </div>

      <div className="pt-2 flex flex-wrap items-center gap-2">
        <LandingPageTimer 
          page={page} 
          userCountry={userCountry} 
          onActivate={() => onActivate(page)}
        />
        <LandingPageBotTimer
          page={page}
          userCountry={userCountry}
          onActivate={() => onActivateBot(page)}
        />
      </div>

      {page.dragonBotEnabled && (
        <button
          onClick={() => onActivateBot(page)}
          className="w-full py-2 bg-cyan-500/10 hover:bg-cyan-500 hover:text-black text-cyan-400 font-bold uppercase tracking-widest text-[9.5px] rounded-xl flex items-center justify-center gap-1 border border-cyan-500/20 cursor-pointer active:scale-95 transition-all"
        >
          <Sparkles size={11} className="text-current" />
          {page.botPaymentStatus === 'approved' ? "Renew Bot" : "Activate Bot"}
        </button>
      )}

      {isPageExpired(page) && (
        <button
          onClick={() => onActivate(page)}
          className="w-full mt-2 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest text-[11px] rounded-2xl flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(245,158,11,0.5)] border border-amber-500/30 cursor-pointer animate-pulse"
          style={{ backgroundColor: '#f59e0b', color: '#000000', display: 'flex' }}
        >
          <Zap size={13} className="text-black animate-bounce fill-black" style={{ color: '#000000', fill: '#000000' }} /> Activate
        </button>
      )}

      <div className="pt-4 grid grid-cols-2 gap-2 mt-auto w-full">
        <button 
          onClick={() => {
            window.open(`/l/${storeSlug}/${page.id}`, '_blank');
          }}
          className="flex items-center justify-center gap-1.5 py-2.5 bg-dragon-cyan/10 hover:bg-dragon-cyan border border-dragon-cyan/30 hover:border-dragon-cyan rounded-2xl text-[9px] font-black uppercase tracking-widest text-dragon-cyan hover:text-dragon-black transition-all duration-300 cursor-pointer"
        >
          View <ExternalLink size={11} />
        </button>
        
        <button 
          onClick={() => onEdit(page)}
          className="flex items-center justify-center gap-1 rounded-2xl py-2.5 bg-amber-500/10 hover:bg-amber-500 border border-amber-500/30 hover:border-amber-500 text-[9px] font-black uppercase tracking-widest text-amber-400 hover:text-black transition-all duration-300 cursor-pointer"
        >
          Edit <Edit2 size={11} />
        </button>

        <button 
          onClick={() => onCopyLink(page)}
          className="flex items-center justify-center gap-1 py-2.5 bg-white/5 hover:bg-white border border-white/10 hover:border-white rounded-2xl text-[9px] font-black uppercase tracking-widest text-gray-300 hover:text-black transition-all duration-300 cursor-pointer col-span-2"
          title="Copy Link"
        >
          Copy Link <LinkIcon size={11} />
        </button>
      </div>
    </div>
  );
};
