import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, ArrowLeft, KeyRound } from 'lucide-react';
import { cn } from '../lib/utils';
import { AuthContext } from '../authContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useContext(AuthContext);

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/messenger');
    }
  }, [user, authLoading, navigate]);

  if (authLoading) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResetSuccess('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/messenger');
    } catch (e: any) {
      setError('Invalid dragon credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('To reset your password, please provide your email in the field above.');
      setResetSuccess('');
      return;
    }
    setError('');
    setResetSuccess('');
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSuccess('Password reset email has been sent! Please check your inbox or spam folder.');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email format.');
      } else {
        setError('Failed to send reset email. Please enter a valid email.');
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-dragon-black flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_#1a1a2e_0%,_#050505_40%)]">
      <div className="w-full max-w-md">
        <button onClick={() => navigate('/')} className="mb-8 text-gray-500 hover:text-white flex items-center gap-2 text-sm transition-colors">
           <ArrowLeft size={16} /> Back to Nexus
        </button>

        <div className="mb-12">
          <h2 className="text-4xl font-display font-bold text-white tracking-tighter">WELCOME BACK</h2>
          <p className="text-gray-500 mt-2 font-light">Continue your commerce journey.</p>
        </div>

        <form onSubmit={handleLogin} className="glass-card p-8 space-y-6 neon-glow">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 ml-1">DRAGON ID (EMAIL)</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-dragon-cyan transition-colors" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="dragon@nexus.com"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-dragon-cyan/50 focus:bg-white/10 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 ml-1">SECRET KEY</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-dragon-cyan transition-colors" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-dragon-cyan/50 focus:bg-white/10 transition-all font-mono"
              />
            </div>
            <div className="text-right">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={resetLoading}
                className="text-[10px] text-dragon-cyan hover:underline hover:text-cyan-300 transition-colors uppercase font-bold tracking-wider cursor-pointer"
              >
                {resetLoading ? 'Sending...' : 'Forgot Secret Key? (Forgot Secret Key?)'}
              </button>
            </div>
          </div>

          {error && <p className="text-red-400 text-xs text-center font-medium bg-red-500/10 border border-red-500/20 py-2.5 px-3 rounded-xl">{error}</p>}
          {resetSuccess && <p className="text-emerald-400 text-xs text-center font-medium bg-emerald-500/10 border border-emerald-500/20 py-2.5 px-3 rounded-xl">{resetSuccess}</p>}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-dragon-cyan text-dragon-black font-bold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? "Decrypting..." : "ENTER NEXUS"} <LogIn size={18} />
          </button>

          <p className="text-center text-sm text-gray-400 mt-4">
             New hatchling? <button type="button" onClick={() => navigate('/signup')} className="text-dragon-cyan font-bold underline">Signup</button>
          </p>
        </form>
      </div>
    </div>
  );
}
