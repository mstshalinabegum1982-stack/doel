import React, { useState, useMemo } from 'react';
import { 
  X, 
  Download, 
  TrendingUp, 
  Wallet, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Calendar, 
  Filter, 
  Package, 
  HelpCircle,
  FileText,
  Truck
} from 'lucide-react';
import { Order } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { transliterateBanglaToEnglish } from '../utils/bengaliTransliteration';

interface ChatReportPopupProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { uid: string; name?: string };
  otherUser: { uid: string; name?: string } | null;
  allOrders: Order[];
}

import { getOrderProfitFinances as getOrderFinances } from '../utils/orderUtils';
export { getOrderFinances };

export default function ChatReportPopup({
  isOpen,
  onClose,
  currentUser,
  otherUser,
  allOrders
}: ChatReportPopupProps) {
  const [activeTab, setActiveTab] = useState<'send-order' | 'receive-order'>('send-order');
  const [selectedMonth, setSelectedMonth] = useState<string>('all'); // '01', '02', ..., 'all'
  const [selectedYear, setSelectedYear] = useState<string>('all'); // '2025', '2026', 'all'
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());

  // Available Years inside Order Data
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    allOrders.forEach(o => {
      if (o.createdAt) {
        const y = o.createdAt.substring(0, 4);
        if (/^\d{4}$/.test(y)) {
          years.add(y);
        }
      }
    });
    // Add current and next year as fallback
    const currentYear = new Date().getFullYear().toString();
    years.add(currentYear);
    years.add((parseInt(currentYear) + 1).toString());
    return Array.from(years).sort().reverse();
  }, [allOrders]);

  // Counts for tabs
  const sendOrdersCount = useMemo(() => {
    if (!currentUser.uid) return 0;
    return allOrders.filter(o => 
      o.senderId === currentUser.uid && (!otherUser?.uid || o.receiverId === otherUser.uid)
    ).length;
  }, [allOrders, currentUser.uid, otherUser?.uid]);

  const receiveOrdersCount = useMemo(() => {
    if (!currentUser.uid) return 0;
    return allOrders.filter(o => 
      o.receiverId === currentUser.uid && (!otherUser?.uid || o.senderId === otherUser.uid)
    ).length;
  }, [allOrders, currentUser.uid, otherUser?.uid]);

  // Pre-filter by Chat Partition
  const chatFilteredOrders = useMemo(() => {
    if (!currentUser.uid) return [];
    if (activeTab === 'send-order') {
      return allOrders.filter(o => 
        o.senderId === currentUser.uid && 
        (!otherUser?.uid || o.receiverId === otherUser.uid || o.participants?.includes(otherUser.uid))
      );
    } else {
      return allOrders.filter(o => 
        o.receiverId === currentUser.uid && 
        (!otherUser?.uid || o.senderId === otherUser.uid || o.participants?.includes(otherUser.uid))
      );
    }
  }, [allOrders, activeTab, currentUser.uid, otherUser?.uid]);

  // Apply Month and Year filters and sort by createdAt descending (newest first)
  const finalFilteredOrders = useMemo(() => {
    const filtered = chatFilteredOrders.filter(o => {
      if (!o.createdAt) return false;
      const dateStr = o.createdAt; // 'YYYY-MM-DD...'
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(5, 7);

      const yearMatch = selectedYear === 'all' || year === selectedYear;
      const monthMatch = selectedMonth === 'all' || month === selectedMonth;

      return yearMatch && monthMatch;
    });

    // Sort descending by date (newest first)
    return filtered.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [chatFilteredOrders, selectedMonth, selectedYear]);

  // Dynamic calculation for stats matching selected Month / Year
  const calculatedStats = useMemo(() => {
    let todayOrdersCount = 0;
    let thisMonthOrdersCount = 0;

    const todayStr = new Date().toISOString().substring(0, 10); // 'YYYY-MM-DD'
    const thisMonthStr = new Date().toISOString().substring(0, 7); // 'YYYY-MM'

    let totalCommission = 0;
    let pendingBalance = 0;
    let earnedProfit = 0;
    let totalDeliveryCharge = 0;

    let forwardedCount = 0;
    let inboxCount = 0;

    finalFilteredOrders.forEach(o => {
      // Today / Month filters are evaluated within the filtered subset
      if (o.createdAt && o.createdAt.startsWith(todayStr)) {
        todayOrdersCount++;
      }
      if (o.createdAt && o.createdAt.startsWith(thisMonthStr)) {
        thisMonthOrdersCount++;
      }

      // Check order source
      if (o.isForwarded || o.forwardedFromId || o.forwardedToId) {
        forwardedCount++;
      } else {
        inboxCount++;
      }

      // Calculations of financial items
      const finances = getOrderFinances(o);
      const profit = finances.profit;
      
      totalDeliveryCharge += Number(o.deliveryCharge) || 0;

      // Commission: 
      // "If an order is sent to supplier's inbox by a seller, then the seller will earn commission when delivery is paid in their inbox."
      if (o.receiverId === currentUser.uid || o.senderId === currentUser.uid) {
        if (o.status === 'paid_delivery' || o.status === 'paid' || o.status === 'delivered') {
          totalCommission += profit > 0 ? profit : 0;
        } else if (o.status === 'fraud_return') {
          totalCommission -= (o.deliveryCharge || 0);
        }
      }

      // Pending Balance:
      if (['pending', 'confirmed', 'shipping'].includes(o.status)) {
        // Seller profit or normal user profit
        pendingBalance += profit;
      }

      // Profit after Delivery:
      if (o.status === 'paid' || o.status === 'paid_delivery' || o.status === 'delivered') {
        earnedProfit += profit;
      } else if (o.status === 'fraud_return') {
        earnedProfit -= (Number(o.deliveryCharge) || 0);
      }
    });

    return {
      todayCount: todayOrdersCount,
      monthCount: thisMonthOrdersCount,
      totalCommission,
      pendingBalance,
      earnedProfit,
      totalDeliveryCharge,
      forwardedCount,
      inboxCount,
      totalCount: finalFilteredOrders.length
    };
  }, [finalFilteredOrders, currentUser.uid]);

  // Toggle selection for PDF export
  const toggleSelectOrder = (id: string) => {
    const updated = new Set(selectedOrderIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedOrderIds(updated);
  };

  const toggleSelectAll = () => {
    if (selectedOrderIds.size === finalFilteredOrders.length) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(finalFilteredOrders.map(o => o.id)));
    }
  };

  // Convert Bangla or unicode text to basic ASCII form to avoid jsPDF boxes
  const sanitizeForPDF = (text: string | null | undefined): string => {
    if (!text) return 'N/A';
    return transliterateBanglaToEnglish(text);
  };

  // PDF Export Engine
  const downloadPDFReport = () => {
    try {
      const doc = new jsPDF() as any;
      
      // Determine list of orders to put in PDF (marked, or all filtered if none marked)
      const exportList = finalFilteredOrders.filter(o => 
        selectedOrderIds.size === 0 || selectedOrderIds.has(o.id)
      );

      // Cyber/Modern header
      doc.setFillColor(15, 17, 24); // Dark blue header background
      doc.rect(0, 0, 210, 45, 'F');
      
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(0, 242, 254); // Cyan color
      doc.text("DRAGON STORE AI REPORT", 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generated At: ${new Date().toLocaleString()}`, 14, 28);
      doc.text(`Account User ID: ${sanitizeForPDF(currentUser.name || currentUser.uid)}`, 14, 34);
      if (activeTab === 'send-order') {
        doc.text(`Mode: Send Orders Report`, 14, 39);
      } else {
        doc.text("Mode: Receive Orders Report", 14, 39);
      }
      if (otherUser) {
        doc.text(`Partner: ${sanitizeForPDF(otherUser.name || 'Chat User')}`, 14, 44);
      }

      // Summary Grid Panel
      doc.setFillColor(243, 244, 246); // gray backgrounds for cards
      doc.roundedRect(14, 52, 182, 42, 3, 3, 'F');
      
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      
      // Values header row
      doc.text("REPORT METRICS SUMMARY", 18, 59);
      doc.setFont("Helvetica", "normal");
      
      const monStr = selectedMonth === 'all' ? 'All Months' : `Month: ${selectedMonth}`;
      const yrStr = selectedYear === 'all' ? 'All Years' : `Year: ${selectedYear}`;
      doc.text(`Filters: ${monStr}, ${yrStr}`, 18, 65);
      
      doc.setFont("Helvetica", "bold");
      doc.text("Total Orders:", 18, 73);
      doc.setFont("Helvetica", "normal");
      doc.text(`${exportList.length} pcs`, 55, 73);
      
      doc.setFont("Helvetica", "bold");
      doc.text("Total Comission:", 18, 80);
      doc.setFont("Helvetica", "normal");
      doc.text(`BDT ${calculatedStats.totalCommission}`, 55, 80);

      doc.setFont("Helvetica", "bold");
      doc.text("Delivery Chg:", 18, 87);
      doc.setFont("Helvetica", "normal");
      doc.text(`BDT ${calculatedStats.totalDeliveryCharge}`, 55, 87);

      doc.setFont("Helvetica", "bold");
      const pendingLabel = activeTab === 'send-order' ? "My Pending Pay:" : "Partner Pending:";
      doc.text(pendingLabel, 105, 73);
      doc.setFont("Helvetica", "normal");
      doc.text(`BDT ${calculatedStats.pendingBalance}`, 142, 73);

      doc.setFont("Helvetica", "bold");
      const profitLabel = activeTab === 'send-order' ? "My Pay (Profit):" : "You Pay (Partner):";
      doc.text(profitLabel, 105, 80);
      doc.setFont("Helvetica", "normal");
      doc.text(`BDT ${calculatedStats.earnedProfit}`, 142, 80);

      // Generate items table
      const columns = ["Order ID", "Date", "Product", "Buy Price", "Sell Price", "Deliv Fee", "Commission", "Status", "Source"];
      const rows = exportList.map(o => {
        const ordId = `#${o.id.substring(0, 8).toUpperCase()}`;
        const dt = o.createdAt ? o.createdAt.substring(0, 10) : 'N/A';
        const pName = sanitizeForPDF(o.productName);
        const finances = getOrderFinances(o);
        const buy = `BDT ${finances.buyPriceTotal}`;
        const sell = `BDT ${finances.sellPriceTotal}`;
        const delChg = `BDT ${o.deliveryCharge || 0}`;
        const comm = `BDT ${finances.profit}`;
        const status = o.status.toUpperCase();
        const source = (o.isForwarded || o.forwardedFromId) ? 'FORWARDED' : 'INBOX';
        
        return [ordId, dt, pName, buy, sell, delChg, comm, status, source];
      });

      autoTable(doc, {
        head: [columns],
        body: rows,
        startY: 100,
        theme: 'striped',
        headStyles: { fillColor: [15, 17, 24], textColor: [0, 242, 254], fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2.5 },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 18 },
          2: { cellWidth: 32 },
          3: { cellWidth: 18 },
          4: { cellWidth: 18 },
          5: { cellWidth: 18 },
          6: { cellWidth: 20 },
          7: { cellWidth: 18 },
          8: { cellWidth: 20 }
        }
      });

      // Guard saving file
      const fileName = `Dragon_Report_${activeTab}_${selectedMonth}_${selectedYear}.pdf`;
      doc.save(fileName);
    } catch (e) {
      console.error("PDF generation failed:", e);
      alert("PDF download failed. Please try again.");
    }
  };

  if (!isOpen) return null;

  const months = [
    { value: 'all', label: 'All Months' },
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md overflow-hidden animate-in fade-in max-h-screen">
      <div className="chat-report-modal bg-white dark:bg-[#0b0c13] border-2 border-slate-200 dark:border-white/20 w-full max-w-4xl h-full sm:h-[85vh] rounded-3xl flex flex-col shadow-2xl overflow-hidden text-slate-900 dark:text-white">
        
        {/* Header Block */}
        <div className="chat-report-header p-4 sm:p-5 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-white dark:bg-black text-black dark:text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl flex items-center justify-center text-slate-800 dark:text-white shadow-sm">
              <FileText size={20} />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black uppercase tracking-wider text-black dark:text-white">
                Business & Partner Intelligence Report
              </h1>
              <p className="text-[10px] text-slate-600 dark:text-zinc-300 font-sans tracking-wide">
                {otherUser ? `Partner: ${otherUser.name || 'Chat User'}` : 'Store Analytics'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 border border-slate-200 dark:border-white/10 rounded-xl text-slate-700 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* View Mode Tabs */}
        <div className="px-4 pt-4 border-b border-slate-200 dark:border-white/5 flex gap-1.5 bg-slate-50/50 dark:bg-zinc-950/20">
          <button
            onClick={() => {
              setActiveTab('send-order');
              setSelectedOrderIds(new Set());
            }}
            className={`px-4 py-2.5 rounded-t-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'send-order' 
                ? 'bg-white dark:bg-dragon-cyan/10 border-t border-x border-slate-200 dark:border-dragon-cyan/30 text-cyan-600 dark:text-dragon-cyan shadow-xs' 
                : 'text-slate-500 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-300 border-t border-x border-transparent'
            }`}
          >
            Sent Orders ({sendOrdersCount})
          </button>
          <button
            onClick={() => {
              setActiveTab('receive-order');
              setSelectedOrderIds(new Set());
            }}
            className={`px-4 py-2.5 rounded-t-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'receive-order' 
                ? 'bg-white dark:bg-dragon-cyan/10 border-t border-x border-slate-200 dark:border-dragon-cyan/30 text-cyan-600 dark:text-dragon-cyan shadow-xs' 
                : 'text-slate-500 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-300 border-t border-x border-transparent'
            }`}
          >
            Received Orders ({receiveOrdersCount})
          </button>
        </div>

        {/* Filters and Search Strip */}
        <div className="p-3.5 bg-slate-50 dark:bg-zinc-950/40 border-b border-slate-200 dark:border-white/5 flex flex-wrap gap-3 items-center justify-between no-print">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Filter size={11} className="text-slate-500 dark:text-zinc-400" />
              <span className="text-[9px] font-black uppercase text-slate-500 dark:text-zinc-400 tracking-wider">Month:</span>
              <select
                value={selectedMonth}
                onChange={e => {
                  setSelectedMonth(e.target.value);
                  setSelectedOrderIds(new Set());
                }}
                className="bg-white dark:bg-[#0f111a] border border-slate-300 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white max-w-[130px] outline-none font-bold focus:border-cyan-500 dark:focus:border-dragon-cyan/50 shadow-xs"
              >
                {months.map(m => (
                  <option key={m.value} value={m.value} className="bg-white text-slate-900 dark:bg-dragon-black dark:text-white">{m.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <Calendar size={11} className="text-slate-500 dark:text-zinc-400" />
              <span className="text-[9px] font-black uppercase text-slate-500 dark:text-zinc-400 tracking-wider">Year:</span>
              <select
                value={selectedYear}
                onChange={e => {
                  setSelectedYear(e.target.value);
                  setSelectedOrderIds(new Set());
                }}
                className="bg-white dark:bg-[#0f111a] border border-slate-300 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white outline-none font-bold focus:border-cyan-500 dark:focus:border-dragon-cyan/50 shadow-xs"
              >
                <option value="all" className="bg-white text-slate-900 dark:bg-dragon-black dark:text-white">All Years</option>
                {availableYears.map(year => (
                  <option key={year} value={year} className="bg-white text-slate-900 dark:bg-dragon-black dark:text-white">{year}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={downloadPDFReport}
            className="px-4 py-2 bg-dragon-cyan/20 hover:bg-dragon-cyan text-dragon-cyan hover:text-black hover:shadow-[0_0_15px_rgba(0,242,254,0.3)] rounded-xl border border-dragon-cyan/30 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
          >
            <Download size={14} /> Download PDF ({selectedOrderIds.size === 0 ? 'All' : `${selectedOrderIds.size} Selected`})
          </button>
        </div>

        {/* Dashboard Grid & Orders List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar min-h-0 bg-[#08090e]">
          
          {/* Main Key-Value Stats Panel */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            
            {/* Today Orders */}
            <div className="glass-card p-3.5 border-white/5 bg-zinc-950/35 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-5 text-gray-400">
                <Clock size={28} />
              </div>
              <span className="text-[8px] font-extrabold text-zinc-500 uppercase tracking-widest block">Today's Orders</span>
              <span className="text-xl font-black text-white mt-1 block">{calculatedStats.todayCount} <span className="text-[10px] font-bold text-zinc-400">Pcs</span></span>
              <span className="text-[7.5px] font-bold text-zinc-400 uppercase mt-1 block">
                {activeTab === 'send-order' ? 'Sent Today' : 'Received Today'}
              </span>
            </div>

            {/* Monthly Total */}
            <div className="glass-card p-3.5 border-white/5 bg-zinc-950/35 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-5 text-gray-400">
                <Calendar size={28} />
              </div>
              <span className="text-[8px] font-extrabold text-zinc-500 uppercase tracking-widest block">Monthly Orders</span>
              <span className="text-xl font-black text-white mt-1 block">{calculatedStats.monthCount} <span className="text-[10px] font-bold text-zinc-400">Pcs</span></span>
              <span className="text-[7.5px] font-bold text-zinc-400 uppercase mt-1 block">
                {activeTab === 'send-order' ? 'Total Sent This Month' : 'Total Received This Month'}
              </span>
            </div>

            {/* Total Seller Commission */}
            <div className="glass-card p-3.5 border-white/5 bg-orange-500/5 hover:bg-orange-500/10 transition-colors relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-10 text-orange-400">
                <TrendingUp size={28} />
              </div>
              <span className="text-[8px] font-extrabold text-orange-400 uppercase tracking-widest block">Seller Commission</span>
              <span className="text-xl font-black text-white mt-1 block">৳ {calculatedStats.totalCommission.toLocaleString()}</span>
              <span className="text-[7.5px] font-bold text-zinc-400 uppercase mt-1 block">Paid after delivery</span>
            </div>

            {/* Pending Balance */}
            <div className="glass-card p-3.5 border-white/5 bg-amber-500/5 hover:bg-amber-500/10 transition-colors relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-10 text-amber-400">
                <Clock size={28} />
              </div>
              <span className="text-[8px] font-extrabold text-amber-400 uppercase tracking-widest block">
                {activeTab === 'send-order' ? 'My Pending Pay' : 'Partner Pending Pay'}
              </span>
              <span className="text-xl font-black text-white mt-1 block">৳ {calculatedStats.pendingBalance.toLocaleString()}</span>
              <span className="text-[7.5px] font-bold text-zinc-400 uppercase mt-1 block">In Processing / Transit</span>
            </div>

            {/* Delivery Profit */}
            <div className="glass-card p-3.5 border-white/5 bg-dragon-emerald/5 hover:bg-dragon-emerald/10 transition-colors relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-10 text-dragon-emerald">
                <Wallet size={28} />
              </div>
              <span className="text-[8px] font-extrabold text-dragon-emerald uppercase tracking-widest block">
                {activeTab === 'send-order' ? 'My Earnings' : 'Partner Earnings'}
              </span>
              <span className="text-xl font-black text-white mt-1 block">৳ {calculatedStats.earnedProfit.toLocaleString()}</span>
              <span className="text-[7.5px] font-bold text-zinc-400 uppercase mt-1 block">Delivered Profit</span>
            </div>

            {/* Total Delivery Charge */}
            <div className="glass-card p-3.5 border-white/5 bg-blue-500/5 hover:bg-blue-500/10 transition-colors relative overflow-hidden group col-span-2 md:col-span-1">
              <div className="absolute top-0 right-0 p-2 opacity-10 text-blue-400">
                <Truck size={28} />
              </div>
              <span className="text-[8px] font-extrabold text-blue-400 uppercase tracking-widest block">Delivery Fees</span>
              <span className="text-xl font-black text-white mt-1 block">৳ {calculatedStats.totalDeliveryCharge.toLocaleString()}</span>
              <span className="text-[7.5px] font-bold text-zinc-400 uppercase mt-1 block">Total Collected delivery fees</span>
            </div>
          </div>

          {/* Source breakdown box (Inbox vs Forwarded) */}
          <div className="p-3.5 bg-black/45 border border-white/5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans">
            <div className="flex items-center gap-4.5">
              <div>
                <span className="text-zinc-500 text-[10px] uppercase font-bold block">Order Type Analysis:</span>
                <div className="flex gap-4 mt-1">
                  <div className="flex items-center gap-1.5 text-white">
                    <span className="w-2.5 h-2.5 rounded bg-dragon-cyan shadow" />
                    <span>Forwarded: <strong className="text-dragon-cyan font-bold">{calculatedStats.forwardedCount}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-white">
                    <span className="w-2.5 h-2.5 rounded bg-dragon-purple shadow" />
                    <span>Inbox Direct: <strong className="text-dragon-purple font-bold">{calculatedStats.inboxCount}</strong></span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-[10px] bg-[#0c0d16] border border-white/10 px-3 py-2 rounded-xl text-zinc-400">
               💡 The figures above represent calculated statistics for the selected month (<strong className="text-white">{selectedMonth === 'all' ? 'All' : selectedMonth}</strong>) and year (<strong className="text-white">{selectedYear === 'all' ? 'All' : selectedYear}</strong>).
            </div>
          </div>

          {/* Orders Dynamic Table */}
          <div className="bg-[#0b0c13] border border-white/5 rounded-2xl overflow-hidden shadow-inner">
            <div className="px-4 py-3 border-b border-white/5 bg-zinc-950/40 flex justify-between items-center">
              <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-2">
                <Package size={14} className="text-dragon-cyan" /> Order Registry ({finalFilteredOrders.length})
              </h3>
              <p className="text-[9px] text-zinc-500 italic max-w-xs text-right">
                Select specific orders to generate a PDF, or leave unchecked to include all
              </p>
            </div>

            {finalFilteredOrders.length === 0 ? (
              <div className="py-14 text-center text-zinc-500 space-y-2">
                <div className="w-12 h-12 bg-white/5 border border-white/5 rounded-full flex items-center justify-center mx-auto text-zinc-600">
                  <Package size={20} />
                </div>
                <p className="text-xs font-bold font-sans">No orders found for the selected timeframe.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/5 bg-zinc-950/20 text-zinc-400 font-bold uppercase tracking-wider text-[9px] select-none">
                      <th className="py-3 px-4 w-12 text-center">
                        <input 
                          type="checkbox" 
                          checked={selectedOrderIds.size === finalFilteredOrders.length && finalFilteredOrders.length > 0} 
                          onChange={toggleSelectAll}
                          className="w-3.5 h-3.5 rounded border-white/10 bg-[#0f111a] text-dragon-cyan focus:ring-0 focus:ring-offset-0 cursor-pointer"
                        />
                      </th>
                      <th className="py-3 px-3">Order ID</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Product Name</th>
                      <th className="py-3 px-3">Customer</th>
                      <th className="py-3 px-3 text-red-400">Wholesale Price</th>
                      <th className="py-3 px-3 text-cyan-400">Retail Price</th>
                      <th className="py-3 px-3 text-amber-400">Delivery Fee</th>
                      <th className="py-3 px-3 text-dragon-emerald">Profit/Commission</th>
                      <th className="py-3 px-3">Source</th>
                      <th className="py-3 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-sans font-medium text-zinc-300">
                    {finalFilteredOrders.map((order, i) => {
                      const isSelected = selectedOrderIds.has(order.id);
                      const isForward = !!(order.isForwarded || order.forwardedFromId || order.forwardedToId);
                      
                      let statusBadge = 'bg-zinc-800 text-zinc-400';
                      if (order.status === 'paid' || order.status === 'paid_delivery' || order.status === 'delivered') {
                        statusBadge = 'bg-dragon-emerald/10 text-dragon-emerald border border-dragon-emerald/20';
                      } else if (['pending', 'confirmed', 'shipping'].includes(order.status)) {
                        statusBadge = 'bg-amber-400/10 text-amber-400 border border-amber-400/20';
                      } else if (order.status === 'fraud_return' || order.status === 'paid_return' || order.status === 'return') {
                        statusBadge = 'bg-red-500/10 text-red-500 border border-red-500/20';
                      }

                      const finances = getOrderFinances(order);
                      const buyPriceTotal = finances.buyPriceTotal;
                      const sellPriceTotal = finances.sellPriceTotal;
                      const customCommission = finances.profit;

                      return (
                        <tr 
                          key={`popup-order-${order.id}-${i}`} 
                          className={`hover:bg-white/5 transition-colors cursor-pointer ${
                            isSelected ? 'bg-dragon-cyan/5 border-l-2 border-l-dragon-cyan' : ''
                          }`}
                          onClick={() => toggleSelectOrder(order.id)}
                        >
                          <td className="py-3.5 px-4 text-center" onClick={e => e.stopPropagation()}>
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={() => toggleSelectOrder(order.id)}
                              className="w-3.5 h-3.5 rounded border-white/10 bg-[#0f111a] text-dragon-cyan focus:ring-0 focus:ring-offset-0 cursor-pointer"
                            />
                          </td>
                          <td className="py-3.5 px-3 font-mono font-bold text-gray-400 text-[10px]">
                            #{order.id.substring(0, 8).toUpperCase()}
                          </td>
                          <td className="py-3.5 px-3 text-[10px] text-zinc-400">
                            {order.createdAt ? order.createdAt.substring(0, 10) : 'N/A'}
                          </td>
                          <td className="py-3.5 px-3 max-w-[120px] truncate font-bold text-white">
                            {order.productName || 'Unnamed item'}
                          </td>
                          <td className="py-3.5 px-3 text-zinc-400 max-w-[130px] truncate">
                            {order.customerName || 'Guest Customer'}
                          </td>
                          <td className="py-3.5 px-3 text-red-400/90 font-mono text-[10.5px]">
                            ৳{buyPriceTotal}
                          </td>
                          <td className="py-3.5 px-3 text-cyan-400 font-mono font-bold text-[11px]">
                            ৳{sellPriceTotal}
                          </td>
                          <td className="py-3.5 px-3 text-amber-400 font-mono text-[11px]">
                            ৳{order.deliveryCharge || 0}
                          </td>
                          <td className="py-3.5 px-3 text-dragon-emerald font-mono font-extrabold text-[11px]">
                            ৳{customCommission}
                          </td>
                          <td className="py-3.5 px-3">
                            {isForward ? (
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-dragon-cyan/10 text-dragon-cyan border border-dragon-cyan/20">
                                Forwarded
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-dragon-purple/10 text-dragon-purple border border-dragon-purple/20">
                                Inbox
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${statusBadge}`}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer info banner */}
        <div className="p-3 border-t border-white/5 bg-zinc-950/60 flex items-center justify-between px-6 text-[9.5px] text-zinc-500 font-sans tracking-wide">
          <span>🎯 Total commission, pending balance, and delivered profit are synchronized in real-time from Firebase.</span>
          <span>Dragon Secure Platform ⚡️</span>
        </div>

      </div>
    </div>
  );
}
