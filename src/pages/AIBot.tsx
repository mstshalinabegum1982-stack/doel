import React, { useState, useEffect, useContext } from 'react';
import { collection, query, where, onSnapshot, collectionGroup, updateDoc, doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { AuthContext } from '../authContext';
import { PageContainer } from '../components/Navigation';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Copy, 
  Check, 
  Image as ImageIcon, 
  Hash, 
  FileType, 
  ChevronRight,
  TrendingUp,
  Cpu,
  Smartphone,
  Minus,
  MessageCircle,
  ExternalLink,
  Forward,
  Truck,
  Info,
  Wallet,
  Clock,
  CheckCircle,
  X,
  ArrowUpRight,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { BrandSvgIcon } from '../components/BrandSvgIcon';

export default function AIBot() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [input, setInput] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    title?: string;
    details?: string;
    hashtags?: { tiktok: string, youtube: string, facebook: string };
    keywords?: string;
  } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<'send' | 'receive'>('send');
  const [automationConfigs, setAutomationConfigs] = useState<any[]>([]);
  const [receiveTab, setReceiveTab] = useState<string>('all');

  
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'magic_box'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      setAutomationConfigs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  const activePlatforms = automationConfigs
    .filter(c => c.status === 'active')
    .map(c => c.platform);

  // Mock orders across all messaging channels including Line, WeChat, Telegram, TikTok, Viber
  const [orders, setOrders] = useState<any[]>([
    { 
      id: '1', 
      customer: 'Rahim Ahmed', 
      product: '1x Silk Panjabi', 
      address: 'Dhaka, Bangladesh', 
      platform: 'messenger', 
      phone: '01712345678',
      status: 'pending',
      isForwarded: false
    },
    { 
      id: '2', 
      customer: 'Sumaiya Khan', 
      product: '2x Face Serum', 
      address: 'Sylhet, Bangladesh', 
      platform: 'whatsapp', 
      phone: '01812345678',
      status: 'pending',
      isForwarded: true,
      forwardedToName: 'Dragon Express Logistics'
    },
    { 
      id: '3', 
      customer: 'Lin Wei', 
      product: '3x Organic Jasmine Tea', 
      address: 'Guangzhou / Dhaka Hub', 
      platform: 'wechat', 
      phone: '01912345678',
      status: 'pending',
      isForwarded: false
    },
    { 
      id: '4', 
      customer: 'Kenji Sato', 
      product: '1x Wireless Gaming Headset', 
      address: 'Chittagong, Bangladesh', 
      platform: 'line', 
      phone: '01612345678',
      status: 'pending',
      isForwarded: false
    },
    { 
      id: '5', 
      customer: 'Alexey Romanov', 
      product: '1x Smart Watch Ultra', 
      address: 'Rajshahi, Bangladesh', 
      platform: 'telegram', 
      phone: '01512345678',
      status: 'pending',
      isForwarded: false
    },
    { 
      id: '6', 
      customer: 'Karim Ullah', 
      product: '1x RGB Gaming Mouse', 
      address: 'Chittagong, Bangladesh', 
      platform: 'messenger', 
      phone: '01912345678',
      status: 'shipping',
      isForwarded: false,
      courierName: 'RedX',
      courierNote: 'Assigning rider for pickup.'
    },
  ]);

  const filteredOrders = orders.filter(order => {
    if (receiveTab === 'all') return true;
    return order.platform === receiveTab;
  });

  const handleForward = (orderId: string) => {
    setOrders(prev => prev.map(o => 
      o.id === orderId 
        ? { ...o, isForwarded: true, forwardedToName: 'Sub-Agent #102' } 
        : o
    ));
  };

  const handleShip = (orderId: string) => {
    setOrders(prev => prev.map(o => 
      o.id === orderId 
        ? { ...o, status: 'shipping', courierName: 'Selecting...', courierNote: 'AI is mapping courier API...' } 
        : o
    ));
  };

  const handleGenerate = async () => {
    if (!input && !image) {
      alert('Please enter a product description or upload an image first!');
      return;
    }
    setLoading(true);
    setResults(null);

    try {
      const response = await fetch('/api/ai/generate-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, image })
      });
      
      if (!response.ok) {
        let errorMessage = `API failed with status ${response.status}`;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } else {
          const text = await response.text();
          if (text.includes("UNAVAILABLE") || text.includes("high demand")) {
            errorMessage = "DOELpro AI is currently busy (High Demand). Please try again in 1-2 minutes.";
          }
        }
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid response from server. Please try again.");
      }

      const data = await response.json();
      setResults(data);
    } catch (e) {
      console.error(e);
      alert('Generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <PageContainer title="ORDER BOX">
      <div className="space-y-4 pb-20">
        {/* Header Visual */}
        <div className="glass-card p-3 bg-gradient-to-br from-dragon-cyan/10 to-dragon-purple/10 border-dragon-cyan/20 flex items-center gap-3">
           <div className="w-10 h-10 rounded-xl bg-dragon-cyan/20 flex items-center justify-center animate-dragon-pulse">
              <Bot size={20} className="text-dragon-cyan" />
           </div>
           <div>
              <h2 className="text-base font-display font-bold uppercase tracking-tighter leading-tight">Order Box</h2>
              <p className="text-[9px] text-gray-500 font-light truncate">Direct sales and AI order collection.</p>
           </div>
        </div>

        {/* Mode Selector */}
        <div className="flex gap-1.5 p-1 bg-white/5 rounded-xl">
           <button 
             onClick={() => setActiveMode('send')}
             className={cn(
               "flex-1 py-2 px-4 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all",
               activeMode === 'send' ? "bg-dragon-cyan text-dragon-black shadow-lg" : "text-gray-500 hover:text-white"
             )}
           >
             Send Order
           </button>
           <button 
             onClick={() => setActiveMode('receive')}
             className={cn(
               "flex-1 py-2 px-4 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all",
               activeMode === 'receive' ? "bg-dragon-cyan text-dragon-black shadow-lg" : "text-gray-500 hover:text-white"
             )}
           >
             Receive Order
           </button>
        </div>

        <AnimatePresence mode="wait">
           {activeMode === 'send' ? (
             <motion.div key="send" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
               {/* Input Box */}
               <div className="glass-card p-3 space-y-2.5">
                  <div className="relative">
                     <textarea
                       value={input}
                       onChange={(e) => setInput(e.target.value)}
                       placeholder="Describe your product (listing generator)..."
                       className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 min-h-[80px] outline-none focus:border-dragon-cyan transition-all font-light text-xs"
                     />
                     <div className="absolute bottom-2.5 right-2.5 flex items-center gap-2">
                        <label className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-dragon-cyan transition-colors cursor-pointer">
                           <ImageIcon size={16} />
                           <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </label>
                     </div>
                  </div>
                  
                  {image && (
                    <div className="relative w-12 h-12 group">
                       <img src={image} className="w-full h-full object-cover rounded-lg border border-white/20" />
                       <button onClick={() => setImage(null)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[7px]">✕</button>
                    </div>
                  )}

                  <button 
                     onClick={handleGenerate}
                     disabled={loading}
                     className="w-full py-2.5 dragon-gradient text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all font-display text-xs hover:scale-[1.02] active:scale-95"
                  >
                     {loading ? (
                       <>
                         <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                         GENERATING...
                       </>
                     ) : (
                       <>
                         <Cpu size={18} /> GENERATE LISTING
                       </>
                     )}
                  </button>
               </div>

              {results && (
                 <div className="space-y-6">
                    <ResultCard 
                       title="Product Title" 
                       icon={<FileType size={18} />} 
                       content={results.title || ''} 
                       onCopy={() => copyToClipboard(results.title || '', 'title')}
                       isCopied={copied === 'title'}
                    />
                    <ResultCard 
                       title="Persuasive Details" 
                       icon={<Sparkles size={18} />} 
                       content={results.details || ''} 
                       onCopy={() => copyToClipboard(results.details || '', 'details')}
                       isCopied={copied === 'details'}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <ResultCard 
                         title="Viral Hashtags" 
                         icon={<Hash size={18} />} 
                         content={`TikTok: ${results.hashtags?.tiktok}\nYT: ${results.hashtags?.youtube}\nFB: ${results.hashtags?.facebook}`} 
                         onCopy={() => copyToClipboard(`${results.hashtags?.tiktok} ${results.hashtags?.youtube} ${results.hashtags?.facebook}`, 'hashtags')}
                         isCopied={copied === 'hashtags'}
                       />
                       <ResultCard 
                         title="SEO Keywords" 
                         icon={<TrendingUp size={18} />} 
                         content={results.keywords || ''} 
                         onCopy={() => copyToClipboard(results.keywords || '', 'keywords')}
                         isCopied={copied === 'keywords'}
                       />
                    </div>
                 </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="receive" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
               {/* Receive Mode Tabs */}
               <div className="flex gap-1.5 p-1.5 bg-white/5 rounded-2xl overflow-x-auto scrollbar-none">
                  {[
                    { id: 'all', label: 'All Channels' },
                    { id: 'messenger', label: 'Messenger' },
                    { id: 'whatsapp', label: 'WhatsApp' },
                    { id: 'line', label: 'Line' },
                    { id: 'wechat', label: 'WeChat' },
                    { id: 'telegram', label: 'Telegram' },
                    { id: 'viber', label: 'Viber' },
                    { id: 'tiktok', label: 'TikTok' }
                  ].map((tab) => (
                    <button 
                      key={tab.id}
                      onClick={() => setReceiveTab(tab.id)}
                      className={cn(
                        "py-2 px-3 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer",
                        receiveTab === tab.id 
                          ? "bg-dragon-cyan text-dragon-black font-extrabold shadow-md" 
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      )}
                    >
                      {tab.id !== 'all' && <BrandSvgIcon platform={tab.id} variant="badge" badgeSizeClass="w-5 h-5 rounded-md" size={11} />}
                      <span>{tab.label}</span>
                    </button>
                  ))}
               </div>

               <div className="glass-card p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-display font-bold flex items-center gap-2">
                       <Smartphone size={18} className="text-dragon-cyan" /> 
                       {receiveTab === 'all' ? 'Collected Orders' : `${receiveTab.toUpperCase()} Orders`}
                    </h3>
                    <span className="text-[10px] font-black text-gray-500 bg-white/5 px-2 py-1 rounded-md uppercase tracking-tighter">
                      {filteredOrders.length} Ready
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {filteredOrders.map(order => (
                      <div 
                        key={order.id} 
                        className={cn(
                          "p-4 rounded-2xl border transition-all group overflow-hidden relative",
                          order.isForwarded 
                            ? "bg-white/[0.02] border-white/5 grayscale opacity-80" 
                            : "bg-white/5 border-white/5 hover:border-dragon-cyan/30"
                        )}
                      >
                         {/* Forward Label */}
                         {order.isForwarded && (
                           <div className="absolute top-0 right-0 py-1 px-3 bg-white/10 text-[7px] font-black uppercase tracking-widest text-gray-400 rounded-bl-xl border-l border-b border-white/5">
                             Forwarded
                           </div>
                         )}

                         <div className="flex gap-3.5 items-center text-left">
                            <BrandSvgIcon platform={order.platform} variant="badge" badgeSizeClass="w-8 h-8 rounded-xl" size={16} />
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black uppercase text-gray-400 group-hover:text-dragon-cyan transition-colors">
                                  {order.platform} Order
                                </p>
                                <p className="text-xs font-bold text-white truncate">{order.customer} - {order.product}</p>
                                <p className="text-[10px] text-gray-500 truncate">Loc: {order.address}</p>
                            </div>
                            
                            <div className="flex gap-2">
                               {!order.isForwarded && order.status === 'pending' && (
                                 <>
                                   <button 
                                     onClick={() => handleForward(order.id)}
                                     className="p-2 bg-white/5 text-gray-400 rounded-lg hover:text-dragon-cyan transition-colors"
                                     title="Forward Order"
                                   >
                                     <Forward size={16} />
                                   </button>
                                   <button 
                                     onClick={() => handleShip(order.id)}
                                     className="p-2 bg-dragon-cyan/20 text-dragon-cyan rounded-lg hover:bg-dragon-cyan hover:text-dragon-black transition-all"
                                     title="Ship Now"
                                   >
                                     <Truck size={16} />
                                   </button>
                                 </>
                               )}

                               {order.platform === 'whatsapp' && (
                                 <a 
                                   href={`https://wa.me/${order.phone}`} 
                                   target="_blank" 
                                   rel="noreferrer"
                                   className="p-2 bg-green-500 text-white rounded-lg hover:scale-110 active:scale-95 transition-all shadow-lg shadow-green-500/20"
                                 >
                                   <MessageCircle size={16} />
                                 </a>
                               )}
                            </div>
                         </div>

                         {/* Footer info (Forwarded to / Courier Note) */}
                         {(order.isForwarded || order.courierNote) && (
                            <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                               {order.isForwarded && (
                                 <div className="flex items-center gap-2 text-[9px] font-bold text-dragon-cyan/60 italic">
                                    <Forward size={10} /> Forwarded to: {order.forwardedToName}
                                 </div>
                               )}
                               {order.courierNote && (
                                 <div className="flex items-start gap-2 p-2 bg-white/5 rounded-lg border border-white/5">
                                    <Info size={10} className="mt-0.5 text-dragon-cyan shrink-0" />
                                    <div className="flex-1">
                                      <p className="text-[9px] font-black uppercase text-gray-500">{order.courierName || 'Courier'} Update</p>
                                      <p className="text-[10px] text-gray-300 italic">{order.courierNote}</p>
                                    </div>
                                 </div>
                               )}
                            </div>
                         )}
                      </div>
                    ))}

                    {filteredOrders.length === 0 && (
                      <div className="py-12 text-center space-y-3">
                         <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto text-gray-600">
                            <Smartphone size={24} />
                         </div>
                         <p className="text-xs text-gray-500 opacity-60 italic">No {receiveTab !== 'all' ? receiveTab : 'social'} orders found yet.</p>
                      </div>
                    )}
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </PageContainer>
  );
}

function ResultCard({ title, icon, content, onCopy, isCopied }: { title: string, icon: React.ReactNode, content: string, onCopy: () => void, isCopied: boolean }) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="px-3 py-2 bg-white/5 border-b border-white/5 flex justify-between items-center">
         <div className="flex items-center gap-2 text-dragon-cyan font-bold text-[9px] tracking-widest uppercase">
            {icon}
            {title}
         </div>
         <button onClick={onCopy} className="text-gray-500 hover:text-white transition-colors">
            {isCopied ? <Check size={14} className="text-dragon-emerald" /> : <Copy size={14} />}
         </button>
      </div>
      <div className="p-3 text-[11px] font-light text-gray-300 whitespace-pre-wrap leading-relaxed">
        {content}
      </div>
    </div>
  );
}
