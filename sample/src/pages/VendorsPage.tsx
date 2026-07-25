import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Store, Loader2 } from 'lucide-react';
import { VendorProfile } from '../types';
import { VendorCard } from '../components/vendors/VendorCard';
import { usePaginated } from '../hooks/usePaginatedCollection';
import { listVendors } from '../lib/api';
import { primeVendors } from '../lib/vendorCache';

export const VendorsPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const { items: vendors, loading, loadingMore, hasMore, error, loadMore } =
    usePaginated<VendorProfile>(listVendors, 12);

  // Share fetched vendors with listing cards so they never re-query them.
  useEffect(() => {
    if (vendors.length) primeVendors(vendors);
  }, [vendors]);

  const filteredVendors = useMemo(() => {
    if (!searchQuery.trim()) return vendors;
    const q = searchQuery.toLowerCase();
    return vendors.filter(
      (v) => v.companyName?.toLowerCase().includes(q) || v.location?.toLowerCase().includes(q)
    );
  }, [vendors, searchQuery]);

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold font-sans tracking-tight text-slate-900 mb-2">Verified Dealers</h1>
        <p className="text-slate-500 max-w-xl">
          Direct access to Sri Lanka's leading gemstone dealers, miners, and lapidaries.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by company name or location..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
        />
      </div>

      {error && (
        <div className="text-center py-10 bg-red-50 rounded-2xl border border-red-100">
          <p className="text-sm font-bold text-red-600">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
              <div className="h-24 bg-slate-100" />
              <div className="px-6 pb-6 -mt-16 flex flex-col items-center gap-3">
                <div className="w-32 h-32 rounded-2xl bg-slate-200 border-4 border-white" />
                <div className="h-4 bg-slate-100 rounded w-2/3" />
                <div className="h-3 bg-slate-100 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredVendors.map((vendor) => (
            <VendorCard
              key={vendor.id}
              vendor={vendor}
              variant="feed"
              onClick={() => navigate(`/dealers/${vendor.id}`)}
            />
          ))}
        </div>
      )}

      {!loading && filteredVendors.length === 0 && !error && (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
          <Store className="mx-auto text-slate-300 mb-4" size={48} />
          <p className="text-sm font-bold text-slate-600 mb-1">
            {vendors.length === 0 ? 'No dealers registered yet' : 'No dealers match your search'}
          </p>
          <p className="text-xs text-slate-400">
            {vendors.length === 0
              ? 'Verified dealers will appear here once they join.'
              : 'Try a different company name or location.'}
          </p>
        </div>
      )}

      {!loading && hasMore && filteredVendors.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-6 py-2.5 bg-white border border-gray-200 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-60"
          >
            {loadingMore && <Loader2 size={14} className="animate-spin" />}
            {loadingMore ? 'Loading...' : 'Load More Dealers'}
          </button>
        </div>
      )}
    </div>
  );
};
