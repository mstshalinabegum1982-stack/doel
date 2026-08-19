import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Layers, Tag, Save, Zap, Trash2, Plus, Search } from 'lucide-react';
import { InventoryItem } from '../types';
import { AuthContext } from '../authContext';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  deleteDoc, 
  writeBatch 
} from 'firebase/firestore';
import { getCurrencySymbol } from '../utils/countriesData';
import { PageContainer } from '../components/Navigation';
import { SuccessModal } from '../components/SuccessModal';
import { cn } from '../lib/utils';

// Modularized Components
import { InventoryStatsHeader } from '../components/inventory/InventoryStatsHeader';
import { CategoryGridView } from '../components/inventory/CategoryGridView';
import { ProductTable } from '../components/inventory/ProductTable';
import { AddEditProductModal } from '../components/inventory/AddEditProductModal';
import { SmartOrderPreviewModal } from '../components/inventory/SmartOrderPreviewModal';
import { CategorySetupPanel } from '../components/inventory/CategorySetupPanel';

const PRESET_CATEGORY_IMAGES = [
  { name: 'Electronics / Gadgets', url: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=300&q=80', icon: '⚡' },
  { name: 'Fashion / Clothing', url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=300&q=80', icon: '👗' },
  { name: 'Kitchen / Appliances', url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=300&q=80', icon: '🍳' },
  { name: 'Beauty / Cosmetics', url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&q=80', icon: '💄' },
  { name: 'Jewelry / Accessories', url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300&q=80', icon: '💍' },
  { name: 'Food / Grocery', url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80', icon: '🍎' },
  { name: 'Sports / Fitness', url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300&q=80', icon: '⚽' },
  { name: 'Toys / Baby', url: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=300&q=80', icon: '🧸' },
  { name: 'Books / Stationery', url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&q=80', icon: '📚' },
  { name: 'Home / Decor', url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=300&q=80', icon: '🏠' }
];

function InventoryTab({ active, icon, label, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex-1 py-3 px-3 rounded-xl flex items-center justify-center gap-2 transition-all relative overflow-hidden cursor-pointer",
        active 
          ? "bg-[#fff0f5] text-[#f43f5e] font-black shadow-sm border border-pink-200" 
          : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 font-extrabold"
      )}
    >
      <span className={cn("transition-colors", active ? "text-[#f43f5e]" : "text-slate-400")}>{icon}</span>
      <span className="text-xs uppercase tracking-wider font-extrabold leading-none">{label}</span>
      {active && (
        <motion.div 
          layoutId="inv-tab" 
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#f43f5e] rounded-full" 
        />
      )}
    </button>
  );
}

function InventoryInput({ label, value, onChange, type = 'text', placeholder = '', disabled = false }: any) {
  return (
    <div className="space-y-1">
      {label && <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">{label}</label>}
      <input 
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-dragon-cyan/50 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return <div className={cn("w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin", className)} />;
}

export function Inventory() {
  const { user, profile } = useContext(AuthContext);
  const currencySymbol = profile?.country ? getCurrencySymbol(profile.country) : "৳";

  // State
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'bulk' | 'categories'>('list');
  const [search, setSearch] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [previewProduct, setPreviewProduct] = useState<InventoryItem | null>(null);

  // Categories State
  const [customCategories, setCustomCategories] = useState<{ id: string; name: string; imageUrl?: string }[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [newCatImage, setNewCatImage] = useState('');
  const [showCatDeleteModal, setShowCatDeleteModal] = useState(false);
  const [catToDelete, setCatToDelete] = useState<{ id: string; name: string } | null>(null);

  // Bulk State
  const [bulkPriceChange, setBulkPriceChange] = useState('');
  const [bulkDiscountChange, setBulkDiscountChange] = useState('');

  // Delegation State
  const [delegations, setDelegations] = useState<any[]>([]);
  const [activeDelegateId, setActiveDelegateId] = useState<string>(() => {
    return localStorage.getItem('active_delegate_user_id') || '';
  });
  const [activeDelegate, setActiveDelegate] = useState<any | null>(null);

  // Success Modal State
  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    title: '',
    message: ''
  });

  const triggerSuccess = (title: string, message: string) => {
    setSuccessModal({
      isOpen: true,
      title,
      message
    });
  };

  // 1. Load Delegations
  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    const fetchDelegations = async () => {
      try {
        const q = query(
          collection(db, 'delegated_access'),
          where('granteeId', '==', user.uid),
          where('allowInventory', '==', true),
          where('status', '==', 'accepted')
        );
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (isMounted) {
          setDelegations(list);
          if (activeDelegateId) {
            const found = list.find((d: any) => d.grantorId === activeDelegateId);
            setActiveDelegate(found || null);
          }
        }
      } catch (err) {
        console.error("Error fetching access delegations:", err);
      }
    };
    fetchDelegations();
    return () => { isMounted = false; };
  }, [user, activeDelegateId]);

  // 2. Load Cached Data First & Fetch Inventory + Categories from Firestore
  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    
    // Load from local Cache instantly to prevent layout jump / skeleton flickering
    try {
      const cachedItems = localStorage.getItem('dragon_inventory_items');
      if (cachedItems && isMounted) {
        setItems(JSON.parse(cachedItems));
        setLoading(false);
      }
      const cachedCategories = localStorage.getItem('dragon_merchant_categories');
      if (cachedCategories && isMounted) {
        setCustomCategories(JSON.parse(cachedCategories));
        setCategoriesLoading(false);
      }
    } catch {}

    const fetchInventoryAndCategories = async () => {
      const targetUid = activeDelegateId || user.uid;
      
      // Fetch Inventory
      try {
        const invQuery = query(
          collection(db, 'inventory'),
          where('userId', '==', targetUid)
        );
        const invSnap = await getDocs(invQuery);
        const fetchedItems = invSnap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryItem));
        if (isMounted) {
          setItems(fetchedItems);
          try { localStorage.setItem('dragon_inventory_items', JSON.stringify(fetchedItems)); } catch {}
        }
      } catch (e: any) {
        console.error("Failed to load inventory:", e);
      } finally {
        if (isMounted) setLoading(false);
      }

      // Fetch Categories
      try {
        const catQuery = query(
          collection(db, 'merchant_categories'),
          where('userId', '==', targetUid)
        );
        const catSnap = await getDocs(catQuery);
        const fetchedCats = catSnap.docs.map(d => ({ id: d.id, ...d.data() } as { id: string; name: string; imageUrl?: string }));
        if (isMounted) {
          setCustomCategories(fetchedCats);
          try { localStorage.setItem('dragon_merchant_categories', JSON.stringify(fetchedCats)); } catch {}
        }
      } catch (catError) {
        console.error("Failed to load merchant categories:", catError);
      } finally {
        if (isMounted) setCategoriesLoading(false);
      }
    };

    fetchInventoryAndCategories();

    return () => {
      isMounted = false;
    };
  }, [user, activeDelegateId]);

  // Action Handlers
  const handleBulkUpdate = async () => {
    if (!items.length || (!bulkPriceChange && !bulkDiscountChange)) return;
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const updatedItems = items.map(item => {
        const update: any = { ...item };
        if (bulkPriceChange) update.sellPrice = Number(bulkPriceChange);
        if (bulkDiscountChange) update.discount = Number(bulkDiscountChange);
        batch.update(doc(db, 'inventory', item.id), update);
        return update;
      });
      await batch.commit();
      setItems(updatedItems);
      try { localStorage.setItem('dragon_inventory_items', JSON.stringify(updatedItems)); } catch {}
      triggerSuccess('Bulk Update Completed!', 'Selected products have been updated successfully.');
      setBulkPriceChange('');
      setBulkDiscountChange('');
    } catch (e: any) {
      console.error(e);
      alert('Bulk update fail: ' + (e.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: any) => {
    if (!user || isSaving) return;
    setIsSaving(true);
    const isEditMode = Boolean(editingItem && editingItem.id);
    const effectiveUid = activeDelegateId || user.uid;

    try {
      const batch = writeBatch(db);
      let savedDocId = isEditMode ? editingItem!.id : undefined;

      if (isEditMode && editingItem?.id) {
        const itemRef = doc(db, 'inventory', editingItem.id);
        batch.update(itemRef, {
          ...data,
          updatedAt: new Date().toISOString()
        });
      } else {
        const itemRef = doc(collection(db, 'inventory'));
        savedDocId = itemRef.id;
        batch.set(itemRef, {
          ...data,
          userId: effectiveUid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      if (savedDocId) {
        try {
          const hiddenRef = doc(db, 'hidden_merchant_files', effectiveUid);
          const prodItem = {
            id: savedDocId,
            name: data.name || '',
            price: data.sellPrice || data.price || 0,
            details: data.details || '',
            stock: data.stock || 0,
            updatedAt: new Date().toISOString()
          };

          let currentProducts = items.map((p: any) => ({
            id: p.id,
            name: p.name || '',
            price: p.sellPrice || p.price || 0,
            details: p.details || '',
            stock: p.stock || 0,
            updatedAt: p.updatedAt || new Date().toISOString()
          }));

          const existingIndex = currentProducts.findIndex((p: any) => p.id === savedDocId);
          if (existingIndex > -1) {
            currentProducts[existingIndex] = prodItem;
          } else {
            currentProducts.push(prodItem);
          }

          const q1 = `How much is ${data.name}?`;
          const a1 = `The price of ${data.name} is ${currencySymbol}${data.sellPrice || data.price || 0}.`;
          const q2 = `Tell me more about ${data.name}`;
          const a2 = data.details || `The price of ${data.name} is ${currencySymbol}${data.sellPrice || data.price || 0} and it is currently available in our inventory.`;

          const newQaEntries = [
            { question: q1, answer: a1, timestamp: new Date().toISOString() }
          ];
          if (data.details) {
            newQaEntries.push({ question: q2, answer: a2, timestamp: new Date().toISOString() });
          }

          batch.set(hiddenRef, {
            userId: effectiveUid,
            products: currentProducts,
            qaCache: newQaEntries,
            updatedAt: new Date().toISOString()
          }, { merge: true });

        } catch (syncErr) {
          console.warn("Failed to sync item to hidden merchant files:", syncErr);
        }
      }
      
      if (data.dragonBotEnabled && !profile?.dragonBotEnabled) {
        batch.update(doc(db, 'users', effectiveUid), {
          dragonBotEnabled: true
        });
      }

      await batch.commit();

      const updatedItemObj: InventoryItem = {
        id: savedDocId!,
        userId: effectiveUid,
        ...data,
        updatedAt: new Date().toISOString()
      };
      const newItemsList = isEditMode
        ? items.map(it => it.id === savedDocId ? { ...it, ...updatedItemObj } : it)
        : [updatedItemObj, ...items];
      setItems(newItemsList);
      try { localStorage.setItem('dragon_inventory_items', JSON.stringify(newItemsList)); } catch {}

      const wasEditMode = Boolean(editingItem && editingItem.id);
      setShowAddModal(false);
      setEditingItem(null);
      triggerSuccess(
        wasEditMode ? 'Product Updated Successfully!' : 'Product Added Successfully!',
        wasEditMode ? 'Product details updated in inventory.' : 'New product added to inventory successfully.'
      );
    } catch (e: any) {
      console.error("Failed to save product:", e);
      alert('Failed to save to server. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    setItemToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteDoc(doc(db, 'inventory', itemToDelete));
      const filtered = items.filter(item => item.id !== itemToDelete);
      setItems(filtered);
      try { localStorage.setItem('dragon_inventory_items', JSON.stringify(filtered)); } catch {}
      setSelectedIds(prev => prev.filter(item => item !== itemToDelete));
      setItemToDelete(null);
      setShowDeleteModal(false);
      triggerSuccess('Product Deleted!', 'Product removed from inventory.');
    } catch (e: any) {
      console.error('Delete Error:', e);
      alert('Error deleting product: ' + (e.message || 'Unknown error'));
    }
  };

  // Category Handlers
  const handleSaveCategory = async () => {
    if (!newCatName.trim() || !user) {
      alert("Please enter a category name.");
      return;
    }
    const effectiveUid = activeDelegateId || user.uid;
    const trimmedName = newCatName.trim();

    try {
      if (editingCatId) {
        const catRef = doc(db, 'merchant_categories', editingCatId);
        const batch = writeBatch(db);
        batch.update(catRef, {
          name: trimmedName,
          imageUrl: newCatImage || '',
          updatedAt: new Date().toISOString()
        });
        await batch.commit();

        const updatedCats = customCategories.map(c => 
          c.id === editingCatId ? { ...c, name: trimmedName, imageUrl: newCatImage } : c
        );
        setCustomCategories(updatedCats);
        try { localStorage.setItem('dragon_merchant_categories', JSON.stringify(updatedCats)); } catch {}
        triggerSuccess('Category Updated!', `Category "${trimmedName}" updated successfully.`);
      } else {
        const existing = customCategories.find(c => c.name.toLowerCase() === trimmedName.toLowerCase());
        if (existing) {
          alert("A category with this name already exists.");
          return;
        }
        const newCatRef = doc(collection(db, 'merchant_categories'));
        const batch = writeBatch(db);
        const catData = {
          userId: effectiveUid,
          name: trimmedName,
          imageUrl: newCatImage || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        batch.set(newCatRef, catData);
        await batch.commit();

        const newCatsList = [...customCategories, { id: newCatRef.id, ...catData }];
        setCustomCategories(newCatsList);
        try { localStorage.setItem('dragon_merchant_categories', JSON.stringify(newCatsList)); } catch {}
        triggerSuccess('Category Created!', `New category "${trimmedName}" created successfully.`);
      }

      setNewCatName('');
      setNewCatImage('');
      setEditingCatId(null);
    } catch (err: any) {
      console.error("Save category error:", err);
      alert('Failed to save category: ' + err.message);
    }
  };

  const handleEditCategory = (cat: { id: string; name: string; imageUrl?: string }) => {
    setEditingCatId(cat.id);
    setNewCatName(cat.name);
    setNewCatImage(cat.imageUrl || '');
    setActiveTab('categories');
  };

  const handleCancelCatEdit = () => {
    setEditingCatId(null);
    setNewCatName('');
    setNewCatImage('');
  };

  const confirmDeleteCategory = async () => {
    if (!catToDelete) return;
    try {
      await deleteDoc(doc(db, 'merchant_categories', catToDelete.id));
      const updatedCats = customCategories.filter(c => c.id !== catToDelete.id);
      setCustomCategories(updatedCats);
      try { localStorage.setItem('dragon_merchant_categories', JSON.stringify(updatedCats)); } catch {}
      triggerSuccess('Category Deleted!', 'Category removed successfully.');
      setShowCatDeleteModal(false);
      setCatToDelete(null);
    } catch (err: any) {
      console.error("Delete category error:", err);
      alert('Failed to delete: ' + err.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} products?`)) {
      setLoading(true);
      try {
        const batch = writeBatch(db);
        selectedIds.forEach(id => {
          batch.delete(doc(db, 'inventory', id));
        });
        await batch.commit();
        
        const remaining = items.filter(i => !selectedIds.includes(i.id));
        setItems(remaining);
        try { localStorage.setItem('dragon_inventory_items', JSON.stringify(remaining)); } catch {}
        setSelectedIds([]);
        triggerSuccess('Products Deleted!', 'Selected products removed from inventory.');
      } catch (e: any) {
        console.error("Bulk delete error:", e);
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map(i => i.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleCheckCategoryBeforeAdd = (preselectedCategory?: string) => {
    if (customCategories.length === 0) {
      alert("⚠️ No category created yet! Please create a Category in 'CATEGORY SETUP' first.");
      setActiveTab('categories');
      return;
    }
    setEditingItem(preselectedCategory ? { category: preselectedCategory } as any : null);
    setShowAddModal(true);
  };

  const filteredItems = items.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategoryFilter === 'All' || i.category === activeCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalValue = items.reduce((acc, i) => acc + ((i.sellPrice || 0) * (i.stock || 0)), 0);

  return (
    <PageContainer>
      <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="bg-[#f8f9fa] dark:bg-[#07090e] text-slate-800 dark:text-white p-4 sm:p-6 md:p-8 rounded-3xl min-h-[calc(100vh-100px)] space-y-6 shadow-sm border border-slate-200/60 dark:border-white/10 font-sans inventory-container">
        {/* Header Title */}
        <div className="flex items-center justify-between pb-1">
          <h1 className="text-2xl sm:text-3xl font-black text-[#0f172a] dark:text-dragon-cyan uppercase tracking-wide">
            INVENTORY
          </h1>
        </div>

        {/* Delegation Switcher header */}
        {delegations.length > 0 && (
           <div className="p-4 rounded-2xl bg-pink-50 border border-pink-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1">
              <div>
                 <span className="text-[10px] font-black text-[#f43f5e] tracking-widest uppercase block leading-none">Delegated Access Board</span>
                 <p className="text-[10px] text-slate-700 font-bold uppercase mt-1.5 flex items-center gap-1.5 leading-none">
                    {activeDelegateId ? (
                       <>
                          <span className="w-2 h-2 rounded-full bg-[#f43f5e] animate-pulse inline-block" />
                          <span>You are currently managing the Vendor/Merchant Panel of <span className="text-[#f43f5e] font-black">{activeDelegate?.grantorName}</span></span>
                       </>
                    ) : (
                       <span>You are currently on your Personal Inventory Dashboard</span>
                    )}
                 </p>
              </div>
              <div className="flex items-center gap-2">
                 <span className="text-[8px] uppercase font-black tracking-widest text-slate-500">Switch View:</span>
                 <select
                   value={activeDelegateId}
                   onChange={(e) => {
                     const val = e.target.value;
                     setActiveDelegateId(val);
                     if (val) {
                       localStorage.setItem('active_delegate_user_id', val);
                       setActiveDelegate(delegations.find((d: any) => d.grantorId === val) || null);
                     } else {
                       localStorage.removeItem('active_delegate_user_id');
                       setActiveDelegate(null);
                     }
                   }}
                   className="bg-white border border-slate-300 text-slate-800 font-black text-[9.5px] uppercase tracking-widest px-3 py-1.5 rounded-xl accent-[#f43f5e] focus:outline-none"
                 >
                    <option value="">My Personal Panel (My Account)</option>
                    {delegations.map((d: any, idx: number) => (
                       <option key={`del-opt-${d.id || d.grantorId || idx}-${idx}`} value={d.grantorId}>{d.grantorName}'s Panel</option>
                    ))}
                 </select>
              </div>
         </div>
        )}

        {/* Navigation Tabs (Products, Bulk, Category Setup) */}
        <div className="bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-around gap-1">
           <InventoryTab active={activeTab === 'list'} icon={<Box size={18} className="text-[#f43f5e]"/>} label="PRODUCTS" onClick={() => setActiveTab('list')} />
           <InventoryTab active={activeTab === 'bulk'} icon={<Layers size={18}/>} label="BULK" onClick={() => setActiveTab('bulk')} />
           <InventoryTab active={activeTab === 'categories'} icon={<Tag size={18}/>} label="CATEGORY SETUP" onClick={() => setActiveTab('categories')} />
        </div>

        {activeTab === 'list' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {activeCategoryFilter === 'All' ? (
              <div className="space-y-6">
                {/* Search Bar & Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#f43f5e]" size={18} />
                    <input
                      type="text"
                      placeholder="Search categories or products..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full bg-white border-2 border-pink-200 focus:border-[#f43f5e] focus:ring-4 focus:ring-pink-100/50 rounded-2xl py-3 pl-11 pr-4 outline-none text-xs font-semibold text-slate-800 placeholder-slate-400 shadow-sm transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setActiveTab('categories')}
                      className="px-4 py-3 bg-white hover:bg-pink-50 text-[#f43f5e] border-2 border-pink-200 rounded-2xl transition-all cursor-pointer flex items-center gap-2 font-black text-xs uppercase tracking-wider shadow-sm"
                    >
                      <Tag size={16} className="text-[#f43f5e]" />
                      <span>CATEGORY SETUP</span>
                    </button>
                    <button 
                      onClick={() => handleCheckCategoryBeforeAdd()}
                      className="px-5 py-3 bg-[#f43f5e] hover:bg-[#e11d48] text-white rounded-2xl transition-all shadow-md shadow-pink-200 cursor-pointer flex items-center gap-2 font-black text-xs uppercase tracking-wider hover:scale-[1.02] active:scale-95"
                      title="Add New Product"
                    >
                      <Plus size={18} />
                      <span>ADD PRODUCT</span>
                    </button>
                  </div>
                </div>

                {/* Top Summary Stats Cards */}
                <InventoryStatsHeader 
                  categoriesCount={customCategories.length}
                  itemsCount={items.length}
                  totalValue={totalValue}
                  currencySymbol={currencySymbol} 
                />

                {/* Category Grid View */}
                <CategoryGridView 
                  displayCategories={customCategories}
                  items={items}
                  customCategories={customCategories}
                  search={search}
                  loading={loading}
                  categoriesLoading={categoriesLoading}
                  onSelectCategory={(catName) => setActiveCategoryFilter(catName)}
                  onCreateCategoryClick={() => setActiveTab('categories')}
                />
              </div>
            ) : (
              (() => {
                const isUncat = activeCategoryFilter === 'Uncategorized';
                const selectedCatObj = customCategories.find(c => c.name === activeCategoryFilter);
                const catProducts = isUncat 
                  ? items.filter(i => !i.category || !customCategories.some(c => c.name === i.category))
                  : items.filter(i => i.category === activeCategoryFilter);
                
                const filteredCatProducts = catProducts.filter(i => 
                  i.name.toLowerCase().includes(search.toLowerCase())
                );

                return (
                  <ProductTable
                    activeCategoryFilter={activeCategoryFilter}
                    selectedCatObj={selectedCatObj}
                    catProducts={catProducts}
                    filteredCatProducts={filteredCatProducts}
                    search={search}
                    setSearch={setSearch}
                    selectedIds={selectedIds}
                    toggleSelect={toggleSelect}
                    toggleSelectAll={toggleSelectAll}
                    handleBulkDelete={handleBulkDelete}
                    onBackToCategories={() => setActiveCategoryFilter('All')}
                    onAddProductClick={() => handleCheckCategoryBeforeAdd(isUncat ? undefined : activeCategoryFilter)}
                    onEditProduct={(item) => { setEditingItem(item); setShowAddModal(true); }}
                    onDeleteProduct={handleDelete}
                    onPreviewProduct={setPreviewProduct}
                  />
                );
              })()
            )}
          </div>
        )}

        {activeTab === 'bulk' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
             <div className="glass-card p-6 space-y-6 border-dragon-cyan/20">
                <div className="flex items-center gap-3 mb-2">
                   <div className="p-2 bg-dragon-cyan/10 rounded-lg text-dragon-cyan">
                      <Layers size={20} />
                   </div>
                   <div>
                      <h3 className="text-lg font-display font-bold">Bulk Inventory Manager</h3>
                      <p className="text-xs text-gray-500 font-light">Update prices and discounts for all products at once.</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <InventoryInput label={`Global Price Override (${currencySymbol})`} type="number" 
                     value={bulkPriceChange} onChange={setBulkPriceChange} 
                   />
                   <InventoryInput label="Global Discount (%)" type="number" 
                     value={bulkDiscountChange} onChange={setBulkDiscountChange}
                   />
                </div>

                <button 
                  onClick={handleBulkUpdate}
                  disabled={loading}
                  className="w-full py-4 bg-dragon-cyan text-dragon-black font-bold rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-dragon-cyan/10 cursor-pointer"
                >
                   {loading ? <Loader2 className="animate-spin" /> : <Save size={18} />} Update All Products
                </button>
             </div>
             
             <div className="glass-card p-6 bg-amber-500/5 border-amber-500/20">
                <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest flex items-center gap-2">
                   <Zap size={14} /> Attention
                </p>
                <p className="text-xs text-gray-400 font-light mt-1">Bulk overrides will apply to all items in your vault instantly. Use with caution.</p>
             </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <CategorySetupPanel 
            customCategories={customCategories}
            items={items}
            editingCatId={editingCatId}
            newCatName={newCatName}
            setNewCatName={setNewCatName}
            newCatImage={newCatImage}
            setNewCatImage={setNewCatImage}
            presetCategoryImages={PRESET_CATEGORY_IMAGES}
            handleSaveCategory={handleSaveCategory}
            handleEditCategory={handleEditCategory}
            handleCancelCatEdit={handleCancelCatEdit}
            setCatToDelete={setCatToDelete}
            setShowCatDeleteModal={setShowCatDeleteModal}
            onSelectCategory={(name) => setActiveCategoryFilter(name)}
            onSwitchToListTab={() => setActiveTab('list')}
          />
        )}

      </div>

      <AnimatePresence>
        {showAddModal && (
          <AddEditProductModal 
            onClose={() => { setShowAddModal(false); setEditingItem(null); }}
            onSave={handleSave}
            initialData={editingItem}
            isSaving={isSaving}
            customCategories={customCategories}
          />
        )}
        
        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="w-full max-w-sm glass-card p-8 border-red-500/30 text-center space-y-6 neon-glow shadow-[0_0_50px_rgba(239,68,68,0.1)]"
             >
                <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
                   <Trash2 size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-display font-black text-white">Delete Product?</h3>
                  <p className="text-sm text-gray-500 mt-2">Once deleted, it cannot be recovered.</p>
                </div>
                <div className="flex gap-4">
                   <button 
                     onClick={() => { setShowDeleteModal(false); setItemToDelete(null); }}
                     className="flex-1 py-3 bg-white/5 text-gray-400 font-black uppercase tracking-widest text-[10px] rounded-xl border border-white/10 hover:bg-white/10 cursor-pointer"
                   >
                     No, Keep
                   </button>
                   <button 
                     onClick={confirmDelete}
                     className="flex-1 py-3 bg-red-500 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all cursor-pointer"
                   >
                     Yes, Delete
                   </button>
                </div>
             </motion.div>
          </div>
        )}

        {showCatDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="w-full max-w-sm glass-card p-8 border-red-500/30 text-center space-y-6 neon-glow shadow-[0_0_50px_rgba(239,68,68,0.1)]"
             >
                <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
                   <Trash2 size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-display font-black text-white">Delete Category?</h3>
                  <p className="text-xs text-dragon-cyan font-mono mt-1 uppercase tracking-widest">
                     {catToDelete?.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Are you sure you want to delete this category? This action cannot be undone.</p>
                </div>
                <div className="flex gap-4">
                   <button 
                     onClick={() => { setShowCatDeleteModal(false); setCatToDelete(null); }}
                     className="flex-1 py-3 bg-white/5 text-gray-400 font-black uppercase tracking-widest text-[10px] rounded-xl border border-white/10 hover:bg-white/10 cursor-pointer"
                   >
                     No, Keep
                   </button>
                   <button 
                     onClick={confirmDeleteCategory}
                     className="flex-1 py-3 bg-red-500 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all cursor-pointer"
                   >
                     Yes, Delete
                   </button>
                </div>
             </motion.div>
          </div>
        )}

        {previewProduct && (
          <SmartOrderPreviewModal 
            item={previewProduct} 
            user={user}
            onClose={() => setPreviewProduct(null)} 
          />
        )}
      </AnimatePresence>

      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal(prev => ({ ...prev, isOpen: false }))}
        title={successModal.title}
        message={successModal.message}
      />
    </div>
    </PageContainer>
  );
}

export default Inventory;
