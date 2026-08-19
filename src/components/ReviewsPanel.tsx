import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Star, MessageSquare, Trash2, Send, CornerDownRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface Review {
  id: string;
  websiteId: string;
  productId: string;
  productName: string;
  customerName: string;
  customerEmail: string;
  customerPhoto: string;
  rating: number;
  comment: string;
  reply?: string;
  replyAt?: any;
  createdAt: any;
}

interface ReviewsPanelProps {
  websiteId: string;
}

export const ReviewsPanel: React.FC<ReviewsPanelProps> = ({ websiteId }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [replyText, setReplyText] = useState<{ [reviewId: string]: string }>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

  useEffect(() => {
    if (!websiteId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'product_reviews'),
      where('websiteId', '==', websiteId)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const items: Review[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as Review);
      });
      // Sort newest first
      items.sort((a, b) => {
        const t1 = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
        const t2 = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
        return t2 - t1;
      });
      setReviews(items);
      setLoading(false);
    }, (error) => {
      console.error("Error loading reviews for dashboard:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [websiteId]);

  // Handle saving reply
  const handleSaveReply = async (reviewId: string) => {
    const text = replyText[reviewId]?.trim();
    if (!text) {
      alert("Reply text cannot be empty.");
      return;
    }

    try {
      const docRef = doc(db, 'product_reviews', reviewId);
      await updateDoc(docRef, {
        reply: text,
        replyAt: new Date().toISOString()
      });
      setActiveReplyId(null);
      alert("Reply saved successfully!");
    } catch (error) {
      console.error("Error saving reply:", error);
      alert("Failed to save reply. Please try again.");
    }
  };

  // Handle deleting a review
  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm("Are you sure you want to delete this review? This action cannot be undone.")) return;

    try {
      const docRef = doc(db, 'product_reviews', reviewId);
      await deleteDoc(docRef);
      alert("Review deleted successfully.");
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("Failed to delete review.");
    }
  };

  const pendingRepliesCount = reviews.filter(r => !r.reply).length;
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) 
    : '0.0';

  if (loading) {
    return (
      <div className="py-20 text-center text-gray-400">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs uppercase tracking-widest font-black">Loading Reviews...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white/2 border border-white/5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-wider">Total Reviews</p>
            <h3 className="text-2xl font-black text-white">{reviews.length}</h3>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <MessageSquare size={18} />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white/2 border border-white/5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-wider">Average Rating</p>
            <div className="flex items-center gap-1.5">
              <h3 className="text-2xl font-black text-amber-400">{averageRating}</h3>
              <Star size={14} className="text-amber-400" fill="currentColor" />
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400">
            <Star size={18} fill="currentColor" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white/2 border border-white/5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-wider">Pending Replies</p>
            <h3 className="text-2xl font-black text-emerald-400">{pendingRepliesCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <CheckCircle2 size={18} />
          </div>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="p-12 text-center rounded-[2.5rem] bg-white/2 border border-white/5 border-dashed">
          <MessageSquare size={40} className="mx-auto text-gray-600 mb-3 animate-pulse" />
          <h4 className="text-sm font-black uppercase tracking-wider text-white">No Customer Reviews Yet</h4>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">When customers submit ratings and reviews on your public website, they will appear here, and you will be able to reply to them.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div 
              key={rev.id} 
              className="p-6 rounded-[2rem] bg-white/2 border border-white/5 space-y-4 transition-all hover:bg-white/[0.03]"
            >
              {/* Header profile info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  {rev.customerPhoto ? (
                    <img 
                      src={rev.customerPhoto} 
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full border border-white/10" 
                      alt={rev.customerName} 
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400">
                      <Star size={16} />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-black text-white">{rev.customerName}</h4>
                      <span className="text-[8px] px-1.5 py-0.5 bg-white/5 text-gray-400 rounded font-black uppercase tracking-wide">{rev.productName}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium">{rev.customerEmail}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star 
                        key={s} 
                        size={12} 
                        fill={s <= rev.rating ? "currentColor" : "none"} 
                        className={s <= rev.rating ? "text-amber-400" : "text-gray-700"} 
                      />
                    ))}
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleDeleteReview(rev.id)}
                    className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-all cursor-pointer"
                    title="Delete Review"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* User message/comment */}
              <div className="space-y-1">
                <p className="text-xs text-gray-500 uppercase font-black tracking-widest text-[9px]">Customer Comment</p>
                <p className="text-xs text-gray-200 leading-relaxed font-sans">{rev.comment}</p>
              </div>

              {/* Replies */}
              {rev.reply ? (
                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex items-start gap-3">
                  <CornerDownRight size={14} className="text-dragon-cyan shrink-0 mt-0.5" />
                  <div className="space-y-1 w-full">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[9px] font-black text-dragon-cyan uppercase tracking-wider">Your Response</span>
                      <button 
                        type="button"
                        onClick={() => {
                          setReplyText(prev => ({ ...prev, [rev.id]: rev.reply || '' }));
                          setActiveReplyId(rev.id);
                        }}
                        className="text-[9px] text-gray-500 hover:text-dragon-cyan underline uppercase font-black"
                      >
                        Edit Reply
                      </button>
                    </div>
                    <p className="text-xs text-gray-300 font-sans">{rev.reply}</p>
                  </div>
                </div>
              ) : (
                activeReplyId !== rev.id && (
                  <button
                    type="button"
                    onClick={() => {
                      setReplyText(prev => ({ ...prev, [rev.id]: '' }));
                      setActiveReplyId(rev.id);
                    }}
                    className="flex items-center gap-1.5 text-[10px] text-dragon-cyan hover:underline font-black uppercase tracking-wider"
                  >
                    <Send size={10} /> Write Response
                  </button>
                )
              )}

              {/* Reply Edit Panel */}
              {activeReplyId === rev.id && (
                <div className="p-4 rounded-2xl bg-[#0e1017] border border-white/10 space-y-3">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Write Response</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={replyText[rev.id] || ''}
                      onChange={(e) => setReplyText(prev => ({ ...prev, [rev.id]: e.target.value }))}
                      placeholder="Write your official reply to this customer..."
                      className="flex-1 p-2.5 text-xs bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-dragon-cyan font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveReply(rev.id)}
                      className="px-4 bg-dragon-cyan hover:bg-dragon-cyan/90 text-dragon-black rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                    >
                      <Send size={12} className="stroke-[3]" /> Send
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveReplyId(null)}
                    className="text-[9px] text-gray-500 hover:underline uppercase font-black"
                  >
                    Cancel
                  </button>
                </div>
              )}

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
