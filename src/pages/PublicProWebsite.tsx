import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DoelBirdLogo } from '../components/DoelBirdLogo';
import {
  ShoppingBag,
  MapPin,
  Phone,
  User,
  MessageCircle,
  Loader2,
  X,
  Plus,
  Minus,
  Search,
  ShoppingCart,
  Menu,
  ChevronDown,
  ShieldCheck,
  Star,
  Facebook,
  Youtube,
  Settings,
  ArrowRight,
  Sparkles,
  Award,
  BookOpen,
  MoreVertical,
  Heart,
  Info,
  Calendar,
  CheckCircle,
  Truck,
  Globe,
  ExternalLink
} from 'lucide-react';
import {
  collection,
  query,
  where,
  limit,
  getDocs,
  getDoc,
  addDoc,
  onSnapshot,
  doc,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { cn } from '../lib/utils';
import { ProWebsite } from '../types';
import { ProductReviewsSection } from '../components/ProductReviewsSection';
import { COUNTRIES, getCurrencySymbol, getCheckoutFormFields, getAggregatedAddress } from '../utils/countriesData';
import { checkCopyLinkTracking, checkBlacklistStatus, trackBlockedAttempt, getOrInitDeviceToken, recordOrderSuccess, checkOrderRateLimit } from '../lib/fraud';
import DragonBotMessenger from '../components/DragonBotMessenger';
import { syncOrderToSiteChat } from '../utils/chatSync';
import { translate } from '../utils/translations';
import { incrementPageViewRTDB } from '../services/rtdbEphemeralService';
import { initTrackingScripts, trackPageView, trackViewContent, trackAddToCart, trackInitiateCheckout, trackPurchase } from '../lib/tracking';

interface ProductCardProps {
  product: any;
  cart: any;
  addToCart: any;
  handleOpenProductPopup: any;
  currencySymbol?: string;
  language?: string;
  country?: string;
  isStarEnabled?: boolean;
  key?: any;
}

function ProductCard({ product, cart, addToCart, handleOpenProductPopup, currencySymbol, language, country, isStarEnabled }: ProductCardProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const images = product.images && Array.isArray(product.images) && product.images.filter(Boolean).length > 0
    ? product.images.filter(Boolean)
    : [product.image];

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIdx(prev => (prev + 1) % images.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIdx(prev => (prev - 1 + images.length) % images.length);
  };

  return (
    <motion.div
      layout
      onClick={() => handleOpenProductPopup(product)}
      className="group space-y-4 bg-white/2 border border-white/5 p-3 sm:p-5 rounded-2xl sm:rounded-[2.5rem] transition-all duration-500 hover:bg-white/5 hover:border-white/15 hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)] cursor-pointer relative font-sans hover:-translate-y-1.5 pro-product-card"
    >
      <div className="relative aspect-[4/5] rounded-xl sm:rounded-[2rem] overflow-hidden bg-white/2 border border-white/5 shadow-2xl transition-all duration-500 pro-product-card-img">
        <img
          src={images[activeIdx]}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {images.length > 1 && (
          <>
            {/* Navigation Chevron Left */}
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/60 border border-white/10 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-black/80 hover:scale-110 active:scale-95 cursor-pointer z-10"
              title={translate("prev_img", language, country)}
              type="button"
            >
              <span className="text-xs">‹</span>
            </button>
            {/* Navigation Chevron Right */}
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/60 border border-white/10 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-black/80 hover:scale-110 active:scale-95 cursor-pointer z-10"
              title={translate("next_img", language, country)}
              type="button"
            >
              <span className="text-xs">›</span>
            </button>

            {/* Slide Index Dots */}
            <div className="absolute bottom-2.5 inset-x-0 flex justify-center gap-1.5 z-10">
              {images.map((_img: string, idx: number) => (
                <div
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIdx(idx);
                  }}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all duration-300",
                    activeIdx === idx ? "theme-accent-bg w-3" : "bg-white/40 hover:bg-white/70"
                  )}
                />
              ))}
            </div>
          </>
        )}

        {/* Quality Rating badge */}
        {isStarEnabled !== false && (
          <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md px-2 py-1 rounded-xl flex items-center gap-1 text-amber-400 text-[10px] sm:text-xs font-black border border-white/5 shadow-xl z-10">
            <Star size={11} fill="currentColor" className="text-amber-400 shrink-0" />
            4.9
          </div>
        )}

        {/* Verified Genuine Badge */}
        <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md px-2 py-1 rounded-xl flex items-center gap-1 text-emerald-400 text-[9px] sm:text-[10px] font-black border border-white/5 shadow-xl z-10 uppercase tracking-wider">
          <ShieldCheck size={11} className="text-emerald-400 shrink-0" />
          Genuine
        </div>

        {product.comparePrice && product.comparePrice > product.price && (
          <div className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-rose-500 text-white px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest shadow-lg z-10">
            Super Offer
          </div>
        )}

        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="px-3 py-1.5 sm:px-5 sm:py-2.5 bg-white text-black hover:bg-theme-accent-bg rounded-full font-black text-[8px] sm:text-[10px] uppercase tracking-widest shadow-2xl theme-accent-bg-hover">
            {translate("view_details", language, country)}
          </span>
        </div>
      </div>

      <div className="space-y-2.5 px-1 sm:px-2 text-left">
        <h3 className="text-xs sm:text-lg font-black tracking-tight text-white line-clamp-2 group-hover:text-amber-400 transition-colors duration-300">{product.name}</h3>
        
        {/* Extra trust meta lines for premium e-commerce look */}
        <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-400 font-semibold font-sans">
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle size={12} className="shrink-0" /> Secure Order
          </span>
          <span>•</span>
          <span>Fast Shipping</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="text-sm sm:text-xl font-black theme-price text-white font-sans">
            {currencySymbol || '৳'}{product.price}
          </span>
          {product.comparePrice && product.comparePrice > product.price && (
            <>
              <span className="text-rose-500 line-through text-[10px] sm:text-sm font-bold font-sans">
                {currencySymbol || '৳'}{product.comparePrice}
              </span>
              {product.discount && product.discount > 0 ? (
                <span className="text-emerald-400 text-[9px] sm:text-xs font-black bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  {Math.round(product.discount)}% {translate("discount_tag_text", language, country)}
                </span>
              ) : null}
            </>
          )}
        </div>

        {/* Action buttons inside product card container */}
        <div className="flex flex-col gap-1.5 pt-1.5 font-sans">
          <button
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product);
            }}
            className="w-full py-2.5 rounded-lg sm:rounded-xl text-[9px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 hover:scale-[1.02] pro-btn-cart shadow-sm"
            title="Add to shopping cart"
          >
            <ShoppingCart size={13} className="shrink-0" fill={cart.some(item => item.product.id === product.id) ? "currentColor" : "none"} />
            {translate("add_to_cart", language, country)}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenProductPopup(product);
            }}
            className="w-full py-2.5 rounded-lg sm:rounded-xl text-[9px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 theme-btn pro-btn-order hover:scale-[1.02] shadow-md"
            title={translate("order_now", language, country)}
          >
            <ShoppingBag size={13} className="shrink-0" />
            {translate("order_now", language, country)}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

const getYoutubeEmbedUrl = (url: string) => {
  if (!url) return '';
  url = url.trim();
  let videoId = '';
  try {
    if (url.includes('youtube.com/watch')) {
      const urlObj = new URL(url);
      videoId = urlObj.searchParams.get('v') || '';
    } else if (url.includes('youtube.com/shorts/')) {
      const parts = url.split('/shorts/');
      if (parts[1]) {
        videoId = parts[1].split('?')[0].split('/')[0];
      }
    } else if (url.includes('youtu.be/')) {
      const parts = url.split('youtu.be/');
      if (parts[1]) {
        videoId = parts[1].split('?')[0].split('/')[0];
      }
    } else if (url.includes('youtube.com/embed/')) {
      const parts = url.split('/embed/');
      if (parts[1]) {
        videoId = parts[1].split('?')[0].split('/')[0];
      }
    }
  } catch (e) {
    console.error("Error parsing YouTube URL:", e);
  }

  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&rel=0`;
  }
  return '';
};

const DEFAULT_FOOTER_VALUES: { [key: string]: string[] } = {
  support1Title: ['হেল্প ও সাপোর্ট সেন্টার', 'হেল্প ও সাপোর্ট'],
  support1Content: [
    'আমাদের ২৪/৭ কাস্টমার সাপোর্ট টিম আপনার সেবায় নিয়োজিত। যেকোনো প্রশ্ন বা অভিযোগের জন্য আমাদের হটলাইন নম্বরে অথবা সরাসরি চ্যাটে যোগাযোগ করুন।'
  ],
  support2Title: ['রিটার্ন ও রিফান্ড পলিসি', 'রিটার্ন ও রিফান্ড'],
  support2Content: [
    'পণ্য পাওয়ার পর কোনো ত্রুটি থাকলে আমাদের দ্রুত জানান। ৭ দিনের মধ্যে রিটার্ন বা রিপ্লেসমেন্ট সুবিধা রয়েছে। সম্পূর্ণ রিফান্ড নীতিমালা এখানে পাবেন।',
    'পণ্য হাতে পাওয়ার পর কোনো ত্রুটি দেখা দিলে আমাদের দ্রুত জানান। ৭ দিনের মধ্যে পণ্য ফেরত বা পরিবর্তনের সুবিধা রয়েছে। রিফান্ড সংক্রান্ত সম্পূর্ণ গাইডলাইন এখানে পাবেন।'
  ],
  support3Title: ['অর্ডার ট্র্যাকিং গাইড', 'অর্ডার ট্র্যাকিং'],
  support3Content: [
    'আপনার অর্ডারের বর্তমান অবস্থা জানতে আমাদের ট্র্যাকিং পেজে যান এবং আপনার অর্ডার আইডি ব্যবহার করুন। ডেলিভারী সংক্রান্ত যেকোনো তথ্যের জন্য এই পেজটি ভিজিট করুন।',
    'আপনার অর্ডারের বর্তমান স্ট্যাটাস জানতে আমাদের ট্র্যাকিং পেজ ভিজিট করুন এবং আপনার অর্ডার আইডি ব্যবহার করুন। ডেলিভারি সংক্রান্ত যেকোনো জিজ্ঞাসা এই পেজে পাবেন।'
  ],
  help1Title: ['ব্যবহারের শর্তাবলী', 'শর্তাবলী'],
  help1Content: [
    'আমাদের প্ল্যাটফর্ম বা ওয়েবসাইট ব্যবহার করে পণ্য অর্ডার করার পূর্বে অনুগ্রহ করে আমাদের সাধারণ ব্যবহারের শর্তাবলী মনোযোগ সহকারে পড়ে নিন।',
    'আমাদের প্ল্যাটফর্ম বা ওয়েবসাইট ব্যবহার করে পণ্য অর্ডার করার পূর্বে দয়া করে আমাদের সাধারণ ব্যবহারের নিয়ম ও শর্তাবলী ভালোভাবে পড়ে নিন।'
  ],
  help2Title: ['গোপনীয়তা নীতি', 'গোপনীয়তা নীতি', 'গোপনীয়তা'],
  help2Content: [
    'আমরা আপনার ব্যক্তিগত তথ্যের গোপনীয়তা রক্ষা করতে প্রতিশ্রুতিবদ্ধ। আমাদের সংগৃহীত তথ্য কীভাবে ব্যবহৃত এবং সুরক্ষিত করা হয় তা এখানে জানুন।',
    'আমরা আপনার গোপনীয়তাকে সর্বোচ্চ মূল্যায়ন করি। আপনার ব্যক্তিগত তথ্য এবং যোগাযোগের তথ্য সম্পূর্ণ নিরাপদ এবং এনক্রিপ্ট রাখা হয়।'
  ],
  help3Title: ['অর্ডার সুরক্ষা নীতি', 'অর্ডার সুরক্ষা'],
  help3Content: [
    'প্রতিটি অর্ডার শতভাগ নিরাপদ এবং সুরক্ষিত। আমরা ক্রেতাদের নিরাপত্তা নিশ্চিত করতে সকল প্রয়োজনীয় পদক্ষেপ গ্রহণ করি।',
    'গ্রাহকদের শতভাগ নিরবচ্ছিন্ন কেনাকাটার নিশ্চয়তা দিতে আমাদের কাছে রয়েছে ডবল-সিকিউরড ক্যাশ অন ডেলিভারি এবং গুণগত মানের শতভাগ জেনিউন ওয়্যারেন্টি।'
  ],
  about: [
    'আমরা প্রতিটি পণ্যের গুণগত মান এবং সঠিক ডেলিভারী নিশ্চিত করি। আমাদের কাস্টমারদের সর্বোচ্চ সন্তুষ্টি আমাদের মূল লক্ষ্য।'
  ]
};

const resolveFooterText = (dbValue: string | undefined | null, key: string, language: string, country: string): string => {
  if (!dbValue || dbValue.trim() === '') {
    return translate(key, language, country);
  }
  const defaults = DEFAULT_FOOTER_VALUES[key] || [];
  const trimmed = dbValue.trim();
  const isDefault = defaults.some(d => d.trim() === trimmed);
  if (isDefault) {
    return translate(key, language, country);
  }
  return dbValue;
};

export default function PublicProWebsite({ customSlug }: { customSlug?: string }) {
  const { slug: urlSlug } = useParams();
  const slug = customSlug || urlSlug;
  const navigate = useNavigate();
  const [site, setSite] = useState<ProWebsite | null>(() => {
    if (slug) {
      try {
        const cached = localStorage.getItem(`cached_pro_site_${slug}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === 'object' && 'data' in parsed) {
            return parsed.data as ProWebsite;
          }
          return parsed as ProWebsite;
        }
      } catch (err) {
        console.error('Error reading pro website cache:', err);
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(() => {
    if (slug) {
      try {
        const cached = localStorage.getItem(`cached_pro_site_${slug}`);
        if (cached) {
          return false; // Zero loading screen active!
        }
      } catch (err) {}
    }
    return true;
  });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState<{ product: any, quantity: number, selectedVariants?: any[] }[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [orderStatus, setOrderStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [checkoutData, setCheckoutData] = useState({
    name: '',
    phone: '',
    address: '',
    selectedColor: '',
    country: site?.defaultCountry || 'Bangladesh',
    location: 'dhaka_inside',
    email: '',
    postalCode: '',
    nationalId: '',
    landmark: '',
    state: '',
    city: ''
  });
  const [currentCoverIndex, setCurrentCoverIndex] = useState(0);
  const [showContactDropdown, setShowContactDropdown] = useState(false);

  // New States requested by user
  const [selectedPolicyPage, setSelectedPolicyPage] = useState<{title: string, content: string} | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showThreeDotMenu, setShowThreeDotMenu] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<any | null>(null);
  const [popupActiveTab, setPopupActiveTab] = useState<'details' | 'reviews'>('details');
  const [inventoryItems, setInventoryItems] = useState<any[]>(() => {
    if (site?.userId) {
      try {
        const cached = localStorage.getItem(`cached_pro_site_inventory_${site.userId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === 'object' && 'data' in parsed) {
            return parsed.data;
          }
          return parsed;
        }
      } catch (err) {}
    }
    return [];
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page to 1 when changing categories or searching
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  const modalScrollRef = useRef<HTMLDivElement>(null);
  const catalogScrollRef = useRef<HTMLDivElement>(null);

  const getFieldLabel = (field: any) => {
    if (site?.language === 'en') return field.labelEn;
    if (site?.language === 'bn') return field.labelBn;
    return `${field.labelBn} / ${field.labelEn}`;
  };

  const getFieldPlaceholder = (field: any) => {
    if (site?.language === 'en') return field.placeholderEn;
    if (site?.language === 'bn') return field.placeholderBn;
    return field.placeholderBn || field.placeholderEn;
  };

  const [cachedLocation, setCachedLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      if (navigator.permissions) {
        navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((result) => {
          if (result.state === 'granted') {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                setCachedLocation({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude
                });
              },
              undefined,
              { enableHighAccuracy: true, timeout: 5000, maximumAge: 600000 }
            );
          }
        }).catch(() => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setCachedLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              });
            },
            () => {},
            { enableHighAccuracy: true, timeout: 3000, maximumAge: 600000 }
          );
        });
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setCachedLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          },
          () => {},
          { enableHighAccuracy: true, timeout: 3000, maximumAge: 600000 }
        );
      }
    }
  }, []);

  // Custom Product Popup Selection States
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedWeight, setSelectedWeight] = useState('');
  const [popupQuantity, setPopupQuantity] = useState(1);
  const [selectedItemsVariants, setSelectedItemsVariants] = useState<{ color: string; size: string; weight: string }[]>([]);
  const [popupCheckoutData, setPopupCheckoutData] = useState({
    name: '',
    phone: '',
    address: '',
    country: site?.defaultCountry || 'Bangladesh',
    location: 'dhaka_inside',
    email: '',
    postalCode: '',
    nationalId: '',
    landmark: '',
    state: '',
    city: ''
  });
  const [popupOrderStatus, setPopupOrderStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [lastPlacedOrderId, setLastPlacedOrderId] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const [popupActiveImage, setPopupActiveImage] = useState<string>('');
  const [showPopupVideoPlayer, setShowPopupVideoPlayer] = useState(false);

  // Dynamic color, size, and weight lists for selected product - fall back to empty list so we only show what's defined in inventory
  const colorsList = useMemo(() => {
    if (viewingProduct?.color) {
      const parsed = viewingProduct.color.split(',').map((s: string) => s.trim()).filter(Boolean);
      if (parsed.length > 0) return parsed;
    }
    return [];
  }, [viewingProduct?.color]);

  const sizesList = useMemo(() => {
    if (viewingProduct?.size) {
      const parsed = viewingProduct.size.split(',').map((s: string) => s.trim()).filter(Boolean);
      if (parsed.length > 0) return parsed;
    }
    return [];
  }, [viewingProduct?.size]);

  const weightsList = useMemo(() => {
    if (viewingProduct?.weight) {
      const parsed = viewingProduct.weight.split(',').map((s: string) => s.trim()).filter(Boolean);
      if (parsed.length > 0) return parsed;
    }
    return [];
  }, [viewingProduct?.weight]);

  // Synchronize dynamic lists selection on selected product change
  useEffect(() => {
    if (viewingProduct) {
      const initialColor = colorsList[0] || '';
      const initialSize = sizesList[0] || '';
      const initialWeight = weightsList[0] || '';

      setSelectedColor(initialColor);
      setSelectedSize(initialSize);
      setSelectedWeight(initialWeight);

      // Reset list of items variants to exactly match popupQuantity with configured values
      setSelectedItemsVariants(Array.from({ length: popupQuantity }, () => ({
        color: initialColor,
        size: initialSize,
        weight: initialWeight
      })));
    }
  }, [viewingProduct]);

  // Synchronize dynamic items length with popupQuantity
  useEffect(() => {
    if (viewingProduct) {
      setSelectedItemsVariants(prev => {
        const currentLength = prev.length;
        if (currentLength === popupQuantity) return prev;

        const initialColor = colorsList[0] || '';
        const initialSize = sizesList[0] || '';
        const initialWeight = weightsList[0] || '';

        let newVariants = [...prev];
        if (popupQuantity > currentLength) {
          const lastItem = prev[currentLength - 1] || { color: initialColor, size: initialSize, weight: initialWeight };
          for (let i = currentLength; i < popupQuantity; i++) {
            newVariants.push({ ...lastItem });
          }
        } else {
          newVariants = newVariants.slice(0, popupQuantity);
        }
        return newVariants;
      });
    }
  }, [popupQuantity, colorsList, sizesList, weightsList, viewingProduct]);

  // Synchronize country selection with site's default country when it loads
  useEffect(() => {
    if (site?.defaultCountry) {
      setCheckoutData(prev => ({ ...prev, country: site.defaultCountry }));
      setPopupCheckoutData(prev => ({ ...prev, country: site.defaultCountry }));
    }
  }, [site?.defaultCountry]);

  // Order history states
  const [showMyOrders, setShowMyOrders] = useState(false);
  const [myOrdersList, setMyOrdersList] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Auto-scroll Covers slideshow if multiple covers exist
  useEffect(() => {
    if (!site?.covers || site.covers.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentCoverIndex(prev => (prev + 1) % site.covers.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [site?.covers]);

  // Inject Tracking Pixels (Facebook, TikTok, GTM, Microsoft Clarity)
  useEffect(() => {
    if (!site?.tracking) return;
    const cleanup = initTrackingScripts(site.tracking);
    return () => {
      cleanup();
    };
  }, [site?.tracking]);

  useEffect(() => {
    if (!slug) return;

    // Load initial cache for instant visual feedback
    try {
      const cached = localStorage.getItem(`cached_pro_site_${slug}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object') {
          const cachedData = parsed.data || parsed;
          if (cachedData && (cachedData.slug === slug || cachedData.storeName || cachedData.brandName)) {
            setSite(cachedData);
            setLoading(false);
          }
        }
      }
    } catch (e) {}

    if (slug) {
      incrementPageViewRTDB(slug);
    }

    // Isolate public pro website theme from main site dashboard theme settings
    const mainAppTheme = localStorage.getItem('theme');
    document.documentElement.classList.remove('light');

    // Attach real-time onSnapshot listener for instant updates when theme settings are changed
    const q = query(
      collection(db, 'pro_websites'),
      where('slug', '==', slug),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const fetchedData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as ProWebsite;
        setSite(fetchedData);
        try {
          localStorage.setItem(`cached_pro_site_${slug}`, JSON.stringify({
            data: fetchedData,
            timestamp: Date.now()
          }));
        } catch (err) {
          console.error('Error writing pro website cache:', err);
        }
      } else {
        setSite(null);
      }
      setLoading(false);
    }, (err) => {
      console.error('Error in pro website real-time listener:', err);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (mainAppTheme === 'light') {
        document.documentElement.classList.add('light');
      }
    };
  }, [slug]);

  useEffect(() => {
    if (site?.userId) {
      checkCopyLinkTracking(site.userId);
    }
  }, [site?.userId]);

  // Read inventory items from the firestore collection with real-time updates
  useEffect(() => {
    if (!site?.userId) return;

    let isMounted = true;
    let hasFreshCache = false;

    try {
      const cached = localStorage.getItem(`cached_pro_site_inventory_${site.userId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        const data = parsed.data || parsed;
        const timestamp = parsed.timestamp || 0;
        if (data && Array.isArray(data) && (Date.now() - timestamp < 15 * 60 * 1000)) {
          setInventoryItems(data);
          hasFreshCache = true;
        }
      }
    } catch (e) {}

    // Fetch from Firestore only if cache missing or older than 15 mins
    if (!hasFreshCache) {
      const fetchInventory = async () => {
        try {
          const qInv = query(
            collection(db, 'inventory'),
            where('userId', '==', site.userId),
            limit(100)
          );
          const sn = await getDocs(qInv);
          if (!isMounted) return;
          const list = sn.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setInventoryItems(list);
          try {
            localStorage.setItem(`cached_pro_site_inventory_${site.userId}`, JSON.stringify({
              data: list,
              timestamp: Date.now()
            }));
          } catch (err) {}
        } catch (err) {
          console.error("Failed to fetch inventory for pro website:", err);
        }
      };

      fetchInventory();
    }

    return () => {
      isMounted = false;
    };
  }, [site?.userId]);



  // Fetch dynamic orders log for active user
  const fetchMyOrders = async () => {
    if (!site) return;
    const orderIds = JSON.parse(localStorage.getItem('my_orders') || '[]');
    if (orderIds.length === 0) {
      setMyOrdersList([]);
      return;
    }
    setLoadingOrders(true);
    try {
      // Direct getDoc lookups to bypass public guests list query permission restrictions safely
      const fetchPromises = orderIds.map(async (id: string) => {
        try {
          const docRef = doc(db, 'orders', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
          }
        } catch (e) {
          console.error(`Error fetching order doc ${id}:`, e);
        }
        return null;
      });
      const orderDocs = await Promise.all(fetchPromises);
      const filtered = orderDocs.filter(Boolean);
      filtered.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMyOrdersList(filtered);
    } catch (err) {
      console.error('Error looking up guest orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (showMyOrders) {
      fetchMyOrders();
    }
  }, [showMyOrders]);

  const scrollCatalog = (direction: 'left' | 'right') => {
    if (catalogScrollRef.current) {
      const container = catalogScrollRef.current;
      const scrollAmount = container.clientWidth * 0.75;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const addToCart = (
    product: ProWebsite['catalog'][0],
    quantity: number = 1,
    selectedVariants?: { color: string; size: string; weight: string }[]
  ) => {
    setCart(prev => {
      const isSameVariants = (v1?: typeof selectedVariants, v2?: typeof selectedVariants) => {
        if (!v1 && !v2) return true;
        if (!v1 || !v2) return false;
        if (v1.length !== v2.length) return false;
        return v1.every((val, idx) =>
          val.color === v2[idx].color &&
          val.size === v2[idx].size &&
          val.weight === v2[idx].weight
        );
      };

      const existingIdx = prev.findIndex(item =>
        item.product.id === product.id && isSameVariants(item.selectedVariants, selectedVariants)
      );

      if (existingIdx !== -1) {
        return prev.map((item, idx) =>
          idx === existingIdx ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { product, quantity, selectedVariants }];
    });
    // Trigger Multi-Pixel AddToCart Event
    trackAddToCart({
      id: product.id,
      name: product.name,
      price: (product as any).proPrice || product.price,
      category: (product as any).category || (product as any).categoryId || ''
    }, quantity, 'BDT');
  };

  const removeFromCart = (
    productId: string,
    selectedVariants?: { color: string; size: string; weight: string }[]
  ) => {
    setCart(prev => {
      const isSameVariants = (v1?: typeof selectedVariants, v2?: typeof selectedVariants) => {
        if (!v1 && !v2) return true;
        if (!v1 || !v2) return false;
        if (v1.length !== v2.length) return false;
        return v1.every((val, idx) =>
          val.color === v2[idx].color &&
          val.size === v2[idx].size &&
          val.weight === v2[idx].weight
        );
      };
      return prev.filter(item => !(item.product.id === productId && isSameVariants(item.selectedVariants, selectedVariants)));
    });
  };

  const updateQuantity = (
    productId: string,
    delta: number,
    selectedVariants?: { color: string; size: string; weight: string }[]
  ) => {
    setCart(prev => {
      const isSameVariants = (v1?: typeof selectedVariants, v2?: typeof selectedVariants) => {
        if (!v1 && !v2) return true;
        if (!v1 || !v2) return false;
        if (v1.length !== v2.length) return false;
        return v1.every((val, idx) =>
          val.color === v2[idx].color &&
          val.size === v2[idx].size &&
          val.weight === v2[idx].weight
        );
      };
      return prev.map(item => {
        if (item.product.id === productId && isSameVariants(item.selectedVariants, selectedVariants)) {
          return { ...item, quantity: Math.max(1, item.quantity + delta) };
        }
        return item;
      });
    });
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  const getLiveLocation = (isEnforced: boolean = true): Promise<{latitude: number; longitude: number}> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        if (isEnforced) {
          reject(new Error(translate("gps_unsupported", site?.language, site?.defaultCountry)));
        } else {
          resolve({ latitude: 0, longitude: 0 });
        }
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (firstErr) => {
          // Fallback to standard accuracy on timeout/error
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              });
            },
            (error) => {
              let msg = translate("location_not_found", site?.language, site?.defaultCountry);
              if (error.code === error.PERMISSION_DENIED) {
                msg = isEnforced
                  ? translate("location_blocked", site?.language, site?.defaultCountry)
                  : translate("location_blocked_generic", site?.language, site?.defaultCountry);
              } else {
                msg = translate("location_error", site?.language, site?.defaultCountry);
              }
              if (isEnforced) {
                reject(new Error(msg));
              } else {
                resolve({ latitude: 0, longitude: 0 });
              }
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
          );
        },
        { enableHighAccuracy: true, timeout: isEnforced ? 6000 : 3000, maximumAge: 60000 }
      );
    });
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!site || cart.length === 0) return;
    if (orderStatus === 'loading') return;

    setOrderStatus('loading');
    let clientIp = '';
    try {
      // Live Location requirements
      let userLocation: { latitude: number; longitude: number } | null = cachedLocation;
      try {
        if (!userLocation) {
          userLocation = await getLiveLocation(!!site?.requireLocationTracking);
        }
      } catch (locationErr: any) {
        if (site?.requireLocationTracking) {
          alert(locationErr.message);
          setOrderStatus('idle');
          return;
        } else {
          console.warn("Optional silent website geolocation failed/ignored:", locationErr);
        }
      }

      // Server-Side IP & Device Token 24-Hour Rate Limit (Max 10 orders / 24h)
      const isAdminDevice = !!auth.currentUser || localStorage.getItem('is_admin_device') === 'true';
      try {
        const limitRes = await fetch('/api/orders/check-limit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            deviceToken: getOrInitDeviceToken(),
            isAdmin: isAdminDevice,
            bypass: isAdminDevice
          })
        });
        if (limitRes.ok) {
          const limitData = await limitRes.json();
          clientIp = limitData.ip || '';
          if (!limitData.allowed && !isAdminDevice) {
            alert(site?.language === 'Bangla' || site?.language === 'bn'
              ? "দুঃখিত, এই আইপি (IP) বা ডিভাইস থেকে ২৪ ঘণ্টায় ১০টির বেশি অর্ডার করা যাবে না।"
              : "Sorry, a maximum of 10 orders can be placed from this IP or device within 24 hours.");
            setOrderStatus('idle');
            return;
          }
        }
      } catch (limitErr) {
        console.error("Failed to verify server IP rate limit:", limitErr);
      }

      // Rate Limit Verification (Prevent spamming multiple fake requests from same device)
      if (site?.userId) {
        const rateLimit = await checkOrderRateLimit(site.userId);
        if (!rateLimit.allowed) {
          alert(translate("rate_limit_error", site?.language, site?.defaultCountry));
          setOrderStatus('idle');
          return;
        }
      }

      // Fraud Verification
      if (site?.userId) {
        const blacklist = await checkBlacklistStatus(site.userId, checkoutData.phone);
        if (blacklist?.isBlocked) {
          console.warn("[Fraud System] Blocked standard website checkout for blacklisted phone/token.");
          await trackBlockedAttempt(site.userId, checkoutData.phone, checkoutData.name);
          setOrderStatus('success');
          setCart([]);
          setShowCart(false);
          return;
        }
      }

      let totalCartBuyPrice = 0;
      const skuCodes: string[] = [];
      if (site?.userId) {
        try {
          const invQuery = query(
            collection(db, 'inventory'),
            where('userId', '==', site.userId)
          );
          const iSnap = await getDocs(invQuery);
          for (const cartItem of cart) {
            const nameToFind = cartItem.product.name;
            const match = iSnap.docs.find(d => d.data().name?.toLowerCase() === nameToFind?.toLowerCase());
            if (match) {
              totalCartBuyPrice += (Number(match.data().buyPrice) || 0) * cartItem.quantity;
              if (match.data().skuCode) {
                skuCodes.push(match.data().skuCode);
              }
            }
          }
        } catch (err) {
          console.error("Error fetching buyPrice for cart products:", err);
        }
      }

      const selectedCountryInfo = COUNTRIES.find(c => c.name === checkoutData.country) || COUNTRIES[0];
      const newOrder = {
        senderId: 'customer_public',
        receiverId: site.userId,
        productName: cart.map(item => {
          const variantText = item.selectedVariants && item.selectedVariants.length > 0
            ? item.selectedVariants.map(v => {
                const parts = [];
                if (v.color) parts.push(v.color);
                if (v.size) parts.push(v.size);
                if (v.weight) parts.push(v.weight);
                return parts.length > 0 ? `(${parts.join(', ')})` : '';
              }).filter(Boolean).join(' ')
            : '';
          return `${item.product.name} ${variantText} (x${item.quantity})`;
        }).join(', '),
        productImage: cart[0].product.image,
        buyPrice: totalCartBuyPrice,
        sellPrice: cartTotal,
        skuCode: skuCodes.filter(Boolean).join(', ') || null,
        deliveryCharge: getCartDeliveryCharge(),
        customerName: checkoutData.name,
        customerPhone: checkoutData.phone,
        customerAddress: getAggregatedAddress(checkoutData.country, checkoutData),
        country: checkoutData.country,
        currency: selectedCountryInfo.currency,
        currencySymbol: selectedCountryInfo.currencySymbol,
        color: checkoutData.selectedColor || null,
        status: 'pending',
        platform: 'website',
        platformId: site?.id || site?.websiteId || '',
        websiteId: site?.id || site?.websiteId || '',
        platformName: site?.websiteName || site?.siteTitle || site?.storeName || site?.slug || 'Pro Website',
        items: cart.map(item => ({
          id: item.product.id,
          name: item.product.name,
          image: item.product.image || "",
          sellPrice: Number(item.product.offerPrice || item.product.price) || 0,
          buyPrice: Number(item.product.buyPrice || item.product.offerPrice || item.product.price) || 0,
          quantity: item.quantity,
          specs: item.selectedVariants && item.selectedVariants.length > 0
            ? item.selectedVariants.map(v => ({ color: v.color || '', size: v.size || '', weight: v.weight || '' }))
            : [{ color: checkoutData.selectedColor || '', size: '', weight: '' }]
        })),
        fraudToken: getOrInitDeviceToken(),
        clientIp: clientIp || null,
        latitude: userLocation ? userLocation.latitude : null,
        longitude: userLocation ? userLocation.longitude : null,
        trackingMethod: userLocation ? 'gps' : 'none',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'orders'), newOrder);

      try {
        const orderIdVal = docRef.id;
        const pName = newOrder.productName;
        const pImage = newOrder.productImage || '';
        const qtyVal = cart.reduce((acc, item) => acc + item.quantity, 0);
        const totalPriceVal = cartTotal + 120;
        const custNameVal = checkoutData.name || 'Guest';

        await syncOrderToSiteChat(
          db,
          site.userId,
          orderIdVal,
          pName,
          pImage,
          qtyVal,
          totalPriceVal,
          custNameVal,
          `website_${slug || site?.id || 'pro_site'}`,
          site.brandName || 'Our Store'
        );
      } catch (syncErr) {
        console.error("Failed to sync cart order to site chat:", syncErr);
      }

      recordOrderSuccess();
      setLastPlacedOrderId(docRef.id);

      // Save order ID to local storage so user can track it under 'My Order'
      const existingIds = JSON.parse(localStorage.getItem('my_orders') || '[]');
      existingIds.push(docRef.id);
      localStorage.setItem('my_orders', JSON.stringify(existingIds));

      // Multi-Platform Purchase Tracking (FB, TikTok, GTM, Clarity)
      trackPurchase(
        docRef.id,
        cart.map(item => ({
          id: item.product.id,
          name: item.product.name,
          price: (item.product as any).proPrice || item.product.price,
          quantity: item.quantity,
          category: (item.product as any).category || (item.product as any).categoryId || ''
        })),
        cartTotal,
        'BDT',
        { name: checkoutData.name, phone: checkoutData.phone, district: checkoutData.city || checkoutData.state || checkoutData.location }
      );

      setOrderStatus('success');
      setCart([]);
      setShowCart(false);
    } catch (err) {
      console.error('Order error:', err);
      setOrderStatus('error');
    }
  };

  // Open the detailed product modal lookup
  const handleOpenProductPopup = (product: any) => {
    setViewingProduct(product);
    setPopupActiveTab('details');
    const pImages = product.images && Array.isArray(product.images) && product.images.filter(Boolean).length > 0
      ? product.images.filter(Boolean)
      : [product.image];
    setPopupActiveImage(pImages[0] || product.image || '');
    setShowPopupVideoPlayer(false);

    const initC = product.color ? product.color.split(',').map((s: string) => s.trim()).filter(Boolean)[0] || '' : '';
    const initS = product.size ? product.size.split(',').map((s: string) => s.trim()).filter(Boolean)[0] || '' : '';
    const initW = product.weight ? product.weight.split(',').map((s: string) => s.trim()).filter(Boolean)[0] || '' : '';

    setSelectedColor(initC);
    setSelectedSize(initS);
    setSelectedWeight(initW);
    setPopupQuantity(1);
    setSelectedItemsVariants([{ color: initC, size: initS, weight: initW }]);

    setPopupCheckoutData({
      name: '',
      phone: '',
      address: '',
      country: site?.defaultCountry || 'Bangladesh',
      location: 'dhaka_inside',
      email: '',
      postalCode: '',
      nationalId: '',
      landmark: '',
      state: '',
      city: ''
    });
    setPopupOrderStatus('idle');

    // Automatically scroll to the top of the modal container
    setTimeout(() => {
      if (modalScrollRef.current) {
        modalScrollRef.current.scrollTop = 0;
      }
    }, 50);

    // Multi-Pixel ViewContent Event
    trackViewContent({
      id: product.id,
      name: product.name,
      price: product.proPrice || product.price,
      category: product.category
    }, 'BDT');
  };

  // Delivery config with price options
  const chargeInside = site?.deliveryChargeInside !== undefined ? Number(site.deliveryChargeInside) : 80;
  const chargeOutside = site?.deliveryChargeOutside !== undefined ? Number(site.deliveryChargeOutside) : 130;
  const labelInside = site?.deliveryLabelInside || translate("inside_dhaka", site?.language, site?.defaultCountry);
  const labelOutside = site?.deliveryLabelOutside || translate("outside_dhaka", site?.language, site?.defaultCountry);

  // Dynamically load custom areas
  const customOptions = site?.customDeliveryCharges && Array.isArray(site.customDeliveryCharges)
    ? site.customDeliveryCharges.map((item, index) => ({
        label: `${item.area} (${getCurrencySymbol(popupCheckoutData.country || site?.defaultCountry)}${item.charge})`,
        value: `custom_${index}`,
        charge: Number(item.charge) || 0
      }))
    : [];

  const deliveryChargeOptions = [
    { label: `${labelInside} (${getCurrencySymbol(popupCheckoutData.country || site?.defaultCountry)}${chargeInside})`, value: 'dhaka_inside', charge: chargeInside },
    { label: `${labelOutside} (${getCurrencySymbol(popupCheckoutData.country || site?.defaultCountry)}${chargeOutside})`, value: 'dhaka_outside', charge: chargeOutside },
    ...customOptions
  ];

  const getActiveDeliveryCharge = (qty: number = popupQuantity) => {
    const option = deliveryChargeOptions.find(o => o.value === popupCheckoutData.location);
    const baseCharge = option ? option.charge : chargeOutside;
    if (site?.deliveryQtyBasedEnabled && qty > 1) {
      const increment = site.deliveryIncrementPerQty !== undefined 
        ? Number(site.deliveryIncrementPerQty) 
        : 20;
      return baseCharge + (qty - 1) * increment;
    }
    return baseCharge;
  };

  const getCartDeliveryCharge = () => {
    let baseCharge = chargeOutside;
    if (checkoutData.location === 'dhaka_inside') {
      baseCharge = chargeInside;
    } else if (checkoutData.location === 'dhaka_outside') {
      baseCharge = chargeOutside;
    } else if (checkoutData.location && checkoutData.location.startsWith('custom_')) {
      const idx = parseInt(checkoutData.location.split('_')[1], 10);
      const customItem = site?.customDeliveryCharges?.[idx];
      baseCharge = customItem ? Number(customItem.charge) : chargeOutside;
    }

    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (site?.deliveryQtyBasedEnabled && totalQty > 1) {
      const increment = site.deliveryIncrementPerQty !== undefined 
        ? Number(site.deliveryIncrementPerQty) 
        : 20;
      return baseCharge + (totalQty - 1) * increment;
    }
    return baseCharge;
  };

  const getActiveDeliveryLabel = () => {
    const option = deliveryChargeOptions.find(o => o.value === popupCheckoutData.location);
    if (!option) return labelOutside;
    if (popupCheckoutData.location === 'dhaka_inside') return labelInside;
    if (popupCheckoutData.location === 'dhaka_outside') return labelOutside;
    return option.label.split('(')[0].trim(); // Just return the area name
  };

  const handlePopupSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!site || !viewingProduct) return;
    if (popupOrderStatus === 'loading') return;

    setPopupOrderStatus('loading');
    let clientIp = '';
    try {
      // Live Location requirements
      let userLocation: { latitude: number; longitude: number } | null = cachedLocation;
      try {
        if (!userLocation) {
          userLocation = await getLiveLocation(!!site?.requireLocationTracking);
        }
      } catch (locationErr: any) {
        if (site?.requireLocationTracking) {
          alert(locationErr.message);
          setPopupOrderStatus('idle');
          return;
        } else {
          console.warn("Optional silent website geolocation failed/ignored:", locationErr);
        }
      }

      // Server-Side IP & Device Token 24-Hour Rate Limit (Max 10 orders / 24h)
      const isPopupAdminDevice = !!auth.currentUser || localStorage.getItem('is_admin_device') === 'true';
      try {
        const limitRes = await fetch('/api/orders/check-limit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            deviceToken: getOrInitDeviceToken(),
            isAdmin: isPopupAdminDevice,
            bypass: isPopupAdminDevice
          })
        });
        if (limitRes.ok) {
          const limitData = await limitRes.json();
          clientIp = limitData.ip || '';
          if (!limitData.allowed && !isPopupAdminDevice) {
            alert(site?.language === 'Bangla' || site?.language === 'bn'
              ? "দুঃখিত, এই আইপি (IP) বা ডিভাইস থেকে ২৪ ঘণ্টায় ১০টির বেশি অর্ডার করা যাবে না।"
              : "Sorry, a maximum of 10 orders can be placed from this IP or device within 24 hours.");
            setPopupOrderStatus('idle');
            return;
          }
        }
      } catch (limitErr) {
        console.error("Failed to verify server IP rate limit:", limitErr);
      }

      // Rate Limit Verification (Prevent spamming multiple fake requests from same device)
      if (site?.userId) {
        const rateLimit = await checkOrderRateLimit(site.userId);
        if (!rateLimit.allowed) {
          alert(translate("rate_limit_error", site?.language, site?.defaultCountry));
          setPopupOrderStatus('idle');
          return;
        }
      }

      // Fraud Verification
      if (site?.userId) {
        const blacklist = await checkBlacklistStatus(site.userId, popupCheckoutData.phone);
        if (blacklist?.isBlocked) {
          console.warn("[Fraud System] Intercepted blacklisted customer in quick popup buy.");
          await trackBlockedAttempt(site.userId, popupCheckoutData.phone, popupCheckoutData.name);
          setPopupOrderStatus('success');
          setTimeout(() => {
            setViewingProduct(null);
            setPopupOrderStatus('idle');
          }, 3500);
          return;
        }
      }

      const priceProduct = viewingProduct.price;
      const subtotal = priceProduct * popupQuantity;
      const charge = getActiveDeliveryCharge();
      const totalAmount = subtotal + charge;

      let singleProductBuyPrice = 0;
      let singleSkuCode = '';
      if (site?.userId && viewingProduct) {
        try {
          const invQuery = query(
            collection(db, 'inventory'),
            where('userId', '==', site.userId)
          );
          const iSnap = await getDocs(invQuery);
          const match = iSnap.docs.find(d => d.data().name?.toLowerCase() === viewingProduct.name?.toLowerCase());
          if (match) {
            singleProductBuyPrice = (Number(match.data().buyPrice) || 0) * popupQuantity;
            singleSkuCode = match.data().skuCode || '';
          }
        } catch (err) {
          console.error("Error fetching buyPrice for single product checkout:", err);
        }
      }

      const popupSelectedCountryInfo = COUNTRIES.find(c => c.name === popupCheckoutData.country) || COUNTRIES[0];

      let finalColor = selectedColor || null;
      let finalSize = selectedSize || null;
      let finalWeight = selectedWeight || null;
      let formattedDetails = '';

      if (selectedItemsVariants && selectedItemsVariants.length > 0) {
        if (selectedItemsVariants.length === 1) {
          finalColor = selectedItemsVariants[0].color || null;
          finalSize = selectedItemsVariants[0].size || null;
          finalWeight = selectedItemsVariants[0].weight || null;
        } else {
          const colorParts = selectedItemsVariants.map((v, i) => `#${i + 1}: ${v.color || (site?.language === 'bn' ? 'নাই' : 'No Color')}`);
          const sizeParts = selectedItemsVariants.map((v, i) => `#${i + 1}: ${v.size || (site?.language === 'bn' ? 'নাই' : 'No Size')}`);
          const weightParts = selectedItemsVariants.map((v, i) => `#${i + 1}: ${v.weight || (site?.language === 'bn' ? 'নাই' : 'No Weight')}`);

          finalColor = colorParts.join(', ');
          finalSize = sizeParts.join(', ');
          finalWeight = weightParts.join(', ');

          formattedDetails = selectedItemsVariants
            .map((v, i) => {
              const prodWord = site?.language === 'bn' ? 'প্রোডাক্ট' : 'Product';
              const colWord = site?.language === 'bn' ? 'কালার' : 'Color';
              const sizWord = site?.language === 'bn' ? 'সাইজ' : 'Size';
              const emptyWord = site?.language === 'bn' ? 'নাই' : 'None';
              return `${prodWord} #${i + 1}: ${colWord} (${v.color || emptyWord}), ${sizWord} (${v.size || emptyWord})`;
            })
            .join(' | ');
        }
      }

      const newOrder = {
        senderId: 'customer_public',
        receiverId: site.userId,
        productName: `${viewingProduct.name} (x${popupQuantity})`,
        productImage: viewingProduct.image,
        buyPrice: singleProductBuyPrice,
        sellPrice: totalAmount,
        skuCode: singleSkuCode || null,
        deliveryCharge: charge,
        customerName: popupCheckoutData.name,
        customerPhone: popupCheckoutData.phone,
        customerAddress: getAggregatedAddress(popupCheckoutData.country, popupCheckoutData),
        country: popupCheckoutData.country,
        currency: popupSelectedCountryInfo.currency,
        currencySymbol: popupSelectedCountryInfo.currencySymbol,
        color: finalColor || null,
        size: finalSize || null,
        weight: finalWeight || null,
        details: formattedDetails || null,
        quantity: popupQuantity,
        status: 'pending',
        platform: 'website',
        platformId: site?.id || site?.websiteId || '',
        websiteId: site?.id || site?.websiteId || '',
        platformName: site?.websiteName || site?.siteTitle || site?.storeName || site?.slug || 'Pro Website',
        items: [{
          id: viewingProduct.id,
          name: viewingProduct.name,
          image: viewingProduct.image || "",
          sellPrice: Number(viewingProduct.offerPrice || viewingProduct.price) || 0,
          buyPrice: Number(singleProductBuyPrice) || Number(viewingProduct.offerPrice || viewingProduct.price) || 0,
          quantity: popupQuantity,
          specs: selectedItemsVariants && selectedItemsVariants.length > 0
            ? selectedItemsVariants.map(v => ({ color: v.color || '', size: v.size || '', weight: v.weight || '' }))
            : [{ color: finalColor || '', size: finalSize || '', weight: finalWeight || '' }]
        }],
        fraudToken: getOrInitDeviceToken(),
        clientIp: clientIp || null,
        latitude: userLocation ? userLocation.latitude : null,
        longitude: userLocation ? userLocation.longitude : null,
        trackingMethod: userLocation ? 'gps' : 'none',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'orders'), newOrder);

      try {
        const orderIdVal = docRef.id;
        const pName = `${viewingProduct.name}`;
        const pImage = viewingProduct.image || '';
        const qtyVal = popupQuantity;
        const totalPriceVal = totalAmount + charge;
        const custNameVal = popupCheckoutData.name || 'Guest';

        await syncOrderToSiteChat(
          db,
          site.userId,
          orderIdVal,
          pName,
          pImage,
          qtyVal,
          totalPriceVal,
          custNameVal,
          `website_${slug || site?.id || 'pro_site'}`,
          site.brandName || 'Our Store'
        );
      } catch (syncErr) {
        console.error("Failed to sync single order to site chat:", syncErr);
      }

      recordOrderSuccess();
      setLastPlacedOrderId(docRef.id);

      // Save ID so guest can view their dynamic shipping status instantly
      const existingIds = JSON.parse(localStorage.getItem('my_orders') || '[]');
      existingIds.push(docRef.id);
      localStorage.setItem('my_orders', JSON.stringify(existingIds));

      // Multi-Platform Purchase Tracking (FB, TikTok, GTM, Clarity)
      trackPurchase(
        docRef.id,
        [{
          id: viewingProduct.id,
          name: viewingProduct.name,
          price: ((viewingProduct as any).proPrice || viewingProduct.price),
          quantity: popupQuantity,
          category: (viewingProduct as any).category || (viewingProduct as any).categoryId || ''
        }],
        totalAmount + charge,
        'BDT',
        { name: popupCheckoutData.name, phone: popupCheckoutData.phone, district: popupCheckoutData.city || popupCheckoutData.state || popupCheckoutData.location }
      );

      setPopupOrderStatus('success');
      // Reset view
      setTimeout(() => {
        setViewingProduct(null);
        setPopupOrderStatus('idle');
      }, 3500);

    } catch (err) {
      console.error('Error placing popup form order:', err);
      setPopupOrderStatus('error');
    }
  };

  // Compute enriched catalog by merging lightweight cached site catalog entries with live inventory data
  const enrichedCatalog = useMemo(() => {
    if (!site?.catalog) return [];
    return site.catalog.map((p: any) => {
      // Find matching inventory item in the freshly loaded live list
      const invMatch = inventoryItems.find(inv => inv.id === p.id);
      if (!invMatch) return p;
      return {
        ...p,
        name: invMatch.name || p.name,
        price: typeof p.price === 'number' ? p.price : (Number(invMatch.sellPrice) || 0),
        comparePrice: typeof p.comparePrice === 'number' ? p.comparePrice : (Number(invMatch.sellPrice) || 0),
        discount: typeof p.discount === 'number' ? p.discount : (
          p.comparePrice && p.price && p.comparePrice > p.price
            ? Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100)
            : 0
        ),
        image: invMatch.image || p.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80',
        images: invMatch.images && Array.isArray(invMatch.images) && invMatch.images.filter(Boolean).length > 0
          ? invMatch.images.filter(Boolean)
          : (p.images && Array.isArray(p.images) && p.images.filter(Boolean).length > 0
              ? p.images.filter(Boolean)
              : [p.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80']),
        hasWarranty: invMatch.hasWarranty ?? p.hasWarranty,
        warrantyDuration: invMatch.warrantyDuration ?? p.warrantyDuration,
        hasReplacement: invMatch.hasReplacement ?? p.hasReplacement,
        replacementDuration: invMatch.replacementDuration ?? p.replacementDuration,
        color: invMatch.color ?? p.color,
        size: invMatch.size ?? p.size,
        weight: invMatch.weight ?? p.weight,
        details: invMatch.details || p.details || '',
        videoUrl: invMatch.videoUrl || p.videoUrl || '',
        stock: invMatch.stock
      };
    });
  }, [site?.catalog, inventoryItems]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-dragon-cyan animate-spin" />
      </div>
    );
  }

  if (!site) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-center">
        <X className="w-16 h-16 text-rose-500/20 mb-4 animate-pulse" />
        <h1 className="text-2xl font-black text-white uppercase tracking-wider">Storefront Is Private</h1>
        <p className="text-gray-500 mt-2 text-sm">This store link is private, deleted, or does not exist.</p>
      </div>
    );
  }

  // Check if site is trial expired (72 hours elapsed)
  const isSiteExpired = site.paymentStatus !== 'approved' && site.paymentStatus !== 'pending' && (() => {
    if (!site?.createdAt) return false;
    const createdAtTime = new Date(site.createdAt).getTime();
    const seventyTwoHoursMs = 72 * 60 * 60 * 1000;
    return (Date.now() - createdAtTime) > seventyTwoHoursMs;
  })();

  if (isSiteExpired) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center select-none font-sans">
        <div className="max-w-md w-full bg-neutral-900/60 border border-neutral-800/80 p-8 rounded-[2.5rem] shadow-2xl space-y-6">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-black text-white uppercase tracking-wider">Website Inactive / Suspended</h1>
            <p className="text-xs text-rose-400 font-bold uppercase tracking-widest">(72-hour free trial has expired)</p>
          </div>

          <p className="text-sm text-gray-400 leading-relaxed">
            The 72-hour free trial for this Pro website has expired. Please activate a paid plan from your Admin Panel to resume services.
          </p>

          <div className="pt-4 border-t border-white/5 space-y-3">
            <p className="text-[10px] uppercase font-black tracking-widest text-gray-600">Site Owner Details</p>
            <div className="p-3.5 bg-black/40 border border-white/5 rounded-xl text-left space-y-1 text-xs">
              <p className="text-gray-400">Store Name: <span className="text-white font-bold">{(site as any).storeName || site.brandName}</span></p>
              <p className="text-gray-400">Created At: <span className="text-white font-mono">{new Date(site.createdAt).toLocaleDateString()}</span></p>
              <p className="text-gray-400">Status: <span className="text-amber-400 font-bold uppercase">Plan Required</span></p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Filter products by Category AND Search Queries
  const filteredCatalog = enrichedCatalog?.filter(p => {
    // Exclude the hero spotlight product from the catalog grid to prevent duplicate hero display and placeholder photo contamination
    if (p.id === 'featured_1') return false;

    // If selectedCategory is 'all', show ALL products, or if category matches
    const matchesCategory =
      selectedCategory === 'all' ||
      !selectedCategory ||
      String(p.categoryId) === String(selectedCategory) ||
      (selectedCategory === 'all' && (!p.categoryId || p.categoryId === 'all' || p.categoryId === ''));

    const matchesSearch = searchQuery === '' || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }) || [];

  // Pagination Calculations
  const itemsPerPage = 50;
  const totalPages = Math.ceil(filteredCatalog.length / itemsPerPage);
  const activePage = Math.min(Math.max(1, currentPage), totalPages || 1);
  const startIndex = (activePage - 1) * itemsPerPage;
  const paginatedCatalog = filteredCatalog.slice(startIndex, startIndex + itemsPerPage);

  // Suggest up to 4 other items from current store catalog
  const suggestedProducts = enrichedCatalog && viewingProduct
    ? enrichedCatalog.filter(p => p.id !== viewingProduct.id).slice(0, 4)
    : [];

  // Custom theme colors configuration from settings
  const themeAccentColor = site.colors?.theme || '#6366f1';
  const displayTitleColor = site.colors?.title || '#ffffff';
  const storeNameColor = site.colors?.storeNameColor || site.colors?.title || '#ffffff';
  const bodyDescColor = site.colors?.description || '#d1d5db';
  const customPriceColor = site.colors?.price || '#6366f1';
  const oldPriceColor = site.colors?.discount || '#ef4444';
  const customBtnBg = site.colors?.button || site.colors?.theme || '#6366f1';
  const customBtnText = site.colors?.buttonText || '#ffffff';

  // Custom theme backgrounds customizer options
  const headerBg = site.colors?.headerBg || 'black';
  const bodyBg = site.colors?.bodyBg || 'black';
  const footerBg = site.colors?.footerBg || 'black';
  const isProDarkTheme = bodyBg !== 'white';

  return (
    <div className={cn("min-h-screen font-sans text-gray-100 overflow-x-hidden relative custom-pro-wrapper", isProDarkTheme ? "pro-dark-theme" : "pro-light-theme")}>

      {/* Dynamic Theme Styles Injection */}
      <style>{`
        .custom-pro-wrapper {
          font-family: "Hind Siliguri", "Noto Sans Bengali", "Plus Jakarta Sans", "Inter", sans-serif !important;
        }
        .custom-pro-wrapper h1,
        .custom-pro-wrapper h2,
        .custom-pro-wrapper h3,
        .custom-pro-wrapper h4,
        .custom-pro-wrapper p,
        .custom-pro-wrapper span,
        .custom-pro-wrapper button,
        .custom-pro-wrapper label {
          letter-spacing: normal !important;
          word-spacing: normal !important;
        }

        .theme-accent { color: ${themeAccentColor} !important; }
        .theme-accent-bg { background-color: ${themeAccentColor} !important; }
        .theme-border { border-color: ${themeAccentColor} !important; }
        .theme-btn { background-color: ${customBtnBg} !important; color: ${customBtnText} !important; border-color: ${customBtnBg} !important; }
        .theme-btn * { color: ${customBtnText} !important; }
        .theme-price { color: ${customPriceColor} !important; }
        .theme-old-price { color: ${oldPriceColor} !important; }
        .theme-btn-secondary { background-color: ${customBtnBg}1a !important; border-color: ${customBtnBg}60 !important; color: ${customBtnBg} !important; font-weight: 800 !important; }
        .theme-btn-secondary:hover { background-color: ${customBtnBg} !important; color: ${customBtnText} !important; }
        .theme-accent-bg-hover:hover { background-color: ${themeAccentColor} !important; color: #ffffff !important; }

        .custom-pro-wrapper .active-category-btn {
          background-color: ${themeAccentColor} !important;
          background-image: none !important;
          color: #ffffff !important;
          border-color: ${themeAccentColor} !important;
          box-shadow: 0 4px 14px ${themeAccentColor}60 !important;
        }
        .custom-pro-wrapper .active-category-btn * {
          color: #ffffff !important;
        }

        /* Default / Dark Mode Add to Cart & Order Buttons */
        .pro-btn-cart {
          background-color: ${customBtnBg}20 !important;
          border: 1.5px solid ${customBtnBg} !important;
          color: ${customBtnBg} !important;
          font-weight: 900 !important;
        }
        .pro-btn-cart * {
          color: ${customBtnBg} !important;
        }
        .pro-btn-cart:hover {
          background-color: ${customBtnBg} !important;
          color: ${customBtnText} !important;
          border-color: ${customBtnBg} !important;
          box-shadow: 0 4px 12px ${customBtnBg}40 !important;
        }
        .pro-btn-cart:hover * {
          color: ${customBtnText} !important;
        }
        .pro-btn-order {
          background-color: ${customBtnBg} !important;
          color: ${customBtnText} !important;
          border: 1.5px solid ${customBtnBg} !important;
          font-weight: 900 !important;
          box-shadow: 0 4px 14px ${customBtnBg}40 !important;
        }
        .pro-btn-order * {
          color: ${customBtnText} !important;
        }
        .pro-btn-order:hover {
          filter: brightness(1.1) !important;
          box-shadow: 0 6px 18px ${customBtnBg}60 !important;
        }

        ${bodyBg === 'white' ? `
          .custom-pro-wrapper {
            background-color: #ffffff !important;
            color: #0f172a !important;
          }
          .custom-pro-wrapper h1,
          .custom-pro-wrapper h2,
          .custom-pro-wrapper h3,
          .custom-pro-wrapper h4,
          .custom-pro-wrapper h5,
          .custom-pro-wrapper h6 {
            color: #0f172a !important;
          }
          .custom-pro-wrapper p,
          .custom-pro-wrapper span,
          .custom-pro-wrapper li,
          .custom-pro-wrapper label {
            color: #1e293b !important;
          }
          .custom-pro-wrapper .text-gray-300,
          .custom-pro-wrapper .text-gray-400,
          .custom-pro-wrapper .text-gray-500 {
            color: #475569 !important;
          }

          /* Homepage Product Cards in White Background Page - Pure White Box */
          .custom-pro-wrapper .pro-product-card {
            background-color: #ffffff !important;
            border: 1px solid #e2e8f0 !important;
            box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.06), 0 4px 8px -2px rgba(0, 0, 0, 0.03) !important;
          }
          .custom-pro-wrapper .pro-product-card:hover {
            background-color: #ffffff !important;
            border-color: ${customBtnBg}80 !important;
            box-shadow: 0 20px 40px -5px rgba(0, 0, 0, 0.1) !important;
          }
          .custom-pro-wrapper .pro-product-card-img {
            background-color: #ffffff !important;
            border-color: #f1f5f9 !important;
          }

          /* Add to Cart button in Light Mode & Dark Mode - Uses selected Theme Button Color */
          .custom-pro-wrapper .pro-btn-cart,
          .custom-pro-wrapper .pro-card-btn-cart {
            background-color: ${customBtnBg}20 !important;
            border: 2px solid ${customBtnBg} !important;
            color: ${customBtnBg} !important;
            font-weight: 900 !important;
          }
          .custom-pro-wrapper .pro-btn-cart *,
          .custom-pro-wrapper .pro-card-btn-cart * {
            color: ${customBtnBg} !important;
          }
          .custom-pro-wrapper .pro-btn-cart:hover,
          .custom-pro-wrapper .pro-card-btn-cart:hover {
            background-color: ${customBtnBg} !important;
            color: ${customBtnText} !important;
            border-color: ${customBtnBg} !important;
            box-shadow: 0 4px 14px ${customBtnBg}50 !important;
          }
          .custom-pro-wrapper .pro-btn-cart:hover *,
          .custom-pro-wrapper .pro-card-btn-cart:hover * {
            color: ${customBtnText} !important;
          }

          /* Order Now button in Light Mode & Dark Mode - Uses selected Theme Button Color in solid deep fill */
          .custom-pro-wrapper .pro-btn-order,
          .custom-pro-wrapper .theme-btn {
            background-color: ${customBtnBg} !important;
            color: ${customBtnText} !important;
            border: 2px solid ${customBtnBg} !important;
            font-weight: 900 !important;
            box-shadow: 0 4px 16px ${customBtnBg}40 !important;
          }
          .custom-pro-wrapper .pro-btn-order *,
          .custom-pro-wrapper .theme-btn * {
            color: ${customBtnText} !important;
          }
          .custom-pro-wrapper .pro-btn-order:hover,
          .custom-pro-wrapper .theme-btn:hover {
            filter: brightness(1.15) !important;
            box-shadow: 0 6px 20px ${customBtnBg}60 !important;
          }

          /* Category & Filter buttons in Light Mode (excludes product card action buttons) */
          .custom-pro-wrapper #catalog button:not(.bg-white):not(.pro-btn-cart):not(.pro-btn-order):not(.theme-btn):not(.pro-card-btn-cart) {
            background-color: #f1f5f9 !important;
            border: 1px solid #cbd5e1 !important;
            color: #0f172a !important;
          }
          .custom-pro-wrapper #catalog button:not(.bg-white):not(.pro-btn-cart):not(.pro-btn-order):not(.theme-btn):not(.pro-card-btn-cart):hover {
            background-color: #e2e8f0 !important;
            color: #000000 !important;
          }

          /* Header buttons & Search in Light Mode */
          .custom-pro-wrapper .custom-pro-header button {
            background-color: #f1f5f9 !important;
            border-color: #cbd5e1 !important;
            color: #0f172a !important;
          }
          .custom-pro-wrapper .custom-pro-header input {
            background-color: #ffffff !important;
            border-color: #cbd5e1 !important;
            color: #0f172a !important;
          }

          /* Popups, Order Form Modal & Cart Drawer Light Theme Overrides */
          .custom-pro-wrapper .pro-popup-modal,
          .custom-pro-wrapper .pro-cart-drawer {
            background-color: #ffffff !important;
            color: #0f172a !important;
            border-color: #e2e8f0 !important;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15) !important;
          }

          .custom-pro-wrapper .pro-order-form-box,
          .custom-pro-wrapper .pro-cart-footer,
          .custom-pro-wrapper .pro-card-bg,
          .custom-pro-wrapper .pro-details-box {
            background-color: #f8fafc !important;
            border-color: #e2e8f0 !important;
            color: #0f172a !important;
          }

          .custom-pro-wrapper .pro-details-text {
            color: #1e293b !important;
          }

          .custom-pro-wrapper .pro-input-field,
          .custom-pro-wrapper input,
          .custom-pro-wrapper select,
          .custom-pro-wrapper textarea {
            background-color: #ffffff !important;
            color: #0f172a !important;
            border-color: #cbd5e1 !important;
          }
          .custom-pro-wrapper input::placeholder,
          .custom-pro-wrapper textarea::placeholder {
            color: #94a3b8 !important;
          }

          .custom-pro-wrapper select option,
          .custom-pro-wrapper .pro-option,
          .custom-pro-wrapper option {
            background-color: #ffffff !important;
            color: #0f172a !important;
          }

          /* Color, Size, Weight Variation Buttons Light Theme Override */
          .custom-pro-wrapper .pro-variant-btn {
            background-color: #ffffff !important;
            border-color: #cbd5e1 !important;
            color: #1e293b !important;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;
          }
          .custom-pro-wrapper .pro-variant-btn:hover {
            background-color: #f1f5f9 !important;
            border-color: #94a3b8 !important;
            color: #0f172a !important;
          }
          .custom-pro-wrapper .pro-variant-btn.active {
            background-color: ${themeAccentColor} !important;
            border-color: ${themeAccentColor} !important;
            color: #ffffff !important;
            font-weight: 900 !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18) !important;
          }
          .custom-pro-wrapper .pro-variant-btn.active span,
          .custom-pro-wrapper .pro-variant-btn.active * {
            color: #ffffff !important;
          }

          .custom-pro-wrapper .pro-billing-box {
            background-color: #f1f5f9 !important;
            border-color: #e2e8f0 !important;
            color: #0f172a !important;
          }

          .custom-pro-wrapper .pro-delivery-btn {
            background-color: #ffffff !important;
            border-color: #cbd5e1 !important;
            color: #334155 !important;
          }
          .custom-pro-wrapper .pro-delivery-btn.active {
            background-color: ${themeAccentColor} !important;
            border-color: ${themeAccentColor} !important;
            color: #ffffff !important;
          }

          /* Ensure filled buttons keep clear white text in light mode */
          .custom-pro-wrapper .bg-red-600,
          .custom-pro-wrapper .bg-indigo-500,
          .custom-pro-wrapper .bg-indigo-600,
          .custom-pro-wrapper .bg-emerald-500,
          .custom-pro-wrapper .bg-emerald-600,
          .custom-pro-wrapper .bg-dragon-cyan,
          .custom-pro-wrapper .themes-accent-bg {
            color: #ffffff !important;
          }
          .custom-pro-wrapper .bg-red-600 *,
          .custom-pro-wrapper .bg-indigo-500 *,
          .custom-pro-wrapper .bg-indigo-600 *,
          .custom-pro-wrapper .bg-emerald-500 *,
          .custom-pro-wrapper .bg-emerald-600 *,
          .custom-pro-wrapper .bg-dragon-cyan *,
          .custom-pro-wrapper .themes-accent-bg * {
            color: #ffffff !important;
          }

          .custom-pro-wrapper .border-white\\/5,
          .custom-pro-wrapper .border-white\\/10 {
            border-color: rgba(0, 0, 0, 0.08) !important;
          }
          .custom-pro-wrapper .divide-y > * {
            border-color: rgba(0, 0, 0, 0.08) !important;
          }
        ` : `
          .custom-pro-wrapper {
            background-color: #07070a !important;
            color: #f3f4f6 !important;
          }
        `}

        ${headerBg === 'white' ? `
          .custom-pro-header {
            background-color: #ffffff !important;
            color: #000000 !important;
            border-color: rgba(0, 0, 0, 0.1) !important;
          }
          .custom-pro-header span,
          .custom-pro-header p,
          .custom-pro-header svg,
          .custom-pro-header input,
          .custom-pro-header a:not(.theme-btn),
          .custom-pro-header button:not(.theme-btn) {
            color: #000000 !important;
          }
          .custom-pro-header input {
            background-color: rgba(0, 0, 0, 0.03) !important;
            border-color: rgba(0, 0, 0, 0.1) !important;
          }
          .custom-pro-header .custom-header-dropdown {
            background-color: #ffffff !important;
            border-color: rgba(0, 0, 0, 0.1) !important;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
          }
          .custom-pro-header .custom-header-dropdown button:hover,
          .custom-pro-header .custom-header-dropdown a:hover {
            background-color: rgba(0, 0, 0, 0.05) !important;
            color: #000000 !important;
          }
          .custom-pro-header .custom-header-dropdown .bg-white\\/2,
          .custom-pro-header .custom-header-dropdown .bg-white\\/5 {
            background-color: rgba(0, 0, 0, 0.04) !important;
          }
        ` : headerBg === 'black' ? `
          .custom-pro-header {
            background-color: #07070a !important;
            color: #ffffff !important;
            border-color: rgba(255, 255, 255, 0.1) !important;
          }
          .custom-pro-header span,
          .custom-pro-header p,
          .custom-pro-header svg {
            color: #ffffff !important;
          }
        ` : ''}

        ${footerBg === 'white' ? `
          .custom-pro-footer {
            background-color: #ffffff !important;
            color: #0f172a !important;
            border-color: rgba(0, 0, 0, 0.08) !important;
          }
          .custom-pro-footer h4,
          .custom-pro-footer .text-white,
          .custom-pro-footer span,
          .custom-pro-footer a,
          .custom-pro-footer button {
            color: #0f172a !important;
          }
          .custom-pro-footer p,
          .custom-pro-footer li,
          .custom-pro-footer .text-gray-500,
          .custom-pro-footer .text-gray-600 {
            color: #4b5563 !important;
          }
          .custom-pro-footer li:hover {
            color: #000000 !important;
          }
          .custom-pro-footer .bg-white\\/2,
          .custom-pro-footer .bg-white\\/5 {
            background-color: rgba(0, 0, 0, 0.03) !important;
            border-color: rgba(0, 0, 0, 0.08) !important;
          }
          .custom-pro-footer .bg-white\\/5 div,
          .custom-pro-footer .bg-white\\/5 span {
            color: #000000 !important;
          }
        ` : `
          .custom-pro-footer {
            background-color: #07070a !important;
            color: #f3f4f6 !important;
            border-color: rgba(255, 255, 255, 0.05) !important;
          }
          .custom-pro-footer h4,
          .custom-pro-footer .text-white,
          .custom-pro-footer span,
          .custom-pro-footer a,
          .custom-pro-footer button {
            color: #ffffff !important;
          }
          .custom-pro-footer p,
          .custom-pro-footer li,
          .custom-pro-footer .text-gray-500,
          .custom-pro-footer .text-gray-600 {
            color: #9ca3af !important;
          }
          .custom-pro-footer li:hover {
            color: #ffffff !important;
          }
          .custom-pro-footer .bg-white\\/2,
          .custom-pro-footer .bg-white\\/5 {
            background-color: rgba(255, 255, 255, 0.02) !important;
            border-color: rgba(255, 255, 255, 0.08) !important;
          }
          .custom-pro-footer .bg-white\\/5 div,
          .custom-pro-footer .bg-white\\/5 span {
            color: #ffffff !important;
          }
        `}
      `}</style>

      {/* Header containing Logo, Searchbar adjacent to Cart, and Three-Dot menu */}
      <header className="sticky top-0 z-50 bg-[#07070a]/90 backdrop-blur-md border-b border-white/5 shadow-sm custom-pro-header">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-4">

          {/* Logo & Brand title */}
          <div className="flex items-center gap-3 shrink-0 col-span-1">
            {site.logo ? (
              <>
                <img src={site.logo} alt={site.brandName} className="h-10 sm:h-12 w-auto max-w-[180px] sm:max-w-[240px] md:max-w-[300px] object-contain bg-transparent shrink-0" />
                <span className="font-sans font-black text-md sm:text-lg tracking-tight uppercase hidden sm:block" style={{ color: storeNameColor }}>{site.brandName}</span>
              </>
            ) : (
              <div className="flex items-center gap-2.5">
                <DoelBirdLogo size={42} showCircleBackground={true} className="shrink-0" />
                <span 
                  className="font-sans font-black text-base sm:text-xl md:text-2xl tracking-tight uppercase transition-colors"
                  style={{ color: storeNameColor }}
                >
                  {site.brandName || 'MY STORE'}
                </span>
              </div>
            )}
          </div>

          {/* Buttons cluster containing Searchbar & Cart next to each other */}
          <div className="flex items-center gap-2 sm:gap-3.5 shrink-0 relative">

            {/* Search Bar positioned directly next to Shopping Cart */}
            <div className="w-28 sm:w-44 md:w-56 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder={translate("search_placeholder", site.language, site.defaultCountry)}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-full py-1.5 pl-8 pr-7 text-xs font-semibold text-white outline-none focus:border-dragon-cyan focus:bg-white/10 focus:shadow-md transition-all placeholder:text-gray-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Contact Dropdown Support */}
            <div className="relative hidden lg:block">
              <button
                onClick={() => setShowContactDropdown(!showContactDropdown)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-black uppercase tracking-wider rounded-xl transition-all text-white flex items-center gap-2 cursor-pointer"
              >
                Contact <ChevronDown size={14} className={cn("transition-transform duration-200", showContactDropdown ? "rotate-180" : "")} />
              </button>

              <AnimatePresence>
                {showContactDropdown && (
                  <motion.div
                    id="pro-contact-dropdown"
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 mt-2 w-56 bg-black/95 border border-white/10 rounded-2xl p-2 shadow-2xl z-50 space-y-1 custom-header-dropdown"
                  >
                    {site.footer?.whatsapp && (
                      <a
                        href={`https://wa.me/${site.footer.whatsapp.replace('+', '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full flex items-center gap-3 px-4 py-3 text-xs font-medium text-gray-300 hover:text-white hover:bg-emerald-500/10 rounded-xl transition-all"
                      >
                        <MessageCircle size={16} className="text-emerald-400" />
                        WhatsApp Support
                      </a>
                    )}
                    {site.footer?.email && (
                      <a
                        href={`mailto:${site.footer.email}`}
                        className="w-full flex items-center gap-3 px-4 py-3 text-xs font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                      >
                        <Phone size={16} className="text-dragon-cyan" />
                        Email Desk
                      </a>
                    )}
                    {site.social?.facebook && (
                      <a
                        href={site.social.facebook}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full flex items-center gap-3 px-4 py-3 text-xs font-medium text-gray-300 hover:text-white hover:bg-blue-600/10 rounded-xl transition-all"
                      >
                        <Facebook size={16} className="text-blue-400" />
                        Facebook Page
                      </a>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Shopping Cart button */}
            <button
              onClick={() => setShowCart(true)}
              className="relative p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white transition-all group cursor-pointer"
              title="Shopping Cart"
            >
              <ShoppingCart size={16} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-black">
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </span>
              )}
            </button>

            {/* Three-Dot Menu toggle trigger button */}
            <button
              onClick={() => setShowThreeDotMenu(!showThreeDotMenu)}
              className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white transition-all cursor-pointer relative"
              title="Options Menu"
            >
              <MoreVertical size={16} />
            </button>

            {/* Three Dot Options Menu drop card dropdown */}
            <AnimatePresence>
              {showThreeDotMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowThreeDotMenu(false)} />
                  <motion.div
                    id="pro-three-dot-dropdown"
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-52 bg-[#0c0c10] border border-white/10 rounded-2xl p-2.5 shadow-2xl z-50 space-y-1 text-left custom-header-dropdown"
                  >
                    <p className="text-[9px] uppercase tracking-widest font-black text-gray-500 px-3 py-1 bg-white/2 rounded-lg mb-1">{translate("alternative_option", site?.language, site?.defaultCountry)}</p>
                    <button
                      onClick={() => {
                        setShowCart(true);
                        setShowThreeDotMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-gray-200 hover:text-white hover:bg-white/5 rounded-xl transition-all cursor-pointer"
                    >
                      <ShoppingCart size={15} className="text-dragon-cyan" />
                      {translate("shopping_cart", site?.language, site?.defaultCountry)}
                    </button>
                    <button
                      onClick={() => {
                        setShowMyOrders(true);
                        setShowThreeDotMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-gray-200 hover:text-white hover:bg-white/5 rounded-xl transition-all cursor-pointer"
                    >
                      <ShoppingBag size={15} className="text-emerald-400" />
                      {translate("my_orders_tab", site?.language, site?.defaultCountry)}
                    </button>
                    {site.footer?.whatsapp && (
                      <a
                        href={`https://wa.me/${site.footer.whatsapp.replace('+', '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-gray-200 hover:text-white hover:bg-white/5 rounded-xl transition-all block text-[12px]"
                      >
                        <MessageCircle size={15} className="text-green-500" />
                        {translate("help_support_tab", site?.language, site?.defaultCountry)}
                      </a>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>

          </div>
        </div>
      </header>

      {/* Hero / Cover Section with up to 4 Banners Slides */}
      <section className="relative w-full aspect-[1980/1000] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentCoverIndex}
              src={
                site.covers && site.covers.length > 0
                  ? (site.covers[currentCoverIndex]?.url || (typeof site.covers[currentCoverIndex] === 'string' ? site.covers[currentCoverIndex] : '')) || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80"
                  : "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80"
              }
              alt="Hero Cover Slide"
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.6 }}
              className="w-full h-full object-cover"
            />
          </AnimatePresence>
        </div>
      </section>

      {/* Circular Categories Showcase Section (Right below Cover Photo) */}
      {((site.categories && site.categories.length > 0) || (site.catalog && site.catalog.length > 0)) && (
        <section id="categories-circular-showcase" className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-2">
          <div className="flex flex-col items-center justify-center space-y-1.5 mb-4 text-center">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest opacity-90 flex items-center gap-2" style={{ color: themeAccentColor }}>
              <span className="w-2 h-2 rounded-full inline-block animate-pulse" style={{ backgroundColor: themeAccentColor }} />
              {translate("explore_categories", site?.language, site?.defaultCountry) || "Explore Categories"}
            </h3>
            <div className="w-12 h-0.5 rounded-full" style={{ backgroundColor: themeAccentColor, opacity: 0.6 }} />
          </div>

          {/* Scrollable Circular Badges Grid */}
          <div className="flex gap-4 sm:gap-6 lg:gap-8 overflow-x-auto py-3 px-2 no-scrollbar justify-start sm:justify-center items-center">
            {/* 'All Products' Circle */}
            {(() => {
              const isAllSelected = selectedCategory === 'all';
              return (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('all');
                    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="group flex flex-col items-center shrink-0 cursor-pointer transition-all outline-none"
                >
                  <div 
                    className={cn(
                      "w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full p-1 transition-all duration-300 relative flex items-center justify-center shadow-lg",
                      isAllSelected ? "scale-110 -translate-y-1" : "hover:scale-105 opacity-85 hover:opacity-100"
                    )}
                    style={{ 
                      borderWidth: isAllSelected ? '3px' : '2px',
                      borderStyle: 'solid',
                      borderColor: isAllSelected ? themeAccentColor : (isProDarkTheme ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'),
                      boxShadow: isAllSelected ? `0 0 18px ${themeAccentColor}70` : 'none'
                    }}
                  >
                    <div 
                      className="w-full h-full rounded-full flex flex-col items-center justify-center transition-all overflow-hidden"
                      style={{ 
                        background: isAllSelected ? themeAccentColor : (isProDarkTheme ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'),
                        color: isAllSelected ? '#ffffff' : (isProDarkTheme ? '#ffffff' : '#000000')
                      }}
                    >
                      <ShoppingBag className="w-6 h-6 sm:w-7 sm:h-7" />
                      <span className="text-[8px] sm:text-[9px] font-black uppercase mt-0.5 tracking-tighter">
                        {translate("all_short", site?.language, site?.defaultCountry) || "ALL"}
                      </span>
                    </div>
                  </div>
                  <span 
                    className={cn(
                      "text-[11px] sm:text-xs font-bold text-center line-clamp-1 max-w-[80px] sm:max-w-[100px] mt-2 transition-colors",
                      isAllSelected ? "font-black" : "opacity-70 group-hover:opacity-100"
                    )}
                    style={{ color: isAllSelected ? themeAccentColor : undefined }}
                  >
                    {translate("all_products", site?.language, site?.defaultCountry)}
                  </span>
                </button>
              );
            })()}

            {/* Configured Categories Circles */}
            {site.categories && site.categories.map((cat) => {
              if (cat.id === 'all') return null;
              const isSelected = selectedCategory === cat.id;

              return (
                <button
                  key={`circ-cat-${cat.id}`}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="group flex flex-col items-center shrink-0 cursor-pointer transition-all outline-none"
                >
                  <div 
                    className={cn(
                      "w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full p-1 transition-all duration-300 relative flex items-center justify-center shadow-lg",
                      isSelected ? "scale-110 -translate-y-1" : "hover:scale-105 opacity-85 hover:opacity-100"
                    )}
                    style={{ 
                      borderWidth: isSelected ? '3px' : '2px',
                      borderStyle: 'solid',
                      borderColor: isSelected ? themeAccentColor : (isProDarkTheme ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'),
                      boxShadow: isSelected ? `0 0 18px ${themeAccentColor}70` : 'none'
                    }}
                  >
                    <div className="w-full h-full rounded-full overflow-hidden relative flex items-center justify-center bg-black/20">
                      {cat.image ? (
                        <img 
                          src={cat.image} 
                          alt={cat.name} 
                          className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div 
                          className="w-full h-full rounded-full flex items-center justify-center font-black text-sm sm:text-base uppercase"
                          style={{ 
                            background: `linear-gradient(135deg, ${themeAccentColor}40, ${themeAccentColor}15)`,
                            color: themeAccentColor 
                          }}
                        >
                          {cat.name ? cat.name.charAt(0).toUpperCase() : '?'}
                        </div>
                      )}
                    </div>
                  </div>
                  <span 
                    className={cn(
                      "text-[11px] sm:text-xs font-bold text-center line-clamp-1 max-w-[80px] sm:max-w-[100px] mt-2 transition-colors",
                      isSelected ? "font-black" : "opacity-80 group-hover:opacity-100"
                    )}
                    style={{ color: isSelected ? themeAccentColor : undefined }}
                  >
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Categories Selection Bar & Main Product List */}
      <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-16 space-y-6 sm:space-y-12">

        {/* Category Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight uppercase text-white">{translate("collections_catalog", site?.language, site?.defaultCountry)}</h2>
            <p className="text-xs text-gray-500 font-medium font-sans">{translate("collections_subheading", site?.language, site?.defaultCountry)}</p>
          </div>

          {/* Categories Navigation Buttons to toggle collection view */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={cn(
                "px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border",
                selectedCategory === 'all' 
                  ? "active-category-btn bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg font-black border-rose-600" 
                  : "bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-gray-300 border-slate-300 dark:border-white/10 hover:bg-slate-300 dark:hover:bg-white/20"
              )}
            >
              {translate("all_products", site?.language, site?.defaultCountry)}
            </button>
            {site.categories && site.categories.map(cat => (
              cat.id !== 'all' && (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border",
                    selectedCategory === cat.id 
                      ? "active-category-btn bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg font-black border-rose-600" 
                      : "bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-gray-300 border-slate-300 dark:border-white/10 hover:bg-slate-300 dark:hover:bg-white/20"
                  )}
                >
                  {cat.name}
                </button>
              )
            ))}
          </div>
        </div>

        {/* Product Catalog Grid list display */}
        {filteredCatalog.length === 0 ? (
          <div className="py-20 text-center text-gray-500">
            <Search size={40} className="mx-auto text-gray-700 mb-3" />
            <p className="font-bold text-sm uppercase tracking-wider">{translate("no_product_found", site?.language, site?.defaultCountry)}</p>
            <p className="text-xs text-gray-600 mt-1">{translate("search_retry_keyword", site?.language, site?.defaultCountry)}</p>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {paginatedCatalog.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  cart={cart}
                  addToCart={addToCart}
                  handleOpenProductPopup={handleOpenProductPopup}
                  currencySymbol={getCurrencySymbol(site?.defaultCountry || 'Bangladesh')}
                  language={site?.language}
                  country={site?.defaultCountry}
                  isStarEnabled={site?.isStarEnabled !== false}
                />
              ))}
            </div>

            {/* Pagination UI Controls */}
            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-8 border-t border-white/5">
                {/* Previous Button */}
                <button
                  disabled={activePage === 1}
                  onClick={() => {
                    setCurrentPage(prev => Math.max(1, prev - 1));
                    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
                    activePage === 1
                      ? "bg-white/5 text-gray-600 cursor-not-allowed"
                      : "bg-white/10 text-gray-200 hover:bg-white/20"
                  )}
                >
                  {site?.language === 'bn' ? '← পূর্ববর্তী' : '← Prev'}
                </button>

                {/* Page Numbers */}
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  // Windowing for pagination if there are many pages (e.g. > 7)
                  const isNear = Math.abs(activePage - pageNum) <= 2;
                  const isEdge = pageNum === 1 || pageNum === totalPages;
                  if (!isNear && !isEdge) {
                    if (pageNum === 2 || pageNum === totalPages - 1) {
                      return (
                        <span key={`ellipsis-${pageNum}`} className="px-2 text-gray-500 font-bold text-xs">
                          ...
                        </span>
                      );
                    }
                    return null;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => {
                        setCurrentPage(pageNum);
                        document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      style={{
                        backgroundColor: activePage === pageNum ? themeAccentColor : 'rgba(255, 255, 255, 0.05)',
                        color: activePage === pageNum ? '#ffffff' : '#9ca3af'
                      }}
                      className={cn(
                        "w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center",
                        activePage === pageNum
                          ? "shadow-lg scale-105"
                          : "hover:bg-white/10"
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                {/* Next Button */}
                <button
                  disabled={activePage === totalPages}
                  onClick={() => {
                    setCurrentPage(prev => Math.min(totalPages, prev + 1));
                    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
                    activePage === totalPages
                      ? "bg-white/5 text-gray-600 cursor-not-allowed"
                      : "bg-white/10 text-gray-200 hover:bg-white/20"
                  )}
                >
                  {site?.language === 'bn' ? 'পরবর্তী →' : 'Next →'}
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* DEDICATED POPUP LANDING PAGE MODAL FOR ANY PRODUCT SELECTED */}
      <AnimatePresence>
        {viewingProduct && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 overflow-y-auto">

            {/* Dark overlay backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingProduct(null)}
              className="fixed inset-0 bg-black/95 backdrop-blur-xl"
            />

            {/* Modal popup block */}
            <motion.div
              ref={modalScrollRef}
              key={viewingProduct.id}
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-5xl bg-[#09090d] border border-white/10 rounded-[2.5rem] shadow-2xl p-6 sm:p-10 z-[130] max-h-[90vh] overflow-y-auto pro-popup-modal"
            >

              {/* Close trigger button */}
              <button
                onClick={() => setViewingProduct(null)}
                className="absolute right-4 top-4 sm:right-6 sm:top-6 p-3 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-full transition-all cursor-pointer z-[140] shadow-xl shadow-red-600/40 border border-red-500/50 hover:scale-105"
                title={site?.language === 'bn' ? "বন্ধ করুন" : "Close"}
              >
                <X size={18} strokeWidth={2.5} />
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 text-left">

                {/* Column 1: Static Image Showcase & Suggested Products list */}
                <div className="lg:col-span-12 xl:col-span-5 space-y-8">
                  {(() => {
                    const popupImages = (viewingProduct.images && Array.isArray(viewingProduct.images) && viewingProduct.images.filter(Boolean).length > 0 ? viewingProduct.images.filter(Boolean) : [viewingProduct.image]).filter(Boolean);
                    const popupVideoEmbed = getYoutubeEmbedUrl(viewingProduct.videoUrl || '');
                    return (
                      <div className="sticky top-0 space-y-4">
                        <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden bg-white/2 border border-white/5 shadow-2xl">
                          {showPopupVideoPlayer && popupVideoEmbed ? (
                            <iframe
                              src={popupVideoEmbed}
                              className="w-full h-full border-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                              title="YouTube Video Player"
                            />
                          ) : (
                            <img
                              src={popupActiveImage || popupImages[0] || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80'}
                              alt={viewingProduct.name}
                              className="w-full h-full object-cover transition-all duration-300"
                            />
                          )}

                          {viewingProduct.comparePrice && viewingProduct.comparePrice > viewingProduct.price && (
                            <div className="absolute top-4 left-4 bg-rose-500 text-white px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                              {translate("discount_tag_text", site?.language, site?.defaultCountry)}
                            </div>
                          )}
                        </div>

                        {(popupImages.length > 1 || !!popupVideoEmbed) && (
                          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
                            {popupImages.map((imgUrl: string, idx: number) => {
                              const isSelected = !showPopupVideoPlayer && (popupActiveImage === imgUrl || (!popupActiveImage && idx === 0));
                              return (
                                <div
                                  key={idx}
                                  onClick={() => {
                                    setShowPopupVideoPlayer(false);
                                    setPopupActiveImage(imgUrl);
                                  }}
                                  className={cn(
                                    "aspect-square rounded-xl overflow-hidden border-2 cursor-pointer hover:opacity-100 transition-all duration-200",
                                    isSelected
                                      ? "border-dragon-cyan scale-[1.03] shadow-lg shadow-dragon-cyan/20"
                                      : "border-white/5 opacity-60 hover:opacity-100"
                                  )}
                                >
                                  <img src={imgUrl} className="w-full h-full object-cover" alt="" />
                                </div>
                              );
                            })}

                            {/* YouTube Video play button box */}
                            {!!popupVideoEmbed && (
                              <div
                                onClick={() => {
                                  setShowPopupVideoPlayer(true);
                                }}
                                className={cn(
                                  "aspect-square rounded-xl overflow-hidden border-2 cursor-pointer flex flex-col items-center justify-center gap-1 text-center bg-red-600/10 hover:bg-red-600/20 active:bg-red-600/30 transition-all duration-200",
                                  showPopupVideoPlayer
                                    ? "border-red-500 scale-[1.03] shadow-lg shadow-red-500/20"
                                    : "border-red-500/30 opacity-60 hover:opacity-100"
                                )}
                              >
                                <Youtube className="w-6 h-6 text-red-500 animate-pulse" />
                                <span className="text-[9px] font-black uppercase tracking-wider text-red-500">{translate("watch_video", site?.language, site?.defaultCountry)}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Column 2: Details metadata, specifications inputs form, Location Delivery checkout counter */}
                <div className="lg:col-span-12 xl:col-span-7 space-y-6">

                  {/* Tab Selector for Details vs Reviews inside Popup */}
                  {site?.isStarEnabled !== false && (
                    <div className="flex border-b border-white/10 pb-1 mb-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setPopupActiveTab('details')}
                        className={cn(
                          "pb-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer",
                          popupActiveTab === 'details'
                            ? "border-dragon-cyan text-dragon-cyan"
                            : "border-transparent text-gray-400 hover:text-white"
                        )}
                      >
                        Details & Order (ডিটেইলস ও অর্ডার)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPopupActiveTab('reviews')}
                        className={cn(
                          "pb-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer",
                          popupActiveTab === 'reviews'
                            ? "border-dragon-cyan text-dragon-cyan"
                            : "border-transparent text-gray-400 hover:text-white"
                        )}
                      >
                        Reviews & Ratings (গ্রাহক রিভিউ)
                      </button>
                    </div>
                  )}

                  {popupActiveTab === 'details' || site?.isStarEnabled === false ? (
                    <div className="space-y-6">
                      {/* Title & dynamic Pricing options */}
                      <div className="space-y-2">
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-indigo-400">
                      Product Premium Showcase
                    </div>
                    <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight">{viewingProduct.name}</h2>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-2xl sm:text-3xl font-sans font-black theme-price text-white">
                        {getCurrencySymbol(site?.defaultCountry || 'Bangladesh')}{viewingProduct.price} {site?.defaultCountry === 'Bangladesh' ? 'BDT' : ''}
                      </span>
                      {viewingProduct.comparePrice && viewingProduct.comparePrice > viewingProduct.price && (
                        <>
                          <span className="text-rose-500 line-through text-base sm:text-lg font-bold">
                            {getCurrencySymbol(site?.defaultCountry || 'Bangladesh')}{viewingProduct.comparePrice}
                          </span>
                          {viewingProduct.discount && viewingProduct.discount > 0 ? (
                            <span className="text-emerald-400 text-xs font-black bg-emerald-500/10 px-2 py-1 rounded-full">
                              {Math.round(viewingProduct.discount)}% {translate("discount_tag_text", site?.language, site?.defaultCountry)}
                            </span>
                          ) : null}
                        </>
                      )}
                    </div>

                    {/* Star ratings and sold count metrics if enabled */}
                    {site?.isStarEnabled !== false && (
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-sans">
                        <div className="flex items-center gap-1 text-amber-400 font-black bg-amber-400/10 px-2 py-1 rounded-lg border border-amber-400/20 shadow-sm">
                          <Star size={12} fill="currentColor" className="text-amber-400 shrink-0" />
                          <span>4.9</span>
                        </div>
                        <span className="text-gray-600 font-light">•</span>
                        <div className="text-gray-400 font-semibold flex items-center gap-1 bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg">
                          <span className="text-emerald-400 font-black">120+</span> 
                          <span>Sold</span>
                        </div>
                        <span className="text-gray-600 font-light">•</span>
                        <button 
                          type="button"
                          onClick={() => setPopupActiveTab('reviews')}
                          className="text-dragon-cyan hover:underline font-black uppercase text-[10px] tracking-wider"
                        >
                          See Reviews
                        </button>
                      </div>
                    )}

                    {/* Dynamic Warranty / Guarantee Badges */}
                    {(viewingProduct.hasWarranty || viewingProduct.hasReplacement) && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {viewingProduct.hasWarranty && viewingProduct.warrantyDuration && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-dragon-cyan/10 border border-dragon-cyan/25 rounded-xl text-dragon-cyan text-[10px] font-black uppercase">
                            <ShieldCheck size={12} className="shrink-0" />
                            <span>{viewingProduct.warrantyDuration} {translate("service_warranty", site?.language, site?.defaultCountry)}</span>
                          </div>
                        )}
                        {viewingProduct.hasReplacement && viewingProduct.replacementDuration && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-emerald-400 text-[10px] font-black uppercase">
                            <CheckCircle size={12} className="shrink-0" />
                            <span>{viewingProduct.replacementDuration} {translate("replacement_guarantee", site?.language, site?.defaultCountry)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Highlights Bullet Information Details / Product Description */}
                  <div className="p-4 bg-white/2 border border-white/5 rounded-2xl space-y-2 text-left">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-dragon-cyan mb-2">
                      {translate("full_details_heading", site?.language, site?.defaultCountry)}
                    </h4>
                    {viewingProduct.details ? (
                      <div className="text-xs text-gray-300 leading-relaxed font-sans whitespace-pre-line pr-1">
                        {viewingProduct.details}
                      </div>
                    ) : (
                      <ul className="text-xs text-gray-400 space-y-1.5 list-disc pl-4">
                        <li>{translate("bullet_premium_quality", site?.language, site?.defaultCountry)}</li>
                        <li>{translate("bullet_cod_facility", site?.language, site?.defaultCountry)}</li>
                        <li>{translate("bullet_safe_delivery", site?.language, site?.defaultCountry)}</li>
                      </ul>
                    )}
                  </div>

                  {/* Specifications selectors for Color, Size, Weight custom selection chips */}
                  <div className="space-y-4 pt-2">
                    {selectedItemsVariants.map((itemVal, idx) => {
                      const showColors = colorsList.length > 0;
                      const showSizes = sizesList.length > 0;
                      const showWeights = weightsList.length > 0;

                      if (!showColors && !showSizes && !showWeights) return null;

                      // Calculate adaptive column structure based on available specifications
                      const specsCount = [showColors, showSizes, showWeights].filter(Boolean).length;

                      return (
                        <div
                          key={idx}
                          className={cn(
                            "rounded-2xl transition-all space-y-4 border border-white/5 bg-white/2 p-4",
                            popupQuantity > 1 ? "brightness-100" : "border-none !p-0 !bg-transparent"
                          )}
                        >
                          {popupQuantity > 1 && (
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                              <span className="text-[10px] font-black uppercase text-dragon-cyan tracking-widest">
                                {translate("product_option_detail", site?.language, site?.defaultCountry).replace("{{index}}", String(idx + 1))}
                              </span>
                            </div>
                          )}

                          <div
                            className={cn(
                              "grid gap-4",
                              specsCount === 3 ? "grid-cols-1 sm:grid-cols-3" :
                              specsCount === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
                            )}
                          >
                            {/* Color custom option chips selection */}
                            {showColors && (
                              <div className="space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white block">{translate("select_color", site?.language, site?.defaultCountry)}</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {colorsList.map(color => (
                                    <button
                                      type="button"
                                      key={color}
                                      onClick={() => {
                                        setSelectedItemsVariants(prev => {
                                          const updated = [...prev];
                                          if (updated[idx]) {
                                            updated[idx] = { ...updated[idx], color };
                                          }
                                          return updated;
                                        });
                                        if (idx === 0) setSelectedColor(color);
                                      }}
                                      className={cn(
                                        "px-2.5 py-1.5 rounded-lg text-[10px] font-semibold uppercase border transition-all cursor-pointer pro-variant-btn",
                                        itemVal.color === color
                                          ? "active border-dragon-cyan bg-dragon-cyan/10 text-white font-black"
                                          : "border-white/10 text-gray-400 hover:border-white/25"
                                      )}
                                    >
                                      {color}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Size option chips selection */}
                            {showSizes && (
                              <div className="space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white block">{translate("select_size", site?.language, site?.defaultCountry)}</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {sizesList.map(size => (
                                    <button
                                      type="button"
                                      key={size}
                                      onClick={() => {
                                        setSelectedItemsVariants(prev => {
                                          const updated = [...prev];
                                          if (updated[idx]) {
                                            updated[idx] = { ...updated[idx], size };
                                          }
                                          return updated;
                                        });
                                        if (idx === 0) setSelectedSize(size);
                                      }}
                                      className={cn(
                                        "px-2.5 py-1.5 rounded-lg text-[10px] font-semibold uppercase border transition-all cursor-pointer pro-variant-btn",
                                        itemVal.size === size
                                          ? "active border-dragon-cyan bg-dragon-cyan/10 text-white font-black"
                                          : "border-white/10 text-gray-400 hover:border-white/25"
                                      )}
                                    >
                                      {size}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Weight options chips selector */}
                            {showWeights && (
                              <div className="space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white block">{translate("select_weight", site?.language, site?.defaultCountry)}</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {weightsList.map(w => (
                                    <button
                                      type="button"
                                      key={w}
                                      onClick={() => {
                                        setSelectedItemsVariants(prev => {
                                          const updated = [...prev];
                                          if (updated[idx]) {
                                            updated[idx] = { ...updated[idx], weight: w };
                                          }
                                          return updated;
                                        });
                                        if (idx === 0) setSelectedWeight(w);
                                      }}
                                      className={cn(
                                        "px-2.5 py-1.5 rounded-lg text-[10px] font-semibold uppercase border transition-all cursor-pointer pro-variant-btn",
                                        itemVal.weight === w
                                          ? "active border-dragon-cyan bg-dragon-cyan/10 text-white font-black"
                                          : "border-white/10 text-gray-400 hover:border-white/25"
                                      )}
                                    >
                                      {w}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Quantity Selector Section */}
                  <div className="flex items-center justify-between p-3.5 bg-white/2 border border-white/5 rounded-2xl">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white shrink-0">
                      {translate("quantity", site?.language, site?.defaultCountry)}:
                    </span>
                    <div className="flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setPopupQuantity(p => Math.max(1, p - 1))}
                        className="px-3.5 py-2 text-gray-400 hover:text-white hover:bg-white/5 transition-all text-sm font-bold"
                      >
                        <Minus size={14}/>
                      </button>
                      <span className="px-5 font-bold text-xs text-white border-x border-white/10">{popupQuantity}</span>
                      <button
                        type="button"
                        onClick={() => setPopupQuantity(p => p + 1)}
                        className="px-3.5 py-2 text-gray-400 hover:text-white hover:bg-white/5 transition-all text-sm font-bold"
                      >
                        <Plus size={14}/>
                      </button>
                    </div>
                  </div>

                  {/* COUNTRY & REGION ORIENTED CUSTOMER INPUT CHECKOUT BOX */}
                  <div className="bg-black/40 border border-white/5 p-6 rounded-2xl space-y-4 pro-order-form-box">
                    <h3 className="font-sans font-black text-xs uppercase tracking-widest text-dragon-cyan border-b border-white/5 pb-2">
                      {translate("order_form_heading", site.language, popupCheckoutData.country || site.defaultCountry)}
                    </h3>

                    {popupOrderStatus === 'success' ? (
                      <div className="py-8 text-center space-y-4">
                        <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-xl">
                          <CheckCircle size={32} />
                        </div>
                        <h4 className="text-xl font-black text-white uppercase tracking-tight">{translate("order_success_title", site.language, popupCheckoutData.country || site.defaultCountry)}</h4>
                        <p className="text-xs text-gray-400 leading-relaxed font-sans max-w-sm mx-auto">
                          {translate("order_success_desc", site.language, popupCheckoutData.country || site.defaultCountry)}
                        </p>
                        {lastPlacedOrderId && (
                          <div className="pt-2 space-y-3">
                            <p className="text-xs font-mono text-dragon-cyan bg-dragon-cyan/10 border border-dragon-cyan/20 py-2 px-4 rounded-xl select-all inline-block">
                              Order ID: <span className="font-bold">{lastPlacedOrderId}</span>
                            </p>
                            <div>
                              <a
                                href={`/track-order/${lastPlacedOrderId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-3 bg-gradient-to-r from-dragon-cyan to-dragon-purple hover:brightness-110 text-black font-black uppercase tracking-widest text-[11px] rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all"
                              >
                                <Truck size={14} /> Track Order Live / লাইভ ট্র্যাকিং দেখুন
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <form onSubmit={handlePopupSubmitOrder} className="space-y-4 text-left">

                        {/* Delivery Location Selector Buttons */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block flex items-center gap-1">
                            <Truck size={11} className="text-dragon-cyan" />
                            {translate("delivery_charge_by_loc", site.language, site.defaultCountry)}
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => setPopupCheckoutData({ ...popupCheckoutData, location: 'dhaka_inside' })}
                              className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer pro-delivery-btn ${
                                popupCheckoutData.location === 'dhaka_inside'
                                  ? 'active bg-dragon-cyan/25 border-dragon-cyan text-white shadow-lg shadow-dragon-cyan/10'
                                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                              }`}
                            >
                              <span className="font-extrabold text-[11px] sm:text-xs">{labelInside}</span>
                              <span className="text-[9px] opacity-75 font-medium">{getCurrencySymbol(popupCheckoutData.country)}{chargeInside} {translate("delivery_charge", site.language, site.defaultCountry)}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setPopupCheckoutData({ ...popupCheckoutData, location: 'dhaka_outside' })}
                              className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer pro-delivery-btn ${
                                popupCheckoutData.location === 'dhaka_outside'
                                  ? 'active bg-dragon-cyan/25 border-dragon-cyan text-white shadow-lg shadow-dragon-cyan/10'
                                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                              }`}
                            >
                              <span className="font-extrabold text-[11px] sm:text-xs">{labelOutside}</span>
                              <span className="text-[9px] opacity-75 font-medium">{getCurrencySymbol(popupCheckoutData.country)}{chargeOutside} {translate("delivery_charge", site.language, site.defaultCountry)}</span>
                            </button>
                          </div>

                          {/* এলাকা ভিত্তিক ডেলিভারী চার্জ (Custom Area Selector) */}
                          {site?.customDeliveryCharges && site.customDeliveryCharges.length > 0 && (
                            <div className="space-y-1.5 pt-2 animate-in fade-in duration-300">
                              <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block flex items-center gap-1">
                                <Truck size={11} className="text-dragon-gold" />
                                {translate("or_select_specific_area", site.language, site.defaultCountry)}
                              </label>
                              <div className="relative">
                                <select
                                  value={popupCheckoutData.location.startsWith('custom_') ? popupCheckoutData.location : ''}
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      setPopupCheckoutData({ ...popupCheckoutData, location: e.target.value });
                                    } else {
                                      setPopupCheckoutData({ ...popupCheckoutData, location: 'dhaka_inside' });
                                    }
                                  }}
                                  className="w-full px-4 py-2.5 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-dragon-cyan cursor-pointer appearance-none pro-input-field"
                                >
                                  <option value="" className="bg-[#09090d] text-gray-400 pro-option">{translate("choose_area", site.language, site.defaultCountry)}</option>
                                  {site.customDeliveryCharges.map((item, index) => (
                                    <option key={`pub-custom-charge-${index}`} value={`custom_${index}`} className="bg-[#09090d] text-white pro-option">
                                      {item.area} — {getCurrencySymbol(popupCheckoutData.country)}{item.charge} {translate("delivery_charge", site.language, site.defaultCountry)}
                                    </option>
                                  ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">
                                  ▼
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Country Selector (৭০ টি দেশ এ সাজানো) - Hidden as requested by user */}
                        <div className="hidden space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">{translate("country_select", site.language, site.defaultCountry)}</label>
                          <div className="relative">
                            <select
                              required
                              value={popupCheckoutData.country}
                              onChange={(e) => setPopupCheckoutData({ ...popupCheckoutData, country: e.target.value })}
                              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-dragon-cyan cursor-pointer appearance-none"
                            >
                              {COUNTRIES.map((cty) => (
                                <option key={cty.name} value={cty.name} style={{ backgroundColor: '#121624', color: '#ffffff' }} className="bg-[#121624] text-white">
                                  {cty.name} {cty.bengaliName && cty.bengaliName !== cty.name ? `(${cty.bengaliName})` : ''}
                                </option>
                              ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">
                              ▼
                            </div>
                          </div>
                        </div>

                        {/* Customer details dynamic fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {getCheckoutFormFields(popupCheckoutData.country)
                            .filter(field => field.key !== 'location')
                            .map((field) => {
                            if (field.type === 'select') {
                              return (
                                <div key={field.key} className="space-y-1.5 sm:col-span-2">
                                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                                    {getFieldLabel(field)} {field.required && <span className="text-rose-500">*</span>}
                                  </label>
                                  <div className="relative">
                                    <select
                                      required={field.required}
                                      value={(popupCheckoutData as any)[field.key] || ''}
                                      onChange={(e) => setPopupCheckoutData({...popupCheckoutData, [field.key]: e.target.value})}
                                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-dragon-cyan cursor-pointer appearance-none pro-input-field"
                                    >
                                      <option value="" className="bg-[#09090d] text-gray-400 font-medium pro-option">Choose...</option>
                                      {field.options?.map((opt) => (
                                        <option key={opt.value} value={opt.value} className="bg-[#09090d] text-white pro-option">
                                          {site?.language === 'en' ? opt.label : (opt.labelBn || opt.label)}
                                        </option>
                                      ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">
                                      ▼
                                    </div>
                                  </div>
                                </div>
                              );
                            }

                            if (field.type === 'textarea') {
                              return (
                                <div key={field.key} className="space-y-1.5 sm:col-span-2">
                                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                                    {getFieldLabel(field)} {field.required && <span className="text-rose-500">*</span>}
                                  </label>
                                  <textarea
                                    required={field.required}
                                    placeholder={getFieldPlaceholder(field)}
                                    rows={2}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-dragon-cyan resize-none pro-input-field"
                                    value={(popupCheckoutData as any)[field.key] || ''}
                                    onChange={(e) => setPopupCheckoutData({...popupCheckoutData, [field.key]: e.target.value})}
                                  />
                                </div>
                              );
                            }

                            return (
                              <div key={field.key} className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                                  {getFieldLabel(field)} {field.required && <span className="text-rose-500">*</span>}
                                </label>
                                <input
                                  required={field.required}
                                  type={field.type}
                                  placeholder={getFieldPlaceholder(field)}
                                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-dragon-cyan pro-input-field"
                                  value={(popupCheckoutData as any)[field.key] || ''}
                                  onChange={(e) => setPopupCheckoutData({...popupCheckoutData, [field.key]: e.target.value})}
                                />
                              </div>
                            );
                          })}
                        </div>

                        {/* Subtotal calculation billing metrics */}
                        <div className="p-3.5 bg-white/2 rounded-xl text-xs border border-white/5 space-y-2 pro-billing-box">
                          <div className="flex justify-between">
                            <span className="text-gray-400">{translate("subtotal", site.language, popupCheckoutData.country || site.defaultCountry)}:</span>
                            <span className="font-bold text-white">{getCurrencySymbol(popupCheckoutData.country)}{viewingProduct.price * popupQuantity}</span>
                          </div>
                          <div className="flex justify-between font-medium">
                            <span className="text-gray-400">{translate("delivery_charge", site.language, popupCheckoutData.country || site.defaultCountry)} ({getActiveDeliveryLabel()}):</span>
                            <span className="font-bold text-amber-400">{getCurrencySymbol(popupCheckoutData.country)}{getActiveDeliveryCharge()}</span>
                          </div>
                          <div className="border-t border-white/5 pt-1.5 flex justify-between font-bold text-sm">
                            <span className="text-white">{translate("total", site.language, popupCheckoutData.country || site.defaultCountry)}:</span>
                            <span className="text-dragon-cyan font-black">{getCurrencySymbol(popupCheckoutData.country)}{viewingProduct.price * popupQuantity + getActiveDeliveryCharge()} {COUNTRIES.find(c => c.name === popupCheckoutData.country)?.currency || 'BDT'}</span>
                          </div>
                        </div>

                        {/* Order Placement and direct Whatsapp Contact button controls */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">

                          {/* SUBMIT ORDER BUTTON - সাবমিট অর্ডার বাটন */}
                          <button
                            type="submit"
                            disabled={popupOrderStatus === 'loading'}
                            className="flex-1 py-4 themes-accent-bg bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:brightness-110 shadow-lg cursor-pointer transition-all flex items-center justify-center gap-2"
                            style={{ backgroundColor: customBtnBg, color: customBtnText }}
                          >
                            {popupOrderStatus === 'loading' ? <Loader2 className="animate-spin w-4 h-4 text-white" /> : translate("place_order_btn", site.language, popupCheckoutData.country || site.defaultCountry)}
                          </button>

                          {/* CONTACT SUPPORT BUTTON - যোগাযোগ বাটন */}
                          {site.footer?.whatsapp && (
                            <a
                              href={`https://wa.me/${site.footer.whatsapp.replace('+', '')}?text=${encodeURIComponent(`Hi! I am interested in ordering "${viewingProduct.name}" (Color: ${selectedColor}, Size: ${selectedSize}) from your store.`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shrink-0"
                            >
                              <MessageCircle size={15} />
                              {translate("contact_btn", site.language, popupCheckoutData.country || site.defaultCountry)}
                            </a>
                          )}

                        </div>

                        {/* COMPACT ADD TO CART BUTTON AT THE BOTTOM OF THE ORDER FORM */}
                        <div className="pt-2 flex justify-center border-t border-white/5 mt-3">
                          <button
                            type="button"
                            disabled={addedToCart}
                            onClick={() => {
                              addToCart(viewingProduct, popupQuantity, selectedItemsVariants);
                              setAddedToCart(true);
                              setTimeout(() => {
                                setAddedToCart(false);
                                setViewingProduct(null); // Close the popup
                                setShowCart(true); // Open the cart drawer
                              }, 1200);
                            }}
                            className={cn(
                              "w-full sm:w-auto px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95 hover:scale-[1.02] border border-white/10",
                              addedToCart
                                ? "bg-emerald-600 text-white border-emerald-500"
                                : "bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white"
                            )}
                          >
                            {addedToCart ? (
                              <>
                                <CheckCircle size={14} className="animate-bounce text-white" />
                                <span>{site?.language === 'bn' ? "✓ কার্টে যোগ করা হয়েছে" : "✓ Added to Cart"}</span>
                              </>
                            ) : (
                              <>
                                <ShoppingCart size={14} className="text-dragon-cyan" />
                                <span>{translate("add_to_cart", site?.language, site?.defaultCountry)} ({site?.language === 'bn' ? 'কার্টে রাখুন' : 'Add to Cart'})</span>
                              </>
                            )}
                          </button>
                        </div>

                      </form>
                    )}

                  </div>
                    </div>
                  ) : (
                    <ProductReviewsSection 
                      websiteId={site?.id} 
                      productId={viewingProduct.id} 
                      productName={viewingProduct.name} 
                      ownerId={site?.userId}
                    />
                  )}

                </div>

              </div>

              {/* SUGGESTED PRODUCTS - ৪ টি সাজেসশন প্রডাক্ট - Moved to absolute bottom below checkout form */}
              {suggestedProducts.length > 0 && (
                <div className="mt-8 pt-8 border-t border-white/10 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-[#2e2] flex items-center gap-1.5 justify-start text-left">
                    <Sparkles size={12} className="text-amber-400 animate-pulse" />
                    {translate("suggestions_subheading", site.language, popupCheckoutData.country || site.defaultCountry)}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    {suggestedProducts.map(item => (
                      <div
                        key={item.id}
                        onClick={() => handleOpenProductPopup(item)}
                        className="group cursor-pointer p-3 rounded-2xl bg-white/2 border border-white/5 hover:border-dragon-cyan/40 hover:bg-white/5 transition-all space-y-2 flex flex-col justify-between"
                        title={item.name}
                      >
                        <div className="space-y-2">
                          <div className="relative aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10 transition-all">
                            <img src={item.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          </div>
                          <p className="text-[11px] text-gray-400 group-hover:text-white line-clamp-1 font-semibold text-left">{item.name}</p>
                          <p className="text-[11px] theme-price font-bold theme-accent text-left">{getCurrencySymbol(popupCheckoutData.country)}{item.price}</p>
                        </div>
                        <button
                          type="button"
                          className="w-full mt-2 py-1.5 border rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer theme-btn-secondary"
                        >
                          <ShoppingBag size={10} className="shrink-0" />
                          {translate("order_now", site.language, site.defaultCountry)}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FOOTER POLICY DETAILS POPUP MODAL */}
      <AnimatePresence>
        {selectedPolicyPage && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            {/* Backdrop with elegant blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPolicyPage(null)}
              className="fixed inset-0 bg-black/90 backdrop-blur-md"
            />
            {/* Modal block */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl bg-[#0c0c10] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-3xl z-[160] max-h-[80vh] overflow-y-auto flex flex-col justify-between"
            >
              <button
                onClick={() => setSelectedPolicyPage(null)}
                className="absolute right-5 top-5 p-2 bg-white/5 border border-white/10 text-white rounded-full hover:bg-white hover:text-black transition-all cursor-pointer"
                aria-label="Close"
              >
                <X size={14} />
              </button>

              <div className="space-y-6 text-left">
                <div className="border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2 text-dragon-cyan font-black uppercase text-[10px] tracking-widest mb-1">
                    <ShieldCheck size={14} /> SECURE VERIFIED PAGE
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">{selectedPolicyPage.title}</h2>
                </div>

                <div className="text-sm text-gray-300 leading-relaxed space-y-4 whitespace-pre-wrap font-sans font-medium">
                  {selectedPolicyPage.content}
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-mono">
                  <ShieldCheck size={12} className="text-emerald-500" />
                  <span>Google Firebase SSL SECURED CONNECTION</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPolicyPage(null)}
                  className="w-full sm:w-auto px-6 py-2.5 bg-white text-black font-black uppercase text-xs rounded-xl hover:bg-gray-200 transition-all cursor-pointer tracking-wider"
                >
                  {translate("alert_ok", site.language, site.defaultCountry)}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MY ORDERS LOOKUP DRAWER MODAL */}
      <AnimatePresence>
        {showMyOrders && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMyOrders(false)}
              className="fixed inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-xl bg-[#0c0c10] border border-white/10 rounded-[2rem] p-6 sm:p-10 shadow-3xl z-[160] max-h-[85vh] overflow-y-auto"
            >

              <button
                onClick={() => setShowMyOrders(false)}
                className="absolute right-6 top-6 p-3 bg-white/5 border border-white/10 text-white rounded-full hover:bg-white hover:text-black transition-all cursor-pointer"
              >
                <X size={14} />
              </button>

              <div className="space-y-6">

                <div className="space-y-1.5 text-left border-b border-white/5 pb-4">
                  <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2.5">
                    <ShoppingBag size={20} className="text-dragon-cyan" />
                    {translate("my_orders_tab", site.language, site.defaultCountry)}
                  </h2>
                  <p className="text-xs text-gray-400">{translate("my_orders_desc", site.language, site.defaultCountry)}</p>
                </div>

                {loadingOrders ? (
                  <div className="py-12 text-center text-gray-500">
                    <Loader2 className="animate-spin text-dragon-cyan mx-auto w-8 h-8 mb-2" />
                    <span className="text-xs font-bold font-sans uppercase tracking-widest text-gray-400">{translate("retrieving_orders", site.language, site.defaultCountry)}</span>
                  </div>
                ) : myOrdersList.length === 0 ? (
                  <div className="py-12 text-center text-gray-500 space-y-3">
                    <ShoppingBag size={48} className="mx-auto text-gray-800" />
                    <p className="font-bold text-sm uppercase tracking-wider">{translate("no_order_history", site.language, site.defaultCountry)}</p>
                    <p className="text-xs text-gray-600">{translate("no_order_history_desc", site.language, site.defaultCountry)}</p>
                  </div>
                ) : (
                  <div className="space-y-4 text-left">
                    {myOrdersList.map(item => {
                      const deliveryCost = Number(item.deliveryCharge) || 0;
                      const productCost = Number(item.sellPrice) || 0;
                      const orderTotal = productCost + deliveryCost;
                      const hasImage = !!item.productImage;
                      return (
                        <div key={item.id} className="p-4 bg-white/2 rounded-2xl border border-white/5 hover:border-white/10 transition-all space-y-4">
                          <div className="flex justify-between items-start gap-4 pb-3 border-b border-white/5">
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold text-gray-500 block">ORDER ID: #{item.id.substring(0, 8).toUpperCase()}</span>
                              <p className="text-[10px] text-gray-400">{translate("order_date", site.language, site.defaultCountry)}: {new Date(item.createdAt).toLocaleDateString()}</p>
                            </div>

                            {/* Deliver tracking status label config badge */}
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                              item.status === 'pending' ? "bg-amber-500/10 text-amber-400 border border-amber-500/15" :
                              item.status === 'confirmed' ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/15" :
                              item.status === 'delivered' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" :
                              "bg-gray-500/10 text-gray-400 border border-white/5"
                            )}>
                              {item.status === 'pending' ? translate("status_pending", site.language, site.defaultCountry) :
                               item.status === 'confirmed' ? translate("status_confirmed", site.language, site.defaultCountry) :
                               item.status === 'delivered' ? translate("status_delivered", site.language, site.defaultCountry) : item.status}
                            </span>
                          </div>

                          {/* Product and Image Row */}
                          <div className="flex gap-3 items-center">
                            <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                              {hasImage ? (
                                <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <ShoppingBag className="text-gray-500 w-5 h-5" />
                              )}
                            </div>
                            <div className="flex-1 space-y-1">
                              <h4 className="font-bold text-xs text-white leading-tight">{item.productName}</h4>
                              <div className="flex flex-wrap gap-1.5 text-[10px] text-gray-400">
                                {item.color && (
                                  <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                    {translate("color", site.language, checkoutData.country)}: <span className="text-white font-semibold">{item.color}</span>
                                  </span>
                                )}
                                {item.size && (
                                  <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                    {translate("size", site.language, checkoutData.country)}: <span className="text-white font-semibold">{item.size}</span>
                                  </span>
                                )}
                                {item.quantity && (
                                  <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                    {translate("quantity", site.language, checkoutData.country)}: <span className="text-white font-semibold">{item.quantity}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Delivery Address Details */}
                          <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1.5 text-[11px]">
                            <p className="text-gray-500 text-[9px] font-bold uppercase tracking-wider">{translate("delivery_info", site.language, checkoutData.country)}</p>
                            <div className="space-y-0.5 text-gray-300">
                              <p className="font-bold text-white">{item.customerName || 'N/A'}</p>
                              <p className="text-dragon-cyan font-bold text-[10px]">{item.customerPhone || 'N/A'}</p>
                              <p className="text-gray-400 text-[10px] leading-relaxed mt-0.5">{item.customerAddress || 'N/A'}</p>
                            </div>
                          </div>

                          {/* Price breakdown */}
                          <div className="space-y-1 pt-1 text-[11px] font-semibold border-t border-white/5">
                            <div className="flex justify-between text-gray-400">
                              <span>{translate("product_price", site.language, checkoutData.country)}:</span>
                              <span className="font-mono text-white">৳{productCost} BDT</span>
                            </div>
                            <div className="flex justify-between text-gray-400">
                              <span>{translate("delivery_charge", site.language, checkoutData.country)}:</span>
                              <span className="font-mono text-white">৳{deliveryCost} BDT</span>
                            </div>
                            <div className="flex justify-between text-dragon-cyan font-black pt-1 border-t border-white/5 text-xs">
                              <span>{translate("total", site.language, checkoutData.country)}:</span>
                              <span className="font-mono">৳{orderTotal} BDT</span>
                            </div>
                          </div>

                          {item.courierTrackingId && (
                            <div className="p-2.5 bg-indigo-500/5 rounded-xl text-[10px] border border-indigo-500/10 space-y-1">
                              <p className="text-gray-400">{translate("courier_tracking", site.language, site.defaultCountry)}: <span className="text-[#a5b4fc] font-bold">{item.courierName || 'Standard Courier'} - {item.courierTrackingId}</span></p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cart Drawer Checkout Drawer */}
      <AnimatePresence>
        {showCart && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCart(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-[#0d0d12] border-l border-white/5 h-full shadow-2xl flex flex-col pro-cart-drawer"
            >
              <div className="p-4 sm:p-6 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-white">{translate("shopping_cart", site.language, checkoutData.country)}</h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="p-2 sm:p-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white hover:text-black transition-all cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4 font-sans no-scrollbar">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 space-y-3">
                    <ShoppingBag size={40} className="mx-auto block text-gray-700" />
                    <p className="font-bold text-xs uppercase tracking-wider">{translate("cart_empty", site.language, checkoutData.country)}</p>
                  </div>
                ) : (
                  cart.map((item, index) => {
                    const itemKey = item.selectedVariants && item.selectedVariants.length > 0
                      ? `${item.product.id}-${index}`
                      : item.product.id;
                    return (
                      <div key={itemKey} className="flex gap-3 sm:gap-4 p-3 sm:p-4 bg-white/2 rounded-xl sm:rounded-2xl border border-white/5 group">
                        <div className="w-12 sm:w-16 h-16 sm:h-20 rounded-lg sm:rounded-xl overflow-hidden shadow-md flex-shrink-0">
                          <img src={item.product.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80'} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 space-y-1 sm:space-y-1.5 text-left">
                          <div className="flex justify-between gap-2">
                            <h4 className="font-bold text-[11px] sm:text-xs text-white leading-tight line-clamp-1">{item.product.name}</h4>
                            <button onClick={() => removeFromCart(item.product.id, item.selectedVariants)} className="text-gray-500 hover:text-red-400 shrink-0">
                              <X size={13} />
                            </button>
                          </div>

                          {/* Render selected variants */}
                          {item.selectedVariants && item.selectedVariants.length > 0 && (
                            <div className="text-[9px] sm:text-[10px] text-gray-400 space-y-0.5 font-sans leading-tight">
                              {item.selectedVariants.map((v, i) => {
                                const parts = [];
                                if (v.color) parts.push(`${translate("select_color", site?.language, checkoutData.country)}: ${v.color}`);
                                if (v.size) parts.push(`${translate("select_size", site?.language, checkoutData.country)}: ${v.size}`);
                                if (v.weight) parts.push(`${translate("select_weight", site?.language, checkoutData.country)}: ${v.weight}`);
                                return parts.length > 0 ? (
                                  <div key={i} className="bg-white/5 px-2 py-0.5 rounded border border-white/10 inline-block mr-1 mb-1 font-medium">
                                    {parts.join(', ')}
                                  </div>
                                ) : null;
                              })}
                            </div>
                          )}

                          <p className="text-dragon-cyan font-black text-xs sm:text-sm">{getCurrencySymbol(checkoutData.country)}{item.product.price}</p>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center bg-white/5 border border-white/10 rounded-md sm:rounded-lg overflow-hidden">
                              <button onClick={() => updateQuantity(item.product.id, -1, item.selectedVariants)} className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-gray-400 hover:text-white"><Minus size={10}/></button>
                              <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 font-bold text-[10px] sm:text-xs border-x border-white/10 text-white">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.product.id, 1, item.selectedVariants)} className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-gray-400 hover:text-white"><Plus size={10}/></button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-4 sm:p-6 border-t border-white/5 bg-[#0a0a0e] space-y-3 sm:space-y-4 pro-cart-footer">
                  <div className="flex justify-between items-end">
                    <span className="text-gray-500 uppercase tracking-widest text-[9px] sm:text-[10px] font-black">{translate("total", site.language, checkoutData.country)}</span>
                    <span className="text-xl sm:text-2xl font-black text-white">{getCurrencySymbol(checkoutData.country)}{cartTotal}</span>
                  </div>

                  <div className="space-y-2.5 sm:space-y-3 text-left">
                    <h5 className="font-black text-[9px] sm:text-[10px] uppercase tracking-widest text-dragon-cyan border-b border-white/5 pb-1">{translate("order_form_heading", site.language, checkoutData.country)}</h5>
                    <form onSubmit={handleCheckout} className="space-y-2.5 sm:space-y-3">
                        {/* Country Selector - Hidden as requested by user */}
                        <div className="hidden space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{translate("country_select", site.language, site.defaultCountry)}</label>
                          <div className="relative">
                            <select
                              required
                              value={checkoutData.country}
                              onChange={(e) => setCheckoutData({...checkoutData, country: e.target.value})}
                              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none text-white focus:border-dragon-cyan text-xs font-semibold cursor-pointer appearance-none pro-input-field"
                            >
                              {COUNTRIES.map((cty) => (
                                <option key={cty.name} value={cty.name} style={{ backgroundColor: '#121624', color: '#ffffff' }} className="bg-[#121624] text-white pro-option">
                                  {cty.name} {cty.bengaliName && cty.bengaliName !== cty.name ? `(${cty.bengaliName})` : ''} ({cty.currency})
                                </option>
                              ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">
                              ▼
                            </div>
                          </div>
                        </div>

                        {getCheckoutFormFields(checkoutData.country)
                          .filter(field => field.key !== 'location')
                          .map((field) => {
                          if (field.type === 'select') {
                            return (
                              <div key={field.key} className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block text-left">
                                  {getFieldLabel(field)} {field.required && <span className="text-rose-500">*</span>}
                                </label>
                                <div className="relative text-left">
                                  <select
                                    required={field.required}
                                    value={(checkoutData as any)[field.key] || ''}
                                    onChange={(e) => setCheckoutData({...checkoutData, [field.key]: e.target.value})}
                                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/5 border border-white/10 rounded-lg sm:rounded-xl outline-none text-white focus:border-dragon-cyan text-xs font-semibold cursor-pointer appearance-none animate-fade-in pro-input-field"
                                  >
                                    <option value="" className="bg-zinc-900 text-gray-400 pro-option">Choose...</option>
                                    {field.options?.map((opt) => (
                                      <option key={opt.value} value={opt.value} className="bg-zinc-900 text-white pro-option">
                                        {site?.language === 'en' ? opt.label : (opt.labelBn || opt.label)}
                                      </option>
                                    ))}
                                  </select>
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">
                                    ▼
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          if (field.type === 'textarea') {
                            return (
                              <div key={field.key} className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block text-left">
                                  {getFieldLabel(field)} {field.required && <span className="text-rose-500">*</span>}
                                </label>
                                <textarea
                                  required={field.required}
                                  placeholder={getFieldPlaceholder(field)}
                                  rows={2}
                                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/5 border border-white/10 rounded-lg sm:rounded-xl outline-none text-white focus:border-dragon-cyan text-xs font-semibold resize-none pro-input-field"
                                  value={(checkoutData as any)[field.key] || ''}
                                  onChange={(e) => setCheckoutData({...checkoutData, [field.key]: e.target.value})}
                                />
                              </div>
                            );
                          }

                          return (
                            <div key={field.key} className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block text-left">
                                {getFieldLabel(field)} {field.required && <span className="text-rose-500">*</span>}
                              </label>
                              <input
                                required={field.required}
                                type={field.type}
                                placeholder={getFieldPlaceholder(field)}
                                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/5 border border-white/10 rounded-lg sm:rounded-xl outline-none text-white focus:border-dragon-cyan text-xs font-semibold pro-input-field"
                                value={(checkoutData as any)[field.key] || ''}
                                onChange={(e) => setCheckoutData({...checkoutData, [field.key]: e.target.value})}
                              />
                            </div>
                          );
                        })}

                        {/* Optional Color choose if color configs exist */}
                        {site.colors?.theme && (
                          <div className="space-y-1 pt-1 text-left">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Choose Color Option</label>
                            <select
                              value={checkoutData.selectedColor}
                              onChange={(e) => setCheckoutData({...checkoutData, selectedColor: e.target.value})}
                              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/5 border border-white/10 rounded-lg sm:rounded-xl outline-none text-gray-300 focus:border-dragon-cyan text-xs font-semibold"
                            >
                              <option value="">Default Color</option>
                              <option value="Black">Black</option>
                              <option value="Natural Titanium">Natural Titanium</option>
                              <option value="Blue">Blue Silver</option>
                            </select>
                          </div>
                        )}

                        {/* Cart Delivery Location Selector */}
                        <div className="space-y-1.5 pt-1.5 border-t border-white/5 text-left">
                          <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-gray-400 block flex items-center gap-1">
                            <Truck size={10} className="text-dragon-cyan" />
                            {translate("delivery_charge_by_loc", site.language, site.defaultCountry)}
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setCheckoutData({ ...checkoutData, location: 'dhaka_inside' })}
                              className={`py-2 px-2.5 rounded-lg sm:rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                                checkoutData.location === 'dhaka_inside'
                                  ? 'bg-dragon-cyan/25 border-dragon-cyan text-white shadow-lg shadow-dragon-cyan/10'
                                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                              }`}
                            >
                              <span className="font-extrabold text-[10px] sm:text-xs">{labelInside}</span>
                              <span className="text-[8px] sm:text-[9px] opacity-75 font-medium">{getCurrencySymbol(checkoutData.country)}{chargeInside}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setCheckoutData({ ...checkoutData, location: 'dhaka_outside' })}
                              className={`py-2 px-2.5 rounded-lg sm:rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                                checkoutData.location === 'dhaka_outside'
                                  ? 'bg-dragon-cyan/25 border-dragon-cyan text-white shadow-lg shadow-dragon-cyan/10'
                                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                              }`}
                            >
                              <span className="font-extrabold text-[10px] sm:text-xs">{labelOutside}</span>
                              <span className="text-[8px] sm:text-[9px] opacity-75 font-medium">{getCurrencySymbol(checkoutData.country)}{chargeOutside}</span>
                            </button>
                          </div>

                          {/* Cart Custom Area Selector */}
                          {site?.customDeliveryCharges && site.customDeliveryCharges.length > 0 && (
                            <div className="space-y-1 pt-1 animate-in fade-in duration-300">
                              <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-gray-400 block flex items-center gap-1">
                                <Truck size={10} className="text-dragon-gold" />
                                {translate("or_select_specific_area", site.language, site.defaultCountry)}
                              </label>
                              <div className="relative">
                                <select
                                  value={checkoutData.location.startsWith('custom_') ? checkoutData.location : ''}
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      setCheckoutData({ ...checkoutData, location: e.target.value });
                                    } else {
                                      setCheckoutData({ ...checkoutData, location: 'dhaka_inside' });
                                    }
                                  }}
                                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-zinc-900 border border-white/10 rounded-lg sm:rounded-xl text-xs text-white outline-none focus:border-dragon-cyan cursor-pointer appearance-none animate-none"
                                >
                                  <option value="" className="bg-[#09090d] text-gray-400">{translate("choose_area", site.language, site.defaultCountry)}</option>
                                  {site.customDeliveryCharges.map((item, index) => (
                                    <option key={`cart-custom-charge-${index}`} value={`custom_${index}`} className="bg-[#09090d] text-white">
                                      {item.area} — {getCurrencySymbol(checkoutData.country)}{item.charge}
                                    </option>
                                  ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">
                                  ▼
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Live Total Bill Breakdown Summary */}
                        <div className="bg-white/[0.02] border border-white/5 p-3 sm:p-4 rounded-lg sm:rounded-xl space-y-1.5 sm:space-y-2 text-xs text-left animate-in fade-in duration-150">
                          <div className="flex justify-between items-center text-gray-400">
                            <span>Subtotal:</span>
                            <span className="font-mono text-white font-bold">{getCurrencySymbol(checkoutData.country)}{cartTotal}</span>
                          </div>
                          <div className="flex justify-between items-center text-gray-400">
                            <span>Delivery Charge:</span>
                            <span className="font-mono text-white font-bold">+{getCurrencySymbol(checkoutData.country)}{getCartDeliveryCharge()}</span>
                          </div>
                          <div className="flex justify-between items-center border-t border-white/5 pt-1.5 sm:pt-2 text-sm font-black text-dragon-cyan">
                            <span>Total Amount:</span>
                            <span className="font-mono">{getCurrencySymbol(checkoutData.country)}{cartTotal + getCartDeliveryCharge()}</span>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={orderStatus === 'loading'}
                          className="w-full py-3 sm:py-4 rounded-lg sm:rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 theme-btn hover:brightness-110"
                        >
                          {orderStatus === 'loading' ? <Loader2 className="animate-spin text-white" /> : translate("place_order_btn", site.language, checkoutData.country)}
                        </button>
                    </form>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Checkout Success Popup */}
      <AnimatePresence>
        {orderStatus === 'success' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 text-center"
          >
            <div className="max-w-md w-full p-8 sm:p-10 bg-dragon-black border border-dragon-cyan/30 rounded-[2.5rem] shadow-box-neon space-y-6">
              <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/40">
                <ShieldCheck size={40} />
              </div>
              <h2 className="text-3xl font-black text-white tracking-tight uppercase">Order Successful!</h2>
              <p className="text-gray-400 text-xs leading-relaxed max-w-sm mx-auto font-sans">
                Thank you for ordering from <span className="font-bold text-white">{site.brandName}</span>. Our team will contact you very soon to confirm details.
              </p>
              {lastPlacedOrderId && (
                <div className="space-y-3">
                  <p className="text-xs font-mono text-dragon-cyan bg-dragon-cyan/10 border border-dragon-cyan/20 py-2 px-4 rounded-xl select-all">
                    Order ID: <span className="font-bold">{lastPlacedOrderId}</span>
                  </p>
                  <a
                    href={`/track-order/${lastPlacedOrderId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 bg-gradient-to-r from-dragon-cyan to-dragon-purple hover:brightness-110 active:scale-95 text-black font-black uppercase tracking-widest text-[11px] rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all"
                  >
                    <Truck size={16} /> Track Order Live / লাইভ ট্র্যাকিং দেখুন
                  </a>
                </div>
              )}
              <button
                onClick={() => setOrderStatus('idle')}
                className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-gray-300 font-black uppercase tracking-widest text-[10px] rounded-2xl border border-white/10 transition-all cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DESIGN FOOTER: Including Title, Short Title, About page bio, Social link buttons, and Powered by Dragon */}
      <footer className="bg-black text-white py-20 border-t border-white/5 custom-pro-footer">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 text-left">

          {/* Footer Card Section with Title and descriptions */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              {site.logo && (
                <img src={site.logo} alt={site.brandName} className="h-8 sm:h-10 w-auto max-w-[200px] object-contain bg-transparent shrink-0" />
              )}
              {/* Footer Title */}
              <span className="font-sans font-black text-lg tracking-tight uppercase" style={{ color: storeNameColor }}>{site.brandName || 'MY STORE'}</span>
            </div>

            {/* Footer Short Title & About Bio */}
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-dragon-cyan">{translate("short_about_title", site.language, site.defaultCountry)}</p>
              <p className="text-gray-500 font-medium leading-relaxed uppercase text-[10px] tracking-widest font-sans mt-2">
                {resolveFooterText(site.footer?.about, "about", site.language, site.defaultCountry)}
              </p>
            </div>

            {/* Social Media Link Icons */}
            <div className="flex gap-3 pt-2">
              {site.social?.facebook && (
                <a
                  href={site.social.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 bg-white/2 border border-white/10 rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all"
                  title="Facebook"
                >
                  <Facebook size={16} />
                </a>
              )}
              {site.social?.tiktok && (
                <a
                  href={site.social.tiktok}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 bg-white/2 border border-white/10 rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all font-semibold"
                  title="TikTok"
                >
                  <Settings size={16} />
                </a>
              )}
              {site.social?.youtube && (
                <a
                  href={site.social.youtube}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 bg-white/2 border border-white/10 rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all"
                  title="YouTube"
                >
                  <Youtube size={16} />
                </a>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="font-black uppercase tracking-[0.2em] text-xs text-white">{translate("company_support", site.language, site.defaultCountry)}</h4>
            <ul className="space-y-3 text-gray-500 text-xs font-bold uppercase tracking-widest font-sans">
              <li
                onClick={() => setSelectedPolicyPage({
                  title: resolveFooterText(site.footer?.support1Title, "support1Title", site.language, site.defaultCountry),
                  content: resolveFooterText(site.footer?.support1Content, "support1Content", site.language, site.defaultCountry)
                })}
                className="hover:text-white cursor-pointer transition-colors"
              >
                {resolveFooterText(site.footer?.support1Title, "support1Title", site.language, site.defaultCountry)}
              </li>
              <li
                onClick={() => setSelectedPolicyPage({
                  title: resolveFooterText(site.footer?.support2Title, "support2Title", site.language, site.defaultCountry),
                  content: resolveFooterText(site.footer?.support2Content, "support2Content", site.language, site.defaultCountry)
                })}
                className="hover:text-white cursor-pointer transition-colors"
              >
                {resolveFooterText(site.footer?.support2Title, "support2Title", site.language, site.defaultCountry)}
              </li>
              <li
                onClick={() => setSelectedPolicyPage({
                  title: resolveFooterText(site.footer?.support3Title, "support3Title", site.language, site.defaultCountry),
                  content: resolveFooterText(site.footer?.support3Content, "support3Content", site.language, site.defaultCountry)
                })}
                className="hover:text-white cursor-pointer transition-colors"
              >
                {resolveFooterText(site.footer?.support3Title, "support3Title", site.language, site.defaultCountry)}
              </li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="font-black uppercase tracking-[0.2em] text-xs text-white">{translate("customer_help", site.language, site.defaultCountry)}</h4>
            <ul className="space-y-3 text-gray-500 text-xs font-bold uppercase tracking-widest font-sans">
              <li
                onClick={() => setSelectedPolicyPage({
                  title: resolveFooterText(site.footer?.help1Title, "help1Title", site.language, site.defaultCountry),
                  content: resolveFooterText(site.footer?.help1Content, "help1Content", site.language, site.defaultCountry)
                })}
                className="hover:text-white cursor-pointer transition-colors"
              >
                {resolveFooterText(site.footer?.help1Title, "help1Title", site.language, site.defaultCountry)}
              </li>
              <li
                onClick={() => setSelectedPolicyPage({
                  title: resolveFooterText(site.footer?.help2Title, "help2Title", site.language, site.defaultCountry),
                  content: resolveFooterText(site.footer?.help2Content, "help2Content", site.language, site.defaultCountry)
                })}
                className="hover:text-white cursor-pointer transition-colors"
              >
                {resolveFooterText(site.footer?.help2Title, "help2Title", site.language, site.defaultCountry)}
              </li>
              <li
                onClick={() => setSelectedPolicyPage({
                  title: resolveFooterText(site.footer?.help3Title, "help3Title", site.language, site.defaultCountry),
                  content: resolveFooterText(site.footer?.help3Content, "help3Content", site.language, site.defaultCountry)
                })}
                className="hover:text-white cursor-pointer transition-colors"
              >
                {resolveFooterText(site.footer?.help3Title, "help3Title", site.language, site.defaultCountry)}
              </li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="font-black uppercase tracking-[0.2em] text-xs text-white opacity-90">{translate("contacts_support", site.language, site.defaultCountry)}</h4>
            <div className="space-y-4">
              {site.footer?.whatsapp && (
                <div className="flex items-center gap-3 group">
                  <div className="w-9 h-9 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
                    <MessageCircle size={18} />
                  </div>
                  <div className="text-left font-sans">
                    <p className="text-[9px] uppercase font-black tracking-widest text-gray-600">{translate("whatsapp_support", site.language, site.defaultCountry)}</p>
                    <p className="font-bold text-xs text-white">{site.footer.whatsapp}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 group">
                <div className="w-9 h-9 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center">
                   <ShieldCheck size={18} />
                </div>
                <div className="text-left font-sans">
                  <p className="text-[9px] uppercase font-black tracking-widest text-gray-600">{translate("secure_payment", site.language, site.defaultCountry)}</p>
                  <p className="font-bold text-xs text-white">{translate("cash_on_delivery", site.language, site.defaultCountry)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer bottom line with brand signature */}
        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-center font-sans">
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-600">© 2026 {site.brandName}. {translate("all_rights_reserved", site.language, site.defaultCountry)}</p>

          {/* SSL Certification indicator */}
          <div className="flex items-center gap-2 bg-[#10b981]/5 border border-[#10b981]/20 px-3.5 py-1.5 rounded-xl text-[9px] font-black text-[#10b981] uppercase tracking-widest shadow-sm">
            <ShieldCheck size={14} className="text-[#10b981] animate-pulse shrink-0" />
            <span>{translate("ssl_secured_cert", site.language, site.defaultCountry)}</span>
          </div>

          {/* Powered by Dragon branding (পাওয়ার বাই ড্রাগন) */}
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-400 bg-white/5 px-4 py-2 rounded-xl border border-white/5 shadow-inner">
             <span className="text-dragon-cyan tracking-wider">{translate("powered_by_dragon", site.language, site.defaultCountry)}</span>
          </div>
        </div>
      </footer>

      {/* Dragon AI Chatbot */}
      {site?.dragonBotEnabled && site?.userId && !showCart && !showMyOrders && (
        <DragonBotMessenger
          userId={site.userId}
          storeName={site.brandName || 'Our Store'}
          chatSourceId={`website_${slug || site?.id || 'pro_site'}`}
          activeProduct={viewingProduct ? {
            name: viewingProduct.name || viewingProduct.title || (site.language === 'bn' ? "Our Product" : "Product"),
            price: viewingProduct.sellPrice || viewingProduct.price || "",
            details: viewingProduct.details || "",
            image: viewingProduct.image || ""
          } : null}
        />
      )}
    </div>
  );
}
