import React, { memo } from 'react';

interface StatBoxProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  countLabel: string;
}

export const StatBox = memo(function StatBox({ icon, label, value, countLabel }: StatBoxProps) {
  return (
    <div className="glass-card p-2.5 sm:p-3 flex flex-col justify-between bg-white/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 transition-all rounded-2xl shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-1.5 w-full">
        <span className="text-[9px] font-black uppercase text-slate-500 dark:text-gray-400 tracking-wider line-clamp-1">{label}</span>
        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0">
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-base sm:text-[18px] font-black font-display text-slate-900 dark:text-white tracking-tight leading-tight mb-0.5">{value}</h3>
        <p className="text-[8px] text-slate-500 dark:text-gray-400 font-bold tracking-widest uppercase">{countLabel}</p>
      </div>
    </div>
  );
});
