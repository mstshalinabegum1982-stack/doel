import React, { useState, useContext, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Upload, Tag } from 'lucide-react';
import { AuthContext } from '../../authContext';
import { getCurrencySymbol } from '../../utils/countriesData';
import { BrandSvgIcon } from '../BrandSvgIcon';
import { cn } from '../../lib/utils';

interface AddEditProductModalProps {
  onClose: () => void;
  onSave: (data: any) => void;
  initialData: any;
  isSaving: boolean;
  customCategories?: { id: string; name: string; imageUrl?: string }[];
}

const compressImage = (file: File, maxWidth = 600, maxHeight = 600, quality = 0.5): Promise<string> => {
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

function Loader2({ className }: { className?: string }) {
  return <div className={cn("w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin", className)} />;
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

function TagSetupInput({ label, placeholder, value, onChange }: { label: string; placeholder: string; value: string; onChange: (val: string) => void }) {
  const [inputValue, setInputValue] = useState('');
  const tags = value ? value.split(',').map((s: string) => s.trim()).filter(Boolean) : [];

  const handleAdd = () => {
    if (!inputValue.trim()) return;
    const newTags = [...tags];
    const inputs = inputValue.split(',').map((s: string) => s.trim()).filter(Boolean);
    inputs.forEach(item => {
      if (!newTags.includes(item)) {
        newTags.push(item);
      }
    });
    onChange(newTags.join(', '));
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleRemove = (index: number) => {
    const newTags = tags.filter((_, i) => i !== index);
    onChange(newTags.join(', '));
  };

  return (
    <div className="space-y-1.5 w-full font-sans">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">{label}</label>
      <div className="flex gap-2">
        <input 
          type="text" 
          value={inputValue} 
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-dragon-cyan/50 text-white placeholder-gray-600 font-sans"
        />
        <button 
          type="button" 
          onClick={handleAdd}
          className="bg-dragon-cyan/10 hover:bg-dragon-cyan/20 border border-dragon-cyan/30 hover:border-dragon-cyan text-dragon-cyan text-[10px] uppercase font-black px-3 rounded-xl transition-all cursor-pointer select-none shrink-0"
        >
          Add
        </button>
      </div>
      
      <div className="flex flex-wrap gap-1 mt-1.5 min-h-[22px]">
        {tags.map((tag, idx) => (
          <span 
            key={idx} 
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[10px] font-medium text-white hover:border-[#1ca]/30 transition-all select-none"
          >
            <span>{tag}</span>
            <button 
              type="button" 
              onClick={() => handleRemove(idx)}
              className="text-gray-500 hover:text-rose-400 font-black ml-1 text-[9px] focus:outline-none cursor-pointer"
            >
              ✕
            </button>
          </span>
        ))}
        {tags.length === 0 && (
          <span className="text-[9px] text-gray-600 font-medium italic select-none block pt-1 pl-1">None set up</span>
        )}
      </div>
    </div>
  );
}

function AutomationSection({ title, platformKey, isEnabled, onToggle, keywords, onKeywordsChange, template, onTemplateChange, showKeywords = true }: any) {
  return (
    <div className="space-y-3 p-3.5 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
       <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BrandSvgIcon platform={platformKey || title} variant="badge" badgeSizeClass="w-7 h-7 rounded-xl" size={14} />
            <div>
              <h4 className="text-xs font-black text-white tracking-wide">{title}</h4>
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block">
                {isEnabled ? "Auto-Reply Active" : "Disabled"}
              </span>
            </div>
          </div>
          <button 
            type="button"
            onClick={onToggle}
            className={cn(
              "w-9 h-5 rounded-full relative transition-colors focus:outline-none cursor-pointer shrink-0",
              isEnabled ? "bg-dragon-cyan" : "bg-white/10"
            )}
          >
             <div className={cn(
               "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-all",
               isEnabled ? "right-0.5" : "left-0.5"
             )} />
          </button>
       </div>

       {isEnabled && (
         <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-3 pt-1 overflow-hidden">
           {showKeywords && (
             <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Trigger Keywords</label>
                <input 
                  placeholder="e.g. price, stock, info, buy"
                  value={keywords || ''} onChange={e => onKeywordsChange && onKeywordsChange(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-dragon-cyan/50 text-xs text-white"
                />
             </div>
           )}
           <div className="space-y-1">
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Auto Reply Message</label>
              <textarea 
                placeholder="Hi! The price is [SELL_PRICE]..."
                value={template || ''} onChange={e => onTemplateChange && onTemplateChange(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-dragon-cyan/50 text-xs text-white min-h-[60px]"
              />
           </div>
         </motion.div>
       )}
    </div>
  );
}

export function AddEditProductModal({ onClose, onSave, initialData, isSaving, customCategories = [] }: AddEditProductModalProps) {
  const { profile } = useContext(AuthContext);
  const currencySymbol = profile?.country ? getCurrencySymbol(profile.country) : "৳";
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    category: initialData?.category || '',
    buyPrice: initialData?.buyPrice || 0,
    sellPrice: initialData?.sellPrice || 0,
    landingPrice: initialData?.landingPrice || 0,
    proPrice: initialData?.proPrice || 0,
    skuCode: initialData?.skuCode || '',
    stock: initialData?.stock || 0,
    isUnlimitedStock: initialData?.isUnlimitedStock || false,
    image: initialData?.image || '',
    images: (() => {
      const arr = Array(4).fill('');
      if (initialData?.images && Array.isArray(initialData.images)) {
        for (let i = 0; i < 4; i++) {
          arr[i] = initialData.images[i] || '';
        }
      } else if (initialData?.image) {
        arr[0] = initialData.image;
      }
      return arr;
    })(),
    details: initialData?.details || '',
    videoUrl: initialData?.videoUrl || '',
    color: initialData?.color || '',
    size: initialData?.size || '',
    weight: initialData?.weight || '',
    hasWarranty: initialData?.hasWarranty || false,
    warrantyDuration: initialData?.warrantyDuration || '',
    hasReplacement: initialData?.hasReplacement || false,
    replacementDuration: initialData?.replacementDuration || '',
    automationEnabled: initialData?.automationEnabled || false,
    fbKeywords: initialData?.fbKeywords || '',
    replyTemplate: initialData?.replyTemplate || '',
    igAutomationEnabled: initialData?.igAutomationEnabled || false,
    igKeywords: initialData?.igKeywords || '',
    igReplyTemplate: initialData?.igReplyTemplate || '',
    waAutomationEnabled: initialData?.waAutomationEnabled || false,
    waKeywords: initialData?.waKeywords || '',
    waReplyTemplate: initialData?.waReplyTemplate || '',
    tgAutomationEnabled: initialData?.tgAutomationEnabled || false,
    tgKeywords: initialData?.tgKeywords || '',
    tgReplyTemplate: initialData?.tgReplyTemplate || '',
    wechatAutomationEnabled: initialData?.wechatAutomationEnabled || false,
    wechatKeywords: initialData?.wechatKeywords || '',
    wechatReplyTemplate: initialData?.wechatReplyTemplate || '',
    viberAutomationEnabled: initialData?.viberAutomationEnabled || false,
    viberKeywords: initialData?.viberKeywords || '',
    viberReplyTemplate: initialData?.viberReplyTemplate || '',
    lineAutomationEnabled: initialData?.lineAutomationEnabled || false,
    lineKeywords: initialData?.lineKeywords || '',
    lineReplyTemplate: initialData?.lineReplyTemplate || '',
    tiktokAutomationEnabled: initialData?.tiktokAutomationEnabled || false,
    tiktokKeywords: initialData?.tiktokKeywords || '',
    tiktokReplyTemplate: initialData?.tiktokReplyTemplate || '',
    dragonBotEnabled: initialData?.dragonBotEnabled || false,
    aiKnowledge: initialData?.aiKnowledge || '',
    isPublic: initialData?.isPublic ?? false
  });
  const [activeInternalTab, setActiveInternalTab] = useState<'info' | 'ai_knowledge' | 'automation'>('info');
  const [isGeneratingKnowledge, setIsGeneratingKnowledge] = useState(false);
  const [activeImageSlot, setActiveImageSlot] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeImageSlot !== null) {
      try {
        const compressed = await compressImage(file, 600, 600, 0.5);
        const newImages = [...formData.images];
        newImages[activeImageSlot] = compressed;
        const primaryImage = newImages.find(x => !!x) || '';

        setFormData({ 
          ...formData, 
          images: newImages,
          image: primaryImage
        });
      } catch (err) {
        console.error('Error compressing image:', err);
      }
    }
  };

  const triggerSlotSelect = (idx: number) => {
    setActiveImageSlot(idx);
    fileInputRef.current?.click();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

      <motion.div 
        initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        className="glass-card w-full max-w-2xl border-white/10 rounded-3xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-black text-white font-display">
              {initialData ? 'EDIT INVENTORY ITEM' : 'NEW INVENTORY ITEM'}
            </h3>
            <p className="text-[10px] text-dragon-cyan uppercase font-bold tracking-widest mt-0.5">
              Multi-channel synchronization
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-all cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-white/5 bg-black/20 shrink-0">
          <button
            type="button"
            onClick={() => setActiveInternalTab('info')}
            className={cn(
              "flex-1 py-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer",
              activeInternalTab === 'info' ? "border-dragon-cyan text-dragon-cyan bg-dragon-cyan/5" : "border-transparent text-gray-500 hover:text-white"
            )}
          >
            Basic Info & Images
          </button>
          <button
            type="button"
            onClick={() => setActiveInternalTab('ai_knowledge')}
            className={cn(
              "flex-1 py-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center justify-center gap-1.5 cursor-pointer",
              activeInternalTab === 'ai_knowledge' ? "border-dragon-cyan text-dragon-cyan bg-dragon-cyan/5" : "border-transparent text-gray-500 hover:text-white"
            )}
          >
            <Sparkles size={12} /> AI Training Data
          </button>
          <button
            type="button"
            onClick={() => setActiveInternalTab('automation')}
            className={cn(
              "flex-1 py-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer",
              activeInternalTab === 'automation' ? "border-dragon-cyan text-dragon-cyan bg-dragon-cyan/5" : "border-transparent text-gray-500 hover:text-white"
            )}
          >
            Automations
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeInternalTab === 'info' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Product Images (Up to 4)</label>
                <div className="grid grid-cols-4 gap-3">
                  {formData.images.map((imgUrl: string, idx: number) => (
                    <div 
                      key={idx}
                      onClick={() => triggerSlotSelect(idx)}
                      className="aspect-square bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-dragon-cyan/50 transition-all relative overflow-hidden group"
                    >
                      {imgUrl ? (
                        <>
                          <img src={imgUrl} className="w-full h-full object-cover" alt="" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-bold text-white transition-opacity">
                            Change
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-gray-500 group-hover:text-dragon-cyan transition-colors">
                          <Upload size={16} />
                          <span className="text-[9px] font-bold">Slot {idx + 1}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InventoryInput label="Product Name *" placeholder="e.g. Wireless Earbuds" value={formData.name} onChange={(v: any) => setFormData({...formData, name: v})} />
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-dragon-cyan/50 text-sm text-white"
                  >
                    <option value="" className="bg-zinc-900 text-gray-400">Select Category</option>
                    {customCategories.map(cat => (
                      <option key={cat.id} value={cat.name} className="bg-zinc-900 text-white">{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <InventoryInput label={`Buy Price (${currencySymbol})`} type="number" value={formData.buyPrice} onChange={(v: any) => setFormData({...formData, buyPrice: parseFloat(v) || 0})} />
                <InventoryInput label={`Sell Price (${currencySymbol}) *`} type="number" value={formData.sellPrice} onChange={(v: any) => setFormData({...formData, sellPrice: parseFloat(v) || 0})} />
                <InventoryInput label={`Landing Price (${currencySymbol})`} type="number" value={formData.landingPrice} onChange={(v: any) => setFormData({...formData, landingPrice: parseFloat(v) || 0})} />
                <InventoryInput label={`Pro Price (${currencySymbol})`} type="number" value={formData.proPrice} onChange={(v: any) => setFormData({...formData, proPrice: parseFloat(v) || 0})} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InventoryInput label="SKU / Barcode" placeholder="e.g. SK-99120" value={formData.skuCode} onChange={(v: any) => setFormData({...formData, skuCode: v})} />
                <div className="space-y-1">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Stock Quantity</label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isUnlimitedStock: !formData.isUnlimitedStock })}
                      className="text-[9px] text-dragon-cyan font-bold uppercase hover:underline cursor-pointer"
                    >
                      {formData.isUnlimitedStock ? "Switch to Limited" : "Make Unlimited ♾️"}
                    </button>
                  </div>
                  <input
                    type="number"
                    disabled={formData.isUnlimitedStock}
                    value={formData.isUnlimitedStock ? 999999 : formData.stock}
                    onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    placeholder="Stock Qty"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-dragon-cyan/50 text-sm disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="border-t border-white/5 pt-4 space-y-4">
                <TagSetupInput label="Color" placeholder="e.g., Red, Black, Multi" value={formData.color} onChange={v => setFormData({...formData, color: v})} />
                <TagSetupInput label="Size" placeholder="e.g., M, XL, 38, 40" value={formData.size} onChange={v => setFormData({...formData, size: v})} />
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Detailed Description</label>
                  <textarea 
                    placeholder="Describe product materials, benefits, origin..."
                    value={formData.details} onChange={e => setFormData({...formData, details: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-dragon-cyan/50 text-xs min-h-[100px]"
                  />
                </div>
              </div>
            </div>
          )}

          {activeInternalTab === 'ai_knowledge' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="bg-dragon-cyan/5 border border-dragon-cyan/25 rounded-2xl p-4.5 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-dragon-cyan animate-pulse" />
                  <h4 className="text-xs font-black uppercase tracking-widest text-white">AI Knowledge Base (AI Training)</h4>
                </div>
                <p className="text-[10px] text-gray-400 leading-relaxed font-bold">
                  Define how the chatbot should discuss this product with customers in Messenger. Click generate below or type details to train the AI.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    AI Training & Dialogue Instructions
                  </label>
                  <button
                    type="button"
                    disabled={isGeneratingKnowledge || !formData.name}
                    onClick={async () => {
                      if (!formData.name) {
                        alert("Please enter the Product Name in the first tab first.");
                        return;
                      }
                      setIsGeneratingKnowledge(true);
                      try {
                        const response = await fetch("/api/ai/generate-knowledge", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            productName: formData.name,
                            productDetails: formData.details,
                            color: formData.color,
                            size: formData.size,
                            price: formData.sellPrice,
                            buyPrice: formData.buyPrice,
                            stock: formData.stock
                          })
                        });
                        const data = await response.json();
                        if (response.ok && data.text) {
                          setFormData(prev => ({ ...prev, aiKnowledge: data.text }));
                        } else {
                          alert(data.error || "Could not generate training data from DOELpro AI.");
                        }
                      } catch (err) {
                        console.error(err);
                        alert("Connection to the server failed. Please try again.");
                      } finally {
                        setIsGeneratingKnowledge(false);
                      }
                    }}
                    className="px-2.5 py-1 bg-dragon-cyan/15 hover:bg-dragon-cyan text-dragon-cyan hover:text-black transition-all border border-dragon-cyan/25 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isGeneratingKnowledge ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-current" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles size={11} />
                        Generate with DOELpro AI
                      </>
                    )}
                  </button>
                </div>
                <textarea 
                  placeholder="Write guidelines or instructions for talking to customers here, or auto-generate..."
                  value={formData.aiKnowledge || ''} 
                  onChange={e => setFormData({...formData, aiKnowledge: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-dragon-cyan/50 text-xs min-h-[250px] leading-relaxed font-sans"
                />
              </div>
            </div>
          )}

          {activeInternalTab === 'automation' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
               <AutomationSection 
                 title="Facebook & Messenger"
                 platformKey="facebook"
                 isEnabled={formData.automationEnabled}
                 onToggle={() => setFormData({...formData, automationEnabled: !formData.automationEnabled})}
                 keywords={formData.fbKeywords}
                 onKeywordsChange={(v: any) => setFormData({...formData, fbKeywords: v})}
                 template={formData.replyTemplate}
                 onTemplateChange={(v: any) => setFormData({...formData, replyTemplate: v})}
                 showKeywords
               />

               <AutomationSection 
                 title="Instagram"
                 platformKey="instagram"
                 isEnabled={formData.igAutomationEnabled}
                 onToggle={() => setFormData({...formData, igAutomationEnabled: !formData.igAutomationEnabled})}
                 keywords={formData.igKeywords}
                 onKeywordsChange={(v: any) => setFormData({...formData, igKeywords: v})}
                 template={formData.igReplyTemplate}
                 onTemplateChange={(v: any) => setFormData({...formData, igReplyTemplate: v})}
                 showKeywords
               />

               <AutomationSection 
                 title="WhatsApp"
                 platformKey="whatsapp"
                 isEnabled={formData.waAutomationEnabled}
                 onToggle={() => setFormData({...formData, waAutomationEnabled: !formData.waAutomationEnabled})}
                 keywords={formData.waKeywords}
                 onKeywordsChange={(v: any) => setFormData({...formData, waKeywords: v})}
                 template={formData.waReplyTemplate}
                 onTemplateChange={(v: any) => setFormData({...formData, waReplyTemplate: v})}
                 showKeywords
               />

               <AutomationSection 
                 title="Telegram"
                 platformKey="telegram"
                 isEnabled={formData.tgAutomationEnabled}
                 onToggle={() => setFormData({...formData, tgAutomationEnabled: !formData.tgAutomationEnabled})}
                 keywords={formData.tgKeywords}
                 onKeywordsChange={(v: any) => setFormData({...formData, tgKeywords: v})}
                 template={formData.tgReplyTemplate}
                 onTemplateChange={(v: any) => setFormData({...formData, tgReplyTemplate: v})}
                 showKeywords
               />

               <AutomationSection 
                 title="TikTok"
                 platformKey="tiktok"
                 isEnabled={formData.tiktokAutomationEnabled}
                 onToggle={() => setFormData({...formData, tiktokAutomationEnabled: !formData.tiktokAutomationEnabled})}
                 keywords={formData.tiktokKeywords}
                 onKeywordsChange={(v: any) => setFormData({...formData, tiktokKeywords: v})}
                 template={formData.tiktokReplyTemplate}
                 onTemplateChange={(v: any) => setFormData({...formData, tiktokReplyTemplate: v})}
                 showKeywords
               />

               <AutomationSection 
                 title="WeChat"
                 platformKey="wechat"
                 isEnabled={formData.wechatAutomationEnabled}
                 onToggle={() => setFormData({...formData, wechatAutomationEnabled: !formData.wechatAutomationEnabled})}
                 keywords={formData.wechatKeywords}
                 onKeywordsChange={(v: any) => setFormData({...formData, wechatKeywords: v})}
                 template={formData.wechatReplyTemplate}
                 onTemplateChange={(v: any) => setFormData({...formData, wechatReplyTemplate: v})}
                 showKeywords
               />

               <AutomationSection 
                 title="Viber"
                 platformKey="viber"
                 isEnabled={formData.viberAutomationEnabled}
                 onToggle={() => setFormData({...formData, viberAutomationEnabled: !formData.viberAutomationEnabled})}
                 keywords={formData.viberKeywords}
                 onKeywordsChange={(v: any) => setFormData({...formData, viberKeywords: v})}
                 template={formData.viberReplyTemplate}
                 onTemplateChange={(v: any) => setFormData({...formData, viberReplyTemplate: v})}
                 showKeywords
               />

               <AutomationSection 
                 title="LINE"
                 platformKey="line"
                 isEnabled={formData.lineAutomationEnabled}
                 onToggle={() => setFormData({...formData, lineAutomationEnabled: !formData.lineAutomationEnabled})}
                 keywords={formData.lineKeywords}
                 onKeywordsChange={(v: any) => setFormData({...formData, lineKeywords: v})}
                 template={formData.lineReplyTemplate}
                 onTemplateChange={(v: any) => setFormData({...formData, lineReplyTemplate: v})}
                 showKeywords
               />

               <AutomationSection 
                 title="DOELpro AI Chatbot"
                 platformKey="dragonbot"
                 isEnabled={formData.dragonBotEnabled}
                 onToggle={() => setFormData({...formData, dragonBotEnabled: !formData.dragonBotEnabled})}
                 keywords=""
                 onKeywordsChange={() => {}}
                 template={formData.aiKnowledge}
                 onTemplateChange={(v: any) => setFormData({...formData, aiKnowledge: v})}
                 showKeywords={false}
               />
            </div>
          )}

          <div className="flex gap-3 mt-8">
            <button 
              type="button"
              disabled={isSaving} 
              onClick={onClose} 
              className={cn(
                "flex-1 py-3 text-gray-500 font-bold uppercase tracking-widest text-xs",
                isSaving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              )}
            >
              Cancel
            </button>
            <button 
              type="button"
              disabled={isSaving}
              onClick={() => {
                if (isSaving) return;
                const cleanedImages = formData.images.filter((x: string) => !!x);
                onSave({
                  ...formData,
                  image: cleanedImages[0] || '',
                  images: cleanedImages
                });
              }}
              className={cn(
                "flex-[2] py-3 dragon-gradient text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2",
                isSaving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              )}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  Saving...
                </>
              ) : (
                'Confirm'
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default AddEditProductModal;
