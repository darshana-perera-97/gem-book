import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { listPosts } from '../../lib/api';
import { isVideoUrl } from '../../lib/media';
import { SocialPost } from '../../types';
import { cn } from '../../lib/utils';

const REEL_LIMIT = 24;

function isVendorReel(post: SocialPost): boolean {
  return post.authorType === 'VENDOR' && !!post.media?.length;
}

interface VendorReelsStripProps {
  /** Newly published vendor reel to show at the front of the strip. */
  freshReel?: SocialPost | null;
}

export const VendorReelsStrip = ({ freshReel }: VendorReelsStripProps) => {
  const [reels, setReels] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const rows = await listPosts(REEL_LIMIT, 0);
        if (!active) return;
        setReels(rows.filter(isVendorReel));
      } catch {
        /* optional strip — feed still works without it */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!freshReel || !isVendorReel(freshReel)) return;
    setReels((prev) => [freshReel, ...prev.filter((r) => r.id !== freshReel.id)]);
  }, [freshReel]);

  if (!loading && reels.length === 0) return null;

  return (
    <>
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Play size={16} className="text-primary fill-primary/20" />
              Vendor Reels
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Short clips from verified dealers</p>
          </div>
          <Link to="/vendors" className="text-[11px] font-bold text-primary hover:underline">
            See dealers
          </Link>
        </div>

        <div className="flex gap-3 overflow-x-auto px-4 pb-4 pt-1 scrollbar-thin snap-x snap-mandatory">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="snap-start shrink-0 w-[110px] sm:w-[128px] aspect-[9/16] rounded-2xl bg-slate-100 animate-pulse"
                />
              ))
            : reels.map((reel, index) => (
                <ReelThumb
                  key={reel.id}
                  reel={reel}
                  onOpen={() => setActiveIndex(index)}
                />
              ))}
        </div>
      </section>

      {activeIndex !== null && reels[activeIndex] && (
        <ReelViewer
          reels={reels}
          index={activeIndex}
          onClose={() => setActiveIndex(null)}
          onChange={setActiveIndex}
        />
      )}
    </>
  );
};

function ReelThumb({ reel, onOpen }: { reel: SocialPost; onOpen: () => void }) {
  const src = reel.media![0];
  const video = isVideoUrl(src);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="snap-start shrink-0 w-[110px] sm:w-[128px] aspect-[9/16] rounded-2xl overflow-hidden bg-slate-900 relative group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {video ? (
        <video
          src={src}
          muted
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
        />
      ) : (
        <img
          src={src}
          alt=""
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
      <div className="absolute top-2 left-2 right-2 flex items-center gap-1.5">
        <div className="w-6 h-6 rounded-full overflow-hidden bg-white/20 ring-1 ring-white/40 shrink-0">
          {reel.authorAvatar && (
            <img src={reel.authorAvatar} alt="" className="w-full h-full object-cover" />
          )}
        </div>
        <span className="text-[9px] font-bold text-white truncate drop-shadow">{reel.authorName}</span>
      </div>
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <Play size={16} className="text-white fill-white ml-0.5" />
        </span>
      </div>
      <p className="absolute bottom-2 left-2 right-2 text-white text-[10px] font-medium line-clamp-2 drop-shadow">
        {reel.content}
      </p>
    </button>
  );
}

function ReelViewer({
  reels,
  index,
  onClose,
  onChange,
}: {
  reels: SocialPost[];
  index: number;
  onClose: () => void;
  onChange: (i: number) => void;
}) {
  const reel = reels[index];
  const src = reel.media![0];
  const video = isVideoUrl(src);
  const hasPrev = index > 0;
  const hasNext = index < reels.length - 1;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onChange(index - 1);
      if (e.key === 'ArrowRight' && hasNext) onChange(index + 1);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [index, hasPrev, hasNext, onClose, onChange]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Vendor reel"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
        aria-label="Close"
      >
        <X size={20} />
      </button>

      {hasPrev && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onChange(index - 1); }}
          className="absolute left-2 sm:left-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
          aria-label="Previous reel"
        >
          <ChevronLeft size={22} />
        </button>
      )}
      {hasNext && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onChange(index + 1); }}
          className="absolute right-2 sm:right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
          aria-label="Next reel"
        >
          <ChevronRight size={22} />
        </button>
      )}

      <div
        className="relative w-full max-w-[380px] aspect-[9/16] rounded-2xl overflow-hidden bg-slate-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {video ? (
          <video
            key={src}
            src={src}
            autoPlay
            controls
            playsInline
            className="absolute inset-0 w-full h-full object-contain bg-black"
          />
        ) : (
          <img src={src} alt="" className="absolute inset-0 w-full h-full object-contain bg-black" />
        )}

        <div className={cn(
          'absolute inset-x-0 bottom-0 p-4 pt-16',
          'bg-gradient-to-t from-black/80 via-black/40 to-transparent',
          video && 'pointer-events-none pb-14'
        )}>
          <div className="flex items-center gap-2 mb-2 pointer-events-auto">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-white/20 ring-1 ring-white/30">
              {reel.authorAvatar && (
                <img src={reel.authorAvatar} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{reel.authorName}</p>
              <p className="text-[10px] text-white/70">Vendor reel</p>
            </div>
          </div>
          {reel.content && (
            <p className="text-xs text-white/90 line-clamp-3 whitespace-pre-wrap">{reel.content}</p>
          )}
        </div>
      </div>
    </div>
  );
}
