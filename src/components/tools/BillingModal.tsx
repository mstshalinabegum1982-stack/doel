import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, ArrowLeft } from 'lucide-react';

interface BillingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BillingModal({ isOpen, onClose }: BillingModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-dragon-black overflow-y-auto w-full h-full flex flex-col"
        >
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="w-full min-h-screen bg-dragon-black p-6 md:p-12 relative flex flex-col max-w-4xl mx-auto shadow-2xl"
          >
            <div className="absolute top-0 left-0 w-1.5 h-full bg-dragon-cyan" />
            
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8 border-b border-white/5 pb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={onClose}
                  className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-400 hover:text-dragon-cyan transition-colors cursor-pointer bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/5"
                >
                  <ArrowLeft size={16} className="text-dragon-cyan" /> Go Back
                </button>
                <div>
                  <h3 className="text-xl md:text-2xl font-display font-black text-white tracking-tight flex items-center gap-2">
                    <CreditCard className="text-dragon-cyan hidden md:block" /> SaaS Plan & Billing Panel
                  </h3>
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-0.5">
                    Activate SaaS plans and boost your business automation
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 self-end sm:self-auto text-gray-500 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Informative Dashboard */}
            <div className="flex-1 flex flex-col justify-center items-center py-8">
              <div className="max-w-md w-full bg-white/[0.02] border border-white/5 rounded-3xl p-6 md:p-8 space-y-6 text-center shadow-xl">
                <div className="w-16 h-16 bg-dragon-cyan/10 text-dragon-cyan rounded-full flex items-center justify-center mx-auto text-3xl">
                  ⚡
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg md:text-xl font-bold font-display text-white">Feature-by-Feature Activation</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    From now on, there is no need to purchase general packages globally in our system. You can directly activate individual plans for each feature at their respective sections:
                  </p>
                </div>

                <div className="text-left space-y-3 pt-4 border-t border-white/5">
                  <div className="flex items-start gap-3">
                    <span className="text-dragon-cyan mt-0.5">●</span>
                    <div>
                      <h5 className="text-xs font-bold text-zinc-100">Magic Box Automation (Social AI Bot)</h5>
                      <p className="text-[11px] text-zinc-400 mt-0.5">After setting up your API Key in Magic Box, you can directly activate a 48-hour free trial or a paid plan there.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <span className="text-dragon-cyan mt-0.5">●</span>
                    <div>
                      <h5 className="text-xs font-bold text-zinc-100">Public Pro Site & Landing Pages</h5>
                      <p className="text-[11px] text-zinc-400 mt-0.5">Once website or landing page creation is complete, you can pay and activate plans specifically for that page.</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="w-full py-3 bg-dragon-cyan text-dragon-black font-black uppercase text-xs tracking-widest rounded-xl hover:bg-white transition-all shadow-lg cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
