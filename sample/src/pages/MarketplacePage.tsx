import React, { useMemo, useState } from 'react';
import { ListingCard } from '../components/marketplace/ListingCard';
import { Search, Grid2X2, List as ListIcon, Plus, Loader2, PackageOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GemListing } from '../types';
import { cn, getListingTitle } from '../lib/utils';
import { usePaginated } from '../hooks/usePaginatedCollection';
import { listListings } from '../lib/api';

const CATEGORIES = ['All Gems', 'Sapphires', 'Rubies', 'Spinels', 'Emeralds', 'Padparadscha'];
const CATEGORY_TERMS: Record<string, string> = {
  Sapphires: 'sapphire',
  Rubies: 'ruby',
  Spinels: 'spinel',
  Emeralds: 'emerald',
  Padparadscha: 'padparadscha',
};
type SortOption = 'newest' | 'price-asc' | 'price-desc';

export const MarketplacePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const { items: listings, loading, loadingMore, hasMore, error, loadMore } =
    usePaginated<GemListing>(listListings, 12);

  const visibleListings = useMemo(() => {
    let result = listings;

    if (activeCategory !== 'All Gems') {
      const term = CATEGORY_TERMS[activeCategory];
      result = result.filter((l) => getListingTitle(l).toLowerCase().includes(term));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((l) => getListingTitle(l).toLowerCase().includes(q));
    }

    if (sortBy === 'newest') return result;
    return [...result].sort((a, b) =>
      sortBy === 'price-asc' ? a.price - b.price : b.price - a.price
    );
  }, [listings, activeCategory, searchQuery, sortBy]);

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gem Marketplace</h1>
          <p className="text-gray-500 text-sm">Discover verified gems from Sri Lanka's top dealers.</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/add-listing"
            className="bg-primary text-white px-5 py-2.5 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm whitespace-nowrap"
          >
            <Plus size={18} />
            List Gem
          </Link>

          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search gems..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-4 border-y border-gray-100">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide w-full md:w-auto">
          {CATEGORIES.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveCategory(filter)}
              className={cn(
                'whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-tight transition-all',
                activeCategory === filter
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                  : 'bg-white text-gray-400 hover:text-slate-900 hover:bg-gray-50 border border-gray-100'
              )}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex-1 md:flex-none">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/10"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
          <div className="hidden md:flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100">
            <button className="p-2 bg-white shadow-sm rounded-lg text-primary">
              <Grid2X2 size={16} />
            </button>
            <button className="p-2 text-gray-400 hover:text-slate-900 hover:bg-white/50 rounded-lg transition-colors">
              <ListIcon size={16} />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="text-center py-10 bg-red-50 rounded-2xl border border-red-100">
          <p className="text-sm font-bold text-red-600">{error}</p>
        </div>
      )}

      {/* Loading skeletons keep layout stable instead of a blank flash */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-3xl border border-slate-100 overflow-hidden animate-pulse">
              <div className="h-16 bg-slate-50" />
              <div className="aspect-square bg-slate-100" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-slate-100 rounded w-2/3" />
                <div className="h-4 bg-slate-100 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {visibleListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}

      {!loading && visibleListings.length === 0 && !error && (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
          <PackageOpen className="mx-auto text-slate-300 mb-4" size={48} />
          <p className="text-sm font-bold text-slate-600 mb-1">
            {listings.length === 0 ? 'No gems listed yet' : 'No gems match your search'}
          </p>
          <p className="text-xs text-slate-400 mb-6">
            {listings.length === 0
              ? 'Be the first to list a gem on the marketplace.'
              : 'Try a different search or category.'}
          </p>
          {listings.length === 0 && (
            <Link
              to="/add-listing"
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-primary/20"
            >
              <Plus size={16} /> List a Gem
            </Link>
          )}
        </div>
      )}

      {!loading && hasMore && visibleListings.length > 0 && (
        <div className="flex justify-center pt-8">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-6 py-2.5 bg-white border border-gray-200 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-60"
          >
            {loadingMore && <Loader2 size={14} className="animate-spin" />}
            {loadingMore ? 'Loading...' : 'Load More Listings'}
          </button>
        </div>
      )}
    </div>
  );
};
