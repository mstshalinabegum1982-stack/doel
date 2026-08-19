import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Check, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ProWebsiteData } from './types';

interface ProWebsiteActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  website: ProWebsiteData | null;
  selectedPlan: '1_month' | '3_months' | '6_months' | '1_year';
  setSelectedPlan: (plan: '1_month' | '3_months' | '6_months' | '1_year') => void;
  getProWebsitePrice: (planId: string, mode: 'bd' | 'intl') => number;
  bkashSettings: { autoPaymentEnabled: boolean; manualNumber: string };
  senderNumber: string;
  setSenderNumber: (num: string) => void;
  trxId: string;
  setTrxId: (trx: string) => void;
  submittingActivation: boolean;
  onSubmitManualPayment: () => Promise<void>;
  onOpenAutoBkashGateway: () => void;
  triggerNotification: (title: string, message: string) => void;
}

export const ProWebsiteActivationModal: React.FC<ProWebsiteActivationModalProps> = ({
  isOpen,
  onClose,
  website,
  selectedPlan,
  setSelectedPlan,
  getProWebsitePrice,
  bkashSettings,
  senderNumber,
  setSenderNumber,
  trxId,
  setTrxId,
  submittingActivation,
  onSubmitManualPayment,
  onOpenAutoBkashGateway,
  triggerNotification
}) => {
  if (!isOpen || !website) return null;

  return (
    <AnimatePresence>
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-[70] animate-fade-in"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-[#0d0f14] border border-white/10 rounded-3xl p-6 z-[80] shadow-2xl animate-scale-up text-left flex flex-col max-h-[90vh] overflow-y-auto font-sans">
          {/* Header */}
          <div className="flex justify-between items-start pb-4 border-b border-white/5 shrink-0">
            <div>
              <span className="text-[10px] text-dragon-cyan font-black uppercase tracking-widest block mb-1">PRO WEBSITE ACTIVATION</span>
              <h4 className="text-lg font-black text-white leading-tight">
                {website.brandName || 'Unnamed Store'}
              </h4>
            </div>
            <button 
              type="button"
              onClick={onClose}
              className="p-1.5 px-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-xs cursor-pointer font-bold"
            >
              ✕
            </button>
          </div>

          {/* Plans Selection */}
          <div className="space-y-4 py-4 overflow-y-auto flex-1">
            <p className="text-xs text-gray-400">Select a plan below to activate or extend your website subscription:</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: '1_month', label: '1 Month Starter', price: `৳${getProWebsitePrice('1_month', 'bd')}` },
                { id: '3_months', label: '3 Months Growth', price: `৳${getProWebsitePrice('3_months', 'bd')}`, badge: '10% OFF' },
                { id: '6_months', label: '6 Months Pro', price: `৳${getProWebsitePrice('6_months', 'bd')}`, badge: '20% OFF' },
                { id: '1_year', label: '1 Year Ultimate', price: `৳${getProWebsitePrice('1_year', 'bd')}`, badge: '30% OFF' }
              ].map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlan(plan.id as any)}
                  className={cn(
                    "p-3.5 sm:p-4 rounded-2xl border text-left flex flex-col justify-between transition-all relative overflow-hidden min-h-[110px] h-auto group cursor-pointer",
                    selectedPlan === plan.id 
                      ? "bg-dragon-cyan/10 border-dragon-cyan shadow-lg shadow-dragon-cyan/5" 
                      : "bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/[0.08]"
                  )}
                >
                  {plan.badge && (
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-dragon-cyan text-dragon-black font-black uppercase text-[7px] rounded">
                      {plan.badge}
                    </div>
                  )}
                  
                  <div className="space-y-1">
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full inline-block",
                      selectedPlan === plan.id ? "bg-dragon-cyan animate-pulse" : "bg-gray-600"
                    )} />
                    <h5 className="text-[11px] font-black uppercase tracking-wider text-white group-hover:text-dragon-cyan transition-colors">{plan.label}</h5>
                  </div>

                  <div className="mt-3 pt-2 border-t border-white/10 w-full flex justify-between items-baseline">
                    <p className="text-base sm:text-lg font-display font-black text-white group-hover:text-dragon-cyan transition-colors">{plan.price}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Gateway Block */}
            <div className="pt-4 border-t border-white/5">
              <h5 className="text-[10px] font-black uppercase tracking-widest text-dragon-cyan mb-3">Select Payment Gateway:</h5>

              {bkashSettings.autoPaymentEnabled ? (
                <div className="space-y-4">
                  <p className="text-xs text-gray-400 font-light leading-relaxed">
                    Click the button below to pay via bkash Automatic Payment Gateway. Your website will be activated instantly once payment is successful.
                  </p>
                  <button
                    type="button"
                    onClick={onOpenAutoBkashGateway}
                    className="w-full py-4 bg-gradient-to-r from-dragon-cyan to-dragon-purple hover:opacity-90 text-dragon-black font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
                  >
                    <Zap size={15} /> Automatic bKash Payment (Pay Now)
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-2">
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">bKash Payment Number (Send Money):</p>
                    <div className="flex items-center justify-between gap-2 bg-black/40 px-4 py-2.5 rounded-xl border border-white/5">
                      <span className="text-sm font-mono font-bold text-white tracking-wider">{bkashSettings.manualNumber}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(bkashSettings.manualNumber);
                          triggerNotification('Copied to Clipboard!', 'bKash number copied to clipboard successfully.');
                        }}
                        className="text-[9px] font-black uppercase tracking-widest text-dragon-cyan hover:underline bg-white/5 hover:bg-white/10 px-2 py-1 rounded cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-[10px] text-amber-550 font-bold leading-relaxed">
                      * Please Send Money to the bKash number listed above. After sending, provide your sender number and Transaction ID below.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">bKash Number (Sender Number):</label>
                      <input
                        type="tel"
                        placeholder="01XXXXXXXXX"
                        value={senderNumber}
                        onChange={(e) => setSenderNumber(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs focus:border-dragon-cyan outline-none transition-all text-white font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">TrxID (Transaction ID):</label>
                      <input
                        type="text"
                        placeholder="Enter Transaction ID"
                        value={trxId}
                        onChange={(e) => setTrxId(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs focus:border-dragon-cyan outline-none transition-all text-white font-mono uppercase"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onSubmitManualPayment}
                    disabled={submittingActivation}
                    className="w-full py-4 bg-dragon-cyan hover:bg-dragon-cyan/90 text-dragon-black font-black uppercase tracking-widest text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer disabled:opacity-50 font-sans"
                  >
                    {submittingActivation ? (
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <><Check size={15} /> Submit Payment</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    </AnimatePresence>
  );
};
