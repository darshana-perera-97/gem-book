import React from 'react';
import { BadgeCheck, Heart, MapPin, Star, MessageCircle, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GemListing } from '../../types';
import { formatCurrency, cn, getListingTitle } from '../../lib/utils';
import { useVendor } from '../../hooks/useVendor';

interface ListingCardProps {
  listing: GemListing;
  variant?: 'grid' | 'feed';
}

const ListingCardComponent = ({ listing, variant = 'grid' }: ListingCardProps) => {
  const isSold = listing.status === 'SOLD';
  const title = getListingTitle(listing);
  const vendor = useVendor(listing.vendorId);

  return (
    <div className={cn(
      "bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden group hover:shadow-xl hover:border-slate-300 transition-all duration-500",
      variant === 'feed' ? "mb-6" : ""
    )}>
      {/* Vendor Header */}
      <div className="p-4 flex items-center justify-between bg-slate-50/50">
        <Link to={`/dealers/${listing.vendorId}`} className="flex items-center gap-2 md:gap-3 group/vendor min-w-0">
          <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-white border border-slate-200 overflow-hidden shadow-sm shrink-0 transition-transform group-hover/vendor:scale-105">
             <img src={vendor?.logo || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"} className="w-full h-full object-cover" alt="Dealer" loading="lazy" decoding="async" />
          </div>
          <div className="flex flex-col min-w-0 leading-tight">
            <span className="text-[8px] md:text-[10px] font-black text-primary uppercase tracking-widest mb-0.5">{vendor?.verified ? 'Verified Dealer' : 'Dealer'}</span>
            <span className="text-xs md:text-sm font-bold text-slate-900 group-hover/vendor:text-primary transition-colors truncate">{vendor?.companyName || 'Ceylon Gemstone Hub'}</span>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin size={8} className="text-slate-400 md:hidden" />
              <MapPin size={10} className="text-slate-400 hidden md:block" />
              <span className="text-[8px] md:text-[10px] font-medium text-slate-500">{vendor?.location || 'Beruwala, SL'}</span>
            </div>
          </div>
        </Link>
      </div>

      <Link to={`/listings/${listing.id}`} className="block relative aspect-square overflow-hidden bg-slate-100">
        <img
          src={listing.images?.[0]}
          alt={title}
          loading="lazy"
          decoding="async"
          className={cn(
            "w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000",
            isSold && "grayscale-[0.5] opacity-80"
          )}
        />

        {/* Status Overlays */}
        <div className="absolute inset-0 pointer-events-none">
          {isSold && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
              <div className="rotate-[-12deg] px-8 py-2 border-4 border-white text-white font-black text-3xl uppercase tracking-[0.2em] shadow-2xl">
                Sold
              </div>
            </div>
          )}
        </div>

        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {!!listing.featured && !isSold && (
            <span className="bg-amber-400 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase shadow-lg tracking-widest">Premium</span>
          )}
          {!!vendor?.verified && (
            <span className="bg-primary text-white text-[9px] font-black px-3 py-1 rounded-full uppercase shadow-lg flex items-center gap-1.5 tracking-widest">
              <BadgeCheck size={10} /> Verified
            </span>
          )}
        </div>

        {!isSold && (
          <button className="absolute bottom-4 right-4 p-3 bg-white/90 backdrop-blur-md rounded-2xl text-slate-500 hover:text-red-500 transition-all shadow-xl active:scale-90 group/save">
            <Heart size={20} className="group-active/save:fill-red-500 transition-colors" />
          </button>
        )}
      </Link>

      <div className="p-4 md:p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="min-w-0 flex-1 pr-2">
             <Link to={`/listings/${listing.id}`}>
               <h3 className="font-bold text-slate-900 group-hover:text-primary transition-colors text-base md:text-lg leading-tight truncate">
                 {title}
               </h3>
             </Link>
          </div>
          <div className="text-right shrink-0">
            {!isSold ? (
              <>
                <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Asking Price</p>
                <p className="text-base md:text-xl font-black text-accent tracking-tighter">{formatCurrency(listing.price, listing.currency)}</p>
              </>
            ) : (
              <span className="text-[8px] md:text-[10px] font-black text-primary bg-primary/5 px-2 py-1 rounded-lg border border-primary/10 uppercase tracking-tighter">Sold</span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
           <div className="flex items-center gap-1.5">
              <div className="flex text-amber-400">
                <Star size={12} fill="currentColor" />
                <Star size={12} fill="currentColor" />
                <Star size={12} fill="currentColor" />
                <Star size={12} fill="currentColor" />
                <Star size={12} fill="currentColor" />
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{vendor?.rating?.toFixed(1) || '4.9'} ({vendor?.reviewCount ?? 24})</span>
           </div>
           <div className="flex items-center gap-3">
              <button className="text-slate-400 hover:text-primary transition-colors">
                <MessageCircle size={18} />
              </button>
              <button className="text-slate-400 hover:text-primary transition-colors">
                <Share2 size={18} />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

// Feed and marketplace render long lists; memoising stops every card from
// re-rendering when unrelated parent state (search text, sort, new post) changes.
export const ListingCard = React.memo(ListingCardComponent);
