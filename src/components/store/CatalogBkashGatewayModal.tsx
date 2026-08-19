import React from 'react';
import { AnimatePresence } from 'framer-motion';

interface CatalogBkashGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalogSelectedPlan: '1_month' | '3_months' | '6_months' | '1_year';
  dbPricing: any;
  catalogBkashGatewayStep: number;
  setCatalogBkashGatewayStep: (step: number) => void;
  catalogBkashPhoneNumber: string;
  setCatalogBkashPhoneNumber: (num: string) => void;
  catalogBkashAgreedToTerms: boolean;
  setCatalogBkashAgreedToTerms: (agreed: boolean) => void;
  catalogBkashOtp: string;
  setCatalogBkashOtp: (otp: string) => void;
  catalogBkashOtpTimer: number;
  setCatalogBkashOtpTimer: (timer: number | ((prev: number) => number)) => void;
  catalogBkashPin: string;
  setCatalogBkashPin: (pin: string) => void;
  onSuccess: () => Promise<void>;
  triggerNotification: (title: string, message: string) => void;
}

export const CatalogBkashGatewayModal: React.FC<CatalogBkashGatewayModalProps> = ({
  isOpen,
  onClose,
  catalogSelectedPlan,
  dbPricing,
  catalogBkashGatewayStep,
  setCatalogBkashGatewayStep,
  catalogBkashPhoneNumber,
  setCatalogBkashPhoneNumber,
  catalogBkashAgreedToTerms,
  setCatalogBkashAgreedToTerms,
  catalogBkashOtp,
  setCatalogBkashOtp,
  catalogBkashOtpTimer,
  setCatalogBkashOtpTimer,
  catalogBkashPin,
  setCatalogBkashPin,
  onSuccess,
  triggerNotification
}) => {
  if (!isOpen) return null;

  const planPrice = dbPricing?.my_catalog?.bd?.[catalogSelectedPlan] ?? (
    catalogSelectedPlan === '1_month' ? 499 : 
    catalogSelectedPlan === '3_months' ? 1300 : 
    catalogSelectedPlan === '6_months' ? 2400 : 4500
  );

  return (
    <AnimatePresence>
      <>
        {/* Backdrop layer */}
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90] animate-fade-in" />

        {/* Gateway UI Content */}
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-2xl z-[100] overflow-hidden shadow-2xl animate-scale-up border border-gray-200 flex flex-col h-[520px] font-sans">
          
          {/* Header block with logo */}
          <div className="bg-[#e2136e] p-6 text-white text-center space-y-2 flex flex-col items-center shrink-0 select-none">
            <div className="font-black text-2xl tracking-widest select-none bg-white text-[#e2136e] px-4 py-1.5 rounded-xl shadow-md">
              bKash
            </div>
            <div className="space-y-0.5">
              <span className="text-xs font-semibold uppercase tracking-wider block opacity-90">Merchant Payment</span>
              <span className="text-sm font-black block tracking-wider">Dragon Automated Checkout</span>
            </div>
          </div>

          {/* Amount visual banner */}
          <div className="bg-gray-50 border-b border-gray-150 px-6 py-3.5 flex justify-between items-center shrink-0 select-none text-left">
            <div className="space-y-0.5">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Amount to Pay:</span>
              <span className="text-xs font-bold text-gray-700 block">My Catalog Subscription</span>
            </div>
            <span className="text-lg font-mono font-black text-gray-950">
              ৳{planPrice}
            </span>
          </div>

          {/* Dynamic steps wrapper */}
          <div className="flex-1 bg-white p-6 flex flex-col justify-between overflow-y-auto">
            {catalogBkashGatewayStep === 1 && (
              <div className="flex-1 flex flex-col justify-between">
                <div className="space-y-4 text-left">
                  <span className="text-xs font-semibold text-gray-600 block leading-relaxed">
                    Enter your bKash account number and agree to the terms and conditions:
                  </span>
                  
                  <div className="space-y-1.5">
                    <label className="text-[9.5px] font-black uppercase text-gray-400 tracking-wider block">bKash Account Number:</label>
                    <input
                      type="tel"
                      placeholder="e.g. 01XXXXXXXXX"
                      value={catalogBkashPhoneNumber}
                      onChange={(e) => setCatalogBkashPhoneNumber(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-250 text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#e2136e] font-mono tracking-wider"
                    />
                  </div>

                  <div className="flex items-start gap-2.5 pt-2">
                    <input
                      type="checkbox"
                      id="catalog-bkash-terms"
                      checked={catalogBkashAgreedToTerms}
                      onChange={(e) => setCatalogBkashAgreedToTerms(e.target.checked)}
                      className="mt-0.5 rounded text-[#e2136e] focus:ring-[#e2136e]"
                    />
                    <label htmlFor="catalog-bkash-terms" className="text-[11px] text-gray-500 font-medium leading-normal cursor-pointer select-none">
                      I agree to the terms and conditions of bKash Online Checkout.
                    </label>
                  </div>
                </div>

                <div className="flex gap-2.5 shrink-0 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 bg-gray-150 hover:bg-gray-250 text-gray-700 font-bold uppercase tracking-wider text-xs rounded-lg transition-all cursor-pointer"
                  >
                    CLOSE
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!catalogBkashPhoneNumber.trim() || catalogBkashPhoneNumber.length < 11) {
                        return triggerNotification('Mobile Number Required', 'Please enter a valid bKash mobile number.');
                      }
                      if (!catalogBkashAgreedToTerms) {
                        return triggerNotification('Terms Agreement Required', 'Please agree to bKash terms and conditions.');
                      }
                      setCatalogBkashGatewayStep(2);
                      setCatalogBkashOtpTimer(120);
                    }}
                    className="flex-1 py-3 bg-[#e2136e] hover:bg-[#b90a56] text-white font-bold uppercase tracking-wider text-xs rounded-lg transition-all cursor-pointer"
                  >
                    PROCEED
                  </button>
                </div>
              </div>
            )}

            {catalogBkashGatewayStep === 2 && (
              <div className="flex-1 flex flex-col justify-between">
                <div className="space-y-4 text-left">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-gray-600 block">bKash Verification Code (OTP):</span>
                    <p className="text-[10px] text-gray-400 font-bold leading-normal">
                      A 6-digit OTP has been sent to your number <span className="font-mono text-gray-800">{catalogBkashPhoneNumber}</span>.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9.5px] font-black uppercase text-gray-400 tracking-wider block">Enter OTP Code:</label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 123456"
                      value={catalogBkashOtp}
                      onChange={(e) => setCatalogBkashOtp(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-250 text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#e2136e] font-mono tracking-[0.4em] text-center font-bold"
                    />
                  </div>

                  <div className="text-center pt-2">
                    <span className="text-xs font-mono font-bold text-gray-500">
                      {catalogBkashOtpTimer > 0 ? `Resend OTP in ${catalogBkashOtpTimer}s` : (
                        <button
                          type="button"
                          onClick={() => {
                            setCatalogBkashOtpTimer(120);
                            triggerNotification('OTP Sent!', 'A new OTP code has been sent.');
                          }}
                          className="text-[#e2136e] hover:underline font-bold"
                        >
                          Resend Code
                        </button>
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2.5 shrink-0 pt-4">
                  <button
                    type="button"
                    onClick={() => setCatalogBkashGatewayStep(1)}
                    className="flex-1 py-3 bg-gray-150 hover:bg-gray-250 text-gray-700 font-bold uppercase tracking-wider text-xs rounded-lg transition-all cursor-pointer"
                  >
                    BACK
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (catalogBkashOtp.length < 4) {
                        return triggerNotification('OTP Required', 'Please enter a valid OTP code.');
                      }
                      setCatalogBkashGatewayStep(3);
                    }}
                    className="flex-1 py-3 bg-[#e2136e] hover:bg-[#b90a56] text-white font-bold uppercase tracking-wider text-xs rounded-lg transition-all cursor-pointer"
                  >
                    PROCEED
                  </button>
                </div>
              </div>
            )}

            {catalogBkashGatewayStep === 3 && (
              <div className="flex-1 flex flex-col justify-between">
                <div className="space-y-4 text-left">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-gray-600 block">bKash PIN (PIN):</span>
                    <p className="text-[10px] text-gray-400 font-bold leading-normal">
                      Enter your 5-digit bKash account PIN to secure payment. Your PIN will remain completely secure.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9.5px] font-black uppercase text-gray-400 tracking-wider block">Enter 5-digit PIN:</label>
                    <input
                      type="password"
                      maxLength={5}
                      placeholder="•••••"
                      value={catalogBkashPin}
                      onChange={(e) => setCatalogBkashPin(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-250 text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#e2136e] font-mono tracking-[0.6em] text-center font-bold"
                    />
                  </div>
                </div>

                <div className="flex gap-2.5 shrink-0 pt-4">
                  <button
                    type="button"
                    onClick={() => setCatalogBkashGatewayStep(2)}
                    className="flex-1 py-3 bg-gray-150 hover:bg-gray-250 text-gray-700 font-bold uppercase tracking-wider text-xs rounded-lg transition-all cursor-pointer"
                  >
                    BACK
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (catalogBkashPin.length < 5) {
                        return triggerNotification('PIN Required', 'Please enter your 5-digit bKash PIN.');
                      }
                      setCatalogBkashGatewayStep(4);
                      await onSuccess();
                    }}
                    className="flex-1 py-3 bg-[#e2136e] hover:bg-[#b90a56] text-white font-bold uppercase tracking-wider text-xs rounded-lg transition-all cursor-pointer"
                  >
                    CONFIRM
                  </button>
                </div>
              </div>
            )}

            {catalogBkashGatewayStep === 4 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-8">
                <div className="w-16 h-16 rounded-full border-4 border-[#e2136e] border-t-transparent animate-spin mx-auto" />
                <div className="space-y-1">
                  <h4 className="font-bold text-gray-900 text-sm">Processing bKash Payment...</h4>
                  <p className="text-xs text-gray-500">Please do not close or refresh this window.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    </AnimatePresence>
  );
};
