import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface PoliciesSettingsTabProps {
  support1Title: string;
  setSupport1Title: (val: string) => void;
  support1Content: string;
  setSupport1Content: (val: string) => void;
  support2Title: string;
  setSupport2Title: (val: string) => void;
  support2Content: string;
  setSupport2Content: (val: string) => void;
  support3Title: string;
  setSupport3Title: (val: string) => void;
  support3Content: string;
  setSupport3Content: (val: string) => void;
  help1Title: string;
  setHelp1Title: (val: string) => void;
  help1Content: string;
  setHelp1Content: (val: string) => void;
  help2Title: string;
  setHelp2Title: (val: string) => void;
  help2Content: string;
  setHelp2Content: (val: string) => void;
  help3Title: string;
  setHelp3Title: (val: string) => void;
  help3Content: string;
  setHelp3Content: (val: string) => void;
}

export const PoliciesSettingsTab: React.FC<PoliciesSettingsTabProps> = ({
  support1Title,
  setSupport1Title,
  support1Content,
  setSupport1Content,
  support2Title,
  setSupport2Title,
  support2Content,
  setSupport2Content,
  support3Title,
  setSupport3Title,
  support3Content,
  setSupport3Content,
  help1Title,
  setHelp1Title,
  help1Content,
  setHelp1Content,
  help2Title,
  setHelp2Title,
  help2Content,
  setHelp2Content,
  help3Title,
  setHelp3Title,
  help3Content,
  setHelp3Content,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-black uppercase tracking-wider text-white">Footer Policy Pages</h2>
        <p className="text-xs text-gray-400 mt-1">
          Customize titles and policy details for the 3 Customer Support and 3 Company Help links shown in your website footer.
        </p>
        <div className="mt-2 p-3 bg-dragon-cyan/5 border border-dragon-cyan/20 rounded-xl text-[11px] text-dragon-cyan font-bold leading-relaxed">
          💡 Demo or default text is pre-filled in each field. You can customize them as needed. Visitors will be able to view details in-app via a dedicated popup or page, which is essential to satisfy search engine compliance rules and policies.
        </div>
      </div>

      <div className="pt-4 border-t border-white/5 space-y-8">
        
        {/* 1. Customer Support Column */}
        <div className="space-y-6 bg-white/[0.01] border border-white/5 rounded-3xl p-5">
          <h3 className="text-xs font-black uppercase tracking-wider text-dragon-cyan flex items-center gap-2 pb-3 border-b border-white/5">
            <ShieldCheck size={14} /> 1. Customer Support Column (3 options)
          </h3>

          {/* Option 1 */}
          <div className="space-y-3 p-4 bg-black/40 border border-white/5 rounded-2xl">
            <span className="text-[10px] font-black uppercase tracking-widest text-dragon-cyan">Option 1</span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1 space-y-1.5">
                <label className="text-[10px] text-gray-400 font-bold uppercase">Title</label>
                <input 
                  type="text" 
                  value={support1Title}
                  onChange={(e) => setSupport1Title(e.target.value)}
                  placeholder="e.g., Help & Support Center"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 outline-none focus:border-dragon-cyan text-xs font-bold text-white"
                />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] text-gray-400 font-bold uppercase">Detailed Policy Content</label>
                <textarea 
                  value={support1Content}
                  onChange={(e) => setSupport1Content(e.target.value)}
                  placeholder="Write custom details for help and support guide..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 outline-none focus:border-dragon-cyan text-xs text-white resize-y"
                />
              </div>
            </div>
          </div>

          {/* Option 2 */}
          <div className="space-y-3 p-4 bg-black/40 border border-white/5 rounded-2xl">
            <span className="text-[10px] font-black uppercase tracking-widest text-dragon-cyan">Option 2</span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1 space-y-1.5">
                <label className="text-[10px] text-gray-400 font-bold uppercase">Title</label>
                <input 
                  type="text" 
                  value={support2Title}
                  onChange={(e) => setSupport2Title(e.target.value)}
                  placeholder="e.g., Return & Refund Policy"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 outline-none focus:border-dragon-cyan text-xs font-bold text-white"
                />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] text-gray-400 font-bold uppercase">Detailed Policy Content</label>
                <textarea 
                  value={support2Content}
                  onChange={(e) => setSupport2Content(e.target.value)}
                  placeholder="Write custom return and refund policy details here..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 outline-none focus:border-dragon-cyan text-xs text-white resize-y"
                />
              </div>
            </div>
          </div>

          {/* Option 3 */}
          <div className="space-y-3 p-4 bg-black/40 border border-white/5 rounded-2xl">
            <span className="text-[10px] font-black uppercase tracking-widest text-dragon-cyan">Option 3</span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1 space-y-1.5">
                <label className="text-[10px] text-gray-400 font-bold uppercase">Title</label>
                <input 
                  type="text" 
                  value={support3Title}
                  onChange={(e) => setSupport3Title(e.target.value)}
                  placeholder="e.g., Order Tracking Guide"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 outline-none focus:border-dragon-cyan text-xs font-bold text-white"
                />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] text-gray-400 font-bold uppercase">Detailed Policy Content</label>
                <textarea 
                  value={support3Content}
                  onChange={(e) => setSupport3Content(e.target.value)}
                  placeholder="Write custom order tracking details here..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 outline-none focus:border-dragon-cyan text-xs text-white resize-y"
                />
              </div>
            </div>
          </div>

        </div>

        {/* 2. Company Help Column */}
        <div className="space-y-6 bg-white/[0.01] border border-white/5 rounded-3xl p-5">
          <h3 className="text-xs font-black uppercase tracking-wider text-dragon-cyan flex items-center gap-2 pb-3 border-b border-white/5">
            <ShieldCheck size={14} /> 2. Company Help Column (3 options)
          </h3>

          {/* Option 1 */}
          <div className="space-y-3 p-4 bg-black/40 border border-white/5 rounded-2xl">
            <span className="text-[10px] font-black uppercase tracking-widest text-dragon-cyan">Option 1</span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1 space-y-1.5">
                <label className="text-[10px] text-gray-400 font-bold uppercase">Title</label>
                <input 
                  type="text" 
                  value={help1Title}
                  onChange={(e) => setHelp1Title(e.target.value)}
                  placeholder="e.g., Terms & Conditions"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 outline-none focus:border-dragon-cyan text-xs font-bold text-white"
                />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] text-gray-400 font-bold uppercase">Detailed Policy Content</label>
                <textarea 
                  value={help1Content}
                  onChange={(e) => setHelp1Content(e.target.value)}
                  placeholder="Write custom terms and conditions here..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 outline-none focus:border-dragon-cyan text-xs text-white resize-y"
                />
              </div>
            </div>
          </div>

          {/* Option 2 */}
          <div className="space-y-3 p-4 bg-black/40 border border-white/5 rounded-2xl">
            <span className="text-[10px] font-black uppercase tracking-widest text-dragon-cyan">Option 2</span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1 space-y-1.5">
                <label className="text-[10px] text-gray-400 font-bold uppercase">Title</label>
                <input 
                  type="text" 
                  value={help2Title}
                  onChange={(e) => setHelp2Title(e.target.value)}
                  placeholder="e.g., Privacy Policy"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 outline-none focus:border-dragon-cyan text-xs font-bold text-white"
                />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] text-gray-400 font-bold uppercase">Detailed Policy Content</label>
                <textarea 
                  value={help2Content}
                  onChange={(e) => setHelp2Content(e.target.value)}
                  placeholder="Write custom privacy policy here..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 outline-none focus:border-dragon-cyan text-xs text-white resize-y"
                />
              </div>
            </div>
          </div>

          {/* Option 3 */}
          <div className="space-y-3 p-4 bg-black/40 border border-white/5 rounded-2xl">
            <span className="text-[10px] font-black uppercase tracking-widest text-dragon-cyan">Option 3</span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1 space-y-1.5">
                <label className="text-[10px] text-gray-400 font-bold uppercase">Title</label>
                <input 
                  type="text" 
                  value={help3Title}
                  onChange={(e) => setHelp3Title(e.target.value)}
                  placeholder="e.g., Buyer Protection Policy"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 outline-none focus:border-dragon-cyan text-xs font-bold text-white"
                />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] text-gray-400 font-bold uppercase">Detailed Policy Content</label>
                <textarea 
                  value={help3Content}
                  onChange={(e) => setHelp3Content(e.target.value)}
                  placeholder="Write buyer protection and warranty policy details here..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 outline-none focus:border-dragon-cyan text-xs text-white resize-y"
                />
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
