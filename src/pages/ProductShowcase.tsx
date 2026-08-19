import React, { useState, useEffect, useContext } from 'react';
import { getCachedDoc } from '../utils/firestoreCache';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, 
  ShoppingBag, 
  MoreVertical, 
  Copy, 
  ExternalLink, 
  Edit3, 
  Trash2, 
  MessageSquare,
  Bot, 
  Plus, 
  Search, 
  Sparkles, 
  Check, 
  Layers, 
  ShieldCheck, 
  Layout, 
  Share2, 
  Eye, 
  RefreshCw,
  Filter,
  Clock,
  Settings,
  Smartphone,
  BarChart3,
  ChevronRight,
  Youtube,
  Image as ImageIcon,
  UploadCloud,
  X,
  Zap,
  CreditCard,
  Phone,
  Truck,
  Star,
  Tag,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, deleteDoc, updateDoc, setDoc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AuthContext } from '../authContext';
import { cn } from '../lib/utils';
import BottomNav from '../components/Navigation';
import CustomDomainSetupTab from '../components/CustomDomainSetupTab';
import { SuccessModal } from '../components/SuccessModal';
import { RealPaymentGatewayModal } from '../components/RealPaymentGatewayModal';
import { ReviewsPanel } from '../components/ReviewsPanel';
import { getCurrencySymbol, getDefaultDeliveryConfig } from '../utils/countriesData';
import {
  LandingPageData,
  ProWebsiteData,
  CustomDeliveryCharge,
  StoreCategory,
  CatalogSubscription,
  UserProfile,
  StoreHeaderNav,
  MySitesTab,
  MyCatalogTab,
  QuickProductPreviewModal,
  CatalogPreviewModal,
  WebsiteProductSelectorModal,
  ProductConfigModal,
  MyCatalogPriceModal,
  ProWebsiteActivationModal,
  DragonBotActivationModal,
  CatalogActivationModal,
  CatalogBkashGatewayModal
} from '../components/store';

const compressBase64Maybe = (src: string, maxWidth = 400, maxHeight = 400, quality = 0.4): Promise<string> => {
  if (!src || !src.startsWith('data:image')) {
    return Promise.resolve(src);
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(src);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(src);
  });
};

const getCreatedTime = (website: any) => {
  if (!website.createdAt) return Date.now();
  if (typeof website.createdAt === 'string') {
    return new Date(website.createdAt).getTime();
  }
  if (website.createdAt.seconds) {
    return website.createdAt.seconds * 1000;
  }
  if (website.createdAt.toDate) {
    return website.createdAt.toDate().getTime();
  }
  return new Date(website.createdAt).getTime();
};

const isProWebsiteExpired = (website: any) => {
  if (website.paymentStatus === 'approved' || website.paymentStatus === 'pending') {
    return false;
  }
  const createdTime = getCreatedTime(website);
  const trialExpiry = createdTime + 72 * 60 * 60 * 1000;
  return Date.now() > trialExpiry;
};

const ProWebsiteTimer = ({ website, onActivate }: { website: any; onActivate?: () => void }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [expired, setExpired] = useState<boolean>(false);

  useEffect(() => {
    const updateTimer = () => {
      const createdTime = getCreatedTime(website);
      const trialExpiry = createdTime + 72 * 60 * 60 * 1000;
      const diff = trialExpiry - Date.now();

      if (diff <= 0) {
        setExpired(true);
        setTimeLeft('Expired');
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s left`);
        setExpired(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [website.createdAt, website.paymentStatus]);

  if (website.paymentStatus === 'approved') {
    return (
      <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest text-emerald-400">
        Approved & Active
      </span>
    );
  }

  if (website.paymentStatus === 'pending') {
    return (
      <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest text-amber-400 animate-pulse">
        Pending
      </span>
    );
  }

  if (expired) {
    return (
      <span
        onClick={onActivate}
        className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest text-rose-400 cursor-pointer hover:bg-rose-500/25 active:scale-95 transition-all flex items-center gap-1 animate-pulse shadow-md border-rose-500/30"
        title="Click to Activate"
      >
        Expired <Zap size={10} className="text-rose-400 animate-bounce" />
      </span>
    );
  }

  return (
    <span className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[9px] font-mono font-black uppercase tracking-widest text-blue-400 flex items-center gap-1">
      <Clock size={10} className="animate-spin text-blue-400" /> {timeLeft}
    </span>
  );
};

const MyCatalogTimer = ({ sub, onActivate }: { sub: any; onActivate?: () => void }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [expired, setExpired] = useState<boolean>(false);

  useEffect(() => {
    if (!sub || sub.paymentStatus !== 'trial') return;

    const updateTimer = () => {
      const expiry = sub.trialExpiresAt ? new Date(sub.trialExpiresAt).getTime() : 0;
      const diff = expiry - Date.now();

      if (diff <= 0) {
        setExpired(true);
        setTimeLeft('Expired');
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        let displayStr = '';
        if (days > 0) {
          displayStr += `${days}d `;
        }
        displayStr += `${hours}h ${minutes}m ${seconds}s left`;
        setTimeLeft(displayStr);
        setExpired(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [sub]);

  if (!sub) {
    return (
      <span className="px-2.5 py-1 bg-zinc-500/10 border border-zinc-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest text-zinc-400">
        Not Published Yet
      </span>
    );
  }

  if (sub.paymentStatus === 'approved') {
    return (
      <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest text-emerald-400">
        Approved & Active
      </span>
    );
  }

  if (sub.paymentStatus === 'pending') {
    return (
      <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest text-amber-400 animate-pulse">
        Pending Verification
      </span>
    );
  }

  if (expired || (sub.trialExpiresAt && new Date(sub.trialExpiresAt) < new Date())) {
    return (
      <span
        onClick={onActivate}
        className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest text-rose-400 cursor-pointer hover:bg-rose-500/25 active:scale-95 transition-all flex items-center gap-1 animate-pulse shadow-md border-rose-500/30"
        title="Click to Activate"
      >
        Expired <Zap size={10} className="text-rose-400 animate-bounce" />
      </span>
    );
  }

  return (
    <span className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[9px] font-mono font-black uppercase tracking-widest text-blue-400 flex items-center gap-1">
      <Clock size={10} className="animate-spin text-blue-400" /> {timeLeft || '7 Days Trial'}
    </span>
  );
};

export default function ProductShowcase() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  // Tab handling
  const [activeTab, setActiveTab] = useState<'mysite' | 'mycatalog' | 'customdomain'>('mysite');
  const [filterType, setFilterType] = useState<'all' | 'landing' | 'pro'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // --- Pro Website Activation State ---
  const [showProActivationModal, setShowProActivationModal] = useState(false);
  const [selectedActivationWebsite, setSelectedActivationWebsite] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<'1_month' | '3_months' | '6_months' | '1_year'>('1_month');
  const [senderNumber, setSenderNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [submittingActivation, setSubmittingActivation] = useState(false);

  // --- Dragon Bot Activation State ---
  const [showBotActivationModal, setShowBotActivationModal] = useState(false);
  const [selectedBotActivationWebsite, setSelectedBotActivationWebsite] = useState<any>(null);
  const [botSelectedPlan, setBotSelectedPlan] = useState<'1_month' | '3_months'>('1_month');
  const [botBillingCountryMode, setBotBillingCountryMode] = useState<'bd' | 'intl'>('bd');
  const [botPaymentPhone, setBotPaymentPhone] = useState('');
  const [botPaymentTrxId, setBotPaymentTrxId] = useState('');
  const [submittingBotActivation, setSubmittingBotActivation] = useState(false);
  const [expandedReviewsSiteId, setExpandedReviewsSiteId] = useState<string | null>(null);

  const [botStripeCardNum, setBotStripeCardNum] = useState('');
  const [botStripeExpiry, setBotStripeExpiry] = useState('');
  const [botStripeCvc, setBotStripeCvc] = useState('');
  const [botStripeName, setBotStripeName] = useState('');
  const [botStripePaying, setBotStripePaying] = useState(false);

  const handleBotBkashPaymentSubmit = async () => {
    if (!selectedBotActivationWebsite) return;
    if (!botPaymentPhone.trim()) {
      triggerSuccess('Input Required', 'bKash number is required.');
      return;
    }
    if (!botPaymentTrxId.trim()) {
      triggerSuccess('Input Required', 'bKash Transaction ID is required.');
      return;
    }

    setSubmittingBotActivation(true);
    try {
      const docRef = doc(db, 'pro_websites', selectedBotActivationWebsite.id);
      await updateDoc(docRef, {
        botPaymentStatus: 'pending',
        botSelectedPlan: botSelectedPlan,
        botPaymentPhone: botPaymentPhone,
        botPaymentTrxId: botPaymentTrxId.trim().toUpperCase(),
        botPaymentSubmittedAt: new Date().toISOString()
      });
      triggerSuccess('Activation Request Submitted!', 'Dragon Bot activation request submitted successfully. Admin will verify payment and activate the bot soon.');
      setShowBotActivationModal(false);
      setBotPaymentPhone('');
      setBotPaymentTrxId('');
    } catch (err) {
      console.error('Error submitting Bot Bkash payment:', err);
      triggerSuccess('Submission Error', 'Failed to submit payment. Please try again.');
    } finally {
      setSubmittingBotActivation(false);
    }
  };

  const handleBotStripePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBotActivationWebsite) return;
    if (!botStripeCardNum || !botStripeExpiry || !botStripeCvc || !botStripeName) {
      triggerSuccess('Card Details Required', 'Please fill in all card details.');
      return;
    }
    setBotStripePaying(true);
    try {
      const docRef = doc(db, 'pro_websites', selectedBotActivationWebsite.id);
      const expDate = new Date();
      if (botSelectedPlan === '1_month') expDate.setMonth(expDate.getMonth() + 1);
      else if (botSelectedPlan === '3_months') expDate.setMonth(expDate.getMonth() + 3);

      await updateDoc(docRef, {
        botPaymentStatus: 'approved',
        botSelectedPlan: botSelectedPlan,
        botExpiryTime: expDate.toISOString(),
        botPaymentSubmittedAt: new Date().toISOString()
      });
      triggerSuccess('Payment Successful!', 'Stripe payment successful! Your Dragon Bot has been activated instantly.');
      setShowBotActivationModal(false);
      setBotStripeCardNum('');
      setBotStripeExpiry('');
      setBotStripeCvc('');
      setBotStripeName('');
    } catch (err) {
      console.error(err);
      triggerSuccess('Payment Failed', 'Stripe payment failed. Please try again.');
    } finally {
      setBotStripePaying(false);
    }
  };
  const [bkashSettings, setBkashSettings] = useState<any>({
    manualNumber: '01700-000000',
    autoPaymentEnabled: false
  });

  const [dbPricing, setDbPricing] = useState<any>(null);

  useEffect(() => {
    getCachedDoc('global_settings', 'pricing').then((data) => {
      if (data) {
        setDbPricing(data);
      }
    }).catch(err => {
      console.warn("Failed to load global pricing settings:", err);
    });
  }, []);

  const getProWebsitePrice = (dur: '1_month' | '3_months' | '6_months' | '1_year', mode: 'bd' | 'intl') => {
    if (mode === 'bd') {
      return dbPricing?.pro_websites?.bd?.[dur] ?? dbPricing?.landing_pages?.bd?.[dur] ?? (dur === '1_month' ? 999 : dur === '3_months' ? 2699 : dur === '6_months' ? 4999 : 8999);
    } else {
      return dbPricing?.pro_websites?.intl?.[dur] ?? dbPricing?.landing_pages?.intl?.[dur] ?? (dur === '1_month' ? 19.99 : dur === '3_months' ? 53.99 : dur === '6_months' ? 99.99 : 179.99);
    }
  };

  // --- bKash Interactive Gateway State ---
  const [showBkashGateway, setShowBkashGateway] = useState(false);
  const [bkashGatewayStep, setBkashGatewayStep] = useState(1); // 1: Number, 2: OTP, 3: PIN, 4: Loading
  const [bkashPhoneNumber, setBkashPhoneNumber] = useState('');
  const [bkashOtp, setBkashOtp] = useState('');
  const [bkashPin, setBkashPin] = useState('');
  const [bkashAgreedToTerms, setBkashAgreedToTerms] = useState(false);
  const [bkashOtpTimer, setBkashOtpTimer] = useState(120);
  const [bkashGatewayError, setBkashGatewayError] = useState('');

  // OTP Countdown timer effect
  useEffect(() => {
    let interval: any;
    if (showBkashGateway && bkashGatewayStep === 2 && bkashOtpTimer > 0) {
      interval = setInterval(() => {
        setBkashOtpTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showBkashGateway, bkashGatewayStep, bkashOtpTimer]);

  // --- My Catalog Subscription and Activation States ---
  const [catalogSub, setCatalogSub] = useState<any>(null);
  const [loadingCatalogSub, setLoadingCatalogSub] = useState(true);
  const [showCatalogActivationModal, setShowCatalogActivationModal] = useState(false);
  const [catalogSelectedPlan, setCatalogSelectedPlan] = useState<'1_month' | '3_months' | '6_months' | '1_year'>('1_month');
  const [catalogSenderNumber, setCatalogSenderNumber] = useState('');
  const [catalogTrxId, setCatalogTrxId] = useState('');
  const [submittingCatalogActivation, setSubmittingCatalogActivation] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<'BDT' | 'USD'>('BDT');

  // --- bKash Interactive Auto Payment Gateway for My Catalog ---
  const [showCatalogBkashGateway, setShowCatalogBkashGateway] = useState(false);
  const [catalogBkashGatewayStep, setCatalogBkashGatewayStep] = useState(1);
  const [catalogBkashPhoneNumber, setCatalogBkashPhoneNumber] = useState('');
  const [catalogBkashOtp, setCatalogBkashOtp] = useState('');
  const [catalogBkashPin, setCatalogBkashPin] = useState('');
  const [catalogBkashAgreedToTerms, setCatalogBkashAgreedToTerms] = useState(false);
  const [catalogBkashOtpTimer, setCatalogBkashOtpTimer] = useState(120);
  const [catalogBkashGatewayError, setCatalogBkashGatewayError] = useState('');

  // --- Google Pay Interactive Simulator for My Catalog ---
  const [showCatalogGpayGateway, setShowCatalogGpayGateway] = useState(false);
  const [gpayGatewayStep, setGpayGatewayStep] = useState(1); // 1: Google Pay sheet, 2: processing loader, 3: success check

  // My Catalog bKash countdown timer effect
  useEffect(() => {
    let interval: any;
    if (showCatalogBkashGateway && catalogBkashGatewayStep === 2 && catalogBkashOtpTimer > 0) {
      interval = setInterval(() => {
        setCatalogBkashOtpTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showCatalogBkashGateway, catalogBkashGatewayStep, catalogBkashOtpTimer]);

  // Load bKash settings on mount
  useEffect(() => {
    getCachedDoc('global_settings', 'bkash').then((d) => {
      if (d) {
        setBkashSettings({
          manualNumber: d.manualNumber || '01700-000000',
          autoPaymentEnabled: !!d.autoPaymentEnabled
        });
      }
    }).catch(err => {
      console.warn("Failed to load global bkash settings:", err);
    });
  }, []);

  // Data State
  const [landingPages, setLandingPages] = useState<LandingPageData[]>([]);
  const [proWebsites, setProWebsites] = useState<ProWebsiteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Custom Success Modal State
  const [successModal, setSuccessModal] = useState<{ isOpen: boolean; title: string; message: string }>({ isOpen: false, title: '', message: '' });
  const triggerSuccess = (title: string, message: string) => setSuccessModal({ isOpen: true, title, message });
  const [showThreeDotMenu, setShowThreeDotMenu] = useState(false);

  // Inventories & Auto-Product publishing states
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [selectedWebsite, setSelectedWebsite] = useState<any | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [inventorySearch, setInventorySearch] = useState('');
  const [productForCategorySelection, setProductForCategorySelection] = useState<any | null>(null);
  const [productForMyCatalogSelection, setProductForMyCatalogSelection] = useState<any | null>(null);
  const [myCatalogPriceInput, setMyCatalogPriceInput] = useState<string>('');
  const [savingMyCatalogProduct, setSavingMyCatalogProduct] = useState(false);

  const handleRemoveProductFromCatalog = async (item: any) => {
    try {
      await updateDoc(doc(db, 'inventory', item.id), {
        isPublic: false,
        updatedAt: new Date().toISOString()
      });
      setInventoryItems(prev => prev.map(inv => inv.id === item.id ? { ...inv, isPublic: false } : inv));
      triggerSuccess('Removed from Catalog', `"${item.name}" has been removed from your public catalog.`);
    } catch (err) {
      console.error("Error removing from catalog:", err);
      triggerSuccess('Error', 'Failed to remove product from catalog.');
    }
  };

  const handleSaveMyCatalogProduct = async () => {
    if (!productForMyCatalogSelection) return;
    const sellPrice = Number(myCatalogPriceInput) || productForMyCatalogSelection.sellPrice || 0;
    setSavingMyCatalogProduct(true);
    try {
      await updateDoc(doc(db, 'inventory', productForMyCatalogSelection.id), {
        isPublic: true,
        sellPrice: sellPrice,
        updatedAt: new Date().toISOString()
      });
      setInventoryItems(prev => prev.map(inv => inv.id === productForMyCatalogSelection.id ? { ...inv, isPublic: true, sellPrice } : inv));
      triggerSuccess('Product Added to Catalog', `"${productForMyCatalogSelection.name}" is now public in your catalog!`);
      setProductForMyCatalogSelection(null);
      setMyCatalogPriceInput('');
    } catch (err) {
      console.error("Error saving catalog item:", err);
      triggerSuccess('Error', 'Failed to add product to catalog.');
    } finally {
      setSavingMyCatalogProduct(false);
    }
  };

  // Price & Discount settings prompt states for catalog items
  const [promptPrice, setPromptPrice] = useState<string>('');
  const [promptDiscount, setPromptDiscount] = useState<string>('0');
  const [promptCategory, setPromptCategory] = useState<string>('all');
  const [promptVideoUrl, setPromptVideoUrl] = useState<string>('');

  const openProductConfiguration = (item: any, website: any) => {
    if (!website) return;
    setSelectedWebsite(website);
    const catalogItem = (website.catalog || []).find((p: any) => p.id === item.id);
    
    const initialPrice = catalogItem ? (catalogItem.comparePrice || catalogItem.price) : (item.sellPrice || 0);
    const initialDiscount = catalogItem ? (catalogItem.discount || 0) : 0;
    const initialCategory = catalogItem ? (catalogItem.categoryId || 'all') : 'all';
    const initialVideo = catalogItem ? (catalogItem.videoUrl || '') : (item.videoUrl || '');

    setPromptPrice(initialPrice ? String(initialPrice) : '');
    setPromptDiscount(String(initialDiscount));
    setPromptCategory(initialCategory);
    setPromptVideoUrl(initialVideo);
    setProductForCategorySelection(item);
  };

  const addProductToCatalogWithPricing = async (
    websiteId: string, 
    item: any, 
    categoryId: string = 'all', 
    price: number, 
    comparePrice: number, 
    discount: number,
    videoUrl: string = ''
  ) => {
    try {
      const website = proWebsites.find(w => w.id === websiteId);
      if (!website) return;

      const currentCatalog = website.catalog || [];
      const itemIndex = currentCatalog.findIndex(p => p.id === item.id);

      const nonBase64Image = item.image && !item.image.startsWith('data:') ? item.image : '';
      const nonBase64Images = (item.images || []).filter((img: string) => img && !img.startsWith('data:'));

      const newProduct = {
        id: item.id,
        name: item.name || 'Unnamed Product',
        price: price, // Selling price after discount
        comparePrice: comparePrice, // Original sell price before discount
        discount: discount, // Discount percentage
        image: nonBase64Image,
        images: nonBase64Images,
        hasWarranty: item.hasWarranty || false,
        warrantyDuration: item.warrantyDuration || '',
        hasReplacement: item.hasReplacement || false,
        replacementDuration: item.replacementDuration || '',
        color: item.color || '',
        size: item.size || '',
        weight: item.weight || '',
        details: item.details || '',
        categoryId: categoryId,
        buyPrice: item.buyPrice || 0,
        videoUrl: videoUrl.trim()
      };

      let updatedCatalog = [...currentCatalog];
      if (itemIndex > -1) {
        // Update existing item
        updatedCatalog[itemIndex] = { ...updatedCatalog[itemIndex], ...newProduct };
      } else {
        // Add new item
        updatedCatalog.push(newProduct);
      }

      // Automatically strip out legacy base64 strings from other items in the catalog to migrate them!
      const cleanCatalog = updatedCatalog.map(p => {
        const cleanImage = p.image && p.image.startsWith('data:') ? '' : (p.image || '');
        const cleanImages = (p.images || []).filter((img: string) => img && !img.startsWith('data:'));
        return {
          ...p,
          image: cleanImage,
          images: cleanImages
        };
      });

      await updateDoc(doc(db, 'pro_websites', websiteId), {
        catalog: cleanCatalog,
        updatedAt: new Date().toISOString()
      });

      // Sync inventory isPublic flag
      try {
        await updateDoc(doc(db, 'inventory', item.id), {
          isPublic: true,
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.warn("Could not sync inventory isPublic flag on item add:", err);
      }

      triggerSuccess('Product Added to Catalog!', `"${item.name}" has been successfully added to your catalog.`);
      
      // Also update local list state for immediate UI feedback!
      setProWebsites(prev => prev.map(w => {
        if (w.id === websiteId) {
          return { ...w, catalog: cleanCatalog };
        }
        return w;
      }));
    } catch (e) {
      console.error("Catalog save error:", e);
      triggerSuccess('Save Error', 'Failed to save catalog. Please try again.');
    }
  };

  // YouTube video saving states for catalog
  const [catalogVideoUrls, setCatalogVideoUrls] = useState<{[key: string]: string}>({});
  const [savingVideoId, setSavingVideoId] = useState<string | null>(null);

  const handleSaveCatalogVideoUrl = async (websiteId: string, item: any, videoUrl: string) => {
    setSavingVideoId(item.id);
    try {
      const website = proWebsites.find(w => w.id === websiteId);
      if (!website) return;

      const updatedCatalog = (website.catalog || []).map((p: any) => {
        if (p.id === item.id) {
          return { ...p, videoUrl: videoUrl.trim() };
        }
        return p;
      });

      const cleanCatalog = updatedCatalog.map(p => {
        const cleanImage = p.image && p.image.startsWith('data:') ? '' : (p.image || '');
        const cleanImages = (p.images || []).filter((img: string) => img && !img.startsWith('data:'));
        return {
          ...p,
          image: cleanImage,
          images: cleanImages
        };
      });

      await updateDoc(doc(db, 'pro_websites', websiteId), {
        catalog: cleanCatalog,
        updatedAt: new Date().toISOString()
      });

      await updateDoc(doc(db, 'inventory', item.id), {
        videoUrl: videoUrl.trim(),
        updatedAt: new Date().toISOString()
      });

      triggerSuccess('Video Saved!', 'YouTube video link successfully saved to catalog.');
    } catch (err: any) {
      console.error("Error saving catalog video URL:", err);
      triggerSuccess('Save Error', 'Failed to save YouTube video link: ' + (err.message || 'Error'));
    } finally {
      setSavingVideoId(null);
    }
  };

  // My Catalog local state managers
  const [catalogSearch, setCatalogSearch] = useState('');
  const [previewQuery, setPreviewQuery] = useState('');
  const [previewSelectedProduct, setPreviewSelectedProduct] = useState<any | null>(null);
  const [showCatalogPreviewModal, setShowCatalogPreviewModal] = useState(false);
  const [previewModalCategory, setPreviewModalCategory] = useState<string>('all');
  const [previewModalSearch, setPreviewModalSearch] = useState<string>('');
  const [merchantCategories, setMerchantCategories] = useState<{ id: string; name: string; imageUrl?: string }[]>([]);

  // Store profile customization state managers
  const [userProfile, setUserProfile] = useState<any>(null);
  const currencySymbol = getCurrencySymbol(userProfile?.country || 'Bangladesh');
  const [storeName, setStoreName] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [savingBranding, setSavingBranding] = useState(false);
  const [deliveryChargeInside, setDeliveryChargeInside] = useState<number>(80);
  const [deliveryChargeOutside, setDeliveryChargeOutside] = useState<number>(130);
  const [deliveryLabelInside, setDeliveryLabelInside] = useState<string>('Inside Dhaka');
  const [deliveryLabelOutside, setDeliveryLabelOutside] = useState<string>('Outside Dhaka');
  const [customDeliveryCharges, setCustomDeliveryCharges] = useState<{ area: string; charge: number; subAreas?: string[] }[]>([]);
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaCharge, setNewAreaCharge] = useState('');
  const [newSubAreasInput, setNewSubAreasInput] = useState('');
  const [inlineSubAreaText, setInlineSubAreaText] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    if (!user) return;
    const docRef = doc(db, 'users', user.uid);
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUserProfile(data);
        setStoreName(data.storeName || data.businessName || '');
        setCoverImage(data.coverImage || '');
        const defaults = getDefaultDeliveryConfig(data.country || 'Bangladesh');
        setDeliveryChargeInside(typeof data.deliveryChargeInside === 'number' ? data.deliveryChargeInside : defaults.deliveryChargeInside);
        setDeliveryChargeOutside(typeof data.deliveryChargeOutside === 'number' ? data.deliveryChargeOutside : defaults.deliveryChargeOutside);
        setDeliveryLabelInside(data.deliveryLabelInside || (data.country === 'Bangladesh' ? defaults.deliveryLabelInsideBn : defaults.deliveryLabelInside));
        setDeliveryLabelOutside(data.deliveryLabelOutside || (data.country === 'Bangladesh' ? defaults.deliveryLabelOutsideBn : defaults.deliveryLabelOutside));
        setCustomDeliveryCharges(Array.isArray(data.customDeliveryCharges) ? data.customDeliveryCharges : []);
        // Default to BDT if country is Bangladesh or defaultCountry is BD or country is not set yet
        const isBD = data.country === 'Bangladesh' || data.defaultCountry === 'BD' || !data.country;
        setSelectedCurrency(isBD ? 'BDT' : 'USD');
      }
    }, (error) => {
      console.warn("Retrying/ignoring background user settings listener:", error);
    });
    return unsub;
  }, [user]);

  const handleCoverPhotoUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      triggerSuccess('File Too Large', 'File size is too large! Please upload an image file under 8MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      const b64 = e.target?.result as string;
      let finalImg = b64;
      try {
        finalImg = await compressBase64Maybe(b64, 1200, 450, 0.55);
      } catch (err) {
        console.error("Compression failed:", err);
      }
      setCoverImage(finalImg);
      if (user) {
        try {
          await setDoc(doc(db, 'users', user.uid), {
            coverImage: finalImg,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (dbErr) {
          console.error("Error auto-saving coverImage to Firestore:", dbErr);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveStoreBranding = async () => {
    if (!user) return;
    setSavingBranding(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        storeName: storeName.trim(),
        businessName: storeName.trim(), // Sync both
        coverImage: coverImage,
        deliveryChargeInside: Number(deliveryChargeInside),
        deliveryChargeOutside: Number(deliveryChargeOutside),
        deliveryLabelInside: deliveryLabelInside.trim(),
        deliveryLabelOutside: deliveryLabelOutside.trim(),
        customDeliveryCharges: customDeliveryCharges,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      triggerSuccess('Settings Saved!', 'Store branding and delivery charge settings have been successfully saved.');
    } catch (err: any) {
      console.error("Error saving store branding:", err);
      triggerSuccess('Save Error', 'Failed to save settings: ' + (err.message || 'Error'));
    } finally {
      setSavingBranding(false);
    }
  };

  // Delegate / Collaborative access support
  const [activeDelegateId] = useState<string>(() => {
    return localStorage.getItem('active_delegate_user_id') || '';
  });

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const effectiveUserId = activeDelegateId || user.uid;

    // Listen to Landing Pages
    const qPages = query(collection(db, 'landing-pages'), where('userId', '==', effectiveUserId));
    const unsubPages = onSnapshot(qPages, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as LandingPageData));
      // Sort newest first
      list.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      setLandingPages(list);
    }, (err) => {
      console.error("Failed to load landing pages:", err);
    });

    // Listen to Pro Websites
    const qPro = query(collection(db, 'pro_websites'), where('userId', '==', effectiveUserId));
    const unsubPro = onSnapshot(qPro, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as ProWebsiteData));
      list.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      setProWebsites(list);
      setLoading(false);
    }, (err) => {
      console.error("Failed to load pro websites:", err);
      setLoading(false);
    });

    // Listen to Catalog Subscription
    setLoadingCatalogSub(true);
    const unsubCatalogSub = onSnapshot(doc(db, 'catalog_subscriptions', effectiveUserId), (snap) => {
      if (snap.exists()) {
        setCatalogSub({ id: snap.id, ...snap.data() });
      } else {
        setCatalogSub(null);
      }
      setLoadingCatalogSub(false);
    }, (err) => {
      console.error("Failed to load catalog subscription:", err);
      setLoadingCatalogSub(false);
    });

    // Fetch Inventory dynamic items and merchant categories once
    let isMounted = true;
    const fetchInvAndCats = async () => {
      try {
        const qInv = query(collection(db, 'inventory'), where('userId', '==', effectiveUserId));
        const snap = await getDocs(qInv);
        if (!isMounted) return;
        setInventoryItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Failed to load inventory:", err);
      }

      try {
        const qCats = query(collection(db, 'merchant_categories'), where('userId', '==', effectiveUserId));
        const catSnap = await getDocs(qCats);
        if (!isMounted) return;
        setMerchantCategories(catSnap.docs.map(d => ({
          id: d.id,
          name: d.data().name as string,
          imageUrl: d.data().imageUrl as string | undefined
        })));
      } catch (err) {
        console.warn("Failed to load merchant categories:", err);
      }
    };

    fetchInvAndCats();

    return () => {
      isMounted = false;
      unsubPages();
      unsubPro();
      unsubCatalogSub();
    };
  }, [user, activeDelegateId]);

  // Combined store categories for catalog preview
  const storeCategories = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string; imageUrl?: string }>();
    merchantCategories.forEach(c => {
      if (c.name) map.set(c.name, c);
    });
    inventoryItems.filter(i => i.isPublic === true).forEach((item: any) => {
      if (item.category && !map.has(item.category)) {
        map.set(item.category, { id: item.category, name: item.category, imageUrl: item.categoryImageUrl || item.image });
      }
    });
    return Array.from(map.values());
  }, [merchantCategories, inventoryItems]);

  // Auto initialize 7 days trial when first product is published to Catalog
  useEffect(() => {
    if (!user) return;
    const effectiveUserId = activeDelegateId || user.uid;
    const hasPublicItems = inventoryItems.some(item => item.isPublic === true);
    
    if (hasPublicItems && !loadingCatalogSub && !catalogSub) {
      // Auto-initialize 7 days free trial for My Catalog
      const trialExpiresAt = new Date();
      trialExpiresAt.setDate(trialExpiresAt.getDate() + 7);
      
      setDoc(doc(db, 'catalog_subscriptions', effectiveUserId), {
        userId: effectiveUserId,
        paymentStatus: 'trial',
        trialStartedAt: new Date().toISOString(),
        trialExpiresAt: trialExpiresAt.toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }).catch(err => {
        console.error("Failed to initialize catalog subscription trial:", err);
      });
    }
  }, [inventoryItems, catalogSub, loadingCatalogSub, user, activeDelegateId]);

  // Copy helper
  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Delete helper
  const handleDeleteItem = async (colName: 'landing-pages' | 'pro_websites', id: string) => {
    try {
      await deleteDoc(doc(db, colName, id));
      setDeleteConfirmId(null);
    } catch (e) {
      console.error("Deletion failed:", e);
      triggerSuccess('Delete Error', 'Failed to delete item. Please try again.');
    }
  };

  // Toggle products on website catalog
  const toggleCatalogProduct = async (websiteId: string, item: any, categoryId: string = 'all') => {
    try {
      const website = proWebsites.find(w => w.id === websiteId);
      if (!website) return;

      const currentCatalog = website.catalog || [];
      const itemIndex = currentCatalog.findIndex(p => p.id === item.id);

      let updatedCatalog = [...currentCatalog];

      if (itemIndex > -1) {
        // Product is already in the website's catalog, remove it
        updatedCatalog.splice(itemIndex, 1);
        try {
          await updateDoc(doc(db, 'inventory', item.id), {
            isPublic: false,
            updatedAt: new Date().toISOString()
          });
        } catch (err) {
          console.warn("Could not sync inventory isPublic flag on item remove:", err);
        }
      } else {
        // Add product to the website's catalog.
        // Since we pull the image & images directly from the standalone inventory document at runtime, 
        // we do NOT store the heavy base64 strings in the website document's catalog. 
        // This keeps the website document size well under the 1MB Firestore limit regardless of catalog size!
        const nonBase64Image = item.image && !item.image.startsWith('data:') ? item.image : '';
        const nonBase64Images = (item.images || []).filter((img: string) => img && !img.startsWith('data:'));

        const newProduct = {
          id: item.id,
          name: item.name || 'Unnamed Product',
          price: Number(item.sellPrice) || 0,
          comparePrice: Number(item.sellPrice) || 0,
          image: nonBase64Image,
          images: nonBase64Images,
          hasWarranty: item.hasWarranty || false,
          warrantyDuration: item.warrantyDuration || '',
          hasReplacement: item.hasReplacement || false,
          replacementDuration: item.replacementDuration || '',
          color: item.color || '',
          size: item.size || '',
          weight: item.weight || '',
          categoryId: categoryId
        };
        updatedCatalog.push(newProduct);
        try {
          await updateDoc(doc(db, 'inventory', item.id), {
            isPublic: true,
            updatedAt: new Date().toISOString()
          });
        } catch (err) {
          console.warn("Could not sync inventory isPublic flag on item add:", err);
        }
      }

      // Automatically strip out legacy base64 strings from other items in the catalog to migrate them!
      const cleanCatalog = updatedCatalog.map(p => {
        const cleanImage = p.image && p.image.startsWith('data:') ? '' : (p.image || '');
        const cleanImages = (p.images || []).filter((img: string) => img && !img.startsWith('data:'));
        return {
          ...p,
          image: cleanImage,
          images: cleanImages
        };
      });

      await updateDoc(doc(db, 'pro_websites', websiteId), {
        catalog: cleanCatalog,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Failed to update website catalog:", err);
      triggerSuccess('Update Error', 'Failed to update website catalog. Please try again.');
    }
  };

  const getBotStatusTextAndColor = (website: any) => {
    if (!website.dragonBotEnabled) {
      return {
        text: 'Bot Disabled',
        colorClass: 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20',
        isActive: false,
        isPending: false,
        status: 'disabled'
      };
    }

    if (website.botPaymentStatus === 'approved') {
      const expTime = website.botExpiryTime ? new Date(website.botExpiryTime).getTime() : 0;
      if (expTime > Date.now()) {
        const dateStr = new Date(expTime).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
        return {
          text: `Premium Active (Expiry: ${dateStr})`,
          colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 border-emerald-500/30 font-bold',
          isActive: true,
          isPending: false,
          status: 'premium'
        };
      }
    }

    if (website.botPaymentStatus === 'pending') {
      return {
        text: 'Verification Pending (Verifying Payment)',
        colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20 border-amber-500/30 font-bold',
        isActive: false,
        isPending: true,
        status: 'pending'
      };
    }

    // Check trial remaining
    if (website.createdAt) {
      const createdTime = getCreatedTime(website);
      const trialExpiry = createdTime + 48 * 60 * 60 * 1000; // 48 hours
      const diff = trialExpiry - Date.now();
      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return {
          text: `Free Trial Active (${hours}h ${minutes}m remaining)`,
          colorClass: 'text-dragon-cyan bg-dragon-cyan/10 border-dragon-cyan/20 border-dragon-cyan/30 animate-pulse font-bold',
          isActive: true,
          isPending: false,
          status: 'trial',
          timeLeftStr: `${hours}h ${minutes}m`
        };
      }
    }

    return {
      text: 'Free Trial Expired / Disabled (Expired)',
      colorClass: 'text-rose-400 bg-rose-500/10 border-rose-500/20 border-rose-500/30 font-bold',
      isActive: false,
      isPending: false,
      status: 'expired'
    };
  };

  const currentOrigin = window.location.origin;

  // Filter lists based on search
  const filteredLandingPages = landingPages.filter(p => {
    const q = searchQuery.toLowerCase();
    const title = (p.productDetails?.title || '').toLowerCase();
    const store = (p.storeName || '').toLowerCase();
    return title.includes(q) || store.includes(q);
  });

  const filteredProWebsites = proWebsites.filter(p => {
    const q = searchQuery.toLowerCase();
    const brand = (p.brandName || '').toLowerCase();
    const slug = (p.slug || '').toLowerCase();
    return brand.includes(q) || slug.includes(q);
  });

  const totalSitesCount = landingPages.length + proWebsites.length;

  return (
    <div className="min-h-screen bg-white dark:bg-dragon-black text-slate-900 dark:text-white selection:bg-pink-500 selection:text-white pb-28 w-full overflow-x-hidden">
      {/* Upper Navigation Bar with Grouped Actions */}
      <StoreHeaderNav activeTab={activeTab} setActiveTab={setActiveTab} />


      {/* Main Container */}
      <div className="px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto pt-6 sm:pt-8 w-full overflow-x-hidden">
        
        {activeTab === 'mysite' && (
          <MySitesTab
            loading={loading}
            landingPages={landingPages}
            proWebsites={proWebsites}
            filterType={filterType}
            setFilterType={setFilterType}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filteredLandingPages={filteredLandingPages}
            filteredProWebsites={filteredProWebsites}
            currentOrigin={currentOrigin}
            copiedId={copiedId}
            handleCopyLink={handleCopyLink}
            deleteConfirmId={deleteConfirmId}
            setDeleteConfirmId={setDeleteConfirmId}
            handleDeleteItem={handleDeleteItem}
            navigate={navigate}
            expandedReviewsSiteId={expandedReviewsSiteId}
            setExpandedReviewsSiteId={setExpandedReviewsSiteId}
            onOpenBotActivationModal={(website) => {
              setSelectedBotActivationWebsite(website);
              setBotSelectedPlan('1_month');
              setBotPaymentPhone('');
              setBotPaymentTrxId('');
              setShowBotActivationModal(true);
            }}
            onOpenProductSelector={(website) => {
              setSelectedWebsite(website);
              setShowProductModal(true);
            }}
          />
        )}

        {/* Custom Domain setup tab display */}
        {activeTab === 'customdomain' && (
          <CustomDomainSetupTab proWebsites={proWebsites} />
        )}

        {/* My Catalog Management Console and Smartphone Mockup Live Preview */}
        {activeTab === 'mycatalog' && (() => {
          // Filter inventory items based on search filter input
          const filteredInventory = inventoryItems.filter(item => 
            (item.name || '').toLowerCase().includes(catalogSearch.toLowerCase()) ||
            (item.details || '').toLowerCase().includes(catalogSearch.toLowerCase())
          );

          // Get active public catalog list for smartphone visual preview
          const publicCatalogItems = inventoryItems.filter(item => item.isPublic === true);

          // Render interactive panels
          return (
            <div className="space-y-6">
              {/* Informative Header card */}
              <div className="p-6 bg-gradient-to-r from-dragon-cyan/15 to-dragon-purple/15 rounded-3xl border border-white/5 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={14} className="text-dragon-cyan animate-pulse" />
                    <span className="text-[10px] font-black tracking-widest text-dragon-cyan uppercase">Public Catalog Setup</span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-display font-black text-white uppercase tracking-tight mb-2">My Catalog</h1>
                  <p className="text-gray-400 text-xs max-w-2xl leading-relaxed font-bold">
                    Setup the products from your inventory that you want to make available for buyers to purchase directly in chat.
                  </p>
                </div>
                <div className="absolute top-1/2 right-10 -translate-y-1/2 w-[220px] h-[220px] bg-dragon-cyan/5 blur-[50px] rounded-full pointer-events-none" />
              </div>

              {/* Stacked Layout: Store Settings and Inventory Products List */}
              <div className="space-y-6 max-w-4xl mx-auto">
                
                {/* My Catalog Billing/Subscription Panel */}
                {(publicCatalogItems.length > 0 || catalogSub) && (
                   <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-4 animate-fade-in text-left">
                     <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/5">
                       <div>
                         <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                           <CreditCard size={15} className="text-dragon-cyan" />
                           Catalog Subscription & Payment System
                         </h3>
                         <p className="text-[10px] text-gray-400 font-bold mt-1">
                           Check payment status to keep your public catalog active and show the product menu to buyers.
                         </p>
                       </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase text-gray-500 font-mono">STATUS:</span>
                          <MyCatalogTimer sub={catalogSub} onActivate={() => setShowCatalogActivationModal(true)} />
                        </div>
                     </div>

                     {/* Status description details */}
                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-black/30 p-4 rounded-2xl border border-white/5">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-white">
                            {catalogSub?.paymentStatus === "approved" && "Your subscription is active! Catalog is live."}
                            {catalogSub?.paymentStatus === "pending" && "Your payment is being verified. It will be activated shortly."}
                            {catalogSub?.paymentStatus === "trial" && (
                              new Date(catalogSub.trialExpiresAt) > new Date() 
                                ? "You are using a 7-day free trial. The catalog will be locked after the trial."
                                : "Your 7-day free trial for the catalog has expired!"
                            )}
                            {!catalogSub && "Catalog products added, but subscription has not started yet."}
                          </p>
                          <p className="text-[10px] text-gray-455 font-medium">
                            {catalogSub?.paymentStatus === "approved" && `Expires on: ${new Date(catalogSub.activeUntil).toLocaleDateString()}`}
                            {catalogSub?.paymentStatus === "pending" && "Payment Transaction ID: " + (catalogSub.paymentTrxId || "N/A")}
                            {catalogSub?.paymentStatus === "trial" && `Free trial expires on: ${new Date(catalogSub.trialExpiresAt).toLocaleString()}`}
                          </p>
                        </div>

                       {(catalogSub?.paymentStatus === 'trial' || catalogSub?.paymentStatus === 'none' || !catalogSub || (catalogSub?.paymentStatus === 'approved' && new Date(catalogSub.activeUntil) < new Date())) && (
                         <button
                           onClick={() => {
                             setCatalogSenderNumber('');
                             setCatalogTrxId('');
                             setShowCatalogActivationModal(true);
                           }}
                           className="px-5 py-2.5 bg-gradient-to-r from-dragon-cyan to-dragon-purple hover:opacity-90 text-dragon-black font-black uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
                         >
                           <Zap size={12} /> Upgrade Plan
                         </button>
                       )}
                     </div>
                  </div>
                )}
                
                {/* Store Branding & Cover Photo Settings (Top of Inventory Products Table) */}
                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-5 animate-fade-in">
                  <div className="pb-3 border-b border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Settings size={15} className="text-dragon-cyan" />
                        Store Branding & Cover Photo Settings
                      </h3>
                      <p className="text-[10px] text-gray-400 font-bold mt-1">Configure your store's brand identity for inbox and social media</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                    {/* Store Name Input */}
                    <div className="space-y-2 text-left">
                      <label className="text-[10px] font-black uppercase tracking-wider text-gray-450 block font-mono">
                        Store Name
                      </label>
                      <input 
                        type="text"
                        placeholder="Enter your store name..."
                        value={storeName}
                        onChange={e => setStoreName(e.target.value)}
                        className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 px-4 text-xs font-semibold text-white focus:outline-none focus:border-dragon-cyan transition-all"
                      />
                    </div>

                    {/* Cover Photo Drag and Drop Upload */}
                    <div className="space-y-2 text-left">
                      <label className="text-[10px] font-black uppercase tracking-wider text-gray-450 block font-mono">
                        Store Cover Photo
                      </label>
                      
                      {coverImage ? (
                        <div className="relative rounded-2xl overflow-hidden aspect-[16/5] bg-zinc-950 border border-white/10 group">
                          <img 
                            src={coverImage} 
                            className="w-full h-full object-cover" 
                            alt="Cover preview" 
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              setCoverImage('');
                              if (user) {
                                try {
                                  await setDoc(doc(db, 'users', user.uid), { coverImage: '', updatedAt: new Date().toISOString() }, { merge: true });
                                } catch (e) {
                                  console.error("Error clearing coverImage in user doc:", e);
                                }
                              }
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-red-500 text-white rounded-lg transition-colors cursor-pointer group-hover:scale-105"
                            title="Remove Cover Photo"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center aspect-[16/5] w-full rounded-2xl border border-dashed border-white/10 bg-black/20 hover:bg-white/[0.005] hover:border-dragon-cyan/35 transition-all cursor-pointer p-4 group">
                          <UploadCloud size={20} className="text-gray-500 group-hover:text-dragon-cyan transition-colors mb-1" />
                          <span className="text-[9px] text-gray-400 font-extrabold group-hover:text-white transition-colors uppercase select-none">Upload New Cover</span>
                          <span className="text-[8px] text-gray-650 mt-0.5 uppercase select-none font-mono">Wider format (e.g. 1200x400)</span>
                          <input 
                            type="file"
                            accept="image/*"
                            onChange={e => {
                              if (e.target.files && e.target.files[0]) {
                                handleCoverPhotoUpload(e.target.files[0]);
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Delivery Charges Section */}
                  <div className="border-t border-white/5 pt-5 space-y-4 text-left">
                    <div className="flex items-center gap-2">
                      <Truck size={16} className="text-dragon-cyan" />
                      <h4 className="text-xs font-black uppercase tracking-widest text-white">Delivery Charges Setup</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Inside Dhaka / Area 1 Config */}
                      <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl space-y-3">
                        <div className="text-[10px] font-black uppercase tracking-wider text-dragon-cyan block font-mono">
                          Area 1 ({userProfile?.country === 'Bangladesh' ? 'e.g. Inside Dhaka' : 'e.g. Local Delivery'})
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Area Name / Label</label>
                          <input 
                            type="text" 
                            value={deliveryLabelInside}
                            onChange={(e) => setDeliveryLabelInside(e.target.value)}
                            className="w-full bg-black/40 border border-white/5 rounded-xl py-2 px-3 text-xs font-semibold text-white focus:outline-none focus:border-dragon-cyan transition-all"
                            placeholder={userProfile?.country === 'Bangladesh' ? "Dhaka inside" : "Local Delivery"}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Delivery Charge (Charge {currencySymbol})</label>
                          <input 
                            type="number" 
                            value={deliveryChargeInside}
                            onChange={(e) => setDeliveryChargeInside(Number(e.target.value))}
                            className="w-full bg-black/40 border border-white/5 rounded-xl py-2 px-3 text-xs font-semibold text-white focus:outline-none focus:border-dragon-cyan transition-all"
                            placeholder={String(getDefaultDeliveryConfig(userProfile?.country || 'Bangladesh').deliveryChargeInside)}
                          />
                        </div>
                      </div>

                      {/* Outside Dhaka / Area 2 Config */}
                      <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl space-y-3">
                        <div className="text-[10px] font-black uppercase tracking-wider text-[#1ca] block font-mono">
                          Area 2 ({userProfile?.country === 'Bangladesh' ? 'e.g. Outside Dhaka' : 'e.g. Outside City/State'})
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Area Name / Label</label>
                          <input 
                            type="text" 
                            value={deliveryLabelOutside}
                            onChange={(e) => setDeliveryLabelOutside(e.target.value)}
                            className="w-full bg-black/40 border border-white/5 rounded-xl py-2 px-3 text-xs font-semibold text-white focus:outline-none focus:border-dragon-cyan transition-all"
                            placeholder={userProfile?.country === 'Bangladesh' ? "Dhaka outside" : "Outside City/State"}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Delivery Charge (Charge {currencySymbol})</label>
                          <input 
                            type="number" 
                            value={deliveryChargeOutside}
                            onChange={(e) => setDeliveryChargeOutside(Number(e.target.value))}
                            className="w-full bg-black/40 border border-white/5 rounded-xl py-2 px-3 text-xs font-semibold text-white focus:outline-none focus:border-dragon-cyan transition-all"
                            placeholder={String(getDefaultDeliveryConfig(userProfile?.country || 'Bangladesh').deliveryChargeOutside)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Custom Area & Subarea Setup */}
                    <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl space-y-4 mt-2">
                      <div>
                        <h5 className="text-[11px] font-black uppercase tracking-wider text-dragon-cyan">Custom Area & Sub-areas Delivery Charge</h5>
                        <p className="text-[9px] text-gray-400 font-bold">Configure specific area names, delivery charges, and sub-areas.</p>
                      </div>

                      {/* Add Custom Area Form */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Area Name</label>
                          <input 
                            type="text" 
                            value={newAreaName}
                            onChange={(e) => setNewAreaName(e.target.value)}
                            placeholder="e.g. Mirpur" 
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-dragon-cyan transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Delivery Charge ({currencySymbol})</label>
                          <input 
                            type="number" 
                            value={newAreaCharge}
                            onChange={(e) => setNewAreaCharge(e.target.value)}
                            placeholder="e.g. 80" 
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-dragon-cyan transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Sub-areas (separate with commas)</label>
                          <input 
                            type="text" 
                            value={newSubAreasInput}
                            onChange={(e) => setNewSubAreasInput(e.target.value)}
                            placeholder="e.g. Mirpur 10, Mirpur 11" 
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-dragon-cyan transition-all"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            const trimmedName = newAreaName.trim();
                            const parsedCharge = Number(newAreaCharge);
                            if (!trimmedName) return triggerSuccess('Area Required', 'Please enter an area name.');
                            if (isNaN(parsedCharge) || parsedCharge < 0) return triggerSuccess('Invalid Charge', 'Please enter a valid charge amount.');
                            
                            if (customDeliveryCharges.some(c => c.area.toLowerCase() === trimmedName.toLowerCase())) {
                              return triggerSuccess('Area Exists', 'This area is already added.');
                            }

                            // parse sub-areas
                            const subAreasList = newSubAreasInput
                              .split(',')
                              .map(s => s.trim())
                              .filter(s => s.length > 0);

                            const updatedList = [
                              ...customDeliveryCharges, 
                              { area: trimmedName, charge: parsedCharge, subAreas: subAreasList }
                            ];
                            setCustomDeliveryCharges(updatedList);
                            setNewAreaName('');
                            setNewAreaCharge('');
                            setNewSubAreasInput('');
                          }}
                          className="px-4 py-2 bg-dragon-cyan/25 hover:bg-dragon-cyan text-dragon-black hover:text-dragon-black border border-dragon-cyan/35 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                        >
                          <Plus size={12} strokeWidth={3} /> Add Area
                        </button>
                      </div>

                      {/* Display Custom Areas list */}
                      {customDeliveryCharges.length > 0 && (
                        <div className="space-y-2 border-t border-white/5 pt-3">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Configured Custom Areas:</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {customDeliveryCharges.map((item, id) => (
                              <div key={`custom-charge-${id}`} className="p-3 bg-black/40 border border-white/5 rounded-xl flex flex-col justify-between gap-2 text-left relative group">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="text-xs font-extrabold text-white">{item.area}</div>
                                    <div className="text-[10px] font-black text-dragon-cyan font-mono mt-0.5">Delivery Charge: {currencySymbol}{item.charge}</div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = customDeliveryCharges.filter((_, idx2) => idx2 !== id);
                                      setCustomDeliveryCharges(updated);
                                    }}
                                    className="p-1 hover:bg-rose-500/10 text-gray-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                                    title="Remove"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>

                                {/* Sub areas list */}
                                <div className="space-y-1.5 pt-1.5 border-t border-white/5">
                                  <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 block">Sub-areas:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {(item.subAreas || []).length === 0 ? (
                                      <span className="text-[8px] text-gray-600 font-bold italic">No sub-areas</span>
                                    ) : (
                                      item.subAreas?.map((sub, sIdx) => (
                                        <span key={`sub-area-badge-${sIdx}`} className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider bg-white/5 border border-white/5 text-gray-300 px-1.5 py-0.5 rounded-md">
                                          {sub}
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const updatedSubAreas = (item.subAreas || []).filter((_, sIdx2) => sIdx2 !== sIdx);
                                              const updatedList = [...customDeliveryCharges];
                                              updatedList[id] = { ...item, subAreas: updatedSubAreas };
                                              setCustomDeliveryCharges(updatedList);
                                            }}
                                            className="hover:text-red-400 ml-0.5"
                                          >
                                            ✕
                                          </button>
                                        </span>
                                      ))
                                    )}
                                  </div>

                                  {/* Inline sub-area add input */}
                                  <div className="flex gap-1 items-center mt-1 pt-1">
                                    <input 
                                      type="text"
                                      placeholder="New sub-area..."
                                      value={inlineSubAreaText[id] || ''}
                                      onChange={(e) => setInlineSubAreaText({ ...inlineSubAreaText, [id]: e.target.value })}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          const val = (inlineSubAreaText[id] || '').trim();
                                          if (!val) return;
                                          const existingSub = item.subAreas || [];
                                          if (existingSub.map(s => s.toLowerCase()).includes(val.toLowerCase())) {
                                            return triggerSuccess('Sub-area Exists', 'This sub-area already exists.');
                                          }
                                          const updatedList = [...customDeliveryCharges];
                                          updatedList[id] = { ...item, subAreas: [...existingSub, val] };
                                          setCustomDeliveryCharges(updatedList);
                                          setInlineSubAreaText({ ...inlineSubAreaText, [id]: '' });
                                        }
                                      }}
                                      className="flex-1 bg-black/60 border border-white/5 rounded-lg px-2 py-1 text-[9px] text-white focus:outline-none focus:border-dragon-cyan"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const val = (inlineSubAreaText[id] || '').trim();
                                        if (!val) return;
                                        const existingSub = item.subAreas || [];
                                        if (existingSub.map(s => s.toLowerCase()).includes(val.toLowerCase())) {
                                          return triggerSuccess('Sub-area Exists', 'This sub-area already exists.');
                                        }
                                        const updatedList = [...customDeliveryCharges];
                                        updatedList[id] = { ...item, subAreas: [...existingSub, val] };
                                        setCustomDeliveryCharges(updatedList);
                                        setInlineSubAreaText({ ...inlineSubAreaText, [id]: '' });
                                      }}
                                      className="p-1 px-1.5 bg-dragon-cyan/20 text-dragon-cyan border border-dragon-cyan/35 text-[8px] font-black rounded-lg hover:bg-dragon-cyan hover:text-black transition-all cursor-pointer"
                                    >
                                      Add
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Save Branding Action Button */}
                  <div className="flex justify-end pt-2 border-t border-white/5">
                    <button
                      type="button"
                      onClick={handleSaveStoreBranding}
                      disabled={savingBranding}
                      className="px-6 py-3 bg-dragon-cyan hover:bg-white text-dragon-black disabled:opacity-50 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-dragon-cyan/10 active:scale-95 flex items-center justify-center gap-2 min-h-[40px] cursor-pointer"
                    >
                      <Check size={14} strokeWidth={3} />
                      {savingBranding ? "Saving..." : "Save Branding"}
                    </button>
                  </div>
                </div>

                {/* Inventory Products Selector Panel (Table) */}
                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-4">
                  <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">Inventory Products</h3>
                      <p className="text-[10px] text-gray-500 font-bold mt-1">Select products to add to your public catalog</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2.5 py-1 bg-white/5 text-gray-300 border border-white/5 rounded-xl font-mono">
                        Total Found: {filteredInventory.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowCatalogPreviewModal(true)}
                        className="px-3.5 py-1.5 bg-dragon-cyan text-dragon-black hover:bg-white hover:text-dragon-black text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-dragon-cyan/15 active:scale-95 font-sans"
                      >
                        <Eye size={13} strokeWidth={3} /> View Catalog
                      </button>
                    </div>
                  </div>

                  {/* Configurator Search input */}
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                    <input 
                      type="text"
                      placeholder="Search inventory products..."
                      value={catalogSearch}
                      onChange={e => setCatalogSearch(e.target.value)}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 pl-10 pr-4 text-xs font-semibold text-white focus:outline-none focus:border-dragon-cyan transition-all"
                    />
                    {catalogSearch && (
                      <button onClick={() => setCatalogSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-white">✕</button>
                    )}
                  </div>

                  {/* List of configuration products */}
                  <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
                    {filteredInventory.length === 0 ? (
                      <div className="py-16 text-center border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                        <ShoppingBag size={32} className="mx-auto text-gray-700 mb-2" />
                        <p className="text-xs font-bold text-gray-500 uppercase">No inventory products</p>
                        <p className="text-[9px] text-gray-600 mt-1">Go to the Inventory page first to add products.</p>
                      </div>
                    ) : (
                      filteredInventory.map((item: any, idx) => {
                        const isInCatalog = item.isPublic === true;
                        return (
                          <div 
                            key={`showcase-inv-${item.id}-${idx}`}
                            className={`p-3 bg-[#0a0c10] border rounded-2xl flex items-center justify-between transition-all hover:bg-white/[0.01] ${
                              isInCatalog ? 'border-dragon-cyan/20 bg-dragon-cyan/[0.01]' : 'border-white/5'
                            }`}
                          >
                            <div className="flex gap-3 items-center min-w-0 flex-1">
                              <img 
                                src={item.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80'} 
                                className="w-11 h-11 rounded-xl object-cover bg-white/5 shrink-0" 
                                alt=""
                                referrerPolicy="no-referrer"
                              />
                              <div className="min-w-0 flex-1">
                                <h4 className="font-extrabold text-white text-xs truncate max-w-xs sm:max-w-md md:max-w-lg">{item.name}</h4>
                                <div className="flex gap-2 items-center text-[10px] text-gray-500 mt-0.5 font-mono">
                                  <span className="text-dragon-cyan font-bold">৳{item.sellPrice || 0}</span>
                                  {item.category && <span className="bg-white/5 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider text-gray-400">{item.category}</span>}
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={async () => {
                                if (isInCatalog) {
                                  try {
                                    await updateDoc(doc(db, 'inventory', item.id), {
                                      isPublic: false,
                                      updatedAt: new Date().toISOString()
                                    });
                                    const promises = proWebsites.map(async (website) => {
                                      const currentCatalog = website.catalog || [];
                                      if (currentCatalog.some(p => p.id === item.id)) {
                                        const cleanCatalog = currentCatalog
                                          .filter(p => p.id !== item.id)
                                          .map(p => {
                                            const cleanImage = p.image && p.image.startsWith('data:') ? '' : (p.image || '');
                                            const cleanImages = (p.images || []).filter((img: string) => img && !img.startsWith('data:'));
                                            return {
                                              ...p,
                                              image: cleanImage,
                                              images: cleanImages
                                            };
                                          });
                                        await updateDoc(doc(db, 'pro_websites', website.id), {
                                          catalog: cleanCatalog,
                                          updatedAt: new Date().toISOString()
                                        });
                                      }
                                    });
                                    await Promise.all(promises);
                                    triggerSuccess('Product Removed!', 'Product removed from catalog successfully.');
                                  } catch (e) {
                                    console.error("Catalog remove error:", e);
                                    triggerSuccess('Removal Failed', 'Failed to remove product from catalog.');
                                  }
                                } else {
                                  setProductForMyCatalogSelection(item);
                                  setMyCatalogPriceInput(item.sellPrice ? String(item.sellPrice) : '');
                                }
                              }}
                              className={`p-2 px-3.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 border leading-none ${
                                isInCatalog 
                                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/25 hover:bg-rose-500 hover:text-white' 
                                  : 'bg-dragon-cyan/10 text-dragon-cyan border-dragon-cyan/25 hover:bg-dragon-cyan hover:text-black'
                              }`}
                            >
                              {isInCatalog ? 'Remove' : 'Add'}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* LIVE SIMULATED PRODUCT QUICK VIEW POPUP OVERLAY */}
              <AnimatePresence>
                {previewSelectedProduct && (
                  <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="w-full max-w-sm bg-dragon-black border border-white/10 rounded-3xl p-5 overflow-hidden shadow-2xl relative space-y-4"
                    >
                      <button 
                        onClick={() => setPreviewSelectedProduct(null)} 
                        className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white cursor-pointer z-10 transition-colors"
                      >
                        ✕
                      </button>

                      <div className="relative aspect-video w-full rounded-2xl bg-white/5 overflow-hidden select-none">
                        <img 
                          src={previewSelectedProduct.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80'} 
                          className="w-full h-full object-cover" 
                          alt="" 
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      <div className="text-left space-y-2">
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <span className="text-[7px] bg-dragon-cyan/15 border border-dragon-cyan/25 text-dragon-cyan px-2 py-0.5 rounded uppercase font-black tracking-widest block w-fit mb-1 leading-none font-bold">
                              {previewSelectedProduct.category || "General"}
                            </span>
                            <h3 className="text-sm font-black text-white uppercase tracking-tight">{previewSelectedProduct.name}</h3>
                          </div>
                          <span className="text-sm font-black text-dragon-cyan font-mono shrink-0">৳{previewSelectedProduct.sellPrice || 0}</span>
                        </div>

                        {previewSelectedProduct.details && (
                          <p className="text-[10px] text-gray-400 font-sans leading-relaxed line-clamp-3 font-bold border-l-2 border-white/10 pl-2">
                            {previewSelectedProduct.details}
                          </p>
                        )}

                        {/* Attribute info cards */}
                        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-white/5 text-[9px] font-bold text-gray-500 font-sans">
                          {previewSelectedProduct.color && <div className="truncate">Color Options: <strong className="text-white font-medium">{previewSelectedProduct.color}</strong></div>}
                          {previewSelectedProduct.size && <div className="truncate">Size: <strong className="text-white font-medium">{previewSelectedProduct.size}</strong></div>}
                          {previewSelectedProduct.hasWarranty && <div className="truncate">Warranty: <strong className="text-emerald-400 font-bold">{previewSelectedProduct.warrantyDuration || "Yes"}</strong></div>}
                          {previewSelectedProduct.hasReplacement && <div className="truncate">Replacement: <strong className="text-emerald-400 font-bold">{previewSelectedProduct.replacementDuration || "Yes"}</strong></div>}
                        </div>
                      </div>


                      <button
                        type="button"
                        onClick={() => setPreviewSelectedProduct(null)}
                        className="w-full py-3.5 bg-dragon-cyan hover:bg-dragon-cyan/90 text-dragon-black rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors"
                      >
                        Close Preview
                      </button>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* LIVE STORE CATALOG POPUP MODAL */}
              <AnimatePresence>
                {showCatalogPreviewModal && (
                  <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="w-full max-w-2xl bg-[#0b0c10] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
                    >
                      {/* Close button inside top header */}
                      <button 
                        onClick={() => setShowCatalogPreviewModal(false)} 
                        className="absolute top-4 right-4 p-2 bg-black/70 hover:bg-red-500 rounded-full text-white cursor-pointer z-50 transition-all border border-white/10 active:scale-95 w-8 h-8 flex items-center justify-center font-bold text-xs"
                      >
                        ✕
                      </button>

                      {/* Scrollable container */}
                      <div className="overflow-y-auto w-full flex-1 p-0">
                        
                        {/* 1. COVER PHOTO BANNER */}
                        <div 
                          className="h-44 sm:h-56 w-full relative overflow-hidden bg-cover bg-center flex items-end justify-between p-6"
                          style={{
                            backgroundImage: coverImage 
                              ? `url(${coverImage})` 
                              : "linear-gradient(to right, rgba(49, 46, 129, 0.6), rgba(88, 28, 135, 0.4), rgba(8, 79, 94, 0.5))"
                          }}
                        >
                          {/* Pattern overlays if custom cover photo is not set */}
                          {!coverImage && (
                            <>
                              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c10] via-black/45 to-transparent z-0" />
                              <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
                            </>
                          )}
                          
                          {/* Live Status indicator */}
                          <div className="absolute top-4 left-4 z-10 px-2.5 py-1 bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/25 rounded-full flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400 font-mono">My Live Catalog</span>
                          </div>
                        </div>

                        {/* 2. PROFILE OVERLAY DETAILS */}
                        <div className="px-6 pb-6 pt-2 flex flex-col items-center text-center -mt-16 sm:-mt-22 relative z-10 space-y-3">
                          <div className="relative shrink-0">
                            <img 
                              src={userProfile?.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80'} 
                              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover bg-[#0b0c10] border-4 border-[#0b0c10] shadow-2xl" 
                              alt="Store Profile Avatar"
                              referrerPolicy="no-referrer"
                            />
                            {/* Verified check badge */}
                            <div className="absolute bottom-1 right-1 p-1 bg-dragon-cyan text-dragon-black rounded-full shadow-lg border-2 border-[#0b0c10]">
                              <Check size={14} strokeWidth={4} />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight font-sans">
                              {storeName || userProfile?.businessName || userProfile?.name || 'My Store'}
                            </h2>
                            <p className="text-[10px] text-zinc-400 font-semibold tracking-wide font-sans">
                              {userProfile?.phone || 'No Phone Number'} • {userProfile?.email || 'N/A'}
                            </p>
                            <div className="flex justify-center items-center gap-2 pt-1">
                              <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-dragon-cyan/10 text-dragon-cyan ring-1 ring-dragon-cyan/25">
                                👑 Supplier Store
                              </span>
                            </div>
                          </div>

                          {userProfile?.businessDescription && (
                            <p className="text-xs text-gray-400 leading-relaxed max-w-md italic border-t border-b border-white/5 py-3 mt-1 font-sans">
                              "{userProfile.businessDescription}"
                            </p>
                          )}
                        </div>

                        {/* DELIVERY CHARGES DISPLAY */}
                        <div className="px-6 pb-2 text-left space-y-3">
                          <div className="flex items-center gap-1.5 border-b border-white/5 pb-2">
                            <Truck size={14} className="text-dragon-cyan" />
                            <h3 className="text-xs font-black uppercase tracking-wider text-white">
                              Delivery Charges
                            </h3>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-white/[0.01] border border-white/5 rounded-2xl">
                              <span className="text-[8px] font-black uppercase text-gray-500 tracking-wider block">{deliveryLabelInside || 'Inside Dhaka'}</span>
                              <span className="text-xs font-bold text-white mt-1 block">৳{deliveryChargeInside}</span>
                            </div>
                            <div className="p-3 bg-white/[0.01] border border-white/5 rounded-2xl">
                              <span className="text-[8px] font-black uppercase text-gray-500 tracking-wider block">{deliveryLabelOutside || 'Outside Dhaka'}</span>
                              <span className="text-xs font-bold text-white mt-1 block">৳{deliveryChargeOutside}</span>
                            </div>
                          </div>

                          {customDeliveryCharges.length > 0 && (
                            <div className="space-y-2 mt-2">
                              <span className="text-[8px] font-black uppercase text-gray-500 tracking-wider block">Area & Sub-area Custom Charges:</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {customDeliveryCharges.map((item, idx) => (
                                  <div key={`preview-custom-charge-${idx}`} className="p-2.5 bg-black/40 border border-white/5 rounded-xl text-left space-y-1">
                                    <div className="flex justify-between items-center">
                                      <span className="text-xs font-bold text-white">{item.area}</span>
                                      <span className="text-[10px] font-bold text-dragon-cyan">৳{item.charge}</span>
                                    </div>
                                    {item.subAreas && item.subAreas.length > 0 && (
                                      <div className="flex flex-wrap gap-1 pt-1">
                                        {item.subAreas.map((sub, sIdx) => (
                                          <span key={`sub-idx-${sIdx}`} className="text-[8px] bg-white/5 text-gray-400 px-1.5 py-0.5 rounded">
                                            {sub}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 3. PRODUCT CATALOG & CATEGORIES GRID (MATCHES INBOX PROFILE DRAWER VIEW) */}
                        <div className="px-6 pb-8 space-y-4 text-left">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                            <div>
                              <h3 className="text-xs font-black uppercase tracking-wider text-pink-600 dark:text-dragon-cyan flex items-center gap-1.5 font-mono">
                                <ShoppingBag size={14} /> Catalog Preview ({publicCatalogItems.length} Products)
                              </h3>
                              <p className="text-[10px] text-gray-400 font-medium">This is how buyers see your catalog in chat inbox.</p>
                            </div>
                            
                            {/* Search box for preview */}
                            <div className="relative w-full sm:w-64">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={13} />
                              <input
                                type="text"
                                placeholder="Search categories or products..."
                                value={previewModalSearch}
                                onChange={e => setPreviewModalSearch(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs font-semibold text-white focus:outline-none focus:border-pink-500 dark:focus:border-dragon-cyan transition-all"
                              />
                              {previewModalSearch && (
                                <button onClick={() => setPreviewModalSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-white">✕</button>
                              )}
                            </div>
                          </div>

                          {/* VIEW 1: Categories Grid (When category is 'all' and no search) */}
                          {previewModalCategory === 'all' && !previewModalSearch ? (
                            <div className="space-y-3 pt-1">
                              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                <h3 className="text-xs font-black uppercase tracking-widest text-dragon-cyan flex items-center gap-2">
                                  <Tag size={15} /> Store Categories ({storeCategories.length})
                                </h3>
                                <span className="text-[10px] text-gray-400 font-medium">Click category to view products inside</span>
                              </div>

                              {storeCategories.length === 0 ? (
                                <div className="py-12 px-6 text-center glass-card border-dashed space-y-3 border-dragon-cyan/30 bg-white/[0.01]">
                                  <div className="w-16 h-16 rounded-full bg-dragon-cyan/10 border-2 border-pink-500 dark:border-dragon-cyan category-circle-border flex items-center justify-center mx-auto text-pink-600 dark:text-dragon-cyan shadow-xl">
                                    <Tag size={28} />
                                  </div>
                                  <h3 className="text-sm font-black text-white uppercase tracking-wider">No Categories Found</h3>
                                  <p className="text-xs text-gray-400">Products in this store haven't been assigned to categories yet.</p>
                                </div>
                              ) : (
                                <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3.5 pb-2">
                                  {storeCategories.map(cat => {
                                    const catProds = publicCatalogItems.filter((i: any) => i.category === cat.name);
                                    return (
                                      <div
                                        key={cat.id || cat.name}
                                        onClick={() => setPreviewModalCategory(cat.name)}
                                        className="glass-card p-2.5 sm:p-3.5 flex flex-col items-center text-center gap-1.5 sm:gap-2 border-white/10 hover:border-dragon-cyan/50 hover:bg-white/[0.05] transition-all cursor-pointer group relative overflow-hidden shadow-lg hover:shadow-dragon-cyan/10 bg-white/[0.02] rounded-2xl"
                                      >
                                        {/* Circular Image with Pink/Cyan Border */}
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-pink-500 dark:border-dragon-cyan category-circle-border bg-white/5 flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform duration-300 relative shrink-0">
                                          {cat.imageUrl ? (
                                            <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                          ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-cyan-500/20 dark:from-dragon-cyan/20 dark:via-cyan-500/20 dark:to-dragon-cyan/20 flex items-center justify-center text-pink-600 dark:text-dragon-cyan">
                                              <Tag size={24} className="sm:w-7 sm:h-7" />
                                            </div>
                                          )}
                                        </div>

                                        <div className="space-y-0.5 w-full">
                                          <h4 className="font-display font-black text-[10px] sm:text-xs text-white uppercase tracking-wider truncate group-hover:text-dragon-cyan transition-colors leading-tight">
                                            {cat.name}
                                          </h4>
                                          <div className="inline-flex items-center gap-1 text-[8.5px] sm:text-[9px] font-mono text-dragon-cyan bg-dragon-cyan/10 px-2 py-0.5 rounded-full border border-dragon-cyan/20 font-bold">
                                            <span>{catProds.length}</span>
                                            <span>{catProds.length === 1 ? 'Product' : 'Products'}</span>
                                          </div>
                                        </div>

                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setPreviewModalCategory(cat.name);
                                          }}
                                          className="w-full py-1 sm:py-1.5 bg-dragon-cyan/10 group-hover:bg-dragon-cyan text-dragon-cyan group-hover:text-dragon-black text-[8px] sm:text-[9px] font-black uppercase tracking-wider rounded-lg sm:rounded-xl transition-all flex items-center justify-center gap-1 border border-dragon-cyan/30 cursor-pointer"
                                        >
                                          <span>View Products</span>
                                          <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform sm:w-3 sm:h-3" />
                                        </button>
                                      </div>
                                    );
                                  })}

                                  {/* Uncategorized Card */}
                                  {(() => {
                                    const uncatProds = publicCatalogItems.filter((i: any) => !i.category || !storeCategories.some(c => c.name === i.category));
                                    if (uncatProds.length === 0) return null;
                                    return (
                                      <div
                                        onClick={() => setPreviewModalCategory('Uncategorized')}
                                        className="glass-card p-3.5 flex flex-col items-center text-center gap-2 border-amber-500/30 hover:border-amber-500 hover:bg-amber-500/[0.05] transition-all cursor-pointer group relative overflow-hidden shadow-lg bg-white/[0.02]"
                                      >
                                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-amber-500 bg-amber-500/10 flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform duration-300 shrink-0 text-amber-400 font-black text-xl">
                                          ?
                                        </div>
                                        <div className="space-y-0.5 w-full">
                                          <h4 className="font-display font-black text-xs text-amber-400 uppercase tracking-wider truncate">
                                            Uncategorized
                                          </h4>
                                          <div className="inline-flex items-center gap-1 text-[9px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-bold">
                                            <span>{uncatProds.length} Products</span>
                                          </div>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setPreviewModalCategory('Uncategorized');
                                          }}
                                          className="w-full py-1.5 bg-amber-500/10 group-hover:bg-amber-500 text-amber-400 group-hover:text-black text-[9px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 border border-amber-500/30 cursor-pointer"
                                        >
                                          <span>View Products</span>
                                          <ArrowRight size={11} />
                                        </button>
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                          ) : (
                            /* VIEW 2: Inside Specific Category or Searching */
                            <div className="space-y-3">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white/5 p-3 rounded-2xl border border-white/10 shadow-md">
                                <button
                                  onClick={() => {
                                    setPreviewModalCategory('all');
                                    setPreviewModalSearch('');
                                  }}
                                  className="back-category-btn px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white dark:bg-none dark:bg-dragon-cyan dark:hover:bg-dragon-cyan/90 dark:text-dragon-black font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-pink-500/20 dark:shadow-dragon-cyan/20 border border-pink-400/30 dark:border-dragon-cyan/30"
                                >
                                  <ArrowLeft size={16} /> Back To All Categories (সকল ক্যাটাগরি)
                                </button>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                    {previewModalCategory === 'all' ? `Search: "${previewModalSearch}"` : previewModalCategory}
                                  </span>
                                  <span className="text-[10px] text-pink-700 dark:text-dragon-cyan font-bold bg-pink-100 dark:bg-dragon-cyan/10 px-2.5 py-0.5 rounded-full border border-pink-300 dark:border-dragon-cyan/20">
                                    {
                                      publicCatalogItems.filter(item => {
                                        const matchesSearch = !previewModalSearch || 
                                          (item.name || '').toLowerCase().includes(previewModalSearch.toLowerCase()) ||
                                          (item.details || '').toLowerCase().includes(previewModalSearch.toLowerCase()) ||
                                          (item.category || '').toLowerCase().includes(previewModalSearch.toLowerCase());
                                        
                                        if (previewModalCategory === 'all') return matchesSearch;
                                        if (previewModalCategory === 'Uncategorized') {
                                          return matchesSearch && (!item.category || !storeCategories.some(c => c.name === item.category));
                                        }
                                        return matchesSearch && item.category === previewModalCategory;
                                      }).length
                                    } Products
                                  </span>
                                </div>
                              </div>

                              {/* Products List Grid */}
                              {(() => {
                                const modalFilteredProducts = publicCatalogItems.filter(item => {
                                  const matchesSearch = !previewModalSearch || 
                                    (item.name || '').toLowerCase().includes(previewModalSearch.toLowerCase()) ||
                                    (item.details || '').toLowerCase().includes(previewModalSearch.toLowerCase()) ||
                                    (item.category || '').toLowerCase().includes(previewModalSearch.toLowerCase());
                                  
                                  if (previewModalCategory === 'all') return matchesSearch;
                                  if (previewModalCategory === 'Uncategorized') {
                                    return matchesSearch && (!item.category || !storeCategories.some(c => c.name === item.category));
                                  }
                                  return matchesSearch && item.category === previewModalCategory;
                                });

                                if (modalFilteredProducts.length === 0) {
                                  return (
                                    <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
                                      <ShoppingBag size={36} className="mx-auto text-gray-600 mb-2" />
                                      <p className="text-xs font-bold text-gray-400 uppercase">No products found in this category</p>
                                      <button
                                        onClick={() => { setPreviewModalCategory('all'); setPreviewModalSearch(''); }}
                                        className="mt-3 px-4 py-2 bg-dragon-cyan/10 text-dragon-cyan text-xs font-black uppercase tracking-wider rounded-xl border border-dragon-cyan/30 hover:bg-dragon-cyan hover:text-black transition-all cursor-pointer"
                                      >
                                        View All Categories
                                      </button>
                                    </div>
                                  );
                                }

                                return (
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {modalFilteredProducts.map((prod: any) => (
                                      <div 
                                        key={prod.id} 
                                        className="bg-zinc-950/40 border border-white/5 rounded-2xl p-3 flex flex-col justify-between group hover:border-dragon-cyan/25 transition-all text-left"
                                      >
                                        <div className="space-y-2">
                                          <div className="relative aspect-square w-full rounded-xl bg-white/5 overflow-hidden">
                                            <img 
                                              src={prod.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80'} 
                                              className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" 
                                              alt={prod.name}
                                              referrerPolicy="no-referrer"
                                            />
                                            {prod.category && (
                                              <span className="absolute top-1.5 left-1.5 text-[7px] bg-black/75 border border-white/10 text-dragon-cyan px-1.5 py-0.5 rounded uppercase font-black tracking-widest leading-none font-bold">
                                                {prod.category}
                                              </span>
                                            )}
                                          </div>
                                          <div>
                                            <h4 className="text-xs font-bold text-white truncate group-hover:text-dragon-cyan transition-colors">{prod.name}</h4>
                                            <div className="flex items-baseline gap-1 mt-0.5">
                                              <span className="text-dragon-cyan font-black font-mono text-xs">৳{prod.sellPrice || 0}</span>
                                              <span className="text-gray-500 line-through text-[9px] font-mono">৳{Math.round((prod.sellPrice || 0) * 1.35)}</span>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        {prod.details && (
                                          <p className="text-[9px] text-gray-500 line-clamp-2 leading-relaxed font-sans mt-1.5">{prod.details}</p>
                                        )}

                                        <button
                                          type="button"
                                          className="order-now-btn w-full mt-2 py-1.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white dark:bg-none dark:bg-dragon-cyan dark:text-dragon-black font-black text-[9px] uppercase tracking-wider rounded-lg flex items-center justify-center gap-1 shadow-md shadow-pink-500/20 dark:shadow-dragon-cyan/15"
                                        >
                                          <ShoppingBag size={10} className="text-white dark:text-dragon-black" /> Order Now
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Modal Footer actions */}
                      <div className="p-4 border-t border-white/5 bg-zinc-950/70 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setShowCatalogPreviewModal(false)}
                          className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all border border-white/5"
                        >
                          Close
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          );
        })()}
      </div>

      {/* Inventory Product Selector Modal - Full Page */}
      <AnimatePresence>
        {showProductModal && selectedWebsite && (() => {
          const currentSelectedWebsite = proWebsites.find(w => w.id === selectedWebsite.id) || selectedWebsite;
          const filteredItems = inventoryItems.filter(item => {
            const q = inventorySearch.toLowerCase();
            return (item.name || '').toLowerCase().includes(q) || (item.details || '').toLowerCase().includes(q);
          });
          return (
            <>
              {/* Modal Box - Full Screen Overlay */}
              <div className="fixed inset-0 bg-dragon-black z-[60] p-6 md:p-10 overflow-y-auto animate-scale-up flex flex-col">
                <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col space-y-6">
                  
                  {/* Header */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/5 shrink-0">
                    <div>
                      <div className="text-[10px] text-dragon-cyan font-black uppercase tracking-widest mb-1">
                        Inventory Products Catalog
                      </div>
                      <h3 className="text-2xl font-black text-white leading-tight">
                        Add Products to {currentSelectedWebsite.brandName || 'Pro Website'}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">
                        Select products from your inventory that you want to display on your website catalog and configure their price and discount.
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        setShowProductModal(false);
                        setSelectedWebsite(null);
                        setInventorySearch('');
                      }}
                      className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors border border-white/5"
                    >
                      ✕ Close
                    </button>
                  </div>

                  {/* Search and stats bar */}
                  <div className="flex flex-col sm:flex-row gap-4 items-center shrink-0">
                    <div className="relative flex-1 w-full">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                      <input 
                        type="text"
                        placeholder="Search inventory products (by name or description)..."
                        value={inventorySearch}
                        onChange={(e) => setInventorySearch(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-xs font-semibold text-white focus:outline-none focus:border-dragon-cyan focus:ring-1 focus:ring-dragon-cyan transition-all"
                      />
                    </div>
                    <div className="px-4 py-3 bg-white/2 border border-white/5 rounded-2xl text-xs text-gray-400 font-bold shrink-0">
                      Total Products: <span className="text-dragon-cyan font-mono font-black">{filteredItems.length}</span>
                    </div>
                  </div>

                  {/* Products Grid Frame */}
                  <div className="grow overflow-y-auto min-h-[50vh]">
                    {filteredItems.length === 0 ? (
                      <div className="text-center py-20 border border-dashed border-white/5 bg-white/[0.01] rounded-3xl my-6">
                        <ShoppingBag size={48} className="mx-auto text-gray-600 mb-3" />
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">No inventory products found</p>
                        <p className="text-xs text-gray-500 mt-1">Go to your Inventory tab first to add some products.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-2">
                        {filteredItems.map((item, idx) => {
                          const isAdded = (currentSelectedWebsite.catalog || []).some((p: any) => p.id === item.id);
                          const catalogItem = (currentSelectedWebsite.catalog || []).find((p: any) => p.id === item.id);
                          return (
                            <div 
                              key={`showcase-catalog-item-${item.id}-${idx}`}
                              className={`flex flex-col p-4 rounded-3xl border transition-all justify-between gap-4 ${
                                isAdded 
                                  ? "border-dragon-cyan/40 bg-dragon-cyan/[0.03] shadow-lg shadow-dragon-cyan/5" 
                                  : "border-white/5 hover:border-white/10 bg-white/[0.01]"
                              }`}
                            >
                              <div className="space-y-3">
                                {/* Image & Info */}
                                <div className="flex gap-4 items-start">
                                  {item.image ? (
                                    <img 
                                      src={item.image} 
                                      alt={item.name} 
                                      className="w-16 h-16 rounded-2xl object-cover bg-neutral-800 border border-white/10"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="w-16 h-16 rounded-2xl bg-neutral-800 border border-white/10 flex items-center justify-center">
                                      <ShoppingBag size={24} className="text-gray-600" />
                                    </div>
                                  )}
                                  <div className="space-y-1 min-w-0 flex-1">
                                    <div className="text-xs font-black text-white truncate">{item.name}</div>
                                    <div className="text-[10px] text-gray-500 line-clamp-1">{item.details || 'No description'}</div>
                                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                      {item.buyPrice && (
                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold">
                                          Buy: ৳{item.buyPrice}
                                        </span>
                                      )}
                                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-dragon-cyan/10 text-dragon-cyan font-bold font-mono">
                                        Sell: ৳{item.sellPrice || 0}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Catalog pricing status if added */}
                                {isAdded && catalogItem && (
                                  <div className="p-2.5 bg-white/[0.02] border border-white/5 rounded-2xl text-[10px] space-y-1">
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Original Price:</span>
                                      <span className="font-bold text-white">৳{catalogItem.comparePrice || catalogItem.price}</span>
                                    </div>
                                    {catalogItem.discount && catalogItem.discount > 0 ? (
                                      <>
                                        <div className="flex justify-between">
                                          <span className="text-gray-500">Discount (%):</span>
                                          <span className="font-bold text-red-400">-{catalogItem.discount}% OFF</span>
                                        </div>
                                        <div className="flex justify-between border-t border-white/5 pt-1 mt-1">
                                          <span className="text-gray-400 font-bold">Catalog Price:</span>
                                          <span className="font-bold text-dragon-cyan">৳{catalogItem.price}</span>
                                        </div>
                                      </>
                                    ) : (
                                      <div className="flex justify-between border-t border-white/5 pt-1 mt-1">
                                        <span className="text-gray-400 font-bold">Catalog Price:</span>
                                        <span className="font-bold text-dragon-cyan">৳{catalogItem.price}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                                {isAdded ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => openProductConfiguration(item, currentSelectedWebsite)}
                                      className="flex-1 px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border border-indigo-500/10 cursor-pointer"
                                      title="Modify price or settings"
                                    >
                                      <Settings size={12} className="text-indigo-400" /> Configure
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => toggleCatalogProduct(currentSelectedWebsite.id, item)}
                                      className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 border border-rose-500/10 cursor-pointer"
                                      title="Remove from catalog"
                                    >
                                      ✕ Remove
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => openProductConfiguration(item, currentSelectedWebsite)}
                                    className="w-full px-3 py-2 bg-dragon-cyan/15 hover:bg-dragon-cyan text-dragon-cyan hover:text-black rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border border-dragon-cyan/20 cursor-pointer"
                                  >
                                    <Plus size={12} /> Select
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  
                  {/* Bottom Footer block */}
                  <div className="mt-auto pt-4 border-t border-white/5 flex justify-end shrink-0">
                    <button
                      onClick={() => {
                        setShowProductModal(false);
                        setSelectedWebsite(null);
                        setInventorySearch('');
                      }}
                      className="px-6 py-3 bg-dragon-cyan text-black hover:bg-white rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer transition-colors shadow-lg shadow-dragon-cyan/10 active:scale-95"
                    >
                      Done
                    </button>
                  </div>

                </div>
              </div>
            </>
          );
        })()}
      </AnimatePresence>

      {/* Category & Pricing Configuration Dialog Popup */}
      <AnimatePresence>
        {productForCategorySelection && selectedWebsite && (() => {
          const currentSelectedWebsite = proWebsites.find(w => w.id === selectedWebsite.id) || selectedWebsite;
          const websiteCats = currentSelectedWebsite.categories || [];
          
          const buyPrice = productForCategorySelection.buyPrice || 0;
          const originalPrice = parseFloat(promptPrice) || 0;
          const discountPct = parseFloat(promptDiscount) || 0;
          const finalPrice = Math.round(originalPrice * (1 - discountPct / 100));
          const netProfit = finalPrice - buyPrice;

          const handleSave = async () => {
            if (!promptPrice || originalPrice <= 0) {
              triggerSuccess('Invalid Price', 'Please enter a valid sales price.');
              return;
            }
            if (discountPct < 0 || discountPct > 100) {
              triggerSuccess('Invalid Discount', 'Discount percentage must be between 0 and 100.');
              return;
            }
            await addProductToCatalogWithPricing(
              currentSelectedWebsite.id,
              productForCategorySelection,
              promptCategory,
              finalPrice,
              originalPrice,
              discountPct,
              promptVideoUrl
            );
            setProductForCategorySelection(null);
          };

          return (
            <>
              {/* Overlay Backdrop */}
              <div 
                className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[70] transition-opacity animate-fade-in"
                onClick={() => setProductForCategorySelection(null)}
              />
              
              {/* Dialog Content */}
              <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#0d0f14] border border-white/10 rounded-3xl p-6 z-[80] shadow-2xl animate-scale-up text-left space-y-5">
                <div className="flex justify-between items-start pb-3 border-b border-white/5">
                  <div>
                    <span className="text-[10px] text-dragon-cyan font-black uppercase tracking-widest block mb-1">Product Configuration</span>
                    <h4 className="text-base font-black text-white leading-tight">
                      "{productForCategorySelection.name}" Catalog Settings
                    </h4>
                  </div>
                  <button 
                    onClick={() => setProductForCategorySelection(null)}
                    className="p-1 px-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Form fields */}
                <div className="space-y-4">
                  {/* Category Selection dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">Select Category</label>
                    <select
                      value={promptCategory}
                      onChange={(e) => setPromptCategory(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-dragon-cyan cursor-pointer font-semibold"
                    >
                      <option value="all" className="bg-[#0c0d12]">All Products (Default)</option>
                      {websiteCats.filter((c: any) => c.id !== 'all').map((cat: any, cidx: number) => (
                        <option key={`prompt-cat-${cat.id}-${cidx}`} value={cat.id} className="bg-[#0c0d12]">
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Pricing Inputs */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">Original Retail Price (৳)</label>
                      <input
                        type="number"
                        placeholder="e.g. 2000"
                        value={promptPrice}
                        onChange={(e) => setPromptPrice(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-bold outline-none focus:border-dragon-cyan"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">Discount % (Optional)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="e.g. 10"
                        value={promptDiscount}
                        onChange={(e) => setPromptDiscount(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-bold outline-none focus:border-dragon-cyan"
                      />
                    </div>
                  </div>

                  {/* YouTube video url input */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block flex items-center gap-1">
                      <Youtube size={12} className="text-red-500" /> YouTube Video Link (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={promptVideoUrl}
                      onChange={(e) => setPromptVideoUrl(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-mono outline-none focus:border-dragon-cyan"
                    />
                  </div>

                  {/* Dynamic calculation summary screen */}
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">Purchase Price:</span>
                      <span className="font-mono font-bold text-white">৳{buyPrice}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">Original Selling Price:</span>
                      <span className="font-mono font-bold text-white">৳{originalPrice}</span>
                    </div>
                    {discountPct > 0 && (
                      <div className="flex justify-between items-center text-xs text-rose-400">
                        <span>Discount Offer ({discountPct}%):</span>
                        <span className="font-mono font-bold">-৳{Math.round(originalPrice * (discountPct / 100))}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-xs border-t border-white/5 pt-2.5">
                      <span className="text-gray-200 font-black">Final Selling Price (with offer):</span>
                      <span className="font-mono text-sm font-black text-dragon-cyan">৳{finalPrice}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-white/5 pt-2.5">
                      <span className="text-gray-200 font-black">Your Net Profit:</span>
                      <span className={`font-mono text-sm font-black p-1 px-2.5 rounded-lg ${netProfit >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        ৳{netProfit} {netProfit >= 0 ? "(Profit)" : "(Loss)"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-3 justify-end pt-3 border-t border-white/5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setProductForCategorySelection(null)}
                    className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-5 py-2.5 bg-dragon-cyan text-black hover:bg-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-colors shadow-md shadow-dragon-cyan/10"
                  >
                    Save
                  </button>
                </div>
              </div>
            </>
          );
        })()}
      </AnimatePresence>

      {/* MY CATALOG ADDING POPUP */}
      <AnimatePresence>
        {productForMyCatalogSelection && (() => {
          const buyPrice = productForMyCatalogSelection.buyPrice || 0;
          const originalWholesalePrice = productForMyCatalogSelection.sellPrice || 0;
          const hasWholesalePrice = typeof productForMyCatalogSelection.sellPrice === 'number' && productForMyCatalogSelection.sellPrice > 0;

          const handleSaveMyCatalog = async () => {
            const finalWholesalePrice = hasWholesalePrice ? originalWholesalePrice : parseFloat(myCatalogPriceInput);
            if (!finalWholesalePrice || finalWholesalePrice <= 0 || isNaN(finalWholesalePrice)) {
              triggerSuccess('Invalid Price', 'Please enter a valid wholesale price.');
              return;
            }

            try {
              // 1. Update inventory document with isPublic = true and (if not set before) sellPrice
              const updateData: any = {
                isPublic: true,
                updatedAt: new Date().toISOString()
              };
              if (!hasWholesalePrice) {
                updateData.sellPrice = finalWholesalePrice;
              }
              await updateDoc(doc(db, 'inventory', productForMyCatalogSelection.id), {
                ...updateData
              });

              // Also update the local state for immediate UI update
              setInventoryItems(prev => prev.map(item => {
                if (item.id === productForMyCatalogSelection.id) {
                  return {
                    ...item,
                    isPublic: true,
                    sellPrice: hasWholesalePrice ? item.sellPrice : finalWholesalePrice
                  };
                }
                return item;
              }));

              // 2. If the user has any Pro Websites, add to the first Pro Website's catalog too, keeping it synchronized!
              if (proWebsites.length > 0) {
                try {
                  await addProductToCatalogWithPricing(
                    proWebsites[0].id,
                    { ...productForMyCatalogSelection, sellPrice: finalWholesalePrice },
                    'all',
                    finalWholesalePrice,
                    finalWholesalePrice,
                    0,
                    ''
                  );
                } catch (err) {
                  console.warn("Could not sync to Pro Website catalog:", err);
                }
              }

              triggerSuccess('Product Added!', `"${productForMyCatalogSelection.name}" added to catalog successfully.`);
              setProductForMyCatalogSelection(null);
            } catch (err) {
              console.error("Error adding to My Catalog:", err);
              triggerSuccess('Catalog Error', 'Could not add to catalog. Please try again.');
            }
          };

          return (
            <>
              {/* Overlay Backdrop */}
              <div 
                className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[70] transition-opacity animate-fade-in"
                onClick={() => setProductForMyCatalogSelection(null)}
              />
              
              {/* Dialog Content */}
              <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#0d0f14] border border-white/10 rounded-3xl p-6 z-[80] shadow-2xl animate-scale-up text-left space-y-5">
                <div className="flex justify-between items-start pb-3 border-b border-white/5">
                  <div>
                    <span className="text-[10px] text-dragon-cyan font-black uppercase tracking-widest block mb-1">Catalog Product Settings</span>
                    <h4 className="text-base font-black text-white leading-tight">
                      "{productForMyCatalogSelection.name}"
                    </h4>
                  </div>
                  <button 
                    onClick={() => setProductForMyCatalogSelection(null)}
                    className="p-1 px-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Form fields */}
                <div className="space-y-4">
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400 font-semibold">Buying Price:</span>
                      <span className="font-mono font-black text-white text-base">৳{buyPrice}</span>
                    </div>
                    
                    {hasWholesalePrice ? (
                      <div className="flex justify-between items-center text-sm border-t border-white/5 pt-4">
                        <span className="text-gray-400 font-semibold">Wholesale Price:</span>
                        <span className="font-mono font-black text-dragon-cyan text-base">৳{originalWholesalePrice}</span>
                      </div>
                    ) : (
                      <div className="space-y-2 border-t border-white/5 pt-4">
                        <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Setup Wholesale Price</label>
                        <input
                          type="number"
                          placeholder="Enter wholesale price (৳)"
                          value={myCatalogPriceInput}
                          onChange={(e) => setMyCatalogPriceInput(e.target.value)}
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-black outline-none focus:border-dragon-cyan"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-3 justify-end pt-3 border-t border-white/5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setProductForMyCatalogSelection(null)}
                    className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveMyCatalog}
                    className="px-5 py-2.5 bg-dragon-cyan text-black hover:bg-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-colors shadow-md shadow-dragon-cyan/10"
                  >
                    Add to Catalog
                  </button>
                </div>
              </div>
            </>
          );
        })()}
      </AnimatePresence>

      {/* PRO WEBSITE ACTIVATION MODAL */}
      <AnimatePresence>
        {showProActivationModal && selectedActivationWebsite && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/90 backdrop-blur-md z-[70] animate-fade-in"
              onClick={() => setShowProActivationModal(false)}
            />

            {/* Modal */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-[#0d0f14] border border-white/10 rounded-3xl p-6 z-[80] shadow-2xl animate-scale-up text-left flex flex-col max-h-[90vh] overflow-y-auto font-sans">
              {/* Header */}
              <div className="flex justify-between items-start pb-4 border-b border-white/5 shrink-0">
                <div>
                  <span className="text-[10px] text-dragon-cyan font-black uppercase tracking-widest block mb-1">PRO WEBSITE ACTIVATION</span>
                  <h4 className="text-lg font-black text-white leading-tight">
                    {selectedActivationWebsite.brandName || 'Unnamed Store'}
                  </h4>
                </div>
                <button 
                  onClick={() => setShowProActivationModal(false)}
                  className="p-1.5 px-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-xs cursor-pointer font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Plans Selection */}
              <div className="space-y-4 py-4 overflow-y-auto flex-1">
                <p className="text-xs text-gray-400">Select a plan below to activate or extend your website subscription:</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: '1_month', label: '1 Month Starter', price: `৳${getProWebsitePrice('1_month', 'bd')}` },
                    { id: '3_months', label: '3 Months Growth', price: `৳${getProWebsitePrice('3_months', 'bd')}`, badge: '10% OFF' },
                    { id: '6_months', label: '6 Months Pro', price: `৳${getProWebsitePrice('6_months', 'bd')}`, badge: '20% OFF' },
                    { id: '1_year', label: '1 Year Ultimate', price: `৳${getProWebsitePrice('1_year', 'bd')}`, badge: '30% OFF' }
                  ].map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlan(plan.id as any)}
                      className={cn(
                        "p-3.5 sm:p-4 rounded-2xl border text-left flex flex-col justify-between transition-all relative overflow-hidden min-h-[110px] h-auto group cursor-pointer",
                        selectedPlan === plan.id 
                          ? "bg-dragon-cyan/10 border-dragon-cyan shadow-lg shadow-dragon-cyan/5" 
                          : "bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/[0.08]"
                      )}
                    >
                      {plan.badge && (
                        <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-dragon-cyan text-dragon-black font-black uppercase text-[7px] rounded">
                          {plan.badge}
                        </div>
                      )}
                      
                      <div className="space-y-1">
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full inline-block",
                          selectedPlan === plan.id ? "bg-dragon-cyan animate-pulse" : "bg-gray-600"
                        )} />
                        <h5 className="text-[11px] font-black uppercase tracking-wider text-white group-hover:text-dragon-cyan transition-colors">{plan.label}</h5>
                      </div>

                      <div className="mt-3 pt-2 border-t border-white/10 w-full flex justify-between items-baseline">
                        <p className="text-base sm:text-lg font-display font-black text-white group-hover:text-dragon-cyan transition-colors">{plan.price}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Gateway Block */}
                <div className="pt-4 border-t border-white/5">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-dragon-cyan mb-3">Select Payment Gateway:</h5>

                  {bkashSettings.autoPaymentEnabled ? (
                    <div className="space-y-4">
                      <p className="text-xs text-gray-400 font-light leading-relaxed">
                        Click the button below to pay via bkash Automatic Payment Gateway. Your website will be activated instantly once payment is successful.
                      </p>
                      <button
                        onClick={() => {
                          setBkashPhoneNumber('');
                          setBkashOtp('');
                          setBkashPin('');
                          setBkashAgreedToTerms(false);
                          setBkashOtpTimer(120);
                          setBkashGatewayError('');
                          setBkashGatewayStep(1);
                          setShowBkashGateway(true);
                        }}
                        className="w-full py-4 bg-gradient-to-r from-dragon-cyan to-dragon-purple hover:opacity-90 text-dragon-black font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
                      >
                        <Zap size={15} /> Automatic bKash Payment (Pay Now)
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-2">
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">bKash Payment Number (Send Money):</p>
                        <div className="flex items-center justify-between gap-2 bg-black/40 px-4 py-2.5 rounded-xl border border-white/5">
                          <span className="text-sm font-mono font-bold text-white tracking-wider">{bkashSettings.manualNumber}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(bkashSettings.manualNumber);
                              triggerSuccess('Copied to Clipboard!', 'bKash number copied to clipboard successfully.');
                            }}
                            className="text-[9px] font-black uppercase tracking-widest text-dragon-cyan hover:underline bg-white/5 hover:bg-white/10 px-2 py-1 rounded cursor-pointer"
                          >
                            Copy
                          </button>
                        </div>
                        <p className="text-[10px] text-amber-550 font-bold leading-relaxed">
                          * Please Send Money to the bKash number listed above. After sending, provide your sender number and Transaction ID below.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">bKash Number (Sender Number):</label>
                          <input
                            type="tel"
                            placeholder="01XXXXXXXXX"
                            value={senderNumber}
                            onChange={(e) => setSenderNumber(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs focus:border-dragon-cyan outline-none transition-all text-white font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">TrxID (Transaction ID):</label>
                          <input
                            type="text"
                            placeholder="Enter Transaction ID"
                            value={trxId}
                            onChange={(e) => setTrxId(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs focus:border-dragon-cyan outline-none transition-all text-white font-mono uppercase"
                          />
                        </div>
                      </div>

                      <button
                        onClick={async () => {
                          if (!senderNumber.trim()) return triggerSuccess('Input Required', 'Please enter your bKash number.');
                          if (!trxId.trim()) return triggerSuccess('Input Required', 'Please enter your Trx ID.');

                          setSubmittingActivation(true);
                          try {
                            await updateDoc(doc(db, 'pro_websites', selectedActivationWebsite.id), {
                              paymentStatus: 'pending',
                              selectedPlan: selectedPlan,
                              paymentPhone: senderNumber,
                              paymentTrxId: trxId.trim().toUpperCase(),
                              paymentSubmittedAt: new Date().toISOString()
                            });
                            triggerSuccess('Payment Submitted!', 'Payment submitted successfully! We will verify and activate your website shortly.');
                            setShowProActivationModal(false);
                            setSenderNumber('');
                            setTrxId('');
                          } catch (err) {
                            console.error(err);
                            triggerSuccess('Payment Error', 'Payment submission failed. Please try again.');
                          } finally {
                            setSubmittingActivation(false);
                          }
                        }}
                        disabled={submittingActivation}
                        className="w-full py-4 bg-dragon-cyan hover:bg-dragon-cyan/90 text-dragon-black font-black uppercase tracking-widest text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer disabled:opacity-50 font-sans"
                      >
                        {submittingActivation ? (
                          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <><Check size={15} /> Submit Payment</>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* DRAGON BOT ACTIVATION MODAL */}
      <AnimatePresence>
        {showBotActivationModal && selectedBotActivationWebsite && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/90 backdrop-blur-md z-[70] animate-fade-in"
              onClick={() => setShowBotActivationModal(false)}
            />

            {/* Modal */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-[#0d0f14] border border-white/10 rounded-3xl p-6 z-[80] shadow-2xl animate-scale-up text-left flex flex-col max-h-[90vh] overflow-y-auto font-sans">
              {/* Header */}
              <div className="flex justify-between items-start pb-4 border-b border-white/5 shrink-0">
                <div>
                  <span className="text-[10px] text-dragon-cyan font-black uppercase tracking-widest block mb-1">DRAGON BOT ACTIVATION</span>
                  <h4 className="text-lg font-black text-white leading-tight">
                    {selectedBotActivationWebsite.brandName || 'Unnamed Store'}
                  </h4>
                </div>
                <button 
                  onClick={() => setShowBotActivationModal(false)}
                  className="p-1.5 px-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-xs cursor-pointer font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Country Mode Toggle */}
              <div className="flex bg-white/5 p-1 rounded-xl mt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setBotBillingCountryMode('bd')}
                  className={cn(
                    "flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer",
                    botBillingCountryMode === 'bd' ? "bg-dragon-cyan text-dragon-black font-black" : "text-gray-400 hover:text-white"
                  )}
                >
                  🇧🇩 For Bangladesh (bKash)
                </button>
                <button
                  type="button"
                  onClick={() => setBotBillingCountryMode('intl')}
                  className={cn(
                    "flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer",
                    botBillingCountryMode === 'intl' ? "bg-dragon-cyan text-dragon-black font-black" : "text-gray-400 hover:text-white"
                  )}
                >
                  🌐 International (Stripe)
                </button>
              </div>

              {/* Plans Selection */}
              <div className="space-y-4 py-4 overflow-y-auto flex-1">
                <p className="text-xs text-gray-400">Select a plan below to activate Dragon Chatbot:</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: '1_month', label: '1 Month Bot', priceBD: '৳6000', priceIntl: '$20', desc: 'Bot service fully active for 1 month' },
                    { id: '3_months', label: '3 Months Bot', priceBD: '৳15000', priceIntl: '$55', desc: 'Bot service fully active for 3 months', badge: 'Best Value' }
                  ].map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setBotSelectedPlan(plan.id as any)}
                      className={cn(
                        "p-3.5 sm:p-4 rounded-2xl border text-left flex flex-col justify-between transition-all relative overflow-hidden min-h-[115px] h-auto group cursor-pointer",
                        botSelectedPlan === plan.id 
                          ? "bg-dragon-cyan/10 border-dragon-cyan shadow-lg shadow-dragon-cyan/5" 
                          : "bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/[0.08]"
                      )}
                    >
                      {plan.badge && (
                        <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-dragon-cyan text-dragon-black font-black uppercase text-[7px] rounded">
                          {plan.badge}
                        </div>
                      )}
                      
                      <div className="space-y-1">
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full inline-block",
                          botSelectedPlan === plan.id ? "bg-dragon-cyan animate-pulse" : "bg-gray-600"
                        )} />
                        <h5 className="text-[11px] font-black uppercase tracking-wider text-white group-hover:text-dragon-cyan transition-colors">{plan.label}</h5>
                        <p className="text-[8px] text-gray-500 font-sans leading-tight">{plan.desc}</p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-white/10 w-full flex justify-between items-baseline">
                        <p className="text-base sm:text-lg font-display font-black text-white group-hover:text-dragon-cyan transition-colors">
                          {botBillingCountryMode === 'bd' ? plan.priceBD : plan.priceIntl}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Billing forms */}
                <div className="pt-4 border-t border-white/5">
                  {botBillingCountryMode === 'bd' ? (
                    /* bKash Manual Payment BD */
                    <div className="space-y-4">
                      <div className="p-4 bg-pink-500/5 border border-pink-500/10 rounded-2xl space-y-3">
                        <div className="flex items-center gap-1.5 text-pink-400 font-black text-[10px] uppercase tracking-widest">
                          <span className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-ping" />
                          Manual Payment Instructions
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed">
                          Please <strong>Send Money</strong> equivalent to the plan price to the bKash Personal number below. After sending, submit your bKash number and transaction ID (TrxID) below.
                        </p>
                        
                        <div className="flex items-center justify-between bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-xs">
                          <span className="text-gray-400 font-semibold">bKash Personal Number:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-pink-400 font-mono font-black select-all">{bkashSettings.manualNumber}</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(bkashSettings.manualNumber);
                                triggerSuccess('Copied to Clipboard!', 'bKash number copied to clipboard successfully.');
                              }}
                              className="px-2 py-1 bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-wider text-gray-400 rounded cursor-pointer"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block pl-1">Sender bKash Number</label>
                          <input
                            type="text"
                            placeholder="01XXXXXXXXX"
                            value={botPaymentPhone}
                            onChange={(e) => setBotPaymentPhone(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-black outline-none focus:border-dragon-cyan"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block pl-1">bKash Transaction ID</label>
                          <input
                            type="text"
                            placeholder="e.g. K8F1N2X9Y7"
                            value={botPaymentTrxId}
                            onChange={(e) => setBotPaymentTrxId(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-black outline-none focus:border-dragon-cyan"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={handleBotBkashPaymentSubmit}
                          disabled={submittingBotActivation}
                          className="w-full mt-2 py-4 bg-dragon-cyan hover:bg-dragon-cyan/90 text-dragon-black font-black uppercase tracking-widest text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer disabled:opacity-50 font-sans"
                        >
                          {submittingBotActivation ? (
                            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <><Check size={15} /> Submit bKash Request</>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Stripe payment Intl */
                    <form onSubmit={handleBotStripePaymentSubmit} className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block pl-1">Cardholder Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. John Doe"
                          value={botStripeName}
                          onChange={(e) => setBotStripeName(e.target.value)}
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-black outline-none focus:border-dragon-cyan"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block pl-1">Card Number</label>
                        <input
                          type="text"
                          required
                          placeholder="4242 •••• •••• ••••"
                          value={botStripeCardNum}
                          onChange={(e) => setBotStripeCardNum(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                          maxLength={19}
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-black outline-none focus:border-dragon-cyan font-mono"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block pl-1">Expiration (MM/YY)</label>
                          <input
                            type="text"
                            required
                            placeholder="MM/YY"
                            maxLength={5}
                            value={botStripeExpiry}
                            onChange={(e) => setBotStripeExpiry(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-black outline-none focus:border-dragon-cyan font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block pl-1">CVC / CVV</label>
                          <input
                            type="password"
                            required
                            placeholder="123"
                            maxLength={3}
                            value={botStripeCvc}
                            onChange={(e) => setBotStripeCvc(e.target.value.replace(/\D/g, ''))}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-black outline-none focus:border-dragon-cyan font-mono"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={botStripePaying}
                        className="w-full mt-2 py-4 bg-gradient-to-r from-dragon-cyan to-dragon-purple text-dragon-black font-black uppercase tracking-widest text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer disabled:opacity-50 font-sans"
                      >
                        {botStripePaying ? (
                          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <><CreditCard size={14} /> Pay securely with Stripe</>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Real bKash Payment Gateway Modal for Pro Website */}
      {selectedActivationWebsite && (
        <RealPaymentGatewayModal
          isOpen={showBkashGateway && showProActivationModal}
          gatewayType="bkash"
          merchantName="Dragon Systems Ltd."
          orderRef={`PRO-WEB-${selectedActivationWebsite.id}`}
          amount={getProWebsitePrice ? getProWebsitePrice(selectedPlan, 'bd') : 1200}
          currency="BDT"
          itemTitle={`Pro Website Plan (${selectedPlan})`}
          onClose={() => setShowBkashGateway(false)}
          onSuccess={async () => {
            try {
              const days = selectedPlan === '1_month' ? 30 : selectedPlan === '3_months' ? 90 : selectedPlan === '6_months' ? 180 : 365;
              const activeUntil = new Date();
              activeUntil.setDate(activeUntil.getDate() + days);

              await updateDoc(doc(db, 'pro_websites', selectedActivationWebsite.id), {
                paymentStatus: 'approved',
                selectedPlan: selectedPlan,
                activeUntil: activeUntil.toISOString(),
                paymentApprovedAt: new Date().toISOString()
              });

              triggerSuccess('Website Activated!', 'Payment completed successfully and your Pro Website has been activated instantly! Thank you.');
              setShowBkashGateway(false);
              setShowProActivationModal(false);
            } catch (err) {
              console.error(err);
              triggerSuccess('Payment Error', 'An error occurred while processing payment. Please try again.');
            }
          }}
        />
      )}

      {/* MY CATALOG ACTIVATION MODAL */}
      <AnimatePresence>
        {showCatalogActivationModal && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/90 backdrop-blur-md z-[70] animate-fade-in"
              onClick={() => setShowCatalogActivationModal(false)}
            />

            {/* Modal */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-[#0d0f14] border border-white/10 rounded-3xl p-6 z-[80] shadow-2xl animate-scale-up text-left flex flex-col max-h-[90vh] overflow-y-auto font-sans">
              {/* Header */}
              <div className="flex justify-between items-start pb-4 border-b border-white/5 shrink-0">
                <div>
                  <span className="text-[10px] text-dragon-cyan font-black uppercase tracking-widest block mb-1">CATALOG ACTIVATION</span>
                  <h4 className="text-lg font-black text-white leading-tight">
                    {storeName || 'My Catalog Store'}
                  </h4>
                </div>
                <button 
                  onClick={() => setShowCatalogActivationModal(false)}
                  className="p-1.5 px-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-xs cursor-pointer font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Currency Selector */}
              <div className="mt-4 shrink-0 flex items-center justify-between bg-white/5 p-1 rounded-2xl border border-white/5">
                <span className="text-xs font-bold text-gray-350 pl-3">Filter Payment Method:</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCurrency('BDT');
                      setCatalogSelectedPlan('1_month');
                    }}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                      selectedCurrency === 'BDT' ? "bg-dragon-cyan text-dragon-black shadow-md" : "text-gray-400 hover:text-white"
                    )}
                  >
                    🇧🇩 bKash (BDT)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCurrency('USD');
                      setCatalogSelectedPlan('1_month');
                    }}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                      selectedCurrency === 'USD' ? "bg-[#34a853] text-white shadow-md" : "text-gray-400 hover:text-white"
                    )}
                  >
                    🌎 Google Pay (USD)
                  </button>
                </div>
              </div>

              {/* Plans Selection */}
              <div className="space-y-4 py-4 overflow-y-auto flex-1">
                <p className="text-xs text-gray-400 font-medium">
                  {selectedCurrency === 'BDT' 
                    ? 'Select a bKash (BDT) plan below to keep your catalog and product menu active:'
                    : 'Select a Google Pay (USD) plan to activate your public catalog instantly across 69+ countries:'
                  }
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {selectedCurrency === 'BDT' ? (
                    // BDT Plans
                    [
                      { id: '1_month', label: '1 Month', price: `৳${dbPricing?.my_catalog?.bd?.['1_month'] ?? 499}` },
                      { id: '3_months', label: '3 Months', price: `৳${dbPricing?.my_catalog?.bd?.['3_months'] ?? 1300}`, badge: '13% OFF' },
                      { id: '6_months', label: '6 Months', price: `৳${dbPricing?.my_catalog?.bd?.['6_months'] ?? 2400}`, badge: '20% OFF' },
                      { id: '1_year', label: '1 Year', price: `৳${dbPricing?.my_catalog?.bd?.['1_year'] ?? 4500}`, badge: '25% OFF' }
                    ].map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setCatalogSelectedPlan(plan.id as any)}
                        className={cn(
                          "p-3.5 sm:p-4 rounded-2xl border text-left flex flex-col justify-between transition-all relative overflow-hidden min-h-[110px] h-auto group cursor-pointer text-left",
                          catalogSelectedPlan === plan.id 
                            ? "border-dragon-cyan bg-dragon-cyan/5 shadow-lg shadow-dragon-cyan/5" 
                            : "border-white/5 bg-white/[0.01] hover:bg-white/[0.02] hover:border-white/10"
                        )}
                      >
                        {plan.badge && (
                          <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-dragon-cyan text-dragon-black font-black text-[8px] uppercase tracking-wider rounded">
                            {plan.badge}
                          </span>
                        )}
                        <div className="space-y-1">
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full inline-block",
                            catalogSelectedPlan === plan.id ? "bg-dragon-cyan animate-pulse" : "bg-gray-600"
                          )} />
                          <h5 className="text-[11px] font-black uppercase tracking-wider text-white group-hover:text-dragon-cyan transition-colors">{plan.label}</h5>
                        </div>
                        <div className="mt-3 pt-2 border-t border-white/10 w-full flex justify-between items-baseline">
                          <p className="text-base sm:text-lg font-display font-black text-white group-hover:text-dragon-cyan transition-colors">{plan.price}</p>
                        </div>
                        </button>
                    ))
                  ) : (
                    // USD Plans
                    [
                      { id: '1_month', label: '1 Month Starter', price: `$${dbPricing?.my_catalog?.intl?.['1_month'] ?? 4.99}` },
                      { id: '3_months', label: '3 Months Growth', price: `$${dbPricing?.my_catalog?.intl?.['3_months'] ?? 12}`, badge: '20% OFF' },
                      { id: '6_months', label: '6 Months Pro', price: `$${dbPricing?.my_catalog?.intl?.['6_months'] ?? 19}`, badge: '36% OFF' },
                      { id: '1_year', label: '1 Year Ultimate', price: `$${dbPricing?.my_catalog?.intl?.['1_year'] ?? 39}`, badge: '35% OFF' }
                    ].map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setCatalogSelectedPlan(plan.id as any)}
                        className={cn(
                          "p-3.5 sm:p-4 rounded-2xl border text-left flex flex-col justify-between transition-all relative overflow-hidden min-h-[110px] h-auto group cursor-pointer text-left",
                          catalogSelectedPlan === plan.id 
                            ? "border-[#34a853] bg-[#34a853]/5 shadow-lg shadow-[#34a853]/5" 
                            : "border-white/5 bg-white/[0.01] hover:bg-white/[0.02] hover:border-white/10"
                        )}
                      >
                        {plan.badge && (
                          <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-[#34a853] text-white font-black text-[8px] uppercase tracking-wider rounded">
                            {plan.badge}
                          </span>
                        )}
                        <div className="space-y-1">
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full inline-block",
                            catalogSelectedPlan === plan.id ? "bg-[#34a853] animate-pulse" : "bg-gray-600"
                          )} />
                          <h5 className="text-[11px] font-black uppercase tracking-wider text-white group-hover:text-[#34a853] transition-colors">{plan.label}</h5>
                        </div>
                        <div className="mt-3 pt-2 border-t border-white/10 w-full flex justify-between items-baseline">
                          <p className="text-base sm:text-lg font-display font-black text-white group-hover:text-[#34a853] transition-colors">{plan.price}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {/* Gateway Block */}
                <div className="pt-4 border-t border-white/5">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-dragon-cyan mb-3">Select Payment Gateway:</h5>

                  {selectedCurrency === 'BDT' ? (
                    bkashSettings.autoPaymentEnabled ? (
                      <div className="space-y-4">
                        <p className="text-xs text-gray-400 font-light leading-relaxed">
                          Click the button below to pay via bKash Automatic Payment Gateway. Your catalog will be activated instantly once payment is successful.
                        </p>
                        <button
                          onClick={() => {
                            setCatalogBkashPhoneNumber('');
                            setCatalogBkashOtp('');
                            setCatalogBkashPin('');
                            setCatalogBkashAgreedToTerms(false);
                            setCatalogBkashOtpTimer(120);
                            setCatalogBkashGatewayError('');
                            setCatalogBkashGatewayStep(1);
                            setShowCatalogBkashGateway(true);
                          }}
                          className="w-full py-4 bg-[#e2136e] hover:opacity-90 text-white font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
                        >
                          <Zap size={15} /> Automatic bKash Payment (Pay Now)
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-2">
                          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">bKash Payment Number (Send Money):</p>
                          <div className="flex items-center justify-between gap-2 bg-black/40 px-4 py-2.5 rounded-xl border border-white/5">
                            <span className="text-sm font-mono font-bold text-white tracking-wider">{bkashSettings.manualNumber}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(bkashSettings.manualNumber);
                                triggerSuccess('Copied to Clipboard!', 'bKash number copied to clipboard successfully.');
                              }}
                              className="text-[9px] font-black uppercase tracking-widest text-dragon-cyan hover:underline bg-white/5 hover:bg-white/10 px-2 py-1 rounded cursor-pointer"
                            >
                              Copy
                            </button>
                          </div>
                          <p className="text-[10px] text-amber-550 font-bold leading-relaxed">
                            * Please Send Money to the bKash number listed above. After sending, provide your sender number and Transaction ID below.
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">bKash Number (Sender Number):</label>
                            <input
                              type="tel"
                              placeholder="01XXXXXXXXX"
                              value={catalogSenderNumber}
                              onChange={(e) => setCatalogSenderNumber(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs focus:border-dragon-cyan outline-none transition-all text-white font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">TrxID (Transaction ID):</label>
                            <input
                              type="text"
                              placeholder="Enter Transaction ID"
                              value={catalogTrxId}
                              onChange={(e) => setCatalogTrxId(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs focus:border-dragon-cyan outline-none transition-all text-white font-mono uppercase"
                            />
                          </div>
                        </div>

                        <button
                          onClick={async () => {
                            if (!catalogSenderNumber.trim()) return triggerSuccess('Input Required', 'Please enter your bKash number.');
                            if (!catalogTrxId.trim()) return triggerSuccess('Input Required', 'Please enter your Trx ID.');

                            setSubmittingCatalogActivation(true);
                            try {
                              const effectiveUserId = activeDelegateId || user.uid;
                              await setDoc(doc(db, 'catalog_subscriptions', effectiveUserId), {
                                userId: effectiveUserId,
                                paymentStatus: 'pending',
                                selectedPlan: catalogSelectedPlan,
                                selectedCurrency: 'BDT',
                                paymentPhone: catalogSenderNumber,
                                paymentTrxId: catalogTrxId.trim().toUpperCase(),
                                paymentSubmittedAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString()
                              }, { merge: true });

                              triggerSuccess('Payment Submitted!', 'Payment submitted successfully! We will verify and activate your catalog subscription shortly.');
                              setShowCatalogActivationModal(false);
                              setCatalogSenderNumber('');
                              setCatalogTrxId('');
                            } catch (err) {
                              console.error(err);
                              triggerSuccess('Payment Error', 'Payment submission failed. Please try again.');
                            } finally {
                              setSubmittingCatalogActivation(false);
                            }
                          }}
                          disabled={submittingCatalogActivation}
                          className="w-full py-4 bg-dragon-cyan hover:bg-dragon-cyan/90 text-dragon-black font-black uppercase tracking-widest text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer disabled:opacity-50 font-sans"
                        >
                          {submittingCatalogActivation ? (
                            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <><Check size={15} /> Submit Payment</>
                          )}
                        </button>
                      </div>
                    )
                  ) : (
                    // Google Pay Gateway Option
                    <div className="space-y-4">
                      <p className="text-xs text-gray-400 font-light leading-relaxed">
                        You can pay with any international credit/debit card via Google Pay. The catalog will be activated instantly upon payment.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setGpayGatewayStep(1);
                          setShowCatalogGpayGateway(true);
                        }}
                        className="w-full py-4 bg-black hover:bg-zinc-900 text-white font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2.5 transition-all shadow-lg cursor-pointer border border-white/10"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M19.123 11.23c0-.642-.057-1.258-.163-1.85h-9.56v3.5h5.45c-.234 1.258-.944 2.322-2.008 3.033v2.518h3.253c1.902-1.752 3.028-4.333 3.028-7.201z" fill="#4285F4"/>
                          <path d="M9.4 21.066c2.62 0 4.816-.87 6.422-2.361l-3.253-2.518c-.902.604-2.057.962-3.169.962-2.438 0-4.502-1.644-5.238-3.85H.824v2.602c1.614 3.201 4.935 5.165 8.576 5.165z" fill="#34A853"/>
                          <path d="M4.162 13.299c-.183-.549-.287-1.133-.287-1.733s.104-1.184.287-1.733V7.231H.824A10.372 10.372 0 000 11.566c0 1.545.342 3.021.942 4.335l3.22-2.602z" fill="#FBBC05"/>
                          <path d="M9.4 5.92c1.425 0 2.704.49 3.71 1.45l2.78-2.78C14.211 2.91 12.015 2.066 9.4 2.066 5.759 2.066 2.438 4.03 1.162 7.231L4.382 9.833c.736-2.206 2.8-3.913 5.018-3.913z" fill="#EA4335"/>
                        </svg>
                        Pay with Google Pay
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* bKash INTERACTIVE AUTO PAYMENT GATEWAY IFRAME SIMULATOR FOR MY CATALOG */}
      <AnimatePresence>
        {showCatalogBkashGateway && showCatalogActivationModal && (
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
                  ৳{dbPricing?.my_catalog?.bd?.[catalogSelectedPlan] ?? (catalogSelectedPlan === '1_month' ? 499 : catalogSelectedPlan === '3_months' ? 1300 : catalogSelectedPlan === '6_months' ? 2400 : 4500)}
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
                        onClick={() => setShowCatalogBkashGateway(false)}
                        className="flex-1 py-3 bg-gray-150 hover:bg-gray-250 text-gray-700 font-bold uppercase tracking-wider text-xs rounded-lg transition-all cursor-pointer"
                      >
                        CLOSE
                      </button>
                      <button
                        onClick={() => {
                          if (!catalogBkashPhoneNumber.trim() || catalogBkashPhoneNumber.length < 11) {
                            return triggerSuccess('Mobile Number Required', 'Please enter a valid bKash mobile number.');
                          }
                          if (!catalogBkashAgreedToTerms) {
                            return triggerSuccess('Terms Agreement Required', 'Please agree to bKash terms and conditions.');
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
                              onClick={() => {
                                setCatalogBkashOtpTimer(120);
                                triggerSuccess('OTP Sent!', 'A new OTP code has been sent.');
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
                        onClick={() => setCatalogBkashGatewayStep(1)}
                        className="flex-1 py-3 bg-gray-150 hover:bg-gray-250 text-gray-700 font-bold uppercase tracking-wider text-xs rounded-lg transition-all cursor-pointer"
                      >
                        BACK
                      </button>
                      <button
                        onClick={() => {
                          if (catalogBkashOtp.length < 4) {
                            return triggerSuccess('OTP Required', 'Please enter a valid OTP code.');
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
                        onClick={() => setCatalogBkashGatewayStep(2)}
                        className="flex-1 py-3 bg-gray-150 hover:bg-gray-250 text-gray-700 font-bold uppercase tracking-wider text-xs rounded-lg transition-all cursor-pointer"
                      >
                        BACK
                      </button>
                      <button
                        onClick={() => {
                          if (catalogBkashPin.length < 5) {
                            return triggerSuccess('PIN Required', 'Please enter your 5-digit bKash PIN.');
                          }
                          setCatalogBkashGatewayStep(4);

                          // Trigger automated activation simulator
                          setTimeout(async () => {
                            try {
                              const effectiveUserId = activeDelegateId || user.uid;
                              const days = catalogSelectedPlan === '1_month' ? 30 : catalogSelectedPlan === '3_months' ? 90 : catalogSelectedPlan === '6_months' ? 180 : 365;
                              const activeUntil = new Date();
                              activeUntil.setDate(activeUntil.getDate() + days);

                              await setDoc(doc(db, 'catalog_subscriptions', effectiveUserId), {
                                userId: effectiveUserId,
                                paymentStatus: 'approved',
                                selectedPlan: catalogSelectedPlan,
                                selectedCurrency: 'BDT',
                                activeUntil: activeUntil.toISOString(),
                                paymentApprovedAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString()
                              }, { merge: true });

                              triggerSuccess('Catalog Activated!', 'Payment completed successfully and your catalog subscription has been activated instantly! Thank you.');
                              setShowCatalogBkashGateway(false);
                              setShowCatalogActivationModal(false);
                            } catch (err) {
                              console.error(err);
                              triggerSuccess('Payment Error', 'An error occurred while processing payment. Please try again.');
                              setCatalogBkashGatewayStep(3);
                            }
                          }, 2500);
                        }}
                        className="flex-1 py-3 bg-[#e2136e] hover:bg-[#b90a56] text-white font-bold uppercase tracking-wider text-xs rounded-lg transition-all cursor-pointer"
                      >
                        PROCEED
                      </button>
                    </div>
                  </div>
                )}

                {catalogBkashGatewayStep === 4 && (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
                    <div className="relative w-16 h-16 flex items-center justify-center">
                      <div className="w-16 h-16 border-4 border-gray-200 border-t-[#e2136e] rounded-full animate-spin"></div>
                      <div className="absolute w-8 h-8 rounded-full bg-[#e2136e] flex items-center justify-center text-white font-black text-[9px] scale-90 select-none">
                        bKash
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm font-bold text-gray-800 block">Processing Payment...</span>
                      <span className="text-xs text-gray-500 block leading-normal">Please wait, your catalog subscription payment is being processed. Do not close this browser window.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Real Google Pay Gateway Modal for My Catalog */}
      <RealPaymentGatewayModal
        isOpen={showCatalogGpayGateway && showCatalogActivationModal}
        gatewayType="gpay"
        merchantName="Dragon Systems Ltd."
        orderRef="CATALOG-ACTIVATE"
        amount={
          dbPricing?.my_catalog?.intl?.[catalogSelectedPlan] ??
          (catalogSelectedPlan === '1_month' ? '4.99' : catalogSelectedPlan === '3_months' ? '12.00' : catalogSelectedPlan === '6_months' ? '19.00' : '39.00')
        }
        currency="USD"
        itemTitle={`My Catalog Plan (${catalogSelectedPlan})`}
        onClose={() => setShowCatalogGpayGateway(false)}
        onSuccess={async () => {
          try {
            const effectiveUserId = activeDelegateId || user.uid;
            const days = catalogSelectedPlan === '1_month' ? 30 : catalogSelectedPlan === '3_months' ? 90 : catalogSelectedPlan === '6_months' ? 180 : 365;
            const activeUntil = new Date();
            activeUntil.setDate(activeUntil.getDate() + days);

            await setDoc(doc(db, 'catalog_subscriptions', effectiveUserId), {
              userId: effectiveUserId,
              paymentStatus: 'approved',
              selectedPlan: catalogSelectedPlan,
              selectedCurrency: 'USD',
              activeUntil: activeUntil.toISOString(),
              paymentApprovedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }, { merge: true });

            triggerSuccess('Catalog Upgraded!', 'Google Pay payment succeeded! Your catalog is now instantly upgraded and activated.');
            setShowCatalogGpayGateway(false);
            setShowCatalogActivationModal(false);
          } catch (err) {
            console.error(err);
            triggerSuccess('Payment Failed', 'Google Pay payment failed. Please try again.');
          }
        }}
      />

      {/* Custom Success Modal */}
      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal(prev => ({ ...prev, isOpen: false }))}
        title={successModal.title}
        message={successModal.message}
      />

      {/* Persistent Bottom Nav panel */}
      <BottomNav />
    </div>
  );
}

const styles = `
@keyframes scale-up {
  0% { transform: scale(0.85); opacity: 0.5; }
  100% { transform: scale(1); opacity: 1; }
}
.animate-scale-up {
  animation: scale-up 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
`;

if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);
}
