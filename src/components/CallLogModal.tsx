import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Phone, 
  Video, 
  PhoneIncoming, 
  PhoneOutgoing, 
  PhoneMissed, 
  Search, 
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Clock,
  Calendar
} from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, Message } from '../types';
import { formatDate } from '../lib/utils';

export interface CallLogViewProps {
  currentUser: { uid: string; name?: string; profileImage?: string };
  otherUser?: UserProfile | null;
  messages?: Message[];
  chats?: any[];
  profilesCache?: Record<string, UserProfile>;
  onInitiateCall?: (type: 'audio' | 'video', targetUser?: UserProfile) => void;
  onBack?: () => void;
  isPageMode?: boolean;
}

export const CallLogView: React.FC<CallLogViewProps> = ({
  currentUser,
  otherUser,
  messages = [],
  chats = [],
  profilesCache = {},
  onInitiateCall,
  onBack,
  isPageMode = false
}) => {
  const [filter, setFilter] = useState<'all' | 'missed'>('all');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedContacts, setExpandedContacts] = useState<Record<string, boolean>>({});

  // Real-time Firestore calls list states
  const [outgoingCalls, setOutgoingCalls] = useState<any[]>([]);
  const [incomingCalls, setIncomingCalls] = useState<any[]>([]);

  // 1. Subscribe to Firestore 'calls' collection for real-time accuracy
  useEffect(() => {
    if (!currentUser?.uid) return;

    const q1 = query(
      collection(db, 'calls'),
      where('callerId', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(30)
    );
    const unsub1 = onSnapshot(q1, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOutgoingCalls(list);
    }, (err) => {
      console.warn("CallLogView outgoing listener error:", err);
    });

    const q2 = query(
      collection(db, 'calls'),
      where('receiverId', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(30)
    );
    const unsub2 = onSnapshot(q2, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setIncomingCalls(list);
    }, (err) => {
      console.warn("CallLogView incoming listener error:", err);
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [currentUser?.uid]);

  // 2. Parse call logs from chat messages (for backward compatibility)
  const chatCallLogs = useMemo(() => {
    if (!currentUser?.uid) return [];

    const rawLogs: Array<{
      id: string;
      text: string;
      createdAt: string | number;
      targetUserId?: string;
    }> = [];

    // Gather from messages array
    if (messages && messages.length > 0) {
      messages.forEach(m => {
        if (m.text && (m.text.startsWith('CALL_LOG:') || m.text.startsWith('VIDEO_CALL_LOG:'))) {
          rawLogs.push({
            id: m.id,
            text: m.text,
            createdAt: m.createdAt,
            targetUserId: otherUser?.uid
          });
        }
      });
    }

    // Gather from chats array
    if (chats && chats.length > 0) {
      chats.forEach(chat => {
        if (chat.lastMessage && (chat.lastMessage.startsWith('CALL_LOG:') || chat.lastMessage.startsWith('VIDEO_CALL_LOG:'))) {
          const otherId = chat.participants?.find((p: string) => p !== currentUser.uid) || chat.userId;
          rawLogs.push({
            id: chat.id,
            text: chat.lastMessage,
            createdAt: chat.lastMessageAt || new Date().toISOString(),
            targetUserId: otherId
          });
        }
      });
    }

    // Deduplicate
    const seen = new Set<string>();
    const uniqueLogs = rawLogs.filter(item => {
      const key = `${item.text}_${item.createdAt}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return uniqueLogs.map((m) => {
      const isVideo = m.text.startsWith('VIDEO_CALL_LOG:');
      const parts = m.text.split(':');
      const callerId = parts[1] || '';
      const receiverId = parts[2] || '';
      const status = parts[3] || 'ended';
      const durationSecs = parseInt(parts[4], 10) || 0;

      const isCaller = currentUser.uid === callerId;
      const isConnected = status === 'connected' || durationSecs > 0;
      const isMissed = !isConnected;

      const formattedTime = formatDate(m.createdAt);

      const counterPartyId = isCaller ? receiverId : callerId;
      const matchedProfile = m.targetUserId ? profilesCache[m.targetUserId] : profilesCache[counterPartyId];
      const personName = otherUser?.name || matchedProfile?.name || 'User';
      const personPhoto = otherUser?.profileImage || matchedProfile?.profileImage || '';

      return {
        id: m.id,
        timestamp: new Date(m.createdAt).getTime(),
        dateStr: formattedTime,
        isVideo,
        callerId,
        receiverId,
        isCaller,
        status,
        durationSecs,
        isConnected,
        isMissed,
        personName,
        personPhoto,
        matchedProfile
      };
    });
  }, [messages, chats, currentUser?.uid, otherUser, profilesCache]);

  // 3. Combine and Deduplicate both sources (Firestore 'calls' + parsed chat logs)
  const combinedAllLogs = useMemo(() => {
    const rawList: any[] = [];
    const seenIds = new Set<string>();

    // Add from real-time Firestore calls
    const allFsCalls = [...outgoingCalls, ...incomingCalls];
    allFsCalls.forEach(c => {
      if (seenIds.has(c.id)) return;
      seenIds.add(c.id);

      const isCaller = currentUser.uid === c.callerId;
      const isConnected = c.status === 'connected' || c.status === 'ended' || (c.durationSecs && c.durationSecs > 0);
      const isMissed = !isConnected;

      const otherId = isCaller ? c.receiverId : c.callerId;
      const matchedProfile = profilesCache[otherId];
      const personName = isCaller 
        ? (c.receiverName || matchedProfile?.name || 'User') 
        : (c.callerName || matchedProfile?.name || 'User');
      const personPhoto = isCaller 
        ? (c.receiverPhoto || matchedProfile?.profileImage || '') 
        : (c.callerPhoto || matchedProfile?.profileImage || '');

      rawList.push({
        id: c.id,
        timestamp: c.createdAt ? new Date(c.createdAt).getTime() : Date.now(),
        dateStr: formatDate(c.createdAt || new Date().toISOString()),
        isVideo: c.type === 'video',
        callerId: c.callerId,
        receiverId: c.receiverId,
        isCaller,
        status: c.status,
        durationSecs: c.durationSecs || 0,
        isConnected,
        isMissed,
        personName,
        personPhoto,
        matchedProfile: matchedProfile || { uid: otherId, name: personName, profileImage: personPhoto }
      });
    });

    // Add from messages/chats parsed logs if they are not duplicates
    chatCallLogs.forEach(log => {
      const isDuplicate = rawList.some(item => 
        (item.id === log.id) || 
        (Math.abs(item.timestamp - log.timestamp) < 5000 && 
         item.callerId === log.callerId && 
         item.receiverId === log.receiverId)
      );

      if (!isDuplicate) {
        rawList.push(log);
      }
    });

    return rawList.sort((a, b) => b.timestamp - a.timestamp);
  }, [outgoingCalls, incomingCalls, chatCallLogs, currentUser.uid, profilesCache]);

  // 4. Apply filters & search before grouping
  const filteredRawLogs = useMemo(() => {
    return combinedAllLogs.filter((log) => {
      if (filter === 'missed' && !log.isMissed) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = log.personName.toLowerCase().includes(q);
        const matchesDate = log.dateStr.toLowerCase().includes(q);
        return matchesName || matchesDate;
      }

      return true;
    });
  }, [combinedAllLogs, filter, searchQuery]);

  // 5. Group logs by contact (other party) with precise counts & talk time aggregates
  const groupedLogs = useMemo(() => {
    const groups: Record<string, {
      contactId: string;
      personName: string;
      personPhoto: string;
      matchedProfile?: UserProfile;
      totalCalls: number;
      outgoingCount: number;
      incomingConnectedCount: number;
      incomingMissedCount: number;
      totalTalkSecs: number;
      lastCallTimestamp: number;
      lastCallDateStr: string;
      lastCallIsVideo: boolean;
      lastCallIsCaller: boolean;
      lastCallIsMissed: boolean;
      callsList: any[];
    }> = {};

    filteredRawLogs.forEach(log => {
      const otherId = log.isCaller ? log.receiverId : log.callerId;
      if (!otherId) return;

      if (!groups[otherId]) {
        groups[otherId] = {
          contactId: otherId,
          personName: log.personName,
          personPhoto: log.personPhoto,
          matchedProfile: log.matchedProfile,
          totalCalls: 0,
          outgoingCount: 0,
          incomingConnectedCount: 0,
          incomingMissedCount: 0,
          totalTalkSecs: 0,
          lastCallTimestamp: log.timestamp,
          lastCallDateStr: log.dateStr,
          lastCallIsVideo: log.isVideo,
          lastCallIsCaller: log.isCaller,
          lastCallIsMissed: log.isMissed,
          callsList: []
        };
      }

      const g = groups[otherId];
      g.totalCalls += 1;
      g.callsList.push(log);

      if (log.isCaller) {
        g.outgoingCount += 1;
      } else {
        if (log.isMissed) {
          g.incomingMissedCount += 1;
        } else {
          g.incomingConnectedCount += 1;
        }
      }

      if (log.durationSecs) {
        g.totalTalkSecs += log.durationSecs;
      }

      // Track most recent call info
      if (log.timestamp > g.lastCallTimestamp) {
        g.lastCallTimestamp = log.timestamp;
        g.lastCallDateStr = log.dateStr;
        g.lastCallIsVideo = log.isVideo;
        g.lastCallIsCaller = log.isCaller;
        g.lastCallIsMissed = log.isMissed;
      }
    });

    // Convert to sorted array based on last call timestamp
    return Object.values(groups).sort((a, b) => b.lastCallTimestamp - a.lastCallTimestamp);
  }, [filteredRawLogs]);

  // Utility to format seconds into readable "Xm Ys"
  const formatDuration = (secs: number) => {
    if (secs <= 0) return '0s';
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    if (mins > 0) {
      return `${mins}m ${remainingSecs}s`;
    }
    return `${remainingSecs}s`;
  };

  const toggleExpand = (contactId: string) => {
    setExpandedContacts(prev => ({
      ...prev,
      [contactId]: !prev[contactId]
    }));
  };

  return (
    <div className={`font-sans bg-[#0b0f17] text-white rounded-2xl overflow-hidden ${isPageMode ? 'min-h-[500px] pb-12' : ''}`}>
      {/* WhatsApp Style Calls Header */}
      <div className="p-4 bg-[#114e16] text-white border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 rounded-full hover:bg-white/10 text-white transition-all cursor-pointer"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <h2 className="text-[25px] font-bold text-white tracking-tight">Calls</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Toggle Button */}
          <button
            type="button"
            onClick={() => setShowSearch(!showSearch)}
            className={`p-2 rounded-full transition-all cursor-pointer ${
              showSearch ? 'bg-[#128c7e] text-white' : 'text-gray-300 hover:bg-white/10'
            }`}
            title="Search"
          >
            <Search size={18} />
          </button>

          {/* Filter Pills: All / Missed */}
          <div className="flex items-center bg-black/40 p-1 rounded-lg border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-emerald-500 text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter('missed')}
              className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                filter === 'missed'
                  ? 'bg-emerald-500 text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Missed
            </button>
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      {showSearch && (
        <div className="p-3 bg-zinc-900 border-b border-white/5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              autoFocus
            />
          </div>
        </div>
      )}

      {/* CALL LOG LIST */}
      <div className="divide-y divide-white/5">
        {groupedLogs.length === 0 ? (
          <div className="py-20 text-center text-gray-400 flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-gray-500 mb-2">
              <Phone size={24} />
            </div>
            <p className="text-base font-medium text-gray-300">No call history</p>
            <p className="text-xs text-gray-500">
              {searchQuery ? 'No contacts match your search.' : 'Recent call history will appear here.'}
            </p>
          </div>
        ) : (
          groupedLogs.map((group) => {
            const isExpanded = !!expandedContacts[group.contactId];

            return (
              <div
                key={group.contactId}
                className="bg-zinc-950/20 hover:bg-zinc-900/10 transition-colors"
              >
                {/* Contact Header Panel */}
                <div className="px-4 py-3.5 flex items-center justify-between gap-3">
                  {/* Left Side: Avatar and Info */}
                  <div 
                    onClick={() => toggleExpand(group.contactId)}
                    className="flex items-center gap-3.5 min-w-0 cursor-pointer flex-1"
                  >
                    {group.personPhoto ? (
                      <img
                        src={group.personPhoto}
                        alt={group.personName}
                        className="w-12 h-12 rounded-full object-cover border border-white/10 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#128c7e]/20 text-[#128c7e] font-bold text-lg flex items-center justify-center shrink-0 border border-[#128c7e]/30">
                        {group.personName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0">
                      {/* Name + Count of Calls */}
                      <h3 className={`text-base font-bold truncate flex items-center gap-1.5 ${group.lastCallIsMissed ? 'text-red-400' : 'text-white'}`}>
                        <span>{group.personName}</span>
                        {group.totalCalls > 1 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300 font-semibold">
                            {group.totalCalls}
                          </span>
                        )}
                      </h3>

                      {/* Last Call Details + Total Talk Time */}
                      <div className="flex flex-col gap-0.5 mt-1">
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          {group.lastCallIsCaller ? (
                            <PhoneOutgoing size={13} className="text-emerald-400 shrink-0" />
                          ) : group.lastCallIsMissed ? (
                            <PhoneMissed size={13} className="text-red-400 shrink-0" />
                          ) : (
                            <PhoneIncoming size={13} className="text-emerald-400 shrink-0" />
                          )}
                          <span className="truncate">{group.lastCallDateStr}</span>
                        </div>

                        {/* Talk duration summary */}
                        <div className="flex items-center gap-3 text-[11px] text-gray-500 font-medium">
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            Total talk: <strong className="text-emerald-400">{formatDuration(group.totalTalkSecs)}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            {group.outgoingCount} Outgoing / {group.incomingConnectedCount + group.incomingMissedCount} Incoming
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Actions (Callback and Expand) */}
                  <div className="flex items-center gap-1 shrink-0">
                    {onInitiateCall && (
                      <button
                        type="button"
                        onClick={() => onInitiateCall(group.lastCallIsVideo ? 'video' : 'audio', group.matchedProfile)}
                        className="p-2.5 rounded-full hover:bg-[#128c7e]/20 text-[#128c7e] hover:text-[#128c7e] transition-all cursor-pointer"
                        title={`Call back (${group.lastCallIsVideo ? 'Video' : 'Audio'})`}
                      >
                        {group.lastCallIsVideo ? <Video size={19} /> : <Phone size={19} />}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleExpand(group.contactId)}
                      className="p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-all cursor-pointer"
                      title={isExpanded ? "Collapse" : "Show detailed history"}
                    >
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Detailed Log Sub-list */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden bg-black/30 border-t border-white/5"
                    >
                      <div className="px-4 py-2 text-[11px] font-bold tracking-wider text-gray-400 uppercase flex items-center gap-1.5 border-b border-white/5 bg-zinc-900/50">
                        <Calendar size={12} />
                        Detailed Log History ({group.callsList.length} Sessions)
                      </div>
                      <div className="divide-y divide-white/5 max-h-[250px] overflow-y-auto">
                        {group.callsList.map((log, index) => {
                          const directionText = log.isCaller 
                            ? 'Outgoing Call' 
                            : log.isMissed 
                              ? 'Missed Call' 
                              : 'Incoming Call';

                          const statusBadgeColor = log.isMissed 
                            ? 'text-red-400 bg-red-500/10 border-red-500/20' 
                            : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';

                          return (
                            <div 
                              key={log.id || index}
                              className="px-6 py-2.5 flex items-center justify-between text-xs hover:bg-white/[0.02]"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {/* Direction Icon */}
                                {log.isCaller ? (
                                  <PhoneOutgoing size={13} className="text-emerald-400 shrink-0" />
                                ) : log.isMissed ? (
                                  <PhoneMissed size={13} className="text-red-400 shrink-0" />
                                ) : (
                                  <PhoneIncoming size={13} className="text-emerald-400 shrink-0" />
                                )}

                                <div className="min-w-0">
                                  <p className="font-semibold text-gray-200">
                                    {directionText} ({log.isVideo ? 'Video' : 'Audio'})
                                  </p>
                                  <p className="text-[10px] text-gray-500 mt-0.5">
                                    {log.dateStr}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusBadgeColor}`}>
                                  {log.isMissed ? 'No Answer' : 'Connected'}
                                </span>
                                {!log.isMissed && (
                                  <span className="text-[11px] font-semibold text-gray-300 bg-zinc-800 px-2 py-0.5 rounded">
                                    {formatDuration(log.durationSecs)}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

interface CallLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { uid: string; name?: string; profileImage?: string };
  otherUser?: UserProfile | null;
  messages?: Message[];
  chats?: any[];
  profilesCache?: Record<string, UserProfile>;
  onInitiateCall?: (type: 'audio' | 'video', targetUser?: UserProfile) => void;
}

export const CallLogModal: React.FC<CallLogModalProps> = ({
  isOpen,
  onClose,
  ...rest
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] overflow-y-auto"
        >
          <div className="absolute top-3 right-3 z-10">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full bg-black/50 hover:bg-black/80 text-gray-400 hover:text-white transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <CallLogView {...rest} />
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
