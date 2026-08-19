import React from 'react';
import { UserProfile } from '../../types';
import { Phone, Video, Info, Wallet, FileText, ArrowLeft } from 'lucide-react';

interface ChatHeaderProps {
  otherUser: UserProfile | null;
  isOtherTyping: boolean;
  rtdbPresence: { isOnline?: boolean; lastSeen?: any } | null;
  presenceStatus?: { isOnline: boolean; text: string };
  getPresenceStatus?: () => { isOnline: boolean; text: string };
  onNavigateBack: () => void;
  onHeaderPressStart?: () => void;
  onHeaderPressEnd?: () => void;
  onHeaderClick?: () => void;
  onInitiateCall?: (type: 'audio' | 'video') => void;
  onOpenWithdrawModal?: () => void;
  onOpenReportPopup?: () => void;
  onOpenProfile?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  otherUser,
  isOtherTyping,
  rtdbPresence,
  presenceStatus,
  getPresenceStatus,
  onNavigateBack,
  onHeaderPressStart,
  onHeaderPressEnd,
  onHeaderClick,
  onInitiateCall,
  onOpenWithdrawModal,
  onOpenReportPopup,
  onOpenProfile,
}) => {
  const currentPresence = presenceStatus || (getPresenceStatus ? getPresenceStatus() : { isOnline: false, text: 'Offline' });
  const isOnline = rtdbPresence ? !!rtdbPresence.isOnline : currentPresence.isOnline;

  return (
    <div className="px-3 sm:px-4 py-2.5 flex items-center justify-between bg-white dark:bg-[#18191a] border-b border-[#e4e6eb] dark:border-[#242526] shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-none z-20 transition-colors">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {/* Back Button */}
        <button 
          type="button" 
          onClick={onNavigateBack} 
          className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[#0084ff] dark:text-[#2e89ff] hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] active:scale-95 transition-all cursor-pointer shrink-0"
          title="Back"
        >
          <ArrowLeft size={22} className="stroke-[2.5]" />
        </button>

        {/* User Info & Avatar */}
        <div 
          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none min-w-0" 
          onMouseDown={onHeaderPressStart}
          onMouseUp={onHeaderPressEnd}
          onMouseLeave={onHeaderPressEnd}
          onTouchStart={onHeaderPressStart}
          onTouchEnd={onHeaderPressEnd}
          onClick={onHeaderClick || onOpenProfile}
        >
          {/* Avatar with Messenger Active Dot */}
          <div className="relative shrink-0">
            <img 
              src={otherUser?.profileImage || undefined} 
              className="w-10 h-10 rounded-full object-cover bg-gray-200 dark:bg-[#3a3b3c] border border-black/5 dark:border-white/10" 
              alt={otherUser?.name || 'User'} 
            />
            {isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#31a24c] rounded-full ring-2 ring-white dark:ring-[#18191a]" />
            )}
          </div>

          <div className="min-w-0">
            <h2 className="font-semibold text-[15px] sm:text-[16px] leading-tight text-[#050505] dark:text-[#e4e6eb] truncate">
              {otherUser?.name || 'Loading...'}
            </h2>
            {isOtherTyping ? (
              <p className="text-[12px] text-[#0084ff] dark:text-[#2e89ff] font-medium tracking-tight flex items-center gap-1.5 animate-pulse mt-0.5">
                <span>Typing...</span>
              </p>
            ) : isOnline ? (
              <p className="text-[12px] text-[#65676b] dark:text-[#b0b3b8] font-normal flex items-center gap-1.5 mt-0.5">
                Active now
              </p>
            ) : (
              <p className="text-[12px] text-[#65676b] dark:text-[#b0b3b8] font-normal flex items-center gap-1 mt-0.5 truncate">
                {currentPresence.text || 'Offline'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons in Messenger Signature Blue */}
      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
        {otherUser && onInitiateCall && (
          <>
            {/* Voice Call */}
            <button 
              type="button"
              onClick={() => onInitiateCall('audio')} 
              className="w-9 h-9 rounded-full text-[#0084ff] dark:text-[#2e89ff] hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] active:scale-90 transition-all flex items-center justify-center cursor-pointer"
              title="Start Audio Call"
            >
              <Phone size={20} className="fill-[#0084ff] dark:fill-[#2e89ff] stroke-[1.5]" />
            </button>

            {/* Video Call */}
            <button 
              type="button"
              onClick={() => onInitiateCall('video')} 
              className="w-9 h-9 rounded-full text-[#0084ff] dark:text-[#2e89ff] hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] active:scale-90 transition-all flex items-center justify-center cursor-pointer"
              title="Start Video Call"
            >
              <Video size={21} className="fill-[#0084ff] dark:fill-[#2e89ff] stroke-[1.5]" />
            </button>
          </>
        )}

        {/* Financial / Wallet Shortcut */}
        {onOpenWithdrawModal && (
          <button 
            type="button"
            onClick={onOpenWithdrawModal} 
            className="w-9 h-9 rounded-full text-[#0084ff] dark:text-[#2e89ff] hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] active:scale-90 transition-all flex items-center justify-center cursor-pointer"
            title="Withdraw / Balance"
          >
            <Wallet size={19} className="stroke-[2]" />
          </button>
        )}

        {/* Mini Report / Financial Summary Report */}
        {onOpenReportPopup && (
          <button 
            type="button"
            onClick={onOpenReportPopup} 
            className="w-9 h-9 rounded-full text-[#0084ff] dark:text-[#2e89ff] hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] active:scale-90 transition-all flex items-center justify-center cursor-pointer"
            title="মিনি রিপোর্ট / Mini Report"
          >
            <FileText size={19} className="stroke-[2]" />
          </button>
        )}

        {/* Profile / Info (i) */}
        <button 
          type="button"
          onClick={onOpenProfile} 
          className="w-9 h-9 rounded-full text-[#0084ff] dark:text-[#2e89ff] hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] active:scale-90 transition-all flex items-center justify-center cursor-pointer"
          title="Conversation Info"
        >
          <Info size={20} className="stroke-[2.2]" />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
