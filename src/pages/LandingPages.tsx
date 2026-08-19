import React, { useState, useEffect, useContext, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Layout, ArrowLeft, Globe, Sparkles, Zap, Package, X, Upload, MessageCircle, Mail, Youtube, Instagram, Facebook, Search, Loader2, Link as LinkIcon, Camera, ExternalLink, Check, CheckCircle2, TrendingUp, MapPin, Palette, BarChart3, Edit2, Clock, Calendar, CreditCard, Truck, ChevronDown, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { AuthContext } from '../authContext';
import { COUNTRIES, getCheckoutFormFields, getDefaultDeliveryConfig, getCurrencySymbol, getCountry } from '../utils/countriesData';
import { InventoryItem } from '../types';
import { cn } from '../lib/utils';
import { RealPaymentGatewayModal } from '../components/RealPaymentGatewayModal';
import { SuccessModal } from '../components/SuccessModal';

const getCreatedTime = (page: any) => {
  if (!page.createdAt) return Date.now();
  if (page.createdAt.seconds) return page.createdAt.seconds * 1000;
  if (page.createdAt.toDate) return page.createdAt.toDate().getTime();
  return new Date(page.createdAt).getTime();
};

const isPageExpired = (page: any) => {
  if (page.paymentStatus === 'approved') return false;
  if (page.paymentStatus === 'pending') return false;
  
  const createdTime = getCreatedTime(page);
  const trialExpiry = createdTime + 48 * 60 * 60 * 1000;
  return Date.now() > trialExpiry;
};

const LandingPageTimer = ({ page, userCountry, onActivate }: { page: any; userCountry: string; onActivate?: () => void }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [expired, setExpired] = useState<boolean>(false);

  useEffect(() => {
    const updateTimer = () => {
      const createdTime = getCreatedTime(page);
      const trialExpiry = createdTime + 48 * 60 * 60 * 1000;
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
  }, [page.createdAt]);

  if (page.paymentStatus === 'approved') {
    return (
      <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest text-emerald-400">
        Approved & Active
      </span>
    );
  }

  if (page.paymentStatus === 'pending') {
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
        title="Click to activate"
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

const LandingPageBotTimer = ({ page, userCountry, onActivate }: { page: any; userCountry: string; onActivate?: () => void }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [expired, setExpired] = useState<boolean>(false);

  useEffect(() => {
    const updateTimer = () => {
      const createdTime = getCreatedTime(page);
      const trialExpiry = createdTime + 48 * 60 * 60 * 1000;
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
  }, [page.createdAt]);

  if (!page.dragonBotEnabled) {
    return (
      <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest text-gray-500">
        Bot Off
      </span>
    );
  }

  if (page.botPaymentStatus === 'approved') {
    // Check if bot plan is expired
    const isExpired = page.botExpiryTime ? new Date(page.botExpiryTime).getTime() < Date.now() : false;
    if (isExpired) {
      return (
        <span
          onClick={onActivate}
          className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest text-rose-400 cursor-pointer hover:bg-rose-500/25 active:scale-95 transition-all flex items-center gap-1 animate-pulse border-rose-500/30 shadow-md"
          title="Renew Bot Plan"
        >
          Bot Expired <Zap size={10} className="text-rose-400 animate-bounce" />
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest text-emerald-400">
        Bot Active {page.botExpiryTime ? `(Expires: ${new Date(page.botExpiryTime).toLocaleDateString()})` : ''}
      </span>
    );
  }

  if (page.botPaymentStatus === 'pending') {
    return (
      <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest text-amber-400 animate-pulse">
        Bot Pending
      </span>
    );
  }

  if (expired) {
    return (
      <span
        onClick={onActivate}
        className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest text-rose-400 cursor-pointer hover:bg-rose-500/25 active:scale-95 transition-all flex items-center gap-1 animate-pulse border-rose-500/30 shadow-md"
        title="Click to activate Bot Plan"
      >
        Bot Expired <Zap size={10} className="text-rose-400 animate-bounce" />
      </span>
    );
  }

  return (
    <span className="px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-[9px] font-mono font-black uppercase tracking-widest text-cyan-400 flex items-center gap-1">
      <Sparkles size={10} className="animate-spin text-cyan-400" /> Bot Trial: {timeLeft}
    </span>
  );
};

const compressImage = (file: File, maxWidth = 1000, maxHeight = 1000, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
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
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve('');
    };
    reader.onerror = () => resolve('');
  });
};

const LandingPages = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [showModal, setShowModal] = useState(false);
  const [showCountrySearchModal, setShowCountrySearchModal] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState('');
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [pages, setPages] = useState<any[]>([]);
  const [showInvPopup, setShowInvPopup] = useState(false);

  // Custom Success Modal State
  const [successModal, setSuccessModal] = useState<{ isOpen: boolean; title: string; message: string }>({ isOpen: false, title: '', message: '' });
  const triggerSuccess = (title: string, message: string) => setSuccessModal({ isOpen: true, title, message });

  // Custom price prompt on sync / product selection
  const [showPricePrompt, setShowPricePrompt] = useState(false);
  const [selectedProductToPrompt, setSelectedProductToPrompt] = useState<InventoryItem | null>(null);
  const [promptPrice, setPromptPrice] = useState<string>('');
  const [promptDiscount, setPromptDiscount] = useState<string>('0');
  const [promptQtyBasedEnabled, setPromptQtyBasedEnabled] = useState(false);
  const [promptIncrementPerQty, setPromptIncrementPerQty] = useState(20);

  // --- Landing Page Activation State ---
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [selectedActivationPage, setSelectedActivationPage] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<'1_month' | '3_months' | '6_months' | '1_year'>('1_month');
  const [senderNumber, setSenderNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [submittingActivation, setSubmittingActivation] = useState(false);
  const [bkashSettings, setBkashSettings] = useState<any>({
    manualNumber: '01700-000000',
    autoPaymentEnabled: false
  });

  // --- AI Bot Plan Activation State ---
  const [showBotActivationModal, setShowBotActivationModal] = useState(false);
  const [selectedBotActivationPage, setSelectedBotActivationPage] = useState<any>(null);
  const [selectedBotPlan, setSelectedBotPlan] = useState<'1_month' | '3_months'>('1_month');
  const [botSenderNumber, setBotSenderNumber] = useState('');
  const [botTrxId, setBotTrxId] = useState('');
  const [submittingBotActivation, setSubmittingBotActivation] = useState(false);
  const [bkashGatewayContext, setBkashGatewayContext] = useState<'page' | 'bot'>('page');

  // --- bKash & Google Pay Interactive Gateway State ---
  const [showBkashGateway, setShowBkashGateway] = useState(false);
  const [showGpayGateway, setShowGpayGateway] = useState(false);
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

  const [dbPricing, setDbPricing] = useState<any>(null);

  useEffect(() => {
    getDoc(doc(db, 'global_settings', 'pricing')).then((snap) => {
      if (snap.exists()) {
        setDbPricing(snap.data());
      }
    }).catch(err => {
      console.warn("Failed to load global pricing settings:", err);
    });
  }, []);

  const getLandingPagePrice = (dur: '1_month' | '3_months' | '6_months' | '1_year') => {
    return dbPricing?.landing_pages?.bd?.[dur] ?? (dur === '1_month' ? 200 : dur === '3_months' ? 500 : dur === '6_months' ? 800 : 1300);
  };

  const getLandingPageBotPrice = (dur: '1_month' | '3_months', mode: 'bd' | 'intl') => {
    if (mode === 'bd') {
      return dbPricing?.magic_box?.messenger?.bd?.[dur] ?? dbPricing?.magic_box?.bot?.bd?.[dur] ?? (dur === '1_month' ? 2000 : 5500);
    } else {
      return dbPricing?.magic_box?.messenger?.intl?.[dur] ?? dbPricing?.magic_box?.bot?.intl?.[dur] ?? (dur === '1_month' ? 20 : 55);
    }
  };

  useEffect(() => {
    getDoc(doc(db, 'global_settings', 'bkash')).then((snap) => {
      if (snap.exists()) {
        setBkashSettings(snap.data());
      }
    }).catch(err => {
      console.warn("Failed to load global bkash settings, utilizing placeholder:", err);
    });
  }, []);

  // Form State
  const [formData, setFormData] = useState({
    storeName: '',
    logo: '',
    productId: '',
    videoUrl: '',
    productDetails: {
      title: '',
      details: '',
      price: 0,
      offerPrice: 0,
      discount: 0,
      colors: [] as string[],
      sizes: [] as string[],
      weight: '',
      warranty: true,
      guarantee: true,
      offerDuration: 7
    },
    deliveryCharges: {
      inside: 80,
      outside: 130,
      insideLabel: 'Inside Dhaka',
      outsideLabel: 'Outside Dhaka',
      qtyBasedEnabled: false,
      incrementPerQty: 20
    },
    paymentSettings: {
      cod: true,
      advance: false
    },
    shortDetails: '',
    theme: 'dark' as 'light' | 'dark' | 'galaxy' | 'bubble' | 'cinematic',
    headerBg: 'black' as 'black' | 'white',
    bodyBg: 'black' as 'black' | 'white',
    footerBg: 'black' as 'black' | 'white',
    buttonBg: '#00f2fe',
    buttonTextColor: '#000000',
    extraImages: ['', '', '', ''] as string[],
    messagingChannel: 'whatsapp',
    messagingNumber: '',
    email: '',
    socialLinks: {
      youtube: '',
      tiktok: '',
      fbPage: '',
      instagram: ''
    },
    country: 'Bangladesh',
    language: 'auto',
    requireLocationTracking: false,
    dragonBotEnabled: false,
    orderCartConfig: {
      currencySymbol: '৳',
      paymentMethods: ['Cash on Delivery'],
      checkoutFields: ['Name', 'Mobile', 'Address']
    } as any,
    customDeliveryCharges: [] as { area: string; charge: number }[],
    tracking: {
      facebook: '',
      tiktok: '',
      gtm: '',
      clarity: '',
      ga4: ''
    }
  });

  const resetForm = () => {
    setFormData({
      storeName: '',
      logo: '',
      productId: '',
      videoUrl: '',
      productDetails: {
        title: '',
        details: '',
        price: 0,
        offerPrice: 0,
        discount: 0,
        colors: [] as string[],
        sizes: [] as string[],
        weight: '',
        warranty: true,
        guarantee: true,
        offerDuration: 7
      },
      deliveryCharges: {
        inside: 80,
        outside: 130,
        insideLabel: 'Inside Dhaka',
        outsideLabel: 'Outside Dhaka',
        qtyBasedEnabled: false,
        incrementPerQty: 20
      },
      paymentSettings: {
        cod: true,
        advance: false
      },
      shortDetails: '',
      theme: 'dark',
      headerBg: 'black',
      bodyBg: 'black',
      footerBg: 'black',
      buttonBg: '#00f2fe',
      buttonTextColor: '#000000',
      extraImages: ['', '', '', ''],
      messagingChannel: 'whatsapp',
      messagingNumber: '',
      email: '',
      socialLinks: {
        youtube: '',
        tiktok: '',
        fbPage: '',
        instagram: ''
      },
      country: userCountry || 'Bangladesh',
      language: 'auto',
      requireLocationTracking: false,
      dragonBotEnabled: false,
      orderCartConfig: {
        currencySymbol: '৳',
        paymentMethods: ['Cash on Delivery'],
        checkoutFields: ['Name', 'Mobile', 'Address']
      },
      customDeliveryCharges: [],
      tracking: {
        facebook: '',
        tiktok: '',
        gtm: '',
        clarity: '',
        ga4: ''
      }
    });
    setEditingPageId(null);
  };

  const handleEditPage = (page: any) => {
    setEditingPageId(page.id);
    setFormData({
      storeName: page.storeName || '',
      logo: page.logo || '',
      productId: page.productId || '',
      videoUrl: page.videoUrl || '',
      productDetails: {
        title: page.productDetails?.title || '',
        details: page.productDetails?.details || '',
        price: page.productDetails?.price || 0,
        offerPrice: page.productDetails?.offerPrice || 0,
        discount: page.productDetails?.discount || 0,
        colors: page.productDetails?.colors || [],
        sizes: page.productDetails?.sizes || [],
        weight: page.productDetails?.weight || '',
        warranty: page.productDetails?.warranty !== undefined ? page.productDetails?.warranty : true,
        guarantee: page.productDetails?.guarantee !== undefined ? page.productDetails?.guarantee : true,
        offerDuration: page.productDetails?.offerDuration || 7
      },
      deliveryCharges: {
        inside: page.deliveryCharges?.inside ?? 80,
        outside: page.deliveryCharges?.outside ?? 130,
        insideLabel: page.deliveryCharges?.insideLabel || 'Inside Dhaka',
        outsideLabel: page.deliveryCharges?.outsideLabel || 'Outside Dhaka',
        qtyBasedEnabled: page.deliveryCharges?.qtyBasedEnabled || false,
        incrementPerQty: page.deliveryCharges?.incrementPerQty !== undefined ? page.deliveryCharges.incrementPerQty : 20
      },
      paymentSettings: {
        cod: page.paymentSettings?.cod !== undefined ? page.paymentSettings?.cod : true,
        advance: page.paymentSettings?.advance !== undefined ? page.paymentSettings?.advance : false
      },
      shortDetails: page.shortDetails || '',
      theme: page.theme || 'dark',
      headerBg: page.headerBg || 'black',
      bodyBg: page.bodyBg || 'black',
      footerBg: page.footerBg || 'black',
      buttonBg: page.buttonBg || '#00f2fe',
      buttonTextColor: page.buttonTextColor || '#000000',
      extraImages: Array.isArray(page.extraImages) && page.extraImages.length >= 4 
        ? page.extraImages 
        : [
            (page.extraImages?.[0] || ''),
            (page.extraImages?.[1] || ''),
            (page.extraImages?.[2] || ''),
            (page.extraImages?.[3] || '')
          ],
      messagingChannel: page.messagingChannel || 'whatsapp',
      messagingNumber: page.messagingNumber || '',
      email: page.email || '',
      socialLinks: {
        youtube: page.socialLinks?.youtube || '',
        tiktok: page.socialLinks?.tiktok || '',
        fbPage: page.socialLinks?.fbPage || '',
        instagram: page.socialLinks?.instagram || ''
      },
      country: page.country || 'Bangladesh',
      language: page.language || 'auto',
      requireLocationTracking: page.requireLocationTracking !== undefined ? page.requireLocationTracking : false,
      dragonBotEnabled: page.dragonBotEnabled !== undefined ? page.dragonBotEnabled : false,
      orderCartConfig: page.orderCartConfig || {
        currencySymbol: '৳',
        paymentMethods: ['Cash on Delivery'],
        checkoutFields: ['Name', 'Mobile', 'Address']
      },
      customDeliveryCharges: page.customDeliveryCharges || [],
      tracking: {
        facebook: page.tracking?.facebook || '',
        tiktok: page.tracking?.tiktok || '',
        gtm: page.tracking?.gtm || '',
        clarity: page.tracking?.clarity || '',
        ga4: page.tracking?.ga4 || ''
      }
    });
    setShowModal(true);
  };

  const [newLandingAreaName, setNewLandingAreaName] = useState('');
  const [newLandingAreaCharge, setNewLandingAreaCharge] = useState('');

  // --- DELEGATION & COLLABORATIVE ACCESS STATE ---
  const [delegations, setDelegations] = useState<any[]>([]);
  const [activeDelegateId, setActiveDelegateId] = useState<string>(() => {
    return localStorage.getItem('active_delegate_user_id') || '';
  });
  const [activeDelegate, setActiveDelegate] = useState<any>(null);

  const [userCountry, setUserCountry] = useState<string>('Bangladesh');

  useEffect(() => {
    if (!user) return;
    const effectiveUserId = activeDelegateId || user.uid;
    const fetchUserCountry = async () => {
      try {
        const uDoc = await getDoc(doc(db, 'users', effectiveUserId));
        if (uDoc.exists()) {
          const uC = uDoc.data().country || 'Bangladesh';
          setUserCountry(uC);
          setFormData(prev => {
            if (!prev.storeName && prev.country === 'Bangladesh') {
              return { ...prev, country: uC };
            }
            return prev;
          });
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchUserCountry();
  }, [user, activeDelegateId]);

  // Load received delegations with LandingPages/Web permission
  useEffect(() => {
    if (!user) return;
    const qDel = query(
      collection(db, 'delegated_access'),
      where('granteeId', '==', user.uid),
      where('allowLandingPages', '==', true),
      where('status', '==', 'accepted')
    );
    const unsubDel = onSnapshot(qDel, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setDelegations(list);
      
      // Sync active delegate metadata
      const currentId = localStorage.getItem('active_delegate_user_id') || '';
      if (currentId) {
        const found = list.find(d => d.grantorId === currentId);
        if (found) {
          setActiveDelegate(found);
        } else {
          setActiveDelegateId('');
          localStorage.removeItem('active_delegate_user_id');
        }
      }
    }, (error) => {
      console.error(error);
    });
    return () => unsubDel();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const effectiveUserId = activeDelegateId || user.uid;
    let isMounted = true;

    const fetchInventory = async () => {
      try {
        const qInv = query(collection(db, 'inventory'), where('userId', '==', effectiveUserId));
        const snap = await getDocs(qInv);
        if (!isMounted) return;
        setInventory(snap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryItem)));
      } catch (err) {
        console.error("Failed to load inventory:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchInventory();

    const qPages = query(collection(db, 'landing-pages'), where('userId', '==', effectiveUserId));
    const unsubPages = onSnapshot(qPages, (snap) => {
      setPages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      isMounted = false;
      unsubPages();
    };
  }, [user, activeDelegateId]);

  const handleSelectProduct = (item: InventoryItem) => {
    setSelectedProductToPrompt(item);
    const initialPrice = item.landingPrice || item.sellPrice || 0;
    setPromptPrice(initialPrice ? String(initialPrice) : '');
    setPromptDiscount('0');
    setPromptQtyBasedEnabled(formData.deliveryCharges?.qtyBasedEnabled || false);
    setPromptIncrementPerQty(formData.deliveryCharges?.incrementPerQty !== undefined ? formData.deliveryCharges.incrementPerQty : 20);
    setShowPricePrompt(true);
    setShowInvPopup(false);
  };

  const handleConfirmPromptPrice = async () => {
    if (!selectedProductToPrompt) return;
    const priceNum = Number(promptPrice) || 0;
    const discountNum = Number(promptDiscount) || 0;
    if (priceNum <= 0) {
      triggerSuccess('Input Required', 'Please enter a valid selling price.');
      return;
    }
    const finalOfferPrice = discountNum > 0 ? Math.round(priceNum * (1 - discountNum / 100)) : priceNum;

    try {
      const productImages = selectedProductToPrompt.images && Array.isArray(selectedProductToPrompt.images)
        ? selectedProductToPrompt.images
        : (selectedProductToPrompt.image ? [selectedProductToPrompt.image] : []);

      const newExtraImages = Array(4).fill('');
      for (let i = 0; i < 4; i++) {
        newExtraImages[i] = productImages[i] || '';
      }

      // Update local state first
      setFormData(prev => ({
        ...prev,
        productId: selectedProductToPrompt.id,
        extraImages: newExtraImages,
        videoUrl: selectedProductToPrompt.videoUrl || '',
        deliveryCharges: {
          ...prev.deliveryCharges,
          qtyBasedEnabled: promptQtyBasedEnabled,
          incrementPerQty: promptIncrementPerQty
        },
        productDetails: {
          title: selectedProductToPrompt.name,
          details: selectedProductToPrompt.details || '',
          price: priceNum,
          offerPrice: finalOfferPrice,
          discount: discountNum,
          colors: selectedProductToPrompt.color ? selectedProductToPrompt.color.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
          sizes: selectedProductToPrompt.size ? selectedProductToPrompt.size.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
          weight: selectedProductToPrompt.weight || '',
          warranty: selectedProductToPrompt.hasWarranty ?? false,
          guarantee: selectedProductToPrompt.hasReplacement ?? false,
          hasWarranty: selectedProductToPrompt.hasWarranty ?? false,
          warrantyDuration: selectedProductToPrompt.warrantyDuration || '',
          hasReplacement: selectedProductToPrompt.hasReplacement ?? false,
          replacementDuration: selectedProductToPrompt.replacementDuration || '',
          offerDuration: 7
        }
      }));

      // Update the sell price & landing price of this item in inventory so orders checkout with the customized price
      await updateDoc(doc(db, 'inventory', selectedProductToPrompt.id), {
        landingPrice: finalOfferPrice,
        sellPrice: finalOfferPrice,
        updatedAt: new Date().toISOString()
      });

      triggerSuccess('Price Synced Successfully!', `The landing page selling price of the product has been set to ৳${finalOfferPrice} and synced successfully.`);
    } catch (err) {
      console.error("Error updating inventory product sellPrice:", err);
      // Fallback
      const productImages = selectedProductToPrompt.images && Array.isArray(selectedProductToPrompt.images)
        ? selectedProductToPrompt.images
        : (selectedProductToPrompt.image ? [selectedProductToPrompt.image] : []);

      const newExtraImages = Array(4).fill('');
      for (let i = 0; i < 4; i++) {
        newExtraImages[i] = productImages[i] || '';
      }

      setFormData(prev => ({
        ...prev,
        productId: selectedProductToPrompt.id,
        extraImages: newExtraImages,
        deliveryCharges: {
          ...prev.deliveryCharges,
          qtyBasedEnabled: promptQtyBasedEnabled,
          incrementPerQty: promptIncrementPerQty
        },
        productDetails: {
          title: selectedProductToPrompt.name,
          details: selectedProductToPrompt.details || '',
          price: priceNum,
          offerPrice: finalOfferPrice,
          discount: discountNum,
          colors: selectedProductToPrompt.color ? selectedProductToPrompt.color.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
          sizes: selectedProductToPrompt.size ? selectedProductToPrompt.size.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
          weight: selectedProductToPrompt.weight || '',
          warranty: selectedProductToPrompt.hasWarranty ?? false,
          guarantee: selectedProductToPrompt.hasReplacement ?? false,
          hasWarranty: selectedProductToPrompt.hasWarranty ?? false,
          warrantyDuration: selectedProductToPrompt.warrantyDuration || '',
          hasReplacement: selectedProductToPrompt.hasReplacement ?? false,
          replacementDuration: selectedProductToPrompt.replacementDuration || '',
          offerDuration: 7
        }
      }));
    } finally {
      setShowPricePrompt(false);
      setSelectedProductToPrompt(null);
    }
  };

  const handleAddTag = (field: 'colors' | 'sizes', value: string) => {
    if (!value.trim()) return;
    setFormData(prev => ({
      ...prev,
      productDetails: {
        ...prev.productDetails,
        [field]: [...(prev.productDetails[field] || []), value.trim()]
      }
    }));
  };

  const removeTag = (field: 'colors' | 'sizes', index: number) => {
    setFormData(prev => ({
      ...prev,
      productDetails: {
        ...prev.productDetails,
        [field]: prev.productDetails[field].filter((_, i) => i !== index)
      }
    }));
  };

  const handleFileChange = async (index: number | 'logo', file: File) => {
    try {
      const compressed = await compressImage(file, 1000, 1000, 0.7);
      if (index === 'logo') {
        setFormData(prev => ({ ...prev, logo: compressed }));
      } else {
        const newImages = [...formData.extraImages];
        newImages[index] = compressed;
        setFormData(prev => ({ ...prev, extraImages: newImages }));
      }
    } catch (err) {
      console.error('Error compressing image:', err);
    }
  };

  const handleCountryChange = (countryName: string) => {
    const config = getDefaultDeliveryConfig(countryName);
    const currency = getCurrencySymbol(countryName) || '৳';
    const fields = getCheckoutFormFields(countryName).map(f => f.key);
    
    setFormData(prev => ({
      ...prev,
      country: countryName,
      deliveryCharges: {
        ...prev.deliveryCharges,
        inside: config.deliveryChargeInside,
        outside: config.deliveryChargeOutside,
        insideLabel: config.deliveryLabelInside,
        outsideLabel: config.deliveryLabelOutside
      },
      orderCartConfig: {
        currencySymbol: currency,
        paymentMethods: prev.orderCartConfig?.paymentMethods || ['Cash on Delivery'],
        checkoutFields: fields
      }
    }));
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!formData.storeName) return triggerSuccess('Input Required', 'Please enter store name.');

    setIsSubmitting(true);
    const targetUserId = activeDelegateId || user.uid;
    try {
      if (editingPageId) {
        await updateDoc(doc(db, 'landing-pages', editingPageId), {
          ...formData,
          userId: targetUserId,
          ownerCountry: userCountry,
          updatedAt: serverTimestamp()
        });
        try {
          localStorage.removeItem(`cached_landing_page_${editingPageId}`);
        } catch (e) {}
        triggerSuccess('Landing Page Updated Successfully!', 'Your landing page changes have been saved and updated.');
      } else {
        await addDoc(collection(db, 'landing-pages'), {
          ...formData,
          userId: targetUserId,
          ownerCountry: userCountry,
          paymentStatus: 'none',
          status: 'draft',
          createdAt: serverTimestamp()
        });
        triggerSuccess('Draft Saved Successfully!', 'Your landing page draft has been saved successfully.');
      }

      // Synchronize delivery charges of subareas to the user's isolated hidden knowledge file
      if (formData.customDeliveryCharges && formData.customDeliveryCharges.length > 0) {
        try {
          const hiddenRef = doc(db, 'hidden_merchant_files', targetUserId);
          const hiddenSnap = await getDoc(hiddenRef);
          let existingCharges: { area: string; charge: number }[] = [];
          if (hiddenSnap.exists()) {
            existingCharges = hiddenSnap.data().customDeliveryCharges || [];
          }

          const newCharges = [...(formData.customDeliveryCharges || [])];
          const combined = [...existingCharges];
          
          newCharges.forEach(newC => {
            const idx = combined.findIndex(c => c.area.toLowerCase().trim() === newC.area.toLowerCase().trim());
            if (idx === -1) {
              combined.push(newC);
            } else {
              combined[idx].charge = newC.charge; // update charge if area already exists
            }
          });

          await setDoc(hiddenRef, {
            userId: targetUserId,
            customDeliveryCharges: combined,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (syncErr) {
          console.warn("Failed to sync sub-area delivery charges to hidden data store:", syncErr);
        }
      }

      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error(err);
      triggerSuccess('Save Error', 'Failed to save landing page.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-dragon-black text-white selection:bg-dragon-cyan selection:text-dragon-black">
      {/* Background Glows */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-dragon-cyan/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-dragon-purple/10 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <header className="p-6 flex items-center justify-between backdrop-blur-md bg-black/40 border-b border-white/5 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/showcase')}
            className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-display font-black tracking-widest uppercase flex items-center gap-2">
            My <span className="text-dragon-cyan">Landing Pages</span>
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-12">
        {/* Delegation Switcher Header */}
        {delegations.length > 0 && (
           <div className="mb-8 p-4 rounded-2xl bg-dragon-cyan/10 border border-dragon-cyan/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1 text-left">
              <div>
                 <span className="text-[10px] font-black text-dragon-cyan tracking-widest uppercase block leading-none font-sans">Delegated Website Mode</span>
                 <p className="text-[10px] text-white font-bold uppercase mt-1.5 flex items-center gap-1.5 leading-none">
                    {activeDelegateId ? (
                       <>
                          <span className="w-2 h-2 rounded-full bg-dragon-cyan animate-pulse inline-block" />
                          <span>You are active and creating landing pages on behalf of <span className="text-dragon-cyan font-black">{activeDelegate?.grantorName}</span></span>
                       </>
                    ) : (
                       <span>You are currently working on your own personal landing page board</span>
                    )}
                 </p>
              </div>
              <div className="flex items-center gap-2">
                 <span className="text-[8px] uppercase font-black tracking-widest text-gray-500">Switch View:</span>
                 <select
                   value={activeDelegateId}
                   onChange={(e) => {
                     const val = e.target.value;
                     setActiveDelegateId(val);
                     if (val) {
                       localStorage.setItem('active_delegate_user_id', val);
                       setActiveDelegate(delegations.find(d => d.grantorId === val) || null);
                     } else {
                       localStorage.removeItem('active_delegate_user_id');
                       setActiveDelegate(null);
                     }
                   }}
                   className="bg-black/55 border border-white/10 text-white font-black text-[9.5px] uppercase tracking-widest px-3 py-1.5 rounded-xl accent-dragon-cyan focus:outline-none focus:ring-1 focus:ring-dragon-cyan/50"
                 >
                    <option value="">My Account</option>
                    {delegations.map((d, idy) => (
                       <option key={`del-lp-${d.id}-${idy}`} value={d.grantorId}>{d.grantorName}'s Landing Page Panel</option>
                    ))}
                 </select>
              </div>
         </div>
        )}

        <div className="flex flex-col items-center pt-4 text-center">
          {/* Main Action at Top */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full flex justify-center"
          >
            <button 
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="group relative px-10 py-5 bg-dragon-cyan text-dragon-black font-black uppercase tracking-[0.2em] text-sm rounded-2xl flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-dragon-cyan/20 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-[-20deg]" />
              <Plus size={20} />
              Create a landing page
            </button>
          </motion.div>

          {/* List of generated pages */}
          {pages.length > 0 && (
            <div className="w-full mt-12 pt-8 border-t border-white/5 text-left">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Layout size={16} className="text-dragon-cyan animate-pulse" /> Your Landing Pages
                  </h3>
                  <p className="text-[10px] text-dragon-cyan font-bold uppercase tracking-widest mt-1">
                    You have a total of {pages.length} Landing Pages
                  </p>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pages.map((page, idx) => (
                  <div key={`page-${page.id}-${idx}`} className="glass-card p-6 border-white/5 bg-white/[0.02] rounded-3xl flex flex-col gap-4 group">
                    <div className="flex items-center justify-between">
                      <div className="p-3 bg-dragon-cyan/10 rounded-2xl text-dragon-cyan">
                        <Layout size={20} />
                      </div>
                      <span className="px-3 py-1 bg-white/5 rounded-full text-[8px] font-black uppercase tracking-widest text-gray-500">{page.theme} theme</span>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black uppercase tracking-widest text-white group-hover:text-dragon-cyan transition-colors">{page.storeName || 'Unnamed Project'}</h4>
                      <p className="text-xs text-gray-500 font-light truncate">{page.productDetails?.title}</p>
                    </div>
                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      <LandingPageTimer 
                        page={page} 
                        userCountry={userCountry} 
                        onActivate={() => {
                          setSelectedActivationPage(page);
                          setShowActivationModal(true);
                        }}
                      />
                      <LandingPageBotTimer
                        page={page}
                        userCountry={userCountry}
                        onActivate={() => {
                          setSelectedBotActivationPage(page);
                          setSelectedBotPlan('1_month');
                          setBotSenderNumber('');
                          setBotTrxId('');
                          setShowBotActivationModal(true);
                        }}
                      />
                    </div>
                    {page.dragonBotEnabled && (
                      <button
                        onClick={() => {
                          setSelectedBotActivationPage(page);
                          setSelectedBotPlan('1_month');
                          setBotSenderNumber('');
                          setBotTrxId('');
                          setShowBotActivationModal(true);
                        }}
                        className="w-full py-2 bg-cyan-500/10 hover:bg-cyan-500 hover:text-black text-cyan-400 font-bold uppercase tracking-widest text-[9.5px] rounded-xl flex items-center justify-center gap-1 border border-cyan-500/20 cursor-pointer active:scale-95 transition-all"
                      >
                        <Sparkles size={11} className="text-current" />
                        {page.botPaymentStatus === 'approved' ? "Renew Bot" : "Activate Bot"}
                      </button>
                    )}
                    {isPageExpired(page) && (
                      <button
                        onClick={() => {
                          setSelectedActivationPage(page);
                          setShowActivationModal(true);
                        }}
                        className="w-full mt-2 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest text-[11px] rounded-2xl flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(245,158,11,0.5)] border border-amber-500/30 cursor-pointer animate-pulse"
                        style={{ backgroundColor: '#f59e0b', color: '#000000', display: 'flex' }}
                      >
                        <Zap size={13} className="text-black animate-bounce fill-black" style={{ color: '#000000', fill: '#000000' }} /> Activate
                      </button>
                    )}
                    <div className="pt-4 grid grid-cols-2 gap-2 mt-auto w-full">
                      <button 
                        onClick={() => {
                          const storeSlug = page.storeName ? encodeURIComponent(page.storeName.trim().toLowerCase().replace(/[\s/]+/g, '-')) : 'store';
                          window.open(`/l/${storeSlug}/${page.id}`, '_blank');
                        }}
                        className="flex items-center justify-center gap-1.5 py-2.5 bg-dragon-cyan/10 hover:bg-dragon-cyan border border-dragon-cyan/30 hover:border-dragon-cyan rounded-2xl text-[9px] font-black uppercase tracking-widest text-dragon-cyan hover:text-dragon-black transition-all duration-300 cursor-pointer"
                      >
                        View <ExternalLink size={11} />
                      </button>
                      
                      <button 
                        onClick={() => handleEditPage(page)}
                        className="flex items-center justify-center gap-1 rounded-2xl py-2.5 bg-amber-500/10 hover:bg-amber-500 border border-amber-500/30 hover:border-amber-500 text-[9px] font-black uppercase tracking-widest text-amber-400 hover:text-black transition-all duration-300 cursor-pointer"
                      >
                        Edit <Edit2 size={11} />
                      </button>

                      <button 
                        onClick={() => {
                          const storeSlug = page.storeName ? encodeURIComponent(page.storeName.trim().toLowerCase().replace(/[\s/]+/g, '-')) : 'store';
                          navigator.clipboard.writeText(`${window.location.origin}/l/${storeSlug}/${page.id}`);
                          triggerSuccess('Copied to Clipboard!', 'Landing page link copied to clipboard successfully.');
                        }}
                        className="flex items-center justify-center gap-1 py-2.5 bg-white/5 hover:bg-white border border-white/10 hover:border-white rounded-2xl text-[9px] font-black uppercase tracking-widest text-gray-300 hover:text-black transition-all duration-300 cursor-pointer"
                        title="Copy Link"
                      >
                        Copy Link <LinkIcon size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Landing Page Activation Modal */}
      <AnimatePresence>
        {showActivationModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-lg bg-dragon-black border border-white/10 rounded-3xl overflow-hidden shadow-2xl my-auto p-6 md:p-8 space-y-6 relative"
            >
              <motion.button 
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowActivationModal(false)} 
                className="absolute top-6 right-6 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 p-2 rounded-full transition-colors cursor-pointer flex items-center justify-center shadow-lg"
              >
                <X size={18} />
              </motion.button>

              <div className="text-center space-y-2">
                <h3 className="text-lg font-display font-black uppercase tracking-wider text-white">
                  Landing Page Activation Panel
                </h3>
                <p className="text-[10px] text-dragon-cyan font-bold uppercase tracking-widest">
                  Please choose a plan to activate
                </p>
              </div>

              {/* Plans Grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: '1_month', label: '1 Month', price: getLandingPagePrice('1_month') },
                  { id: '3_months', label: '3 Months', price: getLandingPagePrice('3_months') },
                  { id: '6_months', label: '6 Months', price: getLandingPagePrice('6_months') },
                  { id: '1_year', label: '1 Year', price: getLandingPagePrice('1_year') }
                ].map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id as any)}
                    className={cn(
                      "p-3.5 sm:p-4 rounded-2xl border text-left flex flex-col justify-between transition-all select-none gap-2 min-h-[90px] h-auto group cursor-pointer",
                      selectedPlan === plan.id 
                        ? "bg-dragon-cyan/10 border-dragon-cyan shadow-lg shadow-dragon-cyan/5" 
                        : "bg-white/[0.02] border-white/5 hover:border-white/10"
                    )}
                  >
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider group-hover:text-dragon-cyan transition-colors">{plan.label}</span>
                    <span className="text-lg sm:text-xl font-display font-black text-white group-hover:text-dragon-cyan transition-colors">৳{plan.price}</span>
                  </button>
                ))}
              </div>

              {/* Payment Section */}
              <div className="pt-4 border-t border-white/5 space-y-4 text-left">
                {bkashSettings.autoPaymentEnabled ? (
                  <div className="space-y-4">
                    <p className="text-xs text-gray-400 font-light leading-relaxed">
                      Click the button below to complete payment via bKash automatic payment gateway. After completion, your page will be activated instantly.
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
                      className="w-full py-3.5 bg-gradient-to-r from-dragon-cyan to-dragon-purple hover:opacity-90 text-dragon-black font-black uppercase tracking-widest text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
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
                        * Please Send Money to the above bKash number. After sending money, enter the Transaction ID and your bKash sender number below.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">bKash Sender Number:</label>
                        <input
                          type="tel"
                          placeholder="01XXXXXXXXX"
                          value={senderNumber}
                          onChange={(e) => setSenderNumber(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-dragon-cyan outline-none transition-all text-white font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Transaction ID (TrxID):</label>
                        <input
                          type="text"
                          placeholder="Enter Bkash Transaction ID"
                          value={trxId}
                          onChange={(e) => setTrxId(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-dragon-cyan outline-none transition-all text-white font-mono"
                        />
                      </div>

                      <button
                        onClick={async () => {
                          if (!senderNumber.trim()) return triggerSuccess('Input Required', 'Please enter your bKash number.');
                          if (!trxId.trim()) return triggerSuccess('Input Required', 'Please enter your Transaction ID (TrxID).');

                          setSubmittingActivation(true);
                          try {
                            await updateDoc(doc(db, 'landing-pages', selectedActivationPage.id), {
                              paymentStatus: 'pending',
                              selectedPlan: selectedPlan,
                              paymentPhone: senderNumber,
                              paymentTrxId: trxId,
                              paymentSubmittedAt: new Date().toISOString()
                            });
                            triggerSuccess('Payment Submitted!', 'Payment submitted successfully! Admin will verify and activate your landing page shortly.');
                            setShowActivationModal(false);
                            setSenderNumber('');
                            setTrxId('');
                          } catch (err) {
                            console.error(err);
                            triggerSuccess('Submission Error', 'Failed to submit payment. Please try again.');
                          } finally {
                            setSubmittingActivation(false);
                          }
                        }}
                        disabled={submittingActivation}
                        className="w-full py-4 bg-dragon-cyan hover:bg-dragon-cyan/90 text-dragon-black font-black uppercase tracking-widest text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
                      >
                        {submittingActivation ? (
                          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <><CheckCircle2 size={15} /> Submit Payment</>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DOEL Messenger Chatbot Plan Activation Modal */}
      <AnimatePresence>
        {showBotActivationModal && selectedBotActivationPage && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-lg bg-dragon-black border border-white/10 rounded-3xl overflow-hidden shadow-2xl my-auto p-6 md:p-8 space-y-6 relative"
            >
              <motion.button 
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowBotActivationModal(false)} 
                className="absolute top-6 right-6 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 p-2 rounded-full transition-colors cursor-pointer flex items-center justify-center shadow-lg"
              >
                <X size={18} />
              </motion.button>

              <div className="text-center space-y-2">
                <div className="flex justify-center mb-1">
                  <div className="p-3 bg-cyan-500/10 rounded-2xl text-cyan-400">
                    <Sparkles size={24} className="animate-pulse" />
                  </div>
                </div>
                <h3 className="text-lg font-display font-black uppercase tracking-wider text-white">
                  DOEL Messenger Chatbot Activation
                </h3>
                <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">
                  Choose chatbot plan for {selectedBotActivationPage.storeName}
                </p>
              </div>

              {/* Plans Grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: '1_month', label: '1 Month', priceBD: getLandingPageBotPrice('1_month', 'bd'), priceINT: getLandingPageBotPrice('1_month', 'intl') },
                  { id: '3_months', label: '3 Months', priceBD: getLandingPageBotPrice('3_months', 'bd'), priceINT: getLandingPageBotPrice('3_months', 'intl') }
                ].map((plan) => {
                  const isBD = userCountry === 'Bangladesh' || userCountry === 'BD';
                  const priceStr = isBD ? `৳${plan.priceBD}` : `$${plan.priceINT}`;
                  return (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedBotPlan(plan.id as any)}
                      className={cn(
                        "p-3.5 sm:p-4 rounded-2xl border text-left flex flex-col justify-between transition-all select-none gap-2 min-h-[90px] h-auto group cursor-pointer",
                        selectedBotPlan === plan.id 
                          ? "bg-cyan-500/10 border-cyan-500 shadow-lg shadow-cyan-500/5" 
                          : "bg-white/[0.02] border-white/5 hover:border-white/10"
                      )}
                    >
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider group-hover:text-cyan-400 transition-colors">{plan.label}</span>
                      <span className="text-lg sm:text-xl font-display font-black text-white group-hover:text-cyan-400 transition-colors">{priceStr}</span>
                    </button>
                  );
                })}
              </div>

              {/* Payment Section */}
              <div className="pt-4 border-t border-white/5 space-y-4 text-left">
                {userCountry === 'Bangladesh' || userCountry === 'BD' ? (
                  <div className="space-y-4">
                    {bkashSettings.autoPaymentEnabled ? (
                      <div className="space-y-4">
                        <p className="text-xs text-gray-400 font-light leading-relaxed">
                          Click the button below to complete payment via bKash automatic payment gateway. After completion, your bot plan will be activated instantly.
                        </p>
                        <button
                          onClick={() => {
                            setBkashGatewayContext('bot');
                            setBkashPhoneNumber('');
                            setBkashOtp('');
                            setBkashPin('');
                            setBkashAgreedToTerms(false);
                            setBkashOtpTimer(120);
                            setBkashGatewayError('');
                            setBkashGatewayStep(1);
                            setShowBkashGateway(true);
                          }}
                          className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-dragon-cyan hover:opacity-90 text-black font-black uppercase tracking-widest text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
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
                              className="text-[9px] font-black uppercase tracking-widest text-cyan-400 hover:underline bg-white/5 hover:bg-white/10 px-2 py-1 rounded cursor-pointer"
                            >
                              Copy
                            </button>
                          </div>
                          <p className="text-[10px] text-amber-550 font-bold leading-relaxed">
                            * Please Send Money to the above bKash number. After sending money, enter the Transaction ID and your bKash sender number below.
                          </p>
                        </div>

                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">bKash Sender Number:</label>
                            <input
                              type="tel"
                              placeholder="01XXXXXXXXX"
                              value={botSenderNumber}
                              onChange={(e) => setBotSenderNumber(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-500 outline-none transition-all text-white font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Transaction ID (TrxID):</label>
                            <input
                              type="text"
                              placeholder="Enter bKash Transaction ID"
                              value={botTrxId}
                              onChange={(e) => setBotTrxId(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-500 outline-none transition-all text-white font-mono"
                            />
                          </div>

                          <button
                            onClick={async () => {
                              if (!botSenderNumber.trim()) return triggerSuccess('Input Required', 'Please enter your bKash number.');
                              if (!botTrxId.trim()) return triggerSuccess('Input Required', 'Please enter your Transaction ID (TrxID).');

                              setSubmittingBotActivation(true);
                              try {
                                await updateDoc(doc(db, 'landing-pages', selectedBotActivationPage.id), {
                                  botPaymentStatus: 'pending',
                                  botSelectedPlan: selectedBotPlan,
                                  botPaymentPhone: botSenderNumber,
                                  botPaymentTrxId: botTrxId,
                                  botPaymentSubmittedAt: new Date().toISOString()
                                });
                                triggerSuccess('Bot Payment Submitted!', 'Bot payment submitted successfully! Admin will verify and activate your chatbot plan shortly.');
                                setShowBotActivationModal(false);
                                setBotSenderNumber('');
                                setBotTrxId('');
                              } catch (err) {
                                console.error(err);
                                triggerSuccess('Submission Error', 'Failed to submit payment. Please try again.');
                              } finally {
                                setSubmittingBotActivation(false);
                              }
                            }}
                            disabled={submittingBotActivation}
                            className="w-full py-4 bg-cyan-500 text-black font-black uppercase tracking-widest text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer hover:bg-cyan-400"
                          >
                            {submittingBotActivation ? (
                              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <><CheckCircle2 size={15} /> Submit Bot Payment</>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 text-center">
                    <p className="text-xs text-gray-400 font-light leading-relaxed">
                      Pay securely with Google Pay or any Credit/Debit Card. The plan will be activated immediately upon checkout.
                    </p>
                    <button
                      onClick={() => setShowGpayGateway(true)}
                      className="w-full py-4 bg-[#1e1e1e] border border-white/20 text-white hover:bg-black font-black uppercase tracking-widest text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
                    >
                      <Zap size={15} className="text-blue-400" /> Pay with Google Pay
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Real bKash Payment Gateway Modal */}
      <RealPaymentGatewayModal
        isOpen={showBkashGateway}
        gatewayType="bkash"
        merchantName="DOELpro SaaS Ltd."
        orderRef={bkashGatewayContext === 'bot' ? 'AI-BOT-ACTIVATE' : 'L-PAGE-ACTIVATE'}
        amount={
          bkashGatewayContext === 'bot'
            ? (getLandingPageBotPrice ? getLandingPageBotPrice(selectedBotPlan, 'bd') : 1200)
            : (getLandingPagePrice ? getLandingPagePrice(selectedPlan) : 1200)
        }
        currency="BDT"
        itemTitle={bkashGatewayContext === 'bot' ? 'DOEL Messenger Chatbot Subscription' : 'Landing Page Premium Plan'}
        onClose={() => setShowBkashGateway(false)}
        onSuccess={async () => {
          try {
            if (bkashGatewayContext === 'bot' && selectedBotActivationPage) {
              const days = selectedBotPlan === '1_month' ? 30 : 90;
              const botExpiryTime = new Date();
              botExpiryTime.setDate(botExpiryTime.getDate() + days);

              await updateDoc(doc(db, 'landing-pages', selectedBotActivationPage.id), {
                botPaymentStatus: 'approved',
                botSelectedPlan: selectedBotPlan,
                botExpiryTime: botExpiryTime.toISOString()
              });

              triggerSuccess('Chatbot Activated!', 'Payment completed successfully and your DOEL Messenger Chatbot plan is active instantly! Thank you.');
              setShowBkashGateway(false);
              setShowBotActivationModal(false);
            } else if (selectedActivationPage) {
              const days = selectedPlan === '1_month' ? 30 : selectedPlan === '3_months' ? 90 : selectedPlan === '6_months' ? 180 : 365;
              const activeUntil = new Date();
              activeUntil.setDate(activeUntil.getDate() + days);

              await updateDoc(doc(db, 'landing-pages', selectedActivationPage.id), {
                paymentStatus: 'approved',
                selectedPlan: selectedPlan,
                activeUntil: activeUntil.toISOString()
              });

              triggerSuccess('Landing Page Activated!', 'Payment completed successfully and your landing page is active instantly! Thank you.');
              setShowBkashGateway(false);
              setShowActivationModal(false);
            }
          } catch (err) {
            console.error(err);
            triggerSuccess('Payment Error', 'An error occurred during payment processing.');
          }
        }}
      />

      {/* Real Google Pay Gateway Modal */}
      <RealPaymentGatewayModal
        isOpen={showGpayGateway}
        gatewayType="gpay"
        merchantName="DOELpro SaaS Ltd."
        orderRef={bkashGatewayContext === 'bot' ? 'AI-BOT-ACTIVATE' : 'L-PAGE-ACTIVATE'}
        amount={
          bkashGatewayContext === 'bot'
            ? (selectedBotPlan === '1_month' ? '9.99' : '24.99')
            : (selectedPlan === '1_month' ? '4.99' : selectedPlan === '3_months' ? '12.00' : '39.00')
        }
        currency="USD"
        itemTitle={bkashGatewayContext === 'bot' ? 'DOEL Messenger Chatbot Subscription' : 'Landing Page Premium Plan'}
        onClose={() => setShowGpayGateway(false)}
        onSuccess={async () => {
          try {
            if (bkashGatewayContext === 'bot' && selectedBotActivationPage) {
              const days = selectedBotPlan === '1_month' ? 30 : 90;
              const botExpiryTime = new Date();
              botExpiryTime.setDate(botExpiryTime.getDate() + days);

              await updateDoc(doc(db, 'landing-pages', selectedBotActivationPage.id), {
                botPaymentStatus: 'approved',
                botSelectedPlan: selectedBotPlan,
                botExpiryTime: botExpiryTime.toISOString()
              });

              triggerSuccess('Chatbot Activated!', 'Google Pay payment succeeded! Your DOEL Messenger Chatbot plan is now active.');
              setShowGpayGateway(false);
              setShowBotActivationModal(false);
            } else if (selectedActivationPage) {
              const days = selectedPlan === '1_month' ? 30 : selectedPlan === '3_months' ? 90 : selectedPlan === '6_months' ? 180 : 365;
              const activeUntil = new Date();
              activeUntil.setDate(activeUntil.getDate() + days);

              await updateDoc(doc(db, 'landing-pages', selectedActivationPage.id), {
                paymentStatus: 'approved',
                selectedPlan: selectedPlan,
                activeUntil: activeUntil.toISOString()
              });

              triggerSuccess('Landing Page Activated!', 'Google Pay payment succeeded! Your landing page is now active.');
              setShowGpayGateway(false);
              setShowActivationModal(false);
            }
          } catch (err) {
            console.error(err);
            triggerSuccess('Payment Error', 'An error occurred during Google Pay processing.');
          }
        }}
      />

      {/* Create Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-2xl bg-dragon-black border border-white/10 rounded-3xl overflow-hidden shadow-2xl my-auto"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-dragon-black z-10">
                <h3 className="text-lg font-display font-black uppercase tracking-widest flex items-center gap-2">
                  {editingPageId ? 'Edit' : 'New'} <span className="text-dragon-cyan">Landing Page</span>
                </h3>
                <motion.button 
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowModal(false)} 
                  className="p-2 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-colors cursor-pointer flex items-center justify-center shadow-md"
                >
                  <X size={20} />
                </motion.button>
              </div>

              {/* Modal Content */}
              <div className="p-8 space-y-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
                
                {/* Store Section */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-dragon-cyan/10 flex items-center justify-center text-dragon-cyan">
                      <Globe size={18} />
                    </div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-white">Store Identity</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Store / Brand Name (Leave empty for DOELpro)</label>
                      <input 
                        type="text" 
                        value={formData.storeName}
                        onChange={(e) => setFormData({...formData, storeName: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-dragon-cyan/50 transition-all text-sm"
                        placeholder="e.g. Dragon Elite Store"
                      />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Short Description (Footer)</label>
                       <input 
                         type="text" 
                         value={formData.shortDetails}
                         onChange={(e) => setFormData({...formData, shortDetails: e.target.value})}
                         className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-dragon-cyan/50 transition-all text-sm"
                         placeholder="One sentence about your brand"
                       />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Logo (Optional)</label>
                      <div className="flex items-center gap-4">
                        <label className="flex-1 cursor-pointer">
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileChange('logo', e.target.files[0])} />
                          <div className={cn(
                            "h-12 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all",
                            formData.logo ? "bg-dragon-cyan/10 text-dragon-cyan border border-dragon-cyan/20" : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
                          )}>
                            {formData.logo ? <Check size={14} /> : <Upload size={14} />}
                            {formData.logo ? 'Logo Uploaded' : 'Upload Logo'}
                          </div>
                        </label>
                        {formData.logo && (
                          <div className="w-12 h-12 rounded-xl bg-white/10 overflow-hidden border border-white/20">
                            <img src={formData.logo} className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Product Section */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-dragon-purple/10 flex items-center justify-center text-dragon-purple">
                        <Package size={18} />
                      </div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-white">Product Selection</h4>
                    </div>
                  </div>
                  
                  {/* Select from Inventory */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Add from Inventory</label>
                    <button 
                      onClick={() => setShowInvPopup(true)}
                      className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center gap-3 text-gray-500 hover:border-dragon-cyan/30 hover:text-dragon-cyan transition-all"
                    >
                      {formData.productId ? (
                        <>
                          <Check size={20} />
                          Product Selected: {formData.productDetails.title}
                        </>
                      ) : (
                        <>
                          <Plus size={20} />
                          Browse Inventory
                        </>
                      )}
                    </button>
                  </div>

                  {/* YouTube Video Link */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                      <Youtube size={13} className="text-red-500 animate-pulse" />
                      YouTube Video / Shorts Link
                    </label>
                    <input 
                      type="text" 
                      value={formData.videoUrl}
                      onChange={(e) => setFormData({...formData, videoUrl: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-dragon-cyan/50 transition-all text-sm font-mono placeholder-gray-600 text-white"
                      placeholder="e.g. https://www.youtube.com/watch?v=..."
                    />
                  </div>

                  {/* Extra Images */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Camera size={12} />
                      Extra Photos (4 Slots - Optional)
                    </label>
                    <div className="grid grid-cols-4 gap-4">
                      {[0, 1, 2, 3].map(i => (
                        <label key={i} className="aspect-square cursor-pointer">
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileChange(i as number, e.target.files[0])} />
                          <div className={cn(
                            "w-full h-full rounded-2xl flex items-center justify-center border transition-all overflow-hidden",
                            formData.extraImages[i] ? "border-dragon-cyan" : "bg-white/5 border-dashed border-white/10 hover:border-white/20"
                          )}>
                            {formData.extraImages[i] ? (
                              <img src={formData.extraImages[i]} className="w-full h-full object-cover" />
                            ) : (
                              <Plus size={20} className="text-gray-700" />
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Product Details Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/[0.02] p-6 rounded-2xl border border-white/5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Product Title</label>
                      <input 
                        type="text" 
                        value={formData.productDetails.title}
                        onChange={(e) => setFormData({...formData, productDetails: {...formData.productDetails, title: e.target.value}})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-dragon-cyan/50 transition-all text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Original Price</label>
                      <input 
                        type="number" 
                        value={formData.productDetails.price}
                        onChange={(e) => setFormData({...formData, productDetails: {...formData.productDetails, price: Number(e.target.value)}})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-dragon-cyan/50 transition-all text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Offer Price</label>
                      <input 
                        type="number" 
                        value={formData.productDetails.offerPrice}
                        onChange={(e) => setFormData({...formData, productDetails: {...formData.productDetails, offerPrice: Number(e.target.value)}})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-dragon-cyan/50 transition-all text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Discount (%)</label>
                      <input 
                        type="number" 
                        value={formData.productDetails.discount}
                        onChange={(e) => setFormData({...formData, productDetails: {...formData.productDetails, discount: Number(e.target.value)}})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-dragon-cyan/50 transition-all text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Offer Duration (Days)</label>
                      <input 
                        type="number" 
                        value={formData.productDetails.offerDuration}
                        onChange={(e) => setFormData({...formData, productDetails: {...formData.productDetails, offerDuration: Number(e.target.value)}})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-dragon-cyan/50 transition-all text-sm"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Details</label>
                      <textarea 
                        value={formData.productDetails.details}
                        onChange={(e) => setFormData({...formData, productDetails: {...formData.productDetails, details: e.target.value}})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-dragon-cyan/50 transition-all text-sm min-h-[100px]"
                      />
                    </div>

                    {/* Toggles */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
                       <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex flex-col gap-2.5">
                         <div className="flex items-center justify-between w-full">
                           <span className="text-[10px] font-black uppercase tracking-widest text-white">Service Warranty</span>
                           <Toggle 
                             active={formData.productDetails.warranty} 
                             onClick={() => setFormData({
                               ...formData, 
                               productDetails: {
                                 ...formData.productDetails, 
                                 warranty: !formData.productDetails.warranty
                               }
                             })} 
                           />
                         </div>
                         {formData.productDetails.warranty && (
                           <div className="animate-in fade-in duration-200">
                             <input
                               type="text"
                               className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-dragon-cyan"
                               placeholder="Duration (e.g. 1 Year or 6 Months)"
                               value={(formData.productDetails as any).warrantyDuration || ''}
                               onChange={(e) => setFormData({
                                 ...formData,
                                 productDetails: {
                                   ...formData.productDetails,
                                   warrantyDuration: e.target.value
                                 } as any
                               })}
                             />
                           </div>
                         )}
                       </div>

                       <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex flex-col gap-2.5">
                         <div className="flex items-center justify-between w-full">
                           <span className="text-[10px] font-black uppercase tracking-widest text-white">Replacement Guarantee</span>
                           <Toggle 
                             active={formData.productDetails.guarantee} 
                             onClick={() => setFormData({
                               ...formData, 
                               productDetails: {
                                 ...formData.productDetails, 
                                 guarantee: !formData.productDetails.guarantee
                               }
                             })} 
                           />
                          </div>
                          {formData.productDetails.guarantee && (
                            <div className="animate-in fade-in duration-200">
                              <input
                                type="text"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-dragon-cyan"
                                placeholder="Duration (e.g. 7 Days or 30 Days)"
                                value={(formData.productDetails as any).replacementDuration || ''}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  productDetails: {
                                    ...formData.productDetails,
                                    replacementDuration: e.target.value
                                  } as any
                                })}
                              />
                            </div>
                          )}
                        </div>
                    </div>

                    {/* Colors & Sizes (Multi) */}
                    <div className="md:col-span-2 space-y-4">
                        <TagInput 
                          label="Available Colors" 
                          tags={formData.productDetails.colors} 
                          onAdd={(val) => handleAddTag('colors', val)} 
                          onRemove={(i) => removeTag('colors', i)} 
                        />
                        <TagInput 
                          label="Available Sizes" 
                          tags={formData.productDetails.sizes} 
                          onAdd={(val) => handleAddTag('sizes', val)} 
                          onRemove={(i) => removeTag('sizes', i)} 
                        />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Weight</label>
                      <input type="text" value={formData.productDetails.weight} onChange={(e) => setFormData({...formData, productDetails: {...formData.productDetails, weight: e.target.value}})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none" />
                    </div>
                  </div>

                  {/* Delivery Charges Section */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-dragon-gold/10 flex items-center justify-center text-dragon-gold">
                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                      </div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-white">Delivery Charges (BDT)</h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Area 1 Config */}
                      <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl space-y-3">
                        <div className="text-[10px] font-black uppercase tracking-wider text-dragon-gold block font-mono">
                          Area 1 (e.g. Inside Dhaka)
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Area Label</label>
                          <input 
                            type="text" 
                            value={formData.deliveryCharges.insideLabel || ''}
                            onChange={(e) => setFormData({...formData, deliveryCharges: {...formData.deliveryCharges, insideLabel: e.target.value}})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-dragon-gold transition-all"
                            placeholder="Inside Dhaka"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Delivery Charge (Charge ৳)</label>
                          <input 
                            type="number" 
                            value={formData.deliveryCharges.inside}
                            onChange={(e) => setFormData({...formData, deliveryCharges: {...formData.deliveryCharges, inside: Number(e.target.value)}})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-dragon-gold transition-all"
                            placeholder="80"
                          />
                        </div>
                      </div>

                      {/* Area 2 Config */}
                      <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl space-y-3">
                        <div className="text-[10px] font-black uppercase tracking-wider text-dragon-gold block font-mono">
                          Area 2 (e.g. Outside Dhaka)
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Area Label</label>
                          <input 
                            type="text" 
                            value={formData.deliveryCharges.outsideLabel || ''}
                            onChange={(e) => setFormData({...formData, deliveryCharges: {...formData.deliveryCharges, outsideLabel: e.target.value}})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-dragon-gold transition-all"
                            placeholder="Outside Dhaka"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Delivery Charge (Charge ৳)</label>
                          <input 
                            type="number" 
                            value={formData.deliveryCharges.outside}
                            onChange={(e) => setFormData({...formData, deliveryCharges: {...formData.deliveryCharges, outside: Number(e.target.value)}})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-dragon-gold transition-all"
                            placeholder="130"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Custom Area Delivery Charges */}
                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
                      <div>
                        <h5 className="text-[11px] font-black uppercase tracking-wider text-dragon-gold">Custom Area Delivery Charges</h5>
                        <p className="text-[9px] text-gray-500 font-medium">If specific sub-areas have higher delivery charges, add them here using the plus button.</p>
                      </div>

                      <div className="flex gap-2 items-end">
                        <div className="flex-1 space-y-1">
                          <label className="text-[8px] font-bold text-gray-400 uppercase tracking-widest ml-1">Area Name</label>
                          <input 
                            type="text" 
                            value={newLandingAreaName}
                            onChange={(e) => setNewLandingAreaName(e.target.value)}
                            placeholder="e.g. Mirpur" 
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-dragon-cyan/50 text-white"
                          />
                        </div>
                        <div className="w-32 space-y-1">
                          <label className="text-[8px] font-bold text-gray-400 uppercase tracking-widest ml-1">Delivery Charge (৳)</label>
                          <input 
                            type="number" 
                            value={newLandingAreaCharge}
                            onChange={(e) => setNewLandingAreaCharge(e.target.value)}
                            placeholder="e.g. 80" 
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-dragon-cyan/50 text-white"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const trimmedName = newLandingAreaName.trim();
                            const parsedCharge = Number(newLandingAreaCharge);
                            if (!trimmedName) return triggerSuccess('Input Required', 'Please enter area name.');
                            if (isNaN(parsedCharge) || parsedCharge < 0) return triggerSuccess('Input Required', 'Please enter a valid charge amount.');
                            
                            // avoid duplicate area name
                            if (formData.customDeliveryCharges?.some(c => c.area.toLowerCase() === trimmedName.toLowerCase())) {
                              return triggerSuccess('Area Exists', 'This area is already added.');
                            }

                            const updatedList = [...(formData.customDeliveryCharges || []), { area: trimmedName, charge: parsedCharge }];
                            setFormData({ ...formData, customDeliveryCharges: updatedList });
                            setNewLandingAreaName('');
                            setNewLandingAreaCharge('');
                          }}
                          className="p-3 bg-dragon-cyan/10 border border-dragon-cyan/25 hover:bg-dragon-cyan hover:text-black rounded-xl transition-all text-dragon-cyan font-bold text-xs flex items-center justify-center shrink-0"
                          title="Add Area"
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      {/* List of Custom Area Charges */}
                      {formData.customDeliveryCharges && formData.customDeliveryCharges.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                          {formData.customDeliveryCharges.map((item, id) => (
                            <div key={`cust-del-${id}`} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl pl-3 pr-2 py-1.5 text-xs text-white">
                              <span className="font-semibold text-[10px]">{item.area}:</span>
                              <span className="text-dragon-cyan font-bold font-mono text-[10px]">৳{item.charge}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = formData.customDeliveryCharges.filter((_, idx2) => idx2 !== id);
                                  setFormData({ ...formData, customDeliveryCharges: updated });
                                }}
                                className="text-gray-500 hover:text-rose-400 p-0.5 transition-colors"
                                title="Remove Area"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Settings Section */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-dragon-emerald/10 flex items-center justify-center text-dragon-emerald">
                        <CheckCircle2 size={18} />
                      </div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-white">Payment Methods</h4>
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                       <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
                         <span className="text-[10px] font-black uppercase tracking-widest">Cash On Delivery</span>
                         <Toggle active={formData.paymentSettings.cod} onClick={() => setFormData({...formData, paymentSettings: {...formData.paymentSettings, cod: !formData.paymentSettings.cod}})} />
                       </div>
                    </div>
                  </div>

                  {/* Location Tracking Requirement Toggle */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                        <MapPin size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-white">Require Location for Checkout</h4>
                        <p className="text-[9px] text-[#888899] font-medium leading-relaxed">If enabled, customers must share their live location from their browser to complete checkout.</p>
                      </div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white">Require Location Tracking</span>
                      <Toggle 
                        active={formData.requireLocationTracking || false} 
                        onClick={() => setFormData({ ...formData, requireLocationTracking: !formData.requireLocationTracking })} 
                      />
                    </div>
                  </div>

                  {/* Dragon Chatbot Toggle */}
                  <div className="space-y-4 border-t border-white/5 pt-4 animate-in fade-in duration-300">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-dragon-cyan/10 flex items-center justify-center text-dragon-cyan">
                        <Sparkles size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-white">DOEL Messenger Chatbot</h4>
                        <p className="text-[9px] text-[#888899] font-medium leading-relaxed">If enabled, an interactive DOEL messenger widget will appear on the landing page for customer queries.</p>
                      </div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white">Enable DOEL Messenger Chatbot</span>
                      <Toggle 
                        active={formData.dragonBotEnabled || false} 
                        onClick={() => setFormData({ ...formData, dragonBotEnabled: !formData.dragonBotEnabled })} 
                      />
                    </div>
                  </div>
                </section>

                {/* Theme Selection */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-dragon-cyan/10 flex items-center justify-center text-dragon-cyan">
                      <Sparkles size={18} />
                    </div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-white">Visual Theme</h4>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {['light', 'dark', 'galaxy', 'bubble', 'cinematic'].map((t) => (
                      <button
                        type="button"
                        key={t}
                        onClick={() => setFormData({...formData, theme: t as any, bodyBg: t === 'light' ? 'white' : 'black'})}
                        className={cn(
                          "p-4 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest cursor-pointer",
                          formData.theme === t ? "bg-dragon-cyan text-dragon-black border-dragon-cyan font-bold shadow-lg" : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-white"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Header, Body, & Footer Background Customization */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-dragon-cyan/10 flex items-center justify-center text-dragon-cyan">
                      <Palette size={18} />
                    </div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-white">Page Backgrounds & Buttons</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white/[0.02] border border-white/5 p-6 rounded-3xl">
                    {/* Header bg select */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Header Background</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, headerBg: 'black'})}
                          className={cn(
                            "py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all",
                            (formData.headerBg || 'black') === 'black' ? "bg-black text-white border-white/30" : "bg-white/5 border-white/10 text-gray-500 hover:text-white"
                          )}
                        >
                          Pure Black
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, headerBg: 'white'})}
                          className={cn(
                            "py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all",
                            formData.headerBg === 'white' ? "bg-white text-black border-black/30" : "bg-white/5 border-white/10 text-gray-500 hover:text-black"
                          )}
                        >
                          Pure White
                        </button>
                      </div>
                    </div>

                    {/* Body bg select */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Body Background</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, bodyBg: 'black'})}
                          className={cn(
                            "py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all",
                            (formData.bodyBg || 'black') === 'black' ? "bg-black text-white border-white/30" : "bg-white/5 border-white/10 text-gray-500 hover:text-white"
                          )}
                        >
                          Pure Black
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, bodyBg: 'white'})}
                          className={cn(
                            "py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all",
                            formData.bodyBg === 'white' ? "bg-white text-black border-black/30" : "bg-white/5 border-white/10 text-gray-500 hover:text-black"
                          )}
                        >
                          Pure White
                        </button>
                      </div>
                    </div>

                    {/* Footer bg select */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Footer Background</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, footerBg: 'black'})}
                          className={cn(
                            "py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all",
                            (formData.footerBg || 'black') === 'black' ? "bg-black text-white border-white/30" : "bg-white/5 border-white/10 text-gray-500 hover:text-white"
                          )}
                        >
                          Pure Black
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, footerBg: 'white'})}
                          className={cn(
                            "py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all",
                            formData.footerBg === 'white' ? "bg-white text-black border-black/30" : "bg-white/5 border-white/10 text-gray-500 hover:text-black"
                          )}
                        >
                          Pure White
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/[0.02] border border-white/5 p-6 rounded-3xl mt-4">
                    {/* Button Background Color */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Button Background Color</label>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <input
                            type="color"
                            value={formData.buttonBg || '#00f2fe'}
                            onChange={(e) => setFormData({...formData, buttonBg: e.target.value})}
                            className="w-12 h-12 rounded-xl bg-transparent border-0 cursor-pointer outline-none relative z-10"
                          />
                          <div className="absolute inset-0 rounded-xl border border-white/10 pointer-events-none" style={{ backgroundColor: formData.buttonBg || '#00f2fe' }} />
                        </div>
                        <input
                          type="text"
                          value={formData.buttonBg || '#00f2fe'}
                          onChange={(e) => setFormData({...formData, buttonBg: e.target.value})}
                          placeholder="#00f2fe"
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none font-mono focus:border-dragon-cyan/50 text-white"
                        />
                      </div>
                    </div>

                    {/* Button Text Color */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Button Text Color</label>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <input
                            type="color"
                            value={formData.buttonTextColor || '#000000'}
                            onChange={(e) => setFormData({...formData, buttonTextColor: e.target.value})}
                            className="w-12 h-12 rounded-xl bg-transparent border-0 cursor-pointer outline-none relative z-10"
                          />
                          <div className="absolute inset-0 rounded-xl border border-white/10 pointer-events-none" style={{ backgroundColor: formData.buttonTextColor || '#000000' }} />
                        </div>
                        <input
                          type="text"
                          value={formData.buttonTextColor || '#000000'}
                          onChange={(e) => setFormData({...formData, buttonTextColor: e.target.value})}
                          placeholder="#000000"
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none font-mono focus:border-dragon-cyan/50 text-white"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Communication Section */}
                <section className="space-y-6">
                   <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                      <MessageCircle size={18} />
                    </div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-white">Communication</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Instant Messaging Channel</label>
                      <select 
                        value={formData.messagingChannel}
                        onChange={(e) => setFormData({...formData, messagingChannel: e.target.value})}
                        className="w-full bg-[#121624] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-dragon-cyan/50 text-xs font-bold text-white cursor-pointer"
                        style={{ backgroundColor: '#121624', color: '#ffffff' }}
                      >
                        <option value="whatsapp" style={{ backgroundColor: '#121624', color: '#ffffff' }} className="bg-[#121624] text-white">WhatsApp</option>
                        <option value="telegram" style={{ backgroundColor: '#121624', color: '#ffffff' }} className="bg-[#121624] text-white">Telegram</option>
                        <option value="viber" style={{ backgroundColor: '#121624', color: '#ffffff' }} className="bg-[#121624] text-white">Viber</option>
                        <option value="line" style={{ backgroundColor: '#121624', color: '#ffffff' }} className="bg-[#121624] text-white">Line</option>
                        <option value="wechatmini" style={{ backgroundColor: '#121624', color: '#ffffff' }} className="bg-[#121624] text-white">WeChat Mini</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                        {formData.messagingChannel === 'whatsapp' ? 'WhatsApp Account/Number' : 
                         formData.messagingChannel === 'telegram' ? 'Telegram Username' : 
                         formData.messagingChannel === 'viber' ? 'Viber Number' : 
                         formData.messagingChannel === 'line' ? 'Line ID' : 
                         'Contact Support ID / Link'}
                      </label>
                      <input 
                        type="text" 
                        placeholder={
                          formData.messagingChannel === 'whatsapp' ? '+8801700000000' : 
                          formData.messagingChannel === 'telegram' ? 'username' : 
                          'ID or Number'
                        }
                        value={formData.messagingNumber || ''}
                        onChange={(e) => setFormData({...formData, messagingNumber: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-dragon-cyan/50 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Email Addrss</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input 
                          type="email" 
                          placeholder="store@email.com"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-dragon-cyan/50 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Social Section */}
                <section className="space-y-6">
                   <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-dragon-gold/10 flex items-center justify-center text-dragon-gold">
                      <LinkIcon size={18} />
                    </div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-white">Social Presence</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500"><Youtube size={16}/></div>
                      <input type="text" placeholder="YouTube Link" value={formData.socialLinks.youtube} onChange={(e) => setFormData({...formData, socialLinks: {...formData.socialLinks, youtube: e.target.value}})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-xs outline-none" />
                    </div>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white"><Layout size={16}/></div>
                      <input type="text" placeholder="TikTok Link" value={formData.socialLinks.tiktok} onChange={(e) => setFormData({...formData, socialLinks: {...formData.socialLinks, tiktok: e.target.value}})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-xs outline-none" />
                    </div>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500"><Facebook size={16}/></div>
                      <input type="text" placeholder="FB Page Link" value={formData.socialLinks.fbPage} onChange={(e) => setFormData({...formData, socialLinks: {...formData.socialLinks, fbPage: e.target.value}})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-xs outline-none" />
                    </div>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-500"><Instagram size={16}/></div>
                      <input type="text" placeholder="Instagram Link" value={formData.socialLinks.instagram} onChange={(e) => setFormData({...formData, socialLinks: {...formData.socialLinks, instagram: e.target.value}})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-xs outline-none" />
                    </div>
                  </div>
                </section>

                {/* Pixel & Tracking Section */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-dragon-cyan/10 flex items-center justify-center text-dragon-cyan">
                      <TrendingUp size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-white">Marketing Pixels & Analytics Setup</h4>
                      <p className="text-[10px] text-gray-400">Configure real-time event tracking, conversion pixels, and heatmaps for your landing page.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/[0.02] border border-white/5 p-6 rounded-3xl">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Facebook size={12} className="text-blue-400" /> Facebook Pixel ID
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. 1234567890" 
                        value={formData.tracking?.facebook || ''} 
                        onChange={(e) => setFormData({
                          ...formData, 
                          tracking: {
                            ...formData.tracking,
                            facebook: e.target.value
                          }
                        })} 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-dragon-cyan text-white" 
                      />
                      <span className="text-[9px] text-gray-500 block ml-1">Meta pixel for PageView and Purchase conversion optimization.</span>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <TrendingUp size={12} className="text-pink-400" /> TikTok Pixel ID
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. C1234567890" 
                        value={formData.tracking?.tiktok || ''} 
                        onChange={(e) => setFormData({
                          ...formData, 
                          tracking: {
                            ...formData.tracking,
                            tiktok: e.target.value
                          }
                        })} 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-dragon-cyan text-white" 
                      />
                      <span className="text-[9px] text-gray-500 block ml-1">TikTok ads pixel for real-time buyer order tracking.</span>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <BarChart3 size={12} className="text-cyan-400" /> Google Tag Manager (GTM) ID
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. GTM-XXXXXXX" 
                        value={formData.tracking?.gtm || ''} 
                        onChange={(e) => setFormData({
                          ...formData, 
                          tracking: {
                            ...formData.tracking,
                            gtm: e.target.value
                          }
                        })} 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-dragon-cyan text-white" 
                      />
                      <span className="text-[9px] text-gray-500 block ml-1">Manage remote data layer tags and custom scripts.</span>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Eye size={12} className="text-amber-400" /> Microsoft Clarity Project ID
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. jx98k12ab3" 
                        value={formData.tracking?.clarity || ''} 
                        onChange={(e) => setFormData({
                          ...formData, 
                          tracking: {
                            ...formData.tracking,
                            clarity: e.target.value
                          }
                        })} 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-dragon-cyan text-white" 
                      />
                      <span className="text-[9px] text-gray-500 block ml-1">Track visitor session recordings and click heatmaps.</span>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Globe size={12} className="text-emerald-400" /> Google Analytics 4 (GA4) ID
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. G-XXXXXXXXXX" 
                        value={formData.tracking?.ga4 || ''} 
                        onChange={(e) => setFormData({
                          ...formData, 
                          tracking: {
                            ...formData.tracking,
                            ga4: e.target.value
                          }
                        })} 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-dragon-cyan text-white" 
                      />
                      <span className="text-[9px] text-gray-500 block ml-1">Direct Google Analytics measurement for traffic insights.</span>
                    </div>
                  </div>
                </section>

                {/* Country & Cart Section */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-dragon-cyan/10 flex items-center justify-center text-dragon-cyan">
                      <Globe size={18} />
                    </div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-white">Manual Order Cart Configuration</h4>
                  </div>
                  <div className="space-y-4">
                    <p className="text-[10px] text-gray-400 font-light uppercase tracking-tighter">Select the country where you will market this product. The system will automatically configure and optimize standard regional settings.</p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#a8a8b3]">Select Country</label>
                        <button
                          type="button"
                          onClick={() => setShowCountrySearchModal(true)}
                          className="text-[10px] font-bold text-dragon-cyan hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Search size={11} /> Browse 70+ Countries
                        </button>
                      </div>

                      {/* Interactive Custom Button Selector */}
                      <button
                        type="button"
                        onClick={() => setShowCountrySearchModal(true)}
                        className="w-full bg-[#121624] border border-white/15 hover:border-dragon-cyan/60 rounded-xl p-3 text-left transition-all flex items-center justify-between cursor-pointer group shadow-sm"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-dragon-cyan/10 flex items-center justify-center text-dragon-cyan shrink-0">
                            <Globe size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-white text-xs flex items-center gap-1.5">
                              <span>{formData.country || 'Select Country'}</span>
                              {(() => {
                                const found = COUNTRIES.find(c => c.name === formData.country);
                                return found && found.bengaliName && found.bengaliName !== found.name ? (
                                  <span className="text-gray-400 font-normal">({found.bengaliName})</span>
                                ) : null;
                              })()}
                            </p>
                            <p className="text-[10px] text-gray-400 font-mono">
                              Currency: {(() => {
                                const found = COUNTRIES.find(c => c.name === formData.country);
                                return found ? `${found.currencySymbol} (${found.currency})` : '৳ (BDT)';
                              })()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 bg-dragon-cyan/10 group-hover:bg-dragon-cyan/20 px-2.5 py-1.5 rounded-lg border border-dragon-cyan/30 transition-all">
                          <span className="text-[10px] text-dragon-cyan font-bold">Select</span>
                          <ChevronDown size={14} className="text-dragon-cyan" />
                        </div>
                      </button>

                      {/* Native Select Fallback */}
                      <div className="pt-1">
                        <select 
                          value={formData.country}
                          onChange={(e) => handleCountryChange(e.target.value)}
                          className="w-full bg-[#121624] border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-dragon-cyan text-xs font-bold text-white cursor-pointer"
                          style={{ backgroundColor: '#121624', color: '#ffffff' }}
                        >
                          {COUNTRIES.map((cty) => (
                            <option 
                              key={cty.name} 
                              value={cty.name} 
                              style={{ backgroundColor: '#121624', color: '#ffffff' }}
                              className="bg-[#121624] text-white py-1"
                            >
                              {cty.name} {cty.bengaliName && cty.bengaliName !== cty.name ? `(${cty.bengaliName})` : ''} — {cty.currencySymbol} ({cty.currency})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#a8a8b3] block flex items-center gap-1.5">
                        <Globe size={11} className="text-dragon-cyan" />
                        Language Settings Option
                      </label>
                      <select
                        value={formData.language || 'auto'}
                        onChange={(e) => setFormData({...formData, language: e.target.value})}
                        className="w-full bg-[#121624] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-dragon-cyan text-xs font-bold text-white cursor-pointer"
                        style={{ backgroundColor: '#121624', color: '#ffffff' }}
                      >
                        <option value="auto" style={{ backgroundColor: '#121624', color: '#ffffff' }} className="bg-[#121624] text-white">Auto - Country Native (স্বয়ংক্রিয়)</option>
                        <option value="en" style={{ backgroundColor: '#121624', color: '#ffffff' }} className="bg-[#121624] text-white">English (English Only)</option>
                        <option value="bn" style={{ backgroundColor: '#121624', color: '#ffffff' }} className="bg-[#121624] text-white">Bengali (বাংলা)</option>
                        <option value="ar" style={{ backgroundColor: '#121624', color: '#ffffff' }} className="bg-[#121624] text-white">Arabic (العربية)</option>
                        <option value="es" style={{ backgroundColor: '#121624', color: '#ffffff' }} className="bg-[#121624] text-white">Spanish (Español)</option>
                        <option value="pt" style={{ backgroundColor: '#121624', color: '#ffffff' }} className="bg-[#121624] text-white">Portuguese (Português)</option>
                        <option value="fr" style={{ backgroundColor: '#121624', color: '#ffffff' }} className="bg-[#121624] text-white">French (Français)</option>
                        <option value="tr" style={{ backgroundColor: '#121624', color: '#ffffff' }} className="bg-[#121624] text-white">Turkish (Türkçe)</option>
                        <option value="ru" style={{ backgroundColor: '#121624', color: '#ffffff' }} className="bg-[#121624] text-white">Russian (Русский)</option>
                        <option value="id" style={{ backgroundColor: '#121624', color: '#ffffff' }} className="bg-[#121624] text-white">Indonesian (Bahasa Indonesia)</option>
                        <option value="ms" style={{ backgroundColor: '#121624', color: '#ffffff' }} className="bg-[#121624] text-white">Malay (Bahasa Melayu)</option>
                        <option value="vi" style={{ backgroundColor: '#121624', color: '#ffffff' }} className="bg-[#121624] text-white">Vietnamese (Tiếng Việt)</option>
                        <option value="th" style={{ backgroundColor: '#121624', color: '#ffffff' }} className="bg-[#121624] text-white">Thai (ไทย)</option>
                        <option value="hi" style={{ backgroundColor: '#121624', color: '#ffffff' }} className="bg-[#121624] text-white">Hindi (हिन्दी)</option>
                        <option value="ur" style={{ backgroundColor: '#121624', color: '#ffffff' }} className="bg-[#121624] text-white">Urdu (اردو)</option>
                        <option value="my" style={{ backgroundColor: '#121624', color: '#ffffff' }} className="bg-[#121624] text-white">Burmese (မြန်မာ)</option>
                        <option value="km" style={{ backgroundColor: '#121624', color: '#ffffff' }} className="bg-[#121624] text-white">Khmer (ខ្មែរ)</option>
                        <option value="ne" style={{ backgroundColor: '#121624', color: '#ffffff' }} className="bg-[#121624] text-white">Nepali (नेपाली)</option>
                        <option value="si" style={{ backgroundColor: '#121624', color: '#ffffff' }} className="bg-[#121624] text-white">Sinhala (සිංහල)</option>
                        <option value="uk" style={{ backgroundColor: '#121624', color: '#ffffff' }} className="bg-[#121624] text-white">Ukrainian (Українська)</option>
                      </select>
                      <span className="text-[9px] text-gray-400 block mt-1">💡 This determines the primary display language of your public landing page.</span>
                    </div>

                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="text-[9px] font-black uppercase text-dragon-cyan">Manual Configuration Settings</span>
                        <span className="text-[9px] font-bold text-gray-400">Custom Override</span>
                      </div>

                      {/* Currency symbol override */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Currency Symbol</label>
                        <input
                          type="text"
                          value={formData.orderCartConfig?.currencySymbol || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            orderCartConfig: {
                              ...(formData.orderCartConfig || {}),
                              currencySymbol: e.target.value
                            }
                          })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-dragon-cyan transition-all"
                          placeholder="e.g. ৳, $, AED"
                        />
                      </div>

                      {/* Checkout fields checkboxes */}
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Required Checkout Fields</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { key: 'name', label: 'Full Name' },
                            { key: 'phone', label: 'Phone/Mobile' },
                            { key: 'address', label: 'Detailed Address' },
                            { key: 'state', label: 'State/Province' },
                            { key: 'city', label: 'City' },
                            { key: 'postalCode', label: 'Postal/ZIP Code' },
                            { key: 'landmark', label: 'Landmark/Ward' },
                            { key: 'nationalId', label: 'National ID' },
                            { key: 'email', label: 'Email Address' }
                          ].map(field => {
                            const isChecked = formData.orderCartConfig?.checkoutFields?.includes(field.key);
                            return (
                              <label key={field.key} className="flex items-center gap-2 p-2 bg-white/[0.01] border border-white/5 rounded-lg hover:bg-white/5 cursor-pointer transition-all">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    let updatedFields = [...(formData.orderCartConfig?.checkoutFields || [])];
                                    if (e.target.checked) {
                                      if (!updatedFields.includes(field.key)) {
                                        updatedFields.push(field.key);
                                      }
                                    } else {
                                      updatedFields = updatedFields.filter(f => f !== field.key);
                                    }
                                    setFormData({
                                      ...formData,
                                      orderCartConfig: {
                                        ...(formData.orderCartConfig || {}),
                                        checkoutFields: updatedFields
                                      }
                                    });
                                  }}
                                  className="rounded border-white/10 text-dragon-cyan focus:ring-dragon-cyan bg-dragon-black w-3.5 h-3.5"
                                />
                                <span className="text-[10px] text-gray-300 font-medium">{field.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>


                    </div>
                  </div>
                </section>
              </div>

              {/* Modal Footer */}
              <div className="p-8 border-t border-white/5 flex gap-4">
                <button 
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-4 text-gray-500 font-black uppercase tracking-[0.2em] text-[10px] hover:text-white transition-colors"
                >
                  Discard
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-[2] py-4 bg-dragon-cyan text-dragon-black font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-xl shadow-dragon-cyan/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save as Draft
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Inventory Popup */}
      <AnimatePresence>
        {showInvPopup && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-xl bg-dragon-black border border-white/10 rounded-[2.5rem] p-8 space-y-6 shadow-2xl"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black uppercase tracking-widest text-dragon-cyan">Select Product</h3>
                <motion.button 
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowInvPopup(false)} 
                  className="p-2 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl cursor-pointer flex items-center justify-center shadow-md"
                >
                  <X size={18} />
                </motion.button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
                {inventory.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-gray-500 uppercase font-black text-[10px] tracking-widest">Your inventory is empty</div>
                ) : (
                  inventory.map((item, idx) => (
                    <button
                      key={`lp-inv-${item.id}-${idx}`}
                      onClick={() => handleSelectProduct(item)}
                      className="group p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-dragon-cyan/50 hover:bg-dragon-cyan/5 transition-all text-left"
                    >
                      <div className="aspect-square rounded-xl bg-black/40 overflow-hidden mb-3">
                        {item.image ? <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /> : <Package size={24} className="w-full h-full p-8 text-gray-800" />}
                      </div>
                      <h4 className="text-[10px] font-black uppercase truncate">{item.name}</h4>
                      <p className="text-[10px] font-bold text-dragon-cyan mt-1">৳{item.sellPrice}</p>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Selling Price Prompt Popup */}
      <AnimatePresence>
        {showPricePrompt && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-dragon-black border border-white/10 rounded-[2.5rem] p-8 space-y-6 shadow-2xl relative"
            >
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-dragon-cyan/10 flex items-center justify-center text-dragon-cyan mx-auto">
                    <TrendingUp size={24} />
                </div>
                <h3 className="text-base font-black uppercase tracking-widest text-white mt-3 select-none">Set Selling Price</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-relaxed">
                  {selectedProductToPrompt?.name}
                </p>
                {selectedProductToPrompt?.buyPrice ? (
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-wider bg-white/5 py-1.5 px-4 rounded-full inline-block mt-1">
                    Your Wholesale Buy Price: ৳{selectedProductToPrompt.buyPrice}
                  </p>
                ) : null}
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[9px] font-black uppercase text-dragon-cyan tracking-widest block ml-1 select-none">Original Retail Sell Price (৳)</label>
                  <input
                    type="number"
                    autoFocus
                    value={promptPrice}
                    onChange={(e) => setPromptPrice(e.target.value)}
                    placeholder="e.g. 2000"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 outline-none font-bold text-center text-md text-white font-sans focus:border-dragon-cyan/50 focus:bg-dragon-cyan/[0.02] transition-all"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[9px] font-black uppercase text-dragon-cyan tracking-widest block ml-1 select-none">Discount Percentage (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={promptDiscount}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val >= 0 && val <= 100) {
                        setPromptDiscount(e.target.value);
                      } else if (!e.target.value) {
                        setPromptDiscount('');
                      }
                    }}
                    placeholder="e.g. 10"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 outline-none font-bold text-center text-md text-white font-sans focus:border-dragon-cyan/50 focus:bg-dragon-cyan/[0.02] transition-all"
                  />
                </div>

                {/* Calculations summary */}
                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-2.5 text-left">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 font-bold">Original Price:</span>
                    <span className="font-mono text-white font-black">৳{Number(promptPrice) || 0}</span>
                  </div>
                  {Number(promptDiscount) > 0 && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-red-400 font-bold">Discount ({Number(promptDiscount)}%):</span>
                      <span className="font-mono text-red-400 font-black">-৳{Math.round((Number(promptPrice) || 0) * (Number(promptDiscount) || 0) / 100)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-xs border-t border-white/5 pt-2">
                    <span className="text-dragon-cyan font-bold">Final Selling Price:</span>
                    <span className="font-mono text-dragon-cyan font-black text-sm">
                      ৳{(() => {
                        const oPrice = Number(promptPrice) || 0;
                        const dPercent = Number(promptDiscount) || 0;
                        return dPercent > 0 ? Math.round(oPrice * (1 - dPercent / 100)) : oPrice;
                      })()}
                    </span>
                  </div>
                </div>

                {/* Quantity-Based Delivery Charge Configuration */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3.5 text-left">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-black uppercase text-dragon-cyan tracking-wider block">Increment Delivery Charge</span>
                      <span className="text-[8px] text-gray-400 font-bold block">Increase delivery charge as quantity increases</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPromptQtyBasedEnabled(!promptQtyBasedEnabled)}
                      className={`w-10 h-5 rounded-full transition-all relative ${promptQtyBasedEnabled ? 'bg-dragon-cyan' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-dragon-black transition-all ${promptQtyBasedEnabled ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>

                  {promptQtyBasedEnabled && (
                    <div className="space-y-3 pt-1.5 border-t border-white/5 animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Add per extra item (৳)</label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPromptIncrementPerQty(Math.max(0, promptIncrementPerQty - 5))}
                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center font-bold text-white text-sm"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={promptIncrementPerQty}
                            onChange={(e) => setPromptIncrementPerQty(Math.max(0, Number(e.target.value) || 0))}
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg py-1 px-3 text-center text-sm font-bold text-white outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setPromptIncrementPerQty(promptIncrementPerQty + 5)}
                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center font-bold text-white text-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Display charge previews */}
                      <div className="bg-dragon-black/40 border border-white/5 p-2.5 rounded-xl space-y-1.5 text-[10px]">
                        <span className="font-bold text-gray-400 block mb-1 uppercase tracking-wider text-[8px]">Delivery Charge Samples:</span>
                        <div className="grid grid-cols-2 gap-2 text-[9px] text-gray-300">
                          <div>
                            <span className="font-black text-dragon-cyan uppercase tracking-wider block border-b border-white/5 pb-0.5">{formData.deliveryCharges?.insideLabel || 'Inside'}</span>
                            <div className="space-y-0.5 mt-1 font-mono">
                              <div>1 item: ৳{formData.deliveryCharges?.inside || 80}</div>
                              <div>2 items: ৳{(formData.deliveryCharges?.inside || 80) + promptIncrementPerQty}</div>
                              <div>3 items: ৳{(formData.deliveryCharges?.inside || 80) + (promptIncrementPerQty * 2)}</div>
                            </div>
                          </div>
                          <div>
                            <span className="font-black text-dragon-cyan uppercase tracking-wider block border-b border-white/5 pb-0.5">{formData.deliveryCharges?.outsideLabel || 'Outside'}</span>
                            <div className="space-y-0.5 mt-1 font-mono">
                              <div>1 item: ৳{formData.deliveryCharges?.outside || 130}</div>
                              <div>2 items: ৳{(formData.deliveryCharges?.outside || 130) + promptIncrementPerQty}</div>
                              <div>3 items: ৳{(formData.deliveryCharges?.outside || 130) + (promptIncrementPerQty * 2)}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {(() => {
                  const oPrice = Number(promptPrice) || 0;
                  const dPercent = Number(promptDiscount) || 0;
                  const fPrice = dPercent > 0 ? Math.round(oPrice * (1 - dPercent / 100)) : oPrice;
                  const buyP = selectedProductToPrompt?.buyPrice || 0;
                  const profitVal = fPrice - buyP;
                  if (oPrice <= 0) return null;
                  return (
                    <div className="bg-dragon-emerald/10 border border-dragon-emerald/20 p-3.5 rounded-2xl text-center animate-in fade-in zoom-in-95 duration-150">
                      <span className="text-[8px] font-black uppercase text-dragon-emerald tracking-widest block mb-1">Your Net Profit</span>
                      <span className="text-lg font-black text-white font-mono">
                        ৳{Math.max(0, profitVal)}
                      </span>
                    </div>
                  );
                })()}

                <div className="flex gap-2.5 pt-2">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowPricePrompt(false);
                      setSelectedProductToPrompt(null);
                    }} 
                    className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 text-gray-400 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    onClick={handleConfirmPromptPrice}
                    className="flex-[2] py-3.5 bg-dragon-cyan hover:opacity-95 text-dragon-black rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg shadow-dragon-cyan/20 transition-all"
                  >
                    Sync Product
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Searchable Country Picker Modal */}
      <AnimatePresence>
        {showCountrySearchModal && (
          <div 
            onClick={() => setShowCountrySearchModal(false)}
            className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-pointer"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg bg-[#121624] border border-white/15 rounded-3xl p-6 text-white shadow-2xl space-y-4 max-h-[85vh] flex flex-col cursor-default"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Globe size={18} className="text-dragon-cyan" />
                  <h3 className="font-bold text-sm text-white uppercase tracking-wider">Select Target Market Country</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCountrySearchModal(false)}
                  className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={countrySearchQuery}
                  onChange={(e) => setCountrySearchQuery(e.target.value)}
                  placeholder="Search country name, code or Bengali name..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none focus:border-dragon-cyan"
                  autoFocus
                />
              </div>

              {/* Country List */}
              <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar max-h-[50vh]">
                {COUNTRIES.filter(c => {
                  if (!countrySearchQuery.trim()) return true;
                  const q = countrySearchQuery.toLowerCase();
                  return (
                    c.name.toLowerCase().includes(q) ||
                    (c.bengaliName && c.bengaliName.toLowerCase().includes(q)) ||
                    c.code.toLowerCase().includes(q) ||
                    c.currency.toLowerCase().includes(q)
                  );
                }).map((cty) => (
                  <button
                    key={cty.name}
                    type="button"
                    onClick={() => {
                      handleCountryChange(cty.name);
                      setShowCountrySearchModal(false);
                      setCountrySearchQuery('');
                    }}
                    className={cn(
                      "w-full p-3 rounded-xl border text-left text-xs font-semibold transition-all flex items-center justify-between cursor-pointer hover:border-dragon-cyan/50",
                      formData.country === cty.name
                        ? "bg-dragon-cyan/20 border-dragon-cyan text-white"
                        : "bg-white/5 border-white/5 text-gray-300 hover:bg-white/10"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Globe size={16} className="text-dragon-cyan shrink-0" />
                      <div>
                        <p className="font-bold text-white text-xs">
                          {cty.name} {cty.bengaliName && cty.bengaliName !== cty.name ? `(${cty.bengaliName})` : ''}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono">Currency: {cty.currencySymbol} ({cty.currency})</p>
                      </div>
                    </div>
                    {formData.country === cty.name && (
                      <CheckCircle2 size={16} className="text-dragon-cyan shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Success Modal */}
      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal(prev => ({ ...prev, isOpen: false }))}
        title={successModal.title}
        message={successModal.message}
      />
    </div>
  );
};

// --- Helper Components ---

const Toggle = ({ active, onClick }: { active: boolean, onClick: () => void }) => (
  <button 
    type="button"
    onClick={onClick}
    className={cn(
      "w-10 h-5 rounded-full transition-all relative overflow-hidden cursor-pointer shrink-0",
      active ? "bg-dragon-cyan" : "bg-white/10 border border-white/10"
    )}
  >
    <div className={cn(
      "absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full transition-all",
      active ? "right-1 bg-dragon-black" : "left-1 bg-gray-600"
    )} />
  </button>
);

const TagInput = ({ label, tags, onAdd, onRemove }: { label: string, tags: string[], onAdd: (v: string) => void, onRemove: (i: number) => void }) => {
  const [val, setVal] = useState('');
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((t, i) => (
          <span key={i} className="px-3 py-1 bg-dragon-cyan/10 border border-dragon-cyan/20 rounded-lg text-[10px] font-black uppercase text-dragon-cyan flex items-center gap-2">
            {t}
            <X size={12} className="cursor-pointer hover:text-white" onClick={() => onRemove(i)} />
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input 
          type="text" 
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onAdd(val), setVal(''))}
          placeholder={`Add ${label.toLowerCase()}...`}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-dragon-cyan/50 text-xs"
        />
        <button 
          onClick={() => (onAdd(val), setVal(''))}
          className="px-4 bg-white/5 border border-white/10 rounded-xl text-xs hover:bg-white/10 transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
};

// Re-using Lucide Icon for Save
const Save = ({ size, className }: { size?: number, className?: string }) => (
  <svg 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

export default LandingPages;
