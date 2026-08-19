import React, { useState, useEffect } from 'react';
import { X, VolumeX, Volume2, Clock, Check, Bell, Loader2 } from 'lucide-react';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface CallMuteModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: { uid: string; name?: string; profileImage?: string | null } | null;
  currentUserUid: string;
}

export default function CallMuteModal({
  isOpen,
  onClose,
  targetUser,
  currentUserUid
}: CallMuteModalProps) {
  const [muteValue, setMuteValue] = useState<number>(10);
  const [muteUnit, setMuteUnit] = useState<'minutes' | 'hours' | 'days' | 'months'>('minutes');
  const [existingMute, setExistingMute] = useState<{ expiresAt: string; durationString: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !targetUser || !currentUserUid) return;

    // Fetch existing mute configuration
    const checkMute = async () => {
      try {
        setLoading(true);
        const muteRef = doc(db, 'call_mutes', `${currentUserUid}_${targetUser.uid}`);
        const snap = await getDoc(muteRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.expiresAt && new Date(data.expiresAt) > new Date()) {
            setExistingMute({
              expiresAt: new Date(data.expiresAt).toLocaleString('en-US'),
              durationString: data.durationString || 'Custom Duration'
            });
          } else {
            // Already expired
            setExistingMute(null);
          }
        } else {
          setExistingMute(null);
        }
      } catch (err) {
        console.warn("Failed checking call mute details:", err);
      } finally {
        setLoading(false);
      }
    };

    checkMute();
  }, [isOpen, targetUser, currentUserUid]);

  if (!isOpen || !targetUser) return null;

  const handleMute = async () => {
    if (muteValue <= 0) return;
    setLoading(true);
    try {
      const now = new Date();
      let expiresAt: Date;

      switch (muteUnit) {
        case 'minutes':
          expiresAt = new Date(now.getTime() + muteValue * 60 * 1000);
          break;
        case 'hours':
          expiresAt = new Date(now.getTime() + muteValue * 60 * 60 * 1000);
          break;
        case 'days':
          expiresAt = new Date(now.getTime() + muteValue * 24 * 60 * 60 * 1000);
          break;
        case 'months':
          expiresAt = new Date(now.getTime() + muteValue * 30 * 24 * 60 * 60 * 1000);
          break;
      }

      const unitBangla = 
        muteUnit === 'minutes' ? 'Minutes' : 
        muteUnit === 'hours' ? 'Hours' : 
        muteUnit === 'days' ? 'Days' : 'Months';

      const durationString = `${muteValue} ${unitBangla}`;

      await setDoc(doc(db, 'call_mutes', `${currentUserUid}_${targetUser.uid}`), {
        mutedBy: currentUserUid,
        mutedUser: targetUser.uid,
        expiresAt: expiresAt.toISOString(),
        durationString,
        createdAt: new Date().toISOString()
      });

      setExistingMute({
        expiresAt: expiresAt.toLocaleString('en-US'),
        durationString
      });

      // Clear or close modal
      onClose();
    } catch (err) {
      console.error("Error writing mute info to firebase", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnmute = async () => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'call_mutes', `${currentUserUid}_${targetUser.uid}`));
      setExistingMute(null);
      onClose();
    } catch (err) {
      console.error("Error removing mute info from firebase", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dragon-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#0b0c13] border border-white/10 w-full max-w-md rounded-2xl flex flex-col shadow-2xl overflow-hidden p-5 space-y-4">
        
        {/* Modal Title Block */}
        <div className="flex justify-between items-start">
          <div className="flex gap-3 items-center">
            <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center text-red-400">
              <VolumeX size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                Call Mute Settings
              </h2>
              <p className="text-[10px] text-zinc-400">
                {targetUser.name || 'Anonymous User'}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1 hover:bg-white/5 border border-white/10 rounded-lg text-zinc-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {loading && !existingMute ? (
          <div className="py-10 flex flex-col gap-2 items-center justify-center text-zinc-400 text-xs text-center font-sans">
            <Loader2 size={24} className="animate-spin text-dragon-cyan" />
            <span>Checking mute settings...</span>
          </div>
        ) : (
          <>
            {existingMute ? (
              <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl space-y-3.5">
                <div className="flex items-start gap-2.5">
                  <Clock size={16} className="text-red-400 mt-0.5 shrink-0" />
                  <div className="text-xs space-y-1">
                    <p className="text-zinc-300 font-medium">This user is already muted.</p>
                    <p className="text-red-400 font-extrabold font-mono tracking-tight text-[11px]">
                      Mute Duration: {existingMute.durationString}
                    </p>
                    <p className="text-zinc-500 text-[10px]">
                      Expires at: {existingMute.expiresAt}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleUnmute}
                    disabled={loading}
                    className="flex-1 py-2 bg-dragon-emerald/20 hover:bg-dragon-emerald text-dragon-emerald hover:text-black border border-dragon-emerald/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-200 cursor-pointer flex justify-center items-center gap-1.5"
                  >
                    <Volume2 size={14} /> Unmute Calls
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Select a duration below and click mute. If this user calls you during this time, they will receive a busy signal and the call will end automatically.
                </p>

                {/* Duration Configurator */}
                <div className="space-y-2.5">
                  <label className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-widest block">Select Mute Duration</label>
                  <div className="flex gap-2.5">
                    <input 
                      type="number"
                      min={1}
                      max={999}
                      value={muteValue}
                      onChange={e => setMuteValue(Math.max(1, parseInt(e.target.value) || 1))}
                      className="bg-[#0f111a] border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono placeholder:text-zinc-700 w-24 outline-none focus:border-dragon-cyan/50"
                    />
                    <select
                      value={muteUnit}
                      onChange={e => setMuteUnit(e.target.value as any)}
                      className="flex-1 bg-[#0f111a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none font-bold focus:border-dragon-cyan/50 cursor-pointer"
                    >
                      <option value="minutes" className="bg-dragon-black">Minutes</option>
                      <option value="hours" className="bg-dragon-black">Hours</option>
                      <option value="days" className="bg-dragon-black">Days</option>
                      <option value="months" className="bg-dragon-black">Months</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleMute}
                  disabled={loading}
                  className="w-full py-2.5 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-200 cursor-pointer flex justify-center items-center gap-1.5"
                >
                  {loading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <VolumeX size={14} />
                  )}
                  Mute Calls Now
                </button>
              </div>
            )}
          </>
        )}
        
        {/* Info Banner */}
        <div className="text-[9px] text-zinc-500 text-center font-sans">
          🛡️ Mute preferences are securely saved to your profile.
        </div>

      </div>
    </div>
  );
}
