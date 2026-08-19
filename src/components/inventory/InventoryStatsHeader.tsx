import React from 'react';
import { Tag, Box, DollarSign } from 'lucide-react';

interface InventoryStatsHeaderProps {
  categoriesCount: number;
  itemsCount: number;
  totalValue: number;
  currencySymbol: string;
}

function InventoryStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-pink-100 shadow-[0_2px_10px_rgba(244,63,94,0.05)] flex items-center gap-3">
      <div className="p-2.5 rounded-xl bg-pink-50 border border-pink-100 shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{label}</p>
        <p className="text-sm sm:text-base font-black text-slate-800 tracking-tight truncate mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export const InventoryStatsHeader: React.FC<InventoryStatsHeaderProps> = ({
  categoriesCount,
  itemsCount,
  totalValue,
  currencySymbol
}) => {
  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      <InventoryStat 
        icon={<Tag size={18} className="text-[#f43f5e]" />} 
        label="CATEGORIES" 
        value={categoriesCount} 
      />
      <InventoryStat 
        icon={<Box size={18} className="text-[#f43f5e]" />} 
        label="TOTAL ITEMS" 
        value={itemsCount} 
      />
      <InventoryStat 
        icon={<DollarSign size={18} className="text-[#f43f5e]" />} 
        label="TOTAL VALUE" 
        value={`${currencySymbol}${totalValue.toLocaleString()}`} 
      />
    </div>
  );
};

export default InventoryStatsHeader;
