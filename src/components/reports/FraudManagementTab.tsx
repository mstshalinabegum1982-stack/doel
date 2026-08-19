import React, { useState, memo } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Plus, Trash2 } from 'lucide-react';
import { doc, deleteDoc, Firestore } from 'firebase/firestore';
import { cn } from '../../lib/utils';
import { saveToFraudBlacklist } from '../../lib/fraudDetection';

interface FraudManagementTabProps {
  db: Firestore;
  userId?: string;
  blacklistedItems: any[];
  blacklistedLoading: boolean;
}

export const FraudManagementTab = memo(function FraudManagementTab({
  db,
  userId,
  blacklistedItems,
  blacklistedLoading
}: FraudManagementTabProps) {
  const [manualBlockType, setManualBlockType] = useState<'phone' | 'token'>('phone');
  const [manualBlockValue, setManualBlockValue] = useState('');
  const [manualBlockReason, setManualBlockReason] = useState('');
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<any>(null);

  const handleAddBlacklist = async () => {
    if (!manualBlockValue.trim()) {
      alert('Please provide a value!');
      return;
    }
    if (!userId) return;

    try {
      let finalVal = manualBlockValue.trim();
      if (manualBlockType === 'phone') {
        finalVal = finalVal.replace(/\D/g, '');
        if (finalVal.length >= 10) {
          finalVal = finalVal.slice(-10);
        } else {
          alert('Please enter a valid phone number (minimum 10 digits)');
          return;
        }
      }
      
      await saveToFraudBlacklist(
        db,
        userId,
        manualBlockType,
        finalVal,
        manualBlockReason || 'Manually blacklisted',
        manualBlockType === 'phone' ? [finalVal] : [],
        manualBlockType === 'token' ? [finalVal] : []
      );

      setManualBlockValue('');
      setManualBlockReason('');
      alert('Customer successfully blacklisted!');
    } catch (err) {
      console.error(err);
      alert('Error blacklisting customer.');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-20 font-sans text-left">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Manual Block Form */}
        <div className="glass-card p-6 space-y-5 lg:col-span-1 rounded-2xl">
          <div className="border-b border-white/5 pb-3">
            <h4 className="text-[11px] font-black uppercase text-white tracking-widest">Block New Customer</h4>
            <p className="text-[9px] text-gray-500 uppercase mt-0.5 font-bold">Add to manual security filters</p>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400">Block Type (Option)</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setManualBlockType('phone'); setManualBlockValue(''); }}
                  className={cn(
                    "py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border cursor-pointer",
                    manualBlockType === 'phone' 
                      ? "bg-rose-500/20 text-rose-400 border-rose-500/40" 
                      : "bg-white/5 text-gray-400 border-transparent hover:bg-white/10"
                  )}
                >
                  Phone
                </button>
                <button
                  type="button"
                  onClick={() => { setManualBlockType('token'); setManualBlockValue(''); }}
                  className={cn(
                    "py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border border-solid cursor-pointer",
                    manualBlockType === 'token' 
                      ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/40" 
                      : "bg-white/5 text-gray-400 border-transparent hover:bg-white/10"
                  )}
                >
                  Browser Token
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400">
                {manualBlockType === 'phone' ? 'Mobile Phone Number (last 10 digits)' : 'Token ID (Browser Token)'}
              </label>
              <input
                type="text"
                placeholder={manualBlockType === 'phone' ? "e.g., 01700000000" : "e.g., a1b2c3d4e5f6g7h8"}
                value={manualBlockValue}
                onChange={(e) => setManualBlockValue(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs outline-none focus:border-rose-500 text-white font-mono"
              />
              {manualBlockType === 'phone' && (
                <p className="text-[9px] text-gray-500 leading-normal">
                  * After saving the number, a blocking filter matching the last 10 digits will be automatically created.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400">Block Reason (Description)</label>
              <textarea
                rows={2}
                placeholder="e.g., repeatedly places fake orders and cancels, does not receive..."
                value={manualBlockReason}
                onChange={(e) => setManualBlockReason(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs outline-none focus:border-rose-300 text-white leading-relaxed resize-none"
              />
            </div>

            <button
              type="button"
              onClick={handleAddBlacklist}
              className="w-full py-3 bg-rose-500 hover:brightness-110 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus size={14} /> Add to Blacklist
            </button>
          </div>
        </div>

        {/* Blacklist Items Cards */}
        <div className="glass-card p-6 space-y-4 lg:col-span-2 rounded-2xl">
          <div className="border-b border-white/10 pb-3 flex justify-between items-center">
            <div>
              <h4 className="text-[11px] font-black uppercase text-white tracking-widest">Blacklisted Customer Database</h4>
              <p className="text-[9px] text-gray-500 uppercase mt-0.5">Synchronized with landing pages & website checkouts</p>
            </div>
          </div>

          {blacklistedLoading ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-[9px] uppercase font-black text-rose-500">Loading database...</p>
            </div>
          ) : blacklistedItems.length === 0 ? (
            <div className="py-12 text-center text-gray-600 font-light italic text-xs">
              No customers are currently in the blacklist.
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {blacklistedItems.map((item, idx) => (
                <div key={`blacklist-${item.id}-${idx}`} className="p-4 bg-black/40 border border-white/5 rounded-2xl hover:border-white/10 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400 font-mono">
                        #{idx + 1}
                      </span>
                      <span className={cn(
                        "text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border",
                        item.type === 'phone' 
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20" 
                          : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                      )}>
                        {item.type === 'phone' ? 'Phone' : 'Browser Token'}
                      </span>
                      <span className="text-sm font-black text-white tracking-wider font-mono">
                        {item.value}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] text-gray-400 italic">
                        <b>Reason:</b> {item.reason || 'No reason specified'}
                      </p>
                      <p className="text-[9px] text-gray-500 font-mono">
                        <b>Blocked Date:</b> {new Date(item.blockedAt || '').toLocaleString('en-US')}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex flex-wrap gap-x-4 gap-y-1">
                      <div className="text-[9px] text-gray-500 flex items-center gap-1 font-mono">
                        <span>Associated Numbers ({item.associatedNumbers?.length || 0}):</span>
                        <span className="text-gray-400 font-bold">
                          {item.associatedNumbers?.length > 0 ? item.associatedNumbers.join(', ') : 'N/A'}
                        </span>
                      </div>
                      <div className="text-[9px] text-gray-500 flex items-center gap-1 font-mono">
                        <span>Associated Tokens ({item.associatedTokens?.length || 0}):</span>
                        <span className="text-gray-400 font-bold">
                          {item.associatedTokens?.length > 0 ? item.associatedTokens.map((t: string) => t.slice(0, 5) + '...').join(', ') : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-end shrink-0 gap-3 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-white/5">
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-black text-gray-500">Order Attempt Count</p>
                      <p className="text-lg font-black text-white font-mono mt-0.5">{item.attemptsCount || 0}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setDeleteConfirmItem(item)}
                      className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500 text-rose-500 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                      title="Unblock Blocked Entity"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Custom Unblock Confirmation Modal */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b0c10] border border-rose-500/30 rounded-3xl p-6 max-w-md w-full space-y-6 shadow-2xl shadow-rose-500/10 font-sans text-left">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                <ShieldAlert size={24} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-black uppercase tracking-wider text-white">Confirm Unblock</h3>
                <p className="text-[10px] text-gray-500 uppercase mt-0.5">Confirm Blacklist Removal</p>
              </div>
            </div>

            <div className="space-y-2 bg-black/40 border border-white/5 p-4 rounded-2xl">
              <p className="text-xs text-gray-400">Are you sure you want to remove this customer from the blacklist?</p>
              <div className="text-xs text-white font-mono space-y-1 mt-2">
                <p><b>Type:</b> {deleteConfirmItem.type === 'phone' ? 'Phone Number' : 'Browser Token'}</p>
                <p><b>Value:</b> <span className="text-rose-400 font-bold">{deleteConfirmItem.value}</span></p>
                {deleteConfirmItem.reason && <p><b>Reason:</b> {deleteConfirmItem.reason}</p>}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer text-center"
              >
                No
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const globalDocId = `global_${deleteConfirmItem.type}_${deleteConfirmItem.value}`;
                    await Promise.all([
                      deleteDoc(doc(db, 'fraud_blacklist', deleteConfirmItem.id)),
                      deleteDoc(doc(db, 'fraud_blacklist', globalDocId))
                    ]);
                    setDeleteConfirmItem(null);
                    alert('Customer successfully unblocked!');
                  } catch (e) {
                    console.error(e);
                    alert('Failed to unblock.');
                  }
                }}
                className="flex-1 py-3 bg-rose-500 hover:brightness-110 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-500/20 transition-all cursor-pointer text-center"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
});
