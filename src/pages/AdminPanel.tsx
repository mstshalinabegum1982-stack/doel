import { useState, useEffect, useContext } from 'react';
import { collection, query, onSnapshot, doc, getDoc, getDocs, limit, setDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { AuthContext } from '../authContext';
import { PageContainer } from '../components/Navigation';
import { UserProfile, SAAS_PLANS } from '../types';
import { checkIsAdmin } from '../lib/adminConfig';
import { 
  Users, 
  Search, 
  ShieldAlert, 
  ChevronRight, 
  Activity, 
  Globe, 
  Phone, 
  Mail, 
  MapPin,
  X,
  Settings,
  Lock,
  Save,
  CheckCircle2,
  Video,
  Check,
  XCircle,
  AlertTriangle,
  Clock,
  CreditCard,
  Sparkles,
  Zap,
  Bot,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

export default function AdminPanel() {
  const { user, profile } = useContext(AuthContext);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'landing-pages' | 'pro-websites' | 'settings' | 'magic-box' | 'catalogs'>('users');
  const [metaConfig, setMetaConfig] = useState({
    metaAppId: '',
    metaAppSecret: '',
    metaVerifyToken: 'DRAGON_AI_VERIFY_TOKEN'
  });
  const [tiktokConfig, setTiktokConfig] = useState({
    tiktokClientKey: '',
    tiktokClientSecret: ''
  });
  const [apiConfig, setApiConfig] = useState({
    webhookUrl: '',
    apiKey: '',
    webhookActive: false
  });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [tkSaveStatus, setTkSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [apiSaveStatus, setApiSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // --- Landing Page Payment Activation State ---
  const [landingPages, setLandingPages] = useState<any[]>([]);
  const [proWebsites, setProWebsites] = useState<any[]>([]);
  const [catalogSubscriptions, setCatalogSubscriptions] = useState<any[]>([]);
  const [magicBoxConfigs, setMagicBoxConfigs] = useState<any[]>([]);
  const [lpFilter, setLpFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [bkashConfig, setBkashConfig] = useState({
    manualNumber: '01700-000000',
    autoPaymentEnabled: false,
    apiKey: '',
    apiSecret: '',
    appKey: '',
    username: '',
    password: ''
  });
  const [bkashSaveStatus, setBkashSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Custom English Toast Notification state for Admin Panel
  const [adminToast, setAdminToast] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    show: false,
    title: '',
    message: '',
    type: 'success'
  });

  const triggerAdminToast = (title: string, message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setAdminToast({ show: true, title, message, type });
    setTimeout(() => {
      setAdminToast(prev => ({ ...prev, show: false }));
    }, 4500);
  };

  const [pricingConfig, setPricingConfig] = useState({
    my_catalog: {
      bd: { '1_month': 499, '3_months': 1300, '6_months': 2400, '1_year': 4500 },
      intl: { '1_month': 4.99, '3_months': 12.00, '6_months': 19.00, '1_year': 39.00 }
    },
    landing_pages: {
      bd: { '1_month': 999, '3_months': 2699, '6_months': 4999, '1_year': 8999 },
      intl: { '1_month': 9.99, '3_months': 26.99, '6_months': 49.99, '1_year': 89.99 }
    },
    pro_websites: {
      bd: { '1_month': 1999, '3_months': 5399, '6_months': 9999, '1_year': 17999 },
      intl: { '1_month': 19.99, '3_months': 53.99, '6_months': 99.99, '1_year': 179.99 }
    },
    magic_box: {
      bot: {
        bd: { '1_month': 6000, '3_months': 15000 },
        intl: { '1_month': 20, '3_months': 55 }
      },
      facebook: {
        bd: { '1_month': 1000, '3_months': 2500 },
        intl: { '1_month': 10, '3_months': 25 }
      },
      messenger: {
        bd: { '1_month': 2000, '3_months': 5500 },
        intl: { '1_month': 20, '3_months': 50 }
      },
      whatsapp: {
        bd: { '1_month': 2000, '3_months': 5500 },
        intl: { '1_month': 20, '3_months': 50 }
      },
      instagram: {
        bd: { '1_month': 1500, '3_months': 4000 },
        intl: { '1_month': 15, '3_months': 35 }
      },
      tiktok: {
        bd: { '1_month': 2000, '3_months': 5500 },
        intl: { '1_month': 20, '3_months': 50 }
      },
      telegram: {
        bd: { '1_month': 2500, '3_months': 7000 },
        intl: { '1_month': 20, '3_months': 55 }
      }
    }
  });
  const [pricingSaveStatus, setPricingSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Dynamic admin check via role/claims or configured environment variable
  const isAdmin = checkIsAdmin(user, profile);

  // Load configs
  useEffect(() => {
    if (!isAdmin) return;
    const loadConfig = async () => {
      try {
        const metaSnap = await getDoc(doc(db, 'global_settings', 'meta'));
        if (metaSnap.exists()) {
          setMetaConfig(metaSnap.data() as any);
        }
        const tiktokSnap = await getDoc(doc(db, 'global_settings', 'tiktok'));
        if (tiktokSnap.exists()) {
          setTiktokConfig(tiktokSnap.data() as any);
        }
        const apiSnap = await getDoc(doc(db, 'global_settings', 'api_integration'));
        if (apiSnap.exists()) {
          setApiConfig(apiSnap.data() as any);
        }
        const bkashSnap = await getDoc(doc(db, 'global_settings', 'bkash'));
        if (bkashSnap.exists()) {
          setBkashConfig(prev => ({ ...prev, ...bkashSnap.data() }));
        }
        const pricingSnap = await getDoc(doc(db, 'global_settings', 'pricing'));
        if (pricingSnap.exists()) {
          const data = pricingSnap.data();
          setPricingConfig(prev => ({
            ...prev,
            ...data,
            my_catalog: { ...prev.my_catalog, ...(data.my_catalog || {}) },
            landing_pages: { ...prev.landing_pages, ...(data.landing_pages || {}) },
            pro_websites: { ...prev.pro_websites, ...(data.pro_websites || {}) },
            magic_box: { ...prev.magic_box, ...(data.magic_box || {}) }
          }));
        }
      } catch (err) {
        console.warn("Could not retrieve global configs (client offline or insufficient permissions):", err);
      }
    };
    loadConfig();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, 'landing-pages'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      setLandingPages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => {
      console.error("Error loading landing pages for admin:", err);
    });
    return () => unsub();
  }, [isAdmin]);

  const handleApproveLandingPage = async (pageId: string, plan: string) => {
    try {
      const days = plan === '1_month' ? 30 : plan === '3_months' ? 90 : plan === '6_months' ? 180 : 365;
      const activeUntil = new Date();
      activeUntil.setDate(activeUntil.getDate() + days);

      await updateDoc(doc(db, 'landing-pages', pageId), {
        paymentStatus: 'approved',
        activeUntil: activeUntil.toISOString()
      });
      triggerAdminToast('Success', 'Landing page plan approved and activated successfully!', 'success');
    } catch (err: any) {
      console.error(err);
      triggerAdminToast('Error', 'Failed to approve landing page plan: ' + err.message, 'error');
    }
  };

  const handleRejectLandingPage = async (pageId: string) => {
    if (!window.confirm("Are you sure you want to cancel this request?")) return;
    try {
      await updateDoc(doc(db, 'landing-pages', pageId), {
        paymentStatus: 'none',
        paymentPhone: '',
        paymentTrxId: ''
      });
      triggerAdminToast('Updated', 'Landing page request canceled successfully.', 'info');
    } catch (err: any) {
      console.error(err);
      triggerAdminToast('Error', 'Failed to cancel request: ' + err.message, 'error');
    }
  };

  const handleApproveBotPlan = async (pageId: string, plan: string) => {
    try {
      const days = plan === '1_month' ? 30 : 
                   plan === '3_months' ? 90 : 
                   plan === '6_months' ? 180 : 
                   plan === '12_months' ? 365 : 30;
      const botExpiryTime = new Date();
      botExpiryTime.setDate(botExpiryTime.getDate() + days);

      await updateDoc(doc(db, 'landing-pages', pageId), {
        botPaymentStatus: 'approved',
        botSelectedPlan: plan,
        botExpiryTime: botExpiryTime.toISOString(),
        dragonBotEnabled: true
      });
      triggerAdminToast('Success', 'Dragon Bot plan approved and activated successfully!', 'success');
    } catch (err: any) {
      console.error(err);
      triggerAdminToast('Error', 'Failed to approve bot plan: ' + err.message, 'error');
    }
  };

  const handleRejectBotPlan = async (pageId: string) => {
    if (!window.confirm("Are you sure you want to cancel this request?")) return;
    try {
      await updateDoc(doc(db, 'landing-pages', pageId), {
        botPaymentStatus: 'none',
        botPaymentPhone: '',
        botPaymentTrxId: ''
      });
      triggerAdminToast('Updated', 'Bot plan request canceled successfully.', 'info');
    } catch (err: any) {
      console.error(err);
      triggerAdminToast('Error', 'Failed to cancel bot plan request: ' + err.message, 'error');
    }
  };

  const handleApproveProWebsiteBotPlan = async (siteId: string, plan: string) => {
    try {
      const days = plan === '1_month' ? 30 : 
                   plan === '3_months' ? 90 : 
                   plan === '6_months' ? 180 : 
                   plan === '12_months' ? 365 : 30;
      const botExpiryTime = new Date();
      botExpiryTime.setDate(botExpiryTime.getDate() + days);

      await updateDoc(doc(db, 'pro_websites', siteId), {
        botPaymentStatus: 'approved',
        botSelectedPlan: plan,
        botExpiryTime: botExpiryTime.toISOString(),
        dragonBotEnabled: true
      });
      triggerAdminToast('Success', 'Pro Website Bot plan approved and activated successfully!', 'success');
    } catch (err: any) {
      console.error(err);
      triggerAdminToast('Error', 'Failed to approve Pro Website Bot plan: ' + err.message, 'error');
    }
  };

  const handleRejectProWebsiteBotPlan = async (siteId: string) => {
    if (!window.confirm("Are you sure you want to cancel this request?")) return;
    try {
      await updateDoc(doc(db, 'pro_websites', siteId), {
        botPaymentStatus: 'none',
        botPaymentPhone: '',
        botPaymentTrxId: ''
      });
      triggerAdminToast('Updated', 'Pro Website Bot request canceled successfully.', 'info');
    } catch (err: any) {
      console.error(err);
      triggerAdminToast('Error', 'Failed to cancel request: ' + err.message, 'error');
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, 'pro_websites'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      setProWebsites(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => {
      console.error("Error loading pro websites for admin:", err);
    });
    return () => unsub();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, 'magic_box'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      setMagicBoxConfigs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => {
      console.error("Error loading magic box configs for admin:", err);
    });
    return () => unsub();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, 'catalog_subscriptions'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      setCatalogSubscriptions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => {
      console.error("Error loading catalog subscriptions for admin:", err);
    });
    return () => unsub();
  }, [isAdmin]);

  const handleApproveMagicBox = async (configId: string, plan: string) => {
    try {
      const days = plan === '1_month' ? 30 : 90;
      const expiryTime = new Date();
      expiryTime.setDate(expiryTime.getDate() + days);

      await updateDoc(doc(db, 'magic_box', configId), {
        paymentStatus: 'approved',
        expiryTime: expiryTime.toISOString(),
        status: 'active'
      });
      triggerAdminToast('Success', 'Magic Box subscription approved and activated successfully!', 'success');
    } catch (err: any) {
      console.error(err);
      triggerAdminToast('Error', 'Failed to approve Magic Box subscription: ' + err.message, 'error');
    }
  };

  const handleRejectMagicBox = async (configId: string) => {
    if (!window.confirm("Are you sure you want to reject this request?")) return;
    try {
      await updateDoc(doc(db, 'magic_box', configId), {
        paymentStatus: 'rejected',
        paymentPhone: '',
        paymentTrxId: ''
      });
      triggerAdminToast('Updated', 'Subscription request rejected successfully.', 'info');
    } catch (err: any) {
      console.error(err);
      triggerAdminToast('Error', 'Failed to reject: ' + err.message, 'error');
    }
  };

  const handleApproveProWebsite = async (siteId: string, plan: string) => {
    try {
      const days = plan === '1_month' ? 30 : plan === '3_months' ? 90 : plan === '6_months' ? 180 : 365;
      const activeUntil = new Date();
      activeUntil.setDate(activeUntil.getDate() + days);

      await updateDoc(doc(db, 'pro_websites', siteId), {
        paymentStatus: 'approved',
        activeUntil: activeUntil.toISOString()
      });
      triggerAdminToast('Success', 'Pro website approved and activated successfully!', 'success');
    } catch (err: any) {
      console.error(err);
      triggerAdminToast('Error', 'Failed to approve pro website: ' + err.message, 'error');
    }
  };

  const handleRejectProWebsite = async (siteId: string) => {
    if (!window.confirm("Are you sure you want to cancel this request?")) return;
    try {
      await updateDoc(doc(db, 'pro_websites', siteId), {
        paymentStatus: 'none',
        paymentPhone: '',
        paymentTrxId: ''
      });
      triggerAdminToast('Updated', 'Request canceled successfully.', 'info');
    } catch (err: any) {
      console.error(err);
      triggerAdminToast('Error', 'Failed to cancel request: ' + err.message, 'error');
    }
  };

  const handleApproveCatalogSubscription = async (subId: string, plan: string) => {
    try {
      const days = plan === '1_month' ? 30 : plan === '3_months' ? 90 : plan === '6_months' ? 180 : 365;
      const activeUntil = new Date();
      activeUntil.setDate(activeUntil.getDate() + days);

      await updateDoc(doc(db, 'catalog_subscriptions', subId), {
        paymentStatus: 'approved',
        selectedPlan: plan,
        activeUntil: activeUntil.toISOString()
      });
      triggerAdminToast('Success', 'Catalog subscription approved and activated successfully!', 'success');
    } catch (err: any) {
      console.error(err);
      triggerAdminToast('Error', 'Failed to approve catalog subscription: ' + err.message, 'error');
    }
  };

  const handleRejectCatalogSubscription = async (subId: string) => {
    if (!window.confirm("Are you sure you want to cancel/reject this request?")) return;
    try {
      await updateDoc(doc(db, 'catalog_subscriptions', subId), {
        paymentStatus: 'none',
        paymentPhone: '',
        paymentTrxId: ''
      });
      triggerAdminToast('Updated', 'Catalog subscription request canceled successfully.', 'info');
    } catch (err: any) {
      console.error(err);
      triggerAdminToast('Error', 'Failed to cancel request: ' + err.message, 'error');
    }
  };

  const handleSaveBkashConfig = async () => {
    setBkashSaveStatus('saving');
    try {
      await setDoc(doc(db, 'global_settings', 'bkash'), {
        ...bkashConfig,
        updatedAt: new Date().toISOString()
      });
      setBkashSaveStatus('saved');
      setTimeout(() => setBkashSaveStatus('idle'), 3000);
      triggerAdminToast('Success', 'bKash payment settings saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving Bkash config:', error);
      triggerAdminToast('Error', 'Failed to save bKash settings', 'error');
      setBkashSaveStatus('idle');
    }
  };

  const handleSavePricingConfig = async () => {
    setPricingSaveStatus('saving');
    try {
      await setDoc(doc(db, 'global_settings', 'pricing'), {
        ...pricingConfig,
        updatedAt: new Date().toISOString()
      });
      setPricingSaveStatus('saved');
      setTimeout(() => setPricingSaveStatus('idle'), 3000);
      triggerAdminToast('Update Success', 'Pricing settings updated successfully!', 'success');
    } catch (error: any) {
      console.error('Error saving pricing config:', error);
      triggerAdminToast('Error', 'Failed to save pricing settings: ' + error.message, 'error');
      setPricingSaveStatus('idle');
    }
  };

  const handleGenerateApiKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = 'DRAGON_';
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setApiConfig(prev => ({ ...prev, apiKey: key }));
  };

  const handleSaveApiConfig = async () => {
    setApiSaveStatus('saving');
    try {
      await setDoc(doc(db, 'global_settings', 'api_integration'), {
        ...apiConfig,
        updatedAt: new Date().toISOString()
      });
      setApiSaveStatus('saved');
      setTimeout(() => setApiSaveStatus('idle'), 3000);
      triggerAdminToast('Success', 'API configuration updated and saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving API config:', error);
      triggerAdminToast('Error', 'Failed to save API configuration', 'error');
      setApiSaveStatus('idle');
    }
  };

  const handleSaveMetaConfig = async () => {
    setSaveStatus('saving');
    try {
      await setDoc(doc(db, 'global_settings', 'meta'), {
        ...metaConfig,
        updatedAt: new Date().toISOString()
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
      triggerAdminToast('Success', 'Meta settings updated successfully!', 'success');
    } catch (error) {
      console.error('Error saving config:', error);
      triggerAdminToast('Error', 'Failed to save Meta settings', 'error');
      setSaveStatus('idle');
    }
  };

  const handleSaveTiktokConfig = async () => {
    setTkSaveStatus('saving');
    try {
      await setDoc(doc(db, 'global_settings', 'tiktok'), {
        ...tiktokConfig,
        updatedAt: new Date().toISOString()
      });
      setTkSaveStatus('saved');
      setTimeout(() => setTkSaveStatus('idle'), 3000);
      triggerAdminToast('Success', 'TikTok settings updated successfully!', 'success');
    } catch (error) {
      console.error('Error saving tiktok config:', error);
      triggerAdminToast('Error', 'Failed to save TikTok settings', 'error');
      setTkSaveStatus('idle');
    }
  };

  useEffect(() => {
    if (!isAdmin) return;

    const q = query(collection(db, 'users'), limit(50));
    const unsubscribe = onSnapshot(q, (snap) => {
      setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });

    return () => unsubscribe();
  }, [isAdmin]);

  // Keep selectedUser local state synchronized with live users data from Firestore snapshot
  useEffect(() => {
    if (selectedUser) {
      const updated = users.find(u => u.uid === selectedUser.uid);
      if (updated) {
        setSelectedUser(updated);
      }
    }
  }, [users, selectedUser]);

  const handleApproveSubscription = async (userId: string, planId: string, approveOnlyOption: boolean = false) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) return;

      const userData = userSnap.data();
      const subscriptions = { ...(userData.subscriptions || {}) };
      const sub = subscriptions[planId];
      if (!sub) return;

      const now = new Date();
      const expiresAt = new Date();

      if (approveOnlyOption) {
        // Only approve subsequent Dragon Bot Messenger option for this active plan
        subscriptions[planId] = {
          ...sub,
          isDragonBotOption: true,
          dragonBotStatus: 'active',
          dragonBotActivatedAt: now.toISOString(),
        };
      } else {
        // Approving the base plan (or combined base + option at purchase time)
        if (planId === 'landing_pages' && !sub.isDragonBotOption) {
          expiresAt.setDate(now.getDate() + 365);
        } else {
          expiresAt.setDate(now.getDate() + 30);
        }

        subscriptions[planId] = {
          ...sub,
          status: 'active',
          activatedAt: now.toISOString(),
          expiresAt: expiresAt.toISOString(),
          ...(sub.isDragonBotOption ? { dragonBotStatus: 'active', dragonBotActivatedAt: now.toISOString() } : {})
        };
      }

      await updateDoc(userDocRef, { subscriptions });
      triggerAdminToast('Success', 'Plan approved and activated successfully!', 'success');
    } catch (err: any) {
      console.error("Error approving SaaS plan:", err);
      triggerAdminToast('Error', 'Failed to approve plan: ' + err.message, 'error');
    }
  };

  const handleRejectSubscription = async (userId: string, planId: string, rejectOnlyOption: boolean = false) => {
    if (!window.confirm("Are you sure you want to reject this request?")) return;
    try {
      const userDocRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) return;

      const userData = userSnap.data();
      const subscriptions = { ...(userData.subscriptions || {}) };
      const sub = subscriptions[planId];
      if (!sub) return;

      if (rejectOnlyOption) {
        subscriptions[planId] = {
          ...sub,
          isDragonBotOption: false,
          dragonBotStatus: 'none',
          dragonBotRejectedAt: new Date().toISOString()
        };
      } else {
        subscriptions[planId] = {
          ...sub,
          status: 'expired',
          rejectedAt: new Date().toISOString(),
          dragonBotStatus: 'none'
        };
      }

      await updateDoc(userDocRef, { subscriptions });
      triggerAdminToast('Updated', 'Subscription request rejected successfully.', 'info');
    } catch (err: any) {
      console.error("Error rejecting SaaS plan:", err);
      triggerAdminToast('Error', 'Failed to reject subscription: ' + err.message, 'error');
    }
  };

  if (!isAdmin) {
    return (
      <div className="h-screen bg-dragon-black flex items-center justify-center p-8 text-center">
        <div className="space-y-4">
          <ShieldAlert size={64} className="mx-auto text-red-500" />
          <h1 className="text-3xl font-display font-bold">ACCESS DENIED</h1>
          <p className="text-gray-500 font-light">Only administrators can access this section.</p>
          <button onClick={() => window.history.back()} className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all">Go Back</button>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.phone.includes(searchTerm) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageContainer title="ADMIN PANEL">
      {/* Admin Action Toast Notification Popup */}
      <AnimatePresence>
        {adminToast.show && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={cn(
              "fixed top-6 right-6 z-[9999] min-w-[300px] max-w-md p-4 rounded-2xl shadow-2xl border backdrop-blur-xl flex items-center gap-3.5",
              adminToast.type === 'success' && "bg-[#081f14]/95 border-emerald-500/50 text-emerald-400 shadow-emerald-950/60",
              adminToast.type === 'error' && "bg-[#240a0a]/95 border-red-500/50 text-red-400 shadow-red-950/60",
              adminToast.type === 'info' && "bg-[#091829]/95 border-cyan-500/50 text-cyan-300 shadow-cyan-950/60"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              adminToast.type === 'success' && "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
              adminToast.type === 'error' && "bg-red-500/20 text-red-400 border border-red-500/30",
              adminToast.type === 'info' && "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
            )}>
              {adminToast.type === 'success' ? <CheckCircle2 size={20} /> : adminToast.type === 'error' ? <XCircle size={20} /> : <Sparkles size={20} />}
            </div>

            <div className="flex-1 pr-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-white mb-0.5">{adminToast.title}</h4>
              <p className="text-[11px] font-medium leading-relaxed opacity-90">{adminToast.message}</p>
            </div>

            <button
              onClick={() => setAdminToast(prev => ({ ...prev, show: false }))}
              className="text-gray-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 gap-1 flex-wrap sm:flex-nowrap">
          <button 
            onClick={() => setActiveTab('users')}
            className={cn(
              "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all gap-2 flex items-center justify-center min-w-[120px]",
              activeTab === 'users' ? "bg-white text-black shadow-lg" : "text-gray-500 hover:text-white"
            )}
          >
            <Users size={14} /> Users Management
          </button>
          <button 
            onClick={() => setActiveTab('landing-pages')}
            className={cn(
              "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all gap-2 flex items-center justify-center min-w-[120px]",
              activeTab === 'landing-pages' ? "bg-white text-black shadow-lg" : "text-gray-500 hover:text-white"
            )}
          >
            <CreditCard size={14} /> Landing Pages
          </button>
          <button 
            onClick={() => setActiveTab('pro-websites')}
            className={cn(
              "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all gap-2 flex items-center justify-center min-w-[120px]",
              activeTab === 'pro-websites' ? "bg-white text-black shadow-lg" : "text-gray-500 hover:text-white"
            )}
          >
            <Globe size={14} /> Pro Websites
          </button>
          <button 
            onClick={() => setActiveTab('catalogs')}
            className={cn(
              "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all gap-2 flex items-center justify-center min-w-[120px]",
              activeTab === 'catalogs' ? "bg-white text-black shadow-lg" : "text-gray-500 hover:text-white"
            )}
          >
            <BookOpen size={14} /> My Catalogs
          </button>
          <button 
            onClick={() => setActiveTab('magic-box')}
            className={cn(
              "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all gap-2 flex items-center justify-center min-w-[120px]",
              activeTab === 'magic-box' ? "bg-white text-black shadow-lg" : "text-gray-500 hover:text-white"
            )}
          >
            <Zap size={14} /> Magic Box
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={cn(
              "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all gap-2 flex items-center justify-center min-w-[120px]",
              activeTab === 'settings' ? "bg-white text-black shadow-lg" : "text-gray-500 hover:text-white"
            )}
          >
            <Settings size={14} /> System Settings
          </button>
        </div>

        {activeTab === 'users' ? (
          <>
            {/* Admin Header Stats */}
            <div className="grid grid-cols-2 gap-4">
               <div className="glass-card p-4 border-dragon-cyan/20 bg-dragon-cyan/5">
                  <div className="flex items-center gap-2 mb-1">
                     <Users size={16} className="text-dragon-cyan" />
                     <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Users</span>
                  </div>
                  <p className="text-2xl font-display font-bold">{users.length}</p>
               </div>
               <div className="glass-card p-4 border-dragon-purple/20 bg-dragon-purple/5">
                  <div className="flex items-center gap-2 mb-1">
                     <Activity size={16} className="text-dragon-purple" />
                     <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">System Health</span>
                  </div>
                  <p className="text-2xl font-display font-bold">OPTIMAL</p>
               </div>
            </div>

            {/* Search */}
            <div className="relative group">
               <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-dragon-cyan transition-colors" />
               <input
                 placeholder="Search by Name, Email or Phone..."
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
                 className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-dragon-cyan transition-all"
               />
            </div>

            {/* User List */}
            <div className="space-y-px">
               {loading ? (
                 <div className="py-20 flex justify-center"><div className="w-8 h-8 border-2 border-dragon-cyan border-t-transparent rounded-full animate-spin"></div></div>
               ) : filteredUsers.map((user, idx) => (
                 <button 
                   key={`admin-user-${user.uid || ''}-${idx}`} 
                   onClick={() => setSelectedUser(user)}
                   className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 group"
                 >
                    <div className="flex items-center gap-4">
                       <img src={user.profileImage || null} className="w-12 h-12 rounded-2xl object-cover bg-white/10" alt="" />
                       <div className="text-left">
                          <h4 className="font-display font-medium text-white group-hover:text-dragon-cyan transition-colors">{user.name}</h4>
                          <p className="text-xs text-gray-500">{user.email}</p>
                       </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-700 group-hover:text-dragon-cyan transition-colors" />
                 </button>
               ))}
            </div>
          </>
        ) : activeTab === 'landing-pages' ? (
          <div className="space-y-6 text-left">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="glass-card p-4 border-white/5 bg-white/[0.02]">
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Pages</h4>
                <p className="text-xl font-display font-bold text-white">{landingPages.length}</p>
              </div>
              <div className="glass-card p-4 border-amber-500/20 bg-amber-500/5">
                <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">Pending Approval</h4>
                <p className="text-xl font-display font-bold text-amber-400">
                  {landingPages.filter(p => p.paymentStatus === 'pending').length}
                </p>
              </div>
              <div className="glass-card p-4 border-emerald-500/20 bg-emerald-500/5">
                <h4 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Approved & Active</h4>
                <p className="text-xl font-display font-bold text-emerald-400">
                  {landingPages.filter(p => p.paymentStatus === 'approved').length}
                </p>
              </div>
            </div>

            {/* Filter buttons */}
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 w-fit gap-1">
              {[
                { id: 'all', label: 'All' },
                { id: 'pending', label: 'Pending Payment' },
                { id: 'approved', label: 'Active/Approved' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setLpFilter(f.id as any)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer",
                    lpFilter === f.id ? "bg-white text-black font-bold" : "text-gray-400 hover:text-white"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="space-y-4">
              {(() => {
                const filtered = landingPages.filter(p => {
                  if (lpFilter === 'pending') return p.paymentStatus === 'pending';
                  if (lpFilter === 'approved') return p.paymentStatus === 'approved';
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="py-20 text-center text-gray-500 font-light text-sm">
                      No landing pages found.
                    </div>
                  );
                }

                return filtered.map((page, idx) => {
                  const owner = users.find(u => u.uid === page.userId);
                  const ownerName = owner?.name || page.userId || 'Unknown';
                  const ownerEmail = owner?.email || 'N/A';
                  const ownerPhone = owner?.phone || 'N/A';

                  return (
                    <div key={`lp-admin-card-${page.id}-${idx}`} className="glass-card p-6 border-white/5 bg-white/[0.02] rounded-3xl flex flex-col md:flex-row justify-between gap-6">
                      <div className="space-y-4 flex-1 text-left">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-base font-display font-black text-white">{page.storeName || 'Unnamed Project'}</h4>
                            <span className="px-2.5 py-0.5 bg-white/5 rounded text-[8px] font-black uppercase tracking-widest text-gray-500">{page.theme} theme</span>
                            {page.paymentStatus === 'approved' && (
                              <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-[8px] font-black uppercase tracking-widest">Active</span>
                            )}
                            {page.paymentStatus === 'pending' && (
                              <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded text-[8px] font-black uppercase tracking-widest">Pending</span>
                            )}
                            {page.botPaymentStatus === 'approved' ? (
                              <span className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded text-[8px] font-black uppercase tracking-widest">Bot Active</span>
                            ) : page.botPaymentStatus === 'pending' ? (
                              <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded text-[8px] font-black uppercase tracking-widest animate-pulse">Bot Pending</span>
                            ) : (
                              <span className="px-2 py-0.5 bg-white/5 rounded text-[8px] font-black uppercase tracking-widest text-gray-500">Bot: Trial / Off</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate mt-1">{page.productDetails?.title}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-[10px] font-mono border-t border-white/5 pt-4">
                          <div><span className="text-zinc-500 uppercase">Owner Name:</span> <span className="text-white font-semibold">{ownerName}</span></div>
                          <div><span className="text-zinc-500 uppercase">Owner Email:</span> <span className="text-zinc-300 select-all">{ownerEmail}</span></div>
                          <div><span className="text-zinc-500 uppercase">Owner Phone:</span> <span className="text-zinc-300">{ownerPhone}</span></div>
                          <div>
                            <span className="text-zinc-500 uppercase">Created:</span>{' '}
                            <span className="text-zinc-400">
                              {page.createdAt
                                ? (page.createdAt.toDate ? page.createdAt.toDate() : new Date(page.createdAt)).toLocaleDateString()
                                : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Payment review block */}
                      <div className="w-full md:w-80 shrink-0 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6 flex flex-col justify-between gap-4 text-left">
                        {/* 1. Page Activation Payment */}
                        <div className="space-y-3 w-full">
                          <h5 className="text-[10px] font-black uppercase tracking-wider text-zinc-500 pb-1 border-b border-white/5">Landing Page Status:</h5>
                          {page.paymentStatus === 'pending' ? (
                            <div className="space-y-2">
                              <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest flex items-center gap-1 font-mono">
                                <AlertTriangle size={12} /> Payment Verification Request:
                              </p>
                              <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1.5 font-mono text-[10px]">
                                <div><span className="text-zinc-500">Plan:</span> <span className="text-white font-black uppercase">{page.selectedPlan?.replace('_', ' ')}</span></div>
                                <div><span className="text-zinc-500">Bkash Sender:</span> <span className="text-white font-bold">{page.paymentPhone}</span></div>
                                <div><span className="text-zinc-500">TrxID:</span> <span className="text-dragon-cyan font-black select-all uppercase">{page.paymentTrxId}</span></div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleRejectLandingPage(page.id)}
                                  className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 hover:border-red-500/40 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer text-center"
                                >
                                  Reject ❌
                                </button>
                                <button
                                  onClick={() => handleApproveLandingPage(page.id, page.selectedPlan)}
                                  className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-black rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer text-center font-bold"
                                >
                                  Approve ✅
                                </button>
                              </div>
                            </div>
                          ) : page.paymentStatus === 'approved' ? (
                            <div className="space-y-2 font-mono text-[10px]">
                              <p className="text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                <CheckCircle2 size={12} /> Active Landing Page:
                              </p>
                              <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1">
                                <div><span className="text-zinc-500">Plan Duration:</span> <span className="text-white font-bold uppercase">{page.selectedPlan?.replace('_', ' ')}</span></div>
                                <div>
                                  <span className="text-zinc-500">Expires At:</span>{' '}
                                  <span className="text-white font-black">
                                    {page.activeUntil ? new Date(page.activeUntil).toLocaleDateString() : 'N/A'}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => handleRejectLandingPage(page.id)}
                                className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer text-center"
                              >
                                Deactivate Page
                              </button>
                            </div>
                          ) : (
                            <div className="p-3 bg-white/[0.01] border border-dashed border-white/5 rounded-xl text-center">
                              <p className="text-[10px] text-gray-500 uppercase font-black tracking-wider">Free Trial Mode</p>
                            </div>
                          )}
                        </div>

                        {/* 2. DOEL Messenger Bot Payment */}
                        <div className="space-y-3 w-full pt-3 border-t border-white/5">
                          <h5 className="text-[10px] font-black uppercase tracking-wider text-zinc-500 pb-1 border-b border-white/5">DOEL Messenger Chatbot Status:</h5>
                          {page.botPaymentStatus === 'pending' ? (
                            <div className="space-y-2">
                              <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-1 font-mono">
                                <Sparkles size={12} className="animate-pulse" /> Chatbot Payment Request:
                              </p>
                              <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1.5 font-mono text-[10px]">
                                <div><span className="text-zinc-500">Plan:</span> <span className="text-white font-black uppercase">{page.botSelectedPlan?.replace('_', ' ') || '1 Month'}</span></div>
                                <div><span className="text-zinc-500">Bkash Sender:</span> <span className="text-white font-bold">{page.botPaymentPhone}</span></div>
                                <div><span className="text-zinc-500">TrxID:</span> <span className="text-cyan-400 font-black select-all uppercase">{page.botPaymentTrxId}</span></div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleRejectBotPlan(page.id)}
                                  className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 hover:border-red-500/40 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer text-center"
                                >
                                  Reject ❌
                                </button>
                                <button
                                  onClick={() => handleApproveBotPlan(page.id, page.botSelectedPlan || '1_month')}
                                  className="flex-1 py-2 bg-cyan-500 hover:bg-cyan-600 text-black rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer text-center font-bold font-black"
                                >
                                  Approve ✅
                                </button>
                              </div>
                            </div>
                          ) : page.botPaymentStatus === 'approved' ? (
                            <div className="space-y-2 font-mono text-[10px]">
                              <p className="text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                <CheckCircle2 size={12} /> Active Bot Plan:
                              </p>
                              <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1">
                                <div><span className="text-zinc-500">Plan Duration:</span> <span className="text-white font-bold uppercase">{page.botSelectedPlan?.replace('_', ' ') || '1 Month'}</span></div>
                                <div>
                                  <span className="text-zinc-500">Expires At:</span>{' '}
                                  <span className="text-white font-black">
                                    {page.botExpiryTime ? new Date(page.botExpiryTime).toLocaleDateString() : 'N/A'}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="space-y-1 border border-white/5 p-2 rounded-xl bg-white/[0.01]">
                                <label className="text-[8px] text-zinc-500 uppercase tracking-widest block font-bold">Upgrade/Extend Bot:</label>
                                <div className="flex gap-1">
                                  <select 
                                    id={`bot-upgrade-select-${page.id}`}
                                    className="bg-black border border-white/10 rounded px-2 py-1 text-[10px] text-white outline-none flex-1 font-mono"
                                    defaultValue="1_month"
                                  >
                                    <option value="1_month">1 Month (৳2000)</option>
                                    <option value="3_months">3 Months (৳5500)</option>
                                    <option value="6_months">6 Months (৳10000)</option>
                                    <option value="12_months">1 Year (৳18000)</option>
                                  </select>
                                  <button
                                    onClick={() => {
                                      const selectEl = document.getElementById(`bot-upgrade-select-${page.id}`) as HTMLSelectElement;
                                      const planVal = selectEl ? selectEl.value : '1_month';
                                      handleApproveBotPlan(page.id, planVal);
                                    }}
                                    className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-600 text-black rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer font-bold shrink-0"
                                  >
                                    Upgrade
                                  </button>
                                </div>
                              </div>

                              <button
                                onClick={() => handleRejectBotPlan(page.id)}
                                className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer text-center"
                              >
                                Deactivate Bot
                              </button>
                            </div>
                          ) : (
                            <div className="p-3 bg-white/[0.01] border border-dashed border-white/5 rounded-xl text-center space-y-2">
                              <p className="text-[10px] text-gray-500 uppercase font-black tracking-wider">Free Trial (48 Hours)</p>
                              
                              <div className="space-y-1 border border-white/5 p-2 rounded-xl bg-black/20 text-left">
                                <label className="text-[8px] text-zinc-500 uppercase tracking-widest block font-bold">Select Active Plan:</label>
                                <div className="flex gap-1">
                                  <select 
                                    id={`bot-activate-select-${page.id}`}
                                    className="bg-black border border-white/10 rounded px-2 py-1 text-[10px] text-white outline-none flex-1 font-mono"
                                    defaultValue="1_month"
                                  >
                                    <option value="1_month">1 Month (৳2000)</option>
                                    <option value="3_months">3 Months (৳5500)</option>
                                    <option value="6_months">6 Months (৳10000)</option>
                                    <option value="12_months">1 Year (৳18000)</option>
                                  </select>
                                  <button
                                    onClick={() => {
                                      const selectEl = document.getElementById(`bot-activate-select-${page.id}`) as HTMLSelectElement;
                                      const planVal = selectEl ? selectEl.value : '1_month';
                                      handleApproveBotPlan(page.id, planVal);
                                    }}
                                    className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-600 text-black rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer font-bold shrink-0"
                                  >
                                    Activate
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        ) : activeTab === 'pro-websites' ? (
          <div className="space-y-6 text-left">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="glass-card p-4 border-white/5 bg-white/[0.02]">
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 font-sans">Total Pro Websites</h4>
                <p className="text-xl font-display font-bold text-white">{proWebsites.length}</p>
              </div>
              <div className="glass-card p-4 border-amber-500/20 bg-amber-500/5">
                <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1 font-sans">Pending Approval</h4>
                <p className="text-xl font-display font-bold text-amber-400">
                  {proWebsites.filter(p => p.paymentStatus === 'pending').length}
                </p>
              </div>
              <div className="glass-card p-4 border-emerald-500/20 bg-emerald-500/5">
                <h4 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1 font-sans">Approved & Active</h4>
                <p className="text-xl font-display font-bold text-emerald-400">
                  {proWebsites.filter(p => p.paymentStatus === 'approved').length}
                </p>
              </div>
            </div>

            {/* Filter buttons */}
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 w-fit gap-1 font-sans">
              {[
                { id: 'all', label: 'All' },
                { id: 'pending', label: 'Pending Payment' },
                { id: 'approved', label: 'Active/Approved' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setLpFilter(f.id as any)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                    lpFilter === f.id ? "bg-white text-black shadow-md" : "text-gray-400 hover:text-white"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Pro Websites List Grid */}
            <div className="grid grid-cols-1 gap-4 font-sans">
              {(() => {
                const list = proWebsites.filter(p => {
                  if (lpFilter === 'pending') return p.paymentStatus === 'pending';
                  if (lpFilter === 'approved') return p.paymentStatus === 'approved';
                  return true;
                });

                if (list.length === 0) {
                  return (
                    <div className="p-12 text-center bg-white/[0.01] border border-dashed border-white/5 rounded-3xl">
                      <p className="text-sm text-gray-500 font-medium">No Pro websites found.</p>
                    </div>
                  );
                }

                return list.map((site) => {
                  const owner = users.find(u => u.id === site.userId || u.uid === site.userId);
                  const ownerName = owner?.name || owner?.email?.split('@')[0] || 'Unknown Owner';
                  const ownerEmail = owner?.email || 'N/A';
                  const ownerPhone = owner?.phone || 'N/A';

                  return (
                    <div key={site.id} className="glass-card p-5 border-white/5 bg-white/[0.01] flex flex-col md:flex-row justify-between items-start md:items-stretch gap-6 transition-all hover:bg-white/[0.02]">
                      <div className="flex-1 space-y-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 bg-dragon-cyan/15 border border-dragon-cyan/30 text-dragon-cyan rounded text-[9px] font-black uppercase tracking-widest font-mono">
                              PRO WEBSITE
                            </span>
                            {site.paymentStatus === 'approved' ? (
                              <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-[9px] font-black uppercase tracking-widest font-mono">
                                ACTIVE / APPROVED
                              </span>
                            ) : site.paymentStatus === 'pending' ? (
                              <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded text-[9px] font-black uppercase tracking-widest font-mono">
                                PENDING VERIFICATION
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 bg-white/5 border border-white/10 text-gray-400 rounded text-[9px] font-black uppercase tracking-widest font-mono">
                                TRIAL / INACTIVE
                              </span>
                            )}
                            {site.botPaymentStatus === 'approved' ? (
                              <span className="px-2.5 py-0.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded text-[9px] font-black uppercase tracking-widest font-mono">
                                Bot Active
                              </span>
                            ) : site.botPaymentStatus === 'pending' ? (
                              <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded text-[9px] font-black uppercase tracking-widest font-mono animate-pulse font-bold">
                                Bot Pending
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 bg-white/5 border border-white/10 text-gray-500 rounded text-[9px] font-black uppercase tracking-widest font-mono">
                                Bot: Trial / Off
                              </span>
                            )}
                          </div>
                          <h3 className="text-base font-black text-white">{site.storeName}</h3>
                          <p className="text-xs text-gray-400">Slug: <span className="text-dragon-cyan font-mono select-all">/w/{site.slug}</span></p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-[10px] font-mono border-t border-white/5 pt-4">
                          <div><span className="text-zinc-500 uppercase">Owner Name:</span> <span className="text-white font-semibold">{ownerName}</span></div>
                          <div><span className="text-zinc-500 uppercase">Owner Email:</span> <span className="text-zinc-300 select-all">{ownerEmail}</span></div>
                          <div><span className="text-zinc-500 uppercase">Owner Phone:</span> <span className="text-zinc-300">{ownerPhone}</span></div>
                          <div>
                            <span className="text-zinc-500 uppercase">Created:</span>{' '}
                            <span className="text-zinc-400">
                              {site.createdAt
                                ? (site.createdAt.toDate ? site.createdAt.toDate() : new Date(site.createdAt)).toLocaleDateString()
                                : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Payment review block */}
                      <div className="w-full md:w-80 shrink-0 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6 flex flex-col justify-between gap-4 text-left">
                        {/* 1. Website Plan Activation */}
                        <div className="space-y-3 w-full">
                          <h5 className="text-[10px] font-black uppercase tracking-wider text-zinc-500 pb-1 border-b border-white/5">Website Status:</h5>
                          {site.paymentStatus === 'pending' ? (
                            <div className="space-y-2">
                              <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest flex items-center gap-1 font-mono">
                                <AlertTriangle size={12} /> Payment Verification Request:
                              </p>
                              <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1.5 font-mono text-[10px]">
                                <div><span className="text-zinc-500">Plan:</span> <span className="text-white font-black uppercase">{site.selectedPlan?.replace('_', ' ')}</span></div>
                                <div><span className="text-zinc-500">Bkash Sender:</span> <span className="text-white font-bold">{site.paymentPhone}</span></div>
                                <div><span className="text-zinc-500">TrxID:</span> <span className="text-dragon-cyan font-black select-all uppercase">{site.paymentTrxId}</span></div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleRejectProWebsite(site.id)}
                                  className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 hover:border-red-500/40 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer text-center"
                                >
                                  Reject ❌
                                </button>
                                <button
                                  onClick={() => handleApproveProWebsite(site.id, site.selectedPlan)}
                                  className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-black rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer text-center font-bold"
                                >
                                  Approve ✅
                                </button>
                              </div>
                            </div>
                          ) : site.paymentStatus === 'approved' ? (
                            <div className="space-y-2 font-mono text-[10px]">
                              <p className="text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                <CheckCircle2 size={12} /> Active Website:
                              </p>
                              <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1">
                                <div><span className="text-zinc-500">Plan Duration:</span> <span className="text-white font-bold uppercase">{site.selectedPlan?.replace('_', ' ')}</span></div>
                                <div>
                                  <span className="text-zinc-500">Expires At:</span>{' '}
                                  <span className="text-white font-black">
                                    {site.activeUntil ? new Date(site.activeUntil).toLocaleDateString() : 'N/A'}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => handleRejectProWebsite(site.id)}
                                className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer text-center"
                              >
                                Deactivate Page
                              </button>
                            </div>
                          ) : (
                            <div className="p-3 bg-white/[0.01] border border-dashed border-white/5 rounded-xl text-center">
                              <p className="text-[10px] text-gray-500 uppercase font-black tracking-wider">Free Trial Mode</p>
                            </div>
                          )}
                        </div>

                        {/* 2. DOEL Messenger Bot Activation */}
                        <div className="space-y-3 w-full pt-3 border-t border-white/5">
                          <h5 className="text-[10px] font-black uppercase tracking-wider text-zinc-500 pb-1 border-b border-white/5">DOEL Messenger Chatbot Status:</h5>
                          {site.botPaymentStatus === 'pending' ? (
                            <div className="space-y-2">
                              <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-1 font-mono">
                                <Sparkles size={12} className="animate-pulse" /> Chatbot Payment Request:
                              </p>
                              <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1.5 font-mono text-[10px]">
                                <div><span className="text-zinc-500">Plan:</span> <span className="text-white font-black uppercase">{site.botSelectedPlan?.replace('_', ' ') || '1 Month'}</span></div>
                                <div><span className="text-zinc-500">Bkash Sender:</span> <span className="text-white font-bold">{site.botPaymentPhone}</span></div>
                                <div><span className="text-zinc-500">TrxID:</span> <span className="text-cyan-400 font-black select-all uppercase">{site.botPaymentTrxId}</span></div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleRejectProWebsiteBotPlan(site.id)}
                                  className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 hover:border-red-500/40 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer text-center"
                                >
                                  Reject ❌
                                </button>
                                <button
                                  onClick={() => handleApproveProWebsiteBotPlan(site.id, site.botSelectedPlan || '1_month')}
                                  className="flex-1 py-2 bg-cyan-500 hover:bg-cyan-600 text-black rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer text-center font-bold font-black"
                                >
                                  Approve ✅
                                </button>
                              </div>
                            </div>
                          ) : site.botPaymentStatus === 'approved' ? (
                            <div className="space-y-2 font-mono text-[10px]">
                              <p className="text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                <CheckCircle2 size={12} /> Active Bot Plan:
                              </p>
                              <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1">
                                <div><span className="text-zinc-500">Plan Duration:</span> <span className="text-white font-bold uppercase">{site.botSelectedPlan?.replace('_', ' ') || '1 Month'}</span></div>
                                <div>
                                  <span className="text-zinc-500">Expires At:</span>{' '}
                                  <span className="text-white font-black">
                                    {site.botExpiryTime ? new Date(site.botExpiryTime).toLocaleDateString() : 'N/A'}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="space-y-1 border border-white/5 p-2 rounded-xl bg-white/[0.01]">
                                <label className="text-[8px] text-zinc-500 uppercase tracking-widest block font-bold">Upgrade/Extend Bot:</label>
                                <div className="flex gap-1">
                                  <select 
                                    id={`pro-bot-upgrade-select-${site.id}`}
                                    className="bg-black border border-white/10 rounded px-2 py-1 text-[10px] text-white outline-none flex-1 font-mono"
                                    defaultValue="1_month"
                                  >
                                    <option value="1_month">1 Month (৳2000)</option>
                                    <option value="3_months">3 Months (৳5500)</option>
                                    <option value="6_months">6 Months (৳10000)</option>
                                    <option value="12_months">1 Year (৳18000)</option>
                                  </select>
                                  <button
                                    onClick={() => {
                                      const selectEl = document.getElementById(`pro-bot-upgrade-select-${site.id}`) as HTMLSelectElement;
                                      const planVal = selectEl ? selectEl.value : '1_month';
                                      handleApproveProWebsiteBotPlan(site.id, planVal);
                                    }}
                                    className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-600 text-black rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer font-bold shrink-0"
                                  >
                                    Upgrade
                                  </button>
                                </div>
                              </div>

                              <button
                                onClick={() => handleRejectProWebsiteBotPlan(site.id)}
                                className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer text-center"
                              >
                                Deactivate Bot
                              </button>
                            </div>
                          ) : (
                            <div className="p-3 bg-white/[0.01] border border-dashed border-white/5 rounded-xl text-center space-y-2">
                              <p className="text-[10px] text-gray-500 uppercase font-black tracking-wider">Free Trial (48 Hours)</p>
                              
                              <div className="space-y-1 border border-white/5 p-2 rounded-xl bg-black/20 text-left">
                                <label className="text-[8px] text-zinc-500 uppercase tracking-widest block font-bold">Select Active Plan:</label>
                                <div className="flex gap-1">
                                  <select 
                                    id={`pro-bot-activate-select-${site.id}`}
                                    className="bg-black border border-white/10 rounded px-2 py-1 text-[10px] text-white outline-none flex-1 font-mono"
                                    defaultValue="1_month"
                                  >
                                    <option value="1_month">1 Month (৳2000)</option>
                                    <option value="3_months">3 Months (৳5500)</option>
                                    <option value="6_months">6 Months (৳10000)</option>
                                    <option value="12_months">1 Year (৳18000)</option>
                                  </select>
                                  <button
                                    onClick={() => {
                                      const selectEl = document.getElementById(`pro-bot-activate-select-${site.id}`) as HTMLSelectElement;
                                      const planVal = selectEl ? selectEl.value : '1_month';
                                      handleApproveProWebsiteBotPlan(site.id, planVal);
                                    }}
                                    className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-600 text-black rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer font-bold shrink-0"
                                  >
                                    Activate
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        ) : activeTab === 'catalogs' ? (
          <div className="space-y-6 text-left">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="glass-card p-4 border-white/5 bg-white/[0.02]">
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 font-sans">Total Catalog Subscriptions</h4>
                <p className="text-xl font-display font-bold text-white">{catalogSubscriptions.length}</p>
              </div>
              <div className="glass-card p-4 border-amber-500/20 bg-amber-500/5">
                <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1 font-sans">Pending Approvals</h4>
                <p className="text-xl font-display font-bold text-amber-400">
                  {catalogSubscriptions.filter(c => c.paymentStatus === 'pending').length}
                </p>
              </div>
              <div className="glass-card p-4 border-emerald-500/20 bg-emerald-500/5">
                <h4 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1 font-sans">Approved & Active</h4>
                <p className="text-xl font-display font-bold text-emerald-400">
                  {catalogSubscriptions.filter(c => c.paymentStatus === 'approved').length}
                </p>
              </div>
            </div>

            {/* Filter buttons */}
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 w-fit gap-1 font-sans">
              {[
                { id: 'all', label: 'All' },
                { id: 'pending', label: 'Pending Payment' },
                { id: 'approved', label: 'Active/Approved' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setLpFilter(f.id as any)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                    lpFilter === f.id ? "bg-white text-black shadow-md" : "text-gray-400 hover:text-white"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Catalogs List Grid */}
            <div className="grid grid-cols-1 gap-4 font-sans">
              {(() => {
                const list = catalogSubscriptions.filter(c => {
                  if (lpFilter === 'pending') return c.paymentStatus === 'pending';
                  if (lpFilter === 'approved') return c.paymentStatus === 'approved';
                  return true;
                });

                if (list.length === 0) {
                  return (
                    <div className="p-12 text-center bg-white/[0.01] border border-dashed border-white/5 rounded-3xl">
                      <p className="text-sm text-gray-500 font-medium">No Catalog subscriptions found.</p>
                    </div>
                  );
                }

                return list.map((sub, idx) => {
                  // Find user details if available
                  const subUser = users.find(u => u.uid === sub.userId || u.uid === sub.id);
                  const subUserName = subUser?.name || sub.userName || "Store Owner";
                  const subUserEmail = subUser?.email || "N/A";

                  return (
                    <div
                      key={`catalog-sub-card-${sub.id}-${idx}`}
                      className="glass-card p-5 border-white/5 bg-white/[0.02] flex flex-col md:flex-row justify-between items-start md:items-stretch gap-6"
                    >
                      {/* Left: Store Owner details */}
                      <div className="flex-1 space-y-4 text-left">
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 bg-dragon-cyan/10 text-dragon-cyan rounded-xl shrink-0 mt-0.5">
                            <BookOpen size={18} />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-white uppercase tracking-wider">
                              {subUserName}'s Catalog
                            </h4>
                            <p className="text-[11px] text-zinc-400 mt-1 font-mono font-medium flex items-center gap-1.5 flex-wrap">
                              <span>User ID: <span className="text-white font-bold select-all">{sub.userId || sub.id}</span></span>
                              <span className="text-white/20">•</span>
                              <span>Email: <span className="text-zinc-300">{subUserEmail}</span></span>
                            </p>
                          </div>
                        </div>

                        {/* Timing details */}
                        <div className="grid grid-cols-2 gap-4 text-[10px] text-zinc-400 border-t border-white/5 pt-4 font-mono">
                          <div>
                            <span className="text-zinc-500 uppercase">Currency:</span>{' '}
                            <span className="text-white font-bold">{sub.selectedCurrency || 'BDT'}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 uppercase">Plan:</span>{' '}
                            <span className="text-white font-bold uppercase">{sub.selectedPlan?.replace('_', ' ') || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 uppercase">Submitted:</span>{' '}
                            <span className="text-zinc-400">
                              {sub.paymentSubmittedAt
                                ? new Date(sub.paymentSubmittedAt).toLocaleDateString()
                                : 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-500 uppercase">Updated:</span>{' '}
                            <span className="text-zinc-400">
                              {sub.updatedAt
                                ? new Date(sub.updatedAt).toLocaleDateString()
                                : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Payment review / approval block */}
                      <div className="w-full md:w-80 shrink-0 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6 flex flex-col justify-between gap-4 text-left">
                        {sub.paymentStatus === 'pending' ? (
                          <div className="space-y-3 w-full">
                            <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest flex items-center gap-1 font-mono">
                              <AlertTriangle size={12} /> Payment Verification Request:
                            </p>
                            <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1.5 font-mono text-[10px]">
                              <div><span className="text-zinc-500 font-bold">Plan:</span> <span className="text-white font-black uppercase">{sub.selectedPlan?.replace('_', ' ')}</span></div>
                              <div><span className="text-zinc-500 font-bold">Sender No:</span> <span className="text-white font-bold">{sub.paymentPhone}</span></div>
                              <div><span className="text-zinc-500 font-bold">TrxID:</span> <span className="text-dragon-cyan font-black select-all uppercase">{sub.paymentTrxId}</span></div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRejectCatalogSubscription(sub.id)}
                                className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 hover:border-red-500/40 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer text-center"
                              >
                                Reject ❌
                              </button>
                              <button
                                onClick={() => handleApproveCatalogSubscription(sub.id, sub.selectedPlan)}
                                className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-black rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer text-center font-bold"
                              >
                                Approve ✅
                              </button>
                            </div>
                          </div>
                        ) : sub.paymentStatus === 'approved' ? (
                          <div className="space-y-3 font-mono text-[10px] w-full">
                            <p className="text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1">
                              <CheckCircle2 size={12} /> Active Plan Info:
                            </p>
                            <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1">
                              <div><span className="text-zinc-500">Plan Duration:</span> <span className="text-white font-bold uppercase">{sub.selectedPlan?.replace('_', ' ')}</span></div>
                              <div>
                                <span className="text-zinc-500">Expires At:</span>{' '}
                                <span className="text-white font-black">
                                  {sub.activeUntil ? new Date(sub.activeUntil).toLocaleDateString() : 'N/A'}
                                </span>
                              </div>
                            </div>
                            
                            {/* Upgrade/Extend dropdown */}
                            <div className="space-y-1 border border-white/5 p-2.5 rounded-xl bg-white/[0.01]">
                              <label className="text-[8px] text-zinc-500 uppercase tracking-widest block font-bold">Upgrade/Extend Plan:</label>
                              <div className="flex gap-1.5">
                                <select 
                                  id={`catalog-upgrade-select-${sub.id}`}
                                  className="bg-black border border-white/10 rounded px-2 py-1 text-[10px] text-white outline-none flex-1 font-mono"
                                  defaultValue="1_month"
                                >
                                  <option value="1_month">1 Month (৳499)</option>
                                  <option value="3_months">3 Months (৳1300)</option>
                                  <option value="6_months">6 Months (৳2400)</option>
                                  <option value="1_year">1 Year (৳4500)</option>
                                </select>
                                <button
                                  onClick={() => {
                                    const selectEl = document.getElementById(`catalog-upgrade-select-${sub.id}`) as HTMLSelectElement;
                                    const planVal = selectEl ? selectEl.value : '1_month';
                                    handleApproveCatalogSubscription(sub.id, planVal);
                                  }}
                                  className="px-2.5 py-1 bg-[#00f2ff] hover:bg-cyan-600 text-black rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer font-bold shrink-0 font-sans"
                                >
                                  Upgrade
                                </button>
                              </div>
                            </div>

                            <button
                              onClick={() => handleRejectCatalogSubscription(sub.id)}
                              className="w-full py-2 bg-red-500/10 hover:bg-red-550 hover:text-white border border-red-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer text-center font-sans font-bold"
                            >
                              Deactivate Catalog
                            </button>
                          </div>
                        ) : (
                          <div className="h-full flex flex-col justify-center items-center text-center p-4 bg-white/[0.01] border border-dashed border-white/5 rounded-2xl w-full space-y-3">
                            <Clock size={18} className="text-gray-600" />
                            <div className="space-y-0.5">
                              <p className="text-[10px] text-gray-500 uppercase font-black tracking-wider">No Request</p>
                              <p className="text-[8px] text-gray-600 font-medium leading-relaxed">
                                No active catalog plan or pending request.
                              </p>
                            </div>
                            
                            {/* Activate dropdown */}
                            <div className="space-y-1 border border-white/5 p-2.5 rounded-xl bg-black/20 text-left w-full font-mono">
                              <label className="text-[8px] text-zinc-500 uppercase tracking-widest block font-bold">Select Active Plan:</label>
                              <div className="flex gap-1.5">
                                <select 
                                  id={`catalog-activate-select-${sub.id}`}
                                  className="bg-black border border-white/10 rounded px-2 py-1 text-[10px] text-white outline-none flex-1 font-mono"
                                  defaultValue="1_month"
                                >
                                  <option value="1_month">1 Month (৳499)</option>
                                  <option value="3_months">3 Months (৳1300)</option>
                                  <option value="6_months">6 Months (৳2400)</option>
                                  <option value="1_year">1 Year (৳4500)</option>
                                </select>
                                <button
                                  onClick={() => {
                                    const selectEl = document.getElementById(`catalog-activate-select-${sub.id}`) as HTMLSelectElement;
                                    const planVal = selectEl ? selectEl.value : '1_month';
                                    handleApproveCatalogSubscription(sub.id, planVal);
                                  }}
                                  className="px-2.5 py-1 bg-[#00f2ff] hover:bg-cyan-600 text-black rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer font-bold shrink-0 font-sans"
                                >
                                  Activate
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        ) : activeTab === 'magic-box' ? (
          <div className="space-y-6 text-left font-sans">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-card p-4 border-white/5 bg-white/[0.02]">
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 font-sans">Total Bots Configured</h4>
                <p className="text-xl font-display font-bold text-white">{magicBoxConfigs.length}</p>
              </div>
              <div className="glass-card p-4 border-amber-500/20 bg-amber-500/5">
                <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1 font-sans">Pending Approvals</h4>
                <p className="text-xl font-display font-bold text-amber-400">
                  {magicBoxConfigs.filter(p => p.paymentStatus === 'pending').length}
                </p>
              </div>
              <div className="glass-card p-4 border-emerald-500/20 bg-emerald-500/5">
                <h4 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1 font-sans">Approved Premium</h4>
                <p className="text-xl font-display font-bold text-emerald-400">
                  {magicBoxConfigs.filter(p => p.paymentStatus === 'approved').length}
                </p>
              </div>
            </div>

            {/* Filter buttons */}
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 w-fit gap-1 font-sans">
              {[
                { id: 'all', label: 'All Bots' },
                { id: 'pending', label: 'Pending Payment Verification' },
                { id: 'approved', label: 'Approved Premium' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setLpFilter(f.id as any)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                    lpFilter === f.id ? "bg-white text-black shadow-md" : "text-gray-400 hover:text-white"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Magic Box List Grid */}
            <div className="grid grid-cols-1 gap-4 font-sans">
              {(() => {
                const list = magicBoxConfigs.filter(p => {
                  if (lpFilter === 'pending') return p.paymentStatus === 'pending';
                  if (lpFilter === 'approved') return p.paymentStatus === 'approved';
                  return true;
                });

                if (list.length === 0) {
                  return (
                    <div className="p-12 text-center bg-white/[0.01] border border-dashed border-white/5 rounded-3xl">
                      <p className="text-sm text-gray-500 font-medium">No bots found under this filter.</p>
                    </div>
                  );
                }

                return list.map((config) => {
                  const owner = users.find(u => u.id === config.userId || u.uid === config.userId);
                  const ownerName = owner?.name || owner?.email?.split('@')[0] || 'Unknown Owner';
                  const ownerEmail = owner?.email || 'N/A';
                  const ownerPhone = owner?.phone || 'N/A';

                  return (
                    <div key={config.id} className="glass-card p-5 border-white/5 bg-white/[0.01] flex flex-col md:flex-row justify-between items-start md:items-stretch gap-6 transition-all hover:bg-white/[0.02]">
                      <div className="flex-1 space-y-4 text-left">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 bg-dragon-cyan/15 border border-dragon-cyan/30 text-dragon-cyan rounded text-[9px] font-black uppercase tracking-widest font-mono">
                              MAGIC BOX: {config.platform?.toUpperCase()}
                            </span>
                            {config.paymentStatus === 'approved' ? (
                              <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-[9px] font-black uppercase tracking-widest font-mono">
                                PREMIUM APPROVED
                              </span>
                            ) : config.paymentStatus === 'pending' ? (
                              <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded text-[9px] font-black uppercase tracking-widest font-mono animate-pulse">
                                PENDING VERIFICATION
                              </span>
                            ) : config.paymentStatus === 'rejected' ? (
                              <span className="px-2.5 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded text-[9px] font-black uppercase tracking-widest font-mono">
                                REJECTED
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 bg-white/5 border border-white/10 text-gray-400 rounded text-[9px] font-black uppercase tracking-widest font-mono">
                                TRIAL / INACTIVE
                              </span>
                            )}
                          </div>
                          <h3 className="text-base font-black text-white uppercase">{config.platform} Bot Automation</h3>
                          <p className="text-xs text-gray-400">Page/Bot ID: <span className="text-dragon-cyan font-mono select-all">{config.pageId || 'N/A'}</span></p>
                          {config.subscribedPageIds && (
                            <p className="text-[10px] text-gray-400">Subscribed Page ID(s): <span className="text-white font-mono">{config.subscribedPageIds}</span></p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-[10px] font-mono border-t border-white/5 pt-4">
                          <div><span className="text-zinc-500 uppercase">Owner Name:</span> <span className="text-white font-semibold">{ownerName}</span></div>
                          <div><span className="text-zinc-500 uppercase">Owner Email:</span> <span className="text-zinc-300 select-all">{ownerEmail}</span></div>
                          <div><span className="text-zinc-500 uppercase">Owner Phone:</span> <span className="text-zinc-300">{ownerPhone}</span></div>
                          <div>
                            <span className="text-zinc-500 uppercase">Created:</span>{' '}
                            <span className="text-zinc-400">
                              {config.createdAt ? new Date(config.createdAt).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Payment review block */}
                      <div className="w-full md:w-80 shrink-0 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6 flex flex-col justify-between gap-4 text-left">
                        {config.paymentStatus === 'pending' ? (
                          <div className="space-y-3 w-full">
                            <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest flex items-center gap-1 font-mono">
                              <AlertTriangle size={12} /> VERIFY PAYMENT DETAILS:
                            </p>
                            <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1.5 font-mono text-[10px]">
                              <div><span className="text-zinc-500">Plan:</span> <span className="text-white font-black uppercase">{config.selectedPlan?.replace('_', ' ') || '1 Month'}</span></div>
                              <div><span className="text-zinc-500">bKash Sender:</span> <span className="text-white font-bold">{config.paymentPhone}</span></div>
                              <div><span className="text-zinc-500">TrxID:</span> <span className="text-dragon-cyan font-black select-all uppercase">{config.paymentTrxId}</span></div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRejectMagicBox(config.id)}
                                className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 hover:border-red-500/40 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer text-center"
                              >
                                Reject ❌
                              </button>
                              <button
                                onClick={() => handleApproveMagicBox(config.id, config.selectedPlan || '1_month')}
                                className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-black rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer text-center font-bold"
                              >
                                Approve ✅
                              </button>
                            </div>
                          </div>
                        ) : config.paymentStatus === 'approved' ? (
                          <div className="space-y-3 font-mono text-[10px] w-full">
                            <p className="text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1">
                              <CheckCircle2 size={12} /> ACTIVE PLAN INFO:
                            </p>
                            <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1">
                              <div><span className="text-zinc-500">Plan Duration:</span> <span className="text-white font-bold uppercase">{config.selectedPlan?.replace('_', ' ') || '1 Month'}</span></div>
                              <div>
                                <span className="text-zinc-500">Expires At:</span>{' '}
                                <span className="text-white font-black">
                                  {config.expiryTime ? new Date(config.expiryTime).toLocaleDateString() : 'N/A'}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRejectMagicBox(config.id)}
                              className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer text-center"
                            >
                              Deactivate Bot
                            </button>
                          </div>
                        ) : (
                          <div className="h-full flex flex-col justify-center items-center text-center p-4 bg-white/[0.01] border border-dashed border-white/5 rounded-2xl w-full">
                            <Clock size={20} className="text-gray-600 mb-1" />
                            <p className="text-[10px] text-gray-500 uppercase font-black tracking-wider">TRIAL / INACTIVE MODE</p>
                            <p className="text-[8px] text-gray-600 font-medium leading-relaxed mt-0.5">
                              {config.trialStartTime ? (
                                `Trial started on ${new Date(config.trialStartTime).toLocaleDateString()}`
                              ) : 'No payment submitted yet.'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* bKash Payment Activation Settings Card */}
            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-pink-500/20 text-pink-400 rounded-lg">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-white uppercase tracking-tighter">bKash Payment Settings</h3>
                  <p className="text-[10px] text-gray-500 uppercase font-black">Landing Page Activation Payment Gateway</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-white uppercase text-left">Activate Automatic Payment Gateway</p>
                  <p className="text-[9px] text-gray-500 text-left">Enable bkash checkout API for instant landing page activation</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={bkashConfig.autoPaymentEnabled}
                    onChange={e => setBkashConfig({...bkashConfig, autoPaymentEnabled: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-300 after:border-gray-100 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500 peer-checked:after:bg-black peer-checked:after:border-black"></div>
                </label>
              </div>

              <div className="space-y-4">
                {/* Manual Cash-In Number */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 block text-left">bKash Manual Payment Number (Send Money)</label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                    <input 
                      type="text"
                      value={bkashConfig.manualNumber}
                      onChange={e => setBkashConfig({...bkashConfig, manualNumber: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm font-mono focus:border-pink-500 outline-none transition-all text-white"
                      placeholder="e.g. 01700-000000"
                    />
                  </div>
                </div>

                {bkashConfig.autoPaymentEnabled && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 pt-2 border-t border-white/5"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 block text-left">App Key</label>
                        <input 
                          type="text"
                          value={bkashConfig.appKey || ''}
                          onChange={e => setBkashConfig({...bkashConfig, appKey: e.target.value})}
                          className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm font-mono focus:border-pink-500 outline-none transition-all text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 block text-left">App Secret</label>
                        <input 
                          type="password"
                          value={bkashConfig.apiSecret || ''}
                          onChange={e => setBkashConfig({...bkashConfig, apiSecret: e.target.value})}
                          className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm font-mono focus:border-pink-500 outline-none transition-all text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 block text-left">API Username</label>
                        <input 
                          type="text"
                          value={bkashConfig.username || ''}
                          onChange={e => setBkashConfig({...bkashConfig, username: e.target.value})}
                          className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm font-mono focus:border-pink-500 outline-none transition-all text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 block text-left">API Password</label>
                        <input 
                          type="password"
                          value={bkashConfig.password || ''}
                          onChange={e => setBkashConfig({...bkashConfig, password: e.target.value})}
                          className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm font-mono focus:border-pink-500 outline-none transition-all text-white"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                <button 
                  type="button"
                  onClick={handleSaveBkashConfig}
                  disabled={bkashSaveStatus === 'saving'}
                  className="w-full py-4 bg-pink-500 hover:bg-pink-600 text-black font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50 rounded-xl cursor-pointer text-center font-bold"
                >
                  {bkashSaveStatus === 'saving' ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : bkashSaveStatus === 'saved' ? (
                    <><CheckCircle2 size={16} /> Configuration Saved</>
                  ) : (
                    <><Save size={16} /> Update bKash Settings</>
                  )}
                </button>
              </div>
            </div>
            <div className="glass-card p-6 space-y-4">
               <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
                   <Globe size={20} />
                 </div>
                 <div>
                   <h3 className="font-bold text-white uppercase tracking-tighter">Meta Developer Settings</h3>
                   <p className="text-[10px] text-gray-500 uppercase font-black">Global Facebook & Instagram App Config</p>
                 </div>
               </div>

               <div className="space-y-4">
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">App ID</label>
                   <div className="relative">
                     <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                     <input 
                       type="text"
                       value={metaConfig.metaAppId}
                       onChange={e => setMetaConfig({...metaConfig, metaAppId: e.target.value})}
                       className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm font-mono focus:border-indigo-500 outline-none transition-all"
                       placeholder="Enter Facebook App ID"
                     />
                   </div>
                 </div>

                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">App Secret</label>
                   <div className="relative">
                     <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                     <input 
                       type="password"
                       value={metaConfig.metaAppSecret}
                       onChange={e => setMetaConfig({...metaConfig, metaAppSecret: e.target.value})}
                       className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm font-mono focus:border-indigo-500 outline-none transition-all"
                       placeholder="Enter Facebook App Secret"
                     />
                   </div>
                 </div>

                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Webhook Verify Token</label>
                   <div className="relative">
                     <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                     <input 
                       type="text"
                       value={metaConfig.metaVerifyToken}
                       onChange={e => setMetaConfig({...metaConfig, metaVerifyToken: e.target.value})}
                       className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm font-mono focus:border-indigo-500 outline-none transition-all"
                       placeholder="Verify Token for Meta Webhooks"
                     />
                   </div>
                 </div>

                 <button 
                   onClick={handleSaveMetaConfig}
                   disabled={saveStatus === 'saving'}
                   className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                 >
                   {saveStatus === 'saving' ? (
                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                   ) : saveStatus === 'saved' ? (
                     <><CheckCircle2 size={16} /> Configuration Saved</>
                   ) : (
                     <><Save size={16} /> Update System Settings</>
                   )}
                 </button>
               </div>
            </div>

            <div className="glass-card p-6 border-amber-500/20 bg-amber-500/5">
              <h4 className="text-amber-500 font-bold uppercase text-[10px] tracking-widest mb-2">Technical Note</h4>
              <p className="text-xs text-gray-400 font-light leading-relaxed">
                Ensure the Meta Application is in <span className="text-white font-medium">Live Mode</span> if you are not testing with Developer IDs. The callback URL must be correctly set in the Meta Developer Dashboard to handle automated logins and webhooks.
              </p>
            </div>

            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-pink-500/20 text-pink-400 rounded-lg">
                  <Video size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-white uppercase tracking-tighter">TikTok Developer Settings</h3>
                  <p className="text-[10px] text-gray-500 uppercase font-black">Global TikTok Login & Webhook Config</p>
                </div>
              </div>

               <div className="space-y-4">
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Client Key</label>
                   <div className="relative">
                     <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                     <input 
                       type="text"
                       value={tiktokConfig.tiktokClientKey}
                       onChange={e => setTiktokConfig({...tiktokConfig, tiktokClientKey: e.target.value})}
                       className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm font-mono focus:border-pink-500 outline-none transition-all"
                       placeholder="Enter TikTok Client Key"
                     />
                   </div>
                 </div>

                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Client Secret</label>
                   <div className="relative">
                     <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                     <input 
                       type="password"
                       value={tiktokConfig.tiktokClientSecret}
                       onChange={e => setTiktokConfig({...tiktokConfig, tiktokClientSecret: e.target.value})}
                       className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm font-mono focus:border-pink-500 outline-none transition-all"
                       placeholder="Enter TikTok Client Secret"
                     />
                   </div>
                 </div>

                 <button 
                   onClick={handleSaveTiktokConfig}
                   disabled={tkSaveStatus === 'saving'}
                   className="w-full py-4 bg-pink-600 hover:bg-pink-500 text-white rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                 >
                   {tkSaveStatus === 'saving' ? (
                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                   ) : tkSaveStatus === 'saved' ? (
                     <><CheckCircle2 size={16} /> Configuration Saved</>
                   ) : (
                     <><Save size={16} /> Update TikTok Settings</>
                    )}
                  </button>
                </div>
             </div>

             <div className="glass-card p-6 space-y-4">
              <div className="flex items-center justify-between gap-3 mb-2 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-dragon-cyan/20 text-dragon-cyan rounded-lg">
                    <Activity size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white uppercase tracking-tighter text-sm sm:text-base">Courier API & Webhook Integration</h3>
                    <p className="text-[10px] text-gray-500 uppercase font-black">Delivery Man Assignment & Tracking Event Integration</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={apiConfig.webhookActive}
                    onChange={e => setApiConfig({...apiConfig, webhookActive: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-300 after:border-gray-100 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-dragon-cyan peer-checked:after:bg-black peer-checked:after:border-black"></div>
                  <span className="ml-2 text-[10px] font-black uppercase text-gray-400 peer-checked:text-dragon-cyan select-none">
                    {apiConfig.webhookActive ? 'Active' : 'Inactive'}
                  </span>
                </label>
              </div>

               <div className="space-y-4">
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Webhook Endpoint URL (Output Hook Link)</label>
                   <div className="relative">
                     <Globe size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                     <input 
                       type="url"
                       value={apiConfig.webhookUrl}
                       onChange={e => setApiConfig({...apiConfig, webhookUrl: e.target.value})}
                       className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm font-mono focus:border-dragon-cyan outline-none transition-all text-white"
                       placeholder="https://your-courier-or-delivery-app.com/api/orders"
                     />
                   </div>
                 </div>

                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">API Key / Secret Token</label>
                   <div className="flex gap-2">
                     <div className="relative flex-1">
                       <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                       <input 
                         type="text"
                         value={apiConfig.apiKey}
                         onChange={e => setApiConfig({...apiConfig, apiKey: e.target.value})}
                         className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm font-mono focus:border-dragon-cyan outline-none transition-all text-white"
                         placeholder="Click Generate to create API Key"
                       />
                     </div>
                     <button
                       type="button"
                       onClick={handleGenerateApiKey}
                       className="px-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-dragon-cyan text-white text-xs font-bold transition-all uppercase tracking-wider shrink-0 cursor-pointer"
                     >
                       Generate
                     </button>
                   </div>
                 </div>

                 

                 <button 
                   type="button"
                   onClick={handleSaveApiConfig}
                   disabled={apiSaveStatus === 'saving'}
                   className="w-full py-4 bg-dragon-cyan hover:bg-dragon-cyan/90 text-black font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50 rounded-xl cursor-pointer"
                 >
                   {apiSaveStatus === 'saving' ? (
                     <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                   ) : apiSaveStatus === 'saved' ? (
                     <><CheckCircle2 size={16} /> Configuration Saved</>
                   ) : (
                     <><Save size={16} /> Update Integration Settings</>
                   )}
                 </button>
               </div>
            </div>

                         <div className="glass-card p-6 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-dragon-cyan/20 text-dragon-cyan rounded-lg">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-white uppercase tracking-tighter text-base sm:text-lg">Global Plan Pricing Settings</h3>
                  <p className="text-[10px] text-zinc-500 uppercase font-black">Configure Bangladesh (BDT ৳) and International (USD $) prices</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* My Catalog Pricing */}
                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-4">
                  <h4 className="text-xs font-black uppercase text-dragon-cyan tracking-wider flex items-center gap-2">
                    <BookOpen size={14} /> My Catalog Plans
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* BDT */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Bangladesh (BDT ৳)</p>
                      <div className="grid grid-cols-2 gap-2">
                        {['1_month', '3_months', '6_months', '1_year'].map((dur) => (
                          <div key={`my_catalog-bd-${dur}`} className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{dur.replace('_', ' ')}</label>
                            <input
                              type="number"
                              value={pricingConfig.my_catalog.bd[dur as keyof typeof pricingConfig.my_catalog.bd] || 0}
                              onChange={(e) => setPricingConfig({
                                ...pricingConfig,
                                my_catalog: {
                                  ...pricingConfig.my_catalog,
                                  bd: { ...pricingConfig.my_catalog.bd, [dur]: Number(e.target.value) }
                                }
                              })}
                              className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-xs font-mono text-white focus:border-dragon-cyan outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* USD */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">International (USD $)</p>
                      <div className="grid grid-cols-2 gap-2">
                        {['1_month', '3_months', '6_months', '1_year'].map((dur) => (
                          <div key={`my_catalog-intl-${dur}`} className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{dur.replace('_', ' ')}</label>
                            <input
                              type="number"
                              step="0.01"
                              value={pricingConfig.my_catalog.intl[dur as keyof typeof pricingConfig.my_catalog.intl] || 0}
                              onChange={(e) => setPricingConfig({
                                ...pricingConfig,
                                my_catalog: {
                                  ...pricingConfig.my_catalog,
                                  intl: { ...pricingConfig.my_catalog.intl, [dur]: Number(e.target.value) }
                                }
                              })}
                              className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-xs font-mono text-white focus:border-dragon-cyan outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Landing Pages Pricing */}
                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-4">
                  <h4 className="text-xs font-black uppercase text-dragon-cyan tracking-wider flex items-center gap-2">
                    <Save size={14} /> Landing Page Plans
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* BDT */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Bangladesh (BDT ৳)</p>
                      <div className="grid grid-cols-2 gap-2">
                        {['1_month', '3_months', '6_months', '1_year'].map((dur) => (
                          <div key={`landing_pages-bd-${dur}`} className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{dur.replace('_', ' ')}</label>
                            <input
                              type="number"
                              value={pricingConfig.landing_pages.bd[dur as keyof typeof pricingConfig.landing_pages.bd] || 0}
                              onChange={(e) => setPricingConfig({
                                ...pricingConfig,
                                landing_pages: {
                                  ...pricingConfig.landing_pages,
                                  bd: { ...pricingConfig.landing_pages.bd, [dur]: Number(e.target.value) }
                                }
                              })}
                              className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-xs font-mono text-white focus:border-dragon-cyan outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* USD */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">International (USD $)</p>
                      <div className="grid grid-cols-2 gap-2">
                        {['1_month', '3_months', '6_months', '1_year'].map((dur) => (
                          <div key={`landing_pages-intl-${dur}`} className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{dur.replace('_', ' ')}</label>
                            <input
                              type="number"
                              step="0.01"
                              value={pricingConfig.landing_pages.intl[dur as keyof typeof pricingConfig.landing_pages.intl] || 0}
                              onChange={(e) => setPricingConfig({
                                ...pricingConfig,
                                landing_pages: {
                                  ...pricingConfig.landing_pages,
                                  intl: { ...pricingConfig.landing_pages.intl, [dur]: Number(e.target.value) }
                                }
                              })}
                              className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-xs font-mono text-white focus:border-dragon-cyan outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pro Websites Pricing */}
                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-4">
                  <h4 className="text-xs font-black uppercase text-dragon-cyan tracking-wider flex items-center gap-2">
                    <Globe size={14} /> Pro Website Plans
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* BDT */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Bangladesh (BDT ৳)</p>
                      <div className="grid grid-cols-2 gap-2">
                        {['1_month', '3_months', '6_months', '1_year'].map((dur) => (
                          <div key={`pro_websites-bd-${dur}`} className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{dur.replace('_', ' ')}</label>
                            <input
                              type="number"
                              value={pricingConfig.pro_websites.bd[dur as keyof typeof pricingConfig.pro_websites.bd] || 0}
                              onChange={(e) => setPricingConfig({
                                ...pricingConfig,
                                pro_websites: {
                                  ...pricingConfig.pro_websites,
                                  bd: { ...pricingConfig.pro_websites.bd, [dur]: Number(e.target.value) }
                                }
                              })}
                              className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-xs font-mono text-white focus:border-dragon-cyan outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* USD */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">International (USD $)</p>
                      <div className="grid grid-cols-2 gap-2">
                        {['1_month', '3_months', '6_months', '1_year'].map((dur) => (
                          <div key={`pro_websites-intl-${dur}`} className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{dur.replace('_', ' ')}</label>
                            <input
                              type="number"
                              step="0.01"
                              value={pricingConfig.pro_websites.intl[dur as keyof typeof pricingConfig.pro_websites.intl] || 0}
                              onChange={(e) => setPricingConfig({
                                ...pricingConfig,
                                pro_websites: {
                                  ...pricingConfig.pro_websites,
                                  intl: { ...pricingConfig.pro_websites.intl, [dur]: Number(e.target.value) }
                                }
                              })}
                              className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-xs font-mono text-white focus:border-dragon-cyan outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Magic Box Pricing */}
                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-4">
                  <h4 className="text-xs font-black uppercase text-dragon-cyan tracking-wider flex items-center gap-2">
                    <Zap size={14} /> Magic Box Automation Plans
                  </h4>
                  
                  <div className="space-y-6">
                    {Object.keys(pricingConfig.magic_box).map((platformKey) => {
                      const platformLabel = platformKey === 'bot' ? 'DOEL Messenger Chatbot' : platformKey.toUpperCase();
                      return (
                        <div key={`mb-pricing-${platformKey}`} className="border-t border-white/5 pt-4 first:border-0 first:pt-0 space-y-3 font-sans">
                          <p className="text-[11px] font-black uppercase text-zinc-300 tracking-wider flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-dragon-cyan" /> {platformLabel} Pricing
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* BDT */}
                            <div className="space-y-2">
                              <p className="text-[9px] font-bold uppercase text-zinc-500 tracking-widest">BDT (৳)</p>
                              <div className="grid grid-cols-2 gap-2">
                                {['1_month', '3_months'].map((dur) => (
                                  <div key={`mb-${platformKey}-bd-${dur}`} className="space-y-1">
                                    <label className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">{dur.replace('_', ' ')}</label>
                                    <input
                                      type="number"
                                      value={(pricingConfig.magic_box[platformKey as keyof typeof pricingConfig.magic_box] as any)?.bd[dur] || 0}
                                      onChange={(e) => setPricingConfig({
                                        ...pricingConfig,
                                        magic_box: {
                                          ...pricingConfig.magic_box,
                                          [platformKey]: {
                                            ...(pricingConfig.magic_box[platformKey as keyof typeof pricingConfig.magic_box] as any),
                                            bd: {
                                              ...(pricingConfig.magic_box[platformKey as keyof typeof pricingConfig.magic_box] as any).bd,
                                              [dur]: Number(e.target.value)
                                            }
                                          }
                                        }
                                      })}
                                      className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-xs font-mono text-white focus:border-dragon-cyan outline-none"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                            {/* USD */}
                            <div className="space-y-2">
                              <p className="text-[9px] font-bold uppercase text-zinc-500 tracking-widest">USD ($)</p>
                              <div className="grid grid-cols-2 gap-2">
                                {['1_month', '3_months'].map((dur) => (
                                  <div key={`mb-${platformKey}-intl-${dur}`} className="space-y-1">
                                    <label className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">{dur.replace('_', ' ')}</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={(pricingConfig.magic_box[platformKey as keyof typeof pricingConfig.magic_box] as any)?.intl[dur] || 0}
                                      onChange={(e) => setPricingConfig({
                                        ...pricingConfig,
                                        magic_box: {
                                          ...pricingConfig.magic_box,
                                          [platformKey]: {
                                            ...(pricingConfig.magic_box[platformKey as keyof typeof pricingConfig.magic_box] as any),
                                            intl: {
                                              ...(pricingConfig.magic_box[platformKey as keyof typeof pricingConfig.magic_box] as any).intl,
                                              [dur]: Number(e.target.value)
                                            }
                                          }
                                        }
                                      })}
                                      className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-xs font-mono text-white focus:border-dragon-cyan outline-none"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSavePricingConfig}
                disabled={pricingSaveStatus === 'saving'}
                className="w-full py-4 bg-dragon-cyan hover:bg-dragon-cyan/90 text-dragon-black font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50 rounded-xl cursor-pointer"
              >
                {pricingSaveStatus === 'saving' ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : pricingSaveStatus === 'saved' ? (
                  <><CheckCircle2 size={16} /> Pricing Configuration Saved</>
                ) : (
                  <><Save size={16} /> Save Pricing Configuration</>
                )}
              </button>
            </div>
          </div>
        )}
{/* User Info Drawer (Modal) */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-2xl bg-dragon-black border border-white/10 p-6 md:p-8 rounded-[2rem] relative my-8 shadow-2xl overflow-hidden"
            >
               <div className="absolute top-0 left-0 w-1 h-full bg-dragon-cyan" />
               <button onClick={() => setSelectedUser(null)} className="absolute top-6 right-6 text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors">
                  <X size={20} />
               </button>

               <div className="flex items-center gap-6 mb-6">
                  <img src={selectedUser.profileImage || undefined} className="w-20 h-20 rounded-[2rem] object-cover border border-dragon-cyan/20 animate-pulse" />
                  <div>
                    <h3 className="text-2xl font-display font-bold text-white tracking-tighter">{selectedUser.name}</h3>
                    <p className="text-dragon-cyan text-xs font-bold tracking-widest uppercase mt-1 font-mono">ID: {selectedUser.uid.substring(0, 8)}</p>
                  </div>
               </div>

               <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <DetailItem icon={<Globe size={18} />} label="Country" value={selectedUser.country} />
                     <DetailItem icon={<Phone size={18} />} label="Phone" value={selectedUser.phone} />
                     <DetailItem icon={<Mail size={18} />} label="Email" value={selectedUser.email} />
                     <DetailItem icon={<MapPin size={18} />} label="Address" value={selectedUser.address || 'Not specified'} />
                  </div>
                  
                  <div className="pt-4 border-t border-white/5 grid grid-cols-3 gap-4">
                     <QuickStat label="Orders" value={selectedUser.stats?.ordersSent || 0} />
                     <QuickStat label="AI Calls" value={selectedUser.stats?.aiUsageCount || 0} />
                     <QuickStat label="Status" value="PRO" active />
                  </div>

                  {/* SaaS Subscription & Approval Section */}
                  <div className="pt-6 border-t border-white/10 space-y-4">
                     <h4 className="text-sm font-display font-bold text-white flex items-center gap-2 font-mono">
                        <CreditCard className="text-dragon-cyan" size={18} /> SaaS Subscriptions & Requests
                     </h4>

                     {(() => {
                        const subs = selectedUser.subscriptions || {};
                        const pendingPlanIds = Object.keys(subs).filter(planId => subs[planId]?.status === 'pending');
                        const pendingDragonOptionOnlyPlanIds = Object.keys(subs).filter(planId => subs[planId]?.status === 'active' && subs[planId]?.dragonBotStatus === 'pending');
                        
                        if (pendingPlanIds.length === 0 && pendingDragonOptionOnlyPlanIds.length === 0) {
                          return null;
                        }

                        return (
                          <div className="space-y-3">
                            {pendingPlanIds.length > 0 && (
                              <div className="space-y-3">
                                <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest flex items-center gap-1 font-mono">
                                  <AlertTriangle size={12} /> Awaiting Payment Verification (Pending Payments):
                                </p>
                                {pendingPlanIds.map((planId, idx) => {
                                  const sub = subs[planId];
                                  const plan = SAAS_PLANS.find(p => p.id === planId);
                                  if (!plan) return null;

                                  return (
                                    <div key={`pending-regular-${planId}-${idx}`} className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-3 text-left">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <h5 className="text-xs font-bold text-white">{plan.name}</h5>
                                          {sub.isDragonBotOption && (
                                            <p className="text-[9px] text-dragon-cyan font-semibold uppercase tracking-wide mt-0.5 font-mono">• Active Dragon Bot Option Included</p>
                                          )}
                                        </div>
                                        <span className="text-xs font-mono font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">৳{sub.priceApplied || plan.price}</span>
                                      </div>

                                      <div className="grid grid-cols-2 gap-2 text-[10px] bg-black/30 p-2 rounded-lg font-mono text-left">
                                        <div><span className="text-zinc-500 uppercase">Gateway:</span> <span className="text-amber-450 uppercase font-black">{sub.paymentMethod}</span></div>
                                        <div><span className="text-zinc-500 uppercase">Sender:</span> <span className="text-zinc-200">{sub.senderAccount || 'N/A'}</span></div>
                                        <div className="col-span-2"><span className="text-zinc-500 uppercase">TxID:</span> <span className="text-white font-black select-all uppercase">{sub.transactionId}</span></div>
                                      </div>

                                      <div className="flex gap-2">
                                        <button 
                                          onClick={() => handleRejectSubscription(selectedUser.uid, planId, false)} 
                                          className="flex-1 py-1.5 bg-red-500/10 hover:bg-red-550 hover:text-white border border-red-500/20 text-red-500 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all font-mono"
                                        >
                                          Reject ❌
                                        </button>
                                        <button 
                                          onClick={() => handleApproveSubscription(selectedUser.uid, planId, false)} 
                                          className="flex-1 py-1.5 bg-emerald-500 hover:bg-emerald-650 hover:text-black hover:border-emerald-555 border border-emerald-500/20 text-emerald-400 hover:text-black rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all font-mono"
                                        >
                                          Approve ✅
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {pendingDragonOptionOnlyPlanIds.length > 0 && (
                              <div className="space-y-3 pt-3 border-t border-white/5">
                                <p className="text-[10px] text-dragon-cyan font-bold uppercase tracking-widest flex items-center gap-1 font-mono">
                                  <AlertTriangle size={12} className="text-dragon-cyan" /> DOEL Messenger Bot Payment Pending (Dragon Option Only):
                                </p>
                                {pendingDragonOptionOnlyPlanIds.map((planId, idx) => {
                                  const sub = subs[planId];
                                  const plan = SAAS_PLANS.find(p => p.id === planId);
                                  if (!plan) return null;

                                  return (
                                    <div key={`pending-dragon-opt-${planId}-${idx}`} className="p-4 rounded-xl bg-dragon-cyan/5 border border-dragon-cyan/20 space-y-3 text-left">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <h5 className="text-xs font-bold text-white">{plan.name} - DOEL Messenger Bot</h5>
                                        </div>
                                        <span className="text-xs font-mono font-black text-dragon-cyan bg-dragon-cyan/10 px-2 py-0.5 rounded">৳{sub.dragonBotPriceApplied || plan.dragonOptionPriceAdd}</span>
                                      </div>

                                      <div className="grid grid-cols-2 gap-2 text-[10px] bg-black/30 p-2 rounded-lg font-mono text-left">
                                        <div><span className="text-zinc-500 uppercase">Gateway:</span> <span className="text-dragon-cyan uppercase font-black">{sub.dragonBotPaymentMethod || 'N/A'}</span></div>
                                        <div><span className="text-zinc-500 uppercase">Sender:</span> <span className="text-zinc-200">{sub.dragonBotSenderAccount || 'N/A'}</span></div>
                                        <div className="col-span-2"><span className="text-zinc-500 uppercase">TxID:</span> <span className="text-white font-black select-all uppercase">{sub.dragonBotTransactionId || 'N/A'}</span></div>
                                      </div>

                                      <div className="flex gap-2">
                                        <button 
                                          onClick={() => handleRejectSubscription(selectedUser.uid, planId, true)} 
                                          className="flex-1 py-1.5 bg-red-500/10 hover:bg-red-550 hover:text-white border border-red-500/20 text-red-500 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all font-mono"
                                        >
                                          Reject Option ❌
                                        </button>
                                        <button 
                                          onClick={() => handleApproveSubscription(selectedUser.uid, planId, true)} 
                                          className="flex-1 py-1.5 bg-dragon-cyan hover:bg-white hover:text-black border border-dragon-cyan/20 text-dragon-cyan hover:text-black rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all font-mono"
                                        >
                                          Approve Option ✅
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                     })()}

                     <div className="space-y-2">
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest font-mono">All Plans Status:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[250px] overflow-y-auto pr-1">
                          {SAAS_PLANS.map((plan, idx) => {
                            const sub = selectedUser.subscriptions?.[plan.id];
                             const isDragonActive = sub?.isDragonBotOption && sub?.dragonBotStatus === 'active';
                             const isDragonPending = sub?.isDragonBotOption && sub?.dragonBotStatus === 'pending';
                            const isPending = sub?.status === 'pending';
                            if (isPending) return null;

                            const isActive = sub?.status === 'active';

                            let statusText = "Inactive";
                            let statusColor = "text-zinc-500 bg-zinc-800/10 border-zinc-800/20";
                            if (isActive) {
                              statusText = `Active (expiry: ${sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString() : 'N/A'})`;
                              statusColor = "text-emerald-400 bg-emerald-500/5 border-emerald-500/20";
                               if (isDragonActive) {
                                 statusText += " + DOEL Messenger Active";
                               } else if (isDragonPending) {
                                 statusText += " (DOEL Messenger Pending)";
                               }
                            } else if (sub?.status === 'expired') {
                              statusText = "Expired";
                              statusColor = "text-red-400 bg-red-500/5 border-red-500/20";
                            }

                            return (
                              <div key={`saas-plan-status-${plan.id}-${idx}`} className={cn("p-3 rounded-xl border text-xs flex flex-col justify-between gap-2.5 text-left", statusColor)}>
                                <div className="space-y-0.5">
                                  <p className="font-bold text-zinc-200">{plan.name}</p>
                                  <p className="text-[9px] text-zinc-400 font-mono mt-0.5">{statusText}</p>
                                </div>
                                {!isActive ? (
                                  <button 
                                    onClick={() => handleApproveSubscription(selectedUser.uid, plan.id)}
                                    className="w-full py-1 bg-white/5 hover:bg-white/10 rounded text-[9px] uppercase tracking-widest border border-white/10 text-white font-bold font-mono transition-colors"
                                  >
                                    Force Activate
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => handleRejectSubscription(selectedUser.uid, plan.id)}
                                    className="w-full py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-white rounded text-[9px] uppercase tracking-widest border border-red-500/10 font-bold font-mono transition-colors"
                                  >
                                    Revoke
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                     </div>
                  </div>

                  {/* Catalog Subscription Section */}
                  <div className="pt-6 border-t border-white/10 space-y-4">
                     <h4 className="text-sm font-display font-bold text-white flex items-center gap-2 font-mono">
                        <BookOpen className="text-dragon-cyan" size={18} /> My Catalog Subscription
                     </h4>
                     {(() => {
                        const catSub = catalogSubscriptions.find(c => c.id === selectedUser.uid || c.userId === selectedUser.uid);
                        if (!catSub) {
                          return (
                            <div className="p-3 bg-white/[0.01] border border-dashed border-white/5 rounded-xl text-center">
                              <p className="text-[10px] text-zinc-500 font-mono">No catalog subscription request found for this user.</p>
                            </div>
                          );
                        }

                        const statusText = catSub.paymentStatus === 'approved' 
                          ? `Active (expiry: ${catSub.activeUntil ? new Date(catSub.activeUntil).toLocaleDateString() : 'N/A'})`
                          : catSub.paymentStatus === 'pending'
                          ? 'Awaiting Approval (Pending)'
                          : 'Inactive';

                        const statusColor = catSub.paymentStatus === 'approved'
                          ? "text-emerald-400 bg-emerald-500/5 border-emerald-500/20"
                          : catSub.paymentStatus === 'pending'
                          ? "text-amber-400 bg-amber-500/5 border-amber-500/20"
                          : "text-zinc-500 bg-zinc-800/10 border-zinc-800/20";

                        return (
                          <div className="space-y-3 font-sans">
                            <div className={cn("p-4 rounded-xl border text-xs text-left", statusColor)}>
                              <div className="flex justify-between items-start">
                                <div>
                                  <h5 className="font-bold text-zinc-200">Catalog Upgrade Plan</h5>
                                  <p className="text-[9px] font-mono mt-1 uppercase">Plan: <span className="text-white font-bold">{catSub.selectedPlan?.replace('_', ' ') || 'N/A'}</span></p>
                                  <p className="text-[9px] font-mono mt-0.5">Status: {statusText}</p>
                                </div>
                                {catSub.paymentStatus === 'pending' && (
                                  <span className="text-xs font-mono font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">PENDING VERIFICATION</span>
                                )}
                              </div>

                              {catSub.paymentStatus === 'pending' && (
                                <div className="grid grid-cols-2 gap-2 text-[10px] bg-black/30 p-2 rounded-lg font-mono text-left mt-3">
                                  <div><span className="text-zinc-500 uppercase">Gateway:</span> <span className="text-amber-450 uppercase font-black">bKash</span></div>
                                  <div><span className="text-zinc-500 uppercase">Sender:</span> <span className="text-zinc-200">{catSub.paymentPhone || 'N/A'}</span></div>
                                  <div className="col-span-2"><span className="text-zinc-500 uppercase">TxID:</span> <span className="text-white font-black select-all uppercase">{catSub.paymentTrxId || 'N/A'}</span></div>
                                </div>
                              )}

                              <div className="flex gap-2 mt-3">
                                {catSub.paymentStatus === 'pending' ? (
                                  <>
                                    <button 
                                      onClick={() => handleRejectCatalogSubscription(catSub.id)} 
                                      className="flex-1 py-1.5 bg-red-500/10 hover:bg-red-550 border border-red-500/20 text-red-500 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all font-mono"
                                    >
                                      Reject ❌
                                    </button>
                                    <button 
                                      onClick={() => handleApproveCatalogSubscription(catSub.id, catSub.selectedPlan)} 
                                      className="flex-1 py-1.5 bg-emerald-500 hover:bg-emerald-650 border border-emerald-500/20 text-black font-bold rounded-lg text-[10px] uppercase tracking-widest transition-all font-mono"
                                    >
                                      Approve ✅
                                    </button>
                                  </>
                                ) : catSub.paymentStatus === 'approved' ? (
                                  <div className="space-y-2.5 w-full">
                                    {/* Upgrade/Extend dropdown */}
                                    <div className="space-y-1 border border-white/5 p-2 rounded-xl bg-white/[0.01] text-left">
                                      <label className="text-[8px] text-zinc-500 uppercase tracking-widest block font-bold font-mono">Upgrade/Extend Plan:</label>
                                      <div className="flex gap-1.5">
                                        <select 
                                          id={`drawer-catalog-upgrade-select-${catSub.id}`}
                                          className="bg-black border border-white/10 rounded px-2 py-1 text-[10px] text-white outline-none flex-1 font-mono"
                                          defaultValue="1_month"
                                        >
                                          <option value="1_month">1 Month (৳499)</option>
                                          <option value="3_months">3 Months (৳1300)</option>
                                          <option value="6_months">6 Months (৳2400)</option>
                                          <option value="1_year">1 Year (৳4500)</option>
                                        </select>
                                        <button
                                          onClick={() => {
                                            const selectEl = document.getElementById(`drawer-catalog-upgrade-select-${catSub.id}`) as HTMLSelectElement;
                                            const planVal = selectEl ? selectEl.value : '1_month';
                                            handleApproveCatalogSubscription(catSub.id, planVal);
                                          }}
                                          className="px-2.5 py-1 bg-[#00f2ff] hover:bg-cyan-600 text-black rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer font-bold shrink-0 font-sans"
                                        >
                                          Upgrade
                                        </button>
                                      </div>
                                    </div>
                                    <button 
                                      onClick={() => handleRejectCatalogSubscription(catSub.id)}
                                      className="w-full py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-white rounded-lg text-[10px] uppercase tracking-widest border border-red-500/10 font-bold font-mono transition-colors"
                                    >
                                      Revoke Catalog Subscription
                                    </button>
                                  </div>
                                ) : (
                                  <div className="space-y-2.5 w-full">
                                    {/* Activate dropdown */}
                                    <div className="space-y-1 border border-white/5 p-2 rounded-xl bg-black/20 text-left w-full font-mono">
                                      <label className="text-[8px] text-zinc-500 uppercase tracking-widest block font-bold">Select Active Plan:</label>
                                      <div className="flex gap-1.5">
                                        <select 
                                          id={`drawer-catalog-activate-select-${catSub.id}`}
                                          className="bg-black border border-white/10 rounded px-2 py-1 text-[10px] text-white outline-none flex-1 font-mono"
                                          defaultValue="1_month"
                                        >
                                          <option value="1_month">1 Month (৳499)</option>
                                          <option value="3_months">3 Months (৳1300)</option>
                                          <option value="6_months">6 Months (৳2400)</option>
                                          <option value="1_year">1 Year (৳4500)</option>
                                        </select>
                                        <button
                                          onClick={() => {
                                            const selectEl = document.getElementById(`drawer-catalog-activate-select-${catSub.id}`) as HTMLSelectElement;
                                            const planVal = selectEl ? selectEl.value : '1_month';
                                            handleApproveCatalogSubscription(catSub.id, planVal);
                                          }}
                                          className="px-2.5 py-1 bg-[#00f2ff] hover:bg-cyan-600 text-black rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer font-bold shrink-0 font-sans"
                                        >
                                          Activate
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                     })()}
                  </div>
               </div>

               <div className="mt-6 pt-4 border-t border-white/5 flex gap-3">
                  <button className="flex-1 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">Suspend User</button>
                  <button onClick={() => setSelectedUser(null)} className="flex-1 py-3 bg-dragon-cyan text-dragon-black rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white transition-all shadow-lg font-mono">Close Drawer</button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </PageContainer>
  );
}

function DetailItem({ icon, label, value }: any) {
  return (
    <div className="flex items-center gap-4">
       <div className="p-2.5 bg-white/5 rounded-xl text-gray-500">{icon}</div>
       <div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</p>
          <p className="text-sm font-light text-gray-200">{value}</p>
       </div>
    </div>
  );
}

function QuickStat({ label, value, active }: any) {
  return (
    <div className="text-center">
       <p className="text-lg font-display font-bold leading-none">{value}</p>
       <p className={cn("text-[9px] uppercase font-bold tracking-widest mt-1", active ? "text-dragon-cyan" : "text-gray-500")}>{label}</p>
    </div>
  );
}
