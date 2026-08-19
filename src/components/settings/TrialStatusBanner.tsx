import React from 'react';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TrialStatusBannerProps {
  paymentStatus: 'none' | 'pending' | 'approved' | 'rejected';
  isTrialExpired: boolean;
  timeLeft: string;
  delegations: any[];
  activeDelegateId: string;
  activeDelegate: any;
  onDelegateChange: (val: string) => void;
}

export const TrialStatusBanner: React.FC<TrialStatusBannerProps> = ({
  paymentStatus,
  isTrialExpired,
  timeLeft,
  delegations,
  activeDelegateId,
  activeDelegate,
  onDelegateChange,
}) => {
  return (
    <div className="space-y-4">
      {/* Trial / Subscription Status Alert Banner */}
      <div 
        className="rounded-2xl overflow-hidden border p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all animate-in fade-in slide-in-from-top-2 shadow-lg relative"
        style={{
          backgroundColor: paymentStatus === 'approved' ? 'rgba(16, 185, 129, 0.05)' :
                           paymentStatus === 'pending' ? 'rgba(245, 158, 11, 0.05)' :
                           paymentStatus === 'rejected' ? 'rgba(239, 68, 68, 0.05)' :
                           isTrialExpired ? 'rgba(239, 68, 68, 0.08)' : 'rgba(6, 182, 212, 0.05)',
          borderColor: paymentStatus === 'approved' ? 'rgba(16, 185, 129, 0.2)' :
                        paymentStatus === 'pending' ? 'rgba(245, 158, 11, 0.2)' :
                        paymentStatus === 'rejected' ? 'rgba(239, 68, 68, 0.2)' :
                        isTrialExpired ? 'rgba(239, 68, 68, 0.3)' : 'rgba(6, 182, 212, 0.2)',
        }}
      >
        <div className="flex gap-3.5 items-start">
          <div className={cn(
            "p-2.5 rounded-xl shrink-0 flex items-center justify-center",
            paymentStatus === 'approved' ? "bg-emerald-500/10 text-emerald-400" :
            paymentStatus === 'pending' ? "bg-amber-500/10 text-amber-400" :
            paymentStatus === 'rejected' ? "bg-rose-500/10 text-rose-400" :
            isTrialExpired ? "bg-rose-500/10 text-rose-400 animate-pulse" : "bg-dragon-cyan/10 text-dragon-cyan"
          )}>
            {paymentStatus === 'approved' ? <CheckCircle2 size={20} /> :
             paymentStatus === 'pending' ? <Clock size={20} /> :
             paymentStatus === 'rejected' ? <AlertCircle size={20} /> :
             isTrialExpired ? <AlertCircle size={20} /> : <Clock size={20} />}
          </div>
          <div className="space-y-1 text-left">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              {paymentStatus === 'approved' ? 'SaaS Subscription Active (Paid Plan Active)' :
               paymentStatus === 'pending' ? 'Verification Pending (Payment Verification Pending)' :
               paymentStatus === 'rejected' ? 'Payment Request Rejected (Payment Request Rejected)' :
               isTrialExpired ? '72-Hour Free Trial Expired (Free Trial Expired)' : '72-Hour Free Trial (Free Trial Active)'}
            </h4>
            <p className="text-[10px] text-gray-400 font-medium font-sans leading-relaxed">
              {paymentStatus === 'approved' ? 'Your store public links and checkout services are fully active.' :
               paymentStatus === 'pending' ? 'Your bKash transaction is being verified by admin. This normally takes 10-30 minutes.' :
               paymentStatus === 'rejected' ? 'Your manual payment verification failed. Please resubmit the correct bKash info.' :
               isTrialExpired ? 'Your website has expired and public links are now inactive. Please select a paid plan to instantly restore access.' :
               `Your professional store is currently in trial mode. After trial expiry, your public links will require a paid plan.`}
            </p>
          </div>
        </div>
        
        <div className="flex sm:flex-col items-start sm:items-end gap-2 w-full sm:w-auto self-stretch sm:self-center justify-between">
          {!isTrialExpired && paymentStatus !== 'approved' && paymentStatus !== 'pending' && (
            <div className="text-left sm:text-right">
              <span className="text-[8px] uppercase tracking-widest text-gray-500 font-black block">Time Remaining:</span>
              <span className="text-xs font-mono font-black text-dragon-cyan tracking-wider">{timeLeft}</span>
            </div>
          )}
          {paymentStatus === 'approved' && (
            <div className="text-left sm:text-right">
              <span className="text-[8px] uppercase tracking-widest text-emerald-500 font-black block">Status:</span>
              <span className="text-[10px] font-sans font-black text-white bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md uppercase">Fully Active</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Delegation Switcher header */}
      {delegations && delegations.length > 0 && (
        <div className="p-4 rounded-2xl bg-dragon-cyan/10 border border-dragon-cyan/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1">
          <div>
            <span className="text-[10px] font-black text-dragon-cyan tracking-widest uppercase block leading-none">Delegated Pro-Store Website Mode</span>
            <p className="text-[10px] text-white font-bold uppercase mt-1.5 flex items-center gap-1.5 leading-none">
              {activeDelegateId ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-dragon-cyan animate-pulse inline-block" />
                  <span>You are actively customizing the professional e-commerce store of <span className="text-dragon-cyan font-black">{activeDelegate?.grantorName}</span></span>
                </>
              ) : (
                <span>You are currently customizing your own personal website settings</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[8px] uppercase font-black tracking-widest text-gray-500">Switch View:</span>
            <select
              value={activeDelegateId}
              onChange={(e) => onDelegateChange(e.target.value)}
              className="bg-black/55 border border-white/10 text-white font-black text-[9.5px] uppercase tracking-widest px-3 py-1.5 rounded-xl accent-dragon-cyan focus:outline-none focus:ring-1 focus:ring-dragon-cyan/50 cursor-pointer"
            >
              <option value="" className="bg-[#09090d] text-white">My Own Storefront (My Account)</option>
              {delegations.map((d, idx) => (
                <option key={`del-opt-${d.id || d.grantorId || idx}-${idx}`} value={d.grantorId} className="bg-[#09090d] text-white">{d.grantorName} - - - - Store Settings</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
