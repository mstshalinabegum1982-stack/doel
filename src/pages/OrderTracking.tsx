import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  MapPin, 
  Phone, 
  User, 
  Truck, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Navigation,
  Globe,
  Share2,
  Calendar,
  CreditCard,
  ShoppingBag
} from 'lucide-react';
import { motion } from 'motion/react';

interface OrderDetail {
  id?: string;
  name?: string;
  customerName?: string;
  phone?: string;
  customerPhone?: string;
  address?: string;
  customerAddress?: string;
  totalPrice?: number;
  totalBill?: number;
  price?: number;
  paymentMethod?: string;
  status?: string;
  createdAt?: string | any;
  deliveryManName?: string;
  deliveryManPhone?: string;
  deliveryManAssigned?: boolean;
  latitude?: number;
  longitude?: number;
  productName?: string;
  quantity?: number;
}

export default function OrderTracking() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/orders/${orderId}`);
        if (!res.ok) {
          throw new Error(res.status === 404 ? "Order details not found" : "Failed to load tracking data");
        }
        const data = await res.json();
        setOrder(data);
        setError(null);
      } catch (err: any) {
        console.error("Tracking Page Load Error:", err);
        setError(err.message || "Could not retrieve tracking details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const getStatusConfig = (status: string = 'Pending') => {
    const s = status.toLowerCase();
    if (s.includes('pending') || s.includes('অপেক্ষমাণ')) {
      return {
        label: 'Order Placed (Awaiting Approval)',
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        icon: <Clock size={20} className="text-amber-400 animate-pulse" />,
        step: 1
      };
    }
    if (s.includes('approve') || s.includes('অনুমোদিত') || s.includes('processing')) {
      return {
        label: 'Confirmed & Processing',
        color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        icon: <ShieldCheck size={20} className="text-blue-400" />,
        step: 2
      };
    }
    if (s.includes('ship') || s.includes('কুরিয়ার') || s.includes('courier')) {
      return {
        label: 'Handed to Courier',
        color: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
        icon: <Truck size={20} className="text-pink-400" />,
        step: 3
      };
    }
    if (s.includes('complete') || s.includes('ডেলিভারি') || s.includes('delivered')) {
      return {
        label: 'Delivered (Completed)',
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        icon: <CheckCircle2 size={20} className="text-emerald-400" />,
        step: 4
      };
    }
    return {
      label: status,
      color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
      icon: <AlertCircle size={20} className="text-zinc-400" />,
      step: 1
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full max-w-full flex flex-col items-center justify-center bg-dragon-black relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.05)_0%,transparent_100%)] pointer-events-none" />
        <div className="w-12 h-12 border-4 border-dragon-cyan border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-400 font-mono tracking-widest text-xs uppercase animate-pulse">Loading Tracking Information...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen w-full max-w-full flex flex-col items-center justify-center bg-dragon-black p-4 text-center">
        <div className="glass-card max-w-md p-8 border-red-500/10 bg-red-500/5 space-y-4">
          <AlertCircle size={48} className="text-red-500 mx-auto" />
          <h2 className="text-xl font-bold font-display text-white">Order Not Found</h2>
          <p className="text-sm text-gray-500">{error || "The tracking code matches no active order in our system."}</p>
          <div className="pt-2">
            <Link to="/" className="inline-block px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border border-white/10">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(order.status);
  const hasGps = typeof order.latitude === 'number' && typeof order.longitude === 'number';
  
  // Format Display Names safely
  const customerName = order.customerName || order.name || 'Anonymous Valued Customer';
  const customerPhone = order.customerPhone || order.phone || 'N/A';
  const customerAddress = order.customerAddress || order.address || 'N/A';
  const billAmount = order.totalBill || order.totalPrice || order.price || 0;

  const handleOpenGoogleMaps = () => {
    if (hasGps) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${order.latitude},${order.longitude}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-dragon-black text-white relative flex flex-col items-center pb-20">
      {/* Background decoration */}
      <div className="absolute top-0 inset-x-0 h-96 bg-[radial-gradient(circle_at_top,rgba(6,182,212,0.08)_0%,transparent_100%)] pointer-events-none" />

      {/* Primary Header Container */}
      <header className="w-full max-w-4xl px-4 pt-12 pb-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-dragon-cyan/20 flex items-center justify-center text-dragon-cyan">
            <Truck size={22} />
          </div>
          <div>
            <h1 className="text-lg font-black font-display uppercase tracking-widest text-white flex items-center gap-2">
              Dragon <span className="text-dragon-cyan">Track</span>
            </h1>
            <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Live Order Location Hub</p>
          </div>
        </div>
        <div className="text-right font-mono text-[10px] text-zinc-500">
          ORDER ID: <span className="text-zinc-300 select-all font-bold">{orderId?.substring(0, 12).toUpperCase()}</span>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="w-full max-w-4xl px-4 grid grid-cols-1 md:grid-cols-12 gap-6 z-10 shrink-0">
        
        {/* Status and Steps column */}
        <div className="md:col-span-8 space-y-6">
          {/* Tracking Status Card */}
          <div className="glass-card p-6 md:p-8 space-y-6">
            <div className="flex justify-between items-start gap-4">
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Parcel Status</p>
                <h2 className="text-2xl font-bold font-display tracking-tight text-white mt-1">{statusConfig.label}</h2>
              </div>
              <div className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border flex items-center gap-2 ${statusConfig.color}`}>
                {statusConfig.icon}
                {order.status || 'Pending'}
              </div>
            </div>

            {/* Stepper Progress UI */}
            <div className="relative pt-4">
              <div className="absolute left-4 top-[24px] right-4 h-0.5 bg-white/5 z-0" />
              <div 
                className="absolute left-4 top-[24px] h-0.5 bg-gradient-to-r from-dragon-cyan to-dragon-purple z-0 transition-all duration-750" 
                style={{ width: `${((statusConfig.step - 1) / 3) * 100}%` }}
              />

              <div className="relative flex justify-between z-10 w-full">
                {[
                  { step: 1, label: 'Placed', labelBn: 'Order Placed' },
                  { step: 2, label: 'Confirmed', labelBn: 'Confirmed' },
                  { step: 3, label: 'Courier', labelBn: 'Handed to Courier' },
                  { step: 4, label: 'Delivered', labelBn: 'Delivered' },
                ].map((s) => {
                  const isActive = s.step <= statusConfig.step;
                  const isCurrent = s.step === statusConfig.step;
                  return (
                    <div key={s.step} className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isCurrent 
                          ? 'bg-dragon-cyan text-black shadow-[0_0_15px_rgba(6,182,212,0.5)] scale-110' 
                          : isActive 
                            ? 'bg-dragon-cyan/20 border-2 border-dragon-cyan text-dragon-cyan' 
                            : 'bg-white/5 border border-white/10 text-gray-600'
                      }`}>
                        {isActive && s.step < statusConfig.step ? (
                          <CheckCircle2 size={16} />
                        ) : (
                          <span className="text-xs font-bold font-mono">{s.step}</span>
                        )}
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-tight mt-2 ${isActive ? 'text-white' : 'text-zinc-600'}`}>{s.label}</span>
                      <span className={`text-[8px] tracking-tighter mt-0.5 ${isActive ? 'text-gray-400' : 'text-zinc-700'}`}>{s.labelBn}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Google Maps Interactive GPS Section */}
          {hasGps && (
            <div className="glass-card p-6 md:p-8 space-y-4 bg-gradient-to-b from-dragon-black to-dragon-cyan/[0.01]">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-dragon-cyan/20 text-dragon-cyan rounded-lg">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white uppercase tracking-tighter">Customer Live GPS Radar</h3>
                    <p className="text-[10px] text-gray-500 uppercase font-black">GPS Navigator Coordinates</p>
                  </div>
                </div>
                <div className="px-2.5 py-1 bg-dragon-cyan/10 border border-dragon-cyan/20 rounded-full text-[9px] font-black font-mono text-dragon-cyan tracking-wider uppercase flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-dragon-cyan animate-ping" /> GPS Verified
                </div>
              </div>

              {/* Dynamic Coordinate Radar UI representation */}
              <div className="relative h-44 bg-black/40 border border-white/10 rounded-2xl overflow-hidden flex items-center justify-center">
                {/* Radial radar waves */}
                <div className="absolute inset-x-0 inset-y-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.06)_0%,transparent_70%)]" />
                <div className="absolute w-32 h-32 border border-dragon-cyan/25 rounded-full animate-pulse" />
                <div className="absolute w-20 h-20 border border-dragon-cyan/40 rounded-full animate-ping" />
                
                {/* Simulated Grid overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:20px_20px]" />
                
                {/* Location Marker */}
                <motion.div 
                  className="z-10 bg-dragon-cyan/20 p-4 border border-dragon-cyan/50 rounded-full shadow-[0_0_25px_rgba(6,182,212,0.3)] flex flex-col items-center"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <MapPin size={24} className="text-dragon-cyan animate-bounce" />
                </motion.div>

                {/* Info Text Overlay */}
                <div className="absolute bottom-4 inset-x-4 bg-black/80 backdrop-blur border border-white/10 p-2.5 rounded-xl flex justify-between items-center flex-wrap sm:flex-nowrap gap-2">
                  <div className="text-left font-mono text-[9px] text-zinc-400 leading-tight">
                    <div>LATITUDE: <span className="text-white font-bold">{order.latitude?.toFixed(6)}</span></div>
                    <div>LONGITUDE: <span className="text-white font-bold">{order.longitude?.toFixed(6)}</span></div>
                  </div>
                  <button 
                    onClick={handleOpenGoogleMaps}
                    className="px-3 py-1.5 bg-dragon-cyan hover:bg-dragon-cyan/90 text-black font-extrabold text-[10px] uppercase font-mono rounded-lg transition-all flex items-center gap-1 shrink-0"
                  >
                    <Navigation size={10} /> Navigate
                  </button>
                </div>
              </div>

              {/* Big primary CTA Button to navigate */}
              <button
                onClick={handleOpenGoogleMaps}
                className="w-full py-4 bg-gradient-to-r from-dragon-cyan to-dragon-purple hover:scale-[1.01] hover:brightness-110 active:scale-95 text-black font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2.5 transition-all shadow-xl rounded-xl cursor-pointer"
              >
                <Navigation size={18} className="fill-black" />
                View customer location on Google Maps (Direct Navigation)
              </button>
            </div>
          )}
        </div>

        {/* Invoice details column */}
        <div className="md:col-span-4 space-y-6">
          {/* Order Summary Card */}
          <div className="glass-card p-6 md:p-8 space-y-4">
            <h3 className="font-bold text-white uppercase tracking-tighter text-sm">Bill & Order Details</h3>
            
            <div className="border-t border-white/5 pt-3 space-y-3">
              {order.productName && (
                <div className="flex justify-between text-xs py-1">
                  <span className="text-gray-500">Item:</span>
                  <span className="text-white font-bold text-right max-w-[140px] truncate">{order.productName}</span>
                </div>
              )}
              {order.quantity && (
                <div className="flex justify-between text-xs py-1">
                  <span className="text-gray-500">Quantity:</span>
                  <span className="text-white font-bold">{order.quantity} Pcs</span>
                </div>
              )}
              <div className="flex justify-between text-xs py-1">
                <span className="text-gray-500">Total Bill:</span>
                <span className="text-dragon-cyan font-bold font-mono text-sm leading-none">৳{billAmount}</span>
              </div>
              <div className="flex justify-between text-xs py-1">
                <span className="text-gray-500">Payment Method:</span>
                <span className="text-white text-[10px] font-black uppercase tracking-wider bg-white/5 border border-white/10 px-2 py-0.5 rounded leading-none">{order.paymentMethod || 'Cash On Delivery'}</span>
              </div>
            </div>
          </div>

          {/* Customer Profile Summary */}
          <div className="glass-card p-6 md:p-8 space-y-4">
            <div className="flex items-center gap-2">
              <User size={16} className="text-gray-500" />
              <h3 className="font-bold text-white uppercase tracking-tighter text-sm">Customer Profile</h3>
            </div>
            
            <div className="border-t border-white/5 pt-3 space-y-3.5">
              <div className="space-y-0.5 text-left">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-0.5">Name</label>
                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-xs text-white font-medium">{customerName}</div>
              </div>

              <div className="space-y-0.5 text-left">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-0.5">Mobile Number</label>
                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-xs text-dragon-cyan font-mono font-bold flex items-center justify-between">
                  <span>{customerPhone}</span>
                  {customerPhone !== 'N/A' && (
                    <a href={`tel:${customerPhone}`} className="text-[9px] font-black uppercase text-white bg-dragon-cyan/20 hover:bg-dragon-cyan/30 px-2.5 py-1 rounded-lg">Call</a>
                  )}
                </div>
              </div>

              <div className="space-y-0.5 text-left">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-0.5">Delivery Address</label>
                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-xs text-gray-300 leading-relaxed min-h-[50px]">{customerAddress}</div>
              </div>
            </div>
          </div>

          {/* Quick share button for drivers */}
          <button 
            type="button"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'Order Status Tracking',
                  text: `Tracking order for ${customerName}`,
                  url: window.location.href,
                }).catch(console.error);
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert("Tracking link copied to clipboard!");
              }
            }}
            className="w-full py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Share2 size={14} /> Share Tracking Link
          </button>

        </div>
      </main>
    </div>
  );
}
