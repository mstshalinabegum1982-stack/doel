import React, { memo } from 'react';
import { motion } from 'motion/react';
import { Globe, Truck, Bot } from 'lucide-react';
import { COUNTRIES } from '../../utils/countriesData';

interface GlobalLogisticsTabProps {
  selectedCountry: string;
  fetchCouriers: (country: string) => void;
  courierLoading: boolean;
  couriers: any[];
  editingCourier: any;
  setEditingCourier: (courier: any) => void;
  courierCredentials: Record<string, string>;
  setCourierCredentials: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleSaveCourierConfig: () => void;
}

export const GlobalLogisticsTab = memo(function GlobalLogisticsTab({
  selectedCountry,
  fetchCouriers,
  courierLoading,
  couriers,
  editingCourier,
  setEditingCourier,
  courierCredentials,
  setCourierCredentials,
  handleSaveCourierConfig
}: GlobalLogisticsTabProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-20">
      <div className="glass-card p-6 bg-gradient-to-br from-dragon-cyan/5 to-transparent">
        <h3 className="text-sm font-black text-dragon-cyan uppercase tracking-widest flex items-center gap-2 mb-6">
          <Globe size={18} /> Global Logistics Intelligence
        </h3>
        
        <div className="space-y-4">
          <label className="text-[10px] font-black text-gray-500 uppercase">Select Your Business Country</label>
          <select 
            value={selectedCountry}
            onChange={(e) => fetchCouriers(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 outline-none focus:border-dragon-cyan text-sm text-white"
          >
            <option value="">Choose Country...</option>
            {COUNTRIES.map((cty) => (
              <option key={cty.name} value={cty.name} className="bg-zinc-900 text-white">
                {cty.name}
              </option>
            ))}
          </select>
        </div>

        {courierLoading && (
          <div className="py-12 text-center space-y-4">
            <div className="w-8 h-8 border-2 border-dragon-cyan border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[10px] uppercase font-black text-dragon-cyan animate-pulse">AI is identifying local couriers...</p>
          </div>
        )}

        {!courierLoading && couriers.length > 0 && !editingCourier && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 space-y-4">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Recommended for {selectedCountry}</p>
            {couriers.map((courier, idx) => (
              <div key={idx} className="p-5 bg-white/5 border border-white/10 rounded-2xl hover:border-dragon-cyan/40 transition-all group">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h4 className="font-bold text-white uppercase">{courier.name}</h4>
                    <a href={courier.website} target="_blank" rel="noreferrer" className="text-[10px] text-dragon-cyan/60 hover:underline">{courier.website}</a>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setEditingCourier(courier)}
                    className="px-4 py-2 bg-dragon-cyan/20 text-dragon-cyan rounded-lg text-[8px] font-black uppercase hover:bg-dragon-cyan hover:text-dragon-black transition-all cursor-pointer"
                  >
                    Configure API
                  </button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {courier.requiredFields.map((f: string) => (
                    <span key={f} className="px-2 py-1 bg-white/5 rounded text-[8px] text-gray-500 border border-white/5 uppercase">{f} Required</span>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {editingCourier && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="mt-8 space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-white uppercase flex items-center gap-2">
                <Truck size={16} className="text-dragon-cyan" /> Configure {editingCourier.name}
              </h4>
              <button 
                type="button"
                onClick={() => setEditingCourier(null)} 
                className="text-[10px] text-gray-500 hover:text-white uppercase cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-4 p-6 bg-white/5 rounded-2xl border border-dragon-cyan/20">
              {editingCourier.requiredFields.map((field: string) => (
                <div key={field} className="space-y-2">
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{field}</label>
                  <input 
                    type="password"
                    placeholder={`Enter your ${field}`}
                    value={courierCredentials[field] || ''}
                    onChange={(e) => setCourierCredentials(prev => ({ ...prev, [field]: e.target.value }))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-dragon-cyan outline-none focus:border-dragon-cyan transition-all"
                  />
                </div>
              ))}
              
              <button 
                type="button"
                onClick={handleSaveCourierConfig}
                className="w-full py-3 bg-dragon-cyan text-dragon-black font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-dragon-cyan/20 hover:scale-[1.02] active:scale-95 transition-all mt-4 cursor-pointer"
              >
                Save Configuration
              </button>
            </div>
          </motion.div>
        )}
      </div>

      <div className="glass-card p-6 border-white/5 bg-dragon-cyan/5">
        <div className="flex gap-4 items-start">
          <div className="p-3 bg-dragon-cyan/20 rounded-xl text-dragon-cyan">
            <Bot size={20} />
          </div>
          <div className="space-y-1 text-left">
            <h4 className="text-xs font-black text-white uppercase">How this works?</h4>
            <p className="text-[11px] text-gray-400 font-light leading-relaxed">
              DOELpro AI understands the technical documentation of major couriers globally. 
              When you click <b>'Ship Now'</b> in your order panel, 
              DOELpro translates your internal order data into the courier's specific API format.
              This eliminates manual data entry and reduces human error.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
