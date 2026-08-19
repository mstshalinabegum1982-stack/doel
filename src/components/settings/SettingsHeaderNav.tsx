import React from 'react';
import { ArrowLeft, RefreshCw, Eye, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SettingsHeaderNavProps {
  slug: string;
  appUrl: string;
  isSaving: boolean;
  onResetToDefaults: () => void;
  onSave: () => void;
}

export const SettingsHeaderNav: React.FC<SettingsHeaderNavProps> = ({
  slug,
  appUrl,
  isSaving,
  onResetToDefaults,
  onSave,
}) => {
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 h-20 bg-black/50 backdrop-blur-md border-b border-white/5 z-50">
      <div className="max-w-6xl mx-auto h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-sm font-black uppercase tracking-widest text-white">Pro Storefront</h1>
            <p className="text-[9px] text-gray-500 font-bold uppercase mt-0.5 tracking-wider">Settings & Customization</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={onResetToDefaults}
            className="px-4 py-2.5 rounded-xl bg-[#ef4444]/10 hover:bg-[#ef4444]/25 border border-[#ef4444]/20 text-[#fca5a5] text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
            title="Reset All"
          >
            <RefreshCw size={12} className="shrink-0" />
            Reset to Defaults
          </button>

          {slug && (
            <a 
              href={appUrl} 
              target="_blank" 
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-black uppercase tracking-wider flex items-center gap-2 text-dragon-cyan transition-all"
            >
              <Eye size={12} />
              Visit Store
            </a>
          )}

          <button 
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-dragon-cyan hover:brightness-110 text-dragon-black text-[11px] font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-dragon-cyan/20 disabled:opacity-50"
          >
            {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            Save Settings
          </button>
        </div>
      </div>
    </nav>
  );
};
