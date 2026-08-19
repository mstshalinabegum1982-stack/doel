import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Wallet, 
  CheckCircle, 
  AlertCircle, 
  Calendar, 
  Filter, 
  TrendingUp, 
  Clock,
  ChevronDown,
  ArrowLeft,
  Settings,
  Plus,
  Trash2,
  CreditCard
} from 'lucide-react';
import { Message } from '../types';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface WithdrawalHistoryPanelProps {
  onClose: () => void;
  currentUser: { uid: string; name?: string };
  otherUser: { uid: string; name?: string } | null;
  messages: Message[];
  myProfit: number;
  onPayRequest: (messageId: string, trxId: string) => Promise<void>;
}

export default function WithdrawalHistoryPanel({
  onClose,
  currentUser,
  otherUser,
  messages,
  myProfit,
  onPayRequest
}: WithdrawalHistoryPanelProps) {
  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState<'history' | 'settings'>('history');

  // Accounts state
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [newAccountFormData, setNewAccountFormData] = useState({
    bankName: '',
    accountName: '',
    accountNumber: ''
  });

  // State for deleting saved account & showing toasts
  const [accountToDelete, setAccountToDelete] = useState<any | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Auto-dismiss toasts
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // Load saved accounts in real-time
  useEffect(() => {
    if (!currentUser?.uid) return;
    const q = query(
      collection(db, 'users', currentUser.uid, 'payment_accounts'),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAccounts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoadingAccounts(false);
    }, (err) => {
      console.error("Error loading accounts:", err);
      setLoadingAccounts(false);
    });
    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Save new account
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountFormData.accountNumber.trim() || !newAccountFormData.accountName.trim() || !newAccountFormData.bankName.trim()) {
      setShowToast({
        message: "Please fill in method name, account title, and account number!",
        type: 'error'
      });
      return;
    }
    
    setIsAddingAccount(true);
    try {
      await addDoc(collection(db, 'users', currentUser.uid, 'payment_accounts'), {
        bankName: newAccountFormData.bankName.trim(),
        accountName: newAccountFormData.accountName.trim(),
        accountNumber: newAccountFormData.accountNumber.trim(),
        createdAt: new Date().toISOString()
      });
      setNewAccountFormData({
        bankName: '',
        accountName: '',
        accountNumber: ''
      });
      setShowToast({
        message: "Account details saved successfully!",
        type: 'success'
      });
    } catch (err: any) {
      console.error("Failed to save account:", err);
      setShowToast({
        message: "Failed to save: " + err.message,
        type: 'error'
      });
    } finally {
      setIsAddingAccount(false);
    }
  };

  // Delete saved account trigger
  const handleDeleteAccount = (account: any) => {
    setAccountToDelete(account);
  };

  const handleDeleteAccountConfirmed = async () => {
    if (!accountToDelete) return;
    setIsDeletingAccount(true);
    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'payment_accounts', accountToDelete.id));
      setShowToast({
        message: `Account ${accountToDelete.bankName} (${accountToDelete.accountNumber}) was deleted successfully!`,
        type: 'success'
      });
      setAccountToDelete(null);
    } catch (err: any) {
      console.error("Failed to delete account:", err);
      setShowToast({
        message: "Failed to delete: " + err.message,
        type: 'error'
      });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // Filters
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(''); // YYYY-MM-DD
  
  // For approving requests
  const [approvingMsgId, setApprovingMsgId] = useState<string | null>(null);
  const [trxIdInput, setTrxIdInput] = useState<string>('');

  // Extract all payment/withdrawal request messages for this chat
  const allWithdrawals = useMemo(() => {
    return messages.filter(m => m.type === 'payment_request');
  }, [messages]);

  // Derived available years for filters
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    allWithdrawals.forEach(w => {
      if (w.createdAt) {
        const yr = w.createdAt.substring(0, 4);
        if (/^\d{4}$/.test(yr)) years.add(yr);
      }
    });
    // Ensure current year is always an option
    years.add(new Date().getFullYear().toString());
    return Array.from(years).sort().reverse();
  }, [allWithdrawals]);

  // Apply filters to withdrawals
  const filteredWithdrawals = useMemo(() => {
    return allWithdrawals.filter(w => {
      if (!w.createdAt) return false;
      const dateStr = w.createdAt; // 'YYYY-MM-DD...'
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(5, 7); // '01'-'12'
      const dateOnly = dateStr.substring(0, 10); // 'YYYY-MM-DD'

      const yearMatch = selectedYear === 'all' || year === selectedYear;
      const monthMatch = selectedMonth === 'all' || month === selectedMonth;
      const dateMatch = !selectedDate || dateOnly === selectedDate;

      return yearMatch && monthMatch && dateMatch;
    });
  }, [allWithdrawals, selectedYear, selectedMonth, selectedDate]);

  // Statistics for Current User
  const stats = useMemo(() => {
    const myHistory = allWithdrawals.filter(w => w.senderId === currentUser.uid);
    const totalTimes = myHistory.length;
    
    let totalSuccess = 0;
    let totalPending = 0;

    myHistory.forEach(w => {
      const amt = Number(w.paymentData?.amount || 0);
      if (w.paymentData?.status === 'paid') {
        totalSuccess += amt;
      } else {
        totalPending += amt;
      }
    });

    return {
      totalTimes,
      totalSuccess,
      totalPending
    };
  }, [allWithdrawals, currentUser.uid]);

  // Process approval
  const handleApprove = async (msgId: string) => {
    if (!trxIdInput.trim()) {
      alert("Please enter Transaction ID (Trx ID)!");
      return;
    }
    try {
      await onPayRequest(msgId, trxIdInput);
      setApprovingMsgId(null);
      setTrxIdInput('');
      alert("Withdrawal approved successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to approve!");
    }
  };

  const formatBanglaDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="withdrawal-panel-container flex-1 flex flex-col bg-[#08090e] h-full overflow-hidden no-print animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Upper Navigation Indicator as requested "Report on one line" & Back Button */}
      <div className="px-4 py-3 bg-[#0c0d15] border-b border-white/5 flex items-center justify-between pointer-events-auto shrink-0">
        <div className="flex items-center gap-2">
          <button 
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl border border-white/5 text-[11px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer"
          >
            <ArrowLeft size={14} className="text-dragon-cyan" /> Back to Chat
          </button>
          <div className="h-4 w-[1px] bg-white/10 mx-1 hidden sm:block" />
          <div className="hidden sm:flex items-center gap-2 text-zinc-400">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#00f2fe]">Withdrawals & Transaction History</span>
          </div>
        </div>
        
        {/* Total stats counters on header line */}
        <div className="flex items-center gap-4 text-right">
          <div className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">
            Total Withdrawals: <span className="text-white font-black">{stats.totalTimes} times</span>
          </div>
        </div>
      </div>

      {/* Top compact metrics strip */}
      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 bg-zinc-950/20 border-b border-white/5 shrink-0">
        <div className="glass-card p-3 border-dragon-cyan/20 bg-dragon-cyan/5">
          <div className="flex items-center gap-1.5 mb-1 text-dragon-cyan text-[9px] font-black uppercase tracking-wider">
            <TrendingUp size={11} /> My Income
          </div>
          <div className="text-lg font-black text-white">৳{myProfit.toLocaleString()}</div>
        </div>

        <div className="glass-card p-3 border-purple-500/25 bg-purple-500/5">
          <div className="flex items-center gap-1.5 mb-1 text-purple-400 text-[9px] font-black uppercase tracking-wider">
            <Clock size={11} /> Withdraws Count
          </div>
          <div className="text-lg font-black text-white">{stats.totalTimes} times</div>
        </div>

        <div className="glass-card p-3 border-dragon-emerald/20 bg-dragon-emerald/5">
          <div className="flex items-center gap-1.5 mb-1 text-dragon-emerald text-[9px] font-black uppercase tracking-wider">
            <CheckCircle size={11} /> Success Withdrawals
          </div>
          <div className="text-lg font-black text-white">৳{stats.totalSuccess.toLocaleString()}</div>
        </div>

        <div className="glass-card p-3 border-amber-500/25 bg-amber-500/5">
          <div className="flex items-center gap-1.5 mb-1 text-amber-400 text-[9px] font-black uppercase tracking-wider">
            <AlertCircle size={11} /> Pending Amount
          </div>
          <div className="text-lg font-black text-white">৳{stats.totalPending.toLocaleString()}</div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="bg-[#0b0c15] border-b border-white/5 flex gap-1 shrink-0 px-4">
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={cn(
            "py-3 px-4 text-[10px] font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 cursor-pointer",
            activeTab === 'history' 
              ? "border-dragon-cyan text-dragon-cyan font-black" 
              : "border-transparent text-gray-500 hover:text-gray-300"
          )}
        >
          <Wallet size={13} /> Transaction Reports
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={cn(
            "py-3 px-4 text-[10px] font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 cursor-pointer",
            activeTab === 'settings' 
              ? "border-dragon-cyan text-dragon-cyan font-black" 
              : "border-transparent text-gray-500 hover:text-gray-300"
          )}
        >
          <Settings size={13} /> Account Settings
        </button>
      </div>

      {activeTab === 'history' ? (
        <>
          {/* Control panel & Filter Strip */}
          <div className="px-4 py-3 bg-[#0a0b12] border-b border-white/5 flex flex-wrap gap-4 items-center justify-between shrink-0">
            <h4 className="text-[10px] sm:text-xs font-black text-dragon-cyan uppercase tracking-wider flex items-center gap-2">
              <Wallet size={14} className="text-dragon-emerald animate-pulse" /> Transaction Details Ledger 
              <span className="text-[9px] px-2 py-0.5 bg-white/5 border border-white/10 rounded-full font-bold text-gray-400 font-mono">
                {filteredWithdrawals.length} record(s) found
              </span>
            </h4>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 text-[9px] text-slate-700 dark:text-gray-400 bg-slate-100 dark:bg-white/5 px-2 py-1.5 rounded-lg border border-slate-300 dark:border-white/5 font-bold">
                <Filter size={10} /> Filter:
              </div>
              
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-white dark:bg-[#121321] border border-slate-300 dark:border-white/10 rounded-lg text-[10px] text-slate-900 dark:text-white py-1.5 px-2.5 outline-none font-bold focus:border-dragon-cyan/50 shadow-sm dark:shadow-none"
              >
                <option value="all" className="bg-white text-slate-900 dark:bg-[#121321] dark:text-white">All Years</option>
                {availableYears.map(yr => (
                  <option key={yr} value={yr} className="bg-white text-slate-900 dark:bg-[#121321] dark:text-white">{yr}</option>
                ))}
              </select>

              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-white dark:bg-[#121321] border border-slate-300 dark:border-white/10 rounded-lg text-[10px] text-slate-900 dark:text-white py-1.5 px-2.5 outline-none font-bold focus:border-dragon-cyan/50 shadow-sm dark:shadow-none"
              >
                <option value="all" className="bg-white text-slate-900 dark:bg-[#121321] dark:text-white">All Months</option>
                <option value="01" className="bg-white text-slate-900 dark:bg-[#121321] dark:text-white">January</option>
                <option value="02" className="bg-white text-slate-900 dark:bg-[#121321] dark:text-white">February</option>
                <option value="03" className="bg-white text-slate-900 dark:bg-[#121321] dark:text-white">March</option>
                <option value="04" className="bg-white text-slate-900 dark:bg-[#121321] dark:text-white">April</option>
                <option value="05" className="bg-white text-slate-900 dark:bg-[#121321] dark:text-white">May</option>
                <option value="06" className="bg-white text-slate-900 dark:bg-[#121321] dark:text-white">June</option>
                <option value="07" className="bg-white text-slate-900 dark:bg-[#121321] dark:text-white">July</option>
                <option value="08" className="bg-white text-slate-900 dark:bg-[#121321] dark:text-white">August</option>
                <option value="09" className="bg-white text-slate-900 dark:bg-[#121321] dark:text-white">September</option>
                <option value="10" className="bg-white text-slate-900 dark:bg-[#121321] dark:text-white">October</option>
                <option value="11" className="bg-white text-slate-900 dark:bg-[#121321] dark:text-white">November</option>
                <option value="12" className="bg-white text-slate-900 dark:bg-[#121321] dark:text-white">December</option>
              </select>

              <div className="relative inline-flex items-center">
                <input 
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                  aria-label="Filter by date"
                />
                <div className="flex items-center gap-1.5 bg-white dark:bg-[#121321] border border-slate-300 dark:border-white/20 rounded-lg text-[10px] text-slate-900 dark:text-white py-1.5 px-2.5 font-bold shadow-sm dark:shadow-none pointer-events-none select-none hover:border-dragon-cyan/50 transition-colors">
                  <Calendar size={12} className="text-dragon-cyan shrink-0" />
                  <span className="truncate max-w-[100px]">
                    {selectedDate ? selectedDate : 'Select Date'}
                  </span>
                  <ChevronDown size={10} className="text-slate-400 dark:text-gray-400 shrink-0 ml-0.5" />
                </div>
              </div>

              {(selectedYear !== 'all' || selectedMonth !== 'all' || selectedDate !== '') && (
                <button
                  onClick={() => { setSelectedYear('all'); setSelectedMonth('all'); setSelectedDate(''); }}
                  className="text-[9px] font-black text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 bg-rose-100 dark:bg-rose-500/10 px-2.5 py-1.5 rounded-lg border border-rose-300 dark:border-rose-500/20 shadow-sm"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Main Ledger Table - Compact representation */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div className="w-full overflow-x-auto rounded-xl border border-white/5 bg-zinc-950/40">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[9px] font-black uppercase text-gray-500 bg-zinc-950/60 sticky top-0 md:relative">
                    <th className="py-3 px-3 text-left w-12">Sl No.</th>
                    <th className="py-3 px-3 text-left">Date & Time</th>
                    <th className="py-3 px-3 text-left">Withdrawer</th>
                    <th className="py-3 px-3 text-left">Method</th>
                    <th className="py-3 px-3 text-left">Account Number</th>
                    <th className="py-3 px-3 text-right">Amount (৳)</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {filteredWithdrawals.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-xs text-gray-550 font-bold uppercase tracking-wider">
                        No withdrawal or transaction data found.
                      </td>
                    </tr>
                  ) : (
                    filteredWithdrawals.map((w, idx) => {
                      const isMe = w.senderId === currentUser.uid;
                      const showApproveInline = !isMe && w.paymentData?.status !== 'paid';

                      return (
                        <React.Fragment key={`withdrawal-row-${w.id || 'w'}-${idx}`}>
                          {/* One-Line Row Layout */}
                          <tr className="text-xs hover:bg-white/[0.015] transition-colors">
                            <td className="py-3 px-3 font-mono text-gray-500">{idx + 1}</td>
                            <td className="py-3 px-3 font-mono text-gray-300 whitespace-nowrap">
                              {formatBanglaDate(w.createdAt)}
                            </td>
                            <td className="py-3 px-3 font-sans">
                              <span className={`inline-block px-2 py-0.5 rounded text-[8.5px] font-extrabold uppercase ${
                                isMe ? "bg-purple-500/10 text-purple-300" : "bg-[#00f2fe]/10 text-[#00f2fe]"
                              }`}>
                                {isMe ? "Me" : otherUser?.name || "Other Party"}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-bold text-white whitespace-nowrap">
                              {w.paymentData?.bankName || 'bKash'}
                            </td>
                            <td className="py-3 px-3 font-mono text-gray-400 whitespace-nowrap">
                              {w.paymentData?.accountNumber || '---'}
                            </td>
                            <td className="py-3 px-3 text-right font-black text-white font-mono whitespace-nowrap">
                              ৳{Number(w.paymentData?.amount || 0).toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              {w.paymentData?.status === 'paid' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#10b981]/15 text-[#10b981] rounded-full text-[9px] font-black uppercase tracking-wider border border-[#10b981]/25">
                                  <CheckCircle size={10} /> Success
                                </span>
                              ) : (
                                <div className="flex items-center justify-center gap-2">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-500/15 text-amber-400 rounded-full text-[9px] font-black uppercase tracking-wider border border-amber-500/25">
                                    <Clock size={10} /> Pending
                                  </span>
                                  {w.senderId === currentUser.uid && (
                                    <button 
                                      onClick={async () => {
                                        if (confirm(`Are you sure you want to cancel and delete your pending withdrawal request of ৳${w.paymentData?.amount || 0}?`)) {
                                          try {
                                            await updateDoc(doc(db, `chats/${w.chatId}/messages`, w.id), {
                                              type: 'deleted',
                                              text: 'Withdrawal request cancelled',
                                              updatedAt: new Date().toISOString()
                                            });
                                            setShowToast({ message: 'Pending withdrawal request cancelled successfully.', type: 'success' });
                                          } catch (err: any) {
                                            setShowToast({ message: 'Failed to cancel request: ' + err.message, type: 'error' });
                                          }
                                        }
                                      }}
                                      className="px-2 py-1 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white text-[9px] font-black uppercase rounded-md border border-red-500/30 transition-all cursor-pointer shadow-sm flex items-center gap-1"
                                    >
                                      <Trash2 size={10} /> Cancel
                                    </button>
                                  )}
                                  {showApproveInline && approvingMsgId !== w.id && (
                                    <button 
                                      onClick={() => {
                                        setApprovingMsgId(w.id || null);
                                        setTrxIdInput('');
                                      }}
                                      className="px-2 py-1 bg-dragon-emerald/10 hover:bg-dragon-emerald hover:text-dragon-black text-[9px] font-black uppercase rounded-md border border-dragon-emerald/30 transition-all cursor-pointer shadow-sm shadow-dragon-emerald/5"
                                    >
                                      Approve
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>

                          {/* Approval Drawer for the specific transaction */}
                          {approvingMsgId === w.id && (
                            <tr className="bg-dragon-emerald/5 border-l-2 border-dragon-emerald">
                              <td colSpan={7} className="p-3">
                                <div className="flex flex-col sm:flex-row items-center gap-3 justify-between bg-black/60 p-3 rounded-xl border border-dragon-emerald/20">
                                  <div className="text-[10px] text-dragon-emerald font-black uppercase tracking-wider flex items-center gap-1.5">
                                    <AlertCircle size={12} className="animate-bounce" /> Approve Withdrawal Request
                                  </div>
                                  <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <input 
                                      type="text"
                                      placeholder="Enter TRX ID"
                                      value={trxIdInput}
                                      onChange={(e) => setTrxIdInput(e.target.value)}
                                      className="bg-black border border-white/10 rounded-lg py-1.5 px-3 text-xs outline-none text-white w-full sm:w-52 placeholder-gray-600 focus:border-dragon-emerald/50 font-mono"
                                    />
                                    <button 
                                      onClick={() => handleApprove(w.id || '')}
                                      className="px-4 py-2 bg-dragon-emerald text-dragon-black font-black text-[10px] uppercase rounded-lg shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                                    >
                                      Confirm
                                    </button>
                                    <button 
                                      onClick={() => setApprovingMsgId(null)}
                                      className="px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-400 font-bold text-[10px] uppercase rounded-lg border border-white/10 cursor-pointer whitespace-nowrap"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}

                          {/* Transaction details subtitle row, kept extremely minimal for 1-line layout */}
                          {w.paymentData?.status === 'paid' && w.paymentData?.trxId && (
                            <tr className="bg-white/[0.003]">
                              <td colSpan={7} className="py-1 px-4 text-[9.5px] font-mono text-gray-500 text-left border-b border-white/[0.01]">
                                <span className="text-gray-650 uppercase font-black tracking-wider text-[8px] mr-2">TRX ID:</span> 
                                <span className="text-gray-400">{w.paymentData.trxId}</span>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-5xl mx-auto">
            
            {/* Save New Account Form */}
            <div className="lg:col-span-5 bg-[#0f101d] border border-white/5 p-6 rounded-2xl relative space-y-4">
              <div>
                <h3 className="text-xs font-black text-dragon-cyan uppercase tracking-wider mb-1">Add New Account</h3>
                <p className="text-[10px] text-gray-500">Save your mobile banking or bank account details here.</p>
              </div>
              
              <form onSubmit={handleSaveAccount} className="space-y-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-bold text-gray-400 uppercase">Payment Method (Method Name)</label>
                   <input
                     type="text"
                     required
                     value={newAccountFormData.bankName}
                     onChange={(e) => setNewAccountFormData({...newAccountFormData, bankName: e.target.value})}
                     placeholder="e.g., bKash, Nagad, Rocket or Bank"
                     className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 outline-none text-xs text-white placeholder-gray-600 focus:border-dragon-cyan/50"
                   />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Account Holder Name (Account Title)</label>
                  <input
                    type="text"
                    required
                    value={newAccountFormData.accountName}
                    onChange={(e) => setNewAccountFormData({...newAccountFormData, accountName: e.target.value})}
                    placeholder="e.g., Shagor Hossain"
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 outline-none text-xs text-white placeholder-gray-600 focus:border-dragon-cyan/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Account Number</label>
                  <input
                    type="text"
                    required
                    value={newAccountFormData.accountNumber}
                    onChange={(e) => setNewAccountFormData({...newAccountFormData, accountNumber: e.target.value})}
                    placeholder="e.g., 017XXXXXXXX or bank account number"
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 outline-none text-xs text-white placeholder-gray-600 focus:border-dragon-cyan/50 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAddingAccount || !newAccountFormData.accountName.trim() || !newAccountFormData.accountNumber.trim()}
                  className="w-full py-3.5 bg-dragon-cyan text-dragon-black rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg shadow-dragon-cyan/10 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-30 cursor-pointer"
                >
                  {isAddingAccount ? 'Saving...' : 'Save Account'} <Plus size={14} strokeWidth={2.5} />
                </button>
              </form>
            </div>

            {/* Saved Accounts List */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <h3 className="text-xs font-black text-dragon-cyan uppercase tracking-wider mb-1">Saved Accounts List ({accounts.length})</h3>
                <p className="text-[10px] text-gray-500">Your saved accounts for receiving withdrawals.</p>
              </div>

              {loadingAccounts ? (
                <div className="text-center py-10 text-xs text-gray-550 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                  Loading...
                </div>
              ) : accounts.length === 0 ? (
                <div className="bg-[#0f101d] border border-dashed border-white/10 rounded-2xl p-10 text-center space-y-2">
                  <CreditCard size={32} className="mx-auto text-gray-600 animate-pulse" />
                  <p className="text-xs text-gray-400 font-bold uppercase">No saved accounts found.</p>
                  <p className="text-[10px] text-gray-500">Save your first account using the form on the left.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {accounts.map((account, idx) => (
                    <div 
                      key={`withdrawal-account-${account.id || 'acc'}-${idx}`} 
                      className="bg-[#0f101d] border border-white/5 hover:border-dragon-cyan/20 p-4 rounded-xl flex flex-col justify-between transition-all group hover:bg-[#121325]"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={cn(
                            "inline-block px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wide border",
                            account.bankName === 'bKash' ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' :
                            account.bankName === 'Nagad' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                            account.bankName === 'Rocket' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                            account.bankName === 'Upay' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            'bg-dragon-cyan/10 text-dragon-cyan border-dragon-cyan/20'
                          )}>
                            {account.bankName}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteAccount(account)}
                            className="p-1 px-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all duration-200 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        <div>
                          <div className="text-xs font-bold text-white tracking-wide truncate">{account.accountName}</div>
                          <div className="text-[11px] font-mono font-bold text-gray-400 tracking-wider mt-0.5">{account.accountNumber}</div>
                        </div>
                      </div>

                      <div className="border-t border-white/[0.03] mt-3 pt-2 text-[8px] text-gray-500 uppercase font-black tracking-widest flex justify-between items-center">
                        <span>Saved:</span>
                        <span>{account.createdAt ? new Date(account.createdAt).toLocaleDateString('en-US', { year: '2-digit', month: 'numeric', day: 'numeric' }) : '---'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Footer warning as a minimal bar */}
      <div className="px-4 py-2.5 bg-zinc-950 border-t border-white/5 text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 shrink-0">
        <AlertCircle size={12} className="text-dragon-cyan animate-pulse" /> 
        <span>Balance settlement and profit account updates are processed upon transaction approval.</span>
      </div>

      {/* Custom Confirmation Popup Overlay for Account Deletion */}
      <AnimatePresence>
        {accountToDelete && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-[#0f111a] border border-white/10 w-full max-w-xs rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-5 text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-500">
                  <Trash2 size={24} />
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-white">Account Delete Warning</h3>
                  <p className="text-[10px] text-gray-400 leading-relaxed">Are you sure you want to delete this account detail?</p>
                </div>

                {/* Display target account details */}
                <div className="bg-zinc-950/60 p-3 rounded-xl border border-white/5 space-y-1 text-left text-[11px] font-mono">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Method:</span>
                    <span className="text-dragon-cyan font-black">{accountToDelete.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Name:</span>
                    <span className="text-white truncate max-w-[120px] font-bold">{accountToDelete.accountName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Number:</span>
                    <span className="text-gray-300 font-bold">{accountToDelete.accountNumber}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setAccountToDelete(null)}
                    className="w-full py-2 bg-white/5 border border-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer"
                  >
                    No
                  </button>
                  <button
                    type="button"
                    disabled={isDeletingAccount}
                    onClick={handleDeleteAccountConfirmed}
                    className="w-full py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center gap-1 shadow-lg shadow-red-500/15"
                  >
                    {isDeletingAccount ? "Deleting..." : "Yes"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Toast Feedback */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="absolute bottom-12 right-4 z-50 max-w-xs bg-zinc-950 border border-white/10 rounded-xl shadow-2xl p-3 flex items-start gap-2.5 backdrop-blur-md"
          >
            {showToast.type === 'success' ? (
              <CheckCircle size={15} className="text-dragon-emerald shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={15} className="text-rose-500 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="text-[10px] font-bold text-white leading-relaxed">
                {showToast.message}
              </p>
            </div>
            <button
              onClick={() => setShowToast(null)}
              className="text-zinc-500 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              <X size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
