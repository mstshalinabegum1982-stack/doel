import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { X, Image as ImageIcon, User, Sparkles, ShoppingBag, PackageCheck } from 'lucide-react';
import { AuthContext } from '../../authContext';
import { getCheckoutFormFields, getAggregatedAddress, getCurrencySymbol } from '../../utils/countriesData';
import { compressImage } from '../../utils/imageCompressor';
import { SmartPasteModal } from '../SmartPasteModal';

export function SimpleInput({ label, value, onChange, placeholder, type = 'text', icon }: any) {
  return (
    <div className="space-y-1.5 text-left">
      <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-gray-400 block">{label}</label>
      <div className="relative flex items-center">
        {icon && <span className="absolute left-3 text-slate-400 dark:text-gray-500">{icon}</span>}
        <input 
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 focus:outline-none focus:border-cyan-500 dark:focus:border-dragon-cyan/50 transition-all font-sans ${icon ? 'pl-9' : ''}`}
        />
      </div>
    </div>
  );
}

interface CreateOrderPopupProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  onPreviewImage?: (url: string | null) => void;
}

export function CreateOrderPopup({ onClose, onSubmit, initialData }: CreateOrderPopupProps) {
  const { profile } = useContext(AuthContext);
  const country = profile?.country || 'Bangladesh';
  const currencySymbol = getCurrencySymbol(country);
  const fields = getCheckoutFormFields(country);

  const [formData, setFormData] = useState({
    productName: initialData?.productName || '',
    buyPrice: initialData?.buyPrice || '',
    sellPrice: initialData?.sellPrice || '',
    deliveryCharge: initialData?.deliveryCharge || (country === 'Bangladesh' ? '60' : '0'),
    quantity: initialData?.quantity || '',
    productImage: initialData?.productImage || '',
    productImages: initialData?.productImages || [],
    size: initialData?.size || '',
    color: initialData?.color || '',
    weight: initialData?.weight || '',
  });

  const [dynamicFields, setDynamicFields] = useState<any>(() => {
    const initial: any = {};
    fields.forEach(f => {
      initial[f.key] = '';
    });
    if (initialData) {
      initial['name'] = initialData.customerName || '';
      initial['phone'] = initialData.customerPhone || '';
      initial['address'] = initialData.customerAddress || '';
    }
    return initial;
  });

  const [smartPaste, setSmartPaste] = useState<{
    isOpen: boolean;
    pastedText: string;
    initialTargetField: string;
  }>({
    isOpen: false,
    pastedText: '',
    initialTargetField: 'name'
  });

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>, fieldKey: string) => {
    const text = e.clipboardData.getData('text') || '';
    if (text.trim().length > 5 && (text.includes(' ') || text.includes('\n') || text.includes('\r'))) {
      e.preventDefault();
      setSmartPaste({
        isOpen: true,
        pastedText: text,
        initialTargetField: fieldKey
      });
    }
  };

  const handleSmartPasteApply = (data: { name: string; phone: string; address: string }) => {
    setDynamicFields((prev: any) => {
      const updated = { ...prev };
      if (data.name) updated['name'] = data.name;
      if (data.phone) updated['phone'] = data.phone;
      if (data.address) updated['address'] = data.address;
      return updated;
    });
  };

  const handleFileChange = (e: any) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        compressImage(file as File).then(dataUrl => {
          if (dataUrl) {
            setFormData(prev => ({
              ...prev,
              productImage: prev.productImage || dataUrl,
              productImages: [...prev.productImages, dataUrl]
            }));
          }
        });
      });
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => {
      const newImages = prev.productImages.filter((_, i) => i !== index);
      return {
        ...prev,
        productImage: newImages[0] || '',
        productImages: newImages
      };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 dark:bg-dragon-black/95 backdrop-blur-md overflow-y-auto font-sans">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg bg-white dark:bg-zinc-950 p-5 sm:p-6 overflow-y-auto max-h-[92vh] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl relative my-auto text-slate-900 dark:text-white"
      >
        <div className="flex justify-between items-center mb-5 pb-3.5 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 dark:bg-dragon-cyan/10 border border-cyan-500/20 dark:border-dragon-cyan/30 text-cyan-600 dark:text-dragon-cyan shrink-0">
              <ShoppingBag size={18} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-dragon-cyan uppercase tracking-[0.15em] flex items-center gap-2">
                Generate Order Cart
                <span className="inline-block w-2 h-2 bg-cyan-500 dark:bg-dragon-cyan rounded-full animate-ping shrink-0" />
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-gray-400 font-medium">Create a digital checkout cart for your customer</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-full text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95 cursor-pointer" 
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5">
          {/* Main Product Section */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-stretch">
             {/* Thumbnail picker */}
             <div className="flex flex-row sm:flex-col gap-3 shrink-0 items-center sm:items-start justify-center sm:justify-start bg-slate-50 dark:bg-white/5 p-3 rounded-2xl border border-slate-200 dark:border-white/5">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-white dark:bg-white/5 rounded-2xl border-2 border-dashed border-slate-300 dark:border-white/15 hover:border-cyan-500 dark:hover:border-dragon-cyan/55 transition-colors flex flex-col items-center justify-center overflow-hidden cursor-pointer shrink-0 group">
                   {formData.productImage ? (
                     <img src={formData.productImage} className="w-full h-full object-cover" alt="" />
                   ) : (
                     <div className="flex flex-col items-center justify-center gap-1.5 p-2 text-center text-slate-400 dark:text-gray-500">
                       <ImageIcon size={20} className="text-slate-400 dark:text-gray-400 group-hover:scale-110 transition-transform" />
                       <span className="text-[7.5px] font-bold uppercase tracking-wider">Upload Image</span>
                     </div>
                   )}
                   <input type="file" multiple onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
                {formData.productImages.length > 1 && (
                  <div className="flex sm:flex-wrap gap-1.5 max-w-[160px] sm:max-w-[100px] overflow-x-auto sm:overflow-x-visible pb-1 sm:pb-0">
                    {formData.productImages.map((img: string, i: number) => (
                      <div key={i} className="relative w-7 h-7 rounded-lg border border-slate-200 dark:border-white/10 overflow-hidden shrink-0 group">
                        <img src={img || undefined} className="w-full h-full object-cover" alt="" />
                        <button onClick={() => removeImage(i)} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-400 transition-opacity">
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
             </div>

             {/* Product details */}
             <div className="flex-1 space-y-3 min-w-0">
                <SimpleInput label="Product Name" value={formData.productName} onChange={(v: string) => setFormData({...formData, productName: v})} placeholder="e.g. Gents Premium Shirt" />
                <div className="grid grid-cols-2 gap-3">
                   <SimpleInput label={`Buy Price ${currencySymbol}`} type="number" value={formData.buyPrice} onChange={(v: string) => setFormData({...formData, buyPrice: v})} placeholder="00" />
                   <SimpleInput label={`Sell Price ${currencySymbol}`} type="number" value={formData.sellPrice} onChange={(v: string) => setFormData({...formData, sellPrice: v})} placeholder="00" />
                </div>
                <SimpleInput label="Quantity" type="number" value={formData.quantity} onChange={(v: string) => setFormData({...formData, quantity: v})} placeholder="01" />
             </div>
          </div>

          {/* Specs attributes */}
          <div className="grid grid-cols-3 gap-2.5">
             <SimpleInput label="Size" value={formData.size} onChange={(v: string) => setFormData({...formData, size: v})} placeholder="M, L, XL" />
             <SimpleInput label="Color" value={formData.color} onChange={(v: string) => setFormData({...formData, color: v})} placeholder="Black, Red" />
             <SimpleInput label="Weight" value={formData.weight} onChange={(v: string) => setFormData({...formData, weight: v})} placeholder="500g, 1kg" />
          </div>

          {/* Customer Details Section */}
          <div className="p-4 sm:p-5 bg-cyan-50/80 dark:bg-dragon-cyan/5 rounded-3xl border border-cyan-200/60 dark:border-dragon-cyan/15 space-y-4">
             <div className="flex justify-between items-center border-b border-cyan-200/60 dark:border-dragon-cyan/10 pb-2.5">
               <div>
                 <p className="text-[10px] font-black uppercase text-cyan-700 dark:text-dragon-cyan tracking-widest flex items-center gap-1">
                   <User size={12} /> Customer Details ({country})
                 </p>
                 <div className="text-[8px] font-black text-slate-500 dark:text-white/40 uppercase tracking-wider">Shipping Details</div>
               </div>
               <button
                 type="button"
                 onClick={() => setSmartPaste({ isOpen: true, pastedText: '', initialTargetField: 'name' })}
                 className="px-2.5 py-1.5 bg-cyan-500/15 hover:bg-cyan-500/25 dark:bg-dragon-cyan/15 dark:hover:bg-dragon-cyan/25 border border-cyan-500/30 dark:border-dragon-cyan/30 rounded-xl text-[9px] font-black text-cyan-700 dark:text-dragon-cyan uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
               >
                 <Sparkles size={11} className="animate-pulse" />
                 Smart Paste Helper ⚡
               </button>
             </div>
             
             {/* Dynamic Country Form Fields */}
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
               {fields.map((field) => {
                 if (field.type === 'select') {
                   return (
                     <div key={field.key} className="space-y-1.5 sm:col-span-2 text-left">
                       <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-gray-400 block">
                         {field.labelEn} {field.required && <span className="text-rose-500">*</span>}
                       </label>
                       <div className="relative">
                         <select
                           required={field.required}
                           value={dynamicFields[field.key] || ''}
                           onChange={(e) => {
                             const val = e.target.value;
                             setDynamicFields((prev: any) => ({ ...prev, [field.key]: val }));
                             if (field.key === 'location') {
                               const charge = val === 'dhaka_inside' ? 60 : 120;
                               setFormData((prev: any) => ({ ...prev, deliveryCharge: String(charge) }));
                             }
                           }}
                           className="w-full px-4 py-2.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500 dark:focus:border-dragon-cyan cursor-pointer appearance-none transition-colors"
                         >
                           <option value="" className="bg-white dark:bg-[#09090d] text-slate-500 dark:text-gray-400 font-medium">Choose location...</option>
                           {field.options?.map((opt) => (
                             <option key={opt.value} value={opt.value} className="bg-white dark:bg-[#09090d] text-slate-900 dark:text-white">
                               {opt.label}
                             </option>
                           ))}
                         </select>
                         <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-gray-400 text-xs">
                           ▼
                         </div>
                       </div>
                     </div>
                   );
                 }

                 if (field.type === 'textarea') {
                   return (
                     <div key={field.key} className="space-y-1.5 sm:col-span-2 text-left">
                       <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-gray-400 block">
                         {field.labelEn} {field.required && <span className="text-rose-500">*</span>}
                       </label>
                       <textarea
                         required={field.required}
                         placeholder={field.placeholderEn}
                         rows={2}
                         className="w-full px-4 py-2.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500 dark:focus:border-dragon-cyan resize-none transition-colors"
                         value={dynamicFields[field.key] || ''}
                         onChange={(e) => setDynamicFields((prev: any) => ({ ...prev, [field.key]: e.target.value }))}
                         onPaste={(e) => handlePaste(e, field.key)}
                       />
                     </div>
                   );
                 }

                 return (
                   <div key={field.key} className="space-y-1.5 text-left">
                     <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-gray-400 block">
                       {field.labelEn} {field.required && <span className="text-rose-500">*</span>}
                     </label>
                     <input
                       required={field.required}
                       type={field.type}
                       placeholder={field.placeholderEn}
                       className="w-full px-4 py-2.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500 dark:focus:border-dragon-cyan transition-colors"
                       value={dynamicFields[field.key] || ''}
                       onChange={(e) => setDynamicFields((prev: any) => ({ ...prev, [field.key]: e.target.value }))}
                     />
                   </div>
                 );
               })}
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <SimpleInput label={`Delivery Fee ${currencySymbol}`} type="number" value={formData.deliveryCharge} onChange={(v: string) => setFormData({...formData, deliveryCharge: v})} placeholder="120" />
                <div className="bg-gradient-to-br from-cyan-500/10 via-indigo-500/10 to-emerald-500/10 dark:from-dragon-cyan/15 dark:to-indigo-500/15 p-3.5 rounded-2xl border border-cyan-500/25 dark:border-dragon-cyan/20 flex items-center justify-between sm:justify-center sm:flex-col shadow-sm">
                   <div className="text-[9px] font-black text-cyan-700 dark:text-dragon-cyan uppercase tracking-widest sm:mb-1">Total Bill</div>
                   <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-none">
                     {currencySymbol}{(Number(formData.sellPrice) || Number(formData.deliveryCharge)) ? ((Number(formData.sellPrice) || 0) + (Number(formData.deliveryCharge) || 0)).toLocaleString() : '00'}
                   </div>
                </div>
             </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="w-full sm:flex-1 py-3.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 active:scale-95 transition-all rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-600 dark:text-gray-400 border border-slate-200 dark:border-white/10 cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="button"
              onClick={() => {
                const missing = fields.find(f => f.required && !dynamicFields[f.key]);
                if (missing) {
                  alert(`Please fill in ${missing.labelEn} correctly.`);
                  return;
                }
                const nameVal = dynamicFields['name'] || '';
                const phoneVal = dynamicFields['phone'] || '';
                const aggregatedAddress = getAggregatedAddress(country, dynamicFields);

                onSubmit({
                  ...formData,
                  customerName: nameVal,
                  customerPhone: phoneVal,
                  customerAddress: aggregatedAddress,
                  buyPrice: Number(formData.buyPrice) || 0,
                  sellPrice: Number(formData.sellPrice) || 0,
                  deliveryCharge: Number(formData.deliveryCharge) || 0,
                  quantity: Number(formData.quantity) || 1
                });
              }} 
              style={{
                color: '#dbdbdb',
                backgroundColor: '#22c638',
                paddingTop: '15px',
                height: '46px',
                width: '440px',
                fontWeight: 'bold',
                fontFamily: 'Arial',
              }}
              className="max-w-full rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-lg hover:opacity-95 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <PackageCheck size={16} />
              Send Order Card
            </button>
          </div>
        </div>
         <SmartPasteModal
           isOpen={smartPaste.isOpen}
           onClose={() => setSmartPaste(prev => ({ ...prev, isOpen: false }))}
           pastedText={smartPaste.pastedText}
           initialTargetField={smartPaste.initialTargetField}
           onApply={handleSmartPasteApply}
           country={country}
         />
      </motion.div>
    </div>
  );
}

export default CreateOrderPopup;

