import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs,
  limit 
} from 'firebase/firestore';
import { 
  Zap, 
  MessageSquare, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  CornerUpLeft, 
  Sparkles, 
  CheckCheck, 
  X, 
  Loader2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { UserProfile } from '../types';

interface SiteMessengerTabProps {
  user: any;
  db: any;
  currentUserProfile: UserProfile | null;
  activeMainTab: string;
  siteChats: any[];
  onSiteChatsChange: (chats: any[]) => void;
}

export const SiteMessengerTab: React.FC<SiteMessengerTabProps> = ({
  user,
  db,
  currentUserProfile,
  activeMainTab,
  siteChats,
  onSiteChatsChange
}) => {
  const [selectedSiteChatId, setSelectedSiteChatId] = useState<string | null>(null);
  const [siteChatReplyText, setSiteChatReplyText] = useState('');
  const [isSiteListCollapsed, setIsSiteListCollapsed] = useState(false);
  const [siteChatReplyingTo, setSiteChatReplyingTo] = useState<{ id: string; sender: string; text: string } | null>(null);
  const [deleteConfirmSiteChatId, setDeleteConfirmSiteChatId] = useState<string | null>(null);
  const [isDeletingSiteChat, setIsDeletingSiteChat] = useState(false);

  const siteChatContainerRef = useRef<HTMLDivElement>(null);

  // --- DELEGATION & COLLABORATIVE ACCESS STATE ---
  const [delegations, setDelegations] = useState<any[]>([]);
  const [activeDelegateId, setActiveDelegateId] = useState<string>(() => {
    return localStorage.getItem('active_delegate_user_id') || '';
  });
  const [activeDelegate, setActiveDelegate] = useState<any>(null);

  // Auto scroll chat to bottom when active chat changes or messages update
  useEffect(() => {
    if (siteChatContainerRef.current) {
      siteChatContainerRef.current.scrollTop = siteChatContainerRef.current.scrollHeight;
      const timers = [
        setTimeout(() => {
          if (siteChatContainerRef.current) {
            siteChatContainerRef.current.scrollTop = siteChatContainerRef.current.scrollHeight;
          }
        }, 50),
        setTimeout(() => {
          if (siteChatContainerRef.current) {
            siteChatContainerRef.current.scrollTop = siteChatContainerRef.current.scrollHeight;
          }
        }, 200),
      ];
      return () => timers.forEach(clearTimeout);
    }
  }, [selectedSiteChatId, siteChats]);

  // Load received delegations with Site Messenger permission
  useEffect(() => {
    if (!user) return;
    const qDel = query(
      collection(db, 'delegated_access'),
      where('granteeId', '==', user.uid),
      where('allowSiteMessenger', '==', true),
      where('status', '==', 'accepted')
    );
    const unsubDel = onSnapshot(qDel, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setDelegations(list);
      
      // Sync active delegate metadata
      const currentId = localStorage.getItem('active_delegate_user_id') || '';
      if (currentId) {
        const found = list.find(d => d.grantorId === currentId);
        if (found) {
          setActiveDelegate(found);
        } else {
          setActiveDelegateId('');
          localStorage.removeItem('active_delegate_user_id');
        }
      }
    }, (error) => {
      console.error("Error fetching site messenger delegations:", error);
    });
    return () => unsubDel();
  }, [user, db]);

  // Auto clean stale customer chats (older than 30 days) and fetch client site chats
  useEffect(() => {
    if (!user || activeMainTab !== 'site_messenger') return;

    const effectiveUserId = activeDelegateId || user.uid;

    // Pruning stale sessions
    const runPruning = async () => {
      try {
        const borderDate = new Date();
        borderDate.setDate(borderDate.getDate() - 30);
        
        const qOld = query(
          collection(db, 'site_chats'),
          where('userId', '==', effectiveUserId)
        );
        const oldSnap = await getDocs(qOld);
        oldSnap.forEach(async (docSnap) => {
          const data = docSnap.data();
          if (data && data.lastMessageAt && data.lastMessageAt < borderDate.toISOString()) {
            await deleteDoc(doc(db, 'site_chats', docSnap.id));
          }
        });
      } catch (err) {
        console.warn("Silent background pruning hook completed or bypassed:", err);
      }
    };
    runPruning();

    // Fetch site chats (limited to 30 active sessions to minimize read costs)
    const qSite = query(
      collection(db, 'site_chats'),
      where('userId', '==', effectiveUserId),
      limit(30)
    );
    const unsubSite = onSnapshot(qSite, (snap) => {
      const chatsData = snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() as any }));
      chatsData.sort((a, b) => {
        const tA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const tB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return tB - tA;
      });
      const uniqueSiteChats = Array.from(new Map(chatsData.map(c => [c.id, c])).values());
      onSiteChatsChange(uniqueSiteChats);
      try {
        localStorage.setItem('dragon_site_chats', JSON.stringify(uniqueSiteChats));
      } catch {
        // Fail-safe silently in sandboxed/iframe environments
      }
    }, (err) => {
      console.warn("Error subscribing to customer live chats:", err);
    });

    return () => unsubSite();
  }, [user, activeDelegateId, activeMainTab, db]);

  const handleSendSiteReply = async () => {
    if (!selectedSiteChatId || !siteChatReplyText.trim()) return;
    const activeDoc = siteChats.find(c => c.id === selectedSiteChatId);
    if (!activeDoc) return;

    const replyBody = siteChatReplyText.trim();
    setSiteChatReplyText('');

    const newReply = {
      id: `msg-${Date.now()}-admin`,
      sender: 'admin',
      role: 'model',
      text: replyBody,
      timestamp: new Date().toISOString(),
      replyTo: siteChatReplyingTo ? {
        id: siteChatReplyingTo.id,
        sender: siteChatReplyingTo.sender,
        text: siteChatReplyingTo.text
      } : null
    };

    setSiteChatReplyingTo(null);

    const finalMsgs = [...(activeDoc.messages || []), newReply];

    // Save merchant manual reply to hidden knowledge Q&A cache to lower future AI bills
    try {
      const reversedMsgs = [...(activeDoc.messages || [])].reverse();
      const lastCustomerMsg = reversedMsgs.find(m => m.sender === 'customer');
      if (lastCustomerMsg && lastCustomerMsg.text && lastCustomerMsg.text.trim()) {
        const question = lastCustomerMsg.text.trim();
        const answer = replyBody.trim();
        
        const effectiveUserId = activeDelegateId || user!.uid;
        const hiddenRef = doc(db, 'hidden_merchant_files', effectiveUserId);
        const hiddenSnap = await getDoc(hiddenRef);
        let qaCache = [];
        if (hiddenSnap.exists()) {
          qaCache = hiddenSnap.data().qaCache || [];
        }

        // Avoid adding duplicate cache entries for the same question
        const exists = qaCache.some(item => item.question.toLowerCase().trim() === question.toLowerCase());
        if (!exists && question.length > 2 && answer.length > 2) {
          qaCache.push({
            question,
            answer,
            timestamp: new Date().toISOString()
          });
          await setDoc(hiddenRef, {
            userId: effectiveUserId,
            qaCache,
            updatedAt: new Date().toISOString()
          }, { merge: true });
          console.log("[Learned Manual Q&A]", question, "->", answer);
        }
      }
    } catch (learnErr) {
      console.warn("Failed to save learned Q&A to merchant's hidden file:", learnErr);
    }

    await updateDoc(doc(db, 'site_chats', selectedSiteChatId), {
      messages: finalMsgs,
      lastMessageAt: new Date().toISOString(),
      unreadForAdmin: false,
      unreadForCustomer: true
    });
  };

  const handleToggleGlobalBot = async () => {
    if (!user) return;
    const effectiveUserId = activeDelegateId || user.uid;
    const currentStatus = currentUserProfile?.globalBotActive !== false;
    try {
      await updateDoc(doc(db, 'users', effectiveUserId), {
        globalBotActive: !currentStatus
      });
    } catch (err) {
      console.error("Failed to toggle global bot status:", err);
    }
  };

  const handleDeleteSiteChat = (chatId: string) => {
    setDeleteConfirmSiteChatId(chatId);
  };

  const handleConfirmDeleteSiteChat = async () => {
    if (!deleteConfirmSiteChatId) return;
    setIsDeletingSiteChat(true);
    try {
      await deleteDoc(doc(db, 'site_chats', deleteConfirmSiteChatId));
      if (selectedSiteChatId === deleteConfirmSiteChatId) {
        setSelectedSiteChatId(null);
      }
      setDeleteConfirmSiteChatId(null);
    } catch (err) {
      console.error("Error deleting site chat:", err);
    } finally {
      setIsDeletingSiteChat(false);
    }
  };

  const isGlobalBotActive = currentUserProfile?.globalBotActive !== false;

  return (
    <div className="space-y-4">
      {/* Delegation Switcher header */}
      {delegations.length > 0 && (
        <div className="p-4 rounded-2xl bg-dragon-cyan/10 border border-dragon-cyan/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1">
          <div>
            <span className="text-[10px] font-black text-dragon-cyan tracking-widest uppercase block leading-none">Delegated Access Board</span>
            <p className="text-[10px] text-white font-bold uppercase mt-1.5 flex items-center gap-1.5 leading-none">
              {activeDelegateId ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-dragon-cyan animate-pulse inline-block" />
                  <span>You are currently managing the site messenger of <span className="text-dragon-cyan font-black">{activeDelegate?.grantorName}</span></span>
                </>
              ) : (
                <span>You are currently in your personal site messenger dashboard</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[8px] uppercase font-black tracking-widest text-gray-500">Switch View:</span>
            <select
              value={activeDelegateId}
              onChange={(e) => {
                const val = e.target.value;
                setActiveDelegateId(val);
                if (val) {
                  localStorage.setItem('active_delegate_user_id', val);
                  setActiveDelegate(delegations.find(d => d.grantorId === val) || null);
                } else {
                  localStorage.removeItem('active_delegate_user_id');
                  setActiveDelegate(null);
                }
              }}
              className="bg-black/55 border border-white/10 text-white font-black text-[9.5px] uppercase tracking-widest px-3 py-1.5 rounded-xl accent-dragon-cyan focus:outline-none focus:ring-1 focus:ring-dragon-cyan/50"
            >
              <option value="">My Account (Personal Panel)</option>
              {delegations.map((d, idx) => (
                <option key={`del-opt-${d.id || d.grantorId || idx}-${idx}`} value={d.grantorId}>{d.grantorName}'s Panel</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-[calc(100dvh-220px)] lg:h-[720px] min-h-[500px] overflow-hidden">
        {/* Sidebar list side (collapsible on demand) */}
        {!isSiteListCollapsed && (
          <div className={cn(
            "w-full lg:w-[320px] glory-glass rounded-2xl lg:rounded-3xl p-3 lg:p-4 flex-col space-y-3 lg:space-y-4 h-full shrink-0 overflow-y-auto custom-scrollbar",
            selectedSiteChatId ? "hidden lg:flex" : "flex"
          )}>
            <div className="flex items-center justify-between border-b border-white/5 pb-2 gap-2">
              <div className="truncate">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-[#888899] truncate">Active Chat Sessions ({siteChats.length})</h4>
                <p className="text-[9px] text-[#555566] leading-relaxed mt-1 truncate">Real-time chat with website visitors & customers</p>
              </div>
              {/* Global Auto Bot Toggle Button */}
              <div className="flex items-center gap-1.5 shrink-0 bg-white/5 border border-white/10 rounded-full px-2 py-0.5 select-none" title={isGlobalBotActive ? "Bot will automatically respond to new messages" : "Bot disabled, reply manually"}>
                <button
                  type="button"
                  onClick={handleToggleGlobalBot}
                  className={cn(
                    "relative inline-flex h-3.5 w-6.5 shrink-0 cursor-pointer rounded-full border border-white/10 transition-colors duration-200 ease-in-out focus:outline-none",
                    isGlobalBotActive ? "bg-dragon-cyan" : "bg-zinc-800"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-2.5 w-2.5 transform rounded-full bg-zinc-100 transition duration-200 ease-in-out mt-[1px] ml-[1px]",
                      isGlobalBotActive ? "translate-x-2.5" : "translate-x-0"
                    )}
                  />
                </button>
                <span className={cn("text-[8px] font-extrabold uppercase tracking-tighter shrink-0", isGlobalBotActive ? "text-dragon-cyan" : "text-gray-500")}>
                  {isGlobalBotActive ? "BOT ON" : "BOT OFF"}
                </span>
              </div>
            </div>

            {siteChats.length === 0 ? (
              <div className="py-12 text-center">
                <MessageSquare size={32} className="mx-auto text-gray-700 mb-2" />
                <p className="text-[11px] text-gray-500 font-bold">No active site chats found.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {siteChats.map((sc, idx) => {
                  const isSelected = sc.id === selectedSiteChatId;
                  const lastMsgText = sc.messages && sc.messages.length > 0 
                    ? sc.messages[sc.messages.length - 1].text 
                    : 'New session started';
                  return (
                    <div
                      key={`site-chat-${sc.id || ''}-${idx}`}
                      onClick={() => {
                        setSelectedSiteChatId(sc.id);
                        // Clear unread mark only if currently unread (saves write quota)
                        if (sc.unreadForAdmin) {
                          try {
                            updateDoc(doc(db, 'site_chats', sc.id), { unreadForAdmin: false });
                          } catch (e) {
                            console.warn("Silent failure updating read status:", e);
                          }
                        }
                      }}
                      className={cn(
                        "w-full text-left p-3 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-3 relative cursor-pointer group",
                        isSelected 
                          ? "bg-dragon-cyan/15 border-dragon-cyan/40" 
                          : "bg-white/5 border-white/5 hover:border-white/15"
                      )}
                    >
                      <div className="space-y-1 truncate flex-1 pointer-events-none">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-white">{sc.customerName || 'Anonymous Customer'}</span>
                        </div>
                        {sc.chatSourceTitle && (
                          <span className="px-1.5 py-0.5 rounded bg-dragon-cyan/10 border border-dragon-cyan/25 text-dragon-cyan text-[8px] font-bold inline-block truncate max-w-[180px] my-0.5">
                            🔗 {sc.chatSourceTitle}
                          </span>
                        )}
                        <p className="text-[9px] text-[#888899] truncate font-light leading-relaxed">{lastMsgText}</p>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="text-[8.5px] text-gray-600 font-bold uppercase pointer-events-none">
                          {sc.lastMessageAt ? new Date(sc.lastMessageAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                          {sc.unreadForAdmin && (
                            <span className="w-2 h-2 rounded-full bg-dragon-cyan animate-pulse pointer-events-none"></span>
                          )}

                          {/* Delete button inside row */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmSiteChatId(sc.id);
                            }}
                            className="w-6 h-6 rounded-md bg-red-500/10 border border-red-500/20 text-red-500 hover:text-red-400 hover:bg-red-500/20 transition-all flex items-center justify-center cursor-pointer shrink-0"
                            title="Delete chat history"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Content Active Chat Side (grows elegantly to full bleed width if collapsed) */}
        <div className={cn(
          "flex-1 glory-glass rounded-2xl lg:rounded-3xl p-3 lg:p-5 flex-col justify-between h-full overflow-hidden",
          selectedSiteChatId ? "flex" : "hidden lg:flex"
        )}>
          {selectedSiteChatId ? (
            (() => {
              const activeChat = siteChats.find(c => c.id === selectedSiteChatId);
              if (!activeChat) return null;
              return (
                <div className="flex flex-col h-full justify-between gap-3 overflow-hidden">
                  {/* Active Chat Header */}
                  <div className="border-b border-white/5 pb-3 flex items-center justify-between gap-4 shrink-0">
                    <div className="truncate flex items-center gap-2 sm:gap-3">
                      {/* Mobile Back button */}
                      <button
                        type="button"
                        onClick={() => setSelectedSiteChatId(null)}
                        className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-[#00f2fe] hover:text-white transition-all hover:bg-white/10 flex items-center justify-center gap-1 text-[10px] font-black cursor-pointer"
                        title="Back to list"
                      >
                        <ChevronLeft size={14} />
                        <span>List</span>
                      </button>

                      {/* Toggle list collapsed state helper button */}
                      <button
                        type="button"
                        onClick={() => setIsSiteListCollapsed(!isSiteListCollapsed)}
                        className="hidden lg:flex p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all hover:bg-white/10 items-center justify-center"
                        title={isSiteListCollapsed ? "Show customer list" : "Full-screen chat view (Hide list)"}
                      >
                        {isSiteListCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                      </button>
                      <div className="truncate">
                        <h4 className="text-sm font-black text-white truncate flex items-center gap-2">
                          <span>{activeChat.customerName}</span>
                        </h4>
                        <span className="text-[9px] text-[#888899] font-mono leading-none block mt-1 truncate">
                          Token: {activeChat.customerToken}
                          {activeChat.chatSourceTitle && ` • Source: ${activeChat.chatSourceTitle}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Delete Session */}
                      <button
                        type="button"
                        onClick={() => handleDeleteSiteChat(activeChat.id)}
                        className="w-8 h-8 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-500 flex items-center justify-center transition-all cursor-pointer border border-red-500/20"
                        title="Delete chat"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div ref={siteChatContainerRef} className="flex-1 overflow-y-auto p-2 space-y-4 custom-scrollbar">
                    {activeChat.messages && activeChat.messages.length > 0 ? (
                      activeChat.messages.map((m: any, idx: number) => {
                        const isCust = m.sender === 'customer';
                        const isBot = m.sender === 'bot' || m.sender === 'model';
                        
                        return (
                          <div key={`site-chat-msg-${m.id || ''}-${idx}`} className={cn("flex flex-col gap-1 max-w-[85%] relative group", isCust ? "mr-auto items-start animate-[fadeIn_0.3s_ease_out]" : "ml-auto items-end")}>
                            {/* Swipe-Reply / Drag Container wrapper */}
                            <motion.div
                              drag="x"
                              dragConstraints={{ left: isCust ? 0 : -60, right: isCust ? 60 : 0 }}
                              dragElastic={0.4}
                              onDragEnd={(event, info) => {
                                if (isCust && info.offset.x > 45) {
                                  setSiteChatReplyingTo({
                                    id: m.id || `msg-${idx}`,
                                    sender: 'Customer',
                                    text: m.text
                                  });
                                } else if (!isCust && info.offset.x < -45) {
                                  setSiteChatReplyingTo({
                                    id: m.id || `msg-${idx}`,
                                    sender: isBot ? 'DOEL messenger' : 'You',
                                    text: m.text
                                  });
                                }
                              }}
                              className="relative cursor-pointer max-w-full"
                              title="Swipe left/right to reply"
                            >
                              {/* Quoted Text preview above the text bubble if it is a reply */}
                              {m.replyTo && (
                                <div className={cn(
                                  "bg-white/5 border-l-2 px-2.5 py-1 rounded-xl text-[9px] text-[#888899] select-none mb-1.5 italic max-w-full truncate",
                                  isCust ? "border-dragon-cyan" : "border-indigo-400 ml-auto text-right"
                                )}>
                                  <span className="font-extrabold text-[8px] text-dragon-cyan uppercase not-italic mr-1">
                                    Reply to {m.replyTo.sender}:
                                  </span>
                                  {m.replyTo.text}
                                </div>
                              )}

                              {m.image && (
                                <div className="relative rounded-2xl overflow-hidden border border-white/10 max-w-[200px] mb-1">
                                  <img src={m.image} alt="Attachment" className="max-h-48 object-cover rounded-xl" />
                                </div>
                              )}

                              <div className="flex items-center gap-1.5 group/bubble">
                                {/* Action button to reply directly via click on hover */}
                                {!isCust && (
                                  <button
                                    type="button"
                                    onClick={() => setSiteChatReplyingTo({
                                      id: m.id || `msg-${idx}`,
                                      sender: isBot ? 'DOEL messenger' : 'You',
                                      text: m.text
                                    })}
                                    className="opacity-0 group-hover/bubble:opacity-100 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 hover:text-dragon-cyan transition-all text-gray-500 self-center"
                                    title="Swipe or click to reply"
                                  >
                                    <CornerUpLeft size={11} />
                                  </button>
                                )}

                                <div 
                                  style={!isCust && !isBot ? { color: '#ffffff' } : undefined}
                                  className={cn(
                                    "px-4 py-2.5 rounded-[20px] text-[14.5px] sm:text-[15px] font-normal leading-relaxed shadow-xs relative transition-all duration-200", 
                                    isCust 
                                      ? "rounded-bl-[4px] msg-bubble-other" 
                                      : isBot
                                        ? "rounded-tr-[4px] bg-slate-900 text-cyan-300 border border-cyan-500/30 msg-bubble-bot"
                                        : "rounded-br-[4px] msg-bubble-own text-white"
                                  )}
                                >
                                  {/* Visual Sender Badge inside chat thread showing bot messages as well */}
                                  {isCust ? (
                                    <div className="text-[8px] font-bold text-gray-400 mb-0.5 tracking-wider select-none">
                                      💬 Customer
                                    </div>
                                  ) : isBot ? (
                                    <div className="text-[8px] font-black text-dragon-cyan mb-0.5 tracking-wider select-none flex items-center gap-1">
                                      <Sparkles size={8} className="animate-spin duration-3000" />
                                      <span>🤖 DOEL messenger (Auto-Bot)</span>
                                    </div>
                                  ) : (
                                    <div className="text-[8px] font-black text-white/90 mb-0.5 tracking-wider select-none">
                                      👤 You (Admin)
                                    </div>
                                  )}

                                  <p style={!isCust && !isBot ? { color: '#ffffff' } : undefined} className={cn("whitespace-pre-line leading-relaxed", !isCust && !isBot ? "text-white" : "")}>{m.text}</p>
                                </div>

                                {isCust && (
                                  <button
                                    type="button"
                                    onClick={() => setSiteChatReplyingTo({
                                      id: m.id || `msg-${idx}`,
                                      sender: 'Customer',
                                      text: m.text
                                    })}
                                    className="opacity-0 group-hover/bubble:opacity-100 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 hover:text-dragon-cyan transition-all text-gray-500 self-center"
                                    title="Swipe or click to reply"
                                  >
                                    <CornerUpLeft size={11} />
                                  </button>
                                )}
                              </div>
                            </motion.div>

                            <div className={cn("flex items-center gap-1.5 px-1 text-[8px] font-bold text-gray-500 uppercase tracking-widest", !isCust ? "ml-auto" : "mr-auto")}>
                              <span>{m.timestamp ? new Date(m.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                              {!isCust && (
                                <span className="flex items-center gap-0.5 text-dragon-cyan ml-0.5">
                                  <CheckCheck size={10} className="text-dragon-cyan" />
                                  <span className="text-[7.5px] lowercase font-semibold">Delivered</span>
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-12 text-center text-gray-500 text-[11px]">No messages yet.</div>
                    )}
                  </div>

                  {/* Replying context visual bar */}
                  {siteChatReplyingTo && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-black/80 border border-dragon-cyan/20 px-3 py-2 rounded-xl flex items-center justify-between gap-3 shrink-0 mx-1"
                    >
                      <div className="truncate text-left text-[10px]">
                        <span className="font-extrabold text-dragon-cyan block">
                          Replying to {siteChatReplyingTo.sender}:
                        </span>
                        <span className="text-[#888899] italic block truncate max-w-[400px]">{siteChatReplyingTo.text}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setSiteChatReplyingTo(null)} 
                        className="w-5 h-5 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition"
                      >
                        <X size={10} />
                      </button>
                    </motion.div>
                  )}

                  {/* Reply Input Form */}
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendSiteReply();
                    }} 
                    className="bg-black/45 border border-white/5 rounded-2xl p-2 flex gap-2 shrink-0"
                  >
                    <textarea
                      rows={1}
                      value={siteChatReplyText}
                      onChange={(e) => setSiteChatReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendSiteReply();
                        }
                      }}
                      placeholder="Type a reply to the customer... (Shift+Enter for new line)"
                      className="flex-1 bg-transparent px-3 py-2 outline-none text-xs text-white placeholder-gray-500 font-sans resize-none max-h-28 leading-relaxed scrollbar-thin"
                    />
                    <button
                      type="submit"
                      disabled={!siteChatReplyText.trim()}
                      className="px-4 py-2 h-9 text-[10px] font-black uppercase tracking-widest bg-dragon-cyan text-dragon-black hover:text-white rounded-xl active:scale-95 disabled:opacity-40 disabled:scale-100 transition-all cursor-pointer flex items-center justify-center shrink-0 font-sans"
                    >
                      Send
                    </button>
                  </form>
                </div>
              );
            })()
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <MessageSquare size={48} className="text-gray-700 mb-4 animate-bounce" />
              <h4 className="text-xs font-black uppercase tracking-widest text-[#888899]">Inbox Empty</h4>
              <p className="text-[10px] text-gray-500 max-w-xs mt-2 leading-relaxed">
                Select a chat from the customer list on the left to start messaging.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* DELETE SITE CHAT CONFIRMATION POPUP MODAL */}
      <AnimatePresence>
        {deleteConfirmSiteChatId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dragon-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0f1118]/95 border border-red-500/30 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl p-6 space-y-6"
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-3 rounded-full bg-red-500/15 text-red-500 animate-bounce">
                  <Trash2 size={32} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-wider text-white">Delete Chat History Warning!</h3>
                <p className="text-xs text-gray-400 font-sans leading-relaxed">
                  Are you sure you want to completely delete this customer's chat history? Once deleted, this chat history cannot be recovered.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full font-sans">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmSiteChatId(null)}
                  disabled={isDeletingSiteChat}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-400 font-bold uppercase tracking-widest text-[10px] rounded-xl transition-all border border-white/5 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteSiteChat}
                  disabled={isDeletingSiteChat}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-lg shadow-red-500/20 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isDeletingSiteChat ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={12} />
                      Delete
                    </>
                  ) }
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
