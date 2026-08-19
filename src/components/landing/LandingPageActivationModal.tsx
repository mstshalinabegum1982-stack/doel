import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { LandingPageData } from './types';

interface LandingPageActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPage: LandingPageData | null;
  selectedPlan: '1_month' | '3_months' | '6_months' | '1_year';
  setSelectedPlan: (plan: '1_month' | '3_months' | '6_months' | '1_year') => void;
  getLandingPagePrice: (dur: '1_month' | '3_months' | '6_months' | '1_year') => number;
  bkashSettings: { manualNumber: string; autoPaymentEnabled: boolean };
  senderNumber: string;
  setSenderNumber: (num: string) => void;
  trxId: string;
  setTrxId: (id: string) => void;
  submittingActivation: boolean;
  onSubmitManualPayment: () => void;
  onOpenAutoBkashGateway: () => void;
  triggerSuccess: (title: string, message: string) => void;
}

export const LandingPageActivationModal: React.FC<LandingPageActivationModalProps> = ({
  isOpen,
  onClose,
  selectedPage,
  selectedPlan,
  setSelectedPlan,
  getLandingPagePrice,
  bkashSettings,
  senderNumber,
  setSenderNumber,
  trxId,
  setTrxId,
  submittingActivation,
  onSubmitManualPayment,
  onOpenAutoBkashGateway,
  triggerSuccess
}) => {
  if (!isOpen || !selectedPage) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-lg bg-dragon-black border border-white/10 rounded-3xl overflow-hidden shadow-2xl my-auto p-6 md:p-8 space-y-6 relative"
        >
          <motion.button 
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose} 
            className="absolute top-6 right-6 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 p-2 rounded-full transition-colors cursor-pointer flex items-center justify-center shadow-lg"
          >
            <X size={18} />
          </motion.button>

          <div className="text-center space-y-2">
            <h3 className="text-lg font-display font-black uppercase tracking-wider text-white">
              Landing Page Activation Panel
            </h3>
            <p className="text-[10px] text-dragon-cyan font-bold uppercase tracking-widest">
              Please choose a plan to activate
            </p>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: '1_month', label: '1 Month', price: getLandingPagePrice('1_month') },
              { id: '3_months', label: '3 Months', price: getLandingPagePrice('3_months') },
              { id: '6_months', label: '6 Months', price: getLandingPagePrice('6_months') },
              { id: '1_year', label: '1 Year', price: getLandingPagePrice('1_year') }
            ].map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id as any)}
                className={cn(
                  "p-3.5 sm:p-4 rounded-2xl border text-left flex flex-col justify-between transition-all select-none gap-2 min-h-[90px] h-auto group cursor-pointer",
                  selectedPlan === plan.id 
                    ? "bg-dragon-cyan/10 border-dragon-cyan shadow-lg shadow-dragon-cyan/5" 
                    : "bg-white/[0.02] border-white/5 hover:border-white/10"
                )}
              >
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider group-hover:text-dragon-cyan transition-colors">{plan.label}</span>
                <span className="text-lg sm:text-xl font-display font-black text-white group-hover:text-dragon-cyan transition-colors">৳{plan.price}</span>
              </button>
            ))}
          </div>

          {/* Payment Section */}
          <div className="pt-4 border-t border-white/5 space-y-4 text-left">
            {bkashSettings.autoPaymentEnabled ? (
              <div className="space-y-4">
                <p className="text-xs text-gray-400 font-light leading-relaxed">
                  Click the button below to complete payment via bKash automatic payment gateway. After completion, your page will be activated instantly.
                </p>
                <button
                  onClick={onOpenAutoBkashGateway}
                  className="w-full py-3.5 bg-gradient-to-r from-dragon-cyan to-dragon-purple hover:opacity-90 text-dragon-black font-black uppercase tracking-widest text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
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
                      onClick={() => {
                        navigator.clipboard.writeText(bkashSettings.manualNumber);
                        triggerSuccess('Copied to Clipboard!', 'bKash number copied to clipboard successfully.');
                      }}
                      className="text-[9px] font-black uppercase tracking-widest text-dragon-cyan hover:underline bg-white/5 hover:bg-white/10 px-2 py-1 rounded cursor-pointer"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-[10px] text-amber-500 font-bold leading-relaxed">
                    * Please Send Money to the above bKash number. After sending money, enter the Transaction ID and your bKash sender number below.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">bKash Sender Number:</label>
                    <input
                      type="tel"
                      placeholder="01XXXXXXXXX"
                      value={senderNumber}
                      onChange={(e) => setSenderNumber(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-dragon-cyan outline-none transition-all text-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Transaction ID (TrxID):</label>
                    <input
                      type="text"
                      placeholder="Enter Bkash Transaction ID"
                      value={trxId}
                      onChange={(e) => setTrxId(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-dragon-cyan outline-none transition-all text-white font-mono"
                    />
                  </div>

                  <button
                    onClick={onSubmitManualPayment}
                    disabled={submittingActivation}
                    className="w-full py-4 bg-dragon-cyan hover:bg-dragon-cyan/90 text-dragon-black font-black uppercase tracking-widest text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
                  >
                    {submittingActivation ? (
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <><CheckCircle2 size={15} /> Submit Payment</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
