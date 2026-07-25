import React from 'react';
import { BadgeCheck, MapPin, Star, Award, Users } from 'lucide-react';
import { VendorProfile } from '../../types';
import { cn } from '../../lib/utils';

interface VendorCardProps {
  vendor: VendorProfile;
  variant?: 'grid' | 'feed';
  onClick?: () => void;
}

const VendorCardComponent = ({ vendor, variant = 'grid', onClick }: VendorCardProps) => {
  // The feed variant centers everything and doubles the profile image so a
  // dealer's brand reads clearly — used both in the feed and the dealers grid.
  if (variant === 'feed') {
    return (
      <button
        onClick={onClick}
        className="text-center w-full h-full bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-xl hover:border-primary/20 transition-all duration-300 flex flex-col"
      >
        {/* Cover Image */}
        <div className="h-24 bg-slate-100 relative">
          <img
            src={vendor.coverImage}
            className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity"
            alt={vendor.companyName}
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent"></div>
        </div>

        <div className="px-6 pb-6 relative -mt-16 flex-1 flex flex-col items-center">
          {/* 2x profile image, centered */}
          <div className="w-32 h-32 rounded-2xl border-4 border-white bg-white shadow-lg overflow-hidden shrink-0">
            <img src={vendor.logo} className="w-full h-full object-cover" alt="Logo" loading="lazy" decoding="async" />
          </div>

          {!!vendor.verified && (
            <div className="bg-success/10 text-success mt-3 py-1 px-3 rounded-full flex items-center gap-1">
              <BadgeCheck size={14} />
              <span className="text-[10px] font-bold">VERIFIED</span>
            </div>
          )}

          <h3 className="text-lg font-bold text-slate-900 flex items-center justify-center gap-2 mt-3">
            {vendor.companyName}
            {vendor.verificationLevel === 'GOLD' && <Award size={16} className="text-warning shrink-0" />}
          </h3>

          <p className="text-xs text-slate-500 flex items-center justify-center gap-1 mb-3">
            <MapPin size={12} className="text-slate-400" /> {vendor.location}, Sri Lanka
          </p>

          {vendor.description && (
            <p className="text-sm text-slate-600 line-clamp-2 mb-4 italic max-w-sm">"{vendor.description}"</p>
          )}

          <div className="mt-auto pt-4 border-t border-slate-50 w-full flex items-center justify-center gap-6">
            <div className="flex items-center gap-1 text-primary font-bold text-sm">
              <Star size={12} fill="currentColor" />
              {vendor.rating?.toFixed(1)}
              <span className="text-[10px] text-slate-400 font-medium">({vendor.reviewCount})</span>
            </div>
            <div className="flex items-center gap-1 text-slate-500 text-xs font-bold">
              <Users size={12} />
              {((vendor.followersCount || 0) / 1000).toFixed(1)}k followers
            </div>
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="text-left w-full bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-xl hover:border-primary/20 transition-all duration-300 flex flex-col h-full"
    >
      {/* Cover Image */}
      <div className="h-24 bg-slate-100 relative">
        <img
          src={vendor.coverImage}
          className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity"
          alt={vendor.companyName}
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent"></div>
      </div>

      <div className="px-6 pb-6 relative -mt-8 flex-1 flex flex-col">
        <div className="flex justify-between items-end mb-4">
          <div className="w-16 h-16 rounded-xl border-4 border-white bg-white shadow-md overflow-hidden shrink-0">
            <img src={vendor.logo} className="w-full h-full object-cover" alt="Logo" />
          </div>
          {!!vendor.verified && (
            <div className="bg-success/10 text-success p-1 px-2 rounded-full flex items-center gap-1 mb-2">
              <BadgeCheck size={14} />
              <span className="text-[10px] font-bold">VERIFIED</span>
            </div>
          )}
        </div>

        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          {vendor.companyName}
          {vendor.verificationLevel === 'GOLD' && <Award size={16} className="text-warning shrink-0" />}
        </h3>

        <p className="text-xs text-slate-500 flex items-center gap-1 mb-3">
          <MapPin size={12} className="text-slate-400" /> {vendor.location}, Sri Lanka
        </p>

        {vendor.description && (
          <p className="text-sm text-slate-600 line-clamp-2 mb-4 italic">"{vendor.description}"</p>
        )}

        <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-1 text-primary font-bold text-sm">
            <Star size={12} fill="currentColor" />
            {vendor.rating?.toFixed(1)}
            <span className="text-[10px] text-slate-400 font-medium">({vendor.reviewCount})</span>
          </div>
          <div className="flex items-center gap-1 text-slate-500 text-xs font-bold">
            <Users size={12} />
            {((vendor.followersCount || 0) / 1000).toFixed(1)}k followers
          </div>
        </div>
      </div>
    </button>
  );
};

export const VendorCard = React.memo(VendorCardComponent);
