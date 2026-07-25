import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users, MessageSquare, Newspaper, Hash,
  TrendingUp, Star, Globe, Flag, Heart
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';
import { SocialPost } from '../types';
import { usePaginated } from '../hooks/usePaginatedCollection';
import { listPosts } from '../lib/api';

function formatDate(createdAt: unknown): string {
  try {
    if (createdAt && typeof (createdAt as any).toDate === 'function') {
      return formatDistanceToNow((createdAt as any).toDate(), { addSuffix: true });
    }
    if (typeof createdAt === 'string') {
      return formatDistanceToNow(new Date(createdAt), { addSuffix: true });
    }
  } catch {
    /* fall through */
  }
  return 'just now';
}

export const CommunityPage = () => {
  const { items: discussions, loading } = usePaginated<SocialPost>(listPosts, 6);

  const groups = [
    { name: 'Sapphire Collectors', members: '12.4k', activity: 'High', color: 'bg-primary' },
    { name: 'Ratnapura Mining Hub', members: '4.2k', activity: 'Medium', color: 'bg-emerald-600' },
    { name: 'Gemology Enthusiasts', members: '8.9k', activity: 'High', color: 'bg-amber-500' },
    { name: 'Wholesale Sri Lanka', members: '2.1k', activity: 'Real-time', color: 'bg-blue-600' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Sidebar - Groups & Stats */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-primary" />
            Trending Groups
          </h2>
          <div className="space-y-4">
            {groups.map((group) => (
              <div key={group.name} className="flex items-center gap-4 group cursor-pointer">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold", group.color)}>
                  {group.name[0]}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{group.name}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{group.members} Members</span>
                    <span className="text-[10px] bg-slate-50 text-slate-400 px-1.5 py-0.5 rounded border border-slate-100">Live</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-all border border-slate-200">
            Explore All Groups
          </button>
        </div>

        <div className="bg-primary p-6 rounded-2xl shadow-lg shadow-primary/20 text-white relative overflow-hidden group">
          <Globe className="absolute -right-4 -bottom-4 opacity-10 rotate-12 group-hover:scale-110 transition-transform" size={120} />
          <h3 className="text-lg font-bold mb-2">Build Your Expert Network</h3>
          <p className="text-sm text-primary-foreground/80 mb-6 leading-relaxed">
            Connect with verified miners and lapidaries directly to get the best industry insights.
          </p>
          <button className="bg-white text-primary font-bold py-2.5 px-6 rounded-xl text-xs hover:bg-slate-50 transition-colors shadow-sm">
            Invite Contacts
          </button>
        </div>
      </div>

      {/* Main Content Area - Discussions & Activity */}
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <MessageSquare size={24} className="text-primary" />
              Community Discussion
            </h2>
          </div>
          
          <div className="divide-y divide-slate-50">
            {loading &&
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-6 animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0" />
                    <div className="flex-1 space-y-3">
                      <div className="h-3 bg-slate-100 rounded w-1/3" />
                      <div className="h-3 bg-slate-100 rounded w-full" />
                      <div className="h-3 bg-slate-100 rounded w-4/5" />
                    </div>
                  </div>
                </div>
              ))}

            {!loading &&
              discussions.map((post) => (
                <Link
                  to="/"
                  key={post.id}
                  className="block p-6 hover:bg-slate-50/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden shrink-0 border-2 border-white shadow-sm">
                      {post.authorAvatar && (
                        <img src={post.authorAvatar} alt="" className="w-full h-full object-cover" loading="lazy" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">{post.authorName}</span>
                        <span className="text-[10px] text-slate-400 font-medium">• {formatDate(post.createdAt)}</span>
                        {post.authorType === 'VENDOR' && (
                          <span className="text-[10px] font-bold text-primary bg-primary/5 px-1.5 py-0.5 rounded uppercase tracking-wider">
                            Dealer
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed mb-4 group-hover:text-slate-900 transition-colors">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-6">
                        <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                          <MessageSquare size={14} /> {post.commentsCount ?? 0} Replies
                        </span>
                        <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                          <Heart size={14} /> {post.likesCount ?? 0} Likes
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}

            {!loading && discussions.length === 0 && (
              <div className="p-12 text-center">
                <MessageSquare className="mx-auto text-slate-300 mb-4" size={40} />
                <p className="text-sm font-bold text-slate-600 mb-1">No discussions yet</p>
                <p className="text-xs text-slate-400 mb-6">Start the conversation — no sign-up needed.</p>
                <Link
                  to="/"
                  className="inline-block bg-primary text-white px-6 py-2.5 rounded-2xl font-bold text-sm shadow-lg shadow-primary/20"
                >
                  Go to Feed
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
