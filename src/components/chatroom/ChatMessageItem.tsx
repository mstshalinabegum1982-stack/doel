import React, { useState, useRef, useContext, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Reply, 
  Trash2, 
  Phone, 
  Video,
  Clock, 
  CheckCheck, 
  Check, 
  ShoppingBag, 
  Package, 
  User, 
  MapPin, 
  Edit, 
  Wallet, 
  ArrowUpRight, 
  CheckCircle, 
  Pause, 
  Play,
  PhoneMissed,
  PhoneCall
} from 'lucide-react';
import { Message, Order } from '../../types';
import { cn, parseCallLog } from '../../lib/utils';
import { getCurrencySymbol } from '../../utils/countriesData';
import { AuthContext } from '../../authContext';
import { AudioCallContext } from '../../audioCallContext';
import { getCleanReplyPreview } from '../../utils/chatUtils';

export function VoicePlayer({ url, duration, isOwn }: { url: string; duration?: number; isOwn?: boolean }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const [playbackRate, setPlaybackRate] = useState(1);

  const playerId = useMemo(() => Math.random().toString(36).substring(7), []);

  useEffect(() => {
    const handleOtherPlay = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.id !== playerId) {
        if (audioRef.current && !audioRef.current.paused) {
          audioRef.current.pause();
        }
      }
    };

    window.addEventListener('voice-playback-started', handleOtherPlay);
    return () => {
      window.removeEventListener('voice-playback-started', handleOtherPlay);
    };
  }, [playerId]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      const event = new CustomEvent('voice-playback-started', { detail: { id: playerId } });
      window.dispatchEvent(event);
      audioRef.current.play().catch(() => {});
      audioRef.current.playbackRate = playbackRate;
    }
  };

  const cycleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    let next = 1;
    if (playbackRate === 1) next = 1.5;
    else if (playbackRate === 1.5) next = 2;
    else next = 1;
    setPlaybackRate(next);
    if (audioRef.current) {
      audioRef.current.playbackRate = next;
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setTotalDuration(audioRef.current.duration || duration || 0);
      audioRef.current.playbackRate = playbackRate;
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const newTime = parseFloat(e.target.value);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatProgressTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Messenger realistic waveform pattern (dots, low bars, tall speech peaks)
  const waveformHeights = [
    3, 14, 18, 12, 16, 8, 14, 10, 8, 14, 3, 12, 10, 6, 3, 4, 18, 14, 12, 10, 8, 4
  ];

  const displayTime = isPlaying && currentTime > 0 
    ? formatProgressTime(currentTime) 
    : formatProgressTime(totalDuration || 0);

  return (
    <div className="flex items-center gap-2.5 py-0.5 px-0.5 min-w-[230px] sm:min-w-[270px] max-w-[340px] select-none">
      <audio 
        ref={audioRef} 
        src={url} 
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
        className="hidden"
      />
      
      {/* Dark Circle Play/Pause Button as in screenshot */}
      <button 
        type="button"
        onClick={togglePlay}
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer shadow-md",
          isOwn 
            ? "bg-[#182a4d] text-white hover:bg-[#1f3765]" 
            : "bg-[#0084ff] text-white hover:bg-[#0073e6]"
        )}
      >
        {isPlaying ? (
          <Pause size={17} strokeWidth={2.8} className="fill-current" />
        ) : (
          <Play size={17} fill="currentColor" strokeWidth={2.8} className="ml-0.5" />
        )}
      </button>

      {/* Waveform Scrubber in Center */}
      <div className="flex-1 flex items-center h-8 select-none cursor-pointer relative justify-between gap-[2.5px] px-1">
        <input 
          type="range"
          min="0"
          max={totalDuration || 100}
          step="0.1"
          value={currentTime}
          onChange={handleScrub}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
        />
        {waveformHeights.map((h, i) => {
          const percent = ((currentTime || 0) / (totalDuration || 1)) * 100;
          const barPercent = (i / waveformHeights.length) * 100;
          const isActive = percent >= barPercent;

          return (
            <div 
              key={i} 
              style={{ height: `${h}px` }} 
              className={cn(
                "w-[3px] rounded-full transition-all duration-150 shrink-0", 
                isOwn
                  ? (isActive ? "bg-white opacity-100 shadow-[0_0_6px_rgba(255,255,255,0.8)]" : "bg-white/60")
                  : (isActive ? "bg-[#0084ff] opacity-100" : "bg-slate-300 dark:bg-slate-600")
              )}
            />
          );
        })}
      </div>

      {/* Speed Button (1x / 1.5x / 2x) */}
      <button 
        type="button" 
        onClick={cycleSpeed}
        className={cn(
          "px-2 py-0.5 rounded-full text-[11px] font-bold font-mono tracking-tight shrink-0 transition-all cursor-pointer shadow-xs active:scale-90",
          isOwn 
            ? "bg-[#182a4d] text-white hover:bg-[#1f3765] border border-white/20" 
            : "bg-[#f0f2f5] dark:bg-[#3a3b3c] text-[#050505] dark:text-[#e4e6eb] hover:bg-[#e4e6eb] dark:hover:bg-[#4e4f50] border border-gray-200 dark:border-white/10"
        )}
        title="Change Playback Speed"
      >
        {playbackRate}x
      </button>

      {/* Duration on right side (e.g. 0:41) */}
      <span className={cn(
        "text-[13px] font-semibold font-mono tracking-tight shrink-0 select-none",
        isOwn ? "text-white" : "text-[#65676b] dark:text-[#b0b3b8]"
      )}>
        {displayTime}
      </span>
    </div>
  );
}

interface ChatMessageItemProps {
  id?: string;
  message: Message;
  orderData?: Order | null;
  isOwn: boolean;
  onEditOrder?: (order: Order) => void;
  onUpdateStatus?: (id: string, status: string, details?: any) => void;
  onReply?: (msg: Message) => void;
  onPayRequest?: (id: string, trxId: string) => Promise<void> | void;
  onDeleteMessage?: (msg: Message) => void;
  isTarget?: boolean;
  setActiveMapOrder?: (order: Order | null) => void;
  otherUserCountry?: string;
  onPreviewImage?: (url: string | null) => void;
  otherUserAvatar?: string;
  otherUserName?: string;
  showAvatar?: boolean;
  onInitiateCall?: (type: 'audio' | 'video') => void;
}

export function ChatMessageItem({
  id,
  message,
  orderData,
  isOwn,
  onEditOrder,
  onUpdateStatus,
  onReply,
  onPayRequest,
  onDeleteMessage,
  isTarget,
  setActiveMapOrder,
  otherUserCountry,
  onPreviewImage,
  otherUserAvatar,
  otherUserName,
  showAvatar = true,
  onInitiateCall,
}: ChatMessageItemProps) {
  const { user, profile } = useContext(AuthContext);
  const { startCall } = useContext(AudioCallContext);
  const order = orderData || (message as any).orderData || null;
  const [showPayInput, setShowPayInput] = useState(false);
  const [trxId, setTrxId] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);
  const [dragX, setDragX] = useState(0);
  const navigate = useNavigate();

  const handleCallBack = (isVideo: boolean) => {
    if (onInitiateCall) {
      onInitiateCall(isVideo ? 'video' : 'audio');
    } else if (message.senderId && otherUserName) {
      const targetId = isOwn 
        ? (message.chatId?.split('_').find(id => id !== user?.uid) || message.senderId)
        : message.senderId;
      startCall(targetId, otherUserName, otherUserAvatar || '', isVideo ? 'video' : 'audio');
    }
  };

  return (
    <div id={id} className={cn("flex w-full px-2 my-1 items-end gap-2 group relative", isOwn ? "justify-end" : "justify-start")}>
      {!isOwn && (
        <div className="w-7 h-7 shrink-0 mb-0.5">
          {showAvatar ? (
            otherUserAvatar ? (
              <img 
                src={otherUserAvatar} 
                alt={otherUserName || "User"} 
                className="w-7 h-7 rounded-full object-cover shadow-xs border border-gray-200 dark:border-white/10" 
                referrerPolicy="no-referrer" 
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-amber-600 text-white font-bold text-[11px] flex items-center justify-center shadow-xs">
                {(otherUserName || 'U')[0].toUpperCase()}
              </div>
            )
          ) : (
            <div className="w-7" />
          )}
        </div>
      )}

      <motion.div 
        drag="x" 
        dragConstraints={{ left: -100, right: 100 }} 
        dragElastic={0.25}
        dragSnapToOrigin 
        onDrag={(_, info) => {
          setDragX(info.offset.x);
        }}
        onDragEnd={(_, info) => {
          setDragX(0);
          if (Math.abs(info.offset.x) > 35) {
            onReply?.(message);
            if (typeof navigator !== 'undefined' && navigator?.vibrate) {
              try { navigator.vibrate(20); } catch (_) {}
            }
          }
        }}
        style={isOwn ? { color: '#ffffff' } : undefined}
        className={cn(
          "max-w-[80%] sm:max-w-[72%] px-3.5 py-2 rounded-[20px] relative shadow-xs transform-gpu transition-all touch-pan-y cursor-grab active:cursor-grabbing", 
          isOwn 
            ? (message.type === 'voice' ? "rounded-[28px] msg-bubble-own text-white" : "rounded-br-[4px] msg-bubble-own text-white") 
            : (message.type === 'voice' ? "rounded-[28px] msg-bubble-other" : "rounded-bl-[4px] msg-bubble-other"),
          isTarget && "ring-2 ring-sky-400 shadow-xl scale-[1.01] z-10"
        )}
      >
        {/* Swipe Reply Indicator */}
        <div 
          className={cn(
            "absolute top-1/2 -translate-y-1/2 transition-all duration-300 pointer-events-none flex flex-col items-center gap-1 z-20",
            isOwn ? "-left-14" : "-right-14",
            Math.abs(dragX) > 30 ? "opacity-100 scale-110" : "opacity-0 scale-75"
          )}
        >
          <div className="p-2 bg-black/60 dark:bg-white/15 backdrop-blur-md rounded-full shadow-lg">
            <Reply size={18} className={cn("transition-colors", Math.abs(dragX) > 45 ? "text-[#0084ff]" : "text-white")} />
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest text-white drop-shadow-md">Reply</span>
        </div>

        {message.replyToText && (
          <div 
            style={isOwn ? { color: '#ffffff' } : undefined}
            className={cn(
              "mb-2 px-3 py-1.5 rounded-xl text-[11px] truncate opacity-95 message-reply-preview flex items-center gap-1.5",
              isOwn ? "bg-white/20 text-white" : "bg-black/5 dark:bg-white/10 text-gray-700 dark:text-gray-200"
            )}
          >
            <span style={isOwn ? { color: '#ffffff' } : undefined} className="font-semibold not-italic shrink-0 opacity-90">
              {isOwn ? "You:" : `${otherUserName ? otherUserName.split(' ')[0] : 'User'}:`}
            </span>
            <span style={isOwn ? { color: '#ffffff' } : undefined} className="truncate">
              {getCleanReplyPreview({ text: message.replyToText } as any, user?.uid)}
            </span>
          </div>
        )}
        {message.type === 'deleted' && (
          <p className="text-[11px] italic text-gray-400 dark:text-gray-500 flex items-center gap-2">
            <Trash2 size={12} /> This message was deleted
          </p>
        )}
        {message.type === 'text' && (
          <p 
            style={isOwn ? { color: '#ffffff' } : undefined}
            className={cn(
              "text-[14.5px] sm:text-[15px] font-normal leading-relaxed whitespace-pre-wrap",
              isOwn ? "text-white font-normal" : "text-[#050505] dark:text-[#e4e6eb]"
            )}
          >
            {message.text}
          </p>
        )}
        {message.type === 'voice' && message.voiceUrl && (
          <VoicePlayer url={message.voiceUrl} duration={message.voiceDuration} isOwn={isOwn} />
        )}
        
        {/* Real Facebook Messenger Audio & Video Call Log Component */}
        {message.type === 'call' && (() => {
          const parsed = parseCallLog(message.text || '', user?.uid || '');
          if (!parsed) return <p className={cn("text-sm leading-relaxed whitespace-pre-wrap", isOwn ? "text-white" : "text-[#050505] dark:text-[#e4e6eb]")}>{message.text}</p>;
          const isMissed = parsed.type.startsWith('missed');
          const isVideo = parsed.isVideo;
          
          let callTitle = isVideo ? 'Video call' : 'Audio call';
          if (isMissed) {
            callTitle = isVideo ? 'Missed video call' : 'Missed audio call';
          }

          let subText = '';
          if (parsed.type === 'connected') {
            const mins = Math.floor(parsed.durationSecs / 60);
            const secs = parsed.durationSecs % 60;
            subText = mins > 0 ? `${mins} min ${secs} sec` : `${secs} sec`;
          } else {
            subText = message.createdAt ? new Date(message.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Missed';
          }

          return (
            <div className={cn(
              "flex items-center justify-between gap-3 py-1 px-1 min-w-[200px] sm:min-w-[240px] max-w-[320px]",
              isOwn ? "text-white" : "text-[#050505] dark:text-[#e4e6eb]"
            )}>
              <div className="flex items-center gap-3 min-w-0">
                {/* Call Icon Circle */}
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-xs",
                  isMissed 
                    ? (isOwn ? "bg-white/20 text-[#ff4d4f]" : "bg-red-500/15 text-[#fa383e]")
                    : (isOwn ? "bg-white/20 text-white" : "bg-[#0084ff]/15 text-[#0084ff]")
                )}>
                  {isVideo ? (
                    <Video size={20} className="fill-current" />
                  ) : (
                    <Phone size={19} className="fill-current" />
                  )}
                </div>

                {/* Call Details */}
                <div className="min-w-0">
                  <h4 className={cn(
                    "text-[14px] sm:text-[14.5px] font-bold leading-tight truncate",
                    isMissed 
                      ? (isOwn ? "text-white font-black" : "text-[#fa383e]") 
                      : (isOwn ? "text-white" : "text-[#050505] dark:text-[#e4e6eb]")
                  )}>
                    {callTitle}
                  </h4>
                  <p className={cn(
                    "text-[11.5px] mt-0.5 font-normal truncate",
                    isOwn ? "text-white/90" : "text-[#65676b] dark:text-[#b0b3b8]"
                  )}>
                    {subText}
                  </p>
                </div>
              </div>

              {/* Call Back Button */}
              {!isOwn && (
                <button
                  type="button"
                  onClick={() => handleCallBack(isVideo)}
                  className="px-3.5 py-1.5 rounded-full text-[12px] font-semibold bg-[#0084ff] text-white hover:bg-[#0073e6] active:scale-95 transition-all shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Call Back"
                >
                  {isVideo ? <Video size={13} className="fill-current" /> : <Phone size={13} className="fill-current" />}
                  <span>Call back</span>
                </button>
              )}
            </div>
          );
        })()}
        
        {/* Timestamp & Messenger-Style Status */}
        <div className={cn(
          "text-[10px] mt-1.5 font-medium tracking-tight flex items-center gap-1.5 whitespace-nowrap select-none", 
          isOwn ? "justify-end text-white" : "justify-start text-[#65676b] dark:text-[#b0b3b8]"
        )}>
          <span className={isOwn ? "text-white" : ""}>{message.createdAt ? new Date(message.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '...'}</span>

          {isOwn && (
            <div className="flex items-center gap-1 ml-1 text-white">
              {message.status === 'seen' ? (
                <span className="flex items-center gap-0.5 text-[9px] font-bold text-white" title="Seen">
                  <CheckCheck size={13} className="stroke-[2.5]" />
                  <span>Seen</span>
                </span>
              ) : message.status === 'delivered' ? (
                <span className="flex items-center gap-0.5 text-[9px] text-white font-medium" title="Delivered">
                  <CheckCheck size={12} className="stroke-[2]" />
                  <span>Delivered</span>
                </span>
              ) : (
                <span className="flex items-center gap-0.5 text-[9px] text-white font-medium" title="Sent">
                  <Check size={12} className="stroke-[2]" />
                  <span>Sent</span>
                </span>
              )}
            </div>
          )}
        </div>

        {message.type === 'order' && order && (() => {
          const hasMultipleItems = order.items && order.items.length > 0;
          const totalQuantity = hasMultipleItems 
            ? order.items.reduce((acc: number, item: any) => acc + item.quantity, 0)
            : (order.quantity || 1);
          const grandTotal = hasMultipleItems
            ? (Number(order.sellPrice) || 0) + (Number(order.deliveryCharge) || 0)
            : (Number(order.sellPrice) || 0) * (Number(order.quantity) || 1) + (Number(order.deliveryCharge) || 0);

          const currencySymbol = getCurrencySymbol(profile?.country || otherUserCountry || 'Bangladesh');

          return (
            <div ref={cardRef} style={{ backgroundColor: '#0b0c14', color: '#ffffff' }} className="space-y-3.5 min-w-[250px] sm:min-w-[290px] max-w-full sm:max-w-md mt-2 font-sans order-card-container p-3 sm:p-4 rounded-2xl border-2 border-purple-400/80 shadow-2xl">
               <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', borderColor: 'rgba(0, 245, 212, 0.25)' }} className="order-card-header flex justify-between items-center p-3 rounded-2xl border shadow-md">
                  <div className="flex items-center gap-2">
                    <div style={{ backgroundColor: 'rgba(0, 245, 212, 0.1)' }} className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 animate-pulse">
                      <ShoppingBag size={14} style={{ color: '#00f5d4' }} className="text-dragon-cyan" />
                    </div>
                    <span style={{ color: '#00f5d4' }} className="order-card-header-text text-[9px] sm:text-[10px] font-black tracking-widest uppercase">
                      {hasMultipleItems ? "Shopping Cart Order" : "Product Order"}
                    </span>
                  </div>
               </div>

               {hasMultipleItems ? (
                 /* Multi-item cart list display */
                 <div className="space-y-2 max-h-[30vh] overflow-y-auto no-scrollbar pr-1">
                   {order.items.map((item: any, idx: number) => (
                     <div key={idx} style={{ backgroundColor: 'rgba(0, 0, 0, 0.25)', borderColor: 'rgba(255, 255, 255, 0.08)' }} className="order-product-card p-2.5 border rounded-xl flex flex-col gap-1.5 relative overflow-hidden">
                       <div className="flex gap-2.5 items-center justify-between">
                         <div className="flex gap-2 items-center min-w-0 flex-1">
                           <img 
                             src={item.image || undefined} 
                             className="w-10 h-10 rounded-lg object-cover bg-white/5 shrink-0 cursor-pointer hover:opacity-80 transition-opacity" 
                             alt="" 
                             referrerPolicy="no-referrer" 
                             onClick={() => onPreviewImage?.(item.image || null)} 
                           />
                           <div className="min-w-0 flex-1">
                             <h5 style={{ color: '#ffffff' }} className="order-product-title font-bold text-[11px] truncate uppercase tracking-tight">{item.name}</h5>
                             <span style={{ color: '#00f5d4' }} className="order-product-price font-bold text-[10px] font-mono">{currencySymbol}{item.sellPrice}</span>
                           </div>
                         </div>
                         <div style={{ backgroundColor: 'rgba(0, 245, 212, 0.1)', color: '#00f5d4', borderColor: 'rgba(0, 245, 212, 0.2)' }} className="text-[10px] font-black border px-2 py-0.5 rounded-lg font-mono shrink-0">
                           Qty: {item.quantity}
                         </div>
                       </div>
                       
                       {/* Nested sub-unit specs display */}
                       {item.specs && item.specs.length > 0 && (
                         <div className="border-t border-white/5 pt-1.5 mt-0.5 space-y-1">
                           {item.specs.map((sp: any, sIdx: number) => (
                             <div key={sIdx} style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', color: '#9ca3af' }} className="text-[8.5px] p-1 rounded-md flex flex-wrap gap-2 items-center">
                               <span style={{ color: '#818cf8' }} className="font-black">#{(sIdx + 1)}:</span>
                               {sp.color && <span className="opacity-90">Color: {sp.color}</span>}
                               {sp.size && <span className="opacity-90">Size: {sp.size}</span>}
                               {sp.weight && <span className="opacity-90">Weight: {sp.weight}</span>}
                             </div>
                           ))}
                         </div>
                       )}
                     </div>
                   ))}
                 </div>
               ) : (
                 /* Traditional Single Product View */
                 <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.25)', borderColor: 'rgba(255, 255, 255, 0.08)' }} className="order-product-card flex gap-3 sm:gap-4 p-3 rounded-2xl border relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 opacity-5 rotate-12 pointer-events-none">
                       <Package size={80} className="text-white" />
                    </div>
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/5 rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-inner cursor-pointer" onClick={() => onPreviewImage?.(order.productImage || null)}>
                       <img src={order.productImage || undefined} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                       <div style={{ color: '#ffffff' }} className="order-product-title text-xs sm:text-sm font-black truncate leading-tight mb-1">
                         {order.productName || 'Unnamed Product'}
                         {order.quantity > 1 && <span style={{ color: '#00f5d4' }} className="ml-1.5">x{order.quantity}</span>}
                       </div>
                       <div style={{ color: '#00f5d4' }} className="order-product-price text-lg sm:text-xl font-black leading-none">{currencySymbol}{order.sellPrice}</div>
                       
                       {order.productImages && order.productImages.length > 1 && (
                         <div className="flex gap-1 mt-2 overflow-x-auto pb-1 no-scrollbar">
                            {order.productImages.slice(1).map((img: string, i: number) => (
                              <div key={i} className="w-7 h-7 rounded border border-white/10 overflow-hidden shrink-0 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => onPreviewImage?.(img || null)}>
                                <img src={img || undefined} className="w-full h-full object-cover" alt="" />
                              </div>
                            ))}
                         </div>
                       )}

                       <div className="flex flex-wrap gap-1 mt-2">
                         {order.skuCode && <span style={{ color: '#818cf8', backgroundColor: 'rgba(99, 102, 241, 0.1)', borderColor: 'rgba(99, 102, 241, 0.2)' }} className="px-1.5 py-0.5 border rounded text-[7.5px] font-black uppercase tracking-wider">SKU: {order.skuCode}</span>}
                         {order.size && <span style={{ color: '#34d399', backgroundColor: 'rgba(52, 211, 153, 0.1)', borderColor: 'rgba(52, 211, 153, 0.2)' }} className="px-1.5 py-0.5 border rounded text-[7.5px] font-black uppercase tracking-wider">SIZE: {order.size}</span>}
                         {order.color && <span style={{ color: '#fbbf24', backgroundColor: 'rgba(251, 191, 36, 0.1)', borderColor: 'rgba(251, 191, 36, 0.2)' }} className="px-1.5 py-0.5 border rounded text-[7.5px] font-black uppercase tracking-wider">COLOR: {order.color}</span>}
                       </div>
                    </div>
                 </div>
               )}

               <div className="grid grid-cols-3 gap-2">
                  <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', borderColor: 'rgba(255, 255, 255, 0.06)' }} className="order-stats-box p-2 sm:p-3 rounded-2xl border flex flex-col items-center justify-center text-center">
                     <div style={{ color: '#9ca3af' }} className="order-stat-label text-[7.5px] font-black uppercase tracking-widest mb-1 leading-none">Qty</div>
                     <div style={{ color: '#00f5d4' }} className="order-stat-qty text-xs font-black leading-none">{totalQuantity}</div>
                  </div>
                  <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', borderColor: 'rgba(255, 255, 255, 0.06)' }} className="order-stats-box p-2 sm:p-3 rounded-2xl border flex flex-col items-center justify-center text-center">
                     <div style={{ color: '#9ca3af' }} className="order-stat-label text-[7.5px] font-black uppercase tracking-widest mb-1 leading-none">Items</div>
                     <div style={{ color: '#818cf8' }} className="order-stat-items text-xs font-black leading-none">
                       {hasMultipleItems ? `${order.items.length} types` : (order.weight || '1 type')}
                     </div>
                  </div>
                  <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', borderColor: 'rgba(255, 255, 255, 0.06)' }} className="order-stats-box p-2 sm:p-3 rounded-2xl border flex flex-col items-center justify-center text-center">
                     <div style={{ color: '#9ca3af' }} className="order-stat-label text-[7.5px] font-black uppercase tracking-widest mb-1 leading-none">Shipping</div>
                     <div style={{ color: '#fb7185' }} className="order-stat-shipping text-xs font-black leading-none">{currencySymbol}{order.deliveryCharge || 0}</div>
                  </div>
               </div>

               <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', borderColor: 'rgba(0, 245, 212, 0.2)' }} className="order-grand-total-box p-4 sm:p-5 rounded-2xl border relative overflow-hidden shadow-sm">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                     <CheckCircle size={40} style={{ color: '#00f5d4' }} className="text-dragon-cyan" />
                  </div>
                  <div className="flex flex-row justify-between items-center sm:items-end gap-2 mb-4 border-b border-white/10 pb-3 flex-wrap">
                     <div>
                        <div style={{ color: '#9ca3af' }} className="text-[8px] font-black uppercase tracking-widest mb-1">Grand Total</div>
                        <div style={{ color: '#00f5d4' }} className="order-grand-total-amount text-2xl sm:text-3xl font-black leading-none">{currencySymbol}{grandTotal.toLocaleString()}</div>
                     </div>
                     <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#9ca3af', borderColor: 'rgba(255, 255, 255, 0.08)' }} className="order-payment-method px-2 py-1 rounded text-[7.5px] font-black uppercase tracking-widest border whitespace-nowrap">CASH ON DELIVERY</div>
                  </div>

                  <div className="space-y-2.5">
                     <div className="flex items-center gap-2.5 min-w-0">
                        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)' }} className="order-icon-circle-gray w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                           <User size={10} style={{ color: '#9ca3af' }} />
                        </div>
                        <span style={{ color: '#ffffff' }} className="order-customer-name text-[10px] sm:text-[11px] font-black truncate max-w-[130px] sm:max-w-[180px]">{order.customerName}</span>
                     </div>
                     <div className="flex items-center gap-2.5 min-w-0">
                        <div style={{ backgroundColor: 'rgba(0, 245, 212, 0.1)' }} className="order-icon-circle-cyan w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                           <Phone size={10} style={{ color: '#00f5d4' }} />
                        </div>
                        <span style={{ color: '#00f5d4' }} className="order-customer-phone text-[10px] sm:text-[11px] font-black tracking-widest truncate">{order.customerPhone}</span>
                     </div>
                     <div className="flex items-start gap-2.5 min-w-0">
                        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)' }} className="order-icon-circle-gray w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                           <MapPin size={10} style={{ color: '#9ca3af' }} />
                        </div>
                        <span style={{ color: '#9ca3af' }} className="order-customer-address text-[9.5px] sm:text-[10px] font-bold leading-tight break-words flex-1">{order.customerAddress}</span>
                     </div>
                  </div>
               </div>

               <div className="mt-2 flex flex-col xs:flex-row gap-2 w-full no-print">
                 <button 
                   onClick={() => navigate('/reports', { state: { selectedOrder: order.id } })}
                   style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)', borderColor: 'rgba(255, 255, 255, 0.12)', color: '#ffffff' }}
                   className="order-reports-btn w-full py-2.5 hover:bg-white/10 border rounded-xl text-[9.5px] font-black uppercase tracking-widest hover:text-dragon-cyan transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer font-sans"
                 >
                   Go To Reports
                 </button>
               </div>

               <div className="flex justify-between items-center pt-3 border-t border-white/5 no-print">
                  <div className={cn(
                    "px-2.5 py-1 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest border shrink-0",
                    order.status === 'pending' ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                    order.status === 'confirmed' ? "bg-dragon-cyan/10 text-dragon-cyan border-dragon-cyan/20" :
                    order.status === 'paid' ? "bg-dragon-emerald/10 text-dragon-emerald border-dragon-emerald/20" :
                    "bg-white/5 text-white border-white/10"
                  )}>
                    {order.status}
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    {isOwn ? (
                      order.status === 'pending' && (
                        <div className="flex gap-1.5">
                          <button 
                            onClick={() => onDeleteMessage?.(message)}
                            className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-95 cursor-pointer"
                            title="Delete Order"
                          >
                            <Trash2 size={14} />
                          </button>
                          <button 
                            onClick={() => onEditOrder?.(order)} 
                            className="p-2 bg-dragon-cyan/10 text-dragon-cyan rounded-xl hover:bg-dragon-cyan hover:text-dragon-black transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Edit size={14} />
                            <span className="text-[8.5px] font-black uppercase">Edit</span>
                          </button>
                        </div>
                      )
                    ) : (
                      order.status === 'pending' && (
                        <button 
                          onClick={() => onUpdateStatus?.(order.id, 'confirmed')} 
                          className="px-4 py-2 bg-dragon-cyan text-dragon-black rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-dragon-cyan/20 duration-200 border border-dragon-cyan/20 active:scale-95 cursor-pointer"
                        >
                          Confirm Order
                        </button>
                      )
                    )}
                  </div>
               </div>
            </div>
          );
        })()}
        {message.type === 'payment_request' && (
          <div className="space-y-3 min-w-[240px]">
            <div className="flex justify-between items-center bg-slate-100 dark:bg-black/40 p-3 rounded-2xl border border-cyan-200 dark:border-dragon-cyan/20 shadow-xs">
               <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-full bg-cyan-500/10 dark:bg-dragon-cyan/10 flex items-center justify-center">
                   <Wallet size={16} className="text-cyan-600 dark:text-dragon-cyan" />
                 </div>
                 <span className="text-[10px] font-black tracking-widest text-cyan-700 dark:text-dragon-cyan uppercase">Withdrawal</span>
               </div>
               <div className={cn(
                 "px-2 py-0.5 rounded-full text-[9px] font-black uppercase",
                 message.paymentData?.status === 'paid' ? "bg-emerald-100 text-emerald-700 dark:bg-dragon-emerald/10 dark:text-dragon-emerald" : "bg-cyan-100 text-cyan-700 dark:bg-dragon-cyan/10 dark:text-dragon-cyan"
               )}>
                 {message.paymentData?.status === 'paid' ? 'Paid' : 'Pending'}
               </div>
            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-200 dark:border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                  <ArrowUpRight size={40} className="text-cyan-600 dark:text-dragon-cyan" />
                </div>
                <div className="text-xs font-bold text-slate-500 dark:text-gray-500 uppercase mb-1">Requested Amount</div>
                <div className="text-3xl font-black text-slate-900 dark:text-white leading-none">৳{message.paymentData?.amount}</div>
            </div>

            <div className="bg-slate-50 dark:bg-black/20 p-3 rounded-2xl border border-slate-200 dark:border-white/5 space-y-2">
               <div className="flex justify-between items-center text-[11px]">
                 <span className="text-slate-500 dark:text-gray-500 font-semibold">Method</span>
                 <span className="font-black text-slate-900 dark:text-white">{message.paymentData?.bankName}</span>
               </div>
               <div className="flex justify-between items-center text-[11px]">
                 <span className="text-slate-500 dark:text-gray-500 font-semibold">A/C Number</span>
                 <span className="font-black text-cyan-700 dark:text-dragon-cyan tracking-wider">{message.paymentData?.accountNumber}</span>
               </div>
            </div>

            {message.paymentData?.status === 'paid' ? (
              <div className="p-3 bg-emerald-50 dark:bg-dragon-emerald/10 border border-emerald-200 dark:border-dragon-emerald/20 rounded-2xl">
                 <div className="text-[10px] font-black text-emerald-700 dark:text-dragon-emerald uppercase flex items-center gap-2">
                    <CheckCircle size={14} /> Settlement Complete
                 </div>
                 <div className="mt-2 pt-2 border-t border-emerald-100 dark:border-dragon-emerald/5 flex justify-between items-center">
                   <span className="text-[9px] text-slate-500 dark:text-gray-500 font-bold">TRX ID:</span>
                   <span className="text-[10px] font-mono text-slate-900 dark:text-white font-bold">{message.paymentData.trxId || message.paymentData?.trx_id}</span>
                 </div>
              </div>
            ) : (
              <div className="space-y-2">
                {isOwn ? (
                  <div className="space-y-2">
                    <div className="p-2.5 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/10 rounded-xl text-center">
                      <span className="text-[9px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-500 flex items-center justify-center gap-1.5">
                        <Clock size={11} className="animate-spin-slow" /> Pending
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteMessage?.(message)}
                      className="w-full py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-rose-600 dark:text-red-400 border border-rose-200 dark:border-red-500/20 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 size={11} /> Cancel Request
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                     {showPayInput ? (
                       <div className="space-y-2">
                          <input 
                            type="text" 
                            placeholder="Enter Trx ID" 
                            value={trxId} 
                            onChange={(e) => setTrxId(e.target.value)}
                            className="w-full bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg p-2 text-xs outline-none text-slate-900 dark:text-white font-mono"
                          />
                          <div className="flex gap-1">
                             <button onClick={() => setShowPayInput(false)} className="flex-1 py-2 bg-slate-100 dark:bg-white/5 rounded-lg text-[9px] font-bold uppercase text-slate-600 dark:text-gray-400">Cancel</button>
                             <button 
                              onClick={async () => {
                                await onPayRequest?.(message.id, trxId);
                                setShowPayInput(false);
                              }} 
                              disabled={!trxId.trim()}
                              className="flex-[2] py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-dragon-cyan text-white dark:text-dragon-black rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                             >
                               Confirm Payment
                             </button>
                          </div>
                       </div>
                     ) : (
                      <button 
                        onClick={() => setShowPayInput(true)}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-dragon-cyan text-white dark:text-dragon-black rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-md shadow-emerald-600/25 dark:shadow-dragon-cyan/25"
                      >
                        Process Payment
                      </button>
                     )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {isOwn && message.type !== 'deleted' && (
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteMessage?.(message);
            }}
            className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full flex items-center justify-center opacity-95 hover:opacity-100 transition-all z-20 cursor-pointer active:scale-90 msg-delete-btn"
            title="Delete message"
          >
            <Trash2 size={12} className="stroke-[2.2]" />
          </button>
        )}
      </motion.div>
    </div>
  );
}

export default ChatMessageItem;
