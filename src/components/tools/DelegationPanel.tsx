import React from 'react';
import { 
  ShieldCheck, 
  User, 
  Zap, 
  UserPlus, 
  Loader2, 
  Save, 
  Send 
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface DelegationItem {
  id: string;
  grantorId: string;
  grantorName?: string;
  granteeId: string;
  granteeName?: string;
  status?: string;
  allowInventory?: boolean;
  allowLandingPages?: boolean;
  allowOrders?: boolean;
  allowSiteMessenger?: boolean;
  userProfile?: {
    uid?: string;
    name?: string;
    storeName?: string;
    businessName?: string;
    phone?: string;
    email?: string;
    profileImage?: string;
  };
}

export interface DelegationPerms {
  allowInventory: boolean;
  allowLandingPages: boolean;
  allowOrders: boolean;
  allowSiteMessenger: boolean;
}

interface DelegationPanelProps {
  showDelegationPanel: boolean;
  setShowDelegationPanel: (val: boolean) => void;
  receivedDelegations: DelegationItem[];
  myDelegates: DelegationItem[];
  connections: any[];
  loadingConnections: boolean;
  delegationLoading: boolean;
  delegationSuccessMsg: string | null;
  activeDelegateId: string;
  editingGranteeId: string | null;
  setEditingGranteeId: (id: string | null) => void;
  editPerms: DelegationPerms;
  setEditPerms: React.Dispatch<React.SetStateAction<DelegationPerms>>;
  confirmDeleteId: string | null;
  setConfirmDeleteId: (id: string | null) => void;
  onSwitchActiveAccount: (targetId: string) => void;
  onAcceptDelegation: (delegId: string) => void;
  onRejectDelegation: (delegId: string) => void;
  onSaveDelegation: (granteeId: string, granteeName: string) => void;
  onRemoveDelegation: (granteeId: string, customDocId?: string) => void;
}

export function DelegationPanel({
  showDelegationPanel,
  setShowDelegationPanel,
  receivedDelegations,
  myDelegates,
  connections,
  loadingConnections,
  delegationLoading,
  delegationSuccessMsg,
  activeDelegateId,
  editingGranteeId,
  setEditingGranteeId,
  editPerms,
  setEditPerms,
  confirmDeleteId,
  setConfirmDeleteId,
  onSwitchActiveAccount,
  onAcceptDelegation,
  onRejectDelegation,
  onSaveDelegation,
  onRemoveDelegation,
}: DelegationPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="section-title flex items-center gap-2">
          <ShieldCheck className="text-dragon-cyan" size={18} />
          Panel Access Settings (Access Control)
        </h3>
        <button
          type="button"
          onClick={() => setShowDelegationPanel(!showDelegationPanel)}
          className="px-3 py-1.5 bg-dragon-cyan/15 hover:bg-dragon-cyan text-dragon-cyan hover:text-dragon-black border border-dragon-cyan/20 rounded-xl transition-all font-black text-[9px] uppercase tracking-widest cursor-pointer"
        >
          {showDelegationPanel ? "Simple Mode" : "Access Panel"}
        </button>
      </div>

      {/* ALWAYS VISIBLE SUMMARY: Received Panel Access (If any exists) */}
      {receivedDelegations.length > 0 && (
        <div className="glass-card p-5 space-y-4 bg-dragon-cyan/5">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-dragon-cyan/20 rounded-xl text-dragon-cyan">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-2">
                  Panel Access Granted To You
                  <span className="text-[10px] text-dragon-cyan font-bold lowercase font-sans">(প্রাপ্ত এক্সেস)</span>
                </h4>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                  Members who granted you access to manage their tools & orders
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-dragon-cyan/20 text-dragon-cyan font-black text-[9px] uppercase tracking-widest rounded-lg border border-dragon-cyan/30">
              {receivedDelegations.length} {receivedDelegations.length === 1 ? 'Panel' : 'Panels'} Access
            </span>
          </div>

          <div className="space-y-3">
            {receivedDelegations.map((rd, idx) => {
              const isPending = rd.status === "pending" || !rd.status;
              const isActiveCurrent = activeDelegateId === rd.grantorId;
              const grantorName = rd.userProfile?.name || rd.grantorName || "Merchant Owner";
              const grantorStore = rd.userProfile?.storeName || rd.userProfile?.businessName || "Store / Business";
              const grantorPhone = rd.userProfile?.phone;
              const grantorImage = rd.userProfile?.profileImage;

              return (
                <div
                  key={`received-card-always-${rd.id}-${idx}`}
                  className={cn(
                    "p-4 rounded-2xl border transition-all space-y-3",
                    isActiveCurrent
                      ? "bg-dragon-cyan/15 border-dragon-cyan shadow-lg shadow-dragon-cyan/10"
                      : isPending
                      ? "bg-amber-500/10 border-amber-500/30"
                      : "bg-black/40 border-white/10 hover:border-white/20"
                  )}
                >
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {grantorImage ? (
                        <img
                          src={grantorImage}
                          alt={grantorName}
                          className="w-11 h-11 rounded-2xl object-cover ring-2 ring-dragon-cyan/40 shrink-0 bg-black/40"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-2xl bg-dragon-cyan/10 border border-dragon-cyan/30 flex items-center justify-center shrink-0">
                          <User size={20} className="text-dragon-cyan" />
                        </div>
                      )}
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-white text-sm truncate">
                            {grantorName}
                          </span>
                          {isActiveCurrent && (
                            <span className="px-2 py-0.5 bg-dragon-cyan text-dragon-black font-black text-[8px] uppercase tracking-widest rounded-full shrink-0">
                              Active View
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-dragon-cyan font-bold uppercase tracking-wider">
                          {grantorStore} {grantorPhone ? `• Phone: ${grantorPhone}` : ''}
                        </p>
                        <p className="text-[8.5px] text-gray-400 font-mono">
                          User ID: {rd.grantorId}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "px-2.5 py-1 text-[8.5px] font-black uppercase tracking-widest rounded-xl border",
                          isPending
                            ? "bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse"
                            : "bg-dragon-emerald/20 text-dragon-emerald border-dragon-emerald/30"
                        )}
                      >
                        {isPending ? "Pending Accept" : "Active Access Granted"}
                      </span>
                    </div>
                  </div>

                  {/* Permissions Granted */}
                  <div className="p-2.5 bg-black/30 rounded-xl border border-white/5 space-y-1.5">
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">
                      Granted Management Permissions:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {rd.allowInventory && (
                        <span className="px-2 py-0.5 bg-dragon-cyan/15 text-dragon-cyan text-[8.5px] font-bold rounded-lg border border-dragon-cyan/20">
                          Inventory
                        </span>
                      )}
                      {rd.allowLandingPages && (
                        <span className="px-2 py-0.5 bg-dragon-cyan/15 text-dragon-cyan text-[8.5px] font-bold rounded-lg border border-dragon-cyan/20">
                          Web & LP
                        </span>
                      )}
                      {rd.allowOrders && (
                        <span className="px-2 py-0.5 bg-dragon-cyan/15 text-dragon-cyan text-[8.5px] font-bold rounded-lg border border-dragon-cyan/20">
                          Orders
                        </span>
                      )}
                      {rd.allowSiteMessenger && (
                        <span className="px-2 py-0.5 bg-dragon-cyan/15 text-dragon-cyan text-[8.5px] font-bold rounded-lg border border-dragon-cyan/20">
                          Site Messenger
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick Action Controls */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                    {isPending ? (
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => onAcceptDelegation(rd.id)}
                          disabled={delegationLoading}
                          className="flex-1 sm:flex-none px-4 py-2 bg-dragon-cyan hover:opacity-95 text-dragon-black font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md"
                        >
                          Accept Access
                        </button>
                        <button
                          type="button"
                          onClick={() => onRejectDelegation(rd.id)}
                          disabled={delegationLoading}
                          className="px-4 py-2 bg-white/5 hover:bg-red-500/15 text-red-400 hover:text-white border border-white/10 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 w-full justify-between sm:justify-end">
                        {isActiveCurrent ? (
                          <button
                            type="button"
                            onClick={() => onSwitchActiveAccount('')}
                            className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                          >
                            Switch Back to My Personal Panel
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onSwitchActiveAccount(rd.grantorId)}
                            className="px-4 py-2 bg-dragon-cyan text-dragon-black font-black text-[9.5px] uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                          >
                            <Zap size={12} /> Switch Active View to {grantorName}'s Panel
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onRejectDelegation(rd.id)}
                          disabled={delegationLoading}
                          className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[8.5px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                        >
                          Revoke Access
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showDelegationPanel && (
        <div className="glass-card p-6 space-y-6">
          {delegationSuccessMsg && (
            <div id="delegation-success-toast" className="p-3 bg-dragon-emerald/10 border border-dragon-emerald/20 text-dragon-emerald text-[9px] font-black uppercase tracking-widest rounded-xl text-center animate-pulse">
              {delegationSuccessMsg}
            </div>
          )}
          <div>
            <h4 className="text-xs font-black uppercase text-white tracking-widest">
              Delegate Control Management
            </h4>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide mt-1">
              Grant other members permission to manage your inventory,
              landing page, website, and orders
            </p>
          </div>

          {/* Mutual Followers (Friends List) */}
          <div className="space-y-3.5">
            <h5 className="text-[9px] font-black uppercase text-dragon-cyan tracking-widest flex items-center gap-1">
              <UserPlus size={13} /> Mutual Followers (Friends List)
            </h5>

            {loadingConnections ? (
              <div className="flex items-center gap-2 py-4 justify-center">
                <Loader2
                  size={16}
                  className="animate-spin text-dragon-cyan"
                />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  Loading friends...
                </span>
              </div>
            ) : connections.length === 0 ? (
              <div className="py-6 text-center border-2 border-dashed border-white/5 rounded-2xl">
                <p className="text-gray-500 text-[9.5px] uppercase font-bold tracking-wider px-4">
                  No mutual follow connections found. You must follow each other back (be friends) to delegate panel access.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {connections.map((conn, idx) => {
                  const existingDeleg = myDelegates.find(
                    (d) => d.granteeId === conn.uid,
                  );
                  const isEditing = editingGranteeId === conn.uid;

                  return (
                    <div
                      key={`deleg-conn-${conn.uid || 'conn'}-${idx}`}
                      className="bg-black/40 border border-white/10 hover:border-dragon-cyan/30 rounded-xl p-2.5 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={
                              conn.profileImage ||
                              `https://api.dicebear.com/7.x/bottts/svg?seed=${conn.uid}`
                            }
                            className="w-7 h-7 rounded-full border border-white/10 object-cover bg-white/5 shrink-0"
                            alt=""
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white text-xs truncate leading-tight">
                                {conn.name}
                              </span>
                              {existingDeleg && (
                                <span
                                  className={cn(
                                    "text-[6.5px] font-black uppercase px-1.5 py-0.5 rounded tracking-widest leading-none shrink-0",
                                    existingDeleg.status === "accepted"
                                      ? "bg-dragon-emerald/20 text-dragon-emerald border border-dragon-emerald/30"
                                      : "bg-amber-500/20 text-amber-500 border border-amber-500/30 animate-pulse",
                                  )}
                                >
                                  {existingDeleg.status === "accepted"
                                    ? "ACTIVE"
                                    : "PENDING"}
                                </span>
                              )}
                            </div>
                            <span className="text-[7.5px] text-gray-500 font-semibold tracking-wider uppercase truncate block">
                              {conn.phone || "No phone number"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {existingDeleg && (
                            <div className="flex items-center gap-1">
                              {confirmDeleteId === conn.uid ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onRemoveDelegation(conn.uid, existingDeleg.id);
                                    }}
                                    disabled={delegationLoading}
                                    className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-[8.5px] uppercase tracking-wider transition-all cursor-pointer animate-pulse"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmDeleteId(null);
                                    }}
                                    className="px-1.5 py-1 bg-white/5 hover:bg-white/10 text-gray-400 rounded-lg font-bold text-[8.5px] uppercase tracking-wider transition-all cursor-pointer"
                                  >
                                    No
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmDeleteId(conn.uid);
                                  }}
                                  disabled={delegationLoading}
                                  className="px-2 py-1 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 border border-red-500/25 rounded-lg font-bold text-[8.5px] uppercase tracking-wider transition-all cursor-pointer"
                                >
                                  Revoke
                                </button>
                              )}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              if (isEditing) {
                                setEditingGranteeId(null);
                              } else {
                                setEditingGranteeId(conn.uid);
                                setEditPerms({
                                  allowInventory:
                                    existingDeleg?.allowInventory ?? false,
                                  allowLandingPages:
                                    existingDeleg?.allowLandingPages ?? false,
                                  allowOrders:
                                    existingDeleg?.allowOrders ?? false,
                                  allowSiteMessenger:
                                    existingDeleg?.allowSiteMessenger ?? false,
                                });
                              }
                            }}
                            className={cn(
                              "px-2.5 py-1 rounded-lg font-bold text-[8.5px] uppercase tracking-wider transition-all cursor-pointer",
                              existingDeleg
                                ? "bg-dragon-cyan/15 text-dragon-cyan hover:bg-dragon-cyan hover:text-dragon-black border border-dragon-cyan/30"
                                : "bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 border border-white/10",
                            )}
                          >
                            {existingDeleg ? "Modify" : "Grant Access +"}
                          </button>
                        </div>
                      </div>

                      {isEditing && (
                        <div className="mt-2 bg-black/40 p-4 rounded-xl border border-white/5 space-y-4">
                          <h6 className="text-[8.5px] font-black tracking-widest uppercase text-dragon-cyan border-b border-white/5 pb-1.5">
                            {conn.name} - Toggle permissions (Grant
                            Permissions)
                          </h6>

                          <div className="space-y-3">
                            {/* Inventory Toggle */}
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-[10px] font-bold text-white block">
                                  Inventory Access (Inventory Management)
                                </span>
                                <span className="text-[8px] text-gray-500 block">
                                  Allows other members to visit your panel
                                  and add products from their inventory
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setEditPerms((p) => ({
                                    ...p,
                                    allowInventory: !p.allowInventory,
                                  }))
                                }
                                className="relative focus:outline-none cursor-pointer"
                              >
                                <div
                                  className={cn(
                                    "w-9 h-5 rounded-full transition-colors",
                                    editPerms.allowInventory
                                      ? "bg-dragon-cyan"
                                      : "bg-white/10",
                                  )}
                                >
                                  <div
                                    className={cn(
                                      "w-4 h-4 rounded-full bg-dragon-black absolute top-0.5 transition-all shadow-md",
                                      editPerms.allowInventory
                                        ? "left-4.5"
                                        : "left-0.5",
                                    )}
                                  />
                                </div>
                              </button>
                            </div>

                            {/* Landing Page Toggle */}
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-[10px] font-bold text-white block">
                                  Landing Page & Pro Web Website Access
                                  (Landing Page & Pro Website)
                                </span>
                                <span className="text-[8px] text-gray-500 block">
                                  Create landing pages or professional
                                  e-commerce sites under your account
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setEditPerms((p) => ({
                                    ...p,
                                    allowLandingPages: !p.allowLandingPages,
                                  }))
                                }
                                className="relative focus:outline-none cursor-pointer"
                              >
                                <div
                                  className={cn(
                                    "w-9 h-5 rounded-full transition-colors",
                                    editPerms.allowLandingPages
                                      ? "bg-dragon-cyan"
                                      : "bg-white/10",
                                  )}
                                >
                                  <div
                                    className={cn(
                                      "w-4 h-4 rounded-full bg-dragon-black absolute top-0.5 transition-all shadow-md",
                                      editPerms.allowLandingPages
                                        ? "left-4.5"
                                        : "left-0.5",
                                    )}
                                  />
                                </div>
                              </button>
                            </div>

                            {/* Orders Management Toggle */}
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-[10px] font-bold text-white block">
                                  Order Management Access (Full Order
                                  Management)
                                </span>
                                <span className="text-[8px] text-gray-500 block">
                                  Process, forward all incoming orders from your page and configure courier credentials
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setEditPerms((p) => ({
                                    ...p,
                                    allowOrders: !p.allowOrders,
                                  }))
                                }
                                className="relative focus:outline-none cursor-pointer"
                              >
                                <div
                                  className={cn(
                                    "w-9 h-5 rounded-full transition-colors",
                                    editPerms.allowOrders
                                      ? "bg-dragon-cyan"
                                      : "bg-white/10",
                                  )}
                                >
                                  <div
                                    className={cn(
                                      "w-4 h-4 rounded-full bg-dragon-black absolute top-0.5 transition-all shadow-md",
                                      editPerms.allowOrders
                                        ? "left-4.5"
                                        : "left-0.5",
                                    )}
                                  />
                                </div>
                              </button>
                            </div>

                            {/* Site Messenger Toggle */}
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-[10px] font-bold text-white block">
                                  Site Messenger Access
                                </span>
                                <span className="text-[8px] text-gray-500 block">
                                  Reply to site messenger and chat messages
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setEditPerms((p) => ({
                                    ...p,
                                    allowSiteMessenger: !p.allowSiteMessenger,
                                  }))
                                }
                                className="relative focus:outline-none cursor-pointer"
                              >
                                <div
                                  className={cn(
                                    "w-9 h-5 rounded-full transition-colors",
                                    editPerms.allowSiteMessenger
                                      ? "bg-dragon-cyan"
                                      : "bg-white/10",
                                  )}
                                >
                                  <div
                                    className={cn(
                                      "w-4 h-4 rounded-full bg-dragon-black absolute top-0.5 transition-all shadow-md",
                                      editPerms.allowSiteMessenger
                                        ? "left-4.5"
                                        : "left-0.5",
                                    )}
                                  />
                                </div>
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                            <button
                              type="button"
                              onClick={() =>
                                onSaveDelegation(conn.uid, conn.name)
                              }
                              disabled={delegationLoading}
                              className="flex-1 py-1.5 bg-dragon-cyan hover:opacity-90 disabled:opacity-40 text-dragon-black font-black text-[9px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              {delegationLoading ? (
                                <Loader2
                                  size={12}
                                  className="animate-spin"
                                />
                              ) : (
                                <Save size={12} />
                              )}
                              Save Settings
                            </button>

                            {existingDeleg && (
                              <div className="flex items-center gap-1.5">
                                {confirmDeleteId === conn.uid ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onRemoveDelegation(conn.uid, existingDeleg.id);
                                      }}
                                      disabled={delegationLoading}
                                      className="py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-[9px] uppercase tracking-widest transition-all animate-pulse cursor-pointer"
                                    >
                                      Confirm?
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setConfirmDeleteId(null);
                                      }}
                                      className="py-1.5 px-2.5 bg-white/5 text-gray-400 rounded-xl font-bold text-[9px] uppercase tracking-widest transition-all cursor-pointer"
                                    >
                                      No
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmDeleteId(conn.uid);
                                    }}
                                    disabled={delegationLoading}
                                    className="py-1.5 px-3.5 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-550/90 border border-red-500/15 rounded-xl font-bold text-[9px] uppercase tracking-widest transition-all cursor-pointer"
                                  >
                                    Revoke
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sent Delegations List */}
          <div className="space-y-3.5 pt-4 border-t border-white/5">
            <h5 className="text-[10px] font-black uppercase text-rose-400 tracking-widest flex items-center gap-1.5">
              <Send size={13} className="text-rose-400" /> Sent Panel Access & Delegation Settings
            </h5>

            {myDelegates.length === 0 ? (
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider italic text-center py-4 bg-white/5 rounded-2xl">
                You have not sent panel access to anyone yet.
              </p>
            ) : (
              <div className="space-y-3">
                {myDelegates.map((del, idx) => {
                  const isPending = del.status === "pending" || !del.status;
                  const hasConfirmRemoval = confirmDeleteId === `sent_${del.id}`;

                  return (
                    <div
                      key={`sent-deleg-${del.id}-${idx}`}
                      className="bg-black/35 border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-white/10 transition-colors"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-xs">
                            {del.granteeName || "Other Member"}
                          </span>
                          <span
                            className={cn(
                              "text-[7.5px] font-black uppercase px-2 py-0.5 rounded tracking-widest leading-none",
                              isPending
                                ? "bg-amber-500/10 text-amber-500 border border-amber-500/25 animate-pulse"
                                : "bg-dragon-emerald/10 text-dragon-emerald border border-dragon-emerald/20"
                            )}
                          >
                            {isPending ? "PENDING (Awaiting acceptance)" : "ACTIVE"}
                          </span>
                        </div>
                        
                        {/* display allowed features list */}
                        <div className="flex flex-wrap gap-1.5">
                          {del.allowInventory && (
                            <span className="px-1.5 py-0.5 bg-white/5 text-gray-400 text-[8px] font-bold rounded uppercase">
                              Inventory
                            </span>
                          )}
                          {del.allowLandingPages && (
                            <span className="px-1.5 py-0.5 bg-white/5 text-gray-400 text-[8px] font-bold rounded uppercase">
                              Web & LP
                            </span>
                          )}
                          {del.allowOrders && (
                            <span className="px-1.5 py-0.5 bg-white/5 text-gray-400 text-[8px] font-bold rounded uppercase">
                              Orders
                            </span>
                          )}
                          {del.allowSiteMessenger && (
                            <span className="px-1.5 py-0.5 bg-white/5 text-gray-400 text-[8px] font-bold rounded uppercase">
                              Site Messenger
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Access Removal button with confirmation */}
                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        {hasConfirmRemoval ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                await onRemoveDelegation(del.granteeId, del.id);
                              }}
                              disabled={delegationLoading}
                              className="px-3 py-1.5 bg-red-650 hover:bg-red-700 text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all cursor-pointer animate-pulse"
                            >
                              Yes, Cancel!
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(null);
                              }}
                              className="px-2.5 py-1.5 bg-white/5 text-gray-400 hover:text-white rounded-xl font-bold text-[9px] uppercase tracking-widest transition-all cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(`sent_${del.id}`);
                            }}
                            disabled={delegationLoading}
                            className="px-3.5 py-1.5 bg-red-500/10 hover:bg-red-650 text-rose-400 hover:text-white border border-red-500/15 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all cursor-pointer"
                          >
                            Cancel / Revoke Access
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Received Delegations List */}
          <div className="space-y-3.5 pt-4 border-t border-white/5">
            <h5 className="text-[10px] font-black uppercase text-dragon-emerald tracking-widest flex items-center gap-1.5">
              <ShieldCheck size={14} /> Received Delegated Access Panels
            </h5>

            {receivedDelegations.length === 0 ? (
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider italic text-center py-4 bg-white/5 rounded-2xl">
                No other member has sent panel access delegation to you yet.
              </p>
            ) : (
              <div className="space-y-4">
                {/* 1. Pending Invitations */}
                {receivedDelegations.some((d) => d.status === "pending" || !d.status) && (
                  <div className="space-y-2">
                    <span className="text-[8px] font-black text-amber-500 tracking-widest uppercase block mb-1">
                      ● Pending Invitations
                    </span>
                    {receivedDelegations
                      .filter((d) => d.status === "pending" || !d.status)
                      .map((rd, idx) => (
                        <div
                          key={`rec-del-pending-${rd.id}-${idx}`}
                          className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl space-y-3"
                        >
                          <div className="flex items-start justify-between flex-wrap gap-2">
                            <div>
                              <span className="font-bold text-white text-xs block leading-tight">
                                {rd.grantorName} wants to make you a panel moderator
                              </span>
                              <span className="text-[8.5px] text-amber-500/80 font-bold uppercase tracking-widest block mt-1">
                                Permissions:
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {rd.allowInventory && (
                                <span className="px-1.5 py-0.5 bg-dragon-cyan/10 text-dragon-cyan text-[7.5px] font-bold rounded uppercase">
                                  Inventory
                                </span>
                              )}
                              {rd.allowLandingPages && (
                                <span className="px-1.5 py-0.5 bg-dragon-cyan/10 text-dragon-cyan text-[7.5px] font-bold rounded uppercase">
                                  Web & LP
                                </span>
                              )}
                              {rd.allowOrders && (
                                <span className="px-1.5 py-0.5 bg-dragon-cyan/10 text-dragon-cyan text-[7.5px] font-bold rounded uppercase">
                                  Orders
                                </span>
                              )}
                              {rd.allowSiteMessenger && (
                                <span className="px-1.5 py-0.5 bg-dragon-cyan/10 text-dragon-cyan text-[7.5px] font-bold rounded uppercase">
                                  Site Messenger
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                            <button
                              type="button"
                              onClick={() => onAcceptDelegation(rd.id)}
                              disabled={delegationLoading}
                              className="flex-1 py-1.5 bg-dragon-cyan hover:opacity-95 text-dragon-black font-black text-[9px] uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              onClick={() => onRejectDelegation(rd.id)}
                              disabled={delegationLoading}
                              className="py-1.5 px-4 bg-white/5 hover:bg-red-500/15 text-red-400 hover:text-white border border-white/10 rounded-xl transition-all font-bold text-[9px] uppercase tracking-widest cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {/* 2. Active Connections */}
                {receivedDelegations.some((d) => d.status === "accepted") && (
                  <div className="space-y-2">
                    <span className="text-[8px] font-black text-dragon-emerald tracking-widest uppercase block mb-1 font-sans">
                      ● Active Access Panels
                    </span>
                    {receivedDelegations
                      .filter((d) => d.status === "accepted")
                      .map((rd, idx) => {
                        const grantorName = rd.userProfile?.name || rd.grantorName || "Merchant Owner";
                        const grantorStore = rd.userProfile?.storeName || rd.userProfile?.businessName || "Store / Business";
                        const grantorPhone = rd.userProfile?.phone;
                        const grantorImage = rd.userProfile?.profileImage;
                        const isActiveCurrent = activeDelegateId === rd.grantorId;

                        return (
                          <div
                            key={`rec-del-accepted-${rd.id}-${idx}`}
                            className={cn(
                              "p-4 border rounded-2xl space-y-3 transition-all",
                              isActiveCurrent
                                ? "bg-dragon-cyan/15 border-dragon-cyan shadow-lg shadow-dragon-cyan/10"
                                : "bg-dragon-emerald/5 border-dragon-emerald/15"
                            )}
                          >
                            <div className="flex items-start justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-3">
                                {grantorImage ? (
                                  <img
                                    src={grantorImage}
                                    alt={grantorName}
                                    className="w-10 h-10 rounded-xl object-cover ring-2 ring-dragon-emerald/30 bg-black/40"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-xl bg-dragon-emerald/10 border border-dragon-emerald/20 flex items-center justify-center text-dragon-emerald font-bold text-xs">
                                    <User size={18} />
                                  </div>
                                )}
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-white text-xs block leading-tight font-sans">
                                      {grantorName}'s Panel
                                    </span>
                                    {isActiveCurrent && (
                                      <span className="px-2 py-0.5 bg-dragon-cyan text-dragon-black font-black text-[7.5px] uppercase tracking-widest rounded-full">
                                        Active
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[9px] text-dragon-emerald font-bold uppercase tracking-widest block mt-0.5">
                                    {grantorStore} {grantorPhone ? `• ${grantorPhone}` : ''}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {rd.allowInventory && (
                                  <span className="px-1.5 py-0.5 bg-dragon-emerald/10 text-dragon-emerald text-[7.5px] font-bold rounded uppercase">
                                    Inventory
                                  </span>
                                )}
                                {rd.allowLandingPages && (
                                  <span className="px-1.5 py-0.5 bg-dragon-emerald/10 text-dragon-emerald text-[7.5px] font-bold rounded uppercase">
                                    Web & LP
                                  </span>
                                )}
                                {rd.allowOrders && (
                                  <span className="px-1.5 py-0.5 bg-dragon-emerald/10 text-dragon-emerald text-[7.5px] font-bold rounded uppercase">
                                    Orders
                                  </span>
                                )}
                                {rd.allowSiteMessenger && (
                                  <span className="px-1.5 py-0.5 bg-dragon-emerald/10 text-dragon-emerald text-[7.5px] font-bold rounded uppercase">
                                    Site Messenger
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-white/5">
                              {isActiveCurrent ? (
                                <button
                                  type="button"
                                  onClick={() => onSwitchActiveAccount('')}
                                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-[8.5px] uppercase tracking-widest rounded-lg transition-all cursor-pointer"
                                >
                                  Switch to My Personal Panel
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => onSwitchActiveAccount(rd.grantorId)}
                                  className="px-3 py-1.5 bg-dragon-cyan text-dragon-black font-black text-[8.5px] uppercase tracking-widest rounded-lg hover:scale-105 transition-all shadow-md cursor-pointer flex items-center gap-1"
                                >
                                  <Zap size={11} /> Switch to {grantorName}'s Panel
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => onRejectDelegation(rd.id)}
                                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 hover:text-white text-red-400 border border-red-500/20 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer"
                              >
                                Revoke Access
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
