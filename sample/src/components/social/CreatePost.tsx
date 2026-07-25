import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { uploadImageFile, createPost } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Image, Send, X, Loader2 } from 'lucide-react';
import { SocialPost } from '../../types';

interface SelectedImage {
  file: File;
  previewUrl: string;
}

const MAX_IMAGES = 4;
const MAX_LENGTH = 2000;

interface CreatePostProps {
  /** Lets the feed show the new post immediately, with no refetch. */
  onPosted?: (post: SocialPost) => void;
}

export const CreatePost = ({ onPosted }: CreatePostProps) => {
  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'posting'>('idle');
  const [error, setError] = useState('');
  const [images, setImages] = useState<SelectedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { userProfile } = useAuth();

  // Release object URLs when the composer unmounts.
  useEffect(() => {
    return () => { images.forEach((img) => URL.revokeObjectURL(img.previewUrl)); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilesSelected = (fileList: FileList | null) => {
    if (!fileList) return;
    setError('');
    const room = MAX_IMAGES - images.length;
    const accepted = Array.from(fileList).filter((f) => f.type.startsWith('image/'));

    if (accepted.length > room) setError(`You can attach up to ${MAX_IMAGES} photos.`);

    setImages((prev) => [
      ...prev,
      ...accepted.slice(0, room).map((file) => ({ file, previewUrl: URL.createObjectURL(file) })),
    ]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const reset = () => {
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setContent('');
    setError('');
    setIsExpanded(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
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
      if (images.length > 0) {
        setStatus('uploading');
        media = await Promise.all(
          images.map((img) => uploadImageFile(`posts/${profile.uid}`, img.file))
        );
      }

      setStatus('posting');
      const saved = await createPost({
        authorId: profile.uid,
        authorName: profile.displayName,
        authorAvatar: profile.photoURL || '',
        authorType: profile.role === 'VENDOR' ? 'VENDOR' : 'USER',
        content: trimmed,
        media,
        likesCount: 0,
        likes: [],
        commentsCount: 0,
        sharesCount: 0,
        averageRating: 0,
        type: 'DISCUSSION',
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
            placeholder="What's happening in the gem world?"
            className="w-full min-h-[120px] p-2 text-slate-800 text-sm md:text-base placeholder:text-slate-300 outline-none resize-none"
          />

          {images.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((img, i) => (
                <div key={img.previewUrl} className="relative aspect-square rounded-xl overflow-hidden border border-slate-100">
                  <img src={img.previewUrl} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
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
                onClick={() => fileInputRef.current?.click()}
                disabled={images.length >= MAX_IMAGES || busy}
                className="p-2 hover:bg-primary/5 rounded-full text-primary transition-colors flex items-center gap-2 text-xs font-bold disabled:opacity-40"
              >
                <Image size={20} />
                <span className="hidden md:inline">Photo</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  handleFilesSelected(e.target.files);
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
              disabled={busy || !content.trim()}
              className="bg-primary text-white px-6 py-2 rounded-full font-black text-xs md:text-sm shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {busy && <Loader2 size={14} className="animate-spin" />}
              {status === 'uploading' ? 'Uploading...' : status === 'posting' ? 'Posting...' : 'Post'}
              {!busy && <Send size={16} />}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
