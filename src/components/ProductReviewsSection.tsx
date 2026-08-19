import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, limit } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { Star, LogIn, LogOut, MessageSquare, Calendar, ChevronRight, User, CornerDownRight, Trash2, Edit3, Send } from 'lucide-react';

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

interface ProductReviewsSectionProps {
  websiteId: string;
  productId: string;
  productName: string;
  isDarkTheme?: boolean;
  ownerId?: string; // The merchant user ID who created the website or landing page
}

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({
  websiteId,
  productId,
  productName,
  isDarkTheme = true,
  ownerId
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // States for merchant replies
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [replySubmitting, setReplySubmitting] = useState<boolean>(false);

  // Auth state listener
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  // Fetch reviews in real-time
  useEffect(() => {
    if (!productId) return;
    const q = query(
      collection(db, 'product_reviews'),
      where('productId', '==', productId),
      limit(50)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const items: Review[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as Review);
      });
      // Sort reviews newest first
      items.sort((a, b) => {
        const t1 = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
        const t2 = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
        return t2 - t1;
      });
      setReviews(items);
    }, (error) => {
      console.error("Error loading reviews:", error);
    });

    return () => unsub();
  }, [productId]);

  // Handle Google Login
  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login error:", error);
      alert("Failed to sign in with Google. Please try again.");
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Submit Review
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Please sign in with Google to leave a review.");
      return;
    }
    if (!comment.trim()) {
      alert("Please write your review comment.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        websiteId: websiteId || '',
        productId: productId,
        productName: productName || 'Product',
        customerName: currentUser.displayName || 'Anonymous User',
        customerEmail: currentUser.email || '',
        customerPhoto: currentUser.photoURL || '',
        rating: rating,
        comment: comment.trim(),
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'product_reviews'), payload);
      setComment('');
      setRating(5);
      alert("Thank you! Your review has been submitted successfully!");
    } catch (error) {
      console.error("Error adding review:", error);
      alert("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Save Reply (Owner/Merchant)
  const handleSaveReply = async (reviewId: string) => {
    if (!replyText.trim()) {
      alert("Please enter a reply.");
      return;
    }
    setReplySubmitting(true);
    try {
      await updateDoc(doc(db, 'product_reviews', reviewId), {
        reply: replyText.trim(),
        replyAt: new Date().toISOString()
      });
      setReplyingToId(null);
      setReplyText('');
      alert("Reply posted successfully!");
    } catch (error) {
      console.error("Error saving reply:", error);
      alert("Failed to post reply. Please try again.");
    } finally {
      setReplySubmitting(false);
    }
  };

  // Handle Delete Review (Owner/Merchant)
  const handleDeleteReview = async (reviewId: string) => {
    if (confirm("Are you sure you want to delete this review?")) {
      try {
        await deleteDoc(doc(db, 'product_reviews', reviewId));
        alert("Review deleted successfully.");
      } catch (error) {
        console.error("Error deleting review:", error);
        alert("Failed to delete review. Please try again.");
      }
    }
  };

  // Calculate rating stats
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) 
    : '0.0';

  const isOwner = currentUser && ownerId && currentUser.uid === ownerId;

  return (
    <div className={`space-y-8 font-sans ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
      
      {/* Overview Stat Row */}
      <div className={`p-6 rounded-[2rem] border flex flex-col sm:flex-row items-center justify-between gap-6 ${
        isDarkTheme ? 'bg-white/2 border-white/10' : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-xl font-black uppercase tracking-wider flex items-center justify-center sm:justify-start gap-2">
            <span>Customer Reviews</span>
            {isOwner && (
              <span className="text-[10px] bg-amber-400 text-black px-2 py-0.5 rounded-full font-black tracking-widest uppercase">
                Merchant View
              </span>
            )}
          </h3>
          <p className="text-xs text-gray-400 font-medium">Verified customer ratings and shopping feedback for this product</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-4xl font-black text-amber-400 tracking-tight">{averageRating}</div>
            <div className="flex justify-center gap-0.5 my-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star 
                  key={s} 
                  size={12} 
                  fill={s <= Math.round(Number(averageRating)) ? "currentColor" : "none"} 
                  className={s <= Math.round(Number(averageRating)) ? "text-amber-400" : "text-gray-600"} 
                />
              ))}
            </div>
            <p className="text-[10px] text-gray-500 font-bold uppercase">{reviews.length} Ratings</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Reviews list */}
        <div className="lg:col-span-7 space-y-4">
          {reviews.length === 0 ? (
            <div className={`py-12 text-center rounded-[2rem] border border-dashed ${
              isDarkTheme ? 'border-white/10 text-gray-500' : 'border-gray-200 text-gray-400'
            }`}>
              <MessageSquare size={32} className="mx-auto mb-3 text-gray-600 animate-bounce" />
              <p className="font-bold text-sm">No reviews yet</p>
              <p className="text-xs mt-1">Be the first to share your experience with this product!</p>
            </div>
          ) : (
            reviews.map((rev) => (
              <div 
                key={rev.id} 
                className={`p-5 rounded-3xl border transition-all hover:scale-[1.01] ${
                  isDarkTheme ? 'bg-white/2 border-white/5' : 'bg-white border-gray-150 shadow-sm'
                }`}
              >
                {/* User info */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    {rev.customerPhoto ? (
                      <img 
                        src={rev.customerPhoto} 
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border border-amber-400/25" 
                        alt={rev.customerName} 
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-amber-400/10 flex items-center justify-center text-amber-400 border border-amber-400/25">
                        <User size={16} />
                      </div>
                    )}
                    <div>
                      <h5 className="text-xs font-black tracking-wide">{rev.customerName}</h5>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star 
                              key={s} 
                              size={10} 
                              fill={s <= rev.rating ? "currentColor" : "none"} 
                              className={s <= rev.rating ? "text-amber-400" : "text-gray-600"} 
                            />
                          ))}
                        </div>
                        <span className="text-[9px] text-gray-500">• Verified Buyer</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[9px] text-gray-500 flex items-center gap-1">
                    <Calendar size={10} />
                    {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : 'Just now'}
                  </span>
                </div>

                {/* Review comment */}
                <p className="text-xs text-gray-300 leading-relaxed font-sans">{rev.comment}</p>

                {/* Admin/Merchant Reply */}
                {rev.reply && (
                  <div className={`mt-3 p-3.5 rounded-2xl border-l-2 border-dragon-cyan ml-2 ${
                    isDarkTheme ? 'bg-[#0f111a] border-white/5' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <CornerDownRight size={12} className="text-dragon-cyan" />
                      <span className="text-[10px] font-black text-dragon-cyan uppercase tracking-wider">Seller's Response</span>
                      <span className="text-[8px] text-gray-500">
                        {rev.replyAt ? new Date(rev.replyAt).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed font-sans">{rev.reply}</p>
                  </div>
                )}

                {/* Merchant inline control actions directly on public page */}
                {isOwner && (
                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingToId(replyingToId === rev.id ? null : rev.id);
                          setReplyText(rev.reply || '');
                        }}
                        className="text-[10px] bg-amber-400/10 hover:bg-amber-400/25 text-amber-400 px-3 py-1.5 rounded-lg uppercase tracking-wider font-black transition-all cursor-pointer border border-amber-400/20 flex items-center gap-1"
                      >
                        <Edit3 size={11} />
                        {rev.reply ? 'Edit Reply' : 'Reply'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteReview(rev.id)}
                        className="text-[10px] bg-red-500/10 hover:bg-red-500/25 text-red-400 px-3 py-1.5 rounded-lg uppercase tracking-wider font-black transition-all cursor-pointer border border-red-500/20 flex items-center gap-1"
                      >
                        <Trash2 size={11} />
                        Delete
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline Reply Editor Form */}
                {isOwner && replyingToId === rev.id && (
                  <div className="mt-3 p-4 rounded-2xl bg-black/40 border border-amber-400/20 space-y-3">
                    <div className="text-[10px] text-amber-400 font-black uppercase tracking-wider">
                      {rev.reply ? 'Edit Response' : 'Write Response'}
                    </div>
                    <textarea
                      rows={3}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write your official response to this review..."
                      className="w-full p-3 text-xs rounded-xl bg-black/60 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-amber-400 font-sans"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={replySubmitting}
                        onClick={() => handleSaveReply(rev.id)}
                        className="px-3 py-1.5 bg-amber-400 text-black font-black text-[10px] uppercase tracking-wider rounded-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1"
                      >
                        <Send size={11} />
                        {replySubmitting ? 'Posting...' : 'Post Response'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setReplyingToId(null)}
                        className="px-3 py-1.5 bg-white/5 text-gray-400 hover:text-white font-black text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Post a Review form */}
        <div className="lg:col-span-5">
          <div className={`p-6 rounded-[2.5rem] border sticky top-24 ${
            isDarkTheme ? 'bg-white/2 border-white/10' : 'bg-white border-gray-200 shadow-lg'
          }`}>
            <h4 className="text-sm font-black uppercase tracking-wider mb-2">Leave a Review</h4>
            <p className="text-[10px] text-gray-400 font-medium leading-relaxed mb-6">Sign in with Google to share your experience and write a star rating.</p>

            {currentUser ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Logged in header */}
                <div className={`flex items-center justify-between p-3 rounded-2xl ${
                  isDarkTheme ? 'bg-white/5' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center gap-2">
                    {currentUser.photoURL && (
                      <img 
                        src={currentUser.photoURL} 
                        referrerPolicy="no-referrer"
                        className="w-6 h-6 rounded-full" 
                        alt="Logged in" 
                      />
                    )}
                    <span className="text-[10px] font-black max-w-[120px] truncate">{currentUser.displayName}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={handleLogout}
                    className="text-[9px] text-rose-400 hover:underline flex items-center gap-1 uppercase font-black"
                  >
                    <LogOut size={10} /> Logout
                  </button>
                </div>

                {/* Rating selection stars */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">Select Stars</label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setRating(s)}
                        className="p-1 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star 
                          size={24} 
                          fill={s <= rating ? "currentColor" : "none"} 
                          className={s <= rating ? "text-amber-400" : "text-gray-500 hover:text-amber-300"} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment textarea */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">Your Feedback</label>
                  <textarea
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Write your review here..."
                    className={`w-full p-3 text-xs rounded-xl border font-sans focus:outline-none focus:ring-1 focus:ring-dragon-cyan transition-all ${
                      isDarkTheme 
                        ? 'bg-black/40 border-white/10 text-white placeholder-gray-600' 
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-dragon-cyan hover:bg-dragon-cyan/90 text-dragon-black rounded-xl text-xs font-black uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                  <ChevronRight size={14} className="stroke-[3]" />
                </button>
              </form>
            ) : (
              <div className="text-center py-6 space-y-4">
                <p className="text-xs text-gray-400 font-medium">You must be logged in with a Google Account to post a review.</p>
                <button
                  type="button"
                  onClick={handleLogin}
                  className="w-full py-3 bg-white hover:bg-gray-100 text-black rounded-xl text-xs font-black uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 border border-gray-200 shadow-md"
                >
                  <LogIn size={14} />
                  Login with Google
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
