import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Send, 
  Inbox, 
  Bot, 
  BarChart3, 
  PlusCircle, 
  Settings, 
  Truck,
  LayoutGrid,
  Box,
  Zap,
  Globe,
  ShoppingBag,
  ShieldAlert
} from 'lucide-react';
import { cn } from '../lib/utils';
import { checkIsAdmin } from '../lib/adminConfig';
import { AuthContext } from '../authContext';

const navItems = [
  { id: 'messenger', label: 'Chats', icon: MessageSquare, path: '/messenger' },
  { id: 'inventory', label: 'Inventory', icon: Box, path: '/inventory' },
  { id: 'store', label: 'My site', icon: ShoppingBag, path: '/showcase' },
  { id: 'automation', label: 'Magic Box', icon: Zap, path: '/magic-box' },
  { id: 'reports', label: 'Orders', icon: BarChart3, path: '/reports' },
  { id: 'tools', label: 'Tools', icon: Settings, path: '/tools' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useContext(AuthContext);

  const isAdmin = checkIsAdmin(user, profile);

  const currentNavItems = [...navItems];
  if (isAdmin) {
    currentNavItems.push({ id: 'admin', label: 'Admin', icon: ShieldAlert, path: '/admin' });
  }

  return (
    <div className="fixed bottom-2 inset-x-0 z-50 flex justify-center px-4 no-print pointer-events-none">
      <div className="w-full max-w-xl pointer-events-auto">
        <div className="glass-card flex items-center justify-between p-1 neon-glow rounded-2xl bg-white/80 dark:bg-dragon-black/40 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 shadow-lg">
          {currentNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={cn(
                  "relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-300",
                  isActive ? "text-cyan-600 dark:text-dragon-cyan scale-110 font-bold" : "text-slate-500 dark:text-gray-500 hover:text-slate-800 dark:hover:text-white"
                )}
              >
                <div className="relative">
                   <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                   {isActive && (
                      <motion.div
                        layoutId="active-indicator-glow"
                        className="absolute inset-0 bg-cyan-500/20 dark:bg-dragon-cyan/20 blur-md rounded-full -z-10"
                      />
                   )}
                </div>
                <span className="text-[7px] mt-1 font-black uppercase tracking-tighter leading-none">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="active-indicator"
                    className="absolute -bottom-0.5 w-4 h-0.5 bg-cyan-500 dark:bg-dragon-cyan rounded-full shadow-[0_0_10px_#00f2ff]"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function PageContainer({ children, title, rightAction, showNav = true }: { children: React.ReactNode, title?: string, rightAction?: React.ReactNode, showNav?: boolean }) {
  return (
    <div className="min-h-[100dvh] bg-[#f0f2f5] dark:bg-dragon-black text-slate-900 dark:text-white pb-20 overflow-x-clip transition-colors">
      {title ? (
        <div className="p-3 pt-6 md:p-6 md:pt-16 uppercase flex justify-between items-end">
          <h1 className="text-xl md:text-5xl font-display font-black text-slate-900 dark:text-white tracking-tighter leading-none">{title}</h1>
          {rightAction && <div className="no-print">{rightAction}</div>}
        </div>
      ) : (
        <div className="pt-2 md:pt-4" />
      )}
      <div className="px-3 md:px-12 max-w-7xl mx-auto">
        {children}
      </div>
      {showNav && <BottomNav />}
    </div>
  );
}
