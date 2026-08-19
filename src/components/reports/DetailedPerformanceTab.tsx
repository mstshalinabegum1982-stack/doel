import React, { useState, memo } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, AlertTriangle, Filter, Calendar, ChevronDown, RotateCcw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getOrderFinances } from '../../utils/orderUtils';

interface DetailedPerformanceTabProps {
  allOrders: any[];
  currencySymbol: string;
}

export const DetailedPerformanceTab = memo(function DetailedPerformanceTab({
  allOrders,
  currencySymbol
}: DetailedPerformanceTabProps) {
  const [detailedSubTab, setDetailedSubTab] = useState<'profit' | 'return_loss'>('profit');
  const [reportsYearFilter, setReportsYearFilter] = useState<string>('all');
  const [reportsMonthFilter, setReportsMonthFilter] = useState<string>('all');
  const [reportsDateFilter, setReportsDateFilter] = useState<string>('');

  const currentFilteredData = allOrders.filter(o => {
    const isReturnedOrCancelled = ['return', 'paid_return', 'fraud_return', 'cancelled'].includes(o.status);
    if (detailedSubTab === 'profit') {
      if (isReturnedOrCancelled) return false;
    } else {
      if (!isReturnedOrCancelled) return false;
    }

    if (!o.createdAt) return false;
    const dObj = new Date(o.createdAt);
    if (isNaN(dObj.getTime())) return false;

    if (reportsYearFilter !== 'all') {
      if (dObj.getFullYear().toString() !== reportsYearFilter) return false;
    }

    if (reportsMonthFilter !== 'all') {
      const mStr = String(dObj.getMonth() + 1).padStart(2, '0');
      if (mStr !== reportsMonthFilter) return false;
    }

    if (reportsDateFilter) {
      const dayStr = o.createdAt.substring(0, 10);
      if (dayStr !== reportsDateFilter) return false;
    }

    return true;
  });

  const totalCost = currentFilteredData.reduce((acc, o) => acc + getOrderFinances(o).buyPriceTotal, 0);
  const totalSalesVal = currentFilteredData.reduce((acc, o) => acc + getOrderFinances(o).sellPriceTotal, 0);
  const totalProfitVal = currentFilteredData.reduce((acc, o) => acc + getOrderFinances(o).profit, 0);
  const totalReturnLossVal = currentFilteredData.reduce((acc, o) => acc + (o.deliveryCharge || 0), 0);
  const totalDeliveryChargeVal = currentFilteredData.reduce((acc, o) => acc + (Number(o.deliveryCharge) || 0), 0);

  const getDistrictOrCityLocal = (address: string) => {
    if (!address) return "N/A";
    const parts = address.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length > 0) {
      return parts[parts.length - 1] || parts[0];
    }
    return address;
  };

  return (
    <motion.div key="detailed_reports" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-20 font-sans text-left">
      {/* Header & Sub Tabs Switcher */}
      <div className="glass-card p-6 space-y-6 rounded-2xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-4 gap-4">
          <div>
            <h3 className="text-sm font-black text-dragon-cyan uppercase tracking-widest flex items-center gap-2">
              <TrendingUp size={18} /> Detailed Reports
            </h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Profit and return loss sheet report in 1 line across all channels</p>
          </div>
          
          {/* Two Tabs: Profit vs Return Loss */}
          <div className="flex bg-black/60 p-1 rounded-xl border border-white/5 font-sans">
            <button
              type="button"
              onClick={() => setDetailedSubTab('profit')}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer",
                detailedSubTab === 'profit' ? "bg-dragon-cyan text-dragon-black shadow-lg shadow-dragon-cyan/10" : "text-gray-400 hover:text-white"
              )}
            >
              <TrendingUp size={14} /> Profit
            </button>
            <button
              type="button"
              onClick={() => setDetailedSubTab('return_loss')}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer",
                detailedSubTab === 'return_loss' ? "bg-rose-600 text-white shadow-lg shadow-rose-600/10" : "text-gray-400 hover:text-white"
              )}
            >
              <AlertTriangle size={14} className={detailedSubTab === 'return_loss' ? "animate-pulse" : ""} /> Return Loss
            </button>
          </div>
        </div>

        {/* Date & year filter controls */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-2">
            <Filter size={12} className="text-dragon-cyan" /> Filter Panel
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* Filter Year */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Filter by Year</label>
              <select
                value={reportsYearFilter}
                onChange={(e) => setReportsYearFilter(e.target.value)}
                className="w-full bg-[#030305] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:border-dragon-cyan outline-none"
              >
                <option value="all">All Years</option>
                {Array.from(new Set(allOrders.map(o => o.createdAt ? new Date(o.createdAt).getFullYear().toString() : ''))).filter(Boolean).sort().reverse().map(yr => (
                  <option key={yr} value={yr}>Year {yr}</option>
                ))}
                {!allOrders.some(o => o.createdAt) && (
                  <>
                    <option value="2026">Year 2026</option>
                    <option value="2025">Year 2025</option>
                  </>
                )}
              </select>
            </div>

            {/* Filter Month */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Filter by Month</label>
              <select
                value={reportsMonthFilter}
                onChange={(e) => setReportsMonthFilter(e.target.value)}
                className="w-full bg-[#030305] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:border-dragon-cyan outline-none"
              >
                <option value="all">All Months</option>
                <option value="01">January</option>
                <option value="02">February</option>
                <option value="03">March</option>
                <option value="04">April</option>
                <option value="05">May</option>
                <option value="06">June</option>
                <option value="07">July</option>
                <option value="08">August</option>
                <option value="09">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
            </div>

            {/* Specific Date Picker */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Specific Date</label>
              <div className="relative flex items-center w-full">
                <input
                  type="date"
                  value={reportsDateFilter}
                  onChange={(e) => setReportsDateFilter(e.target.value)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                  aria-label="Specific date filter"
                />
                <div className="flex items-center justify-between w-full bg-[#030305] dark:bg-[#030305] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white pointer-events-none select-none">
                  <span className="flex items-center gap-2">
                    <Calendar size={14} className="text-dragon-cyan" />
                    {reportsDateFilter ? reportsDateFilter : 'Select Date'}
                  </span>
                  <ChevronDown size={12} className="text-gray-400" />
                </div>
              </div>
            </div>

            {/* Reset Filters button */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  setReportsYearFilter('all');
                  setReportsMonthFilter('all');
                  setReportsDateFilter('');
                }}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white rounded-xl py-2 px-3 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw size={14} /> Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Contextual Stats overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="glass-card p-5 border border-white/5 bg-black/40 rounded-2xl col-span-2 sm:col-span-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Filtered Orders</p>
            <p className="text-xl font-black text-white">{currentFilteredData.length}</p>
            <p className="text-[9px] text-gray-500 font-bold mt-1 uppercase">Total filter count</p>
          </div>
          <div className="glass-card p-5 border border-white/5 bg-black/40 rounded-2xl">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Total Cost (Cost Worth)</p>
            <p className="text-xl font-black text-indigo-400 font-mono">{currencySymbol}{totalCost.toLocaleString()}</p>
            <p className="text-[9px] text-gray-500 font-bold mt-1 uppercase">Cumulative buy price</p>
          </div>
          <div className="glass-card p-5 border border-white/5 bg-black/40 rounded-2xl">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Total Sales (Sales Worth)</p>
            <p className="text-xl font-black text-cyan-400 font-mono">{currencySymbol}{totalSalesVal.toLocaleString()}</p>
            <p className="text-[9px] text-gray-500 font-bold mt-1 uppercase">Cumulative sell price</p>
          </div>
          <div className="glass-card p-5 border border-amber-500/15 bg-amber-500/5 rounded-2xl">
            <p className="text-[10px] font-black text-amber-400 uppercase tracking-wider mb-1">Delivery Charge Total</p>
            <p className="text-xl font-black text-amber-400 font-mono">{currencySymbol}{totalDeliveryChargeVal.toLocaleString()}</p>
            <p className="text-[9px] text-gray-500 font-bold mt-1 uppercase">Total Delivery Charged</p>
          </div>
          {detailedSubTab === 'profit' ? (
            <div className="glass-card p-5 border border-emerald-500/25 bg-emerald-500/5 rounded-2xl animate-in zoom-in-95 duration-300 col-span-2 sm:col-span-1">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-wider mb-1">Net Profit (Profit Cash)</p>
              <p className="text-xl font-black text-emerald-400 font-mono">+{currencySymbol}{totalProfitVal.toLocaleString()}</p>
              <p className="text-[9px] text-emerald-400/50 font-bold mt-1 uppercase">Net profit margin</p>
            </div>
          ) : (
            <div className="glass-card p-5 border border-rose-500/25 bg-rose-500/5 rounded-2xl animate-in zoom-in-95 duration-300 col-span-2 sm:col-span-1">
              <p className="text-[10px] font-black text-rose-400 uppercase tracking-wider mb-1">Total Return Loss</p>
              <p className="text-xl font-black text-rose-500 font-mono">-{currencySymbol}{totalReturnLossVal.toLocaleString()}</p>
              <p className="text-[9px] text-rose-400/50 font-bold mt-1 uppercase">Total returned charges</p>
            </div>
          )}
        </div>

        {/* Detailed Table */}
        <div className="glass-card p-6 space-y-4 rounded-2xl">
          <div className="flex justify-between items-center pb-2">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">
              {detailedSubTab === 'profit' ? 'Successful Profit Report Sheet' : 'Logistics & Return Loss Sheet'}
            </h4>
            <span className="text-[9px] bg-white/5 border border-white/10 text-gray-400 font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">
              1-Line Detailed Info
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#06060c]/85 custom-scrollbar shadow-2xl">
            <table className="w-full text-left border-collapse min-w-[1300px]">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                  <th className="p-3 text-center">Order No.</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Phone Number</th>
                  <th className="p-3">District/City</th>
                  <th className="p-3">Product Name</th>
                  <th className="p-3 text-right">Cost Price</th>
                  <th className="p-3 text-right bg-cyan-900/10 text-dragon-cyan">Sales Price (Actual)</th>
                  <th className="p-3 text-right text-gray-300 border-l border-white/5">Catalog/Wholesale</th>
                  <th className="p-3 text-right text-gray-300">Landing Page</th>
                  <th className="p-3 text-right text-gray-300">Website</th>
                  <th className="p-3 text-right text-amber-400 bg-amber-500/5">Delivery Charge</th>
                  <th className="p-3 text-right font-bold text-white bg-white/5">
                    {detailedSubTab === 'profit' ? 'Profit' : 'Return Loss'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-[11px] font-bold text-gray-300">
                {currentFilteredData.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="py-20 text-center text-gray-500 italic font-light text-xs">
                      No order data found for this filter.
                    </td>
                  </tr>
                ) : (
                  currentFilteredData.map((order, idx) => {
                    const buyPrice = Number(order.buyPrice) || 0;
                    const sellPrice = Number(order.sellPrice) || 0;
                    const qty = Number(order.quantity) || 1;
                    const totalBuy = buyPrice * qty;
                    const totalSell = sellPrice * qty;
                    const profit = totalSell - totalBuy;
                    
                    const isWebsiteObj = order.platform === 'website';
                    const isLandingPageObj = order.platform === 'landing_page';
                    const isCatalogObj = !isWebsiteObj && !isLandingPageObj;

                    const deliveryCharge = Number(order.deliveryCharge) || 0;
                    const returnLossAmount = Number(order.deliveryCharge) || 0;

                    return (
                      <tr key={`reports-row-${order.id || 'row'}-${idx}`} className="hover:bg-white/[0.02] transition-colors whitespace-nowrap">
                        <td className="p-3 text-center font-mono text-[10px] text-gray-500">
                          #{order.id ? order.id.substring(0, 8).toUpperCase() : idx}
                        </td>
                        <td className="p-3 text-gray-400 font-mono">
                          {order.createdAt ? order.createdAt.substring(0, 10) : '-'}
                        </td>
                        <td className="p-3 font-black text-white">
                          {order.customerName || 'N/A'}
                        </td>
                        <td className="p-3 font-mono text-gray-300">
                          {order.customerPhone || 'N/A'}
                        </td>
                        <td className="p-3 text-gray-400 max-w-[150px] truncate" title={order.customerAddress}>
                          {getDistrictOrCityLocal(order.customerAddress)}
                        </td>
                        <td className="p-3 text-gray-300 font-bold max-w-[180px] truncate" title={order.productName}>
                          {order.productName || 'N/A'}
                        </td>
                        <td className="p-3 text-right font-mono text-gray-400">
                          {currencySymbol}{totalBuy.toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-mono font-black text-white bg-cyan-950/20">
                          {currencySymbol}{totalSell.toLocaleString()}
                        </td>
                        
                        <td className="p-3 text-right font-mono text-amber-450/90 border-l border-white/10 bg-amber-500/5">
                          {isCatalogObj ? `${currencySymbol}${sellPrice.toLocaleString()}` : '-'}
                        </td>
                        <td className="p-3 text-right font-mono text-emerald-450/90 bg-emerald-500/5">
                          {isLandingPageObj ? `${currencySymbol}${sellPrice.toLocaleString()}` : '-'}
                        </td>
                        <td className="p-3 text-right font-mono text-cyan-450/90 bg-cyan-500/5">
                          {isWebsiteObj ? `${currencySymbol}${sellPrice.toLocaleString()}` : '-'}
                        </td>

                        <td className="p-3 text-right font-mono font-semibold text-amber-400 bg-amber-500/5">
                          {currencySymbol}{deliveryCharge.toLocaleString()}
                        </td>
                        
                        <td className="p-3 text-right bg-white/5">
                          {detailedSubTab === 'profit' ? (
                            <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black font-mono">
                              +{currencySymbol}{profit.toLocaleString()}
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 font-black font-mono">
                              -{currencySymbol}{returnLossAmount.toLocaleString()}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
