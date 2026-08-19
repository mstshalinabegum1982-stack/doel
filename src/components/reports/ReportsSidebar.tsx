import React, { useState, memo } from 'react';
import { 
  Package, 
  Send, 
  Inbox, 
  ShoppingBag, 
  Globe, 
  TrendingUp, 
  ShieldAlert, 
  Layers, 
  ChevronRight, 
  ChevronDown 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

export function MenuSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="px-2 text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wide">{title}</h4>
      <div className="space-y-0.5">
        {children}
      </div>
    </div>
  );
}

export function MenuItem({ 
  active, 
  icon, 
  label, 
  onClick, 
  count 
}: { 
  active: boolean; 
  icon: React.ReactNode; 
  label: string; 
  onClick: () => void; 
  count?: number;
}) {
  return (
    <button 
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all group relative cursor-pointer font-sans",
        active ? "bg-cyan-500/10 dark:bg-dragon-cyan/10 text-cyan-700 dark:text-dragon-cyan font-bold" : "text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
      )}
    >
      <div className={cn(
        "p-1.5 rounded-lg transition-all shrink-0",
        active ? "bg-cyan-500/20 dark:bg-dragon-cyan/20 text-cyan-700 dark:text-dragon-cyan" : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-gray-400 group-hover:text-slate-900 dark:group-hover:text-white"
      )}>
        {icon}
      </div>
      <span className="text-[12px] font-semibold tracking-tight flex-1">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="px-2 py-0.5 bg-cyan-500/20 dark:bg-dragon-cyan/20 text-cyan-700 dark:text-dragon-cyan text-[10px] font-bold rounded-lg border border-cyan-500/30 dark:border-dragon-cyan/20">
          {count}
        </span>
      )}
      {active && <ChevronRight size={14} className={cn("ml-1 shrink-0", count ? "hidden" : "block")} />}
    </button>
  );
}

interface ExpandablePlatformMenuItemProps {
  label: string;
  icon: React.ReactNode;
  platformType: string;
  items: any[];
  getItemName: (item: any) => string;
  activeFilter: { type: string; id?: string };
  onSelect: (id?: string) => void;
  totalCount: number;
  onCountRequest?: (id: string) => number;
}

export function ExpandablePlatformMenuItem({
  label,
  icon,
  platformType,
  items,
  getItemName,
  activeFilter,
  onSelect,
  totalCount,
  onCountRequest
}: ExpandablePlatformMenuItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isActive = activeFilter.type === platformType;

  return (
    <div className="space-y-0.5">
      <button 
        type="button"
        onClick={() => {
          if (items && items.length > 0) {
            setIsOpen(!isOpen);
          }
          onSelect(undefined);
        }}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all group cursor-pointer font-sans",
          isActive && !activeFilter.id ? "bg-cyan-500/10 dark:bg-dragon-cyan/10 text-cyan-700 dark:text-dragon-cyan font-bold" : "text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
        )}
      >
        <div className={cn(
          "p-1.5 rounded-lg transition-all shrink-0",
          isActive && !activeFilter.id ? "bg-cyan-500/20 dark:bg-dragon-cyan/20 text-cyan-700 dark:text-dragon-cyan" : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-gray-400 group-hover:text-slate-900 dark:group-hover:text-white"
        )}>
          {icon}
        </div>
        <span className="text-[12px] font-semibold tracking-tight flex-1 truncate">{label}</span>
        {totalCount > 0 && (
          <span className="px-2 py-0.5 bg-cyan-500/20 dark:bg-dragon-cyan/20 text-cyan-700 dark:text-dragon-cyan text-[10px] font-bold rounded-lg border border-cyan-500/30 dark:border-dragon-cyan/20 mr-1.5">
            {totalCount}
          </span>
        )}
        {items && items.length > 0 && (
          <ChevronDown size={14} className={cn("transition-transform shrink-0", isOpen && "rotate-180")} />
        )}
      </button>

      <AnimatePresence>
        {isOpen && items && items.length > 0 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden ml-4 pl-4 border-l border-slate-200 dark:border-white/5 space-y-0.5 mt-1"
          >
            {items.map((item: any, idx: number) => {
              const item24hCount = onCountRequest?.(item.id);
              const displayName = getItemName(item);
              return (
                <button
                  key={`${platformType}-${item.id}-${idx}`}
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className={cn(
                    "w-full flex items-center justify-between text-left px-3 py-1.5 rounded-lg text-[11px] font-medium tracking-tight transition-all cursor-pointer font-sans",
                    activeFilter.id === item.id ? "text-cyan-700 dark:text-dragon-cyan bg-cyan-500/10 dark:bg-dragon-cyan/10 font-bold" : "text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200 hover:bg-slate-100 dark:hover:bg-white/5"
                  )}
                >
                  <span className="truncate flex-1 pr-2">{displayName}</span>
                  {item24hCount !== undefined && item24hCount > 0 && (
                    <span className="text-[9px] font-bold text-cyan-600 dark:text-dragon-cyan/80">+{item24hCount}</span>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ReportsSidebarProps {
  viewMode: 'orders' | 'logistics' | 'fraud' | 'detailed_reports';
  setViewMode: (mode: 'orders' | 'logistics' | 'fraud' | 'detailed_reports') => void;
  activeFilter: { type: string; id?: string };
  setActiveFilter: (filter: { type: string; id?: string }) => void;
  sentCount: number;
  receivedCount: number;
  allOrdersCount: number;
  last24HoursCount: number;
  landingPages: any[];
  websites: any[];
  directChats: any[];
  getOrders24hCountForSource: (sourceType: string, id: string) => number;
}

export const ReportsSidebar = memo(function ReportsSidebar({
  viewMode,
  setViewMode,
  activeFilter,
  setActiveFilter,
  sentCount,
  receivedCount,
  allOrdersCount,
  last24HoursCount,
  landingPages,
  websites,
  directChats,
  getOrders24hCountForSource
}: ReportsSidebarProps) {
  return (
    <div className="w-full lg:w-72 shrink-0 space-y-4 text-left">
      <div className="glass-card p-4 space-y-5 rounded-2xl">
        {/* Core Views */}
        <MenuSection title="Order Activity">
          <MenuItem 
            active={viewMode === 'orders' && activeFilter.type === 'all'} 
            icon={<Layers size={14} />} 
            label="All Active Orders" 
            count={allOrdersCount}
            onClick={() => {
              setViewMode('orders');
              setActiveFilter({ type: 'all' });
            }} 
          />
          <MenuItem 
            active={viewMode === 'orders' && activeFilter.type === '24h'} 
            icon={<Package size={14} />} 
            label="Recent (24 Hours)" 
            count={last24HoursCount}
            onClick={() => {
              setViewMode('orders');
              setActiveFilter({ type: '24h' });
            }} 
          />
          <MenuItem 
            active={viewMode === 'orders' && activeFilter.type === 'sent'} 
            icon={<Send size={14} />} 
            label="Sent Orders" 
            count={sentCount}
            onClick={() => {
              setViewMode('orders');
              setActiveFilter({ type: 'sent' });
            }} 
          />
          <MenuItem 
            active={viewMode === 'orders' && activeFilter.type === 'received'} 
            icon={<Inbox size={14} />} 
            label="Received Orders" 
            count={receivedCount}
            onClick={() => {
              setViewMode('orders');
              setActiveFilter({ type: 'received' });
            }} 
          />
        </MenuSection>

        {/* Traffic / Channel Categories */}
        <MenuSection title="Order Channels">
          <ExpandablePlatformMenuItem 
            label="Landing Pages" 
            icon={<ShoppingBag size={14} />} 
            platformType="landing_page"
            items={landingPages}
            getItemName={(p) => p.title || p.slug || 'Untitled Page'}
            activeFilter={activeFilter}
            onSelect={(id) => {
              setViewMode('orders');
              setActiveFilter({ type: 'landing_page', id });
            }}
            totalCount={landingPages.length}
            onCountRequest={(id) => getOrders24hCountForSource('landing_page', id)}
          />

          <ExpandablePlatformMenuItem 
            label="Website Orders" 
            icon={<Globe size={14} />} 
            platformType="website"
            items={websites}
            getItemName={(w) => w.siteName || w.title || w.domain || 'Main Website'}
            activeFilter={activeFilter}
            onSelect={(id) => {
              setViewMode('orders');
              setActiveFilter({ type: 'website', id });
            }}
            totalCount={websites.length}
            onCountRequest={(id) => getOrders24hCountForSource('website', id)}
          />

          <ExpandablePlatformMenuItem 
            label="Direct Chat Channels" 
            icon={<Package size={14} />} 
            platformType="chatroom"
            items={directChats}
            getItemName={(c) => c.otherUserName || c.chatId || 'Chat Customer'}
            activeFilter={activeFilter}
            onSelect={(id) => {
              setViewMode('orders');
              setActiveFilter({ type: 'chatroom', id });
            }}
            totalCount={directChats.length}
            onCountRequest={(id) => getOrders24hCountForSource('chatroom', id)}
          />
        </MenuSection>

        {/* Analytics, Logistics & Security Tools */}
        <MenuSection title="Business Tools">
          <MenuItem 
            active={viewMode === 'detailed_reports'} 
            icon={<TrendingUp size={14} />} 
            label="Detailed Financials" 
            onClick={() => setViewMode('detailed_reports')} 
          />
          <MenuItem 
            active={viewMode === 'logistics'} 
            icon={<Globe size={14} />} 
            label="Global Logistics" 
            onClick={() => setViewMode('logistics')} 
          />
          <MenuItem 
            active={viewMode === 'fraud'} 
            icon={<ShieldAlert size={14} />} 
            label="Security & Blacklist" 
            onClick={() => setViewMode('fraud')} 
          />
        </MenuSection>
      </div>
    </div>
  );
});
