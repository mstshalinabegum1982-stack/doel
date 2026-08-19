import React, { useState, useEffect, useContext, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Check, 
  Trash2, 
  MapPin, 
  Globe, 
  ShieldAlert, 
  Truck, 
  ChevronDown, 
  MessageSquare, 
  ArrowUpRight, 
  X, 
  AlertCircle, 
  Settings, 
  Copy 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { APIProvider } from '@vis.gl/react-google-maps';
import { db } from '../../lib/firebase';
import { AuthContext } from '../../authContext';
import { getCurrencySymbol, getOfflineCouriers } from '../../utils/countriesData';
import { formatDate, cn } from '../../lib/utils';
import { saveToFraudBlacklist } from '../../lib/fraudDetection';
import { getCachedUserName } from '../../lib/userCache';
import { BrandSvgIcon } from '../BrandSvgIcon';

interface OrderRowProps {
  order: any;
  type: 'sent' | 'received';
  selected?: boolean;
  onToggleSelect?: () => void;
  configuredCouriers?: any[];
  onNavigateToLogistics?: () => void;
}

export const OrderRow = memo(function OrderRow({
  order,
  type,
  selected,
  onToggleSelect,
  configuredCouriers = [],
  onNavigateToLogistics
}: OrderRowProps) {
  const { user, profile } = useContext(AuthContext);
  const currencySymbol = profile?.country ? getCurrencySymbol(profile.country) : "৳";
  const navigate = useNavigate();
  const [senderName, setSenderName] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const isSent = type === 'sent';
  const [isUpdating, setIsUpdating] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [showCourierPanel, setShowCourierPanel] = useState(false);
  const [deliveryManName, setDeliveryManName] = useState(order.deliveryManName || '');
  const [deliveryManPhone, setDeliveryManPhone] = useState(order.deliveryManPhone || '');
  const [courierLat, setCourierLat] = useState(order.latitude?.toString() || '');
  const [courierLng, setCourierLng] = useState(order.longitude?.toString() || '');
  const [isSavingCourier, setIsSavingCourier] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<'idle' | 'success' | 'failed'>('idle');

  useEffect(() => {
    setDeliveryManName(order.deliveryManName || '');
    setDeliveryManPhone(order.deliveryManPhone || '');
    setCourierLat(order.latitude?.toString() || '');
    setCourierLng(order.longitude?.toString() || '');
  }, [order.deliveryManName, order.deliveryManPhone, order.latitude, order.longitude]);

  // Use cached user names to drastically reduce Firestore getDoc read operations
  useEffect(() => {
    let active = true;
    const fetchCachedNames = async () => {
      try {
        if (order.senderId && order.senderId !== 'customer_public') {
          const sName = await getCachedUserName(db, order.senderId);
          if (active && sName) setSenderName(sName);
        }
        if (order.receiverId && order.receiverId !== 'customer_public') {
          const rName = await getCachedUserName(db, order.receiverId);
          if (active && rName) setRecipientName(rName);
        }
      } catch (err) {
        console.warn("Error fetching cached seller/buyer names:", err);
      }
    };
    fetchCachedNames();
    return () => {
      active = false;
    };
  }, [order.senderId, order.receiverId]);

  const handleSaveCourierDetails = async () => {
    setIsSavingCourier(true);
    setWebhookStatus('idle');
    try {
      const latNum = parseFloat(courierLat);
      const lngNum = parseFloat(courierLng);

      const updateData: any = {
        latitude: isNaN(latNum) ? null : latNum,
        longitude: isNaN(lngNum) ? null : lngNum,
        deliveryManName: deliveryManName || null,
        deliveryManPhone: deliveryManPhone || null,
        deliveryManAssigned: !!deliveryManPhone
      };

      if (order.status === 'pending' || order.status === 'confirmed') {
        updateData.status = 'shipping';
      }

      await updateDoc(doc(db, 'orders', order.id), updateData);

      const dispatchRes = await fetch('/api/integration/trigger-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: order.id,
          forceTrigger: true
        })
      });

      const dispatchResult = await dispatchRes.json();
      if (dispatchResult.success) {
        setWebhookStatus('success');
      } else {
        setWebhookStatus('failed');
      }
    } catch (err) {
      console.error("Error saving courier details:", err);
      alert("Failed to save info.");
      setWebhookStatus('failed');
    } finally {
      setIsSavingCourier(false);
    }
  };

  const handleChangeStatus = async (newStatus: any) => {
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        status: newStatus
      });
    } catch (err) {
      console.error("Error updating status of order:", err);
      alert("Failed to update order status.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text || '');
    alert(`${label} copied successfully!`);
  };

  const normalizedItems = order.items && order.items.length > 0
    ? order.items.map((item: any) => ({
        name: item.name,
        sellPrice: item.sellPrice,
        image: item.image,
        quantity: item.quantity,
        specs: item.specs || [{ color: item.color, size: item.size, weight: item.weight }]
      }))
    : [{
        name: order.productName,
        sellPrice: order.sellPrice,
        image: order.productImage,
        quantity: order.quantity || 1,
        specs: [{ color: order.color, size: order.size, weight: order.weight }]
      }];

  const subtotalPrice = normalizedItems.reduce((sum: number, item: any) => sum + ((item.sellPrice || 0) * (item.quantity || 1)), 0);
  const deliveryCharge = order.deliveryCharge || 0;
  const totalBill = subtotalPrice + deliveryCharge;

  return (
    <div className={cn(
      "p-5 sm:p-6 group hover:bg-white/[0.08] transition-all rounded-2xl relative shadow-2xl order-card-container",
      isSent ? "order-card-sent" : "order-card-rcvd",
      selected && "order-card-selected"
    )}>
       {/* Top Header Row: Order ID, Platform & Time Display */}
       <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-white/10 pb-3.5 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
             {onToggleSelect && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelect();
                  }}
                  title={selected ? "Unselect Order" : "Select Order"}
                  className={cn(
                    "w-7 h-7 sm:w-8 sm:h-8 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-sm active:scale-95",
                    selected 
                      ? "bg-emerald-500 border-emerald-400 text-white shadow-md shadow-emerald-500/30 scale-105" 
                      : "bg-slate-100 dark:bg-white/5 border-slate-300 dark:border-white/30 text-transparent hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                  )}
                >
                  <Check size={selected ? 18 : 16} strokeWidth={selected ? 3.5 : 2.5} className={selected ? "text-white drop-shadow" : "text-transparent"} />
                </button>
             )}
             <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded border border-white/10 bg-[#0a0a0c] text-gray-400 font-mono">
               ID: #{order.id?.substring(0, 8).toUpperCase() || 'N/A'}
             </span>
             <span className={cn(
               "text-[9px] font-black uppercase px-2 py-0.5 rounded-full border",
               isSent ? "bg-dragon-cyan/15 border-dragon-cyan/30 text-dragon-cyan" : "bg-dragon-purple/15 border-dragon-purple/30 text-dragon-purple"
             )}>
               {isSent ? 'SENT' : 'RCVD'}
             </span>
             {order.platform === 'landing_page' ? (
               <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-400 inline-flex items-center gap-1">
                 <BrandSvgIcon platform="landing_page" variant="badge" badgeSizeClass="w-3.5 h-3.5 rounded-md" size={9} />
                 Landing Page Order
               </span>
             ) : order.platform === 'website' ? (
               <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 inline-flex items-center gap-1">
                 <BrandSvgIcon platform="website" variant="badge" badgeSizeClass="w-3.5 h-3.5 rounded-md" size={9} />
                 Website Order
               </span>
             ) : (
               <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-dragon-cyan/30 bg-dragon-cyan/10 text-dragon-cyan inline-flex items-center gap-1">
                 <BrandSvgIcon platform="chatroom" variant="badge" badgeSizeClass="w-3.5 h-3.5 rounded-md" size={9} />
                 Direct Order
               </span>
             )}

             {order.isForwarded && (
               <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border border-amber-500/40 bg-amber-500/15 text-amber-300 inline-flex items-center gap-1 shadow-sm animate-pulse">
                 Forwarded to {order.forwardedToName || 'Supplier'}
               </span>
             )}
          </div>
          <div className="flex items-center gap-2">
             <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-mono">
               {order.createdAt ? formatDate(order.createdAt) : 'N/A'}
             </span>
          </div>
       </div>

       {/* Middle Section: Items Summary & Customer Card */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4 font-sans text-left">
          {/* Left: Product & Specs Summary */}
          <div className="space-y-3 bg-black/40 p-4 rounded-xl border border-white/5">
             <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-[10px] font-black uppercase text-dragon-cyan tracking-wider">Product Info ({normalizedItems.length} items)</span>
                <span className="text-[11px] font-black text-white font-mono">{currencySymbol}{subtotalPrice}</span>
             </div>
             <div className="space-y-2.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {normalizedItems.map((itm: any, itmIdx: number) => (
                  <div key={`itm-${itmIdx}`} className="flex items-start gap-3 text-left">
                     {itm.image ? (
                       <img src={itm.image} alt={itm.name} className="w-10 h-10 object-cover rounded-lg border border-white/10 shrink-0" />
                     ) : (
                       <div className="w-10 h-10 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center shrink-0 text-gray-500 text-xs font-bold font-mono">
                         #{itmIdx + 1}
                       </div>
                     )}
                     <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{itm.name || 'Product'}</h4>
                        <div className="flex flex-wrap gap-2 text-[10px] text-gray-400 mt-0.5">
                           <span>Qty: <b className="text-white font-mono">{itm.quantity || 1}</b></span>
                           <span>Price: <b className="text-white font-mono">{currencySymbol}{itm.sellPrice || 0}</b></span>
                        </div>
                        {itm.specs && itm.specs.length > 0 && itm.specs[0] && (
                           <div className="flex flex-wrap gap-1 mt-1">
                              {itm.specs[0].color && (
                                <span className="text-[8.5px] px-1.5 py-0.5 bg-white/5 rounded text-gray-300 border border-white/5">
                                  Color: {itm.specs[0].color}
                                </span>
                              )}
                              {itm.specs[0].size && (
                                <span className="text-[8.5px] px-1.5 py-0.5 bg-white/5 rounded text-gray-300 border border-white/5">
                                  Size: {itm.specs[0].size}
                                </span>
                              )}
                              {itm.specs[0].weight && (
                                <span className="text-[8.5px] px-1.5 py-0.5 bg-white/5 rounded text-gray-300 border border-white/5">
                                  Weight: {itm.specs[0].weight}
                                </span>
                              )}
                           </div>
                        )}
                     </div>
                  </div>
                ))}
             </div>
             
             <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-bold">
                <span className="text-gray-400">Delivery Charge:</span>
                <span className="text-white font-mono">{currencySymbol}{deliveryCharge}</span>
             </div>
             <div className="flex items-center justify-between text-xs font-black pt-1 border-t border-white/10 text-dragon-cyan">
                <span>Total Bill (Payable):</span>
                <span className="text-sm font-mono">{currencySymbol}{totalBill}</span>
             </div>
          </div>

          {/* Right: Customer Information & Delivery Address */}
          <div className="space-y-3 bg-black/40 p-4 rounded-xl border border-white/5 text-left flex flex-col justify-between">
             <div>
                <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2.5">
                   <span className="text-[10px] font-black uppercase text-dragon-purple tracking-wider">Customer Details</span>
                   {order.customerPhone && (
                      <button
                        type="button"
                        onClick={() => handleCopyToClipboard(order.customerPhone, "Phone Number")}
                        className="text-[9px] text-gray-400 hover:text-white flex items-center gap-1 font-mono uppercase cursor-pointer"
                      >
                         <Copy size={10} /> Copy
                      </button>
                   )}
                </div>
                <div className="space-y-1.5 text-xs">
                   <p className="font-bold text-white flex items-center gap-1.5">
                      <span className="text-gray-400 text-[10px] font-medium uppercase">Name:</span> {order.customerName || 'N/A'}
                   </p>
                   <p className="font-bold text-white flex items-center gap-1.5">
                      <span className="text-gray-400 text-[10px] font-medium uppercase">Phone:</span> 
                      <a href={`tel:${order.customerPhone}`} className="text-sky-400 hover:underline font-mono">
                         {order.customerPhone || 'N/A'}
                      </a>
                   </p>
                   <p className="text-gray-300 text-[11px] leading-relaxed">
                      <span className="text-gray-400 text-[10px] font-medium uppercase block">Address:</span>
                      {order.customerAddress || 'No address provided'}
                   </p>
                </div>
             </div>

             {/* Status Change Dropdown */}
             <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase text-gray-400">Order Status:</span>
                <div className="relative">
                   <select
                     value={order.status || 'pending'}
                     onChange={(e) => handleChangeStatus(e.target.value)}
                     disabled={isUpdating}
                     className={cn(
                       "text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border outline-none cursor-pointer transition-all appearance-none pr-7",
                       order.status === 'delivered' ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" :
                       order.status === 'shipping' ? "bg-sky-500/20 text-sky-300 border-sky-500/40" :
                       order.status === 'confirmed' ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40" :
                       order.status === 'cancelled' || order.status === 'fraud_return' ? "bg-rose-500/20 text-rose-300 border-rose-500/40" :
                       "bg-amber-500/20 text-amber-300 border-amber-500/40"
                     )}
                   >
                      <option value="pending" className="bg-zinc-900 text-white">Pending</option>
                      <option value="confirmed" className="bg-zinc-900 text-white">Confirmed</option>
                      <option value="shipping" className="bg-zinc-900 text-white">In Courier / Shipping</option>
                      <option value="delivered" className="bg-zinc-900 text-white">Delivered</option>
                      <option value="return" className="bg-zinc-900 text-white">Return</option>
                      <option value="paid_return" className="bg-zinc-900 text-white">Paid Return</option>
                      <option value="fraud_return" className="bg-zinc-900 text-white">Fraud Return</option>
                      <option value="cancelled" className="bg-zinc-900 text-white">Cancelled</option>
                   </select>
                   <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                </div>
             </div>
          </div>
       </div>

       {/* Live Courier Tracking & API Updates */}
       {(order.courierTrackingId || order.courierNote) && (
          <div className="mb-4 p-4 bg-sky-500/5 border border-sky-500/20 rounded-2xl space-y-3 text-left animate-in fade-in duration-300 shadow-sm">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-sky-400">
                   <Truck size={14} className="animate-pulse" />
                   <h4 className="text-[10px] font-black uppercase tracking-wider">Automated Courier Tracking Feed</h4>
                </div>
                {order.courierTrackingId && (
                   <div className="flex items-center gap-1.5">
                      <span className="text-[8.5px] font-mono bg-sky-500/10 border border-sky-500/20 text-sky-400 px-2 py-0.5 rounded-md uppercase font-bold">
                         {order.courierName || "Courier"} - {order.courierTrackingId}
                      </span>
                      <button
                         type="button"
                         onClick={() => handleCopyToClipboard(order.courierTrackingId, "Tracking ID")}
                         className="p-1 hover:bg-sky-500/20 text-sky-400 rounded transition-colors cursor-pointer"
                         title="Copy Tracking ID"
                      >
                         <Copy size={11} />
                      </button>
                   </div>
                )}
             </div>

             <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                   <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">Current Tracking Note (Live Note)</span>
                   <span className="text-[7.5px] text-sky-400/80 font-bold uppercase tracking-wider animate-pulse">● Auto Tracking Active</span>
                </div>
                <p className="text-[11px] text-gray-200 font-medium italic leading-relaxed">
                   {order.courierNote || "Booking successful. Waiting for the first update from courier API."}
                </p>
                {order.courierRules && (
                   <p className="text-[9px] text-gray-400 border-t border-white/5 pt-1 mt-1 font-mono">
                      <strong className="text-gray-300">Rules:</strong> {order.courierRules}
                   </p>
                )}
             </div>

             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
                <p className="text-[9px] text-gray-400 font-medium leading-normal max-w-sm">
                   The system automatically makes API calls to retrieve real-time courier tracking updates. When a rider is assigned, an outward webhook will fire directly to your panel.
                </p>
                <button
                   type="button"
                   onClick={async () => {
                      try {
                         const trackRes = await fetch(`/api/integration/track-courier?orderId=${order.id}&country=${encodeURIComponent(profile?.country || 'Bangladesh')}&courierName=${encodeURIComponent(order.courierName || '')}&trackingId=${encodeURIComponent(order.courierTrackingId || '')}`);
                         const trackData = await trackRes.json();
                         if (trackData.success) {
                            alert(`Latest Tracking Note:\n${trackData.courierNote || 'No change'}`);
                         } else {
                            alert(`Tracking error: ${trackData.error || 'Unable to update'}`);
                         }
                      } catch (err: any) {
                         alert(`Connection error: ${err.message}`);
                      }
                   }}
                   className="px-3 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                >
                   <Truck size={11} /> Trigger Tracking Request (API)
                </button>
             </div>
          </div>
       )}

       {/* Uniform Action Buttons Grid */}
       <div className="flex items-center gap-1 w-full mt-1.5 flex-nowrap">
          {/* Courier Booking */}
          <button 
             type="button"
             onClick={() => {
                if (isSent) {
                  alert("Sorry, you cannot book the courier for a sent order. Only the recipient can perform this action.");
                  return;
                }

                const activeCouriers = getOfflineCouriers(profile?.country || 'Bangladesh').filter((rc: any) => {
                  return (configuredCouriers || []).some((cc: any) => cc.courierName?.toLowerCase() === rc.name?.toLowerCase());
                });

                if (activeCouriers.length === 0 && (!configuredCouriers || configuredCouriers.length === 0)) {
                  if (onNavigateToLogistics) {
                    onNavigateToLogistics();
                  } else {
                    alert("No courier API configured. Please configure your Courier API credentials under Global Logistics settings.");
                  }
                  return;
                }
                
                setShowCourierPanel(!showCourierPanel);
              }}
             style={!isSent ? { color: '#ffffff' } : undefined}
             className={cn(
               "order-btn-courier py-1.5 px-2 rounded-lg text-[10px] sm:text-[11px] font-bold tracking-tight transition-all flex items-center justify-center gap-1 cursor-pointer border shrink-0 flex-1 min-w-0 truncate font-sans", 
               isSent 
                 ? "bg-zinc-800 text-zinc-500 border-zinc-700/50 cursor-not-allowed opacity-60" 
                 : showCourierPanel 
                   ? "bg-indigo-700 text-white border-indigo-500 shadow-md shadow-indigo-500/20" 
                   : "bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-700"
             )}
          >
             <Truck size={12} className="shrink-0" style={{ color: 'inherit' }} /> 
             <span className="truncate font-extrabold">Courier Booking</span>
          </button>

          {/* Location Tracking */}
          <button 
             type="button"
             onClick={() => {
                if (order.latitude && order.longitude) {
                  setShowMap(true);
                } else if (order.courierTrackingId) {
                  alert(`Courier Tracking ID: ${order.courierTrackingId}\nLive tracking is active.`);
                } else {
                  alert("No GPS location or courier tracking ID found for this order.");
                }
             }}
             style={(order.latitude && order.longitude) || order.courierTrackingId ? { color: '#ffffff' } : undefined}
             className={cn(
               "order-btn-location py-1.5 px-2 rounded-lg text-[10px] sm:text-[11px] font-bold tracking-tight transition-all flex items-center justify-center gap-1 cursor-pointer border shrink-0 flex-1 min-w-0 truncate font-sans",
               (order.latitude && order.longitude) || order.courierTrackingId
                 ? "bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700"
                 : "bg-zinc-800 text-zinc-500 border-zinc-700/50 cursor-not-allowed opacity-50"
             )}
          >
             <Globe size={12} className="shrink-0" style={{ color: 'inherit' }} /> 
             <span className="truncate font-extrabold">Tracking Location</span>
          </button>

          {/* Block Client */}
          <button 
             type="button"
             onClick={() => {
                if (isSent) {
                  alert("Sorry, you cannot block the customer of a sent order. Only the recipient can perform this action.");
                  return;
                }
                setShowBlockConfirm(true);
              }}
             style={!isSent ? { color: '#ffffff' } : undefined}
             className={cn(
               "order-btn-block py-1.5 px-2 rounded-lg text-[10px] sm:text-[11px] font-bold tracking-tight transition-all flex items-center justify-center gap-1 cursor-pointer border shrink-0 flex-1 min-w-0 truncate font-sans", 
               isSent 
                 ? "bg-zinc-800 text-zinc-500 border-zinc-700/50 cursor-not-allowed opacity-60" 
                 : "bg-amber-600 text-white border-amber-500 hover:bg-amber-700"
             )}
          >
             <ShieldAlert size={12} className="shrink-0" style={{ color: 'inherit' }} /> 
             <span className="truncate font-extrabold">Block List</span>
          </button>

          {/* Delete Order Button */}
          {(order.status === 'pending' || order.status === 'cancelled') && (
            <button 
               type="button"
               onClick={() => setShowDeleteConfirm(true)}
               style={{ color: '#ffffff' }}
               className="order-btn-delete py-1.5 px-2 rounded-lg text-[10px] sm:text-[11px] font-bold tracking-tight transition-all flex items-center justify-center gap-1 cursor-pointer border shrink-0 flex-1 min-w-0 truncate bg-rose-600 text-white border-rose-500 hover:bg-rose-700 font-sans"
            >
               <Trash2 size={12} className="shrink-0" style={{ color: 'inherit' }} /> 
               <span className="truncate font-extrabold">Delete</span>
            </button>
          )}
       </div>

       {showCourierPanel && (
         <div className="w-full mt-4 p-4 bg-zinc-900/90 border border-indigo-500/30 rounded-2xl space-y-4 text-left font-sans shadow-lg">
            <div className="border-b border-white/10 pb-2.5 flex items-center justify-between">
               <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Truck size={14} className="text-sky-400 animate-bounce" /> Courier Booking Panel
               </h4>
               <div className="flex items-center gap-2">
                  {onNavigateToLogistics && (
                     <button
                        type="button"
                        onClick={onNavigateToLogistics}
                        className="text-[8.5px] font-bold text-gray-400 hover:text-sky-400 transition-colors flex items-center gap-1 cursor-pointer"
                     >
                        <Settings size={10} /> Setup API
                     </button>
                  )}
                  <span className="text-[8px] font-black bg-sky-500/10 border border-sky-500/20 text-sky-400 px-2 py-0.5 rounded-md uppercase tracking-wider">
                     Automated API Dispatch
                  </span>
               </div>
            </div>

            <div className="space-y-3">
               <p className="text-[10px] font-black uppercase text-sky-400 tracking-wider">Select Courier to Book</p>
               
               {(() => {
                 const activeCouriers = getOfflineCouriers(profile?.country || 'Bangladesh').filter((rc: any) => {
                   return (configuredCouriers || []).some((cc: any) => cc.courierName?.toLowerCase() === rc.name?.toLowerCase());
                 });

                 if (activeCouriers.length === 0 && (!configuredCouriers || configuredCouriers.length === 0)) {
                   return (
                     <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl text-center space-y-3">
                       <AlertCircle size={20} className="text-amber-500 mx-auto" />
                       <div className="space-y-1">
                         <p className="text-[11px] font-black text-white uppercase">No Courier API Configured</p>
                         <p className="text-[9.5px] text-gray-400 leading-relaxed">
                           No courier API integration is configured yet for {profile?.country || 'Bangladesh'}. Please configure your API credentials under the <b>"Global Logistics"</b> tab in settings.
                         </p>
                       </div>
                       {onNavigateToLogistics && (
                         <button
                           type="button"
                           onClick={onNavigateToLogistics}
                           className="mt-2 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md inline-flex items-center gap-1.5"
                         >
                           <Settings size={12} /> Go to Global Logistics Setup
                         </button>
                       )}
                     </div>
                   );
                 }

                 const couriersToDisplay = activeCouriers.length > 0 ? activeCouriers : configuredCouriers.map((c: any) => ({ name: c.courierName }));

                 return (
                   <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                     {couriersToDisplay.map((rc: any, idx: number) => (
                        <button
                           key={`${rc.name}-${idx}`}
                           type="button"
                           onClick={async () => {
                              if (!window.confirm(`Do you want to automatically book this parcel on ${rc.name}?`)) return;
                              try {
                                 const response = await fetch('/api/integration/bulk-courier-booking', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                       orderIds: [order.id],
                                       courierName: rc.name,
                                       country: profile?.country || 'Bangladesh',
                                       userId: user?.uid
                                    })
                                 });
                                 const data = await response.json();
                                 if (data.success && data.results?.[0]?.success) {
                                    alert(`Booking successful!\nTracking ID: ${data.results[0].trackingId}\nRules: ${data.results[0].courierRules}`);
                                    setShowCourierPanel(false);
                                 } else {
                                    alert(`Error: ${data.results?.[0]?.error || "Could not book parcel"}`);
                                 }
                              } catch (err: any) {
                                 alert(`Connection error: ${err.message}`);
                              }
                           }}
                           className="p-2.5 bg-white/5 hover:bg-sky-500/15 border border-white/10 hover:border-sky-500/40 rounded-xl text-left transition-all flex items-center justify-between group cursor-pointer"
                        >
                           <div>
                              <h5 className="text-[11px] font-bold text-white group-hover:text-sky-400 transition-colors uppercase">{rc.name}</h5>
                              <p className="text-[8px] text-sky-400/80 font-semibold uppercase mt-0.5 tracking-wider">● API Configured & Ready</p>
                           </div>
                           <ArrowUpRight size={12} className="text-gray-500 group-hover:text-sky-400 transition-colors" />
                        </button>
                     ))}
                   </div>
                 );
               })()}
            </div>
         </div>
       )}

       {/* View Chat Button (if applicable) */}
       {order.platform !== 'landing_page' && order.platform !== 'website' && (
          <button 
            type="button"
            onClick={() => {
              const chatId = [order.senderId, order.receiverId].sort().join('_');
              const otherId = isSent ? order.receiverId : order.senderId;
              const otherName = isSent ? recipientName : senderName;
              navigate(`/chat/${chatId}`, { state: { targetOrderId: order.id, otherUser: { uid: otherId, name: otherName } } });
            }}
            className="w-full mt-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider text-gray-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
             <MessageSquare size={14} strokeWidth={2.5} /> 
             <span>View Chat</span>
          </button>
       )}

       <AnimatePresence>
         {showDeleteConfirm && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-200">
               <motion.div 
                 initial={{ scale: 0.95, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 exit={{ scale: 0.95, opacity: 0 }}
                 className="w-full max-w-sm glass-card p-6 border-red-500/30 text-center space-y-5 shadow-2xl relative bg-[#0a0a0c]"
               >
                 <div className="w-14 h-14 bg-red-500/10 text-red-500 flex items-center justify-center rounded-full mx-auto shadow-inner">
                    <Trash2 size={28} />
                 </div>
                 <div className="space-y-2">
                   <h3 className="text-sm font-black text-rose-500 uppercase tracking-widest">Delete Order Permanent</h3>
                   <p className="text-[11px] text-gray-200 leading-relaxed font-bold">
                     Are you sure you want to permanently delete this order?
                   </p>
                   <p className="text-[9.5px] text-gray-500 font-medium leading-relaxed">
                     This action is permanent and cannot be undone. All data associated with this order will be permanently erased.
                   </p>
                 </div>
                 <div className="flex gap-2.5">
                    <button 
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isUpdating}
                      className="flex-1 py-2 bg-white/5 text-gray-300 font-bold tracking-tight text-[11px] rounded-xl border border-white/10 hover:bg-white/10 cursor-pointer transition-all font-sans"
                    >
                      No, Keep It
                    </button>
                    <button 
                      onClick={async () => {
                        setIsUpdating(true);
                        try {
                          await deleteDoc(doc(db, "orders", order.id));
                          setShowDeleteConfirm(false);
                        } catch (err) {
                          console.error("Error deleting order:", err);
                        } finally {
                          setIsUpdating(false);
                        }
                      }}
                      disabled={isUpdating}
                      className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold tracking-tight text-[11px] rounded-xl shadow-lg shadow-red-500/20 transition-all cursor-pointer flex items-center justify-center gap-1 font-sans"
                    >
                      {isUpdating ? "Deleting..." : "Yes, Delete Order"}
                    </button>
                 </div>
               </motion.div>
            </div>
          )}

         {showBlockConfirm && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-200">
               <motion.div 
                 initial={{ scale: 0.95, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 exit={{ scale: 0.95, opacity: 0 }}
                 className="w-full max-w-sm glass-card p-6 border-red-500/30 text-center space-y-5 shadow-2xl relative bg-[#0a0a0c]"
               >
                 <div className="w-14 h-14 bg-red-500/10 text-red-500 flex items-center justify-center rounded-full mx-auto shadow-inner">
                    <ShieldAlert size={28} />
                 </div>
                 <div className="space-y-2">
                   <h3 className="text-sm font-black text-rose-500 uppercase tracking-widest">Customer Block Warning</h3>
                   <p className="text-[11px] text-gray-200 leading-relaxed font-bold">
                     Are you sure you want to block and blacklist customer <span className="text-dragon-cyan underline">{order.customerPhone}</span> ?
                   </p>
                   <p className="text-[9.5px] text-gray-500 font-medium leading-relaxed">
                     Blocking will add this phone number to local and global blacklists. This order will automatically be set to Fraud Return (Loss) excluding courier charges.
                   </p>
                 </div>
                 <div className="flex gap-2.5">
                    <button 
                      onClick={() => setShowBlockConfirm(false)}
                      disabled={isBlocking}
                      className="flex-1 py-2 bg-white/5 text-gray-300 font-bold tracking-tight text-[11px] rounded-xl border border-white/10 hover:bg-white/10 cursor-pointer transition-all font-sans"
                    >
                      No, Go Back
                    </button>
                    <button 
                      onClick={async () => {
                        setIsBlocking(true);
                        try {
                          const ph = order.customerPhone.replace(/\D/g, '');
                          const cleanPhone = ph.length >= 10 ? ph.slice(-10) : ph;
                          if (!cleanPhone) {
                            alert('Valid phone number not found.');
                            return;
                          }
                          const curToken = order.fraudToken || '';

                          const blockReason = `Manually blocked from Order control panel (Ref: ${order.id})`;
                          
                          await saveToFraudBlacklist(
                            db,
                            order.receiverId,
                            'phone',
                            cleanPhone,
                            blockReason,
                            [cleanPhone],
                            curToken ? [curToken] : []
                          );

                          if (curToken) {
                            await saveToFraudBlacklist(
                              db,
                              order.receiverId,
                              'token',
                              curToken,
                              blockReason,
                              [cleanPhone],
                              [curToken]
                            );
                          }

                          await updateDoc(doc(db, 'orders', order.id), {
                            status: 'fraud_return',
                            courierNote: 'Blacklisted Fraud Customer'
                          });

                          alert(`Customer number '${order.customerPhone}' successfully blocked!`);
                          setShowBlockConfirm(false);
                        } catch (err) {
                          console.error("Error manual blocking of order details:", err);
                          alert("An error occurred while blocking.");
                        } finally {
                          setIsBlocking(false);
                        }
                      }}
                      disabled={isBlocking}
                      className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold tracking-tight text-[11px] rounded-xl shadow-lg shadow-red-500/20 transition-all cursor-pointer flex items-center justify-center gap-1 font-sans"
                    >
                      {isBlocking ? 'Blocking...' : 'Yes, Block Client'}
                    </button>
                 </div>
               </motion.div>
            </div>
          )}

         {showMap && order.latitude && order.longitude && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-lg glass-card overflow-hidden border-dragon-cyan/30"
              >
                 <div className="p-4 border-b border-white/5 flex justify-between items-center bg-dragon-black">
                    <div>
                       <h3 className="text-sm font-black text-white uppercase tracking-widest">Customer Live Location</h3>
                       <p className="text-[10px] text-gray-500 font-bold uppercase">{order.customerName}'s Order</p>
                    </div>
                    <button onClick={() => setShowMap(false)} className="p-2 text-gray-500 hover:text-white cursor-pointer"><X size={20}/></button>
                 </div>
                 <div className="h-[400px] w-full bg-white/5 relative">
                    <APIProvider apiKey={process.env.GOOGLE_MAPS_PLATFORM_KEY || ''}>
                     <iframe
                       width="100%"
                       height="100%"
                       frameBorder="0"
                       style={{ border: 0 }}
                       src={`https://maps.google.com/maps?q=${order.latitude},${order.longitude}&hl=bn&z=16&output=embed`}
                       allowFullScreen
                     ></iframe>
                    </APIProvider>
                 </div>
                 <div className="p-4 bg-dragon-black border-t border-white/5">
                    <p className="text-[10px] font-black uppercase text-dragon-cyan tracking-widest mb-1">GPS Coordinates</p>
                    <p className="text-xs font-bold text-gray-400 block mb-2 font-mono">{order.latitude.toFixed(6)}, {order.longitude.toFixed(6)}</p>
                    <button
                      type="button"
                      onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${order.latitude},${order.longitude}`, '_blank')}
                      className="w-full shrink-0 px-3 py-2 bg-dragon-cyan text-dragon-black font-black uppercase tracking-widest text-[9px] rounded-lg hover:bg-white hover:text-black transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1 font-sans"
                    >
                      <MapPin size={11} /> Open Google Maps (GPS / Navigate)
                    </button>
                 </div>
              </motion.div>
           </div>
         )}
       </AnimatePresence>
    </div>
  );
});
