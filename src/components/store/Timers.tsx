import React, { useState, useEffect } from 'react';
import { Clock, Zap } from 'lucide-react';

export const getCreatedTime = (website: any) => {
  if (!website?.createdAt) return Date.now();
  if (typeof website.createdAt === 'string') {
    return new Date(website.createdAt).getTime();
  }
  if (website.createdAt.seconds) {
    return website.createdAt.seconds * 1000;
  }
  if (website.createdAt.toDate) {
    return website.createdAt.toDate().getTime();
  }
  return new Date(website.createdAt).getTime();
};

export const isProWebsiteExpired = (website: any) => {
  if (website.paymentStatus === 'approved' || website.paymentStatus === 'pending') {
    return false;
  }
  const createdTime = getCreatedTime(website);
  const trialExpiry = createdTime + 72 * 60 * 60 * 1000;
  return Date.now() > trialExpiry;
};

export const ProWebsiteTimer = ({ website, onActivate }: { website: any; onActivate?: () => void }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [expired, setExpired] = useState<boolean>(false);

  useEffect(() => {
    const updateTimer = () => {
      const createdTime = getCreatedTime(website);
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
  }, [website.createdAt, website.paymentStatus]);

  if (website.paymentStatus === 'approved') {
    return (
      <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest text-emerald-400">
        Approved & Active
      </span>
    );
  }

  if (website.paymentStatus === 'pending') {
    return (
      <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest text-amber-400 animate-pulse">
        Pending
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

export const MyCatalogTimer = ({ sub, onActivate }: { sub: any; onActivate?: () => void }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [expired, setExpired] = useState<boolean>(false);

  useEffect(() => {
    if (!sub || sub.paymentStatus !== 'trial') return;

    const updateTimer = () => {
      const expiry = sub.trialExpiresAt ? new Date(sub.trialExpiresAt).getTime() : 0;
      const diff = expiry - Date.now();

      if (diff <= 0) {
        setExpired(true);
        setTimeLeft('Expired');
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60)) / 1000);
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        let displayStr = '';
        if (days > 0) {
          displayStr += `${days}d `;
        }
        displayStr += `${hours}h ${minutes}m ${seconds}s left`;
        setTimeLeft(displayStr);
        setExpired(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [sub]);

  if (!sub) {
    return (
      <span className="px-2.5 py-1 bg-zinc-500/10 border border-zinc-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest text-zinc-400">
        Not Published Yet
      </span>
    );
  }

  if (sub.paymentStatus === 'approved') {
    return (
      <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest text-emerald-400">
        Approved & Active
      </span>
    );
  }

  if (sub.paymentStatus === 'pending') {
    return (
      <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest text-amber-400 animate-pulse">
        Pending Verification
      </span>
    );
  }

  if (expired || (sub.trialExpiresAt && new Date(sub.trialExpiresAt) < new Date())) {
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
      <Clock size={10} className="animate-spin text-blue-400" /> {timeLeft || '7 Days Trial'}
    </span>
  );
};
