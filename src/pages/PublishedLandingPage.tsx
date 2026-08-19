import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DoelBirdLogo } from '../components/DoelBirdLogo';
import { doc, onSnapshot, addDoc, collection, serverTimestamp, getDoc, query, where, setDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { COUNTRIES, getCheckoutFormFields } from '../utils/countriesData';
import {
  ShoppingBag,
  CheckCircle2,
  MessageCircle,
  Mail,
  Youtube,
  Instagram,
  Facebook,
  ShieldCheck,
  Zap,
  Timer,
  Clock,
  ExternalLink,
  ChevronRight,
  Package,
  Plus,
  Minus,
  Check,
  Loader2,
  Truck,
  MapPin,
  AlertTriangle,
  X,
  Globe,
  Languages,
  Search
} from 'lucide-react';
import { cn } from '../lib/utils';
import { checkCopyLinkTracking, checkBlacklistStatus, trackBlockedAttempt, getOrInitDeviceToken, recordOrderSuccess, checkOrderRateLimit } from '../lib/fraud';
import DragonBotMessenger from '../components/DragonBotMessenger';
import { syncOrderToSiteChat } from '../utils/chatSync';
import { translate as baseTranslate, COUNTRY_TO_LANG } from '../utils/translations';
import { ProductReviewsSection } from '../components/ProductReviewsSection';
import { Star } from 'lucide-react';
import { incrementPageViewRTDB } from '../services/rtdbEphemeralService';

const PublishedLandingPage = () => {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const [pageData, setPageData] = useState<any>(() => {
    if (pageId) {
      try {
        const cached = localStorage.getItem(`cached_landing_page_${pageId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === 'object' && 'data' in parsed) {
            return parsed.data;
          }
          return parsed; // Fallback for old style cache
        }
      } catch (err) {
        console.error('Error reading landing page cache:', err);
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(() => {
    if (pageId) {
      try {
        const cached = localStorage.getItem(`cached_landing_page_${pageId}`);
        if (cached) {
          return false; // Instant zero loading screen!
        }
      } catch (err) {}
    }
    return true;
  });
  const [quantity, setQuantity] = useState(1);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);
  const [isOrdering, setIsOrdering] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, mins: number, secs: number} | null>(null);
  const [orderForm, setOrderForm] = useState<Record<string, string>>({});
  const [parentWebsite, setParentWebsite] = useState<any | null>(null);

  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [deliveryType, setDeliveryType] = useState<string>('inside');
  const [activeImage, setActiveImage] = useState<string>('');
  const [matchingInventory, setMatchingInventory] = useState<any>(null);

  const [userSelectedLanguage, setUserSelectedLanguage] = useState<string>('');

  const nativeLangCode = useMemo(() => {
    if (!pageData?.country) return 'bn';
    return COUNTRY_TO_LANG[pageData.country] || 'en';
  }, [pageData?.country]);

  const activeLanguage = useMemo(() => {
    if (userSelectedLanguage) return userSelectedLanguage;
    if (!pageData) return 'en';
    if (pageData.language && pageData.language !== 'auto') return pageData.language;
    return COUNTRY_TO_LANG[pageData.country || 'Bangladesh'] || 'en';
  }, [userSelectedLanguage, pageData]);

  // Shadow translate to automatically use the customer's active selected language & country
  const translate = (key: string, _overrideLang?: string, _overrideCountry?: string) => {
    const langToUse = userSelectedLanguage || activeLanguage;
    const countryToUse = selectedCountry || pageData?.country || 'Bangladesh';
    return baseTranslate(key, langToUse, countryToUse);
  };

  const LANGUAGE_NAMES: Record<string, string> = {
    en: "English",
    bn: "বাংলা",
    ar: "العربية",
    es: "Español",
    pt: "Português",
    fr: "Français",
    tr: "Türkçe",
    ru: "Русский",
    id: "Indonesian",
    ms: "Malay",
    vi: "Tiếng Việt",
    th: "ไทย",
    hi: "हिन्दी",
    ur: "اردو",
    my: "မြန်မာ",
    km: "ខ្មែរ",
    ne: "नेपाली",
    si: "සිංහල",
    uk: "Українська"
  };

  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details');

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

  const videoEmbedUrl = useMemo(() => {
    return getYoutubeEmbedUrl(pageData?.videoUrl || matchingInventory?.videoUrl || '');
  }, [pageData?.videoUrl, matchingInventory?.videoUrl]);

  const [cachedLocation, setCachedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationModalError, setLocationModalError] = useState('');
  const [isRetryingLocation, setIsRetryingLocation] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>('Bangladesh');
  const [showCountryLangModal, setShowCountryLangModal] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState('');
  const [ownerProfile, setOwnerProfile] = useState<any>(null);

  useEffect(() => {
    if (pageData?.userId) {
      getDoc(doc(db, 'users', pageData.userId)).then((snap) => {
        if (snap.exists()) {
          setOwnerProfile(snap.data());
        }
      });
    }
  }, [pageData?.userId]);

  const isExpired = useMemo(() => {
    if (!pageData) return false;

    // Checks if the owner is from Bangladesh
    const country = pageData.ownerCountry || ownerProfile?.country || 'Bangladesh';
    if (country !== 'Bangladesh') return false;

    if (pageData.paymentStatus === 'approved') return false;

    let createdTime = Date.now();
    if (pageData.createdAt) {
      if (pageData.createdAt.seconds) createdTime = pageData.createdAt.seconds * 1000;
      else if (pageData.createdAt.toDate) createdTime = pageData.createdAt.toDate().getTime();
      else createdTime = new Date(pageData.createdAt).getTime();
    }
    const trialExpiry = createdTime + 48 * 60 * 60 * 1000;
    return Date.now() > trialExpiry;
  }, [pageData, ownerProfile]);

  useEffect(() => {
    if (pageData?.country) {
      setSelectedCountry(pageData.country);
    }
  }, [pageData?.country]);

  const activeCountryInfo = useMemo(() => {
    return COUNTRIES.find(c => c.name === selectedCountry) || COUNTRIES[0];
  }, [selectedCountry]);

  useEffect(() => {
    if (pageData?.requireLocationTracking && navigator.geolocation) {
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

  useEffect(() => {
    if (pageData?.productId) {
      const docRef = doc(db, 'inventory', pageData.productId);
      getDoc(docRef).then((snapshotZone) => {
        if (snapshotZone.exists()) {
          setMatchingInventory(snapshotZone.data());
        }
      }).catch((e) => {
        console.error("Error loading matching product warranty setting: ", e);
      });
    }
  }, [pageData?.productId]);

  const imagesToDisplay = useMemo(() => {
    if (!pageData) return [];
    const fromExtra = (pageData.extraImages || []).filter(Boolean);
    if (fromExtra.length > 0) return fromExtra;
    // Fallback if extraImages is empty but pageData has productDetails
    if (pageData.productDetails?.image) return [pageData.productDetails.image];
    return ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80'];
  }, [pageData]);

  // Keep state in sync when images load
  useEffect(() => {
    if (imagesToDisplay.length > 0 && !activeImage) {
      setActiveImage(imagesToDisplay[0]);
    }
  }, [imagesToDisplay, activeImage]);

  const colorsToDisplay = useMemo(() => {
    if (matchingInventory) {
      if (matchingInventory.color) {
        return matchingInventory.color.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      return [];
    }
    if (pageData?.productDetails?.colors && pageData.productDetails.colors.length > 0) {
      return pageData.productDetails.colors;
    }
    return [];
  }, [pageData?.productDetails?.colors, matchingInventory]);

  const sizesToDisplay = useMemo(() => {
    if (matchingInventory) {
      if (matchingInventory.size) {
        return matchingInventory.size.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      return [];
    }
    if (pageData?.productDetails?.sizes && pageData.productDetails.sizes.length > 0) {
      return pageData.productDetails.sizes;
    }
    return [];
  }, [pageData?.productDetails?.sizes, matchingInventory]);

  const weightsToDisplay = useMemo(() => {
    if (matchingInventory) {
      if (matchingInventory.weight) {
        return matchingInventory.weight.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      return [];
    }
    if (pageData?.productDetails?.weight) {
      return pageData.productDetails.weight.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    return [];
  }, [pageData?.productDetails?.weight, matchingInventory]);

  const [itemConfigs, setItemConfigs] = useState<{ color: string, size: string, weight: string }[]>([]);

  // Synchronize itemConfigs with quantity
  useEffect(() => {
    if (quantity < 1) return;
    setItemConfigs((prev) => {
      const lengthDiff = quantity - prev.length;
      if (lengthDiff > 0) {
        const addOns = Array.from({ length: lengthDiff }).map(() => ({
          color: colorsToDisplay[0] || '',
          size: sizesToDisplay[0] || '',
          weight: weightsToDisplay[0] || ''
        }));
        return [...prev, ...addOns];
      } else if (lengthDiff < 0) {
        return prev.slice(0, quantity);
      }
      return prev;
    });
  }, [quantity, colorsToDisplay, sizesToDisplay, weightsToDisplay]);

  const handleUpdateItemConfig = (index: number, field: 'color' | 'size' | 'weight', value: string) => {
    setItemConfigs((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], [field]: value };
      }
      return next;
    });
  };

  useEffect(() => {
    if (colorsToDisplay?.length > 0) {
      setSelectedColor(prev => prev && colorsToDisplay.includes(prev) ? prev : colorsToDisplay[0]);
    }
  }, [colorsToDisplay]);

  useEffect(() => {
    if (sizesToDisplay?.length > 0) {
      setSelectedSize(prev => prev && sizesToDisplay.includes(prev) ? prev : sizesToDisplay[0]);
    }
  }, [sizesToDisplay]);

  useEffect(() => {
    if (!pageId) return;

    // Track high-frequency page views via Realtime DB (0 Firestore read/write costs)
    incrementPageViewRTDB(pageId);

    const urlParams = new URLSearchParams(window.location.search);
    const forceRefresh = urlParams.get('nocache') === 'true' || urlParams.get('refresh') === 'true';

    let hasCached = false;
    // Instant local cache load for fast initial render
    if (!forceRefresh) {
      try {
        const cached = localStorage.getItem(`cached_landing_page_${pageId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === 'object' && 'timestamp' in parsed) {
            setPageData(parsed.data);
            setLoading(false);
            if (Date.now() - parsed.timestamp < 300000) {
              hasCached = true;
            }
          }
        }
      } catch (e) {}
    }

    if (!hasCached || forceRefresh) {
      const docRef = doc(db, 'landing-pages', pageId);
      getDoc(docRef).then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setPageData(data);
          try {
            localStorage.setItem(`cached_landing_page_${pageId}`, JSON.stringify({
              data: data,
              timestamp: Date.now()
            }));
          } catch (err) {
            console.error('Error writing landing page cache:', err);
          }
        }
        setLoading(false);
      }).catch((error) => {
        console.error("Error fetching landing page document:", error);
        setLoading(false);
      });
    }
  }, [pageId]);

  // Isolate published landing page theme from main site dashboard theme settings
  useEffect(() => {
    const mainAppTheme = localStorage.getItem('theme');
    document.documentElement.classList.remove('light');

    return () => {
      if (mainAppTheme === 'light') {
        document.documentElement.classList.add('light');
      }
    };
  }, []);

  useEffect(() => {
    if (pageData?.userId) {
      checkCopyLinkTracking(pageData.userId);
    }
  }, [pageData?.userId]);

  useEffect(() => {
    if (!pageData?.websiteId) return;

    let hasCached = false;
    try {
      const cached = localStorage.getItem(`cached_pro_site_parent_${pageData.websiteId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object') {
          setParentWebsite(parsed.data || parsed);
          if (parsed.timestamp && Date.now() - parsed.timestamp < 300000) {
            hasCached = true;
          }
        }
      }
    } catch (e) {}

    if (!hasCached) {
      const docRef = doc(db, 'pro_websites', pageData.websiteId);
      getDoc(docRef).then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setParentWebsite(data);
          try {
            localStorage.setItem(`cached_pro_site_parent_${pageData.websiteId}`, JSON.stringify({
              data: data,
              timestamp: Date.now()
            }));
          } catch (err) {}
        }
      }).catch((err) => {
        console.warn("Failed to fetch parent website settings:", err);
      });
    }
  }, [pageData?.websiteId]);

  const isStarEnabled = pageData?.isStarEnabled !== false && parentWebsite?.isStarEnabled !== false;

  // --- Pixel & Third-Party Tracking Setup ---
  useEffect(() => {
    if (!pageData) return;

    const tracking = pageData.tracking || {};
    const elementsToRemove: (HTMLScriptElement | HTMLImageElement | HTMLDivElement)[] = [];

    // 1. Facebook Pixel
    if (tracking.facebook && tracking.facebook.trim()) {
      const fbId = tracking.facebook.trim();
      
      // Standard Facebook Pixel Code
      if (!(window as any).fbq) {
        (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
          if (f.fbq) return;
          n = f.fbq = function() {
            n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
          };
          if (!f._fbq) f._fbq = n;
          n.push = n;
          n.loaded = !0;
          n.version = '2.0';
          n.queue = [];
          t = b.createElement(e);
          t.async = !0;
          t.src = v;
          s = b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t, s);
        })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      }
      
      try {
        (window as any).fbq('init', fbId);
        (window as any).fbq('track', 'PageView');
        console.log(`Facebook Pixel initialized: ${fbId}`);
      } catch (err) {
        console.error('Failed to init FB Pixel:', err);
      }
    }

    // 2. TikTok Pixel
    if (tracking.tiktok && tracking.tiktok.trim()) {
      const ttId = tracking.tiktok.trim();
      
      // Standard TikTok Pixel Code
      if (!(window as any).ttq) {
        (function (w: any, d: any, t: any) {
          w.TiktokAnalyticsObject = t;
          var ttq = w[t] = w[t] || [];
          ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "setCookie"];
          ttq.setAndDefer = function(t: any, e: any) {
            t[e] = function() {
              t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
            }
          };
          for (var i = 0; i < ttq.methods.length; i++) {
            ttq.setAndDefer(ttq, ttq.methods[i]);
          }
          ttq.instance = function(t: any) {
            for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) {
              ttq.setAndDefer(e, ttq.methods[n]);
            }
            return e;
          };
          ttq._i = ttq._i || {};
          ttq._i[t] = [];
          ttq._i[t]._u = "https://analytics.tiktok.com/i18n/pixel/events.js";
          ttq._t = ttq._t || {};
          ttq._t[t] = +new Date;
          ttq._o = ttq._o || {};
          ttq._o[t] = {};
          ttq._v = "1.2.1";
          var o = d.createElement("script");
          o.type = "text/javascript";
          o.async = !0;
          o.src = "https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=" + t;
          var e = d.getElementsByTagName("script")[0];
          e.parentNode.insertBefore(o, e);
        })(window, document, 'ttq');
      }
      
      try {
        (window as any).ttq.load(ttId);
        (window as any).ttq.page();
        console.log(`TikTok Pixel loaded: ${ttId}`);
      } catch (err) {
        console.error('Failed to load TikTok Pixel:', err);
      }
    }

    // 3. Google Tag Manager (GTM)
    if (tracking.gtm && tracking.gtm.trim()) {
      const gtmId = tracking.gtm.trim();
      
      const script = document.createElement('script');
      script.async = true;
      script.innerHTML = `
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${gtmId}');
      `;
      document.head.appendChild(script);
      elementsToRemove.push(script);
      console.log(`Google Tag Manager initialized: ${gtmId}`);
    }

    // 4. Google Analytics 4 (GA4)
    if (tracking.ga4 && tracking.ga4.trim()) {
      const gaId = tracking.ga4.trim();
      
      const scriptExternal = document.createElement('script');
      scriptExternal.async = true;
      scriptExternal.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(scriptExternal);
      elementsToRemove.push(scriptExternal);

      const scriptInline = document.createElement('script');
      scriptInline.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){window.dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${gaId}');
      `;
      document.head.appendChild(scriptInline);
      elementsToRemove.push(scriptInline);
      console.log(`Google Analytics 4 initialized: ${gaId}`);
    }

    // 5. Microsoft Clarity
    if (tracking.clarity && tracking.clarity.trim()) {
      const clarityId = tracking.clarity.trim();
      const clarityScript = document.createElement('script');
      clarityScript.type = 'text/javascript';
      clarityScript.innerHTML = `
        (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "${clarityId}");
      `;
      document.head.appendChild(clarityScript);
      elementsToRemove.push(clarityScript);
      console.log(`Microsoft Clarity initialized: ${clarityId}`);
    }

    return () => {
      elementsToRemove.forEach(el => {
        try {
          el.parentNode?.removeChild(el);
        } catch (e) {}
      });
    };
  }, [pageData]);



  useEffect(() => {
    if (!pageData?.productDetails?.offerDuration) return;

    // Simple timer based on current date + duration
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + pageData.productDetails.offerDuration);

    const interval = setInterval(() => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();

      if (diff <= 0) {
        clearInterval(interval);
        setTimeLeft(null);
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        mins: Math.floor((diff / (1000 * 60)) % 60),
        secs: Math.floor((diff / 1000) % 60)
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [pageData]);

  const deliveryCharge = useMemo(() => {
    let baseCharge = 130;
    if (deliveryType === 'inside') {
      baseCharge = pageData?.deliveryCharges?.inside ?? 80;
    } else if (deliveryType === 'outside') {
      baseCharge = pageData?.deliveryCharges?.outside ?? 130;
    } else if (deliveryType && deliveryType.startsWith('custom_')) {
      const idx = parseInt(deliveryType.split('_')[1], 10);
      const customItem = (pageData as any)?.customDeliveryCharges?.[idx];
      baseCharge = customItem ? Number(customItem.charge) : 130;
    }

    if (pageData?.deliveryCharges?.qtyBasedEnabled && quantity > 1) {
      const increment = pageData?.deliveryCharges?.incrementPerQty !== undefined 
        ? Number(pageData.deliveryCharges.incrementPerQty) 
        : 20;
      return baseCharge + (quantity - 1) * increment;
    }

    return baseCharge;
  }, [deliveryType, pageData, quantity]);

  const getLiveLocation = (isEnforced: boolean = true): Promise<{latitude: number; longitude: number}> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error(translate("gps_unsupported", pageData.language, pageData.country)));
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
              let msg = translate("location_not_found", pageData.language, pageData.country);
              if (error.code === error.PERMISSION_DENIED) {
                msg = isEnforced
                  ? translate("location_blocked", pageData.language, pageData.country)
                  : translate("location_blocked_generic", pageData.language, pageData.country);
              } else {
                msg = translate("location_error", pageData.language, pageData.country);
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

  const handleOrder = async () => {
    if (isOrdering) return;
    setIsOrdering(true);

    try {
      // Live Location requirements
      let userLocation: { latitude: number; longitude: number } | null = null;
      if (pageData?.requireLocationTracking) {
        userLocation = cachedLocation;
        try {
          if (!userLocation) {
            userLocation = await getLiveLocation(true);
          }
        } catch (locationErr: any) {
          setLocationModalError(locationErr.message || 'Location permission required');
          setShowLocationModal(true);
          setIsOrdering(false);
          return;
        }
      }

      // Validate all manual fields are filled
      const requiredFields = pageData.orderCartConfig?.checkoutFields || [];
      const isBengali = activeLanguage === 'bn';
      const allLibraryFields = getCheckoutFormFields(pageData.country || 'Bangladesh');

      for (const field of requiredFields) {
        const libField = allLibraryFields.find(f => f.key === field || f.key === field.toLowerCase());
        const libKey = libField ? libField.key : field;
        const lowerKey = field.toLowerCase();

        let val = (orderForm[field] || orderForm[libKey] || orderForm[lowerKey] || '').trim();
        if (!val && (lowerKey === 'name' || lowerKey === 'full name')) {
          val = (orderForm['name'] || orderForm['Name'] || orderForm['Full Name'] || orderForm['fullName'] || '').trim();
        } else if (!val && (lowerKey === 'mobile' || lowerKey === 'phone' || lowerKey === 'phone/mobile')) {
          val = (orderForm['phone'] || orderForm['Phone'] || orderForm['Mobile'] || orderForm['mobile'] || '').trim();
        } else if (!val && (lowerKey === 'address' || lowerKey === 'detailed address')) {
          val = (orderForm['address'] || orderForm['Address'] || '').trim();
        }

        if (!val) {
          let fieldLabel = field;
          if (libField) {
            fieldLabel = isBengali ? libField.labelBn : libField.labelEn;
          } else {
            if (lowerKey === 'name' || lowerKey === 'full name') {
              fieldLabel = isBengali ? 'পূর্ণ নাম' : 'Full Name';
            } else if (lowerKey === 'mobile' || lowerKey === 'phone' || lowerKey === 'phone/mobile') {
              fieldLabel = isBengali ? 'মোবাইল নম্বর' : 'Mobile Number';
            } else if (lowerKey === 'address' || lowerKey === 'detailed address') {
              fieldLabel = isBengali ? 'ঠিকানা' : 'Address';
            }
          }
          alert(isBengali ? `${fieldLabel} প্রদান করুন` : `Please enter ${fieldLabel}`);
          setIsOrdering(false);
          return;
        }
      }

      const phone = orderForm['phone'] || orderForm['Phone'] || orderForm['Mobile'] || 'N/A';

      // Server-Side IP & Device Token 24-Hour Rate Limit (Max 10 orders / 24h)
      let clientIp = '';
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
            alert(pageData.language === 'Bangla' || pageData.language === 'bn'
              ? "দুঃখিত, এই আইপি (IP) বা ডিভাইস থেকে ২৪ ঘণ্টায় ১০টির বেশি অর্ডার করা যাবে না।"
              : "Sorry, a maximum of 10 orders can be placed from this IP or device within 24 hours.");
            setIsOrdering(false);
            return;
          }
        }
      } catch (limitErr) {
        console.error("Failed to verify server IP rate limit:", limitErr);
      }

      // Client-Side Rate Limit Verification (Spam guard)
      if (pageData?.userId) {
        const rateLimit = await checkOrderRateLimit(pageData.userId);
        if (!rateLimit.allowed) {
          alert(translate("rate_limit_error", pageData.language, pageData.country));
          setIsOrdering(false);
          return;
        }
      }

      // Fraud Verification
      if (pageData?.userId) {
        const blacklist = await checkBlacklistStatus(pageData.userId, phone);
        if (blacklist?.isBlocked) {
          console.warn("[Fraud system] Blacklisted customer intercepted. Propagating device and phone blocks...");
          await trackBlockedAttempt(pageData.userId, phone, orderForm['Name'] || orderForm['Full Name'] || 'Guest');
          // Simulated Shadow Success
          setIsOrdering(false);
          setOrderConfirmed(true);
          return;
        }
      }

      let fetchedBuyPrice = 0;
      let fetchedSkuCode = '';
      if (pageData?.productId) {
        try {
          const invSnap = await getDoc(doc(db, 'inventory', pageData.productId));
          if (invSnap.exists()) {
            fetchedBuyPrice = Number(invSnap.data()?.buyPrice) || 0;
            fetchedSkuCode = invSnap.data()?.skuCode || '';
          }
        } catch (itemErr) {
          console.error("Error loading inventory buyPrice for order:", itemErr);
        }
      }

      let addressSuffix = '';
      if (deliveryType === 'inside') {
        addressSuffix = selectedCountry === 'Bangladesh' ? 'Inside Dhaka' : 'Local Delivery';
      } else if (deliveryType === 'outside') {
        addressSuffix = selectedCountry === 'Bangladesh' ? 'Outside Dhaka' : 'Outside City/State';
      } else if (deliveryType && deliveryType.startsWith('custom_')) {
        const idx = parseInt(deliveryType.split('_')[1], 10);
        const customItem = (pageData as any)?.customDeliveryCharges?.[idx];
        addressSuffix = customItem ? customItem.area : 'Custom Area';
      }

      const joinedColors = itemConfigs.map(item => item.color).filter(Boolean).join(', ');
      const joinedSizes = itemConfigs.map(item => item.size).filter(Boolean).join(', ');
      const joinedWeights = itemConfigs.map(item => item.weight).filter(Boolean).join(', ');

      const itemsDetailStr = itemConfigs.map((item, i) => {
        const parts = [];
        if (item.color) parts.push(`Color: ${item.color}`);
        if (item.size) parts.push(`Size: ${item.size}`);
        if (item.weight) parts.push(`Weight: ${item.weight}`);
        return `Item #${i+1} (${parts.join(', ') || 'No variants'})`;
      }).join(' | ');

      const orderDetailsStr = [
        itemsDetailStr ? `Configured Items: ${itemsDetailStr}` : '',
        ...Object.entries(orderForm).map(([k, v]) => `${k}: ${v}`)
      ].filter(Boolean).join(', ');

      // Resolve the correct product image url from pageData (uses extraImages)
      const firstImage = activeImage || imagesToDisplay[0] || pageData?.extraImages?.[0] || pageData?.productDetails?.image || '';

      const unitSellPrice = Number(pageData.productDetails.offerPrice || pageData.productDetails.price) || 0;
      const calcDeliveryCharge = Number(deliveryCharge) || 0;
      const numQuantity = Number(quantity) || 1;
      const calcTotal = (unitSellPrice * numQuantity) + calcDeliveryCharge;
      const receiverUserId = pageData.userId || 'admin_store';

      const createdOrderRef = await addDoc(collection(db, 'orders'), {
        pageId,
        storeName: pageData.storeName || 'DOELpro',
        productName: (pageData.productDetails.title || 'Product').substring(0, 500),
        productImage: firstImage,
        quantity: numQuantity,
        total: calcTotal,
        status: 'pending',
        customerName: String(orderForm['name'] || orderForm['Name'] || orderForm['Full Name'] || orderForm['fullName'] || 'Guest').substring(0, 200),
        customerPhone: String(orderForm['phone'] || orderForm['Phone'] || orderForm['Mobile'] || orderForm['mobile'] || 'N/A').substring(0, 50),
        customerAddress: `${orderForm['address'] || orderForm['Address'] || orderForm['detailed address'] || 'N/A'} (${addressSuffix})`.substring(0, 1000),
        country: selectedCountry,
        currency: activeCountryInfo.currency,
        currencySymbol: activeCountryInfo.currencySymbol,
        details: orderDetailsStr,
        senderId: 'customer_public',
        receiverId: receiverUserId,
        buyPrice: Number(fetchedBuyPrice) || 0,
        skuCode: fetchedSkuCode || null,
        sellPrice: unitSellPrice,
        deliveryCharge: calcDeliveryCharge,
        color: joinedColors || null,
        size: joinedSizes || null,
        weight: joinedWeights || null,
        items: [{
          id: pageData.productDetails.id || pageId || 'default_lp_id',
          name: pageData.productDetails.title || 'Product',
          image: firstImage,
          sellPrice: unitSellPrice,
          buyPrice: Number(fetchedBuyPrice) || unitSellPrice,
          quantity: numQuantity,
          specs: itemConfigs && itemConfigs.length > 0
            ? itemConfigs.map(item => ({ color: item.color || '', size: item.size || '', weight: item.weight || '' }))
            : [{ color: joinedColors || '', size: joinedSizes || '', weight: joinedWeights || '' }]
        }],
        latitude: userLocation ? userLocation.latitude : null,
        longitude: userLocation ? userLocation.longitude : null,
        trackingMethod: userLocation ? 'gps' : 'none',
        platform: 'landing_page',
        platformId: pageId,
        platformName: pageData.storeName || 'DOELpro',
        participants: ['customer_public', receiverUserId],
        fraudToken: getOrInitDeviceToken(),
        clientIp: clientIp || null,
        createdAt: new Date().toISOString()
      });

      const lpTotal = ((pageData.productDetails.offerPrice || pageData.productDetails.price) * quantity) + deliveryCharge;

      try {
        const lpName = pageData.productDetails.title;
        const lpImage = firstImage;
        const lpCustName = orderForm['Name'] || orderForm['Full Name'] || 'Guest';

        await syncOrderToSiteChat(
          db,
          pageData.userId,
          createdOrderRef.id,
          lpName,
          lpImage,
          quantity,
          lpTotal,
          lpCustName,
          `lp_${pageId}`,
          pageData.storeName || 'DOELpro'
        );
      } catch (syncErr) {
        console.error("Failed to sync order to site chat:", syncErr);
      }

      // Trigger dynamic pixel & analytics purchase events
      try {
        const tracking = pageData.tracking || {};
        
        // 1. Facebook Pixel Purchase Event
        if (tracking.facebook && tracking.facebook.trim() && (window as any).fbq) {
          (window as any).fbq('track', 'Purchase', {
            value: lpTotal,
            currency: activeCountryInfo.currency || 'BDT',
            content_name: pageData.productDetails.title,
            content_ids: [pageId || 'unknown'],
            content_type: 'product',
            num_items: quantity
          });
          console.log('Facebook Pixel Purchase event tracked');
        }

        // 2. TikTok Pixel Purchase Event
        if (tracking.tiktok && tracking.tiktok.trim() && (window as any).ttq) {
          (window as any).ttq.track('CompletePayment', {
            contents: [
              {
                content_id: pageId || 'unknown',
                content_name: pageData.productDetails.title,
                quantity: quantity,
                price: Number(pageData.productDetails.offerPrice || pageData.productDetails.price) || 0
              }
            ],
            value: lpTotal,
            currency: activeCountryInfo.currency || 'BDT'
          });
          console.log('TikTok Pixel CompletePayment event tracked');
        }

        // 3. Google Analytics 4 / Google Tag Manager Custom Purchase Event
        if ((tracking.ga4 || tracking.gtm) && (window as any).dataLayer) {
          (window as any).dataLayer.push({
            event: 'purchase',
            ecommerce: {
              transaction_id: createdOrderRef.id,
              value: lpTotal,
              currency: activeCountryInfo.currency || 'BDT',
              items: [{
                item_id: pageId || 'unknown',
                item_name: pageData.productDetails.title,
                price: Number(pageData.productDetails.offerPrice || pageData.productDetails.price) || 0,
                quantity: quantity
              }]
            }
          });
          console.log('Google Analytics/GTM purchase event tracked');
        }

        // 4. Microsoft Clarity Purchase Event
        if (tracking.clarity && tracking.clarity.trim() && typeof (window as any).clarity === 'function') {
          (window as any).clarity('event', 'purchase');
          (window as any).clarity('set', 'order_id', createdOrderRef.id);
          (window as any).clarity('set', 'purchase_total', lpTotal);
          (window as any).clarity('set', 'product_title', pageData.productDetails.title);
          console.log('Microsoft Clarity purchase event tracked');
        }
      } catch (trackErr) {
        console.error('Failed to send tracking events:', trackErr);
      }

      recordOrderSuccess();
      setConfirmedOrderId(createdOrderRef.id);
      setOrderConfirmed(true);
    } catch (err) {
      console.error(err);
      alert('Order failed: Missing or insufficient permissions.');
    } finally {
      setIsOrdering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-dragon-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white font-black uppercase tracking-widest">
        Page Not Found
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="min-h-screen bg-[#0d0f14] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px]" />
        </div>
        <div className="max-w-md p-8 bg-white/[0.02] border border-white/5 rounded-3xl space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-amber-500" />
          <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto text-rose-500 animate-pulse">
            <Clock size={40} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-display font-black uppercase tracking-tight text-white">মেয়াদ শেষ হয়েছে (Expired)</h1>
            <p className="text-sm text-gray-450 font-light leading-relaxed">
              এই ল্যান্ডিং পেজটির ৪৮ ঘণ্টার ফ্রি ট্রায়ালের মেয়াদ শেষ হয়েছে। পেজটি পুনরায় চালু করতে দয়া করে এডমিনের সাথে যোগাযোগ করুন অথবা পেমেন্ট সম্পন্ন করুন।
            </p>
          </div>
          <div className="pt-4 border-t border-white/5">
            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Powered by DOELpro</p>
          </div>
        </div>
      </div>
    );
  }

  const showPageWarranty = matchingInventory
    ? !!matchingInventory.hasWarranty
    : !!pageData.productDetails?.hasWarranty;

  const warrantyDurationText = (matchingInventory
    ? matchingInventory.warrantyDuration
    : pageData.productDetails?.warrantyDuration) || (pageData.language === 'bn' ? '১ বছর' : '1 Year');

  const showPageReplacement = matchingInventory
    ? !!matchingInventory.hasReplacement
    : !!pageData.productDetails?.hasReplacement;

  const replacementDurationText = (matchingInventory
    ? matchingInventory.replacementDuration
    : pageData.productDetails?.replacementDuration) || (pageData.language === 'bn' ? '৭ দিন' : '7 Days');

  const theme = pageData.theme || 'dark';
  const isDarkTheme = theme !== 'light';

  const themeClasses = {
    light: "bg-white text-zinc-900 selection:bg-black selection:text-white",
    dark: "bg-black text-white selection:bg-dragon-cyan selection:text-black",
    galaxy: "bg-[#0b001a] text-white selection:bg-purple-500",
    bubble: "bg-gradient-to-br from-indigo-900 to-purple-900 text-white",
    cinematic: "bg-zinc-950 text-white"
  };

  const storeIdentity = pageData.storeName ? { name: pageData.storeName, logo: pageData.logo } : { name: 'DOELpro', logo: '/dragon_logo.png' };

  const handleChatRedirect = () => {
    const channel = pageData.messagingChannel;
    const num = pageData.messagingNumber || '';
    if (!channel) return;

    // Clean string for viber/line (remove spaces/non-word characters)
    const cleanNum = num.replace(/\s+/g, '').replace(/[^\w\+]/g, '');
    let url = '';

    switch (channel.toLowerCase()) {
      case 'whatsapp':
        const waNum = num.replace(/[^\d]/g, '');
        url = `https://wa.me/${waNum}`;
        break;
      case 'telegram':
        const tgUser = num.replace(/^@/, '');
        url = `https://t.me/${tgUser}`;
        break;
      case 'viber':
        url = `viber://chat?number=${encodeURIComponent(cleanNum)}`;
        break;
      case 'line':
        url = `https://line.me/R/ti/p/~${cleanNum}`;
        break;
      default:
        break;
    }

    if (url) {
      window.open(url, '_blank');
    } else {
      alert(`Contact details are not set up by the store owner.`);
    }
  };

  return (
    <div className={cn("min-h-screen relative overflow-x-hidden transition-colors duration-500 custom-lp-wrapper", isDarkTheme ? "lp-dark-theme" : "lp-light-theme", themeClasses[theme as keyof typeof themeClasses])}>
      {/* CSS Overlay for Background override preferences */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-lp-wrapper {
          font-family: "Hind Siliguri", "Noto Sans Bengali", "Plus Jakarta Sans", "Inter", sans-serif !important;
        }
        .custom-lp-wrapper h1,
        .custom-lp-wrapper h2,
        .custom-lp-wrapper h3,
        .custom-lp-wrapper h4,
        .custom-lp-wrapper p,
        .custom-lp-wrapper span,
        .custom-lp-wrapper button,
        .custom-lp-wrapper label {
          letter-spacing: normal !important;
          word-spacing: normal !important;
        }

        ${(pageData.bodyBg === 'white' || !isDarkTheme) ? `
          .custom-lp-wrapper {
            background-color: #ffffff !important;
            color: #0f172a !important;
          }
          .custom-lp-wrapper h1,
          .custom-lp-wrapper h2,
          .custom-lp-wrapper h3,
          .custom-lp-wrapper h4,
          .custom-lp-wrapper h5,
          .custom-lp-wrapper h6 {
            color: #0f172a !important;
          }
          .custom-lp-wrapper p,
          .custom-lp-wrapper li,
          .custom-lp-wrapper label {
            color: #1e293b !important;
          }
          .custom-lp-wrapper .text-gray-400,
          .custom-lp-wrapper .text-gray-500 {
            color: #475569 !important;
          }
          .custom-lp-wrapper .glass-card,
          .custom-lp-wrapper .bg-white\\/5 {
            background-color: #f8fafc !important;
            border-color: #e2e8f0 !important;
          }
          .custom-lp-wrapper input,
          .custom-lp-wrapper select,
          .custom-lp-wrapper textarea {
            background-color: #ffffff !important;
            color: #0f172a !important;
            border-color: #cbd5e1 !important;
          }
          .custom-lp-wrapper input::placeholder,
          .custom-lp-wrapper textarea::placeholder {
            color: #94a3b8 !important;
          }
          .custom-lp-wrapper option {
            background-color: #ffffff !important;
            color: #0f172a !important;
          }

          /* Color, Size, Weight Variant Selection Buttons Light Mode Override */
          .custom-lp-wrapper .lp-variant-btn {
            background-color: #ffffff !important;
            border-color: #cbd5e1 !important;
            color: #1e293b !important;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;
          }
          .custom-lp-wrapper .lp-variant-btn:hover {
            background-color: #f1f5f9 !important;
            border-color: #94a3b8 !important;
            color: #0f172a !important;
          }
          .custom-lp-wrapper .lp-variant-btn.active {
            background-color: #4f46e5 !important;
            border-color: #4f46e5 !important;
            color: #ffffff !important;
            font-weight: 900 !important;
            box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3) !important;
          }
          .custom-lp-wrapper .lp-variant-btn.active span,
          .custom-lp-wrapper .lp-variant-btn.active * {
            color: #ffffff !important;
          }

          /* Delivery Type Buttons Light Mode Override */
          .custom-lp-wrapper .lp-delivery-btn {
            background-color: #ffffff !important;
            border-color: #cbd5e1 !important;
            color: #1e293b !important;
          }
          .custom-lp-wrapper .lp-delivery-btn.active {
            background-color: #4f46e5 !important;
            border-color: #4f46e5 !important;
            color: #ffffff !important;
            box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25) !important;
          }

          /* Ensure filled buttons keep white text in light mode */
          .custom-lp-wrapper .bg-red-600,
          .custom-lp-wrapper .bg-indigo-600,
          .custom-lp-wrapper .bg-emerald-600,
          .custom-lp-wrapper .bg-slate-900 {
            color: #ffffff !important;
          }
          .custom-lp-wrapper .bg-red-600 *,
          .custom-lp-wrapper .bg-indigo-600 *,
          .custom-lp-wrapper .bg-emerald-600 *,
          .custom-lp-wrapper .bg-slate-900 * {
            color: #ffffff !important;
          }
        ` : (pageData.bodyBg === 'black' || isDarkTheme) ? `
          .custom-lp-wrapper {
            background-color: #000000 !important;
            color: #ffffff !important;
          }
          .custom-lp-wrapper h1,
          .custom-lp-wrapper h2,
          .custom-lp-wrapper h3,
          .custom-lp-wrapper h4,
          .custom-lp-wrapper h5,
          .custom-lp-wrapper h6,
          .custom-lp-wrapper span,
          .custom-lp-wrapper p,
          .custom-lp-wrapper ul,
          .custom-lp-wrapper li,
          .custom-lp-wrapper label {
            color: #ffffff !important;
          }
        ` : ''}

        ${pageData.headerBg === 'white' ? `
          .custom-lp-header {
            background-color: #ffffff !important;
            color: #000000 !important;
            border-color: rgba(0, 0, 0, 0.1) !important;
          }
          .custom-lp-header * {
            color: #000000 !important;
          }
        ` : pageData.headerBg === 'black' ? `
          .custom-lp-header {
            background-color: #000000 !important;
            color: #ffffff !important;
            border-color: rgba(255, 255, 255, 0.1) !important;
          }
          .custom-lp-header * {
            color: #ffffff !important;
          }
        ` : ''}

        ${pageData.footerBg === 'white' ? `
          .custom-lp-footer {
            background-color: #ffffff !important;
            color: #000000 !important;
            border-color: rgba(0, 0, 0, 0.1) !important;
          }
          .custom-lp-footer h4,
          .custom-lp-footer p,
          .custom-lp-footer span,
          .custom-lp-footer a,
          .custom-lp-footer button,
          .custom-lp-footer li {
            color: #000000 !important;
          }
        ` : pageData.footerBg === 'black' ? `
          .custom-lp-footer {
            background-color: #000000 !important;
            color: #ffffff !important;
            border-color: rgba(255, 255, 255, 0.1) !important;
          }
          .custom-lp-footer h4,
          .custom-lp-footer p,
          .custom-lp-footer span,
          .custom-lp-footer a,
          .custom-lp-footer button,
          .custom-lp-footer li {
            color: #ffffff !important;
          }
        ` : ''}
      `}} />

      {/* Dynamic Backgrounds */}
      {(!pageData.bodyBg || pageData.bodyBg !== 'white') && theme === 'galaxy' && <GalaxyBackground />}
      {(!pageData.bodyBg || pageData.bodyBg !== 'white') && theme === 'bubble' && <BubbleBackground />}
      {(!pageData.bodyBg || pageData.bodyBg !== 'white') && theme === 'cinematic' && <CinematicOverlay />}

      {/* Header */}
      <nav className="px-4 py-3 sm:p-6 sticky top-0 z-[100] backdrop-blur-xl border-b border-current/10 custom-lp-header">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
             {storeIdentity.logo ? (
                <img src={storeIdentity.logo} className="h-10 sm:h-12 w-auto max-w-[180px] sm:max-w-[240px] object-contain bg-transparent shrink-0" alt="Logo" />
             ) : (
               <DoelBirdLogo size={40} showCircleBackground={true} className="shrink-0" />
             )}
             <span className="text-lg font-black uppercase tracking-tighter">{storeIdentity.name}</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Smart Country & Language Selector Button */}
            <button
              onClick={() => setShowCountryLangModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-current/10 hover:bg-current/20 text-current text-[11px] font-black uppercase tracking-wider rounded-full border border-current/15 hover:border-dragon-cyan transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Globe size={14} className="text-dragon-cyan animate-pulse" />
              <span className="hidden sm:inline">{selectedCountry}</span>
              <span className="hidden sm:inline opacity-40">•</span>
              <span className="text-dragon-cyan">{LANGUAGE_NAMES[activeLanguage] || activeLanguage.toUpperCase()}</span>
            </button>

            {pageData.messagingChannel && (
              <a
                href={`#contact`}
                className="px-4 py-2 bg-current/10 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-current/20 transition-all border border-current/10"
              >
                Contact
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-4 py-6 sm:p-6 space-y-6 sm:space-y-12 pb-24 sm:pb-32">

        {/* Images Grid */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="aspect-[4/5] md:aspect-video w-full rounded-[2.5rem] overflow-hidden bg-white/5 border border-current/10 shadow-2xl relative"
          >
            {showVideoPlayer && videoEmbedUrl ? (
              <iframe
                src={videoEmbedUrl}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                title="YouTube Video Player"
              />
            ) : (
              <img
                src={activeImage || imagesToDisplay[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80'}
                className="w-full h-full object-cover transition-all duration-300"
                alt="Product"
              />
            )}
          </motion.div>

          {(imagesToDisplay.length > 1 || !!videoEmbedUrl) && (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-4">
              {imagesToDisplay.map((img: string, i: number) => {
                const isSelected = !showVideoPlayer && (activeImage === img || (!activeImage && i === 0));
                return (
                  <motion.div
                    key={img + i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 * i }}
                    className={cn(
                      "aspect-square rounded-2xl overflow-hidden border cursor-pointer hover:scale-[1.03] transition-all duration-200",
                      isSelected ? "border-dragon-cyan ring-2 ring-dragon-cyan/20 scale-[1.02]" : "border-current/10 opacity-70 hover:opacity-100"
                    )}
                    onClick={() => {
                      setShowVideoPlayer(false);
                      setActiveImage(img);
                    }}
                  >
                    <img src={img || null} className="w-full h-full object-cover" alt={`Gallery ${i}`} />
                  </motion.div>
                );
              })}

              {/* YouTube Video play button thumbnail */}
              {!!videoEmbedUrl && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05 * imagesToDisplay.length }}
                  className={cn(
                    "aspect-square rounded-2xl overflow-hidden border cursor-pointer hover:scale-[1.03] transition-all duration-200 flex flex-col items-center justify-center gap-1 text-center bg-red-600/10 hover:bg-red-600/20 active:bg-red-600/30",
                    showVideoPlayer ? "border-red-500 ring-2 ring-red-500/20 scale-[1.02]" : "border-red-500/30 opacity-70 hover:opacity-100"
                  )}
                  onClick={() => {
                    setShowVideoPlayer(true);
                  }}
                >
                  <Youtube className="w-6 h-6 text-red-500 animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-wider text-red-500">{translate("watch_video", pageData.language, pageData.country)}</span>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl font-display font-medium tracking-tight uppercase leading-none">{pageData.productDetails.title}</h1>
            <div className="flex items-baseline gap-4">
              {pageData.productDetails.discount && pageData.productDetails.discount > 0 ? (
                <>
                  <span className="text-3xl font-black text-dragon-cyan">{activeCountryInfo.currencySymbol}{pageData.productDetails.offerPrice || pageData.productDetails.price}</span>
                  <span className="text-xl text-red-500 line-through">{activeCountryInfo.currencySymbol}{pageData.productDetails.price}</span>
                  <span className="px-2.5 py-1 bg-red-600 text-white text-[10px] font-black rounded-lg">{pageData.productDetails.discount}% OFF</span>
                </>
              ) : (
                <span className="text-3xl font-black">{activeCountryInfo.currencySymbol}{pageData.productDetails.price}</span>
              )}
            </div>

            {/* Star ratings and sold count metrics if enabled */}
            {isStarEnabled && (
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-sans">
                <div className="flex items-center gap-1 text-amber-400 font-black bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20 shadow-sm">
                  <Star size={13} fill="currentColor" className="text-amber-400 shrink-0" />
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
                  onClick={() => setActiveTab('reviews')}
                  className="text-dragon-cyan hover:underline font-black uppercase text-[10px] tracking-wider"
                >
                  See Reviews
                </button>
              </div>
            )}
          </div>

          {/* Warranty Badges */}
          <div className="flex flex-wrap gap-4">
            {showPageWarranty && warrantyDurationText && (
              <div className="flex items-center gap-2 px-4 py-2 bg-dragon-cyan/10 border border-dragon-cyan/20 rounded-xl text-dragon-cyan">
                <ShieldCheck size={16} />
                <span className="text-[10px] font-black uppercase">{warrantyDurationText} {translate("service_warranty", pageData.language, pageData.country)}</span>
              </div>
            )}
            {showPageReplacement && replacementDurationText && (
              <div className="flex items-center gap-2 px-4 py-2 bg-dragon-emerald/10 border border-dragon-emerald/20 rounded-xl text-dragon-emerald">
                <CheckCircle2 size={16} />
                <span className="text-[10px] font-black uppercase">{replacementDurationText} {translate("replacement_guarantee", pageData.language, pageData.country)}</span>
              </div>
            )}
          </div>

          {/* Offer Timer */}
          {timeLeft && (
            <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-[2rem] space-y-4">
              <div className="flex items-center gap-2 text-red-500">
                <Timer size={18} className="animate-pulse" />
                <span className="text-xs font-black uppercase tracking-[0.2em]">Limited Time Offer Ends in:</span>
              </div>
              <div className="flex gap-4">
                {[
                  { label: 'Days', val: timeLeft.days },
                  { label: 'Hours', val: timeLeft.hours },
                  { label: 'Mins', val: timeLeft.mins },
                  { label: 'Secs', val: timeLeft.secs }
                ].map((t, i) => (
                  <div key={i} className="flex-1 bg-black/40 p-3 rounded-2xl text-center border border-white/10">
                    <div className="text-2xl font-black text-white">{t.val.toString().padStart(2, '0')}</div>
                    <div className="text-[8px] font-black uppercase text-gray-500">{t.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab Selector for Landing Page */}
          {isStarEnabled && (
            <div className="flex border-b border-white/10 mt-8 gap-6 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className={cn(
                  "pb-4 text-xs sm:text-sm font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer",
                  activeTab === 'details'
                    ? "border-dragon-cyan text-dragon-cyan"
                    : "border-transparent text-gray-400 hover:text-white"
                )}
              >
                Product Details & Order
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('reviews')}
                className={cn(
                  "pb-4 text-xs sm:text-sm font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer",
                  activeTab === 'reviews'
                    ? "border-dragon-cyan text-dragon-cyan"
                    : "border-transparent text-gray-400 hover:text-white"
                )}
              >
                Reviews & Feedback
              </button>
            </div>
          )}

          {activeTab === 'details' || !isStarEnabled ? (
            <>
              {/* Details */}
              <div className="space-y-6 pt-4">
            <h3 className={cn("text-xs font-black uppercase tracking-[0.3em]", isDarkTheme ? "text-gray-500" : "text-slate-800")}>Product Details</h3>
            <p className={cn("text-base sm:text-lg leading-relaxed whitespace-pre-wrap font-sans", isDarkTheme ? "font-light opacity-85 text-gray-200" : "font-normal text-slate-900 opacity-100")}>{pageData.productDetails.details || matchingInventory?.details || ''}</p>

            {/* Multi-Item Configuration Panels */}
            {itemConfigs.map((config, idx) => {
              const hasColor = colorsToDisplay?.length > 0;
              const hasSize = sizesToDisplay?.length > 0;
              const hasWeight = weightsToDisplay?.length > 0;

              if (!hasColor && !hasSize && !hasWeight) return null;

              return (
                <div
                  key={`item-config-${idx}`}
                  className={cn(
                    "p-5 rounded-3xl space-y-4 shadow-xl relative overflow-hidden border",
                    isDarkTheme ? "bg-white/[0.03] border-white/10" : "bg-slate-50 border-slate-200"
                  )}
                >
                  <div className="flex justify-between items-center border-b border-current/10 pb-2">
                    <span className={cn("text-[10px] font-black uppercase tracking-widest", isDarkTheme ? "text-dragon-cyan" : "text-indigo-600")}>
                      {translate("product_option_detail_pub", pageData.language, pageData.country).replace("{{index}}", String(idx + 1))} {hasColor && config.color ? `(${config.color})` : ''} {hasSize && config.size ? `(Size: ${config.size})` : ''} {hasWeight && config.weight ? `(Weight: ${config.weight})` : ''}
                    </span>
                    {itemConfigs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setQuantity(q => Math.max(1, q - 1));
                          setItemConfigs(prev => prev.filter((_, i) => i !== idx));
                        }}
                        className="text-[10px] text-rose-400 font-bold hover:underline cursor-pointer"
                      >
                        {translate("remove_item", pageData.language, pageData.country)}
                      </button>
                    )}
                  </div>

                  {/* Color selector for this item */}
                  {hasColor && (
                    <div className="space-y-2">
                      <p className={cn("text-[9px] font-black uppercase tracking-widest", isDarkTheme ? "text-gray-400" : "text-slate-700")}>{translate("select_color", pageData.language, pageData.country)}</p>
                      <div className="flex flex-wrap gap-2">
                        {colorsToDisplay.map((c: string, cIdx: number) => (
                          <button
                            type="button"
                            key={`color-${c}-${cIdx}`}
                            onClick={() => handleUpdateItemConfig(idx, 'color', c)}
                            className={cn(
                              "px-4 py-2 rounded-xl border text-[11px] font-bold uppercase transition-all cursor-pointer lp-variant-btn",
                              config.color === c
                                ? "active bg-dragon-cyan text-dragon-black border-dragon-cyan shadow-md shadow-dragon-cyan/15 font-black"
                                : isDarkTheme
                                  ? "bg-white/10 border-white/20 text-white hover:bg-white/15 hover:border-white/30"
                                  : "bg-white border-slate-300 text-slate-800 hover:bg-slate-50 hover:border-slate-400 shadow-sm"
                            )}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Size selector for this item */}
                  {hasSize && (
                    <div className="space-y-2">
                      <p className={cn("text-[9px] font-black uppercase tracking-widest", isDarkTheme ? "text-gray-400" : "text-slate-700")}>{translate("select_size", pageData.language, pageData.country)}</p>
                      <div className="flex flex-wrap gap-2">
                        {sizesToDisplay.map((s: string, sIdx: number) => (
                          <button
                            type="button"
                            key={`size-${s}-${sIdx}`}
                            onClick={() => handleUpdateItemConfig(idx, 'size', s)}
                            className={cn(
                              "w-10 h-10 rounded-xl border flex items-center justify-center text-[11px] font-bold transition-all cursor-pointer lp-variant-btn",
                              config.size === s
                                ? "active bg-dragon-cyan text-dragon-black border-dragon-cyan shadow-md shadow-dragon-cyan/15 font-black"
                                : isDarkTheme
                                  ? "bg-white/10 border-white/20 text-white hover:bg-white/15 hover:border-white/30"
                                  : "bg-white border-slate-300 text-slate-800 hover:bg-slate-50 hover:border-slate-400 shadow-sm"
                            )}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Weight selector for this item */}
                  {hasWeight && (
                    <div className="space-y-2">
                      <p className={cn("text-[9px] font-black uppercase tracking-widest", isDarkTheme ? "text-gray-400" : "text-slate-700")}>{translate("select_weight", pageData.language, pageData.country)}</p>
                      <div className="flex flex-wrap gap-2">
                        {weightsToDisplay.map((w: string, wIdx: number) => (
                          <button
                            type="button"
                            key={`weight-${w}-${wIdx}`}
                            onClick={() => handleUpdateItemConfig(idx, 'weight', w)}
                            className={cn(
                              "px-4 py-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer lp-variant-btn",
                              config.weight === w
                                ? "active bg-dragon-cyan text-dragon-black border-dragon-cyan shadow-md shadow-dragon-cyan/15 font-black"
                                : isDarkTheme
                                  ? "bg-white/10 border-white/20 text-white hover:bg-white/15 hover:border-white/30"
                                  : "bg-white border-slate-300 text-slate-800 hover:bg-slate-50 hover:border-slate-400 shadow-sm"
                            )}
                          >
                            {w}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Order Section */}
          <div className={cn(
             "p-4 sm:p-8 rounded-2xl sm:rounded-[3rem] border border-current/20 space-y-6 sm:space-y-8 mt-8 sm:mt-12 text-left",
             isDarkTheme ? "bg-white/5 backdrop-blur-2xl" : "bg-slate-50/80 shadow-md text-slate-900"
          )}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black uppercase tracking-widest">Order Now</h3>
                <p className={cn("text-[10px] font-bold uppercase mt-1", isDarkTheme ? "text-gray-500" : "text-slate-600")}>{translate("order_form_heading", pageData.language, pageData.country)}</p>
              </div>
              <div className={cn("flex items-center gap-4 p-2 rounded-2xl border self-start md:self-auto", isDarkTheme ? "bg-black/20 border-white/10" : "bg-white border-slate-300 shadow-sm")}>
                <span className={cn("text-[10px] font-black uppercase pl-2", isDarkTheme ? "text-gray-400" : "text-slate-700")}>Quantity:</span>
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:text-indigo-600 transition-colors"><Minus size={16}/></button>
                <span className="w-8 text-center font-black">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="p-2 hover:text-indigo-600 transition-colors"><Plus size={16}/></button>
              </div>
            </div>


            {/* Delivery Type Toggle */}
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Delivery Location</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDeliveryType('inside')}
                  className={cn(
                    "p-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer lp-delivery-btn",
                    deliveryType === 'inside'
                      ? "active bg-dragon-cyan text-black border-dragon-cyan font-black"
                      : isDarkTheme
                        ? "bg-white/10 border-white/20 text-white hover:bg-white/15 hover:border-white/30"
                        : "bg-white border-slate-300 text-slate-800 hover:bg-slate-50 hover:border-slate-400 shadow-sm"
                  )}
                >
                  {pageData?.deliveryCharges?.insideLabel || ((selectedCountry === 'Bangladesh') ? 'Inside Dhaka' : 'Local Delivery')}
                </button>
                <button
                  onClick={() => setDeliveryType('outside')}
                  className={cn(
                    "p-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer lp-delivery-btn",
                    deliveryType === 'outside'
                      ? "active bg-dragon-cyan text-black border-dragon-cyan font-black"
                      : isDarkTheme
                        ? "bg-white/10 border-white/20 text-white hover:bg-white/15 hover:border-white/30"
                        : "bg-white border-slate-300 text-slate-800 hover:bg-slate-50 hover:border-slate-400 shadow-sm"
                  )}
                >
                  {pageData?.deliveryCharges?.outsideLabel || ((selectedCountry === 'Bangladesh') ? 'Outside Dhaka' : 'Outside City/State')}
                </button>
              </div>

              {/* Custom Specific Area Dropdown if available */}
              {(pageData as any)?.customDeliveryCharges && (pageData as any).customDeliveryCharges.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-dragon-gold ml-1">{translate("or_select_specific_area", pageData.language, pageData.country)}</label>
                  <div className="relative">
                    <select
                      value={deliveryType.startsWith('custom_') ? deliveryType : ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          setDeliveryType(e.target.value);
                        } else {
                          setDeliveryType('inside');
                        }
                      }}
                      className="w-full px-4 py-3 bg-current/5 border border-current/10 rounded-xl text-xs text-current outline-none focus:border-dragon-cyan cursor-pointer appearance-none"
                    >
                      <option value="" className="bg-white text-black dark:bg-zinc-900 dark:text-white text-gray-400">{translate("choose_area", pageData.language, pageData.country)}</option>
                      {(pageData as any).customDeliveryCharges.map((item: any, index: number) => (
                        <option key={`lang-custom-del-${index}`} value={`custom_${index}`} className="bg-white text-black dark:bg-zinc-900 dark:text-white">
                          {item.area} — {activeCountryInfo.currencySymbol} {item.charge} {translate("delivery_charge", pageData.language, pageData.country)}
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

            {/* Localized Cart Fields (Based on Manual Config) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {(() => {
                 const isBengali = activeLanguage === 'bn';
                 const allLibraryFields = getCheckoutFormFields(selectedCountry || pageData?.country || 'Bangladesh');
                 const configuredFields = pageData.orderCartConfig?.checkoutFields || ['name', 'phone', 'address'];

                 return configuredFields.map((fieldKeyOrName: string, fieldIdx: number) => {
                   const libField = allLibraryFields.find(f => f.key === fieldKeyOrName || f.key === fieldKeyOrName.toLowerCase());
                   let fieldObj: any = libField;
                   if (!fieldObj) {
                     const lowerKey = fieldKeyOrName.toLowerCase();
                     if (lowerKey === 'name' || lowerKey === 'full name') {
                       fieldObj = allLibraryFields.find(f => f.key === 'name') || { key: 'name', labelEn: 'Full Name', labelBn: 'পূর্ণ নাম', placeholderEn: 'Enter Full Name', placeholderBn: 'পূর্ণ নাম লিখুন', type: 'text', required: true };
                     } else if (lowerKey === 'mobile' || lowerKey === 'phone' || lowerKey === 'phone/mobile') {
                       fieldObj = allLibraryFields.find(f => f.key === 'phone') || { key: 'phone', labelEn: 'Mobile Number', labelBn: 'মোবাইল নম্বর', placeholderEn: 'Enter Mobile Number', placeholderBn: 'মোবাইল নম্বর লিখুন', type: 'tel', required: true };
                     } else if (lowerKey === 'address' || lowerKey === 'detailed address') {
                       fieldObj = allLibraryFields.find(f => f.key === 'address') || { key: 'address', labelEn: 'Address', labelBn: 'ঠিকানা', placeholderEn: 'Enter Full Address', placeholderBn: 'পূর্ণাঙ্গ ঠিকানা লিখুন', type: 'textarea', required: true };
                     } else {
                       fieldObj = {
                         key: fieldKeyOrName,
                         labelEn: fieldKeyOrName,
                         labelBn: fieldKeyOrName,
                         placeholderEn: `Enter ${fieldKeyOrName}`,
                         placeholderBn: `${fieldKeyOrName} লিখুন`,
                         type: 'text',
                         required: true
                       };
                     }
                   }

                   const label = isBengali ? fieldObj.labelBn : fieldObj.labelEn;
                   const placeholder = isBengali ? fieldObj.placeholderBn : fieldObj.placeholderEn;

                   if (fieldObj.type === 'select') {
                     return (
                       <div key={fieldObj.key} className="space-y-1">
                         <label className="text-[10px] font-black uppercase text-gray-500 ml-1">{label}</label>
                         <div className="relative">
                           <select
                             value={orderForm[fieldObj.key] || ''}
                             onChange={(e) => {
                            const val = e.target.value;
                            setOrderForm(prev => {
                              const updated = { ...prev, [fieldObj.key]: val, [fieldKeyOrName]: val };
                              const lower = (fieldObj.key || fieldKeyOrName || '').toLowerCase();
                              if (lower === 'name' || lower === 'full name') {
                                updated['Name'] = val; updated['name'] = val; updated['Full Name'] = val; updated['fullName'] = val;
                              } else if (lower === 'phone' || lower === 'mobile') {
                                updated['Phone'] = val; updated['phone'] = val; updated['Mobile'] = val; updated['mobile'] = val;
                              } else if (lower === 'address') {
                                updated['Address'] = val; updated['address'] = val;
                              }
                              return updated;
                            });
                          }}
                             className="w-full bg-current/5 border border-current/10 rounded-xl px-4 py-3 outline-none focus:border-dragon-cyan transition-all text-sm appearance-none cursor-pointer"
                           >
                             <option value="" className="bg-white text-black dark:bg-zinc-900 dark:text-white">{placeholder}</option>
                             {fieldObj.options?.map((opt: any) => (
                               <option key={opt.value} value={opt.value} className="bg-white text-black dark:bg-zinc-900 dark:text-white">
                                 {isBengali ? (opt.labelBn || opt.label) : opt.label}
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

                   if (fieldObj.type === 'textarea') {
                     return (
                       <div key={fieldObj.key} className="space-y-1 md:col-span-2">
                         <label className="text-[10px] font-black uppercase text-gray-500 ml-1">{label}</label>
                         <textarea
                           placeholder={placeholder}
                           value={orderForm[fieldObj.key] || ''}
                           onChange={(e) => setOrderForm(prev => ({ ...prev, [fieldObj.key]: e.target.value }))}
                           rows={2}
                           className="w-full bg-current/5 border border-current/10 rounded-xl px-4 py-3 outline-none focus:border-dragon-cyan transition-all text-sm"
                         />
                       </div>
                     );
                   }

                   return (
                     <div key={fieldObj.key} className="space-y-1">
                       <label className="text-[10px] font-black uppercase text-gray-500 ml-1">{label}</label>
                       <input
                         type={fieldObj.type}
                         placeholder={placeholder}
                         value={orderForm[fieldObj.key] || ''}
                         onChange={(e) => setOrderForm(prev => ({ ...prev, [fieldObj.key]: e.target.value }))}
                         className="w-full bg-current/5 border border-current/10 rounded-xl px-4 py-3 outline-none focus:border-dragon-cyan transition-all text-sm"
                       />
                     </div>
                   );
                 });
               })()}
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-gray-500 ml-1">{translate("delivery_charge", pageData.language, pageData.country)}</label>
                 <div className="w-full bg-current/5 border border-current/10 rounded-xl px-4 py-3 text-sm font-bold">{activeCountryInfo.currencySymbol} {deliveryCharge}</div>
               </div>
            </div>

            {/* Payment Methods Badges */}
            <div className="space-y-2">
               <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Payment Method</p>
               <div className="flex flex-wrap gap-2">
                 {pageData.paymentSettings?.cod && (
                   <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-lg text-[9px] font-black uppercase text-green-500">Cash On Delivery</span>
                 )}
                 {pageData.paymentSettings?.advance && (
                   <span className="px-3 py-1 bg-dragon-cyan/10 border border-dragon-cyan/20 rounded-lg text-[9px] font-black uppercase text-dragon-cyan">Advance Payment</span>
                 )}
               </div>
            </div>

            <div className="pt-4 border-t border-current/10">
               <div className="flex justify-between items-center mb-6">
                 <span className="text-gray-500 font-bold uppercase tracking-widest">{translate("total", pageData.language, pageData.country)}</span>
                 <span className="text-3xl font-black text-dragon-cyan">{activeCountryInfo.currencySymbol} {( (pageData.productDetails.offerPrice || pageData.productDetails.price) * quantity) + deliveryCharge}</span>
               </div>
                              <button
                 onClick={handleOrder}
                 disabled={isOrdering}
                 className="w-full py-6 font-black uppercase tracking-[0.3em] text-sm rounded-[2rem] shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: pageData.buttonBg || '#00f2fe',
                    color: pageData.buttonTextColor || '#000000',
                    boxShadow: `0 20px 40px -10px ${pageData.buttonBg || 'rgba(0,242,254,0.3)'}`
                  }}
                >
                  {isOrdering ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      {pageData.language === 'Bangla' || pageData.language === 'bn' ? 'অর্ডার প্রসেস হচ্ছে...' : 'Processing Order...'}
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={20} />
                      {translate("place_order_btn", pageData.language, pageData.country)}
                    </>
                  )}
                </button>
            </div>
          </div>
            </>
          ) : (
            <div className="mt-8 pt-8 border-t border-white/10 bg-black/20 p-6 rounded-[2rem] text-left">
              <ProductReviewsSection 
                websiteId={pageData.websiteId} 
                productId={pageData.inventoryId || pageId} 
                productName={pageData.productDetails.title} 
                ownerId={pageData.userId}
              />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-4 sm:px-12 py-8 sm:py-12 border-t border-current/10 bg-current/5 custom-lp-footer">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 sm:gap-12">
          <div className="space-y-6 md:col-span-2">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black uppercase tracking-tight">{storeIdentity.name}</span>
            </div>
            <p className="text-sm font-light opacity-60 leading-relaxed max-w-sm">{pageData.shortDetails || 'Direct-to-consumer elite marketplace powered by next-gen automation.'}</p>
            <div className="flex items-center gap-6">
              {pageData.socialLinks?.youtube && <a href={pageData.socialLinks.youtube} className="hover:text-red-500 transition-colors"><Youtube size={20}/></a>}
              {pageData.socialLinks?.tiktok && <a href={pageData.socialLinks.tiktok} className="hover:text-white transition-colors"><Zap size={20}/></a>}
              {pageData.socialLinks?.fbPage && <a href={pageData.socialLinks.fbPage} className="hover:text-blue-500 transition-colors"><Facebook size={20}/></a>}
              {pageData.socialLinks?.instagram && <a href={pageData.socialLinks.instagram} className="hover:text-pink-500 transition-colors"><Instagram size={20}/></a>}
            </div>
          </div>

          <div className="space-y-4">
             <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40">Support</h4>
             <ul className="space-y-2 text-sm font-medium">
               <li><button className="hover:opacity-100 opacity-60 transition-opacity">Privacy Policy</button></li>
               <li><button className="hover:opacity-100 opacity-60 transition-opacity">Terms of Service</button></li>
               <li><button className="hover:opacity-100 opacity-60 transition-opacity">Contact Us</button></li>
             </ul>
          </div>

          <div className="space-y-4" id="contact">
            {pageData.messagingChannel && (
              <button
                onClick={handleChatRedirect}
                className="w-full py-4 rounded-2xl bg-current text-white flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all"
                style={{ backgroundColor: pageData.buttonBg || (theme === 'light' ? '#18181b' : 'white'), color: pageData.buttonTextColor || (theme === 'light' ? 'white' : 'black') }}
              >
                <MessageCircle size={18} />
                Chat on {pageData.messagingChannel} {pageData.messagingNumber ? `(${pageData.messagingNumber})` : ''}
              </button>
            )}
            <div className="text-center pt-4 flex flex-col items-center gap-3">
              {/* SSL Certification indicator */}
              <div className="flex items-center gap-1.5 bg-[#10b981]/5 border border-[#10b981]/20 px-3 py-1 rounded-xl text-[8px] font-black text-[#10b981] uppercase tracking-widest">
                <ShieldCheck size={12} className="text-[#10b981] animate-pulse shrink-0" />
                <span>{translate("ssl_secured_cert", pageData.language, pageData.country)}</span>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest opacity-30">© {new Date().getFullYear()} {storeIdentity.name}</p>
                <p className="text-[8px] font-black uppercase tracking-widest opacity-20 mt-1">POWERED BY DOELpro</p>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {orderConfirmed && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-md bg-[#0e121e] border border-emerald-500/30 p-8 sm:p-10 rounded-[2.5rem] text-center space-y-6 shadow-[0_0_50px_rgba(16,185,129,0.2)]"
            >
              <div className="relative w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-400 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <Check size={42} strokeWidth={3} className="animate-in zoom-in duration-300" />
              </div>

              <div className="space-y-3">
                <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white bg-gradient-to-r from-emerald-400 via-teal-200 to-cyan-400 bg-clip-text text-transparent">
                  Order Placed Successfully!
                </h3>
                <p className="text-sm text-gray-300 font-medium leading-relaxed font-sans">
                  Thank you for your order! Your purchase has been confirmed and our dispatch team is now preparing your parcel for shipping.
                </p>

                {confirmedOrderId && (
                  <div className="pt-2">
                    <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400/80 mb-1">
                      Order Reference ID
                    </div>
                    <p className="text-sm font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 py-2.5 px-4 rounded-xl select-all font-bold">
                      #{confirmedOrderId}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-2">
                {confirmedOrderId && (
                  <a
                    href={`/track-order/${confirmedOrderId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 bg-gradient-to-r from-emerald-400 to-cyan-500 hover:brightness-110 active:scale-95 text-black font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    <Truck size={18} strokeWidth={2.5} /> Track Order Live
                  </a>
                )}
                <button
                  onClick={() => setOrderConfirmed(false)}
                  className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-black uppercase tracking-widest text-[11px] rounded-2xl border border-white/10 transition-all cursor-pointer"
                >
                  Close & Continue
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Location Permission / WhatsApp Fallback Modal */}
        {showLocationModal && (
          <div 
            onClick={() => setShowLocationModal(false)}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md cursor-pointer"
          >
            <motion.div
              key="location-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-[#121624] border border-amber-500/30 rounded-3xl p-6 text-white shadow-2xl text-center space-y-4 cursor-default"
            >
              <button
                onClick={() => setShowLocationModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto animate-pulse">
                <MapPin size={32} />
              </div>

              <div>
                <h3 className="text-lg font-black text-white">
                  {activeLanguage === 'bn' ? 'লাইভ লোকেশন পারমিশন প্রয়োজন' : 'Live Location Permission Required'}
                </h3>
                <p className="text-xs text-amber-300/90 font-medium mt-1">
                  {locationModalError || (activeLanguage === 'bn' ? 'অর্ডারের জন্য ব্রাউজারের লোকেশন অন রাখা বাধ্যতামূলক।' : 'Location permission is required to process this order.')}
                </p>
              </div>

              {/* Steps to enable in Chrome */}
              <div className="bg-black/40 border border-white/10 rounded-2xl p-3.5 text-left text-xs text-gray-300 space-y-1.5">
                <p className="font-bold text-gray-200 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle size={13} className="text-amber-400 shrink-0" />
                  {activeLanguage === 'bn' ? 'ক্রোমে লোকেশন এলাউ করার নিয়ম:' : 'How to enable in Chrome:'}
                </p>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-gray-400 pl-1">
                  <li>{activeLanguage === 'bn' ? 'ব্রাউজারের উপরে অ্যাড্রেস বারের বামে 🔒 বা ⚙️ (সেটিংস) আইকনে ট্যাপ করুন।' : 'Tap the 🔒 or ⚙️ icon in browser address bar.'}</li>
                  <li>{activeLanguage === 'bn' ? 'Permissions / Site Settings এ গিয়ে Location: Allow সিলেক্ট করুন।' : 'Go to Permissions / Site Settings and select Location: Allow.'}</li>
                  <li>{activeLanguage === 'bn' ? 'পেজটি রিফ্রেশ করে পুনরায় চেষ্টা করুন।' : 'Refresh the page and try again.'}</li>
                </ol>
              </div>

              {/* Action buttons */}
              <div className="space-y-2.5 pt-1">
                {/* Retry Location Button */}
                <button
                  onClick={async () => {
                    setIsRetryingLocation(true);
                    try {
                      const loc = await getLiveLocation(true);
                      setCachedLocation(loc);
                      setShowLocationModal(false);
                      alert(activeLanguage === 'bn' ? 'গিপিএস লোকেশন সফলভাবে পাওয়া গেছে! এবার "অর্ডার করুন" বাটনে ক্লিক করুন।' : 'GPS Location detected! Click order button now.');
                    } catch (err: any) {
                      setLocationModalError(err.message || 'Location permission denied');
                    } finally {
                      setIsRetryingLocation(false);
                    }
                  }}
                  disabled={isRetryingLocation}
                  className="w-full py-3 bg-gradient-to-r from-dragon-cyan to-blue-500 text-black font-black uppercase text-xs rounded-xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                >
                  {isRetryingLocation ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {activeLanguage === 'bn' ? 'চেষ্টা করা হচ্ছে...' : 'Testing Location...'}
                    </>
                  ) : (
                    <>
                      <MapPin size={16} />
                      {activeLanguage === 'bn' ? 'পুনরায় লোকেশন চেষ্টা করুন' : 'Retry Location Permission'}
                    </>
                  )}
                </button>

                {/* WhatsApp Order Fallback Button if whatsapp number available */}
                {(() => {
                  const rawWp = pageData?.messagingNumber || pageData?.whatsappNumber || pageData?.whatsapp || pageData?.socialLinks?.whatsapp || pageData?.phone || ownerProfile?.phone || ownerProfile?.whatsapp || '';
                  let cleanWp = rawWp.replace(/[^0-9]/g, '');
                  if (cleanWp.startsWith('01') && cleanWp.length === 11) {
                    cleanWp = '88' + cleanWp;
                  }
                  if (!cleanWp) return null;

                  const productTitle = pageData?.productDetails?.title || 'Product';
                  const landingPageUrl = window.location.href;
                  const custName = orderForm['name'] || orderForm['Name'] || orderForm['Full Name'] || orderForm['fullName'] || '';
                  const custPhone = orderForm['phone'] || orderForm['Phone'] || orderForm['Mobile'] || '';
                  const custAddress = orderForm['address'] || orderForm['Address'] || '';

                  const textMsg = `হ্যালো, আমি "${productTitle}" পণ্যটি সরাসরি অর্ডার করতে চাই।\n\n📌 ল্যান্ডিং পেজ লিংক: ${landingPageUrl}\n👤 নাম: ${custName || 'অনির্ধারিত'}\n📞 ফোন: ${custPhone || 'অনির্ধারিত'}\n📍 ঠিকানা: ${custAddress || 'অনির্ধারিত'}\n\n(ব্রাউজারে লোকেশন ব্লক থাকায় সরাসরি হোয়াটসঅ্যাপে মেসেজ পাঠালাম)`;
                  const waUrl = `https://wa.me/${cleanWp}?text=${encodeURIComponent(textMsg)}`;

                  return (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 bg-[#25D366] hover:bg-[#20bd5a] text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                    >
                      <MessageCircle size={18} fill="black" />
                      {activeLanguage === 'bn' ? 'হোয়াটসঅ্যাপে সরাসরি অর্ডার করুন' : 'Order via WhatsApp'}
                    </a>
                  );
                })()}

                <button
                  onClick={() => setShowLocationModal(false)}
                  className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  {activeLanguage === 'bn' ? 'বন্ধ করুন' : 'Close'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Smart Country & Language Modal Popup */}
        {showCountryLangModal && (
          <div 
            onClick={() => setShowCountryLangModal(false)}
            className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md cursor-pointer"
          >
            <motion.div
              key="country-lang-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg bg-[#121624] border border-white/10 rounded-3xl p-6 text-white shadow-2xl space-y-5 max-h-[90vh] flex flex-col cursor-default"
            >
              <button
                onClick={() => setShowCountryLangModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
              >
                <X size={18} />
              </button>

              {/* Header */}
              <div className="flex items-center gap-3 pr-8">
                <div className="w-12 h-12 rounded-2xl bg-dragon-cyan/10 border border-dragon-cyan/30 text-dragon-cyan flex items-center justify-center shrink-0">
                  <Globe size={24} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {activeLanguage === 'bn' ? 'দেশ ও ভাষা নির্বাচন করুন' : 'Select Country & Language'}
                  </h3>
                  <p className="text-xs text-gray-400 font-medium">
                    {activeLanguage === 'bn'
                      ? 'মুদ্রা, ডেলিভারি চার্জ ও ভাষা নিয়ন্ত্রণ করুন'
                      : 'Choose your region for accurate pricing & currency'}
                  </p>
                </div>
              </div>

              <div className="overflow-y-auto space-y-5 pr-1 flex-1 custom-scrollbar">
                {/* Language Selection */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-wider text-dragon-cyan flex items-center gap-1.5">
                    <Languages size={13} />
                    {activeLanguage === 'bn' ? 'ভাষা নির্বাচন করুন (Language)' : 'Select Language'}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { code: 'bn', label: 'বাংলা (Bengali)', flag: '🇧🇩' },
                      { code: 'en', label: 'English', flag: '🇺🇸' },
                      { code: 'ar', label: 'العربية (Arabic)', flag: '🇸🇦' },
                      { code: 'es', label: 'Español', flag: '🇪🇸' },
                      { code: 'fr', label: 'Français', flag: '🇫🇷' },
                      { code: 'hi', label: 'हिन्दी (Hindi)', flag: '🇮🇳' },
                      { code: 'id', label: 'Indonesia', flag: '🇮🇩' },
                      { code: 'ms', label: 'Malay', flag: '🇲🇾' },
                      { code: 'ur', label: 'اردو (Urdu)', flag: '🇵🇰' }
                    ].map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => setUserSelectedLanguage(lang.code)}
                        className={cn(
                          "p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                          activeLanguage === lang.code
                            ? "bg-dragon-cyan/15 border-dragon-cyan text-dragon-cyan shadow-md shadow-dragon-cyan/10"
                            : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        <span className="text-sm">{lang.flag}</span>
                        <span className="truncate">{lang.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Country Selection */}
                <div className="space-y-2.5 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black uppercase tracking-wider text-dragon-cyan flex items-center gap-1.5">
                      <MapPin size={13} />
                      {activeLanguage === 'bn' ? 'দেশ সিলেক্ট করুন (Country & Currency)' : 'Select Country & Currency'}
                    </label>
                    <span className="text-[10px] text-gray-400 font-bold">
                      {selectedCountry} ({activeCountryInfo.currencySymbol} {activeCountryInfo.currency})
                    </span>
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      value={countrySearchQuery}
                      onChange={(e) => setCountrySearchQuery(e.target.value)}
                      placeholder={activeLanguage === 'bn' ? 'দেশ খুঁজুন...' : 'Search country...'}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-xs text-white placeholder-gray-500 outline-none focus:border-dragon-cyan transition-all"
                    />
                    {countrySearchQuery && (
                      <button
                        onClick={() => setCountrySearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  {/* Country List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {COUNTRIES.filter(c => 
                      c.name.toLowerCase().includes(countrySearchQuery.toLowerCase()) ||
                      (c.bengaliName && c.bengaliName.toLowerCase().includes(countrySearchQuery.toLowerCase())) ||
                      c.currency.toLowerCase().includes(countrySearchQuery.toLowerCase())
                    ).map(cty => {
                      const isSelected = selectedCountry === cty.name;
                      return (
                        <button
                          key={cty.name}
                          onClick={() => {
                            setSelectedCountry(cty.name);
                            if (!userSelectedLanguage) {
                              const autoLang = COUNTRY_TO_LANG[cty.name] || 'en';
                              setUserSelectedLanguage(autoLang);
                            }
                          }}
                          className={cn(
                            "p-2.5 rounded-xl border text-left text-xs font-semibold transition-all flex items-center justify-between cursor-pointer",
                            isSelected
                              ? "bg-dragon-cyan/20 border-dragon-cyan text-white shadow-md shadow-dragon-cyan/10"
                              : "bg-white/5 border-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
                          )}
                        >
                          <div className="truncate pr-2">
                            <p className="font-bold truncate text-white">{cty.name}</p>
                            <p className="text-[10px] text-gray-400">{cty.bengaliName}</p>
                          </div>
                          <span className={cn("text-xs font-black px-2 py-0.5 rounded-lg shrink-0", isSelected ? "bg-dragon-cyan text-black" : "bg-white/10 text-gray-300")}>
                            {cty.currencySymbol} {cty.currency}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Done Button */}
              <div className="pt-2 border-t border-white/10">
                <button
                  onClick={() => setShowCountryLangModal(false)}
                  className="w-full py-3 bg-gradient-to-r from-dragon-cyan to-blue-500 text-black font-black uppercase text-xs tracking-wider rounded-xl hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-dragon-cyan/20"
                >
                  <Check size={16} />
                  {activeLanguage === 'bn' ? 'সেভ ও কনফার্ম করুন' : 'Confirm & Save'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Smart Country & Language Switcher */}
      <div className="fixed bottom-6 left-6 z-[150] shadow-2xl">
        <button
          onClick={() => setShowCountryLangModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-black/85 hover:bg-black text-white text-[11px] font-extrabold rounded-full border border-white/20 shadow-2xl backdrop-blur-md transition-all active:scale-95 cursor-pointer group"
        >
          <Globe size={15} className="text-dragon-cyan group-hover:rotate-45 transition-transform" />
          <span>{selectedCountry}</span>
          <span className="w-1 h-1 rounded-full bg-white/40" />
          <span className="text-dragon-cyan uppercase">{LANGUAGE_NAMES[activeLanguage] || activeLanguage}</span>
        </button>
      </div>

      {/* Dragon AI Chatbot */}
      {pageData?.userId && pageData?.dragonBotEnabled === true && (
        <DragonBotMessenger
          userId={pageData.userId}
          storeName={pageData.storeName || pageData.brandName || pageData?.productDetails?.title || 'DOELpro'}
          chatSourceId={`lp_${pageId}`}
          activeProduct={{
            name: pageData?.productDetails?.title || (pageData.language === 'bn' ? "পণ্য" : "Product"),
            price: pageData?.productDetails?.offerPrice || pageData?.productDetails?.price || "",
            details: pageData?.productDetails?.details || "",
            image: pageData?.productDetails?.image || pageData?.productImages?.[0] || ""
          }}
        />
      )}
    </div>
  );
};

// Background Components
const GalaxyBackground = () => (
  <div className="fixed inset-0 pointer-events-none -z-10 bg-[#0b001a]">
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/20 blur-[150px] rounded-full animate-pulse" />
    <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] bg-blue-500/10 blur-[120px] rounded-full" />
  </div>
);

const BubbleBackground = () => (
  <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
     {[1,2,3,4,5].map(i => (
       <motion.div
        key={i}
        animate={{
          y: [0, -100, 0],
          x: [0, 50, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{ duration: 10 + i, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl"
        style={{ top: `${20*i}%`, left: `${15*i}%` }}
       />
     ))}
  </div>
);

const CinematicOverlay = () => (
  <div className="fixed inset-0 pointer-events-none -z-10">
    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_black_90%)] opacity-60" />
  </div>
);

export default PublishedLandingPage;
