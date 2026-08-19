import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, X, Image as ImageIcon, Type, Copy, FileText, Hash } from 'lucide-react';

interface MagicDrawerModalProps {
  showMagicDrawer: boolean;
  setShowMagicDrawer: (show: boolean) => void;
  magicResult: any;
  setMagicResult: (res: any) => void;
  magicLoading: boolean;
  magicImage: string | null;
  setMagicImage: (img: string | null) => void;
  handleResetMagic: () => void;
  handleMagicFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleGenerateMagicContent: () => void;
  setLastMagicAction: (time: number) => void;
}

export function MagicDrawerModal({
  showMagicDrawer,
  setShowMagicDrawer,
  magicResult,
  setMagicResult,
  magicLoading,
  magicImage,
  setMagicImage,
  handleResetMagic,
  handleMagicFile,
  handleGenerateMagicContent,
  setLastMagicAction
}: MagicDrawerModalProps) {
  return (
    <AnimatePresence>
      {showMagicDrawer && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: magicResult ? 600 : 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-dragon-black/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden no-print mb-6"
        >
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-dragon-cyan/20 text-dragon-cyan">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-white">DOELpro Magic Content</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Generate metadata from product photos</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(magicImage || magicResult) && (
                  <button 
                    onClick={handleResetMagic}
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-all text-[9px] font-black uppercase tracking-widest"
                  >
                    <Zap size={12} className="fill-current" />
                    Reset
                  </button>
                )}
                <button onClick={() => setShowMagicDrawer(false)} className="p-2 text-gray-500 hover:text-white">
                  <X size={20} />
                </button>
              </div>
            </div>

            {!magicResult && !magicLoading && (
              <div 
                onClick={() => document.getElementById('magic-upload-messenger')?.click()}
                className="w-full aspect-video rounded-3xl border-2 border-dashed border-white/10 hover:border-dragon-cyan/30 transition-all flex flex-col items-center justify-center cursor-pointer bg-white/5 group relative overflow-hidden"
              >
                {magicImage ? (
                  <img src={magicImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-full bg-dragon-cyan/10 flex items-center justify-center text-dragon-cyan mb-4 group-hover:scale-110 transition-transform">
                      <ImageIcon size={28} />
                    </div>
                    <p className="text-[11px] font-black uppercase text-gray-400 tracking-[0.2em]">Upload Product Photo</p>
                    <p className="text-[9px] text-gray-600 mt-2 font-bold uppercase">PNG, JPG, WEBP • Max 10MB</p>
                  </>
                )}
                <input type="file" id="magic-upload-messenger" hidden accept="image/*" onChange={handleMagicFile} />
                
                {magicImage && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-[11px] font-black uppercase text-white tracking-widest">Change Photo</p>
                  </div>
                )}
              </div>
            )}

            {magicImage && !magicLoading && !magicResult && (
              <button 
                onClick={handleGenerateMagicContent}
                className="w-full py-4 bg-dragon-cyan text-dragon-black font-black text-xs uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-dragon-cyan/20 active:scale-95 transition-all"
              >
                Generate AI Content
              </button>
            )}

            {magicLoading && (
              <div className="py-12 space-y-6">
                <div className="relative w-20 h-20 mx-auto">
                  <div className="absolute inset-0 border-4 border-dragon-cyan/20 border-t-dragon-cyan rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center text-dragon-cyan animate-pulse">
                    <Sparkles size={32} />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h4 className="text-[11px] font-black text-dragon-cyan uppercase animate-pulse tracking-[0.4em]">DOELpro Analyzing</h4>
                  <p className="text-[9px] text-gray-600 font-bold uppercase">Identifying textures, colors and features...</p>
                </div>
              </div>
            )}

            {magicResult && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto custom-scrollbar p-1"
              >
                <div className="space-y-4 md:col-span-2">
                  <div className="glass-card p-4 border-dragon-cyan/20">
                    <div className="flex items-center gap-2 mb-3">
                      <Type size={14} className="text-dragon-cyan" />
                      <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Suggested Title</span>
                    </div>
                    <div className="flex gap-2">
                      <p className="flex-1 text-sm font-bold text-white">{magicResult.title}</p>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(magicResult.title);
                          setLastMagicAction(Date.now());
                          alert('Title copied!');
                        }}
                        className="p-2 bg-white/5 hover:bg-dragon-cyan text-gray-500 hover:text-dragon-black rounded-xl transition-all"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText size={14} className="text-dragon-cyan" />
                    <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Product Details</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-[11px] text-gray-300 leading-relaxed max-h-[150px] overflow-y-auto custom-scrollbar italic">{magicResult.details}</p>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(magicResult.details);
                        setLastMagicAction(Date.now());
                        alert('Details copied!');
                      }}
                      className="w-full py-2 bg-white/5 hover:bg-dragon-cyan text-[9px] font-black uppercase text-gray-500 hover:text-dragon-black rounded-lg transition-all"
                    >
                      Copy Details
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="glass-card p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Hash size={14} className="text-dragon-cyan" />
                      <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Trending Hashtags</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-4 max-h-[100px] overflow-y-auto custom-scrollbar p-1">
                      {((Array.isArray(magicResult.hashtags) ? magicResult.hashtags.join(' ') : magicResult.hashtags) || '').split(/[\s,]+/).filter((t: string) => t.trim()).map((tag: string, i: number) => (
                        <motion.span 
                          key={`tag-${tag}-${i}`} 
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className="px-2.5 py-1 rounded-lg bg-dragon-cyan/10 border border-dragon-cyan/20 text-dragon-cyan font-mono text-[10px] font-bold"
                        >
                          {tag.startsWith('#') ? tag : `#${tag}`}
                        </motion.span>
                      ))}
                    </div>
                    <button 
                      onClick={() => {
                        const hashtagsStr = Array.isArray(magicResult.hashtags) ? magicResult.hashtags.join(' ') : magicResult.hashtags;
                        navigator.clipboard.writeText(hashtagsStr || '');
                        setLastMagicAction(Date.now());
                        alert('Hashtags copied!');
                      }}
                      className="w-full py-2 bg-white/5 hover:bg-dragon-cyan text-[9px] font-black uppercase text-gray-500 hover:text-dragon-black rounded-lg transition-all"
                    >
                      Copy All Hashtags
                    </button>
                  </div>

                  <div className="glass-card p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap size={14} className="text-dragon-cyan" />
                      <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">SEO Keywords</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-4 max-h-[100px] overflow-y-auto custom-scrollbar p-1">
                      {((Array.isArray(magicResult.keywords) ? magicResult.keywords.join(' ') : magicResult.keywords) || '').split(/[\s,]+/).filter((t: string) => t.trim()).map((kw: string, i: number) => (
                        <motion.span 
                          key={`kw-${kw}-${i}`} 
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.3 + i * 0.05 }}
                          className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-[10px] font-medium"
                        >
                          {kw}
                        </motion.span>
                      ))}
                    </div>
                    <button 
                      onClick={() => {
                        const keywordsStr = Array.isArray(magicResult.keywords) ? magicResult.keywords.join(' ') : magicResult.keywords;
                        navigator.clipboard.writeText(keywordsStr || '');
                        setLastMagicAction(Date.now());
                        alert('Keywords copied!');
                      }}
                      className="w-full py-2 bg-white/5 hover:bg-dragon-cyan text-[9px] font-black uppercase text-gray-500 hover:text-dragon-black rounded-lg transition-all"
                    >
                      Copy All Keywords
                    </button>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setMagicResult(null);
                    setMagicImage(null);
                  }}
                  className="md:col-span-2 py-3 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase text-gray-500 tracking-[0.3em] rounded-xl transition-all"
                >
                  Generate New
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
