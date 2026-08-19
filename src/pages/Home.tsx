import React, { useContext, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MessageSquare, ShieldCheck, Zap, Lock, CheckCircle2, Globe, FileText, X, ExternalLink, Server, Database } from 'lucide-react';
import { AuthContext } from '../authContext';

export default function Home() {
  const navigate = useNavigate();
  const { user, loading } = useContext(AuthContext);
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-dragon-black">
        <div className="w-10 h-10 border-4 border-dragon-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/messenger" replace />;
  }

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-between overflow-y-auto overflow-x-hidden bg-dragon-black p-4 sm:p-6 text-white font-sans">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-dragon-cyan/15 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-dragon-purple/15 blur-[140px] rounded-full pointer-events-none" />

      {/* TOP HEADER SSL BADGE */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="z-20 w-full max-w-4xl flex items-center justify-between pt-2 pb-4 border-b border-white/10"
      >
        <div className="flex items-center gap-2">
          <span className="font-display font-black text-xl tracking-wider text-white">DOEL<span className="text-dragon-cyan">PRO</span></span>
        </div>
        
        {/* Google Firebase SSL Certified Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shadow-[0_0_15px_rgba(16,185,129,0.15)]">
          <Lock size={13} className="text-emerald-400 animate-pulse" />
          <span className="hidden sm:inline">Google Firebase 256-Bit SSL Secured</span>
          <span className="sm:hidden">SSL Secured</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </div>
      </motion.div>

      {/* MAIN CONTAINER CONTENT */}
      <div className="w-full max-w-4xl my-8 flex flex-col items-center z-10 space-y-10">

        {/* Decorative DoelPro Premium SVG Bird Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="relative z-10"
        >
          <div className="relative">
            <motion.div
              animate={{ 
                filter: ["drop-shadow(0 0 15px #00f2ff22)", "drop-shadow(0 0 30px #00f2ff55)", "drop-shadow(0 0 15px #00f2ff22)"]
              }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <svg width="220" height="160" viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
                <defs>
                  <linearGradient id="birdBlue" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#00f2ff" />
                  </linearGradient>
                  <linearGradient id="bodyDark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1e293b" />
                    <stop offset="100%" stopColor="#0f172a" />
                  </linearGradient>
                  <linearGradient id="wingOrange" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#fb923c" />
                  </linearGradient>
                  <filter id="premium-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="8" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Ambient backdrop glow */}
                <circle cx="120" cy="90" r="60" fill="url(#birdBlue)" opacity="0.08" filter="url(#premium-glow)" />

                {/* THE DOEL BIRD (Magpie-Robin) */}
                <g id="doel-vector-group">
                  {/* 1. UP-COCKED TAIL */}
                  <g id="tail-section" className="opacity-95">
                    <path d="M 90 115 C 75 92, 52 50, 48 28 C 46 20, 54 16, 60 22 C 72 35, 96 80, 105 102 Z" fill="url(#bodyDark)" stroke="#00f2ff" strokeWidth="1.5" />
                    <path d="M 98 118 C 85 95, 62 55, 58 35 C 56 28, 62 25, 68 31 C 78 42, 102 85, 110 105 Z" fill="#FFFFFF" />
                  </g>

                  {/* 2. LEGS & STAND */}
                  <g id="legs-and-stand">
                    <path d="M 125 128 L 132 154 L 140 154" stroke="#00f2ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M 135 125 L 142 154 L 150 154" stroke="#00f2ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M 100 158 L 170 158" stroke="#00f2ff" strokeWidth="3.5" strokeLinecap="round" />
                    <path d="M 115 162 L 155 162" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                  </g>

                  {/* 3. HEAD & BODY */}
                  <path d="M 102 110 C 110 90, 122 68, 142 50 C 152 42, 164 48, 168 60 C 172 58, 178 58, 185 64 L 198 66 L 180 72 C 176 84, 166 98, 146 110 C 132 112, 112 118, 102 110 Z" fill="url(#bodyDark)" stroke="#00f2ff" strokeWidth="1.5" />

                  {/* 4. BEAK */}
                  <path d="M 168 60 L 194 65 L 170 70 Z" fill="url(#bodyDark)" stroke="#00f2ff" strokeWidth="1" strokeLinejoin="round" />

                  {/* 5. WHITE BELLY & LOWER BREAST */}
                  <path d="M 146 110 C 138 118, 128 125, 118 125 C 108 125, 102 118, 105 110 C 115 116, 130 114, 146 110 Z" fill="#FFFFFF" />

                  {/* 6. NEON GLOW CROWN */}
                  <path d="M 142 50 C 152 42, 164 48, 168 60 C 160 64, 150 72, 142 82 C 136 72, 138 60, 142 50 Z" fill="url(#birdBlue)" opacity="0.8" />

                  {/* 7. WING WITH WHITE STRIPE & ORANGE ACCENT */}
                  <path d="M 120 80 C 132 70, 150 78, 165 85 C 155 100, 140 115, 122 110 C 115 102, 116 90, 120 80 Z" fill="#0f172a" stroke="#FFFFFF" strokeWidth="1.5" />
                  <path d="M 128 92 C 136 85, 150 92, 158 98 C 150 102, 140 105, 128 92 Z" fill="#FFFFFF" />
                  <path d="M 132 88 C 138 84, 146 88, 152 92" stroke="url(#wingOrange)" strokeWidth="2" strokeLinecap="round" />

                  {/* 8. SHARP BIRD EYE */}
                  <circle cx="162" cy="57" r="4" fill="#FFFFFF" />
                  <circle cx="162" cy="57" r="1.8" fill="#030712" />
                  <circle cx="163" cy="56" r="0.8" fill="#FFFFFF" />
                </g>
              </svg>
            </motion.div>
          </div>
        </motion.div>

        {/* HERO HEADING & CTA */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-center"
        >
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-black tracking-tight mb-3 flex items-center justify-center gap-2">
            <span className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">DOEL</span>
            <span className="text-dragon-cyan drop-shadow-[0_0_20px_rgba(0,242,255,0.4)]">PRO</span>
          </h1>
          <p className="text-gray-300 text-sm sm:text-lg max-w-xl mx-auto mb-6 font-light leading-relaxed">
            The Enterprise Commerce Platform to Run and Scale Your Business Smartly Online.
            <span className="block mt-2 text-xs text-dragon-cyan font-semibold tracking-widest font-mono uppercase">
              Google Cloud & Firebase Powered • 256-Bit SSL Encrypted
            </span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/login')}
              className="px-8 py-3.5 rounded-full bg-dragon-cyan text-dragon-black font-bold text-base shadow-[0_0_25px_rgba(0,242,255,0.3)] transition-all hover:bg-white flex items-center gap-2.5"
            >
              Get Started Now
              <Zap size={18} fill="currentColor" />
            </motion.button>

            <button
              onClick={() => setShowSecurityModal(true)}
              className="px-6 py-3.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-gray-200 font-semibold text-sm transition-all flex items-center gap-2"
            >
              <ShieldCheck size={16} className="text-emerald-400" />
              Security & Google SSL Compliance
            </button>
          </div>
        </motion.div>

        {/* FEATURE PILLS */}
        <div className="flex flex-wrap justify-center gap-3">
          <FeaturePill icon={<MessageSquare size={15} />} text="Live Messenger" />
          <FeaturePill icon={<Sparkles size={15} />} text="AI Business Assistant" />
          <FeaturePill icon={<ShieldCheck size={15} />} text="Fraud Blacklist Protection" />
          <FeaturePill icon={<Lock size={15} className="text-emerald-400" />} text="256-Bit SSL Security" />
        </div>

        {/* GOOGLE FIREBASE SSL & SECURITY COMPLIANCE SECTION */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="w-full bg-[#0a0d14]/90 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_30px_rgba(16,185,129,0.08)] backdrop-blur-md relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-white/10 pb-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck size={28} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  Google Firebase SSL & Data Safety Standard
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    Verified
                  </span>
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Official Security Statement for Google OAuth Reviewers & Platform Users
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10 text-xs text-gray-300">
              <Server size={14} className="text-dragon-cyan" />
              <span>Google Cloud & Firestore Enterprise Host</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <Lock size={16} />
                <span>256-Bit SSL/TLS Encryption</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                All data transmission between clients, servers, and Google Firebase Firestore is secured via TLS 1.3 / 256-bit SSL encryption.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-dragon-cyan font-semibold text-sm">
                <Database size={16} />
                <span>Firestore Access Rules</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Data access is governed by strict granular Firestore security rules, verifying user authentication tokens before granting document permissions.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                <Globe size={16} />
                <span>Google OAuth Data Compliance</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Strictly adheres to Google API Services User Data Policy and Google Limited Use requirements. Your private data is never sold or shared.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span>SSL Certificate Status: <strong className="text-emerald-400">Active & Valid (HTTPS)</strong></span>
            </div>

            <button
              onClick={() => setShowSecurityModal(true)}
              className="text-dragon-cyan hover:underline flex items-center gap-1 font-medium"
            >
              <span>Read Full Google Review Security Statement</span>
              <ExternalLink size={12} />
            </button>
          </div>
        </motion.div>
      </div>

      {/* FOOTER */}
      <footer className="w-full max-w-4xl pt-6 pb-2 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400 z-10">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white">DoelPro Enterprise</span>
          <span>•</span>
          <span>© {new Date().getFullYear()} All Rights Reserved</span>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => setShowSecurityModal(true)} className="hover:text-white transition-colors">
            Privacy Policy
          </button>
          <span>•</span>
          <button onClick={() => setShowSecurityModal(true)} className="hover:text-white transition-colors">
            Terms of Service
          </button>
          <span>•</span>
          <button onClick={() => setShowSecurityModal(true)} className="hover:text-white transition-colors flex items-center gap-1 text-emerald-400">
            <Lock size={12} />
            SSL Security Disclosure
          </button>
        </div>
      </footer>

      {/* SECURITY & PRIVACY MODAL (FOR GOOGLE REVIEW COMPLIANCE) */}
      <AnimatePresence>
        {showSecurityModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease_out]">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0f121a] border border-white/15 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 space-y-6 text-left shadow-2xl relative text-gray-200"
            >
              {/* Modal Close Button */}
              <button
                onClick={() => setShowSecurityModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Google Security, SSL & Privacy Policy</h3>
                  <p className="text-xs text-emerald-400 font-mono">Verified Google Firebase Security Disclosure</p>
                </div>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-gray-300 leading-relaxed font-sans">
                <section className="space-y-1.5">
                  <h4 className="text-white font-bold text-base flex items-center gap-2">
                    <Lock size={16} className="text-emerald-400" />
                    1. 256-Bit SSL/TLS Connection & Transport Security
                  </h4>
                  <p>
                    DoelPro mandates HTTPS and TLS 1.3 socket layer encryption for all web and API communications. All client requests to our application endpoints and database layers are encrypted end-to-end using industry-standard 256-bit SSL certificates managed by Google Cloud and Google Firebase infrastructure.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h4 className="text-white font-bold text-base flex items-center gap-2">
                    <Database size={16} className="text-dragon-cyan" />
                    2. Google Firebase Data Isolation & Firestore Rules
                  </h4>
                  <p>
                    All database reads, writes, and real-time queries are stored on Google Firestore. Access control is strictly guarded by server-side Firebase Security Rules. Every document is mapped to authorized user identifiers (UIDs) or explicit role-based permissions, preventing unauthorized data leakage or cross-account contamination.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h4 className="text-white font-bold text-base flex items-center gap-2">
                    <Globe size={16} className="text-indigo-400" />
                    3. Google OAuth 2.0 & API Services User Data Policy
                  </h4>
                  <p>
                    DoelPro's use and transfer to any other app of information received from Google APIs will adhere to <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-dragon-cyan underline">Google API Services User Data Policy</a>, including the Limited Use requirements. User credentials and authentication tokens are processed exclusively for verifying identity and enabling requested commerce features.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h4 className="text-white font-bold text-base flex items-center gap-2">
                    <FileText size={16} className="text-amber-400" />
                    4. Privacy Policy, Company Information & Terms of Service
                  </h4>
                  <p>
                    <strong>Operating Entity:</strong> DoelPro Enterprise (Dragon Systems Ltd.)<br />
                    <strong>Registered Address:</strong> Level 7, Software Technology Park, Dhaka, Bangladesh<br />
                    <strong>Official Legal Contact:</strong> legal@doelpro.com | support@doelpro.com<br />
                    <br />
                    We respect user privacy and adhere to international data protection standards. All personal information collected during registration (including merchant profile, phone numbers, and payment receipts) is stored encrypted on Google Cloud infrastructure and processed solely for providing e-commerce store operations, domain hosting, and payment verification. Users retain full rights to request data export or account deletion.
                  </p>
                </section>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-gray-500 font-mono">Last updated: July 2026</span>
                <button
                  onClick={() => setShowSecurityModal(false)}
                  className="px-6 py-2.5 rounded-full bg-dragon-cyan text-dragon-black font-bold text-xs hover:bg-white transition-all"
                >
                  I Understand
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FeaturePill({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-xs font-medium text-gray-300 hover:border-white/20 transition-all">
      {icon}
      {text}
    </div>
  );
}

