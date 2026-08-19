import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Check, Trash2, HelpCircle, AlignLeft, Grid, RotateCcw } from 'lucide-react';
import { cn } from '../lib/utils';

interface SmartPasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  pastedText: string;
  initialTargetField: string; // 'name' | 'phone' | 'address'
  onApply: (data: { name: string; phone: string; address: string }) => void;
  country?: string;
}

export function SmartPasteModal({
  isOpen,
  onClose,
  pastedText,
  initialTargetField,
  onApply,
  country = 'Bangladesh'
}: SmartPasteModalProps) {
  const [activeTarget, setActiveTarget] = useState<'name' | 'phone' | 'address'>(() => {
    if (initialTargetField === 'name' || initialTargetField === 'phone' || initialTargetField === 'address') {
      return initialTargetField;
    }
    return 'name';
  });

  const [splitMode, setSplitMode] = useState<'word' | 'line'>('line');

  // Local state for the editable pasted text block
  const [localPastedText, setLocalPastedText] = useState(pastedText || '');

  // Reset local state when prop or modal state changes
  useEffect(() => {
    setLocalPastedText(pastedText || '');
  }, [pastedText, isOpen]);

  // Input states inside the helper
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  });

  // Reset inputs when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        phone: '',
        address: ''
      });
    }
  }, [isOpen]);

  // Split localPastedText into words and lines
  const lines = useMemo(() => {
    return localPastedText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }, [localPastedText]);

  const words = useMemo(() => {
    return localPastedText
      .split(/[\s,，|]+/)
      .map(w => w.trim())
      .filter(w => w.length > 0);
  }, [localPastedText]);

  // Soft pastel colors for chips
  const colors = [
    'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20',
    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20',
    'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20',
    'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20',
    'bg-pink-500/10 text-pink-400 border-pink-500/20 hover:bg-pink-500/20',
    'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20',
    'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20'
  ];

  // Helper to convert Bangla numerals to English numerals for phone numbers
  const convertBanglaNumerals = (str: string) => {
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return str.replace(/[০-৯]/g, (digit) => String(banglaDigits.indexOf(digit)));
  };

  // Heuristic Auto-detection
  const handleAutoDetect = () => {
    if (!localPastedText.trim()) return;
    
    let detectedName = '';
    let detectedPhone = '';
    const addressLines: string[] = [];

    // 1. Phone detection: look for 10-15 digit sequences (English or Bangla numerals)
    const convertedText = convertBanglaNumerals(localPastedText);
    const phoneRegex = /(?:\+880|880|0)?1[3-9]\d{8}\b|\+?[0-9\-\s]{10,15}/g;
    const matches = convertedText.match(phoneRegex);
    if (matches && matches.length > 0) {
      // Find the first valid phone-like match
      const firstPhone = matches[0].replace(/[\s\-]/g, '');
      if (firstPhone.length >= 10) {
        detectedPhone = firstPhone;
      }
    }

    // 2. Parse lines
    lines.forEach(line => {
      const cleanLine = line.trim();
      const lowerLine = cleanLine.toLowerCase();

      // Check if this line was the phone line (already handled)
      const convertedLine = convertBanglaNumerals(cleanLine).replace(/[\s\-]/g, '');
      if (detectedPhone && convertedLine.includes(detectedPhone)) {
        return; // skip phone line
      }

      // Check keywords
      const isNameLabel = /নাম|name|customer|receiver/i.test(lowerLine);
      const isPhoneLabel = /ফোন|মোবাইল|phone|mobile|contact|নাম্বার|number|whatsapp/i.test(lowerLine);
      const isAddressLabel = /ঠিকানা|address|delivery|location|মিরপুর|ঢাকা|চট্টগ্রাম|সিলেট|খুলনা|বরিশাল|রাজশাহী|রংপুর|গাজীপুর|থানা|জেলা|village|thana|district|road|house|flat/i.test(lowerLine);

      // Strip common label prefixes e.g. "নাম: আব্দুর রহমান" -> "আব্দুর রহমান"
      let strippedLine = cleanLine.replace(/^(?:নাম|ঠিকানা|ফোন|মোবাইল|মোবাইল নম্বর|যোগাযোগ|ঠিকানা:|নাম:|ফোন:|name:|address:|phone:|mobile:|contact:)\s*/i, '').trim();

      if (isPhoneLabel) {
        if (!detectedPhone) {
          const m = convertBanglaNumerals(strippedLine).match(/\d+/);
          if (m) detectedPhone = m[0];
        }
        return;
      }

      if (isNameLabel) {
        detectedName = strippedLine;
        return;
      }

      if (isAddressLabel) {
        addressLines.push(strippedLine);
        return;
      }

      // If no labels, guess by length and content
      if (cleanLine.length < 25 && !/\d{5,}/.test(cleanLine) && !detectedName) {
        detectedName = strippedLine;
      } else {
        addressLines.push(cleanLine);
      }
    });

    setFormData({
      name: detectedName || formData.name,
      phone: detectedPhone || formData.phone,
      address: addressLines.join(', ') || formData.address
    });
  };

  // Run auto-detect whenever localPastedText changes (on mount or manual edit/paste)
  useEffect(() => {
    handleAutoDetect();
  }, [localPastedText]);

  const handleChipClick = (text: string) => {
    // Strip common helper tags if clicking a line that starts with prefixes
    const cleanText = text.replace(/^(?:নাম|ঠিকানা|ফোন|মোবাইল|যোগাযোগ|ঠিকানা:|নাম:|ফোন:|name:|address:|phone:|mobile:|contact:)\s*/i, '').trim();

    setFormData(prev => {
      const currentVal = prev[activeTarget];
      const newVal = currentVal ? `${currentVal} ${cleanText}` : cleanText;
      return {
        ...prev,
        [activeTarget]: newVal
      };
    });
  };

  const handleClearField = (field: 'name' | 'phone' | 'address') => {
    setFormData(prev => ({ ...prev, [field]: '' }));
  };

  const handleReset = () => {
    setFormData({ name: '', phone: '', address: '' });
  };

  const handleApply = () => {
    onApply(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto no-print">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-2xl bg-[#0b0c10] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] my-auto"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/5 flex justify-between items-center bg-[#1f2833]/20">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-dragon-cyan/15 rounded-xl text-dragon-cyan">
              <Sparkles size={18} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-1">
                Smart Paste Helper <span className="text-dragon-cyan">⚡</span>
              </h3>
              <p className="text-[9px] text-gray-400 font-bold uppercase">স্মার্ট পেস্ট সহকারী — এক ক্লিকে ফর্ম পূরণ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-left">
          {/* Pasted text raw preview */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#a8a8b3]">Pasted Text / কপি করা লেখা:</label>
              <button
                type="button"
                onClick={handleAutoDetect}
                className="text-[9px] font-black uppercase tracking-wider text-dragon-cyan flex items-center gap-1 hover:underline"
              >
                <Sparkles size={11} /> Auto-Detect (স্বয়ংক্রিয় পূরণ)
              </button>
            </div>
            <textarea
              value={localPastedText}
              onChange={(e) => setLocalPastedText(e.target.value)}
              placeholder="এখানে আপনার কপি করা পুরো ঠিকানা বা মেসেজটি পেস্ট করুন (Paste full text/address details here...)"
              className="w-full p-3.5 bg-black/40 border border-white/10 rounded-2xl text-xs text-gray-300 font-mono h-24 overflow-y-auto outline-none focus:border-dragon-cyan transition-all resize-none"
            />
          </div>

          {/* Word / Line Picker Controls */}
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-dragon-cyan">
                Tap parts to add to active input / ক্লিক করে ঘরে বসান:
              </label>
              <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/5">
                <button
                  type="button"
                  onClick={() => setSplitMode('line')}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all",
                    splitMode === 'line' ? "bg-dragon-cyan text-black" : "text-gray-400 hover:text-white"
                  )}
                >
                  <AlignLeft size={10} /> By Line
                </button>
                <button
                  type="button"
                  onClick={() => setSplitMode('word')}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all",
                    splitMode === 'word' ? "bg-dragon-cyan text-black" : "text-gray-400 hover:text-white"
                  )}
                >
                  <Grid size={10} /> By Word
                </button>
              </div>
            </div>

            {/* Interactive chips list */}
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1 bg-[#1f2833]/10 border border-white/5 rounded-2xl">
              {splitMode === 'line' ? (
                lines.map((line, idx) => {
                  const colorClass = colors[idx % colors.length];
                  return (
                    <button
                      key={`line-${idx}`}
                      type="button"
                      onClick={() => handleChipClick(line)}
                      className={cn(
                        "px-3 py-2 border rounded-xl text-xs font-semibold transition-all active:scale-95 text-left shrink-0 break-all cursor-pointer",
                        colorClass
                      )}
                    >
                      {line}
                    </button>
                  );
                })
              ) : (
                words.map((word, idx) => {
                  const colorClass = colors[idx % colors.length];
                  return (
                    <button
                      key={`word-${idx}`}
                      type="button"
                      onClick={() => handleChipClick(word)}
                      className={cn(
                        "px-3 py-1.5 border rounded-lg text-xs font-semibold transition-all active:scale-95 cursor-pointer",
                        colorClass
                      )}
                    >
                      {word}
                    </button>
                  );
                })
              )}
            </div>
            <p className="text-[9px] text-gray-500 font-medium">
              💡 Select a field below first (marked with green dot), then tap any word/line chip to insert it.
            </p>
          </div>

          {/* Target Outputs */}
          <div className="space-y-4 p-4 bg-white/5 rounded-3xl border border-white/5">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Target Inputs / ঘরের তথ্যসমূহ</span>
              <button
                type="button"
                onClick={handleReset}
                className="text-[9px] font-black uppercase tracking-wider text-red-400 flex items-center gap-1 hover:underline"
              >
                <RotateCcw size={10} /> Clear All
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Name */}
              <div
                className={cn(
                  "p-2.5 rounded-2xl transition-all border",
                  activeTarget === 'name' ? "bg-dragon-cyan/5 border-dragon-cyan/30" : "bg-transparent border-transparent"
                )}
              >
                <div className="flex justify-between items-center mb-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveTarget('name')}
                    className="flex items-center gap-1.5 text-left"
                  >
                    <span className={cn("w-2 h-2 rounded-full", activeTarget === 'name' ? "bg-dragon-cyan animate-ping" : "bg-gray-600")} />
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-300">
                      Customer Name / ক্রেতার নাম
                    </span>
                  </button>
                  {formData.name && (
                    <button type="button" onClick={() => handleClearField('name')} className="text-gray-500 hover:text-red-400">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  onFocus={() => setActiveTarget('name')}
                  placeholder="Tap chips to fill or type name here..."
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-dragon-cyan"
                />
              </div>

              {/* Phone */}
              <div
                className={cn(
                  "p-2.5 rounded-2xl transition-all border",
                  activeTarget === 'phone' ? "bg-dragon-cyan/5 border-dragon-cyan/30" : "bg-transparent border-transparent"
                )}
              >
                <div className="flex justify-between items-center mb-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveTarget('phone')}
                    className="flex items-center gap-1.5 text-left"
                  >
                    <span className={cn("w-2 h-2 rounded-full", activeTarget === 'phone' ? "bg-dragon-cyan animate-ping" : "bg-gray-600")} />
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-300">
                      Phone Number / ফোন নম্বর
                    </span>
                  </button>
                  {formData.phone && (
                    <button type="button" onClick={() => handleClearField('phone')} className="text-gray-500 hover:text-red-400">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  onFocus={() => setActiveTarget('phone')}
                  placeholder="Tap chips to fill or type phone number here..."
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-dragon-cyan"
                />
              </div>

              {/* Address */}
              <div
                className={cn(
                  "p-2.5 rounded-2xl transition-all border",
                  activeTarget === 'address' ? "bg-dragon-cyan/5 border-dragon-cyan/30" : "bg-transparent border-transparent"
                )}
              >
                <div className="flex justify-between items-center mb-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveTarget('address')}
                    className="flex items-center gap-1.5 text-left"
                  >
                    <span className={cn("w-2 h-2 rounded-full", activeTarget === 'address' ? "bg-dragon-cyan animate-ping" : "bg-gray-600")} />
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-300">
                      Full Address / পূর্ণ ঠিকানা
                    </span>
                  </button>
                  {formData.address && (
                    <button type="button" onClick={() => handleClearField('address')} className="text-gray-500 hover:text-red-400">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  onFocus={() => setActiveTarget('address')}
                  placeholder="Tap chips to fill or type delivery address here..."
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-dragon-cyan resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-white/5 bg-[#1f2833]/10 flex flex-col sm:flex-row gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer"
          >
            Cancel (বাতিল)
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-6 py-3.5 bg-dragon-cyan text-dragon-black hover:bg-[#45f3ff] rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-dragon-cyan/25 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Check size={14} strokeWidth={3} /> Apply to Form (ফর্ম এ বসান)
          </button>
        </div>
      </motion.div>
    </div>
  );
}
