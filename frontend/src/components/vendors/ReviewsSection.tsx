import React, { useState, useEffect } from 'react';
import { listReviews, createReview } from '../../lib/api';
import { Review } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Star, MessageSquare, Send, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../../lib/utils';

interface ReviewsSectionProps {
  vendorId: string;
}

export const ReviewsSection = ({ vendorId }: ReviewsSectionProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { userProfile } = useAuth();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const rows = await listReviews(vendorId, 20);
        if (active) setReviews(rows);
      } catch (err) {
        console.error('Could not load reviews:', err);
      }
    })();
    return () => { active = false; };
  }, [vendorId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !userProfile) return;

    setLoading(true);
    setError('');
    try {
      const saved = await createReview({
        targetId: vendorId,
        authorId: userProfile.uid,
        authorName: userProfile.displayName,
        authorAvatar: userProfile.photoURL || '',
        rating,
        content: content.trim(),
      });
      setReviews((prev) => [saved, ...prev]);
      setContent('');
      setRating(5);
    } catch (error) {
      console.error('Error adding review:', error);
      setError('Could not submit your review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {!userProfile && (
        <div className="bg-slate-50 rounded-xl border border-dashed border-slate-200 p-5 text-center">
          <p className="text-xs font-bold text-slate-600 mb-1">Set up a profile to leave a review</p>
          <p className="text-[10px] text-slate-400">Takes a minute — just your name and number.</p>
        </div>
      )}
      {userProfile && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare size={18} className="text-primary" />
            Write a Review
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  className="transition-transform active:scale-125"
                >
                  <Star 
                    size={24} 
                    className={cn(
                      s <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200"
                    )} 
                  />
                </button>
              ))}
              <span className="ml-2 text-sm font-bold text-slate-500">{rating}/5 Stars</span>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your experience with this dealer..."
              className="w-full min-h-[100px] p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-all resize-none"
            />
            {error && (
              <p className="text-xs font-bold text-red-600 bg-red-50 px-3 py-2 rounded-xl border border-red-100">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Review'}
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="font-bold text-gray-900 px-2 flex items-center gap-2">
          Customer Reviews 
          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-500 font-bold">{reviews.length}</span>
        </h3>
        
        {reviews.map((review) => (
          <div key={review.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-slate-100">
                  <img src={review.authorAvatar || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80`} alt={review.authorName} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{review.authorName}</p>
                  <p className="text-[10px] text-slate-400">
                    {review.createdAt && typeof review.createdAt !== 'string' && (review.createdAt as any).toDate
                      ? formatDistanceToNow((review.createdAt as any).toDate(), { addSuffix: true }) 
                      : typeof review.createdAt === 'string'
                        ? formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })
                        : 'just now'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star 
                    key={s} 
                    size={12} 
                    className={cn(s <= review.rating ? "fill-amber-400 text-amber-400" : "text-gray-100")} 
                  />
                ))}
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed italic">"{review.content}"</p>
          </div>
        ))}

        {reviews.length === 0 && (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-sm text-slate-400">No reviews yet for this business.</p>
          </div>
        )}
      </div>
    </div>
  );
};
