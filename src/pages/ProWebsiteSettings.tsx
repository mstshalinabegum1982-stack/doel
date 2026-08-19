import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DoelBirdLogo } from '../components/DoelBirdLogo';
import { 
  ArrowLeft, 
  Save, 
  Globe, 
  Upload, 
  Facebook, 
  Tv, 
  AlertCircle,
  CheckCircle2, 
  Plus, 
  Trash2, 
  Truck,
  Sparkles,
  RefreshCw,
  Loader2,
  Eye,
  Link2,
  Settings,
  Palette,
  Megaphone,
  User,
  Phone,
  MessageCircle,
  Maximize2,
  X,
  ShoppingBag,
  Copy,
  Check,
  ShieldCheck,
  Server,
  Clock,
  CreditCard,
  Star,
  MessageSquare,
  Zap
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, query, where, getDocs, setDoc, doc, updateDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { AuthContext } from '../authContext';
import { ProWebsite } from '../types';
import { cn } from '../lib/utils';
import { COUNTRIES, getCheckoutFormFields } from '../utils/countriesData';
import { SuccessModal } from '../components/SuccessModal';
import { ReviewsPanel } from '../components/ReviewsPanel';
import { RealPaymentGatewayModal } from '../components/RealPaymentGatewayModal';
import {
  SettingsHeaderNav,
  SettingsSidebarNav,
  TrialStatusBanner,
  GeneralSettingsTab,
  CoversSettingsTab,
  DesignSettingsTab,
  SocialSettingsTab,
  TrackingSettingsTab,
  PoliciesSettingsTab,
  DomainSettingsTab,
  SettingsTabType
} from '../components/settings';

// Helper to compress and convert file to base64
const compressImage = (file: File, maxWidth = 800, maxHeight = 800, quality = 0.5): Promise<string> => {
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

export default function ProWebsiteSettings() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { user } = useContext(AuthContext);

  const resetToCleanDefaults = () => {
    setWebsiteId('');
    setBrandName('My Dragon Store');
    setSlug(`store-${Math.floor(Math.random() * 90) + 10}${Math.floor(Math.random() * 90) + 10}`);
    setFeatureTitle('Exclusive Premium Products');
    setDescription('Discover the best deals curated just for you. Real quality, genuine price.');
    setPrice(1250);
    setComparePrice(1850);
    setExistingCatalog([]);
    setCovers(['', '', '', '']);
    setLogo('');
    setWhatsapp('');
    setEmail('');
    setAboutText('');
    setSupport1Title('Help & Support Center');
    setSupport1Content('Our 24/7 customer support team is at your service. For any questions or complaints, contact us on our hotline number or directly in chat.');
    setSupport2Title('Return & Refund Policy');
    setSupport2Content('If any defect is found after receiving the product, let us know quickly. There is a facility to return or change the product within 7 days. You will find complete refund guidelines here.');
    setSupport3Title('Order Tracking Guide');
    setSupport3Content('To know the current status of your order, visit our tracking page and use your Order ID. You will find any delivery-related queries on this page.');
    setHelp1Title('Terms of Use');
    setHelp1Content('Before ordering products using our platform or website, please read our general terms and conditions carefully.');
    setHelp2Title('Privacy Policy');
    setHelp2Content('We value your privacy highest. Your personal information and contact details are kept fully secure and encrypted.');
    setHelp3Title('Order Protection Policy');
    setHelp3Content('To guarantee 100% uninterrupted shopping for customers, we have double-secured Cash on Delivery and 100% genuine quality warranty.');
    setFbPage('');
    setTiktokPage('');
    setYoutubeChannel('');
    setFacebookPixel('');
    setTiktokPixel('');
    setGtm('');
    setDeliveryChargeInside(80);
    setDeliveryChargeOutside(130);
    setRequireLocationTracking(false);
    setDragonBotEnabled(false);
    setCategories([{ id: 'all', name: 'All Products' }]);
    setFeaturedImage('');
    
    // Default Colors
    setThemeColor('#6366f1');
    setTitleColor('#ffffff');
    setDescriptionColor('#d1d5db');
    setPriceColor('#6366f1');
    setDiscountColor('#ef4444');
    setButtonColor('#6366f1');
    setButtonTextColor('#ffffff');
    setHeaderBg('black');
    setBodyBg('black');
    setFooterBg('black');

    setDomainName('');
    setIsDomainPrimary(false);
    setDnsType('A');
    setDnsValue('76.76.21.21');
    setSslStatus('pending');
    setLanguage('en');
  };
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Custom Success Modal State
  const [successModal, setSuccessModal] = useState<{ isOpen: boolean; title: string; message: string }>({ isOpen: false, title: '', message: '' });
  const triggerSuccess = (title: string, message: string) => setSuccessModal({ isOpen: true, title, message });
  const [activeTab, setActiveTab] = useState<'general' | 'design' | 'covers' | 'tracking' | 'social' | 'domain' | 'policies'>('general');

  // Trial, Expiry & Billing States
  const [siteCreatedAt, setSiteCreatedAt] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [selectedPlan, setSelectedPlan] = useState<'1_month' | '3_months' | '6_months' | '1_year'>('1_month');
  const [paymentPhone, setPaymentPhone] = useState('');
  const [paymentTrxId, setPaymentTrxId] = useState('');
  const [paymentSubmittedAt, setPaymentSubmittedAt] = useState('');
  const [bkashNumber, setBkashNumber] = useState('01700-000000');
  const [billingCountryMode, setBillingCountryMode] = useState<'bd' | 'intl'>('bd');
  const [showBkashGatewayModal, setShowBkashGatewayModal] = useState(false);
  const [bkashGatewayContext, setBkashGatewayContext] = useState<'pro' | 'bot'>('pro');

  // Bot Plan Activation and Billing States
  const [botPaymentStatus, setBotPaymentStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [botSelectedPlan, setBotSelectedPlan] = useState<'1_month' | '3_months'>('1_month');
  const [botPaymentPhone, setBotPaymentPhone] = useState('');
  const [botPaymentTrxId, setBotPaymentTrxId] = useState('');
  const [botPaymentSubmittedAt, setBotPaymentSubmittedAt] = useState('');
  const [botExpiryTime, setBotExpiryTime] = useState('');
  const [botBillingCountryMode, setBotBillingCountryMode] = useState<'bd' | 'intl'>('bd');
  const [botStripeCardNum, setBotStripeCardNum] = useState('');
  const [botStripeExpiry, setBotStripeExpiry] = useState('');
  const [botStripeCvc, setBotStripeCvc] = useState('');
  const [botStripeName, setBotStripeName] = useState('');
  const [botStripePaying, setBotStripePaying] = useState(false);

  // Stripe checkout card inputs
  const [stripeCardNum, setStripeCardNum] = useState('');
  const [stripeExpiry, setStripeExpiry] = useState('');
  const [stripeCvc, setStripeCvc] = useState('');
  const [stripeName, setStripeName] = useState('');
  const [stripePaying, setStripePaying] = useState(false);

  // Custom Domain States
  const [domainName, setDomainName] = useState('');
  const [isDomainPrimary, setIsDomainPrimary] = useState(false);
  const [dnsType, setDnsType] = useState<'A' | 'CNAME'>('A');
  const [dnsValue, setDnsValue] = useState('76.76.21.21');
  const [sslStatus, setSslStatus] = useState<'pending' | 'active' | 'failed'>('pending');
  const [copiedText, setCopiedText] = useState(false);

  // Form State
  const [websiteId, setWebsiteId] = useState<string>('');
  const [slug, setSlug] = useState('');
  const [brandName, setBrandName] = useState('');
  const [logo, setLogo] = useState('');
  const [defaultCountry, setDefaultCountry] = useState<string>('Bangladesh');
  const [language, setLanguage] = useState<string>('auto');

  // 72-Hour Timer Logic
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isTrialExpired, setIsTrialExpired] = useState(false);

  useEffect(() => {
    if (!siteCreatedAt) {
      setTimeLeft('72h 00m 00s');
      setIsTrialExpired(false);
      return;
    }

    const timer = setInterval(() => {
      const createdTime = new Date(siteCreatedAt).getTime();
      const expiryTime = createdTime + 72 * 60 * 60 * 1000;
      const diff = expiryTime - Date.now();

      if (diff <= 0) {
        setTimeLeft('Expired');
        setIsTrialExpired(true);
        clearInterval(timer);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        const hStr = hours.toString().padStart(2, '0');
        const mStr = minutes.toString().padStart(2, '0');
        const sStr = seconds.toString().padStart(2, '0');
        
        setTimeLeft(`${hStr}h ${mStr}m ${sStr}s`);
        setIsTrialExpired(false);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [siteCreatedAt]);

  const [dbPricing, setDbPricing] = useState<any>(null);

  useEffect(() => {
    try {
      const cachedPricing = sessionStorage.getItem('cached_global_pricing');
      if (cachedPricing) {
        const parsed = JSON.parse(cachedPricing);
        if (parsed && Date.now() - parsed.ts < 30 * 60 * 1000) {
          setDbPricing(parsed.data);
          return;
        }
      }
    } catch {}

    getDoc(doc(db, 'global_settings', 'pricing')).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setDbPricing(data);
        try {
          sessionStorage.setItem('cached_global_pricing', JSON.stringify({ data, ts: Date.now() }));
        } catch {}
      }
    }).catch(err => {
      console.warn("Failed to load global pricing settings:", err);
    });
  }, []);

  const getProWebsitePrice = (dur: '1_month' | '3_months' | '6_months' | '1_year', mode: 'bd' | 'intl') => {
    if (mode === 'bd') {
      return dbPricing?.pro_websites?.bd?.[dur] ?? dbPricing?.landing_pages?.bd?.[dur] ?? (dur === '1_month' ? 999 : dur === '3_months' ? 2699 : dur === '6_months' ? 4999 : 8999);
    } else {
      return dbPricing?.pro_websites?.intl?.[dur] ?? dbPricing?.landing_pages?.intl?.[dur] ?? (dur === '1_month' ? 9.00 : dur === '3_months' ? 24.00 : dur === '6_months' ? 45.00 : 80.00);
    }
  };

  // Load bKash settings from global_settings with session cache
  useEffect(() => {
    try {
      const cachedBkash = sessionStorage.getItem('cached_global_bkash');
      if (cachedBkash) {
        const parsed = JSON.parse(cachedBkash);
        if (parsed && Date.now() - parsed.ts < 30 * 60 * 1000) {
          if (parsed.manualNumber) setBkashNumber(parsed.manualNumber);
          return;
        }
      }
    } catch {}

    getDoc(doc(db, 'global_settings', 'bkash')).then((snap) => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.manualNumber) {
          setBkashNumber(d.manualNumber);
          try {
            sessionStorage.setItem('cached_global_bkash', JSON.stringify({ manualNumber: d.manualNumber, ts: Date.now() }));
          } catch {}
        }
      }
    });
  }, []);

  // Sync billing mode default when defaultCountry changes
  useEffect(() => {
    if (defaultCountry === 'Bangladesh') {
      setBillingCountryMode('bd');
    } else {
      setBillingCountryMode('intl');
    }
  }, [defaultCountry]);
  
  // 4 Covers
  const [covers, setCovers] = useState<string[]>(['', '', '', '']);
  const [uploadingCoverIndex, setUploadingCoverIndex] = useState<number | null>(null);

  // Dynamic products / settings
  const [existingCatalog, setExistingCatalog] = useState<any[]>([]);
  const [featureTitle, setFeatureTitle] = useState('');
  const [shortDetails, setShortDetails] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [comparePrice, setComparePrice] = useState<number>(0);
  const [featuredImage, setFeaturedImage] = useState('');
  const [isUploadingFeatured, setIsUploadingFeatured] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [productColors, setProductColors] = useState<string[]>([]);
  const [newColor, setNewColor] = useState('');

  // Pixel and GTM
  const [facebookPixel, setFacebookPixel] = useState('');
  const [tiktokPixel, setTiktokPixel] = useState('');
  const [gtm, setGtm] = useState('');
  const [clarity, setClarity] = useState('');

  // Contact dropdowns / footers
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [aboutText, setAboutText] = useState('');

  // Customer Support options (3 options)
  const [support1Title, setSupport1Title] = useState('Help & Support Center');
  const [support1Content, setSupport1Content] = useState('Our 24/7 customer support team is at your service. For any questions or complaints, contact us on our hotline number or directly in chat.');
  const [support2Title, setSupport2Title] = useState('Return & Refund Policy');
  const [support2Content, setSupport2Content] = useState('If any defect is found after receiving the product, let us know quickly. There is a facility to return or change the product within 7 days. You will find complete refund guidelines here.');
  const [support3Title, setSupport3Title] = useState('Order Tracking Guide');
  const [support3Content, setSupport3Content] = useState('To know the current status of your order, visit our tracking page and use your Order ID. You will find any delivery-related queries on this page.');

  // Company Help options (3 options)
  const [help1Title, setHelp1Title] = useState('Terms of Use');
  const [help1Content, setHelp1Content] = useState('Before ordering products using our platform or website, please read our general terms and conditions carefully.');
  const [help2Title, setHelp2Title] = useState('Privacy Policy');
  const [help2Content, setHelp2Content] = useState('We value your privacy highest. Your personal information and contact details are kept fully secure and encrypted.');
  const [help3Title, setHelp3Title] = useState('Order Protection Policy');
  const [help3Content, setHelp3Content] = useState('To guarantee 100% uninterrupted shopping for customers, we have double-secured Cash on Delivery and 100% genuine quality warranty.');

  // Social Inputs
  const [fbPage, setFbPage] = useState('');
  const [tiktokPage, setTiktokPage] = useState('');
  const [youtubeChannel, setYoutubeChannel] = useState('');

  // Theme customizer
  const [themeColor, setThemeColor] = useState('#6366f1'); // Indigo default
  const [titleColor, setTitleColor] = useState('#ffffff');
  const [storeNameColor, setStoreNameColor] = useState('#ffffff');
  const [descriptionColor, setDescriptionColor] = useState('#d1d5db');
  const [priceColor, setPriceColor] = useState('#6366f1');
  const [discountColor, setDiscountColor] = useState('#ef4444');
  const [buttonColor, setButtonColor] = useState('#6366f1');
  const [buttonTextColor, setButtonTextColor] = useState('#ffffff');
  const [headerBg, setHeaderBg] = useState<'black' | 'white'>('black');
  const [bodyBg, setBodyBg] = useState<'black' | 'white'>('black');
  const [footerBg, setFooterBg] = useState<'black' | 'white'>('black');

  // Delivery Charges configuration
  const [deliveryChargeInside, setDeliveryChargeInside] = useState<number>(80);
  const [deliveryChargeOutside, setDeliveryChargeOutside] = useState<number>(130);
  const [deliveryLabelInside, setDeliveryLabelInside] = useState<string>('Dhaka inside');
  const [deliveryLabelOutside, setDeliveryLabelOutside] = useState<string>('Dhaka outside');
  const [deliveryQtyBasedEnabled, setDeliveryQtyBasedEnabled] = useState<boolean>(false);
  const [deliveryIncrementPerQty, setDeliveryIncrementPerQty] = useState<number>(20);
  const [requireLocationTracking, setRequireLocationTracking] = useState<boolean>(false);
  const [dragonBotEnabled, setDragonBotEnabled] = useState<boolean>(false);
  const [isStarEnabled, setIsStarEnabled] = useState<boolean>(true);
  const [customDeliveryCharges, setCustomDeliveryCharges] = useState<{ area: string; charge: number }[]>([]);
  const [newProAreaName, setNewProAreaName] = useState('');
  const [newProAreaCharge, setNewProAreaCharge] = useState('');

  // Categories configurations
  const [categories, setCategories] = useState<{ id: string; name: string; image?: string }[]>([{ id: 'all', name: 'All Products' }]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatImage, setNewCatImage] = useState<string>('');
  const [uploadingCatId, setUploadingCatId] = useState<string | null>(null);

  const handleAddCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    
    // Check duplication
    const slugified = trimmed.toLowerCase().replace(/[^a-zA-Z0-9\u0980-\u09FF-_]/g, '-');
    const exists = categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase() || c.id === slugified);
    if (exists) return;

    setCategories(prev => [...prev, { id: slugified || `cat-${Date.now()}`, name: trimmed, image: newCatImage || undefined }]);
    setNewCatName('');
    setNewCatImage('');
  };

  const handleCategoryImageUpload = async (catId: string, file: File) => {
    if (!file) return;
    setUploadingCatId(catId);
    try {
      const base64 = await compressImage(file, 300, 300, 0.6);
      if (catId === 'new') {
        setNewCatImage(base64);
      } else {
        setCategories(prev => prev.map(c => c.id === catId ? { ...c, image: base64 } : c));
      }
    } catch (err) {
      console.error('Error uploading category image:', err);
    } finally {
      setUploadingCatId(null);
    }
  };

  const handleRemoveCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  // --- DELEGATION & COLLABORATIVE ACCESS STATE ---
  const [delegations, setDelegations] = useState<any[]>([]);
  const [activeDelegateId, setActiveDelegateId] = useState<string>(() => {
    return localStorage.getItem('active_delegate_user_id') || '';
  });
  const [activeDelegate, setActiveDelegate] = useState<any>(null);

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

    const fetchSettings = async () => {
      setLoading(true);
      const effectiveUserId = activeDelegateId || user.uid;

      try {
        let userCountry = 'Bangladesh';
        if (effectiveUserId) {
          const cachedCountry = sessionStorage.getItem(`cached_user_country_${effectiveUserId}`);
          if (cachedCountry) {
            userCountry = cachedCountry;
          } else {
            const userDoc = await getDoc(doc(db, 'users', effectiveUserId));
            if (userDoc.exists()) {
              userCountry = userDoc.data().country || 'Bangladesh';
              try { sessionStorage.setItem(`cached_user_country_${effectiveUserId}`, userCountry); } catch {}
            }
          }
        }

        if (id === 'new') {
          resetToCleanDefaults();
          setDefaultCountry(userCountry);
          setLanguage('en');
          setLoading(false);
          return;
        }

        let data: ProWebsite | null = null;
        let foundId = '';

        if (id) {
          // fetch direct document by document ID
          const docRef = doc(db, 'pro_websites', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            data = docSnap.data() as ProWebsite;
            foundId = docSnap.id;
          } else {
            // fallback lookup by slug
            const qSlug = query(collection(db, 'pro_websites'), where('slug', '==', id));
            const slugSnap = await getDocs(qSlug);
            if (!slugSnap.empty) {
              data = slugSnap.docs[0].data() as ProWebsite;
              foundId = slugSnap.docs[0].id;
            }
          }
        } else {
          // Default backward-compatible fallback: find the user's first platform doc
          const q = query(collection(db, 'pro_websites'), where('userId', '==', effectiveUserId));
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            data = snapshot.docs[0].data() as ProWebsite;
            foundId = snapshot.docs[0].id;
          }
        }

        if (data) {
          setWebsiteId(foundId);
          setSlug(data.slug || '');
          setBrandName(data.brandName || '');
          setLogo(data.logo || '');
          setDefaultCountry(data.defaultCountry || userCountry);
          setSiteCreatedAt(data.createdAt || '');
          setPaymentStatus((data as any).paymentStatus || 'none');
          setPaymentPhone((data as any).paymentPhone || '');
          setPaymentTrxId((data as any).paymentTrxId || '');
          setPaymentSubmittedAt((data as any).paymentSubmittedAt || '');
          setLanguage((data as any).language || 'auto');
          setDeliveryChargeInside(typeof data.deliveryChargeInside !== 'undefined' ? Number(data.deliveryChargeInside) : 80);
          setDeliveryChargeOutside(typeof data.deliveryChargeOutside !== 'undefined' ? Number(data.deliveryChargeOutside) : 130);
          setDeliveryLabelInside(data.deliveryLabelInside || 'Dhaka inside');
          setDeliveryLabelOutside(data.deliveryLabelOutside || 'Dhaka outside');
          setDeliveryQtyBasedEnabled(!!data.deliveryQtyBasedEnabled);
          setDeliveryIncrementPerQty(typeof data.deliveryIncrementPerQty !== 'undefined' ? Number(data.deliveryIncrementPerQty) : 20);
          setRequireLocationTracking(!!data.requireLocationTracking);
          setDragonBotEnabled(!!data.dragonBotEnabled);
          setIsStarEnabled(typeof data.isStarEnabled !== 'undefined' ? !!data.isStarEnabled : true);
          setBotPaymentStatus((data as any).botPaymentStatus || 'none');
          setBotSelectedPlan((data as any).botSelectedPlan || '1_month');
          setBotPaymentPhone((data as any).botPaymentPhone || '');
          setBotPaymentTrxId((data as any).botPaymentTrxId || '');
          setBotPaymentSubmittedAt((data as any).botPaymentSubmittedAt || '');
          setBotExpiryTime((data as any).botExpiryTime || '');
          // Load custom area charges
          const savedCustomCharges = (data as any).customDeliveryCharges;
          setCustomDeliveryCharges(savedCustomCharges && Array.isArray(savedCustomCharges) ? savedCustomCharges : []);
          
          if (data.covers && Array.isArray(data.covers)) {
            const loadedCovers = ['','','',''];
            data.covers.forEach((c, i) => {
              if (i < 4) loadedCovers[i] = c.url || '';
            });
            setCovers(loadedCovers);
          } else {
            setCovers(['', '', '', '']);
          }

          setFeatureTitle(data.featureTitle || '');
          setDescription(data.description || '');
          setShortDetails(data.footer?.about || ''); // Using standard field for easy save/load
          
          if (data.catalog && data.catalog.length > 0) {
            setExistingCatalog(data.catalog.filter((p: any) => p.id !== 'featured_1'));
          } else {
            setExistingCatalog([]);
          }

          if (data.colors) {
            setThemeColor(data.colors.theme || '#6366f1');
            setTitleColor(data.colors.title || '#ffffff');
            setStoreNameColor(data.colors.storeNameColor || data.colors.title || '#ffffff');
            setDescriptionColor(data.colors.description || '#d1d5db');
            setPriceColor(data.colors.price || '#6366f1');
            setDiscountColor(data.colors.discount || '#ef4444');
            setButtonColor(data.colors.button || '#6366f1');
            setButtonTextColor(data.colors.buttonText || '#ffffff');
            setHeaderBg(data.colors.headerBg || 'black');
            setBodyBg(data.colors.bodyBg || 'black');
            setFooterBg(data.colors.footerBg || 'black');
          }

          if (data.tracking) {
            setFacebookPixel(data.tracking.facebook || '');
            setTiktokPixel(data.tracking.tiktok || '');
            setGtm(data.tracking.gtm || '');
            setClarity(data.tracking.clarity || '');
          }

          if (data.customDomain) {
            setDomainName(data.customDomain.domainName || '');
            setIsDomainPrimary(!!data.customDomain.isPrimary);
            setDnsType(data.customDomain.dnsType || 'A');
            setDnsValue(data.customDomain.dnsValue || '76.76.21.21');
            setSslStatus(data.customDomain.sslStatus || 'pending');
          } else {
            setDomainName('');
            setIsDomainPrimary(false);
            setDnsType('A');
            setDnsValue('76.76.21.21');
            setSslStatus('pending');
          }

          if (data.footer) {
            setWhatsapp(data.footer.whatsapp || '');
            setEmail(data.footer.email || '');
            setAboutText(data.footer.about || '');
            setSupport1Title(data.footer.support1Title || 'Help & Support Center');
            setSupport1Content(data.footer.support1Content || 'Our 24/7 customer support team is at your service. For any questions or complaints, contact us on our hotline number or directly in chat.');
            setSupport2Title(data.footer.support2Title || 'Return & Refund Policy');
            setSupport2Content(data.footer.support2Content || 'If any defect is found after receiving the product, let us know quickly. There is a facility to return or change the product within 7 days. You will find complete refund guidelines here.');
            setSupport3Title(data.footer.support3Title || 'Order Tracking Guide');
            setSupport3Content(data.footer.support3Content || 'To know the current status of your order, visit our tracking page and use your Order ID. You will find any delivery-related queries on this page.');
            setHelp1Title(data.footer.help1Title || 'Terms of Use');
            setHelp1Content(data.footer.help1Content || 'Before ordering products using our platform or website, please read our general terms and conditions carefully.');
            setHelp2Title(data.footer.help2Title || 'Privacy Policy');
            setHelp2Content(data.footer.help2Content || 'We value your privacy highest. Your personal information and contact details are kept fully secure and encrypted.');
            setHelp3Title(data.footer.help3Title || 'Order Protection Policy');
            setHelp3Content(data.footer.help3Content || 'To guarantee 100% uninterrupted shopping for customers, we have double-secured Cash on Delivery and 100% genuine quality warranty.');
          }

          if (data.social) {
            setFbPage(data.social.facebook || '');
            setTiktokPage(data.social.tiktok || '');
            setYoutubeChannel(data.social.youtube || '');
          }

          if (data.categories && Array.isArray(data.categories)) {
            setCategories(data.categories);
          } else {
            setCategories([{ id: 'all', name: 'All Products' }]);
          }
        } else {
          // Initialize defaults
          resetToCleanDefaults();
          setDefaultCountry(userCountry);
          setLanguage('en');
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
        setErrorMessage('Failed to load settings.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user, activeDelegateId, id]);

  const handleLogoUploadFile = async (file: File) => {
    setIsUploadingLogo(true);
    try {
      const base64 = await compressImage(file, 200, 200, 0.5);
      setLogo(base64);
    } catch (err) {
      console.error('Error compressing/uploading logo:', err);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const base64 = await compressImage(file, 200, 200, 0.5);
      setLogo(base64);
    }
  };

  const handleFeaturedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploadingFeatured(true);
      try {
        const base64 = await compressImage(file, 400, 400, 0.5);
        setFeaturedImage(base64);
      } catch (err) {
        console.error('Error compressing/uploading featured image:', err);
      } finally {
        setIsUploadingFeatured(false);
      }
    }
  };

  const handleCoverUpload = async (index: number, file: File) => {
    if (!file) return;
    setUploadingCoverIndex(index);
    try {
      const base64 = await compressImage(file, 800, 500, 0.5);
      setCovers(prev => {
        const next = [...prev];
        next[index] = base64;
        return next;
      });
    } catch (err) {
      console.error('Error compressing/uploading cover image:', err);
    } finally {
      setUploadingCoverIndex(null);
    }
  };

  const handleRemoveCover = (index: number) => {
    setCovers(prev => {
      const next = [...prev];
      next[index] = '';
      return next;
    });
  };

  const addColorTag = () => {
    if (newColor && !productColors.includes(newColor)) {
      setProductColors([...productColors, newColor]);
      setNewColor('');
    }
  };

  const removeColorTag = (color: string) => {
    setProductColors(productColors.filter(c => c !== color));
  };

  const checkSlugAvailability = async (testSlug: string) => {
    if (!testSlug) return false;
    const q = query(collection(db, 'pro_websites'), where('slug', '==', testSlug));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return true;
    if (websiteId && snapshot.docs[0].id === websiteId) return true;
    return false;
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setErrorMessage('');
    setSavedSuccess(false);

    try {
      const normalizedSlug = slug.toLowerCase().replace(/[^a-z0-h0-9-_]/g, '');
      if (!normalizedSlug) {
        throw new Error('Please enter a valid store link ID (Slug).');
      }

      const isAvailable = await checkSlugAvailability(normalizedSlug);
      if (!isAvailable) {
        throw new Error('This link ID (Slug) is already taken. Please try another one.');
      }

      // Security check: Verify that this domain is not already in use by another store
      if (domainName.trim()) {
        const cleanDomain = domainName.trim().toLowerCase();
        const domainRegex = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,15}$/;
        if (!domainRegex.test(cleanDomain)) {
          throw new Error('Please enter a valid domain name (e.g. mystore.com or shop.mystore.com)');
        }

        const qDomain = query(
          collection(db, 'pro_websites'),
          where('customDomain.domainName', '==', cleanDomain)
        );
        const querySnap = await getDocs(qDomain);
        const duplicate = querySnap.docs.find(d => d.id !== websiteId);
        if (duplicate) {
          throw new Error(`Security Alert: The domain "${cleanDomain}" is already connected to another Pro Website! To prevent domain theft attempts, this domain has been blocked. Please use your own domain.`);
        }
      }

      // Catalog with items added from the Showcase page. Exclude 'featured_1' since it is deprecated.
      const constructedCatalog = existingCatalog.filter(p => p.id !== 'featured_1');

      // Format covers list for storage
      const activeCovers = covers
        .filter(url => url !== '')
        .map(url => ({ url, link: '#catalog' }));

      const docData: Partial<ProWebsite> = {
        userId: activeDelegateId || user.uid,
        slug: normalizedSlug,
        brandName: brandName || 'My Store',
        logo: logo || '',
        deliveryChargeInside: Number(deliveryChargeInside) || 0,
        deliveryChargeOutside: Number(deliveryChargeOutside) || 0,
        deliveryLabelInside: deliveryLabelInside || 'Dhaka inside',
        deliveryLabelOutside: deliveryLabelOutside || 'Dhaka outside',
        deliveryQtyBasedEnabled: deliveryQtyBasedEnabled,
        deliveryIncrementPerQty: Number(deliveryIncrementPerQty) || 0,
        requireLocationTracking: requireLocationTracking,
        dragonBotEnabled: dragonBotEnabled,
        isStarEnabled: isStarEnabled,
        botPaymentStatus: botPaymentStatus || 'none',
        botSelectedPlan: botSelectedPlan || '1_month',
        botPaymentPhone: botPaymentPhone || '',
        botPaymentTrxId: botPaymentTrxId || '',
        botPaymentSubmittedAt: botPaymentSubmittedAt || '',
        botExpiryTime: botExpiryTime || '',
        customDeliveryCharges: customDeliveryCharges,
        covers: activeCovers,
        featureTitle: featureTitle || 'Exclusive Showcase',
        description: description || '',
        categories: categories,
        catalog: constructedCatalog,
        colors: {
          theme: themeColor,
          title: titleColor,
          storeNameColor: storeNameColor,
          description: descriptionColor,
          price: priceColor,
          discount: discountColor,
          button: buttonColor,
          buttonText: buttonTextColor,
          headerBg: headerBg,
          bodyBg: bodyBg,
          footerBg: footerBg
        },
        tracking: {
          facebook: facebookPixel,
          tiktok: tiktokPixel,
          gtm: gtm,
          clarity: clarity
        },
        footer: {
          whatsapp: whatsapp,
          email: email,
          about: aboutText || shortDetails || '',
          help: 'Track active order via system',
          service: 'Secure order validation',
          support1Title: support1Title,
          support1Content: support1Content,
          support2Title: support2Title,
          support2Content: support2Content,
          support3Title: support3Title,
          support3Content: support3Content,
          help1Title: help1Title,
          help1Content: help1Content,
          help2Title: help2Title,
          help2Content: help2Content,
          help3Title: help3Title,
          help3Content: help3Content,
        },
        social: {
          facebook: fbPage,
          tiktok: tiktokPage,
          youtube: youtubeChannel
        },
        isPublic: true,
        defaultCountry: defaultCountry || 'Bangladesh',
        language: language || 'auto',
        customDomain: domainName.trim() ? {
          domainName: domainName.trim().toLowerCase(),
          isPrimary: isDomainPrimary,
          dnsType: dnsType,
          dnsValue: dnsType === 'A' ? '76.76.21.21' : `${window.location.host}`,
          sslStatus: sslStatus,
          configuredAt: new Date().toISOString()
        } : null,
        createdAt: siteCreatedAt || new Date().toISOString(),
        paymentStatus: paymentStatus || 'none',
        paymentPhone: paymentPhone || '',
        paymentTrxId: paymentTrxId || '',
        paymentSubmittedAt: paymentSubmittedAt || '',
        updatedAt: new Date().toISOString()
      };

      const docRef = websiteId ? doc(db, 'pro_websites', websiteId) : doc(collection(db, 'pro_websites'));
      await setDoc(docRef, docData, { merge: true });

      if (!websiteId) {
        setWebsiteId(docRef.id);
      }
      if (!siteCreatedAt) {
        setSiteCreatedAt(docData.createdAt || '');
      }

      // Synchronize delivery charges of subareas to the user's isolated hidden knowledge file
      const targetUserId = activeDelegateId || user.uid;
      if (customDeliveryCharges && customDeliveryCharges.length > 0) {
        try {
          const hiddenRef = doc(db, 'hidden_merchant_files', targetUserId);
          const hiddenSnap = await getDoc(hiddenRef);
          let existingCharges: { area: string; charge: number }[] = [];
          if (hiddenSnap.exists()) {
            existingCharges = hiddenSnap.data().customDeliveryCharges || [];
          }

          const newCharges = [...customDeliveryCharges];
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
          console.warn("Failed to sync sub-area delivery charges from pro-website to hidden data store:", syncErr);
        }
      }
      
      const newlyCreated = !websiteId;
      if (newlyCreated) {
        setWebsiteId(docRef.id);
        navigate(`/pro-website-settings/${docRef.id}`, { replace: true });
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      triggerSuccess('Website Saved Successfully!', 'Your Pro Website settings have been saved and updated successfully.');
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setErrorMessage(err.message || 'Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBkashPaymentSubmit = async () => {
    if (!paymentPhone.trim() || !paymentTrxId.trim()) {
      triggerSuccess('Payment Details Required', 'Please provide your bKash phone number and Trx ID correctly.');
      return;
    }

    try {
      setIsSaving(true);
      const updatedStatus = 'pending';
      const submittedAt = new Date().toISOString();

      const docData = {
        paymentStatus: updatedStatus,
        paymentPhone: paymentPhone.trim(),
        paymentTrxId: paymentTrxId.trim().toUpperCase(),
        selectedPlan: selectedPlan,
        paymentSubmittedAt: submittedAt,
        updatedAt: submittedAt
      };

      const docRef = websiteId ? doc(db, 'pro_websites', websiteId) : doc(collection(db, 'pro_websites'));
      await setDoc(docRef, docData, { merge: true });

      setPaymentStatus(updatedStatus);
      setPaymentSubmittedAt(submittedAt);

      if (!websiteId) {
        setWebsiteId(docRef.id);
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      triggerSuccess('Payment Submitted!', 'bKash payment request submitted successfully! Admin will verify the transaction.');
    } catch (err: any) {
      console.error('Error submitting payment:', err);
      triggerSuccess('Submission Error', 'Failed to submit payment: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStripePaymentSuccess = async (plan: string) => {
    try {
      setIsSaving(true);
      const updatedStatus = 'approved';
      const submittedAt = new Date().toISOString();

      const docData = {
        paymentStatus: updatedStatus,
        selectedPlan: plan,
        paymentSubmittedAt: submittedAt,
        updatedAt: submittedAt
      };

      const docRef = websiteId ? doc(db, 'pro_websites', websiteId) : doc(collection(db, 'pro_websites'));
      await setDoc(docRef, docData, { merge: true });

      setPaymentStatus(updatedStatus);
      setPaymentSubmittedAt(submittedAt);

      if (!websiteId) {
        setWebsiteId(docRef.id);
      }

      triggerSuccess('Payment Successful!', 'Your Pro Subscription is now fully active.');
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error updating payment status:', err);
      triggerSuccess('Payment Status Error', 'Error updating payment status: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBotBkashPaymentSubmit = async () => {
    if (!botPaymentPhone.trim() || !botPaymentTrxId.trim()) {
      triggerSuccess('Payment Details Required', 'Please provide your bKash phone number and Trx ID correctly.');
      return;
    }

    try {
      setIsSaving(true);
      const updatedStatus = 'pending';
      const submittedAt = new Date().toISOString();

      const docData = {
        botPaymentStatus: updatedStatus,
        botPaymentPhone: botPaymentPhone.trim(),
        botPaymentTrxId: botPaymentTrxId.trim().toUpperCase(),
        botSelectedPlan: botSelectedPlan,
        botPaymentSubmittedAt: submittedAt,
        updatedAt: submittedAt
      };

      const docRef = websiteId ? doc(db, 'pro_websites', websiteId) : doc(collection(db, 'pro_websites'));
      await setDoc(docRef, docData, { merge: true });

      setBotPaymentStatus(updatedStatus);
      setBotPaymentSubmittedAt(submittedAt);

      if (!websiteId) {
        setWebsiteId(docRef.id);
      }

      triggerSuccess('bKash Payment Submitted!', 'bKash payment request submitted successfully! Admin will verify the transaction.');
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error submitting bot payment:', err);
      triggerSuccess('Payment Error', 'Failed to submit bot payment: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBotStripePaymentSuccess = async (plan: string) => {
    try {
      setIsSaving(true);
      const updatedStatus = 'approved';
      const submittedAt = new Date().toISOString();
      const expiry = new Date();
      if (plan === '3_months') {
        expiry.setMonth(expiry.getMonth() + 3);
      } else {
        expiry.setMonth(expiry.getMonth() + 1);
      }

      const docData = {
        botPaymentStatus: updatedStatus,
        botSelectedPlan: plan,
        botPaymentSubmittedAt: submittedAt,
        botExpiryTime: expiry.toISOString(),
        updatedAt: submittedAt
      };

      const docRef = websiteId ? doc(db, 'pro_websites', websiteId) : doc(collection(db, 'pro_websites'));
      await setDoc(docRef, docData, { merge: true });

      setBotPaymentStatus(updatedStatus);
      setBotPaymentSubmittedAt(submittedAt);
      setBotExpiryTime(expiry.toISOString());

      if (!websiteId) {
        setWebsiteId(docRef.id);
      }

      triggerSuccess('Payment Successful!', 'Stripe payment successful! Your Dragon Bot subscription is now fully active.');
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error updating bot payment status:', err);
      triggerSuccess('Payment Error', 'Error updating bot payment status: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const appUrl = `${window.location.protocol}//${window.location.host}/w/${slug}`;

  return (
    <div className="min-h-screen bg-dragon-black text-white relative">
      <SettingsHeaderNav
        slug={slug}
        appUrl={appUrl}
        isSaving={isSaving}
        onResetToDefaults={() => {
          if (window.confirm("Are you sure you want to reset? All your custom texts and cover photos will be reset.")) {
            resetToCleanDefaults();
            navigate('/pro-website-settings');
          }
        }}
        onSave={handleSave}
      />

      <div className="max-w-6xl mx-auto px-6 pt-28 pb-20 space-y-6">
        {/* Trial / Subscription Status Alert Banner & Delegation */}
        <TrialStatusBanner
          paymentStatus={paymentStatus}
          isTrialExpired={isTrialExpired}
          timeLeft={timeLeft}
          delegations={delegations}
          activeDelegateId={activeDelegateId}
          activeDelegate={activeDelegate}
          onDelegateChange={(val) => {
            setActiveDelegateId(val);
            if (val) {
              localStorage.setItem('active_delegate_user_id', val);
              setActiveDelegate(delegations.find(d => d.grantorId === val) || null);
            } else {
              localStorage.removeItem('active_delegate_user_id');
              setActiveDelegate(null);
            }
          }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Tabs Column */}
          <SettingsSidebarNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            savedSuccess={savedSuccess}
            errorMessage={errorMessage}
          />

        {/* Right Settings Form Content */}
        <div className="lg:col-span-3 bg-white/5 border border-white/5 rounded-[2rem] p-8 space-y-8">
          {activeTab === "general" && (
            <GeneralSettingsTab
              slug={slug}
              setSlug={setSlug}
              brandName={brandName}
              setBrandName={setBrandName}
              logo={logo}
              setLogo={setLogo}
              isUploadingLogo={isUploadingLogo}
              onLogoUpload={handleLogoUploadFile}
              defaultCountry={defaultCountry}
              setDefaultCountry={setDefaultCountry}
              selectedLanguage={language}
              setSelectedLanguage={setLanguage}
              deliveryChargeInside={deliveryChargeInside}
              setDeliveryChargeInside={setDeliveryChargeInside}
              deliveryChargeOutside={deliveryChargeOutside}
              setDeliveryChargeOutside={setDeliveryChargeOutside}
              deliveryLabelInside={deliveryLabelInside}
              setDeliveryLabelInside={setDeliveryLabelInside}
              deliveryLabelOutside={deliveryLabelOutside}
              setDeliveryLabelOutside={setDeliveryLabelOutside}
              customDeliveryCharges={customDeliveryCharges}
              setCustomDeliveryCharges={setCustomDeliveryCharges}
              newProAreaName={newProAreaName}
              setNewProAreaName={setNewProAreaName}
              newProAreaCharge={newProAreaCharge}
              setNewProAreaCharge={setNewProAreaCharge}
              deliveryQtyBasedEnabled={deliveryQtyBasedEnabled}
              setDeliveryQtyBasedEnabled={setDeliveryQtyBasedEnabled}
              deliveryIncrementPerQty={deliveryIncrementPerQty}
              setDeliveryIncrementPerQty={setDeliveryIncrementPerQty}
              requireLocationTracking={requireLocationTracking}
              setRequireLocationTracking={setRequireLocationTracking}
              isStarEnabled={isStarEnabled}
              setIsStarEnabled={setIsStarEnabled}
              dragonBotEnabled={dragonBotEnabled}
              setDragonBotEnabled={setDragonBotEnabled}
              categories={categories}
              newCatName={newCatName}
              setNewCatName={setNewCatName}
              newCatImage={newCatImage}
              setNewCatImage={setNewCatImage}
              uploadingCatId={uploadingCatId}
              onAddCategory={handleAddCategory}
              onCategoryImageUpload={handleCategoryImageUpload}
              onRemoveCategory={handleRemoveCategory}
            />
          )}

          {activeTab === "covers" && (
            <CoversSettingsTab
              covers={covers}
              uploadingCoverIndex={uploadingCoverIndex}
              onCoverUpload={handleCoverUpload}
              onRemoveCover={handleRemoveCover}
            />
          )}

          {activeTab === "design" && (
            <DesignSettingsTab
              themeColor={themeColor}
              setThemeColor={setThemeColor}
              titleColor={titleColor}
              setTitleColor={setTitleColor}
              storeNameColor={storeNameColor}
              setStoreNameColor={setStoreNameColor}
              descriptionColor={descriptionColor}
              setDescriptionColor={setDescriptionColor}
              priceColor={priceColor}
              setPriceColor={setPriceColor}
              discountColor={discountColor}
              setDiscountColor={setDiscountColor}
              buttonColor={buttonColor}
              setButtonColor={setButtonColor}
              buttonTextColor={buttonTextColor}
              setButtonTextColor={setButtonTextColor}
              headerBg={headerBg}
              setHeaderBg={setHeaderBg}
              bodyBg={bodyBg}
              setBodyBg={setBodyBg}
              footerBg={footerBg}
              setFooterBg={setFooterBg}
            />
          )}

          {activeTab === "social" && (
            <SocialSettingsTab
              fbPage={fbPage}
              setFbPage={setFbPage}
              tiktokPage={tiktokPage}
              setTiktokPage={setTiktokPage}
              youtubeChannel={youtubeChannel}
              setYoutubeChannel={setYoutubeChannel}
              whatsapp={whatsapp}
              setWhatsapp={setWhatsapp}
              email={email}
              setEmail={setEmail}
              aboutText={aboutText}
              setAboutText={setAboutText}
            />
          )}

          {activeTab === "policies" && (
            <PoliciesSettingsTab
              support1Title={support1Title}
              setSupport1Title={setSupport1Title}
              support1Content={support1Content}
              setSupport1Content={setSupport1Content}
              support2Title={support2Title}
              setSupport2Title={setSupport2Title}
              support2Content={support2Content}
              setSupport2Content={setSupport2Content}
              support3Title={support3Title}
              setSupport3Title={setSupport3Title}
              support3Content={support3Content}
              setSupport3Content={setSupport3Content}
              help1Title={help1Title}
              setHelp1Title={setHelp1Title}
              help1Content={help1Content}
              setHelp1Content={setHelp1Content}
              help2Title={help2Title}
              setHelp2Title={setHelp2Title}
              help2Content={help2Content}
              setHelp2Content={setHelp2Content}
              help3Title={help3Title}
              setHelp3Title={setHelp3Title}
              help3Content={help3Content}
              setHelp3Content={setHelp3Content}
            />
          )}

          {activeTab === "tracking" && (
            <TrackingSettingsTab
              facebookPixel={facebookPixel}
              setFacebookPixel={setFacebookPixel}
              tiktokPixel={tiktokPixel}
              setTiktokPixel={setTiktokPixel}
              gtm={gtm}
              setGtm={setGtm}
              clarity={clarity}
              setClarity={setClarity}
            />
          )}

          {activeTab === "domain" && (
            <DomainSettingsTab
              domainName={domainName}
              setDomainName={setDomainName}
              dnsType={dnsType}
              setDnsType={setDnsType}
              isDomainPrimary={isDomainPrimary}
              setIsDomainPrimary={setIsDomainPrimary}
              appUrl={appUrl}
            />
          )}

        </div>
      </div>
      </div>

      {/* Real bKash Payment Gateway Modal */}
      <RealPaymentGatewayModal
        isOpen={showBkashGatewayModal}
        gatewayType="bkash"
        merchantName="Dragon Systems Ltd."
        orderRef={bkashGatewayContext === 'bot' ? 'DRG-BOT-ACTIVATE' : 'DRG-PRO-ACTIVATE'}
        amount={
          bkashGatewayContext === 'bot'
            ? (botSelectedPlan === '1_month' ? 1200 : 3200)
            : getProWebsitePrice(selectedPlan, 'bd')
        }
        currency="BDT"
        itemTitle={bkashGatewayContext === 'bot' ? 'DOEL Messenger Chatbot Subscription' : `Pro Website Plan (${selectedPlan})`}
        onClose={() => setShowBkashGatewayModal(false)}
        onSuccess={async () => {
          try {
            if (bkashGatewayContext === 'bot') {
              const days = botSelectedPlan === '1_month' ? 30 : 90;
              const expiry = new Date();
              expiry.setDate(expiry.getDate() + days);

              const docData = {
                botPaymentStatus: 'approved',
                botSelectedPlan: botSelectedPlan,
                botExpiryTime: expiry.toISOString(),
                updatedAt: new Date().toISOString()
              };

              const docRef = websiteId ? doc(db, 'pro_websites', websiteId) : doc(collection(db, 'pro_websites'));
              await setDoc(docRef, docData, { merge: true });

              setBotPaymentStatus('approved');
              setBotExpiryTime(expiry.toISOString());
              if (!websiteId) setWebsiteId(docRef.id);

              triggerSuccess('Payment Completed!', 'bKash payment completed successfully! Your DOEL Messenger Chatbot subscription is active instantly.');
              setShowBkashGatewayModal(false);
            } else {
              const days = selectedPlan === '1_month' ? 30 : selectedPlan === '3_months' ? 90 : selectedPlan === '6_months' ? 180 : 365;
              const activeUntil = new Date();
              activeUntil.setDate(activeUntil.getDate() + days);

              const docData = {
                paymentStatus: 'approved',
                selectedPlan: selectedPlan,
                activeUntil: activeUntil.toISOString(),
                paymentApprovedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };

              const docRef = websiteId ? doc(db, 'pro_websites', websiteId) : doc(collection(db, 'pro_websites'));
              await setDoc(docRef, docData, { merge: true });

              setPaymentStatus('approved');
              if (!websiteId) setWebsiteId(docRef.id);

              triggerSuccess('Payment Completed!', 'bKash payment completed successfully! Your Pro Website is now active instantly.');
              setShowBkashGatewayModal(false);
            }
          } catch (err: any) {
            console.error('Error in bKash gateway success callback:', err);
            triggerSuccess('Payment Activation Error', 'Failed to process payment activation: ' + err.message);
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
    </div>
  );
}
