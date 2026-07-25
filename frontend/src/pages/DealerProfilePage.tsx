import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  BadgeCheck, MapPin, Star, Mail, Phone, Globe, MessageCircle, Award,
  Package, Users, Loader2, UserPlus, UserCheck, Grid3x3, FileText, Play, Store,
} from 'lucide-react';
import { getVendor, listingsByVendor, postsByAuthor, followVendor } from '../lib/api';
import { VendorProfile, GemListing, SocialPost } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { startConversation } from '../lib/chat';
import { ListingCard } from '../components/marketplace/ListingCard';
import { PostCard } from '../components/social/PostCard';
import { ReviewsSection } from '../components/vendors/ReviewsSection';
import { cn } from '../lib/utils';

type Tab = 'INVENTORY' | 'POSTS' | 'SHORTS' | 'REVIEWS';

export const DealerProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile, updateProfile } = useAuth();

  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [listings, setListings] = useState<GemListing[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [contentLoading, setContentLoading] = useState(true);

  const [tab, setTab] = useState<Tab>('INVENTORY');
  const [messageLoading, setMessageLoading] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [followerBump, setFollowerBump] = useState(0);

  // Vendor doc
  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    setNotFound(false);
    (async () => {
      try {
        const row = await getVendor(id);
        if (!active) return;
        if (row && row.id) setVendor(row);
        else setNotFound(true);
      } catch (err) {
        console.error('Could not load dealer:', err);
        if (active) setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  // Listings + posts for this dealer
  useEffect(() => {
    if (!vendor) return;
    let active = true;
    setContentLoading(true);
    (async () => {
      try {
        const [listingRows, postRows] = await Promise.all([
          listingsByVendor(vendor.id, 48),
          postsByAuthor(vendor.userId || vendor.id, 24).catch(() => [] as SocialPost[]),
        ]);
        if (!active) return;
        setListings(listingRows);
        setPosts(postRows);
      } catch (err) {
        console.error('Could not load dealer content:', err);
      } finally {
        if (active) setContentLoading(false);
      }
    })();
    return () => { active = false; };
  }, [vendor]);

  const activeListings = useMemo(() => listings.filter((l) => l.status !== 'SOLD'), [listings]);
  const soldListings = useMemo(() => listings.filter((l) => l.status === 'SOLD'), [listings]);
  const shorts = useMemo(() => posts.filter((p) => p.media && p.media.length > 0), [posts]);

  const isFollowing = !!(vendor && userProfile?.following?.includes(vendor.id));

  const handleFollow = async () => {
    if (!vendor) return;
    if (!userProfile) {
      navigate(`/login?next=/dealers/${vendor.id}`);
      return;
    }
    setFollowBusy(true);
    const next = !isFollowing;
    const following = next
      ? [...(userProfile.following || []), vendor.id]
      : (userProfile.following || []).filter((v) => v !== vendor.id);
    // Optimistic follower count.
    setFollowerBump((b) => b + (next ? 1 : -1));
    try {
      // The server updates both the user's following list and the vendor's counter.
      await followVendor(userProfile.uid, vendor.id, next);
      await updateProfile({ following });
    } catch (err) {
      console.error('Could not update follow:', err);
      setFollowerBump((b) => b - (next ? 1 : -1));
    } finally {
      setFollowBusy(false);
    }
  };

  const handleMessage = async () => {
    if (!vendor) return;
    if (!userProfile) {
      navigate(`/login?next=/dealers/${vendor.id}`);
      return;
    }
    setMessageLoading(true);
    try {
      const convId = await startConversation(userProfile, {
        uid: vendor.userId || vendor.id,
        displayName: vendor.companyName,
        photoURL: vendor.logo,
      });
      navigate(`/messages?c=${convId}`);
    } catch (err) {
      console.error('Could not start conversation:', err);
    } finally {
      setMessageLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto animate-pulse">
        <div className="h-48 bg-slate-100 rounded-3xl" />
        <div className="flex flex-col items-center -mt-16">
          <div className="w-32 h-32 rounded-3xl bg-slate-200 border-4 border-white" />
          <div className="h-6 w-48 bg-slate-100 rounded mt-4" />
          <div className="h-4 w-32 bg-slate-100 rounded mt-2" />
        </div>
      </div>
    );
  }

  if (notFound || !vendor) {
    return (
      <div className="py-24 text-center">
        <Store className="mx-auto text-slate-300 mb-4" size={48} />
        <h1 className="text-xl font-black text-slate-900 mb-2">Dealer not found</h1>
        <p className="text-sm text-slate-500 mb-6">This dealer profile may have been removed.</p>
        <Link to="/vendors" className="inline-block bg-primary text-white px-6 py-3 rounded-2xl font-bold text-sm">
          Browse Dealers
        </Link>
      </div>
    );
  }

  const followers = Math.max(0, (vendor.followersCount || 0) + followerBump);

  const TABS: { key: Tab; label: string; icon: any; count?: number }[] = [
    { key: 'INVENTORY', label: 'Inventory', icon: Grid3x3, count: listings.length },
    { key: 'POSTS', label: 'Posts', icon: FileText, count: posts.length },
    { key: 'SHORTS', label: 'Shorts', icon: Play, count: shorts.length },
    { key: 'REVIEWS', label: 'Reviews', icon: Star, count: vendor.reviewCount },
  ];

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Cover */}
      <div className="h-40 md:h-56 rounded-3xl overflow-hidden relative bg-slate-900">
        {vendor.coverImage && (
          <img src={vendor.coverImage} className="w-full h-full object-cover opacity-70" alt="" loading="lazy" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      {/* Identity — centered, 2x logo. relative z-10 keeps the logo painting
          above the (positioned) cover it overlaps via the negative margin. */}
      <div className="relative z-10 flex flex-col items-center text-center -mt-16 px-4">
        <div className="w-32 h-32 rounded-3xl border-4 border-white bg-white shadow-xl overflow-hidden">
          <img src={vendor.logo} className="w-full h-full object-cover" alt={vendor.companyName} />
        </div>

        <div className="flex items-center gap-2 mt-4">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900">{vendor.companyName}</h1>
          {!!vendor.verified && <BadgeCheck size={22} className="text-primary shrink-0" />}
          {vendor.verificationLevel === 'GOLD' && <Award size={20} className="text-warning shrink-0" />}
        </div>

        <p className="text-sm text-slate-500 flex items-center justify-center gap-1 mt-1">
          <MapPin size={14} className="text-slate-400" /> {vendor.location}, Sri Lanka
        </p>

        {vendor.description && (
          <p className="text-sm text-slate-600 italic max-w-lg mt-3">"{vendor.description}"</p>
        )}

        {/* Stats */}
        <div className="flex items-center justify-center gap-6 md:gap-10 mt-5">
          <Stat icon={Star} value={vendor.rating ? vendor.rating.toFixed(1) : '—'} label="Rating" />
          <Stat icon={Package} value={listings.length} label="Listings" />
          <Stat icon={Users} value={followers >= 1000 ? `${(followers / 1000).toFixed(1)}k` : followers} label="Followers" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-6 w-full max-w-sm">
          <button
            onClick={handleFollow}
            disabled={followBusy}
            className={cn(
              'flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60',
              isFollowing
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            )}
          >
            {followBusy ? <Loader2 size={16} className="animate-spin" /> : isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}
            {isFollowing ? 'Following' : 'Follow'}
          </button>
          <button
            onClick={handleMessage}
            disabled={messageLoading}
            className="flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 bg-primary text-white hover:bg-primary/90 transition-all disabled:opacity-60 shadow-lg shadow-primary/20"
          >
            {messageLoading ? <Loader2 size={16} className="animate-spin" /> : <MessageCircle size={16} />}
            Message
          </button>
        </div>

        {/* Contact */}
        {(vendor.contactEmail || vendor.phone || vendor.website) && (
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-6 text-sm text-slate-500">
            {vendor.contactEmail && (
              <a href={`mailto:${vendor.contactEmail}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
                <Mail size={14} /> {vendor.contactEmail}
              </a>
            )}
            {vendor.phone && (
              <a href={`tel:${vendor.phone}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
                <Phone size={14} /> {vendor.phone}
              </a>
            )}
            {vendor.website && (
              <a href={vendor.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                <Globe size={14} /> Website
              </a>
            )}
          </div>
        )}
      </div>

      {/* Tabs — the scroll container (main) has p-4/md:p-6, so a plain `top-0`
          would pin the bar that far below the header and leave content visibly
          scrolling through the gap. The negative top cancels that padding, and
          the negative margins make the bar full-bleed so nothing peeks past its
          edges while stuck. */}
      <div className="mt-8 mb-6 border-b border-slate-100 flex items-center justify-center gap-1 sticky -top-4 md:-top-6 -mx-4 md:-mx-6 px-4 md:px-6 pt-4 md:pt-6 bg-background z-20">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'px-4 md:px-6 py-3 text-xs md:text-sm font-bold flex items-center gap-2 border-b-2 -mb-px transition-colors',
              tab === t.key ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-700'
            )}
          >
            <t.icon size={16} />
            <span className="hidden sm:inline">{t.label}</span>
            {typeof t.count === 'number' && <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-full">{t.count}</span>}
          </button>
        ))}
      </div>

      <div>
        {tab === 'INVENTORY' && (
          <InventoryTab
            loading={contentLoading}
            active={activeListings}
            sold={soldListings}
          />
        )}

        {tab === 'POSTS' && (
          <PostsTab loading={contentLoading} posts={posts} />
        )}

        {tab === 'SHORTS' && (
          <ShortsTab loading={contentLoading} shorts={shorts} />
        )}

        {tab === 'REVIEWS' && <ReviewsSection vendorId={vendor.id} />}
      </div>
    </div>
  );
};

const Stat = ({ icon: Icon, value, label }: { icon: any; value: React.ReactNode; label: string }) => (
  <div className="flex flex-col items-center">
    <div className="flex items-center gap-1 text-slate-900 font-black">
      <Icon size={14} className="text-primary" />
      {value}
    </div>
    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{label}</span>
  </div>
);

const CardGridSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {Array.from({ length: 2 }).map((_, i) => (
      <div key={i} className="bg-white rounded-3xl border border-slate-100 overflow-hidden animate-pulse">
        <div className="h-16 bg-slate-50" />
        <div className="aspect-square bg-slate-100" />
      </div>
    ))}
  </div>
);

const EmptyState = ({ icon: Icon, text }: { icon: any; text: string }) => (
  <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
    <Icon className="mx-auto text-slate-300 mb-3" size={40} />
    <p className="text-sm text-slate-400">{text}</p>
  </div>
);

const InventoryTab = ({ loading, active, sold }: { loading: boolean; active: GemListing[]; sold: GemListing[] }) => {
  if (loading) return <CardGridSkeleton />;
  if (active.length === 0 && sold.length === 0) return <EmptyState icon={Package} text="No listings from this dealer yet." />;
  return (
    <div className="space-y-8">
      {active.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {active.map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
      )}
      {sold.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Sold</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sold.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        </div>
      )}
    </div>
  );
};

const PostsTab = ({ loading, posts }: { loading: boolean; posts: SocialPost[] }) => {
  if (loading) return <CardGridSkeleton />;
  if (posts.length === 0) return <EmptyState icon={FileText} text="This dealer hasn't posted yet." />;
  return <div>{posts.map((p) => <PostCard key={p.id} post={p} />)}</div>;
};

const ShortsTab = ({ loading, shorts }: { loading: boolean; shorts: SocialPost[] }) => {
  if (loading) return <CardGridSkeleton />;
  if (shorts.length === 0) return <EmptyState icon={Play} text="No shorts published yet." />;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {shorts.map((p) => (
        <div key={p.id} className="aspect-[9/16] rounded-2xl overflow-hidden bg-slate-900 relative group">
          <img src={p.media![0]} alt="" className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <p className="absolute bottom-2 left-2 right-2 text-white text-[10px] font-medium line-clamp-2">{p.content}</p>
        </div>
      ))}
    </div>
  );
};
