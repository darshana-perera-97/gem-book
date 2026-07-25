import React, { useMemo, useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MessageCircle, Share2,
  ChevronRight,
  Heart, Star, ShieldCheck, Globe, Loader2
} from 'lucide-react';
import { formatCurrency, cn, getListingTitle } from '../lib/utils';
import { getListing, getUser } from '../lib/api';
import { GemListing, VendorProfile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { startConversation } from '../lib/chat';
import { useVendor } from '../hooks/useVendor';

const PLACEHOLDER_VENDOR_LOGO = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80';

export const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [realListing, setRealListing] = useState<GemListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [inquiryLoading, setInquiryLoading] = useState(false);

  const realVendor = useVendor(realListing?.vendorId);

  useEffect(() => {
    const fetchListing = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const row = await getListing(id);
        if (row && row.id) {
          setRealListing(row);
        } else {
          setNotFound(true);
        }
      } catch (error) {
        console.error('Error fetching listing:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id]);

  const listing = realListing;

  const handleSendInquiry = async () => {
    if (!listing?.vendorId) return;

    // Messaging a seller needs a contactable identity.
    if (!userProfile) {
      navigate('/login?next=' + encodeURIComponent(`/listings/${listing.id}`));
      return;
    }

    setInquiryLoading(true);
    try {
      const sellerUser = await getUser(listing.vendorId).catch(() => null);
      const vendorData = sellerUser && sellerUser.uid
        ? sellerUser
        : {
            uid: listing.vendorId,
            displayName: vendor.companyName,
            photoURL: vendor.logo || PLACEHOLDER_VENDOR_LOGO,
          };

      const convId = await startConversation(userProfile!, {
        uid: vendorData.uid,
        displayName: vendorData.displayName,
        photoURL: vendorData.photoURL,
      });

      navigate(`/messages?c=${convId}`);
    } catch (error) {
      console.error('Error starting conversation:', error);
    } finally {
      setInquiryLoading(false);
    }
  };
  const vendor: VendorProfile = useMemo(
    () =>
      realVendor || {
        id: listing?.vendorId || '',
        userId: listing?.vendorId || '',
        companyName: 'Verified Dealer',
        logo: PLACEHOLDER_VENDOR_LOGO,
        location: 'Sri Lanka',
        rating: 0,
        reviewCount: 0,
        followersCount: 0,
        verified: false,
        verificationLevel: 'NONE',
        contactEmail: '',
        createdAt: new Date().toISOString(),
      },
    [realVendor, listing?.vendorId]
  );

  const handleShare = async () => {
    if (!listing) return;
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${getListingTitle(listing)} | Ceylon Gem Book`,
          text: 'Check out this gem on Ceylon Gem Book!',
          url: shareUrl,
        });
        return;
      } catch {
        /* user dismissed the share sheet */
        return;
      }
    }
    navigator.clipboard.writeText(shareUrl);
    alert('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse">
        <div className="lg:col-span-7 aspect-[4/3] rounded-3xl bg-slate-100" />
        <div className="lg:col-span-5 space-y-4">
          <div className="h-10 bg-slate-100 rounded w-3/4" />
          <div className="h-12 bg-slate-100 rounded w-1/2" />
          <div className="h-32 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (notFound || !listing) {
    return (
      <div className="py-24 text-center">
        <h1 className="text-xl font-black text-slate-900 mb-2">Listing not found</h1>
        <p className="text-sm text-slate-500 mb-6">This gem may have been sold or removed.</p>
        <Link to="/marketplace" className="inline-block bg-primary text-white px-6 py-3 rounded-2xl font-bold text-sm">
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const title = getListingTitle(listing);

  return (
    <div className="space-y-6 md:space-y-8 pb-12">
      {/* Mobile Vendor Header - Only visible on small screens */}
      <div className="md:hidden">
        <Link to={`/dealers/${listing.vendorId}`} className="p-4 bg-slate-900 rounded-3xl flex items-center gap-4 group relative overflow-hidden shadow-xl">
           <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-transparent opacity-50"></div>
           <div className="w-12 h-12 rounded-xl bg-white border border-white/20 overflow-hidden relative z-10 shrink-0">
              <img src={vendor.logo || PLACEHOLDER_VENDOR_LOGO} className="w-full h-full object-cover" alt="Vendor" />
           </div>
           <div className="flex-1 relative z-10 min-w-0 text-left">
              <p className="text-[8px] text-accent font-black uppercase tracking-widest mb-0.5">{vendor.verified ? 'Verified Dealer' : 'Dealer'}</p>
              <h4 className="font-black text-white text-sm truncate">{vendor.companyName}</h4>
              <div className="flex items-center gap-1.5">
                 <div className="flex text-amber-400">
                    <Star size={8} fill="currentColor" />
                    <Star size={8} fill="currentColor" />
                    <Star size={8} fill="currentColor" />
                 </div>
                 <span className="text-[8px] text-white/60 font-bold uppercase">{vendor.rating?.toFixed(1)} {!!vendor.verified && '• Verified'}</span>
              </div>
           </div>
           <ChevronRight size={18} className="text-white/40 relative z-10" />
        </Link>
      </div>

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
        <Link to="/marketplace" className="hover:text-primary">Marketplace</Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 truncate max-w-[200px]">{title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Media Section */}
        <div className="lg:col-span-7 space-y-6">
          <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-white border border-gray-100 shadow-xl relative group">
            <img src={listing.images?.[0] || 'https://images.unsplash.com/photo-1551028150-64b9f398f678?q=80&w=800&auto=format&fit=crop'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt={title} />
            <div className="absolute top-6 right-6">
               <button
                 onClick={() => setIsSaved(!isSaved)}
                 className={cn(
                   "p-3 rounded-full backdrop-blur-md shadow-xl transition-all active:scale-90",
                   isSaved ? "bg-red-500 text-white" : "bg-white/80 text-gray-900 hover:bg-white"
                 )}
               >
                 <Heart size={24} fill={isSaved ? "currentColor" : "none"} />
               </button>
            </div>
          </div>
          {listing.images && listing.images.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {listing.images.map((img, idx) => (
                <div key={idx} className="aspect-square rounded-2xl overflow-hidden border border-gray-100 bg-white cursor-pointer hover:ring-2 hover:ring-primary transition-all shadow-sm">
                  <img src={img} className="w-full h-full object-cover" alt="Gallery" />
                </div>
              ))}
            </div>
          )}

          <p className="text-gray-600 leading-relaxed bg-white p-6 rounded-3xl border border-gray-100 shadow-sm whitespace-pre-line">
            {listing.description}
          </p>
        </div>

        {/* Details Section */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            {!!listing.featured && (
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-[#FBBC05] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter">Market Leader</span>
              </div>
            )}

            <h1 className="text-4xl font-extrabold text-gray-900 mb-8 leading-tight">{title}</h1>

            <div className="flex items-baseline justify-between mb-8">
              <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Asking Price</p>
                 <span className="text-4xl md:text-5xl font-black text-accent tracking-tighter">{formatCurrency(listing.price, listing.currency)}</span>
              </div>
            </div>

            {/* Vendor Profile Section - More Prominent (Desktop Only) */}
            <Link to={`/dealers/${listing.vendorId}`} className="hidden md:flex mb-8 p-6 bg-slate-900 rounded-[2rem] items-center gap-6 group cursor-pointer hover:shadow-2xl hover:scale-[1.02] transition-all relative overflow-hidden text-center md:text-left">
               <div className="absolute inset-0 bg-gradient-to-br from-primary/50 to-transparent opacity-50"></div>
               <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white border-2 border-white/20 overflow-hidden shadow-2xl relative z-10 shrink-0">
                  <img src={vendor.logo || PLACEHOLDER_VENDOR_LOGO} className="w-full h-full object-cover" alt="Vendor" />
               </div>
               <div className="flex-1 relative z-10 min-w-0">
                  <p className="text-[10px] text-accent font-black uppercase tracking-[0.2em] mb-1">Exclusive Partner</p>
                  <h4 className="font-black text-white text-lg md:text-xl leading-tight mb-1 truncate">{vendor.companyName}</h4>
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                     <div className="flex text-amber-400">
                        <Star size={10} fill="currentColor" />
                        <Star size={10} fill="currentColor" />
                        <Star size={10} fill="currentColor" />
                        <Star size={10} fill="currentColor" />
                        <Star size={10} fill="currentColor" />
                     </div>
                     <span className="text-[10px] text-white/60 font-bold uppercase tracking-widest whitespace-nowrap">{vendor.rating?.toFixed(1)} • {vendor.reviewCount}+ Reviews</span>
                  </div>
                  <div className="flex items-center justify-center md:justify-start gap-2">
                     {!!vendor.verified && <span className="text-[10px] font-black text-white bg-accent px-2 py-0.5 rounded uppercase tracking-tighter shrink-0">Verified</span>}
                     <span className="text-[10px] font-black text-white/40 uppercase tracking-tighter truncate">{vendor.location}</span>
                  </div>
               </div>
               <div className="hidden md:block relative z-10 text-white opacity-40 group-hover:opacity-100 transition-opacity pr-2">
                  <ChevronRight size={24} />
               </div>
            </Link>

            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={handleSendInquiry}
                disabled={inquiryLoading}
                className="w-full py-5 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all flex items-center justify-center gap-3 text-lg disabled:opacity-70"
              >
                {inquiryLoading ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <MessageCircle size={24} />
                )}
                {inquiryLoading ? 'Initiating Chat...' : 'Send Inquiry'}
              </button>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setIsSaved(!isSaved)}
                  className={cn(
                    "py-4 rounded-2xl font-bold border transition-all flex items-center justify-center gap-2",
                    isSaved ? "bg-red-50 border-red-100 text-red-600" : "bg-white border-gray-100 text-gray-900 hover:bg-gray-50"
                  )}
                >
                  <Heart size={20} fill={isSaved ? "currentColor" : "none"} />
                  {isSaved ? "Saved" : "Save Gem"}
                </button>
                <button
                  onClick={handleShare}
                  className="py-4 bg-white text-gray-900 rounded-2xl font-bold border border-gray-100 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                >
                  <Share2 size={20} />
                  Share
                </button>
              </div>
            </div>
          </div>

           {/* Global Trust Standard - Moved to Right Column */}
          <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
             <Globe className="absolute -right-10 -bottom-10 opacity-10 rotate-12" size={150} />
             <div className="relative z-10">
                <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                   <ShieldCheck className="text-primary" size={20} />
                   Global Trust Standard
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                   Every transaction via ABEC Premier is protected by our global escrow system.
                   Funds are released only after your verification.
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
