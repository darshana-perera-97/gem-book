import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { SocialPost } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../../lib/utils';
import { likePost } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { CommentSection } from './CommentSection';

interface PostCardProps {
  post: SocialPost;
}

/** Firestore timestamps, ISO strings, and just-written docs all land here. */
function formatPostDate(createdAt: unknown): string {
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

const PostCardComponent = ({ post }: PostCardProps) => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);

  // Seed from the stored likes array so the state survives a refresh.
  const [isLiked, setIsLiked] = useState(() =>
    userProfile ? (post.likes ?? []).includes(userProfile.uid) : false
  );
  const [likeCount, setLikeCount] = useState(post.likesCount ?? 0);
  const [commentCount, setCommentCount] = useState(post.commentsCount ?? 0);

  const handleLike = async () => {
    const profile = userProfile;
    if (!profile) {
      navigate('/login?next=/');
      return;
    }

    const next = !isLiked;
    // Optimistic: the UI responds instantly, then reconciles if the write fails.
    setIsLiked(next);
    setLikeCount((c) => Math.max(0, c + (next ? 1 : -1)));

    try {
      const { likesCount } = await likePost(post.id, profile.uid, next);
      setLikeCount(likesCount);
    } catch (err) {
      console.error('Could not update like:', err);
      setIsLiked(!next);
      setLikeCount((c) => Math.max(0, c + (next ? -1 : 1)));
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/?post=${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.authorName} | Ceylon Gem Book`,
          text: post.content,
          url,
        });
        return;
      } catch {
        return; // dismissed
      }
    }
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-4 hover:border-slate-300 transition-all">
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-100 overflow-hidden ring-2 ring-white shadow-sm shrink-0">
              {post.authorAvatar && (
                <img
                  src={post.authorAvatar}
                  alt={post.authorName}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-slate-900 text-xs md:text-sm">{post.authorName}</span>
                {post.authorType === 'VENDOR' && (
                  <span className="bg-primary/5 text-primary text-[8px] md:text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                    Vendor
                  </span>
                )}
              </div>
              <p className="text-[9px] md:text-[10px] text-slate-400 font-medium lowercase">
                {formatPostDate(post.createdAt)} • Sri Lanka
              </p>
            </div>
          </div>
        </div>

        <p className="text-slate-800 text-[13px] md:text-[15px] leading-relaxed mb-4 whitespace-pre-wrap break-words">
          {post.content}
        </p>

        {post.media && post.media.length > 0 && (
          <div
            className={cn(
              'rounded-xl overflow-hidden border border-slate-100 mb-4 bg-slate-50 gap-1',
              post.media.length > 1 ? 'grid grid-cols-2' : ''
            )}
          >
            {post.media.slice(0, 4).map((src, i) => (
              <img
                key={src}
                src={src}
                alt=""
                loading="lazy"
                decoding="async"
                className={cn(
                  'w-full object-cover hover:scale-[1.02] transition-transform duration-700',
                  post.media!.length > 1 ? 'h-40 md:h-48' : 'max-h-[500px]'
                )}
              />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
          <div className="flex items-center gap-4 md:gap-8">
            <button
              onClick={handleLike}
              aria-pressed={isLiked}
              aria-label={isLiked ? 'Unlike post' : 'Like post'}
              className={cn(
                'flex flex-col items-center gap-0.5 transition-colors group',
                isLiked ? 'text-primary' : 'text-slate-500 hover:text-primary'
              )}
            >
              <div className="flex items-center gap-1.5 group-active:scale-125 transition-all">
                <Heart size={20} className={cn(isLiked && 'fill-current')} />
                <span className="text-xs font-bold">{likeCount}</span>
              </div>
            </button>
            <button
              onClick={() => setShowComments((v) => !v)}
              aria-expanded={showComments}
              className={cn(
                'flex flex-col items-center gap-0.5 transition-colors group',
                showComments ? 'text-primary' : 'text-slate-500 hover:text-primary'
              )}
            >
              <div className="flex items-center gap-1.5 group-active:scale-110 transition-all">
                <MessageCircle size={20} className={cn(showComments && 'fill-current')} />
                <span className="text-xs font-bold">{commentCount}</span>
              </div>
            </button>
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors bg-slate-50 px-3 py-1.5 rounded-full group"
          >
            <Share2 size={18} className="group-hover:rotate-12 transition-transform" />
            <span className="text-xs font-bold">Share</span>
          </button>
        </div>

        {/* Comments are only fetched once the thread is actually opened. */}
        {showComments && <CommentSection postId={post.id} onCountChange={setCommentCount} />}
      </div>
    </div>
  );
};

export const PostCard = React.memo(PostCardComponent);
