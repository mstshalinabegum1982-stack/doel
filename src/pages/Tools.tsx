import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../authContext";
import { checkIsAdmin } from "../lib/adminConfig";
import { PageContainer } from "../components/Navigation";
import { useNavigate } from "react-router-dom";
import { db, auth, handleFirestoreError, OperationType } from "../lib/firebase";
import {
  doc,
  updateDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  onSnapshot,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  Save,
  LogOut,
} from "lucide-react";
import { cn } from "../lib/utils";
import { motion } from "framer-motion";
import {
  ProfileHeader,
  ThemeConfigCard,
  NotificationConfigCard,
  DelegationPanel,
  BillingModal,
} from "../components/tools";

const compressImage = (file: File, maxWidth = 400, maxHeight = 400, quality = 0.7): Promise<string> => {
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

export default function Tools() {
  const { user, profile } = useContext(AuthContext);
  const navigate = useNavigate();

  const isAdmin = checkIsAdmin(user, profile);

  const [formData, setFormData] = useState({
    name: "",
    facebook: "",
    tiktok: "",
    whatsapp: "",
    website: "",
    profileImage: "",
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadedUid, setLoadedUid] = useState<string | null>(null);

  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
  });

  const toggleTheme = (theme: 'light' | 'dark') => {
    setCurrentTheme(theme);
    localStorage.setItem('theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  };

  const [notifCall, setNotifCall] = useState(() => {
    return localStorage.getItem('notification_call') !== 'false';
  });
  const [notifOrder, setNotifOrder] = useState(() => {
    return localStorage.getItem('notification_order') !== 'false';
  });
  const [notifMessage, setNotifMessage] = useState(() => {
    return localStorage.getItem('notification_message') !== 'false';
  });

  const handleToggleNotif = (type: 'call' | 'order' | 'message', val: boolean) => {
    if (type === 'call') {
      setNotifCall(val);
      localStorage.setItem('notification_call', String(val));
    } else if (type === 'order') {
      setNotifOrder(val);
      localStorage.setItem('notification_order', String(val));
    } else if (type === 'message') {
      setNotifMessage(val);
      localStorage.setItem('notification_message', String(val));
    }
    window.dispatchEvent(new Event('notification_settings_changed'));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const compressed = await compressImage(file);
      if (compressed) {
        setFormData(prev => ({ ...prev, profileImage: compressed }));
        if (profile?.uid) {
          try {
            await updateDoc(doc(db, "users", profile.uid), {
              profileImage: compressed,
              updatedAt: new Date().toISOString()
            });
          } catch (dbErr) {
            console.error("Auto-saving profileImage to Firestore failed:", dbErr);
          }
        }
      }
    } catch (err) {
      console.error("Profile image upload failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile && loadedUid !== profile.uid) {
      setFormData({
        name: profile.name || "",
        facebook: profile.socialLinks?.facebook || "",
        tiktok: profile.socialLinks?.tiktok || "",
        whatsapp: profile.socialLinks?.whatsapp || "",
        website: profile.socialLinks?.website || "",
        profileImage: profile.profileImage || "",
      });
      setLoadedUid(profile.uid);
    }
  }, [profile, loadedUid]);

  // --- DELEGATION & COLLABORATIVE ACCESS STATE ---
  const [showDelegationPanel, setShowDelegationPanel] = useState(false);
  const [connections, setConnections] = useState<any[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [myDelegates, setMyDelegates] = useState<any[]>([]);
  const [receivedDelegations, setReceivedDelegations] = useState<any[]>([]);
  const [editingGranteeId, setEditingGranteeId] = useState<string | null>(null);
  const [delegationLoading, setDelegationLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [delegationSuccessMsg, setDelegationSuccessMsg] = useState<string | null>(null);
  const [activeDelegateId, setActiveDelegateId] = useState<string>(() => {
    return localStorage.getItem('active_delegate_user_id') || '';
  });

  const handleSwitchActiveAccount = (targetId: string) => {
    if (targetId) {
      localStorage.setItem('active_delegate_user_id', targetId);
      setActiveDelegateId(targetId);
      setDelegationSuccessMsg("Switched active panel view!");
    } else {
      localStorage.removeItem('active_delegate_user_id');
      setActiveDelegateId('');
      setDelegationSuccessMsg("Switched back to your personal panel!");
    }
    setTimeout(() => setDelegationSuccessMsg(null), 3500);
    window.dispatchEvent(new Event('storage'));
  };

  // --- BILLING & SAAS SUBSCRIPTION STATE ---
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [editPerms, setEditPerms] = useState({
    allowInventory: false,
    allowLandingPages: false,
    allowOrders: false,
    allowSiteMessenger: false,
  });

  // Load Chats and Profiles for Delegation setup
  useEffect(() => {
    if (!profile) return;
    setLoadingConnections(true);

    const followingQ = query(
      collection(db, "social_relationships"),
      where("followerId", "==", profile.uid)
    );

    const followersQ = query(
      collection(db, "social_relationships"),
      where("followingId", "==", profile.uid)
    );

    let isSubscribed = true;
    const fetchConnections = async () => {
      try {
        const [followingSnap, followersSnap] = await Promise.all([
          getDocs(followingQ),
          getDocs(followersQ)
        ]);

        if (!isSubscribed) return;

        const followingUids = new Set<string>();
        followingSnap.docs.forEach(docSnap => {
          const data = docSnap.data();
          if (data.followingId) followingUids.add(data.followingId);
        });

        const mutualUids: string[] = [];
        followersSnap.docs.forEach(docSnap => {
          const data = docSnap.data();
          if (data.followerId && followingUids.has(data.followerId)) {
            mutualUids.push(data.followerId);
          }
        });

        const list: any[] = [];
        for (const otherId of mutualUids) {
          try {
            const uDoc = await getDoc(doc(db, "users", otherId));
            if (uDoc.exists() && isSubscribed) {
              list.push({ uid: uDoc.id, ...uDoc.data() });
            }
          } catch (err) {
            console.warn("Failed to get delegated connection profile:", err);
          }
        }

        if (isSubscribed) {
          setConnections(list);
          setLoadingConnections(false);
        }
      } catch (err) {
        console.error("Failed to parse delegation connections:", err);
        if (isSubscribed) setLoadingConnections(false);
      }
    };

    fetchConnections();

    const enrichList = async (items: any[], idField: 'grantorId' | 'granteeId') => {
      const results = await Promise.all(
        items.map(async (item) => {
          const targetUid = item[idField];
          if (!targetUid) return item;
          try {
            const uDoc = await getDoc(doc(db, "users", targetUid));
            if (uDoc.exists()) {
              const uData = uDoc.data();
              return {
                ...item,
                userProfile: {
                  uid: uDoc.id,
                  name: uData.name || uData.displayName || '',
                  storeName: uData.storeName || uData.businessName || '',
                  phone: uData.phone || '',
                  email: uData.email || '',
                  profileImage: uData.profileImage || '',
                }
              };
            }
          } catch (err) {
            console.warn("Failed to fetch profile for delegation enrichment:", err);
          }
          return item;
        })
      );
      return results;
    };

    // Query delegations we gave to others
    const myDelQ = query(
      collection(db, "delegated_access"),
      where("grantorId", "==", profile.uid),
    );
    const unsubMyDel = onSnapshot(
      myDelQ,
      async (snap) => {
        const raw = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const enriched = await enrichList(raw, "granteeId");
        if (isSubscribed) setMyDelegates(enriched);
      },
      (error) => {
        handleFirestoreError(
          error,
          OperationType.LIST,
          "delegated_access/sent",
        );
      },
    );

    // Query delegations we received from others
    const recDelQ = query(
      collection(db, "delegated_access"),
      where("granteeId", "==", profile.uid),
    );
    const unsubRecDel = onSnapshot(
      recDelQ,
      async (snap) => {
        const raw = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const enriched = await enrichList(raw, "grantorId");
        if (isSubscribed) setReceivedDelegations(enriched);
      },
      (error) => {
        handleFirestoreError(
          error,
          OperationType.LIST,
          "delegated_access/received",
        );
      },
    );

    return () => {
      isSubscribed = false;
      unsubMyDel();
      unsubRecDel();
    };
  }, [profile]);

  const handleSaveDelegation = async (
    granteeId: string,
    granteeName: string,
  ) => {
    if (!profile) return;
    setDelegationLoading(true);
    const docId = `${profile.uid}_${granteeId}`;
    const existingDeleg = myDelegates.find((d) => d.granteeId === granteeId);
    const status = existingDeleg?.status || "pending";

    try {
      await setDoc(doc(db, "delegated_access", docId), {
        grantorId: profile.uid,
        grantorName: profile.name || "Owner",
        granteeId,
        granteeName,
        allowInventory: editPerms.allowInventory,
        allowLandingPages: editPerms.allowLandingPages,
        allowOrders: editPerms.allowOrders,
        allowSiteMessenger: editPerms.allowSiteMessenger,
        status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setDelegationSuccessMsg("Panel access settings updated successfully.");
      setTimeout(() => setDelegationSuccessMsg(null), 4500);
      setEditingGranteeId(null);
    } catch (e: any) {
      console.error(e);
      alert(
        "Failed to setup access: " +
          (e.message || "Unknown Firestore Permission"),
      );
    } finally {
      setDelegationLoading(false);
    }
  };

  const handleAcceptDelegation = async (delegId: string) => {
    if (!profile) return;
    setDelegationLoading(true);
    try {
      await updateDoc(doc(db, "delegated_access", delegId), {
        status: "accepted",
        updatedAt: new Date().toISOString(),
      });
      setDelegationSuccessMsg("Delegated access accepted successfully!");
      setTimeout(() => setDelegationSuccessMsg(null), 4500);
    } catch (err: any) {
      console.error(err);
      alert("Error occurred: " + (err.message || "Error"));
    } finally {
      setDelegationLoading(false);
    }
  };

  const handleRejectDelegation = async (delegId: string) => {
    if (!profile) return;
    setDelegationLoading(true);
    try {
      await deleteDoc(doc(db, "delegated_access", delegId));
      setDelegationSuccessMsg("Delegated access canceled/rejected.");
      setTimeout(() => setDelegationSuccessMsg(null), 4500);
    } catch (err: any) {
      console.error(err);
      alert("Error occurred: " + (err.message || "Error"));
    } finally {
      setDelegationLoading(false);
    }
  };

  const handleRemoveDelegation = async (granteeId: string, customDocId?: string) => {
    if (!profile) return;
    setDelegationLoading(true);
    const docId = customDocId || `${profile.uid}_${granteeId}`;
    try {
      await deleteDoc(doc(db, "delegated_access", docId));
      setDelegationSuccessMsg("Access successfully revoked.");
      setTimeout(() => setDelegationSuccessMsg(null), 4500);
      setConfirmDeleteId(null);
      setEditingGranteeId(null);
    } catch (e: any) {
      console.error(e);
      alert("Failed to revoke access: " + (e.message || "Error"));
    } finally {
      setDelegationLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", profile.uid), {
        name: formData.name,
        profileImage: formData.profileImage,
        socialLinks: {
          facebook: formData.facebook,
          tiktok: formData.tiktok,
          whatsapp: formData.whatsapp,
          website: formData.website,
        },
        updatedAt: new Date().toISOString(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${profile.uid}`);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    auth.signOut();
  };

  return (
    <PageContainer title="SETTINGS">
      <div className="space-y-8">
        {/* Profile Header */}
        <ProfileHeader
          name={formData.name}
          email={profile?.email}
          profileImage={formData.profileImage}
          loading={loading}
          onImageUpload={handleImageUpload}
        />

        {/* Theme Mode Config */}
        <ThemeConfigCard
          currentTheme={currentTheme}
          onToggleTheme={toggleTheme}
        />

        {/* Notification Settings Config */}
        <NotificationConfigCard
          notifCall={notifCall}
          notifOrder={notifOrder}
          notifMessage={notifMessage}
          onToggleNotif={handleToggleNotif}
        />

        {/* Panel Delegation system */}
        <DelegationPanel
          showDelegationPanel={showDelegationPanel}
          setShowDelegationPanel={setShowDelegationPanel}
          receivedDelegations={receivedDelegations}
          myDelegates={myDelegates}
          connections={connections}
          loadingConnections={loadingConnections}
          delegationLoading={delegationLoading}
          delegationSuccessMsg={delegationSuccessMsg}
          activeDelegateId={activeDelegateId}
          editingGranteeId={editingGranteeId}
          setEditingGranteeId={setEditingGranteeId}
          editPerms={editPerms}
          setEditPerms={setEditPerms}
          confirmDeleteId={confirmDeleteId}
          setConfirmDeleteId={setConfirmDeleteId}
          onSwitchActiveAccount={handleSwitchActiveAccount}
          onAcceptDelegation={handleAcceptDelegation}
          onRejectDelegation={handleRejectDelegation}
          onSaveDelegation={handleSaveDelegation}
          onRemoveDelegation={handleRemoveDelegation}
        />

        {/* Actions */}
        <div className="flex flex-col gap-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            disabled={loading}
            className="w-full py-4 dragon-gradient text-white font-bold rounded-2xl flex items-center justify-center gap-2"
          >
            {loading
              ? "Saving..."
              : saved
                ? "Settings Saved!"
                : "Save Settings"}{" "}
            <Save size={18} />
          </motion.button>

          <button
            onClick={logout}
            className="w-full py-4 bg-white/5 text-red-400 font-bold rounded-2xl border border-white/10 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
          >
            Log Out <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Billing & SaaS Plan Modal */}
      <BillingModal
        isOpen={showBillingModal}
        onClose={() => setShowBillingModal(false)}
      />
    </PageContainer>
  );
}
