import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Sparkles, MapPin, Phone, CheckCircle, Send, Link as LinkIcon, X } from 'lucide-react';
import { InventoryItem } from '../../types';
import { AuthContext } from '../../authContext';
import { getCurrencySymbol } from '../../utils/countriesData';

interface SmartOrderPreviewModalProps {
  item: InventoryItem;
  user: any;
  onClose: () => void;
}

export function SmartOrderPreviewModal({ item, user, onClose }: SmartOrderPreviewModalProps) {
  const [simStep, setSimStep] = useState<1 | 2 | 3 | 4>(1);
  const [mockName, setMockName] = useState('Sajjad Hossain');
  const [mockPhone, setMockPhone] = useState('017XXXXXXXX');
  const [mockAddress, setMockAddress] = useState('12/A Dhanmondi Lake Road, Dhaka, Bangladesh');
  const { profile } = useContext(AuthContext);
  const currencySymbol = profile?.country ? getCurrencySymbol(profile.country) : "৳";

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-6xl bg-zinc-950 border border-white/10 shadow-[0_0_50px_rgba(45,212,191,0.08)] rounded-[32px] overflow-hidden flex flex-col lg:flex-row min-h-[500px]"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white bg-white/5 border border-white/10 hover:bg-white/10 p-2.5 rounded-full z-50 transition-all cursor-pointer shadow-lg active:scale-95"
          title="Close"
        >
          <X size={16} />
        </button>

        {/* LEFT COLUMN: SIMULATOR VIEW (Phone Mockup) */}
        <div className="flex-1 bg-gradient-to-br from-zinc-900/50 via-[#0b0c10] to-[#0f1118] p-6 lg:p-10 border-r border-white/5 flex flex-col items-center justify-center">
          <div className="text-center mb-5">
            <span className="px-3 py-1 bg-dragon-cyan/10 border border-dragon-cyan/20 rounded-full text-dragon-cyan text-[9px] font-black uppercase tracking-widest inline-block mb-1.5">
              interactive smartphone simulator
            </span>
            <h3 className="text-base font-display font-black text-white">Smart Location Order Page Preview</h3>
            <p className="text-[10px] text-gray-500 font-medium">How the page will load and function on the customer's screen when they visit the copied link.</p>
          </div>

          <div className="relative w-full max-w-[325px] h-[550px] bg-zinc-950 border-[6px] border-zinc-800 rounded-[38px] shadow-2xl flex flex-col overflow-hidden ring-4 ring-white/5 select-none font-sans">
            <div className="absolute top-0 inset-x-0 h-4 bg-zinc-800 flex items-center justify-center z-40">
              <div className="w-16 h-3.5 bg-zinc-950 rounded-b-xl flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-800 mr-2" />
                <span className="w-1 h-1 rounded-full bg-zinc-800" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3.5 pt-6 pb-20 bg-zinc-950 text-xs text-white relative">
              <div className="flex flex-col items-center border-b border-white/5 pb-2.5 mb-3.5 text-center">
                {user?.profileImage ? (
                  <img src={user.profileImage} className="w-9 h-9 rounded-xl object-cover mb-1.5 border border-white/10" referrerPolicy="no-referrer" alt="" />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-[10px] font-black text-dragon-cyan mb-1.5">
                    {user?.name?.[0]?.toUpperCase() || 'V'}
                  </div>
                )}
                <h4 className="text-[9px] font-black text-dragon-cyan uppercase tracking-widest">{user?.name || 'Vandor Store'}'s Showcase</h4>
              </div>

              <div className="grid grid-cols-4 gap-1.5 p-1 bg-black/40 border border-white/5 rounded-xl mb-4 text-center">
                {[1, 2, 3, 4].map(s => {
                  let labelBengali = 'Product';
                  if (s === 2) labelBengali = 'Location';
                  if (s === 3) labelBengali = 'Form';
                  if (s === 4) labelBengali = 'Success';

                  const isActive = simStep === s;
                  const isDone = s < simStep;

                  return (
                    <button
                      key={s}
                      onClick={() => setSimStep(s as any)}
                      className={`py-1 rounded-lg text-[7px] font-black uppercase transition-all flex flex-col items-center justify-center leading-none gap-0.5 ${
                        isActive 
                          ? "bg-dragon-cyan text-dragon-black font-extrabold shadow-md shadow-dragon-cyan/10" 
                          : isDone 
                            ? "bg-dragon-cyan/10 text-dragon-cyan" 
                            : "text-zinc-600 hover:text-zinc-400"
                      }`}
                    >
                      <span>0{s}</span>
                      <span>{labelBengali}</span>
                    </button>
                  );
                })}
              </div>

              <AnimatePresence mode="wait">
                {simStep === 1 && (
                  <motion.div
                    key="simStep1"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-4"
                  >
                    <div className="bg-white/5 border border-white/5 p-1 rounded-2xl overflow-hidden aspect-video relative flex items-center justify-center">
                      {item.image ? (
                        <img src={item.image} className="w-full h-full object-cover rounded-xl" alt="" />
                      ) : (
                        <Package className="w-12 h-12 text-zinc-700" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className="text-[7.5px] font-black uppercase tracking-widest bg-rose-500/10 border border-rose-500/20 text-rose-500 px-2 py-0.5 rounded">Hot Running Offer</span>
                      <h4 className="text-sm font-black text-zinc-100 uppercase tracking-tight">{item.name}</h4>
                      <p className="text-[9.5px] text-zinc-400 leading-relaxed italic truncate-3-lines">{item.details || 'No detailed description added to this product.'}</p>
                    </div>

                    <div className="p-3 bg-zinc-900/60 border border-white/5 rounded-2xl flex items-center justify-between text-left">
                      <div>
                        <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider">Special Promo Price</p>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-base font-black text-dragon-cyan">{currencySymbol}{item.sellPrice}</span>
                          <span className="text-[10px] text-zinc-500 font-bold line-through">{currencySymbol}{(item.sellPrice * 1.25).toFixed(0)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[7.5px] font-black text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded uppercase">20% Discount</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => setSimStep(2)}
                      className="w-full py-3 bg-dragon-cyan hover:opacity-90 text-dragon-black font-extrabold text-[9px] uppercase tracking-widest rounded-xl transition-all shadow-md shadow-dragon-cyan/10 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      Proceed to Order Now <Sparkles size={11} className="animate-pulse" />
                    </button>
                  </motion.div>
                )}

                {simStep === 2 && (
                  <motion.div
                    key="simStep2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-4 text-center py-4"
                  >
                    <div className="relative w-20 h-20 mx-auto flex items-center justify-center mb-2">
                      <span className="absolute inset-0 rounded-full bg-dragon-cyan/10 border border-dragon-cyan/20 animate-ping" />
                      <span className="absolute inset-4 rounded-full bg-dragon-cyan/20 border border-dragon-cyan/30 animate-pulse" />
                      <div className="w-12 h-12 rounded-full bg-dragon-cyan/15 border border-dragon-cyan/40 flex items-center justify-center text-dragon-cyan shadow-xl shadow-dragon-cyan/10">
                        <MapPin size={22} className="animate-bounce" />
                      </div>
                    </div>

                    <div className="space-y-1 px-1">
                      <h4 className="text-xs font-black text-zinc-100 uppercase tracking-wide">1-Click Perfect Delivery Location</h4>
                      <p className="text-[9.5px] text-zinc-400 leading-relaxed">
                        Please allow location permission to auto-detect your exact map coordinates.
                      </p>
                    </div>

                    <button 
                      onClick={() => setSimStep(3)}
                      className="w-full py-3 bg-dragon-cyan hover:opacity-90 text-dragon-black font-extrabold text-[9.5px] uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <MapPin size={11} /> Give GPS Location Permission
                    </button>
                  </motion.div>
                )}

                {simStep === 3 && (
                  <motion.div
                    key="simStep3"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-3.5"
                  >
                    <div>
                      <h4 className="text-[10px] font-black text-center text-zinc-300 uppercase tracking-wider mb-2.5">Delivery & Customer Information</h4>
                      
                      <div className="space-y-2">
                        <div className="space-y-1 text-left">
                          <label className="text-[8px] font-bold text-zinc-500 uppercase">Customer Name</label>
                          <input 
                            disabled 
                            value={mockName} 
                            onChange={e => setMockName(e.target.value)}
                            className="w-full text-[9px] bg-white/5 border border-white/5 rounded-lg py-1 px-2.5 text-zinc-300 outline-none cursor-default" 
                          />
                        </div>

                        <div className="space-y-1 text-left">
                          <label className="text-[8px] font-bold text-zinc-500 uppercase">Phone Number</label>
                          <input 
                            disabled 
                            value={mockPhone} 
                            onChange={e => setMockPhone(e.target.value)}
                            className="w-full text-[9px] bg-white/5 border border-white/5 rounded-lg py-1 px-2.5 text-zinc-300 outline-none cursor-default" 
                          />
                        </div>

                        <div className="space-y-1 text-left">
                          <div className="flex justify-between items-center">
                            <label className="text-[8px] font-bold text-zinc-500 uppercase">Delivery Address (GPS Auto-filled)</label>
                            <span className="text-[7px] text-dragon-cyan font-black flex items-center gap-0.5 animate-pulse">
                              <span className="w-1 h-1 bg-dragon-cyan rounded-full" /> Verified
                            </span>
                          </div>
                          <textarea 
                            disabled 
                            value={mockAddress} 
                            onChange={e => setMockAddress(e.target.value)}
                            className="w-full text-[9px] bg-white/5 border border-white/5 rounded-lg py-1 px-2.5 text-zinc-300 outline-none h-12 shrink-0 cursor-default" 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="h-20 bg-zinc-900 border border-white/5 rounded-xl relative overflow-hidden flex items-center justify-center bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
                      <div className="absolute inset-0 bg-gradient-to-br from-dragon-cyan/5 to-transparent pointer-events-none" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                        <div className="relative">
                          <span className="absolute inset-0 w-6 h-6 bg-dragon-cyan/20 rounded-full animate-ping -translate-x-1.5 -translate-y-1.5" />
                          <MapPin size={16} className="text-dragon-cyan drop-shadow-[0_2px_8px_rgba(45,212,191,0.5)] animate-bounce" />
                        </div>
                        <span className="text-[6.5px] font-black uppercase text-dragon-cyan bg-zinc-950 border border-dragon-cyan/30 px-1 py-0.5 rounded shadow mt-1">
                          Detected Location
                        </span>
                      </div>
                    </div>

                    <button 
                      onClick={() => setSimStep(4)}
                      className="w-full py-2.5 bg-dragon-cyan hover:opacity-90 text-dragon-black font-extrabold text-[9.5px] uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer"
                    >
                      Submit Order <Send size={10} />
                    </button>
                  </motion.div>
                )}

                {simStep === 4 && (
                  <motion.div
                    key="simStep4"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-4 text-center py-6"
                  >
                    <div className="w-14 h-14 bg-dragon-cyan/15 border border-dragon-cyan/30 text-dragon-cyan rounded-full flex items-center justify-center mx-auto shadow-lg shadow-dragon-cyan/5">
                      <CheckCircle size={28} className="animate-pulse" />
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-xs font-black text-dragon-cyan uppercase tracking-wide">Thank you! Order Placed Successfully</h4>
                      <p className="text-[10px] text-zinc-300">Smart location order database entry successful!</p>
                    </div>

                    <button 
                      onClick={() => setSimStep(1)}
                      className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg text-[8.5px] font-bold uppercase tracking-wider transition-all"
                    >
                      Restart Simulation
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="absolute bottom-1 inset-x-0 h-6 flex items-center justify-center z-40 bg-zinc-950/60 backdrop-blur-md">
              <div className="w-24 h-1 bg-zinc-600 rounded-full" />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DOCUMENTATION & SPECIFICATIONS */}
        <div className="flex-1 bg-zinc-950 p-6 lg:p-10 flex flex-col justify-between font-sans">
          <div className="space-y-6 text-left">
            <div>
              <span className="px-3 py-1 bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-[9px] font-black uppercase tracking-widest rounded-full inline-block mb-2">
                location features & structure
              </span>
              <h2 className="text-xl md:text-2xl font-display font-black text-white tracking-tight">What's included in the Location Tracking Page?</h2>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                This is an intelligent checkout page replacing standard forms with precise GPS geolocation technology.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3 bg-white/[0.02] border border-white/5 p-4 rounded-2xl hover:border-dragon-cyan/20 transition-all">
                <div className="p-2.5 bg-dragon-cyan/10 rounded-xl text-dragon-cyan h-10 w-10 flex items-center justify-center shrink-0">
                  <MapPin size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-zinc-200 uppercase tracking-wide">1. GPS Double-Verification Technique</h4>
                  <p className="text-[11px] text-gray-400 leading-relaxed mt-1">
                    Browser's Geolocation API translates coordinates to address automatically.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 bg-white/[0.02] border border-white/5 p-4 rounded-2xl hover:border-dragon-cyan/20 transition-all">
                <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-400 h-10 w-10 flex items-center justify-center shrink-0">
                  <Phone size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-zinc-200 uppercase tracking-wide">2. Smart Customer Profile Information</h4>
                  <p className="text-[11px] text-gray-400 leading-relaxed mt-1">
                    Integrated security checks detect fraudulent orders.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 mt-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="text-left">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Location Tracking Protocol</p>
              <p className="text-xs text-dragon-cyan font-black">GPS SECURE CO-ORDINATES MODULE</p>
            </div>
            
            <button
              onClick={() => {
                const smartLink = `${window.location.origin}/order/${item.id}/${user?.uid || ''}`;
                navigator.clipboard.writeText(smartLink);
                alert('Smart Order Link Copied!');
              }}
              className="px-6 py-3 bg-dragon-cyan hover:opacity-90 text-dragon-black font-extrabold text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-dragon-cyan/10 flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
            >
              <LinkIcon size={12} /> Copy Tracking Order Link
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default SmartOrderPreviewModal;
