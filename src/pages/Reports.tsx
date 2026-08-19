import React, { useState, useEffect, useContext } from 'react';
import { collection, query, where, onSnapshot, orderBy, getDocs, getDoc, addDoc, setDoc, updateDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { AuthContext } from '../authContext';
import { BrandSvgIcon } from '../components/BrandSvgIcon';
import { getCurrencySymbol, COUNTRIES, getOfflineCouriers } from '../utils/countriesData';
import { PageContainer } from '../components/Navigation';
import { useNavigate } from 'react-router-dom';
import { getOrderProfitFinances as getOrderFinances } from '../utils/orderUtils';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  AlertTriangle,
  BarChart3,
  MoreVertical,
  LayoutGrid,
  ChevronDown,
  Menu,
  Truck,
  Zap,
  X,
  Check,
  CheckSquare,
  Forward,
  Search,
  ShieldAlert,
  RotateCcw,
  Clock
} from 'lucide-react';
import { Order, UserProfile } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

// Modular Subcomponents
import { StatBox } from '../components/reports/StatBox';
import { OrderRow } from '../components/reports/OrderRow';
import { GlobalLogisticsTab } from '../components/reports/GlobalLogisticsTab';
import { FraudManagementTab } from '../components/reports/FraudManagementTab';
import { DetailedPerformanceTab } from '../components/reports/DetailedPerformanceTab';
import { BulkCourierBookingModal } from '../components/reports/BulkCourierBookingModal';
import { SmartForwardModal } from '../components/reports/SmartForwardModal';
import { MenuSection, MenuItem, ExpandablePlatformMenuItem } from '../components/reports/ReportsSidebar';

export const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  cancelled: 'Cancel',
  confirmed: 'Confirmed',
  shipping: 'Shipping',
  paid_delivery: 'Paid Delivery',
  paid_return: 'Paid Return',
  fraud_return: 'Fraud Return (Loss)',
};

async function parseApiResponseError(response: Response, defaultMessage: string = "Request failed"): Promise<string> {
  let errMsg = `API error (${response.status})`;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const errData = await response.json().catch(() => ({}));
    errMsg = errData.error || errMsg;
  } else {
    const txt = await response.text().catch(() => "");
    if (txt.includes("503") || txt.includes("UNAVAILABLE") || txt.includes("high demand")) {
      errMsg = "DOELpro AI limits reached or model is currently busy. Please wait a moment.";
    }
  }
  return errMsg || defaultMessage;
}

export default function Reports() {
  const { user, profile } = useContext(AuthContext);
  const currencySymbol = profile?.country ? getCurrencySymbol(profile.country) : "৳";

  // --- DELEGATION & COLLABORATIVE ACCESS STATE ---
  const [delegations, setDelegations] = useState<any[]>([]);
  const [activeDelegateId, setActiveDelegateId] = useState<string>(() => {
    return localStorage.getItem('active_delegate_user_id') || '';
  });
  const [activeDelegate, setActiveDelegate] = useState<any>(null);

  // Load received delegations with Order permission
  useEffect(() => {
    if (!user) return;
    const qDel = query(
      collection(db, 'delegated_access'),
      where('granteeId', '==', user.uid),
      where('allowOrders', '==', true),
      where('status', '==', 'accepted')
    );
    const unsubDel = onSnapshot(qDel, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setDelegations(list);
      
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

  const [sentOrders, setSentOrders] = useState<Order[]>(() => {
    try {
      const cached = localStorage.getItem('dragon_sent_orders');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [receivedOrders, setReceivedOrders] = useState<Order[]>(() => {
    try {
      const cached = localStorage.getItem('dragon_received_orders');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      const cachedSent = localStorage.getItem('dragon_sent_orders');
      const cachedReceived = localStorage.getItem('dragon_received_orders');
      return (cachedSent || cachedReceived) ? false : true;
    } catch {
      return true;
    }
  });
  const [showCharts, setShowCharts] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    setIsLargeScreen(window.innerWidth >= 1024);
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [filter, setFilter] = useState<{ type: string; id?: string }>({ type: 'all' });
  const [configs, setConfigs] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'orders' | 'logistics' | 'detailed_reports' | 'fraud_detection'>('orders');
  
  // Delivery notes filtering states
  const [deliveryFilter, setDeliveryFilter] = useState<string>('pending');
  const [showDeliveryMenu, setShowDeliveryMenu] = useState(false);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const navigate = useNavigate();

  // Logistics state
  const [landingPages, setLandingPages] = useState<any[]>([]);
  const [proWebsites, setProWebsites] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [couriers, setCouriers] = useState<any[]>([]);
  const [courierLoading, setCourierLoading] = useState(false);
  const [editingCourier, setEditingCourier] = useState<any | null>(null);
  const [courierCredentials, setCourierCredentials] = useState<Record<string, string>>({});
  const [configuredCouriers, setConfiguredCouriers] = useState<any[]>([]);
  const [isBulkCourierModalOpen, setIsBulkCourierModalOpen] = useState(false);
  const [bulkBookingCourier, setBulkBookingCourier] = useState<any>(null);
  const [isBulkBookingInProgress, setIsBulkBookingInProgress] = useState(false);
  const [bulkBookingResults, setBulkBookingResults] = useState<any[] | null>(null);

  // Smart Forwarding state
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [forwardConfirmUser, setForwardConfirmUser] = useState<UserProfile | null>(null);

  // Fraud Detection states
  const [blacklistedItems, setBlacklistedItems] = useState<any[]>([]);
  const [blacklistedLoading, setBlacklistedLoading] = useState(false);

  // Fetch blacklisted entries in real-time
  useEffect(() => {
    if (!user) return;
    setBlacklistedLoading(true);
    const q = query(collection(db, 'fraud_blacklist'), where('sellerId', '==', user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      items.sort((a: any, b: any) => new Date(b.blockedAt || 0).getTime() - new Date(a.blockedAt || 0).getTime());
      setBlacklistedItems(items);
      setBlacklistedLoading(false);
    }, (err) => {
      console.error("Error fetching blacklist snapshot:", err);
      setBlacklistedLoading(false);
    });
    return () => unsub();
  }, [user]);

  const handleOpenForwardModal = async () => {
    setShowForwardModal(true);
    setForwardConfirmUser(null);
    if (!user) return;
    setUsersLoading(true);
    try {
      const chatQ = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', user.uid)
      );
      const chatSnap = await getDocs(chatQ);
      
      const friendIds = new Set<string>();
      chatSnap.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (data && Array.isArray(data.participants)) {
          data.participants.forEach((p: string) => {
            if (p !== user.uid) {
              friendIds.add(p);
            }
          });
        }
      });

      const list: UserProfile[] = [];
      if (friendIds.size > 0) {
        const fetchPromises = Array.from(friendIds).map(async (id) => {
          try {
            const uDoc = await getDoc(doc(db, 'users', id));
            if (uDoc.exists()) {
              return { uid: uDoc.id, ...uDoc.data() } as UserProfile;
            }
          } catch (fetchErr) {
            console.error(`Error fetching user details for ${id}:`, fetchErr);
          }
          return null;
        });
        
        const fetchedUsers = await Promise.all(fetchPromises);
        fetchedUsers.forEach(u => {
          if (u) list.push(u);
        });
      }
      setUsersList(list);
    } catch (err) {
      console.error("Error fetching inbox friend users for forwarding:", err);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleBulkCourierBooking = async () => {
    if (!bulkBookingCourier || selectedOrderIds.length === 0) return;
    setIsBulkBookingInProgress(true);
    setBulkBookingResults(null);
    try {
      const response = await fetch('/api/integration/bulk-courier-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderIds: selectedOrderIds,
          courierName: bulkBookingCourier.name || bulkBookingCourier,
          country: selectedCountry || 'Bangladesh',
          userId: activeDelegateId || user?.uid
        })
      });
      const data = await response.json();
      if (data.success) {
        setBulkBookingResults(data.results);
      } else {
        alert(`Booking failed: ${data.error || "Unknown Error"}`);
      }
    } catch (err: any) {
      console.error("Bulk booking error:", err);
      alert(`Server connection error: ${err.message || err}`);
    } finally {
      setIsBulkBookingInProgress(false);
    }
  };

  const handleForwardOrders = async (targetUser: UserProfile) => {
    if (!user || selectedOrderIds.length === 0) return;

    try {
      setLoading(true);
      setShowForwardModal(false);
      setForwardConfirmUser(null);

      const actualChatId = [user.uid, targetUser.uid].sort().join('_');

      let currentUserName = user.email || 'User';
      try {
        const myDoc = await getDoc(doc(db, 'users', user.uid));
        if (myDoc.exists()) {
          currentUserName = myDoc.data().name || currentUserName;
        }
      } catch (err) {
        console.error("Error fetching self profile:", err);
      }

      await setDoc(doc(db, 'chats', actualChatId), {
        participants: actualChatId.split('_'),
        updatedAt: new Date().toISOString(),
        lastMessage: `Forwarded ${selectedOrderIds.length} orders`,
        lastMessageAt: new Date().toISOString()
      }, { merge: true });

      for (const orderId of selectedOrderIds) {
        const originalOrder = [...sentOrders, ...receivedOrders].find(o => o.id === orderId);
        if (!originalOrder) continue;

        const newOrderRef = doc(collection(db, 'orders'));
        const newOrderId = newOrderRef.id;

        try {
          const origDocRef = doc(db, 'orders', orderId);
          await updateDoc(origDocRef, {
            isForwarded: true,
            forwardedToId: targetUser.uid,
            forwardedToName: targetUser.name || targetUser.phone || targetUser.email || 'Supplier',
            forwardedOrderId: newOrderId
          });
        } catch (origErr) {
          console.error("Error updating original doc with forwarded info:", origErr);
        }

        const clonedOrder: any = {
          ...originalOrder,
          id: newOrderId,
          originalOrderId: orderId,
          senderId: user.uid,
          receiverId: targetUser.uid,
          participants: actualChatId.split('_'),
          isForwarded: true,
          forwardedFromId: user.uid,
          forwardedFromName: currentUserName,
          forwardedToId: targetUser.uid,
          forwardedToName: targetUser.name || targetUser.phone || targetUser.email || 'Supplier',
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        clonedOrder.buyPrice = originalOrder.buyPrice !== undefined && originalOrder.buyPrice !== null ? Number(originalOrder.buyPrice) : 0;
        clonedOrder.sellPrice = typeof originalOrder.sellPrice === 'number' ? originalOrder.sellPrice : Number(originalOrder.sellPrice) || 0;
        clonedOrder.deliveryCharge = originalOrder.deliveryCharge !== undefined && originalOrder.deliveryCharge !== null ? Number(originalOrder.deliveryCharge) : 0;

        if (clonedOrder.productName) {
          clonedOrder.productName = String(clonedOrder.productName).substring(0, 250);
        } else {
          clonedOrder.productName = 'Product Name';
        }

        if (clonedOrder.customerName) {
          clonedOrder.customerName = String(clonedOrder.customerName).substring(0, 95);
        } else {
          delete clonedOrder.customerName;
        }

        if (clonedOrder.customerPhone) {
          clonedOrder.customerPhone = String(clonedOrder.customerPhone).substring(0, 25);
        } else {
          delete clonedOrder.customerPhone;
        }

        if (clonedOrder.customerAddress) {
          clonedOrder.customerAddress = String(clonedOrder.customerAddress).substring(0, 1000);
        } else {
          delete clonedOrder.customerAddress;
        }

        if (clonedOrder.productImage) {
          const isBase64 = String(clonedOrder.productImage).startsWith('data:');
          clonedOrder.productImage = String(clonedOrder.productImage).substring(0, isBase64 ? 2000000 : 2000);
        } else {
          delete clonedOrder.productImage;
        }

        delete clonedOrder.productImages;
        delete clonedOrder.gpsAddress;
        delete clonedOrder.latitude;
        delete clonedOrder.longitude;
        delete clonedOrder.trackingMethod;

        Object.keys(clonedOrder).forEach(key => {
          if (clonedOrder[key] === undefined || clonedOrder[key] === null) {
            delete clonedOrder[key];
          }
        });

        await setDoc(newOrderRef, clonedOrder);

        await addDoc(collection(db, `chats/${actualChatId}/messages`), {
          chatId: actualChatId,
          senderId: user.uid,
          type: 'order',
          text: `Forwarded Order: ${clonedOrder.productName}`,
          orderId: newOrderId,
          createdAt: new Date().toISOString()
        });
      }

      alert('Orders successfully forwarded!');
      setSelectedOrderIds([]);
    } catch (error: any) {
      console.error("Error forwarding orders:", error);
      alert('Error forwarding orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const effectiveUserId = activeDelegateId || user.uid;

    const qConfigs = query(collection(db, 'magic_box'), where('userId', '==', effectiveUserId));
    const unsubConfigs = onSnapshot(qConfigs, (snap) => {
      setConfigs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'magic_box');
    });

    const qSent = query(
      collection(db, 'orders'), 
      where('senderId', '==', effectiveUserId), 
      orderBy('createdAt', 'desc')
    );
    const qReceived = query(
      collection(db, 'orders'), 
      where('receiverId', '==', effectiveUserId), 
      orderBy('createdAt', 'desc')
    );

    const unsubSent = onSnapshot(qSent, (snap) => {
      const docs = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Order))
        .filter(o => o.status !== 'deleted');
      setSentOrders(docs);
      try {
        localStorage.setItem('dragon_sent_orders', JSON.stringify(docs));
      } catch {
        // Fail-safe silently in iframe environments
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'orders/sent');
    });

    const unsubReceived = onSnapshot(qReceived, (snap) => {
      const docs = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Order))
        .filter(o => o.status !== 'deleted');
      setReceivedOrders(docs);
      try {
        localStorage.setItem('dragon_received_orders', JSON.stringify(docs));
      } catch {
        // Fail-safe silently in iframe environments
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'orders/received');
      setLoading(false);
    });

    const qLandingPages = query(collection(db, 'landing-pages'), where('userId', '==', effectiveUserId));
    const unsubLanding = onSnapshot(qLandingPages, (snap) => {
      const pages = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setLandingPages(pages);
      
      if (pages.length > 0) {
        const firstPage = pages[0] as any;
        const country = firstPage.country || 'Bangladesh';
        fetchCouriers(country);
      } else {
        fetchCouriers('Bangladesh');
      }
    }, () => {
      fetchCouriers('Bangladesh');
    });

    const qProWebsites = query(collection(db, 'pro_websites'), where('userId', '==', effectiveUserId));
    const unsubProWebsites = onSnapshot(qProWebsites, (snap) => {
      setProWebsites(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {
      setProWebsites([]);
    });

    const qCourierConfigs = query(collection(db, 'courier_configs'), where('userId', '==', effectiveUserId));
    const unsubCourierConfigs = onSnapshot(qCourierConfigs, (snap) => {
      setConfiguredCouriers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {
      setConfiguredCouriers([]);
    });

    return () => { unsubSent(); unsubReceived(); unsubConfigs(); unsubLanding(); unsubProWebsites(); unsubCourierConfigs(); };
  }, [user, activeDelegateId]);

  const handleSaveCourierConfig = async () => {
    if (!user || !editingCourier) return;
    const effectiveUserId = activeDelegateId || user.uid;
    const docId = `${effectiveUserId}_${selectedCountry}_${editingCourier.name}`.replace(/\s+/g, '_');
    
    try {
      await setDoc(doc(db, 'courier_configs', docId), {
        userId: effectiveUserId,
        country: selectedCountry,
        courierName: editingCourier.name,
        credentials: courierCredentials,
        updatedAt: new Date().toISOString()
      });
      
      setEditingCourier(null);
      setCourierCredentials({});
      alert(`Configuration for ${editingCourier.name} saved successfully to Cloud Database! DOELpro AI will now use these credentials for API calls.`);
    } catch (err: any) {
      console.error("Error saving courier config:", err);
      alert(`Could not save courier configuration: ${err.message || err}`);
    }
  };

  const fetchCouriers = async (country: string) => {
    setSelectedCountry(country);
    if (!country) return;
    setCourierLoading(true);
    
    try {
      const offlineList = getOfflineCouriers(country);
      if (offlineList && offlineList.length > 0) {
        setCouriers(offlineList);
        setCourierLoading(false);
        return;
      }

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Act as a Global Logistics Expert. The user is from ${country}. 
        List 5 major reliable couriers in ${country} that support API integrations for e-commerce.
        Return a JSON array of objects with fields: 
        name, 
        requiredFields (array of strings like ['API Key', 'Client ID', 'Secret']),
        website.`,
          responseMimeType: "application/json"
        })
      });

      if (!response.ok) {
        const errMsg = await parseApiResponseError(response);
        throw new Error(errMsg);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid non-JSON response from server.");
      }

      const data = await response.json();
      if (data && data.error) {
        throw new Error(data.error);
      }
      setCouriers(data);
    } catch (e: any) {
      console.error(e);
      alert(`Could not load couriers list: ${e.message || e}`);
    } finally {
      setCourierLoading(false);
    }
  };

  const getUniqueOrders = (orders: Order[]): Order[] => {
    const seen: Record<string, boolean> = {};
    return orders.filter(o => {
      if (!o.id) return false;
      if (seen[o.id]) return false;
      seen[o.id] = true;
      return true;
    });
  };

  const allOrders = getUniqueOrders([...sentOrders, ...receivedOrders]).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const getFilteredOrders = () => {
    let list: Order[] = [];
    if (filter.type === 'sent') {
      list = sentOrders;
    } else if (filter.type === 'received') {
      list = receivedOrders;
    } else if (filter.type === 'all') {
      list = allOrders;
    } else {
      list = allOrders.filter(o => {
        if (filter.type === 'website') return o.platform === 'website' && (!filter.id || o.platformId === filter.id || o.websiteId === filter.id || o.pageId === filter.id || o.siteId === filter.id);
        if (filter.type === 'landing_page') return o.platform === 'landing_page' && (!filter.id || o.platformId === filter.id || o.pageId === filter.id);
        if (filter.type === 'facebook') return o.platform === 'facebook' && (!filter.id || o.platformId === filter.id);
        if (filter.type === 'whatsapp') return o.platform === 'whatsapp' && (!filter.id || o.platformId === filter.id);
        if (filter.type === 'tiktok') return o.platform === 'tiktok' && (!filter.id || o.platformId === filter.id);
        if (filter.type === 'viber') return o.platform === 'viber';
        if (filter.type === 'telegram') return o.platform === 'telegram';
        if (filter.type === 'line') return o.platform === 'line';
        if (filter.type === 'wechat') return o.platform === 'wechat';
        return true;
      });
    }

    if (deliveryFilter !== 'all') {
      if (deliveryFilter === 'pending') {
        list = list.filter(o => o.status === 'pending' || o.status === 'cancelled');
      } else {
        list = list.filter(o => o.status === deliveryFilter);
      }
    }

    if (user) {
      const currentEffectiveId = activeDelegateId || user.uid;
      list = list.filter(o => !(o.receiverId === currentEffectiveId && o.isForwarded === true && o.forwardedToId && o.forwardedToId !== currentEffectiveId));
    }

    if (orderSearchQuery.trim()) {
      const q = orderSearchQuery.toLowerCase().trim();
      list = list.filter(o => 
        (o.customerName || '').toLowerCase().includes(q) ||
        (o.customerPhone || '').includes(q) ||
        (o.productName || '').toLowerCase().includes(q) ||
        (o.id || '').toLowerCase().includes(q)
      );
    }

    return getUniqueOrders(list);
  };

  const filteredOrders = getFilteredOrders();
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const get24hCount = (type: string, id?: string) => {
    return allOrders.filter(o => {
      const orderDate = new Date(o.createdAt);
      if (orderDate < last24h) return false;
      
      if (type === 'sent') return o.senderId === user?.uid;
      if (type === 'received') return o.receiverId === user?.uid;
      if (type === 'website') return o.platform === 'website' && (!id || o.platformId === id || o.websiteId === id || o.pageId === id || o.siteId === id);
      if (type === 'landing_page') return o.platform === 'landing_page' && (!id || o.platformId === id || o.pageId === id);
      if (type === 'facebook') return o.platform === 'facebook' && (!id || o.platformId === id);
      if (type === 'whatsapp') return o.platform === 'whatsapp' && (!id || o.platformId === id);
      if (type === 'tiktok') return o.platform === 'tiktok' && (!id || o.platformId === id);
      if (type === 'viber') return o.platform === 'viber';
      if (type === 'telegram') return o.platform === 'telegram';
      if (type === 'line') return o.platform === 'line';
      if (type === 'wechat') return o.platform === 'wechat';
      return false;
    }).length;
  };

  const getCalculatedStats = () => {
    const totalSales = filteredOrders.reduce((acc, o) => acc + getOrderFinances(o).sellPriceTotal, 0);
    const totalProfit = filteredOrders.reduce((acc, o) => acc + getOrderFinances(o).profit, 0);
    const totalDeliveryCharge = filteredOrders.reduce((acc, o) => acc + (Number(o.deliveryCharge) || 0), 0);
    
    const pendingCount = filteredOrders.filter(o => o.status === 'pending').length;
    const deliveredCount = filteredOrders.filter(o => o.status === 'delivered' || o.status === 'paid' || o.status === 'paid_delivery').length;
    
    const paidDeliveryCount = filteredOrders.filter(o => o.status === 'paid_delivery').length;
    const paidDeliveryAmount = filteredOrders
      .filter(o => o.status === 'paid_delivery')
      .reduce((acc, o) => acc + getOrderFinances(o).sellPriceTotal, 0);
      
    const paidReturnCount = filteredOrders.filter(o => o.status === 'paid_return').length;
    const fraudReturnCount = filteredOrders.filter(o => o.status === 'fraud_return').length;
    const fraudReturnLoss = filteredOrders
      .filter(o => o.status === 'fraud_return')
      .reduce((acc, o) => acc + (o.deliveryCharge || 0), 0);
      
    const sellerCommission = filteredOrders
      .filter(o => o.receiverId === user?.uid)
      .reduce((acc, o) => {
        if (o.status === 'paid_delivery' || o.status === 'paid' || o.status === 'delivered') {
          const diff = getOrderFinances(o).profit;
          return acc + (diff > 0 ? diff : 0);
        } else if (o.status === 'paid_return') {
          return acc + 0;
        } else if (o.status === 'fraud_return') {
          return acc - (o.deliveryCharge || 0);
        }
        return acc;
      }, 0);

    const pendingBalance = filteredOrders
      .filter(o => ['pending', 'confirmed', 'shipping'].includes(o.status))
      .reduce((acc, o) => acc + getOrderFinances(o).profit, 0);

    const earnedProfit = filteredOrders
      .reduce((acc, o) => {
        const profit = getOrderFinances(o).profit;
        if (['paid', 'paid_delivery', 'delivered'].includes(o.status)) {
          return acc + profit;
        } else if (o.status === 'fraud_return') {
          return acc - (Number(o.deliveryCharge) || 0);
        }
        return acc;
      }, 0);

    return {
      totalSales,
      totalProfit,
      totalDeliveryCharge,
      pendingBalance,
      earnedProfit,
      pendingCount,
      deliveredCount,
      paidDeliveryCount,
      paidDeliveryAmount,
      paidReturnCount,
      fraudReturnCount,
      fraudReturnLoss,
      sellerCommission
    };
  };

  const stats = getCalculatedStats();

  const bestSelling = Object.values(
    filteredOrders.reduce((acc: any, curr) => {
      if (!acc[curr.productName]) {
        acc[curr.productName] = { name: curr.productName, count: 0, revenue: 0, image: curr.productImage };
      }
      acc[curr.productName].count += 1;
      acc[curr.productName].revenue += curr.sellPrice;
      return acc;
    }, {})
  ).sort((a: any, b: any) => b.count - a.count).slice(0, 5);

  return (
    <PageContainer title="ORDER MANAGEMENT">
      <div className="space-y-6 w-full">
        {/* Delegation Switcher header */}
        {delegations.length > 0 && (
           <div className="p-4 rounded-2xl bg-dragon-cyan/10 border border-dragon-cyan/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1">
              <div>
                 <span className="text-[10px] font-black text-dragon-cyan tracking-widest uppercase block leading-none">Delegated Order & Supply Management Mode</span>
                 <p className="text-[10px] text-white font-bold uppercase mt-1.5 flex items-center gap-1.5 leading-none">
                    {activeDelegateId ? (
                       <>
                          <span className="w-2 h-2 rounded-full bg-dragon-cyan animate-pulse inline-block" />
                          <span>You are active and managing the buyer orders & parcels of <span className="text-dragon-cyan font-black">{activeDelegate?.grantorName}</span></span>
                       </>
                    ) : (
                       <span>You are currently active in your own personal orders & customer dashboard</span>
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
                    <option value="">My Personal Dashboard (My Account)</option>
                    {delegations.map((d, idx) => (
                       <option key={`del-${d.id}-${idx}`} value={d.grantorId}>{d.grantorName}'s Order Panel</option>
                    ))}
                 </select>
              </div>
         </div>
        )}

        <div className="flex gap-6 relative">
        {/* Sidebar / Filter Menu */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div 
              key="sidebar-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSidebar(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
          )}
          {(showSidebar || isLargeScreen) && (
            <motion.div 
              key="sidebar-content"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className={cn(
                "w-72 shrink-0 bg-dragon-black/40 border-r border-white/5 h-[calc(100vh-160px)] sticky top-24 overflow-y-auto custom-scrollbar-ghost pr-2 z-[70] lg:z-0 lg:block",
                showSidebar ? "fixed inset-y-0 left-0 h-full p-6 pt-24 bg-dragon-black lg:static lg:h-[calc(100vh-160px)] lg:p-0" : "hidden"
              )}
            >
                <div className="flex items-center justify-between mb-8 px-2">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-dragon-cyan/20 text-dragon-cyan rounded-lg">
                         <MoreVertical size={18} />
                      </div>
                      <h3 className="text-xs font-black uppercase tracking-widest text-white">Advanced Filter</h3>
                   </div>
                   <button 
                     type="button" 
                     onClick={() => setShowSidebar(false)} 
                     className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                   >
                     <X size={18} />
                   </button>
                </div>

                <div className="space-y-6">
                  <MenuSection title="Internal Messaging">
                    <MenuItem 
                      active={filter.type === 'sent'} 
                      icon={<BrandSvgIcon platform="sent" variant="badge" badgeSizeClass="w-5 h-5 rounded-md" size={11} />} 
                      label="Send order" 
                      count={get24hCount('sent')}
                      onClick={() => { setFilter({ type: 'sent' }); setShowCharts(false); }} 
                    />
                    <MenuItem 
                      active={filter.type === 'received'} 
                      icon={<BrandSvgIcon platform="received" variant="badge" badgeSizeClass="w-5 h-5 rounded-md" size={11} />} 
                      label="Received order" 
                      count={get24hCount('received')}
                      onClick={() => { setFilter({ type: 'received' }); setShowCharts(false); }} 
                    />
                  </MenuSection>

                  <MenuSection title="General">
                    <MenuItem 
                      active={filter.type === 'all'} 
                      icon={<BrandSvgIcon platform="all" variant="badge" badgeSizeClass="w-5 h-5 rounded-md" size={11} />} 
                      label="1. All order" 
                      onClick={() => { setFilter({ type: 'all' }); setShowCharts(false); }} 
                    />
                    <ExpandablePlatformMenuItem 
                      label="2. My Website Orders" 
                      icon={<BrandSvgIcon platform="website" variant="badge" badgeSizeClass="w-5 h-5 rounded-md" size={11} />} 
                      platformType="website"
                      items={proWebsites}
                      getItemName={(site: any) => site.websiteName || site.siteTitle || site.storeName || site.title || site.slug || site.id}
                      activeFilter={filter}
                      totalCount={get24hCount('website')}
                      onCountRequest={(id: string) => get24hCount('website', id)}
                      onSelect={(id: any) => { setFilter({ type: 'website', id }); setShowCharts(false); }}
                    />
                    <ExpandablePlatformMenuItem 
                      label="3. My Landing Page Order" 
                      icon={<BrandSvgIcon platform="landing_page" variant="badge" badgeSizeClass="w-5 h-5 rounded-md" size={11} />} 
                      platformType="landing_page"
                      items={landingPages}
                      getItemName={(page: any) => page.storeName || page.productDetails?.title || page.id}
                      activeFilter={filter}
                      totalCount={get24hCount('landing_page')}
                      onCountRequest={(id: string) => get24hCount('landing_page', id)}
                      onSelect={(id: any) => { setFilter({ type: 'landing_page', id }); setShowCharts(false); }}
                    />
                  </MenuSection>

                  <MenuSection title="Social Platforms">
                    <ExpandablePlatformMenuItem 
                      platformType="facebook"
                      label="4. Facebook Messenger"
                      icon={<BrandSvgIcon platform="facebook" variant="badge" badgeSizeClass="w-5 h-5 rounded-md" size={11} />}
                      items={configs.filter(c => c.platform === 'facebook' || c.platform === 'instagram')}
                      getItemName={(config: any) => config.pageName || config.accountName || config.id}
                      activeFilter={filter}
                      totalCount={get24hCount('facebook')}
                      onCountRequest={(id: string) => get24hCount('facebook', id)}
                      onSelect={(id: any) => { setFilter({ type: 'facebook', id }); setShowCharts(false); }}
                    />
                    <ExpandablePlatformMenuItem 
                      platformType="whatsapp"
                      label="5. WhatsApp Business"
                      icon={<BrandSvgIcon platform="whatsapp" variant="badge" badgeSizeClass="w-5 h-5 rounded-md" size={11} />}
                      items={configs.filter(c => c.platform === 'whatsapp')}
                      getItemName={(config: any) => config.pageName || config.accountName || config.id}
                      activeFilter={filter}
                      totalCount={get24hCount('whatsapp')}
                      onCountRequest={(id: string) => get24hCount('whatsapp', id)}
                      onSelect={(id: any) => { setFilter({ type: 'whatsapp', id }); setShowCharts(false); }}
                    />
                    <ExpandablePlatformMenuItem 
                      platformType="tiktok"
                      label="6. TikTok Shop/API"
                      icon={<BrandSvgIcon platform="tiktok" variant="badge" badgeSizeClass="w-5 h-5 rounded-md" size={11} />}
                      items={configs.filter(c => c.platform === 'tiktok')}
                      getItemName={(config: any) => config.pageName || config.accountName || config.id}
                      activeFilter={filter}
                      totalCount={get24hCount('tiktok')}
                      onCountRequest={(id: string) => get24hCount('tiktok', id)}
                      onSelect={(id: any) => { setFilter({ type: 'tiktok', id }); setShowCharts(false); }}
                    />
                    <MenuItem 
                      active={filter.type === 'viber'} 
                      icon={<BrandSvgIcon platform="viber" variant="badge" badgeSizeClass="w-5 h-5 rounded-md" size={11} />} 
                      label="7. Viber order" 
                      count={get24hCount('viber')}
                      onClick={() => { setFilter({ type: 'viber' }); setShowCharts(false); }} 
                    />
                    <MenuItem 
                      active={filter.type === 'telegram'} 
                      icon={<BrandSvgIcon platform="telegram" variant="badge" badgeSizeClass="w-5 h-5 rounded-md" size={11} />} 
                      label="8. Telegram order" 
                      count={get24hCount('telegram')}
                      onClick={() => { setFilter({ type: 'telegram' }); setShowCharts(false); }} 
                    />
                    <MenuItem 
                      active={filter.type === 'line'} 
                      icon={<BrandSvgIcon platform="line" variant="badge" badgeSizeClass="w-5 h-5 rounded-md" size={11} />} 
                      label="9. Line order" 
                      count={get24hCount('line')}
                      onClick={() => { setFilter({ type: 'line' }); setShowCharts(false); }} 
                    />
                    <MenuItem 
                      active={filter.type === 'wechat'} 
                      icon={<BrandSvgIcon platform="wechat" variant="badge" badgeSizeClass="w-5 h-5 rounded-md" size={11} />} 
                      label="10. We Chat Mini" 
                      count={get24hCount('wechat')}
                      onClick={() => { setFilter({ type: 'wechat' }); setShowCharts(false); }} 
                    />
                  </MenuSection>

                  <MenuSection title="Settings & Tools">
                    <MenuItem 
                      active={viewMode === 'fraud_detection'} 
                      icon={<BrandSvgIcon platform="fraud" variant="badge" badgeSizeClass="w-5 h-5 rounded-md" size={11} />} 
                      label="Fraud Detection" 
                      onClick={() => { setViewMode('fraud_detection'); setFilter({ type: 'all' }); }} 
                    />
                    <MenuItem 
                      active={viewMode === 'logistics'} 
                      icon={<BrandSvgIcon platform="courier" variant="badge" badgeSizeClass="w-5 h-5 rounded-md" size={11} />} 
                      label="Courier Setup" 
                      onClick={() => { setViewMode('logistics'); setFilter({ type: 'all' }); }} 
                    />
                    <MenuItem 
                      active={viewMode === 'detailed_reports'} 
                      icon={<BrandSvgIcon platform="detailed_reports" variant="badge" badgeSizeClass="w-5 h-5 rounded-md" size={11} />} 
                      label="Detailed Reports" 
                      onClick={() => { setViewMode('detailed_reports'); setFilter({ type: 'all' }); }} 
                    />
                  </MenuSection>
                </div>
              </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 space-y-8 min-w-0 pt-2">
          <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5 mb-8">
            <div className="flex items-center gap-4">
              <button 
                type="button"
                onClick={() => setShowSidebar(true)}
                className="p-2.5 bg-dragon-cyan/10 text-dragon-cyan border border-dragon-cyan/20 rounded-xl hover:bg-dragon-cyan hover:text-dragon-black transition-all cursor-pointer"
              >
                <Menu size={20} />
              </button>

              <div>
                 <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                   {viewMode === 'orders' ? `${filter.type.replace('_', ' ')} Orders` : viewMode === 'logistics' ? 'Global Logistics' : viewMode === 'fraud_detection' ? 'Fraud Management' : 'DOELpro Business Intel'}
                 </p>
                 <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">
                   {viewMode === 'orders' ? `${filteredOrders.length} records found` : 'Premium Integration Hub'}
                 </p>
              </div>
            </div>
            {viewMode !== 'orders' && (
               <button 
                 type="button"
                 onClick={() => setViewMode('orders')}
                 className="px-4 py-2 bg-dragon-cyan text-dragon-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all cursor-pointer"
               >
                 Back to Orders
               </button>
            )}
          </div>

        {viewMode === 'orders' ? (
          <>
            {/* Rapid Stats Display */}
            <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-4 gap-2 sm:gap-3">
               <StatBox 
                  icon={<TrendingUp className="text-dragon-cyan" />} 
                  label="Total Paid Delivery" 
                  value={`${currencySymbol}${stats.paidDeliveryAmount.toLocaleString()}`} 
                  countLabel={`${stats.paidDeliveryCount} successful deliveries`}
               />
               <StatBox 
                  icon={<Check className="text-blue-400" />} 
                  label="Paid Return" 
                  value={`${currencySymbol}0`} 
                  countLabel={`${stats.paidReturnCount} returns paid`}
               />
               <StatBox 
                  icon={<AlertTriangle className="text-rose-500" />} 
                  label="Fraud Return Loss" 
                  value={`-${currencySymbol}${stats.fraudReturnLoss.toLocaleString()}`} 
                  countLabel={`${stats.fraudReturnCount} customer losses`}
               />
               <StatBox 
                  icon={<Zap className="text-purple-400 animate-pulse" />} 
                  label="Supplier Commission Payment" 
                  value={`${currencySymbol}${stats.sellerCommission.toLocaleString()}`} 
                  countLabel="Inbox Payment"
               />
               <StatBox 
                  icon={<Package className="text-dragon-emerald" />} 
                  label="Total Sales" 
                  value={`${currencySymbol}${stats.totalSales.toLocaleString()}`} 
                  countLabel={`${filteredOrders.length} order records`}
               />
               <StatBox 
                  icon={<TrendingUp className="text-amber-400 animate-pulse" />} 
                  label="Pending Profit" 
                  value={`${currencySymbol}${stats.pendingBalance.toLocaleString()}`} 
                  countLabel="Awaiting delivery (Pending/Confirmed)"
               />
               <StatBox 
                  icon={<TrendingDown className="text-dragon-emerald font-black" />} 
                  label="Earned Net Profit" 
                  value={`${currencySymbol}${stats.earnedProfit.toLocaleString()}`} 
                  countLabel="Delivery Paid Net Profit"
               />
               <StatBox 
                  icon={<Truck className="text-amber-500 animate-pulse" />} 
                  label="Total Delivery Charge" 
                  value={`${currencySymbol}${stats.totalDeliveryCharge.toLocaleString()}`} 
                  countLabel="Total delivery fee of all orders"
               />
            </div>

            {/* Analytics Charts / Order List */}
            <AnimatePresence mode="wait">
              {showCharts ? (
                <motion.div 
                   key="charts"
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -20 }}
                   className="grid grid-cols-1 max-w-xl mx-auto gap-6 overflow-hidden w-full"
                >
                  <div className="glass-card p-6 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <BarChart3 size={16} className="text-dragon-cyan" /> Profit Efficiency
                      </h3>
                      <p className="text-3xl font-display font-black text-white">
                        {stats.totalSales > 0 ? ((stats.totalProfit / stats.totalSales) * 100).toFixed(1) : 0}%
                      </p>
                      <p className="text-[11px] text-gray-500 mt-2 font-light leading-relaxed">
                        Margin across all orders. Tracking sources helps optimize your spends.
                      </p>
                    </div>
                    
                    <div className="mt-6 space-y-4">
                       <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Best Selling</h4>
                       {bestSelling.map((p: any, i) => (
                          <div key={i} className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 overflow-hidden">
                                {p.image ? <img src={p.image} className="w-full h-full object-cover" /> : <Package className="p-2" />}
                             </div>
                             <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold truncate uppercase">{p.name}</p>
                                <p className="text-[9px] text-gray-500">{p.count} units sold</p>
                             </div>
                             <p className="text-xs font-bold text-white">৳{p.revenue}</p>
                          </div>
                       ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                   key="orders"
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -20 }}
                   className="space-y-4 font-sans">
                   {/* Search & Delivery Status Multi-Filter Bar */}
                   <div className="flex flex-col sm:flex-row justify-between items-center bg-white/80 dark:bg-[#09090d]/85 p-4 rounded-2xl border border-slate-200 dark:border-white/5 gap-3 shadow-sm">
                     <div className="relative w-full sm:max-w-xs">
                       <input 
                         type="text"
                         placeholder="Search orders (name, phone, ID)..."
                         value={orderSearchQuery}
                         onChange={(e) => setOrderSearchQuery(e.target.value)}
                         className="w-full bg-slate-50 dark:bg-[#030305]/95 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-3 pl-9 outline-none focus:border-cyan-500 dark:focus:border-dragon-cyan/50 text-[11px] font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500"
                       />
                       <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" />
                       {orderSearchQuery && (
                         <button type="button" onClick={() => setOrderSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer">
                           <X size={12} />
                         </button>
                       )}
                     </div>

                     <div className="relative w-full sm:w-auto flex justify-end">
                       <button
                         type="button"
                         onClick={() => setShowDeliveryMenu(!showDeliveryMenu)}
                         className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-black text-slate-900 dark:text-white hover:text-cyan-700 dark:hover:text-dragon-cyan transition-all focus:border-cyan-500 dark:focus:border-dragon-cyan select-none cursor-pointer"
                       >
                         <MoreVertical size={14} className="text-cyan-600 dark:text-dragon-cyan shrink-0" />
                         <span>Courier Note Filter: {deliveryFilter === 'all' ? 'All Orders' : (STATUS_LABELS[deliveryFilter] || deliveryFilter)}</span>
                         <ChevronDown size={12} className={cn("text-slate-400 dark:text-gray-500 transition-transform duration-300", showDeliveryMenu && "rotate-180")} />
                       </button>

                       <AnimatePresence>
                         {showDeliveryMenu && (
                           <>
                             <div className="fixed inset-0 z-40" onClick={() => setShowDeliveryMenu(false)} />
                             <motion.div 
                               initial={{ opacity: 0, y: 10, scale: 0.95 }}
                               animate={{ opacity: 1, y: 0, scale: 1 }}
                               exit={{ opacity: 0, y: 10, scale: 0.95 }}
                               transition={{ duration: 0.15 }}
                               className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#07070a] border border-slate-200 dark:border-white/10 rounded-xl p-2 shadow-2xl z-50 space-y-0.5"
                             >
                               <div className="px-2.5 py-1.5 text-[9px] font-black uppercase text-slate-400 dark:text-gray-500 tracking-wider border-b border-slate-100 dark:border-white/5">Filter by Courier Note</div>
                               
                               <button
                                 type="button"
                                 onClick={() => { setDeliveryFilter('all'); setShowDeliveryMenu(false); }}
                                 className={cn(
                                   "w-full text-left px-2.5 py-2 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center justify-between cursor-pointer",
                                   deliveryFilter === 'all' ? "text-cyan-700 dark:text-dragon-cyan bg-cyan-50 dark:bg-dragon-cyan/10" : "text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
                                 )}
                               >
                                 <span>All Courier Notes</span>
                                 {deliveryFilter === 'all' && <Check size={12} />}
                               </button>

                               {Object.keys(STATUS_LABELS).map((statusKey) => (
                                 <button
                                   key={statusKey}
                                   type="button"
                                   onClick={() => { setDeliveryFilter(statusKey); setShowDeliveryMenu(false); }}
                                   className={cn(
                                     "w-full text-left px-2.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all flex items-center justify-between cursor-pointer",
                                     deliveryFilter === statusKey ? "text-cyan-700 dark:text-dragon-cyan bg-cyan-50 dark:bg-dragon-cyan/10" : "text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
                                   )}
                                 >
                                   <span>{STATUS_LABELS[statusKey]}</span>
                                   {deliveryFilter === statusKey && <Check size={12} />}
                                 </button>
                               ))}
                             </motion.div>
                           </>
                         )}
                       </AnimatePresence>
                     </div>
                   </div>

                    {/* Horizontal Order Status Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-white/10 scrollbar-track-transparent">
                       {[
                         { key: 'all', label: 'All Orders', icon: LayoutGrid, count: allOrders.length, color: 'text-slate-600 dark:text-gray-400 bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/30' },
                         { key: 'pending', label: 'Pending / Cancel', icon: Clock, count: allOrders.filter(o => o.status === 'pending' || o.status === 'cancelled').length, color: 'text-amber-700 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 hover:border-amber-300 dark:hover:border-amber-500/40' },
                         { key: 'confirmed', label: 'Confirmed', icon: Check, count: allOrders.filter(o => o.status === 'confirmed').length, color: 'text-cyan-700 dark:text-dragon-cyan bg-cyan-50 dark:bg-dragon-cyan/10 border-cyan-200 dark:border-dragon-cyan/20 hover:border-cyan-300 dark:hover:border-dragon-cyan/40' },
                         { key: 'shipping', label: 'Shipping', icon: Truck, count: allOrders.filter(o => o.status === 'shipping').length, color: 'text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20 hover:border-sky-300 dark:hover:border-sky-500/40' },
                         { key: 'paid_delivery', label: 'Paid Delivery', icon: Check, count: allOrders.filter(o => o.status === 'paid_delivery').length, color: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 hover:border-emerald-300 dark:hover:border-emerald-500/40' },
                         { key: 'paid_return', label: 'Paid Return', icon: RotateCcw, count: allOrders.filter(o => o.status === 'paid_return').length, color: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 hover:border-blue-300 dark:hover:border-blue-500/40' },
                         { key: 'fraud_return', label: 'Fraud', icon: ShieldAlert, count: allOrders.filter(o => o.status === 'fraud_return').length, color: 'text-rose-700 dark:text-rose-500 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 hover:border-rose-300 dark:hover:border-rose-500/40' },
                       ].map((tab) => {
                         const IconComp = tab.icon;
                         const isActive = deliveryFilter === tab.key;
                         return (
                           <button
                             type="button"
                             key={tab.key}
                             onClick={() => setDeliveryFilter(tab.key)}
                             className={cn(
                               "px-3 py-2 rounded-xl border text-[10px] sm:text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition-all cursor-pointer active:scale-95",
                               isActive 
                                 ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-black dark:border-white shadow-md" 
                                 : tab.color
                             )}
                           >
                             <IconComp size={12} className={isActive ? "text-white dark:text-black" : ""} />
                             <span className="text-[9px] sm:text-[10px]">{tab.label}</span>
                             <span className={cn(
                               "ml-1.5 px-1.5 py-0.5 text-[8.5px] font-mono font-black rounded-md",
                               isActive ? "bg-white/20 dark:bg-black/20 text-white dark:text-black" : "bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-white"
                             )}>
                               {tab.count}
                             </span>
                           </button>
                         );
                       })}
                    </div>

                   {loading ? (
                     <div className="py-20 flex justify-center"><div className="w-8 h-8 border-2 border-dragon-cyan border-t-transparent rounded-full animate-spin"></div></div>
                   ) : filteredOrders.length === 0 ? (
                     <div className="py-12 text-center text-gray-600 font-light italic">No orders found for this filter.</div>
                   ) : (
                      <div className="space-y-4 font-sans">
                         {/* Select All Toolbar */}
                         <div className="flex items-center justify-between pb-1 px-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (selectedOrderIds.length === filteredOrders.length) {
                                  setSelectedOrderIds([]);
                                } else {
                                  setSelectedOrderIds(filteredOrders.map(o => o.id));
                                }
                              }}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-gray-200 font-black text-[11px] uppercase tracking-wider transition-all cursor-pointer active:scale-95"
                            >
                              <div className={cn(
                                "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                                selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0
                                  ? "bg-emerald-500 border-emerald-400 text-white shadow-sm"
                                  : "border-slate-400 dark:border-white/30 bg-transparent text-transparent"
                              )}>
                                <Check size={13} strokeWidth={3.5} />
                              </div>
                              <span>
                                {selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0
                                  ? "Deselect All"
                                  : `Select All (${filteredOrders.length})`}
                              </span>
                            </button>
                            <span className="text-[10px] text-slate-500 dark:text-gray-400 font-bold uppercase tracking-wider font-mono">
                              Total: {filteredOrders.length} Orders
                            </span>
                         </div>

                         {/* Floating bar for selection */}
                         {selectedOrderIds.length > 0 && (
                           <motion.div 
                             initial={{ opacity: 0, y: -20 }}
                             animate={{ opacity: 1, y: 0 }}
                             className="p-4 border border-cyan-200 dark:border-dragon-cyan/30 bg-cyan-50/90 dark:bg-dragon-cyan/10 backdrop-blur-md flex flex-col sm:flex-row justify-between items-center gap-4 rounded-2xl shadow-sm dark:shadow-lg dark:shadow-dragon-cyan/10 mb-4"
                           >
                              <div className="flex items-center gap-3 w-full sm:w-auto">
                                 <div className="w-8 h-8 rounded-full bg-cyan-500/20 dark:bg-dragon-cyan/20 flex items-center justify-center text-cyan-700 dark:text-dragon-cyan shrink-0">
                                    <CheckSquare size={16} />
                                 </div>
                                 <div className="text-left font-sans">
                                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none">
                                       {selectedOrderIds.length} orders selected
                                    </h4>
                                    <p className="text-[9px] text-slate-600 dark:text-gray-400 uppercase tracking-widest mt-1 font-mono">Smart Forward System</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-2 w-full sm:w-auto">
                                  <button 
                                     type="button"
                                     onClick={() => {
                                        setBulkBookingCourier(null);
                                        setBulkBookingResults(null);
                                        setIsBulkCourierModalOpen(true);
                                     }}
                                     style={{ backgroundColor: '#5b0ee9', color: '#ffffff' }}
                                     className="courier-booking-btn flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer mr-2"
                                  >
                                     <Truck size={14} style={{ color: '#ffffff' }} />
                                     <span className="text-white font-black" style={{ color: '#ffffff' }}>Courier Booking</span>
                                  </button>
                                 <button 
                                    type="button"
                                    onClick={handleOpenForwardModal}
                                    style={{ backgroundColor: '#2e8a4f', color: '#ffffff' }}
                                    className="forward-action-btn flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                                 >
                                    <Forward size={14} style={{ color: '#ffffff' }} />
                                    <span className="text-white font-black" style={{ color: '#ffffff' }}>Forward</span>
                                 </button>
                                 <button 
                                    type="button"
                                    onClick={() => setSelectedOrderIds([])}
                                    className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-300 dark:border-white/10 text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-[0.98] transition-all cursor-pointer"
                                 >
                                    Clear Selection
                                 </button>
                              </div>
                           </motion.div>
                         )}

                         {filteredOrders.map((order, idx) => (
                           <OrderRow 
                             key={`order-${order.id || ''}-${idx}`} 
                             order={order} 
                             type={order.senderId === user?.uid ? 'sent' : 'received'} 
                             selected={selectedOrderIds.includes(order.id)} 
                             onToggleSelect={() => setSelectedOrderIds(prev => prev.includes(order.id) ? prev.filter(id => id !== order.id) : [...prev, order.id])} 
                             configuredCouriers={configuredCouriers} 
                             onNavigateToLogistics={() => setViewMode('logistics')} 
                           />
                         ))}
                      </div>
                    )}
                    </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : viewMode === 'logistics' ? (
          <GlobalLogisticsTab
            selectedCountry={selectedCountry}
            fetchCouriers={fetchCouriers}
            courierLoading={courierLoading}
            couriers={couriers}
            editingCourier={editingCourier}
            setEditingCourier={setEditingCourier}
            courierCredentials={courierCredentials}
            setCourierCredentials={setCourierCredentials}
            handleSaveCourierConfig={handleSaveCourierConfig}
          />
        ) : viewMode === 'fraud_detection' ? (
          <FraudManagementTab
            db={db}
            userId={user?.uid}
            blacklistedItems={blacklistedItems}
            blacklistedLoading={blacklistedLoading}
          />
        ) : (
          <DetailedPerformanceTab
            allOrders={allOrders}
            currencySymbol={currencySymbol}
          />
        )}
      </div>
    </div>

    {/* Smart Forwarding modal */}
    <SmartForwardModal
      isOpen={showForwardModal}
      onClose={() => setShowForwardModal(false)}
      selectedOrderIds={selectedOrderIds}
      forwardConfirmUser={forwardConfirmUser}
      setForwardConfirmUser={setForwardConfirmUser}
      handleForwardOrders={handleForwardOrders}
      searchUserQuery={searchUserQuery}
      setSearchUserQuery={setSearchUserQuery}
      usersLoading={usersLoading}
      usersList={usersList}
    />

    {/* Bulk Courier Booking modal */}
    <BulkCourierBookingModal
      isOpen={isBulkCourierModalOpen}
      onClose={() => {
        setIsBulkCourierModalOpen(false);
        setSelectedOrderIds([]);
      }}
      selectedOrderIds={selectedOrderIds}
      bulkBookingResults={bulkBookingResults}
      bulkBookingCourier={bulkBookingCourier}
      setBulkBookingCourier={setBulkBookingCourier}
      isBulkBookingInProgress={isBulkBookingInProgress}
      handleBulkCourierBooking={handleBulkCourierBooking}
      configuredCouriers={configuredCouriers}
      selectedCountry={selectedCountry}
      onReset={() => {
        setIsBulkCourierModalOpen(false);
        setSelectedOrderIds([]);
        setBulkBookingResults(null);
      }}
    />
    </div>
    </PageContainer>
  );
}
