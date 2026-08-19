import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, X, Bot, Image as ImageIcon, Camera, User, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { 
  doc, 
  getDoc, 
  getDocs,
  setDoc, 
  onSnapshot,
  collection,
  query,
  where
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const getCleanPrompt = (str: string) => {
  return str
    .toLowerCase()
    .replace(/[?,./!@#$%^&*()_+\-=:;|"'’‘“”\u0964]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

interface Message {
  id: string;
  sender: 'customer' | 'model' | 'bot' | 'admin'; // customer / admin / bot
  role: 'customer' | 'model';
  text: string;
  image?: string; // base64 string for photo transfer
  timestamp: string; // ISO String
  replyTo?: {
    id?: string;
    sender: string;
    text: string;
  } | null;
}

interface DragonBotMessengerProps {
  userId: string;
  storeName?: string;
  activeProduct?: {
    id?: string;
    name: string;
    price?: number | string;
    details?: string;
    image?: string;
  } | null;
  chatSourceId?: string; // unique ID for this landing page or pro website context
}

export default function DragonBotMessenger({ userId, storeName = 'DOELpro Store', activeProduct = null, chatSourceId = 'general' }: DragonBotMessengerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const listEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea when typing multiple lines
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 110)}px`;
    }
  }, [inputValue]);

  // Name registration / Session States
  const [custName, setCustName] = useState<string>('');
  const [custToken, setCustToken] = useState<string>('');
  const [isRegisteringName, setIsRegisteringName] = useState<boolean>(true);
  const [tempName, setTempName] = useState('');

  // Bot configuration and expiry states
  const [pageData, setPageData] = useState<any>(null);
  const [isBotExpired, setIsBotExpired] = useState<boolean>(false);

  // 1. Lazy page check to determine bot trial & subscription activation statuses when chat is opened
  useEffect(() => {
    if (!chatSourceId || !isOpen) return;

    let isMounted = true;
    const checkStatus = async () => {
      if (chatSourceId.startsWith('lp_')) {
        const pageId = chatSourceId.substring(3);
        try {
          const docSnap = await getDoc(doc(db, 'landing-pages', pageId));
          if (docSnap.exists() && isMounted) {
            const data = docSnap.data();
            setPageData(data);
            let expired = true;
            if (data.createdAt) {
              const createdTime = data.createdAt.toDate 
                ? data.createdAt.toDate().getTime() 
                : (data.createdAt.seconds 
                  ? data.createdAt.seconds * 1000 
                  : new Date(data.createdAt).getTime());
              const trialExpiry = createdTime + 48 * 60 * 60 * 1000;
              if (Date.now() < trialExpiry) expired = false;
            }
            if (data.botPaymentStatus === 'approved') {
              const expTime = data.botExpiryTime ? new Date(data.botExpiryTime).getTime() : 0;
              if (expTime > Date.now()) expired = false;
            }
            setIsBotExpired(expired);
          }
        } catch (e) {
          console.warn('Error fetching landing page status:', e);
        }
      } else if (chatSourceId.startsWith('website_')) {
        const siteSlugOrId = chatSourceId.substring(8);
        try {
          const q = query(collection(db, 'pro_websites'), where('slug', '==', siteSlugOrId));
          const snapshot = await getDocs(q);
          let data: any = null;
          if (!snapshot.empty) {
            data = snapshot.docs[0].data();
          } else {
            const snap = await getDoc(doc(db, 'pro_websites', siteSlugOrId));
            if (snap.exists()) data = snap.data();
          }
          if (data && isMounted) {
            setPageData(data);
            let expired = true;
            if (data.createdAt) {
              const createdTime = data.createdAt.toDate 
                ? data.createdAt.toDate().getTime() 
                : (data.createdAt.seconds 
                  ? data.createdAt.seconds * 1000 
                  : new Date(data.createdAt).getTime());
              const trialExpiry = createdTime + 48 * 60 * 60 * 1000;
              if (Date.now() < trialExpiry) expired = false;
            }
            if (data.botPaymentStatus === 'approved') {
              const expTime = data.botExpiryTime ? new Date(data.botExpiryTime).getTime() : 0;
              if (expTime > Date.now()) expired = false;
            }
            setIsBotExpired(expired);
          }
        } catch (e) {
          console.warn('Error fetching pro website status:', e);
        }
      }
    };

    checkStatus();
    return () => { isMounted = false; };
  }, [chatSourceId, isOpen]);

  // Synchronize name/token from localStorage based on chatSourceId
  useEffect(() => {
    const keyName = `chat_customer_name_${chatSourceId}`;
    const keyToken = `chat_customer_token_${chatSourceId}`;
    const storedName = localStorage.getItem(keyName) || '';
    const storedToken = localStorage.getItem(keyToken) || '';
    
    setCustName(storedName);
    setCustToken(storedToken);
    setIsRegisteringName(!storedName || !storedToken);
    setTempName('');
  }, [chatSourceId]);

  // 2. Live Firestore Sync - ONLY connect when chat window is OPEN
  useEffect(() => {
    if (!isOpen || isRegisteringName || !custToken) return;

    const docRef = doc(db, 'site_chats', custToken);
    
    // Check if document exists, if not create welcome doc once
    getDoc(docRef).then(async (snap) => {
      if (!snap.exists()) {
        const welcomeText = `Hello ${custName}! I am ${storeName}'s "DOEL messenger" assistant. If you have any questions about our products or services, please feel free to ask. I am here to help you! ✨`;
        
        await setDoc(docRef, {
          id: custToken,
          customerName: custName,
          customerToken: custToken,
          userId: userId,
          chatSourceId: chatSourceId,
          chatSourceTitle: storeName || 'DOELpro Store',
          lastMessageAt: new Date().toISOString(),
          unreadForAdmin: true,
          unreadForCustomer: false,
          botMuted: false,
          createdAt: new Date().toISOString(),
          messages: [
            {
              id: 'welcome',
              sender: 'model',
              role: 'model',
              text: welcomeText,
              timestamp: new Date().toISOString()
            }
          ]
        }, { merge: true });
      }
    }).catch(err => console.warn('site_chats check error:', err));

    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.messages && Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      }
    });

    return () => unsub();
  }, [isOpen, custToken, isRegisteringName, storeName, userId, custName, chatSourceId]);

  // Scroll to bottom when messages load/change
  useEffect(() => {
    if (isOpen) {
      listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Initial onboarding welcome text when user hasn't registered name
  const onboardingGreeting = `Hello! To start a live chat session and receive assistance, please enter your name:`;

  const handleRegisterName = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = tempName.trim();
    if (!name) return;

    const cleanName = name;
    const token = 'cust_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();

    localStorage.setItem(`chat_customer_name_${chatSourceId}`, cleanName);
    localStorage.setItem(`chat_customer_token_${chatSourceId}`, token);

    setCustName(cleanName);
    setCustToken(token);
    setIsRegisteringName(false);
  };

  // 2. Sending normal customer text message
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const prompt = inputValue.trim();
    if (!prompt || !custToken) return;

    setInputValue('');

    const textCustomerMsg: Message = {
      id: crypto.randomUUID(),
      sender: 'customer',
      role: 'customer',
      text: prompt,
      timestamp: new Date().toISOString()
    };

    // Append to firestore immediately
    const docRef = doc(db, 'site_chats', custToken);
    
    // Retrieve current messages to push safely local or database style
    let current = [...messages, textCustomerMsg];
    setMessages(current);

    await setDoc(docRef, {
      messages: current,
      lastMessageAt: new Date().toISOString(),
      unreadForAdmin: true,
      unreadForCustomer: false
    }, { merge: true });

    // 1. Check if bot toggle on this page is disabled
    if (chatSourceId) {
      if (chatSourceId.startsWith('lp_') || chatSourceId.startsWith('website_')) {
        if (pageData && pageData.dragonBotEnabled === false) {
          console.log("Dragon Bot toggle is disabled for this page or website.");
          return;
        }
        if (isBotExpired) {
          console.log("AI Bot is currently expired. Safe, silent early return.");
          return;
        }
      }
    }

    // Check if the global bot is active for this merchant/user or muted
    try {
      const chatSnap = await getDoc(docRef);
      if (chatSnap.exists() && chatSnap.data()?.botMuted === true) {
        console.log("Bot auto-reply is muted for this specific chat session.");
        return;
      }

      const merchantSnap = await getDoc(doc(db, 'users', userId));
      if (merchantSnap.exists() && merchantSnap.data().globalBotActive === false) {
        // Global Bot auto-reply is turned OFF!
        return;
      }
    } catch (err) {
      console.warn("Resiliency check for bot active/muted status failed:", err);
    }

    setIsTyping(true);

    try {
      const cleanedPrompt = getCleanPrompt(prompt);
      const activeProductId = activeProduct?.id || activeProduct?.name || 'general';
      const cacheKey = `chat_cache_${userId}_${cleanedPrompt}_${activeProductId}`;
      let cachedAnswer: any = null;
      try {
        const cachedStr = localStorage.getItem(cacheKey);
        if (cachedStr) {
          const cachedObj = JSON.parse(cachedStr);
          if (cachedObj && Date.now() - cachedObj.timestamp < 12 * 60 * 60 * 1000) { // 12 hours TTL
            cachedAnswer = cachedObj.text;
          }
        }
      } catch (err) {
        console.warn("Error checking localStorage chat cache:", err);
      }

      let botReplyText = "";
      if (cachedAnswer) {
        // Simulate thinking for a natural bot feel
        await new Promise(resolve => setTimeout(resolve, 800));
        botReplyText = cachedAnswer;
      } else {
        // Send message to our intelligent AI router with dedicated constraints and context
        const history = current.slice(0, current.length - 1).map(m => ({
          role: m.sender === 'customer' ? 'customer' : 'model',
          text: m.text
        }));

        const res = await fetch('/api/ai/public-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            prompt,
            history,
            activeProduct, // Sends product context dynamic constraints safely
            chatSourceId
          })
        });

        const data = await res.json();
        if (data.error) {
          throw new Error(data.error);
        }
        botReplyText = data.text;

        // Cache the newly fetched answer locally
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            text: botReplyText,
            timestamp: Date.now()
          }));
        } catch (err) {
          console.warn("Error setting localStorage chat cache:", err);
        }
      }

      setIsTyping(false);

      const botReplyMsg: Message = {
        id: crypto.randomUUID(),
        sender: 'bot',
        role: 'model',
        text: botReplyText,
        timestamp: new Date().toISOString()
      };

      const finalMessages = [...current, botReplyMsg];
      
      await setDoc(docRef, {
        messages: finalMessages,
        lastMessageAt: new Date().toISOString()
      }, { merge: true });

    } catch (err) {
      console.error("AI automated reply error:", err);
      setIsTyping(false);
      
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        sender: 'bot',
        role: 'model',
        text: "Sorry, a connection error occurred. Please try again.",
        timestamp: new Date().toISOString()
      };

      await setDoc(docRef, {
        messages: [...current, errorMsg],
        lastMessageAt: new Date().toISOString()
      }, { merge: true });
    }
  };

  // 3. Select & upload customer photo attachment directly to merchant database
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !custToken) return;

    if (file.size > 15 * 1024 * 1024) {
      alert("Images larger than 15MB are not allowed.");
      return;
    }

    setIsUploadingImage(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64Str = reader.result as string;

        const photoMsg: Message = {
          id: crypto.randomUUID(),
          sender: 'customer',
          role: 'customer',
          text: 'Product photo attached.',
          image: base64Str,
          timestamp: new Date().toISOString()
        };

        const docRef = doc(db, 'site_chats', custToken);
        const latestMsgs = [...messages, photoMsg];
        setMessages(latestMsgs);

        await setDoc(docRef, {
          messages: latestMsgs,
          lastMessageAt: new Date().toISOString(),
          unreadForAdmin: true,
          unreadForCustomer: false
        }, { merge: true });

        setIsUploadingImage(false);
      } catch (err) {
        console.error("Photo base64 conversion failed:", err);
        setIsUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans text-left dragon-messenger-root">
      {/* Isolated styling scoped to the messenger bubble so it ignores parent landing page color overrides */}
      <style dangerouslySetInnerHTML={{__html: `
        /* Complete isolation for Dragon AI Messenger from parent wrapper override styles */
        .custom-pro-wrapper .dragon-messenger-root h4, 
        .dragon-messenger-root h4,
        .custom-pro-wrapper .dragon-messenger-root h3, 
        .dragon-messenger-root h3,
        .custom-pro-wrapper .dragon-messenger-root p, 
        .dragon-messenger-root p,
        .custom-pro-wrapper .dragon-messenger-root label,
        .dragon-messenger-root label {
          color: #ffffff !important;
        }

        .custom-pro-wrapper .dragon-messenger-root span:not(.no-override),
        .dragon-messenger-root span:not(.no-override) {
          color: #ffffff !important;
        }

        /* Floating button outer & inner styling absolute values */
        .custom-pro-wrapper .dragon-messenger-root .dragon-float-btn-inner,
        .dragon-messenger-root .dragon-float-btn-inner {
          background-color: #0a0a0f !important;
          background: #0a0a0f !important;
          color: #ffffff !important;
        }

        .custom-pro-wrapper .dragon-messenger-root .dragon-float-btn-inner:hover,
        .dragon-messenger-root .dragon-float-btn-inner:hover {
          color: #00f2fe !important;
        }

        /* Chat window styling */
        .custom-pro-wrapper .dragon-messenger-root .dragon-chat-window,
        .dragon-messenger-root .dragon-chat-window {
          background-color: #0c0c14 !important;
          background: #0c0c14 !important;
          border: 1px solid rgba(0, 242, 255, 0.3) !important;
          color: #ffffff !important;
        }

        /* Identity badges colors */
        .custom-pro-wrapper .dragon-messenger-root .identity-badge-bot span,
        .dragon-messenger-root .identity-badge-bot span,
        .custom-pro-wrapper .dragon-messenger-root .identity-badge-bot,
        .dragon-messenger-root .identity-badge-bot {
          color: #00f2fe !important;
        }

        .custom-pro-wrapper .dragon-messenger-root .identity-badge-admin span,
        .dragon-messenger-root .identity-badge-admin span,
        .custom-pro-wrapper .dragon-messenger-root .identity-badge-admin,
        .dragon-messenger-root .identity-badge-admin {
          color: #fbbf24 !important;
        }

        /* Time stamps, helper texts, secondary information colors */
        .custom-pro-wrapper .dragon-messenger-root .text-gray-400,
        .dragon-messenger-root .text-gray-400,
        .custom-pro-wrapper .dragon-messenger-root .text-gray-400 span,
        .dragon-messenger-root .text-gray-400 span,
        .custom-pro-wrapper .dragon-messenger-root .text-\\[\\#888899\\],
        .dragon-messenger-root .text-\\[\\#888899\\],
        .custom-pro-wrapper .dragon-messenger-root .text-\\[\\#888899\\] span,
        .dragon-messenger-root .text-\\[\\#888899\\] span {
          color: #9cb3c9 !important;
        }
        
        .custom-pro-wrapper .dragon-messenger-root .text-gray-500,
        .dragon-messenger-root .text-gray-500,
        .custom-pro-wrapper .dragon-messenger-root .text-gray-500 span,
        .dragon-messenger-root .text-gray-500 span {
          color: #6b7280 !important;
        }

        /* Customer bubble bubble styling: should have colored background and black text as designed */
        .custom-pro-wrapper .dragon-messenger-root .customer-bubble,
        .dragon-messenger-root .customer-bubble {
          background: linear-gradient(135deg, #00f2fe 0%, #4f46e5 100%) !important;
          background-image: linear-gradient(135deg, #00f2fe 0%, #4f46e5 100%) !important;
          color: #000000 !important;
        }

        .custom-pro-wrapper .dragon-messenger-root .customer-bubble p,
        .dragon-messenger-root .customer-bubble p,
        .custom-pro-wrapper .dragon-messenger-root .customer-bubble span,
        .dragon-messenger-root .customer-bubble span {
          color: #000000 !important;
        }

        /* Bot reply bubble styling */
        .custom-pro-wrapper .dragon-messenger-root .bot-bubble,
        .dragon-messenger-root .bot-bubble {
          background-color: rgba(255, 255, 255, 0.05) !important;
          background: rgba(255, 255, 255, 0.05) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: #e5e7eb !important;
        }

        .custom-pro-wrapper .dragon-messenger-root .bot-bubble p,
        .dragon-messenger-root .bot-bubble p,
        .custom-pro-wrapper .dragon-messenger-root .bot-bubble span,
        .dragon-messenger-root .bot-bubble span {
          color: #e5e7eb !important;
        }

        /* Custom Input Isolation */
        .custom-pro-wrapper .dragon-messenger-root input.messenger-input,
        .dragon-messenger-root input.messenger-input,
        .custom-pro-wrapper .dragon-messenger-root textarea.messenger-input,
        .dragon-messenger-root textarea.messenger-input {
          background-color: rgba(255, 255, 255, 0.08) !important;
          background: rgba(255, 255, 255, 0.08) !important;
          color: #ffffff !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
        }

        .custom-pro-wrapper .dragon-messenger-root input.messenger-input:focus,
        .dragon-messenger-root input.messenger-input:focus,
        .custom-pro-wrapper .dragon-messenger-root textarea.messenger-input:focus,
        .dragon-messenger-root textarea.messenger-input:focus {
          border-color: #00f2fe !important;
        }

        .custom-pro-wrapper .dragon-messenger-root input.messenger-input::placeholder,
        .dragon-messenger-root input.messenger-input::placeholder,
        .custom-pro-wrapper .dragon-messenger-root textarea.messenger-input::placeholder,
        .dragon-messenger-root textarea.messenger-input::placeholder {
          color: rgba(255, 255, 255, 0.45) !important;
        }

        /* Onboarding button styling */
        .custom-pro-wrapper .dragon-messenger-root .dragon-onboarding-btn,
        .dragon-messenger-root .dragon-onboarding-btn {
          background: linear-gradient(to right, #00f2ff, #4f46e5) !important;
          background-image: linear-gradient(to right, #00f2ff, #4f46e5) !important;
          color: #000000 !important;
        }

        /* Send button styling */
        .custom-pro-wrapper .dragon-messenger-root .dragon-send-btn,
        .dragon-messenger-root .dragon-send-btn {
          background-color: #00f2ff !important;
          background: #00f2ff !important;
          color: #000000 !important;
        }

        /* Photo attachment btn */
        .custom-pro-wrapper .dragon-messenger-root .dragon-photo-btn,
        .dragon-messenger-root .dragon-photo-btn {
          background-color: rgba(255, 255, 255, 0.05) !important;
          background: rgba(255, 255, 255, 0.05) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: #9cb3c9 !important;
        }

        /* Chat panel input area container styling */
        .custom-pro-wrapper .dragon-messenger-root .dragon-chat-input-area,
        .dragon-messenger-root .dragon-chat-input-area {
          background-color: #06060a !important;
          background: #06060a !important;
          border-top: 1px solid rgba(255, 255, 255, 0.05) !important;
        }
      `}} />

      {/* Floating Messenger Button & Expanded Window */}
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.button
            key="dragon-float-btn"
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 20 }}
            transition={{ duration: 0.18 }}
            onClick={() => setIsOpen(true)}
            className="relative p-[2.5px] rounded-full overflow-hidden flex items-center justify-center shadow-[0_4px_32px_rgba(0,242,254,0.4)] hover:shadow-[0_8px_40px_rgba(0,242,254,0.65)] transition-all transform hover:scale-110 active:scale-95 group cursor-pointer border border-transparent origin-bottom-right"
          >
            {/* Rotating gradient background running border line */}
            <div className="absolute inset-[-500%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_0deg,#00f2fe,#4f46e5,#ec4899,#00f2fe)]" />

            {/* Inner Mask Content of the button */}
            <div className="relative flex items-center gap-2.5 px-6 py-3.5 bg-[#0a0a0f]/95 text-white group-hover:text-dragon-cyan rounded-full w-full h-full font-black text-xs uppercase tracking-wider transition-all duration-300 dragon-float-btn-inner">
              <Sparkles size={16} className="text-dragon-cyan animate-bounce" />
              <span>DOEL messenger</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-dragon-cyan opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-dragon-cyan"></span>
              </span>
            </div>
          </motion.button>
        ) : (
          <motion.div
            key="dragon-chat-window"
            initial={{ opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.92 }}
            transition={{ duration: 0.2 }}
            className="w-[calc(100vw-32px)] sm:w-[380px] h-[520px] max-h-[calc(100vh-100px)] bg-[#0c0c14]/95 backdrop-blur-xl border border-dragon-cyan/30 rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden text-white dragon-chat-window origin-bottom-right"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-dragon-cyan/20 to-indigo-950 border-b border-white/5 flex items-center justify-between dragon-chat-header">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-dragon-cyan/10 border border-dragon-cyan/30 flex items-center justify-center text-dragon-cyan">
                  <Bot size={22} className="animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-white">DOEL messenger</h4>
                  <p className="text-[9px] text-[#888899] font-medium leading-relaxed">powered by DOELpro • Always Active</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                title="Close Messenger"
              >
                <X size={16} />
              </button>
            </div>

            {/* Active Product Alert Context Flag */}
            {activeProduct && (
              <div className="bg-gradient-to-r from-dragon-cyan/15 to-indigo-950/40 p-2.5 px-4 text-[10px] font-bold border-b border-white/5 flex items-center justify-between gap-2.5 dragon-active-product-alert">
                <div className="flex items-center gap-2 truncate text-gray-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-dragon-cyan animate-ping"></div>
                  <span>Product Automation Active: <strong className="text-white font-black">{activeProduct.name}</strong></span>
                </div>
                {activeProduct.price && <span className="text-dragon-cyan text-[11px] font-black shrink-0">৳{activeProduct.price}</span>}
              </div>
            )}

            {/* Content: Naming Onboarding Form Or Messages list */}
            {isRegisteringName ? (
              <div className="flex-1 flex flex-col justify-center p-6 space-y-6 dragon-onboarding-container">
                <div className="text-center space-y-2">
                  <div className="mx-auto w-12 h-12 rounded-full bg-dragon-cyan/10 flex items-center justify-center text-dragon-cyan">
                    <User size={24} />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">Welcome!</h3>
                  <p className="text-xs text-gray-400 leading-relaxed max-w-xs mx-auto">
                    {onboardingGreeting}
                  </p>
                </div>

                <form onSubmit={handleRegisterName} className="space-y-4">
                  <input
                    type="text"
                    required
                    placeholder="Enter your name to begin..."
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-dragon-cyan text-white text-center font-bold messenger-input"
                  />
                  <button
                    type="submit"
                    className="w-full py-3 h-11 text-xs font-black uppercase tracking-widest bg-gradient-to-r from-dragon-cyan to-indigo-600 text-black hover:text-white rounded-xl shadow-lg hover:shadow-cyan-400/20 active:scale-95 transition-all text-center flex items-center justify-center dragon-onboarding-btn"
                  >
                    START CHAT
                  </button>
                </form>
              </div>
            ) : (
              /* Messages list view */
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
                  {messages.map((msg, idx) => (
                    <div
                      key={`dragon-msg-${idx}-${msg.id || 'msg'}-${msg.sender || 'snd'}-${msg.timestamp || ''}`}
                      className={cn(
                        "flex flex-col gap-0.5 max-w-[80%]",
                        msg.sender === 'customer' ? "ml-auto items-end" : "mr-auto items-start font-sans"
                      )}
                    >
                      {/* Quoted Reply Display */}
                      {msg.replyTo && (
                        <div className="bg-white/5 border-l-2 border-dragon-cyan/60 px-2.5 py-1.5 rounded-lg text-[9px] text-gray-400 max-w-full text-left select-none mb-1 shadow-sm flex flex-col gap-0.5 dragon-quoted-reply">
                          <span className="font-extrabold text-dragon-cyan/90 text-[8px] uppercase tracking-wider">
                            Replying to {msg.replyTo.sender}:
                          </span>
                          <span className="italic block truncate max-w-[180px]">{msg.replyTo.text}</span>
                        </div>
                      )}

                      {/* Customer image transfer display */}
                      {msg.image && (
                        <div className="relative rounded-2xl overflow-hidden border border-white/10 max-w-[200px] mb-1">
                          <img src={msg.image} alt="Attachment" className="max-h-48 object-cover rounded-xl" />
                        </div>
                      )}
                      
                      <div
                        className={cn(
                          "px-4 py-2.5 rounded-2xl text-[11px] sm:text-xs font-semibold leading-relaxed shadow-sm relative group",
                          msg.sender === 'customer'
                            ? "bg-gradient-to-br from-dragon-cyan to-indigo-600 text-black rounded-tr-none customer-bubble"
                            : "bg-white/5 border border-white/10 text-gray-200 rounded-tl-none bot-bubble"
                        )}
                      >
                        {/* Display subtle identity badge for admin or bot */}
                        {!msg.sender || msg.sender === 'model' || msg.sender === 'bot' ? (
                          <div className="text-[8px] font-black uppercase text-dragon-cyan tracking-wider mb-0.5 select-none flex items-center gap-1 opacity-80 identity-badge-bot">
                            <span className="no-override">🤖 DOEL messenger Bot</span>
                          </div>
                        ) : msg.sender === 'admin' ? (
                          <div className="text-[8px] font-black uppercase text-amber-400 tracking-wider mb-0.5 select-none flex items-center gap-1 opacity-80 identity-badge-admin">
                            <span className="no-override">👤 Merchant Admin</span>
                          </div>
                        ) : null}

                        <p className="whitespace-pre-wrap break-words leading-relaxed">
                          {msg.text}
                        </p>
                      </div>
                      <span className="text-[7.5px] text-gray-500 uppercase tracking-widest px-1 font-bold font-sans">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}

                  {/* Typing / Processing AI Loading Indicator */}
                  {isTyping && (
                    <div className="flex flex-col items-start gap-1 max-w-[80%] mr-auto font-sans">
                      <div className="px-4 py-3 bg-white/5 border border-white/10 text-gray-400 rounded-2xl rounded-tl-none flex items-center gap-1.5 text-[10px]">
                        <span className="font-bold text-[#888899] leading-none">DOEL messenger is typing</span>
                        <span className="flex gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-dragon-cyan animate-bounce duration-500"></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce duration-700"></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce duration-900"></span>
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Photo uploading state loader */}
                  {isUploadingImage && (
                    <div className="flex flex-col items-end gap-1 max-w-[80%] ml-auto">
                      <div className="px-4 py-2 bg-indigo-900/30 text-indigo-200 rounded-2xl rounded-tr-none flex items-center gap-2 text-[10px]">
                        <Loader2 size={12} className="animate-spin" />
                        <span>Sending attachment...</span>
                      </div>
                    </div>
                  )}
                  <div ref={listEndRef} />
                </div>

                {/* Chat Panel Input Area */}
                <form onSubmit={handleSend} className="p-3 bg-black/45 border-t border-white/5 flex gap-2 items-end dragon-chat-input-area">
                  {/* Photo selector button helper */}
                  <label 
                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:border-dragon-cyan/40 text-gray-400 hover:text-dragon-cyan flex items-center justify-center cursor-pointer transition-all active:scale-95 shrink-0 dragon-photo-btn mb-0.5"
                    title="Send photo attachment"
                  >
                    <Camera size={16} />
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handlePhotoUpload} 
                      className="hidden" 
                    />
                  </label>

                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Ask anything about our products... (Shift+Enter for new line)"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-[11px] outline-none focus:border-dragon-cyan/50 text-white placeholder-gray-500 font-sans messenger-input resize-none min-h-[40px] max-h-[110px] leading-relaxed scrollbar-thin scrollbar-thumb-white/10"
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isTyping}
                    className="w-10 h-10 rounded-xl bg-dragon-cyan text-black shadow-lg shadow-dragon-cyan/15 flex items-center justify-center hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-40 transition-all cursor-pointer shrink-0 dragon-send-btn mb-0.5"
                  >
                    <Send size={15} />
                  </button>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
