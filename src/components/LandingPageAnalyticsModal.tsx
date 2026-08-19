import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  TrendingUp, 
  Users, 
  Clock, 
  Globe, 
  MapPin, 
  User, 
  Laptop, 
  Activity, 
  Compass,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { collection, onSnapshot, query, limit, orderBy, where, doc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { cn } from '../lib/utils';

interface LandingPageAnalyticsModalProps {
  pageId: string;
  pageUserId?: string;
  pageName: string;
  isOpen: boolean;
  onClose: () => void;
  collectionPath?: 'landing-pages' | 'pro_websites';
}

interface ViewRecord {
  id: string;
  deviceToken: string;
  ip: string;
  country: string;
  district: string;
  gender: 'Male' | 'Female' | 'Other';
  durationSeconds: number;
  createdAt: string;
  updatedAt: string;
}

export const LandingPageAnalyticsModal: React.FC<LandingPageAnalyticsModalProps> = ({
  pageId,
  pageUserId,
  pageName,
  isOpen,
  onClose,
  collectionPath = 'landing-pages'
}) => {
  const [views, setViews] = useState<ViewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvedUserId, setResolvedUserId] = useState<string>('');

  useEffect(() => {
    if (pageUserId) {
      setResolvedUserId(pageUserId);
    } else if (isOpen && pageId) {
      // Fallback: Fetch page to find its userId
      getDoc(doc(db, collectionPath, pageId))
        .then((snap) => {
          if (snap.exists()) {
            setResolvedUserId(snap.data().userId || '');
          }
        })
        .catch((err) => {
          console.error('Error getting page userId:', err);
        });
    } else {
      setResolvedUserId('');
    }
  }, [pageId, pageUserId, isOpen, collectionPath]);

  useEffect(() => {
    if (!isOpen || !pageId || !resolvedUserId) return;

    setLoading(true);
    const viewsRef = collection(db, collectionPath, pageId, 'views');
    // Query is filtered by the page owner's userId to satisfy firestore security rules
    const q = query(viewsRef, where('userId', '==', resolvedUserId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records: ViewRecord[] = [];
      snapshot.forEach((docSnap) => {
        records.push({
          id: docSnap.id,
          ...docSnap.data()
        } as ViewRecord);
      });
      // Sort client-side by updatedAt desc safely with no index overhead
      records.sort((a, b) => {
        const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return timeB - timeA;
      });
      setViews(records);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching analytics views:', error);
      handleFirestoreError(error, OperationType.LIST, `${collectionPath}/${pageId}/views`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [pageId, isOpen, resolvedUserId, collectionPath]);

  // Analytics Calculations
  const stats = React.useMemo(() => {
    if (views.length === 0) {
      return {
        totalViews: 0,
        maxDuration: 0,
        avgDuration: 0,
        genderDist: { Male: 0, Female: 0, Other: 0 },
        countryDist: {} as Record<string, number>,
        districtDist: {} as Record<string, number>,
      };
    }

    const totalViews = views.length;
    let maxDuration = 0;
    let sumDuration = 0;
    const genderDist = { Male: 0, Female: 0, Other: 0 };
    const countryDist: Record<string, number> = {};
    const districtDist: Record<string, number> = {};

    views.forEach(v => {
      const duration = Number(v.durationSeconds || 0);
      sumDuration += duration;
      if (duration > maxDuration) {
        maxDuration = duration;
      }

      // Gender mapping
      const gender = v.gender || 'Other';
      if (genderDist[gender] !== undefined) {
        genderDist[gender]++;
      } else {
        genderDist.Other++;
      }

      // Country map
      const country = v.country || 'Unknown';
      countryDist[country] = (countryDist[country] || 0) + 1;

      // District map
      const district = v.district || 'Unknown';
      districtDist[district] = (districtDist[district] || 0) + 1;
    });

    return {
      totalViews,
      maxDuration,
      avgDuration: Math.round(sumDuration / totalViews),
      genderDist,
      countryDist,
      districtDist
    };
  }, [views]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          className="w-full max-w-4xl bg-[#090b0e] border border-white/10 rounded-3xl overflow-hidden shadow-2xl my-auto font-sans text-left text-white"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-[#0e1116]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-dragon-cyan/10 flex items-center justify-center text-dragon-cyan border border-dragon-cyan/20">
                <BarChart3 size={20} />
              </div>
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-dragon-cyan">Real-time Performance Hub</span>
                <h3 className="text-sm font-black uppercase tracking-widest text-white truncate max-w-[280px] sm:max-w-md">
                  {pageName} <span className="text-gray-400 font-light">- Landing Page Analytics</span>
                </h3>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Dialog Container */}
          <div className="p-6 sm:p-8 space-y-8 max-h-[78vh] overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-4">
                <div className="w-10 h-10 border-2 border-dragon-cyan border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-gray-400 font-black tracking-widest uppercase animate-pulse">Loading Visitor Analytics...</p>
              </div>
            ) : views.length === 0 ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto text-gray-500 border border-white/5">
                  <Activity size={32} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black uppercase tracking-wider text-white">No viewer reports found yet</h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto font-light leading-relaxed">
                    Share your landing page link. Real-time analytics will update here automatically as soon as customers click your link.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Visual Cards Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Total Views Card */}
                  <div className="bg-[#10141a] border border-white/5 p-5 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-white">
                      <Users size={72} />
                    </div>
                    <span className="text-[9px] font-black text-dragon-cyan uppercase tracking-widest">Total Views</span>
                    <h2 className="text-3xl font-black mt-2 text-white font-mono flex items-baseline gap-2">
                      {stats.totalViews} <span className="text-xs font-light text-gray-500 font-sans">views</span>
                    </h2>
                    <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                      <Sparkles size={11} className="text-dragon-cyan" /> Unique visitor tokens tracked
                    </p>
                  </div>

                  {/* Max Seconds spent Card */}
                  <div className="bg-[#10141a] border border-white/5 p-5 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-white">
                      <Clock size={72} />
                    </div>
                    <span className="text-[9px] font-black text-dragon-cyan uppercase tracking-widest">Max Duration</span>
                    <h2 className="text-3xl font-black mt-2 text-white font-mono flex items-baseline gap-2">
                      {stats.maxDuration} <span className="text-xs font-light text-gray-500 font-sans">sec</span>
                    </h2>
                    <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                      <Clock size={11} className="text-dragon-cyan" /> Time spent on page
                    </p>
                  </div>

                  {/* Avg Seconds spent Card */}
                  <div className="bg-[#10141a] border border-white/5 p-5 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-white">
                      <TrendingUp size={72} />
                    </div>
                    <span className="text-[9px] font-black text-dragon-cyan uppercase tracking-widest">Avg Duration</span>
                    <h2 className="text-3xl font-black mt-2 text-white font-mono flex items-baseline gap-2">
                      {stats.avgDuration} <span className="text-xs font-light text-gray-500 font-sans">sec</span>
                    </h2>
                    <p className="text-[10px] text-dragon-cyan mt-2 flex items-center gap-1 font-bold tracking-wider uppercase">
                      ● Active Customer Engagement
                    </p>
                  </div>
                </div>

                {/* Distributions Metrics Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Gender Distribution */}
                  <div className="bg-[#10141a] border border-white/5 p-5 rounded-3xl space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-[#a0a5b0] border-b border-white/5 pb-2.5 flex items-center gap-2">
                      <User size={14} className="text-dragon-cyan" /> Gender Distribution
                    </h4>
                    <div className="space-y-4 pt-1">
                      {Object.entries(stats.genderDist).map(([gender, count]) => {
                        const pct = stats.totalViews > 0 ? Math.round((Number(count) / stats.totalViews) * 100) : 0;
                        let barColor = 'bg-dragon-cyan';
                        let labelBg = 'bg-dragon-cyan/10 text-dragon-cyan border-dragon-cyan/25';
                        if (gender === 'Female') {
                          barColor = 'bg-dragon-purple';
                          labelBg = 'bg-dragon-purple/10 text-dragon-purple border-dragon-purple/25';
                        } else if (gender === 'Other') {
                          barColor = 'bg-amber-400';
                          labelBg = 'bg-amber-400/10 text-amber-400 border-amber-400/25';
                        }

                        return (
                          <div key={gender} className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className={cn("px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border", labelBg)}>
                                {gender === 'Male' ? 'Male' : gender === 'Female' ? 'Female' : 'Other'} ({gender})
                              </span>
                              <span className="font-mono text-gray-400 font-bold">{count} views ({pct}%)</span>
                            </div>
                            <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8 }}
                                className={cn("h-full rounded-full", barColor)}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Country Distribution */}
                  <div className="bg-[#10141a] border border-white/5 p-5 rounded-3xl space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-[#a0a5b0] border-b border-white/5 pb-2.5 flex items-center gap-2">
                      <Globe size={14} className="text-dragon-cyan" /> Country Analytics
                    </h4>
                    <div className="space-y-3.5 pt-1 max-h-[178px] overflow-y-auto custom-scrollbar pr-1">
                      {Object.entries(stats.countryDist)
                        .sort((a, b) => Number(b[1]) - Number(a[1]))
                        .map(([country, count]) => {
                          const pct = stats.totalViews > 0 ? Math.round((Number(count) / stats.totalViews) * 100) : 0;
                          return (
                            <div key={country} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-dragon-cyan shrink-0" />
                                <span className="font-black uppercase tracking-wider text-white">{country}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-gray-400">{count} clicks</span>
                                <span className="px-2 py-0.5 bg-white/5 rounded-md text-[10px] font-black font-mono text-dragon-cyan">{pct}%</span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>

                {/* District Distribution in Wide Format */}
                <div className="bg-[#10141a] border border-white/5 p-5 rounded-3xl space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-[#a0a5b0] border-b border-white/5 pb-2.5 flex items-center gap-2">
                    <MapPin size={14} className="text-dragon-cyan" /> District / City Distributions
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    {Object.entries(stats.districtDist)
                      .sort((a, b) => Number(b[1]) - Number(a[1]))
                      .map(([district, count]) => {
                        const pct = stats.totalViews > 0 ? Math.round((Number(count) / stats.totalViews) * 100) : 0;
                        return (
                          <div key={district} className="space-y-1.5 p-3 rounded-2xl bg-black/25 border border-white/[0.03]">
                            <div className="flex justify-between items-center text-xs">
                              <div className="flex items-center gap-1.5">
                                <MapPin size={11} className="text-dragon-cyan shrink-0" />
                                <span className="font-black uppercase tracking-widest text-dragon-cyan text-[10px]">{district}</span>
                              </div>
                              <span className="font-mono text-[10px] text-gray-400">{count} viewers ({pct}%)</span>
                            </div>
                            <div className="w-full h-1.5 bg-[#090b0e] rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8 }}
                                className="h-full bg-gradient-to-r from-dragon-cyan to-[#00f2fe]/40 rounded-full"
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>


              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
