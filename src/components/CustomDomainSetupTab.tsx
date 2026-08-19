import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Server, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Copy, 
  Check, 
  Loader2, 
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';

interface ProWebsiteData {
  id: string;
  slug: string;
  brandName: string;
  logo?: string;
  colors?: {
    theme: string;
  };
  customDomain?: {
    domainName: string;
    isPrimary: boolean;
    dnsType: 'A' | 'CNAME';
    dnsValue: string;
    sslStatus: 'pending' | 'active' | 'failed';
    configuredAt?: string;
  };
}

interface CustomDomainSetupTabProps {
  proWebsites: ProWebsiteData[];
}

export default function CustomDomainSetupTab({ proWebsites }: CustomDomainSetupTabProps) {
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string>('');
  const [domainName, setDomainName] = useState('');
  const [isDomainPrimary, setIsDomainPrimary] = useState(false);
  const [dnsType, setDnsType] = useState<'A' | 'CNAME'>('A');
  const [dnsValue, setDnsValue] = useState('76.76.21.21');
  const [sslStatus, setSslStatus] = useState<'pending' | 'active' | 'failed'>('pending');
  
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [removedSuccess, setRemovedSuccess] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Set default selected website when websites list loads
  useEffect(() => {
    if (proWebsites.length > 0 && !selectedWebsiteId) {
      setSelectedWebsiteId(proWebsites[0].id);
    }
  }, [proWebsites, selectedWebsiteId]);

  // Load selected website domain settings
  useEffect(() => {
    if (!selectedWebsiteId) return;
    const website = proWebsites.find(w => w.id === selectedWebsiteId);
    if (website && website.customDomain) {
      setDomainName(website.customDomain.domainName || '');
      setIsDomainPrimary(!!website.customDomain.isPrimary);
      setDnsType(website.customDomain.dnsType || 'A');
      setDnsValue(website.customDomain.dnsValue || '76.76.21.21');
      setSslStatus(website.customDomain.sslStatus || 'pending');
    } else {
      // Clear values if no custom domain exists for the selected website
      setDomainName('');
      setIsDomainPrimary(false);
      setDnsType('A');
      setDnsValue('76.76.21.21');
      setSslStatus('pending');
    }
  }, [selectedWebsiteId, proWebsites]);

  const handleDomainChange = (val: string) => {
    setDomainName(val);
    // Auto-detect DNS type: if there are more than 2 segments (like shop.mystore.com), default to CNAME. Otherwise default to type 'A'
    const parts = val.trim().split('.');
    if (parts.length > 2 && parts[0] !== 'www') {
      setDnsType('CNAME');
    } else {
      setDnsType('A');
    }
  };

  const getDnsHostValue = () => {
    if (!domainName) return '@';
    if (dnsType === 'A') return '@';
    const parts = domainName.trim().toLowerCase().split('.');
    if (parts.length > 2) {
      return parts[0]; // e.g. 'shop' from 'shop.example.com' or 'www' from 'www.example.com'
    }
    return 'www'; // default CNAME
  };

  const currentOrigin = window.location.host;
  const computedDnsValue = dnsType === 'A' ? '76.76.21.21' : currentOrigin;

  // Save changes to Firestore
  const handleSaveDomain = async () => {
    if (!selectedWebsiteId) return;
    if (!domainName.trim()) {
      alert('Please enter a valid domain name.');
      return;
    }

    setIsSaving(true);
    setSavedSuccess(false);

    try {
      const docRef = doc(db, 'pro_websites', selectedWebsiteId);
      const cleanedDomain = domainName.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '');
      
      const domainPayload = {
        domainName: cleanedDomain,
        isPrimary: isDomainPrimary,
        dnsType: dnsType,
        dnsValue: computedDnsValue,
        sslStatus: sslStatus,
        configuredAt: new Date().toISOString()
      };

      await updateDoc(docRef, {
        customDomain: domainPayload,
        updatedAt: new Date().toISOString()
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save domain:', error);
      handleFirestoreError(error, OperationType.UPDATE, `pro_websites/${selectedWebsiteId}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Remove custom domain
  const handleRemoveDomain = async () => {
    if (!selectedWebsiteId) return;

    setIsRemoving(true);
    setRemovedSuccess(false);

    try {
      const docRef = doc(db, 'pro_websites', selectedWebsiteId);
      await updateDoc(docRef, {
        customDomain: null,
        updatedAt: new Date().toISOString()
      });

      setDomainName('');
      setIsDomainPrimary(false);
      setDnsType('A');
      setDnsValue('76.76.21.21');
      setSslStatus('pending');

      setRemovedSuccess(true);
      setTimeout(() => setRemovedSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to remove domain:', error);
      handleFirestoreError(error, OperationType.UPDATE, `pro_websites/${selectedWebsiteId}`);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleCopy = (txt: string, type: 'host' | 'value') => {
    navigator.clipboard.writeText(txt);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  if (proWebsites.length === 0) {
    return (
      <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 text-center space-y-4 max-w-xl mx-auto my-12">
        <div className="p-4 bg-dragon-cyan/15 rounded-full w-max mx-auto">
          <Globe size={32} className="text-dragon-cyan" />
        </div>
        <h3 className="text-lg font-black text-white">No Pro Website Found</h3>
        <p className="text-xs text-gray-400 leading-relaxed font-semibold">
          To set up a custom domain, you must first have a Pro website. Please create a Pro website from the menu or from Home.
        </p>
      </div>
    );
  }

  const selectedWebsite = proWebsites.find(w => w.id === selectedWebsiteId);

  return (
    <div className="space-y-6 max-w-4xl mx-auto my-6">
      {/* Informative Header card */}
      <div className="p-6 bg-gradient-to-r from-dragon-cyan/15 to-dragon-purple/15 rounded-3xl border border-white/5 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Globe size={14} className="text-dragon-cyan animate-pulse" />
            <span className="text-[10px] font-black tracking-widest text-dragon-cyan uppercase">Domain Management</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-black text-white uppercase tracking-tight mb-2">Custom Domain Setup</h1>
          <p className="text-gray-400 text-xs max-w-2xl leading-relaxed font-bold">
            Connect your custom domain (e.g., storename.com) to your Pro website. Easily copy the DNS records and set them up in your domain provider account.
          </p>
        </div>
        <div className="absolute top-1/2 right-10 -translate-y-1/2 w-[220px] h-[220px] bg-dragon-cyan/5 blur-[50px] rounded-full pointer-events-none" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Setups Panel */}
        <div className="lg:col-span-12 space-y-6 bg-white/[0.02] border border-white/5 rounded-3xl p-6 sm:p-8">
          
          {/* 1. Select Website */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-white block">
              Select Website
            </label>
            <div className="relative">
              <select
                value={selectedWebsiteId}
                onChange={(e) => setSelectedWebsiteId(e.target.value)}
                className="w-full appearance-none bg-black/40 border border-white/10 rounded-2xl py-3.5 px-4 pr-10 outline-none focus:border-dragon-cyan text-xs font-semibold text-white pointer-events-auto"
              >
                {proWebsites.map((website) => (
                  <option key={website.id} value={website.id} className="bg-dragon-black text-white">
                    {website.brandName} (Slug: {website.slug})
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <ChevronDown size={16} />
              </div>
            </div>
            <p className="text-[9px] text-gray-500">
              Select the website for which you want to set up a custom domain.
            </p>
          </div>

          <div className="h-px bg-white/5" />

          {/* 2. Brand domain inputs */}
          <div className="space-y-6">
            {/* Domain Name input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white block">
                1. Enter Domain Name
              </label>
              <input 
                type="text" 
                value={domainName}
                onChange={(e) => handleDomainChange(e.target.value)}
                placeholder="e.g., mystore.com or shop.mystore.com"
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-3.5 px-4 outline-none focus:border-dragon-cyan text-xs font-semibold text-white placeholder:text-gray-600"
              />
              <span className="text-[9px] text-gray-500 block">
                No need to add http://, https://, or www. at the beginning. Just enter the main domain name.
              </span>
            </div>

            {/* DNS Type Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white block">
                2. Select DNS Record Type
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setDnsType('A')}
                  className={`flex-1 py-3 px-4 rounded-xl border text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    dnsType === 'A' 
                      ? "bg-dragon-cyan/10 border-dragon-cyan text-white" 
                      : "bg-white/5 border-white/5 text-gray-400 hover:text-white"
                  }`}
                >
                  A Record (For root domain)
                </button>
                <button
                  type="button"
                  onClick={() => setDnsType('CNAME')}
                  className={`flex-1 py-3 px-4 rounded-xl border text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    dnsType === 'CNAME' 
                      ? "bg-dragon-cyan/10 border-dragon-cyan text-white" 
                      : "bg-white/5 border-white/5 text-gray-400 hover:text-white"
                  }`}
                >
                  CNAME Record (For sub-domains)
                </button>
              </div>
            </div>

            {/* Set as Primary Box Option */}
            <div className="p-4 rounded-2xl bg-black/20 border border-white/5 flex items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-white uppercase">Set as Primary Domain</h4>
                <p className="text-[9px] text-gray-400 leading-relaxed mt-0.5">
                  Activating this will redirect all your store links and visitors to this custom domain.
                </p>
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

            {/* Advanced DNS values to COPY */}
            <AnimatePresence>
              {domainName.trim() && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-[#07070a]/80 p-4 sm:p-5 rounded-2xl border border-white/5 space-y-4 overflow-hidden"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Server size={14} className="text-dragon-cyan" />
                      <h3 className="text-xs font-black uppercase text-white tracking-wider">Configure DNS Records</h3>
                    </div>
                    <span className="text-[9px] bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 py-1 px-2.5 rounded-full font-bold">
                      {sslStatus === 'active' ? 'SSL Active (Secured)' : 'Pending Verification / SSL'}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    Log in to your domain registrar (e.g., Namecheap, GoDaddy, Cloudflare, NameSilo), navigate to DNS records, and enter the copied information below:
                  </p>

                  <div className="p-4 bg-[#0a0c10] rounded-xl text-left border border-white/5 space-y-4 overflow-x-auto">
                    <div className="min-w-[450px]">
                      {/* Header */}
                      <div className="grid grid-cols-3 gap-2 text-[10px] border-b border-white/5 pb-2 text-gray-500 font-bold uppercase tracking-wider">
                        <span>Record Type</span>
                        <span>Host / Name</span>
                        <span>Value / Target</span>
                      </div>

                      {/* Data Row */}
                      <div className="grid grid-cols-3 gap-2 items-center text-xs font-semibold text-white pt-2">
                        {/* DNS Type info */}
                        <span className="text-dragon-cyan font-black">{dnsType}</span>
                        
                        {/* Computed Host */}
                        <div className="flex items-center gap-1.5 font-mono text-[10px] min-w-0">
                          <span className="bg-white/5 px-2 py-1 rounded select-all truncate">{getDnsHostValue()}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(getDnsHostValue(), 'host')}
                            className="p-1 hover:bg-white/10 rounded text-dragon-cyan cursor-pointer shrink-0"
                            title="Copy Host"
                          >
                            {copiedType === 'host' ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                          </button>
                        </div>
                        
                        {/* Computed Value */}
                        <div className="flex items-center gap-1.5 font-mono text-[10px] min-w-0 overflow-hidden">
                          <span className="bg-white/5 px-2 py-1 rounded select-all truncate max-w-full">{computedDnsValue}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(computedDnsValue, 'value')}
                            className="p-1 hover:bg-white/10 rounded text-dragon-cyan cursor-pointer shrink-0"
                            title="Copy Value"
                          >
                            {copiedType === 'value' ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Detailed Step guidance */}
                  <div className="text-[10px] text-yellow-400/80 leading-relaxed bg-yellow-500/5 border border-yellow-500/10 p-3.5 rounded-xl">
                    ⚠️ <strong>Important Note:</strong> After adding the records to your registrar, it can take anywhere from 5 minutes to 24 hours to propagate fully. Once updated, your custom domain will become active.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Feedback messages */}
            <AnimatePresence>
              {savedSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-4 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center gap-3 text-xs font-bold"
                >
                  <CheckCircle2 size={16} />
                  <span>Custom domain successfully set up in DragonPro dashboard!</span>
                </motion.div>
              )}
              {removedSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-4 bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-2xl flex items-center gap-3 text-xs font-bold"
                >
                  <AlertCircle size={16} />
                  <span>Custom domain was successfully removed.</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Core Action triggers */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={handleSaveDomain}
                disabled={isSaving || !domainName.trim()}
                className={`flex-1 py-3.5 px-6 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isSaving || !domainName.trim()
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5'
                    : 'bg-dragon-cyan text-black hover:shadow-lg hover:shadow-dragon-cyan/20 active:scale-98'
                }`}
              >
                {isSaving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={14} />
                    Save Domain
                  </>
                )}
              </button>

              {selectedWebsite?.customDomain && (
                <button
                  onClick={() => setShowConfirmModal(true)}
                  disabled={isRemoving}
                  className="sm:w-max py-3.5 px-6 bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  {isRemoving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Removing...
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} />
                      Remove Domain
                    </>
                  )}
                </button>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* Custom Confirmation Popup Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-dragon-black border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6 overflow-hidden text-center z-10"
            >
              {/* Background gradient decor */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-rose-500/10 blur-[40px] rounded-full pointer-events-none" />

              <div className="p-4 bg-rose-500/15 rounded-full w-max mx-auto text-rose-400 relative z-10">
                <Trash2 size={32} />
              </div>

              <div className="space-y-2 relative z-10">
                <h3 className="text-base font-black text-white uppercase tracking-wider">Domain Removal Confirmation</h3>
                <p className="text-xs text-gray-400 leading-relaxed font-bold">
                  Are you sure you want to remove this custom domain? This will disconnect the domain from your website.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 relative z-10">
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmModal(false);
                    handleRemoveDomain();
                  }}
                  className="flex-1 py-3 px-5 bg-rose-600 hover:bg-rose-500 active:scale-98 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  Yes, Remove
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3 px-5 bg-white/5 hover:bg-white/10 active:scale-98 text-gray-300 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border border-white/5"
                >
                  No, Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
