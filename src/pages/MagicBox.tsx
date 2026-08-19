import React, { useState, useEffect, useContext } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, setDoc, doc, limit, getDoc, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { getCachedDoc } from '../utils/firestoreCache';
import { AuthContext } from '../authContext';
import { PageContainer } from '../components/Navigation';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Zap, 
  Facebook, 
  MessageCircle, 
  Globe, 
  Webhook, 
  Key, 
  Info, 
  CheckCircle, 
  AlertCircle,
  Copy,
  ExternalLink,
  Smartphone,
  Settings,
  Instagram,
  Send,
  MessageSquare,
  Phone,
  PhoneCall,
  Video,
  TrendingUp,
  Bot,
  Truck,
  CreditCard,
  X,
  Sparkles
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { BrandSvgIcon } from '../components/BrandSvgIcon';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts';
import { RealPaymentGatewayModal } from '../components/RealPaymentGatewayModal';

interface AutomationConfig {
  id: string;
  userId: string;
  platform: 'facebook' | 'whatsapp' | 'messenger' | 'instagram' | 'telegram' | 'wechat' | 'viber' | 'line' | 'tiktok';
  webhookUrl?: string;
  verifyToken?: string;
  accessToken: string;
  pageId?: string;
  pageName?: string;
  brandName?: string;
  botToken?: string; // For Telegram
  status: 'active' | 'paused';
  trialStartTime?: string;
  paymentStatus?: 'pending' | 'approved' | 'rejected' | 'none';
  selectedPlan?: '1_month' | '3_months';
  expiryTime?: string;
  paymentPhone?: string;
  paymentTrxId?: string;
  subscribedPageIds?: string;
}

const PLATFORM_PRICING: Record<string, {
  name: string;
  bd: { '1_month': number; '3_months': number };
  intl: { '1_month': number; '3_months': number };
  desc: string;
}> = {
  facebook: {
    name: 'Facebook Auto-Reply (Comments)',
    bd: { '1_month': 1000, '3_months': 2500 },
    intl: { '1_month': 10, '3_months': 25 },
    desc: 'Automate comment replies for Facebook posts. (Per page basis. Only subscribed pages will be active, not all pages).'
  },
  messenger: {
    name: 'Messenger Orders',
    bd: { '1_month': 2000, '3_months': 5500 },
    intl: { '1_month': 20, '3_months': 50 },
    desc: 'Automate chat replies and order taking on Facebook Messenger.'
  },
  whatsapp: {
    name: 'WhatsApp Business',
    bd: { '1_month': 2000, '3_months': 5500 },
    intl: { '1_month': 20, '3_months': 50 },
    desc: 'Automate customer support and sales via WhatsApp Business API.'
  },
  instagram: {
    name: 'Instagram DM Bot',
    bd: { '1_month': 1500, '3_months': 4000 },
    intl: { '1_month': 15, '3_months': 35 },
    desc: 'Automate direct message replies and story mention responses on Instagram.'
  },
  tiktok: {
    name: 'TikTok Automation',
    bd: { '1_month': 2000, '3_months': 5500 },
    intl: { '1_month': 20, '3_months': 50 },
    desc: 'Automate chat replies and interactions on TikTok.'
  },
  telegram: {
    name: 'Telegram Bot',
    bd: { '1_month': 2500, '3_months': 7000 },
    intl: { '1_month': 20, '3_months': 55 },
    desc: 'Automate replies and customer interaction on Telegram Channels and Groups.'
  },
  wechat: {
    name: 'WeChat Mini App',
    bd: { '1_month': 2500, '3_months': 7000 },
    intl: { '1_month': 20, '3_months': 55 },
    desc: 'Automate customer replies and service notifications in WeChat.'
  },
  viber: {
    name: 'Viber Public Account',
    bd: { '1_month': 2000, '3_months': 5500 },
    intl: { '1_month': 20, '3_months': 50 },
    desc: 'Automate customer support and broad communication on Viber.'
  },
  line: {
    name: 'Line Official Account',
    bd: { '1_month': 2000, '3_months': 5500 },
    intl: { '1_month': 20, '3_months': 50 },
    desc: 'Automate support and notifications on Line Official Accounts.'
  }
};

const getBrandIcon = (platform: string, size: number = 24) => {
  return <BrandSvgIcon platform={platform} variant="badge" badgeSizeClass="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl" size={size} />;
};

export default function MagicBox() {
  const { user } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [configs, setConfigs] = useState<AutomationConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'status' | 'setup'>('status');
  const [copied, setCopied] = useState<string | null>(null);
  const navigate = useNavigate();

  const [dbPricing, setDbPricing] = useState<any>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    getCachedDoc('global_settings', 'pricing').then((data) => {
      if (data) {
        setDbPricing(data);
      }
    }).catch(err => {
      console.warn("Failed to load global pricing settings:", err);
    });
  }, []);

  const getPlatformPrice = (platformId: string, duration: '1_month' | '3_months', mode: 'bd' | 'intl') => {
    const configKey = platformId === 'facebook' ? 'facebook' :
                      platformId === 'messenger' ? 'messenger' :
                      platformId === 'whatsapp' ? 'whatsapp' :
                      platformId === 'instagram' ? 'instagram' :
                      platformId === 'tiktok' ? 'tiktok' :
                      platformId === 'telegram' ? 'telegram' : 'bot';
    
    if (dbPricing?.magic_box?.[configKey]?.[mode]?.[duration] !== undefined) {
      return dbPricing.magic_box[configKey][mode][duration];
    }
    return PLATFORM_PRICING[platformId]?.[mode]?.[duration] ?? 1000;
  };

  // Global bKash setup
  const [bkashSettings, setBkashSettings] = useState<any>({
    manualNumber: '01700-000000',
    autoPaymentEnabled: false
  });

  // Plan Upgrade states
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedUpgradePlatform, setSelectedUpgradePlatform] = useState<{ id: string; name: string } | null>(null);
  const [selectedPlanDuration, setSelectedPlanDuration] = useState<'1_month' | '3_months'>('1_month');
  const [billingCountry, setBillingCountry] = useState<'bd' | 'intl'>('bd');

  // Manual bKash Pay Form
  const [bkashSenderPhone, setBkashSenderPhone] = useState('');
  const [bkashTrxId, setBkashTrxId] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Automated bKash Pay Portal Simulator
  const [showAutoBkashGateway, setShowAutoBkashGateway] = useState(false);
  const [showRealBkashModal, setShowRealBkashModal] = useState(false);
  const [bkashWalletPhone, setBkashWalletPhone] = useState('');
  const [bkashPin, setBkashPin] = useState('');
  const [autoBkashStep, setAutoBkashStep] = useState<'phone' | 'otp' | 'pin'>('phone');
  const [autoBkashOtp, setAutoBkashOtp] = useState('');

  // Stripe Pay Form
  const [stripeCardNum, setStripeCardNum] = useState('');
  const [stripeExpiry, setStripeExpiry] = useState('');
  const [stripeCvc, setStripeCvc] = useState('');
  const [stripeName, setStripeName] = useState('');
  const [payingStripe, setPayingStripe] = useState(false);

  useEffect(() => {
    if (tabParam && (tabParam === 'status' || tabParam === 'setup')) {
      setActiveTab(tabParam as any);
    }
  }, [tabParam]);

  // Load global bkash configuration
  useEffect(() => {
    getCachedDoc('global_settings', 'bkash').then((d) => {
      if (d) {
        setBkashSettings({
          manualNumber: d.manualNumber || '01700-000000',
          autoPaymentEnabled: d.autoPaymentEnabled || false
        });
      }
    }).catch(err => {
      console.warn("Could not load global bkash settings:", err);
    });
  }, []);

  // Automated Meta Connection
  const [connectingMeta, setConnectingMeta] = useState(false);
  const [metaPages, setMetaPages] = useState<any[]>([]);
  const [showPageSelector, setShowPageSelector] = useState(false);
  const [userAccessToken, setUserAccessToken] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'facebook' | 'whatsapp' | 'tiktok'>('facebook');

  const handleConnectFacebook = async (type: 'facebook' | 'whatsapp' | 'tiktok' = 'facebook') => {
    setConnectingMeta(true);
    setFilterType(type);
    try {
      const endpoint = type === 'tiktok' ? '/api/auth/tiktok/url' : '/api/auth/facebook/url';
      const res = await fetch(endpoint);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to get auth URL');
      }
      const { url } = await res.json();
      
      const popup = window.open(url, type === 'tiktok' ? 'tiktok_oauth' : 'fb_oauth', 'width=600,height=700');
      if (!popup) alert('Please allow popups');
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Connection failed');
      setConnectingMeta(false);
    }
  };

  useEffect(() => {
    const handleAuthMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'FB_AUTH_SUCCESS') {
        const token = event.data.accessToken;
        setUserAccessToken(token);
        
        try {
          const pagesRes = await fetch(`https://graph.facebook.com/v21.0/me/accounts?access_token=${token}`);
          const pagesData = await pagesRes.json();
          
          const wabaRes = await fetch(`https://graph.facebook.com/v21.0/me/whatsapp_business_accounts?access_token=${token}`);
          const wabaData = await wabaRes.json();

          const combinedAccounts = [
            ...(pagesData.data || []).map((p: any) => ({ ...p, type: 'facebook' })),
            ...(wabaData.data || []).map((w: any) => ({ ...w, type: 'whatsapp', name: w.name || 'WhatsApp Business' }))
          ];

          setMetaPages(combinedAccounts);
          setShowPageSelector(true);
        } catch (err) {
          console.error('Error fetching Meta accounts:', err);
        } finally {
          setConnectingMeta(false);
        }
      } else if (event.data?.type === 'TIKTOK_AUTH_SUCCESS') {
        const { accessToken, openId, displayName } = event.data;
        try {
          await handleSaveConfig('tiktok', {
            pageId: openId,
            pageName: displayName || 'TikTok Account',
            accessToken: accessToken,
            status: 'active'
          });
          alert('TikTok Connected Successfully!');
        } catch (err) {
          console.error('Error saving TikTok config:', err);
        } finally {
          setConnectingMeta(false);
        }
      }
    };
    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, [userAccessToken, configs]);

  const handleSelectPage = async (account: any) => {
    try {
      if (account.type === 'whatsapp') {
        const res = await fetch(`https://graph.facebook.com/v21.0/${account.id}/phone_numbers?access_token=${userAccessToken}`);
        const data = await res.json();
        
        if (data.data && data.data.length > 0) {
          const phone = data.data[0];
          await handleSaveConfig('whatsapp', {
            pageId: phone.id,
            pageName: phone.display_phone_number || account.name,
            accessToken: userAccessToken!,
            status: 'active'
          });
          alert(`WhatsApp (${phone.display_phone_number}) connected successfully!`);
        } else {
          alert('No verified phone numbers found in this WhatsApp account.');
        }
      } else {
        await handleSaveConfig('facebook', {
          pageId: account.id,
          pageName: account.name,
          accessToken: account.access_token,
          status: 'active'
        });
        alert(`${account.name} (Facebook) connected successfully!`);
      }
      setShowPageSelector(false);
    } catch (err) {
      console.error('Error saving account config:', err);
      alert('Failed to save configuration');
    }
  };

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'magic_box'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      setConfigs(snap.docs.map(d => ({ id: d.id, ...d.data() } as AutomationConfig)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'magic_box');
    });
    return () => unsubscribe();
  }, [user]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const getPlatformStatus = (config: any) => {
    if (!config) {
      return {
        text: 'Not Configured',
        colorClass: 'text-gray-500 bg-white/5 border-white/10',
        isActive: false,
        status: 'not_configured'
      };
    }

    const isKeysSet = config.accessToken || config.botToken || config.verifyToken || config.pageId;
    if (!isKeysSet) {
      return {
        text: 'Not Configured',
        colorClass: 'text-gray-500 bg-white/5 border-white/10',
        isActive: false,
        status: 'not_configured'
      };
    }

    if (config.paymentStatus === 'approved') {
      const expTime = config.expiryTime ? new Date(config.expiryTime).getTime() : 0;
      if (expTime > Date.now()) {
        const dateStr = new Date(expTime).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        return {
          text: `Premium Active (Expires: ${dateStr})`,
          colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 font-bold',
          isActive: true,
          status: 'premium'
        };
      }
    }

    if (config.paymentStatus === 'pending') {
      return {
        text: 'Verification Pending (Admin is reviewing)',
        colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20 font-bold animate-pulse',
        isActive: false,
        status: 'pending'
      };
    }

    if (config.paymentStatus === 'rejected') {
      return {
        text: 'Payment Request Rejected (Resubmit details)',
        colorClass: 'text-rose-400 bg-rose-500/10 border-rose-500/20 font-bold',
        isActive: false,
        status: 'rejected'
      };
    }

    if (config.trialStartTime) {
      const trialStart = new Date(config.trialStartTime).getTime();
      const trialExpiry = trialStart + 48 * 60 * 60 * 1000; // 48 hours
      const diff = trialExpiry - Date.now();
      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return {
          text: `Free Trial Active (${hours}h ${minutes}m left)`,
          colorClass: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20 font-bold animate-pulse',
          isActive: true,
          status: 'trial'
        };
      }
    }

    return {
      text: 'Trial Expired (Upgrade to continue)',
      colorClass: 'text-rose-400 bg-rose-500/10 border-rose-500/20 font-bold',
      isActive: false,
      status: 'expired'
    };
  };

  const handleSaveConfig = async (platform: string, data: Partial<AutomationConfig>) => {
    const existingConfig = configs.find(c => c.platform === platform);
    
    // Check if keys are actually being set
    const isKeysSet = data.accessToken || data.botToken || data.verifyToken || data.pageId;
    const trialStartField = isKeysSet ? { trialStartTime: new Date().toISOString() } : {};

    try {
      if (existingConfig) {
        const updatePayload: any = {
          ...data,
          updatedAt: new Date().toISOString()
        };
        if (isKeysSet && !existingConfig.trialStartTime) {
          updatePayload.trialStartTime = new Date().toISOString();
        }
        await updateDoc(doc(db, 'magic_box', existingConfig.id), updatePayload);
      } else {
        await addDoc(collection(db, 'magic_box'), {
          userId: user?.uid,
          platform,
          status: 'paused',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...trialStartField,
          ...data
        });
      }
    } catch (e) {
      handleFirestoreError(e, existingConfig ? OperationType.UPDATE : OperationType.CREATE, existingConfig ? `magic_box/${existingConfig.id}` : 'magic_box');
    }
  };

  const toggleStatus = async (config: AutomationConfig) => {
    const statusInfo = getPlatformStatus(config);
    if (!statusInfo.isActive && config.status !== 'active') {
      alert(`Your subscription for this platform is inactive/expired. Please upgrade your plan to activate automation!`);
      setSelectedUpgradePlatform({ id: config.platform, name: PLATFORM_PRICING[config.platform]?.name || config.platform });
      setSelectedPlanDuration('1_month');
      setBkashSenderPhone('');
      setBkashTrxId('');
      setShowUpgradeModal(true);
      return;
    }

    const path = `magic_box/${config.id}`;
    try {
      await updateDoc(doc(db, 'magic_box', config.id), {
        status: config.status === 'active' ? 'paused' : 'active',
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  };

  const handleManualBkashPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUpgradePlatform) return;
    if (!bkashSenderPhone.trim()) {
      alert("Please provide your Sender bKash Number!");
      return;
    }
    if (!bkashTrxId.trim()) {
      alert("Please provide your bKash Transaction ID!");
      return;
    }

    setSubmittingPayment(true);
    try {
      const config = configs.find(c => c.platform === selectedUpgradePlatform.id);
      if (!config) {
        alert('Please setup and save this platform API configuration first before purchasing!');
        setShowUpgradeModal(false);
        return;
      }

      await updateDoc(doc(db, 'magic_box', config.id), {
        paymentStatus: 'pending',
        selectedPlan: selectedPlanDuration,
        paymentPhone: bkashSenderPhone.trim(),
        paymentTrxId: bkashTrxId.trim().toUpperCase(),
        paymentSubmittedAt: new Date().toISOString(),
        billingCountryMode: 'bd'
      });

      alert("Your payment verification request has been submitted successfully! Admin will verify and activate your plan within 10-30 minutes. Thank you!");
      setShowUpgradeModal(false);
      setBkashSenderPhone('');
      setBkashTrxId('');
    } catch (err) {
      console.error('Error submitting magic box payment:', err);
      alert('Failed to submit payment details. Please try again.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleAutoBkashSuccess = async () => {
    if (!selectedUpgradePlatform) return;
    try {
      const config = configs.find(c => c.platform === selectedUpgradePlatform.id);
      if (!config) {
        alert('Please setup and save this platform API configuration first before upgrading!');
        return;
      }

      const expDate = new Date();
      if (selectedPlanDuration === '1_month') {
        expDate.setMonth(expDate.getMonth() + 1);
      } else {
        expDate.setMonth(expDate.getMonth() + 3);
      }

      await updateDoc(doc(db, 'magic_box', config.id), {
        paymentStatus: 'approved',
        selectedPlan: selectedPlanDuration,
        expiryTime: expDate.toISOString(),
        paymentSubmittedAt: new Date().toISOString(),
        billingCountryMode: 'bd',
        status: 'active'
      });

      alert(`bKash Auto-Payment of ৳${getPlatformPrice(selectedUpgradePlatform.id, selectedPlanDuration, 'bd')} was successful! Your plan is active until ${expDate.toLocaleDateString()}.`);
      setShowAutoBkashGateway(false);
      setShowUpgradeModal(false);
    } catch (err) {
      console.error(err);
      alert('bKash payment failed.');
    }
  };

  const handleStripePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUpgradePlatform) return;
    if (!stripeCardNum || !stripeExpiry || !stripeCvc || !stripeName) {
      alert('Please fill out all card details to proceed!');
      return;
    }
    
    setPayingStripe(true);
    try {
      const config = configs.find(c => c.platform === selectedUpgradePlatform.id);
      if (!config) {
        alert('Please setup and save this platform API configuration first before upgrading!');
        setShowUpgradeModal(false);
        return;
      }

      const expDate = new Date();
      if (selectedPlanDuration === '1_month') {
        expDate.setMonth(expDate.getMonth() + 1);
      } else {
        expDate.setMonth(expDate.getMonth() + 3);
      }

      await updateDoc(doc(db, 'magic_box', config.id), {
        paymentStatus: 'approved',
        selectedPlan: selectedPlanDuration,
        expiryTime: expDate.toISOString(),
        paymentSubmittedAt: new Date().toISOString(),
        billingCountryMode: 'intl',
        status: 'active'
      });

      alert(`Stripe payment of $${getPlatformPrice(selectedUpgradePlatform.id, selectedPlanDuration, 'intl')} USD was successful! Your premium plan is active until ${expDate.toLocaleDateString()}.`);
      setShowUpgradeModal(false);
      setStripeCardNum('');
      setStripeExpiry('');
      setStripeCvc('');
      setStripeName('');
    } catch (err) {
      console.error(err);
      alert('Stripe payment failed. Please try again.');
    } finally {
      setPayingStripe(false);
    }
  };

  const handleGooglePaySubmit = async () => {
    if (!selectedUpgradePlatform) return;
    setPayingStripe(true);
    try {
      const config = configs.find(c => c.platform === selectedUpgradePlatform.id);
      if (!config) {
        alert('Please setup and save this platform API configuration first before upgrading!');
        setShowUpgradeModal(false);
        return;
      }

      const expDate = new Date();
      if (selectedPlanDuration === '1_month') {
        expDate.setMonth(expDate.getMonth() + 1);
      } else {
        expDate.setMonth(expDate.getMonth() + 3);
      }

      await updateDoc(doc(db, 'magic_box', config.id), {
        paymentStatus: 'approved',
        selectedPlan: selectedPlanDuration,
        expiryTime: expDate.toISOString(),
        paymentSubmittedAt: new Date().toISOString(),
        billingCountryMode: 'intl',
        status: 'active'
      });

      alert(`Google Pay payment was successful! Your premium plan is active until ${expDate.toLocaleDateString()}.`);
      setShowUpgradeModal(false);
    } catch (err) {
      console.error(err);
      alert('Google Pay failed. Please try again.');
    } finally {
      setPayingStripe(false);
    }
  };

  return (
    <PageContainer title="AI AUTOMATION">
      <div className="space-y-6">
        {/* Bot Engine Header & Automation Master Control - Screenshot Matching Design */}
        <div className="space-y-4">
          <div className="bot-master-engine-card bg-white dark:bg-[#121624] border border-gray-200/80 dark:border-white/10 rounded-[28px] p-6 sm:p-10 shadow-xl shadow-gray-200/50 dark:shadow-none">
            {/* Header: Lightning icon + BOT MASTER ENGINE */}
            <div className="flex items-center justify-center sm:justify-start gap-4 sm:gap-5">
              <div className="p-[2px] bg-gradient-to-tr from-purple-400 via-fuchsia-400 to-indigo-500 rounded-[22px] shadow-md shadow-purple-500/15 shrink-0">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[20px] bg-white flex items-center justify-center">
                  <Zap className="w-8 h-8 sm:w-9 sm:h-9 text-purple-600 fill-purple-500/20 stroke-[2.5]" />
                </div>
              </div>
              <div className="text-left">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                  BOT MASTER ENGINE
                </h2>
                <p className="text-[10px] sm:text-xs font-bold text-gray-400 dark:text-gray-400 tracking-widest uppercase mt-0.5">
                  GLOBAL AUTOMATION RESPONSE HUB
                </p>
              </div>
            </div>

            {/* Social Connect Buttons Stack */}
            <div className="mt-8 space-y-3.5 max-w-2xl mx-auto">
              {/* Connect with Facebook */}
              <button
                onClick={() => handleConnectFacebook('facebook')}
                disabled={connectingMeta}
                className="w-full bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-2xl py-4 px-6 sm:px-8 flex items-center shadow-lg shadow-blue-500/20 transition-all transform active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                <div className="w-8 flex items-center justify-center shrink-0">
                  {connectingMeta && filterType === 'facebook' ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white shrink-0">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  )}
                </div>
                <div className="w-[1px] h-6 bg-white/25 mx-4 shrink-0" />
                <span className="font-semibold text-white text-sm sm:text-base tracking-wide flex-1 text-left">
                  Connect with Facebook
                </span>
              </button>

              {/* Connect with WhatsApp */}
              <button
                onClick={() => handleConnectFacebook('whatsapp')}
                disabled={connectingMeta}
                className="w-full bg-[#22c55e] hover:bg-[#1ea850] text-white rounded-2xl py-4 px-6 sm:px-8 flex items-center shadow-lg shadow-green-500/20 transition-all transform active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                <div className="w-8 flex items-center justify-center shrink-0">
                  {connectingMeta && filterType === 'whatsapp' ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white shrink-0">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                    </svg>
                  )}
                </div>
                <div className="w-[1px] h-6 bg-white/25 mx-4 shrink-0" />
                <span className="font-semibold text-white text-sm sm:text-base tracking-wide flex-1 text-left">
                  Connect with WhatsApp
                </span>
              </button>

              {/* Connect with TikTok */}
              <button
                onClick={() => handleConnectFacebook('tiktok')}
                disabled={connectingMeta}
                className="w-full bg-[#000000] hover:bg-[#18181b] text-white rounded-2xl py-4 px-6 sm:px-8 flex items-center shadow-lg shadow-black/30 transition-all transform active:scale-[0.99] disabled:opacity-50 cursor-pointer tiktok-auth-btn"
                style={{ backgroundColor: '#000000', color: '#ffffff' }}
              >
                <div className="w-8 flex items-center justify-center shrink-0">
                  {connectingMeta && filterType === 'tiktok' ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0 tiktok-svg">
                      <path className="tiktok-path-1" fill="#00F2FE" d="M16.6 5.82a5.52 5.52 0 0 1-3.66-2.58V1.5h-3v14.1a3.15 3.15 0 1 1-3.15-3.15c.32 0 .63.05.92.14V9.41a6.15 6.15 0 1 0 5.23 6.09V7.63a8.55 8.55 0 0 0 5.26 1.79v-3.1a5.5 5.5 0 0 1-1.6-.5z"/>
                      <path className="tiktok-path-2" fill="#FF0050" d="M16.1 5.32a5.52 5.52 0 0 1-3.66-2.58V1h-3v14.1a3.15 3.15 0 1 1-3.15-3.15c.32 0 .63.05.92.14V8.91a6.15 6.15 0 1 0 5.23 6.09V7.13a8.55 8.55 0 0 0 5.26 1.79v-3.1a5.5 5.5 0 0 1-1.6-.5z"/>
                      <path className="tiktok-path-3" fill="#FFFFFF" d="M16.35 5.57a5.52 5.52 0 0 1-3.66-2.58V1.25h-3v14.1a3.15 3.15 0 1 1-3.15-3.15c.32 0 .63.05.92.14V9.16a6.15 6.15 0 1 0 5.23 6.09V7.38a8.55 8.55 0 0 0 5.26 1.79v-3.1a5.5 5.5 0 0 1-1.6-.5z"/>
                    </svg>
                  )}
                </div>
                <div className="w-[1px] h-6 bg-white/25 mx-4 shrink-0" />
                <span className="font-semibold text-white text-sm sm:text-base tracking-wide flex-1 text-left">
                  Connect with TikTok
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { id: 'facebook', name: 'Facebook Auto-Reply' },
              { id: 'messenger', name: 'Messenger DM Bot' },
              { id: 'instagram', name: 'Instagram DM Bot' },
              { id: 'whatsapp', name: 'WhatsApp Assistant' },
              { id: 'wechat', name: 'WeChat Official' },
              { id: 'line', name: 'LINE Official' },
              { id: 'viber', name: 'Viber Bot' },
              { id: 'telegram', name: 'Telegram Bot' },
              { id: 'tiktok', name: 'TikTok Automation' },
            ].map(platform => {
              const config = configs.find(c => c.platform === platform.id);
              const isActive = config?.status === 'active';
              
              return (
                <div key={platform.id} className={cn("glass-card p-5 border-white/10 bg-white/5 flex items-center justify-between group transition-all text-left", isActive && "border-white/20 bg-white/10")}>
                  <div className="flex items-center gap-3">
                    <div className={cn("transition-all duration-300", isActive ? "scale-105" : "opacity-80")}>
                      {getBrandIcon(platform.id, 18)}
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-zinc-100 uppercase tracking-widest">{platform.name}</h4>
                      <p className={cn("text-[9px] font-bold uppercase", isActive ? "text-dragon-cyan" : "text-gray-600")}>
                        {isActive ? '● Running' : '○ Standby'}
                      </p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => {
                      if (!config) {
                        if (platform.id === 'whatsapp') handleConnectFacebook('whatsapp');
                        else if (platform.id === 'tiktok') handleConnectFacebook('tiktok');
                        else handleConnectFacebook('facebook');
                      }
                      else if (config) toggleStatus(config);
                    }}
                    className={cn(
                      "custom-toggle-track relative w-12 h-6 rounded-full transition-all duration-300 shrink-0",
                      isActive ? "bg-dragon-cyan active-toggle" : "bg-white/10"
                    )}
                  >
                    <div className={cn(
                      "custom-toggle-thumb absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-md",
                      isActive ? "left-7" : "left-1"
                    )} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Page Selection UI */}
        <AnimatePresence>
          {showPageSelector && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card p-8 border-dragon-cyan/40 bg-backdrop-blur"
            >
               <h3 className="text-sm font-black text-white uppercase mb-6 flex items-center justify-between">
                 <span>Select a Page to Automate</span>
                 <button onClick={() => setShowPageSelector(false)} className="text-gray-500 hover:text-white">Close</button>
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {metaPages.map(acc => (
                     <button 
                       key={acc.id} 
                       onClick={() => handleSelectPage(acc)}
                       className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 hover:border-dragon-cyan hover:bg-dragon-cyan/5 transition-all group relative overflow-hidden"
                     >
                        <div className="absolute top-2 right-2">
                          {acc.type === 'facebook' ? <Facebook size={12} className="text-[#1877F2]" /> : <Phone size={12} className="text-[#25D366]" />}
                        </div>
                        {acc.type === 'facebook' ? (
                          <img src={`https://graph.facebook.com/${acc.id}/picture`} className="w-10 h-10 rounded-lg group-hover:neon-glow" alt="" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center border border-green-500/20">
                             <Phone size={20} className="text-green-500" />
                          </div>
                        )}
                        <div className="text-left">
                           <h4 className="font-bold text-white text-sm uppercase">{acc.name}</h4>
                           <p className="text-[10px] text-gray-500 uppercase tracking-widest">{acc.type === 'facebook' ? (acc.category || 'Facebook Page') : 'WhatsApp Business'}</p>
                        </div>
                     </button>
                   ))}
               </div>
               {metaPages.length === 0 && <p className="text-center py-10 text-gray-500 uppercase font-black text-xs">No pages found in this account.</p>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="bg-white dark:bg-[#0f131f] p-1 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm flex items-center justify-around gap-1 magicbox-tab-bar">
           {(['status', 'setup'] as const).map(tab => (
             <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  navigate(`/magic-box?tab=${tab}`, { replace: true });
                }}
                className={cn(
                  "flex-1 py-2.5 px-4 text-xs font-black uppercase tracking-wider rounded-xl transition-all whitespace-nowrap cursor-pointer",
                  activeTab === tab 
                    ? "bg-[#fff0f5] dark:bg-dragon-cyan/20 text-[#f43f5e] dark:text-dragon-cyan shadow-sm border border-pink-200 dark:border-dragon-cyan/30 font-black" 
                    : "text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 font-bold"
                )}
             >
                {tab === 'status' ? 'AUTOMATIONS' : 'API SETUP GUIDE'}
             </button>
           ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'status' && (
            <motion.div key="status" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col space-y-3 sm:space-y-4 pb-20">
               {[
                 { platform: 'facebook', name: 'Facebook Auto-Reply', icon: <Facebook size={20} /> },
                 { platform: 'messenger', name: 'Messenger Orders', icon: <MessageCircle size={20} /> },
                 { platform: 'whatsapp', name: 'WhatsApp Business', icon: <Smartphone size={20} /> },
                 { platform: 'instagram', name: 'Instagram DM Bot', icon: <Instagram size={20} /> },
                 { platform: 'telegram', name: 'Telegram Bot', icon: <Send size={20} />, isBot: true },
                 { platform: 'wechat', name: 'WeChat Mini App', icon: <Globe size={20} className="text-green-500" /> },
                 { platform: 'viber', name: 'Viber Public Account', icon: <PhoneCall size={20} className="text-purple-500" /> },
                 { platform: 'line', name: 'Line Official Account', icon: <MessageSquare size={20} className="text-green-400" /> },
                 { platform: 'tiktok', name: 'TikTok Automation', icon: <Video size={20} className="text-pink-500" /> },
               ].map(p => {
                 const config = configs.find(c => c.platform === p.platform);
                 const statusInfo = getPlatformStatus(config);
                 return (
                   <PlatformSection 
                     key={p.platform}
                     icon={p.icon} 
                     platform={p.platform}
                     name={p.name} 
                     config={config} 
                     onToggle={toggleStatus}
                     onSave={(data: any) => handleSaveConfig(p.platform, data)}
                     statusInfo={statusInfo}
                     isBot={p.isBot}
                     onUpgrade={() => {
                       setSelectedUpgradePlatform({ id: p.platform, name: PLATFORM_PRICING[p.platform]?.name || p.name });
                       setSelectedPlanDuration('1_month');
                       setBkashSenderPhone('');
                       setBkashTrxId('');
                       setShowUpgradeModal(true);
                     }}
                   />
                 );
               })}
            </motion.div>
          )}

          {activeTab === 'setup' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 pb-20">
               <SetupGuide />
               
               <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 text-left">
                  <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                     <Webhook size={18} className="text-[#f43f5e]" /> API Endpoints
                  </h3>
                  
                  <div className="space-y-4">
                     <IntegrationField 
                        label="Unified Webhook URL" 
                        value={`https://dragonapi.pro/webhook/${user?.uid}`} 
                        onCopy={() => copyToClipboard(`https://dragonapi.pro/webhook/${user?.uid}`, 'url')}
                        isCopied={copied === 'url'}
                     />
                     <IntegrationField 
                        label="Master Verify Token" 
                        value={`dragon_${user?.uid.slice(0, 8)}_magic`} 
                        onCopy={() => copyToClipboard(`dragon_${user?.uid.slice(0, 8)}_magic`, 'token')}
                        isCopied={copied === 'token'}
                     />
                  </div>

                  <div className="pt-6 border-t border-slate-100 space-y-4">
                     <p className="text-[10px] text-slate-500 italic uppercase leading-relaxed font-bold">
                        * Input these into Meta Business Suite Webhook settings.
                     </p>
                     <div className="flex gap-4">
                        <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="flex-1 py-3 bg-pink-50 text-[#f43f5e] border border-pink-200 rounded-xl flex items-center justify-center gap-2 text-xs font-bold hover:bg-pink-100 transition-all">
                           <ExternalLink size={16} /> Open Meta Dev Hub
                        </a>
                     </div>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Plan Upgrade Payment Modal */}
        <AnimatePresence>
          {showUpgradeModal && selectedUpgradePlatform && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white w-full max-w-xl p-6 md:p-8 space-y-6 text-left border border-slate-200 shadow-2xl rounded-3xl max-h-[90vh] overflow-y-auto"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-50 text-[#f43f5e] rounded-xl border border-pink-100">
                      <Zap size={20} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-lg tracking-tight uppercase">Upgrade Automation Bot</h3>
                      <p className="text-xs text-slate-500 uppercase font-mono tracking-wider font-semibold">{selectedUpgradePlatform.name}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowUpgradeModal(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 transition-all hover:bg-slate-100 cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Duration/Billing Country Selection Tabs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Step 1: Select Duration */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">1. Select Plan Duration</label>
                    <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200/60">
                      <button
                        type="button"
                        onClick={() => setSelectedPlanDuration('1_month')}
                        className={cn(
                          "flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer",
                          selectedPlanDuration === '1_month' ? "bg-white text-slate-800 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-800"
                        )}
                      >
                        1 Month Plan
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedPlanDuration('3_months')}
                        className={cn(
                          "flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer",
                          selectedPlanDuration === '3_months' ? "bg-white text-slate-800 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-800"
                        )}
                      >
                        3 Months Plan
                      </button>
                    </div>
                  </div>

                  {/* Step 2: Select Location */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">2. Billing Region</label>
                    <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200/60">
                      <button
                        type="button"
                        onClick={() => setBillingCountry('bd')}
                        className={cn(
                          "flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer",
                          billingCountry === 'bd' ? "bg-[#e2136e] text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
                        )}
                      >
                        Bangladesh (bKash)
                      </button>
                      <button
                        type="button"
                        onClick={() => setBillingCountry('intl')}
                        className={cn(
                          "flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer",
                          billingCountry === 'intl' ? "bg-[#f43f5e] text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
                        )}
                      >
                        International (Stripe)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Platform description */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 leading-relaxed text-left">
                  <span className="text-slate-900 font-extrabold block mb-1">About {selectedUpgradePlatform.name}:</span>
                  {PLATFORM_PRICING[selectedUpgradePlatform.id]?.desc || ""}
                </div>

                {/* Plan Pricing Panel */}
                <div className="p-5 bg-gradient-to-br from-pink-50/50 to-slate-50 rounded-2xl border border-pink-100 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Amount to Pay</p>
                    <h4 className="text-3xl font-extrabold text-slate-900">
                      {billingCountry === 'bd' ? (
                        <>৳{getPlatformPrice(selectedUpgradePlatform.id, selectedPlanDuration, 'bd')}</>
                      ) : (
                        <>${getPlatformPrice(selectedUpgradePlatform.id, selectedPlanDuration, 'intl')} <span className="text-xs text-slate-500">USD</span></>
                      )}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1.5 rounded-xl bg-pink-100 border border-pink-200 text-[#f43f5e] text-xs font-black uppercase tracking-wider">
                      {selectedPlanDuration === '1_month' ? '1 Month Plan' : '3 Months Plan'}
                    </span>
                  </div>
                </div>

                {/* Country Specific Payment Interface */}
                {billingCountry === 'bd' ? (
                  <div className="space-y-5">
                    {/* Official bKash Instant Gateway Banner */}
                    <div className="p-4 bg-gradient-to-r from-[#e2136e]/10 via-[#e2136e]/5 to-pink-50 border-2 border-[#e2136e]/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm text-left">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 bg-[#e2136e] text-white font-black text-[10px] rounded uppercase tracking-wider shadow-sm">INSTANT GATEWAY</span>
                          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Official bKash Checkout</h4>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Pay securely with your bKash Mobile Account Number, OTP & PIN for 1-second instant auto-activation.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowRealBkashModal(true)}
                        className="w-full sm:w-auto px-6 py-3.5 bg-[#e2136e] hover:bg-[#b90a56] text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap shrink-0 flex items-center justify-center gap-2 border border-white/20"
                      >
                        <Zap size={15} className="text-yellow-300 fill-yellow-300" /> Pay Instant with bKash
                      </button>
                    </div>

                    {/* bKash Manual Review Form Option */}
                    <form onSubmit={handleManualBkashPaymentSubmit} className="space-y-4 text-left border-t border-slate-200 pt-4">
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                        <p className="text-xs font-bold text-slate-800 uppercase">Or Pay Manually via bKash Personal Number:</p>
                        <ul className="text-xs text-slate-600 list-decimal pl-4 space-y-1.5 leading-relaxed font-sans">
                          <li>Go to your bKash Mobile App or dial <span className="text-slate-900 font-bold font-mono">*247#</span></li>
                          <li>Select <span className="text-[#e2136e] font-bold">Send Money</span> / Cash-In to Personal number: <span className="text-[#e2136e] font-black select-all font-mono text-xs">{bkashSettings.manualNumber}</span></li>
                          <li>Send exactly <span className="text-slate-900 font-bold font-mono">৳{getPlatformPrice(selectedUpgradePlatform.id, selectedPlanDuration, 'bd')}</span></li>
                          <li>Enter the Sender Phone Number and the 10-character Transaction ID (TrxID) below to submit verification request.</li>
                        </ul>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Sender bKash Number</label>
                          <input
                            type="tel"
                            required
                            placeholder="017xxxxxxxx"
                            value={bkashSenderPhone}
                            onChange={e => setBkashSenderPhone(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-xl py-3 px-4 outline-none focus:border-[#e2136e] text-xs font-mono text-slate-800"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">bKash Transaction ID (TrxID)</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. A1B2C3D4E5"
                            value={bkashTrxId}
                            onChange={e => setBkashTrxId(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-xl py-3 px-4 outline-none focus:border-[#e2136e] text-xs font-mono uppercase text-slate-800"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={submittingPayment}
                        className="w-full py-4 bg-[#e2136e] hover:bg-[#b90a56] disabled:opacity-50 text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md"
                      >
                        {submittingPayment ? "Submitting Request..." : "Submit Manual Payment Verification"}
                      </button>
                    </form>
                  </div>
                ) : (
                  /* Stripe/Google Pay International Option */
                  <div className="space-y-5">
                    {/* Google Pay Instant Button */}
                    <button
                      type="button"
                      onClick={handleGooglePaySubmit}
                      className="w-full py-3.5 bg-slate-900 hover:bg-black text-white rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer font-bold text-xs shadow-md"
                    >
                      <Globe size={16} /> Pay with Google Pay
                    </button>

                    <div className="relative flex py-2 items-center">
                      <div className="flex-grow border-t border-slate-200"></div>
                      <span className="flex-shrink mx-4 text-slate-400 font-mono text-[10px] font-extrabold uppercase tracking-wider">Or Pay with Credit Card</span>
                      <div className="flex-grow border-t border-slate-200"></div>
                    </div>

                    <form onSubmit={handleStripePaymentSubmit} className="space-y-4 text-left">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Cardholder Name</label>
                        <input
                          type="text"
                          required
                          placeholder="Your Name"
                          value={stripeName}
                          onChange={e => setStripeName(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl py-3 px-4 outline-none focus:border-[#f43f5e] text-xs text-slate-800"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Card Number</label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            maxLength={19}
                            placeholder="4111 1111 1111 1111"
                            value={stripeCardNum}
                            onChange={e => setStripeCardNum(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-4 pr-12 outline-none focus:border-[#f43f5e] text-xs font-mono text-slate-800"
                          />
                          <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Expiration Date</label>
                          <input
                            type="text"
                            required
                            maxLength={5}
                            placeholder="MM/YY"
                            value={stripeExpiry}
                            onChange={e => setStripeExpiry(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-xl py-3 px-4 outline-none focus:border-[#f43f5e] text-xs font-mono text-slate-800"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">CVC</label>
                          <input
                            type="password"
                            required
                            maxLength={3}
                            placeholder="123"
                            value={stripeCvc}
                            onChange={e => setStripeCvc(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-xl py-3 px-4 outline-none focus:border-[#f43f5e] text-xs font-mono text-slate-800"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={payingStripe}
                        className="w-full py-4 bg-[#f43f5e] hover:bg-[#e11d48] disabled:opacity-50 text-white font-extrabold uppercase tracking-wider rounded-2xl text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md"
                      >
                        {payingStripe ? "Processing payment..." : `Pay $${getPlatformPrice(selectedUpgradePlatform.id, selectedPlanDuration, 'intl')} USD with Stripe`}
                      </button>
                    </form>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* bKash Automatic Checkout Iframe Gateway Simulator */}
        <AnimatePresence>
          {showAutoBkashGateway && selectedUpgradePlatform && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-sm overflow-hidden bg-[#e2136e] rounded-2xl border-2 border-white/20 text-center text-white"
              >
                {/* Header Banner */}
                <div className="p-4 bg-white text-center border-b-4 border-[#bc0e57] flex flex-col items-center">
                  <img src="https://image.pngaaa.com/830/5483830-middle.png" className="h-10 object-contain error-fallback" alt="bKash Logo" onError={(e)=>{(e.target as HTMLElement).style.display='none'}} />
                  <p className="text-black font-sans font-bold text-xs mt-1">bKash Payment Gateway Simulator</p>
                </div>

                <div className="p-6 space-y-6 text-left">
                  {/* Status Steps */}
                  <div className="flex justify-between items-center text-[10px] font-mono border-b border-white/20 pb-3">
                    <span className={cn(autoBkashStep === 'phone' ? "text-white font-bold" : "text-white/40")}>1. Wallet</span>
                    <span className={cn(autoBkashStep === 'otp' ? "text-white font-bold" : "text-white/40")}>2. Verification</span>
                    <span className={cn(autoBkashStep === 'pin' ? "text-white font-bold" : "text-white/40")}>3. Confirm</span>
                  </div>

                  <div className="space-y-4">
                    <div className="text-center bg-black/20 p-3 rounded-xl border border-white/10">
                      <span className="text-[10px] uppercase font-mono tracking-widest text-pink-200">Merchant Payment</span>
                      <h4 className="text-2xl font-bold font-mono">৳{getPlatformPrice(selectedUpgradePlatform.id, selectedPlanDuration, 'bd')}</h4>
                    </div>

                    {autoBkashStep === 'phone' && (
                      <div className="space-y-3">
                        <label className="block text-[11px] font-bold text-pink-100 uppercase tracking-wider">Enter bKash Mobile Account Number</label>
                        <input
                          type="tel"
                          maxLength={11}
                          required
                          placeholder="01xxxxxxxxx"
                          value={bkashWalletPhone}
                          onChange={e => setBkashWalletPhone(e.target.value)}
                          className="w-full text-center bg-white text-[#bc0e57] rounded-xl py-3.5 outline-none font-bold text-base tracking-widest font-mono"
                        />
                        <p className="text-[9px] text-pink-100 leading-normal italic font-sans text-center">
                          By clicking Proceed, you agree to the terms and conditions of bKash sandbox simulation.
                        </p>
                      </div>
                    )}

                    {autoBkashStep === 'otp' && (
                      <div className="space-y-3">
                        <label className="block text-[11px] font-bold text-pink-100 uppercase tracking-wider">Enter 6-Digit verification code (OTP)</label>
                        <input
                          type="text"
                          maxLength={6}
                          required
                          placeholder="123456"
                          value={autoBkashOtp}
                          onChange={e => setAutoBkashOtp(e.target.value)}
                          className="w-full text-center bg-white text-[#bc0e57] rounded-xl py-3.5 outline-none font-bold text-lg tracking-widest font-mono"
                        />
                        <p className="text-[9px] text-pink-100 italic font-sans text-center">
                          A simulated SMS verification code has been sent to your mobile.
                        </p>
                      </div>
                    )}

                    {autoBkashStep === 'pin' && (
                      <div className="space-y-3">
                        <label className="block text-[11px] font-bold text-pink-100 uppercase tracking-wider">Enter Your 5-Digit bKash PIN</label>
                        <input
                          type="password"
                          maxLength={5}
                          required
                          placeholder="•••••"
                          value={bkashPin}
                          onChange={e => setBkashPin(e.target.value)}
                          className="w-full text-center bg-white text-[#bc0e57] rounded-xl py-3.5 outline-none font-bold text-2xl tracking-widest font-mono"
                        />
                        <p className="text-[9px] text-pink-100 leading-normal italic font-sans text-center">
                          This is a sandbox checkout, secure and simulated. PIN will not be saved.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAutoBkashGateway(false);
                      }}
                      className="py-3 bg-black/20 hover:bg-black/30 border border-white/10 rounded-xl text-xs font-bold uppercase transition-all"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (autoBkashStep === 'phone') {
                          if (bkashWalletPhone.length !== 11) {
                            alert('Please enter a valid 11-digit bKash number');
                            return;
                          }
                          setAutoBkashStep('otp');
                        } else if (autoBkashStep === 'otp') {
                          if (autoBkashOtp.length !== 6) {
                            alert('Please enter a valid 6-digit verification code');
                            return;
                          }
                          setAutoBkashStep('pin');
                        } else {
                          if (bkashPin.length !== 5) {
                            alert('Please enter a valid 5-digit PIN');
                            return;
                          }
                          handleAutoBkashSuccess();
                        }
                      }}
                      className="py-3 bg-white text-[#e2136e] hover:bg-pink-100 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                    >
                      Proceed
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        {/* Real bKash Payment Gateway Modal */}
        {selectedUpgradePlatform && (
          <RealPaymentGatewayModal
            isOpen={showRealBkashModal}
            gatewayType="bkash"
            merchantName="Dragon Systems Ltd."
            orderRef={`MAGIC-${selectedUpgradePlatform.id.toUpperCase()}`}
            amount={getPlatformPrice(selectedUpgradePlatform.id, selectedPlanDuration, 'bd')}
            currency="BDT"
            itemTitle={`${selectedUpgradePlatform.name} Automation (${selectedPlanDuration})`}
            onClose={() => setShowRealBkashModal(false)}
            onSuccess={async () => {
              try {
                const expDate = new Date();
                if (selectedPlanDuration === '1_month') {
                  expDate.setDate(expDate.getDate() + 30);
                } else {
                  expDate.setDate(expDate.getDate() + 90);
                }

                const config = configs.find(c => c.platform === selectedUpgradePlatform.id);
                const docRef = config ? doc(db, 'magic_box', config.id) : doc(collection(db, 'magic_box'));

                await setDoc(docRef, {
                  userId: user.uid,
                  platform: selectedUpgradePlatform.id,
                  paymentStatus: 'approved',
                  selectedPlan: selectedPlanDuration,
                  expiryTime: expDate.toISOString(),
                  paymentSubmittedAt: new Date().toISOString(),
                  billingCountryMode: 'bd',
                  status: 'active',
                  updatedAt: new Date().toISOString()
                }, { merge: true });

                alert(`bKash payment completed successfully! Your ${selectedUpgradePlatform.name} plan is now active instantly.`);
                setShowRealBkashModal(false);
                setShowUpgradeModal(false);
              } catch (err: any) {
                console.error(err);
                alert('Failed to process bKash payment: ' + err.message);
              }
            }}
          />
        )}
      </div>
    </PageContainer>
  );
}

const getPlatformBrandStyle = (platform: string) => {
  const p = (platform || '').toLowerCase().trim();
  if (p.includes('facebook') || p === 'fb') {
    return {
      style: { backgroundColor: '#1877F2', color: '#ffffff' },
      className: 'shadow-blue-500/20 hover:opacity-95'
    };
  }
  if (p.includes('messenger') || p === 'msg') {
    return {
      style: { background: 'linear-gradient(135deg, #006AFF 0%, #A107FF 100%)', color: '#ffffff' },
      className: 'shadow-purple-500/20 hover:opacity-95'
    };
  }
  if (p.includes('whatsapp') || p === 'wa') {
    return {
      style: { backgroundColor: '#25D366', color: '#ffffff' },
      className: 'shadow-green-500/20 hover:opacity-95'
    };
  }
  if (p.includes('instagram') || p === 'ig') {
    return {
      style: { background: 'linear-gradient(45deg, #f9ce34 0%, #ee2a7b 50%, #6228d7 100%)', color: '#ffffff' },
      className: 'shadow-pink-500/20 hover:opacity-95'
    };
  }
  if (p.includes('telegram') || p === 'tg') {
    return {
      style: { backgroundColor: '#0088cc', color: '#ffffff' },
      className: 'shadow-sky-500/20 hover:opacity-95'
    };
  }
  if (p.includes('wechat')) {
    return {
      style: { backgroundColor: '#07C160', color: '#ffffff' },
      className: 'shadow-emerald-500/20 hover:opacity-95'
    };
  }
  if (p.includes('viber')) {
    return {
      style: { backgroundColor: '#7360F2', color: '#ffffff' },
      className: 'shadow-indigo-500/20 hover:opacity-95'
    };
  }
  if (p.includes('line')) {
    return {
      style: { backgroundColor: '#06C755', color: '#ffffff' },
      className: 'shadow-green-500/20 hover:opacity-95'
    };
  }
  if (p.includes('tiktok')) {
    return {
      style: { backgroundColor: '#000000', color: '#ffffff' },
      className: 'shadow-zinc-800/30 hover:opacity-95 border border-zinc-700'
    };
  }
  return {
    style: { backgroundColor: '#f43f5e', color: '#ffffff' },
    className: 'shadow-pink-500/20 hover:opacity-95'
  };
};

function PlatformSection({ icon, name, platform, config, onToggle, onSave, statusInfo, onUpgrade, isBot = false }: any) {
  const isActive = config?.status === 'active';
  const brandStyle = getPlatformBrandStyle(platform);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    accessToken: config?.accessToken || '',
    pageId: config?.pageId || '',
    verifyToken: config?.verifyToken || '',
    botToken: config?.botToken || '',
    subscribedPageIds: config?.subscribedPageIds || ''
  });

  useEffect(() => {
    if (config) {
      setFormData({
        accessToken: config.accessToken || '',
        pageId: config.pageId || '',
        verifyToken: config.verifyToken || '',
        botToken: config.botToken || '',
        subscribedPageIds: config.subscribedPageIds || ''
      });
    }
  }, [config]);

  const handleUpdate = () => {
    onSave(formData);
    setIsEditing(false);
  };

  return (
    <div className={cn(
      "bg-white dark:bg-[#0d101d] rounded-3xl border border-slate-100 dark:border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden transition-all duration-300 text-left magicbox-card",
      isActive ? "border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/10 dark:bg-emerald-500/5" : "hover:border-slate-200 dark:hover:border-white/20"
    )}>
      {/* Main Header matching screenshot */}
      <div className="p-4 sm:p-5 flex items-center justify-between gap-3">
         <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            {getBrandIcon(platform, 22)}
            <div className="text-left min-w-0">
               <h4 className="font-extrabold text-slate-800 dark:text-white text-base sm:text-lg tracking-tight truncate">{name}</h4>
               <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-dragon-cyan mt-0.5">
                  <span className={cn("w-2 h-2 rounded-full shrink-0", isActive ? "bg-emerald-500" : "bg-red-500")} />
                  <span className="truncate">{isActive ? 'Automation Active' : 'Automation Suspended'}</span>
               </div>
            </div>
         </div>
         <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="p-3 rounded-2xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-600 dark:text-gray-300 transition-all cursor-pointer"
              title="Settings"
            >
               <Settings size={18} />
            </button>
            <button 
              onClick={() => { if(config) onToggle(config); else setIsEditing(true); }}
              style={isActive ? { backgroundColor: '#fef2f2', color: '#dc2626', borderColor: '#fecaca' } : brandStyle.style}
              className={cn(
                "px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all shadow-md cursor-pointer hover:scale-[1.02] active:scale-95 border border-transparent",
                isActive 
                  ? "border-red-200 shadow-red-100" 
                  : brandStyle.className
              )}
            >
               {isActive ? 'PAUSE' : config ? 'ACTIVATED' : 'SETUP'}
            </button>
         </div>
      </div>

      {/* Subscription Status Bar */}
      {config && (
        <div className="px-5 py-3 bg-slate-50 dark:bg-black/30 border-t border-slate-100 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-left">
          <div className="flex items-center gap-2">
            <Bot size={14} className={statusInfo.isActive ? "text-[#f43f5e] dark:text-dragon-cyan" : "text-slate-400 dark:text-gray-500"} />
            <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border", statusInfo.colorClass)}>
              {statusInfo.text}
            </span>
          </div>
          
          <button
            onClick={onUpgrade}
            className="px-3.5 py-1.5 bg-pink-50 dark:bg-dragon-cyan/10 hover:bg-pink-100 dark:hover:bg-dragon-cyan/20 border border-pink-200 dark:border-dragon-cyan/30 text-[#f43f5e] dark:text-dragon-cyan text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Zap size={11} className="text-[#f43f5e] dark:text-dragon-cyan" />
            {statusInfo.status === 'premium' ? 'Extend Plan' : 'Upgrade Plan'}
          </button>
        </div>
      )}

      <AnimatePresence>
        {isEditing && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-5 bg-slate-50 dark:bg-black/40 space-y-4 overflow-hidden border-t border-slate-200 dark:border-white/10"
          >
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ConfigInput 
                  label={isBot ? "Bot ID" : "Page ID / ID"} 
                  value={formData.pageId} 
                  onChange={(v: string) => setFormData({...formData, pageId: v})} 
                  placeholder={isBot ? "Telegram Bot ID" : "Meta Page ID"} 
                />
                <ConfigInput 
                  label="Verify Token" 
                  value={formData.verifyToken} 
                  onChange={(v: string) => setFormData({...formData, verifyToken: v})} 
                  placeholder="Webhook Verify Token" 
                />
             </div>
             
             {isBot ? (
               <ConfigInput 
                  label="Bot API Token" 
                  value={formData.botToken} 
                  onChange={(v: string) => setFormData({...formData, botToken: v})} 
                  placeholder="123456789:ABC..." 
                  type="password"
               />
             ) : (
               <ConfigInput 
                  label="System Access Token" 
                  value={formData.accessToken} 
                  onChange={(v: string) => setFormData({...formData, accessToken: v})} 
                  placeholder="EAA..." 
                  type="password"
               />
             )}

             {platform === 'facebook' && (
               <div className="space-y-1.5 text-left">
                 <ConfigInput 
                    label="Subscribed Page ID(s) (Comma-separated, e.g. 123, 456)" 
                    value={formData.subscribedPageIds || ''} 
                    onChange={(v: string) => setFormData({...formData, subscribedPageIds: v})} 
                    placeholder="E.g. 102938122, 29381203" 
                 />
                 <p className="text-[9px] text-slate-500 leading-normal uppercase font-bold ml-1">
                   * Active pages filter. If other connected Facebook pages try to reply, the bot will bypass them.
                 </p>
               </div>
             )}

             <div className="flex justify-end gap-3 pt-2">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800"
                >
                   Cancel
                </button>
                <button 
                  onClick={handleUpdate}
                  style={brandStyle.style}
                  className="px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm hover:opacity-90 cursor-pointer"
                >
                   Save Configuration
                </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ConfigInput({ label, value, onChange, placeholder, type = 'text' }: any) {
  return (
    <div className="space-y-1.5 flex-1 text-left">
       <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider ml-1">{label}</label>
       <input
         type={type}
         value={value}
         onChange={e => onChange(e.target.value)}
         placeholder={placeholder}
         className="w-full bg-white border border-slate-300 rounded-xl py-2.5 px-4 outline-none focus:border-[#f43f5e] text-xs font-mono transition-all text-slate-800"
       />
    </div>
  );
}

function IntegrationField({ label, value, onCopy, isCopied }: any) {
  return (
    <div className="space-y-1.5 text-left">
       <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider ml-1">{label}</label>
       <div className="relative group">
          <input 
            readOnly 
            value={value} 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-4 pr-12 outline-none text-xs text-[#f43f5e] font-mono font-bold"
          />
          <button 
            onClick={onCopy}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
             {isCopied ? <CheckCircle size={16} className="text-emerald-500" /> : <Copy size={16} />}
          </button>
       </div>
    </div>
  );
}

function SetupGuide() {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-left">
       <h4 className="text-xs font-black text-[#f43f5e] uppercase tracking-wider mb-4 flex items-center gap-2">
          <Info size={16} /> Meta Setup Guide
       </h4>
       <div className="space-y-4">
          <Step num="1" text="Log into Meta for Developers and create a Business App." />
          <Step num="2" text="Add 'Webhooks' and 'Messenger' products to your app dashboard." />
          <Step num="3" text="Copy the Callback URL and Verify Token from the fields below." />
          <Step num="4" text="Subscribe to 'messages' and 'mention' topics in Meta dashboard." />
          <Step num="5" text="Generate a Page Access Token and paste it into Messenger Settings." />
       </div>
    </div>
  );
}

function Step({ num, text }: { num: string, text: string }) {
  return (
    <div className="flex gap-3 text-left items-center">
       <div className="w-6 h-6 rounded-full bg-pink-100 text-[#f43f5e] flex items-center justify-center text-xs font-black shrink-0">{num}</div>
       <p className="text-xs text-slate-600 font-medium leading-relaxed">{text}</p>
    </div>
  );
}
