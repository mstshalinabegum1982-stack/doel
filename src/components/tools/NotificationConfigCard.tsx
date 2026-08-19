import React from 'react';
import { Phone, Package, MessageSquare } from 'lucide-react';
import { cn } from '../../lib/utils';

interface NotificationConfigCardProps {
  notifCall: boolean;
  notifOrder: boolean;
  notifMessage: boolean;
  onToggleNotif: (type: 'call' | 'order' | 'message', val: boolean) => void;
}

export function NotificationConfigCard({
  notifCall,
  notifOrder,
  notifMessage,
  onToggleNotif,
}: NotificationConfigCardProps) {
  return (
    <div className="space-y-4">
      <h3 className="section-title">Notification Settings</h3>
      <div className="glass-card p-6 space-y-5">
        <div>
          <h4 className="text-sm font-bold font-display uppercase tracking-wider text-white">System Notifications</h4>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
            Toggle sound and alert notifications for system events
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Call Notification */}
          <div className="bg-black/40 p-4 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-xl">
                <Phone size={18} />
              </div>
              <div>
                <h5 className="text-[11px] font-black uppercase text-white tracking-wider">Incoming Calls</h5>
                <p className="text-[8.5px] text-gray-500 font-bold uppercase tracking-wide mt-0.5">Alerts for incoming calls</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onToggleNotif('call', !notifCall)}
              className="relative focus:outline-none shrink-0 cursor-pointer"
            >
              <div
                className={cn(
                  "w-9 h-5 rounded-full transition-colors",
                  notifCall ? "bg-dragon-cyan" : "bg-white/10"
                )}
              >
                <div
                  className={cn(
                    "w-4 h-4 rounded-full bg-dragon-black absolute top-0.5 transition-all shadow-md",
                    notifCall ? "left-4.5" : "left-0.5"
                  )}
                />
              </div>
            </button>
          </div>

          {/* Order Notification */}
          <div className="bg-black/40 p-4 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <Package size={18} />
              </div>
              <div>
                <h5 className="text-[11px] font-black uppercase text-white tracking-wider">New Orders</h5>
                <p className="text-[8.5px] text-gray-500 font-bold uppercase tracking-wide mt-0.5">Alerts for new orders</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onToggleNotif('order', !notifOrder)}
              className="relative focus:outline-none shrink-0 cursor-pointer"
            >
              <div
                className={cn(
                  "w-9 h-5 rounded-full transition-colors",
                  notifOrder ? "bg-dragon-cyan" : "bg-white/10"
                )}
              >
                <div
                  className={cn(
                    "w-4 h-4 rounded-full bg-dragon-black absolute top-0.5 transition-all shadow-md",
                    notifOrder ? "left-4.5" : "left-0.5"
                  )}
                />
              </div>
            </button>
          </div>

          {/* Message Notification */}
          <div className="bg-black/40 p-4 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
                <MessageSquare size={18} />
              </div>
              <div>
                <h5 className="text-[11px] font-black uppercase text-white tracking-wider">New Messages</h5>
                <p className="text-[8.5px] text-gray-500 font-bold uppercase tracking-wide mt-0.5">Alerts for chat messages</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onToggleNotif('message', !notifMessage)}
              className="relative focus:outline-none shrink-0 cursor-pointer"
            >
              <div
                className={cn(
                  "w-9 h-5 rounded-full transition-colors",
                  notifMessage ? "bg-dragon-cyan" : "bg-white/10"
                )}
              >
                <div
                  className={cn(
                    "w-4 h-4 rounded-full bg-dragon-black absolute top-0.5 transition-all shadow-md",
                    notifMessage ? "left-4.5" : "left-0.5"
                  )}
                />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
