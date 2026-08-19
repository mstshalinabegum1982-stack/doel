import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Trash2, Send, Plus, Mic, Smile, ThumbsUp } from 'lucide-react';
import { Message } from '../../types';
import { getCleanReplyPreview } from '../../utils/chatUtils';

interface ChatInputBarProps {
  replyingTo?: Message | null;
  setReplyingTo?: (val: Message | null) => void;
  onClearReply?: () => void;
  currentUserFollowsOther?: boolean | null;
  otherUserFollowsCurrentUser?: boolean | null;
  isLocked?: boolean;
  isRecording?: boolean;
  recordingDuration?: number;
  onStopRecording?: (send: boolean) => void;
  onStartRecording?: () => void;
  inputText: string;
  setInputText: (val: string) => void;
  onSendMessage: (e?: React.FormEvent) => void;
  onOpenOrderPopup?: () => void;
  onChatInputPaste?: (e: any) => void;
  inputRef?: any;
  onTypingChange?: (val: string) => void;
  onSetTypingStatus?: (isTyping: boolean) => void;
}

const COMMON_EMOJIS = ['👍', '❤️', '😂', '🔥', '👏', '🙏', '😍', '🎉'];

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  replyingTo,
  setReplyingTo,
  onClearReply,
  currentUserFollowsOther,
  otherUserFollowsCurrentUser,
  isLocked,
  isRecording = false,
  recordingDuration = 0,
  onStopRecording,
  onStartRecording,
  inputText,
  setInputText,
  onSendMessage,
  onOpenOrderPopup,
  onChatInputPaste,
  inputRef,
  onTypingChange,
  onSetTypingStatus,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
  const internalInputRef = useRef<HTMLTextAreaElement>(null);
  const activeInputRef = inputRef || internalInputRef;

  // Auto-resize textarea according to content
  useEffect(() => {
    if (activeInputRef.current) {
      activeInputRef.current.style.height = 'auto';
      const scrollH = activeInputRef.current.scrollHeight;
      activeInputRef.current.style.height = `${Math.min(Math.max(scrollH, 24), 120)}px`;
    }
  }, [inputText, activeInputRef]);

  const handleClear = () => {
    if (onClearReply) onClearReply();
    if (setReplyingTo) setReplyingTo(null);
  };

  const handleQuickEmoji = (emoji: string) => {
    const nextVal = (inputText || '') + emoji;
    setInputText(nextVal);
    if (onTypingChange) onTypingChange(nextVal);
    setShowEmojiPicker(false);
    activeInputRef.current?.focus();
  };

  const handleSendLike = () => {
    setInputText('👍');
    setTimeout(() => {
      onSendMessage();
    }, 50);
  };

  const isConnectionLocked = isLocked || currentUserFollowsOther === false || otherUserFollowsCurrentUser === false;

  return (
    <div className="chat-input-bar relative px-3 sm:px-4 py-2 bg-white dark:bg-[#18191a] border-t border-[#e4e6eb] dark:border-[#242526] transition-colors">
      {/* Reply Preview Banner */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 15, opacity: 0 }}
            className="absolute bottom-full left-0 right-0 bg-white/95 dark:bg-[#242526]/95 backdrop-blur-md border-t border-[#e4e6eb] dark:border-[#3a3b3c] px-4 py-2 flex items-center justify-between shadow-md z-20"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-1 h-7 bg-[#0084ff] rounded-full shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-[#0084ff] dark:text-[#2e89ff] leading-none mb-0.5">
                  Replying to message
                </p>
                <p className="text-[13px] text-[#65676b] dark:text-[#b0b3b8] truncate font-normal">
                  {getCleanReplyPreview(replyingTo)}
                </p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                handleClear();
              }}
              className="w-7 h-7 rounded-full bg-[#f0f2f5] dark:bg-[#3a3b3c] hover:bg-[#e4e6eb] dark:hover:bg-[#4e4f50] text-[#65676b] dark:text-[#e4e6eb] flex items-center justify-center transition-all cursor-pointer shrink-0"
            >
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Emoji Bar Popup */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            className="absolute bottom-[calc(100%+8px)] right-4 bg-white dark:bg-[#242526] border border-[#e4e6eb] dark:border-[#3a3b3c] rounded-full p-1.5 flex items-center gap-1 shadow-xl z-30"
          >
            {COMMON_EMOJIS.map((em, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleQuickEmoji(em)}
                className="w-8 h-8 flex items-center justify-center text-lg hover:scale-125 transition-transform active:scale-95 cursor-pointer"
              >
                {em}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {isConnectionLocked ? (
        <div className="flex flex-col items-center justify-center p-3 bg-[#f0f2f5] dark:bg-[#242526] border border-[#e4e6eb] dark:border-[#3a3b3c] rounded-2xl text-center space-y-1 select-none font-sans">
          <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-500">
            <Lock size={15} />
          </div>
          <div>
            <h4 className="text-[12px] font-bold text-gray-800 dark:text-gray-200">Messaging Locked</h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">You must follow each other back to unlock Messenger chat.</p>
          </div>
        </div>
      ) : isRecording ? (
        /* Messenger Voice Note Recording Bar */
        <div className="flex items-center justify-between bg-[#f0f2f5] dark:bg-[#242526] px-3 py-2 rounded-full border border-red-500/20 shadow-sm select-none">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => onStopRecording?.(false)}
              className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer"
              title="Delete recording"
            >
              <Trash2 size={16} />
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="text-[13px] font-semibold text-red-500">Recording</span>
              <span className="text-[13px] font-mono font-bold text-gray-700 dark:text-gray-300">
                {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onStopRecording?.(true)}
            className="w-8 h-8 rounded-full bg-[#0084ff] text-white hover:bg-[#0073e6] active:scale-95 flex items-center justify-center shadow-md transition-all cursor-pointer"
            title="Send Voice Message"
          >
            <Send size={15} className="stroke-[2.5]" />
          </button>
        </div>
      ) : (
        /* Real Facebook Messenger Multiline Input Row */
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSendMessage();
          }}
          className="flex items-end gap-1.5 sm:gap-2"
        >
          {/* Action: Plus / Create Order Button */}
          <button
            type="button"
            onClick={onOpenOrderPopup}
            className="w-9 h-9 rounded-full bg-[#0084ff] text-white hover:bg-[#0073e6] active:scale-95 flex items-center justify-center transition-all shrink-0 shadow-xs cursor-pointer mb-0.5"
            title="Create / Manage Order"
          >
            <Plus size={20} className="stroke-[2.8]" />
          </button>

          {/* Action: Voice Record Mic Icon */}
          <button
            type="button"
            onClick={onStartRecording}
            className="w-9 h-9 rounded-full text-[#0084ff] dark:text-[#2e89ff] hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] active:scale-95 flex items-center justify-center transition-all shrink-0 cursor-pointer mb-0.5"
            title="Record Voice Note"
          >
            <Mic size={20} className="stroke-[2.2]" />
          </button>

          {/* Messenger Multiline Pill Input Box */}
          <div className="chat-input-pill flex-1 min-w-0 flex items-center bg-[#f0f2f5] dark:bg-[#3a3b3c] rounded-[22px] px-3.5 py-1.5 focus-within:ring-2 focus-within:ring-[#0084ff]/30 transition-all min-h-[38px]">
            <textarea
              ref={activeInputRef}
              rows={1}
              value={inputText}
              maxLength={5000}
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              onChange={(e) => {
                const val = e.target.value;
                setInputText(val);
                if (onTypingChange) onTypingChange(val);
              }}
              onPaste={onChatChatInputPasteWrapper(onChatInputPaste)}
              onKeyDown={(e) => {
                // Ctrl+Enter or Cmd+Enter can send message, while plain Enter inserts a new line freely
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  onSendMessage();
                }
              }}
              placeholder="Aa"
              className="chat-input-textarea flex-1 bg-transparent py-0.5 text-[15px] font-normal text-[#050505] dark:text-[#e4e6eb] placeholder-[#65676b] dark:placeholder-[#b0b3b8] outline-none border-none shadow-none min-w-0 resize-none max-h-32 overflow-y-auto leading-relaxed scrollbar-none"
            />

            {/* Emoji Button inside pill */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1 text-[#0084ff] dark:text-[#2e89ff] hover:opacity-80 active:scale-90 transition-all shrink-0 cursor-pointer ml-1 self-end mb-0.5"
              title="Add Emoji"
            >
              <Smile size={19} />
            </button>
          </div>

          {/* Right Action: Send or Thumbs Up in Messenger Blue */}
          {inputText.trim() ? (
            <button
              type="submit"
              className="w-9 h-9 rounded-full text-[#0084ff] dark:text-[#2e89ff] hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] active:scale-95 flex items-center justify-center transition-all shrink-0 cursor-pointer mb-0.5"
              title="Send Message"
            >
              <Send size={20} className="fill-[#0084ff] dark:fill-[#2e89ff] stroke-[1.5]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSendLike}
              className="w-9 h-9 rounded-full text-[#0084ff] dark:text-[#2e89ff] hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] active:scale-95 flex items-center justify-center transition-all shrink-0 cursor-pointer mb-0.5"
              title="Send Like"
            >
              <ThumbsUp size={21} className="fill-[#0084ff] dark:fill-[#2e89ff] stroke-[1.5]" />
            </button>
          )}
        </form>
      )}
    </div>
  );
};

function onChatChatInputPasteWrapper(fn?: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void) {
  return (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (fn) fn(e as any);
  };
}

export default ChatInputBar;

