import React, { memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Truck, X, Check, AlertCircle } from 'lucide-react';
import { getOfflineCouriers } from '../../utils/countriesData';

interface BulkCourierBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOrderIds: string[];
  bulkBookingResults: any[] | null;
  bulkBookingCourier: string | null;
  setBulkBookingCourier: (courier: string | null) => void;
  isBulkBookingInProgress: boolean;
  handleBulkCourierBooking: () => void;
  configuredCouriers: any[];
  selectedCountry: string;
  onReset: () => void;
}

export const BulkCourierBookingModal = memo(function BulkCourierBookingModal({
  isOpen,
  onClose,
  selectedOrderIds,
  bulkBookingResults,
  bulkBookingCourier,
  setBulkBookingCourier,
  isBulkBookingInProgress,
  handleBulkCourierBooking,
  configuredCouriers,
  selectedCountry,
  onReset
}: BulkCourierBookingModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-2xl bg-dragon-black border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
        >
          <button 
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 text-gray-500 hover:text-white transition-all cursor-pointer z-10"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
              <Truck size={20} />
            </div>
            <div className="text-left font-sans">
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Courier Bulk Booking</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                {selectedOrderIds.length} orders automatic API booking
              </p>
            </div>
          </div>

          {bulkBookingResults ? (
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1 font-sans">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-left">
                <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider mb-1">Booking Completed!</h4>
                <p className="text-[10px] text-gray-400 leading-relaxed font-medium">
                  All orders have been automatically booked in the selected courier's system and tracking IDs linked.
                </p>
              </div>

              <div className="space-y-3">
                {bulkBookingResults.map((res: any, idx: number) => (
                  <div key={`res-${res.orderId}-${idx}`} className="p-3.5 bg-white/5 border border-white/10 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-left">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold font-mono text-gray-500 uppercase">ID: {res.orderId.substring(0, 8)}</span>
                        <span className="text-xs font-bold text-white">{res.customerName}</span>
                      </div>
                      {res.success ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold">
                            <Check size={12} /> Tracking ID: <span className="font-mono text-white bg-emerald-500/20 px-1.5 py-0.5 rounded">{res.trackingId}</span>
                          </div>
                          <div className="text-[9px] text-gray-500 truncate font-mono">
                            API Endpoint: {res.apiEndpoint}
                          </div>
                          <div className="text-[10px] text-dragon-cyan font-semibold">
                            Rules: {res.courierRules}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-rose-400 font-medium flex items-center gap-1">
                          <AlertCircle size={12} /> Failed: {res.error}
                        </span>
                      )}
                    </div>
                    
                    {res.success && (
                      <div className="shrink-0 flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl">
                          Success
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={onReset}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  Close & Reset
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-5 pr-1 text-left font-sans">
                {/* Active/Configured Couriers */}
                <div>
                  <h4 className="text-[10px] font-black text-dragon-cyan uppercase tracking-widest mb-3">Your Configured Courier Companies (Configured Couriers)</h4>
                  {configuredCouriers.length === 0 ? (
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center">
                      <p className="text-[11px] text-gray-500 font-medium">No courier companies configured. You can configure courier APIs in the "Global Logistics" tab.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {configuredCouriers.map((cc, idx) => (
                        <button
                          key={`cc-${cc.id}-${idx}`}
                          type="button"
                          onClick={() => setBulkBookingCourier(cc.courierName)}
                          className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between group cursor-pointer ${
                            bulkBookingCourier === cc.courierName 
                              ? 'bg-sky-500/25 border-sky-500 text-white shadow-lg shadow-sky-500/10' 
                              : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/20 hover:bg-white/10'
                          }`}
                        >
                          <div className="space-y-1">
                            <h5 className="text-xs font-black uppercase tracking-wide">{cc.courierName}</h5>
                            <p className="text-[9px] text-gray-500 uppercase tracking-wider font-mono">API Key Active (Active Setup)</p>
                          </div>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            bulkBookingCourier === cc.courierName ? 'border-sky-400 bg-sky-500' : 'border-gray-600'
                          }`}>
                            {bulkBookingCourier === cc.courierName && <Check size={10} className="text-white" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recommendations for country */}
                <div>
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Available Courier Companies ({selectedCountry || 'Bangladesh'} Courier List)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {getOfflineCouriers(selectedCountry || 'Bangladesh').map((rc: any, idx: number) => (
                      <button
                        key={`rc-${rc.name}-${idx}`}
                        type="button"
                        onClick={() => setBulkBookingCourier(rc.name)}
                        className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between group cursor-pointer ${
                          bulkBookingCourier === rc.name 
                            ? 'bg-sky-500/25 border-sky-500 text-white shadow-lg shadow-sky-500/10' 
                            : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/20 hover:bg-white/10'
                        }`}
                      >
                        <div className="space-y-1">
                          <h5 className="text-xs font-black uppercase tracking-wide">{rc.name}</h5>
                          <p className="text-[9px] text-gray-500 font-semibold">{rc.hotline || '70 Countries Standard'}</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          bulkBookingCourier === rc.name ? 'border-sky-400 bg-sky-500' : 'border-gray-600'
                        }`}>
                          {bulkBookingCourier === rc.name && <Check size={10} className="text-white" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  No, Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkCourierBooking}
                  disabled={!bulkBookingCourier || isBulkBookingInProgress}
                  className={`flex-1 py-3 text-[11px] font-black uppercase tracking-wider transition-all rounded-2xl flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                    !bulkBookingCourier || isBulkBookingInProgress
                      ? 'bg-gray-700 text-gray-500 border border-gray-600/30 cursor-not-allowed shadow-none'
                      : 'bg-sky-500 text-white hover:brightness-110 shadow-sky-500/10'
                  }`}
                >
                  {isBulkBookingInProgress ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Booking...
                    </>
                  ) : (
                    <>
                      <Truck size={14} /> Confirm Automatic Booking
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
});
