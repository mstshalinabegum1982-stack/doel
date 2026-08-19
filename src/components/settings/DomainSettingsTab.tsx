import React, { useState } from 'react';
import { Server, Copy, Check, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DomainSettingsTabProps {
  domainName: string;
  setDomainName: (val: string) => void;
  dnsType: 'A' | 'CNAME';
  setDnsType: (val: 'A' | 'CNAME') => void;
  isDomainPrimary: boolean;
  setIsDomainPrimary: (val: boolean) => void;
  appUrl: string;
}

export const DomainSettingsTab: React.FC<DomainSettingsTabProps> = ({
  domainName,
  setDomainName,
  dnsType,
  setDnsType,
  isDomainPrimary,
  setIsDomainPrimary,
  appUrl,
}) => {
  const [copiedText, setCopiedText] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-black uppercase tracking-wider text-white">Custom Domain Settings</h2>
        <p className="text-xs text-gray-400 mt-1">Link your custom domain name here and set up the required DNS records.</p>
      </div>

      <div className="pt-4 border-t border-white/5 space-y-6">
        
        {/* Domain Input */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-white block">
            1. Enter Domain Name
          </label>
          <input 
            type="text" 
            value={domainName}
            onChange={(e) => {
              setDomainName(e.target.value);
              // Auto detect DNS type: if there are more than 2 segments (e.g. shop.mystore.com), default to CNAME
              const parts = e.target.value.trim().split('.');
              if (parts.length > 2 && parts[0] !== 'www') {
                setDnsType('CNAME');
              } else {
                setDnsType('A');
              }
            }}
            placeholder="e.g., mystore.com or shop.mystore.com"
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 outline-none focus:border-dragon-cyan text-xs font-semibold text-white placeholder:text-gray-600"
          />
          <span className="text-[9px] text-gray-500 block">
            Do not include http:// or https:// at the beginning. Just enter the domain name.
          </span>
        </div>

        {/* DNS Type Select */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-white block">
            2. Select DNS Record Type
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setDnsType('A')}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl border text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 cursor-pointer",
                dnsType === 'A' 
                  ? "bg-dragon-cyan/10 border-dragon-cyan text-white" 
                  : "bg-white/5 border-white/5 text-gray-400 hover:text-white"
              )}
            >
              A Record (For Main Domain)
            </button>
            <button
              type="button"
              onClick={() => setDnsType('CNAME')}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl border text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 cursor-pointer",
                dnsType === 'CNAME' 
                  ? "bg-dragon-cyan/10 border-dragon-cyan text-white" 
                  : "bg-white/5 border-white/5 text-gray-400 hover:text-white"
              )}
            >
              CNAME Record (For Sub-domain)
            </button>
          </div>
        </div>

        {/* Primary option checkbox */}
        <div className="p-4 rounded-2xl bg-white/2 border border-white/5 flex items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold text-white uppercase">Set as Primary Domain</h4>
            <p className="text-[9px] text-gray-400 leading-relaxed mt-0.5 font-sans">Once activated, all your store links and visitors will be redirected to this custom domain.</p>
          </div>
          <div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={isDomainPrimary} 
                onChange={(e) => setIsDomainPrimary(e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-300 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-dragon-cyan peer-checked:after:bg-dragon-black peer-checked:after:border-dragon-black"></div>
            </label>
          </div>
        </div>

        {/* DNS Output Instructions Box */}
        {domainName.trim() && (
          <div className="bg-[#07070a]/80 p-4 sm:p-5 rounded-2xl border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server size={14} className="text-dragon-cyan animate-pulse" />
                <h3 className="text-xs font-black uppercase text-white tracking-wider">Configure Your DNS</h3>
              </div>
              <span className="text-[9px] bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 py-1 px-2.5 rounded-full font-bold">
                Pending SSL / Propagating
              </span>
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Log in to your domain registrar (e.g., Namecheap, GoDaddy, Cloudflare) and add the following DNS record:
            </p>

            <div className="p-3 bg-white/2 rounded-xl text-left border border-white/5 space-y-3">
              <div className="grid grid-cols-3 gap-2 text-[10px] border-b border-white/5 pb-2 text-gray-500 font-bold">
                <span>RECORD TYPE</span>
                <span>HOST / NAME</span>
                <span>VALUE / TARGET</span>
              </div>
              <div className="grid grid-cols-3 gap-2 items-center text-xs font-semibold text-white">
                <span className="text-dragon-cyan font-black">{dnsType}</span>
                <span className="bg-white/5 px-2 py-1 rounded font-mono text-[10px] w-max">{dnsType === 'A' ? '@' : domainName.split('.')[0]}</span>
                <div className="flex items-center gap-1.5 font-mono text-[10px] overflow-hidden">
                  <span className="truncate">{dnsType === 'A' ? '76.76.21.21' : `${window.location.host}`}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(dnsType === 'A' ? '76.76.21.21' : `${window.location.host}`);
                      setCopiedText(true);
                      setTimeout(() => setCopiedText(false), 2000);
                    }}
                    className="p-1 hover:bg-white/10 rounded text-dragon-cyan cursor-pointer"
                    title="Copy Value"
                  >
                    {copiedText ? <Check size={11} className="text-dragon-emerald" /> : <Copy size={11} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-dragon-cyan/5 border border-dragon-cyan/20 rounded-xl flex items-start gap-2.5">
              <ShieldCheck size={16} className="text-dragon-cyan shrink-0 mt-0.5" />
              <div>
                <h5 className="text-[10px] font-black uppercase text-white tracking-wide">Anti-Theft Secure Binding</h5>
                <p className="text-[9px] text-gray-400 leading-relaxed mt-1">
                  Your custom domain is securely bound to your account. Anti-theft validation prevents any other user from linking or utilizing your domain.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Live Link Outputs */}
        <div className="bg-white/2 p-4 rounded-xl border border-white/5 space-y-3">
          <h4 className="text-[10px] font-black uppercase tracking-wider text-dragon-cyan">Store Link Outputs</h4>
          <div className="space-y-2 font-sans">
            <div className="flex justify-between items-center bg-black/40 p-2.5 rounded-xl border border-white/5">
              <div className="overflow-hidden">
                <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest block leading-none">Main Website:</span>
                <span className="text-[10px] font-mono text-white truncate block mt-1">
                  {domainName.trim() ? `https://${domainName.trim().toLowerCase()}` : appUrl}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const value = domainName.trim() ? `https://${domainName.trim().toLowerCase()}` : appUrl;
                  navigator.clipboard.writeText(value);
                }}
                className="p-1 text-gray-400 hover:text-white cursor-pointer"
              >
                <Copy size={12} />
              </button>
            </div>

            <div className="flex justify-between items-center bg-black/40 p-2.5 rounded-xl border border-white/5">
              <div className="overflow-hidden">
                <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest block leading-none">Landing Page Sub-link:</span>
                <span className="text-[10px] font-mono text-white truncate block mt-1">
                  {domainName.trim() ? `https://${domainName.trim().toLowerCase()}/lp/[slug]` : `${window.location.protocol}//${window.location.host}/lp/[slug]`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const value = domainName.trim() ? `https://${domainName.trim().toLowerCase()}/lp/[slug]` : `${window.location.protocol}//${window.location.host}/lp/[slug]`;
                  navigator.clipboard.writeText(value);
                }}
                className="p-1 text-gray-400 hover:text-white cursor-pointer"
              >
                <Copy size={12} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
