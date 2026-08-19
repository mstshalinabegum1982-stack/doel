import React from 'react';
import { motion } from 'framer-motion';
import { UserProfile, ChatThread } from '../../types';
import { formatDate, parseCallLog } from '../../lib/utils';
import { AuthContext } from '../../authContext';

export function UserRow({
  user,
  isOnline,
  onClick,
  actionIcon,
}: {
  user: UserProfile;
  isOnline?: boolean;
  onClick: () => void;
  actionIcon?: React.ReactNode;
  key?: string;
}) {
  const longPressTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const isLongPressActive = React.useRef(false);

  const handlePressStart = () => {
    isLongPressActive.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressActive.current = true;
      const event = new CustomEvent('open-mute-call-modal', { detail: { targetUser: user } });
      window.dispatchEvent(event);
    }, 2000);
  };

  const handlePressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleRowClick = (e: React.MouseEvent) => {
    if (isLongPressActive.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onClick();
  };

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onClick={handleRowClick}
      className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer group select-none"
    >
      <div className="relative shrink-0">
        <img
          src={user.profileImage || undefined}
          className="w-10 h-10 rounded-xl object-cover bg-white/10"
          alt=""
          referrerPolicy="no-referrer"
        />
        {isOnline && (
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-dragon-emerald rounded-full border-2 border-dragon-black shadow-[0_0_8px_#059669]" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-white text-xs group-hover:text-dragon-cyan transition-colors truncate">
          {user.name}
        </h4>
        <p className="text-[10px] text-gray-500 truncate tracking-tight">{user.phone}</p>
      </div>
      {actionIcon && <div className="text-dragon-cyan">{actionIcon}</div>}
    </motion.div>
  );
}

export function ChatRow({
  chat,
  isOnline,
  onClick,
}: {
  chat: ChatThread;
  isOnline?: boolean;
  onClick: () => void;
  key?: string;
}) {
  const { user } = React.useContext(AuthContext);
  const longPressTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const isLongPressActive = React.useRef(false);

  const handlePressStart = () => {
    isLongPressActive.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressActive.current = true;
      const event = new CustomEvent('open-mute-call-modal', { detail: { targetUser: chat.otherUser } });
      window.dispatchEvent(event);
    }, 2000);
  };

  const handlePressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleRowClick = (e: React.MouseEvent) => {
    if (isLongPressActive.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onClick();
  };

  const displayMessageText = () => {
    if (!chat.lastMessage) return 'Open thread...';
    if (user && (chat.lastMessage.startsWith('CALL_LOG:') || chat.lastMessage.startsWith('VIDEO_CALL_LOG:'))) {
      const parsed = parseCallLog(chat.lastMessage, user.uid);
      if (parsed) {
        return parsed.text;
      }
    }
    return chat.lastMessage;
  };

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onClick={handleRowClick}
      className="flex items-center gap-3 py-2 px-1 hover:bg-white/5 transition-colors cursor-pointer border-b border-white/5 last:border-0 group select-none"
    >
      <div className="relative shrink-0">
        <img
          src={chat.otherUser?.profileImage || undefined}
          className="w-9 h-9 rounded-xl object-cover bg-white/10"
          alt=""
          referrerPolicy="no-referrer"
        />
        {isOnline && (
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-dragon-emerald rounded-full border-2 border-dragon-black shadow-[0_0_8px_#059669]" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-0.5">
          <h4 className="font-bold text-white text-[11px] group-hover:text-dragon-cyan transition-colors truncate uppercase tracking-tight">
            {chat.otherUser?.name || 'User'}
          </h4>
          <span className="text-[8px] text-gray-600 font-bold uppercase tracking-tighter shrink-0">
            {chat.lastMessageAt ? formatDate(chat.lastMessageAt) : ''}
          </span>
        </div>
        <p className="text-[10px] text-gray-500 truncate font-light italic leading-none">
          {displayMessageText()}
        </p>
      </div>
    </motion.div>
  );
}
