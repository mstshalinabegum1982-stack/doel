import React from 'react';
import { 
  X, 
  Check, 
  ChevronDown, 
  Image as ImageIcon, 
  Zap, 
  AlertTriangle, 
  Loader2, 
  Hash 
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PRODUCT_CATEGORIES, 
  POST_BACKGROUND_THEMES, 
  POST_TEXT_COLORS, 
  PostThemeVectorOverlay 
} from './PostThemeUtils';

export interface CreatePostModalProps {
  user: any;
  currentUserProfile: any;
  newPostText: string;
  setNewPostText: React.Dispatch<React.SetStateAction<string>>;
  newPostRole: 'supplier' | 'seller';
  setNewPostRole: React.Dispatch<React.SetStateAction<'supplier' | 'seller'>>;
  newPostCategory: string;
  setNewPostCategory: React.Dispatch<React.SetStateAction<string>>;
  isCategoryDropdownOpen: boolean;
  setIsCategoryDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  newPostImage: string | null;
  setNewPostImage: React.Dispatch<React.SetStateAction<string | null>>;
  newPostBgTheme: string;
  setNewPostBgTheme: React.Dispatch<React.SetStateAction<string>>;
  newPostTextColor: string;
  setNewPostTextColor: React.Dispatch<React.SetStateAction<string>>;
  isPosting: boolean;
  moderationWarning: string | null;
  setModerationWarning: React.Dispatch<React.SetStateAction<string | null>>;
  handleCreatePost: (e: React.FormEvent) => Promise<void>;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  user,
  currentUserProfile,
  newPostText,
  setNewPostText,
  newPostRole,
  setNewPostRole,
  newPostCategory,
  setNewPostCategory,
  isCategoryDropdownOpen,
  setIsCategoryDropdownOpen,
  newPostImage,
  setNewPostImage,
  newPostBgTheme,
  setNewPostBgTheme,
  newPostTextColor,
  setNewPostTextColor,
  isPosting,
  moderationWarning,
  setModerationWarning,
  handleCreatePost,
}) => {
  return (
    <form onSubmit={handleCreatePost} className="bg-[#0f1118]/90 backdrop-blur-md border border-white/5 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl relative overflow-hidden">
      {/* Header Profile Info & Role Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <img 
            src={currentUserProfile?.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80'} 
            className="w-10 h-10 rounded-full object-cover border border-white/10 shadow-md bg-white/5" 
            alt="My Profile Avatar" 
            referrerPolicy="no-referrer"
          />
          <div>
            <p className="text-xs font-black text-white leading-tight font-sans">
              {currentUserProfile?.storeName || currentUserProfile?.businessName || currentUserProfile?.name || user?.email?.split('@')[0] || 'My Business'}
            </p>
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
              Create B2B Network Status
            </p>
          </div>
        </div>

        {/* Supplier / Seller Toggle */}
        <div className="flex bg-zinc-950/80 p-1 rounded-2xl border border-white/10 shadow-inner">
          <button
            type="button"
            onClick={() => setNewPostRole('supplier')}
            className={cn(
              "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer",
              newPostRole === 'supplier' ? "create-post-role-btn-active scale-105" : "text-gray-400 hover:text-white"
            )}
          >
            <span>Supplier</span> 👑
          </button>
          <button
            type="button"
            onClick={() => setNewPostRole('seller')}
            className={cn(
              "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer",
              newPostRole === 'seller' ? "create-post-role-btn-active scale-105" : "text-gray-400 hover:text-white"
            )}
          >
            <span>Seller</span> 🛒
          </button>
        </div>
      </div>

      {/* Moderation Warning Alert */}
      {moderationWarning && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-2.5 items-start text-red-400">
          <AlertTriangle className="shrink-0 mt-0.5" size={16} />
          <div className="text-[10px] leading-relaxed font-bold uppercase transition-all">
            {moderationWarning}
          </div>
        </div>
      )}

      {/* Main Text Input Area */}
      <div className="space-y-2">
        {newPostBgTheme !== 'none' ? (
          <div 
            className={cn(
              "social-post-bg-theme w-full rounded-2xl p-6 min-h-[180px] sm:min-h-[220px] flex items-center justify-center text-center transition-all duration-300 relative overflow-hidden shadow-2xl border border-white/20",
              POST_BACKGROUND_THEMES.find(t => t.id === newPostBgTheme)?.bgClass
            )}
          >
            <PostThemeVectorOverlay themeId={newPostBgTheme} />
            <textarea
              placeholder="Write your bold post text here (use #hashtags)..."
              value={newPostText}
              maxLength={4000}
              onChange={(e) => {
                setNewPostText(e.target.value);
                if (moderationWarning) setModerationWarning(null);
              }}
              rows={3}
              style={{ color: newPostTextColor || '#ffffff' }}
              className="w-full bg-transparent border-0 outline-none resize-none text-base sm:text-2xl font-black text-center placeholder-white/70 leading-snug drop-shadow-md font-sans max-w-lg relative z-10"
            />
            <button
              type="button"
              onClick={() => setNewPostBgTheme('none')}
              className="absolute top-3 right-3 bg-black/60 hover:bg-black text-white p-1.5 rounded-full transition-all text-[10px] font-bold flex items-center gap-1 backdrop-blur-md border border-white/20 cursor-pointer z-20"
              title="Clear Background"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <div className="create-post-textarea-container rounded-2xl p-4 transition-all">
            <textarea
              placeholder={
                newPostRole === 'supplier'
                  ? "Write as a Supplier... (e.g. Premium wholesale clothing items in stock #fashion #wholesale)"
                  : "Write as a Seller... (e.g. Sourcing reliable suppliers for high-quality smart watches #gadgets #sourcing)"
              }
              value={newPostText}
              maxLength={4000}
              onChange={(e) => {
                setNewPostText(e.target.value);
                if (moderationWarning) setModerationWarning(null);
              }}
              rows={3}
              className="create-post-textarea w-full bg-transparent border-0 outline-none resize-none text-sm leading-relaxed font-sans"
            />
          </div>
        )}

        {/* Character limit & Hashtags helper */}
        <div className="flex items-center justify-between text-[11px] font-mono px-1">
          <span className="flex items-center gap-1 text-dragon-cyan font-bold">
            <Hash size={13} /> Use #hashtags (e.g. #fashion, #tech)
          </span>
          <span className={cn("font-bold font-mono transition-colors", newPostText.length >= 3900 ? "text-red-400 font-black animate-pulse" : newPostText.length >= 3500 ? "text-amber-400 font-bold" : "text-gray-400")}>
            {newPostText.length} / 4000
          </span>
        </div>
      </div>

      {/* Attached Image Preview */}
      {newPostImage && (
        <div className="relative inline-block rounded-2xl overflow-hidden border border-white/15 bg-black/50 p-1">
          <img src={newPostImage} className="max-h-32 object-contain rounded-xl" alt="Post attachment preview" referrerPolicy="no-referrer" />
          <button
            type="button"
            onClick={() => setNewPostImage(null)}
            className="absolute top-2 right-2 p-1.5 bg-black/80 hover:bg-red-600 text-white rounded-full transition-all cursor-pointer border border-white/20 shadow-lg"
            title="Remove image"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Options & Settings Section */}
      <div className="create-post-options-panel rounded-2xl p-3.5 space-y-3">
        {/* Background Themes Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-dragon-cyan tracking-widest flex items-center gap-1.5">
              🎨 Background Themes (12 Themes)
            </span>
            {newPostBgTheme !== 'none' && (
              <span className="text-[9px] bg-dragon-cyan/20 text-dragon-cyan font-black px-2.5 py-0.5 rounded-full border border-dragon-cyan/30">
                THEME ACTIVE
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
            {POST_BACKGROUND_THEMES.map((theme) => {
              const isSelected = newPostBgTheme === theme.id;
              return (
                <button
                  key={`bg-theme-btn-${theme.id}`}
                  type="button"
                  onClick={() => setNewPostBgTheme(theme.id)}
                  className={cn(
                    "w-9 h-9 sm:w-10 sm:h-10 rounded-xl shrink-0 flex items-center justify-center transition-all duration-200 relative group border-2 cursor-pointer shadow-md overflow-hidden",
                    theme.id === 'none' 
                      ? "bg-zinc-800/80 border-white/20 text-gray-300 hover:border-white" 
                      : `${theme.bgClass} text-white hover:scale-105`,
                    isSelected ? "border-dragon-cyan ring-2 ring-dragon-cyan/50 scale-105 shadow-lg" : "border-transparent opacity-80 hover:opacity-100"
                  )}
                  title={theme.name}
                >
                  <PostThemeVectorOverlay themeId={theme.id} />
                  <span className="text-[11px] font-black uppercase tracking-tighter relative z-10 drop-shadow">Aa</span>
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-dragon-cyan rounded-full flex items-center justify-center text-dragon-black z-20 shadow-md">
                      <Check size={10} strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Text Color Swatches */}
          {newPostBgTheme !== 'none' && (
            <div className="flex items-center gap-3 pt-2 border-t border-white/5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0">Text Color:</span>
              <div className="flex items-center gap-2 overflow-x-auto">
                {POST_TEXT_COLORS.map((col) => {
                  const isSelected = newPostTextColor === col.color;
                  return (
                    <button
                      key={`text-col-${col.id}`}
                      type="button"
                      onClick={() => setNewPostTextColor(col.color)}
                      className={cn(
                        "w-6 h-6 rounded-full shrink-0 border transition-all cursor-pointer relative flex items-center justify-center hover:scale-110",
                        isSelected ? "border-dragon-cyan ring-2 ring-dragon-cyan/60 scale-110" : "border-white/30 opacity-80"
                      )}
                      style={{ backgroundColor: col.color }}
                      title={col.name}
                    >
                      {isSelected && (
                        <div className={cn("w-2 h-2 rounded-full", col.color === '#FFFFFF' || col.color === '#FACC15' || col.color === '#00F2FE' ? "bg-black" : "bg-white")} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Product Category & Add Photo Bar */}
        <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* CUSTOM CATEGORY DROPDOWN SELECTOR */}
          <div className="relative flex-1">
            <button
              type="button"
              onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
              className="create-post-category-trigger w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer font-bold text-xs"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="text-[10px] font-black uppercase tracking-wider text-dragon-cyan shrink-0 flex items-center gap-1">
                  📦 Category:
                </span>
                <span className="truncate font-black">
                  {PRODUCT_CATEGORIES.find(c => c.id === newPostCategory)?.label || 'Select Category'}
                </span>
              </div>
              <ChevronDown size={15} className={cn("transition-transform duration-200 shrink-0 text-dragon-cyan", isCategoryDropdownOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
              {isCategoryDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsCategoryDropdownOpen(false)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 4, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="create-post-category-menu absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-2xl p-1.5 shadow-2xl space-y-1"
                  >
                    {PRODUCT_CATEGORIES.map(cat => {
                      const isSelected = newPostCategory === cat.id;
                      return (
                        <button
                          key={`cat-select-item-${cat.id}`}
                          type="button"
                          onClick={() => {
                            setNewPostCategory(cat.id);
                            setIsCategoryDropdownOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-black transition-all text-left cursor-pointer",
                            isSelected 
                              ? "create-post-category-item-active" 
                              : "create-post-category-item-hover"
                          )}
                        >
                          <span className="truncate">{cat.label}</span>
                          {isSelected && <Check size={14} className="shrink-0 text-dragon-cyan stroke-[3]" />}
                        </button>
                      );
                    })}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Add Photo Button */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => document.getElementById('new-post-photo')?.click()}
              className={cn(
                "w-full sm:w-auto flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl border transition-all cursor-pointer create-post-photo-btn",
                newPostImage && "active"
              )}
            >
              <ImageIcon size={14} />
              {newPostImage ? 'Change Photo' : 'Add Photo'}
            </button>
            <input 
              type="file" 
              id="new-post-photo" 
              hidden 
              accept="image/*" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setNewPostImage(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }} 
            />
          </div>
        </div>
      </div>

      {/* Submit Action Button */}
      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          disabled={isPosting}
          className="create-post-publish-btn w-full sm:w-auto sm:min-w-[200px] px-8 py-3.5 font-black text-xs uppercase tracking-[0.15em] rounded-xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isPosting ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} className="fill-current animate-pulse" />}
          Publish Post
        </button>
      </div>
    </form>
  );
};
