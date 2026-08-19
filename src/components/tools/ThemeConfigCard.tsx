import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ThemeConfigCardProps {
  currentTheme: 'light' | 'dark';
  onToggleTheme: (theme: 'light' | 'dark') => void;
}

export function ThemeConfigCard({ currentTheme, onToggleTheme }: ThemeConfigCardProps) {
  return (
    <div className="space-y-4">
      <h3 className="section-title">Theme Mode</h3>
      <div className="glass-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold font-display uppercase tracking-wider text-white">App Appearance</h4>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
            Toggle between light and dark themes across all pages
          </p>
        </div>
        <div className="flex bg-black/40 p-1.5 rounded-2xl w-full sm:w-auto">
          <button
            type="button"
            onClick={() => onToggleTheme('light')}
            className={cn(
              "flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-all font-black text-[11px] uppercase tracking-widest cursor-pointer",
              currentTheme === 'light'
                ? "bg-white text-gray-900 shadow-md scale-105"
                : "text-gray-400 hover:text-white"
            )}
          >
            <Sun size={15} className="text-amber-500" />
            Light
          </button>
          <button
            type="button"
            onClick={() => onToggleTheme('dark')}
            className={cn(
              "flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-all font-black text-[11px] uppercase tracking-widest cursor-pointer",
              currentTheme === 'dark'
                ? "bg-dragon-cyan text-dragon-black shadow-md scale-105"
                : "text-gray-400 hover:text-white"
            )}
          >
            <Moon size={15} />
            Dark
          </button>
        </div>
      </div>
    </div>
  );
}
