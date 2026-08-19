import React from 'react';
import { Upload, Trash2, Loader2 } from 'lucide-react';

interface CoversSettingsTabProps {
  covers: string[];
  uploadingCoverIndex: number | null;
  onCoverUpload: (index: number, file: File) => void;
  onRemoveCover: (index: number) => void;
}

export const CoversSettingsTab: React.FC<CoversSettingsTabProps> = ({
  covers,
  uploadingCoverIndex,
  onCoverUpload,
  onRemoveCover,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-black uppercase tracking-wider text-white">Upload up to 4 Hero Slideshow Covers</h2>
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl space-y-2 mt-2 text-xs text-emerald-400">
          <p className="font-bold text-sm">✨ Cover Photo Specifications & Guidelines (Recommended for Full Width Desktop & Mobile):</p>
          <p className="opacity-90 leading-relaxed">
            For the smoothest and crispiest look on both mobile and desktop screens without cropping, the cover image dimensions should be:
            <strong className="text-white block mt-1 text-sm bg-emerald-500/20 px-3 py-1.5 rounded-lg border border-emerald-500/30 font-mono">
              📐 Width: 1980px × Height: 1000px [1.98:1 Aspect Ratio]
            </strong>
          </p>
          <p className="opacity-80 text-[10px] italic">
            * Using this exact aspect ratio ensures that the entire image with any texts or graphics on top will be fully visible across all mobile and desktop devices without getting cropped.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
        {[0, 1, 2, 3].map((idx) => (
          <div key={idx} className="p-5 bg-[#09090d] rounded-3xl border border-white/5 space-y-4 group transition-all hover:bg-white/2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-black tracking-widest text-dragon-cyan uppercase">Banner Cover {idx + 1}</span>
              {covers[idx] && (
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRemoveCover(idx);
                  }}
                  type="button"
                  className="p-2 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-xl transition-all cursor-pointer z-20"
                  title="Remove Cover Banner"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>

            {/* Interactive label block enclosing the entire picture area as a fully active click target */}
            <label className="relative aspect-video rounded-2xl bg-white/5 border border-white/10 hover:border-dragon-cyan/50 overflow-hidden flex flex-col items-center justify-center text-center p-4 cursor-pointer transition-all hover:bg-white/10 select-none block">
              {uploadingCoverIndex === idx ? (
                <div className="space-y-2">
                  <Loader2 className="w-8 h-8 text-dragon-cyan animate-spin mx-auto" />
                  <p className="text-[10px] text-gray-400 font-bold">Processing Banner...</p>
                </div>
              ) : covers[idx] ? (
                <>
                  <img src={covers[idx]} alt={`Cover ${idx + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex flex-col items-center justify-center transition-all">
                    <Upload className="w-6 h-6 text-white mb-1" />
                    <span className="px-3 py-1.5 bg-black/80 text-[9px] text-white rounded-lg border border-white/10 font-bold uppercase tracking-wider">Click to Change Cover</span>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-8 h-8 text-gray-500 mx-auto group-hover:text-dragon-cyan transition-colors" />
                  <p className="text-[11px] font-black text-white">Click to Upload Image</p>
                  <p className="text-[9px] text-gray-400 max-w-[220px] leading-normal font-bold mx-auto text-center">Recommended Size: 1980x1000 pixels (standard 1.98:1 ratio)</p>
                </div>
              )}

              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    onCoverUpload(idx, e.target.files[0]);
                  }
                }} 
                className="hidden" 
              />
            </label>

            <label className="w-full py-3 bg-white/5 hover:bg-dragon-cyan/10 border border-white/10 hover:border-dragon-cyan/30 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center block text-white cursor-pointer transition-all">
              Select Image File
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    onCoverUpload(idx, e.target.files[0]);
                  }
                }} 
                className="hidden" 
              />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};
