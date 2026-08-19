import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Check, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CatalogActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeName: string;
  selectedCurrency: 'BDT' | 'USD';
  setSelectedCurrency: (curr: 'BDT' | 'USD') => void;
  catalogSelectedPlan: '1_month' | '3_months' | '6_months' | '1_year';
  setCatalogSelectedPlan: (plan: '1_month' | '3_months' | '6_months' | '1_year') => void;
  dbPricing: any;
  bkashSettings: { autoPaymentEnabled: boolean; manualNumber: string };
  catalogSenderNumber: string;
  setCatalogSenderNumber: (num: string) => void;
  catalogTrxId: string;
  setCatalogTrxId: (trx: string) => void;
  submittingCatalogActivation: boolean;
  onSubmitManualPayment: () => Promise<void>;
  onOpenAutoBkashGateway: () => void;
  onOpenGpayGateway: () => void;
  triggerNotification: (title: string, message: string) => void;
}

export const CatalogActivationModal: React.FC<CatalogActivationModalProps> = ({
  isOpen,
  onClose,
  storeName,
  selectedCurrency,
  setSelectedCurrency,
  catalogSelectedPlan,
  setCatalogSelectedPlan,
  dbPricing,
  bkashSettings,
  catalogSenderNumber,
  setCatalogSenderNumber,
  catalogTrxId,
  setCatalogTrxId,
  submittingCatalogActivation,
  onSubmitManualPayment,
  onOpenAutoBkashGateway,
  onOpenGpayGateway,
  triggerNotification
}) => {
  if (!isOpen) return null;

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
              <span className="text-[10px] text-dragon-cyan font-black uppercase tracking-widest block mb-1">CATALOG ACTIVATION</span>
              <h4 className="text-lg font-black text-white leading-tight">
                {storeName || 'My Catalog Store'}
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

          {/* Currency Selector */}
          <div className="mt-4 shrink-0 flex items-center justify-between bg-white/5 p-1 rounded-2xl border border-white/5">
            <span className="text-xs font-bold text-gray-350 pl-3">Filter Payment Method:</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedCurrency('BDT');
                  setCatalogSelectedPlan('1_month');
                }}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                  selectedCurrency === 'BDT' ? "bg-dragon-cyan text-dragon-black shadow-md" : "text-gray-400 hover:text-white"
                )}
              >
                🇧🇩 bKash (BDT)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedCurrency('USD');
                  setCatalogSelectedPlan('1_month');
                }}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                  selectedCurrency === 'USD' ? "bg-[#34a853] text-white shadow-md" : "text-gray-400 hover:text-white"
                )}
              >
                🌎 Google Pay (USD)
              </button>
            </div>
          </div>

          {/* Plans Selection */}
          <div className="space-y-4 py-4 overflow-y-auto flex-1">
            <p className="text-xs text-gray-400 font-medium">
              {selectedCurrency === 'BDT' 
                ? 'Select a bKash (BDT) plan below to keep your catalog and product menu active:'
                : 'Select a Google Pay (USD) plan to activate your public catalog instantly across 69+ countries:'
              }
            </p>

            <div className="grid grid-cols-2 gap-3">
              {selectedCurrency === 'BDT' ? (
                // BDT Plans
                [
                  { id: '1_month', label: '1 Month', price: `৳${dbPricing?.my_catalog?.bd?.['1_month'] ?? 499}` },
                  { id: '3_months', label: '3 Months', price: `৳${dbPricing?.my_catalog?.bd?.['3_months'] ?? 1300}`, badge: '13% OFF' },
                  { id: '6_months', label: '6 Months', price: `৳${dbPricing?.my_catalog?.bd?.['6_months'] ?? 2400}`, badge: '20% OFF' },
                  { id: '1_year', label: '1 Year', price: `৳${dbPricing?.my_catalog?.bd?.['1_year'] ?? 4500}`, badge: '25% OFF' }
                ].map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setCatalogSelectedPlan(plan.id as any)}
                    className={cn(
                      "p-3.5 sm:p-4 rounded-2xl border text-left flex flex-col justify-between transition-all relative overflow-hidden min-h-[110px] h-auto group cursor-pointer text-left",
                      catalogSelectedPlan === plan.id 
                        ? "border-dragon-cyan bg-dragon-cyan/5 shadow-lg shadow-dragon-cyan/5" 
                        : "border-white/5 bg-white/[0.01] hover:bg-white/[0.02] hover:border-white/10"
                    )}
                  >
                    {plan.badge && (
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-dragon-cyan text-dragon-black font-black text-[8px] uppercase tracking-wider rounded">
                        {plan.badge}
                      </span>
                    )}
                    <div className="space-y-1">
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full inline-block",
                        catalogSelectedPlan === plan.id ? "bg-dragon-cyan animate-pulse" : "bg-gray-600"
                      )} />
                      <h5 className="text-[11px] font-black uppercase tracking-wider text-white group-hover:text-dragon-cyan transition-colors">{plan.label}</h5>
                    </div>
                    <div className="mt-3 pt-2 border-t border-white/10 w-full flex justify-between items-baseline">
                      <p className="text-base sm:text-lg font-display font-black text-white group-hover:text-dragon-cyan transition-colors">{plan.price}</p>
                    </div>
                  </button>
                ))
              ) : (
                // USD Plans
                [
                  { id: '1_month', label: '1 Month Starter', price: `$${dbPricing?.my_catalog?.intl?.['1_month'] ?? 4.99}` },
                  { id: '3_months', label: '3 Months Growth', price: `$${dbPricing?.my_catalog?.intl?.['3_months'] ?? 12}`, badge: '20% OFF' },
                  { id: '6_months', label: '6 Months Pro', price: `$${dbPricing?.my_catalog?.intl?.['6_months'] ?? 19}`, badge: '36% OFF' },
                  { id: '1_year', label: '1 Year Ultimate', price: `$${dbPricing?.my_catalog?.intl?.['1_year'] ?? 39}`, badge: '35% OFF' }
                ].map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setCatalogSelectedPlan(plan.id as any)}
                    className={cn(
                      "p-3.5 sm:p-4 rounded-2xl border text-left flex flex-col justify-between transition-all relative overflow-hidden min-h-[110px] h-auto group cursor-pointer text-left",
                      catalogSelectedPlan === plan.id 
                        ? "border-[#34a853] bg-[#34a853]/5 shadow-lg shadow-[#34a853]/5" 
                        : "border-white/5 bg-white/[0.01] hover:bg-white/[0.02] hover:border-white/10"
                    )}
                  >
                    {plan.badge && (
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-[#34a853] text-white font-black text-[8px] uppercase tracking-wider rounded">
                        {plan.badge}
                      </span>
                    )}
                    <div className="space-y-1">
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full inline-block",
                        catalogSelectedPlan === plan.id ? "bg-[#34a853] animate-pulse" : "bg-gray-600"
                      )} />
                      <h5 className="text-[11px] font-black uppercase tracking-wider text-white group-hover:text-[#34a853] transition-colors">{plan.label}</h5>
                    </div>
                    <div className="mt-3 pt-2 border-t border-white/10 w-full flex justify-between items-baseline">
                      <p className="text-base sm:text-lg font-display font-black text-white group-hover:text-[#34a853] transition-colors">{plan.price}</p>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Gateway Block */}
            <div className="pt-4 border-t border-white/5">
              <h5 className="text-[10px] font-black uppercase tracking-widest text-dragon-cyan mb-3">Select Payment Gateway:</h5>

              {selectedCurrency === 'BDT' ? (
                bkashSettings.autoPaymentEnabled ? (
                  <div className="space-y-4">
                    <p className="text-xs text-gray-400 font-light leading-relaxed">
                      Click the button below to pay via bKash Automatic Payment Gateway. Your catalog will be activated instantly once payment is successful.
                    </p>
                    <button
                      type="button"
                      onClick={onOpenAutoBkashGateway}
                      className="w-full py-4 bg-[#e2136e] hover:opacity-90 text-white font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
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
                          value={catalogSenderNumber}
                          onChange={(e) => setCatalogSenderNumber(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs focus:border-dragon-cyan outline-none transition-all text-white font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">TrxID (Transaction ID):</label>
                        <input
                          type="text"
                          placeholder="Enter Transaction ID"
                          value={catalogTrxId}
                          onChange={(e) => setCatalogTrxId(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs focus:border-dragon-cyan outline-none transition-all text-white font-mono uppercase"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={onSubmitManualPayment}
                      disabled={submittingCatalogActivation}
                      className="w-full py-4 bg-dragon-cyan hover:bg-dragon-cyan/90 text-dragon-black font-black uppercase tracking-widest text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer disabled:opacity-50 font-sans"
                    >
                      {submittingCatalogActivation ? (
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <><Check size={15} /> Submit Payment</>
                      )}
                    </button>
                  </div>
                )
              ) : (
                // Google Pay Gateway Option
                <div className="space-y-4">
                  <p className="text-xs text-gray-400 font-light leading-relaxed">
                    You can pay with any international credit/debit card via Google Pay. The catalog will be activated instantly upon payment.
                  </p>
                  <button
                    type="button"
                    onClick={onOpenGpayGateway}
                    className="w-full py-4 bg-black hover:bg-zinc-900 text-white font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2.5 transition-all shadow-lg cursor-pointer border border-white/10"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19.123 11.23c0-.642-.057-1.258-.163-1.85h-9.56v3.5h5.45c-.234 1.258-.944 2.322-2.008 3.033v2.518h3.253c1.902-1.752 3.028-4.333 3.028-7.201z" fill="#4285F4"/>
                      <path d="M9.4 21.066c2.62 0 4.816-.87 6.422-2.361l-3.253-2.518c-.902.604-2.057.962-3.169.962-2.438 0-4.502-1.644-5.238-3.85H.824v2.602c1.614 3.201 4.935 5.165 8.576 5.165z" fill="#34A853"/>
                      <path d="M4.162 13.299c-.183-.549-.287-1.133-.287-1.733s.104-1.184.287-1.733V7.231H.824A10.372 10.372 0 000 11.566c0 1.545.342 3.021.942 4.335l3.22-2.602z" fill="#FBBC05"/>
                      <path d="M9.4 5.92c1.425 0 2.704.49 3.71 1.45l2.78-2.78C14.211 2.91 12.015 2.066 9.4 2.066 5.759 2.066 2.438 4.03 1.162 7.231L4.382 9.833c.736-2.206 2.8-3.913 5.018-3.913z" fill="#EA4335"/>
                    </svg>
                    Pay with Google Pay
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
