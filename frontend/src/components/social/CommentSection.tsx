import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { listComments, createComment } from '../../lib/api';
import { Comment } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Send, User, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CommentSectionProps {
  postId: string;
  onCountChange?: (count: number) => void;
}

const PAGE_SIZE = 20;

function formatDate(createdAt: unknown): string {
  try {
    if (createdAt && typeof (createdAt as any).toDate === 'function') {
      return formatDistanceToNow((createdAt as any).toDate(), { addSuffix: true });
    }
    if (typeof createdAt === 'string') {
      return formatDistanceToNow(new Date(createdAt), { addSuffix: true });
    }
  } catch {
    /* fall through */
  }
  return 'just now';
}

export const CommentSection = ({ postId, onCountChange }: CommentSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  // One-shot read when the thread opens, rather than a standing listener per
  // expanded post.
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const rows = await listComments(postId, PAGE_SIZE);
        if (!active) return;
        setComments(rows);
      } catch (err) {
        console.error('Could not load comments:', err);
        if (active) setError('Could not load comments.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [postId]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const text = newComment.trim();
      if (!text) return;

      const profile = userProfile;
      if (!profile) {
        navigate('/login?next=/');
        return;
      }

      setSubmitting(true);
      setError('');
      try {
        // The server also increments the post's comment counter.
        const saved = await createComment({
          postId,
          authorId: profile.uid,
          authorName: profile.displayName,
          authorAvatar: profile.photoURL || '',
          content: text,
        });
        setComments((prev) => {
          const next = [saved, ...prev];
          onCountChange?.(next.length);
          return next;
        });
        setNewComment('');
      } catch (err) {
        console.error('Error adding comment:', err);
        setError('Could not post your comment. Please try again.');
      } finally {
        setSubmitting(false);
      }
    },
    [newComment, postId, userProfile, navigate, onCountChange]
  );

  return (
    <div className="mt-4 space-y-4 pt-4 border-t border-slate-100">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-slate-100">
          {userProfile?.photoURL ? (
            <img src={userProfile.photoURL} alt="" className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User size={16} className="text-slate-400" />
            </div>
          )}
        </div>
        <div className="flex-1 relative">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            maxLength={500}
            placeholder="Write a comment..."
            className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-full text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all pr-10"
          />
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            aria-label="Post comment"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-primary disabled:opacity-30 hover:scale-110 transition-transform"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </form>

      {error && <p className="text-[10px] font-bold text-red-600 text-center">{error}</p>}

      <div className="space-y-4 max-h-60 overflow-y-auto no-scrollbar">
        {loading ? (
          <p className="text-[10px] text-slate-400 text-center py-2 font-medium">Loading comments...</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-slate-100 mt-1">
                {comment.authorAvatar && (
                  <img
                    src={comment.authorAvatar}
                    alt={comment.authorName}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}
              </div>
              <div className="flex-1">
                <div className="bg-slate-50 rounded-2xl p-3 inline-block max-w-full">
                  <p className="text-[10px] font-black text-slate-900 mb-0.5">{comment.authorName}</p>
                  <p className="text-xs text-slate-700 leading-relaxed break-words">{comment.content}</p>
                </div>
                <p className="text-[9px] text-slate-400 mt-1 ml-2">{formatDate(comment.createdAt)}</p>
              </div>
            </div>
          ))
        )}
        {!loading && comments.length === 0 && (
          <p className="text-[10px] text-slate-400 text-center py-2 italic font-medium">
            No comments yet. Be the first to share your thoughts!
          </p>
        )}
      </div>
    </div>
  );
};
