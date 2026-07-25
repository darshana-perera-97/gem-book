import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { uploadMediaFile, createPost } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Image, Play, Send, X, Loader2 } from 'lucide-react';
import { SocialPost } from '../../types';

interface SelectedMedia {
  file: File;
  previewUrl: string;
  kind: 'image' | 'video';
}

const MAX_IMAGES = 4;
const MAX_LENGTH = 2000;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

interface CreatePostProps {
  /** Lets the feed show the new post immediately, with no refetch. */
  onPosted?: (post: SocialPost) => void;
}

export const CreatePost = ({ onPosted }: CreatePostProps) => {
  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'posting'>('idle');
  const [error, setError] = useState('');
  const [mediaItems, setMediaItems] = useState<SelectedMedia[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { userProfile } = useAuth();

  const isVendor = userProfile?.role === 'VENDOR';
  const hasVideo = mediaItems.some((m) => m.kind === 'video');

  // Release object URLs when the composer unmounts.
  useEffect(() => {
    return () => { mediaItems.forEach((m) => URL.revokeObjectURL(m.previewUrl)); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleImagesSelected = (fileList: FileList | null) => {
    if (!fileList) return;
    setError('');
    if (hasVideo) {
      setError('Remove the reel video before adding photos.');
      return;
    }
    const room = MAX_IMAGES - mediaItems.length;
    const accepted = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (accepted.length > room) setError(`You can attach up to ${MAX_IMAGES} photos.`);
    setMediaItems((prev) => [
      ...prev,
      ...accepted.slice(0, room).map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
        kind: 'image' as const,
      })),
    ]);
  };

  const handleVideoSelected = (fileList: FileList | null) => {
    if (!fileList?.[0]) return;
    setError('');
    const file = fileList[0];
    if (!file.type.startsWith('video/')) {
      setError('Please choose a video file (mp4, webm, or mov).');
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setError('Reels must be under 50 MB.');
      return;
    }
    mediaItems.forEach((m) => URL.revokeObjectURL(m.previewUrl));
    setMediaItems([{ file, previewUrl: URL.createObjectURL(file), kind: 'video' }]);
  };

  const removeMedia = (index: number) => {
    setMediaItems((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const reset = () => {
    mediaItems.forEach((m) => URL.revokeObjectURL(m.previewUrl));
    setMediaItems([]);
    setContent('');
    setError('');
    setIsExpanded(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    // Reels (video) can ship with just a caption; regular posts need text.
    if (!trimmed && !hasVideo) return;
    if (trimmed.length > MAX_LENGTH) {
      setError(`Posts are limited to ${MAX_LENGTH} characters.`);
      return;
    }

    setError('');
    try {
      const profile = userProfile;
      if (!profile) {
        setError('Please set up your profile to post.');
        return;
      }

      let media: string[] = [];
      if (mediaItems.length > 0) {
        setStatus('uploading');
        media = await Promise.all(
          mediaItems.map((item) => uploadMediaFile(`posts/${profile.uid}`, item.file))
        );
      }

      setStatus('posting');
      const saved = await createPost({
        authorId: profile.uid,
        authorName: profile.displayName,
        authorAvatar: profile.photoURL || '',
        authorType: profile.role === 'VENDOR' ? 'VENDOR' : 'USER',
        content: trimmed || 'New reel',
        media,
        likesCount: 0,
        likes: [],
        commentsCount: 0,
        sharesCount: 0,
        averageRating: 0,
        type: hasVideo ? 'STORY' : 'DISCUSSION',
      });

      onPosted?.(saved as SocialPost);
      reset();
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Could not publish your post. Please try again.');
    } finally {
      setStatus('idle');
    }
  };

  const busy = status !== 'idle';
  const avatar = userProfile?.photoURL;
  const canSubmit = busy
    ? false
    : hasVideo
      ? true
      : !!content.trim();

  // No identity yet — invite the visitor to set up a quick profile.
  if (!userProfile) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mb-6 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900">Join the conversation</p>
          <p className="text-xs text-slate-500">Set up a quick profile to share with the community.</p>
        </div>
        <Link
          to="/login?next=/"
          className="shrink-0 bg-primary text-white px-5 py-2.5 rounded-full font-bold text-xs shadow-lg shadow-primary/20"
        >
          Get Started
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm mb-6 overflow-hidden transition-all duration-300">
      {!isExpanded ? (
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden shrink-0">
            {avatar && <img src={avatar} alt="" className="w-full h-full object-cover" />}
          </div>
          <button
            onClick={() => setIsExpanded(true)}
            className="flex-1 text-left px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 text-xs md:text-sm transition-colors flex items-center"
          >
            Share your latest find or gem story...
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden shrink-0">
                {avatar && <img src={avatar} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="leading-tight">
                <span className="text-xs font-bold text-slate-700 block">{userProfile?.displayName}</span>
                {hasVideo && (
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Reel</span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={reset}
              className="p-1 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <textarea
            autoFocus
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={MAX_LENGTH}
            placeholder={hasVideo ? 'Add a caption for your reel…' : "What's happening in the gem world?"}
            className="w-full min-h-[120px] p-2 text-slate-800 text-sm md:text-base placeholder:text-slate-300 outline-none resize-none"
          />

          {mediaItems.length > 0 && (
            <div className={hasVideo ? 'grid grid-cols-1 max-w-[200px]' : 'grid grid-cols-4 gap-2'}>
              {mediaItems.map((item, i) => (
                <div
                  key={item.previewUrl}
                  className={`relative rounded-xl overflow-hidden border border-slate-100 ${
                    item.kind === 'video' ? 'aspect-[9/16] bg-slate-900' : 'aspect-square'
                  }`}
                >
                  {item.kind === 'video' ? (
                    <video src={item.previewUrl} className="w-full h-full object-cover" muted playsInline />
                  ) : (
                    <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => removeMedia(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {error && (
            <p className="text-xs font-bold text-red-600 bg-red-50 px-3 py-2 rounded-xl border border-red-100">{error}</p>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-slate-50">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={hasVideo || mediaItems.length >= MAX_IMAGES || busy}
                className="p-2 hover:bg-primary/5 rounded-full text-primary transition-colors flex items-center gap-2 text-xs font-bold disabled:opacity-40"
              >
                <Image size={20} />
                <span className="hidden md:inline">Photo</span>
              </button>
              {isVendor && (
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={busy}
                  className="p-2 hover:bg-primary/5 rounded-full text-primary transition-colors flex items-center gap-2 text-xs font-bold disabled:opacity-40"
                >
                  <Play size={20} />
                  <span className="hidden md:inline">Reel</span>
                </button>
              )}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  handleImagesSelected(e.target.files);
                  e.target.value = '';
                }}
              />
              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/*"
                className="hidden"
                onChange={(e) => {
                  handleVideoSelected(e.target.files);
                  e.target.value = '';
                }}
              />
              {content.length > MAX_LENGTH - 200 && (
                <span className="text-[10px] font-bold text-slate-400">
                  {MAX_LENGTH - content.length} left
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={!canSubmit}
              className="bg-primary text-white px-6 py-2 rounded-full font-black text-xs md:text-sm shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {busy && <Loader2 size={14} className="animate-spin" />}
              {status === 'uploading'
                ? 'Uploading...'
                : status === 'posting'
                  ? 'Posting...'
                  : hasVideo
                    ? 'Publish Reel'
                    : 'Post'}
              {!busy && <Send size={16} />}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
