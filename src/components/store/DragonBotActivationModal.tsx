import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Check, CreditCard } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ProWebsiteData } from './types';

interface DragonBotActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  website: ProWebsiteData | null;
  botBillingCountryMode: 'bd' | 'intl';
  setBotBillingCountryMode: (mode: 'bd' | 'intl') => void;
  botSelectedPlan: '1_month' | '3_months';
  setBotSelectedPlan: (plan: '1_month' | '3_months') => void;
  bkashSettings: { manualNumber: string };
  botPaymentPhone: string;
  setBotPaymentPhone: (phone: string) => void;
  botPaymentTrxId: string;
  setBotPaymentTrxId: (trx: string) => void;
  submittingBotActivation: boolean;
  handleBotBkashPaymentSubmit: () => Promise<void>;
  botStripeName: string;
  setBotStripeName: (name: string) => void;
  botStripeCardNum: string;
  setBotStripeCardNum: (card: string) => void;
  botStripeExpiry: string;
  setBotStripeExpiry: (exp: string) => void;
  botStripeCvc: string;
  setBotStripeCvc: (cvc: string) => void;
  botStripePaying: boolean;
  handleBotStripePaymentSubmit: (e: React.FormEvent) => Promise<void>;
  triggerNotification: (title: string, message: string) => void;
}

export const DragonBotActivationModal: React.FC<DragonBotActivationModalProps> = ({
  isOpen,
  onClose,
  website,
  botBillingCountryMode,
  setBotBillingCountryMode,
  botSelectedPlan,
  setBotSelectedPlan,
  bkashSettings,
  botPaymentPhone,
  setBotPaymentPhone,
  botPaymentTrxId,
  setBotPaymentTrxId,
  submittingBotActivation,
  handleBotBkashPaymentSubmit,
  botStripeName,
  setBotStripeName,
  botStripeCardNum,
  setBotStripeCardNum,
  botStripeExpiry,
  setBotStripeExpiry,
  botStripeCvc,
  setBotStripeCvc,
  botStripePaying,
  handleBotStripePaymentSubmit,
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
              <span className="text-[10px] text-dragon-cyan font-black uppercase tracking-widest block mb-1">DRAGON BOT ACTIVATION</span>
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

          {/* Country Mode Toggle */}
          <div className="flex bg-white/5 p-1 rounded-xl mt-4 shrink-0">
            <button
              type="button"
              onClick={() => setBotBillingCountryMode('bd')}
              className={cn(
                "flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer",
                botBillingCountryMode === 'bd' ? "bg-dragon-cyan text-dragon-black font-black" : "text-gray-400 hover:text-white"
              )}
            >
              🇧🇩 For Bangladesh (bKash)
            </button>
            <button
              type="button"
              onClick={() => setBotBillingCountryMode('intl')}
              className={cn(
                "flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer",
                botBillingCountryMode === 'intl' ? "bg-dragon-cyan text-dragon-black font-black" : "text-gray-400 hover:text-white"
              )}
            >
              🌐 International (Stripe)
            </button>
          </div>

          {/* Plans Selection */}
          <div className="space-y-4 py-4 overflow-y-auto flex-1">
            <p className="text-xs text-gray-400">Select a plan below to activate Dragon Chatbot:</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: '1_month', label: '1 Month Bot', priceBD: '৳6000', priceIntl: '$20', desc: 'Bot service fully active for 1 month' },
                { id: '3_months', label: '3 Months Bot', priceBD: '৳15000', priceIntl: '$55', desc: 'Bot service fully active for 3 months', badge: 'Best Value' }
              ].map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setBotSelectedPlan(plan.id as any)}
                  className={cn(
                    "p-3.5 sm:p-4 rounded-2xl border text-left flex flex-col justify-between transition-all relative overflow-hidden min-h-[115px] h-auto group cursor-pointer",
                    botSelectedPlan === plan.id 
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
                      botSelectedPlan === plan.id ? "bg-dragon-cyan animate-pulse" : "bg-gray-600"
                    )} />
                    <h5 className="text-[11px] font-black uppercase tracking-wider text-white group-hover:text-dragon-cyan transition-colors">{plan.label}</h5>
                    <p className="text-[8px] text-gray-500 font-sans leading-tight">{plan.desc}</p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-white/10 w-full flex justify-between items-baseline">
                    <p className="text-base sm:text-lg font-display font-black text-white group-hover:text-dragon-cyan transition-colors">
                      {botBillingCountryMode === 'bd' ? plan.priceBD : plan.priceIntl}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Billing forms */}
            <div className="pt-4 border-t border-white/5">
              {botBillingCountryMode === 'bd' ? (
                /* bKash Manual Payment BD */
                <div className="space-y-4">
                  <div className="p-4 bg-pink-500/5 border border-pink-500/10 rounded-2xl space-y-3">
                    <div className="flex items-center gap-1.5 text-pink-400 font-black text-[10px] uppercase tracking-widest">
                      <span className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-ping" />
                      Manual Payment Instructions
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Please <strong>Send Money</strong> equivalent to the plan price to the bKash Personal number below. After sending, submit your bKash number and transaction ID (TrxID) below.
                    </p>
                    
                    <div className="flex items-center justify-between bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-xs">
                      <span className="text-gray-400 font-semibold">bKash Personal Number:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-pink-400 font-mono font-black select-all">{bkashSettings.manualNumber}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(bkashSettings.manualNumber);
                            triggerNotification('Copied to Clipboard!', 'bKash number copied to clipboard successfully.');
                          }}
                          className="px-2 py-1 bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-wider text-gray-400 rounded cursor-pointer"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block pl-1">Sender bKash Number</label>
                      <input
                        type="text"
                        placeholder="01XXXXXXXXX"
                        value={botPaymentPhone}
                        onChange={(e) => setBotPaymentPhone(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-black outline-none focus:border-dragon-cyan"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block pl-1">bKash Transaction ID</label>
                      <input
                        type="text"
                        placeholder="e.g. K8F1N2X9Y7"
                        value={botPaymentTrxId}
                        onChange={(e) => setBotPaymentTrxId(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-black outline-none focus:border-dragon-cyan"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleBotBkashPaymentSubmit}
                      disabled={submittingBotActivation}
                      className="w-full mt-2 py-4 bg-dragon-cyan hover:bg-dragon-cyan/90 text-dragon-black font-black uppercase tracking-widest text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer disabled:opacity-50 font-sans"
                    >
                      {submittingBotActivation ? (
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <><Check size={15} /> Submit bKash Request</>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* Stripe payment Intl */
                <form onSubmit={handleBotStripePaymentSubmit} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block pl-1">Cardholder Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={botStripeName}
                      onChange={(e) => setBotStripeName(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-black outline-none focus:border-dragon-cyan"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block pl-1">Card Number</label>
                    <input
                      type="text"
                      required
                      placeholder="4242 •••• •••• ••••"
                      value={botStripeCardNum}
                      onChange={(e) => setBotStripeCardNum(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                      maxLength={19}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-black outline-none focus:border-dragon-cyan font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block pl-1">Expiration (MM/YY)</label>
                      <input
                        type="text"
                        required
                        placeholder="MM/YY"
                        maxLength={5}
                        value={botStripeExpiry}
                        onChange={(e) => setBotStripeExpiry(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-black outline-none focus:border-dragon-cyan font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block pl-1">CVC / CVV</label>
                      <input
                        type="password"
                        required
                        placeholder="123"
                        maxLength={3}
                        value={botStripeCvc}
                        onChange={(e) => setBotStripeCvc(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-black outline-none focus:border-dragon-cyan font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={botStripePaying}
                    className="w-full mt-2 py-4 bg-gradient-to-r from-dragon-cyan to-dragon-purple text-dragon-black font-black uppercase tracking-widest text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer disabled:opacity-50 font-sans"
                  >
                    {botStripePaying ? (
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <><CreditCard size={14} /> Pay securely with Stripe</>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </>
    </AnimatePresence>
  );
};
