import React, { useEffect, useMemo, useState } from 'react';
import { PostCard } from '../components/social/PostCard';
import { ListingCard } from '../components/marketplace/ListingCard';
import { VendorCard } from '../components/vendors/VendorCard';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, Award, Calendar, ExternalLink, Loader2, MessageSquarePlus } from 'lucide-react';
import { listListings, listVendors, listPosts } from '../lib/api';
import { primeVendors } from '../lib/vendorCache';
import { SocialPost, GemListing, VendorProfile, FeedItem } from '../types';
import { CreatePost } from '../components/social/CreatePost';
import { usePaginated } from '../hooks/usePaginatedCollection';

/** Interleaves marketplace listings and vendor spotlights into the post stream. */
function buildFeedItems(
  posts: SocialPost[],
  listings: GemListing[],
  vendors: VendorProfile[]
): FeedItem[] {
  const items: FeedItem[] = [];
  let listingIdx = 0;
  let vendorIdx = 0;

  posts.forEach((post, i) => {
    items.push({ type: 'post', data: post });
    if ((i + 1) % 4 === 0 && listingIdx < listings.length) {
      items.push({ type: 'listing', data: listings[listingIdx++] });
    }
    if ((i + 1) % 7 === 0 && vendorIdx < vendors.length) {
      items.push({ type: 'vendor', data: vendors[vendorIdx++] });
    }
  });

  // If there are few or no posts yet, still surface marketplace content so the
  // feed never looks empty.
  while (listingIdx < listings.length) items.push({ type: 'listing', data: listings[listingIdx++] });
  while (vendorIdx < vendors.length) items.push({ type: 'vendor', data: vendors[vendorIdx++] });

  return items;
}

export const FeedPage = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<GemListing[]>([]);
  const [vendors, setVendors] = useState<VendorProfile[]>([]);

  const {
    items: posts,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    prepend,
  } = usePaginated<SocialPost>(listPosts, 10);

  // Listings and vendors are supporting content — fetch a small slice once.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [listingRows, vendorRows] = await Promise.all([listListings(6, 0), listVendors(4, 0)]);
        if (!active) return;
        setListings(listingRows);
        setVendors(vendorRows);
        // Seed the shared cache so listing cards don't re-fetch these vendors.
        primeVendors(vendorRows);
      } catch {
        /* supporting content is optional — the feed still works without it */
      }
    })();
    return () => { active = false; };
  }, []);

  const items = useMemo(() => buildFeedItems(posts, listings, vendors), [posts, listings, vendors]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Sidebar - Left (Desktop) */}
      <div className="hidden lg:block lg:col-span-3 space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-primary" />
            Trending Categories
          </h2>
          <div className="space-y-2">
            {['Blue Sapphire', 'Padparadscha', 'Alexandrite', 'Star Ruby', 'Ceylon Yellow'].map((cat) => (
              <Link
                key={cat}
                to={`/marketplace?q=${encodeURIComponent(cat)}`}
                className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-between"
              >
                <span>{cat}</span>
                <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded-full">New</span>
              </Link>
            ))}
          </div>
        </div>

        {vendors.length > 0 && (
          <div className="bg-primary/5 rounded-xl border border-primary/10 p-4 shadow-sm">
            <h2 className="font-bold text-primary mb-2 flex items-center gap-2">
              <Award size={20} />
              Verified Dealers
            </h2>
            <p className="text-xs text-slate-500 mb-4">Top rated and verified businesses this week.</p>
            <div className="space-y-3">
              {vendors.map((vendor) => (
                <button
                  key={vendor.id}
                  onClick={() => navigate(`/dealers/${vendor.id}`)}
                  className="w-full flex items-center gap-3 text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-white border border-gray-100 overflow-hidden shrink-0">
                    <img src={vendor.logo} alt={vendor.companyName} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">{vendor.companyName}</p>
                    <p className="text-[10px] text-gray-500">Rating: {vendor.rating?.toFixed(1)} ★</p>
                  </div>
                </button>
              ))}
            </div>
            <Link
              to="/vendors"
              className="block w-full mt-4 py-2 text-xs font-bold text-primary hover:bg-white rounded-lg transition-colors border border-transparent hover:border-primary/20 text-center"
            >
              Browse All Dealers
            </Link>
          </div>
        )}
      </div>

      {/* Main Feed */}
      <div className="lg:col-span-6 space-y-6">
        <CreatePost onPosted={prepend} />

        {error && (
          <div className="text-center py-8 bg-red-50 rounded-2xl border border-red-100">
            <p className="text-sm font-bold text-red-600">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100" />
                  <div className="space-y-2">
                    <div className="h-3 w-32 bg-slate-100 rounded" />
                    <div className="h-2 w-20 bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="h-3 bg-slate-100 rounded w-full" />
                <div className="h-3 bg-slate-100 rounded w-4/5" />
              </div>
            ))}
          </div>
        ) : (
          items.map((item, idx) => {
            if (item.type === 'post') return <PostCard key={item.data.id} post={item.data} />;

            if (item.type === 'listing') {
              return (
                <div key={`l-${item.data.id}-${idx}`} className="mb-4">
                  <div className="flex items-center justify-between px-2 mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      New Listing in Marketplace
                    </span>
                    <Link to="/marketplace" className="text-xs text-primary font-bold">See More</Link>
                  </div>
                  <ListingCard listing={item.data} variant="feed" />
                </div>
              );
            }

            return (
              <div key={`v-${item.data.id}-${idx}`} className="mb-4">
                <div className="flex items-center justify-between px-2 mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Suggested Dealer</span>
                  <Link to="/vendors" className="text-xs text-primary font-bold">See More</Link>
                </div>
                <VendorCard
                  vendor={item.data}
                  variant="feed"
                  onClick={() => navigate(`/dealers/${item.data.id}`)}
                />
              </div>
            );
          })
        )}

        {!loading && items.length === 0 && !error && (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
            <MessageSquarePlus className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-sm font-bold text-slate-600 mb-1">The feed is quiet right now</p>
            <p className="text-xs text-slate-400">Share the first post — no sign-up needed.</p>
          </div>
        )}

        {!loading && hasMore && posts.length > 0 && (
          <div className="flex justify-center pt-2">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="px-6 py-2.5 bg-white border border-gray-200 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-60"
            >
              {loadingMore && <Loader2 size={14} className="animate-spin" />}
              {loadingMore ? 'Loading...' : 'Load More Posts'}
            </button>
          </div>
        )}
      </div>

      {/* Sidebar - Right (Desktop) */}
      <div className="hidden lg:block lg:col-span-3 space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-warning" />
            Upcoming Events
          </h2>
          <div className="space-y-4">
            {[
              { title: 'Colombo Gem Expo 2026', date: 'Jul 15', type: 'Exhibitions' },
              { title: 'Beruwala Rough Trade Meet', date: 'Jun 28', type: 'Trade Shows' },
            ].map((event) => (
              <Link to="/events" key={event.title} className="group cursor-pointer block">
                <div className="flex gap-3">
                  <div className="bg-slate-50 w-12 h-12 rounded-lg flex flex-col items-center justify-center border border-slate-100 group-hover:bg-primary/5 group-hover:border-primary/10 transition-colors">
                    <span className="text-[10px] font-bold text-primary">{event.date.split(' ')[0]}</span>
                    <span className="text-sm font-bold text-slate-900">{event.date.split(' ')[1]}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-primary transition-colors">
                      {event.title}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{event.type}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <Link
            to="/events"
            className="block text-center w-full mt-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-900 border border-gray-100 rounded-lg hover:bg-gray-50 transition-all"
          >
            Browse All Events
          </Link>
        </div>

        <Link to="/news" className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm overflow-hidden relative group block">
          <img
            src="/src/assets/images/padparadscha_sapphire_1781701049583.jpg"
            className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-700"
            alt="Promotion"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          <div className="relative z-10 pt-20">
            <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded uppercase mb-2 inline-block">
              Industry News
            </span>
            <h3 className="text-white font-bold leading-tight mb-2">Export Regulation Changes for 2026 Announced</h3>
            <span className="flex items-center gap-1 text-white text-xs font-bold hover:underline">
              Read Article <ExternalLink size={12} />
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
};
