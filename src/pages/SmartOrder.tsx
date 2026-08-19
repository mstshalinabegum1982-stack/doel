import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { InventoryItem, UserProfile, Order } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Phone, User, ShoppingBag, CheckCircle, Package, Send, Sparkles, Loader2, Zap } from 'lucide-react';
import { generateId, cn } from '../lib/utils';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';

export default function SmartOrder() {
  const { productId, userId } = useParams();
  const [product, setProduct] = useState<InventoryItem | null>(null);
  const [vendor, setVendor] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'landing' | 'location' | 'form' | 'success'>('landing');
  
  // Order Stats
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsAddress, setGpsAddress] = useState('');
  const [revGeocodeLoading, setRevGeocodeLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    async function fetchData() {
      if (!productId || !userId) return;
      try {
        const pDoc = await getDoc(doc(db, 'inventory', productId));
        const vDoc = await getDoc(doc(db, 'users', userId));
        
        if (pDoc.exists()) setProduct({ id: pDoc.id, ...pDoc.data() } as InventoryItem);
        if (vDoc.exists()) setVendor({ uid: vDoc.id, ...vDoc.data() } as UserProfile);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [productId, userId]);

  const reverseGeocodeAddress = async (lat: number, lng: number) => {
    setRevGeocodeLoading(true);
    try {
      let addr = '';
      if (GOOGLE_MAPS_KEY) {
        const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_KEY}`);
        const data = await res.json();
        if (data.results?.[0]) {
          addr = data.results[0].formatted_address;
        }
      } else {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        if (data.display_name) {
          addr = data.display_name;
        }
      }
      if (addr) {
        setGpsAddress(addr);
        setFormData(prev => ({ ...prev, address: addr }));
      }
    } catch (e) {
      console.error("Geocoding error", e);
    } finally {
      setRevGeocodeLoading(false);
    }
  };

  useEffect(() => {
    if (navigator.geolocation && navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((result) => {
        if (result.state === 'granted') {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              setLocation({ lat: latitude, lng: longitude });
              await reverseGeocodeAddress(latitude, longitude);
            },
            undefined,
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 600000 }
          );
        }
      }).catch(err => {
        console.warn("Permissions query failed:", err);
      });
    }
  }, []);

  const handleStartOrder = () => {
    if (location) {
      setStep('form');
    } else {
      setStep('location');
    }
  };

  const handleAllowLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      setStep('form');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        setStep('form');
        await reverseGeocodeAddress(latitude, longitude);
      },
      (error) => {
        console.error(error);
        alert('Permission denied or location not found. Please enter manually.');
        setStep('form');
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !vendor) return;

    const newOrder: any = {
      id: generateId(),
      participants: [userId, 'customer_public'],
      senderId: 'customer_public',
      receiverId: userId,
      productName: product.name,
      productImage: product.image || '',
      buyPrice: product.buyPrice,
      sellPrice: product.sellPrice,
      deliveryCharge: 60, // Default
      customerName: formData.name,
      customerPhone: formData.phone,
      customerAddress: formData.address,
      latitude: location?.lat || null,
      longitude: location?.lng || null,
      gpsAddress: gpsAddress || null,
      trackingMethod: location ? 'gps' : 'manual',
      status: 'pending',
      platform: 'landing_page',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'orders'), newOrder);
      setStep('success');
    } catch (err) {
      alert('Order failed. Please try again.');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-dragon-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-dragon-cyan border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!product) return (
    <div className="min-h-screen bg-dragon-black flex items-center justify-center text-white">
      Product not found.
    </div>
  );

  return (
    <div className="min-h-screen bg-dragon-black text-white font-sans selection:bg-dragon-cyan selection:text-dragon-black">
      <div className="max-w-md mx-auto min-h-screen flex flex-col relative overflow-hidden px-4 py-8">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-dragon-cyan/10 blur-[100px] -z-10" />
        
        <header className="flex flex-col items-center mb-8">
           {vendor?.profileImage ? (
             <img src={vendor.profileImage} className="w-16 h-16 rounded-2xl object-cover mb-3 border border-white/10" alt="" referrerPolicy="no-referrer" />
           ) : (
             <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-dragon-cyan/10 to-purple-500/10 border border-white/10 flex items-center justify-center font-black text-2xl text-dragon-cyan mb-3">
               {vendor?.name?.[0]?.toUpperCase() || '?'}
             </div>
           )}
           <h1 className="text-sm font-black uppercase tracking-[0.3em] text-dragon-cyan">{vendor?.name} SHOWCASE</h1>
        </header>

        <AnimatePresence mode="wait">
          {step === 'landing' && (
            <motion.div 
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6 flex-1 flex flex-col"
            >
              <div className="aspect-square rounded-3xl overflow-hidden border border-white/10 bg-white/5 relative group">
                <img src={product.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80'} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                  <h2 className="text-2xl font-black">{product.name}</h2>
                  <p className="text-dragon-cyan font-black text-xl">৳{product.sellPrice}</p>
                </div>
              </div>

              <div className="glass-card p-6 space-y-4">
                 <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Product Features</h3>
                 <div className="space-y-2">
                    {product.details ? (
                      <p className="text-sm text-gray-300 leading-relaxed italic">"{product.details}"</p>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No details provided for this premium item.</p>
                    )}
                 </div>
                 <div className="flex flex-wrap gap-2 pt-2">
                    {product.color && <span className="px-3 py-1 bg-white/5 rounded-lg text-[10px] uppercase font-bold text-gray-400 border border-white/5">{product.color}</span>}
                    {product.size && <span className="px-3 py-1 bg-white/5 rounded-lg text-[10px] uppercase font-bold text-gray-400 border border-white/5">{product.size}</span>}
                    {product.weight && <span className="px-3 py-1 bg-white/5 rounded-lg text-[10px] uppercase font-bold text-gray-400 border border-white/5">{product.weight}</span>}
                 </div>
              </div>

              <div className="mt-auto">
                 <button 
                   onClick={handleStartOrder}
                   className="w-full py-5 bg-dragon-cyan text-dragon-black font-black text-base uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-dragon-cyan/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                 >
                   <ShoppingBag size={20} />
                   Order Now
                 </button>
              </div>
            </motion.div>
          )}

          {step === 'location' && (
            <motion.div 
              key="location"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex-1 flex flex-col items-center justify-center text-center space-y-8"
            >
              <div className="w-24 h-24 bg-dragon-cyan/10 rounded-full flex items-center justify-center text-dragon-cyan animate-pulse">
                <MapPin size={48} />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-black uppercase tracking-tight">Location Access</h2>
                <p className="text-gray-400 text-sm max-w-[280px] mx-auto leading-relaxed">Your precise location is required for fast delivery. Please grant location permission.</p>
              </div>
              <button 
                onClick={handleAllowLocation}
                className="w-full py-5 bg-dragon-cyan text-dragon-black font-black text-sm uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-dragon-cyan/20 active:scale-95 transition-all"
              >
                Allow Location Access
              </button>
              <button 
                onClick={() => setStep('form')}
                className="text-[10px] font-black uppercase text-gray-500 tracking-widest hover:text-white transition-colors"
              >
                Skip, Enter Manually
              </button>
            </motion.div>
          )}

          {step === 'form' && (
            <motion.div 
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-dragon-cyan/10 rounded-lg text-dragon-cyan">
                    <User size={18} />
                 </div>
                 <h2 className="text-lg font-black uppercase tracking-widest">Delivery Info</h2>
              </div>

              <form onSubmit={handleSubmitOrder} className="space-y-5">
                <SmartInput 
                  label="Name" 
                  icon={<User size={16} />} 
                  value={formData.name} 
                  onChange={v => setFormData({...formData, name: v})} 
                  placeholder="Your Name"
                />
                <SmartInput 
                  label="Phone Number" 
                  icon={<Phone size={16} />} 
                  value={formData.phone} 
                  onChange={v => setFormData({...formData, phone: v})} 
                  placeholder="Your Phone Number"
                />
                <div className="space-y-1">
                   <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Delivery Address</label>
                   <div className="relative">
                      <textarea 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 outline-none focus:border-dragon-cyan/50 text-sm min-h-[100px] resize-none"
                        value={formData.address}
                        onChange={e => setFormData({...formData, address: e.target.value})}
                        placeholder="Your Detailed Address"
                        required
                      />
                      {revGeocodeLoading && (
                        <div className="absolute top-4 right-4 text-dragon-cyan animate-pulse">
                          <Loader2 className="animate-spin" size={16} />
                        </div>
                      )}
                   </div>
                   {location && (
                     <div className="flex items-center gap-1 mt-1 text-[8px] font-bold text-dragon-cyan uppercase">
                       <Zap size={10} className="fill-current" />
                       GPS Location Detected Successfully
                     </div>
                   )}
                </div>

                <button 
                  type="submit"
                  className="w-full py-5 bg-dragon-cyan text-dragon-black font-black text-sm uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-dragon-cyan/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Package size={18} />
                  Confirm Order
                </button>
              </form>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center space-y-8"
            >
              <div className="w-24 h-24 bg-dragon-cyan/10 rounded-full flex items-center justify-center text-dragon-cyan shadow-[0_0_50px_rgba(45,212,191,0.2)]">
                <CheckCircle size={48} />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-black uppercase tracking-tight">Order Received!</h2>
                <p className="text-gray-400 text-sm max-w-[280px] mx-auto leading-relaxed">The order has been received successfully. We will call you soon to confirm.</p>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="px-8 py-4 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all"
              >
                Back to Shop
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="mt-auto py-8 text-center space-y-4">
           <div className="flex items-center justify-center gap-6 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
              <Sparkles className="text-dragon-cyan" size={16} />
              <Package size={16} />
              <Zap className="text-dragon-cyan" size={16} />
           </div>
           <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.4em]">Powered by DOELpro Nexus</p>
        </footer>
      </div>
    </div>
  );
}

function SmartInput({ label, icon, value, onChange, placeholder, type = 'text' }: any) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-dragon-cyan transition-colors">
          {icon}
        </div>
        <input 
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-dragon-cyan/50 text-sm transition-all"
        />
      </div>
    </div>
  );
}
