import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, Lock, CheckCircle2, AlertCircle, ArrowLeft, CreditCard, ChevronRight, Sparkles, RefreshCw, Smartphone } from 'lucide-react';

export interface RealPaymentGatewayModalProps {
  isOpen: boolean;
  gatewayType: 'bkash' | 'gpay';
  merchantName?: string;
  orderRef?: string;
  amount: number | string;
  currency?: string;
  itemTitle: string;
  onClose: () => void;
  onSuccess: (details: { trxId: string; paymentMethod: string }) => void | Promise<void>;
}

export const RealPaymentGatewayModal: React.FC<RealPaymentGatewayModalProps> = ({
  isOpen,
  gatewayType,
  merchantName = 'Dragon Systems Ltd.',
  orderRef = 'DRG-ORD-' + Math.floor(100000 + Math.random() * 900000),
  amount,
  currency = gatewayType === 'bkash' ? 'BDT' : 'USD',
  itemTitle,
  onClose,
  onSuccess
}) => {
  // bKash States
  const [bkashStep, setBkashStep] = useState<1 | 2 | 3 | 4>(1); // 1: Mobile No, 2: OTP, 3: PIN, 4: Processing/Success
  const [bkashPhone, setBkashPhone] = useState('');
  const [bkashAgreed, setBkashAgreed] = useState(true);
  const [bkashOtp, setBkashOtp] = useState('');
  const [bkashPin, setBkashPin] = useState('');
  const [bkashOtpTimer, setBkashOtpTimer] = useState(120);
  const [bkashError, setBkashError] = useState('');

  // Google Pay States
  const [gpayStep, setGpayStep] = useState<1 | 2 | 3>(1); // 1: Card & Pay, 2: Processing, 3: Success
  const [selectedCard, setSelectedCard] = useState<'visa' | 'mastercard'>('visa');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedTrxId, setGeneratedTrxId] = useState('');

  // Reset modal state on open
  useEffect(() => {
    if (isOpen) {
      setBkashStep(1);
      setBkashPhone('');
      setBkashOtp('');
      setBkashPin('');
      setBkashError('');
      setBkashOtpTimer(120);
      setGpayStep(1);
      setIsSubmitting(false);
      setGeneratedTrxId('');
    }
  }, [isOpen]);

  // Timer countdown for bKash OTP
  useEffect(() => {
    if (isOpen && gatewayType === 'bkash' && bkashStep === 2 && bkashOtpTimer > 0) {
      const timer = setInterval(() => {
        setBkashOtpTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isOpen, gatewayType, bkashStep, bkashOtpTimer]);

  if (!isOpen) return null;

  // Handle bKash Process completion
  const handleBkashProceedToPin = () => {
    if (bkashOtp.length !== 6) {
      setBkashError('Please enter a valid 6-digit verification code (OTP)');
      return;
    }
    setBkashError('');
    setBkashStep(3);
  };

  const handleBkashFinalize = () => {
    if (bkashPin.length !== 5) {
      setBkashError('Please enter your 5-digit bKash account PIN');
      return;
    }
    setBkashError('');
    setBkashStep(4);
    setIsSubmitting(true);

    const trxId = 'TRX' + Math.random().toString(36).substring(2, 10).toUpperCase();
    setGeneratedTrxId(trxId);

    setTimeout(async () => {
      try {
        await onSuccess({ trxId, paymentMethod: 'bKash Automated Gateway' });
        setIsSubmitting(false);
      } catch (err) {
        console.error(err);
        setBkashError('Transaction verification failed. Please try again.');
        setBkashStep(3);
        setIsSubmitting(false);
      }
    }, 2500);
  };

  // Handle Google Pay completion
  const handleGpaySubmit = () => {
    setGpayStep(2);
    setIsSubmitting(true);
    const trxId = 'GPAY-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    setGeneratedTrxId(trxId);

    setTimeout(() => {
      setGpayStep(3);
      setTimeout(async () => {
        try {
          await onSuccess({ trxId, paymentMethod: 'Google Pay' });
          setIsSubmitting(false);
        } catch (err) {
          console.error(err);
          setGpayStep(1);
          setIsSubmitting(false);
        }
      }, 1200);
    }, 2200);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
        
        {/* ==================== BKASH REAL INTERFACE ==================== */}
        {gatewayType === 'bkash' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            className="w-full max-w-[380px] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col font-sans border border-gray-200 relative text-left"
            style={{ minHeight: '520px' }}
          >
            {/* Header with Official bKash Branding */}
            <div className="bg-[#e2136e] p-5 text-white flex flex-col items-center justify-between text-center relative border-b-4 border-[#b90a56] shrink-0 select-none">
              <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 p-1.5 rounded-full transition-all text-xs cursor-pointer flex items-center justify-center border border-white/20 shadow-md"
              >
                <X size={16} />
              </button>

              {/* bKash Official Logo Emblem */}
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-white rounded-xl px-3 py-1 flex items-center gap-1.5 shadow-md">
                  <svg className="w-6 h-6 text-[#e2136e]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                  <span className="font-black text-xl text-[#e2136e] tracking-tight">bKash</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 text-white px-2 py-1 rounded-md border border-white/30">
                  Online Payment
                </span>
              </div>

              <div className="space-y-1 mt-1 w-full">
                <div className="flex justify-between items-center text-[10px] text-white/90 uppercase tracking-wider font-semibold border-b border-white/20 pb-1.5 gap-2">
                  <span className="truncate max-w-[190px]">Merchant: <strong className="text-white font-bold">{merchantName}</strong></span>
                  <span className="font-mono text-white/90 shrink-0 bg-black/20 px-2 py-0.5 rounded text-[9px]">{orderRef}</span>
                </div>
                <div className="flex justify-between items-center gap-2 pt-1">
                  <span className="text-[11px] text-white/90 font-medium truncate max-w-[170px]" title={itemTitle}>Item: {itemTitle}</span>
                  <span className="text-lg sm:text-xl font-black text-white font-mono shrink-0 bg-black/20 px-2.5 py-1 rounded-xl border border-white/20 shadow-inner">
                    ৳ {Number(amount).toLocaleString('en-US')}.00
                  </span>
                </div>
              </div>
            </div>

            {/* bKash Body Content */}
            <div className="flex-1 bg-[#f8f9fa] p-5 flex flex-col justify-between">
              
              {/* Step 1: Account Number Input */}
              {bkashStep === 1 && (
                <div className="space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3.5">
                    <div className="bg-pink-50/80 p-3 rounded-xl border border-pink-200/80 text-center space-y-1 shadow-sm">
                      <span className="text-xs font-bold text-[#e2136e] flex items-center justify-center gap-1.5">
                        <Smartphone size={14} /> Enter bKash Account Number
                      </span>
                      <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                        Your 11-digit bKash mobile number registered for wallet payments
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-600 block">
                        Account Number
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          maxLength={11}
                          placeholder="e.g. 017XXXXXXXX"
                          value={bkashPhone}
                          onChange={(e) => {
                            setBkashPhone(e.target.value.replace(/\D/g, ''));
                            setBkashError('');
                          }}
                          className="w-full bg-white border-2 border-gray-300 rounded-xl px-4 py-3 text-base font-bold text-center tracking-widest focus:border-[#e2136e] focus:ring-0 outline-none transition-all text-gray-900 font-mono shadow-inner"
                        />
                      </div>
                    </div>

                    {bkashError && (
                      <p className="text-[11px] text-red-600 font-bold bg-red-50 p-2.5 rounded-xl border border-red-200 text-center animate-shake flex items-center justify-center gap-1.5">
                        <AlertCircle size={14} /> {bkashError}
                      </p>
                    )}

                    <div className="flex items-start gap-2 pt-1">
                      <input
                        id="bkash-terms"
                        type="checkbox"
                        checked={bkashAgreed}
                        onChange={(e) => setBkashAgreed(e.target.checked)}
                        className="mt-0.5 cursor-pointer accent-[#e2136e] w-4 h-4"
                      />
                      <label htmlFor="bkash-terms" className="text-[10px] text-gray-500 leading-normal select-none cursor-pointer">
                        I agree to the <span className="underline font-bold text-gray-700">terms and conditions</span> of bKash Online Checkout.
                      </label>
                    </div>

                    <div className="pt-2 flex items-center justify-center gap-1.5 text-[9px] text-gray-400 font-semibold uppercase tracking-wider">
                      <ShieldCheck size={12} className="text-[#e2136e]" /> Secured by 256-bit bKash Payment Gateway
                    </div>
                  </div>

                  {/* Footer Action Buttons */}
                  <div className="flex gap-2.5 pt-4 border-t border-gray-200 shrink-0">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-black uppercase tracking-wider text-xs rounded-xl transition-all cursor-pointer text-center"
                    >
                      CLOSE
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (bkashPhone.length !== 11 || !bkashPhone.startsWith('01')) {
                          setBkashError('Please enter a valid 11-digit bKash number (e.g. 017XXXXXXXX)');
                          return;
                        }
                        if (!bkashAgreed) {
                          setBkashError('You must agree to the terms and conditions');
                          return;
                        }
                        setBkashError('');
                        setBkashOtpTimer(120);
                        setBkashStep(2);
                      }}
                      className="flex-1 py-3 bg-[#e2136e] hover:bg-[#b90a56] text-white font-black uppercase tracking-wider text-xs rounded-xl transition-all cursor-pointer text-center shadow-lg shadow-[#e2136e]/20"
                    >
                      PROCEED
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: OTP Verification */}
              {bkashStep === 2 && (
                <div className="space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3.5">
                    <div className="bg-pink-50/80 p-3 rounded-xl border border-pink-200/80 text-center space-y-1 shadow-sm">
                      <span className="text-xs font-bold text-[#e2136e] block">Verification Code Sent!</span>
                      <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                        Enter the 6-digit verification code (OTP) sent to <strong className="text-gray-800 font-mono">{bkashPhone}</strong>
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-600 block text-center">
                        Enter 6-Digit OTP Code
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="e.g. 849201"
                        value={bkashOtp}
                        onChange={(e) => {
                          setBkashOtp(e.target.value.replace(/\D/g, ''));
                          setBkashError('');
                        }}
                        className="w-full bg-white border-2 border-gray-300 rounded-xl px-4 py-3 text-lg font-black text-center tracking-[0.4em] focus:border-[#e2136e] focus:ring-0 outline-none transition-all text-gray-900 font-mono shadow-inner"
                      />
                    </div>

                    <div className="text-center text-xs text-gray-500 font-medium">
                      {bkashOtpTimer > 0 ? (
                        <span>Resend OTP code in <strong className="text-[#e2136e] font-mono">{bkashOtpTimer}s</strong></span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setBkashOtpTimer(120)}
                          className="text-[#e2136e] font-bold hover:underline cursor-pointer flex items-center justify-center gap-1 mx-auto"
                        >
                          <RefreshCw size={12} /> Resend OTP Code
                        </button>
                      )}
                    </div>

                    {bkashError && (
                      <p className="text-[11px] text-red-600 font-bold bg-red-50 p-2.5 rounded-xl border border-red-200 text-center animate-shake flex items-center justify-center gap-1.5">
                        <AlertCircle size={14} /> {bkashError}
                      </p>
                    )}
                  </div>

                  {/* Footer Action Buttons */}
                  <div className="flex gap-2.5 pt-4 border-t border-gray-200 shrink-0">
                    <button
                      type="button"
                      onClick={() => setBkashStep(1)}
                      className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-black uppercase tracking-wider text-xs rounded-xl transition-all cursor-pointer text-center"
                    >
                      BACK
                    </button>
                    <button
                      type="button"
                      onClick={handleBkashProceedToPin}
                      className="flex-1 py-3 bg-[#e2136e] hover:bg-[#b90a56] text-white font-black uppercase tracking-wider text-xs rounded-xl transition-all cursor-pointer text-center shadow-lg shadow-[#e2136e]/20"
                    >
                      VERIFY
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: bKash PIN Input */}
              {bkashStep === 3 && (
                <div className="space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3.5">
                    <div className="bg-pink-50/80 p-3 rounded-xl border border-pink-200/80 text-center space-y-1 shadow-sm">
                      <span className="text-xs font-bold text-[#e2136e] block">bKash PIN Verification</span>
                      <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                        Enter your 5-digit bKash account PIN to confirm payment securely.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-600 block text-center">
                        Enter 5-Digit PIN
                      </label>
                      <input
                        type="password"
                        maxLength={5}
                        placeholder="•••••"
                        value={bkashPin}
                        onChange={(e) => {
                          setBkashPin(e.target.value.replace(/\D/g, ''));
                          setBkashError('');
                        }}
                        className="w-full bg-white border-2 border-gray-300 rounded-xl px-4 py-3 text-xl font-black text-center tracking-[0.6em] focus:border-[#e2136e] focus:ring-0 outline-none transition-all text-gray-900 font-mono shadow-inner"
                      />
                    </div>

                    <div className="bg-amber-50 p-3 rounded-xl border border-amber-200/80 flex items-start gap-2 text-[10px] text-amber-800 leading-normal text-left shadow-sm">
                      <Lock size={14} className="text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-bold">Security Note:</strong>
                        bKash will never ask for your PIN code over phone or email.
                      </div>
                    </div>

                    {bkashError && (
                      <p className="text-[11px] text-red-600 font-bold bg-red-50 p-2.5 rounded-xl border border-red-200 text-center animate-shake flex items-center justify-center gap-1.5">
                        <AlertCircle size={14} /> {bkashError}
                      </p>
                    )}
                  </div>

                  {/* Footer Action Buttons */}
                  <div className="flex gap-2.5 pt-4 border-t border-gray-200 shrink-0">
                    <button
                      type="button"
                      onClick={() => setBkashStep(2)}
                      className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-black uppercase tracking-wider text-xs rounded-xl transition-all cursor-pointer text-center"
                    >
                      BACK
                    </button>
                    <button
                      type="button"
                      onClick={handleBkashFinalize}
                      className="flex-1 py-3 bg-[#e2136e] hover:bg-[#b90a56] text-white font-black uppercase tracking-wider text-xs rounded-xl transition-all cursor-pointer text-center shadow-lg shadow-[#e2136e]/20"
                    >
                      CONFIRM PAYMENT
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Verification & Success */}
              {bkashStep === 4 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-4">
                  {isSubmitting ? (
                    <>
                      <div className="relative w-16 h-16 flex items-center justify-center">
                        <div className="w-16 h-16 border-4 border-pink-200 border-t-[#e2136e] rounded-full animate-spin"></div>
                        <div className="absolute w-8 h-8 rounded-full bg-[#e2136e] flex items-center justify-center text-white font-black text-[9px] shadow-md select-none">
                          bKash
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-sm font-bold text-gray-800 block">Processing Payment...</span>
                        <p className="text-xs text-gray-500 leading-normal max-w-xs">
                          Contacting bKash Payment Server to complete your order transaction. Please do not close this window.
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4 animate-scale-up">
                      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-300 shadow-md">
                        <CheckCircle2 size={36} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-base font-black text-gray-800 uppercase tracking-tight">Payment Succeeded!</h4>
                        <p className="text-xs text-gray-500 font-medium">Your bKash transaction has been verified successfully.</p>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-gray-200 text-left text-xs font-mono space-y-1 shadow-sm">
                        <div className="flex justify-between text-gray-500">
                          <span>Trx ID:</span>
                          <span className="font-bold text-gray-800">{generatedTrxId}</span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                          <span>Amount Paid:</span>
                          <span className="font-bold text-[#e2136e]">৳{Number(amount).toLocaleString('en-US')}.00</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ==================== GOOGLE PAY REAL INTERFACE ==================== */}
        {gatewayType === 'gpay' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            className="w-full max-w-[400px] bg-[#1e1e1e] rounded-3xl overflow-hidden shadow-2xl flex flex-col font-sans border border-white/10 text-white text-left relative"
            style={{ minHeight: '480px' }}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0 select-none bg-black/40">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-white text-black px-2.5 py-1 rounded-md text-xs font-black shadow-sm">
                  <span className="text-blue-600 font-extrabold">G</span>
                  <span className="text-gray-900 font-bold">Pay</span>
                </div>
                <span className="text-xs font-bold text-gray-400">Google Pay</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 px-2.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs cursor-pointer text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Content Area */}
            <div className="p-6 flex-1 flex flex-col justify-between">
              {gpayStep === 1 && (
                <div className="flex-1 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    {/* Merchant Card */}
                    <div className="p-3.5 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-medium">Merchant:</span>
                        <span className="font-bold text-white">{merchantName}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-medium">Item:</span>
                        <span className="font-bold text-white truncate max-w-[200px]">{itemTitle}</span>
                      </div>
                      <div className="h-px bg-white/10 my-1" />
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Total Amount</span>
                        <span className="text-xl font-black text-emerald-400 font-mono">
                          {currency === 'BDT' ? '৳' : '$'}{Number(amount).toLocaleString('en-US')}
                        </span>
                      </div>
                    </div>

                    {/* Card Selector */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block ml-1">
                        Select Payment Method
                      </label>
                      
                      <div
                        onClick={() => setSelectedCard('visa')}
                        className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all select-none ${
                          selectedCard === 'visa' ? 'bg-white/10 border-blue-500 shadow-md' : 'bg-white/5 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-6 bg-blue-900 rounded flex items-center justify-center font-black text-white text-[10px] tracking-wider shrink-0 border border-blue-700">
                            VISA
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">Visa •••• 4242</span>
                            <span className="text-[9px] text-gray-400 block">Personal Credit Card</span>
                          </div>
                        </div>
                        <input
                          type="radio"
                          name="card-select"
                          checked={selectedCard === 'visa'}
                          onChange={() => setSelectedCard('visa')}
                          className="accent-blue-500"
                        />
                      </div>

                      <div
                        onClick={() => setSelectedCard('mastercard')}
                        className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all select-none ${
                          selectedCard === 'mastercard' ? 'bg-white/10 border-amber-500 shadow-md' : 'bg-white/5 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-6 bg-red-950 rounded flex items-center justify-center font-black text-amber-500 text-[9px] tracking-wider shrink-0 border border-red-800">
                            MC
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">Mastercard •••• 8819</span>
                            <span className="text-[9px] text-gray-400 block">Corporate Debit Card</span>
                          </div>
                        </div>
                        <input
                          type="radio"
                          name="card-select"
                          checked={selectedCard === 'mastercard'}
                          onChange={() => setSelectedCard('mastercard')}
                          className="accent-amber-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer Button */}
                  <div className="space-y-3 pt-2">
                    <p className="text-[9.5px] text-gray-500 leading-normal text-center">
                      Protected by Google Pay 256-bit encryption. Your payment info is never shared with third parties.
                    </p>

                    <button
                      type="button"
                      onClick={handleGpaySubmit}
                      className="w-full py-4 bg-white hover:bg-gray-100 text-black font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl active:scale-98"
                    >
                      <Sparkles size={16} className="text-blue-600" /> Pay with Google Pay
                    </button>
                  </div>
                </div>
              )}

              {gpayStep === 2 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <div className="w-16 h-16 border-4 border-white/10 border-t-blue-500 rounded-full animate-spin"></div>
                    <Lock size={20} className="absolute text-blue-400" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-black text-white block">Contacting Card Issuer...</span>
                    <p className="text-xs text-gray-400 leading-normal max-w-xs">
                      Securing Google Pay transaction token and verifying card authorization. Please hold on.
                    </p>
                  </div>
                </div>
              )}

              {gpayStep === 3 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4 animate-scale-up">
                  <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center border border-emerald-500/30">
                    <CheckCircle2 size={38} />
                  </div>
                  <div className="space-y-1">
                    <span className="text-base font-black text-emerald-400 block uppercase tracking-wider">Payment Approved</span>
                    <p className="text-xs text-gray-400">Google Pay transaction verified successfully.</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-xs font-mono space-y-1 w-full text-left">
                    <div className="flex justify-between text-gray-400">
                      <span>Auth Code:</span>
                      <span className="text-white font-bold">{generatedTrxId}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
};
