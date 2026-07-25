import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, ShoppingBag, Store, MessageSquare, Trash2, Search, Database,
  BadgeCheck, Loader2, RefreshCw, ShieldCheck,
} from 'lucide-react';
import {
  listUsers, listVendors, listListings, listPosts,
  deleteUser, deleteVendor, deleteListing, deletePost,
} from '../lib/api';
import { UserProfile, VendorProfile, GemListing, SocialPost } from '../types';
import { formatCurrency, cn, getListingTitle } from '../lib/utils';

type Tab = 'accounts' | 'listings' | 'posts';

export const AdminDashboard = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [listings, setListings] = useState<GemListing[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('accounts');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [u, v, l, p] = await Promise.all([
        listUsers(200),
        listVendors(200, 0),
        listListings(200, 0),
        listPosts(200, 0),
      ]);
      setUsers(u);
      setVendors(v);
      setListings(l);
      setPosts(p);
    } catch (err) {
      console.error('Admin load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const vendorIds = useMemo(() => new Set(vendors.map((v) => v.id)), [vendors]);

  const removeAccount = async (u: UserProfile) => {
    if (!confirm(`Delete account "${u.displayName}"? This cannot be undone.`)) return;
    setBusyId(u.uid);
    try {
      await deleteUser(u.uid);
      // A vendor account also has a storefront row keyed by the same uid.
      if (u.role === 'VENDOR' || vendorIds.has(u.uid)) {
        await deleteVendor(u.uid).catch(() => {});
      }
      setUsers((prev) => prev.filter((x) => x.uid !== u.uid));
      setVendors((prev) => prev.filter((x) => x.id !== u.uid));
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Could not delete. Check that the API is reachable.');
    } finally {
      setBusyId(null);
    }
  };

  const removeListing = async (l: GemListing) => {
    if (!confirm(`Delete listing "${getListingTitle(l)}"?`)) return;
    setBusyId(l.id);
    try {
      await deleteListing(l.id);
      setListings((prev) => prev.filter((x) => x.id !== l.id));
    } catch (err) {
      console.error(err);
    } finally {
      setBusyId(null);
    }
  };

  const removePost = async (p: SocialPost) => {
    if (!confirm('Delete this post?')) return;
    setBusyId(p.id);
    try {
      await deletePost(p.id);
      setPosts((prev) => prev.filter((x) => x.id !== p.id));
    } catch (err) {
      console.error(err);
    } finally {
      setBusyId(null);
    }
  };

  const q = search.trim().toLowerCase();
  const filteredUsers = useMemo(
    () => (!q ? users : users.filter((u) => u.displayName?.toLowerCase().includes(q) || u.contactNumber?.includes(q))),
    [users, q]
  );

  const STATS = [
    { label: 'Accounts', value: users.length, icon: Users, tab: 'accounts' as Tab },
    { label: 'Dealers', value: vendors.length, icon: Store, tab: 'accounts' as Tab },
    { label: 'Listings', value: listings.length, icon: ShoppingBag, tab: 'listings' as Tab },
    { label: 'Posts', value: posts.length, icon: MessageSquare, tab: 'posts' as Tab },
  ];

  const TABS: { key: Tab; label: string }[] = [
    { key: 'accounts', label: `Accounts (${users.length})` },
    { key: 'listings', label: `Listings (${listings.length})` },
    { key: 'posts', label: `Posts (${posts.length})` },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-primary" size={24} />
          <h1 className="text-2xl font-bold text-gray-900">Admin Control Panel</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="px-3 py-2 bg-white border border-gray-200 text-gray-600 text-sm font-bold rounded-lg flex items-center gap-2 hover:bg-gray-50"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <Link
            to="/seed"
            className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg shadow-sm flex items-center gap-2 hover:bg-primary/90"
          >
            <Database size={14} /> Reset & Seed
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <button
            key={s.label}
            onClick={() => setTab(s.tab)}
            className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm text-left hover:border-primary/30 transition-colors"
          >
            <div className="p-2 rounded-lg bg-primary/5 w-fit mb-3">
              <s.icon className="text-primary" size={22} />
            </div>
            <p className="text-sm font-medium text-gray-500 mb-1">{s.label}</p>
            <h3 className="text-2xl font-black text-gray-900">{loading ? '—' : s.value}</h3>
          </button>
        ))}
      </div>

      {/* Management panel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'px-4 py-2 text-xs font-bold rounded-lg transition-colors',
                  tab === t.key ? 'bg-white text-primary shadow-sm' : 'text-slate-500'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          {tab === 'accounts' && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search accounts..."
                className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {tab === 'accounts' && filteredUsers.map((u) => (
              <div key={u.uid} className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 shrink-0">
                  {u.photoURL && <img src={u.photoURL} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900 text-sm truncate">{u.displayName}</p>
                    {u.role === 'VENDOR' && (
                      <span className="bg-primary/5 text-primary text-[9px] font-black px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                        <BadgeCheck size={10} /> Dealer
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{u.contactNumber || u.phone || '—'}</p>
                </div>
                {u.role === 'VENDOR' && (
                  <Link to={`/dealers/${u.uid}`} className="text-xs font-bold text-slate-500 hover:text-primary px-3">View</Link>
                )}
                <button
                  onClick={() => removeAccount(u)}
                  disabled={busyId === u.uid}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  {busyId === u.uid ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                </button>
              </div>
            ))}
            {tab === 'accounts' && filteredUsers.length === 0 && <Empty text="No accounts. Use Reset & Seed to populate." />}

            {tab === 'listings' && listings.map((l) => (
              <div key={l.id} className="p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                  {l.images?.[0] && <img src={l.images[0]} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-sm truncate">{getListingTitle(l)}</p>
                  <p className="text-xs text-accent font-bold">{formatCurrency(l.price, l.currency)}</p>
                </div>
                <Link to={`/listings/${l.id}`} className="text-xs font-bold text-slate-500 hover:text-primary px-3">View</Link>
                <button
                  onClick={() => removeListing(l)}
                  disabled={busyId === l.id}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  {busyId === l.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                </button>
              </div>
            ))}
            {tab === 'listings' && listings.length === 0 && <Empty text="No listings." />}

            {tab === 'posts' && posts.map((p) => (
              <div key={p.id} className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 shrink-0">
                  {p.authorAvatar && <img src={p.authorAvatar} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-sm">{p.authorName}</p>
                  <p className="text-xs text-slate-400 truncate">{p.content}</p>
                </div>
                <button
                  onClick={() => removePost(p)}
                  disabled={busyId === p.id}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  {busyId === p.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                </button>
              </div>
            ))}
            {tab === 'posts' && posts.length === 0 && <Empty text="No posts." />}
          </div>
        )}
      </div>
    </div>
  );
};

const Empty = ({ text }: { text: string }) => (
  <div className="py-16 text-center text-sm text-slate-400">{text}</div>
);
